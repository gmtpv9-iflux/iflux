'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const { verifyTurnstile, clientIp } = require('../../shared/turnstile');
const {
  listPublic,
  listAdmin,
  countByStatus,
  createItem,
  toggleAgree,
  updateStatus
} = require('./bug.service');

function voterId(req) {
  if (req.user && req.user.id) return 'user:' + req.user.id;
  const vid = req.headers['x-visitor-id'];
  if (vid && String(vid).length >= 8 && String(vid).length <= 64) return 'visitor:' + String(vid);
  return null;
}

function createBugReportsRouter(deps) {
  deps = deps || {};
  const { config, auth } = deps;
  const router = express.Router();
  const adminGuard = auth && auth.authenticateAdmin;
  const optAuth = auth && auth.optionalAuth;

  const createSchema = z.object({
    body: z.object({
      title: z.string().min(3).max(200),
      context: z.string().min(10).max(2000),
      problem_description: z.string().min(10).max(2000),
      root_cause: z.string().max(2000).optional().default(''),
      turnstile_token: z.string().optional().default('')
    })
  });

  router.get('/public', optAuth, async (req, res, next) => {
    try {
      const items = await listPublic(voterId(req));
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', optAuth, validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const ip = clientIp(req);
      const verified = await verifyTurnstile(config, b.turnstile_token, ip);
      if (!verified.ok) {
        return next(AppError.badRequest('TURNSTILE_FAILED', 'Xác minh chống spam thất bại. Vui lòng thử lại.'));
      }
      let userName = 'Thành viên iFlux';
      if (req.user) {
        const uRes = await require('../../core/database/connection').query(
          'SELECT display_name, email FROM users WHERE id = $1',
          [req.user.id]
        );
        const u = uRes.rows[0];
        if (u) userName = u.display_name || u.email || userName;
      }
      const row = await createItem({
        user_id: req.user ? req.user.id : null,
        user_name: userName,
        title: b.title,
        context: b.context,
        problem_description: b.problem_description,
        root_cause: b.root_cause,
        ip,
        user_agent: req.headers['user-agent'] || ''
      });
      res.status(201).json({ ok: true, item: row });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/agree', optAuth, async (req, res, next) => {
    try {
      const vid = voterId(req);
      if (!vid) return next(AppError.badRequest('VISITOR_REQUIRED', 'Thiếu định danh trình duyệt'));
      const row = await toggleAgree(req.params.id, vid);
      if (!row) return next(AppError.notFound('NOT_FOUND', 'Không tìm thấy báo lỗi'));
      res.json({ ok: true, item: row });
    } catch (err) {
      if (err.statusCode) return next(AppError.badRequest('AGREE_FAILED', err.message));
      next(err);
    }
  });

  router.get('/', adminGuard, async (req, res, next) => {
    try {
      const items = await listAdmin({
        status: req.query.status,
        q: req.query.q,
        sort: req.query.sort || 'agrees'
      });
      const counts = await countByStatus();
      res.json({ items, counts });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/status', adminGuard, async (req, res, next) => {
    try {
      const status = String((req.body && req.body.status) || '').trim();
      const row = await updateStatus(req.params.id, status, {
        note: req.body && req.body.note,
        processed_by: (req.body && req.body.admin_name) || (req.admin && (req.admin.name || req.admin.email)) || 'Admin'
      });
      if (!row) return next(AppError.notFound('NOT_FOUND', 'Không tìm thấy báo lỗi'));
      res.json({ ok: true, item: row });
    } catch (err) {
      if (err.statusCode) return next(AppError.badRequest('INVALID_STATUS', err.message));
      next(err);
    }
  });

  return router;
}

module.exports = { createBugReportsRouter };
