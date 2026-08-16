'use strict';

/**
 * Staging 2 — Kiểm quyền quản trị
 *
 * Enforce tại server. Gating trên UI chỉ để bớt thao tác thừa, không phải bảo mật.
 *
 * Nguồn quyền: admin_accounts → admin_account_roles → admin_roles →
 * admin_role_permissions → admin_permissions.key
 *
 * Vai trò is_super (và tài khoản is_super) bỏ qua kiểm quyền theo Owner SoT:
 * "Admin = full quyền, chỉ Owner, không trên Matrix".
 *
 * Quyền đọc từ DB mỗi lần gọi chứ không nhét vào JWT: khóa tài khoản hoặc gỡ
 * quyền có hiệu lực ngay, không phải chờ token hết hạn.
 */

const { AppError } = require('../errors');
const { getPool } = require('../db');
const { authenticateAdmin } = require('../admin-auth/token');

async function loadAccess(email) {
  const res = await getPool().query(
    `SELECT a.id,
            a.status,
            a.is_super OR COALESCE(bool_or(r.is_super), false) AS is_super,
            COALESCE(array_agg(p.key) FILTER (WHERE p.key IS NOT NULL), '{}') AS keys
       FROM admin_accounts a
       LEFT JOIN admin_account_roles ar ON ar.admin_id = a.id
       LEFT JOIN admin_roles r ON r.id = ar.role_id
       LEFT JOIN admin_role_permissions rp ON rp.role_id = r.id
       LEFT JOIN admin_permissions p ON p.id = rp.permission_id
      WHERE lower(a.email) = $1
      GROUP BY a.id`,
    [String(email || '').trim().toLowerCase()]
  );
  return res.rows[0] || null;
}

function requirePermission(config, key) {
  const authenticate = authenticateAdmin(config);

  return function permissionGuard(req, res, next) {
    authenticate(req, res, function (err) {
      if (err) return next(err);

      loadAccess(req.admin.email)
        .then(function (access) {
          if (!access || access.status !== 'active') {
            return next(new AppError('FORBIDDEN', 'Tài khoản quản trị không còn hiệu lực.', 403));
          }
          if (access.is_super || access.keys.indexOf(key) >= 0) {
            req.admin.id = access.id;
            req.admin.isSuper = access.is_super;
            return next();
          }
          return next(new AppError('FORBIDDEN', 'Không có quyền: ' + key, 403));
        })
        .catch(next);
    });
  };
}

module.exports = { requirePermission };
