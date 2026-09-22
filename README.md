# dsh-presets

DeepSeek Harness (DSH) 的自用 Agent 预设（agent presets）集合。

> **v2 迁移说明（重要）**：DSH 已经不再读取 `.agent-presets/<id>/` 这种「一个目录 + `preset.yml` + `agent.cordis.yml`」的旧格式预设。
> 现在一个预设是**一条 `@deepseek-ai/dsh-agent-preset` 声明行**，由**一个 bundle 的 patch 文件**携带，通过 `plugin_manager` 安装。
> 旧目录格式现在不会被任何代码读取，所以升级后旧预设会**静默消失**。本仓库已迁移到新格式。

## 包含的预设

| 目录 | 预设名 | 说明 |
| --- | --- | --- |
| [`codebuddy-preset/`](codebuddy-preset/) | CodeBuddy 模式 | 以 CodeBuddy 的系统提示词作为人格、面向「平时改改代码」裁剪过的单智能体编码预设。保留文件读写、检索、Shell、后台任务、Skills、任务清单、交互与交付；**已禁用**：`tool-web`（web_fetch / web_search）、目标模式（`command-goal` / `tool-goal`）、计划模式（`planning` 组）、以及整个 delegation 组（`subagent` / `subagent_fork` / `send_message` / `interrupt_agent` / `list_agents` / `workflow` / `ralph`）。基于官方 `standard` 预设改写。另含一道**难度门禁**（见下）。 |

## 结构

```
.
├── README.md
└── codebuddy-preset/                 # ← 一个 bundle，就是一个预设
    ├── package.json                  # 声明 dsh.bundle.patch 指向下面的 patch
    ├── cordis.patch.yml              # 预设声明：id / name / description / order / plugins
    ├── shadow-surface-sections.mjs   # 遮蔽两个宿主全局提示词段落（见下）
    └── difficulty-policy.mjs         # 难度门禁：评分、动态阈值、/difficulty 命令（见下）
```

一个 bundle 只需要 `package.json` 里的一段声明，告诉 DSH 用哪个文件作为 patch：

```json
{
  "name": "@local/dsh-codebuddy-preset",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

而 `cordis.patch.yml` 就是一条 `insert`：

```yaml
- insert:
    - id: preset-codebuddy            # Loader 行 id，约定为 preset-<preset id>
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: codebuddy                 # 预设身份，会话按它记住所用预设
        name: CodeBuddy 模式           # 选择器里的显示名
        order: 3                      # 名单排序
        plugins: [...]                # 子插件行列表（工具、人格、段落……）
