'use strict';

const { AppError } = require('../shared/exceptions/app-error');

function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      }));
      return next(AppError.badRequest('VALIDATION_ERROR', 'Validation failed', details));
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { validate };
