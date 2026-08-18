'use strict';

const { ping: dbPing } = require('../../core/database/connection');
const { ping: redisPing, isRedisEnabled } = require('../../core/cache/redis');
const { listQueues } = require('../../core/queue/queue');
const { listJobs } = require('../../core/scheduler/scheduler');
const { success } = require('../../shared/response/api-response');

async function healthLive(req, res) {
  return success(res, { status: 'live' });
}

async function healthReady(req, res) {
  const checks = {
    database: await dbPing(),
    redis: isRedisEnabled() ? await redisPing() : null
  };
  const ok = checks.database && (checks.redis === null || checks.redis === true);
  return success(
    res,
    {
      status: ok ? 'ready' : 'degraded',
      checks
    },
    ok ? 200 : 503
  );
}

async function healthInfo(req, res) {
  return success(res, {
    service: 'iflux-api',
    version: process.env.npm_package_version || '0.1.0',
    env: req.app.locals.config.APP_ENV,
    queues: listQueues(),
    scheduler_jobs: listJobs()
  });
}

module.exports = { healthLive, healthReady, healthInfo };
