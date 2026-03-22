/**
 * Interactive first-time setup via stdin prompts.
 * Zero dependencies — uses raw readline.
 */
import readline from 'node:readline';
import { checkProviderReady } from './ai.mjs';

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function interactiveSetup(config) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('  First time? Let\'s set up your AI backend.\n');
  console.log('  Providers:');
  console.log('    1) OpenAI        (GPT-4o, GPT-4o-mini, etc.)');
  console.log('    2) Claude        (Anthropic API)');
  console.log('    3) Gemini        (Google)');
  console.log('    4) Ollama        (Local, free)');
  console.log('    5) Codex         (OpenAI Codex agent — local CLI)');
  console.log('    6) Claude Code   (Anthropic agent — local CLI)');
  console.log('    7) OpenClaw      (OpenClaw AI gateway)');
  console.log('    8) Custom        (any OpenAI-compatible API)');
  console.log('    9) Echo mode     (no AI, just echo messages back)');
  console.log();

  const choice = await ask(rl, '  Choose provider [1-9]: ');

  const providers = {
    '1': 'openai', '2': 'claude', '3': 'gemini', '4': 'ollama',
    '5': 'codex', '6': 'claude-code', '7': 'openclaw', '8': 'custom', '9': 'echo',
  };
  config.provider = providers[choice.trim()] || 'openai';

  if (config.provider === 'echo') {
    rl.close();
    console.log('\n  ✅ Echo mode — no AI needed.\n');
    return config;
  }

  // Check CLI availability for agent providers
  if (config.provider === 'codex' || config.provider === 'claude-code') {
    const check = checkProviderReady(config.provider);
    if (!check.ready) {
      console.log(`\n  ⚠️  ${config.provider} CLI not found.`);
      console.log(`  Install: ${check.install}\n`);
      const proceed = await ask(rl, '  Continue anyway? (y/n): ');
      if (proceed.trim().toLowerCase() !== 'y') {
        rl.close();
        throw new Error(`${config.provider} CLI not installed`);
      }
    }
  }

  if (config.provider === 'codex') {
    config.apiKey = (await ask(rl, '  OpenAI API key (or press Enter if set in env): ')).trim()
      || process.env.OPENAI_API_KEY || '';
    rl.close();
    console.log('\n  ✅ Codex agent configured.\n');
    return config;
  }

  if (config.provider === 'claude-code') {
    config.apiKey = (await ask(rl, '  Anthropic API key (or press Enter if set in env): ')).trim()
      || process.env.ANTHROPIC_API_KEY || '';
    config.model = (await ask(rl, '  Model [sonnet]: ')).trim() || 'sonnet';
    rl.close();
    console.log('\n  ✅ Claude Code agent configured.\n');
    return config;
  }

  if (config.provider === 'ollama') {
    config.baseUrl = 'http://localhost:11434/v1';
    config.model = (await ask(rl, '  Ollama model [llama3]: ')).trim() || 'llama3';
    config.apiKey = 'ollama';
    rl.close();
    console.log('\n  ✅ Ollama configured. Make sure Ollama is running!\n');
    return config;
  }

  if (config.provider === 'openclaw') {
    const defaultUrl = 'http://localhost:3000/v1';
    config.baseUrl = (await ask(rl, `  OpenClaw API URL [${defaultUrl}]: `)).trim() || defaultUrl;
    config.apiKey = (await ask(rl, '  API key (or press Enter if not required): ')).trim() || 'openclaw';
    config.model = (await ask(rl, '  Model [claude-sonnet-4-20250514]: ')).trim() || 'claude-sonnet-4-20250514';
    rl.close();
    console.log('\n  ✅ OpenClaw configured.\n');
    return config;
  }

  if (config.provider === 'custom') {
    config.baseUrl = (await ask(rl, '  API base URL: ')).trim();
    config.apiKey = (await ask(rl, '  API key: ')).trim();
    config.model = (await ask(rl, '  Model name [gpt-4o-mini]: ')).trim() || 'gpt-4o-mini';
    rl.close();
    console.log('\n  ✅ Custom provider configured.\n');
    return config;
  }

  // OpenAI / Claude / Gemini
  const defaults = {
    openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', keyName: 'OpenAI' },
    claude: { url: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514', keyName: 'Anthropic' },
    gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash', keyName: 'Gemini' },
  };
  const d = defaults[config.provider];

  config.apiKey = (await ask(rl, `  ${d.keyName} API key: `)).trim();
  config.model = (await ask(rl, `  Model [${d.model}]: `)).trim() || d.model;
  config.baseUrl = d.url;

  rl.close();
  console.log(`\n  ✅ ${d.keyName} configured.\n`);
  return config;
}
