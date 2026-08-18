/* Sandbox — lưu hash mật khẩu; Admin chỉ override, không đọc plaintext */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_credentials_v1';

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function normEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normPhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.charAt(0) === '0') digits = '84' + digits.slice(1);
    else if (digits.length === 9 && /^[35789]/.test(digits)) digits = '84' + digits;
    return digits;
  }

  function credentialKey(identifier, type) {
    if (type === 'phone') {
      var p = normPhone(identifier);
      return p ? 'phone:' + p : '';
    }
    return normEmail(identifier);
  }

  function fakeHash(password) {
    return 'hash_' + btoa(unescape(encodeURIComponent(String(password)))).slice(0, 24);
  }

  global.IfluxCredentialsStore = {
    hasPassword: function (email) {
      var key = normEmail(email);
      return !!(key && readAll()[key]);
    },

    setPassword: function (email, password, opts) {
      opts = opts || {};
      var key = credentialKey(email, opts.type === 'phone' ? 'phone' : 'email');
      if (!key || !password) return false;
      var data = readAll();
      data[key] = {
        hash: fakeHash(password),
        updated_at: new Date().toISOString(),
        updated_by: 'user'
      };
      writeAll(data);
      return true;
    },

    setPasswords: function (data) {
      data = data || {};
      var password = String(data.password || '');
      if (!password) return false;
      var saved = false;
      if (data.email) saved = this.setPassword(data.email, password) || saved;
      if (data.phone) saved = this.setPassword(data.phone, password, { type: 'phone' }) || saved;
      return saved;
    },

    overridePassword: function (email, password, meta) {
      var key = normEmail(email);
      if (!key || !password) return { ok: false, error: 'Thiếu email hoặc mật khẩu mới' };
      if (password.length < 8) return { ok: false, error: 'Mật khẩu tối thiểu 8 ký tự' };
      var data = readAll();
      data[key] = {
        hash: fakeHash(password),
        updated_at: new Date().toISOString(),
        updated_by: (meta && meta.by) || 'admin',
        reason: (meta && meta.reason) || ''
      };
      writeAll(data);
      return { ok: true };
    },

    verifyPassword: function (email, password) {
      return this.verifyLogin(email, password, 'email');
    },

    verifyPasswordByPhone: function (phone, password) {
      return this.verifyLogin(phone, password, 'phone');
    },

    verifyLogin: function (identifier, password, type) {
      var key = credentialKey(identifier, type === 'phone' ? 'phone' : 'email');
      if (!key || password == null || String(password) === '') return false;
      var row = readAll()[key];
      if (!row) return false;
      return row.hash === fakeHash(password);
    },

    hasPasswordForPhone: function (phone) {
      var key = credentialKey(phone, 'phone');
      return !!(key && readAll()[key]);
    }
  };
})(window);
