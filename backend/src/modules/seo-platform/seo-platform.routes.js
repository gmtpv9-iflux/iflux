'use strict';

/**
 * SEO Platform routes — Contract / shell / sitemap / robots / favicon.
 * Mounted under /api/seo/platform* and root handlers for public discovery URLs.
 */

var express = require('express');
var svc = require('./seo-platform.service');
var indexBoundary = require('./index-boundary');
var health = require('./health');
var headRenderer = require('./head-renderer');

function createSeoPlatformApiRouter() {
  var router = express.Router();

  router.get('/contract', async function (req, res, next) {
    try {
      var path = String(req.query.path || req.query.pathname || '/');
      var contract = await svc.resolveContract({
        path: path,
        pageKey: req.query.pageKey || undefined,
        httpStatus: req.query.httpStatus != null ? Number(req.query.httpStatus) : 200,
        requestedUrl: req.query.url || undefined,
        search: req.query.search || '',
        requestUri: req.query.requestUri || undefined
      });
      res.json({ success: true, data: { contract: contract }, error: null });
    } catch (e) {
      next(e);
    }
  });

  router.get('/shell', async function (req, res, next) {
    try {
      var path = String(req.query.path || '/');
      var requestUri = String(req.query.requestUri || req.headers['x-original-uri'] || path);
      var cleanPath = indexBoundary.stripPublicIdPath(path);
      var out = await svc.renderPublicShell({
        path: cleanPath,
        pageKey: req.query.pageKey || undefined,
        httpStatus: 200,
        requestUri: requestUri
      });
      var robots = (out.contract.indexability && out.contract.indexability.robots) || 'index,follow';
      if (indexBoundary.PUBLIC_ID_RE.test(requestUri) || String(robots).indexOf('noindex') >= 0) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(out.html);
    } catch (e) {
      next(e);
    }
  });

  /** Single-owner title cho Human First HTML (nginx SSI include) — tái dùng resolveContract,
   * KHÔNG resolver mới. Plain text, escape sẵn để nhúng trực tiếp giữa <title>…</title>. */
  router.get('/title-only', async function (req, res, next) {
    try {
      var path = String(req.query.path || '/');
      var contract = await svc.resolveContract({
        path: path,
        httpStatus: 200,
        requestUri: req.query.requestUri || path
      });
      var doc = contract.document || {};
      var title = String(doc.documentTitle || doc.title || 'iFlux');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(headRenderer.escapeHtmlAttr(title));
    } catch (e) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send('iFlux');
    }
  });

  /** P7 — Preview from Contract (Google / OG / Twitter) — no second engine. */
  router.get('/preview', async function (req, res, next) {
    try {
      var path = String(req.query.path || '/');
      var contract = await svc.resolveContract({
        path: path,
        pageKey: req.query.pageKey || undefined,
        httpStatus: req.query.httpStatus != null ? Number(req.query.httpStatus) : 200,
        requestUri: req.query.requestUri || undefined,
        search: req.query.search || ''
      });
      var preview = health.buildPreviewFromContract(contract);
      var healthOut = health.evaluateSeoHealth(contract, {
        html: '<head>\n' + preview.headHtml + '</head>'
      });
      res.json({
        success: true,
        data: {
          preview: preview,
          health: healthOut,
          contractTrace: contract.trace || null
        },
        error: null
      });
    } catch (e) {
      next(e);
    }
  });

  /** P7 — Health matrix over Contract. */
  router.get('/health', async function (req, res, next) {
    try {
      var path = String(req.query.path || '/');
      var httpStatus = req.query.httpStatus != null ? Number(req.query.httpStatus) : 200;
      var contract = await svc.resolveContract({
        path: path,
        pageKey: req.query.pageKey || undefined,
        httpStatus: httpStatus,
        requestUri: req.query.requestUri || undefined,
        search: req.query.search || ''
      });
      var html = headRenderer.renderShellHtml(contract);
      var out = health.evaluateSeoHealth(contract, { html: html });
      res.json({ success: true, data: { health: out, pageKey: contract.pageKey }, error: null });
    } catch (e) {
      next(e);
    }
  });

  /** P7 — Observability chain URL → resolve → Contract → render → health. */
  router.get('/inspect', async function (req, res, next) {
    try {
      var path = String(req.query.path || '/');
      var requestUri = req.query.requestUri || undefined;
      var contract = await svc.resolveContract({
        path: path,
        pageKey: req.query.pageKey || undefined,
        httpStatus: req.query.httpStatus != null ? Number(req.query.httpStatus) : 200,
        requestUri: requestUri,
        search: req.query.search || '',
        requestedUrl: req.query.url || undefined
      });
      var bundle = health.buildObservabilityBundle(contract, {
        path: path,
        requestUri: requestUri
      });
      bundle.gaps = {
        versionHistory: false,
        rollbackUx: false,
        adminSeoTree: 'Foundation Thiết lập SEO (không duplicate)',
        rbac: ['marketing.seo_system.view', 'marketing.seo_system.edit', 'marketing.seo_pages.view', 'marketing.seo_pages.edit'],
        favicon: 'GET /favicon.ico → Foundation favicon_url'
      };
      res.json({ success: true, data: bundle, error: null });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

function mountSeoPlatformPublicRoots(app) {
  async function sendSitemap(res, next) {
    try {
      var out = await svc.buildSitemapXml();
      res.setHeader('Content-Type', out.contentType || 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      if (out.stats) res.setHeader('X-IFlux-Sitemap-Urls', String(out.stats.totalUrls || 0));
      res.status(200).send(out.body);
    } catch (e) {
      next(e);
    }
  }

  app.get('/sitemap.xml', function (req, res, next) {
    sendSitemap(res, next);
  });

  app.get('/sitemap-:n.xml', async function (req, res, next) {
    try {
      var xml = await svc.buildSitemapChunkXml(req.params.n);
      if (!xml) return res.status(404).type('text/plain').send('Sitemap chunk không tồn tại');
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.status(200).send(xml);
    } catch (e) {
      next(e);
    }
  });

  app.get('/robots.txt', function (req, res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(svc.buildRobotsTxt());
  });

  app.get('/favicon.ico', async function (req, res, next) {
    try {
      var url = await svc.resolveFaviconRedirect();
      if (url) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.redirect(302, url);
      }
      res.status(404).type('text/plain').send('Favicon chưa cấu hình trong Thiết lập SEO hệ thống');
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/sitemap.xml', function (req, res, next) {
    sendSitemap(res, next);
  });
  app.get('/api/robots.txt', function (req, res) {
    res.type('text/plain').send(svc.buildRobotsTxt());
  });
}

module.exports = {
  createSeoPlatformApiRouter,
  mountSeoPlatformPublicRoots
};
