'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./wave-d-admin.service');

function permFactory(deps) {
  return function perm() {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };
}

function createMetadataAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = permFactory(deps);

  router.get('/enums', perm('metadata.enums.view'), async (req, res, next) => {
    try {
      const items = await svc.listEnums();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.post('/enums', perm('metadata.enums.create'), validate(z.object({
    body: z.object({ code: z.string().min(1).max(80), name: z.string().min(1).max(200), values_text: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.createEnum(req.validated.body) }, 201); }
    catch (e) { next(e); }
  });
  router.patch('/enums/:id', perm('metadata.enums.edit'), validate(z.object({
    body: z.object({ name: z.string().min(1).max(200).optional(), values_text: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateEnum(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });
  router.delete('/enums/:id', perm('metadata.enums.delete'), async (req, res, next) => {
    try { return success(res, await svc.deleteEnum(req.params.id)); }
    catch (e) { next(e); }
  });

  router.get('/sector-types', perm('metadata.sector_types.view'), async (req, res, next) => {
    try {
      const items = await svc.listSectorTypes();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.post('/sector-types', perm('metadata.sector_types.create'), validate(z.object({
    body: z.object({ code: z.string().min(1).max(80), name: z.string().min(1).max(200), description: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.createSectorType(req.validated.body) }, 201); }
    catch (e) { next(e); }
  });
  router.patch('/sector-types/:id', perm('metadata.sector_types.edit'), validate(z.object({
    body: z.object({ name: z.string().min(1).max(200).optional(), description: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateSectorType(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });
  router.delete('/sector-types/:id', perm('metadata.sector_types.delete'), async (req, res, next) => {
    try { return success(res, await svc.deleteSectorType(req.params.id)); }
    catch (e) { next(e); }
  });

  router.get('/themes', perm('metadata.themes.view'), async (req, res, next) => {
    try {
      const items = await svc.listThemes();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.patch('/themes/:id', perm('metadata.themes.edit'), validate(z.object({
    body: z.object({ name: z.string().min(1).max(200).optional(), config_json: z.record(z.any()).optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateTheme(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });

  router.get('/story-lifecycle', perm('metadata.story_lifecycle.view'), async (req, res, next) => {
    try {
      const items = await svc.listLifecycle();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.patch('/story-lifecycle/:id', perm('metadata.story_lifecycle.edit'), validate(z.object({
    body: z.object({ name: z.string().min(1).max(200).optional(), sort_order: z.number().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateLifecycle(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });

  return router;
}

function createMarketingBrandRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = permFactory(deps);

  router.get('/brand-identity', perm('marketing.brand_identity.view'), async (req, res, next) => {
    try { return success(res, { brand: await svc.getBrand() }); }
    catch (e) { next(e); }
  });
  router.patch('/brand-identity', perm('marketing.brand_identity.edit'), validate(z.object({
    body: z.object({ payload: z.record(z.any()) })
  })), async (req, res, next) => {
    try { return success(res, { brand: await svc.updateBrand(req.validated.body.payload) }); }
    catch (e) { next(e); }
  });

  return router;
}

function createCommunityOpsAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = permFactory(deps);

  router.get('/comments', perm('news.comments.view'), async (req, res, next) => {
    try {
      const items = await svc.listComments();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.delete('/comments/:id', perm('news.comments.delete'), async (req, res, next) => {
    try { return success(res, await svc.deleteComment(req.params.id)); }
    catch (e) { next(e); }
  });

  router.get('/reports', perm('news.reports.view'), async (req, res, next) => {
    try {
      const items = await svc.listReports();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.patch('/reports/:id', perm('news.reports.edit'), validate(z.object({
    body: z.object({ status: z.string().max(20).optional(), reason: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateReport(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });

  router.get('/content-dashboard', perm('news.content_dashboard.view'), async (req, res, next) => {
    try { return success(res, svc.contentDashboard()); }
    catch (e) { next(e); }
  });

  router.get('/rss-category-sync', perm('news.rss_category_sync.view'), async (req, res, next) => {
    try {
      const items = await svc.listRssSync();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.patch('/rss-category-sync/:id', perm('news.rss_category_sync.edit'), validate(z.object({
    body: z.object({ name: z.string().min(1).max(200).optional(), config_json: z.record(z.any()).optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateRssSync(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });
  router.post('/rss-category-sync/:id/execute', perm('news.rss_category_sync.execute'), async (req, res, next) => {
    try { return success(res, { item: await svc.executeRssSync(req.params.id) }); }
    catch (e) { next(e); }
  });

  router.get('/rss-article-schema', perm('news.rss_article_schema.view'), async (req, res, next) => {
    try {
      const items = await svc.listRssSchema();
      return success(res, { items, total: items.length });
    } catch (e) { next(e); }
  });
  router.patch('/rss-article-schema/:id', perm('news.rss_article_schema.edit'), validate(z.object({
    body: z.object({ name: z.string().min(1).max(200).optional(), mapping_json: z.record(z.any()).optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateRssSchema(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });

  return router;
}

module.exports = {
  createMetadataAdminRouter,
  createMarketingBrandRouter,
  createCommunityOpsAdminRouter
};
