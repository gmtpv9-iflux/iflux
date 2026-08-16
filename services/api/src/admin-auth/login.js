'use strict';

const bcrypt = require('bcrypt');
const { AppError } = require('../errors');
const { getPool } = require('../db');
const { signAdminToken } = require('./token');

function invalidCredentials() {
  return new AppError(
    'UNAUTHORIZED',
    'Email hoặc mật khẩu không đúng.',
    401
  );
}

async function loginWithPassword(config, email, password, remember) {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm || !password) throw invalidCredentials();

  const pool = getPool();
  const res = await pool.query(
    `SELECT id, email, name, avatar_url, password_hash, is_super, status, provider
     FROM admin_accounts
     WHERE lower(email) = $1
     LIMIT 1`,
    [norm]
  );

  const row = res.rows[0];
  if (!row || !row.password_hash) throw invalidCredentials();

  if (row.status !== 'active') {
    throw new AppError(
      'ADMIN_LOCKED',
      'Tài khoản quản trị đã bị khóa.',
      403
    );
  }

  const ok = await bcrypt.compare(String(password), row.password_hash);
  if (!ok) throw invalidCredentials();

  await pool.query(
    'UPDATE admin_accounts SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
    [row.id]
  );

  const admin = {
    email: row.email,
    name: row.name || row.email,
    avatarUrl: row.avatar_url || null,
    provider: 'password',
    isSuper: !!row.is_super
  };

  return {
    token: signAdminToken(config, admin, !!remember),
    admin: admin
  };
}

module.exports = { loginWithPassword };
