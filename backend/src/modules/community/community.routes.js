'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { listPosts, createPost } = require('./community.service');
  const comments = require('./community-comments.service');
  const categories = require('./community-categories.service');
  const articles = require('./community-articles.service');
  const interaction = require('./interaction.service');
  const feed = require('./community-feed.service');
  const rssProviders = require('./rss-providers.service');
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

function createCommunityRouter(deps) {
  const router = express.Router();
  const config = deps.config || {};
  const auth = deps.auth || {};
  const perm = function () {
    return requireAdminPermission({ config, auth }, Array.prototype.slice.call(arguments));
  };

  /**
   * SoT FeedCard — semantic list (không đổi GET /posts legacy).
   * GET /community/feed → FeedCard[] (Forbidden: body, body_html, …)
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
        chu_de_id: req.query.chu_de_id || null,
        related_to: req.query.related_to || null
      });
      return success(res, {
        cards: data.cards,
        posts: data.cards,
        total: data.total,
        limit: data.limit,
        offset: data.offset
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
        limit: req.query.limit ? Number(req.query.limit) : 100
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  /* RC-API-01 — Interaction Summary counts-only (không comments[]) */
  router.get('/interaction/summary', async (req, res, next) => {
    try {
      const data = await interaction.getSummary(req.query.type, req.query.id);
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
        limit: req.query.limit ? Number(req.query.limit) : 100
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
      chu_de_id: z.string().optional(),
      chu_de_name: z.string().optional(),
      chu_de_slug: z.string().optional(),
      chu_de: z.any().optional(),
      sectors: z.array(z.string()).optional(),
      ecosystems: z.array(z.string()).optional(),
      exchange: z.string().optional().nullable(),
      status: z.enum(['draft', 'pending', 'published', 'published_rss', 'scheduled']).optional(),
      seo: z.any().optional(),
      display: z.any().optional(),
      cover: z.any().optional()
    })
  });

  router.post('/posts', deps.auth.authenticate, validate(createSchema), async (req, res, next) => {
    try {
      const b = req.validated.body;
      const user = req.user;
      /* Nếu có category + chủ đề → dùng Article SoT */
      if (b.category_id && (b.chu_de_id || b.chu_de_name || b.chu_de_slug || (b.chu_de && (b.chu_de.id || b.chu_de.name)))) {
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
  router.get('/admin/categories', perm('community.categories.view'), async (req, res, next) => {
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

  router.get('/admin/categories/:id', perm('community.categories.view'), async (req, res, next) => {
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
    perm('community.categories.create'),
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
    perm('community.categories.edit'),
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

  router.delete('/admin/categories/:id', perm('community.categories.delete'), async (req, res, next) => {
    try {
      const result = await categories.deleteCategory(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/categories/:id/status-visible', perm('community.categories.status_visible'), async (req, res, next) => {
    try {
      const item = await categories.updateCategory(req.params.id, { is_visible: true });
      return success(res, { category: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/categories/:id/status-hidden', perm('community.categories.status_hidden'), async (req, res, next) => {
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
    content_type: z.string().optional().nullable(),
    category_id: z.string().uuid(),
    category_name: z.string().optional().nullable(),
    chu_de_id: z.string().optional().nullable(),
    chu_de_slug: z.string().optional().nullable(),
    chu_de_name: z.string().optional().nullable(),
    chu_de: z
      .object({
        id: z.string().optional(),
        slug: z.string().optional(),
        name: z.string().optional(),
        label: z.string().optional()
      })
      .optional()
      .nullable(),
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
        canonical: z.string().optional().nullable()
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

  router.get('/articles', async (req, res, next) => {
    try {
      const list = await articles.listArticles({
        status: req.query.status || 'published',
        q: req.query.q,
        category_id: req.query.category_id,
        chu_de_id: req.query.chu_de_id,
        limit: req.query.limit ? Number(req.query.limit) : 50
      });
      return success(res, { articles: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  /* Pipeline A: article → Metadata SoT → render (consume only). */
  router.get('/articles/:idOrSlug/open-graph', async (req, res, next) => {
    try {
      const item = await articles.getArticle(req.params.idOrSlug);
      if (!item) {
        res.status(404).type('html').send(
          '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><title>Không tìm thấy · iFlux</title></head>' +
          '<body><p>Không tìm thấy bài viết</p></body></html>'
        );
        return;
      }
      const origin = articles.PUBLIC_ORIGIN || 'https://iflux.vn';
      articles.attachArticleMetadata(item, origin);
      res
        .status(200)
        .type('html')
        .set('Cache-Control', 'public, max-age=300')
        .send(articles.renderOpenGraphHtml(item.metadata));
    } catch (err) {
      next(err);
    }
  });

  /* Pipeline B: SPA shell + cùng Metadata SoT head (Golden Reference tags). */
  router.get('/articles/:idOrSlug/spa', async (req, res, next) => {
    try {
      const item = await articles.getArticle(req.params.idOrSlug);
      if (!item) {
        res.status(404).type('html').send(
          '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><title>Không tìm thấy · iFlux</title></head>' +
          '<body><p>Không tìm thấy bài viết</p></body></html>'
        );
        return;
      }
      const origin = articles.PUBLIC_ORIGIN || 'https://iflux.vn';
      articles.attachArticleMetadata(item, origin);
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
      const item = await articles.getArticle(req.params.idOrSlug);
      if (!item) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      articles.attachArticleMetadata(item, articles.PUBLIC_ORIGIN || 'https://iflux.vn');
      return success(res, { article: item });
    } catch (err) {
      next(err);
    }
  });

  router.get('/chu-de/suggest', async (req, res, next) => {
    try {
      const list = await articles.suggestChuDe(req.query.q || req.query.title || '', req.query.limit);
      return success(res, { suggestions: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  /* Public list — User Web /cong-dong/chu-de */
  router.get('/chu-de', async (req, res, next) => {
    try {
      const list = await articles.listChuDeAdmin({
        q: req.query.q,
        status: req.query.status || undefined,
        limit: req.query.limit ? Number(req.query.limit) : 200
      });
      return success(res, { chu_de: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  /* Public list — User Web /cong-dong/tac-gia */
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

  router.get('/chu-de/:idOrSlug/tickers', async (req, res, next) => {
    try {
      const list = await articles.suggestTickersForChuDe(req.params.idOrSlug, req.query.limit);
      return success(res, { tickers: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/chu-de', async (req, res, next) => {
    /* User đã đăng nhập HOẶC admin có quyền stories.registry.create */
    const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');
    const run = async function () {
      const item = await articles.createChuDeQuick(req.body && req.body.name);
      return success(res, { chu_de: item }, 201);
    };
    if (hasBearer && deps.auth && deps.auth.authenticate) {
      return deps.auth.authenticate(req, res, function (err) {
        if (err) return next(err);
        run().catch(next);
      });
    }
    return perm('stories.registry.create')(req, res, function (err) {
      if (err) return next(err);
      run().catch(next);
    });
  });

  router.get('/admin/articles', perm('community.articles.view'), async (req, res, next) => {
    try {
      const list = await articles.listArticles({
        include_all: true,
        status: req.query.status || undefined,
        q: req.query.q,
        category_id: req.query.category_id,
        chu_de_id: req.query.chu_de_id,
        limit: req.query.limit ? Number(req.query.limit) : 100
      });
      return success(res, { articles: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/chu-de', perm('community.stories.view'), async (req, res, next) => {
    try {
      const list = await articles.listChuDeAdmin({
        q: req.query.q,
        status: req.query.status || undefined,
        limit: req.query.limit ? Number(req.query.limit) : 200
      });
      return success(res, { chu_de: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/authors', perm('community.experts.view'), async (req, res, next) => {
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

  router.post('/admin/rss-ingest/run', perm('community.rss_article_schema.execute'), async (req, res, next) => {
    try {
      const { runRssCommunityIngest } = require('./rss-ingest.service');
      const limit = req.body && req.body.limitPerFeed != null ? Number(req.body.limitPerFeed) : undefined;
      const out = await runRssCommunityIngest({ limitPerFeed: limit });
      return success(res, out);
    } catch (err) {
      next(err);
    }
  });

  router.get('/admin/articles/:id', perm('community.articles.view'), async (req, res, next) => {
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
    perm('community.articles.create'),
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
    perm('community.articles.edit'),
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

  router.delete('/admin/articles/:id', perm('community.articles.delete'), async (req, res, next) => {
    try {
      const result = await articles.deleteArticle(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /* ── community.stories (Kiểm duyệt chủ đề / story posts) — Phase C3 ── */

  router.get('/admin/stories/posts', perm('community.stories.view'), async (req, res, next) => {
    try {
      const list = await articles.listArticles({
        include_all: true,
        status: req.query.status || undefined,
        q: req.query.q,
        chu_de_id: req.query.chu_de_id,
        limit: req.query.limit ? Number(req.query.limit) : 100
      });
      return success(res, { posts: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/admin/stories/posts/:id',
    perm('community.stories.edit'),
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

  router.delete('/admin/stories/posts/:id', perm('community.stories.delete'), async (req, res, next) => {
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

  router.post('/admin/stories/posts/:id/publish', perm('community.stories.publish'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'publish', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/stories/posts/:id/feature', perm('community.stories.feature_post'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'feature', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/stories/posts/:id/pin', perm('community.stories.pin_post'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'pin', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  router.post('/admin/stories/posts/:id/lock', perm('community.stories.lock_post'), async (req, res, next) => {
    try {
      const item = await articles.moderateStoryPost(req.params.id, 'lock', storyModActor(req));
      return success(res, { post: item });
    } catch (err) {
      next(err);
    }
  });

  /* ── community.rss_providers (Nguồn RSS) — Phase C4 ── */

  router.get('/admin/rss-providers', perm('community.rss_providers.view'), async (req, res, next) => {
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

  router.get('/admin/rss-providers/:id', perm('community.rss_providers.view'), async (req, res, next) => {
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
    perm('community.rss_providers.create'),
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
    perm('community.rss_providers.edit'),
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

  router.delete('/admin/rss-providers/:id', perm('community.rss_providers.delete'), async (req, res, next) => {
    try {
      const result = await rssProviders.deleteProvider(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createCommunityRouter };
