/* ADM-DATA-006 — Reconciliation (Wave A) */
(function (global) {
  'use strict';

  var items = [];

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

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

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
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
    if (status === 'success') return '<span class="ix-chip ix-chip-success">Thành công</span>';
    if (status === 'running') return '<span class="ix-chip ix-chip-warning">Đang chạy</span>';
    return '<span class="ix-chip">Chờ</span>';
  }

  function render() {
    var tb = document.getElementById('adm-recon-tbody');
    var count = document.getElementById('adm-recon-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption">Chưa có lần đối soát</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (r) {
      var actions = '';
      if (canPerm('data.reconciliation.execute')) {
        actions = '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-recon-run="' + esc(r.id) + '"><i class="ti ti-player-play"></i> Chạy</button>';
      }
      return '<tr>' +
        '<td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) + '</div></td>' +
        '<td>' + statusChip(r.status) + '</td>' +
        '<td>' + (r.diff_count != null ? esc(r.diff_count) : '—') + '</td>' +
        '<td class="ix-caption">' + esc(r.last_run_at ? new Date(r.last_run_at).toLocaleString('vi-VN') : '—') + '</td>' +
        '<td>' + actions + '</td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    return request('/admin/data-ops/reconciliation').then(function (data) {
      items = data.runs || [];
      render();
    }).catch(function (e) {
      toast(e.message || 'Không tải được đối soát', 'danger');
    });
  }

  function init() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-recon-run]');
      if (!btn) return;
      var id = btn.getAttribute('data-recon-run');
      request('/admin/data-ops/reconciliation/' + encodeURIComponent(id) + '/execute', { method: 'POST', body: {} })
        .then(function () {
          toast('Đã chạy đối soát', 'success');
          return load();
        })
        .catch(function (err) { toast(err.message || 'Chạy thất bại', 'danger'); });
    });
    load();
  }

  global.AdmDataRecon = { init: init };
})(window);
