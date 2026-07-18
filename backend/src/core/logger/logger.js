'use strict';

const pino = require('pino');

let loggerInstance = null;

function createLogger(config) {
  const isDev = config.APP_ENV === 'local' || config.NODE_ENV === 'development';
  loggerInstance = pino({
    level: config.LOG_LEVEL,
    base: {
      service: 'iflux-api',
      env: config.APP_ENV
    },
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' }
          }
        }
      : {})
  });
  return loggerInstance;
}

function getLogger() {
  if (!loggerInstance) {
    throw new Error('Logger not initialized');
  }
  return loggerInstance;
}

module.exports = { createLogger, getLogger };
