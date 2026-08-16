'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('../errors');

function signAdminToken(config, admin, remember) {
  const payload = {
    sub: 'admin:' + admin.email,
    email: admin.email,
    name: admin.name || admin.email,
    picture: admin.avatarUrl || null,
    roles: ['admin']
  };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: remember ? config.JWT_REMEMBER_EXPIRES_IN : config.JWT_EXPIRES_IN
  });
}

function adminFromPayload(payload) {
  if (!payload || !payload.email) return null;
  if (!payload.roles || payload.roles.indexOf('admin') < 0) return null;
  return {
    email: payload.email,
    name: payload.name || payload.email,
    avatarUrl: payload.picture || null
  };
}

function authenticateAdmin(config) {
  return function (req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return next(new AppError('UNAUTHORIZED', 'Unauthorized', 401));
    }
    try {
      const payload = jwt.verify(token, config.JWT_SECRET);
      const admin = adminFromPayload(payload);
      if (!admin) {
        return next(new AppError('UNAUTHORIZED', 'Invalid token', 401));
      }
      req.admin = admin;
      req.auth = payload;
      next();
    } catch (e) {
      return next(new AppError('UNAUTHORIZED', 'Invalid token', 401));
    }
  };
}

module.exports = { signAdminToken, adminFromPayload, authenticateAdmin };
