# dsh-presets

DeepSeek Harness (DSH) 的自用 Agent 预设（agent presets）集合。

一个 preset 是一个目录，内含一个 `agent.cordis.yml`（智能体组装文件，声明该会话可用的工具、提示词段落与 Skills），可选配 `preset.yml`（展示元数据：名称与描述）。每个会话在创建时按所选 preset 组装自己的智能体，不同 preset 的会话可以运行在同一进程内且状态互相隔离。

## 包含的预设

| 目录 | 预设名 | 说明 |
| --- | --- | --- |
| [`codebuddy/`](codebuddy/) | CodeBuddy 模式 | 以 CodeBuddy 的系统提示词作为人格、面向「平时改改代码」裁剪过的单智能体编码预设。保留文件读写、检索、Shell、后台任务、Skills、任务清单、交互与交付；**已禁用**：`tool-web`（web_fetch / web_search）、目标模式（`command-goal` / `tool-goal`）、计划模式（`planning` 组）、以及整个 delegation 组（`subagent` / `subagent_fork` / `send_message` / `interrupt_agent` / `list_agents` / `workflow` / `ralph`）。基于官方 `standard` 预设复制，但已非「仅改 persona」；每个禁用行都带原因注释，删掉该行的 `disabled` 即可恢复。另含一道**难度门禁**（见下）。 |

## 安装

DSH 从 `${DSH_HOME:-$HOME/.dsh}/.agent-presets/`（用户根目录）发现自定义预设，每个预设一个子目录。安装本仓库的预设：

```bash
# 例如安装 codebuddy 预设
mkdir -p "$DSH_HOME/.agent-presets"
cp -r codebuddy "$DSH_HOME/.agent-presets/"
```

Windows（PowerShell）：

```powershell
$dest = "$env:USERPROFILE\.dsh\.agent-presets"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Recurse -Force .\codebuddy $dest
```

> 注意：`DSH_HOME` 缺省为 `$HOME/.dsh`。若你的部署另行配置了 preset 根目录（`roots`），请以实际路径为准。

安装后**重启 DSH**（Host 需要重新发现 preset 名单），然后在新建会话的选择器中即可看到该预设（显示名来自 `preset.yml` 的 `name`，如「CodeBuddy 模式」）。也可以将其设为默认预设。

## 使用

- 会话创建时选定 preset；只有空会话可以切换 preset。
- 加入同一 preset 的会话共享一份已安装的组装，子代理（subagent）继承父方的组装，看到相同的工具与提示词段落。
- 组装的加载错误不会被隐藏：无法加载的 preset 会在选择器中连同原因一并列出，方便定位修复或删除。

## 难度门禁

`codebuddy` 带一道**难度门禁**：模型在动手改文件前先把任务难度评为 **0–10 分**（通过 `report_task_difficulty` 工具，附一句可核对理由），并与阈值比较。

- **分数 ≥ 阈值**：照常工作，该跑测试、该构建就照做。
- **分数 < 阈值**：实现完**直接交付**——不跑测试套件、不写测试文件、不做额外验证、也不反问要不要验证，并在最终回复中说明「因低于阈值跳过了验证」以及分数与阈值。

这样平时的小改动不用再等一轮测试。阈值默认 **4**，**每个会话各自一份**，可以随时在会话内改：

```
/difficulty          # 查看本会话的阈值与本次任务的评分
/difficulty 7        # 把本会话的阈值改为 7
/difficulty reset    # 把本会话恢复为默认值
```

改动**只影响当前会话**，不写磁盘、不会串到其它会话、会话结束后即消失；新会话一律从 `agent.cordis.yml` 里那一行的 `config.threshold` 开始：

```yaml
- id: difficulty-policy
  name: './difficulty-policy.mjs'
  config:
    threshold: 4
```

> 注意：分数由模型自评。门禁会要求它给出理由，且提示词明确「存疑时往上打分」，但模型仍可能低估难度——低分意味着这次交付**未经任何验证**，风险由你承担。想关掉整道门禁，删掉 `difficulty-policy` 那一行即可。
>
> 预设是「每个会话加入同一份组装」，所以阈值与评分都按会话（agent）分别存储，并在会话结束时回收；这也是它**不落盘**的原因——没有一份全局配置可以被别的会话或下次启动读到。

