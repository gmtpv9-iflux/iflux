'use strict';

/**
 * Staging 2 — ADM-15: truy vấn tài khoản / vai trò / quyền.
 * Không biết HTTP. Ghi catalog không đi qua đây.
 */

const bcrypt = require('bcrypt');
const { AppError } = require('../errors');
const { getPool, insertAdminAudit } = require('../db');
const { hasActivity } = require('../admin-rbac/activity-sources');
const { listRegistered } = require('../admin-rbac/registry');

function isOwnerRow(row) {
  return !!(row && (row.is_super || row.is_owner));
}

function accessLabel(isOwner) {
  return isOwner ? 'Owner' : 'Nhân viên';
}

function roleKind(row) {
  if (row.is_super) return 'Toàn quyền';
  if (row.is_system) return 'Hệ thống';
  return 'Tùy chỉnh';
}

function toRole(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    isSuper: !!row.is_super,
    isSystem: !!row.is_system,
    kind: roleKind(row),
    holderCount: row.holder_count != null ? Number(row.holder_count) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toAccount(row, roles) {
  const owner = isOwnerRow(row);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    isSuper: owner,
    access: accessLabel(owner),
    provider: row.provider,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    roles: (roles || []).map(function (r) {
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        isSuper: !!r.is_super,
        isSystem: !!r.is_system
      };
    })
  };
}

async function loadAccount(db, id) {
  const res = await db.query(
    `SELECT a.id, a.email, a.name, a.status, a.is_super, a.provider,
            a.last_login_at, a.created_at, a.updated_at,
            a.is_super OR COALESCE(bool_or(r.is_super), false) AS is_owner
       FROM admin_accounts a
       LEFT JOIN admin_account_roles ar ON ar.admin_id = a.id
       LEFT JOIN admin_roles r ON r.id = ar.role_id
      WHERE a.id = $1
      GROUP BY a.id`,
    [id]
  );
  return res.rows[0] || null;
}

async function accountRoles(db, id) {
  const res = await db.query(
    `SELECT r.id, r.code, r.name, r.is_super, r.is_system
       FROM admin_account_roles ar
       JOIN admin_roles r ON r.id = ar.role_id
      WHERE ar.admin_id = $1
      ORDER BY r.name`,
    [id]
  );
  return res.rows;
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
}

async function assertStaffRoles(db, roleIds) {
  if (!roleIds || !roleIds.length) return;
  const res = await db.query(
    'SELECT id, is_super FROM admin_roles WHERE id = ANY($1::uuid[])',
    [roleIds]
  );
  if (res.rows.length !== roleIds.length) {
    throw new AppError('VALIDATION_ERROR', 'Vai trò không tồn tại.', 400);
  }
  if (res.rows.some(function (r) { return r.is_super; })) {
    throw new AppError('FORBIDDEN', 'Không được gán vai trò toàn quyền.', 403);
  }
}

async function setAccountRoles(db, accountId, roleIds) {
  await db.query('DELETE FROM admin_account_roles WHERE admin_id = $1', [accountId]);
  if (!roleIds.length) return;
  await db.query(
    'INSERT INTO admin_account_roles (admin_id, role_id) SELECT $1, unnest($2::uuid[])',
    [accountId, roleIds]
  );
}

async function listAccounts() {
  const pool = getPool();
  const res = await pool.query(
    `SELECT a.id, a.email, a.name, a.status, a.is_super, a.provider,
            a.last_login_at, a.created_at, a.updated_at,
            a.is_super OR COALESCE(bool_or(r.is_super), false) AS is_owner
       FROM admin_accounts a
       LEFT JOIN admin_account_roles ar ON ar.admin_id = a.id
       LEFT JOIN admin_roles r ON r.id = ar.role_id
      WHERE a.status IN ('active', 'disabled')
      GROUP BY a.id
      ORDER BY a.created_at DESC`
  );
  const out = [];
  for (let i = 0; i < res.rows.length; i++) {
    const roles = await accountRoles(pool, res.rows[i].id);
    out.push(toAccount(res.rows[i], roles));
  }
  return out;
}

async function getAccount(id) {
  const row = await loadAccount(getPool(), id);
  if (!row || row.status === 'deleted') return null;
  return toAccount(row, await accountRoles(getPool(), id));
}

async function createAccount(body, actor) {
  const pool = getPool();
  const email = String(body.email).trim().toLowerCase();
  const roleIds = body.roleIds || [];
  await assertStaffRoles(pool, roleIds);
  const passwordHash = await hashPassword(body.password);
  let row;
  try {
    const inserted = await pool.query(
      `INSERT INTO admin_accounts (email, name, password_hash, is_super, status, provider)
       VALUES ($1, $2, $3, false, 'active', 'password')
       RETURNING id`,
      [email, body.name, passwordHash]
    );
    row = inserted.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('CONFLICT', 'Email đã được sử dụng.', 409);
    }
    throw err;
  }
  await setAccountRoles(pool, row.id, roleIds);
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.account.create',
    targetType: 'admin_accounts',
    targetId: String(row.id),
    ip: actor.ip
  });
  return getAccount(row.id);
}

