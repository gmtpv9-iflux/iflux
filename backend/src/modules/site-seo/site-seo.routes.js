'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./site-seo.service');

function permFactory(deps) {
  return function perm() {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };
}

function createSiteSeoAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = permFactory(deps);

  router.get('/global', perm('marketing.seo_system.view'), async function (req, res, next) {
    try {
      return success(res, await svc.getGlobalSeo());
    } catch (e) {
      next(e);
    }
  });

  router.patch(
    '/global',
    perm('marketing.seo_system.edit'),
    validate(
      z.object({
        body: z
          .object({
            payload: z.record(z.any()).optional(),
            name: z.string().max(200).optional(),
            tagline: z.string().max(500).optional(),
            siteName: z.string().max(200).optional(),
            siteDescription: z.string().max(2000).optional(),
            faviconUrl: z.string().max(2000).optional().nullable(),
            faviconAssetId: z.string().max(80).optional().nullable(),
            logoUrl: z.string().max(2000).optional().nullable(),
            logoAssetId: z.string().max(80).optional().nullable(),
            defaultSeoTitle: z.string().max(300).optional().nullable(),
            defaultMetaDescription: z.string().max(2000).optional().nullable(),
            defaultOgImageUrl: z.string().max(2000).optional().nullable(),
            defaultOgImageAssetId: z.string().max(80).optional().nullable(),
            defaultOgImageAlt: z.string().max(500).optional().nullable(),
            defaultSocialImageUrl: z.string().max(2000).optional().nullable(),
            defaultSocialImageAssetId: z.string().max(80).optional().nullable()
          })
          .passthrough()
      })
    ),
    async function (req, res, next) {
      try {
        const body = req.validated.body || {};
        const patch = Object.assign({}, body.payload || {}, body);
        delete patch.payload;
        const actor = (req.admin && (req.admin.email || req.admin.id)) || null;
        return success(res, await svc.updateGlobalSeo(patch, { updated_by: actor }));
      } catch (e) {
        next(e);
      }
    }
  );

  router.get('/pages', perm('marketing.seo_pages.view'), async function (req, res, next) {
    try {
      const items = await svc.listPageSeo();
      return success(res, { items: items, total: items.length });
    } catch (e) {
      next(e);
    }
  });

  router.get('/pages/:pageKey', perm('marketing.seo_pages.view'), async function (req, res, next) {
    try {
      return success(res, await svc.getPageSeo(req.params.pageKey));
    } catch (e) {
      next(e);
    }
  });

  router.put(
    '/pages/:pageKey',
    perm('marketing.seo_pages.edit'),
    validate(
      z.object({
        body: z
          .object({
            payload: z.record(z.any()).optional(),
            seoTitle: z.string().max(300).optional().nullable(),
            title: z.string().max(300).optional().nullable(),
            metaDescription: z.string().max(2000).optional().nullable(),
            description: z.string().max(2000).optional().nullable(),
            ogImageUrl: z.string().max(2000).optional().nullable(),
            ogImageAssetId: z.string().max(80).optional().nullable(),
            ogImageAlt: z.string().max(500).optional().nullable(),
            socialImageUrl: z.string().max(2000).optional().nullable(),
            socialImageAssetId: z.string().max(80).optional().nullable(),
            logoUrl: z.string().max(2000).optional().nullable()
          })
          .passthrough()
      })
    ),
    async function (req, res, next) {
      try {
        const body = req.validated.body || {};
        const patch = Object.assign({}, body.payload || {}, body);
        delete patch.payload;
        delete patch.faviconUrl;
        delete patch.faviconAssetId;
        /* logo = GLOBAL only (Owner LOCK 20260811) — không cho page-level override */
        delete patch.logoUrl;
        const actor = (req.admin && (req.admin.email || req.admin.id)) || null;
        return success(res, await svc.upsertPageSeo(req.params.pageKey, patch, { updated_by: actor }));
      } catch (e) {
        next(e);
      }
    }
  );

  router.get('/preview', perm('marketing.seo_system.view'), async function (req, res, next) {
    try {
      const pageKey = req.query.pageKey ? String(req.query.pageKey) : null;
      return success(res, await svc.previewAdmin(pageKey, null));
    } catch (e) {
      next(e);
    }
  });

  return router;
}

/** Public-safe effective config — no Admin auth */
function createSiteSeoPublicRouter() {
  const router = express.Router();
  router.get('/effective', async function (req, res, next) {
    try {
      const pageKey = req.query.pageKey ? String(req.query.pageKey) : '';
      const placeholders = require('./page-seo-placeholders');
      const entityVars = placeholders.entityVarsFromQuery(req.query || {});
      const hasVars = entityVars && Object.keys(entityVars).some(function (k) {
        return entityVars[k];
      });
      const data = await svc.getPublicEffective(pageKey || null, hasVars ? entityVars : null);
      return success(res, { page_key: pageKey || null, effective: data });
    } catch (e) {
      next(e);
    }
  });
  return router;
}

module.exports = {
  createSiteSeoAdminRouter,
  createSiteSeoPublicRouter
};
