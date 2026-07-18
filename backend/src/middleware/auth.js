'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('../shared/exceptions/app-error');

function createAuthMiddleware(config) {
  const secret = config.JWT_SECRET;

  function generateToken(userId, rememberMe) {
    return jwt.sign(
      { sub: userId, tier: 'free' },
      secret,
      { expiresIn: rememberMe ? config.JWT_REMEMBER_EXPIRES_IN : config.JWT_EXPIRES_IN }
    );
  }

  function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return next(AppError.unauthorized());
    }
    try {
      const payload = jwt.verify(token, secret);
      req.user = {
        id: payload.sub,
        tier: payload.tier || 'free',
        roles: payload.roles || ['user']
      };
      req.auth = payload;
      next();
    } catch {
      next(AppError.unauthorized('Invalid token'));
    }
  }

  function optionalAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    try {
      const payload = jwt.verify(token, secret);
      req.user = {
        id: payload.sub,
        tier: payload.tier || 'free',
        roles: payload.roles || ['user']
      };
      req.auth = payload;
    } catch {
      /* ignore invalid token for optional auth */
    }
    next();
  }

  return { generateToken, authenticate, optionalAuth };
}

module.exports = { createAuthMiddleware };
