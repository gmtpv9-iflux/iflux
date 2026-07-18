'use strict';

const bcrypt = require('bcrypt');
const { query, getPool } = require('../../core/database/connection');
const { flattenPermissions, MODULES } = require('./permission-catalog');

/* ─────────────────────────── Seeding ─────────────────────────── */

/** Upsert toàn bộ permission trong catalog vào DB (không xóa cái cũ). */
async function seedPermissions() {
  const perms = flattenPermissions();
  for (const p of perms) {
    await query(
      `INSERT INTO admin_permissions (key, module, module_label, page, page_label, action, label, is_business, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (key) DO UPDATE SET
         module = EXCLUDED.module, module_label = EXCLUDED.module_label,
         page = EXCLUDED.page, page_label = EXCLUDED.page_label,
         action = EXCLUDED.action, label = EXCLUDED.label,
         is_business = EXCLUDED.is_business, sort = EXCLUDED.sort`,
      [p.key, p.module, p.module_label, p.page, p.page_label, p.action, p.label, p.is_business, p.sort]
    );
  }
  return perms.length;
}

/** Gán TẤT CẢ permission cho role admin (super) — để role admin luôn đầy đủ. */
async function syncSuperRolePermissions() {
  await query(
    `INSERT INTO admin_role_permissions (role_id, permission_id)
     SELECT r.id, p.id FROM admin_roles r CROSS JOIN admin_permissions p
     WHERE r.is_super = TRUE
     ON CONFLICT DO NOTHING`
  );
}

/**
 * Đảm bảo super admin gốc tồn tại (từ ADMIN_ALLOWED_EMAILS) + gán role 'admin'.
 * Lấy password_hash từ ADMIN_PASSWORD_HASH nếu account chưa có mật khẩu.
 */
