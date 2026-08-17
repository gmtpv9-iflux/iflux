'use strict';

const { z } = require('zod');
const { AppError } = require('../errors');
const { createLoginThrottle } = require('./throttle');
const { loginWithPassword } = require('./login');
const { authenticateAdmin } = require('./token');
const { loadAccess } = require('../admin-rbac/permission');

const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional()
});

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || '';
}

function createAdminAuthRouter(config) {
  const router = require('express').Router();
  const throttle = createLoginThrottle();

  router.get('/config', function (req, res) {
    res.json({
      google: { enabled: false, clientId: null },
      passwordSupported: true,
      rememberSupported: true
    });
  });

  router.post('/login', async function (req, res, next) {
    const parsed = passwordSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
    }

    const ip = clientIp(req);
    const email = parsed.data.email;
    try {
      throttle.check(ip, email);
      const result = await loginWithPassword(
        config,
        email,
        parsed.data.password,
        !!parsed.data.remember,
        ip
      );
      throttle.reset(ip, email);
      res.json(result);
    } catch (err) {
      if (!err.statusCode || err.statusCode === 401) throttle.fail(ip, email);
      next(err);
    }
  });

  router.get('/me', authenticateAdmin(config), async function (req, res, next) {
    try {
      const access = await loadAccess(req.admin.email);
      if (!access || access.status !== 'active') {
        return next(new AppError('FORBIDDEN', 'Tài khoản quản trị không còn hiệu lực.', 403));
      }
      res.json({
        admin: {
          email: req.admin.email,
          name: req.admin.name,
          avatarUrl: req.admin.avatarUrl,
          id: access.id,
          keys: access.keys || [],
          isSuper: !!access.is_super
        }
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminAuthRouter };
