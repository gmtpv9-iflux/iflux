'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const {
  listCustomers,
  getById,
  getByEmail,
  createCustomer,
  updateCustomer,
  grantPremium,
  resetPassword
} = require('./admin-users.service');
const { requireJwtPermission } = require('../admin-rbac/admin-perm-guard');

function createAdminUsersRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireJwtPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/', perm('users.list.view'), async (req, res, next) => {
    try {
      if (req.query.email) {
        const one = await getByEmail(req.query.email);
        return res.json({
          customers: one ? [one] : [],
          total: one ? 1 : 0
        });
      }
      const customers = await listCustomers({ q: req.query.q });
      res.json({ customers: customers, total: customers.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/export', perm('users.list.export'), async (req, res, next) => {
    try {
      const customers = await listCustomers({ q: req.query.q });
      const header = [
        'id', 'email', 'name', 'phone', 'affiliate', 'package', 'plan_type',
        'account_status', 'created_at'
      ];
      const escCsv = function (v) {
        const s = v == null ? '' : String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const lines = [header.join(',')].concat(customers.map(function (c) {
        return [
          c.id, c.email, c.name, c.phone, c.affiliate, c.package, c.planType,
          c.accountStatus, c.createdAt
        ].map(escCsv).join(',');
      }));
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="khach-hang.csv"');
      res.send('\uFEFF' + lines.join('\n'));
    } catch (err) {
      next(err);
    }
  });

  const createSchema = z.object({
    body: z.object({
      email: z.string().email(),
      name: z.string().min(1),
      phone: z.string().optional(),
      affiliate: z.string().optional(),
      package: z.enum(['Free', 'Premium', 'Elite']).optional(),
      planType: z.enum(['freemium', 'monthly', 'yearly', 'lifetime']).optional(),
      password: z.string().min(8).optional()
    })
  });

  router.post('/', perm('users.list.create'), validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const out = await createCustomer(b);
      res.status(201).json({
        ok: true,
        customer: out.customer,
        tempPassword: out.tempPassword || undefined
      });
    } catch (err) {
      if (err.message === 'email_exists') {
        return res.status(409).json({ error: { message: 'Email đã tồn tại.' } });
      }
      if (err.message === 'phone_exists') {
        return res.status(409).json({ error: { message: 'Số điện thoại đã tồn tại.' } });
      }
      if (err.message === 'invalid_email' || err.message === 'invalid_name' ||
          err.message === 'invalid_phone' || err.message === 'invalid_password') {
        return res.status(422).json({ error: { message: 'Dữ liệu không hợp lệ.', code: err.message } });
      }
      next(err);
    }
  });

  router.get('/:id', perm('users.list.view'), async (req, res, next) => {
    try {
      const customer = await getById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: { message: 'Không tìm thấy khách hàng.' } });
      }
      res.json({ customer: customer });
    } catch (err) {
      next(err);
    }
  });

  const patchSchema = z.object({
    body: z.object({
      name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      account_status: z.enum(['active', 'suspended']).optional(),
      accountStatus: z.enum(['active', 'suspended']).optional()
    })
  });

  router.patch('/:id', perm('users.list.edit'), validate(patchSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const customer = await updateCustomer(req.params.id, {
        name: b.name,
        phone: b.phone,
        accountStatus: b.accountStatus || b.account_status
      });
      res.json({ ok: true, customer: customer });
    } catch (err) {
      if (err.message === 'not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy khách hàng.' } });
      }
      if (err.message === 'phone_exists') {
        return res.status(409).json({ error: { message: 'Số điện thoại đã tồn tại.' } });
      }
      if (err.message === 'invalid_name' || err.message === 'invalid_phone') {
        return res.status(422).json({ error: { message: 'Dữ liệu không hợp lệ.', code: err.message } });
      }
      next(err);
    }
  });

  const grantSchema = z.object({
    body: z.object({
      package: z.enum(['Premium', 'Elite']).optional(),
      tier: z.enum(['premium', 'elite']).optional(),
      planType: z.enum(['monthly', 'yearly', 'lifetime']).optional(),
      cycle: z.enum(['monthly', 'yearly', 'lifetime', 'annual']).optional()
    }).optional()
  });

  router.post('/:id/grant-premium', perm('users.list.grant_premium'), validate(grantSchema), async (req, res, next) => {
    try {
      const b = (req.validated && req.validated.body) || req.body || {};
      const customer = await grantPremium(req.params.id, b);
      res.json({ ok: true, customer: customer });
    } catch (err) {
      if (err.message === 'not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy khách hàng.' } });
      }
      next(err);
    }
  });

  const resetSchema = z.object({
    body: z.object({
      password: z.string().min(8),
      newPassword: z.string().min(8).optional(),
      reason: z.string().optional()
    })
  });

  router.post('/:id/reset-password', perm('users.list.reset_password'), validate(resetSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const pwd = b.password || b.newPassword;
      const out = await resetPassword(req.params.id, pwd);
      res.json({ ok: true, id: out.id, email: out.email });
    } catch (err) {
      if (err.message === 'not_found') {
        return res.status(404).json({ error: { message: 'Không tìm thấy khách hàng.' } });
      }
      if (err.message === 'invalid_password') {
        return res.status(422).json({ error: { message: 'Mật khẩu tối thiểu 8 ký tự.' } });
      }
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminUsersRouter };
