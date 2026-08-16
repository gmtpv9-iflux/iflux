/**
 * Staging 2 — Admin Authentication API (M03)
 *
 * M00 tách khỏi transport; M03 sở hữu và phát triển tiếp.
 * Gọi qua IfluxAdminApi — không tạo transport thứ hai.
 */
(function (global) {
  'use strict';

  function login(email, password, remember) {
    return global.IfluxAdminApi.request('POST', '/admin/auth/login', {
      email: email,
      password: password,
      remember: !!remember
    }).then(function (out) {
      if (out.ok && out.data && out.data.token && global.IfluxAdminSession) {
        global.IfluxAdminSession.writeSession(out.data, !!remember);
      }
      return out;
    });
  }

  function me() {
    return global.IfluxAdminApi.request('GET', '/admin/auth/me');
  }

  function config() {
    return global.IfluxAdminApi.request('GET', '/admin/auth/config');
  }

  global.IfluxAdminAuthApi = {
    login: login,
    me: me,
    config: config
  };
})(typeof window !== 'undefined' ? window : globalThis);
