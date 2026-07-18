'use strict';

function meta(extra = {}) {
  return {
    ts: new Date().toISOString(),
    ...extra
  };
}

function success(res, data, statusCode = 200, extraMeta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: meta(extraMeta),
    error: null
  });
}

function fail(res, error, statusCode = 400, extraMeta = {}) {
  const payload = {
    success: false,
    data: null,
    meta: meta(extraMeta),
    error: {
      code: error.code || 'ERROR',
      message: error.message || 'Request failed',
      ...(error.details ? { details: error.details } : {})
    }
  };
  return res.status(statusCode).json(payload);
}

function fromAppError(res, err) {
  return fail(
    res,
    { code: err.code, message: err.message, details: err.details },
    err.statusCode || 500
  );
}

module.exports = { success, fail, fromAppError, meta };
