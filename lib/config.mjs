/**
 * Config persistence — ~/.weixin-bot/config.json
 * Security: all sensitive files are chmod 600, API keys are masked in logs.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export const DATA_DIR = path.join(os.homedir(), '.weixin-bot');
export const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
export const TOKEN_FILE = path.join(DATA_DIR, 'token.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try { fs.chmodSync(DATA_DIR, 0o700); } catch {}
}

export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

export function saveConfig(config) {
  ensureDir();
  // Never persist raw API keys to disk — store encrypted
  const safe = { ...config };
  if (safe.apiKey) {
    safe._encKey = encryptKey(safe.apiKey);
    delete safe.apiKey;
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(safe, null, 2));
  try { fs.chmodSync(CONFIG_FILE, 0o600); } catch {}
}

export function loadConfigWithKey() {
  const config = loadConfig();
  if (config._encKey) {
    try {
      config.apiKey = decryptKey(config._encKey);
    } catch {
      config.apiKey = '';
    }
    delete config._encKey;
  }
  return config;
}

export function loadToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

export function saveToken(token) {
  ensureDir();
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2));
  try { fs.chmodSync(TOKEN_FILE, 0o600); } catch {}
}

/** Mask API key for safe logging: sk-abc...xyz */
export function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 6) + '...' + key.slice(-3);
}

// ── Simple key obfuscation (not military-grade, but prevents plaintext on disk) ──

const MACHINE_ID = (() => {
  try {
    return crypto.createHash('sha256')
      .update(os.hostname() + os.homedir() + os.userInfo().username)
      .digest();
  } catch {
    return crypto.createHash('sha256').update('weixin-bot-default').digest();
  }
})();

function encryptKey(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', MACHINE_ID, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
}

function decryptKey(encoded) {
  const parts = encoded.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted key format. Delete ~/.weixin-bot/config.json and reconfigure.');
  const [ivHex, encHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-cbc', MACHINE_ID, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf-8');
}
