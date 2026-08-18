'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./market-wave-b.service');

function createMarketWaveBRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/formulas', perm('market.formulas.view'), async (req, res, next) => {
    try {
      const formulas = await svc.listFormulas();
      return success(res, { formulas, total: formulas.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/formulas/:id',
    perm('market.formulas.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        formula_text: z.string().optional(),
        status: z.string().max(20).optional()
      })
    })),
    async (req, res, next) => {
      try {
        const formula = await svc.updateFormula(req.params.id, req.validated.body);
        return success(res, { formula });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/formulas/:id/recalculate', perm('market.formulas.recalculate'), async (req, res, next) => {
    try {
      const formula = await svc.recalculateFormula(req.params.id);
      return success(res, { formula });
    } catch (err) {
      next(err);
    }
  });

  router.get('/lot-threshold', perm('market.lot_threshold.view'), async (req, res, next) => {
    try {
      const config = await svc.getLotConfig();
      return success(res, { config });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/lot-threshold',
    perm('market.lot_threshold.edit'),
    validate(z.object({ body: z.object({ payload: z.record(z.any()) }) })),
    async (req, res, next) => {
      try {
        const config = await svc.updateLotConfig(req.validated.body.payload);
        return success(res, { config });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/ranking', perm('market.ranking.view'), async (req, res, next) => {
    try {
      const config = await svc.getRankingConfig();
      return success(res, { config });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/ranking',
    perm('market.ranking.edit'),
    validate(z.object({ body: z.object({ payload: z.record(z.any()) }) })),
    async (req, res, next) => {
      try {
        const config = await svc.updateRankingConfig(req.validated.body.payload);
        return success(res, { config });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

function createMarketOpsWaveBRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/sessions', perm('market_ops.sessions.view'), async (req, res, next) => {
    try {
      const sessions = await svc.listSessions();
      return success(res, { sessions, total: sessions.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/sessions/:id',
    perm('market_ops.sessions.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        open_time: z.string().max(20).optional(),
        close_time: z.string().max(20).optional(),
        is_active: z.boolean().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const session = await svc.updateSession(req.params.id, req.validated.body);
        return success(res, { session });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/missing-ticks', perm('market_ops.missing_ticks.view'), async (req, res, next) => {
    try {
      const items = await svc.listMissingTicks();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/corrections', perm('market_ops.corrections.view'), async (req, res, next) => {
    try {
      const items = await svc.listCorrections();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/corrections/:id',
    perm('market_ops.corrections.edit'),
    validate(z.object({
      body: z.object({
        status: z.string().max(20).optional(),
        new_value: z.string().optional(),
        note: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await svc.updateCorrection(req.params.id, req.validated.body);
        return success(res, { item });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

module.exports = { createMarketWaveBRouter, createMarketOpsWaveBRouter };
