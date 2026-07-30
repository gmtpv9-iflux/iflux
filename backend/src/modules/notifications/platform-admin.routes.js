'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const templateService = require('./template.service');
const dispatcher = require('./dispatcher');

function mountPlatformTemplateRoutes(router, perm) {
  router.get('/types', perm('notifications.templates.view'), async (req, res, next) => {
    try {
      const items = await templateService.listTypes();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/types/:code/template', perm('notifications.templates.view'), async (req, res, next) => {
    try {
      const type = await templateService.getTypeByCode(req.params.code);
      if (!type) {
        const { AppError } = require('../../shared/exceptions/app-error');
        throw AppError.notFound('Không tìm thấy loại thông báo');
      }
      return success(res, { type });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/types/:code',
    perm('notifications.templates.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200)
      })
    })),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id;
        const row = await templateService.patchTypeName(req.params.code, req.validated.body.name, adminId);
        return success(res, { code: row.code, name: row.name });
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/types/:code/template',
    perm('notifications.templates.edit'),
    validate(z.object({
      body: z.object({
        title: z.string().optional(),
        body: z.string().optional(),
        version: z.number().int().optional()
      })
    })),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id;
        const template = await templateService.patchTemplate(
          req.params.code,
          req.validated.body,
          adminId
        );
        return success(res, { template });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/types/:code/template/restore',
    perm('notifications.templates.edit'),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id;
        const template = await templateService.restoreTemplate(req.params.code, adminId);
        return success(res, { template });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/types/:code/template/preview',
    perm('notifications.templates.view'),
    async (req, res, next) => {
      try {
        const preview = await dispatcher.preview(req.params.code, req.body || {});
        return success(res, { preview, dispatch: false });
      } catch (err) {
        next(err);
      }
    }
  );
}

module.exports = { mountPlatformTemplateRoutes };