## 自定义

- 直接编辑 `codebuddy/agent.cordis.yml` 即可调整该预设的工具与提示词。每个行（row）注释说明了其作用与所在 realm 的取舍理由。
- 新增预设：复制 `codebuddy/` 目录并修改 `agent.cordis.yml` 与 `preset.yml`（`preset.yml` 支持 `name`、`description`、`order` 三个字段；`order` 用于随包预设的名单排序）。
- 若要恢复 `web_fetch` / `web_search`，将 `codebuddy/agent.cordis.yml` 中 `tool-web` 一行的 `disabled: true` 改为 `false` 或删除该行（Host 的 `web` 服务与搜索提供方在宿主平面，预设只需开放模型侧工具）。

> 自行编写的预设被视为**受信任配置**：它会授予所选插件的全部能力，请只在可信机器上使用。

## 结构

```
.
├── README.md                     # 本文件
└── codebuddy/
    ├── preset.yml                # 展示元数据（name / description / order）
    ├── agent.cordis.yml          # 智能体组装：人格、工具、Skills、realm 取舍
    ├── shadow-surface-sections.mjs  # 遮蔽两个宿主全局提示词段落（见下）
    └── difficulty-policy.mjs     # 难度门禁：评分、动态阈值、/difficulty 命令（见上）
```

两个 `.mjs` 都是预设自带的微型插件，都**不发布任何服务**，因此无需 `isolate` realm。

`shadow-surface-sections.mjs` 是本预设的两个自带插件之一，作用是**对本预设的 agent 屏蔽两个全局提示词段落**：

- `harness:source` —— 由 `dsh-app-boot` 注册，说明 DSH 自身安装目录在哪
- `app:web-surface` —— 由 `dsh-web-app` 注册，Web GUI 的方位说明（含当前 `dsh web` 地址）

这两段**不是可禁用的行**，而是在 `dsh-web-app` 的 `apply()` 内部无条件注册的，且注册时没有作用域，因此是进程级全局、每个预设都会带上。屏蔽原理：提示词注册表按作用域链合并段落，同名时**最近的作用域覆盖全局**，而渲染时**空文本段落被丢弃**——所以从预设作用域注册同名空段落即可移除，且只影响本预设。这与 `dsh-persona` 遮蔽 `deployment:persona-prefix` 是同一机制。

该文件必须**零依赖**（预设装在 `$DSH_HOME/.agent-presets/` 下，向上找不到 `@deepseek-ai/*`），故未 import 任何东西，段落顺序也内联为字面量。删掉 `agent.cordis.yml` 里那一行即可恢复两段。

`difficulty-policy.mjs` 的实现要点：

- **零 import**（连 `node:*` 都不用）。阈值来自该行的 `config.threshold`——Cordis 在插件**未导出 `Config` schema** 时原样透传 config，这正是零依赖文件也能接受配置、且不必自己读写文件的原因。
- 工具用**纯对象**注册（`ctx.tools.register({...})`），因为 `defineTool()` 需要 import `@deepseek-ai/dsh-tools`。
- 策略正文走 `systemPrompt.section()`（固定文本，保住 KV 前缀），阈值与评分走 `systemPrompt.context()`（每步重新求值、按会话取值，且作为 user message 追加，不会击穿前缀）。
- **所有状态按会话（agent）分别存储**：预设只挂载一次，模块级变量会被所有会话共享，所以每次读取都以当前 agent 为键。`/difficulty` 只改调用它的那个会话。记录在 `agent/disposed` 时回收——它不会每个会话留一条永不释放的条目。
- `commands` 走 `ctx.get('commands')` 可选解析而非 `inject`：没有命令界面的部署（headless / ACP）里，这道门禁的提示词与工具照常生效，只是没有 `/difficulty`。

## 相关

- [DSH Agent 预设文档（dsh-agent-presets）](https://github.com/deepseek-ai/dsh) —— 预设的发现、复制、配置与按会话组装机制。
