/**
 * Main bot loop — login + poll + AI reply.
 */
import { loadToken, saveToken } from './config.mjs';
import { getQrCode, pollQrStatus, getUpdates, sendText, sendTyping, extractText } from './weixin.mjs';
import { chat, clearHistory } from './ai.mjs';

const BASE_URL = 'https://ilinkai.weixin.qq.com';

async function login(forceLogin) {
  if (!forceLogin) {
    const saved = loadToken();
    if (saved?.token) {
      console.log(`  ✅ Using saved session (Bot: ${saved.accountId || 'unknown'})\n`);
      return saved;
    }
  }

  console.log('  🔐 WeChat QR Login\n');
  const qrResp = await getQrCode();
  let qrcode = qrResp.qrcode;

  console.log('  📱 Scan with WeChat:');
  console.log(`  ${qrResp.qrcode_img_content}\n`);
  console.log('  Waiting for scan...');

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
      console.log(`  📱 New QR: ${newQr.qrcode_img_content}\n`);
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

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// Slash commands
const COMMANDS = {
  '/clear': (userId) => { clearHistory(userId); return '🗑️ Conversation cleared.'; },
  '/help': () => `Commands:
/clear — Clear conversation history
/help — Show this help
/ping — Check if bot is alive`,
  '/ping': () => '🏓 Pong!',
};

export async function startBot(config, { forceLogin = false } = {}) {
  const session = await login(forceLogin);
  const { token, baseUrl } = session;

  const providerLabel = config.provider === 'echo' ? 'Echo'
    : `${config.provider} (${config.model || 'default'})`;

  console.log(`  🤖 weixin-bot is running!`);
  console.log(`  AI: ${providerLabel}`);
  console.log(`  Press Ctrl+C to stop.\n`);
  console.log('  ─'.repeat(30) + '\n');

  let running = true;
  let buf = '';
  let msgCount = 0;

  process.on('SIGINT', () => {
    console.log('\n\n  👋 Bye!');
    running = false;
    setTimeout(() => process.exit(0), 500);
  });

  while (running) {
    try {
      const resp = await getUpdates(baseUrl, token, buf);
      if (resp.get_updates_buf) buf = resp.get_updates_buf;

      // Session expired
      if (resp.errcode === -14) {
        console.log('\n  ❌ Session expired. Run again with --login to re-authenticate.');
        process.exit(1);
      }

      for (const msg of resp.msgs || []) {
        if (msg.message_type !== 1) continue; // Only user messages

        const from = msg.from_user_id;
        const text = extractText(msg);
        const ctx = msg.context_token;
        msgCount++;

        console.log(`  📩 [${formatTime()}] #${msgCount}`);
        console.log(`     From: ${from}`);
        console.log(`     Text: ${text}`);

        // Check slash commands
        const cmd = COMMANDS[text.trim().toLowerCase()];
        if (cmd) {
          const reply = typeof cmd === 'function' ? cmd(from) : cmd;
          await sendText(baseUrl, token, from, reply, ctx);
          console.log(`     ✅ ${reply.split('\n')[0]}\n`);
          continue;
        }

        // Skip non-text for AI (images, files, etc.)
        if (text.startsWith('[') && text.endsWith(']')) {
          await sendText(baseUrl, token, from, `收到${text}，目前仅支持文字对话~`, ctx);
          console.log(`     ⏭️ Skipped media\n`);
          continue;
        }

        // Send typing indicator
        sendTyping(baseUrl, token, from, ctx);

        // Call AI
        console.log(`     🤔 Thinking...`);
        const startTime = Date.now();

        try {
          const reply = await chat(config, from, text);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

          // Split long messages (WeChat has limits)
          const chunks = splitMessage(reply, 1800);
          for (const chunk of chunks) {
            await sendText(baseUrl, token, from, chunk, ctx);
          }

          const preview = reply.length > 80 ? reply.slice(0, 80) + '…' : reply;
          console.log(`     ✅ [${elapsed}s] ${preview}\n`);
        } catch (aiErr) {
          console.log(`     ❌ AI error: ${aiErr.message}\n`);
          await sendText(baseUrl, token, from, '抱歉，AI 处理出错了，请稍后再试~', ctx).catch(() => {});
        }
      }
    } catch (err) {
      if (!running) break;
      console.error(`  ⚠️ Poll error: ${err.message}, retrying in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
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
    if (splitAt < maxLen * 0.3) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, '');
  }
  return chunks;
}
