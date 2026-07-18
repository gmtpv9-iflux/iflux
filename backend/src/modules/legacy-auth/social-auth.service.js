'use strict';

const { getLogger } = require('../../core/logger/logger');

const SUPPORTED_PROVIDERS = ['google', 'apple', 'facebook', 'zalo'];

function assertProvider(provider) {
  const p = String(provider || '').toLowerCase();
  if (!SUPPORTED_PROVIDERS.includes(p)) {
    const err = new Error('Unsupported social provider');
    err.statusCode = 422;
    throw err;
  }
  return p;
}

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

/** @returns {{ providerId, email?, emailVerified?, displayName?, avatarUrl? }} */
async function verifyGoogleIdToken(idToken, clientId) {
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
  const payload = await fetchJson(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
  );
  if (payload.aud !== clientId) {
    const err = new Error('Google token audience mismatch');
    err.statusCode = 401;
    throw err;
  }
  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
    const err = new Error('Google token expired');
    err.statusCode = 401;
    throw err;
  }
  return {
    providerId: String(payload.sub),
    email: payload.email ? String(payload.email).toLowerCase() : null,
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
    displayName: payload.name || null,
    avatarUrl: payload.picture || null
  };
}

/** Apple — cần APPLE_CLIENT_ID (Services ID). Stub đến khi cấu hình key. */
async function verifyAppleIdToken(idToken, config) {
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
  // TODO: verify JWT với Apple JWKS (team id, key id, private key)
  const err = new Error('Apple Sign In đang triển khai — vui lòng dùng Google hoặc email');
  err.statusCode = 501;
  throw err;
}

/** Facebook — access_token từ FB SDK */
async function verifyFacebookAccessToken(accessToken, config) {
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
  return {
    providerId: String(me.id),
    email: me.email ? String(me.email).toLowerCase() : null,
    emailVerified: !!me.email,
    displayName: me.name || null,
    avatarUrl: me.picture && me.picture.data ? me.picture.data.url : null
  };
}

/** Zalo — oauth_code (redirect) hoặc access_token */
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

async function verifyZaloAccessToken(payload, config) {
  let accessToken = payload.access_token;
  if (payload.oauth_code) {
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
  return {
    providerId: String(profile.id),
    email: null,
    emailVerified: false,
    displayName: profile.name || 'Thành viên Zalo',
    avatarUrl: profile.picture && profile.picture.data ? profile.picture.data.url : null
  };
}

async function verifySocialToken(config, provider, payload) {
  const p = assertProvider(provider);
  switch (p) {
    case 'google':
      return verifyGoogleIdToken(payload.id_token, config.GOOGLE_CLIENT_ID);
    case 'apple':
      return verifyAppleIdToken(payload.id_token, config);
    case 'facebook':
      return verifyFacebookAccessToken(payload.access_token, config);
    case 'zalo':
      return verifyZaloAccessToken(payload, config);
    default:
      return assertProvider(provider);
  }
}

function getPublicSocialConfig(config) {
  return {
    google: {
      enabled: !!config.GOOGLE_CLIENT_ID,
      clientId: config.GOOGLE_CLIENT_ID || null
    },
    apple: {
      enabled: !!config.APPLE_CLIENT_ID,
      clientId: config.APPLE_CLIENT_ID || null
    },
    facebook: {
      enabled: !!(config.FACEBOOK_APP_ID && config.FACEBOOK_APP_SECRET),
      appId: config.FACEBOOK_APP_ID || null
    },
    zalo: {
      enabled: !!(config.ZALO_APP_ID && config.ZALO_APP_SECRET),
      appId: config.ZALO_APP_ID || null,
      redirectUri: config.ZALO_OAUTH_REDIRECT_URI || null
    }
  };
}

module.exports = {
  SUPPORTED_PROVIDERS,
  verifySocialToken,
  verifyGoogleIdToken,
  getPublicSocialConfig
};
