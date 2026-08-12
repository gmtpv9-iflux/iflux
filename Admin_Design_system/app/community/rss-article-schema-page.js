/* ADM-COM-RSS-003 — Đồng bộ cấu trúc bài viết
 * SoT: GET /admin/community-ops/rss-article-schema → community_rss_schema
 * (fields = đúng key community_posts). CẤM hardcode field list trên client.
 */
(function () {
  'use strict';

  var allFields = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cell(val) {
    if (!val) return '<span class="ix-caption">—</span>';
    return '<code class="ix-caption">' + esc(val) + '</code>';
  }

  function apiBase() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    try {
      if (window.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
        var b = IfluxApiConfig.getBaseUrl();
        if (b) return b.replace(/\/$/, '');
      }
    } catch (e) { /* ignore */ }
    return '/api';
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (!token) {
      try {
        var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
        if (raw) {
          var obj = JSON.parse(raw);
          if (obj && obj.token) token = obj.token;
        }
      } catch (e) { /* ignore */ }
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    return h;
  }

  function request(path) {
    return fetch(apiBase() + path, { method: 'GET', headers: authHeaders() }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(((data.error || {}).message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) ? data.data : data;
      });
    });
  }

  function pickFields(payload) {
    var items = (payload && payload.items) || [];
    var preferred = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].code === 'default_article') {
        preferred = items[i];
        break;
      }
    }
    if (!preferred) preferred = items[0] || null;
    if (!preferred) return [];
    if (Array.isArray(preferred.fields) && preferred.fields.length) return preferred.fields;
    var mj = preferred.mapping_json;
    if (mj && Array.isArray(mj.fields)) return mj.fields;
    return [];
  }

  function render() {
    var q = ((document.getElementById('rss-schema-q') || {}).value || '').trim().toLowerCase();
    var rows = allFields.filter(function (r) {
      if (!q) return true;
      return [
        r.label,
        r.key,
        r.group,
        r.cafef,
        r.vietstock,
        r.baodautu,
        r.note
      ].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    var tb = document.getElementById('rss-schema-tbody');
    var count = document.getElementById('rss-schema-count');
    if (count) count.textContent = String(rows.length);
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption" style="text-align:center">Không có trường</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(function (r) {
      return (
        '<tr>' +
          '<td><strong>' + esc(r.label || r.key) + '</strong>' +
            '<div class="ix-caption"><code>' + esc(r.key || '') + '</code>' +
              (r.group ? (' · ' + esc(r.group)) : '') +
            '</div></td>' +
          '<td>' + cell(r.cafef) + '</td>' +
          '<td>' + cell(r.vietstock) + '</td>' +
          '<td>' + cell(r.baodautu) + '</td>' +
          '<td class="ix-caption">' + esc(r.note || '') + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function showError(msg) {
    var tb = document.getElementById('rss-schema-tbody');
    var count = document.getElementById('rss-schema-count');
    if (count) count.textContent = '0';
    if (tb) {
      tb.innerHTML =
        '<tr><td colspan="5" class="ix-caption" style="text-align:center;color:var(--ix-danger)">' +
        esc(msg || 'Không tải được schema') +
        '</td></tr>';
    }
  }

  function load() {
    var tb = document.getElementById('rss-schema-tbody');
    if (tb) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption" style="text-align:center">Đang tải schema từ database…</td></tr>';
    }
    return request('/admin/community-ops/rss-article-schema')
      .then(function (data) {
        allFields = pickFields(data);
        if (!allFields.length) {
          showError('Schema trống — kiểm tra community_rss_schema');
          return;
        }
        render();
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : 'Lỗi tải schema');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('rss-schema-q');
    if (input) input.addEventListener('input', render);
    load();
  });
})();
