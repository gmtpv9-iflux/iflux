'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./wave-e-admin.service');
const timeCfg = require('../market/market-time-config.service');

function permFactory(deps) {
  return function perm() {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };
}

function createSubscriptionWaveERouter(deps) {
  const router = express.Router();
  const perm = permFactory(deps || {});

  router.get('/plans', perm('subscription.plans.view'), async (req, res, next) => {
    try { const items = await svc.listPlans(); return success(res, { items, total: items.length }); }
    catch (e) { next(e); }
  });
  router.post('/plans', perm('subscription.plans.create'), validate(z.object({
    body: z.object({ code: z.string().min(1), name: z.string().min(1), price_vnd: z.number().optional(), status: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.createPlan(req.validated.body) }, 201); }
    catch (e) { next(e); }
  });
  router.patch('/plans/:id', perm('subscription.plans.edit'), validate(z.object({
    body: z.object({ name: z.string().optional(), price_vnd: z.number().optional(), status: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updatePlan(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });
  router.delete('/plans/:id', perm('subscription.plans.delete'), async (req, res, next) => {
    try { return success(res, await svc.deletePlan(req.params.id)); }
    catch (e) { next(e); }
  });

  router.get('/entitlements', perm('subscription.entitlements.view'), async (req, res, next) => {
    try { return success(res, { item: await svc.getEntitlements() }); }
    catch (e) { next(e); }
  });
  router.patch('/entitlements', perm('subscription.entitlements.edit'), validate(z.object({
    body: z.object({ payload: z.record(z.any()) })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.setEntitlements(req.validated.body.payload) }); }
    catch (e) { next(e); }
  });

  router.get('/loyalty', perm('subscription.loyalty.view'), async (req, res, next) => {
    try { return success(res, { item: await svc.getLoyalty() }); }
    catch (e) { next(e); }
  });
  router.patch('/loyalty', perm('subscription.loyalty.edit'), validate(z.object({
    body: z.object({ payload: z.record(z.any()) })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.setLoyalty(req.validated.body.payload) }); }
    catch (e) { next(e); }
  });

  router.get('/subscribers', perm('subscription.subscribers.view'), async (req, res, next) => {
    try { const items = await svc.listSubscribers(); return success(res, { items, total: items.length }); }
    catch (e) { next(e); }
  });
  router.get('/subscribers/export', perm('subscription.subscribers.export'), async (req, res, next) => {
    try { return success(res, await svc.exportSubscribers()); }
    catch (e) { next(e); }
  });

  return router;
}

function createSystemWaveERouter(deps) {
  const router = express.Router();
  const perm = permFactory(deps || {});

  router.get('/core-setup', perm('system.core_setup.view'), async (req, res, next) => {
    try {
      const item = await svc.getKv('core_setup');
      const normalized = timeCfg.mergeTimeIntoPayload(item.payload || {}, {});
      return success(res, {
        item: Object.assign({}, item, { payload: normalized }),
        time_config: timeCfg.extractTimeFields(normalized)
      });
    } catch (e) { next(e); }
  });
  router.patch('/core-setup', perm('system.core_setup.edit'), validate(z.object({
    body: z.object({ payload: z.record(z.any()) })
  })), async (req, res, next) => {
    try {
      const cur = await svc.getKv('core_setup');
      const payload = timeCfg.mergeTimeIntoPayload(cur.payload || {}, req.validated.body.payload || {});
      const item = await svc.setKv('core_setup', payload);
      return success(res, {
        item: item,
        time_config: timeCfg.extractTimeFields(payload)
      });
    } catch (e) { next(e); }
  });
  router.post('/core-setup/configure', perm('system.core_setup.configure'), validate(z.object({
    body: z.object({ payload: z.record(z.any()).optional() })
  })), async (req, res, next) => {
    try {
      const cur = await svc.getKv('core_setup');
      const payload = timeCfg.mergeTimeIntoPayload(
        cur.payload || {},
        Object.assign({}, (req.validated.body && req.validated.body.payload) || {}, {
          configured_at: new Date().toISOString()
        })
      );
      payload.configured_at = new Date().toISOString();
      return success(res, {
        item: await svc.setKv('core_setup', payload),
        time_config: timeCfg.extractTimeFields(payload)
      });
    } catch (e) { next(e); }
  });

  router.get('/feature-flags', perm('system.feature_flags.view'), async (req, res, next) => {
    try { return success(res, { item: await svc.getKv('feature_flags') }); }
    catch (e) { next(e); }
  });
  router.patch('/feature-flags', perm('system.feature_flags.edit'), validate(z.object({
    body: z.object({ payload: z.record(z.any()) })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.setKv('feature_flags', req.validated.body.payload) }); }
    catch (e) { next(e); }
  });

  router.get('/maintenance', perm('system.maintenance.view'), async (req, res, next) => {
    try { return success(res, { item: await svc.getKv('maintenance') }); }
    catch (e) { next(e); }
  });
  router.post('/maintenance/configure', perm('system.maintenance.configure'), validate(z.object({
    body: z.object({ payload: z.record(z.any()).optional() })
  })), async (req, res, next) => {
    try {
      const cur = await svc.getKv('maintenance');
      const payload = Object.assign({}, cur.payload || {}, (req.validated.body && req.validated.body.payload) || {});
      return success(res, { item: await svc.setKv('maintenance', payload) });
    } catch (e) { next(e); }
  });

  router.get('/platform-layers', perm('system.platform_layers.view'), async (req, res, next) => {
    try { return success(res, { item: await svc.getKv('platform_layers') }); }
    catch (e) { next(e); }
  });

  router.get('/sla', perm('system.sla.view'), async (req, res, next) => {
    try { return success(res, { item: await svc.getKv('sla') }); }
    catch (e) { next(e); }
  });
  router.patch('/sla', perm('system.sla.edit'), validate(z.object({
    body: z.object({ payload: z.record(z.any()) })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.setKv('sla', req.validated.body.payload) }); }
    catch (e) { next(e); }
  });

  return router;
}

function createStoriesWaveERouter(deps) {
  const router = express.Router();
  const perm = permFactory(deps || {});

  router.get('/analytics', perm('stories.analytics.view'), async (req, res, next) => {
    try { return success(res, svc.storiesAnalytics()); }
    catch (e) { next(e); }
  });
  router.get('/cau-chuyen-detail', perm('stories.cau_chuyen_detail.view'), async (req, res, next) => {
    try { const items = await svc.listCauChuyen(); return success(res, { items, total: items.length }); }
    catch (e) { next(e); }
  });
  router.patch('/cau-chuyen-detail/:id', perm('stories.cau_chuyen_detail.edit'), validate(z.object({
    body: z.object({ title: z.string().optional(), body: z.string().optional() })
  })), async (req, res, next) => {
    try { return success(res, { item: await svc.updateCauChuyen(req.params.id, req.validated.body) }); }
    catch (e) { next(e); }
  });

  return router;
}

module.exports = {
  createSubscriptionWaveERouter,
  createSystemWaveERouter,
  createStoriesWaveERouter
};
