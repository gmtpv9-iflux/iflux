'use strict';

class AppError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status >= 500 ? 'Internal error' : err.message;
  res.status(status).json({ error: message, code: code });
}

module.exports = { AppError, errorHandler };
