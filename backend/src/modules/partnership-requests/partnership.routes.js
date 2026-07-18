'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const {
  TYPES,
  verifyTurnstile,
  createRequest,
  listAdmin,
  countByStatus,
  getById,
  updateStatus
} = require('./partnership.service');

const STATUSES = ['new', 'in_progress', 'done', 'rejected'];

function createPartnershipRouter(deps) {
  deps = deps || {};
  const { config, auth } = deps;
  const router = express.Router();
  const adminGuard = auth && auth.authenticateAdmin;

  const createSchema = z.object({
    body: z.object({
      first_name: z.string().min(1, 'Nhập họ'),
      last_name: z.string().optional().default(''),
      email: z.string().email('Email không hợp lệ'),
      phone: z.string().min(6, 'Nhập số điện thoại'),
      partnership_type: z.enum(Object.keys(TYPES)),
      message: z.string().max(2000).optional().default(''),
      turnstile_token: z.string().optional().default('')
    })
  });

  // ── PUBLIC: gửi yêu cầu hợp tác (bảo vệ bằng Turnstile) ──
  router.post('/', validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const remoteIp =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        '';

      const verified = await verifyTurnstile(config, b.turnstile_token, remoteIp);
      if (!verified.ok) {
        return next(AppError.badRequest('TURNSTILE_FAILED', 'Xác minh chống spam thất bại. Vui lòng thử lại.'));
      }

      const row = await createRequest({
        first_name: b.first_name,
        last_name: b.last_name,
        email: b.email,
        phone: b.phone,
        partnership_type: b.partnership_type,
        message: b.message,
        ip: remoteIp,
        user_agent: req.headers['user-agent'] || ''
      });
      res.status(201).json({ ok: true, request: row });
    } catch (err) {
      next(err);
    }
  });

  // ── ADMIN: danh sách + đếm theo trạng thái ──
  router.get('/', adminGuard, async (req, res, next) => {
    try {
      const requests = await listAdmin({
        status: req.query.status,
        type: req.query.type,
        q: req.query.q
      });
      const counts = await countByStatus();
      res.json({ requests, counts });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', adminGuard, async (req, res, next) => {
    try {
      const row = await getById(req.params.id);
      if (!row) return next(AppError.notFound('NOT_FOUND', 'Không tìm thấy yêu cầu'));
      res.json({ request: row });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/status', adminGuard, async (req, res, next) => {
    try {
      const status = String((req.body && req.body.status) || '').trim();
      if (STATUSES.indexOf(status) < 0) {
        return next(AppError.badRequest('INVALID_STATUS', 'Trạng thái không hợp lệ'));
      }
      const current = await getById(req.params.id);
      if (!current) return next(AppError.notFound('NOT_FOUND', 'Không tìm thấy yêu cầu'));
      const row = await updateStatus(req.params.id, status, {
        note: req.body && req.body.note,
        processed_by: (req.body && req.body.admin_name) || (req.admin && (req.admin.name || req.admin.email)) || 'Admin'
      });
      res.json({ ok: true, request: row });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createPartnershipRouter };