async function updateAccount(id, patch, actor) {
  const pool = getPool();
  const row = await loadAccount(pool, id);
  if (!row || row.status === 'deleted') return null;
  if (isOwnerRow(row)) {
    throw new AppError('FORBIDDEN', 'Không được sửa tài khoản Owner.', 403);
  }
  const fields = [];
  const params = [];
  if (patch.name !== undefined) {
    params.push(patch.name);
    fields.push('name = $' + params.length);
  }
  if (patch.email !== undefined) {
    params.push(String(patch.email).trim().toLowerCase());
    fields.push('email = $' + params.length);
  }
  if (!fields.length) return toAccount(row, await accountRoles(pool, id));
  params.push(id);
  try {
    await pool.query(
      'UPDATE admin_accounts SET ' + fields.join(', ') + ', updated_at = NOW() WHERE id = $' + params.length,
      params
    );
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('CONFLICT', 'Email đã được sử dụng.', 409);
    }
    throw err;
  }
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.account.update',
    targetType: 'admin_accounts',
    targetId: String(id),
    ip: actor.ip
  });
  return getAccount(id);
}

async function setAccountStatus(id, status, actor) {
  const pool = getPool();
  const row = await loadAccount(pool, id);
  if (!row || row.status === 'deleted') return null;
  if (isOwnerRow(row)) {
    throw new AppError('FORBIDDEN', 'Không được đổi trạng thái tài khoản Owner.', 403);
  }
  if (row.status === status) return toAccount(row, await accountRoles(pool, id));
  await pool.query(
    'UPDATE admin_accounts SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, id]
  );
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: status === 'disabled' ? 'admin.account.disable' : 'admin.account.enable',
    targetType: 'admin_accounts',
    targetId: String(id),
    ip: actor.ip
  });
  return getAccount(id);
}

async function resetPassword(id, password, actor) {
  const pool = getPool();
  const row = await loadAccount(pool, id);
  if (!row || row.status === 'deleted') return null;
  if (isOwnerRow(row)) {
    throw new AppError('FORBIDDEN', 'Không được đặt lại mật khẩu Owner.', 403);
  }
  const passwordHash = await hashPassword(password);
  await pool.query(
    'UPDATE admin_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, id]
  );
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.account.reset_password',
    targetType: 'admin_accounts',
    targetId: String(id),
    ip: actor.ip
  });
  return { ok: true };
}

async function assignAccountRoles(id, roleIds, actor) {
  const pool = getPool();
  const row = await loadAccount(pool, id);
  if (!row || row.status === 'deleted') return null;
  if (isOwnerRow(row)) {
    throw new AppError('FORBIDDEN', 'Không được gán vai trò cho Owner.', 403);
  }
  await assertStaffRoles(pool, roleIds);
  await setAccountRoles(pool, id, roleIds);
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.account.set_roles',
    targetType: 'admin_accounts',
    targetId: String(id),
    detail: { roleIds: roleIds },
    ip: actor.ip
  });
  return getAccount(id);
}

async function deleteAccount(id, actor) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      'SELECT id, status, is_super FROM admin_accounts WHERE id = $1 FOR UPDATE',
      [id]
    );
    const row = locked.rows[0];
    if (row) {
      const ownerRes = await client.query(
        `SELECT a.is_super OR COALESCE(bool_or(r.is_super), false) AS is_owner
           FROM admin_accounts a
           LEFT JOIN admin_account_roles ar ON ar.admin_id = a.id
           LEFT JOIN admin_roles r ON r.id = ar.role_id
          WHERE a.id = $1
          GROUP BY a.id`,
        [id]
      );
      row.is_owner = !!(ownerRes.rows[0] && ownerRes.rows[0].is_owner);
    }
    if (!row || row.status === 'deleted') {
      await client.query('ROLLBACK');
      return null;
    }
    if (isOwnerRow(row)) {
      await client.query('ROLLBACK');
      throw new AppError('FORBIDDEN', 'Không được xóa tài khoản Owner.', 403);
    }

    let active;
    try {
      active = await hasActivity(client, id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new AppError('SERVICE_UNAVAILABLE', 'Không kiểm tra được hoạt động tài khoản.', 503);
    }

    let action = 'admin.account.delete';
    if (active) {
      await client.query(
        "UPDATE admin_accounts SET status = 'deleted', updated_at = NOW() WHERE id = $1",
        [id]
      );
      action = 'admin.account.soft_delete';
    } else {
      await client.query('SAVEPOINT before_delete');
      try {
        await client.query('DELETE FROM admin_accounts WHERE id = $1', [id]);
        await client.query('RELEASE SAVEPOINT before_delete');
      } catch (err) {
        if (err.code !== '23503') throw err;
        await client.query('ROLLBACK TO SAVEPOINT before_delete');
        await client.query(
          "UPDATE admin_accounts SET status = 'deleted', updated_at = NOW() WHERE id = $1",
          [id]
        );
        action = 'admin.account.soft_delete';
      }
    }

    await insertAdminAudit({
      client: client,
      adminId: actor.adminId,
      adminEmail: actor.adminEmail,
      action: action,
      targetType: 'admin_accounts',
      targetId: String(id),
      ip: actor.ip
    });
    await client.query('COMMIT');
    return { action: action };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* already rolled back */ }
    throw err;
  } finally {
    client.release();
  }
}

