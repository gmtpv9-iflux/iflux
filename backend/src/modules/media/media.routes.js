'use strict';

const express = require('express');
const multer = require('multer');
const { requireAdminPermission, requireAdminAnyPermission } = require('../admin-rbac/admin-perm-guard');
const { AppError } = require('../../shared/exceptions/app-error');
const mediaService = require('./media.service');
const mediaImport = require('./media-import.service');
const storage = require('./media-storage');
const articles = require('../news/news-articles.service');
const { mediaRoot } = require('./media-util');

function success(res, data, status) {
  return res.status(status || 200).json({ ok: true, data: data });
}

function createMediaRouter(deps) {
  const config = deps.config;
  const auth = deps.auth;
  const router = express.Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }
  });

  function perm() {
    return requireAdminPermission({ config: config, auth: auth }, Array.prototype.slice.call(arguments));
  }

  function permAny() {
    return requireAdminAnyPermission({ config: config, auth: auth }, Array.prototype.slice.call(arguments));
  }

  var mediaWriteAny = permAny(
    'news.articles.edit',
    'marketing.seo_system.edit',
    'marketing.seo_pages.edit'
  );

  storage.ensureMediaRoot(config);

  router.get('/health', function (req, res) {
    return success(res, {
      service: 'media',
      root: mediaRoot(config),
      public_base: require('./media-util').publicBase(config)
    });
  });

  router.get('/assets', perm('news.articles.view'), async function (req, res, next) {
    try {
      const list = await mediaService.listAssets({
        q: req.query.q,
        status: req.query.status,
        limit: req.query.limit,
        offset: req.query.offset
      });
      return success(res, { assets: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/assets/:id', perm('news.articles.view'), async function (req, res, next) {
    try {
      const asset = await mediaService.getAsset(req.params.id);
      if (!asset) throw AppError.notFound('Không tìm thấy media');
      return success(res, { asset: asset });
    } catch (err) {
      next(err);
    }
  });

  router.get('/assets/:id/usages', perm('news.articles.view'), async function (req, res, next) {
    try {
      const usages = await mediaService.listUsages(req.params.id);
      return success(res, { usages: usages });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/assets/:id', perm('news.articles.edit'), async function (req, res, next) {
    try {
      if (req.body && req.body.alt_text != null) {
        const asset = await mediaService.updateAlt(req.params.id, req.body.alt_text);
        return success(res, { asset: asset });
      }
      throw AppError.badRequest('MEDIA_PATCH', 'Chỉ hỗ trợ cập nhật alt_text');
    } catch (err) {
      next(err);
    }
  });

  router.delete('/assets/:id', perm('news.articles.delete'), async function (req, res, next) {
    try {
      const asset = await mediaService.softDeleteAsset(req.params.id);
      return success(res, { asset: asset });
    } catch (err) {
      next(err);
    }
  });

  router.post('/usages', mediaWriteAny, async function (req, res, next) {
    try {
      const body = req.body || {};
      const assetId = body.asset_id;
      if (!assetId) throw AppError.badRequest('MEDIA_USAGE', 'Thiếu asset_id');
      const scope = String(body.scope || 'ARTICLE').toUpperCase();
      const ownerRef = body.owner_ref != null ? String(body.owner_ref) : '';
      const fieldRef = body.field_ref || 'body';
      const articleId = body.article_id;
      await mediaService.upsertUsageScoped(assetId, scope, ownerRef || articleId, fieldRef, articleId);
      const usages = await mediaService.listUsages(assetId);
      return success(res, { usages: usages });
    } catch (err) {
      next(err);
    }
  });

  router.post('/upload', mediaWriteAny, upload.single('file'), async function (
    req,
    res,
    next
  ) {
    try {
      if (!req.file || !req.file.buffer) {
        throw AppError.badRequest('MEDIA_FILE', 'Thiếu file ảnh');
      }
      const actor = req.admin || req.user || {};
      const created = await mediaService.createAssetFromBuffer(config, req.file.buffer, {
        filenameHint: req.body && (req.body.filename_hint || req.body.title),
        alt: (req.body && req.body.alt) || '',
        channel: 'upload',
        purpose: req.body && (req.body.purpose || req.body.field_ref),
        createdBy: actor.admin_id || actor.email || actor.id
      });
      return success(res, { asset: created.asset, reused: created.reused }, 201);
    } catch (err) {
      next(err);
    }
  });

  router.post('/import', perm('news.articles.edit'), async function (req, res, next) {
    try {
      const articleId = req.body && req.body.article_id;
      if (!articleId) throw AppError.badRequest('MEDIA_IMPORT', 'Thiếu article_id');
      const actor = req.admin || req.user || {};
      const result = await mediaImport.importArticle(config, articleId, actor);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/import/:jobId', perm('news.articles.view'), async function (req, res, next) {
    try {
      const job = await mediaService.getJob(req.params.jobId);
      if (!job) throw AppError.notFound('Không tìm thấy job');
      return success(res, { job: job });
    } catch (err) {
      next(err);
    }
  });

  router.post('/publish-check', perm('news.articles.edit'), async function (
    req,
    res,
    next
  ) {
    try {
      let article = null;
      if (req.body && req.body.article_id) {
        article = await articles.getArticle(req.body.article_id);
        if (!article) throw AppError.notFound('Không tìm thấy bài viết');
      } else {
        article = {
          body_html: (req.body && req.body.body_html) || '',
          cover: (req.body && req.body.cover) || {},
          seo: (req.body && req.body.seo) || {}
        };
      }
      const check = mediaImport.publishCheck(article, config);
      return success(res, check);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMediaRouter };
