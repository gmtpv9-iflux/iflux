'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./ai-notif-admin.service');
const { mountPlatformTemplateRoutes } = require('../notifications/platform-admin.routes');

function permFactory(deps) {
  return function perm() {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };
}

function createAiAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = permFactory(deps);

  router.get('/prompts', perm('ai.prompts.view'), async (req, res, next) => {
    try {
      const prompts = await svc.listPrompts();
      return success(res, { prompts, total: prompts.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/prompts/:id', perm('ai.prompts.view'), async (req, res, next) => {
    try {
      const prompt = await svc.getPrompt(req.params.id);
      if (!prompt) throw AppError.notFound('Không tìm thấy prompt');
      return success(res, { prompt });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/prompts',
    perm('ai.prompts.create'),
    validate(z.object({
      body: z.object({
        code: z.string().min(1).max(80),
        name: z.string().min(1).max(200),
        body: z.string().optional(),
        status: z.string().max(20).optional()
      })
    })),
    async (req, res, next) => {
      try {
        const prompt = await svc.createPrompt(req.validated.body);
        return success(res, { prompt }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/prompts/:id',
    perm('ai.prompts.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        body: z.string().optional(),
        status: z.string().max(20).optional()
      })
    })),
    async (req, res, next) => {
      try {
        const prompt = await svc.updatePrompt(req.params.id, req.validated.body);
        return success(res, { prompt });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/prompts/:id', perm('ai.prompts.delete'), async (req, res, next) => {
    try {
      await svc.deletePrompt(req.params.id);
      return success(res, { ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.get('/logs', perm('ai.logs.view'), async (req, res, next) => {
    try {
      const logs = await svc.listLogs();
      return success(res, { logs, total: logs.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/cost', perm('ai.cost.view'), async (req, res, next) => {
    try {
      const rows = await svc.listCost();
      return success(res, { rows, total: rows.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/quality', perm('ai.quality.view'), async (req, res, next) => {
    try {
      const items = await svc.listQuality();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/quality/:id',
    perm('ai.quality.edit'),
    validate(z.object({
      body: z.object({
        label: z.string().max(200).optional(),
        score: z.number().optional(),
        note: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await svc.updateQuality(req.params.id, req.validated.body);
        return success(res, { item });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

function mountChannel(router, channel, permPrefix, perm) {
  router.get('/' + channel, perm(permPrefix + '.view'), async (req, res, next) => {
    try {
      const items = await svc.listCampaigns(channel === 'in-app' ? 'in_app' : channel);
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/' + channel,
    perm(permPrefix + '.create'),
    validate(z.object({
      body: z.object({
        code: z.string().min(1).max(80),
        title: z.string().min(1).max(200),
        body: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const ch = channel === 'in-app' ? 'in_app' : channel;
        const item = await svc.createCampaign(ch, req.validated.body);
        return success(res, { item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/' + channel + '/:id',
    perm(permPrefix + '.edit'),
    validate(z.object({
      body: z.object({
        title: z.string().min(1).max(200).optional(),
        body: z.string().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const ch = channel === 'in-app' ? 'in_app' : channel;
        const item = await svc.updateCampaign(ch, req.params.id, req.validated.body);
        return success(res, { item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/' + channel + '/:id/publish', perm(permPrefix + '.publish'), async (req, res, next) => {
    try {
      const ch = channel === 'in-app' ? 'in_app' : channel;
      const item = await svc.publishCampaign(ch, req.params.id);
      return success(res, { item });
    } catch (err) {
      next(err);
    }
  });
}

function createNotificationsAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = permFactory(deps);

  mountChannel(router, 'push', 'notifications.push', perm);
  mountChannel(router, 'in-app', 'notifications.in_app', perm);
  mountChannel(router, 'email', 'notifications.email', perm);

  router.get('/history', perm('notifications.history.view'), async (req, res, next) => {
    try {
      const items = await svc.listHistory();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  mountPlatformTemplateRoutes(router, perm);

  return router;
}

module.exports = { createAiAdminRouter, createNotificationsAdminRouter };
