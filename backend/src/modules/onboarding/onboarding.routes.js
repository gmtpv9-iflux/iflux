'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { AppError } = require('../../shared/exceptions/app-error');
const {
  listSteps,
  listAllSteps,
  createStep,
  updateStep,
  deleteStep
} = require('./onboarding.service');

function requireAdminKey(config) {
  return function adminKeyGuard(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== config.ADMIN_API_KEY) {
      return next(AppError.forbidden('ADMIN_FORBIDDEN', 'Admin key required'));
    }
    next();
  };
}

const stepBodySchema = z.object({
  channel: z.enum(['app', 'web']),
  step_order: z.number().int().nonnegative(),
  title: z.string().min(1).max(255),
  body_text: z.string().optional().default(''),
  image_url: z.string().optional().nullable(),
  target_key: z.string().optional().nullable(),
  is_active: z.boolean().optional()
});

function createOnboardingRouter(deps) {
  const router = express.Router();
  const adminGuard = requireAdminKey(deps.config);

  router.get('/steps', async (req, res, next) => {
    try {
      const channel = String(req.query.channel || 'web');
      if (channel !== 'app' && channel !== 'web') {
        return res.status(422).json({ error: 'Invalid channel' });
      }
      const steps = await listSteps(channel, { activeOnly: true });
      res.json({ steps, channel });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/steps', adminGuard, async (req, res, next) => {
    try {
      const channel = req.query.channel ? String(req.query.channel) : null;
      const steps = await listAllSteps(channel);
      res.json({ steps });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/steps', adminGuard, validate(z.object({ body: stepBodySchema })), async (req, res, next) => {
    try {
      const step = await createStep(req.validated.body);
      res.status(201).json({ step });
    } catch (err) {
      next(err);
    }
  });

  router.put('/admin/steps/:id', adminGuard, validate(z.object({
    body: stepBodySchema.partial()
  })), async (req, res, next) => {
    try {
      const step = await updateStep(req.params.id, req.validated.body);
      res.json({ step });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/admin/steps/:id', adminGuard, async (req, res, next) => {
    try {
      await deleteStep(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createOnboardingRouter };
