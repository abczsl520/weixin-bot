#!/usr/bin/env node
/**
 * weixin-bot — One-command WeChat AI Bot
 *
 * Usage:
 *   npx wx-ai-bot                          # Interactive setup
 *   npx wx-ai-bot --api-key sk-xxx         # With OpenAI key
 *   npx wx-ai-bot --provider ollama        # Use local Ollama
 *   npx wx-ai-bot --login                  # Force re-login
 *   npx wx-ai-bot --echo                   # Simple echo mode (no AI)
 */
import { parseArgs } from 'node:util';
import { startBot } from '../lib/bot.mjs';
import { interactiveSetup } from '../lib/setup.mjs';
import { loadConfigWithKey, saveConfig } from '../lib/config.mjs';

const { values: args } = parseArgs({
  options: {
    'api-key':    { type: 'string' },
    'base-url':   { type: 'string' },
    'model':      { type: 'string' },
    'provider':   { type: 'string' },
    'login':      { type: 'boolean', default: false },
    'echo':       { type: 'boolean', default: false },
    'help':       { type: 'boolean', short: 'h', default: false },
    'version':    { type: 'boolean', short: 'v', default: false },
  },
  strict: false,
});

if (args.version) {
  const pkg = JSON.parse((await import('fs')).readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
  console.log(`weixin-bot v${pkg.version}`);
  process.exit(0);
}

if (args.help) {
  console.log(`
  🤖 weixin-bot — One-command WeChat AI Bot

  Usage:
    npx wx-ai-bot                    Interactive setup (first time)
    npx wx-ai-bot --echo             Echo mode (no AI, just replies)
    npx wx-ai-bot --api-key sk-xxx   Use OpenAI with this key
    npx wx-ai-bot --provider ollama  Use local Ollama
    npx wx-ai-bot --login            Force re-login (new QR code)

  Options:
    --provider <name>   AI provider: openai | claude | gemini | ollama | codex | claude-code | openclaw | custom
    --api-key <key>     API key for the provider
    --base-url <url>    Custom API base URL (for proxies or custom endpoints)
    --model <name>      Model name (default: auto per provider)
    --echo              Echo mode — no AI, just echoes messages back
    --login             Force re-login even if token exists
    -h, --help          Show this help
    -v, --version       Show version

  Environment Variables:
    OPENAI_API_KEY      OpenAI API key
    ANTHROPIC_API_KEY   Claude API key
    GEMINI_API_KEY      Gemini API key

  Examples:
    npx wx-ai-bot --provider openai --api-key sk-xxx --model gpt-4o
    npx wx-ai-bot --provider claude --api-key sk-ant-xxx
    npx wx-ai-bot --provider ollama --model llama3
    npx wx-ai-bot --provider codex                  # OpenAI Codex agent (local CLI)
    npx wx-ai-bot --provider claude-code             # Claude Code agent (local CLI)
    npx wx-ai-bot --provider custom --base-url https://my-proxy.com/v1 --api-key xxx
    npx wx-ai-bot --provider openclaw                # OpenClaw AI gateway (auto-detect local)
    OPENAI_API_KEY=sk-xxx npx wx-ai-bot
`);
  process.exit(0);
}

async function main() {
  console.log('\n  🤖 weixin-bot — One-command WeChat AI Bot\n');

  let config = loadConfigWithKey();

  // Merge CLI args into config
  if (args['api-key'])  config.apiKey = args['api-key'];
  if (args['base-url']) config.baseUrl = args['base-url'];
  if (args['model'])    config.model = args['model'];
  if (args['provider']) config.provider = args['provider'];
  if (args['echo'])     config.provider = 'echo';

  // Check env vars
  if (!config.apiKey) {
    config.apiKey = process.env.OPENAI_API_KEY
      || process.env.ANTHROPIC_API_KEY
      || process.env.GEMINI_API_KEY
      || '';
    if (process.env.ANTHROPIC_API_KEY && !config.provider) config.provider = 'claude';
    if (process.env.GEMINI_API_KEY && !config.provider) config.provider = 'gemini';
  }

  // Interactive setup if no provider configured
  if (!config.provider && !config.apiKey) {
    config = await interactiveSetup(config);
    saveConfig(config);
  }

  // Default provider
  if (!config.provider) config.provider = 'openai';

  await startBot(config, { forceLogin: args.login });
}

main().catch((err) => {
  console.error('\n  ❌ Fatal:', err.message);
  process.exit(1);
});
