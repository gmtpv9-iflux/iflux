/* ADM-COM — Danh sách chủ đề Cộng đồng */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  function load() {
    var q = (document.getElementById('com-topic-search') || {}).value || '';
    var path = '/community/admin/chu-de?limit=300';
    if (q) path += '&q=' + encodeURIComponent(q);
    request(path).then(function (data) {
      var list = data.chu_de || [];
      var count = document.getElementById('com-topic-count');
      var tbody = document.getElementById('com-topic-tbody');
      if (count) count.textContent = String(list.length);
      if (!tbody) return;
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ix-text-muted)">Chưa có chủ đề</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(function (t) {
        return '<tr>' +
          '<td><strong>' + esc(t.name || t.label) + '</strong></td>' +
          '<td><code style="font-size:11px">' + esc(t.slug) + '</code></td>' +
          '<td>' + esc(t.post_count) + '</td>' +
          '<td>' + esc(t.status || '—') + '</td>' +
          '<td class="ix-caption">' + esc(String(t.updated_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
          '</tr>';
      }).join('');
    }).catch(function (err) {
      var tbody = document.getElementById('com-topic-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ix-danger)">' + esc(err.message) + '</td></tr>';
    });
  }

  function boot() {
    var search = document.getElementById('com-topic-search');
    if (search) search.addEventListener('keydown', function (e) { if (e.key === 'Enter') load(); });
    var btn = document.getElementById('com-topic-reload');
    if (btn) btn.addEventListener('click', load);
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
