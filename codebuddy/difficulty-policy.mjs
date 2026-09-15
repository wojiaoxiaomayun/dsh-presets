// Difficulty gate: score the task, and skip verification below the threshold.
//
// A preset-relative row (`./difficulty-policy.mjs`) resolves against this
// preset's own directory, so this file travels with the preset. It imports
// NOTHING: the installed preset lives under `$DSH_HOME/.agent-presets/`, where
// the upward `node_modules` walk never reaches `@deepseek-ai/*`, so even a
// `node:*` import is better avoided when the plugin does not need one. The
// threshold arrives as this row's `config:` instead — Cordis passes a plugin's
// raw config through unchanged when it exports no `Config` schema — and the
// tool is registered as a plain object rather than through `defineTool()`,
// which would need `@deepseek-ai/dsh-tools`.
//
// It PUBLISHES no service — it only consumes `systemPrompt`, `tools`, and
// (optionally) `commands` — so it needs no `isolate` realm and sits loose like
// any other consumer row.
//
// EVERY piece of runtime state is per-session. The preset mounts ONCE under a
// standing scope that every session naming it joins, so a module-level value
// would be shared by all of them; each registration below therefore keys its
// reads on the agent that owns the step (`context.agent`, `command.agent`,
// `exec.agent` — the same SessionId-keyed agent in all three). `/difficulty`
// sets the threshold for the session that runs it and nothing else, and the
// composition's `config.threshold` is the default every new session starts
// from. Nothing is written to disk, so no setting can leak between sessions.
//
// The policy TEXT is a fixed section, so the prompt prefix stays cacheable;
// only the session's threshold and score ride the dynamic context, which is
// appended as a user message and therefore never invalidates that prefix.

const name = 'difficulty-policy';

// `commands` is deliberately NOT injected: the gate's value (the policy section
// and the scoring tool) does not depend on it, and a deployment with no command
// surface (headless, ACP) supplies no such service. Making it a hard dependency
// would park this whole row in "waiting for commands" and silently drop the
// policy there. The slash command is registered only when the service resolves.
const inject = ['systemPrompt', 'tools'];

/** Threshold used when the row's `config.threshold` is absent or unusable. */
const FALLBACK_THRESHOLD = 4;
const MIN_SCORE = 0;
const MAX_SCORE = 10;

const POLICY_SECTION = 'difficulty:policy';
const CONTEXT_SECTION = 'difficulty:status';
const POLICY_ORDER = 450;
const CONTEXT_ORDER = 130;

const TOOL_NAME = 'report_task_difficulty';
const COMMAND_NAME = 'difficulty';

const POLICY_TEXT = `<task_difficulty_gate>
Before you start work that changes files or state, score its difficulty from 0 to 10 and report that score by calling \`${TOOL_NAME}\`. Score once per task, before the first edit or state-changing command. Score again only if the user materially changes the task. Answering a question, or reading code to explain it, needs no score.

Scale anchors:
- 0-2: a one-line edit, a typo, a single obvious value.
- 3-4: a small localized change in one file, a contained bug fix, a config tweak.
- 5-6: a change across several files, or a small feature with clear boundaries.
- 7-8: a multi-module change, a refactor with cross-cutting call sites, a new subsystem.
- 9-10: migrations, concurrency, protocol or data-format changes, security-sensitive work, or anything expensive to undo.

The current threshold appears in the runtime context. Compare your score against it:
- score >= threshold: work normally, and verify the change as you ordinarily would, including the relevant tests and build.
- score < threshold: implement the change, then deliver it directly. Do NOT run the test suite, do NOT write or modify test files, do NOT run extra verification or check commands, and do NOT ask the user whether to verify. The change is delivered exactly as written. Say plainly in your final message that verification was skipped because the task scored below the threshold, and name both the score and the threshold.

Give a one-sentence reason a reviewer could check against the anchors above. Do not lower a score to avoid verification: when in doubt, score above the threshold. The threshold is the user's standing instruction, not a suggestion.
</task_difficulty_gate>`;

