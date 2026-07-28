'use strict';

/** Apple verifier — no DB. Stub until JWKS configured. */

async function verify(config, payload) {
  const idToken = payload && payload.id_token;
  if (!idToken) {
    const err = new Error('Apple id_token required');
    err.statusCode = 422;
    throw err;
  }
  if (!config.APPLE_CLIENT_ID) {
    const err = new Error('Apple Sign In chưa được cấu hình trên server');
    err.statusCode = 503;
    throw err;
  }
  const err = new Error('Apple Sign In đang triển khai — vui lòng dùng Google hoặc email');
  err.statusCode = 501;
  throw err;
}

module.exports = {
  id: 'apple',
  verify
};
