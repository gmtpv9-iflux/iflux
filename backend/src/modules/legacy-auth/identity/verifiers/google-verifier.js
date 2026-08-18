'use strict';

const { createVerifiedIdentity } = require('../verified-identity');

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || data.message || 'Social token verification failed');
    err.statusCode = 401;
    throw err;
  }
  return data;
}

/**
 * Google Id Token verifier — HTTP to Google only. No DB.
 * @returns {Promise<import('../verified-identity').VerifiedIdentity>}
 */
async function verify(config, payload) {
  const idToken = payload && payload.id_token;
  const clientId = config && config.GOOGLE_CLIENT_ID;
  if (!idToken) {
    const err = new Error('Google id_token required');
    err.statusCode = 422;
    throw err;
  }
  if (!clientId) {
    const err = new Error('Google login is not configured on server');
    err.statusCode = 503;
    throw err;
  }
  const tokenPayload = await fetchJson(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
  );
  if (tokenPayload.aud !== clientId) {
    const err = new Error('Google token audience mismatch');
    err.statusCode = 401;
    throw err;
  }
  if (tokenPayload.exp && Number(tokenPayload.exp) * 1000 < Date.now()) {
    const err = new Error('Google token expired');
    err.statusCode = 401;
    throw err;
  }
  return createVerifiedIdentity({
    provider: 'google',
    providerUserId: String(tokenPayload.sub),
    email: tokenPayload.email ? String(tokenPayload.email).toLowerCase() : null,
    emailVerified: tokenPayload.email_verified === 'true' || tokenPayload.email_verified === true,
    displayName: tokenPayload.name || null,
    avatarUrl: tokenPayload.picture || null
  });
}

module.exports = {
  id: 'google',
  verify
};
