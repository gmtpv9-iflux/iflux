'use strict';

const express = require('express');
const { PAGE_KEY_RE } = require('./contracts/page-published.contract');
const { WIDGET_ID_RE } = require('./contracts/widget-published.contract');
const service = require('./widget-publish.service');

function sendWithEtag(req, res, payload) {
  if (payload.etag) {
    res.setHeader('ETag', payload.etag);
    const inm = req.get('If-None-Match');
    if (inm && inm === payload.etag) {
      return res.status(304).end();
    }
  }
  res.json({ ok: true, data: payload.body, etag: payload.etag, version: payload.version });
}

function createWidgetPublishRouter({ config, auth }) {
  const router = express.Router();
  const guard = auth && auth.authenticateAdmin;

  router.get('/pages/:pageKey', async (req, res, next) => {
    try {
      const pageKey = String(req.params.pageKey || '').trim().toLowerCase();
      if (!PAGE_KEY_RE.test(pageKey)) {
        return res.status(400).json({ ok: false, error: 'pageKey không hợp lệ' });
      }
      const embed = req.query.embed !== 'false';
      const payload = await service.getPagePublishedForRuntime(pageKey, { embed: embed });
      if (!payload) {
        return res.status(404).json({ ok: false, error: 'Chưa có PagePublished cho trang này' });
      }
      return sendWithEtag(req, res, payload);
    } catch (err) {
      next(err);
    }
  });

  router.get('/widgets/:widgetId', async (req, res, next) => {
    try {
      const widgetId = String(req.params.widgetId || '').trim().toUpperCase();
      if (!WIDGET_ID_RE.test(widgetId)) {
        return res.status(400).json({ ok: false, error: 'widgetId không hợp lệ' });
      }
      const payload = await service.getWidgetPublished(widgetId);
      if (!payload) {
        return res.status(404).json({ ok: false, error: 'Chưa có WidgetPublished cho widget này' });
      }
      return sendWithEtag(req, res, payload);
    } catch (err) {
      next(err);
    }
  });

  if (guard) {
    router.post('/admin/publish/widget', guard, async (req, res, next) => {
      try {
        const draft = req.body && req.body.draft;
        const placement = req.body && req.body.placement;
        const artifact = await service.publishWidgetDraft(draft, placement, req.admin && req.admin.email);
        res.json({ ok: true, widget: artifact });
      } catch (err) {
        next(err);
      }
    });

    router.post('/admin/publish/page', guard, async (req, res, next) => {
      try {
        const draft = req.body && req.body.draft;
        const widgetDrafts = (req.body && req.body.widgetDrafts) || {};
        const result = await service.publishPageDraft(draft, widgetDrafts, req.admin && req.admin.email);
        res.json({ ok: true, page: result.page, widgets: result.widgets });
      } catch (err) {
        next(err);
      }
    });
  }

  return router;
}

module.exports = { createWidgetPublishRouter };
