'use strict';

/**
 * DNSE client — luồng username/password (auth-service → JWT).
 * JWT dùng cho datafeed realtime KRX (MQTT over WSS) + REST market data.
 */

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const pad = part + '='.repeat((4 - (part.length % 4)) % 4);
    const json = Buffer.from(pad, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function createDnseClient(config) {
  const username = config.DNSE_USERNAME || '';
  const password = config.DNSE_PASSWORD || '';
  const authUrl = config.DNSE_AUTH_URL || 'https://api.dnse.com.vn/auth-service/login';

  let cache = { token: null, investorId: null, fullName: null, exp: 0 };

  function isConfigured() {
    return Boolean(username && password);
  }

  async function login(force) {
    if (!isConfigured()) {
      return { ok: false, error: 'DNSE_USERNAME / DNSE_PASSWORD chưa cấu hình' };
    }
    const now = Math.floor(Date.now() / 1000);
    if (!force && cache.token && cache.exp - 60 > now) {
      return { ok: true, cached: true, ...cache };
    }
    try {
      const res = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (!res.ok || !body || !body.token) {
        return { ok: false, status: res.status, error: (body && body.message) || 'login_failed', body };
      }
      const payload = decodeJwtPayload(body.token) || {};
      cache = {
        token: body.token,
        investorId: payload.investorId || null,
        fullName: payload.fullName || null,
        exp: payload.exp || now + 3600
      };
      return { ok: true, status: res.status, ...cache };
    } catch (err) {
      return { ok: false, status: 0, error: err.message };
    }
  }

  function datafeed() {
    return {
      host: config.DNSE_DATAFEED_HOST,
      port: config.DNSE_DATAFEED_PORT,
      path: config.DNSE_DATAFEED_PATH,
      wssUrl: `wss://${config.DNSE_DATAFEED_HOST}:${config.DNSE_DATAFEED_PORT}${config.DNSE_DATAFEED_PATH}`,
      clientIdPrefix: 'dnse-price-json-mqtt-ws'
    };
  }

  return { isConfigured, login, datafeed };
}

module.exports = { createDnseClient, decodeJwtPayload };
