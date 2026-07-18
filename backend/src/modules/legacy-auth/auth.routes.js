'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const {
  startRegistration,
  resendVerificationOtp,
  loginUser,
  getUserProfile,
  updateProfile,
  verifyEmailCode,
  lookupReferrerByCode,
  getAffiliateSync,
  socialLoginOrRegister
} = require('./auth.service');
const { getPublicSocialConfig } = require('./social-auth.service');

function createLegacyAuthRouter(deps) {
  const auth = deps.auth || deps;
  const config = deps.config;
  const router = express.Router();

  const registerSchema = z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      referral_code: z.string().optional().nullable(),
      display_name: z.string().optional().nullable(),
      phone: z.string().optional().nullable()
    })
  });

  const loginSchema = z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
      remember_me: z.union([z.boolean(), z.string()]).optional()
    })
  });

  const resendSchema = z.object({
    body: z.object({
      email: z.string().email()
    })
  });

  const socialSchema = z.object({
    body: z.object({
      provider: z.enum(['google', 'apple', 'facebook', 'zalo']),
      id_token: z.string().min(1).optional(),
      access_token: z.string().min(1).optional(),
      oauth_code: z.string().min(1).optional(),
      referral_code: z.string().optional().nullable(),
      remember_me: z.union([z.boolean(), z.string()]).optional()
    })
  });

  router.get('/social/config', (req, res) => {
    res.json(getPublicSocialConfig(config));
  });

  router.post('/social', validate(socialSchema), async (req, res, next) => {
    try {
      const body = req.validated.body;
      if (!body.id_token && !body.access_token && !body.oauth_code) {
        return res.status(422).json({ error: 'id_token, access_token or oauth_code required' });
      }
      const { user, isNew } = await socialLoginOrRegister(config, body);
      const remember = body.remember_me === true || body.remember_me === 'true';
      const token = auth.generateToken(user.id, remember);
      res.json({
        token,
        is_new: isNew,
        user: {
          id: user.id,
          email: user.email,
          plan: user.subscription_tier || 'free'
        }
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/referral/validate/:code', async (req, res, next) => {
    try {
      const row = await lookupReferrerByCode(req.params.code);
      if (!row) {
        return res.json({ valid: false, code: String(req.params.code || '').trim().toUpperCase() });
      }
      res.json({
        valid: true,
        code: row.referral_code,
        referrerId: row.id,
        displayName: row.display_name || 'Thành viên'
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
      const result = await startRegistration(config, req.validated.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
      const { email, password, remember_me } = req.validated.body;
      const user = await loginUser(email, password);
      const remember = remember_me === true || remember_me === 'true';
      const token = auth.generateToken(user.id, remember);
      res.json({
        token,
        user: { id: user.id, email: user.email, plan: user.subscription_tier || 'free' }
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', auth.authenticate, async (req, res, next) => {
    try {
      const user = await getUserProfile(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({
        id: user.id,
        email: user.email,
        phone: user.phone,
        plan: user.plan || 'free',
        display_name: user.display_name,
        nickname: user.nickname,
        status: user.status || 'active',
        created_at: user.created_at,
        referral_code: user.referral_code,
        referred_by: user.referred_by || null,
        plan_expired_at: user.plan_expired_at
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/referrals/sync', auth.authenticate, async (req, res, next) => {
    try {
      const payload = await getAffiliateSync(req.user.id);
      res.json(payload);
    } catch (err) {
      next(err);
    }
  });

  router.put('/profile', auth.authenticate, async (req, res, next) => {
    try {
      await updateProfile(req.user.id, req.body || {});
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.post('/verify-email', async (req, res, next) => {
    try {
      const { email, code } = req.body || {};
      if (!email || !code) {
        return res.status(422).json({ error: 'Email and code required' });
      }
      const user = await verifyEmailCode(config, email, code);
      const token = auth.generateToken(user.id);
      res.json({ token, email: user.email });
    } catch (err) {
      next(err);
    }
  });

  router.post('/resend-verification', validate(resendSchema), async (req, res, next) => {
    try {
      const result = await resendVerificationOtp(config, req.validated.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createLegacyAuthRouter };
