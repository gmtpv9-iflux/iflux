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

async function exchangeZaloCode(code, config) {
  const redirect = config.ZALO_OAUTH_REDIRECT_URI || '';
  const body = new URLSearchParams({
    app_id: config.ZALO_APP_ID,
    app_secret: config.ZALO_APP_SECRET,
    code: String(code)
  });
  if (redirect) body.set('redirect_uri', redirect);
  const res = await fetch('https://oauth.zaloapp.com/v4/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const err = new Error(data.error_description || data.message || 'Zalo code exchange failed');
    err.statusCode = 401;
    throw err;
  }
  return data.access_token;
}

async function verify(config, payload) {
  let accessToken = payload && payload.access_token;
  if (payload && payload.oauth_code) {
    accessToken = await exchangeZaloCode(payload.oauth_code, config);
  }
  if (!accessToken) {
    const err = new Error('Zalo access_token or oauth_code required');
    err.statusCode = 422;
    throw err;
  }
  if (!config.ZALO_APP_ID || !config.ZALO_APP_SECRET) {
    const err = new Error('Zalo Login chưa được cấu hình trên server');
    err.statusCode = 503;
    throw err;
  }
  const profile = await fetchJson(
    'https://graph.zalo.me/v2.0/me?fields=id,name,picture&access_token=' +
      encodeURIComponent(accessToken)
  );
  if (!profile.id) {
    const err = new Error('Zalo profile invalid');
    err.statusCode = 401;
    throw err;
  }
  return createVerifiedIdentity({
    provider: 'zalo',
    providerUserId: String(profile.id),
    email: null,
    emailVerified: false,
    displayName: profile.name || 'Thành viên Zalo',
    avatarUrl: profile.picture && profile.picture.data ? profile.picture.data.url : null
  });
}

module.exports = {
  id: 'zalo',
  verify
};
