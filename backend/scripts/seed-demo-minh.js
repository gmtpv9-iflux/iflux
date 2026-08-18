#!/usr/bin/env node
'use strict';

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://iflux:iflux_staging_2026@127.0.0.1:5432/iflux'
  });
  const email = 'minh@iflux.vn';
  const hash = await bcrypt.hash('Demo@1234', 10);
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.rows.length) {
    const r = await pool.query(
      `UPDATE users SET password_hash = $1, display_name = $2, nickname = $3, phone = $4,
       subscription_tier = $5, account_status = 'active',
       email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
       WHERE email = $6 RETURNING id, email, subscription_tier`,
      [hash, 'Nguyễn Văn Minh', 'Nguyễn Văn Minh', '+84912345678', 'premium', email]
    );
    console.log('UPDATED', JSON.stringify(r.rows[0]));
  } else {
    const r = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, nickname, phone, referral_code,
        subscription_tier, email_verified_at, account_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'active')
       RETURNING id, email, subscription_tier`,
      [email, hash, 'Nguyễn Văn Minh', 'Nguyễn Văn Minh', '+84912345678', 'IFLMVN10', 'premium']
    );
    console.log('INSERTED', JSON.stringify(r.rows[0]));
  }

  await pool.end();
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
