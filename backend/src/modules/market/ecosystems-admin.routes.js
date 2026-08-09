'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const ecosystems = require('./ecosystems-admin.service');

function createEcosystemsAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/', perm('market.ecosystems.view'), async (req, res, next) => {
    try {
      const list = await ecosystems.listEcosystems({
        q: req.query.q,
        status: req.query.status
      });
      return success(res, { ecosystems: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', perm('market.ecosystems.view'), async (req, res, next) => {
    try {
      const item = await ecosystems.getEcosystem(req.params.id);
      if (!item) throw AppError.notFound('Không tìm thấy hệ sinh thái');
      return success(res, { ecosystem: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    perm('market.ecosystems.create'),
    validate(z.object({
      body: z.object({
        code: z.string().max(20).optional(),
        name: z.string().min(1).max(100).optional(),
        name_vi: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional().nullable(),
        tickers: z.array(z.string()).optional(),
        status: z.enum(['active', 'inactive']).optional(),
        is_active: z.boolean().optional()
      }).refine(function (b) { return !!(b.name || b.name_vi); }, { message: 'Tên hệ sinh thái bắt buộc' })
    })),
    async (req, res, next) => {
      try {
        const item = await ecosystems.createEcosystem(req.validated.body);
        return success(res, { ecosystem: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/:id',
    perm('market.ecosystems.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        name_vi: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional().nullable(),
        tickers: z.array(z.string()).optional(),
        status: z.enum(['active', 'inactive']).optional(),
        is_active: z.boolean().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await ecosystems.updateEcosystem(req.params.id, req.validated.body);
        return success(res, { ecosystem: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/:id/activate', perm('market.ecosystems.status_active'), async (req, res, next) => {
    try {
      const item = await ecosystems.setEcosystemStatus(req.params.id, true);
      return success(res, { ecosystem: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/deactivate', perm('market.ecosystems.status_inactive'), async (req, res, next) => {
    try {
      const item = await ecosystems.setEcosystemStatus(req.params.id, false);
      return success(res, { ecosystem: item });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', perm('market.ecosystems.delete'), async (req, res, next) => {
    try {
      const result = await ecosystems.deleteEcosystem(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createEcosystemsAdminRouter };
