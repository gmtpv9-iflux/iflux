'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./market-price-sync.service');
const timeCfg = require('./market-time-config.service');

function createMarketPriceSyncRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  /* Ownership absorb → system.core_setup.* (cùng Cấu hình thời gian) */
  router.get('/sync-config', perm('system.core_setup.view'), async (req, res, next) => {
    try {
      const config = await svc.getSyncConfig();
      const time_config = await timeCfg.getTimeConfig();
      return success(res, { config: config, time_config: time_config });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    '/sync-config',
    perm('system.core_setup.edit'),
    validate(
      z.object({
        body: z.object({
          enabled: z.boolean().optional(),
          interval_seconds: z.number().int().optional()
        })
      })
    ),
    async (req, res, next) => {
      try {
        /* Interval/enabled authority = Time SoT / phiên — không ghi từ endpoint này. */
        const config = await svc.getSyncConfig();
        const time_config = await timeCfg.getTimeConfig();
        return success(res, {
          config: config,
          time_config: time_config,
          ignored: Object.keys(req.validated.body || {})
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/sync-now', perm('system.core_setup.configure'), async (req, res, next) => {
    try {
      return success(res, await svc.runSyncCycle({}));
    } catch (err) {
      next(err);
    }
  });

  router.get('/sync-runs', perm('system.core_setup.view'), async (req, res, next) => {
    try {
      const items = await svc.listSyncRuns(req.query.limit);
      return success(res, { items: items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/prices', perm('system.core_setup.view'), async (req, res, next) => {
    try {
      const items = await svc.listCurrentPrices({
        q: req.query.q,
        limit: req.query.limit
      });
      return success(res, { items: items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMarketPriceSyncRouter };
