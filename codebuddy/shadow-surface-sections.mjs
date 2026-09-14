/**
 * Shadow the two deployment-global system-prompt sections this preset does not
 * want, for THIS preset's agents only.
 *
 * Which two, and why they are not rows:
 *   - `harness:source`   — registered by `dsh-app-boot`'s
 *     `addHarnessSourceSection()`, naming where the harness checkout lives.
 *   - `app:web-surface`  — registered by `dsh-web-app`'s `apply()`, the Web GUI
 *     orientation paragraph (it carries the live `dsh web` URL).
 *
 * Both are registered inside `dsh-web-app`'s `ctx.inject(['systemPrompt'], …)`
 * callback, so neither exists as a row an overlay could disable. They are also
 * registered WITHOUT a scope, which makes them process-global: every session on
 * every preset receives them.
 *
 * How the shadow works. `dsh-system-prompt` merges section tables per scope:
 * the global layer is seeded first, then each layer of the viewing scope's chain
 * overwrites by name (`dsh-scope`'s `merge()` — "nearest scope's entry wins a
 * name"). `renderPrompt()` in turn drops every section whose rendered text is
 * empty. Registering a same-named section with empty text from inside a preset
 * therefore removes the global one for that preset's agents and nothing else.
 * This is the same mechanism `dsh-persona` uses to shadow
 * `deployment:persona-prefix`; those slots are just blessed with public
 * constants, while these two names are literals safe to repeat here.
 *
 * Why this file is dependency-free. A preset row naming `./<file>.mjs` is
 * classified `kind: "preset"` and resolves against the preset's own directory
 * (a preset's own files travel with it), but this preset is installed under
 * `$DSH_HOME/.agent-presets/`, whose upward `node_modules` walk never reaches
 * the harness's `@deepseek-ai/*` packages. Any bare import here would fail at
 * mount. So: no imports, and the section order is inlined rather than read
 * through `getSectionOrder()`.
 *
 * `order` is deliberately 0 for both. A scoped section REPLACES the global entry
 * under the same name, so the value only has to be finite (a non-finite order
 * throws); the global section's real placement (10000 / 10100) is discarded
 * along with its text. Order 0 is arbitrary and carries no meaning beyond being
 * a valid number.
 *
 * Scope: agent-local by construction. `apply()` runs with the preset's own
 * context, so the registrations land in this preset's scope layer — presets
 * mounted in the same process keep their own view of the prompt. Nothing here
 * touches the process-global layer, and disabling/removing this row restores
 * both sections exactly.
 *
 * Cost: two extra sections that render to zero characters. No tools, no services,
 * no runtime context, no state.
 *
 * @module shadow-surface-sections
 */

/** Cordis plugin name used by loader diagnostics. */
const name = 'shadow-surface-sections';

/** The prompt registry this row contributes to. */
const inject = ['systemPrompt'];

/**
 * Global section names to shadow with empty text.
 *
 * A literal list rather than a Config field on purpose: this file is a preset
 * fixture, not a reusable package, and the two names are the entire point.
 * Add a name here to shadow a third section; the value must match the name its
 * owner registered, or the global section survives untouched.
 */
const SHADOWED_SECTIONS = ['harness:source', 'app:web-surface'];

/**
 * Register one empty, same-named section per shadowed name.
 *
 * Each registration is effect-owned, so disposing this row (or the agent that
 * mounted the preset) removes the shadow and the global section reappears on the
 * next assembly — no unregistration call is needed.
 *
 * @param ctx - the preset's agent scope context.
 */
function apply(ctx) {
  for (const sectionName of SHADOWED_SECTIONS) {
    ctx.systemPrompt.section({
      name: sectionName,
      order: 0,
      text: '',
    });
  }
}

export { apply, inject, name };
