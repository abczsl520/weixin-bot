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
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg?style=flat-square)](#-docker)

[中文](./README.md) · English

</div>

---

## ⚠️ Compatibility

> **iOS**: Supports WeChat 8.0.70. After updating to the latest version, you must **force-quit WeChat from the background and reopen it** before the bot can connect.
>
> **Android**: Now supported! Scanning the QR code will prompt a WeChat update. Update and scan again. May have some bugs — please test first (on some Android devices the bot won't appear on the home screen; search for it or find it in the Features tab).

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

## 🧠 9 AI Providers, Your Choice

| Provider | Command | What It Does |
|----------|---------|-------------|
| **OpenAI** | `--provider openai` | GPT-4o, GPT-4o-mini — the classic |
| **Claude** | `--provider claude` | Anthropic's Claude — great for long conversations |
| **Gemini** | `--provider gemini` | Google's Gemini — free tier available |
| **Ollama** | `--provider ollama` | Run AI locally, completely free |
| **Codex** 🆕 | `--provider codex` | OpenAI's coding agent — writes actual code |
| **Claude Code** 🆕 | `--provider claude-code` | Anthropic's coding agent — reads files, runs commands |
| **OpenClaw** 🆕 | `--provider openclaw` | OpenClaw AI gateway — auto-detects local instance |
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

Session expired? No problem. Exponential backoff: 3s → 5s → 10s → 20s → 30s. Up to 5 retries.

---

## 🐳 Docker

```bash
docker build -t weixin-bot .
docker run -it \
  -v weixin-bot-data:/home/botuser/.weixin-bot \
  -e OPENAI_API_KEY=sk-xxx \
  weixin-bot
```

Alpine-based. Non-root. Image size < 50MB.

---

## 📝 Built-in Commands

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
- **Zero ban risk** — Legitimate bot platform by Tencent
- **Privacy** — Everything runs on your machine

---

## 🚀 All Options

```bash
npx weixin-bot [options]

Options:
  --provider <name>   openai | claude | gemini | ollama | codex | claude-code | openclaw | custom
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

## License

MIT © 2026

<div align="center">

**⭐ If this saved you time, star it!**

**Built on WeChat's official iLink Bot API. Zero dependencies. Zero risk.**

</div>
