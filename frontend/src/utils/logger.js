/**
 * Frontend logger. Logs only when VITE_LOG_LEVEL allows (default: info in dev, warn in prod).
 * Set VITE_LOG_LEVEL=debug in .env for verbose logs.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
const minLevel = levels[envLevel] ?? (import.meta.env.DEV ? levels.info : levels.warn);

const ts = () => new Date().toISOString();

const log = (level, ...args) => {
  if (levels[level] > minLevel) return;
  const prefix = `[${ts()}] [${level.toUpperCase()}]`;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(prefix, ...args);
};

export const logger = {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args),
};

export default logger;
