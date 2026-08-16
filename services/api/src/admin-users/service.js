'use strict';

/**
 * Staging 2 — Người dùng cuối: truy vấn dữ liệu
 *
 * Chỉ chạm bảng `users`. Không biết HTTP, không biết quyền.
 */

const { AppError } = require('../errors');
const { getPool } = require('../db');

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

const COLUMNS =
  'id, email, phone, display_name, nickname, account_status, ' +
  'email_verified_at, country, bio, auth_provider, created_at, updated_at';

/**
 * Khóa phụ `id` là bắt buộc, không phải trang trí: nhiều người dùng có thể trùng
 * created_at (nhập theo lô). Chỉ sắp theo created_at thì Postgres được tự do đổi
 * thứ tự giữa hai truy vấn, khiến phân trang lặp hàng ở trang này và bỏ sót hàng
 * ở trang kia.
 */
const ORDER_BY = ' ORDER BY created_at DESC, id DESC';

/**
 * Chuẩn hóa số Việt Nam về dạng 84xxxxxxxxx — giữ đúng cách Staging 1 đang lưu,
 * nếu không thì cùng một số nhập hai kiểu sẽ thành hai bản ghi khác nhau.
 */
function normalizePhone(phone) {
  const digits = String(phone == null ? '' : phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.charAt(0) === '0') return '84' + digits.slice(1);
  if (digits.length === 9 && /^[35789]/.test(digits)) return '84' + digits;
  return digits;
}

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    phone: row.phone || null,
    displayName: row.display_name || null,
    nickname: row.nickname || null,
    accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at,
    country: row.country,
    bio: row.bio,
    authProvider: row.auth_provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildFilter(filters) {
  const clauses = [];
  const params = [];

  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    const i = params.length;
    clauses.push(
      "(lower(coalesce(display_name, '')) LIKE $" + i +
      " OR lower(email) LIKE $" + i +
      " OR coalesce(phone, '') LIKE $" + i + ')'
    );
  }

  if (filters.status) {
    params.push(filters.status);
    clauses.push('account_status = $' + params.length);
  }

  return {
    where: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '',
    params: params
  };
}

function normalizePaging(filters) {
  const page = Math.max(1, Number(filters.page) || 1);
  const requested = Number(filters.pageSize) || PAGE_SIZE_DEFAULT;
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, requested));
  return { page: page, pageSize: pageSize };
}

async function listUsers(filters) {
  filters = filters || {};
  const pool = getPool();
  const filter = buildFilter(filters);
  const paging = normalizePaging(filters);

  const counted = await pool.query(
    'SELECT count(*)::int AS total FROM users ' + filter.where,
    filter.params
  );
  const total = counted.rows[0].total;

  const rows = await pool.query(
    'SELECT ' + COLUMNS + ' FROM users ' + filter.where + ORDER_BY +
    ' LIMIT $' + (filter.params.length + 1) +
    ' OFFSET $' + (filter.params.length + 2),
    filter.params.concat([paging.pageSize, (paging.page - 1) * paging.pageSize])
  );

  return {
    users: rows.rows.map(toUser),
    total: total,
    page: paging.page,
    pageSize: paging.pageSize
  };
}

/** Không phân trang — dùng cho xuất tệp. */
async function listAllUsers(filters) {
  filters = filters || {};
  const filter = buildFilter(filters);
  const rows = await getPool().query(
    'SELECT ' + COLUMNS + ' FROM users ' + filter.where + ORDER_BY,
    filter.params
  );
  return rows.rows.map(toUser);
}

async function getUserById(id) {
  const rows = await getPool().query(
    'SELECT ' + COLUMNS + ' FROM users WHERE id = $1',
    [id]
  );
  return toUser(rows.rows[0]);
}

async function updateUser(id, patch) {
  const sets = [];
  const params = [];

  if (patch.displayName !== undefined) {
    const name = String(patch.displayName || '').trim();
    if (!name) throw new AppError('VALIDATION_ERROR', 'Tên hiển thị không được rỗng.', 422);
    params.push(name);
    sets.push('display_name = $' + params.length);
  }

  if (patch.phone !== undefined) {
    const phone = normalizePhone(patch.phone);
    if (phone && phone.length < 10) {
      throw new AppError('VALIDATION_ERROR', 'Số điện thoại không hợp lệ.', 422);
    }
    params.push(phone || null);
    sets.push('phone = $' + params.length);
  }

  if (patch.accountStatus !== undefined) {
    params.push(patch.accountStatus);
    sets.push('account_status = $' + params.length);
  }

  if (!sets.length) {
    const current = await getUserById(id);
    if (!current) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    return current;
  }

  sets.push('updated_at = now()');
  params.push(id);

  let rows;
  try {
    rows = await getPool().query(
      'UPDATE users SET ' + sets.join(', ') +
      ' WHERE id = $' + params.length + ' RETURNING ' + COLUMNS,
      params
    );
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('CONFLICT', 'Số điện thoại đã thuộc về người dùng khác.', 409);
    }
    throw err;
  }

  if (!rows.rows[0]) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
  return toUser(rows.rows[0]);
}

module.exports = { listUsers, listAllUsers, getUserById, updateUser, normalizePhone };
