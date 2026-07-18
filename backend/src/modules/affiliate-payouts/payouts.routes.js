'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const {
  MIN_PAYOUT,
  getAvailableBalance,
  createRequest,
  listForUser,
  listAdmin,
  getById,
  updateStatus
} = require('./payouts.service');

function requireAdminKey(config) {
  return function adminKeyGuard(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== config.ADMIN_API_KEY) {
      return next(AppError.forbidden('ADMIN_FORBIDDEN', 'Admin key required'));
    }
    next();
  };
}

function createAffiliatePayoutsRouter(deps) {
  const router = express.Router();
  const adminGuard = requireAdminKey(deps.config);

  const createSchema = z.object({
    body: z.object({
      amount: z.number().positive(),
      bank_name: z.string().min(1),
      bank_branch: z.string().optional(),
      bank_account: z.string().min(1),
      bank_holder: z.string().min(1),
      user_name: z.string().optional(),
      email: z.string().optional()
    })
  });

  router.get('/balance', deps.auth.authenticate, async (req, res, next) => {
    try {
      const available = await getAvailableBalance(req.user.id);
      res.json({ available, min_payout: MIN_PAYOUT });
    } catch (err) {
      next(err);
    }
  });

  router.get('/requests/mine', deps.auth.authenticate, async (req, res, next) => {
    try {
      const requests = await listForUser(req.user.id);
      res.json({ requests });
    } catch (err) {
      next(err);
    }
  });

  router.post('/requests', deps.auth.authenticate, validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const requestRow = await createRequest(req.user.id, {
        amount: b.amount,
        bank_name: b.bank_name,
        bank_branch: b.bank_branch,
        bank_account: b.bank_account,
        bank_holder: b.bank_holder,
        user_name: b.user_name,
        email: b.email
      });
      res.status(201).json({ request: requestRow });
    } catch (err) {
      next(err);
    }
  });

  router.get('/requests', adminGuard, async (req, res, next) => {
    try {
      const requests = await listAdmin({
        status: req.query.status,
        q: req.query.q
      });
      res.json({ requests });
    } catch (err) {
      next(err);
    }
  });

  router.post('/requests/:id/approve', adminGuard, async (req, res, next) => {
    try {
      const current = await getById(req.params.id);
      if (!current) return next(AppError.notFound('NOT_FOUND', 'Request not found'));
      if (current.status !== 'pending') {
        return next(AppError.badRequest('INVALID_STATUS', 'Chỉ duyệt yêu cầu đang chờ'));
      }
      const row = await updateStatus(req.params.id, 'processing', {
        processed_by: (req.body && req.body.admin_name) || 'Admin'
      });
      res.json({ ok: true, request: row });
    } catch (err) {
      next(err);
    }
  });

  router.post('/requests/:id/complete', adminGuard, async (req, res, next) => {
    try {
      const current = await getById(req.params.id);
      if (!current) return next(AppError.notFound('NOT_FOUND', 'Request not found'));
      if (current.status !== 'processing' && current.status !== 'pending') {
        return next(AppError.badRequest('INVALID_STATUS', 'Không thể hoàn tất yêu cầu này'));
      }
      const row = await updateStatus(req.params.id, 'paid', {
        processed_by: (req.body && req.body.admin_name) || 'Admin'
      });
      res.json({ ok: true, request: row });
    } catch (err) {
      next(err);
    }
  });

  router.post('/requests/:id/reject', adminGuard, async (req, res, next) => {
    try {
      const current = await getById(req.params.id);
      if (!current) return next(AppError.notFound('NOT_FOUND', 'Request not found'));
      if (current.status === 'paid' || current.status === 'rejected') {
        return next(AppError.badRequest('INVALID_STATUS', 'Yêu cầu đã xử lý'));
      }
      const row = await updateStatus(req.params.id, 'rejected', {
        reject_reason: (req.body && req.body.reason) || 'Không đủ điều kiện',
        processed_by: (req.body && req.body.admin_name) || 'Admin'
      });
      if (!row) return next(AppError.notFound('NOT_FOUND', 'Request not found'));
      res.json({ ok: true, request: row });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAffiliatePayoutsRouter };
