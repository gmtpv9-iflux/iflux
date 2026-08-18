'use strict';

class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(code, message, details) {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(code = 'FORBIDDEN', message = 'Forbidden') {
    return new AppError(code, message, 403);
  }

  static notFound(message = 'Not found') {
    return new AppError('NOT_FOUND', message, 404);
  }

  static conflict(code, message, details) {
    return new AppError(code, message, 409, details);
  }

  static tooManyRequests(retryAfter = 30) {
    return new AppError('RATE_LIMITED', 'Too many requests', 429, { retry_after: retryAfter });
  }

  static internal(message = 'Internal error') {
    return new AppError('INTERNAL_ERROR', message, 500);
  }
}

module.exports = { AppError };
