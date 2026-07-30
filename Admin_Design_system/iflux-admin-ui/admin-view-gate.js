/* Shared — gọi API view để enforce RBAC (Wave A+) */
(function (global) {
  'use strict';

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function adminToken() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { Accept: 'application/json' };
    var token = adminToken();
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    return h;
  }

  /**
   * GET path (relative /admin/...) — 403 thì toast + không chặn render tĩnh.
   * @returns {Promise<object|null>}
   */
  function fetchView(path) {
    return fetch(apiBase() + path, { headers: authHeaders() }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 403) {
          if (typeof global.ixToast === 'function') {
            global.ixToast('Bạn không có quyền xem trang này', 'warning');
          }
          return null;
        }
        if (!res.ok) return null;
        return (data && data.data) ? data.data : data;
      });
    }).catch(function () { return null; });
  }

  function bootFromAttr() {
    var el = document.body;
    var path = el && el.getAttribute('data-ix-view-api');
    if (!path) return;
    fetchView(path);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootFromAttr);
  } else {
    bootFromAttr();
  }

  global.IfluxAdminViewGate = { fetchView: fetchView };
})(window);
