'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const sectors = require('./sectors-admin.service');

function createSectorsAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/', perm('market.sectors.view'), async (req, res, next) => {
    try {
      const list = await sectors.listSectors({
        q: req.query.q,
        status: req.query.status
      });
      return success(res, { sectors: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', perm('market.sectors.view'), async (req, res, next) => {
    try {
      const item = await sectors.getSector(req.params.id);
      if (!item) throw AppError.notFound('Không tìm thấy ngành');
      return success(res, { sector: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    perm('market.sectors.create'),
    validate(z.object({
      body: z.object({
        code: z.string().max(20).optional(),
        name: z.string().min(1).max(100).optional(),
        name_vi: z.string().min(1).max(100).optional(),
        divisor: z.union([z.number(), z.string()]).transform(function (v) { return Number(v); }),
        status: z.enum(['active', 'inactive']).optional(),
        is_active: z.boolean().optional()
      }).refine(function (b) { return !!(b.name || b.name_vi); }, { message: 'Tên ngành bắt buộc' })
    })),
    async (req, res, next) => {
      try {
        const item = await sectors.createSector(req.validated.body);
        return success(res, { sector: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/:id',
    perm('market.sectors.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        name_vi: z.string().min(1).max(100).optional(),
        divisor: z.union([z.number(), z.string()]).transform(function (v) { return Number(v); }).optional(),
        status: z.enum(['active', 'inactive']).optional(),
        is_active: z.boolean().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await sectors.updateSector(req.params.id, req.validated.body);
        return success(res, { sector: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/:id', perm('market.sectors.delete'), async (req, res, next) => {
    try {
      const result = await sectors.deleteSector(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createSectorsAdminRouter };
