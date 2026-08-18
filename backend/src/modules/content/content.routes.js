'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const content = require('./content.service');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');

function createContentRouter(deps) {
  const router = express.Router();
  const auth = deps.auth || {};
  const config = deps.config || {};
  const perm = function () {
    return requireAdminPermission({ config, auth }, Array.prototype.slice.call(arguments));
  };

  router.get('/articles', async (req, res, next) => {
    try {
      const needsRaw = req.query.needs_review != null ? req.query.needs_review : req.query.incomplete;
      let needsReview;
      if (needsRaw === '1' || needsRaw === 'true') needsReview = true;
      else if (needsRaw === '0' || needsRaw === 'false') needsReview = false;
      const articles = await content.listArticles({
        status: req.query.status,
        topic: req.query.topic,
        symbol: req.query.symbol,
        feedOnly: req.query.feed === '1' || req.query.feed === 'true',
        needsReview: needsReview,
        q: req.query.q,
        source: req.query.source,
        limit: req.query.limit ? Number(req.query.limit) : 50
      });
      const needs_review_count = await content.countNeedsReview();
      return success(res, { articles, total: articles.length, needs_review_count });
    } catch (err) {
      next(err);
    }
  });

  router.get('/articles/:id', async (req, res, next) => {
    try {
      const article = await content.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }
      return success(res, { article });
    } catch (err) {
      next(err);
    }
  });

  const patchArticleSchema = z.object({
    body: z.object({
      title: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      body_text: z.string().optional(),
      category: z.string().optional(),
      category_raw: z.string().optional(),
      tags_raw: z.string().optional(),
      image_url: z.string().optional(),
      author_name: z.string().optional(),
      primary_chu_de_id: z.string().optional(),
      chu_de_id: z.string().optional(),
      chu_de_slug: z.string().optional(),
      chu_de_name: z.string().optional(),
      topics: z.array(z.string()).optional(),
      entities: z
        .array(
          z.object({
            type: z.string(),
            id: z.string(),
            label: z.string().optional(),
            confidence: z.number().optional()
          })
        )
        .optional(),
      publish_to_feed: z.boolean().optional(),
      published_to_feed: z.boolean().optional()
    })
  });

  router.patch(
    '/articles/:id',
    perm('community.articles.edit'),
    validate(patchArticleSchema),
    async (req, res, next) => {
      try {
        const article = await content.updateContentArticle(req.params.id, req.validated.body);
        return success(res, { article });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/topics', async (req, res, next) => {
    try {
      const topics = await content.listTopics({
        status: req.query.status,
        limit: req.query.limit ? Number(req.query.limit) : 40
      });
      return success(res, { topics, total: topics.length });
    } catch (err) {
      next(err);
    }
  });

  /** Top Chủ đề (ứng viên) theo Interest — WGT-COM-CHUDE-TOP */
  router.get('/topics/trending', async (req, res, next) => {
    try {
      const topics = await content.listTrendingTopics({
        period: req.query.period || 'week',
        limit: req.query.limit ? Number(req.query.limit) : 10
      });
      return success(res, {
        topics,
        total: topics.length,
        period: req.query.period || 'week',
        period_days: content.PERIOD_DAYS[req.query.period || 'week'] || 7,
        top_n: req.query.limit ? Number(req.query.limit) : 10,
        weights: content.INTEREST_WEIGHTS
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/stories', async (req, res, next) => {
    try {
      const stories = await content.listStories({
        status: req.query.status,
        limit: req.query.limit ? Number(req.query.limit) : 40
      });
      return success(res, { stories, total: stories.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/stories/:id', async (req, res, next) => {
    try {
      const story = await content.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: 'Không tìm thấy Chủ đề' });
      }
      return success(res, { story });
    } catch (err) {
      next(err);
    }
  });

  router.get('/mappings', async (req, res, next) => {
    try {
      const mappings = await content.listStoryMappings({
        chu_de_id: req.query.chu_de_id || req.query.story_id,
        story_id: req.query.story_id || req.query.chu_de_id,
        slug: req.query.slug,
        ticker: req.query.ticker,
        recompute: req.query.recompute === '1' || req.query.recompute === 'true',
        limit: req.query.limit ? Number(req.query.limit) : 50
      });
      return success(res, {
        mappings,
        total: mappings.length,
        weights: content.RELEVANCE_WEIGHTS
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/feed', async (req, res, next) => {
    try {
      const posts = await content.getFeed(req.query.limit ? Number(req.query.limit) : 30);
      return success(res, { posts, total: posts.length });
    } catch (err) {
      next(err);
    }
  });

  const interestSchema = z.object({
    body: z.object({
      event_type: z.enum(['view', 'search', 'like', 'favorite', 'share', 'comment']),
      topic_id: z.string().optional(),
      topic: z.string().optional(),
      slug: z.string().optional(),
      label: z.string().optional(),
      article_id: z.string().optional(),
      user_id: z.string().optional(),
      meta: z.record(z.any()).optional()
    })
  });

  router.post('/interest', validate(interestSchema), async (req, res, next) => {
    try {
      const event = await content.recordInterestEvent(req.validated.body);
      return success(res, { event }, 201);
    } catch (err) {
      next(err);
    }
  });

  router.post('/interest/recompute', perm('stories.registry.edit'), async (req, res, next) => {
    try {
      const result = await content.recomputeInterestScores({
        period: (req.body && req.body.period) || req.query.period || 'week',
        config: (req.body && req.body.config) || undefined
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/topics/mark-candidates', perm('stories.registry.edit'), async (req, res, next) => {
    try {
      const rows = await content.markCandidates({ config: req.body && req.body.config });
      return success(res, { candidates: rows, total: rows.length });
    } catch (err) {
      next(err);
    }
  });

  const promoteSchema = z.object({
    body: z.object({
      reason: z.string().optional(),
      force: z.boolean().optional()
    }).optional()
  });

  router.post('/topics/:id/promote', perm('stories.registry.edit'), validate(promoteSchema), async (req, res, next) => {
    try {
      const body = (req.validated && req.validated.body) || req.body || {};
      const result = await content.promoteTopic(req.params.id, {
        reason: body.reason,
        force: !!body.force,
        adminId: (req.admin && (req.admin.id || req.admin.username)) || 'admin'
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  const relevanceSchema = z.object({
    body: z.object({
      event_type: z.enum(['view', 'like', 'favorite', 'share', 'comment', 'follow']),
      ticker: z.string().min(1),
      story_id: z.string().optional(),
      topic_id: z.string().optional(),
      topic: z.string().optional(),
      slug: z.string().optional(),
      article_id: z.string().optional(),
      user_id: z.string().optional(),
      weight: z.number().optional(),
      meta: z.record(z.any()).optional()
    })
  });

  router.post('/relevance', validate(relevanceSchema), async (req, res, next) => {
    try {
      const event = await content.recordRelevanceEvent(req.validated.body);
      return success(res, { event }, 201);
    } catch (err) {
      next(err);
    }
  });

  router.post('/relevance/recompute', perm('stories.registry.edit'), async (req, res, next) => {
    try {
      const result = await content.recomputeRelevanceScores({
        storyId: (req.body && (req.body.story_id || req.body.storyId)) || undefined,
        config: (req.body && req.body.config) || undefined
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/topics/auto-promote', perm('stories.registry.edit'), async (req, res, next) => {
    try {
      const result = await content.autoPromoteCandidates({
        forceRun: !!(req.body && req.body.forceRun),
        force: !!(req.body && req.body.force),
        period: (req.body && req.body.period) || 'week',
        config: (req.body && req.body.config) || undefined,
        limit: req.body && req.body.limit,
        promoted_by: (req.admin && (req.admin.id || req.admin.username)) || 'admin'
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  const ingestSchema = z.object({
    body: z.object({
      url: z.string().url(),
      title: z.string().min(3),
      short_description: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      publish_time: z.string().optional(),
      author: z.string().optional(),
      category: z.string().optional(),
      tags: z.string().optional(),
      image_url: z.string().optional(),
      source: z.string().optional(),
      view_counts: z.number().optional(),
      topics: z.array(z.string()).optional(),
      entities: z
        .array(
          z.object({
            type: z.string(),
            id: z.string(),
            label: z.string().optional(),
            confidence: z.number().optional()
          })
        )
        .optional(),
      publishToFeed: z.boolean().optional(),
      sourceCode: z.string().optional()
    })
  });

  router.post(
    '/ingest',
    perm('community.articles.create'),
    validate(ingestSchema),
    async (req, res, next) => {
      try {
        const b = req.validated.body;
        const article = await content.ingestArticle(b, {
          topics: b.topics,
          entities: b.entities,
          publishToFeed: b.publishToFeed === true,
          sourceCode: b.sourceCode
        });
        const full = await content.getArticle(article.id);
        return success(res, { article: full }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  const batchSchema = z.object({
    body: z.object({
      articles: z.array(z.any()).min(1).max(100),
      sourceCode: z.string().optional(),
      publishToFeed: z.boolean().optional()
    })
  });

  router.post(
    '/ingest/batch',
    perm('community.articles.create'),
    validate(batchSchema),
    async (req, res, next) => {
      try {
        const b = req.validated.body;
        const results = [];
        for (let i = 0; i < b.articles.length; i++) {
          const raw = b.articles[i];
          try {
            const article = await content.ingestArticle(raw, {
              topics: raw.topics,
              entities: raw.entities,
              publishToFeed: b.publishToFeed === true,
              sourceCode: b.sourceCode || (raw.source ? 'vnstock:' + raw.source : undefined)
            });
            results.push({
              ok: true,
              id: article.id,
              url: article.external_url,
              needs_review: !!article.needs_review,
              missing_fields: article.missing_fields || []
            });
          } catch (e) {
            results.push({ ok: false, url: raw && raw.url, error: e.message });
          }
        }
        return success(res, {
          ok_count: results.filter(function (r) { return r.ok; }).length,
          fail_count: results.filter(function (r) { return !r.ok; }).length,
          results
        }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post('/ingest/run', perm('community.articles.create'), async (req, res, next) => {
    try {
      const { runVnstockNewsIngest } = require('../../../workers/run-vnstock-ingest');
      const body = req.body || {};
      const apiBase =
        'http://127.0.0.1:' +
        (config.PORT || 3001) +
        (config.LEGACY_API_PREFIX || '/api');
      const out = await runVnstockNewsIngest({
        config: config,
        apiBase: apiBase,
        adminKey: config.ADMIN_API_KEY,
        sites: body.sites || undefined,
        limit: body.limit != null ? Number(body.limit) : undefined,
        dryRun: !!body.dry_run
      });
      const needs_review_count = await content.countNeedsReview();
      return success(res, Object.assign({}, out, { needs_review_count }));
    } catch (err) {
      next(err);
    }
  });


  /* ── Chủ đề (chu-de) — primary API; /stories & /topics giữ alias ── */
  router.get('/chu-de', async (req, res, next) => {
    try {
      const stories = await content.listStories({
        status: req.query.status,
        limit: req.query.limit ? Number(req.query.limit) : 40
      });
      return success(res, { 'chu-de': stories, stories, total: stories.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/chu-de/:id', async (req, res, next) => {
    try {
      const story = await content.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: 'Không tìm thấy Chủ đề' });
      }
      return success(res, { 'chu-de': story, story });
    } catch (err) {
      next(err);
    }
  });

  router.get('/chu-de-ung-vien', async (req, res, next) => {
    try {
      const topics = await content.listTopics({
        status: req.query.status,
        limit: req.query.limit ? Number(req.query.limit) : 40
      });
      return success(res, { 'chu-de-ung-vien': topics, topics, total: topics.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/chu-de-ung-vien/trending', async (req, res, next) => {
    try {
      const topics = await content.listTrendingTopics({
        period: req.query.period || 'week',
        limit: req.query.limit ? Number(req.query.limit) : 10
      });
      return success(res, {
        'chu-de-ung-vien': topics,
        topics,
        total: topics.length,
        period: req.query.period || 'week',
        period_days: content.PERIOD_DAYS[req.query.period || 'week'] || 7,
        top_n: req.query.limit ? Number(req.query.limit) : 10,
        weights: content.INTEREST_WEIGHTS
      });
    } catch (err) {
      next(err);
    }
  });

  /* ── Admin Chủ đề CRUD (ghi DB content_chu_de — không localStorage) ── */
  const chuDeBodySchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    label: z.string().optional(),
    slug: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    lifecycle: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    tickers: z.array(z.string()).optional().nullable(),
    source: z.string().optional().nullable()
  });

  router.get('/admin/chu-de', perm('stories.registry.view'), async (req, res, next) => {
    try {
      const stories = await content.listStories({
        include_all: true,
        status: req.query.status || undefined,
        lifecycle: req.query.lifecycle || undefined,
        q: req.query.q || undefined,
        limit: req.query.limit ? Number(req.query.limit) : 200
      });
      return success(res, { 'chu-de': stories, stories, total: stories.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/chu-de/seed-foundation', perm('stories.registry.create'), async (req, res, next) => {
    try {
      const result = await content.seedFoundationChuDe();
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/chu-de', perm('stories.registry.create'), validate(z.object({ body: chuDeBodySchema })), async (req, res, next) => {
    try {
      const actor = {
        id: (req.admin && (req.admin.id || req.admin.email)) || 'admin',
        name: (req.admin && (req.admin.name || req.admin.email)) || 'Admin'
      };
      const item = await content.upsertChuDeAdmin(req.validated.body, actor);
      return success(res, { 'chu-de': item, story: item }, 201);
    } catch (err) {
      next(err);
    }
  });

  router.put('/admin/chu-de/:id', perm('stories.registry.edit'), validate(z.object({ body: chuDeBodySchema.partial() })), async (req, res, next) => {
    try {
      const actor = {
        id: (req.admin && (req.admin.id || req.admin.email)) || 'admin',
        name: (req.admin && (req.admin.name || req.admin.email)) || 'Admin'
      };
      const item = await content.upsertChuDeAdmin(
        Object.assign({}, req.validated.body, { id: req.params.id }),
        actor
      );
      return success(res, { 'chu-de': item, story: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/chu-de/:id/archive', perm('stories.registry.status_archived'), async (req, res, next) => {
    try {
      const item = await content.archiveChuDeAdmin(req.params.id);
      return success(res, { 'chu-de': item, story: item });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/admin/chu-de/:id', perm('stories.registry.delete'), async (req, res, next) => {
    try {
      const result = await content.deleteChuDeAdmin(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/chu-de/:id/status-new', perm('stories.registry.status_new'), async (req, res, next) => {
    try {
      const item = await content.setChuDeLifecycleAdmin(req.params.id, 'new');
      return success(res, { 'chu-de': item, story: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/chu-de/:id/status-mature', perm('stories.registry.status_mature'), async (req, res, next) => {
    try {
      const item = await content.setChuDeLifecycleAdmin(req.params.id, 'mature');
      return success(res, { 'chu-de': item, story: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/chu-de/:id/status-declining', perm('stories.registry.status_declining'), async (req, res, next) => {
    try {
      const item = await content.setChuDeLifecycleAdmin(req.params.id, 'declining');
      return success(res, { 'chu-de': item, story: item });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createContentRouter };
