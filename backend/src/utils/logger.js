/**
 * Simple logger with timestamps and levels.
 * In production you can replace with winston/pino.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const minLevel = levels[process.env.LOG_LEVEL] ?? levels.info;

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
