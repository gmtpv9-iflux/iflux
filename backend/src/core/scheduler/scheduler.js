'use strict';

const cron = require('node-cron');
const { getLogger } = require('../logger/logger');

const jobs = new Map();
let enabled = true;

function initScheduler(config) {
  enabled = config.SCHEDULER_ENABLED !== false;
  if (!enabled) {
    getLogger().info('Scheduler disabled');
    return;
  }
  getLogger().info('Scheduler framework initialized');
}

function registerJob(name, cronExpr, handler) {
  if (!enabled) return null;
  if (jobs.has(name)) {
    throw new Error(`Scheduler job "${name}" already registered`);
  }
  if (!cron.validate(cronExpr)) {
    throw new Error(`Invalid cron expression for job "${name}": ${cronExpr}`);
  }
  const task = cron.schedule(cronExpr, async () => {
    try {
      await handler();
    } catch (err) {
      getLogger().error({ err, job: name }, 'Scheduler job failed');
    }
  });
  jobs.set(name, { cronExpr, task });
  getLogger().debug({ job: name, cron: cronExpr }, 'Scheduler job registered');
  return task;
}

function listJobs() {
  return [...jobs.entries()].map(([name, j]) => ({ name, cron: j.cronExpr }));
}

function stopAll() {
  for (const { task } of jobs.values()) {
    task.stop();
  }
  jobs.clear();
}

module.exports = { initScheduler, registerJob, listJobs, stopAll };
