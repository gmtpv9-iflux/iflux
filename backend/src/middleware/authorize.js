'use strict';

const { AppError } = require('../shared/exceptions/app-error');

const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  OPS: 'ops',
  SYSTEM: 'system'
});

function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const roles = (req.user && req.user.roles) || [];
    const ok = allowedRoles.some((r) => roles.includes(r));
    if (!ok) {
      return next(AppError.forbidden('FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

function requireTier(minTier) {
  const order = ['free', 'premium', 'elite'];
  return function tierGuard(req, res, next) {
    const tier = (req.user && req.user.tier) || 'free';
    if (order.indexOf(tier) < order.indexOf(minTier)) {
      return next(AppError.forbidden('PREMIUM_REQUIRED', 'Subscription tier insufficient'));
    }
    next();
  };
}

module.exports = { ROLES, requireRole, requireTier };
