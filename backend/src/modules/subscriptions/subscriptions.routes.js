'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const {
  createOrder,
  listOrders,
  getById,
  approveOrder,
  rejectOrder,
  stats
} = require('./subscriptions.service');

function requireAdminKey(config) {
  return function adminKeyGuard(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== config.ADMIN_API_KEY) {
      return next(AppError.forbidden('ADMIN_FORBIDDEN', 'Admin key required'));
    }
    next();
  };
}

/**
 * Guard admin cho đơn hàng: chấp nhận CẢ
 *  - JWT admin (Bearer) của admin đăng nhập trên web, HOẶC
 *  - X-Admin-Key (gọi server-to-server).
 * Tránh việc frontend admin (chỉ có JWT) bị 403 → vòng lặp đăng xuất.
 */
function requireAdmin(deps) {
  const keyGuard = requireAdminKey(deps.config);
  const jwtGuard = deps.auth && deps.auth.authenticateAdmin;
  return function adminGuard(req, res, next) {
    const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');
    if (jwtGuard && hasBearer) {
      return jwtGuard(req, res, function (err) {
        if (!err && req.admin) return next();
        return keyGuard(req, res, next);
      });
    }
    return keyGuard(req, res, next);
  };
}

function createSubscriptionsRouter(deps) {
  const router = express.Router();
  const adminGuard = requireAdmin(deps);

  const createSchema = z.object({
    body: z.object({
      plan_tier: z.string().min(1),
      plan_name: z.string().min(1),
      cycle: z.enum(['monthly', 'annual', 'lifetime']),
      amount: z.number().nonnegative(),
      coupon_discount: z.number().nonnegative().optional(),
      pay_method: z.enum(['card', 'momo', 'vnpay', 'transfer']),
      transfer_ref: z.string().optional(),
      user_name: z.string().optional(),
      email: z.string().optional()
    })
  });

  router.post('/orders', deps.auth.authenticate, validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const order = await createOrder(req.user.id, {
        planTier: b.plan_tier,
        planName: b.plan_name,
        cycle: b.cycle,
        amount: b.amount,
        couponDiscount: b.coupon_discount,
        payMethod: b.pay_method,
        transferRef: b.transfer_ref,
        userName: b.user_name,
        email: b.email
      });
      res.status(201).json({ order });
    } catch (err) {
      next(err);
    }
  });

  router.get('/orders/mine', deps.auth.authenticate, async (req, res, next) => {
    try {
      const orders = await listOrders({ userId: req.user.id });
      res.json({ orders });
    } catch (err) {
      next(err);
    }
  });

  router.get('/orders', adminGuard, async (req, res, next) => {
    try {
      const orders = await listOrders({
        status: req.query.status,
        payMethod: req.query.pay_method,
        q: req.query.q,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      });
      res.json({ orders, stats: await stats() });
    } catch (err) {
      next(err);
    }
  });

  router.get('/orders/:id', deps.auth.authenticate, async (req, res, next) => {
    try {
      const order = await getById(req.params.id);
      if (!order || order.userId !== req.user.id) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ order });
    } catch (err) {
      next(err);
    }
  });

  router.post('/orders/:id/approve', adminGuard, async (req, res, next) => {
    try {
      const order = await approveOrder(req.params.id, { adminName: req.body?.admin_name });
      res.json({ ok: true, order, buyerReferredBy: order.buyerReferredBy || null });
    } catch (err) {
      if (err.message === 'invalid_order') {
        return res.status(422).json({ error: 'invalid_order' });
      }
      next(err);
    }
  });

  router.post('/orders/:id/reject', adminGuard, async (req, res, next) => {
    try {
      const order = await rejectOrder(req.params.id, req.body?.reason, {
        adminName: req.body?.admin_name
      });
      res.json({ ok: true, order });
    } catch (err) {
      if (err.message === 'invalid_order') {
        return res.status(422).json({ error: 'invalid_order' });
      }
      next(err);
    }
  });

  router.get('/stats', adminGuard, async (req, res, next) => {
    try {
      res.json({ stats: await stats() });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createSubscriptionsRouter, requireAdminKey };
