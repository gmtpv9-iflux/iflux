'use strict';

const crypto = require('crypto');

function requestId() {
  return function requestIdMiddleware(req, res, next) {
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}

module.exports = { requestId };
