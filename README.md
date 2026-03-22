<div align="center">

<img src="https://img.shields.io/badge/微信-07C160?style=for-the-badge&logo=wechat&logoColor=white" alt="WeChat" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/零依赖-brightgreen?style=for-the-badge" alt="Zero Dependencies" />

# 🤖 wx-ai-bot

### 一条命令，微信 AI 机器人上线

```bash
npx wx-ai-bot
```

**不需要服务器。不需要配置文件。不需要安装依赖。直接跑。**

[![npm version](https://img.shields.io/npm/v/wx-ai-bot.svg?style=flat-square)](https://www.npmjs.com/package/wx-ai-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg?style=flat-square)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg?style=flat-square)](#-docker)

中文 · [English](./README.en.md)

</div>

---

## ⚠️ 兼容性说明

> **iOS**：支持微信 8.0.70 版本。更新到最新版后需**在后台关掉微信再重新打开**，才能正常对接 Bot。
>
> **安卓**：已支持！扫码提示更新微信，更新完重新扫码即可，可能有部分 Bug 建议自测（部分安卓首页看不到 Bot，需要搜索或者在功能页面显示）。

---

## 📖 从零开始（小白教程）

完全没用过终端？没关系，跟着下面一步步来：

### 第 1 步：安装 Node.js

去 [nodejs.org](https://nodejs.org) 下载 **LTS 版本**（绿色按钮），双击安装，一路下一步就行。

怎么确认装好了？打开终端，输入：
```bash
node -v
```
看到类似 `v22.x.x` 就说明装好了。

> **怎么打开终端？**
> - **Mac**：按 `Command + 空格`，输入"终端"，回车
> - **Windows**：按 `Win + R`，输入 `cmd`，回车（或搜索"PowerShell"）
> - **Linux**：按 `Ctrl + Alt + T`

### 第 2 步：一条命令启动

在终端里输入：
```bash
npx wx-ai-bot
```

> `npx` 是 Node.js 自带的工具，会自动下载并运行 wx-ai-bot，不需要你手动安装任何东西。

### 第 3 步：选择 AI 提供商

终端会显示菜单，输入数字选择：

```
  AI 提供商：
    1) OpenAI        ← 最常用，需要 API key
    2) Claude
    3) Gemini        ← Google 的，有免费额度
    4) Ollama        ← 本地运行，完全免费
    ...
    9) Echo mode     ← 测试用，不需要任何 key
```

**新手建议**：先选 `9`（回声模式）测试一下流程，确认能跑通再换成真正的 AI。

### 第 4 步：扫码登录

终端会显示一个二维码，用**微信扫一扫**扫它。

扫完在手机上确认，终端显示 `✅ 登录成功` 就 OK 了。

### 第 5 步：开始聊天

现在用另一个微信号给你的 Bot 发消息试试！Bot 会自动回复。

按 `Ctrl + C` 可以随时停止。

### 常见问题

| 问题 | 解决 |
|------|------|
| `npx` 命令找不到 | Node.js 没装好，重新装一遍 |
| 二维码扫不了 | 终端窗口拉宽一点，或者复制链接到浏览器打开 |
| 扫码后没反应 | iOS 需要微信 8.0.70+；安卓扫码后按提示更新微信 |
| Bot 收不到消息 | 要用**另一个微信号**给 Bot 发消息，不能自己给自己发 |
| API key 怎么获取 | OpenAI: [platform.openai.com](https://platform.openai.com/api-keys)，Gemini: [aistudio.google.com](https://aistudio.google.com/apikey) |

---

## ⚡ 30 秒上手

```bash
$ npx wx-ai-bot

  🤖 wx-ai-bot — 一键微信 AI 机器人

  首次使用？来设置你的 AI 后端。

  AI 提供商：
    1) OpenAI        (GPT-4o, GPT-4o-mini 等)
    2) Claude        (Anthropic API)
    3) Gemini        (Google)
    4) Ollama        (本地运行，免费)
    5) Codex         (OpenAI 编程 Agent)
    6) Claude Code   (Anthropic 编程 Agent)
    7) 自定义        (任何 OpenAI 兼容 API)
    8) 回声模式      (不用 AI，原样返回消息)

  选择提供商 [1-8]: 1
  OpenAI API key: sk-xxx

  📱 用微信扫码：

  ██████████████████████████████
  ██ ▄▄▄▄▄ █▀▄▀▄█▀█ ▄▄▄▄▄ ██
  ██ █   █ █▄▀▄ ▀██ █   █ ██
  ██ ▀▀▀▀▀ █ ▀ █▄▀█ ▀▀▀▀▀ ██
  ██████████████████████████████

  ✅ 登录成功！Bot ID: wx_bot_xxx

  🤖 wx-ai-bot 已启动！
  AI: openai (gpt-4o-mini)
  按 Ctrl+C 停止。
```

**搞定。你的微信现在有 AI 了。**

---

## 🧠 9 种 AI 提供商，随你选

| 提供商 | 命令 | 说明 |
|--------|------|------|
| **OpenAI** | `--provider openai` | GPT-4o, GPT-4o-mini — 经典之选 |
| **Claude** | `--provider claude` | Anthropic Claude — 长对话很强 |
| **Gemini** | `--provider gemini` | Google Gemini — 有免费额度 |
| **Ollama** | `--provider ollama` | 本地运行 AI，完全免费 |
| **Codex** 🆕 | `--provider codex` | OpenAI 编程 Agent — 能写真代码 |
| **Claude Code** 🆕 | `--provider claude-code` | Anthropic 编程 Agent — 能读文件、跑命令 |
| **OpenClaw** 🆕 | `--provider openclaw` | OpenClaw AI 网关 — 自动检测本地实例 |
| **自定义** | `--provider custom` | 任何 OpenAI 兼容 API（OpenRouter, Groq, vLLM...） |
| **回声** | `--echo` | 不用 AI，原样返回消息（测试用） |

### 🤯 Agent 模式（Codex & Claude Code）

这不只是聊天机器人 — 它们是**编程 Agent**。发一句"写个 Python 脚本..."，它们会在你的机器上真的写出代码。

```bash
# 你的微信变成 Codex 终端
npx wx-ai-bot --provider codex --api-key sk-xxx

# 或者 Claude Code 终端
npx wx-ai-bot --provider claude-code --api-key sk-ant-xxx
```

---

## 🔒 安全第一

我们认真对待安全。这不是玩具。

| 特性 | 说明 |
|------|------|
| 🔐 **密钥加密** | API 密钥用 AES-256-CBC 加密后存盘 |
| 🔑 **绑定机器** | 加密密钥由你机器的唯一指纹派生 |
| 📁 **文件权限** | 配置目录 `chmod 700`，文件 `chmod 600` |
| 🪵 **日志脱敏** | API 密钥在所有输出中显示为 `sk-abc...xyz` |
| 🚦 **限流防刷** | 每用户：3 秒冷却 + 每分钟最多 10 条 |
| 🧹 **输入清洗** | 用户消息在日志中做了防注入处理 |
| 🐳 **非 root Docker** | 容器以非特权用户运行 |

---

## 🔄 自动重连

Session 过期？没问题。`wx-ai-bot` 自动处理：

```
  ⚠️ Session 过期 (code: -14)
  🔄 重连中 (1/5)，3 秒后...
  📱 用微信扫码：
  [二维码]
  ✅ 重连成功！
```

指数退避：3s → 5s → 10s → 20s → 30s，最多重试 5 次。

---

## 🐳 Docker

```bash
# 构建
docker build -t wx-ai-bot .

# 运行
docker run -it \
  -v weixin-bot-data:/home/botuser/.weixin-bot \
  -e OPENAI_API_KEY=sk-xxx \
  wx-ai-bot
```

Alpine 镜像。非 root。零依赖。镜像 < 50MB。

---

## 📝 内置命令

用户可以在微信里给你的 Bot 发这些命令：

| 命令 | 功能 |
|------|------|
| `/clear` | 清空对话历史 |
| `/help` | 显示可用命令 |
| `/ping` | 检查 Bot 是否在线 → 🏓 Pong! |
| `/status` | 显示运行时间、消息数、AI 提供商 |

---

## 🏗️ 工作原理

```
┌──────────────┐                    ┌─────────────────────┐
│  用户的       │  发送消息          │                     │
│  微信         │ ──────────────────►│  iLink Bot API      │
│              │                    │  (腾讯官方)          │
└──────────────┘                    └──────────┬──────────┘
                                               │
                                    long-poll  │
                                               ▼
                                    ┌─────────────────────┐
                                    │  wx-ai-bot           │
                                    │  (你的电脑)          │
                                    └──────────┬──────────┘
                                               │
                                    API 调用   │
                                               ▼
                                    ┌─────────────────────┐
                                    │  AI 提供商           │
                                    │  OpenAI / Claude /   │
                                    │  Gemini / Ollama     │
                                    └──────────┬──────────┘
                                               │
                                    回复       │
                                               ▼
┌──────────────┐                    ┌─────────────────────┐
│  用户的       │  收到回复          │  iLink Bot API      │
│  微信         │ ◄─────────────────│  (腾讯官方)          │
└──────────────┘                    └─────────────────────┘
```

- **官方 API** — 使用微信 iLink Bot API，不是 hook
- **零封号风险** — 这是腾讯的正规 Bot 平台
- **隐私安全** — 所有数据在你本地处理，不经过第三方服务器

---

## 🚀 所有选项

```bash
npx wx-ai-bot [选项]

选项：
  --provider <name>   openai | claude | gemini | ollama | codex | claude-code | openclaw | custom
  --api-key <key>     AI 提供商的 API 密钥
  --base-url <url>    自定义 API 地址
  --model <name>      模型名称（默认：按提供商自动选择）
  --echo              回声模式（不用 AI）
  --login             强制重新登录
  -h, --help          显示帮助
  -v, --version       显示版本

环境变量：
  OPENAI_API_KEY      OpenAI API 密钥
  ANTHROPIC_API_KEY   Claude API 密钥
  GEMINI_API_KEY      Gemini API 密钥
```

---

## 🔗 相关项目

| 项目 | 说明 |
|------|------|
| [weixin-bot-sdk](https://github.com/abczsl520/weixin-bot-sdk) | 完整 SDK — 自定义机器人，支持媒体、TypeScript、事件驱动 |
| [weixin-bot-sdk Wiki](https://github.com/abczsl520/weixin-bot-sdk/wiki) | 完整文档、教程、API 参考 |

---

## 重要说明

- 使用微信官方 **iLink Bot API**，不是 hook/注入
- Bot 只能收到用户**主动发给它**的消息
- Bot **不能**监听所有聊天或冒充个人号
- 需要 Node.js 18+
- **目前支持 iOS 微信 8.0.70 + 安卓**（安卓扫码后按提示更新微信即可，可能有部分 Bug）

---

## License

MIT © 2026

<div align="center">

**⭐ 觉得有用？给个 Star 吧！**

**基于微信官方 iLink Bot API。零依赖。零风险。**

</div>
