/* ADM-MDO Wave B — sessions / missing-ticks / corrections */
(function (global) {
  'use strict';

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

  function initSessions() {
    var items = [];
    function render() {
      var tb = document.getElementById('adm-sess-tbody');
      var count = document.getElementById('adm-sess-count');
      if (count) count.textContent = String(items.length);
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = '';
        if (canPerm('market_ops.sessions.edit')) {
          actions = '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-sess-toggle="' + esc(r.id) + '" data-active="' + (r.is_active ? '1' : '0') + '">' +
            (r.is_active ? 'Tắt' : 'Bật') + '</button>';
        }
        return '<tr><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) + '</div></td>' +
          '<td>' + esc(r.open_time) + ' – ' + esc(r.close_time) + '</td>' +
          '<td>' + (r.is_active ? '<span class="ix-chip ix-chip-success">Đang mở</span>' : '<span class="ix-chip">Tắt</span>') + '</td>' +
          '<td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="ix-caption">Chưa có phiên</td></tr>';
    }
    function load() {
      return request('/admin/market-ops/sessions').then(function (d) {
        items = d.sessions || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi tải phiên', 'danger'); });
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-sess-toggle]');
      if (!btn) return;
      var id = btn.getAttribute('data-sess-toggle');
      var next = btn.getAttribute('data-active') !== '1';
      request('/admin/market-ops/sessions/' + encodeURIComponent(id), {
        method: 'PATCH', body: { is_active: next }
      }).then(function () { toast('Đã cập nhật phiên', 'success'); return load(); })
        .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
    });
    load();
  }

  function initMissing() {
    request('/admin/market-ops/missing-ticks').then(function (d) {
      var items = d.items || [];
      var tb = document.getElementById('adm-miss-tbody');
      var count = document.getElementById('adm-miss-count');
      if (count) count.textContent = String(items.length);
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        return '<tr><td><strong>' + esc(r.ticker) + '</strong></td><td>' + esc(r.session_code) +
          '</td><td>' + esc(r.gap_count) + '</td><td class="ix-caption">' + esc(r.note) + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="ix-caption">Không có tick thiếu</td></tr>';
    }).catch(function (e) { toast(e.message || 'Lỗi tải tick thiếu', 'danger'); });
  }

  function initCorrections() {
    var items = [];
    function render() {
      var tb = document.getElementById('adm-corr-tbody');
      var count = document.getElementById('adm-corr-count');
      if (count) count.textContent = String(items.length);
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = '';
        if (canPerm('market_ops.corrections.edit') && r.status === 'pending') {
          actions = '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-corr-ok="' + esc(r.id) + '">Duyệt</button>';
        }
        return '<tr><td><strong>' + esc(r.ticker) + '</strong></td><td>' + esc(r.field_name) +
          '</td><td>' + esc(r.old_value) + ' → ' + esc(r.new_value) + '</td><td>' + esc(r.status) +
          '</td><td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="ix-caption">Chưa có chỉnh sửa</td></tr>';
    }
    function load() {
      return request('/admin/market-ops/corrections').then(function (d) {
        items = d.items || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi tải chỉnh sửa', 'danger'); });
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-corr-ok]');
      if (!btn) return;
      request('/admin/market-ops/corrections/' + encodeURIComponent(btn.getAttribute('data-corr-ok')), {
        method: 'PATCH', body: { status: 'approved' }
      }).then(function () { toast('Đã duyệt chỉnh sửa', 'success'); return load(); })
        .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
    });
    load();
  }

  global.AdmMarketOpsWaveB = {
    initSessions: initSessions,
    initMissing: initMissing,
    initCorrections: initCorrections
  };
})(window);
