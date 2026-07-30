/* ADM-DATA-004 — Data Quality (Wave A) */
(function (global) {
  'use strict';

  var items = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'info');
  }

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

  function request(path) {
    return fetch(apiBase() + path, { headers: authHeaders() }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = data.error;
          throw new Error((err && err.message) || data.message || ('HTTP ' + res.status));
        }
        return (data && data.data) ? data.data : data;
      });
    });
  }

  function render() {
    var tb = document.getElementById('adm-qual-tbody');
    var count = document.getElementById('adm-qual-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="3" class="ix-caption">Chưa có chỉ số chất lượng</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (r) {
      return '<tr>' +
        '<td>' + esc(r.section) + '</td>' +
        '<td>' + esc(r.label) + '</td>' +
        '<td><strong>' + esc(r.value_text) + '</strong></td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    return request('/admin/data-ops/quality').then(function (data) {
      items = data.items || [];
      render();
    }).catch(function (e) {
      toast(e.message || 'Không tải được chất lượng dữ liệu', 'danger');
    });
  }

  global.AdmDataQuality = { init: load };
})(window);
