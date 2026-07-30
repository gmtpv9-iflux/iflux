'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const ops = require('./data-ops.service');

function createDataOpsRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/pipeline', perm('data.pipeline.view'), async (req, res, next) => {
    try {
      const stages = await ops.listPipeline();
      return success(res, { stages, total: stages.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/quality', perm('data.quality.view'), async (req, res, next) => {
    try {
      const items = await ops.listQuality();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/dictionary', perm('data.dictionary.view'), async (req, res, next) => {
    try {
      const fields = await ops.listDictionary();
      return success(res, { fields, total: fields.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/dictionary/:id',
    perm('data.dictionary.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        field_type: z.string().max(40).optional(),
        description: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const field = await ops.updateDictionary(req.params.id, req.validated.body);
        return success(res, { field });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/reconciliation', perm('data.reconciliation.view'), async (req, res, next) => {
    try {
      const runs = await ops.listReconciliation();
      return success(res, { runs, total: runs.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/reconciliation/:id/execute', perm('data.reconciliation.execute'), async (req, res, next) => {
    try {
      const run = await ops.executeReconciliation(req.params.id);
      return success(res, { run });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createDataOpsRouter };
