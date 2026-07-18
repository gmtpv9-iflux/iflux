'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { getSection, putSection, getAll } = require('./user-data.service');

function createUserDataRouter(auth) {
  const router = express.Router();

  router.use(auth.authenticate);

  const sectionSchema = z.object({
    body: z.object({ data: z.any() })
  });

  router.get('/sync', async (req, res, next) => {
    try {
      const data = await getAll(req.user.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/watchlist', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'watchlist');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/watchlist', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'watchlist', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.get('/alerts', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'alerts');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/alerts', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'alerts', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.get('/dashboard', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'dashboard');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/dashboard', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'dashboard', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.get('/onboarding', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'onboarding');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/onboarding', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'onboarding', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.get('/payment', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'payment');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/payment', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'payment', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.get('/notifications', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'notifications');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/notifications', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'notifications', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.get('/messages', async (req, res, next) => {
    try {
      const result = await getSection(req.user.id, 'messages');
      res.json({ data: result.data, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  router.put('/messages', validate(sectionSchema), async (req, res, next) => {
    try {
      const result = await putSection(req.user.id, 'messages', req.validated.body.data);
      res.json({ ok: true, updated_at: result.updated_at });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createUserDataRouter };
