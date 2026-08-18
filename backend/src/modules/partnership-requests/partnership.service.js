'use strict';

const { query } = require('../../core/database/connection');

const TYPES = {
  media: 'Hợp tác truyền thông',
  content: 'Hợp tác nội dung',
  business: 'Hợp tác kinh doanh',
  investment: 'Đầu tư',
  other: 'Khác'
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function typeLabel(key) {
  return TYPES[key] || key || '';
}

function rowToRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    fullName: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' '),
    email: row.email || '',
    phone: row.phone || '',
    partnershipType: row.partnership_type || '',
    partnershipTypeLabel: row.partnership_type_label || typeLabel(row.partnership_type),
    message: row.message || '',
    status: row.status,
    note: row.note || '',
    createdAt: row.created_at,
    processedAt: row.processed_at,
    processedBy: row.processed_by || ''
  };
}

/**
 * Xác minh token Cloudflare Turnstile.
 * Trả về { ok:boolean, reason?:string }.
 */
async function verifyTurnstile(config, token, remoteIp) {
  const secret = config.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Chưa cấu hình secret → bỏ qua verify (an toàn cho môi trường dev)
    return { ok: true, skipped: true };
  }
  if (!token) {
    return { ok: false, reason: 'missing-token' };
  }
  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (remoteIp) params.append('remoteip', remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json().catch(() => ({}));
    if (data && data.success) return { ok: true };
    return { ok: false, reason: (data['error-codes'] || []).join(',') || 'verify-failed' };
  } catch (err) {
    return { ok: false, reason: 'verify-error' };
  }
}

async function createRequest(payload) {
  const id = 'prq_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const firstName = String(payload.first_name || '').trim();
  const lastName = String(payload.last_name || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || String(payload.full_name || '').trim();
  const type = String(payload.partnership_type || '').trim();

  const res = await query(
    `INSERT INTO partnership_requests (
       id, first_name, last_name, full_name, email, phone,
       partnership_type, partnership_type_label, message, status, ip, user_agent
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new',$10,$11)
     RETURNING *`,
    [
      id,
      firstName,
      lastName,
      fullName,
      String(payload.email || '').trim(),
      String(payload.phone || '').trim(),
      type,
      typeLabel(type),
      String(payload.message || '').trim(),
      payload.ip || '',
      payload.user_agent || ''
    ]
  );
  return rowToRequest(res.rows[0]);
}

async function listAdmin(filters) {
  filters = filters || {};
  const clauses = [];
  const params = [];
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`status = $${params.length}`);
  }
  if (filters.type) {
    params.push(filters.type);
    clauses.push(`partnership_type = $${params.length}`);
  }
  if (filters.q) {
    params.push('%' + String(filters.q).toLowerCase() + '%');
    const i = params.length;
    clauses.push(`(
      LOWER(COALESCE(full_name, '')) LIKE $${i}
      OR LOWER(COALESCE(email, '')) LIKE $${i}
      OR LOWER(COALESCE(phone, '')) LIKE $${i}
      OR LOWER(id) LIKE $${i}
    )`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const res = await query(
    `SELECT * FROM partnership_requests ${where} ORDER BY created_at DESC LIMIT 300`,
    params
  );
  return res.rows.map(rowToRequest);
}

async function countByStatus() {
  const res = await query(
    `SELECT status, COUNT(*)::int AS n FROM partnership_requests GROUP BY status`
  );
  const out = {};
  res.rows.forEach((r) => { out[r.status] = r.n; });
  return out;
}

async function getById(id) {
  const res = await query('SELECT * FROM partnership_requests WHERE id = $1', [id]);
  return rowToRequest(res.rows[0]);
}

async function updateStatus(id, status, meta) {
  meta = meta || {};
  const res = await query(
    `UPDATE partnership_requests
     SET status = $2,
         note = COALESCE($3, note),
         processed_at = NOW(),
         processed_by = COALESCE($4, processed_by)
     WHERE id = $1
     RETURNING *`,
    [id, status, meta.note != null ? meta.note : null, meta.processed_by || 'Admin']
  );
  return rowToRequest(res.rows[0]);
}

module.exports = {
  TYPES,
  typeLabel,
  verifyTurnstile,
  createRequest,
  listAdmin,
  countByStatus,
  getById,
  updateStatus
};