/**
 * Per-session state, keyed by agent id (the SessionId).
 *
 * `threshold` is this session's live value — the composition default until
 * `/difficulty` changes it. `score`/`reason` describe the task in flight.
 */
const sessions = new Map();

/** Coerce one candidate threshold to a whole score in range, or undefined. */
function clampThreshold(value) {
  if (typeof value === 'boolean' || value === null || value === '') return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(numeric)));
}

/** The session record for one agent, created with the default on first use. */
function sessionOf(agent, defaultThreshold) {
  const agentId = agent?.id;
  if (agentId === undefined) return undefined;
  const existing = sessions.get(agentId);
  if (existing !== undefined) return existing;
  const created = { threshold: defaultThreshold, overridden: false, score: undefined, reason: undefined };
  sessions.set(agentId, created);
  return created;
}

/** The threshold governing one agent's next step. */
function thresholdFor(agent, defaultThreshold) {
  return sessionOf(agent, defaultThreshold)?.threshold ?? defaultThreshold;
}

/** The dynamic status line: this session's threshold plus its recorded score. */
function renderStatusText(agent, defaultThreshold) {
  const threshold = thresholdFor(agent, defaultThreshold);
  const record = sessionOf(agent, defaultThreshold);
  const origin = record?.overridden === true ? 'set in this session' : 'this session\'s default';
  const body =
    record?.score === undefined
      ? `No score has been reported for the task in flight — score it with \`${TOOL_NAME}\` before changing files or state.`
      : `This task scored ${record.score}/10 (${
          record.score < threshold
            ? 'below the threshold, so the change is delivered WITHOUT running tests or any verification step'
            : 'at or above the threshold, so normal verification applies'
        }). Stated reason: ${record.reason}`;
  return `Task difficulty gate: threshold ${threshold}/10 (${origin}). ${body}`;
}

