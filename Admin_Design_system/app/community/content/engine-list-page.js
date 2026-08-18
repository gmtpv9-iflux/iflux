/* ADM-COM-ENG — Danh sách tin Content Engine (Vnstock ingest) */
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
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var token = null;
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = localStorage.getItem('iflux_admin_api_key') || 'iflux-admin-local-dev';
    return h;
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: authHeaders(),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data.error && data.error.message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) || data || {};
      });
    });
  }

  function missingLabel(arr) {
    var map = { chu_de: 'Chủ đề', category: 'Danh mục', entity: 'Entity' };
    return (arr || []).map(function (k) { return map[k] || k; }).join(', ') || '—';
  }

  function render(list, needsCount) {
    var tbody = document.getElementById('eng-tbody');
    var count = document.getElementById('eng-count');
    var badge = document.getElementById('eng-needs-badge');
    if (count) count.textContent = String(list.length);
    if (badge) {
      badge.textContent = String(needsCount != null ? needsCount : 0) + ' thiếu chủ đề';
      badge.className = 'ix-chip ' + (needsCount ? 'ix-chip-warning' : 'ix-chip-muted') + ' ix-chip-sm';
    }
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ix-text-muted)">Chưa có tin nguồn</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (a) {
      var review = a.needs_review
        ? '<span class="ix-chip ix-chip-warning ix-chip-sm">Cần bổ sung</span>'
        : (a.published_to_feed
          ? '<span class="ix-chip ix-chip-success ix-chip-sm">Đã lên feed</span>'
          : '<span class="ix-chip ix-chip-muted ix-chip-sm">Đủ dữ liệu</span>');
      return '<tr>' +
        '<td><strong>' + esc(a.title) + '</strong>' +
          '<div class="ix-caption"><a href="' + esc(a.external_url || '#') + '" target="_blank" rel="noopener">' + esc((a.source_code || '').replace('vnstock:', '')) + '</a></div></td>' +
        '<td>' + esc(a.category_raw || '—') + '</td>' +
        '<td>' + esc(a.chu_de_name || '—') + '</td>' +
        '<td class="ix-caption">' + esc(missingLabel(a.missing_fields)) + '</td>' +
        '<td>' + review + '</td>' +
        '<td class="ix-caption">' + esc(String(a.published_at || a.ingested_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
        '<td><a class="ix-btn ix-btn-outline ix-btn-sm" href="engine-edit.html?id=' + encodeURIComponent(a.id) + '">Sửa</a></td>' +
        '</tr>';
    }).join('');
  }

  function load() {
    var q = (document.getElementById('eng-q') || {}).value || '';
    var filt = (document.getElementById('eng-filter') || {}).value || '';
    var path = '/content/articles?limit=100';
    if (q) path += '&q=' + encodeURIComponent(q);
    if (filt === 'needs') path += '&needs_review=1';
    else if (filt === 'ready') path += '&needs_review=0';
    request(path).then(function (data) {
      render(data.articles || [], data.needs_review_count);
    }).catch(function (err) {
      var tbody = document.getElementById('eng-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ix-danger)">' + esc(err.message) + '</td></tr>';
    });
  }

  function runIngest() {
    var btn = document.getElementById('eng-run');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-loader"></i> Đang kéo…';
    }
    request('/content/ingest/run', { method: 'POST', body: { limit: 12, sites: 'cafef,vietstock' } })
      .then(function (data) {
        var r = (data && data.result) || data || {};
        var msg = 'Đã kéo ' + (r.crawled != null ? r.crawled : '?') +
          ' · OK ' + (r.ok_count != null ? r.ok_count : 0) +
          ' · Lỗi ' + (r.fail_count != null ? r.fail_count : 0);
        if (typeof window.ixToast === 'function') window.ixToast(msg, 'success');
        else window.alert(msg);
        load();
      })
      .catch(function (err) {
        if (typeof window.ixToast === 'function') window.ixToast(err.message, 'danger');
        else window.alert(err.message);
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="ti ti-cloud-download"></i> Kéo tin Vnstock';
        }
      });
  }

  function boot() {
    var q = document.getElementById('eng-q');
    var f = document.getElementById('eng-filter');
    if (q) q.addEventListener('keydown', function (e) { if (e.key === 'Enter') load(); });
    if (f) f.addEventListener('change', load);
    var reload = document.getElementById('eng-reload');
    if (reload) reload.addEventListener('click', load);
    var run = document.getElementById('eng-run');
    if (run) run.addEventListener('click', runIngest);
    if (new URLSearchParams(location.search).get('needs') === '1') {
      if (f) f.value = 'needs';
    }
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
