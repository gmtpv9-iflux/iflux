'use strict';

/**
 * Community V1 Phase 2 — Story/Chủ đề routes (SoT §7). Phase 6 (2026-10-08) — bỏ hẳn "Đồng tình"
 * riêng (route /agree /unagree đã gỡ) — Story hiển thị thẳng Like/Dislike/Comment/Share của Topic
 * gốc (xem stories.service.js STATS_SELECT). Bình luận trên Story qua entity-posts-panel.js
 * (Social Post gắn entity_refs type=story), không qua route này.
 */
const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const stories = require('./stories.service');

const createStorySchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string().optional().nullable(),
    sentiment: z.string()
  })
});

const updateStorySchema = z.object({
  body: z.object({
    description: z.string().optional().nullable(),
    sentiment: z.string().optional().nullable()
  })
});

const mapToStorySchema = z.object({
  body: z.object({
    story_id: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    sentiment: z.string().optional().nullable()
  })
});

function createStoriesRouter(deps) {
  const router = express.Router();
  const config = deps.config || {};
  const auth = deps.auth || {};
  const perm = function () {
    return requireAdminPermission({ config, auth }, Array.prototype.slice.call(arguments));
  };

  router.post('/stories', auth.authenticate, validate(createStorySchema), async (req, res, next) => {
    try {
      const data = await stories.createStory(req.user, req.validated.body);
      return success(res, { story: data }, 201);
    } catch (err) {
      next(err);
    }
  });

  /* Owner 2026-10 (VI.2, Phase 6) — Admin ánh xạ 1 Topic → 1 Story. story_id = gắn vào Story có
     sẵn; thiếu story_id = tạo Story mới (title LUÔN lấy từ Topic — không nhận input). Admin
     Portal auth (khớp Admin Dashboard HTML gọi qua chu-de-registry-store.js, KHÁC User JWT
     thường — xem topics.routes.js cùng lý do). */
  router.post('/topics/:topicId/map-to-story', perm('community.topics.manage'), validate(mapToStorySchema), async (req, res, next) => {
    try {
      const data = await stories.mapTopicToStory(req.params.topicId, req.validated.body || {}, req.admin);
      return success(res, { story: data }, 201);
    } catch (err) {
      next(err);
    }
  });

  /* Owner 2026-10 (Phase 6, điểm 9) — Admin sửa description/sentiment sau khi map — KHÔNG sửa
     title/stock_tags (chốt cứng theo Topic). */
  router.patch('/stories/:id', perm('community.topics.manage'), validate(updateStorySchema), async (req, res, next) => {
    try {
      const data = await stories.updateStory(req.params.id, req.validated.body || {}, req.admin);
      return success(res, { story: data });
    } catch (err) {
      next(err);
    }
  });

  /* Owner 2026-10 (Phase 6) — Admin override lifecycle Story (giống Topic cũ, chuyển sang đây). */
  router.post('/stories/:id/lifecycle-override', perm('community.topics.manage'), async (req, res, next) => {
    try {
      const data = await stories.setLifecycleOverride(req.params.id, (req.body && req.body.status) || null, req.admin);
      return success(res, data);
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

  return router;
}

module.exports = { createStoriesRouter };
