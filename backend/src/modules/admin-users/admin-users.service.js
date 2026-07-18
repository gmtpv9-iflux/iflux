'use strict';

const { query } = require('../../core/database/connection');

function tierToPackage(tier) {
  var t = String(tier || '').toLowerCase();
  if (t === 'premium') return 'Premium';
  if (t === 'elite') return 'Elite';
  return 'Free';
}

function initialsFromName(name) {
  var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return String(name || 'U').trim().slice(0, 2).toUpperCase();
}

var AVATAR_CLASSES = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];

function avatarClassFromName(name) {
  var s = String(name || 'U');
  var sum = 0;
  for (var i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return AVATAR_CLASSES[sum % AVATAR_CLASSES.length];
}

function toDateOnly(value) {
  if (!value) return null;
  try {
    var d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return null;
  }
}

// Chuyển 1 dòng users (DB) → object "khách hàng" đúng shape mà users-list.js đang render.
function rowToCustomer(row) {
  if (!row) return null;
  var pkg = tierToPackage(row.subscription_tier);
  var name = row.display_name || row.nickname || (row.email ? String(row.email).split('@')[0] : 'Thành viên');
  var expiresAt = toDateOnly(row.subscription_expires_at);
  var planType;
  if (pkg === 'Free') {
    planType = 'freemium';
  } else if (!expiresAt) {
    planType = 'lifetime';
  } else {
    planType = 'monthly';
  }
  return {
    id: String(row.id),
    name: name,
    email: row.email || '',
    phone: row.phone || '',
    affiliate: row.referral_code || '',
    initials: initialsFromName(name),
    avatarCls: avatarClassFromName(name),
    package: pkg,
    planType: planType,
    role: 'Standard',
    expiresAt: expiresAt,
    billing: pkg === 'Free' ? '—' : 'Web',
    accountStatus: String(row.account_status || 'active') === 'suspended' ? 'suspended' : 'active',
    authProvider: row.auth_provider || 'email',
    emailVerified: !!row.email_verified_at,
    createdAt: row.created_at,
    source: 'app'
  };
}

/**
 * Danh sách khách hàng (user thật) từ bảng users cho Admin.
 * Trả về TẤT CẢ (giới hạn cap) để frontend tự lọc/phân trang/overview như hiện tại.
 */
async function listCustomers(filters) {
  filters = filters || {};
  var clauses = [];
  var params = [];

  if (filters.q) {
    params.push('%' + String(filters.q).toLowerCase() + '%');
    var i = params.length;
    clauses.push('(' +
      "LOWER(COALESCE(display_name,'')) LIKE $" + i +
      " OR LOWER(COALESCE(email,'')) LIKE $" + i +
      " OR LOWER(COALESCE(phone,'')) LIKE $" + i +
      " OR LOWER(COALESCE(referral_code,'')) LIKE $" + i +
    ')');
  }

  var where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  var res = await query(
    'SELECT id, email, phone, display_name, nickname, referral_code, referred_by, ' +
    '       subscription_tier, subscription_expires_at, account_status, auth_provider, ' +
    '       email_verified_at, created_at ' +
    'FROM users ' + where + ' ORDER BY created_at DESC NULLS LAST LIMIT 2000',
    params
  );
  return res.rows.map(rowToCustomer);
}

module.exports = {
  listCustomers,
  rowToCustomer,
  tierToPackage
};
