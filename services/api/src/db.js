'use strict';

const { Pool } = require('pg');

let pool;

function initPool(config) {
  pool = new Pool({ connectionString: config.DATABASE_URL });
  return pool;
}

function getPool() {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
}

function closePool() {
  if (!pool) return Promise.resolve();
  const p = pool;
  pool = null;
  return p.end();
}

/**
 * Ghi nhật ký Admin. Caller phải truyền adminId từ authenticated context
 * (row.id sau đăng nhập, hoặc req.admin.id sau loadAccess). Không đọc req.
 */
function insertAdminAudit(fields) {
  const adminId = fields && fields.adminId;
  if (!adminId) {
    return Promise.reject(new Error('insertAdminAudit: adminId required from auth context'));
  }
  const db = fields.client || getPool();
  return db.query(
    'INSERT INTO admin_audit_log (admin_id, admin_email, action, target_type, target_id, detail, ip) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      adminId,
      fields.adminEmail || null,
      fields.action,
      fields.targetType || null,
      fields.targetId || null,
      fields.detail || {},
      fields.ip || null
    ]
  );
}

module.exports = { initPool, getPool, closePool, insertAdminAudit };
