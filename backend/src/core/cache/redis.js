'use strict';

const Redis = require('ioredis');
const { getLogger } = require('../logger/logger');

let client = null;
let enabled = false;

function initRedis(config) {
  if (!config.REDIS_URL) {
    getLogger().warn('REDIS_URL not set — cache layer disabled');
    return null;
  }
  client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });
  client.on('error', (err) => {
    getLogger().error({ err }, 'Redis connection error');
  });
  enabled = true;
  return client;
}

function getRedis() {
  return client;
}

function isRedisEnabled() {
  return enabled && client !== null;
}

async function ping() {
  if (!isRedisEnabled()) return false;
  try {
    if (client.status !== 'ready') await client.connect();
    const res = await client.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

async function get(key) {
  if (!isRedisEnabled()) return null;
  return client.get(key);
}

async function set(key, value, ttlSeconds) {
  if (!isRedisEnabled()) return false;
  if (ttlSeconds) return client.set(key, value, 'EX', ttlSeconds);
  return client.set(key, value);
}

async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
    enabled = false;
  }
}

module.exports = {
  initRedis,
  getRedis,
  isRedisEnabled,
  ping,
  get,
  set,
  closeRedis
};
