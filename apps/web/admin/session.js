/**
 * Staging 2 — Admin Session
 * SoT client cho token/session. Không cookie. Không dùng session User Web.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = global.IfluxAdminPlatform.KEYS.session;

  function decodeJwtExp(token) {
    try {
      var parts = String(token || '').split('.');
      if (parts.length < 2) return null;
      var json = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var pad = json.length % 4;
      if (pad) json += '===='.slice(0, 4 - pad);
      var payload = JSON.parse(global.atob(json));
      return payload && payload.exp ? payload.exp * 1000 : null;
    } catch (e) {
      return null;
    }
  }

  function readRaw() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY)
        || global.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try {
      global.localStorage.removeItem(STORAGE_KEY);
      global.sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore quota / private mode */ }
  }

  function writeSession(data, remember) {
    var token = data && data.token;
    if (!token) return null;
    var exp = data.exp || decodeJwtExp(token);
    var session = {
      token: token,
      admin: data.admin || null,
      remember: !!remember,
      exp: exp || null
    };
    clearSession();
    var store = remember ? global.localStorage : global.sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function getSession() {
    var s = readRaw();
    if (!s || !s.token) return null;
    var exp = s.exp || decodeJwtExp(s.token);
    if (exp && exp < Date.now()) {
      clearSession();
      return null;
    }
    if (exp && !s.exp) s.exp = exp;
    return s;
  }

  function getToken() {
    var s = getSession();
    return s && s.token ? s.token : null;
  }

  function isAuthenticated() {
    return !!getToken();
  }

  global.IfluxAdminSession = {
    STORAGE_KEY: STORAGE_KEY,
    writeSession: writeSession,
    getSession: getSession,
    getToken: getToken,
    clearSession: clearSession,
    isAuthenticated: isAuthenticated,
    decodeJwtExp: decodeJwtExp
  };
})(typeof window !== 'undefined' ? window : globalThis);