async function listRoles() {
  const res = await getPool().query(
    `SELECT r.id, r.code, r.name, r.description, r.is_system, r.is_super,
            r.created_at, r.updated_at,
            (
              SELECT count(*)::int
                FROM admin_account_roles ar
                JOIN admin_accounts a ON a.id = ar.admin_id
               WHERE ar.role_id = r.id
                 AND a.status IN ('active', 'disabled')
            ) AS holder_count
       FROM admin_roles r
      ORDER BY r.is_super DESC, r.name`
  );
  return res.rows.map(toRole);
}

async function getRole(id) {
  const res = await getPool().query(
    `SELECT r.id, r.code, r.name, r.description, r.is_system, r.is_super,
            r.created_at, r.updated_at,
            (
              SELECT count(*)::int
                FROM admin_account_roles ar
                JOIN admin_accounts a ON a.id = ar.admin_id
               WHERE ar.role_id = r.id
                 AND a.status IN ('active', 'disabled')
            ) AS holder_count
       FROM admin_roles r
      WHERE r.id = $1`,
    [id]
  );
  return res.rows[0] ? toRole(res.rows[0]) : null;
}

async function createRole(body, actor) {
  const code = String(body.code).trim().toLowerCase();
  let row;
  try {
    const inserted = await getPool().query(
      `INSERT INTO admin_roles (code, name, description, is_system, is_super)
       VALUES ($1, $2, $3, false, false)
       RETURNING id`,
      [code, body.name, body.description || null]
    );
    row = inserted.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('CONFLICT', 'Mã vai trò đã tồn tại.', 409);
    }
    throw err;
  }
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.role.create',
    targetType: 'admin_roles',
    targetId: String(row.id),
    ip: actor.ip
  });
  return getRole(row.id);
}

async function updateRole(id, patch, actor) {
  const role = await getRole(id);
  if (!role) return null;
  if (role.isSuper || role.isSystem) {
    throw new AppError('FORBIDDEN', 'Không được sửa vai trò hệ thống.', 403);
  }
  await getPool().query(
    'UPDATE admin_roles SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = NOW() WHERE id = $3',
    [
      patch.name !== undefined ? patch.name : null,
      patch.description !== undefined ? patch.description : null,
      id
    ]
  );
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.role.update',
    targetType: 'admin_roles',
    targetId: String(id),
    ip: actor.ip
  });
  return getRole(id);
}

async function deleteRole(id, actor) {
  const role = await getRole(id);
  if (!role) return null;
  if (role.isSuper || role.isSystem) {
    throw new AppError('FORBIDDEN', 'Không được xóa vai trò hệ thống.', 403);
  }
  if (role.holderCount > 0) {
    throw new AppError('CONFLICT', 'Vai trò vẫn còn người giữ.', 409);
  }
  await getPool().query('DELETE FROM admin_roles WHERE id = $1', [id]);
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.role.delete',
    targetType: 'admin_roles',
    targetId: String(id),
    ip: actor.ip
  });
  return { ok: true };
}

async function cloneRole(id, actor) {
  const role = await getRole(id);
  if (!role) return null;
  if (role.isSuper) {
    throw new AppError('FORBIDDEN', 'Không được nhân bản vai trò toàn quyền.', 403);
  }
  const code = role.code + '_copy';
  let row;
  try {
    const inserted = await getPool().query(
      `INSERT INTO admin_roles (code, name, description, is_system, is_super)
       VALUES ($1, $2, $3, false, false)
       RETURNING id`,
      [code, role.name + ' (bản sao)', role.description || null]
    );
    row = inserted.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('CONFLICT', 'Mã vai trò bản sao đã tồn tại.', 409);
    }
    throw err;
  }
  await getPool().query(
    `INSERT INTO admin_role_permissions (role_id, permission_id)
     SELECT $1, permission_id FROM admin_role_permissions WHERE role_id = $2`,
    [row.id, id]
  );
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.role.clone',
    targetType: 'admin_roles',
    targetId: String(row.id),
    detail: { from: id },
    ip: actor.ip
  });
  return getRole(row.id);
}

