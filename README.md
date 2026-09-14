# dsh-presets

DeepSeek Harness (DSH) 的自用 Agent 预设（agent presets）集合。

一个 preset 是一个目录，内含一个 `agent.cordis.yml`（智能体组装文件，声明该会话可用的工具、提示词段落与 Skills），可选配 `preset.yml`（展示元数据：名称与描述）。每个会话在创建时按所选 preset 组装自己的智能体，不同 preset 的会话可以运行在同一进程内且状态互相隔离。

## 包含的预设

| 目录 | 预设名 | 说明 |
| --- | --- | --- |
| [`codebuddy/`](codebuddy/) | CodeBuddy 模式 | 以 CodeBuddy 的系统提示词作为人格、面向「平时改改代码」裁剪过的单智能体编码预设。保留文件读写、检索、Shell、后台任务、Skills、任务清单、交互与交付；**已禁用**：`tool-web`（web_fetch / web_search）、目标模式（`command-goal` / `tool-goal`）、计划模式（`planning` 组）、以及整个 delegation 组（`subagent` / `subagent_fork` / `send_message` / `interrupt_agent` / `list_agents` / `workflow` / `ralph`）。基于官方 `standard` 预设复制，但已非「仅改 persona」；每个禁用行都带原因注释，删掉该行的 `disabled` 即可恢复。 |

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
    └── shadow-surface-sections.mjs  # 遮蔽两个宿主全局提示词段落（见下）
```

`shadow-surface-sections.mjs` 是预设自带的微型插件，唯一作用是**对本预设的 agent 屏蔽两个全局提示词段落**：

- `harness:source` —— 由 `dsh-app-boot` 注册，说明 DSH 自身安装目录在哪
- `app:web-surface` —— 由 `dsh-web-app` 注册，Web GUI 的方位说明（含当前 `dsh web` 地址）

这两段**不是可禁用的行**，而是在 `dsh-web-app` 的 `apply()` 内部无条件注册的，且注册时没有作用域，因此是进程级全局、每个预设都会带上。屏蔽原理：提示词注册表按作用域链合并段落，同名时**最近的作用域覆盖全局**，而渲染时**空文本段落被丢弃**——所以从预设作用域注册同名空段落即可移除，且只影响本预设。这与 `dsh-persona` 遮蔽 `deployment:persona-prefix` 是同一机制。

该文件必须**零依赖**（预设装在 `$DSH_HOME/.agent-presets/` 下，向上找不到 `@deepseek-ai/*`），故未 import 任何东西，段落顺序也内联为字面量。删掉 `agent.cordis.yml` 里那一行即可恢复两段。

## 相关

- [DSH Agent 预设文档（dsh-agent-presets）](https://github.com/deepseek-ai/dsh) —— 预设的发现、复制、配置与按会话组装机制。
