import { spawn } from 'node:child_process';
import { logger } from './logger.js';

const ENABLED = process.env.LOCAL_TRANSLATE_ENABLED !== 'false';
const CMD = process.env.TRANSLATE_CMD ?? 'argos-translate';
const MAX_CHARS = 2000;

const cache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string): string {
  return `${from}|${to}|${text}`;
}

/**
 * Translate text using local Argos Translate CLI (ja -> en / ja -> ru).
 * No API keys. Requires: pip install argos-translate; argospm install translate-ja_en; for ru: translate-ja_ru or translate-en_ru (pivot).
 * Falls back to original text if disabled or CLI fails.
 */
export async function translate(
  text: string | null | undefined,
  fromLang = 'ja',
  toLang = 'en'
): Promise<string | null> {
  if (text == null || !String(text).trim()) return null;
  const trimmed = String(text).trim().slice(0, MAX_CHARS);
  if (!trimmed) return null;

  if (!ENABLED) return null;

  const key = cacheKey(trimmed, fromLang, toLang);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const TRANSLATE_TIMEOUT_MS = Number(process.env.TRANSLATE_TIMEOUT_MS) || 60_000;

  return new Promise((resolve) => {
    const args = ['--from-lang', fromLang, '--to-lang', toLang];
    const proc = spawn(CMD, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let out = '';
    let err = '';
    let settled = false;
    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      try {
        proc.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      if (result !== null) cache.set(key, result);
      resolve(result);
    };

    const timeout = setTimeout(() => {
      logger.warn('Translate CLI timeout', { fromLang, toLang, timeoutMs: TRANSLATE_TIMEOUT_MS });
      finish(null);
    }, TRANSLATE_TIMEOUT_MS);

    proc.stdout?.on('data', (chunk: Buffer) => { out += chunk.toString(); });
    proc.stderr?.on('data', (chunk: Buffer) => { err += chunk.toString(); });

    proc.on('error', (e) => {
      logger.warn('Translate CLI spawn failed', { cmd: CMD, error: String(e) });
      clearTimeout(timeout);
      finish(null);
    });
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      const result = out.trim();
      if (code === 0 && result && result !== trimmed) {
        cache.set(key, result);
        resolve(result);
      } else {
        if (code !== 0) logger.warn('Translate CLI exit non-zero', { code, fromLang, toLang, stderr: err.slice(0, 300) });
        resolve(null);
      }
    });

    proc.stdin?.write(trimmed, 'utf8', () => {
      proc.stdin?.end();
    });
  });
}

/** Translate Japanese text to English and Russian. For ru, tries ja->ru then fallback ja->en->ru. */
export async function translateJaToEnAndRu(
  text: string | null | undefined
): Promise<{ en: string | null; ru: string | null }> {
  if (text == null || !String(text).trim()) return { en: null, ru: null };
  const [en, ruDirect] = await Promise.all([
    translate(text, 'ja', 'en'),
    translate(text, 'ja', 'ru'),
  ]);
  const ru =
    ruDirect && ruDirect !== String(text).trim()
      ? ruDirect
      : en
        ? await translate(en, 'en', 'ru')
        : null;
  if (!en && !ru) logger.debug('Translation unavailable', { textLen: String(text).length });
  return { en: en ?? null, ru: ru ?? null };
}
