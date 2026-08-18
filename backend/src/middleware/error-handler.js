'use strict';

const { AppError } = require('../shared/exceptions/app-error');
const { fromAppError, fail } = require('../shared/response/api-response');
const { getLogger } = require('../core/logger/logger');

function notFoundHandler(req, res) {
  return fail(res, { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }, 404);
}

function errorHandler(err, req, res, next) {
  const logger = getLogger();
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    } else {
      logger.warn({ err: { code: err.code, message: err.message }, requestId: req.requestId }, 'Request error');
    }
    return fromAppError(res, err);
  }

  logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  return fromAppError(res, AppError.internal(err.message || 'Internal error'));
}

module.exports = { notFoundHandler, errorHandler };
