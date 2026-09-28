/* Regenerate ảnh đại diện — bảng thông tin đọc, nguồn dữ liệu duy nhất:
 * backend/src/modules/media/cover-image-profiles.js (qua GET /admin/media/cover-profiles) */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiBase() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { Accept: 'application/json' };
    var token = null;
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = localStorage.getItem('iflux_admin_api_key') || 'iflux-admin-local-dev';
    return h;
  }

  function request(path) {
    return fetch(apiBase() + path, { headers: authHeaders() }).then(function (res) {
      return res.text().then(function (text) {
        var data = {};
        if (text) {
          try { data = JSON.parse(text); } catch (e) { data = {}; }
        }
        if (!res.ok) throw new Error((data.error && data.error.message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) || data || {};
      });
    });
  }

  var FORMAT_LABEL = { webp: 'WebP', jpeg: 'JPEG' };

  function renderRow(p) {
    return (
      '<tr>' +
        '<td><code>' + esc(p.key) + '</code></td>' +
        '<td>' + esc(p.label) + '</td>' +
        '<td>' + esc(p.width) + '&times;' + esc(p.height) + 'px</td>' +
        '<td>' + esc(FORMAT_LABEL[p.format] || p.format) + ' (q' + esc(p.quality) + ')</td>' +
        '<td style="color:var(--ix-text-muted)">' + esc(p.description) + '</td>' +
      '</tr>'
    );
  }

  function load() {
    var tbody = document.getElementById('rgp-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--ix-text-muted);font-size:13px">Đang tải…</td></tr>';
    request('/admin/media/cover-profiles')
      .then(function (data) {
        var profiles = (data && data.profiles) || [];
        document.getElementById('rgp-count').textContent = profiles.length;
        tbody.innerHTML = profiles.length
          ? profiles.map(renderRow).join('')
          : '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--ix-text-muted);font-size:13px">Chưa có trường hợp nào</td></tr>';
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--ix-chip-danger,#e5484d);font-size:13px">Lỗi tải dữ liệu: ' + esc(err.message) + '</td></tr>';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    load();
    var reload = document.getElementById('rgp-reload');
    if (reload) reload.addEventListener('click', load);
  });
})();
