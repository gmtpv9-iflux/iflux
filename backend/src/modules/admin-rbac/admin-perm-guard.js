'use strict';

/**
 * Guard Admin: JWT (hoặc X-Admin-Key hệ thống) + nạp RBAC + requirePermission.
 * SoT PASS: mọi hành động quản trị enforce tại Server; UI gating không phải bảo mật.
 *
 * X-Admin-Key = automation nội bộ (tương đương super) — không dùng cho Admin Web UI.
 */

const { AppError } = require('../../shared/exceptions/app-error');
const { createRbacContext, requirePermission, requireAnyPermission } = require('./admin-rbac.middleware');

function requireAdminKey(config) {
  return function adminKeyGuard(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== (config && config.ADMIN_API_KEY)) {
      return next(AppError.forbidden('ADMIN_FORBIDDEN', 'Admin key required'));
    }
    /* System key → siêu quyền (không cần permission DB) */
    if (!req.admin) req.admin = { email: 'system@admin-key', isSuper: true };
    else req.admin.isSuper = true;
    req.admin._permSet = req.admin._permSet || new Set();
    next();
  };
}

/**
 * JWT admin + RBAC context + đủ mọi permission keys.
 * Fallback X-Admin-Key (system) khi không có Bearer.
 */
function requireAdminPermission(deps, keys) {
  deps = deps || {};
  const config = deps.config || {};
  const auth = deps.auth || {};
  const keyList = Array.isArray(keys) ? keys : Array.prototype.slice.call(arguments, 1);
  const keyGuard = requireAdminKey(config);
  const jwtGuard = auth.authenticateAdmin;
  const ctx = createRbacContext(config);
  const perm = requirePermission.apply(null, keyList);

  return function adminPermGuard(req, res, next) {
    const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');
    if (jwtGuard && hasBearer) {
      return jwtGuard(req, res, function (err) {
        if (err) return next(err);
        if (!req.admin) return keyGuard(req, res, next);
        return ctx(req, res, function (err2) {
          if (err2) return next(err2);
          return perm(req, res, next);
        });
      });
    }
    return keyGuard(req, res, next);
  };
}

/** JWT/Key + RBAC + ÍT NHẤT 1 permission trong danh sách. */
function requireAdminAnyPermission(deps, keys) {
  deps = deps || {};
  const config = deps.config || {};
  const auth = deps.auth || {};
  const keyList = Array.isArray(keys) ? keys : Array.prototype.slice.call(arguments, 1);
  const keyGuard = requireAdminKey(config);
  const jwtGuard = auth.authenticateAdmin;
  const ctx = createRbacContext(config);
  const perm = requireAnyPermission.apply(null, keyList);

  return function adminAnyPermGuard(req, res, next) {
    const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');
    if (jwtGuard && hasBearer) {
      return jwtGuard(req, res, function (err) {
        if (err) return next(err);
        if (!req.admin) return keyGuard(req, res, next);
        return ctx(req, res, function (err2) {
          if (err2) return next(err2);
          return perm(req, res, next);
        });
      });
    }
    return keyGuard(req, res, next);
  };
}

/** JWT-only (không X-Admin-Key) + RBAC + permission. */
function requireJwtPermission(deps, keys) {
  deps = deps || {};
  const config = deps.config || {};
  const auth = deps.auth || {};
  const keyList = Array.isArray(keys) ? keys : Array.prototype.slice.call(arguments, 1);
  const jwtGuard = auth.authenticateAdmin;
  const ctx = createRbacContext(config);
  const perm = requirePermission.apply(null, keyList);

  return function jwtPermGuard(req, res, next) {
    if (!jwtGuard) {
      return res.status(500).json({ error: { message: 'Admin auth chưa cấu hình.' } });
    }
    return jwtGuard(req, res, function (err) {
      if (err) return next(err);
      if (!req.admin) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập quản trị.' } });
      }
      return ctx(req, res, function (err2) {
        if (err2) return next(err2);
        return perm(req, res, next);
      });
    });
  };
}

/**
 * JWT/Key + RBAC + đúng 1 permission theo status body (map status → action key).
 * Ví dụ: map { approved: 'status_approved', rejected: 'status_rejected' }
 * → require `prefix.status_approved` …
 */
function requireAdminStatusPermission(deps, prefix, statusToAction) {
  deps = deps || {};
  const config = deps.config || {};
  const auth = deps.auth || {};
  const keyGuard = requireAdminKey(config);
  const jwtGuard = auth.authenticateAdmin;
  const ctx = createRbacContext(config);
  const map = statusToAction || {};

  return function statusPermGuard(req, res, next) {
    const runPerm = function () {
      const status = String((req.body && req.body.status) || '').trim();
      const action = map[status];
      if (!action) {
        return res.status(400).json({
          error: { code: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ hoặc chưa map quyền.', status: status }
        });
      }
      return requirePermission(prefix + '.' + action)(req, res, next);
    };

    const afterAuth = function () {
      return ctx(req, res, function (err2) {
        if (err2) return next(err2);
        return runPerm();
      });
    };

    const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');
    if (jwtGuard && hasBearer) {
      return jwtGuard(req, res, function (err) {
        if (err) return next(err);
        if (!req.admin) {
          return keyGuard(req, res, function (errK) {
            if (errK) return next(errK);
            return runPerm();
          });
        }
        return afterAuth();
      });
    }
    return keyGuard(req, res, function (errK) {
      if (errK) return next(errK);
      return runPerm();
    });
  };
}

module.exports = {
  requireAdminKey,
  requireAdminPermission,
  requireAdminAnyPermission,
  requireJwtPermission,
  requireAdminStatusPermission,
  requirePermission,
  requireAnyPermission,
  createRbacContext
};
