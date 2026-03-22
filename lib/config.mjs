/**
 * Config persistence — ~/.weixin-bot/config.json
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const DATA_DIR = path.join(os.homedir(), '.weixin-bot');
export const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
export const TOKEN_FILE = path.join(DATA_DIR, 'token.json');

export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

export function saveConfig(config) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  try { fs.chmodSync(CONFIG_FILE, 0o600); } catch {}
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
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2));
  try { fs.chmodSync(TOKEN_FILE, 0o600); } catch {}
}
