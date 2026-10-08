'use strict';

/**
 * Admin — Danh sách Chủ đề (Topic) + Admin override lifecycle (Phase 3). Mount cùng prefix
 * /community. Dùng xác thực Admin Portal (JWT riêng qua IfluxAdminAuth + RBAC) — KHÁC User JWT
 * thường — khớp đúng cơ chế trang Admin HTML (danh-sach-chu-de.html) đang dùng.
 */
const express = require('express');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const topics = require('./topics.service');

function createTopicsRouter(deps) {
  const router = express.Router();
  const config = deps.config || {};
  const auth = deps.auth || {};
  const perm = function () {
    return requireAdminPermission({ config, auth }, Array.prototype.slice.call(arguments));
  };

  router.get('/topics', perm('community.topics.manage'), async (req, res, next) => {
    try {
      const data = await topics.listTopicsAdmin({ range: req.query.range, limit: req.query.limit });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/topics/:id/representative-stocks', perm('community.topics.manage'), async (req, res, next) => {
    try {
      const data = await topics.getRepresentativeStocks(req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/topics/:id/status-override', perm('community.topics.manage'), async (req, res, next) => {
    try {
      const data = await topics.setStatusOverride(req.params.id, (req.body && req.body.status) || null, req.admin);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createTopicsRouter };
