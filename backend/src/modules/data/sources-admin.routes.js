'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const sources = require('./sources-admin.service');

function createSourcesAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/', perm('data.sources.view'), async (req, res, next) => {
    try {
      const list = await sources.listSources({
        q: req.query.q,
        status: req.query.status
      });
      return success(res, { sources: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', perm('data.sources.view'), async (req, res, next) => {
    try {
      const item = await sources.getSource(req.params.id);
      if (!item) throw AppError.notFound('Không tìm thấy nguồn dữ liệu');
      return success(res, { source: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    perm('data.sources.create'),
    validate(z.object({
      body: z.object({
        code: z.string().max(80).optional(),
        name: z.string().min(1).max(200),
        source_type: z.enum(['REST', 'WebSocket', 'File', 'DB', 'Other']).optional(),
        type: z.enum(['REST', 'WebSocket', 'File', 'DB', 'Other']).optional(),
        status: z.enum(['idle', 'connected', 'success', 'failed', 'degraded']).optional(),
        description: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await sources.createSource(req.validated.body);
        return success(res, { source: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/:id',
    perm('data.sources.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        source_type: z.enum(['REST', 'WebSocket', 'File', 'DB', 'Other']).optional(),
        type: z.enum(['REST', 'WebSocket', 'File', 'DB', 'Other']).optional(),
        status: z.enum(['idle', 'connected', 'success', 'failed', 'degraded']).optional(),
        description: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await sources.updateSource(req.params.id, req.validated.body);
        return success(res, { source: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/:id/execute', perm('data.sources.execute'), async (req, res, next) => {
    try {
      const item = await sources.executeSource(req.params.id);
      return success(res, { source: item });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', perm('data.sources.delete'), async (req, res, next) => {
    try {
      const result = await sources.deleteSource(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createSourcesAdminRouter };
