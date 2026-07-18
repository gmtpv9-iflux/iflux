'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { AppError } = require('../../shared/exceptions/app-error');
const { listPosts, createPost } = require('./community.service');
const categories = require('./community-categories.service');
const articles = require('./community-articles.service');

function requireAdminKey(config) {
  return function adminKeyGuard(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== config.ADMIN_API_KEY) {
      return next(AppError.forbidden('ADMIN_FORBIDDEN', 'Admin key required'));
    }
    next();
  };
}

/** JWT admin Bearer HOẶC X-Admin-Key */
function requireAdmin(deps) {
  const keyGuard = requireAdminKey(deps.config || {});
  const jwtGuard = deps.auth && deps.auth.authenticateAdmin;
  return function adminGuard(req, res, next) {
    const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');
    if (jwtGuard && hasBearer) {
      return jwtGuard(req, res, function (err) {
        if (!err && req.admin) return next();
        return keyGuard(req, res, next);
      });
    }
    return keyGuard(req, res, next);
  };
}

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
  const adminGuard = requireAdmin({ config, auth });

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
      status: z.enum(['draft', 'pending', 'published', 'scheduled']).optional(),
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
  router.get('/admin/categories', adminGuard, async (req, res, next) => {
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

  router.get('/admin/categories/:id', adminGuard, async (req, res, next) => {
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
    adminGuard,
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
    adminGuard,
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

  router.delete('/admin/categories/:id', adminGuard, async (req, res, next) => {
    try {
      const result = await categories.deleteCategory(req.params.id);
      return success(res, result);
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
    status: z.enum(['draft', 'pending', 'published', 'scheduled']).optional(),
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

  router.get('/articles/:idOrSlug', async (req, res, next) => {
    try {
      const item = await articles.getArticle(req.params.idOrSlug);
      if (!item) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
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

  router.get('/chu-de/:idOrSlug/tickers', async (req, res, next) => {
    try {
      const list = await articles.suggestTickersForChuDe(req.params.idOrSlug, req.query.limit);
      return success(res, { tickers: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/chu-de', async (req, res, next) => {
    /* Cho phép user đã đăng nhập HOẶC admin */
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
    return adminGuard(req, res, function (err) {
      if (err) return next(err);
      run().catch(next);
    });
  });

  router.get('/admin/articles', adminGuard, async (req, res, next) => {
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

  router.get('/admin/articles/:id', adminGuard, async (req, res, next) => {
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
    adminGuard,
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
    adminGuard,
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

  router.delete('/admin/articles/:id', adminGuard, async (req, res, next) => {
    try {
      const result = await articles.deleteArticle(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createCommunityRouter };