function catalog() {
  return listRegistered();
}

async function getMatrix(roleId) {
  const role = await getRole(roleId);
  if (!role) return null;
  if (role.isSuper) {
    throw new AppError('VALIDATION_ERROR', 'Vai trò toàn quyền không nằm trên matrix.', 400);
  }
  const res = await getPool().query(
    `SELECT p.key
       FROM admin_role_permissions rp
       JOIN admin_permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1`,
    [roleId]
  );
  const allowed = {};
  listRegistered().forEach(function (item) {
    allowed[item.key] = true;
  });
  const keys = res.rows
    .map(function (r) { return r.key; })
    .filter(function (key) { return allowed[key]; });
  return { role: role, keys: keys, permissions: listRegistered() };
}

async function setRolePermissions(id, keys, actor) {
  const role = await getRole(id);
  if (!role) return null;
  if (role.isSuper) {
    throw new AppError('FORBIDDEN', 'Không được gán quyền cho vai trò toàn quyền.', 403);
  }
  const registered = {};
  listRegistered().forEach(function (item) {
    registered[item.key] = true;
  });
  for (let i = 0; i < keys.length; i++) {
    if (!registered[keys[i]]) {
      throw new AppError('VALIDATION_ERROR', 'Khóa không thuộc Catalog: ' + keys[i], 400);
    }
  }
  const pool = getPool();
  await pool.query('DELETE FROM admin_role_permissions WHERE role_id = $1', [id]);
  if (keys.length) {
    await pool.query(
      `INSERT INTO admin_role_permissions (role_id, permission_id)
       SELECT $1, id FROM admin_permissions WHERE key = ANY($2::varchar[])`,
      [id, keys]
    );
  }
  await insertAdminAudit({
    adminId: actor.adminId,
    adminEmail: actor.adminEmail,
    action: 'admin.permission.set_role',
    targetType: 'admin_roles',
    targetId: String(id),
    detail: { keys: keys },
    ip: actor.ip
  });
  return getMatrix(id);
}

async function getProfile(email) {
  const res = await getPool().query(
    `SELECT a.id, a.email, a.name, a.status, a.is_super, a.provider,
            a.last_login_at, a.created_at, a.updated_at,
            a.is_super OR COALESCE(bool_or(r.is_super), false) AS is_owner
       FROM admin_accounts a
       LEFT JOIN admin_account_roles ar ON ar.admin_id = a.id
       LEFT JOIN admin_roles r ON r.id = ar.role_id
      WHERE lower(a.email) = $1
      GROUP BY a.id`,
    [String(email || '').trim().toLowerCase()]
  );
  const row = res.rows[0];
  if (!row || row.status === 'deleted') return null;
  const account = toAccount(row, await accountRoles(getPool(), row.id));
  return account;
}

async function updateProfile(email, patch, actor) {
  const current = await getProfile(email);
  if (!current) return null;
  if (patch.password) {
    const row = await getPool().query(
      'SELECT password_hash FROM admin_accounts WHERE id = $1',
      [current.id]
    );
    const hash = row.rows[0] && row.rows[0].password_hash;
    if (!hash) {
      throw new AppError('VALIDATION_ERROR', 'Tài khoản chưa có mật khẩu.', 400);
    }
    const ok = await bcrypt.compare(String(patch.currentPassword || ''), hash);
    if (!ok) {
      throw new AppError('VALIDATION_ERROR', 'Mật khẩu hiện tại không đúng.', 400);
    }
    const passwordHash = await hashPassword(patch.password);
    await getPool().query(
      'UPDATE admin_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, current.id]
    );
    await insertAdminAudit({
      adminId: actor.adminId,
      adminEmail: actor.adminEmail,
      action: 'admin.profile.change_password',
      targetType: 'admin_accounts',
      targetId: String(current.id),
      ip: actor.ip
    });
  }
  if (patch.name !== undefined) {
    await getPool().query(
      'UPDATE admin_accounts SET name = $1, updated_at = NOW() WHERE id = $2',
      [patch.name, current.id]
    );
    await insertAdminAudit({
      adminId: actor.adminId,
      adminEmail: actor.adminEmail,
      action: 'admin.profile.update',
      targetType: 'admin_accounts',
      targetId: String(current.id),
      ip: actor.ip
    });
  }
  return getProfile(email);
}

module.exports = {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  setAccountStatus,
  resetPassword,
  assignAccountRoles,
  deleteAccount,
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
  catalog,
  getMatrix,
  setRolePermissions,
  getProfile,
  updateProfile
};