async function ensureBootstrapAdmin(config) {
  const raw = String(config.ADMIN_ALLOWED_EMAILS || '').trim();
  if (!raw) return;
  const emails = raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const sharedHash = String(config.ADMIN_PASSWORD_HASH || '').trim() || null;

  const roleRes = await query("SELECT id FROM admin_roles WHERE code = 'admin' LIMIT 1");
  const adminRoleId = roleRes.rows[0] && roleRes.rows[0].id;

  for (const email of emails) {
    const existing = await query('SELECT id, password_hash FROM admin_accounts WHERE email = $1', [email]);
    let accountId;
    if (!existing.rowCount) {
      const ins = await query(
        `INSERT INTO admin_accounts (email, name, password_hash, is_super, status, provider)
         VALUES ($1,$2,$3,TRUE,'active','password') RETURNING id`,
        [email, email, sharedHash]
      );
      accountId = ins.rows[0].id;
    } else {
      accountId = existing.rows[0].id;
      if (!existing.rows[0].password_hash && sharedHash) {
        await query('UPDATE admin_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2', [sharedHash, accountId]);
      }
      await query('UPDATE admin_accounts SET is_super = TRUE WHERE id = $1', [accountId]);
    }
    if (adminRoleId) {
      await query(
        `INSERT INTO admin_account_roles (admin_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [accountId, adminRoleId]
      );
    }
  }
}

/** Chạy 1 lần khi boot: seed permission + đồng bộ super role + bootstrap admin. */
async function bootstrapRbac(config) {
  await seedPermissions();
  await syncSuperRolePermissions();
  await ensureBootstrapAdmin(config);
}

/* ─────────────────────── Resolve quyền theo tài khoản ─────────────────────── */

/**
 * Trả về { id, email, name, avatarUrl, isSuper, status, roles:[...], permissions:Set }
 * hoặc null nếu không có tài khoản.
 */
async function getAccountByEmail(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return null;
  const res = await query(
    `SELECT id, email, name, avatar_url, is_super, status, provider, password_hash FROM admin_accounts WHERE email = $1`,
    [e]
  );
  if (!res.rowCount) return null;
  const acc = res.rows[0];

  const roles = await query(
    `SELECT r.id, r.code, r.name, r.is_super
     FROM admin_account_roles ar JOIN admin_roles r ON r.id = ar.role_id
     WHERE ar.admin_id = $1`,
    [acc.id]
  );
  const isSuper = !!acc.is_super || roles.rows.some((r) => r.is_super);

  let permissions = new Set();
  if (isSuper) {
    const all = await query('SELECT key FROM admin_permissions');
    all.rows.forEach((r) => permissions.add(r.key));
  } else if (roles.rowCount) {
    const perms = await query(
      `SELECT DISTINCT p.key
       FROM admin_account_roles ar
       JOIN admin_role_permissions rp ON rp.role_id = ar.role_id
       JOIN admin_permissions p ON p.id = rp.permission_id
       WHERE ar.admin_id = $1`,
      [acc.id]
    );
    perms.rows.forEach((r) => permissions.add(r.key));
  }

  return {
    id: acc.id,
    email: acc.email,
    name: acc.name || acc.email,
    avatarUrl: acc.avatar_url || null,
    isSuper: isSuper,
    status: acc.status,
    provider: acc.provider,
    roles: roles.rows.map((r) => ({ id: r.id, code: r.code, name: r.name })),
    permissions: permissions
  };
}

/* Cache context (permissions) theo email — TTL ngắn để giảm truy vấn mỗi request. */
const _ctxCache = new Map();
const CTX_TTL = 30 * 1000;

async function getContextCached(email) {
  const e = String(email || '').toLowerCase();
  const hit = _ctxCache.get(e);
  if (hit && (Date.now() - hit.ts) < CTX_TTL) return hit.ctx;
  const ctx = await getAccountByEmail(e);
  _ctxCache.set(e, { ctx: ctx, ts: Date.now() });
  return ctx;
}

function invalidateContextCache() {
  _ctxCache.clear();
}

/**
 * Kiểm mật khẩu tài khoản admin trong DB.
 * @returns null (không có account) | {locked:true} | {noHash:true} | {ok:true,id} | {ok:false}
 */
async function verifyPassword(email, password) {
  const e = String(email || '').toLowerCase();
  const res = await query('SELECT id, password_hash, status FROM admin_accounts WHERE email = $1', [e]);
  if (!res.rowCount) return null;
  const acc = res.rows[0];
  if (acc.status !== 'active') return { locked: true };
  if (!acc.password_hash) return { noHash: true };
  const ok = await bcrypt.compare(String(password || ''), acc.password_hash);
  return ok ? { ok: true, id: acc.id } : { ok: false };
}

async function touchLogin(email, provider) {
  await query(
    'UPDATE admin_accounts SET last_login_at = NOW(), provider = COALESCE($2, provider) WHERE email = $1',
    [String(email || '').toLowerCase(), provider || null]
  );
}

/* ─────────────────────────── Roles ─────────────────────────── */

async function listRoles() {
  const res = await query(
    `SELECT r.id, r.code, r.name, r.description, r.is_system, r.is_super, r.created_at,
            (SELECT COUNT(*) FROM admin_account_roles ar WHERE ar.role_id = r.id) AS account_count,
            CASE WHEN r.is_super THEN (SELECT COUNT(*) FROM admin_permissions)
                 ELSE (SELECT COUNT(*) FROM admin_role_permissions rp WHERE rp.role_id = r.id) END AS permission_count
     FROM admin_roles r ORDER BY r.is_super DESC, r.created_at`
  );
  return res.rows.map((r) => ({
    id: r.id, code: r.code, name: r.name, description: r.description || '',
    isSystem: r.is_system, isSuper: r.is_super,
    accountCount: Number(r.account_count), permissionCount: Number(r.permission_count)
  }));
}

async function getRolePermissionKeys(roleId) {
  const roleRes = await query('SELECT is_super FROM admin_roles WHERE id = $1', [roleId]);
  if (!roleRes.rowCount) return null;
  if (roleRes.rows[0].is_super) {
    const all = await query('SELECT key FROM admin_permissions');
    return all.rows.map((r) => r.key);
  }
  const res = await query(
    `SELECT p.key FROM admin_role_permissions rp JOIN admin_permissions p ON p.id = rp.permission_id WHERE rp.role_id = $1`,
    [roleId]
  );
  return res.rows.map((r) => r.key);
}

async function createRole({ code, name, description }) {
  const c = String(code || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  if (!c) { const e = new Error('Mã vai trò không hợp lệ.'); e.statusCode = 422; throw e; }
  const res = await query(
    `INSERT INTO admin_roles (code, name, description, is_system, is_super) VALUES ($1,$2,$3,FALSE,FALSE) RETURNING id`,
    [c, String(name || c).trim(), description || null]
  ).catch((err) => {
    if (String(err.message).includes('duplicate')) { const e = new Error('Mã vai trò đã tồn tại.'); e.statusCode = 409; throw e; }
    throw err;
  });
  return res.rows[0].id;
}

async function updateRole(roleId, { name, description }) {
  await query('UPDATE admin_roles SET name = COALESCE($2,name), description = $3, updated_at = NOW() WHERE id = $1',
    [roleId, name != null ? String(name) : null, description != null ? String(description) : null]);
}

async function cloneRole(roleId, newName) {
  const src = await query('SELECT code, name, description FROM admin_roles WHERE id = $1', [roleId]);
  if (!src.rowCount) { const e = new Error('Không tìm thấy vai trò.'); e.statusCode = 404; throw e; }
  const baseCode = src.rows[0].code + '_copy';
  let code = baseCode; let n = 1;
  while ((await query('SELECT 1 FROM admin_roles WHERE code = $1', [code])).rowCount) { code = baseCode + '_' + (++n); }
  const ins = await query(
    `INSERT INTO admin_roles (code, name, description, is_system, is_super) VALUES ($1,$2,$3,FALSE,FALSE) RETURNING id`,
    [code, newName || (src.rows[0].name + ' (sao chép)'), src.rows[0].description || null]
  );
  const newId = ins.rows[0].id;
  await query(
    `INSERT INTO admin_role_permissions (role_id, permission_id)
     SELECT $1, permission_id FROM admin_role_permissions WHERE role_id = $2`,
    [newId, roleId]
  );
  return newId;
}

async function deleteRole(roleId) {
  const r = await query('SELECT is_system FROM admin_roles WHERE id = $1', [roleId]);
  if (!r.rowCount) { const e = new Error('Không tìm thấy vai trò.'); e.statusCode = 404; throw e; }
  if (r.rows[0].is_system) { const e = new Error('Không thể xóa vai trò hệ thống.'); e.statusCode = 409; throw e; }
  const used = await query('SELECT COUNT(*) AS c FROM admin_account_roles WHERE role_id = $1', [roleId]);
  if (Number(used.rows[0].c) > 0) { const e = new Error('Vai trò đang được gán cho tài khoản, không thể xóa.'); e.statusCode = 409; throw e; }
  await query('DELETE FROM admin_roles WHERE id = $1', [roleId]);
}

async function setRolePermissions(roleId, permissionKeys) {
  const r = await query('SELECT is_super FROM admin_roles WHERE id = $1', [roleId]);
  if (!r.rowCount) { const e = new Error('Không tìm thấy vai trò.'); e.statusCode = 404; throw e; }
  if (r.rows[0].is_super) { const e = new Error('Vai trò toàn quyền không cần chỉnh permission.'); e.statusCode = 409; throw e; }
  const keys = Array.isArray(permissionKeys) ? permissionKeys : [];
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM admin_role_permissions WHERE role_id = $1', [roleId]);
    if (keys.length) {
      await client.query(
        `INSERT INTO admin_role_permissions (role_id, permission_id)
         SELECT $1, id FROM admin_permissions WHERE key = ANY($2::varchar[])
         ON CONFLICT DO NOTHING`,
        [roleId, keys]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally {
    client.release();
  }
}

/* ─────────────────────────── Permissions catalog (đọc) ─────────────────────────── */

async function listPermissionsGrouped() {
  const res = await query('SELECT key, module, module_label, page, page_label, action, label, is_business FROM admin_permissions ORDER BY sort');
  const modules = [];
  const modIndex = {};
  res.rows.forEach((p) => {
    if (!modIndex[p.module]) {
      modIndex[p.module] = { key: p.module, label: p.module_label, pages: [], pageIndex: {} };
      modules.push(modIndex[p.module]);
    }
    const mod = modIndex[p.module];
    if (!mod.pageIndex[p.page]) {
      mod.pageIndex[p.page] = { key: p.page, label: p.page_label, permissions: [] };
      mod.pages.push(mod.pageIndex[p.page]);
    }
    mod.pageIndex[p.page].permissions.push({ key: p.key, action: p.action, label: p.label, isBusiness: p.is_business });
  });
  modules.forEach((m) => { delete m.pageIndex; });
  return modules;
}

/* ─────────────────────────── Admin accounts ─────────────────────────── */

async function listAccounts() {
  const res = await query(
    `SELECT a.id, a.email, a.name, a.avatar_url, a.is_super, a.status, a.provider, a.last_login_at, a.created_at,
            (a.password_hash IS NOT NULL) AS has_password,
            COALESCE(json_agg(json_build_object('id', r.id, 'code', r.code, 'name', r.name))
                     FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
     FROM admin_accounts a
     LEFT JOIN admin_account_roles ar ON ar.admin_id = a.id
     LEFT JOIN admin_roles r ON r.id = ar.role_id
     GROUP BY a.id ORDER BY a.is_super DESC, a.created_at`
  );
  return res.rows.map((a) => ({
    id: a.id, email: a.email, name: a.name || a.email, avatarUrl: a.avatar_url,
    isSuper: a.is_super, status: a.status, provider: a.provider,
    hasPassword: a.has_password, lastLoginAt: a.last_login_at, createdAt: a.created_at,
    roles: a.roles
  }));
}

async function createAccount({ email, name, password, roleIds }) {
  const e = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { const err = new Error('Email không hợp lệ.'); err.statusCode = 422; throw err; }
  const dup = await query('SELECT 1 FROM admin_accounts WHERE email = $1', [e]);
  if (dup.rowCount) { const err = new Error('Email đã tồn tại.'); err.statusCode = 409; throw err; }
  const hash = password ? await bcrypt.hash(String(password), 10) : null;
  const ins = await query(
    `INSERT INTO admin_accounts (email, name, password_hash, is_super, status, provider)
     VALUES ($1,$2,$3,FALSE,'active','password') RETURNING id`,
    [e, String(name || e).trim(), hash]
  );
  const id = ins.rows[0].id;
  await setAccountRoles(id, roleIds || []);
  return id;
}

async function updateAccount(accountId, { name }) {
  await query('UPDATE admin_accounts SET name = COALESCE($2,name), updated_at = NOW() WHERE id = $1',
    [accountId, name != null ? String(name) : null]);
}

async function setAccountRoles(accountId, roleIds) {
  const ids = Array.isArray(roleIds) ? roleIds.filter(Boolean) : [];
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM admin_account_roles WHERE admin_id = $1', [accountId]);
    if (ids.length) {
      await client.query(
        `INSERT INTO admin_account_roles (admin_id, role_id)
         SELECT $1, id FROM admin_roles WHERE id = ANY($2::uuid[]) ON CONFLICT DO NOTHING`,
        [accountId, ids]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally {
    client.release();
  }
}

async function setAccountStatus(accountId, status) {
  const s = status === 'locked' ? 'locked' : 'active';
  const acc = await query('SELECT is_super FROM admin_accounts WHERE id = $1', [accountId]);
  if (!acc.rowCount) { const e = new Error('Không tìm thấy tài khoản.'); e.statusCode = 404; throw e; }
  if (acc.rows[0].is_super && s === 'locked') { const e = new Error('Không thể khóa tài khoản super admin.'); e.statusCode = 409; throw e; }
  await query('UPDATE admin_accounts SET status = $2, updated_at = NOW() WHERE id = $1', [accountId, s]);
}

async function resetPassword(accountId, newPassword) {
  const hash = await bcrypt.hash(String(newPassword || ''), 10);
  await query('UPDATE admin_accounts SET password_hash = $2, updated_at = NOW() WHERE id = $1', [accountId, hash]);
}

/** Đổi mật khẩu bởi chính chủ (kiểm mật khẩu cũ). */
async function changeOwnPassword(email, currentPassword, newPassword) {
  const chk = await verifyPassword(email, currentPassword);
  if (!chk || !chk.ok) { const e = new Error('Mật khẩu hiện tại không đúng.'); e.statusCode = 401; throw e; }
  await resetPassword(chk.id, newPassword);
}

async function deleteAccount(accountId) {
  const acc = await query('SELECT is_super FROM admin_accounts WHERE id = $1', [accountId]);
  if (!acc.rowCount) { const e = new Error('Không tìm thấy tài khoản.'); e.statusCode = 404; throw e; }
  if (acc.rows[0].is_super) { const e = new Error('Không thể xóa tài khoản super admin.'); e.statusCode = 409; throw e; }
  await query('DELETE FROM admin_accounts WHERE id = $1', [accountId]);
}

/* ─────────────────────────── Audit log ─────────────────────────── */

async function writeAudit(entry) {
  entry = entry || {};
  try {
    await query(
      `INSERT INTO admin_audit_log (admin_id, admin_email, action, target_type, target_id, detail, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [entry.adminId || null, entry.email || null, entry.action || 'unknown',
       entry.targetType || null, entry.targetId != null ? String(entry.targetId) : null,
       entry.detail ? JSON.stringify(entry.detail) : '{}', entry.ip || null]
    );
  } catch (e) { /* audit không được làm hỏng request chính */ }
}

async function listAudit(limit) {
  const res = await query(
    'SELECT id, admin_email, action, target_type, target_id, detail, ip, created_at FROM admin_audit_log ORDER BY id DESC LIMIT $1',
    [Math.min(Number(limit) || 200, 1000)]
  );
  return res.rows;
}

module.exports = {
  bootstrapRbac, seedPermissions, syncSuperRolePermissions, ensureBootstrapAdmin,
  getAccountByEmail, getContextCached, invalidateContextCache, verifyPassword, touchLogin,
  listRoles, getRolePermissionKeys, createRole, updateRole, cloneRole, deleteRole, setRolePermissions,
  listPermissionsGrouped,
  listAccounts, createAccount, updateAccount, setAccountRoles, setAccountStatus, resetPassword, changeOwnPassword, deleteAccount,
  writeAudit, listAudit
};
