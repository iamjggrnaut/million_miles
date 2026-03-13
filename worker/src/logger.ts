const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[LOG_LEVEL as keyof typeof LEVELS] ?? 1;

function log(level: keyof typeof LEVELS, message: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < currentLevel) return;
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const out = level === 'error' ? console.error : console.log;
  out(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
