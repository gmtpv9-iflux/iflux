'use strict';

const { getLogger } = require('../logger/logger');
const { isRedisEnabled } = require('../cache/redis');

const queues = new Map();

function initQueue(config) {
  if (!config.QUEUE_ENABLED) {
    getLogger().info('Queue framework disabled (QUEUE_ENABLED=false)');
    return;
  }
  if (!isRedisEnabled()) {
    getLogger().warn('Queue enabled but Redis unavailable — queue shell only');
  }
  getLogger().info('Queue framework initialized (bootstrap shell)');
}

function registerQueue(name, handler) {
  if (queues.has(name)) {
    throw new Error(`Queue "${name}" already registered`);
  }
  queues.set(name, { name, handler, pending: [] });
  getLogger().debug({ queue: name }, 'Queue registered');
}

async function enqueue(name, payload) {
  const q = queues.get(name);
  if (!q) throw new Error(`Queue "${name}" not registered`);
  q.pending.push({ payload, enqueued_at: new Date().toISOString() });
  getLogger().debug({ queue: name, size: q.pending.length }, 'Job enqueued (in-memory shell)');
  return { queue: name, status: 'queued' };
}

function listQueues() {
  return [...queues.keys()];
}

module.exports = { initQueue, registerQueue, enqueue, listQueues };
