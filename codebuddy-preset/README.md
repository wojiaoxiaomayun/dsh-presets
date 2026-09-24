# @dsh-xhl/dsh-codebuddy-preset

DeepSeek Harness (DSH) 的 **CodeBuddy 模式** agent preset，以 npm bundle 形式发布。

以 CodeBuddy 的系统提示词作为人格，工具与能力全部使用 DSH 原生实现（文件编辑、Shell、检索、Skills、任务清单、交互与交付）。
另含一道**难度门禁**：任务先自评 0–10 分，低于阈值（每会话默认 4）时实现完直接交付、不跑测试。

## 安装

```bash
dsh plugin --profile web add @dsh-xhl/dsh-codebuddy-preset
```

安装后**刷新页面**，在新建会话的选择器中即可看到「CodeBuddy 模式」。

也可以用 `plugin_manager` 工具安装（`action: install_bundle`，`target` 填包名）。

## 包含什么

一条 `@deepseek-ai/dsh-agent-preset` 声明，装好后出现在预设名单里：

| 字段 | 值 |
| --- | --- |
| 预设 id | `codebuddy` |
| 显示名 | CodeBuddy 模式 |
| 名单排序 | 3 |

**保留**：人格提示词、文件读写、检索、Shell（Windows 用 pwsh / 其他平台用 bash）、后台任务、Skills、任务清单、交互提问、交付（`present`）。
**禁用**：`tool-web`（web_fetch / web_search）、目标模式（`command-goal` / `tool-goal`）、计划模式（`planning`）、以及整个 delegation 组（`subagent` / `subagent_fork` / `send_message` / `interrupt_agent` / `list_agents` / `workflow` / `ralph`）。

想恢复其中任意一项，编辑 `cordis.patch.yml` 里对应行的 `disabled` 即可，每行都有注释说明。

## 难度门禁

模型在动手改文件前先把任务难度评为 **0–10 分**（通过 `report_task_difficulty` 工具，附一句可核对理由）：

- **分数 ≥ 阈值**：照常工作，该跑测试、该构建就照做。
- **分数 < 阈值**：实现完**直接交付**，不跑测试、不写测试、不做额外验证，并在回复中说明跳过了验证。

阈值默认 **4**，**每个会话各自一份**，可在会话内随时调整：

```
/difficulty          # 查看本会话的阈值与本次任务的评分
/difficulty 7        # 把本会话的阈值改为 7
/difficulty reset    # 恢复默认值
```

只接受 **0–10 的整数**或 `reset`；改动**不落盘**、只影响当前会话、会话结束即消失。

> 分数由模型自评，可能低估难度。低分意味着这次交付**未经任何验证**，风险由你承担。
> 想关掉整道门禁，删掉 `cordis.patch.yml` 里 `difficulty-policy` 那一行。

## 实现说明

包内两个 `.mjs` 都是零依赖的微型插件，都不发布服务，因此无需 `isolate` realm。

> **注意解析方式**：预设行**不能**用 `./x.mjs` 这种相对路径。
> registry 装载预设时会用**声明方**的 `baseUrl`（即 profile 目录）重新挂载子树，`./x.mjs` 会被解析成 `<profile>/x.mjs` 而失败（报 `never started`）。
> 因此这两个插件通过**包名 + `exports` 子路径**寻址，走 profile 的 `node_modules`：
>
> ```yaml
> - id: shadow-surface-sections
>   name: '@dsh-xhl/dsh-codebuddy-preset/shadow-surface-sections.mjs'
> - id: difficulty-policy
>   name: '@dsh-xhl/dsh-codebuddy-preset/difficulty-policy.mjs'
> ```

- `shadow-surface-sections.mjs` —— 对本预设的 agent 遮蔽两个宿主全局提示词段落（`harness:source`、`app:web-surface`）。原理是同名空段落就近覆盖全局层，且空文本段落渲染时被丢弃。
- `difficulty-policy.mjs` —— 难度门禁。策略正文走固定 `systemPrompt.section()`（保住 KV 前缀），阈值与评分走动态 `systemPrompt.context()`（按会话取值，不击穿前缀）。所有状态以 agent 为键分别存储，`agent/disposed` 时回收。`commands` 用 `ctx.get('commands')` 可选解析，因此在没有命令界面的部署（headless / ACP）里门禁照常生效，只是没有 `/difficulty`。

## 许可

MIT
