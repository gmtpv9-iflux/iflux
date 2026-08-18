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

async function verify(config, payload) {
  const accessToken = payload && payload.access_token;
  if (!accessToken) {
    const err = new Error('Facebook access_token required');
    err.statusCode = 422;
    throw err;
  }
  if (!config.FACEBOOK_APP_ID || !config.FACEBOOK_APP_SECRET) {
    const err = new Error('Facebook Login chưa được cấu hình trên server');
    err.statusCode = 503;
    throw err;
  }
  const appToken = config.FACEBOOK_APP_ID + '|' + config.FACEBOOK_APP_SECRET;
  const debug = await fetchJson(
    'https://graph.facebook.com/debug_token?input_token=' +
      encodeURIComponent(accessToken) +
      '&access_token=' +
      encodeURIComponent(appToken)
  );
  const info = debug.data || {};
  if (!info.is_valid || String(info.app_id) !== String(config.FACEBOOK_APP_ID)) {
    const err = new Error('Facebook token invalid');
    err.statusCode = 401;
    throw err;
  }
  const me = await fetchJson(
    'https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' +
      encodeURIComponent(accessToken)
  );
  return createVerifiedIdentity({
    provider: 'facebook',
    providerUserId: String(me.id),
    email: me.email ? String(me.email).toLowerCase() : null,
    emailVerified: !!me.email,
    displayName: me.name || null,
    avatarUrl: me.picture && me.picture.data ? me.picture.data.url : null
  });
}

module.exports = {
  id: 'facebook',
  verify
};
