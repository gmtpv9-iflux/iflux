'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const posts = require('./community-posts.service');

const createPostSchema = z.object({
  body: z.object({
    content: z.string().optional().nullable(),
    post_type: z.string().optional().nullable(),
    source_type: z.string().optional().nullable(),
    source_id: z.string().optional().nullable(),
    stock_tags: z.array(z.string()).optional().nullable(),
    hashtags: z.array(z.string()).optional().nullable(),
    entity_refs: z.array(z.object({
      type: z.string(),
      id: z.string(),
      label: z.string().optional().nullable()
    })).optional().nullable(),
    visibility: z.string().optional().nullable()
  })
});

function createCommunityPostsRouter(deps) {
  const router = express.Router();
  const auth = deps.auth || {};

  router.post('/posts', auth.authenticate, validate(createPostSchema), async (req, res, next) => {
    try {
      const data = await posts.createPost(req.user, req.validated.body);
      return success(res, { post: data }, 201);
    } catch (err) {
      next(err);
    }
  });

  router.get('/posts/:id', auth.optionalAuth, async (req, res, next) => {
    try {
      const data = await posts.getPostById(req.params.id, req.user);
      return success(res, { post: data });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/posts/:id', auth.authenticate, async (req, res, next) => {
    try {
      const data = await posts.deletePost(req.params.id, req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/feed', auth.optionalAuth, async (req, res, next) => {
    try {
      const data = await posts.getFeed({
        mode: req.query.mode,
        cursor: req.query.cursor,
        limit: req.query.limit
      }, req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/users/:id/timeline', auth.optionalAuth, async (req, res, next) => {
    try {
      const data = await posts.getUserTimeline(req.params.id, {
        cursor: req.query.cursor,
        limit: req.query.limit
      }, req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  /* Gợi ý hashtag/chủ đề khi gõ vào ô hashtag Compose — chỉ gọi lúc user tương tác (lazy). */
  router.get('/suggest', async (req, res, next) => {
    try {
      const data = await posts.getTrendingSuggestions(req.query.q);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/stocks/:ticker/posts', async (req, res, next) => {
    try {
      const data = await posts.getStockPosts(req.params.ticker, {
        cursor: req.query.cursor,
        limit: req.query.limit
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  /* Owner 2026-10 — "Bình luận" trên trang chi tiết Thực thể (Stock/Sector/Family/Story) = Post
     Cộng đồng gắn thẻ Thực thể đó, "chỉ có 1, xuất hiện ở 2 nơi" (Tab Bình luận Thực thể + trang
     Cộng đồng). Route MỚI, KHÔNG đụng /interaction/v1/threads/:type/:id (hệ Comment Thread cũ) —
     Frontend (Phase 4) sẽ đổi hẳn Stock/Sector/Family Detail page sang gọi route này. */
  router.get('/entities/:entityType/:entityId/posts', async (req, res, next) => {
    try {
      const data = await posts.getEntityPosts(req.params.entityType, req.params.entityId, {
        cursor: req.query.cursor,
        limit: req.query.limit
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/entities/:entityType/:entityId/posts', auth.authenticate, async (req, res, next) => {
    try {
      const data = await posts.createEntityPost(
        req.user, req.params.entityType, req.params.entityId,
        req.body && req.body.content, { label: req.body && req.body.label }
      );
      return success(res, { post: data }, 201);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createCommunityPostsRouter };
