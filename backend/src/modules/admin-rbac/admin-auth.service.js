'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { verifyGoogleIdToken } = require('../legacy-auth/social-auth.service');
const rbac = require('../admin-rbac/admin-rbac.service');

function parseAllowedEmails(config) {
  const raw = String(config.ADMIN_ALLOWED_EMAILS || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(config, email) {
  const allowed = parseAllowedEmails(config);
  if (!allowed.length) return false;
  return allowed.includes(String(email || '').toLowerCase());
}

function generateAdminToken(config, admin, rememberMe) {
  const payload = {
    sub: 'admin:' + admin.email,
    email: admin.email,
    name: admin.name || admin.email,
    picture: admin.avatarUrl || null,
    roles: ['admin']
  };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: rememberMe ? config.JWT_REMEMBER_EXPIRES_IN : config.JWT_EXPIRES_IN
  });
}

async function loginWithGoogle(config, idToken, rememberMe) {
  const profile = await verifyGoogleIdToken(idToken, config.GOOGLE_CLIENT_ID);
  if (!profile.email) {
    const err = new Error('Google không trả email. Vui lòng cấp quyền email.');
    err.statusCode = 422;
    throw err;
  }
  if (!profile.emailVerified) {
    const err = new Error('Email Google chưa được xác minh.');
    err.statusCode = 403;
    throw err;
  }

  // Cho phép nếu: nằm trong allowlist gốc HOẶC có tài khoản admin trong DB.
  let dbAccount = null;
  try { dbAccount = await rbac.getAccountByEmail(profile.email); } catch (e) { dbAccount = null; }
  if (isAllowedAdminEmail(config, profile.email)) {
    try {
      await rbac.ensureBootstrapAdmin(config);
      rbac.invalidateContextCache();
      dbAccount = await rbac.getAccountByEmail(profile.email);
    } catch (e) { /* ignore — middleware allowlist vẫn bypass */ }
  }
  if (dbAccount && dbAccount.status === 'locked') {
    const err = new Error('Tài khoản quản trị đã bị khóa.');
    err.statusCode = 403;
    throw err;
  }
  if (!isAllowedAdminEmail(config, profile.email) && !dbAccount) {
    const err = new Error('Tài khoản này không có quyền truy cập Admin.');
    err.statusCode = 403;
    throw err;
  }

  const isSuper = !!(dbAccount && dbAccount.isSuper) || isAllowedAdminEmail(config, profile.email);
  const admin = {
    email: profile.email,
    name: (dbAccount && dbAccount.name) || profile.displayName || profile.email,
    avatarUrl: profile.avatarUrl || (dbAccount && dbAccount.avatarUrl) || null,
    provider: 'google',
    isSuper: isSuper
  };
  const token = generateAdminToken(config, admin, !!rememberMe);
  try { await rbac.touchLogin(admin.email, 'google'); } catch (e) { /* ignore */ }
  return { token, admin };
}

/**
 * Bản đồ email -> bcrypt hash. Ưu tiên ADMIN_PASSWORD_HASHES (email:hash,email:hash);
 * nếu không có, dùng ADMIN_PASSWORD_HASH áp dụng cho mọi email trong allowlist.
 */
function parseAdminPasswordHashes(config) {
  const map = {};
  const raw = String(config.ADMIN_PASSWORD_HASHES || '').trim();
  if (raw) {
    raw.split(',').forEach((pair) => {
      const idx = pair.indexOf(':');
      if (idx <= 0) return;
      const email = pair.slice(0, idx).trim().toLowerCase();
      const hash = pair.slice(idx + 1).trim();
      if (email && hash) map[email] = hash;
    });
  }
  return map;
}

function getAdminPasswordHash(config, email) {
  const e = String(email || '').toLowerCase();
  const perEmail = parseAdminPasswordHashes(config);
  if (perEmail[e]) return perEmail[e];
  const shared = String(config.ADMIN_PASSWORD_HASH || '').trim();
  return shared || null;
}

async function loginWithPassword(config, email, password, rememberMe) {
  const normEmail = String(email || '').trim().toLowerCase();
  const invalid = new Error('Email hoặc mật khẩu không đúng.');
  invalid.statusCode = 401;

  if (!normEmail || !password) throw invalid;

  // 1) Ưu tiên tài khoản trong DB (do UI Phân quyền quản trị tạo ra).
  let dbCheck = null;
  try { dbCheck = await rbac.verifyPassword(normEmail, password); } catch (e) { dbCheck = null; }
  if (dbCheck) {
    if (dbCheck.locked) {
      const err = new Error('Tài khoản quản trị đã bị khóa.');
      err.statusCode = 403;
      throw err;
    }
    if (dbCheck.ok === true) {
      let acc = null;
      try { acc = await rbac.getAccountByEmail(normEmail); } catch (e) { acc = null; }
      const admin = {
        email: normEmail,
        name: (acc && acc.name) || normEmail,
        avatarUrl: (acc && acc.avatarUrl) || null,
        provider: 'password',
        isSuper: !!(acc && acc.isSuper) || isAllowedAdminEmail(config, normEmail)
      };
      const token = generateAdminToken(config, admin, !!rememberMe);
      try { await rbac.touchLogin(normEmail, 'password'); } catch (e) { /* ignore */ }
      return { token, admin };
    }
    if (dbCheck.ok === false) throw invalid; // account DB có mật khẩu nhưng sai
    // dbCheck.noHash → rơi xuống fallback env bên dưới
  }

  // 2) Fallback: super admin gốc theo allowlist + ADMIN_PASSWORD_HASH (env).
  if (!isAllowedAdminEmail(config, normEmail)) throw invalid;

  const hash = getAdminPasswordHash(config, normEmail);
  if (!hash) {
    const err = new Error('Đăng nhập mật khẩu chưa được cấu hình. Liên hệ kỹ thuật.');
    err.statusCode = 503;
    throw err;
  }

  const ok = await bcrypt.compare(String(password), hash);
  if (!ok) throw invalid;

  if (isAllowedAdminEmail(config, normEmail)) {
    try {
      await rbac.ensureBootstrapAdmin(config);
      rbac.invalidateContextCache();
    } catch (e) { /* ignore */ }
  }
  const admin = {
    email: normEmail,
    name: normEmail,
    avatarUrl: null,
    provider: 'password',
    isSuper: true
  };
  const token = generateAdminToken(config, admin, !!rememberMe);
  try { await rbac.touchLogin(normEmail, 'password'); } catch (e) { /* ignore */ }
  return { token, admin };
}

function getAdminFromPayload(payload) {
  if (!payload || !payload.roles || !payload.roles.includes('admin')) return null;
  if (!payload.email) return null;
  return {
    email: payload.email,
    name: payload.name || payload.email,
    avatarUrl: payload.picture || null
  };
}

module.exports = {
  parseAllowedEmails,
  isAllowedAdminEmail,
  loginWithGoogle,
  loginWithPassword,
  getAdminFromPayload,
  generateAdminToken
};
