'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./market-wave-f.service');

function createMarketStocksWaveFRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/', perm('market.stocks.view'), async (req, res, next) => {
    try {
      const items = await svc.listStocks();
      return success(res, { items, total: items.length });
    } catch (err) { next(err); }
  });

  router.get('/export', perm('market.stocks.export'), async (req, res, next) => {
    try {
      return success(res, await svc.exportStocks());
    } catch (err) { next(err); }
  });

  router.post('/import', perm('market.stocks.import'), validate(z.object({
    body: z.object({ items: z.array(z.object({
      ticker: z.string().min(1),
      name: z.string().optional(),
      exchange: z.string().optional(),
      status: z.string().optional(),
      sector_id: z.number().nullable().optional(),
      ecosystem_id: z.number().nullable().optional(),
      shares_outstanding: z.number().optional(),
      description: z.string().optional(),
      cap_group: z.string().optional(),
      cap_tier: z.string().optional(),
      market_cap: z.union([z.number(), z.string()]).optional()
    })).min(1) })
  })), async (req, res, next) => {
    try {
      return success(res, await svc.importStocks(req.validated.body.items));
    } catch (err) { next(err); }
  });

  router.post('/', perm('market.stocks.create'), validate(z.object({
    body: z.object({
      ticker: z.string().min(1).max(20),
      name: z.string().min(1).max(200),
      exchange: z.string().max(20).optional(),
      status: z.string().max(20).optional(),
      sector_id: z.number().nullable().optional(),
      ecosystem_id: z.number().nullable().optional(),
      shares_outstanding: z.number().optional(),
      description: z.string().optional(),
      cap_group: z.string().optional(),
      cap_tier: z.string().optional(),
      market_cap: z.union([z.number(), z.string()]).optional()
    })
  })), async (req, res, next) => {
    try {
      return success(res, { item: await svc.createStock(req.validated.body) }, 201);
    } catch (err) { next(err); }
  });

  router.patch('/:id', perm('market.stocks.edit'), validate(z.object({
    body: z.object({
      name: z.string().min(1).max(200).optional(),
      exchange: z.string().max(20).optional(),
      status: z.string().max(20).optional(),
      sector_id: z.number().nullable().optional(),
      ecosystem_id: z.number().nullable().optional(),
      shares_outstanding: z.number().optional(),
      description: z.string().optional(),
      cap_group: z.string().optional(),
      cap_tier: z.string().optional(),
      market_cap: z.union([z.number(), z.string(), z.null()]).optional()
    })
  })), async (req, res, next) => {
    try {
      const adminId = req.admin && req.admin.id ? req.admin.id : null;
      return success(res, { item: await svc.updateStock(req.params.id, req.validated.body, adminId) });
    } catch (err) { next(err); }
  });

  router.delete('/:id', perm('market.stocks.delete'), async (req, res, next) => {
    try {
      return success(res, await svc.deleteStock(req.params.id));
    } catch (err) { next(err); }
  });

  router.post('/:id/status-active', perm('market.stocks.status_active'), async (req, res, next) => {
    try {
      return success(res, { item: await svc.setStatus(req.params.id, 'active') });
    } catch (err) { next(err); }
  });

  router.post('/:id/status-halted', perm('market.stocks.status_halted'), async (req, res, next) => {
    try {
      return success(res, { item: await svc.setStatus(req.params.id, 'halted') });
    } catch (err) { next(err); }
  });

  router.post('/:id/status-delisted', perm('market.stocks.status_delisted'), async (req, res, next) => {
    try {
      return success(res, { item: await svc.setStatus(req.params.id, 'delisted') });
    } catch (err) { next(err); }
  });

  return router;
}

module.exports = { createMarketStocksWaveFRouter };
