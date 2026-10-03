'use strict';

/**
 * Community V1 Phase 2 — Story/Chủ đề routes (SoT §7). "Đồng tình" (agree/unagree) tái dùng
 * interaction-thread.service's likeEntity/unlikeEntity với entityType='story' (đã có sẵn trong
 * REGISTRY — xem interaction-thread.service.js) — KHÔNG viết lại hệ Interaction riêng (SoT §5),
 * chỉ đặt tên route public là /agree (không phải /like) để khớp ngữ nghĩa "Đồng tình" của Owner (§7.3).
 */
const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const stories = require('./stories.service');
const thread = require('../interaction/interaction-thread.service');

const createStorySchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string().optional().nullable(),
    stock_tags: z.array(z.string()).optional().nullable(),
    sentiment: z.string()
  })
});

function createStoriesRouter(deps) {
  const router = express.Router();
  const auth = deps.auth || {};

  router.post('/stories', auth.authenticate, validate(createStorySchema), async (req, res, next) => {
    try {
      const data = await stories.createStory(req.user, req.validated.body);
      return success(res, { story: data }, 201);
    } catch (err) {
      next(err);
    }
  });

  router.get('/stories', async (req, res, next) => {
    try {
      const data = await stories.listStories({
        sort: req.query.sort,
        range: req.query.range,
        cursor: req.query.cursor,
        limit: req.query.limit
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/stories/:id', async (req, res, next) => {
    try {
      const data = await stories.getStoryById(req.params.id);
      return success(res, { story: data });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/stories/:id', auth.authenticate, async (req, res, next) => {
    try {
      const data = await stories.archiveStory(req.params.id, req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/stories/:id/agree', auth.authenticate, async (req, res, next) => {
    try {
      const data = await thread.likeEntity('story', req.params.id, req.user);
      return success(res, { agreed: data.liked, agree_count: data.likes });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/stories/:id/agree', auth.authenticate, async (req, res, next) => {
    try {
      const data = await thread.unlikeEntity('story', req.params.id, req.user);
      return success(res, { agreed: data.liked, agree_count: data.likes });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createStoriesRouter };