function apply(ctx, config) {
  const logger = ctx.logger(name);
  const defaultThreshold = clampThreshold(config?.threshold) ?? FALLBACK_THRESHOLD;
  logger.info(`session default threshold ${defaultThreshold}/10`);

  // Fixed policy text: constant content keeps the prompt prefix cacheable.
  ctx.effect(
    () =>
      ctx.systemPrompt.section({
        name: POLICY_SECTION,
        order: POLICY_ORDER,
        text: POLICY_TEXT,
      }),
    'difficultyPolicy.section()',
  );

  // Dynamic status: re-evaluated for every assembly and keyed on the
  // assembling agent, so each session reads its own threshold and score.
  ctx.effect(
    () =>
      ctx.systemPrompt.context({
        name: CONTEXT_SECTION,
        order: CONTEXT_ORDER,
        text: (assembly) => renderStatusText(assembly?.agent, defaultThreshold),
      }),
    'difficultyPolicy.context()',
  );

  // A session's state has no reader once its agent is gone; the standing mount
  // is an ancestor of every session scope, so this listener sees each disposal
  // and the map cannot grow one entry per session ever seen.
  ctx.on('agent/disposed', ({ agent }) => {
    if (agent?.id !== undefined) sessions.delete(agent.id);
  });

  ctx.effect(
    () =>
      ctx.tools.register({
        name: TOOL_NAME,
        description:
          "Report this task's difficulty from 0 to 10 before changing files or state, with a one-sentence reason. The user sets a threshold; scoring below it means the change is delivered without running tests or any verification step.",
        parameters: {
          type: 'object',
          properties: {
            score: {
              type: 'integer',
              description:
                'Task difficulty from 0 (trivial) to 10 (migration, concurrency, security-sensitive).',
            },
            reason: {
              type: 'string',
              description: 'One sentence justifying the score against the published anchors.',
            },
          },
          required: ['score', 'reason'],
          additionalProperties: false,
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              score: { type: 'integer' },
              threshold: { type: 'integer' },
              mode: { type: 'string', enum: ['verify', 'skip-verification'] },
            },
            required: ['score', 'threshold', 'mode'],
            additionalProperties: false,
          },
          render(_args, value) {
            const tail =
              value.mode === 'skip-verification'
                ? 'Scored below the threshold: deliver the change without running tests or any verification step, and say so in the final message.'
                : 'Scored at or above the threshold: verify the change normally.';
            return [
              {
                type: 'text',
                text: `Difficulty ${value.score}/10 against threshold ${value.threshold}/10. ${tail}`,
              },
            ];
          },
        },
        async execute(args, exec) {
          const score = args?.score;
          if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
            throw new TypeError(
              `score must be an integer from ${MIN_SCORE} to ${MAX_SCORE}, got ${JSON.stringify(score)}`,
            );
          }
          const reason = typeof args?.reason === 'string' ? args.reason.trim() : '';
          if (reason.length === 0) throw new TypeError('reason must be a non-empty sentence');

          const record = sessionOf(exec?.agent, defaultThreshold);
          const threshold = record?.threshold ?? defaultThreshold;
          if (record !== undefined) {
            record.score = score;
            record.reason = reason;
          }

          return { score, threshold, mode: score < threshold ? 'skip-verification' : 'verify' };
        },
      }),
    'difficultyPolicy.tool()',
  );

  // Optional: without a command surface the gate still works, so an absent
  // service skips this row's convenience entry instead of failing the mount.
  const commands = ctx.get('commands');
  if (commands === undefined) {
    logger.info('no command surface in this deployment; the threshold stays at this row\'s config');
    return;
  }

  ctx.effect(
    () =>
      commands.register({
        name: COMMAND_NAME,
        // User-facing strings below are Chinese: the client renders a custom
        // command's `description` and `input.hint` verbatim (only the
        // first-party commands carry a built-in locale mapping), so whatever
        // is written here is what the slash menu shows.
        description: `查看或设置【本会话】的难度阈值（0-${MAX_SCORE}）；低于阈值的任务直接交付、不跑测试`,
        input: { hint: `[0-${MAX_SCORE} 或 reset]` },
        // The threshold lives in this plugin's per-session state, not a log event.
        recordInput: false,
        handler({ agent, rawInput }) {
          const argument = typeof rawInput === 'string' ? rawInput.trim() : '';
          const record = sessionOf(agent, defaultThreshold);
          const threshold = record?.threshold ?? defaultThreshold;

          if (argument.length === 0) {
            const origin = record?.overridden === true ? '本会话已设置' : '本会话默认值';
            const status =
              record?.score === undefined
                ? '本次任务尚未评分'
                : `本次任务评为 ${record.score}/10（${
                    record.score < threshold ? '跳过验证' : '照常验证'
                  }）`;
            return {
              kind: 'success',
              text: `本会话难度阈值：${threshold}/10（${origin}）。状态：${status}。用 \`/${COMMAND_NAME} <0-${MAX_SCORE}>\` 修改，或用 \`/${COMMAND_NAME} reset\` 恢复默认值。不影响其它会话。`,
            };
          }

          if (argument === 'reset') {
            if (record !== undefined) {
              record.threshold = defaultThreshold;
              record.overridden = false;
            }
            return {
              kind: 'success',
              text: `本会话难度阈值已恢复为默认值 ${defaultThreshold}/10。`,
            };
          }

          // Require a whole number rather than silently rounding, so a typo
          // like `4.5` is reported instead of becoming a threshold nobody chose.
          if (!/^\d+$/.test(argument)) {
            return {
              kind: 'error',
              text: `需要 ${MIN_SCORE} 到 ${MAX_SCORE} 的整数，或 "reset"；收到的是 ${JSON.stringify(argument)}。`,
            };
          }
          const requested = clampThreshold(argument);
          if (requested === undefined || String(requested) !== argument) {
            return {
              kind: 'error',
              text: `需要 ${MIN_SCORE} 到 ${MAX_SCORE} 的整数，或 "reset"；收到的是 ${JSON.stringify(argument)}。`,
            };
          }
          if (record !== undefined) {
            record.threshold = requested;
            record.overridden = requested !== defaultThreshold;
          }
          return {
            kind: 'success',
            text: `本会话难度阈值已设为 ${requested}/10。低于 ${requested} 分的任务将直接交付、不跑测试与验证。不影响其它会话。`,
          };
        },
      }),
    'difficultyPolicy.command()',
  );
}

export { apply, inject, name };
