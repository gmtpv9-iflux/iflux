/* ADM-DATA-003 — Pipeline Monitor (Wave A) */
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
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
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

  function statusChip(status) {
    if (status === 'success') return '<span class="ix-chip ix-chip-success">Ổn định</span>';
    if (status === 'degraded') return '<span class="ix-chip ix-chip-warning">Chậm</span>';
    if (status === 'failed') return '<span class="ix-chip ix-chip-danger">Lỗi</span>';
    return '<span class="ix-chip">' + esc(status) + '</span>';
  }

  function render() {
    var tb = document.getElementById('adm-pipe-tbody');
    var count = document.getElementById('adm-pipe-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption">Chưa có giai đoạn pipeline</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (r) {
      return '<tr>' +
        '<td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) + '</div></td>' +
        '<td>' + esc(r.throughput) + '</td>' +
        '<td>' + esc(r.lag) + '</td>' +
        '<td>' + statusChip(r.status) + '</td>' +
        '<td class="ix-caption">' + esc(r.updated_at ? new Date(r.updated_at).toLocaleString('vi-VN') : '—') + '</td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    return request('/admin/data-ops/pipeline').then(function (data) {
      items = data.stages || [];
      render();
    }).catch(function (e) {
      toast(e.message || 'Không tải được pipeline', 'danger');
    });
  }

  function init() {
    load();
  }

  global.AdmDataPipeline = { init: init, reload: load };
})(window);
