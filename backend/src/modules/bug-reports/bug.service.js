'use strict';

const { query } = require('../../core/database/connection');

const STATUSES = ['new', 'accepted', 'developing', 'released'];

const WEB_STATUS_LABELS = {
  accepted: 'Đã đưa vào backlog',
  developing: 'Đang phát triển',
  released: 'Đã phát hành'
};

const ADMIN_STATUS_LABELS = {
  new: 'Báo lỗi mới',
  accepted: 'Chấp nhận',
  developing: 'Đang phát triển',
  released: 'Đã phát hành'
};

const PUBLIC_STATUSES = ['accepted', 'developing', 'released'];

function rowToItem(row, agreed) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id ? String(row.user_id) : '',
    userName: row.user_name || '',
    title: row.title || '',
    context: row.context || '',
    problemDescription: row.problem_description || '',
    rootCause: row.root_cause || '',
    status: row.status,
    statusLabelWeb: WEB_STATUS_LABELS[row.status] || '',
    statusLabelAdmin: ADMIN_STATUS_LABELS[row.status] || row.status,
    agreeCount: Number(row.agree_count || 0),
    agreed: !!agreed,
    adminNote: row.admin_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at,
    processedBy: row.processed_by || ''
  };
}

function sortClause(sort) {
  if (sort === 'date') return 'created_at DESC';
  return 'agree_count DESC, created_at DESC';
}

async function listPublic(voterId) {
  const res = await query(
    `SELECT r.*,
       EXISTS(
         SELECT 1 FROM bug_report_agrees a
         WHERE a.report_id = r.id AND a.voter_id = $1
       ) AS agreed
     FROM bug_reports r
     WHERE r.status = ANY($2::text[])
     ORDER BY agree_count DESC, created_at DESC
     LIMIT 100`,
    [voterId || '', PUBLIC_STATUSES]
  );
  return res.rows.map((r) => rowToItem(r, r.agreed));
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
      OR LOWER(context) LIKE $${i}
      OR LOWER(problem_description) LIKE $${i}
      OR LOWER(root_cause) LIKE $${i}
      OR LOWER(user_name) LIKE $${i}
    )`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const order = sortClause(filters.sort);
  const res = await query(
    `SELECT * FROM bug_reports ${where} ORDER BY ${order} LIMIT 300`,
    params
  );
  return res.rows.map((r) => rowToItem(r, false));
}

async function countByStatus() {
  const res = await query(
    `SELECT status, COUNT(*)::int AS n FROM bug_reports GROUP BY status`
  );
  const out = {};
  res.rows.forEach((r) => { out[r.status] = r.n; });
  return out;
}

async function getById(id, voterId) {
  const res = await query(
    `SELECT r.*,
       EXISTS(
         SELECT 1 FROM bug_report_agrees a
         WHERE a.report_id = r.id AND a.voter_id = $2
       ) AS agreed
     FROM bug_reports r WHERE r.id = $1`,
    [id, voterId || '']
  );
  return rowToItem(res.rows[0], res.rows[0] && res.rows[0].agreed);
}

async function createItem(payload) {
  const id = 'bug_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const res = await query(
    `INSERT INTO bug_reports (
       id, user_id, user_name, title, context, problem_description, root_cause,
       status, ip, user_agent
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'new',$8,$9)
     RETURNING *`,
    [
      id,
      payload.user_id || null,
      payload.user_name || 'Thành viên iFlux',
      String(payload.title || '').trim(),
      String(payload.context || '').trim(),
      String(payload.problem_description || '').trim(),
      String(payload.root_cause || '').trim(),
      payload.ip || '',
      payload.user_agent || ''
    ]
  );
  return rowToItem(res.rows[0], false);
}

async function toggleAgree(id, voterId) {
  if (!voterId) {
    const err = new Error('Thiếu định danh người dùng');
    err.statusCode = 400;
    throw err;
  }
  const item = await getById(id);
  if (!item) return null;
  if (item.status === 'new') {
    const err = new Error('Báo lỗi chưa được hiển thị công khai');
    err.statusCode = 422;
    throw err;
  }

  const existing = await query(
    `SELECT 1 FROM bug_report_agrees WHERE report_id = $1 AND voter_id = $2`,
    [id, voterId]
  );

  if (existing.rowCount) {
    await query(
      `DELETE FROM bug_report_agrees WHERE report_id = $1 AND voter_id = $2`,
      [id, voterId]
    );
    await query(
      `UPDATE bug_reports SET agree_count = GREATEST(0, agree_count - 1), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  } else {
    await query(
      `INSERT INTO bug_report_agrees (report_id, voter_id) VALUES ($1, $2)`,
      [id, voterId]
    );
    await query(
      `UPDATE bug_reports SET agree_count = agree_count + 1, updated_at = NOW() WHERE id = $1`,
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
    `UPDATE bug_reports
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
  toggleAgree,
  updateStatus
};
