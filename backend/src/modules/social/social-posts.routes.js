'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const posts = require('./social-posts.service');

const createPostSchema = z.object({
  body: z.object({
    content: z.string().optional().nullable(),
    post_type: z.string().optional().nullable(),
    source_type: z.string().optional().nullable(),
    source_id: z.string().optional().nullable(),
    stock_tags: z.array(z.string()).optional().nullable(),
    visibility: z.string().optional().nullable()
  })
});

function createSocialPostsRouter(deps) {
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

  return router;
}

module.exports = { createSocialPostsRouter };
