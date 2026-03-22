/**
 * Multi-provider AI chat — OpenAI, Claude, Gemini, Ollama, custom.
 * All use OpenAI-compatible chat/completions format (Claude via Messages API).
 */

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

  if (config.provider === 'claude' && config.baseUrl?.includes('anthropic.com')) {
    // Native Claude Messages API
    reply = await callClaude(config, history);
  } else {
    // OpenAI-compatible (OpenAI, Gemini, Ollama, custom)
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

/** Clear conversation history for a user */
export function clearHistory(userId) {
  conversations.delete(userId);
}
