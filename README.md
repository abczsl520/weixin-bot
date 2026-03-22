<div align="center">

<img src="https://img.shields.io/badge/WeChat-07C160?style=for-the-badge&logo=wechat&logoColor=white" alt="WeChat" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Zero_Deps-brightgreen?style=for-the-badge" alt="Zero Dependencies" />

# 🤖 weixin-bot

### One command. Your WeChat AI bot is live.

```bash
npx weixin-bot
```

**No server. No config files. No dependencies. Just run it.**

[![npm version](https://img.shields.io/npm/v/weixin-bot.svg?style=flat-square)](https://www.npmjs.com/package/weixin-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg?style=flat-square)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg?style=flat-square)](#docker)

[English](#-how-it-works) · [中文](#-中文文档)

</div>

---

## ⚡ 30-Second Demo

```bash
$ npx weixin-bot

  🤖 weixin-bot — One-command WeChat AI Bot

  First time? Let's set up your AI backend.

  Providers:
    1) OpenAI        (GPT-4o, GPT-4o-mini, etc.)
    2) Claude        (Anthropic API)
    3) Gemini        (Google)
    4) Ollama        (Local, free)
    5) Codex         (OpenAI Codex agent — local CLI)
    6) Claude Code   (Anthropic agent — local CLI)
    7) Custom        (any OpenAI-compatible API)
    8) Echo mode     (no AI, just echo messages back)

  Choose provider [1-8]: 1
  OpenAI API key: sk-xxx

  📱 Scan with WeChat:

  ██████████████████████████████
  ██ ▄▄▄▄▄ █▀▄▀▄█▀█ ▄▄▄▄▄ ██
  ██ █   █ █▄▀▄ ▀██ █   █ ██
  ██ ▀▀▀▀▀ █ ▀ █▄▀█ ▀▀▀▀▀ ██
  ██████████████████████████████

  ✅ Login successful! Bot ID: wx_bot_xxx

  🤖 weixin-bot is running!
  AI: openai (gpt-4o-mini)
  Press Ctrl+C to stop.
```

**That's it. Your WeChat is now powered by AI.**

---

## 🧠 8 AI Providers, Your Choice

| Provider | Command | What It Does |
|----------|---------|-------------|
| **OpenAI** | `--provider openai` | GPT-4o, GPT-4o-mini — the classic |
| **Claude** | `--provider claude` | Anthropic's Claude — great for long conversations |
| **Gemini** | `--provider gemini` | Google's Gemini — free tier available |
| **Ollama** | `--provider ollama` | Run AI locally, completely free |
| **Codex** 🆕 | `--provider codex` | OpenAI's coding agent — writes actual code |
| **Claude Code** 🆕 | `--provider claude-code` | Anthropic's coding agent — reads files, runs commands |
| **Custom** | `--provider custom` | Any OpenAI-compatible API (OpenRouter, Groq, vLLM...) |
| **Echo** | `--echo` | No AI, just echoes messages back (for testing) |

### 🤯 Agent Mode (Codex & Claude Code)

These aren't just chatbots — they're **coding agents**. Send "create a Python script that..." and they'll actually write the code on your machine.

```bash
# Your WeChat becomes a Codex terminal
npx weixin-bot --provider codex --api-key sk-xxx

# Or a Claude Code terminal
npx weixin-bot --provider claude-code --api-key sk-ant-xxx
```

---

## 🔒 Security First

We take security seriously. This isn't a toy.

| Feature | Detail |
|---------|--------|
| 🔐 **Encrypted keys** | API keys encrypted with AES-256-CBC before saving to disk |
| 🔑 **Machine-bound** | Encryption key derived from your machine's unique fingerprint |
| 📁 **File permissions** | Config dir `chmod 700`, files `chmod 600` |
| 🪵 **Log masking** | API keys show as `sk-abc...xyz` in all output |
| 🚦 **Rate limiting** | Per-user: 3s cooldown + 10 msg/min max |
| 🧹 **Input sanitization** | User messages sanitized in logs (anti log-injection) |
| 🐳 **Non-root Docker** | Container runs as unprivileged user |

---

## 🔄 Auto-Reconnect

Session expired? No problem. `weixin-bot` handles it automatically:

```
  ⚠️ Session expired (code: -14)
  🔄 Reconnecting (1/5) in 3s...
  📱 Scan with WeChat:
  [QR Code]
  ✅ Reconnected!
```

Exponential backoff: 3s → 5s → 10s → 20s → 30s. Up to 5 retries.

---

## 🐳 Docker

```bash
# Build
docker build -t weixin-bot .

# Run
docker run -it \
  -v weixin-bot-data:/home/botuser/.weixin-bot \
  -e OPENAI_API_KEY=sk-xxx \
  weixin-bot
```

Alpine-based. Non-root. Zero dependencies. Image size < 50MB.

---

## 📝 Built-in Commands

Users can send these to your bot in WeChat:

| Command | What It Does |
|---------|-------------|
| `/clear` | Clear conversation history |
| `/help` | Show available commands |
| `/ping` | Check if bot is alive → 🏓 Pong! |
| `/status` | Show uptime, message count, AI provider |

---

## 🏗️ How It Works

```
┌──────────────┐                    ┌─────────────────────┐
│  User's      │  sends message     │                     │
│  WeChat      │ ──────────────────►│  iLink Bot API      │
│              │                    │  (Tencent Official)  │
└──────────────┘                    └──────────┬──────────┘
                                               │
                                    long-poll  │
                                               ▼
                                    ┌─────────────────────┐
                                    │  weixin-bot          │
                                    │  (your machine)      │
                                    └──────────┬──────────┘
                                               │
                                    API call   │
                                               ▼
                                    ┌─────────────────────┐
                                    │  AI Provider         │
                                    │  OpenAI / Claude /   │
                                    │  Gemini / Ollama     │
                                    └──────────┬──────────┘
                                               │
                                    reply      │
                                               ▼
┌──────────────┐                    ┌─────────────────────┐
│  User's      │  receives reply    │  iLink Bot API      │
│  WeChat      │ ◄─────────────────│  (Tencent Official)  │
└──────────────┘                    └─────────────────────┘
```

- **Official API** — Uses WeChat's iLink Bot API, not a hack
- **Zero ban risk** — This is a legitimate bot platform by Tencent
- **Privacy** — Everything runs on your machine, no third-party servers

---

## 🚀 All Options

```bash
npx weixin-bot [options]

Options:
  --provider <name>   openai | claude | gemini | ollama | codex | claude-code | custom
  --api-key <key>     API key for the provider
  --base-url <url>    Custom API base URL
  --model <name>      Model name (default: auto per provider)
  --echo              Echo mode (no AI)
  --login             Force re-login
  -h, --help          Show help
  -v, --version       Show version

Environment Variables:
  OPENAI_API_KEY      OpenAI API key
  ANTHROPIC_API_KEY   Claude API key
  GEMINI_API_KEY      Gemini API key
```

---

## 🔗 Related

| Project | Description |
|---------|-------------|
| [weixin-bot-sdk](https://github.com/abczsl520/weixin-bot-sdk) | Full SDK — build custom bots with media support, TypeScript, event-driven API |
| [weixin-bot-sdk Wiki](https://github.com/abczsl520/weixin-bot-sdk/wiki) | Complete documentation, tutorials, and API reference |

---

## 📋 中文文档

### 一键启动

```bash
npx weixin-bot
```

扫码 → 选 AI → 搞定。就这么简单。

### 支持 8 种 AI

| 提供商 | 命令 | 说明 |
|--------|------|------|
| OpenAI | `--provider openai --api-key sk-xxx` | GPT-4o 系列 |
| Claude | `--provider claude --api-key sk-ant-xxx` | Anthropic Claude |
| Gemini | `--provider gemini --api-key xxx` | Google Gemini，有免费额度 |
| Ollama | `--provider ollama --model llama3` | 本地运行，完全免费 |
| Codex | `--provider codex` | OpenAI 编程 Agent，能写代码 |
| Claude Code | `--provider claude-code` | Anthropic 编程 Agent |
| 自定义 | `--provider custom --base-url URL` | 任何 OpenAI 兼容 API |
| 回声 | `--echo` | 测试用，原样返回消息 |

### 安全特性

- 🔐 API 密钥加密存储（AES-256-CBC，绑定机器指纹）
- 📁 配置文件权限 600，目录权限 700
- 🪵 日志自动脱敏
- 🚦 每用户限流防刷
- 🐳 Docker 非 root 运行

### 重要说明

- 使用微信官方 iLink Bot API，**不是 hook**，零封号风险
- Bot 只能收到用户**主动发给它**的消息
- 所有数据在你本地处理，不经过第三方服务器
- 需要 Node.js 18+

---

## License

MIT © 2026

<div align="center">

**⭐ If this saved you time, star it!**

**Built on WeChat's official iLink Bot API. Zero dependencies. Zero risk.**

</div>
