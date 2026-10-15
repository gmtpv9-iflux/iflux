'use strict';

/**
 * Theo dõi thực thể (Stock/Sector/Ecosystem/Story) — SoT thật, có timestamp (migration 085,
 * bảng user_entity_follows). Dùng cho Tin tức "Bạn đang quan tâm" — xem news-feed.service.js
 * listFollowedFeed(). Generic entity_type/entity_id (text), không FK cứng — xem comment migration.
 */
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const ENTITY_TYPES = ['stock', 'sector', 'ecosystem', 'story'];

function normType(t) {
  const v = String(t || '').trim().toLowerCase();
  if (ENTITY_TYPES.indexOf(v) === -1) {
    throw AppError.badRequest('ENTITY_TYPE_INVALID', 'entity_type phải là stock|sector|ecosystem|story');
  }
  return v;
}

function normId(entityType, id) {
  const v = String(id || '').trim();
  if (!v) throw AppError.badRequest('ENTITY_ID_REQUIRED', 'entity_id không được rỗng');
  return entityType === 'stock' ? v.toUpperCase() : v;
}

async function follow(userId, entityType, entityId) {
  const t = normType(entityType);
  const id = normId(t, entityId);
  await query(
    `INSERT INTO user_entity_follows (user_id, entity_type, entity_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING`,
    [userId, t, id]
  );
  return { ok: true, entity_type: t, entity_id: id, followed: true };
}

async function unfollow(userId, entityType, entityId) {
  const t = normType(entityType);
  const id = normId(t, entityId);
  await query(
    `DELETE FROM user_entity_follows WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
    [userId, t, id]
  );
  return { ok: true, entity_type: t, entity_id: id, followed: false };
}

/** Danh sách Follow của user, gom theo entity_type — dùng để build filter "Bạn đang quan tâm". */
async function listFollowed(userId) {
  const res = await query(
    `SELECT entity_type, entity_id, created_at FROM user_entity_follows
     WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  const grouped = { stock: [], sector: [], ecosystem: [], story: [] };
  res.rows.forEach(function (r) {
    if (grouped[r.entity_type]) grouped[r.entity_type].push(r.entity_id);
  });
  return {
    items: res.rows,
    stocks: grouped.stock,
    sectors: grouped.sector,
    ecosystems: grouped.ecosystem,
    stories: grouped.story
  };
}

module.exports = { follow, unfollow, listFollowed, ENTITY_TYPES };
