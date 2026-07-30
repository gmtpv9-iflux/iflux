'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const {
  createOrder,
  createAdminOrder,
  updateOrder,
  deleteOrder,
  listOrders,
  getById,
  approveOrder,
  rejectOrder,
  stats
} = require('./subscriptions.service');
const { requireAdminPermission, requireAdminKey } = require('../admin-rbac/admin-perm-guard');

const STATUS_PERM = {
  pending: 'subscription.transactions.status_pending',
  approved: 'subscription.transactions.status_approved',
  paid: 'subscription.transactions.status_paid',
  rejected: 'subscription.transactions.status_rejected',
  refunded: 'subscription.transactions.status_refunded'
};

const PATCH_FIELD_KEYS = [
  'plan_tier', 'plan_name', 'cycle', 'amount', 'coupon_discount',
  'pay_method', 'transfer_ref', 'user_name', 'email', 'reject_reason', 'admin_name'
];

function createSubscriptionsRouter(deps) {
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  /** PATCH: đổi status → status_*; sửa field → edit; cả hai → cần đủ quyền. */
  function orderPatchPermGuard() {
    return function (req, res, next) {
      const b = req.body || {};
      const keys = [];
      if (b.status != null && String(b.status).trim() !== '') {
        const st = String(b.status).toLowerCase().trim();
        const pk = STATUS_PERM[st];
        if (!pk) {
          return res.status(400).json({
            error: { code: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ.', status: st }
          });
        }
        keys.push(pk);
      }
      const hasFields = PATCH_FIELD_KEYS.some(function (k) { return b[k] !== undefined; });
      if (hasFields || !keys.length) keys.push('subscription.transactions.edit');
      return perm.apply(null, keys)(req, res, next);
    };
  }

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

  router.get('/orders', perm('subscription.transactions.view'), async (req, res, next) => {
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

  router.get('/orders/export', perm('subscription.transactions.export'), async (req, res, next) => {
    try {
      const orders = await listOrders({
        status: req.query.status,
        payMethod: req.query.pay_method,
        q: req.query.q,
        limit: req.query.limit ? Number(req.query.limit) : 5000
      });
      const header = ['id', 'email', 'user_name', 'plan_tier', 'plan_name', 'cycle', 'amount', 'pay_method', 'status', 'created_at'];
      const escCsv = function (v) {
        const s = v == null ? '' : String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const lines = [header.join(',')].concat(orders.map(function (o) {
        return [
          o.id, o.email, o.userName, o.planTier, o.planName, o.cycle, o.amount, o.payMethod, o.status, o.createdAt
        ].map(escCsv).join(',');
      }));
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="don-hang.csv"');
      res.send('\uFEFF' + lines.join('\n'));
    } catch (err) {
      next(err);
    }
  });

  const adminCreateSchema = z.object({
    body: z.object({
      email: z.string().email(),
      plan_tier: z.string().min(1),
      plan_name: z.string().optional(),
      cycle: z.enum(['monthly', 'annual', 'lifetime']),
      amount: z.number().nonnegative(),
      coupon_discount: z.number().nonnegative().optional(),
      pay_method: z.enum(['card', 'momo', 'vnpay', 'transfer']).default('transfer'),
      transfer_ref: z.string().optional(),
      user_name: z.string().optional(),
      status: z.enum(['pending', 'approved', 'paid', 'rejected', 'refunded']).optional(),
      note: z.string().optional(),
      admin_name: z.string().optional()
    })
  });

  /* Admin tạo đơn thủ công giúp user */
  router.post('/orders/admin', perm('subscription.transactions.create'), validate(adminCreateSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const order = await createAdminOrder({
        email: b.email,
        planTier: b.plan_tier,
        planName: b.plan_name,
        cycle: b.cycle,
        amount: b.amount,
        couponDiscount: b.coupon_discount,
        payMethod: b.pay_method,
        transferRef: b.transfer_ref,
        userName: b.user_name,
        status: b.status,
        note: b.note
      }, { adminName: b.admin_name || (req.admin && req.admin.name) || 'Admin' });
      res.status(201).json({ order });
    } catch (err) {
      if (err.message === 'user_not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy người dùng với email này.' } });
      }
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

  const adminPatchSchema = z.object({
    body: z.object({
      plan_tier: z.string().min(1).optional(),
      plan_name: z.string().optional(),
      cycle: z.enum(['monthly', 'annual', 'lifetime']).optional(),
      amount: z.number().nonnegative().optional(),
      coupon_discount: z.number().nonnegative().optional(),
      pay_method: z.enum(['card', 'momo', 'vnpay', 'transfer']).optional(),
      transfer_ref: z.string().optional(),
      user_name: z.string().optional(),
      email: z.string().email().optional(),
      status: z.enum(['pending', 'approved', 'paid', 'rejected', 'refunded']).optional(),
      reject_reason: z.string().optional(),
      admin_name: z.string().optional()
    })
  });

  router.patch('/orders/:id', orderPatchPermGuard(), validate(adminPatchSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const order = await updateOrder(req.params.id, {
        planTier: b.plan_tier,
        planName: b.plan_name,
        cycle: b.cycle,
        amount: b.amount,
        couponDiscount: b.coupon_discount,
        payMethod: b.pay_method,
        transferRef: b.transfer_ref,
        userName: b.user_name,
        email: b.email,
        status: b.status,
        rejectReason: b.reject_reason
      }, { adminName: b.admin_name || (req.admin && req.admin.name) || 'Admin' });
      res.json({ ok: true, order });
    } catch (err) {
      if (err.message === 'not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy đơn hàng.' } });
      }
      if (err.message === 'invalid_status') {
        return res.status(422).json({ error: { message: 'Trạng thái không hợp lệ.' } });
      }
      next(err);
    }
  });

  router.delete('/orders/:id', perm('subscription.transactions.cancel'), async (req, res, next) => {
    try {
      await deleteOrder(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if (err.message === 'not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy đơn hàng.' } });
      }
      next(err);
    }
  });

  router.post('/orders/:id/approve', perm('subscription.transactions.approve_payment'), async (req, res, next) => {
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

  router.post('/orders/:id/reject', perm('subscription.transactions.status_rejected'), async (req, res, next) => {
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

  router.post('/orders/:id/refund', perm('subscription.transactions.refund'), async (req, res, next) => {
    try {
      const order = await updateOrder(req.params.id, { status: 'refunded' }, {
        adminName: (req.body && req.body.admin_name) || (req.admin && req.admin.name) || 'Admin'
      });
      res.json({ ok: true, order });
    } catch (err) {
      if (err.message === 'not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy đơn hàng.' } });
      }
      if (err.message === 'invalid_status') {
        return res.status(422).json({ error: { message: 'Trạng thái không hợp lệ.' } });
      }
      next(err);
    }
  });

  router.get('/stats', perm('subscription.transactions.view'), async (req, res, next) => {
    try {
      res.json({ stats: await stats() });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createSubscriptionsRouter, requireAdminKey };
