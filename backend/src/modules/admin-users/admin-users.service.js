'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../../core/database/connection');

function tierToPackage(tier) {
  var t = String(tier || '').toLowerCase();
  if (t === 'premium') return 'Premium';
  if (t === 'elite') return 'Elite';
  return 'Free';
}

function packageToTier(pkg) {
  var p = String(pkg || '').toLowerCase();
  if (p === 'premium') return 'premium';
  if (p === 'elite') return 'elite';
  return 'free';
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

function normalizePhone(phone) {
  if (!phone) return '';
  var digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '84' + digits.slice(1);
  else if (digits.length === 9 && /^[35789]/.test(digits)) digits = '84' + digits;
  return digits;
}

function genReferralCode() {
  return 'IFL' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function genTempPassword() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

function planExpiryIso(planType) {
  var p = String(planType || '').toLowerCase();
  if (p === 'freemium' || p === 'lifetime' || p === 'free') return null;
  var d = new Date();
  if (p === 'yearly' || p === 'annual') d.setDate(d.getDate() + 365);
  else d.setDate(d.getDate() + 30);
  return d.toISOString();
}

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
    publicId: row.referral_code || '',
    id_internal: String(row.id),
    referredBy: row.referred_by ? String(row.referred_by) : null,
    joinedAt: row.created_at || null,
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

async function getById(id) {
  var res = await query(
    'SELECT id, email, phone, display_name, nickname, referral_code, referred_by, ' +
    '       subscription_tier, subscription_expires_at, account_status, auth_provider, ' +
    '       email_verified_at, created_at ' +
    'FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rowToCustomer(res.rows[0]);
}

async function getByEmail(email) {
  var res = await query(
    'SELECT id, email, phone, display_name, nickname, referral_code, referred_by, ' +
    '       subscription_tier, subscription_expires_at, account_status, auth_provider, ' +
    '       email_verified_at, created_at ' +
    'FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [String(email || '').trim()]
  );
  return rowToCustomer(res.rows[0]);
}

async function createCustomer(payload) {
  payload = payload || {};
  var email = String(payload.email || '').trim().toLowerCase();
  var name = String(payload.name || payload.displayName || '').trim();
  if (!email || email.indexOf('@') < 0) {
    var e1 = new Error('invalid_email');
    e1.statusCode = 422;
    throw e1;
  }
  if (!name) {
    var e2 = new Error('invalid_name');
    e2.statusCode = 422;
    throw e2;
  }

  var phoneRaw = payload.phone != null ? String(payload.phone).trim() : '';
  var phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && (!phone || phone.length < 10)) {
    var e3 = new Error('invalid_phone');
    e3.statusCode = 422;
    throw e3;
  }

  var tier = packageToTier(payload.package || payload.planTier || 'Free');
  var planType = payload.planType || payload.cycle || (tier === 'free' ? 'freemium' : 'monthly');
  if (tier === 'free') planType = 'freemium';
  var expiresAt = planExpiryIso(planType);

  var plainPassword = payload.password ? String(payload.password) : genTempPassword();
  if (plainPassword.length < 8) {
    var e4 = new Error('invalid_password');
    e4.statusCode = 422;
    throw e4;
  }
  var passwordHash = await bcrypt.hash(plainPassword, 10);

  var referralCode = String(payload.affiliate || payload.referralCode || '').trim().toUpperCase() || genReferralCode();
  if (!/^IFL[A-Z0-9]{4,12}$/i.test(referralCode) && referralCode.length < 4) {
    referralCode = genReferralCode();
  }

  for (var attempt = 0; attempt < 5; attempt++) {
    try {
      var ins = await query(
        `INSERT INTO users (
           email, password_hash, display_name, nickname, phone, referral_code,
           subscription_tier, subscription_expires_at, account_status, auth_provider, email_verified_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active','email',NOW())
         RETURNING id, email, phone, display_name, nickname, referral_code, referred_by,
                   subscription_tier, subscription_expires_at, account_status, auth_provider,
                   email_verified_at, created_at`,
        [email, passwordHash, name, name, phone, referralCode, tier, expiresAt]
      );
      var customer = rowToCustomer(ins.rows[0]);
      return { customer: customer, tempPassword: payload.password ? null : plainPassword };
    } catch (err) {
      if (err.code === '23505') {
        var detail = String(err.detail || err.constraint || '');
        if (detail.includes('email')) {
          var e5 = new Error('email_exists');
          e5.statusCode = 409;
          throw e5;
        }
        if (detail.includes('phone')) {
          var e6 = new Error('phone_exists');
          e6.statusCode = 409;
          throw e6;
        }
        if (detail.includes('referral_code')) {
          referralCode = genReferralCode();
          continue;
        }
      }
      throw err;
    }
  }
  var e7 = new Error('referral_conflict');
  e7.statusCode = 409;
  throw e7;
}

async function updateCustomer(id, patch) {
  patch = patch || {};
  var existing = await getById(id);
  if (!existing) {
    var e = new Error('not_found');
    e.statusCode = 404;
    throw e;
  }

  var name = patch.name != null ? String(patch.name).trim() : existing.name;
  if (!name) {
    var e2 = new Error('invalid_name');
    e2.statusCode = 422;
    throw e2;
  }

  var phone = existing.phone || null;
  if (patch.phone !== undefined) {
    var phoneRaw = String(patch.phone || '').trim();
    if (!phoneRaw) phone = null;
    else {
      phone = normalizePhone(phoneRaw);
      if (!phone || phone.length < 10) {
        var e3 = new Error('invalid_phone');
        e3.statusCode = 422;
        throw e3;
      }
    }
  }

  var status = existing.accountStatus;
  if (patch.accountStatus != null || patch.account_status != null) {
    status = String(patch.accountStatus || patch.account_status).toLowerCase() === 'suspended'
      ? 'suspended'
      : 'active';
  }

  try {
    var res = await query(
      `UPDATE users SET
         display_name = $2,
         nickname = $2,
         phone = $3,
         account_status = $4,
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, phone, display_name, nickname, referral_code, referred_by,
                 subscription_tier, subscription_expires_at, account_status, auth_provider,
                 email_verified_at, created_at`,
      [id, name, phone, status]
    );
    return rowToCustomer(res.rows[0]);
  } catch (err) {
    if (err.code === '23505' && String(err.detail || '').includes('phone')) {
      var e4 = new Error('phone_exists');
      e4.statusCode = 409;
      throw e4;
    }
    throw err;
  }
}

async function grantPremium(id, opts) {
  opts = opts || {};
  var existing = await getById(id);
  if (!existing) {
    var e = new Error('not_found');
    e.statusCode = 404;
    throw e;
  }

  var tier = packageToTier(opts.package || opts.tier || 'Premium');
  if (tier === 'free') tier = 'premium';
  var planType = opts.planType || opts.cycle || 'monthly';
  if (planType === 'freemium') planType = 'monthly';
  var expiresAt = planExpiryIso(planType);

  var res = await query(
    `UPDATE users SET
       subscription_tier = $2,
       subscription_expires_at = $3,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, phone, display_name, nickname, referral_code, referred_by,
               subscription_tier, subscription_expires_at, account_status, auth_provider,
               email_verified_at, created_at`,
    [id, tier, expiresAt]
  );
  return rowToCustomer(res.rows[0]);
}

async function resetPassword(id, newPassword) {
  var existing = await getById(id);
  if (!existing) {
    var e = new Error('not_found');
    e.statusCode = 404;
    throw e;
  }
  var pwd = String(newPassword || '');
  if (pwd.length < 8) {
    var e2 = new Error('invalid_password');
    e2.statusCode = 422;
    throw e2;
  }
  var hash = await bcrypt.hash(pwd, 10);
  await query(
    'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1',
    [id, hash]
  );
  return { ok: true, id: id, email: existing.email };
}

module.exports = {
  listCustomers,
  getById,
  getByEmail,
  createCustomer,
  updateCustomer,
  grantPremium,
  resetPassword,
  rowToCustomer,
  tierToPackage
};
