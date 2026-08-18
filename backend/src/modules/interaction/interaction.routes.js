'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const thread = require('./interaction-thread.service');

const createCommentSchema = z.object({
  body: z.object({
    body: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable()
  })
});

const migrateCommentsSchema = z.object({
  body: z.object({
    comments: z.array(z.object({
      body: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      image_url: z.string().optional().nullable(),
      user_id: z.string().optional().nullable(),
      user_name: z.string().optional().nullable(),
      created_at: z.string().optional().nullable()
    }).passthrough()).max(200)
  })
});

function createInteractionV1Router(deps) {
  const router = express.Router();
  const auth = deps.auth || {};

  router.get('/summary', async (req, res, next) => {
    try {
      const data = await thread.getSummary(req.query.type, req.query.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/threads/:entityType/:entityId/comments', async (req, res, next) => {
    try {
      const data = await thread.listThread(req.params.entityType, req.params.entityId, {
        limit: req.query.limit ? Number(req.query.limit) : 100
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/threads/:entityType/:entityId/comments',
    auth.authenticate,
    validate(createCommentSchema),
    async (req, res, next) => {
      try {
        const data = await thread.createThreadComment(
          req.params.entityType,
          req.params.entityId,
          req.user,
          req.validated.body
        );
        return success(res, data, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  /* RC-API-12 — migrate one-shot từ LS client */
  router.post(
    '/threads/:entityType/:entityId/comments/migrate',
    auth.authenticate,
    validate(migrateCommentsSchema),
    async (req, res, next) => {
      try {
        const type = thread.normalizeType(req.params.entityType);
        if (type === 'post') {
          return success(res, { inserted: 0, total: 0, skipped: 'post_uses_community_table' });
        }
        const id = thread.normalizeId(type, req.params.entityId);
        const data = await thread.migrateEntityComments(type, id, req.validated.body.comments);
        return success(res, data);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/comments/:commentId/like',
    auth.authenticate,
    async (req, res, next) => {
      try {
        const data = await thread.likeComment(req.params.commentId, req.user);
        return success(res, data);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

module.exports = { createInteractionV1Router };
