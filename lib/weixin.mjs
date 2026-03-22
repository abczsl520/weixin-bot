/**
 * WeChat iLink Bot API — minimal client for weixin-bot CLI.
 * Extracted from weixin-bot-sdk.
 */
import crypto from 'node:crypto';

const BASE_URL = 'https://ilinkai.weixin.qq.com';
const POLL_TIMEOUT = 35000;
const API_TIMEOUT = 15000;

function randomUin() {
  return Buffer.from(String(crypto.randomBytes(4).readUInt32BE(0)), 'utf-8').toString('base64');
}

function headers(token, body) {
  const h = {
    'Content-Type': 'application/json',
    'AuthorizationType': 'ilink_bot_token',
    'X-WECHAT-UIN': randomUin(),
  };
  if (body) h['Content-Length'] = String(Buffer.byteLength(body, 'utf-8'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function post(baseUrl, endpoint, body, token, timeout = API_TIMEOUT) {
  const url = new URL(endpoint, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
  const bodyStr = JSON.stringify({ ...body, base_info: { channel_version: '1.0.0' } });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url.toString(), {
      method: 'POST', headers: headers(token, bodyStr), body: bodyStr, signal: ctrl.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text);
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') return null;
    throw err;
  }
}

// ── Auth ──

export async function getQrCode(baseUrl = BASE_URL) {
  const url = `${baseUrl}/ilink/bot/get_bot_qrcode?bot_type=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`QR code fetch failed: ${res.status}`);
  return res.json();
}

export async function pollQrStatus(qrcode, baseUrl = BASE_URL) {
  const url = `${baseUrl}/ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), POLL_TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: { 'iLink-App-ClientVersion': '1' }, signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`QR status failed: ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') return { status: 'wait' };
    throw err;
  }
}

// ── Messages ──

export async function getUpdates(baseUrl, token, buf = '') {
  const resp = await post(baseUrl, 'ilink/bot/getupdates', { get_updates_buf: buf }, token, POLL_TIMEOUT);
  return resp || { ret: 0, msgs: [], get_updates_buf: buf };
}

export async function sendText(baseUrl, token, toUserId, text, contextToken) {
  const clientId = `wb-${crypto.randomBytes(8).toString('hex')}`;
  await post(baseUrl, 'ilink/bot/sendmessage', {
    msg: {
      from_user_id: '', to_user_id: toUserId, client_id: clientId,
      message_type: 2, message_state: 2, context_token: contextToken,
      item_list: [{ type: 1, text_item: { text } }],
    },
  }, token);
  return clientId;
}

export async function sendTyping(baseUrl, token, userId, contextToken) {
  try {
    const cfg = await post(baseUrl, 'ilink/bot/getconfig', {
      ilink_user_id: userId, context_token: contextToken,
    }, token, 10000);
    if (cfg?.typing_ticket) {
      await post(baseUrl, 'ilink/bot/sendtyping', {
        ilink_user_id: userId, typing_ticket: cfg.typing_ticket, status: 1,
      }, token, 10000);
    }
  } catch { /* best effort */ }
}

// ── Helpers ──

export function extractText(msg) {
  let text = '';
  let mediaLabel = '';

  for (const item of msg.item_list || []) {
    if (item.type === 1 && item.text_item?.text) {
      text = item.text_item.text;
    } else if (item.type === 3 && item.voice_item?.text) {
      if (!text) text = item.voice_item.text;
      if (!mediaLabel) mediaLabel = '[语音]';
    } else if (item.type === 2 && !mediaLabel) {
      mediaLabel = '[图片]';
    } else if (item.type === 4 && !mediaLabel) {
      mediaLabel = `[文件] ${item.file_item?.file_name || ''}`;
    } else if (item.type === 5 && !mediaLabel) {
      mediaLabel = '[视频]';
    }
  }

  return text || mediaLabel || '';
}
