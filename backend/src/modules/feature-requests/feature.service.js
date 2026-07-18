'use strict';

const { query } = require('../../core/database/connection');

const STATUSES = ['new', 'accepted', 'developing', 'released'];

const WEB_STATUS_LABELS = {
  accepted: 'Đã đưa vào backlog',
  developing: 'Đang phát triển',
  released: 'Đã phát hành'
};

const ADMIN_STATUS_LABELS = {
  new: 'Tính năng mới',
  accepted: 'Chấp nhận',
  developing: 'Đang phát triển',
  released: 'Đã phát hành'
};

const PUBLIC_STATUSES = ['accepted', 'developing', 'released'];

function rowToItem(row, liked) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id ? String(row.user_id) : '',
    userName: row.user_name || '',
    title: row.title || '',
    ideaDescription: row.idea_description || '',
    expectationDescription: row.expectation_description || '',
    status: row.status,
    statusLabelWeb: WEB_STATUS_LABELS[row.status] || '',
    statusLabelAdmin: ADMIN_STATUS_LABELS[row.status] || row.status,
    likeCount: Number(row.like_count || 0),
    liked: !!liked,
    adminNote: row.admin_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at,
    processedBy: row.processed_by || ''
  };
}

function sortClause(sort) {
  if (sort === 'date') return 'created_at DESC';
  return 'like_count DESC, created_at DESC';
}

async function listPublic(voterId) {
  const res = await query(
    `SELECT s.*,
       EXISTS(
         SELECT 1 FROM feature_suggestion_likes l
         WHERE l.suggestion_id = s.id AND l.voter_id = $1
       ) AS liked
     FROM feature_suggestions s
     WHERE s.status = ANY($2::text[])
     ORDER BY like_count DESC, created_at DESC
     LIMIT 100`,
    [voterId || '', PUBLIC_STATUSES]
  );
  return res.rows.map((r) => rowToItem(r, r.liked));
}

async function listAdmin(filters) {
  filters = filters || {};
  const clauses = [];
  const params = [];
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`status = $${params.length}`);
  }
  if (filters.q) {
    params.push('%' + String(filters.q).toLowerCase() + '%');
    const i = params.length;
    clauses.push(`(
      LOWER(title) LIKE $${i}
      OR LOWER(idea_description) LIKE $${i}
      OR LOWER(expectation_description) LIKE $${i}
      OR LOWER(user_name) LIKE $${i}
    )`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const order = sortClause(filters.sort);
  const res = await query(
    `SELECT * FROM feature_suggestions ${where} ORDER BY ${order} LIMIT 300`,
    params
  );
  return res.rows.map((r) => rowToItem(r, false));
}

async function countByStatus() {
  const res = await query(
    `SELECT status, COUNT(*)::int AS n FROM feature_suggestions GROUP BY status`
  );
  const out = {};
  res.rows.forEach((r) => { out[r.status] = r.n; });
  return out;
}

async function getById(id, voterId) {
  const res = await query(
    `SELECT s.*,
       EXISTS(
         SELECT 1 FROM feature_suggestion_likes l
         WHERE l.suggestion_id = s.id AND l.voter_id = $2
       ) AS liked
     FROM feature_suggestions s WHERE s.id = $1`,
    [id, voterId || '']
  );
  return rowToItem(res.rows[0], res.rows[0] && res.rows[0].liked);
}

async function createItem(payload) {
  const id = 'feat_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const res = await query(
    `INSERT INTO feature_suggestions (
       id, user_id, user_name, title, idea_description, expectation_description,
       status, ip, user_agent
     ) VALUES ($1,$2,$3,$4,$5,$6,'new',$7,$8)
     RETURNING *`,
    [
      id,
      payload.user_id || null,
      payload.user_name || 'Thành viên iFlux',
      String(payload.title || '').trim(),
      String(payload.idea_description || '').trim(),
      String(payload.expectation_description || '').trim(),
      payload.ip || '',
      payload.user_agent || ''
    ]
  );
  return rowToItem(res.rows[0], false);
}

async function toggleLike(id, voterId) {
  if (!voterId) {
    const err = new Error('Thiếu định danh người dùng');
    err.statusCode = 400;
    throw err;
  }
  const item = await getById(id);
  if (!item) return null;
  if (item.status === 'new') {
    const err = new Error('Đề xuất chưa được hiển thị công khai');
    err.statusCode = 422;
    throw err;
  }

  const existing = await query(
    `SELECT 1 FROM feature_suggestion_likes WHERE suggestion_id = $1 AND voter_id = $2`,
    [id, voterId]
  );

  if (existing.rowCount) {
    await query(
      `DELETE FROM feature_suggestion_likes WHERE suggestion_id = $1 AND voter_id = $2`,
      [id, voterId]
    );
    await query(
      `UPDATE feature_suggestions SET like_count = GREATEST(0, like_count - 1), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  } else {
    await query(
      `INSERT INTO feature_suggestion_likes (suggestion_id, voter_id) VALUES ($1, $2)`,
      [id, voterId]
    );
    await query(
      `UPDATE feature_suggestions SET like_count = like_count + 1, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }
  return getById(id, voterId);
}

async function updateStatus(id, status, meta) {
  meta = meta || {};
  if (STATUSES.indexOf(status) < 0) {
    const err = new Error('Trạng thái không hợp lệ');
    err.statusCode = 400;
    throw err;
  }
  const res = await query(
    `UPDATE feature_suggestions
     SET status = $2,
         admin_note = COALESCE($3, admin_note),
         processed_at = NOW(),
         processed_by = COALESCE($4, processed_by),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, meta.note != null ? meta.note : null, meta.processed_by || 'Admin']
  );
  return rowToItem(res.rows[0], false);
}

module.exports = {
  STATUSES,
  WEB_STATUS_LABELS,
  ADMIN_STATUS_LABELS,
  PUBLIC_STATUSES,
  listPublic,
  listAdmin,
  countByStatus,
  getById,
  createItem,
  toggleLike,
  updateStatus
};
