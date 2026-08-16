'use strict';

function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error('Missing required env: ' + name);
  }
  return String(v).trim();
}

function loadConfig() {
  return {
    HOST: process.env.HOST || '127.0.0.1',
    PORT: Number(process.env.PORT || 3003),
    DATABASE_URL: required('DATABASE_URL'),
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REMEMBER_EXPIRES_IN: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
  };
}

module.exports = { loadConfig };
