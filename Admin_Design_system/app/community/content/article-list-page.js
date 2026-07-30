/* ADM-COM-CNT — Danh sách bài viết (Article API · Content_Entity) */
(function () {
  'use strict';

  var searchTimer = null;

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

  function request(path, opts) {
    opts = opts || {};
    var headers = authHeaders();
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(apiBase() + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
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

  var STATUS_META = {
    draft: { label: 'Nháp', chip: 'ix-chip' },
    pending: { label: 'Chờ duyệt', chip: 'ix-chip ix-chip-warning' },
    published: { label: 'Xuất bản', chip: 'ix-chip ix-chip-success' },
    published_rss: { label: 'Xuất bản (RSS)', chip: 'ix-chip ix-chip-info' },
    scheduled: { label: 'Đã lên lịch', chip: 'ix-chip ix-chip-info' }
  };

  var SOURCE_NAME = {
    cafef: 'CafeF',
    vietstock: 'VietStock',
    baodautu: 'Báo Đầu Tư',
    'bao-dau-tu': 'Báo Đầu Tư'
  };

  /** Nguồn: bài iFlux → Role; bài RSS → tên nhà cung cấp */
  function nguonLabel(a) {
    var author = a.author || {};
    var rawSrc =
      a.source_name ||
      a.source_label ||
      a.source_code ||
      a.provider_name ||
      a.provider ||
      (typeof a.source === 'string' ? a.source : null) ||
      (a.source && (a.source.name || a.source.label || a.source.code || a.source.id)) ||
      a.source_id ||
      '';
    rawSrc = String(rawSrc || '').trim();

    var isRss = !!(
      a.external_url ||
      a.ingest_source ||
      a.from_rss ||
      (a.origin && String(a.origin).toLowerCase() === 'rss') ||
      (a.content_origin && /rss|crawl|ingest/i.test(String(a.content_origin))) ||
      (a.source && (a.source.type === 'rss' || a.source.provider)) ||
      (rawSrc && /cafef|vietstock|bao.?d[aà]u.?t[uư]|rss/i.test(rawSrc))
    );

    if (isRss) {
      var key = rawSrc.toLowerCase().replace(/\s+/g, '');
      if (SOURCE_NAME[key]) return SOURCE_NAME[key];
      if (rawSrc) return rawSrc;
      return 'RSS';
    }

    return (
      author.tier_label ||
      author.role_label ||
      author.role ||
      author.tier ||
      'iFlux'
    );
  }

  function chuTheLabel(a) {
    var parts = [];
    var tickers = a.tickers || [];
    var sectors = a.sectors || [];
    var ecos = a.ecosystems || [];
    if (tickers.length) parts.push(tickers.join(', '));
    if (sectors.length) parts.push('Ngành: ' + sectors.join(', '));
    if (ecos.length) parts.push('HST: ' + ecos.join(', '));
    if (a.exchange) parts.push('Sàn: ' + a.exchange);
    return parts.length ? parts.join(' · ') : '—';
  }

  function fmtNgayDang(a) {
    var raw = a.published_at || a.scheduled_at || a.created_at || '';
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return String(raw).slice(0, 16).replace('T', ' ');
    }
  }

  function statusHtml(status) {
    var meta = STATUS_META[status] || { label: status || '—', chip: 'ix-chip' };
    return '<span class="' + esc(meta.chip) + '">' + esc(meta.label) + '</span>';
  }

  function editHref(id) {
    var base = /\/content\//.test(location.pathname) || /\/content\/index\.html$/.test(location.pathname)
      ? 'edit.html'
      : 'content/edit.html';
    return base + '?id=' + encodeURIComponent(id);
  }

  /** Trang xem: đã xuất bản (Admin/RSS) → User Web; còn lại → URL nguồn nếu có */
  function viewHref(a) {
    var live = a.status === 'published' || a.status === 'published_rss';
    if (!live && a.external_url) {
      return String(a.external_url);
    }
    var ref = a.slug || a.id;
    return '/cong-dong/bai-viet/' + encodeURIComponent(ref);
  }

  function canPerm(key) {
    return !!(window.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function canDeleteArticle() {
    return canPerm('community.articles.delete');
  }

  function canEditArticle() {
    return canPerm('community.articles.edit');
  }

  function render(list) {
    var tbody = document.getElementById('art-tbody');
    var count = document.getElementById('art-count');
    if (count) count.textContent = String(list.length);
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--ix-text-muted);font-size:13px">Chưa có bài viết.</td></tr>';
      return;
    }
    var showDel = canDeleteArticle();
    var showEdit = canEditArticle();
    tbody.innerHTML = list.map(function (a) {
      var title = a.title || '—';
      var chuDe = a.chu_de_name || (a.chu_de && (a.chu_de.name || a.chu_de.label)) || '—';
      var chuThe = chuTheLabel(a);
      return (
        '<tr>' +
          '<td style="white-space:nowrap;font-size:13px">' + esc(nguonLabel(a)) + '</td>' +
          '<td style="white-space:nowrap;font-size:12px;color:var(--ix-text-muted)">' + esc(fmtNgayDang(a)) + '</td>' +
          '<td><strong style="color:var(--ix-text-primary)">' + esc(title) + '</strong></td>' +
          '<td style="white-space:nowrap">' + esc(a.category_name || '—') + '</td>' +
          '<td>' + esc(chuDe) + '</td>' +
          '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(chuThe) + '</td>' +
          '<td style="white-space:nowrap">' + statusHtml(a.status) + '</td>' +
          '<td style="white-space:nowrap">' +
            '<a class="ix-btn ix-btn-icon" href="' + esc(viewHref(a)) + '" target="_blank" rel="noopener" title="Xem"><i class="ti ti-eye"></i></a>' +
            (showEdit
              ? '<a class="ix-btn ix-btn-icon" href="' + editHref(a.id) + '" title="Sửa"><i class="ti ti-pencil"></i></a>'
              : '') +
            (showDel
              ? '<button type="button" class="ix-btn ix-btn-icon" data-art-del="' + esc(a.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>'
              : '') +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function load() {
    var q = ((document.getElementById('art-q') || {}).value || '').trim();
    var st = ((document.getElementById('art-status') || {}).value || '');
    var path = '/community/admin/articles?limit=200';
    if (q) path += '&q=' + encodeURIComponent(q);
    if (st) path += '&status=' + encodeURIComponent(st);
    request(path).then(function (data) {
      render(data.articles || []);
    }).catch(function (err) {
      var tbody = document.getElementById('art-tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--ix-danger);font-size:13px">' + esc(err.message) + '</td></tr>';
      }
    });
  }

  function whenRbacReady(fn) {
    if (window.IfluxAdminRbac && IfluxAdminRbac.refresh) {
      if (IfluxAdminRbac.isLoaded && IfluxAdminRbac.isLoaded()) {
        fn();
      } else {
        IfluxAdminRbac.refresh().then(fn).catch(fn);
      }
      return;
    }
    fn();
  }

  function boot() {
    var q = document.getElementById('art-q');
    var st = document.getElementById('art-status');
    if (q) {
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          load();
        }
      });
      q.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(load, 320);
      });
    }
    if (st) st.addEventListener('change', load);
    var btn = document.getElementById('art-reload');
    if (btn) btn.addEventListener('click', load);
    document.addEventListener('click', function (e) {
      var del = e.target.closest('[data-art-del]');
      if (!del) return;
      var id = del.getAttribute('data-art-del');
      if (!id) return;
      if (!confirm('Xóa bài viết này? Thao tác không hoàn tác.')) return;
      request('/community/admin/articles/' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function () { load(); })
        .catch(function (err) { alert(err.message || 'Không xóa được bài viết.'); });
    });
    whenRbacReady(load);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
