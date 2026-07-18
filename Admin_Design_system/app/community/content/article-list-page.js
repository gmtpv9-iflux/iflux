/* ADM-COM-CNT — Danh sách bài viết (Article API) */
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
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data.error && data.error.message) || 'HTTP ' + res.status);
        return (data && data.data) || data || {};
      });
    });
  }

  var STATUS_LABEL = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    published: 'Đã xuất bản',
    scheduled: 'Đã lên lịch'
  };

  function render(list) {
    var tbody = document.getElementById('art-tbody');
    var count = document.getElementById('art-count');
    if (count) count.textContent = String(list.length);
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ix-text-muted)">Chưa có bài viết</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (a) {
      return '<tr>' +
        '<td><strong>' + esc(a.title) + '</strong><div class="ix-caption">' + esc(a.slug || '') + '</div></td>' +
        '<td>' + esc(a.category_name || '—') + '</td>' +
        '<td>' + esc(a.chu_de_name || (a.chu_de && a.chu_de.name) || '—') + '</td>' +
        '<td>' + esc(STATUS_LABEL[a.status] || a.status) + '</td>' +
        '<td class="ix-caption">' + esc((a.published_at || a.created_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
        '<td><a class="ix-btn ix-btn-outline ix-btn-sm" href="edit.html?id=' + encodeURIComponent(a.id) + '">Sửa</a></td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    var q = (document.getElementById('art-q') || {}).value || '';
    var st = (document.getElementById('art-status') || {}).value || '';
    var path = '/community/admin/articles?limit=100';
    if (q) path += '&q=' + encodeURIComponent(q);
    if (st) path += '&status=' + encodeURIComponent(st);
    request(path).then(function (data) {
      render(data.articles || []);
    }).catch(function (err) {
      var tbody = document.getElementById('art-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ix-danger)">' + esc(err.message) + '</td></tr>';
    });
  }

  function boot() {
    var q = document.getElementById('art-q');
    var st = document.getElementById('art-status');
    if (q) q.addEventListener('keydown', function (e) { if (e.key === 'Enter') load(); });
    if (st) st.addEventListener('change', load);
    var btn = document.getElementById('art-reload');
    if (btn) btn.addEventListener('click', load);
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
