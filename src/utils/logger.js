import pino from 'pino';
import path from 'path';
import fs from 'fs';

/**
 * Create logger instance
 * @param {object} options - Logger options
 * @returns {pino.Logger} Logger instance
 */
export function createLogger(options = {}) {
  const logLevel = options.level || process.env.LOG_LEVEL || 'info';
  const logFile = options.file;

  const config = {
    level: logLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  };

  // If log file specified, write to file instead
  if (logFile) {
    const dir = path.dirname(logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return pino({
      level: logLevel
    }, pino.destination(logFile));
  }

  return pino(config);
}

/**
 * Get default logger for xSwarm
 * @returns {pino.Logger} Logger instance
 */
export function getDefaultLogger() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const logDir = path.join(homeDir, '.xswarm', 'logs');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'xswarm.log');

  return createLogger({ file: logFile });
}
