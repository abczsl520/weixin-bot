/**
 * Multi-provider AI chat — OpenAI, Claude, Gemini, Ollama, Codex, Claude Code, custom.
 * All use OpenAI-compatible chat/completions format (Claude via Messages API).
 * Codex and Claude Code use local agent CLIs.
 */
import { execSync } from 'node:child_process';

const MAX_HISTORY = 20;
const conversations = new Map();

function getHistory(userId) {
  if (!conversations.has(userId)) conversations.set(userId, []);
  return conversations.get(userId);
}

function addMessage(userId, role, content) {
  const h = getHistory(userId);
  h.push({ role, content });
  if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY);
}

const SYSTEM_PROMPT = 'You are a helpful WeChat bot assistant. Reply concisely in the same language the user uses. Keep responses under 500 characters when possible.';

/**
 * Chat with AI. Returns reply text.
 */
export async function chat(config, userId, userText) {
  if (config.provider === 'echo') {
    return userText;
  }

  addMessage(userId, 'user', userText);
  const history = getHistory(userId);

  let reply;

  if (config.provider === 'codex') {
    reply = await callCodex(config, userText);
  } else if (config.provider === 'claude-code') {
    reply = await callClaudeCode(config, userText);
  } else if (config.provider === 'claude' && config.baseUrl?.includes('anthropic.com')) {
    reply = await callClaude(config, history);
  } else {
    reply = await callOpenAICompat(config, history);
  }

  addMessage(userId, 'assistant', reply);
  return reply;
}

async function callOpenAICompat(config, history) {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`AI API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '(no response)';
}

async function callClaude(config, history) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: history,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '(no response)';
}

/**
 * Call OpenAI Codex CLI in quiet mode.
 * Requires: npm i -g @openai/codex + OPENAI_API_KEY env var
 */
async function callCodex(config, userText) {
  const codexPath = findBinary('codex');
  if (!codexPath) {
    throw new Error('Codex CLI not found. Install: npm i -g @openai/codex');
  }

  const env = { ...process.env };
  if (config.apiKey) env.OPENAI_API_KEY = config.apiKey;

  try {
    const result = execSync(
      `${codexPath} -q "${escapeShell(userText)}"`,
      {
        encoding: 'utf-8',
        timeout: 120000,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    return result.trim() || '(Codex returned empty response)';
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    throw new Error(`Codex error: ${stderr.slice(0, 200) || err.message}`);
  }
}

/**
 * Call Claude Code CLI in print mode (non-interactive).
 * Requires: npm i -g @anthropic-ai/claude-code + ANTHROPIC_API_KEY env var
 */
async function callClaudeCode(config, userText) {
  const claudePath = findBinary('claude');
  if (!claudePath) {
    throw new Error('Claude Code CLI not found. Install: npm i -g @anthropic-ai/claude-code');
  }

  const env = { ...process.env };
  if (config.apiKey) env.ANTHROPIC_API_KEY = config.apiKey;
  // Clear env vars that cause hangs in pipe mode
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;

  const model = config.model || 'sonnet';

  try {
    const result = execSync(
      `${claudePath} -p "${escapeShell(userText)}" --model ${model} --dangerously-skip-permissions`,
      {
        encoding: 'utf-8',
        timeout: 120000,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    return result.trim() || '(Claude Code returned empty response)';
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    throw new Error(`Claude Code error: ${stderr.slice(0, 200) || err.message}`);
  }
}

function findBinary(name) {
  try {
    return execSync(`which ${name}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function escapeShell(str) {
  return str.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

/** Check if a provider's CLI is available */
export function checkProviderReady(provider) {
  if (provider === 'codex') {
    return { ready: !!findBinary('codex'), install: 'npm i -g @openai/codex' };
  }
  if (provider === 'claude-code') {
    return { ready: !!findBinary('claude'), install: 'npm i -g @anthropic-ai/claude-code' };
  }
  return { ready: true };
}

/** Clear conversation history for a user */
export function clearHistory(userId) {
  conversations.delete(userId);
}
