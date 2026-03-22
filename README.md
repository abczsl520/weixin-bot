<div align="center">

# 🤖 weixin-bot

**One command. Your WeChat AI bot is live.**

```bash
npx weixin-bot
```

Scan QR → Pick your AI → Done. That's it.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#)

[English](#quick-start) · [中文](#中文)

</div>

---

## Quick Start

```bash
npx weixin-bot
```

That's literally it. The interactive setup will guide you through:

1. **Choose AI provider** — OpenAI, Claude, Gemini, Ollama, or any custom API
2. **Scan QR code** — With your WeChat mobile app
3. **Done** — Your bot is live and replying to messages

### With Options

```bash
# Use OpenAI
npx weixin-bot --provider openai --api-key sk-xxx

# Use Claude
npx weixin-bot --provider claude --api-key sk-ant-xxx

# Use local Ollama (free!)
npx weixin-bot --provider ollama --model llama3

# Use any OpenAI-compatible API
npx weixin-bot --provider custom --base-url https://my-proxy.com/v1 --api-key xxx

# Echo mode (no AI, just echoes messages back)
npx weixin-bot --echo

# Environment variables work too
OPENAI_API_KEY=sk-xxx npx weixin-bot
```

## Features

- 🚀 **One command** — `npx weixin-bot` and you're live
- 🧠 **Multi-AI** — OpenAI, Claude, Gemini, Ollama, Codex, Claude Code, or any OpenAI-compatible API
- 💬 **Smart replies** — Per-user conversation history with context
- ⌨️ **Typing indicators** — Shows "typing..." while AI thinks
- 💾 **Auto-save** — Login token + config persist across restarts
- 📝 **Slash commands** — `/clear`, `/help`, `/ping`, `/status` built-in
- 🔒 **Official API** — Uses WeChat's iLink Bot API, zero ban risk
- 📦 **Zero dependencies** — Pure Node.js, nothing to install
- 🔀 **Long message splitting** — Auto-splits replies that exceed WeChat limits
- 📱 **Terminal QR code** — Scan directly from terminal, no browser needed
- 🔄 **Auto-reconnect** — Reconnects automatically when session expires (up to 5 retries with backoff)
- 🛡️ **Security** — API keys encrypted on disk, config files chmod 600, log masking, rate limiting
- 🐳 **Docker ready** — Dockerfile included, runs as non-root user

## Supported AI Providers

| Provider | Command | Free? |
|----------|---------|-------|
| OpenAI | `--provider openai --api-key sk-xxx` | No |
| Claude | `--provider claude --api-key sk-ant-xxx` | No |
| Gemini | `--provider gemini --api-key xxx` | Free tier |
| Ollama | `--provider ollama --model llama3` | ✅ Yes (local) |
| Codex | `--provider codex` | Needs OpenAI key |
| Claude Code | `--provider claude-code` | Needs Anthropic key |
| Custom | `--provider custom --base-url URL --api-key KEY` | Varies |
| Echo | `--echo` | ✅ Yes |

### Agent Providers (Codex & Claude Code)

These run as local coding agents — they can read files, run commands, and write code:

```bash
# OpenAI Codex agent (requires: npm i -g @openai/codex)
npx weixin-bot --provider codex --api-key sk-xxx

# Claude Code agent (requires: npm i -g @anthropic-ai/claude-code)
npx weixin-bot --provider claude-code --api-key sk-ant-xxx
```

Send a message like "create a hello world Python script" and the agent will actually do it.

## Built-in Commands

Users can send these commands to the bot:

| Command | Description |
|---------|-------------|
| `/clear` | Clear conversation history |
| `/help` | Show available commands |
| `/ping` | Check if bot is alive |
| `/status` | Show bot uptime and stats |

## Security

- 🔐 API keys are **encrypted** before saving to disk (AES-256-CBC, machine-bound key)
- 📁 Config files are `chmod 600` (owner-only read/write)
- 🔒 Config directory is `chmod 700`
- 🪵 API keys are **masked** in all log output (`sk-abc...xyz`)
- 🚦 Per-user **rate limiting** (3s cooldown + 10 msg/min max)
- 🧹 User input is **sanitized** in logs (no log injection)
- 🐳 Docker runs as **non-root** user

## Docker

```bash
# Build
docker build -t weixin-bot .

# Run (interactive for QR scan)
docker run -it -v weixin-bot-data:/home/botuser/.weixin-bot weixin-bot --provider openai --api-key sk-xxx

# Run with env vars
docker run -it -v weixin-bot-data:/home/botuser/.weixin-bot -e OPENAI_API_KEY=sk-xxx weixin-bot
```

## Auto-Reconnect

When the WeChat session expires, `weixin-bot` automatically:

1. Detects the expired session
2. Waits with exponential backoff (3s → 5s → 10s → 20s → 30s)
3. Re-initiates QR login
4. Resumes message polling

Up to 5 reconnect attempts before giving up.

## How It Works

```
User's WeChat ──► iLink Bot API ──► weixin-bot ──► AI Provider
                                         │              │
                                         ◄──────────────┘
                                         │
User's WeChat ◄── iLink Bot API ◄────────┘
```

1. User sends message to bot via WeChat
2. `weixin-bot` receives it via long-poll
3. Message is sent to your chosen AI provider
4. AI response is sent back to the user

## Configuration

Config is saved to `~/.weixin-bot/config.json`. Login token is saved to `~/.weixin-bot/token.json`.

To reconfigure: delete `~/.weixin-bot/config.json` and run again.

To re-login: `npx weixin-bot --login`

## SDK

Need more control? Use [weixin-bot-sdk](https://github.com/abczsl520/weixin-bot-sdk) — the full SDK with media support, TypeScript, and event-driven API.

## Important Notes

- This uses WeChat's **official iLink Bot API** — not a hack
- Bot can only receive messages users **send directly to it**
- Bot **cannot** monitor all chats or act as a personal account
- **No ban risk** — this is an official bot platform

---

## 中文

### 一键启动

```bash
npx weixin-bot
```

扫码 → 选 AI → 搞定。

### 支持的 AI

| 提供商 | 命令 | 免费？ |
|--------|------|--------|
| OpenAI | `--provider openai --api-key sk-xxx` | 否 |
| Claude | `--provider claude --api-key sk-ant-xxx` | 否 |
| Gemini | `--provider gemini --api-key xxx` | 有免费额度 |
| Ollama | `--provider ollama --model llama3` | ✅ 免费（本地） |
| Codex | `--provider codex` | 需 OpenAI key |
| Claude Code | `--provider claude-code` | 需 Anthropic key |
| 自定义 | `--provider custom --base-url URL --api-key KEY` | 看情况 |
| 回声模式 | `--echo` | ✅ 免费 |

### 注意

- 使用微信官方 iLink Bot API，不是 hook，零封号风险
- Bot 只能收到用户主动发给它的消息
- 需要 Node.js 18+

---

## License

MIT © 2025

<div align="center">

**⭐ Star if this saved you time!**

</div>
