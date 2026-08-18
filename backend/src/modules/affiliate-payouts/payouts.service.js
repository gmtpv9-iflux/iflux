'use strict';

const { query } = require('../../core/database/connection');
const { getSpendableBalance } = require('./affiliate-balance.service');

const MIN_PAYOUT = 100000;

function rowToRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: String(row.user_id),
    userName: row.user_name || '',
    email: row.email || '',
    amount: Number(row.amount || 0),
    bankName: row.bank_name || '',
    bankBranch: row.bank_branch || '',
    bankAccount: row.bank_account || '',
    bankHolder: row.bank_holder || '',
    status: row.status,
    rejectReason: row.reject_reason || '',
    createdAt: row.created_at,
    processedAt: row.processed_at,
    processedBy: row.processed_by || ''
  };
}

async function sumPayoutsForUser(userId, statuses) {
  const res = await query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM affiliate_payout_requests
     WHERE user_id = $1 AND status = ANY($2::text[])`,
    [userId, statuses]
  );
  return Number(res.rows[0].total || 0);
}

async function getAvailableBalance(userId) {
  return getSpendableBalance(userId);
}

async function assertPayoutPrerequisites(userId, payload) {
  const userRes = await query(
    `SELECT display_name, phone, email FROM users WHERE id = $1`,
    [userId]
  );
  const user = userRes.rows[0];
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const profileMissing = [];
  if (!String(user.display_name || '').trim()) profileMissing.push('Họ tên');
  if (!String(user.phone || '').trim()) profileMissing.push('Số điện thoại');
  if (!String(user.email || '').trim()) profileMissing.push('Email');

  const bankMissing = [];
  if (!String(payload.bank_name || '').trim()) bankMissing.push('Ngân hàng');
  if (!String(payload.bank_account || '').trim()) bankMissing.push('Số tài khoản');
  if (!String(payload.bank_holder || '').trim()) bankMissing.push('Chủ tài khoản');

  if (profileMissing.length || bankMissing.length) {
    const lines = [];
    if (profileMissing.length) {
      lines.push(`Cập nhật đầy đủ thông tin hồ sơ: ${profileMissing.join(', ')}`);
    }
    if (bankMissing.length) {
      lines.push(`Cập nhật thông tin tài khoản ngân hàng: ${bankMissing.join(', ')}`);
    }
    const err = new Error(lines.join(' · '));
    err.statusCode = 422;
    throw err;
  }
}

async function createRequest(userId, payload) {
  await assertPayoutPrerequisites(userId, payload);

  const available = await getAvailableBalance(userId);
  if (available < MIN_PAYOUT) {
    const err = new Error(
      `Số dư khả dụng (${available.toLocaleString('vi-VN')} ₫) chưa đủ ngưỡng rút tối thiểu (${MIN_PAYOUT.toLocaleString('vi-VN')} ₫)`
    );
    err.statusCode = 422;
    throw err;
  }

  let amount = Math.round(Number(payload.amount || 0));
  if (amount > available) amount = available;
  if (amount < MIN_PAYOUT) {
    const err = new Error(`Số tiền tối thiểu là ${MIN_PAYOUT.toLocaleString('vi-VN')} ₫`);
    err.statusCode = 422;
    throw err;
  }

  const pending = await query(
    `SELECT id FROM affiliate_payout_requests
     WHERE user_id = $1 AND status IN ('pending', 'processing')
     LIMIT 1`,
    [userId]
  );
  if (pending.rows.length) {
    const err = new Error('Bạn đã có yêu cầu rút tiền đang chờ xử lý');
    err.statusCode = 422;
    throw err;
  }

  const id = 'payout_' + Date.now();
  const res = await query(
    `INSERT INTO affiliate_payout_requests (
       id, user_id, user_name, email, amount,
       bank_name, bank_branch, bank_account, bank_holder, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
     RETURNING *`,
    [
      id,
      userId,
      payload.user_name || '',
      payload.email || '',
      amount,
      payload.bank_name,
      payload.bank_branch || '',
      payload.bank_account,
      payload.bank_holder
    ]
  );
  return rowToRequest(res.rows[0]);
}

async function listForUser(userId) {
  const res = await query(
    `SELECT * FROM affiliate_payout_requests
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows.map(rowToRequest);
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
      LOWER(COALESCE(user_name, '')) LIKE $${i}
      OR LOWER(COALESCE(email, '')) LIKE $${i}
      OR LOWER(id) LIKE $${i}
      OR LOWER(COALESCE(bank_account, '')) LIKE $${i}
    )`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const res = await query(
    `SELECT * FROM affiliate_payout_requests ${where} ORDER BY created_at DESC LIMIT 200`,
    params
  );
  return res.rows.map(rowToRequest);
}

async function getById(id) {
  const res = await query('SELECT * FROM affiliate_payout_requests WHERE id = $1', [id]);
  return rowToRequest(res.rows[0]);
}

async function updateStatus(id, status, meta) {
  meta = meta || {};
  const current = await getById(id);
  if (!current) return null;

  const res = await query(
    `UPDATE affiliate_payout_requests
     SET status = $2,
         reject_reason = COALESCE($3, reject_reason),
         processed_at = NOW(),
         processed_by = COALESCE($4, processed_by)
     WHERE id = $1
     RETURNING *`,
    [id, status, meta.reject_reason || null, meta.processed_by || 'Admin']
  );
  return rowToRequest(res.rows[0]);
}

module.exports = {
  MIN_PAYOUT,
  getAvailableBalance,
  createRequest,
  listForUser,
  listAdmin,
  getById,
  updateStatus
};
