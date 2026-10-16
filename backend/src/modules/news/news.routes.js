'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { query } = require('../../core/database/connection');
const { listPosts, createPost } = require('./news.service');
  const comments = require('./news-comments.service');
  const categories = require('./news-categories.service');
  const articles = require('./news-articles.service');
  const interaction = require('./interaction.service');
  const feed = require('./news-feed.service');
  const rssProviders = require('./rss-providers.service');
  const entityFollow = require('./entity-follow.service');
  const hot = require('./news-hot.service');
const events = require('./news-events.service');
const comparisons = require('../market/market-comparisons.service');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');

const categoryBodySchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().max(160).optional().nullable(),
  description: z.string().optional().nullable(),
  icon: z.string().max(64).optional().nullable(),
  color: z.string().max(32).optional().nullable(),
  cover_url: z.string().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_visible: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  seo_title: z.string().max(255).optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_keywords: z.string().optional().nullable(),
  created_by_name: z.string().max(120).optional().nullable()
});

function createNewsRouter(deps) {
  const router = express.Router();
  const config = deps.config || {};
  const auth = deps.auth || {};
  const perm = function () {
    return requireAdminPermission({ config, auth }, Array.prototype.slice.call(arguments));
  };

  router.get('/events', validate(z.object({ query: z.object({ ticker: z.string().trim().toUpperCase().min(1).max(10) }) })), async (req, res, next) => {
    try {
      const ticker = req.validated.query.ticker;
      return success(res, { milestones: await events.timelineForStock(ticker) });
    } catch (err) { next(err); }
  });

  router.get('/admin/comparison-metrics', perm('news.articles.view'), (req, res) => success(res, { metrics: comparisons.metricCatalog() }));

  const aiJobs = require('./news-ai-jobs.service');
  router.get('/admin/ai/jobs', perm('news.articles.view'), async (req,res,next) => {
    try { return success(res,{ jobs:await aiJobs.listJobs() }); } catch(err) { next(err); }
  });
  router.get('/admin/ai/jobs/:id', perm('news.articles.view'), validate(z.object({ params:z.object({ id:z.string().uuid() }) })), async (req,res,next) => {
    try { return success(res,{ job:await aiJobs.getJob(req.validated.params.id) }); } catch(err) { next(err); }
  });
  router.post('/admin/ai/jobs', perm('news.articles.edit'), validate(z.object({ body:z.object({ source_post_id:z.string().min(1).max(160) }).strict() })), async (req,res,next) => {
    try {
      const job = await aiJobs.enqueueSource(req.validated.body.source_post_id,config);
      if (!job) throw AppError.badRequest('AI_DISABLED_OR_SOURCE_INVALID','AI chưa bật hoặc bài không phải nguồn RSS đang chờ');
      return success(res,{job},202);
    } catch(err) { next(err); }
  });
  router.post('/admin/ai/jobs/:id/retry', perm('news.articles.edit'), validate(z.object({ params:z.object({ id:z.string().uuid() }) })), async (req,res,next) => {
    try { return success(res,{job:await aiJobs.retryJob(req.validated.params.id)}); } catch(err) { next(err); }
  });

  // AI Programmatic SEO — Tab Thống kê + Tab Instruction (Owner 2026-10-16, Admin → Thiết lập SEO).
  const aiProgConfig = require('./news-ai-config.service');
  const { listModels } = require('../ai/openai-responses.provider');
  const PROMPT_CODE = 'news-editorial-v2';
  router.get('/admin/news-ai/stats', perm('news.articles.view'), async (req,res,next) => {
    try {
      const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
      return success(res, await aiJobs.getStats(days));
    } catch(err) { next(err); }
  });
  router.get('/admin/news-ai/config', perm('news.articles.view'), async (req,res,next) => {
    try { return success(res, await aiProgConfig.getConfig()); } catch(err) { next(err); }
  });
  router.patch('/admin/news-ai/config', perm('news.articles.edit'),
    validate(z.object({ body: z.object({
      enabled: z.boolean().optional(),
      auto_publish: z.boolean().optional(),
      model: z.string().max(80).nullable().optional(),
      daily_token_budget: z.number().int().min(0).optional()
    }).strict() })),
    async (req,res,next) => {
      try { return success(res, await aiProgConfig.setConfig(req.validated.body)); } catch(err) { next(err); }
    });
  router.get('/admin/news-ai/models', perm('news.articles.view'), async (req,res,next) => {
    try { return success(res, { models: await listModels(config) }); } catch(err) { next(err); }
  });
  router.get('/admin/news-ai/instruction', perm('news.articles.view'), async (req,res,next) => {
    try {
      const row = (await query(`SELECT code,name,body,status,updated_at FROM ai_prompts WHERE code=$1`,[PROMPT_CODE])).rows[0];
      if (!row) throw AppError.notFound('Chưa có prompt news-editorial-v2');
      return success(res, row);
    } catch(err) { next(err); }
  });
  router.patch('/admin/news-ai/instruction', perm('news.articles.edit'),
    validate(z.object({ body: z.object({ body: z.string().min(1).max(20000) }).strict() })),
    async (req,res,next) => {
      try {
        const res2 = await query(`UPDATE ai_prompts SET body=$2,status='active',updated_at=NOW() WHERE code=$1 RETURNING code,name,body,status,updated_at`,[PROMPT_CODE,req.validated.body.body]);
        if (!res2.rows[0]) throw AppError.notFound('Chưa có prompt news-editorial-v2');
        return success(res, res2.rows[0]);
      } catch(err) { next(err); }
    });

  router.get('/admin/event-cases', perm('news.articles.view'), validate(z.object({ query: z.object({ story_id: z.string().uuid().optional() }) })), async (req, res, next) => {
    try {
      const storyId = req.validated.query.story_id || null;
      return success(res, { cases: await events.listCases(storyId) });
    } catch (err) { next(err); }
  });
  router.post('/admin/event-cases', perm('news.articles.edit'), validate(z.object({ body: events.caseSchema })), async (req, res, next) => {
    try { return success(res, { case: await events.createCase(req.validated.body, req.admin) }, 201); }
    catch (err) { next(err); }
  });
  router.post('/admin/event-cases/:id/milestones', perm('news.articles.edit'), validate(z.object({ body: events.milestoneSchema, params: z.object({ id: z.string().uuid() }) })), async (req, res, next) => {
    try {
      const id = req.validated.params.id;
      return success(res, { milestone: await events.addMilestone(id, req.validated.body, req.admin) }, 201);
    } catch (err) { next(err); }
  });

  /**
   * "Bạn đang quan tâm" — Tab Tin tức (migration 085). Auth bắt buộc (follow gắn theo user).
   * GET /news/followed → FeedCard[] OR theo mọi thực thể user đang Follow.
   */
  router.get('/followed', deps.auth.authenticate, async (req, res, next) => {
    try {
      const followed = await entityFollow.listFollowed(req.user.id);
      const data = await feed.listFollowedFeed(followed, {
        limit: req.query.limit ? Number(req.query.limit) : 30,
        offset: req.query.offset ? Number(req.query.offset) : 0,
        cursor: req.query.cursor || null
      });
      return success(res, {
        cards: data.cards,
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        has_more: data.has_more === true,
        next_cursor: data.next_cursor || null,
        has_follows: !!(followed.stocks.length || followed.sectors.length || followed.ecosystems.length || followed.stories.length)
      });
    } catch (err) {
      next(err);
    }
  });

  const followBodySchema = z.object({
    body: z.object({
      entity_type: z.enum(entityFollow.ENTITY_TYPES),
      entity_id: z.string().min(1).max(160)
    })
  });

  router.post('/follow', deps.auth.authenticate, validate(followBodySchema), async (req, res, next) => {
    try {
      const data = await entityFollow.follow(req.user.id, req.validated.body.entity_type, req.validated.body.entity_id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/unfollow', deps.auth.authenticate, validate(followBodySchema), async (req, res, next) => {
    try {
      const data = await entityFollow.unfollow(req.user.id, req.validated.body.entity_type, req.validated.body.entity_id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/follows', deps.auth.authenticate, async (req, res, next) => {
    try {
      const data = await entityFollow.listFollowed(req.user.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  /**
   * "Tin nóng" (migration 085) — xếp hạng theo điểm Bình luận=5/Đăng lại=3/Chia sẻ=2/Thích=1
   * trong khung giờ range (day/week/month, rolling window). Public (không cần đăng nhập).
   * GET /news/hot?range=day|week|month&limit=
   */
  router.get('/hot', async (req, res, next) => {
    try {
      const range = ['day', 'week', 'month'].indexOf(req.query.range) >= 0 ? req.query.range : 'week';
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const ranked = await hot.getHotPostIds(range, limit);
      const cardsById = {};
      (await feed.getFeedCardsByIds(ranked.map((r) => r.news_post_id))).forEach((c) => { cardsById[c.id] = c; });
      const cards = ranked
        .map((r) => {
          const card = cardsById[r.news_post_id];
          if (!card) return null;
          return Object.assign({}, card, {
            hot_score: Number(r.score),
            hot_breakdown: { comments: r.comments, reposts: r.reposts, shares: r.shares, likes: r.likes }
          });
        })
        .filter(Boolean);
      return success(res, { cards, total: cards.length, range });
    } catch (err) {
      next(err);
    }
  });

  /**
   * SoT FeedCard — semantic list (không đổi GET /posts legacy).
   * GET /news/feed → FeedCard[] (Forbidden: body, body_html, …)
   */
  router.get('/feed', async (req, res, next) => {
    try {
      const data = await feed.listFeed({
        content_type: req.query.type || req.query.content_type,
        type: req.query.type,
        limit: req.query.limit ? Number(req.query.limit) : 30,
        offset: req.query.offset ? Number(req.query.offset) : 0,
        ticker: req.query.ticker || null,
        category_id: req.query.category_id || null,
        story_id: req.query.story_id || null,
        sector: req.query.sector || null,
        ecosystem: req.query.ecosystem || null,
        related_to: req.query.related_to || null,
        related_group: req.query.related_group || null,
        related_preview: req.query.related_preview === '1',
        group_by: req.query.group_by || null,
        cursor: req.query.cursor || null,
        exclude_id: req.query.exclude_id || null
      });
      return success(res, {
        cards: data.cards,
        posts: data.cards,
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        has_more: data.has_more === true,
        next_cursor: data.next_cursor || null,
        section_date: data.section_date || null
      });
    } catch (err) {
      next(err);
    }
  });

  /* Legacy list — giữ nguyên schema; FE Critical Path không còn gọi. */
  router.get('/posts', async (req, res, next) => {
    try {
      const posts = await listPosts({
        content_type: req.query.type,
        limit: req.query.limit ? Number(req.query.limit) : 50
      });
      return success(res, { posts, total: posts.length });
    } catch (err) {
      next(err);
    }
  });

  /* SoT bình luận — Server owns; User Web Store chỉ mirror runtime */
  router.get('/posts/:idOrSlug/comments', async (req, res, next) => {
    try {
      const data = await comments.listComments(req.params.idOrSlug, {
        limit: req.query.limit ? Number(req.query.limit) : 100,
        offset: req.query.offset ? Number(req.query.offset) : 0
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  /* RC-API-01 — Interaction Summary counts-only (không comments[]) */
  router.get('/interaction/summary', deps.auth.optionalAuth, async (req, res, next) => {
    try {
      const data = await interaction.getSummary(req.query.type, req.query.id, req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  const mutateSchema = z.object({
    body: z.object({
      type: z.string().optional(),
      action: z.enum(['like', 'unlike', 'favorite', 'unfavorite', 'share_bump'])
    })
  });

  /* RC-API-03 — mutation; RC-API-07 client phải refresh projection sau success */
  router.post(
    '/interaction/:idOrSlug/mutate',
    deps.auth.authenticate,
    validate(mutateSchema),
    async (req, res, next) => {
      try {
        const data = await interaction.mutate(
          req.params.idOrSlug,
          req.user,
          req.validated.body.action
        );
        return success(res, data);
      } catch (err) {
        next(err);
      }
    }
  );

  const createCommentSchema = z.object({
    body: z.object({
      body: z.string().max(4000).optional().nullable(),
      image: z.string().optional().nullable(),
      image_url: z.string().optional().nullable()
    })
  });

  router.post(
    '/posts/:idOrSlug/comments',
    deps.auth.authenticate,
    validate(createCommentSchema),
    async (req, res, next) => {
      try {
        const data = await comments.createComment(req.params.idOrSlug, req.user, req.validated.body);
        return success(res, data, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/articles/:idOrSlug/comments', async (req, res, next) => {
    try {
      const data = await comments.listComments(req.params.idOrSlug, {
        limit: req.query.limit ? Number(req.query.limit) : 100,
        offset: req.query.offset ? Number(req.query.offset) : 0
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/articles/:idOrSlug/comments',
    deps.auth.authenticate,
    validate(createCommentSchema),
    async (req, res, next) => {
      try {
        const data = await comments.createComment(req.params.idOrSlug, req.user, req.validated.body);
        return success(res, data, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  const createSchema = z.object({
    body: z.object({
      title: z.string().min(3),
      excerpt: z.string().optional(),
      body_html: z.string().optional(),
      content_type: z.string().optional(),
      tickers: z.array(z.string()).optional(),
      slug: z.string().optional(),
      display_name: z.string().optional(),
      category_id: z.string().uuid().optional(),
      story_id: z.string().uuid().optional().nullable(),
      sectors: z.array(z.string()).optional(),
      ecosystems: z.array(z.string()).optional(),
      exchange: z.string().optional().nullable(),
      status: z.enum(['draft', 'pending']).optional(),
      seo: z.any().optional(),
      display: z.any().optional(),
      cover: z.any().optional()
    })
  });

  router.post('/posts', deps.auth.authenticate, validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const user = req.user;
      /* Nếu có category → dùng Article SoT (story_id tuỳ chọn, gắn Story đã hình thành) */
      if (b.category_id) {
        const item = await articles.createArticle(
          Object.assign({}, b, { status: b.status || 'pending' }),
          {
            id: user.id,
            user_id: user.id,
            name: b.display_name || 'Thành viên',
            tier: user.tier || 'free',
            tier_label: user.tier || 'free'
          }
        );
        return success(res, { post: item, article: item }, 201);
      }
      const post = await createPost(user.id, {
        status: b.status || 'pending',
        title: b.title,
        excerpt: b.excerpt || '',
        body_html: b.body_html || '',
        content_type: b.content_type || 'news',
        tickers: b.tickers || [],
        slug: b.slug || '',
        author: {
          id: user.id,
          display_name: b.display_name || 'Thành viên',
          tier: user.tier || 'free',
          tier_label: user.tier || 'free'
        }
      });
      return success(res, { post }, 201);
    } catch (err) {
      next(err);
    }
  });

  /* ── Public categories (visible only) ── */
  router.get('/categories', async (req, res, next) => {
    try {
      const list = await categories.listCategories({
        visibleOnly: true,
        featuredOnly: req.query.featured === '1' || req.query.featured === 'true',
        q: req.query.q || null
      });
      return success(res, { categories: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/categories/:idOrSlug', async (req, res, next) => {
    try {
      const key = req.params.idOrSlug;
      let item = null;
      if (/^[0-9a-f-]{36}$/i.test(key)) {
        item = await categories.getCategory(key);
      }
      if (!item) item = await categories.getCategoryBySlug(key);
      if (!item || !item.is_visible) {
        return res.status(404).json({ error: 'Không tìm thấy danh mục' });
      }
      return success(res, { category: item });
    } catch (err) {
      next(err);
    }
  });

  /* ── Admin categories CRUD ── */
  router.get('/admin/categories', perm('news.categories.view'), async (req, res, next) => {
    try {
      const list = await categories.listCategories({
        q: req.query.q || null,
        parent_id: req.query.parent_id === 'null' ? null : (req.query.parent_id || undefined)
      });
      return success(res, { categories: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/categories/:id', perm('news.categories.view'), async (req, res, next) => {
    try {
      const item = await categories.getCategory(req.params.id);
      if (!item) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
      return success(res, { category: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/admin/categories',
    perm('news.categories.create'),
    validate(z.object({ body: categoryBodySchema })),
    async (req, res, next) => {
      try {
        const actor = (req.body && req.body.created_by_name) || 'Admin';
        const item = await categories.createCategory(req.validated.body, actor);
        return success(res, { category: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.put(
    '/admin/categories/:id',
    perm('news.categories.edit'),
    validate(z.object({ body: categoryBodySchema.partial() })),
    async (req, res, next) => {
      try {
        const item = await categories.updateCategory(req.params.id, req.validated.body);
        return success(res, { category: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/admin/categories/:id', perm('news.categories.delete'), async (req, res, next) => {
    try {
      const result = await categories.deleteCategory(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/categories/:id/status-visible', perm('news.categories.status_visible'), async (req, res, next) => {
    try {
      const item = await categories.updateCategory(req.params.id, { is_visible: true });
      return success(res, { category: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/categories/:id/status-hidden', perm('news.categories.status_hidden'), async (req, res, next) => {
    try {
      const item = await categories.updateCategory(req.params.id, { is_visible: false });
      return success(res, { category: item });
    } catch (err) {
      next(err);
    }
  });

  /* ── Articles (Tạo bài viết SoT) ── */
  const articleBodySchema = z.object({
    title: z.string().min(1).max(500),
    slug: z.string().max(160).optional().nullable(),
    excerpt: z.string().optional().nullable(),
    body_html: z.string().optional().nullable(),
    body: z.string().optional().nullable(),
    section_manifest: z.array(z.object({
      section_id: z.string().regex(/^ifx-section-\d+$/), h2: z.string().min(1).max(240),
      fact_ids: z.array(z.string().min(1).max(100)).max(60), event_refs: z.array(z.string().min(1).max(100)).max(60)
    }).strict()).max(30).optional(),
    content_type: z.string().optional().nullable(),
    category_id: z.string().uuid(),
    category_name: z.string().optional().nullable(),
    story_id: z.string().uuid().optional().nullable(),
    event_case_ids: z.array(z.string().uuid()).max(20).optional(),
    comparison: comparisons.comparisonSchema.optional().nullable(),
    iflux_insight: z.string().trim().min(400).max(600).optional().nullable(),
    tickers: z.array(z.string()).max(5).optional().nullable(),
    sectors: z.array(z.string()).max(3).optional().nullable(),
    ecosystems: z.array(z.string()).max(3).optional().nullable(),
    exchange: z.string().max(32).optional().nullable(),
    cover: z
      .object({
        url: z.string().optional().nullable(),
        alt: z.string().optional().nullable(),
        caption: z.string().optional().nullable(),
        credit: z.string().optional().nullable()
      })
      .optional()
      .nullable(),
    cover_url: z.string().optional().nullable(),
    seo: z
      .object({
        title: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        keywords: z.string().optional().nullable(),
        canonical: z.string().optional().nullable(),
        meta_title: z.string().optional().nullable(),
        meta_description: z.string().optional().nullable(),
        og_title: z.string().optional().nullable(),
        og_description: z.string().optional().nullable(),
        og_image: z.string().optional().nullable(),
        og_image_alt: z.string().optional().nullable(),
        robots: z.enum(['index,follow','noindex,follow','noindex,nofollow','noindex']).optional().nullable()
      })
      .optional()
      .nullable(),
    status: z.enum(['draft', 'pending', 'published', 'published_rss', 'scheduled']).optional(),
    display: z
      .object({
        featured: z.boolean().optional(),
        pin: z.boolean().optional(),
        sticky: z.boolean().optional(),
        comments: z.boolean().optional(),
        share: z.boolean().optional()
      })
      .optional()
      .nullable(),
    scheduled_at: z.string().optional().nullable(),
    publish_at: z.string().optional().nullable(),
    created_by_name: z.string().optional().nullable()
  });

  router.get('/articles', validate(z.object({ query: z.object({ status: z.enum(['published','published_rss']).optional() }) })), async (req, res, next) => {
    try {
      const list = await articles.listArticles({
        status: req.validated.query.status,
        q: req.query.q,
        category_id: req.query.category_id,
        story_id: req.query.story_id,
        limit: req.query.limit ? Number(req.query.limit) : 50
      });
      return success(res, { articles: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  /* Pipeline A: article → SEO Contract → one Head Renderer. */
  router.get('/articles/:idOrSlug/open-graph', async (req, res, next) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const item = await articles.getArticle(idOrSlug);
      const origin = articles.PUBLIC_ORIGIN || 'https://iflux.vn';
      const requestUri = String(req.headers['x-original-uri'] || req.headers['x-iflux-request-uri'] || '');
      if (!item) {
        const seoPlatform = require('../seo-platform/seo-platform.service');
        const path = '/tin-tuc/bai-viet/' + encodeURIComponent(idOrSlug);
        const out = await seoPlatform.renderHttpErrorShell({
          path: path,
          pageKey: 'news',
          httpStatus: 404,
          requestUri: requestUri || path,
          origin: origin
        });
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        res.status(404).type('html').send(out.html);
        return;
      }
      if (idOrSlug !== item.id && idOrSlug !== item.slug) {
        res.redirect(301, articles.articlePublicPath(item.slug));
        return;
      }
      await articles.attachArticleMetadata(item, origin, {
        requestUri: requestUri || undefined,
        search: req.url && req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?')) : undefined
      });
      if (item.seoContract && item.seoContract.indexability &&
          String(item.seoContract.indexability.robots || '').indexOf('noindex') >= 0) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      }
      res
        .status(200)
        .type('html')
        .set('Cache-Control', 'public, max-age=300')
        .send(articles.renderOpenGraphHtml(item.metadata));
    } catch (err) {
      next(err);
    }
  });

  /* Pipeline B: SPA shell + Contract head (singleton). */
  router.get('/articles/:idOrSlug/spa', async (req, res, next) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const item = await articles.getArticle(idOrSlug);
      const origin = articles.PUBLIC_ORIGIN || 'https://iflux.vn';
      const requestUri = String(req.headers['x-original-uri'] || req.headers['x-iflux-request-uri'] || '');
      if (!item) {
        const seoPlatform = require('../seo-platform/seo-platform.service');
        const path = '/tin-tuc/bai-viet/' + encodeURIComponent(idOrSlug);
        const out = await seoPlatform.renderHttpErrorShell({
          path: path,
          pageKey: 'news',
          httpStatus: 404,
          requestUri: requestUri || path,
          origin: origin
        });
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        res.status(404).type('html').send(out.html);
        return;
      }
      if (idOrSlug !== item.id && idOrSlug !== item.slug) {
        res.redirect(301, articles.articlePublicPath(item.slug));
        return;
      }
      await articles.attachArticleMetadata(item, origin, {
        requestUri: requestUri || undefined,
        search: req.url && req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?')) : undefined
      });
      if (item.seoContract && item.seoContract.indexability &&
          String(item.seoContract.indexability.robots || '').indexOf('noindex') >= 0) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      }
      res
        .status(200)
        .type('html')
        .set('Cache-Control', 'public, max-age=60')
        .send(articles.renderArticleSpaHtml(item.metadata));
    } catch (err) {
      next(err);
    }
  });

  router.get('/articles/:idOrSlug', async (req, res, next) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const item = await articles.getArticle(idOrSlug);
      if (!item || !articles.isLivePublished(item.status)) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      if (idOrSlug !== item.id && idOrSlug !== item.slug) {
        res.redirect(301, articles.articlePublicPath(item.slug));
        return;
      }
      const requestUri = String(req.headers['x-original-uri'] || req.headers['x-iflux-request-uri'] || '');
      await articles.attachArticleMetadata(item, articles.PUBLIC_ORIGIN || 'https://iflux.vn', {
        requestUri: requestUri || undefined
      });
      item.body_html = await require('../media/media.service').useArticleDetailImageVariants(item.body_html || item.body || '');
      res.set('Cache-Control', 'public, max-age=0, must-revalidate');
      item.event_timeline = await events.timelineForArticle(item);
      item.comparison_data = item.status === 'published' ? (item.comparison_snapshot || null) : null;
      delete item.comparison_snapshot;
      if (item.status !== 'published') res.set('X-Robots-Tag', 'noindex, nofollow');
      return success(res, { article: item });
    } catch (err) {
      next(err);
    }
  });

  /* Tin tức gắn Thực thể ĐÃ HÌNH THÀNH (Owner 2026-10) — gợi ý Story, không còn Topic/Chủ đề
     tự tạo (content_chu_de đã dọn, xem migration 075). */
  router.get('/chu-de/suggest', async (req, res, next) => {
    try {
      const list = await articles.suggestStories(req.query.q || req.query.title || '', req.query.limit);
      return success(res, { suggestions: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  /* Public list — User Web /tin-tuc/chu-de (duyệt bài theo Story đã hình thành) */
  router.get('/chu-de', async (req, res, next) => {
    try {
      const stories = require('../community/stories.service');
      const list = await stories.listStories({
        limit: req.query.limit ? Number(req.query.limit) : 200
      });
      return success(res, { chu_de: list.items, total: list.items.length });
    } catch (err) {
      next(err);
    }
  });

  /* Public list — User Web /tin-tuc/tac-gia */
  router.get('/authors', async (req, res, next) => {
    try {
      const list = await articles.listAuthorsAdmin({
        q: req.query.q,
        limit: req.query.limit ? Number(req.query.limit) : 200
      });
      return success(res, { authors: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/articles', perm('news.articles.view'), async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);
      const result = await articles.listArticles({
        include_all: true,
        status: req.query.status || undefined,
        q: req.query.q,
        category_id: req.query.category_id,
        story_id: req.query.story_id,
        page,
        limit,
        withTotal: true
      });
      const list = Array.isArray(result) ? result : (result.articles || []);
      const total = typeof result === 'object' && result.total != null ? result.total : list.length;
      return success(res, {
        articles: list,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/authors', perm('news.experts.view'), async (req, res, next) => {
    try {
      const list = await articles.listAuthorsAdmin({
        q: req.query.q,
        limit: req.query.limit ? Number(req.query.limit) : 200
      });
      return success(res, { authors: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/rss-ingest/run', perm('news.rss_article_schema.execute'), async (req, res, next) => {
    try {
      const { runRssNewsIngest } = require('./rss-ingest.service');
      const limit = req.body && req.body.limitPerFeed != null ? Number(req.body.limitPerFeed) : undefined;
      const out = await runRssNewsIngest({ limitPerFeed: limit });
      return success(res, out);
    } catch (err) {
      next(err);
    }
  });

  /* WP-10 — backfill entity resolve (Stock + Eco ≥3) trên bài đã có body */
  router.post('/admin/articles/entity-backfill', perm('news.rss_article_schema.execute'), async (req, res, next) => {
    try {
      const { backfillArticleEntities } = require('./rss-ingest.service');
      const limit = req.body && req.body.limit != null ? Number(req.body.limit) : 50;
      const offset = req.body && req.body.offset != null ? Number(req.body.offset) : 0;
      const out = await backfillArticleEntities({ limit: limit, offset: offset });
      return success(res, out);
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/articles/:id', perm('news.articles.view'), async (req, res, next) => {
    try {
      const item = await articles.getArticle(req.params.id);
      if (!item) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      return success(res, { article: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/admin/articles',
    perm('news.articles.create'),
    validate(z.object({ body: articleBodySchema })),
    async (req, res, next) => {
      try {
        const actor = {
          id: (req.admin && req.admin.id) || 'admin',
          name: (req.body && req.body.created_by_name) || (req.admin && (req.admin.name || req.admin.email)) || 'Admin',
          tier: 'admin',
          tier_label: 'Admin'
        };
        const item = await articles.createArticle(req.validated.body, actor);
        return success(res, { article: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.put(
    '/admin/articles/:id',
    perm('news.articles.edit'),
    validate(z.object({ body: articleBodySchema.partial().extend({ category_id: z.string().uuid().optional() }) })),
    async (req, res, next) => {
      try {
        const actor = {
          id: (req.admin && req.admin.id) || 'admin',
          name: (req.body && req.body.created_by_name) || (req.admin && (req.admin.name || req.admin.email)) || 'Admin',
          tier: 'admin',
          tier_label: 'Admin'
        };
        const item = await articles.updateArticle(req.params.id, req.validated.body, actor);
        return success(res, { article: item });
      } catch (err) {
        next(err);
      }
    }
  );

  /* Duyệt tay job AI needs_review: Admin xem/sửa bản nháp AI soạn (giống trang edit bài thường)
     rồi Duyệt & Xuất bản → status='publish_AI' (khác 'published' chỉ ở KHÔNG vào sitemap/Google
     Index — xem comment STATUSES trong news-articles.service.js). Owner 2026-10-16. */
  router.post(
    '/admin/ai/jobs/:id/approve',
    perm('news.articles.edit'),
    validate(z.object({
      params: z.object({ id: z.string().uuid() }),
      body: articleBodySchema.partial().extend({ category_id: z.string().uuid().optional() })
    })),
    async (req, res, next) => {
      try {
        const actor = {
          id: (req.admin && req.admin.id) || 'admin',
          name: (req.body && req.body.created_by_name) || (req.admin && (req.admin.name || req.admin.email)) || 'Admin',
          tier: 'admin',
          tier_label: 'Admin'
        };
        const result = await aiJobs.approveJob(req.validated.params.id, req.validated.body, actor);
        return success(res, result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/admin/articles/:id', perm('news.articles.delete'), async (req, res, next) => {
    try {
      const result = await articles.deleteArticle(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /* ── news.stories (Kiểm duyệt chủ đề / story posts) — Phase C3 ── */

  router.get('/admin/stories/posts', perm('news.stories.view'), async (req, res, next) => {
    try {
      const list = await articles.listArticles({
        include_all: true,
        status: req.query.status || undefined,
        q: req.query.q,
        story_id: req.query.story_id,
        limit: req.query.limit ? Number(req.query.limit) : 100
      });
      return success(res, { posts: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/admin/stories/posts/:id',
    perm('news.stories.edit'),
    validate(z.object({
      body: z.object({
        title: z.string().min(1).optional(),
        body_html: z.string().optional(),
        excerpt: z.string().optional(),
        status: z.enum(['draft', 'pending', 'published', 'published_rss', 'scheduled']).optional()
      })
    })),
    async (req, res, next) => {
      try {
        const actor = {
          id: (req.admin && req.admin.id) || 'admin',
          name: (req.admin && (req.admin.name || req.admin.email)) || 'Admin'
        };
        const item = await articles.editStoryPost(req.params.id, req.validated.body, actor);
        return success(res, { post: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/admin/stories/posts/:id', perm('news.stories.delete'), async (req, res, next) => {
    try {
      const result = await articles.deleteArticle(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  function storyModActor(req) {
    return {
      id: (req.admin && req.admin.id) || 'admin',
      name: (req.admin && (req.admin.name || req.admin.email)) || 'Admin'
    };
  }

  router.post('/admin/stories/posts/:id/publish', perm('news.stories.publish'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'publish', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/stories/posts/:id/feature', perm('news.stories.feature_post'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'feature', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/stories/posts/:id/pin', perm('news.stories.pin_post'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'pin', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/stories/posts/:id/lock', perm('news.stories.lock_post'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'lock', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  /* ── news.rss_providers (Nguồn RSS) — Phase C4 ── */

  router.get('/admin/rss-providers', perm('news.rss_providers.view'), async (req, res, next) => {
    try {
      const list = await rssProviders.listProviders({
        q: req.query.q,
        status: req.query.status
      });
      return success(res, { providers: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/rss-providers/:id', perm('news.rss_providers.view'), async (req, res, next) => {
    try {
      const item = await rssProviders.getProvider(req.params.id);
      if (!item) throw AppError.notFound('Không tìm thấy nhà cung cấp');
      return success(res, { provider: item });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/admin/rss-providers',
    perm('news.rss_providers.create'),
    validate(z.object({
      body: z.object({
        id: z.string().max(60).optional(),
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        website: z.string().optional(),
        rss_index: z.string().optional(),
        rssIndex: z.string().optional(),
        status: z.enum(['active', 'warning', 'empty', 'inactive']).optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await rssProviders.createProvider(req.validated.body);
        return success(res, { provider: item }, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/admin/rss-providers/:id',
    perm('news.rss_providers.edit'),
    validate(z.object({
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        website: z.string().optional(),
        rss_index: z.string().optional(),
        rssIndex: z.string().optional(),
        status: z.enum(['active', 'warning', 'empty', 'inactive']).optional()
      })
    })),
    async (req, res, next) => {
      try {
        const item = await rssProviders.updateProvider(req.params.id, req.validated.body);
        return success(res, { provider: item });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/admin/rss-providers/:id', perm('news.rss_providers.delete'), async (req, res, next) => {
    try {
      const result = await rssProviders.deleteProvider(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createNewsRouter };
