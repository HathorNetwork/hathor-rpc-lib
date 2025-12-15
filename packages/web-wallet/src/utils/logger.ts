/**
 * Simple logging utility with configurable log levels.
 * In production, you can set LOG_LEVEL to 'error' or 'warn' to reduce console noise.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

// Set to 'warn' or 'error' in production to reduce console noise
const CURRENT_LOG_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};

/**
 * Create a scoped logger for a specific module/component.
 * This helps identify where log messages are coming from.
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(`[${scope}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(`[${scope}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(`[${scope}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(`[${scope}] ${message}`, ...args),
  };
}
