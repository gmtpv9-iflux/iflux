'use strict';

const rbac = require('./admin-rbac.service');

/**
 * Middleware nạp ngữ cảnh phân quyền vào req.admin sau khi JWT đã xác thực.
 * Yêu cầu chạy SAU authenticateAdmin (req.admin.email đã có).
 * - Nạp permissions từ DB (cache TTL).
 * - Nếu tài khoản bị khóa → 403.
 * - Nếu email nằm trong allowlist gốc mà chưa có account → coi như super.
 */
function createRbacContext(config) {
  const allow = String((config && config.ADMIN_ALLOWED_EMAILS) || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  return async function attachRbacContext(req, res, next) {
    try {
      const email = req.admin && req.admin.email ? String(req.admin.email).toLowerCase() : '';
      let ctx = email ? await rbac.getContextCached(email) : null;

      const isOwnerAllow = !!email && allow.includes(email);

      if (ctx) {
        if (ctx.status === 'locked') {
          return res.status(403).json({ error: { code: 'ACCOUNT_LOCKED', message: 'Tài khoản quản trị đã bị khóa.' } });
        }
        req.admin.id = ctx.id;
        req.admin.name = ctx.name;
        /* Owner allowlist luôn Admin toàn quyền — không phụ thuộc cache/role lệch tạm thời. */
        req.admin.isSuper = !!ctx.isSuper || isOwnerAllow;
        req.admin.roles = ctx.roles;
        req.admin._permSet = ctx.permissions;
        if (req.admin.isSuper && (!req.admin._permSet || !req.admin._permSet.size)) {
          req.admin._permSet = ctx.permissions || new Set();
        }
      } else if (isOwnerAllow) {
        req.admin.isSuper = true;
        req.admin._permSet = new Set();
      } else {
        req.admin.isSuper = false;
        req.admin._permSet = new Set();
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Chặn nếu thiếu quyền. Truyền 1 hoặc nhiều key (yêu cầu CÓ TẤT CẢ). */
function requirePermission() {
  const keys = Array.prototype.slice.call(arguments).filter(Boolean);
  return function permGuard(req, res, next) {
    const admin = req.admin || {};
    if (admin.isSuper) return next();
    const set = admin._permSet || new Set();
    const ok = keys.every((k) => set.has(k));
    if (!ok) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.', required: keys } });
    }
    next();
  };
}

/** Chặn nếu thiếu hết — cần ÍT NHẤT 1 key trong danh sách. */
function requireAnyPermission() {
  const keys = Array.prototype.slice.call(arguments).filter(Boolean);
  return function permAnyGuard(req, res, next) {
    const admin = req.admin || {};
    if (admin.isSuper) return next();
    const set = admin._permSet || new Set();
    const ok = keys.some((k) => set.has(k));
    if (!ok) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.', requiredAny: keys } });
    }
    next();
  };
}

module.exports = { createRbacContext, requirePermission, requireAnyPermission };