```

## 安装

**不要**再用复制目录到 `$DSH_HOME/.agent-presets/` 的方式——那样装出来的预设不会被读取。

安装本仓库的预设，用 DSH 自带的 `plugin_manager`，`target` 指向 bundle 目录的**绝对路径**：

```powershell
# 在 DSH 会话里让 agent 执行，或通过 Web 的插件管理界面安装：
plugin_manager(action: "install_bundle", target: "F:\AgentWork\dsh-presets\codebuddy-preset")
```

它自己会完成依赖安装与 bundle 启用，**不需要**手工跑 `pnpm`。

安装后**刷新页面**，在新建会话的选择器中即可看到该预设（显示名来自 `config.name`，如「CodeBuddy 模式」），也可以把它设为默认预设。

## 验证

```powershell
plugin_manager(action: "list_bundles")     # 应出现 @local/dsh-codebuddy-preset
plugin_manager(action: "list_plugins")     # 应出现 preset-codebuddy 行
```

`preset-codebuddy` 行会随其所在 bundle 一起自动出现。判断它是否**真正可用**，看它的 fiber 阶段是否为 `active`：

- 挂载失败的行会**留在名单上**并附带失败原因（不会静默消失），照原因修好后重新安装即可。
- 已存在的会话与其子代理保留它们启动时的那份插件版本；改动后请在**新会话**里验证。

## 使用

- 会话创建时选定 preset；只有空会话可以切换 preset。
- 加入同一 preset 的会话共享一份已装载的组装，子代理（subagent）继承父方的组装（在本预设里 delegation 组是关掉的，所以不会有子代理）。
- 组装的加载错误不会被隐藏：无法加载的 preset 会在选择器中连同原因一并列出，方便定位修复或删除。

## 自定义

- 直接编辑 `codebuddy-preset/cordis.patch.yml` 即可调整该预设的工具与提示词，每个行都有注释说明其作用与所在 realm 的取舍理由。改完**重新安装一次该 bundle**（`install_bundle` 可重复执行）并刷新页面。
- 若要恢复 `web_fetch` / `web_search`，把 `tool-web` 那一行的 `disabled: true` 去掉（或整行删除）。Host 的 `web` 服务与搜索提供方在宿主平面，预设只需开放模型侧工具。
- 若要恢复 delegation 组（`subagent` / `subagent_fork` / `workflow` / `ralph` 等），去掉 `delegation` 组那一行的 `disabled: true` 即可；组内两个可选 provider 行（codex / claude-code）仍各自保持禁用。
- **新增预设**：复制 `codebuddy-preset/` 目录，改 `package.json` 里的 `name`，改 patch 里的 `id` / `config.id` / `config.name`（`config.id` 必须唯一，重复会导致声明加载失败）。

> 自行编写的预设被视为**受信任配置**：它会授予所选插件的全部能力，且安装 bundle 会在 Host 进程里执行插件代码。请只在可信机器上使用。

## 难度门禁

`codebuddy` 带一道**难度门禁**：模型在动手改文件前先把任务难度评为 **0–10 分**（通过 `report_task_difficulty` 工具，附一句可核对理由），并与阈值比较。

- **分数 ≥ 阈值**：照常工作，该跑测试、该构建就照做。
- **分数 < 阈值**：实现完**直接交付**——不跑测试套件、不写测试文件、不做额外验证、也不反问要不要验证，并在最终回复中说明「因低于阈值跳过了验证」以及分数与阈值。

这样平时的小改动不用再等一轮测试。评分锚点（提示词里给模型的标准，也是理由该对照的标尺）：

| 分数 | 适用场景 |
| --- | --- |
| 0–2 | 改一行、错别字、单个显而易见的值 |
| 3–4 | 单文件内的小范围改动、有边界的 bug 修复、配置微调 |
| 5–6 | 跨若干文件的改动，或边界清晰的小功能 |
| 7–8 | 跨模块改动、涉及多处调用点的重构、新子系统 |
| 9–10 | 迁移、并发、协议或数据格式变更、安全敏感、或难以撤销的工作 |

阈值默认 **4**，**每个会话各自一份**，可以随时在会话内改：

```
/difficulty          # 查看本会话的阈值与本次任务的评分
/difficulty 7        # 把本会话的阈值改为 7
/difficulty reset    # 把本会话恢复为默认值
```

`/difficulty` 只接受 **0–10 的整数**（不四舍五入，`7.5` 直接报错）或 `reset`；省略参数即查看当前状态。改动**只影响当前会话**，不写磁盘、不会串到其它会话、会话结束后即消失；新会话一律从 patch 里那一行的 `config.threshold` 开始：

```yaml
- id: difficulty-policy
  name: './difficulty-policy.mjs'
  config:
    threshold: 4
