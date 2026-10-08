'use strict';

/**
 * Admin — Danh sách Chủ đề (Topic) + Admin override lifecycle (Phase 3). Mount cùng prefix
 * /community. Dùng xác thực Admin Portal (JWT riêng qua IfluxAdminAuth + RBAC) — KHÁC User JWT
 * thường — khớp đúng cơ chế trang Admin HTML (danh-sach-chu-de.html) đang dùng.
 */
const express = require('express');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const { query } = require('../../core/database/connection');
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

  /* Owner 2026-10 (Phase 6) — "Chủ đề đang thịnh hành" (Top 5, Engagement cao nhất) và "Top chủ
     đề mới nổi" (Top 10, Hot Score) — public, Frontend User gọi trực tiếp, không cần quyền Admin. */
  router.get('/topics/trending', async (req, res, next) => {
    try {
      const items = await topics.getTrendingTopics(req.query.range, req.query.limit || 5);
      return success(res, { items, range: req.query.range || 'day' });
    } catch (err) {
      next(err);
    }
  });

  router.get('/topics/hot', async (req, res, next) => {
    try {
      const items = await topics.getHotTopics(req.query.range, req.query.limit || 10);
      return success(res, { items, range: req.query.range || 'week' });
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

  /* Owner 2026-10 (Phase 6) — trang Admin "Công thức tính điểm": đọc/sửa trực tiếp
     topic_scoring_config (Single Source of Truth), không hardcode hiển thị. */
  router.get('/topics/scoring-config', perm('community.topics.manage'), async (req, res, next) => {
    try {
      const rows = await query('SELECT key, value, updated_at FROM topic_scoring_config ORDER BY key');
      return success(res, { items: rows.rows });
    } catch (err) {
      next(err);
    }
  });

  router.put('/topics/scoring-config/:key', perm('community.topics.manage'), async (req, res, next) => {
    try {
      const res2 = await query(
        `UPDATE topic_scoring_config SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3 RETURNING key, value, updated_at`,
        [JSON.stringify(req.body && req.body.value), req.admin && req.admin.id, req.params.key]
      );
      if (!res2.rows[0]) return next(require('../../shared/exceptions/app-error').AppError.notFound('Không tìm thấy cấu hình'));
      return success(res, res2.rows[0]);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createTopicsRouter };
