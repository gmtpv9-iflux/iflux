'use strict';

const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const { getPublicSocialConfig } = require('../legacy-auth/social-auth.service');
const { loginWithGoogle, loginWithPassword, getAdminFromPayload } = require('./admin-auth.service');

/* Chặn brute-force đăng nhập mật khẩu: tối đa 8 lần thất bại / 15 phút theo IP+email. */
function createLoginThrottle() {
  const WINDOW_MS = 15 * 60 * 1000;
  const MAX_FAILS = 8;
  const store = new Map();
  function keyOf(ip, email) {
    return String(ip || '') + '|' + String(email || '').toLowerCase();
  }
  return {
    check(ip, email) {
      const rec = store.get(keyOf(ip, email));
      if (!rec) return;
      if (Date.now() - rec.first > WINDOW_MS) return;
      if (rec.count >= MAX_FAILS) {
        const err = new AppError('TOO_MANY_ATTEMPTS', 'Quá nhiều lần thử. Vui lòng đợi ít phút rồi thử lại.', 429);
        throw err;
      }
    },
    fail(ip, email) {
      const k = keyOf(ip, email);
      const rec = store.get(k);
      if (!rec || Date.now() - rec.first > WINDOW_MS) {
        store.set(k, { count: 1, first: Date.now() });
      } else {
        rec.count += 1;
      }
    },
    reset(ip, email) {
      store.delete(keyOf(ip, email));
    }
  };
}

function createAdminAuthRouter(deps) {
  const { config, auth } = deps;
  const router = require('express').Router();
  const throttle = createLoginThrottle();

  const googleSchema = z.object({
    body: z.object({
      id_token: z.string().min(10),
      remember: z.boolean().optional()
    })
  });

  const passwordSchema = z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
      remember: z.boolean().optional()
    })
  });

  router.get('/config', (req, res) => {
    res.json({
      google: getPublicSocialConfig(config).google,
      passwordSupported: true,
      rememberSupported: true
    });
  });

  router.post('/login', validate(passwordSchema), async (req, res, next) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const email = req.body.email;
    try {
      throttle.check(ip, email);
      const result = await loginWithPassword(config, email, req.body.password, !!req.body.remember);
      throttle.reset(ip, email);
      res.json(result);
    } catch (err) {
      if (!err.statusCode || err.statusCode === 401) throttle.fail(ip, email);
      next(err);
    }
  });

  router.post('/google', validate(googleSchema), async (req, res, next) => {
    try {
      const result = await loginWithGoogle(
        config,
        req.body.id_token,
        !!req.body.remember
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', auth.authenticateAdmin, (req, res) => {
    res.json({ admin: req.admin });
  });

  router.post('/logout', (req, res) => {
    res.json({ ok: true });
  });

  return router;
}

function createAdminAuthMiddleware(config) {
  const jwt = require('jsonwebtoken');
  const secret = config.JWT_SECRET;

  function authenticateAdmin(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(AppError.unauthorized());
    try {
      const payload = jwt.verify(token, secret);
      const admin = getAdminFromPayload(payload);
      if (!admin) return next(AppError.forbidden('ADMIN_FORBIDDEN', 'Admin access required'));
      req.admin = admin;
      req.auth = payload;
      next();
    } catch {
      next(AppError.unauthorized('Invalid token'));
    }
  }

  return { authenticateAdmin };
}

module.exports = { createAdminAuthRouter, createAdminAuthMiddleware };
