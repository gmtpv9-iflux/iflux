'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const jobs = require('./etl-jobs-admin.service');

function createEtlJobsAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/', perm('data.etl_jobs.view'), async (req, res, next) => {
    try {
      const list = await jobs.listJobs({
        q: req.query.q,
        status: req.query.status
      });
      return success(res, { jobs: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', perm('data.etl_jobs.view'), async (req, res, next) => {
    try {
      const item = await jobs.getJob(req.params.id);
      if (!item) throw AppError.notFound('Không tìm thấy tác vụ ETL');
      return success(res, { job: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    perm('data.etl_jobs.create'),
    validate(z.object({
      body: z.object({
        code: z.string().max(80).optional(),
        name: z.string().min(1).max(200),
        schedule: z.string().max(80).optional(),
        status: z.enum(['idle', 'running', 'success', 'failed']).optional(),
        description: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await jobs.createJob(req.validated.body);
        return success(res, { job: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/:id',
    perm('data.etl_jobs.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        schedule: z.string().max(80).optional(),
        status: z.enum(['idle', 'running', 'success', 'failed']).optional(),
        description: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await jobs.updateJob(req.params.id, req.validated.body);
        return success(res, { job: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/:id/execute', perm('data.etl_jobs.execute'), async (req, res, next) => {
    try {
      const item = await jobs.executeJob(req.params.id);
      return success(res, { job: item });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', perm('data.etl_jobs.delete'), async (req, res, next) => {
    try {
      const result = await jobs.deleteJob(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createEtlJobsAdminRouter };
