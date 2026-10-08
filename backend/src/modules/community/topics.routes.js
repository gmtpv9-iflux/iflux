'use strict';

/**
 * Admin — Danh sách Chủ đề (Topic) + Admin override lifecycle (Phase 3 dùng, viết sẵn API ở
 * Phase 2). Mount cùng prefix /community (cùng domain với posts/stories).
 */
const express = require('express');
const { success } = require('../../shared/response/api-response');
const topics = require('./topics.service');

function isAdmin(user) {
  return !!(user && user.roles && user.roles.indexOf('admin') >= 0);
}

function createTopicsRouter(deps) {
  const router = express.Router();
  const auth = deps.auth || {};

  router.get('/topics', auth.authenticate, async (req, res, next) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Chỉ Admin được xem danh sách Chủ đề' } });
      }
      const data = await topics.listTopicsAdmin({ range: req.query.range, limit: req.query.limit });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/topics/:id/representative-stocks', auth.authenticate, async (req, res, next) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Chỉ Admin được xem' } });
      }
      const data = await topics.getRepresentativeStocks(req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/topics/:id/status-override', auth.authenticate, async (req, res, next) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Chỉ Admin được đổi trạng thái' } });
      }
      const data = await topics.setStatusOverride(req.params.id, (req.body && req.body.status) || null, req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createTopicsRouter };
