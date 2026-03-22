/**
 * Main bot loop — login + poll + AI reply + auto-reconnect.
 */
import { loadToken, saveToken, maskKey } from './config.mjs';
import { getQrCode, pollQrStatus, getUpdates, sendText, sendTyping, extractText } from './weixin.mjs';
import { chat, clearHistory } from './ai.mjs';
import { renderQR } from './qr.mjs';

const BASE_URL = 'https://ilinkai.weixin.qq.com';
const MAX_RECONNECT = 5;
const RECONNECT_DELAY = [3000, 5000, 10000, 20000, 30000];

async function login(forceLogin) {
  if (!forceLogin) {
    const saved = loadToken();
    if (saved?.token) {
      console.log(`  ✅ Using saved session (Bot: ${saved.accountId || 'unknown'})`);
      console.log(`     Saved at: ${saved.savedAt || 'unknown'}\n`);
      return saved;
    }
  }

  console.log('  🔐 WeChat QR Login\n');
  const qrResp = await getQrCode();
  let qrcode = qrResp.qrcode;

  displayQR(qrResp.qrcode_img_content);

  const deadline = Date.now() + 5 * 60_000;
  let refreshCount = 0;

  while (Date.now() < deadline) {
    const status = await pollQrStatus(qrcode);

    if (status.status === 'scaned') {
      console.log('  👀 Scanned! Confirm on your phone...');
    }

    if (status.status === 'expired') {
      if (++refreshCount > 3) throw new Error('QR expired 3 times');
      console.log(`  ⏳ QR expired, refreshing (${refreshCount}/3)...`);
      const newQr = await getQrCode();
      qrcode = newQr.qrcode;
      displayQR(newQr.qrcode_img_content);
    }

    if (status.status === 'confirmed') {
      const session = {
        token: status.bot_token,
        baseUrl: status.baseurl || BASE_URL,
        accountId: status.ilink_bot_id,
        userId: status.ilink_user_id,
        savedAt: new Date().toISOString(),
      };
      saveToken(session);
      console.log(`  ✅ Login successful! Bot ID: ${session.accountId}\n`);
      return session;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  throw new Error('Login timeout');
}

function displayQR(url) {
  if (!url) {
    console.log('  ⚠️ No QR URL received\n');
    return;
  }

  console.log('  📱 Scan with WeChat:\n');

  // Try terminal QR rendering
  const qrArt = renderQR(url);
  if (qrArt) {
    // Indent each line
    for (const line of qrArt.split('\n')) {
      console.log('  ' + line);
    }
    console.log();
  }

  // Always show URL as fallback
  console.log(`  🔗 Or open: ${url}\n`);
  console.log('  Waiting for scan...');
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// Slash commands
const COMMANDS = {
  '/clear': (userId) => { clearHistory(userId); return '🗑️ Conversation cleared.'; },
  '/help': () => `Commands:
/clear — Clear conversation history
/help — Show this help
/ping — Check if bot is alive
/status — Show bot status`,
  '/ping': () => '🏓 Pong!',
};

export async function startBot(config, { forceLogin = false } = {}) {
  const session = await login(forceLogin);

  const providerLabel = config.provider === 'echo' ? 'Echo'
    : `${config.provider} (${config.model || 'default'})`;

  // Mask sensitive info in logs
  const keyDisplay = config.apiKey ? maskKey(config.apiKey) : 'env/none';

  console.log(`  🤖 wx-ai-bot is running!`);
  console.log(`  AI: ${providerLabel}`);
  console.log(`  Key: ${keyDisplay}`);
  console.log(`  Press Ctrl+C to stop.\n`);
  console.log('  ─'.repeat(30) + '\n');

  // Add /status command dynamically
  const startTime = Date.now();
  let totalMessages = 0;
  COMMANDS['/status'] = () => {
    const uptime = Math.floor((Date.now() - startTime) / 60000);
    return `🤖 wx-ai-bot status\nUptime: ${uptime}m\nMessages: ${totalMessages}\nAI: ${providerLabel}`;
  };

  await pollLoop(config, session, { startTime, onMessage: () => totalMessages++ });
}

async function pollLoop(config, session, ctx) {
  let { token, baseUrl } = session;
  let running = true;
  let buf = '';
  let reconnectCount = 0;

  process.on('SIGINT', () => {
    console.log('\n\n  👋 Bye!');
    running = false;
    setTimeout(() => process.exit(0), 500);
  });

  while (running) {
    try {
      const resp = await getUpdates(baseUrl, token, buf);
      if (resp.get_updates_buf) buf = resp.get_updates_buf;

      // Session expired — try auto-reconnect
      if (resp.errcode === -14 || resp.errcode === -13) {
        console.log(`\n  ⚠️ Session expired (code: ${resp.errcode})`);

        if (reconnectCount >= MAX_RECONNECT) {
          console.log('  ❌ Max reconnect attempts reached. Run with --login to re-authenticate.');
          process.exit(1);
        }

        reconnectCount++;
        const delay = RECONNECT_DELAY[Math.min(reconnectCount - 1, RECONNECT_DELAY.length - 1)];
        console.log(`  🔄 Reconnecting (${reconnectCount}/${MAX_RECONNECT}) in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));

        try {
          const newSession = await login(true);
          token = newSession.token;
          baseUrl = newSession.baseUrl;
          buf = '';
          reconnectCount = 0;
          console.log('  ✅ Reconnected!\n');
        } catch (loginErr) {
          console.error(`  ❌ Reconnect failed: ${loginErr.message}`);
        }
        continue;
      }

      // Reset reconnect counter on successful poll
      reconnectCount = 0;

      for (const msg of resp.msgs || []) {
        if (msg.message_type !== 1) continue;

        const from = msg.from_user_id;
        const text = extractText(msg);
        const ctx_token = msg.context_token;
        ctx.onMessage();

        // Sanitize user input for logging (prevent log injection)
        const safeText = text.replace(/[\n\r]/g, ' ').slice(0, 200);
        const safeFrom = from.replace(/[\n\r]/g, '');

        console.log(`  📩 [${formatTime()}] From: ${safeFrom}`);
        console.log(`     Text: ${safeText}`);

        // Check slash commands
        const cmdKey = text.trim().toLowerCase();
        const cmd = COMMANDS[cmdKey];
        if (cmd) {
          const reply = typeof cmd === 'function' ? cmd(from) : cmd;
          await sendText(baseUrl, token, from, reply, ctx_token);
          console.log(`     ✅ ${reply.split('\n')[0]}\n`);
          continue;
        }

        // Skip non-text for AI (media labels from extractText)
        const mediaLabels = ['[图片]', '[视频]', '[语音]'];
        const isMedia = mediaLabels.some(l => text === l) || text.startsWith('[文件]');
        if (isMedia) {
          await sendText(baseUrl, token, from, `收到${text}，目前仅支持文字对话~`, ctx_token);
          console.log(`     ⏭️ Skipped media\n`);
          continue;
        }

        // Rate limit check (simple per-user cooldown)
        if (isRateLimited(from)) {
          await sendText(baseUrl, token, from, '请稍等，消息太频繁了~', ctx_token);
          console.log(`     ⏳ Rate limited\n`);
          continue;
        }

        sendTyping(baseUrl, token, from, ctx_token);

        console.log(`     🤔 Thinking...`);
        const startTime = Date.now();

        try {
          const reply = await chat(config, from, text);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

          const chunks = splitMessage(reply, 1800);
          for (const chunk of chunks) {
            await sendText(baseUrl, token, from, chunk, ctx_token);
          }

          const preview = reply.length > 80 ? reply.slice(0, 80) + '…' : reply;
          console.log(`     ✅ [${elapsed}s] ${preview}\n`);
        } catch (aiErr) {
          console.log(`     ❌ AI error: ${aiErr.message}\n`);
          await sendText(baseUrl, token, from, '抱歉，AI 处理出错了，请稍后再试~', ctx_token).catch(() => {});
        }
      }
    } catch (err) {
      if (!running) break;
      console.error(`  ⚠️ Poll error: ${err.message}, retrying in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// ── Rate limiting ──

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 3000; // 3 seconds between messages per user
const RATE_LIMIT_MAX = 10; // max 10 messages per minute

function isRateLimited(userId) {
  const now = Date.now();
  let entry = rateLimits.get(userId);

  // Periodic cleanup: remove stale entries
  if (rateLimits.size > 500) {
    for (const [id, e] of rateLimits) {
      if (now - e.last > 300000) rateLimits.delete(id); // 5 min stale
    }
  }

  if (!entry) {
    entry = { last: now, count: 1, windowStart: now };
    rateLimits.set(userId, entry);
    return false;
  }

  // Per-minute limit
  if (now - entry.windowStart > 60000) {
    entry.windowStart = now;
    entry.count = 0;
  }
  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) return true;

  // Cooldown between messages
  if (now - entry.last < RATE_LIMIT_WINDOW) return true;

  entry.last = now;
  return false;
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at newline
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt < maxLen * 0.3) {
      // Try to split at space or CJK boundary
      splitAt = remaining.lastIndexOf(' ', maxLen);
      if (splitAt < maxLen * 0.3) splitAt = maxLen;
    }
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, '');
  }
  return chunks;
}