```

`config.threshold` 缺失或不是 0–10 的数值时，回退到内置默认值 **4**。没有命令界面的部署（headless / ACP）里不注册 `/difficulty`，但门禁的提示词与 `report_task_difficulty` 工具照常生效。

> 注意：分数由模型自评。门禁会要求它给出理由，且提示词明确「存疑时往上打分」，但模型仍可能低估难度——低分意味着这次交付**未经任何验证**，风险由你承担。想关掉整道门禁，删掉 `difficulty-policy` 那一行即可。
>
> 预设是「每个会话加入同一份组装」，所以阈值与评分都按会话（agent）分别存储，并在会话结束时回收；这也是它**不落盘**的原因——没有一份全局配置可以被别的会话或下次启动读到。

## 两个自带插件

两个 `.mjs` 都是预设自带的微型插件，都**不发布任何服务**，因此无需 `isolate` realm。行里的 `./xxx.mjs` 是相对路径，**相对 patch 文件所在目录**解析，所以这两个文件会跟着 bundle 一起走。

两个文件都刻意保持**零依赖**（连 `node:*` 都不用）：bundle 从 profile 里加载，向上找 `node_modules` 到不了 `@deepseek-ai/*`。

`shadow-surface-sections.mjs` 的作用是**对本预设的 agent 屏蔽两个全局提示词段落**：

- `harness:source` —— 由 `dsh-app-boot` 注册，说明 DSH 自身安装目录在哪
- `app:web-surface` —— 由 `dsh-web-app` 注册，Web GUI 的方位说明（含当前 `dsh web` 地址）

这两段**不是可禁用的行**，而是在 `dsh-web-app` 的 `apply()` 内部无条件注册的，且注册时没有作用域，因此是进程级全局、每个预设都会带上。屏蔽原理：提示词注册表按作用域链合并段落，同名时**最近的作用域覆盖全局**，而渲染时**空文本段落被丢弃**——所以从预设作用域注册同名空段落即可移除，且只影响本预设。这与 `dsh-persona` 遮蔽 `deployment:persona-prefix` 是同一机制。删掉那一行即可恢复两段。

`difficulty-policy.mjs` 的实现要点：

- **零 import**（连 `node:*` 都不用）。阈值来自该行的 `config.threshold`——Cordis 在插件**未导出 `Config` schema** 时原样透传 config，这正是零依赖文件也能接受配置、且不必自己读写文件的原因。
- 工具用**纯对象**注册（`ctx.tools.register({...})`），因为 `defineTool()` 需要 import `@deepseek-ai/dsh-tools`。
- 策略正文走 `systemPrompt.section()`（固定文本，保住 KV 前缀），阈值与评分走 `systemPrompt.context()`（每步重新求值、按会话取值，且作为 user message 追加，不会击穿前缀）。
- **所有状态按会话（agent）分别存储**：预设只挂载一次，模块级变量会被所有会话共享，所以每次读取都以当前 agent 为键。`/difficulty` 只改调用它的那个会话。记录在 `agent/disposed` 时回收——它不会每个会话留一条永不释放的条目。
- `commands` 走 `ctx.get('commands')` 可选解析而非 `inject`：没有命令界面的部署（headless / ACP）里，这道门禁的提示词与工具照常生效，只是没有 `/difficulty`。

## 与官方 `standard` 预设的差异

本预设的插件列表是照 `@deepseek-ai/dsh-web-app` 0.1.7-alpha.1 的 `presets/standard.patch.yml` 重写的，差异只有：

1. `persona` 换成 CodeBuddy 的提示词；
2. 增加 `shadow-surface-sections`（本预设专属）；
3. 增加 `difficulty-policy`（本预设专属）；
4. 禁用 `tool-web`、`command-goal`、`tool-goal`、`planning`、`delegation`。

重写时同时修正了旧文件里两处**已随版本改名、旧文件没跟上**的包名（它们都在被禁用的 `delegation` 组内，所以不影响本预设行为，但一旦有人重新启用该组就会炸）：

- `workflow-ptc`（旧名 `@deepseek-ai/dsh-workflow-worker-thread`，该包已不存在）
- `present`（旧文件写的是 `@deepseek-ai/dsh-tool-present`；现在该行的 id 就是 `present`，行上不再带包名）

## 相关

- [DSH Agent 预设文档（dsh-agent-presets）](https://github.com/deepseek-ai/dsh) —— 预设的声明、发现与按会话组装机制。
