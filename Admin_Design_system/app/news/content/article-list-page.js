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

  /**
   * Nguồn (SoT Wave B): chỉ author.display_name.
   * CẤM fallback source_name / provider / vendor / tier_label.
   */
  function nguonLabel(a) {
    var author = a.author || {};
    var name = author.display_name || author.name || '';
    return String(name || '').trim() || '—';
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
    /* Clean Admin URL — cấm relative …/edit.html (nginx từng rewrite thành edit.html.html → 404) */
    var R = window.IfluxAdminRoutes;
    var base = (R && R.hrefFor) ? R.hrefFor('news-content-edit') : '/admin/news/edit';
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    return base.split('#')[0] + sep + 'id=' + encodeURIComponent(id);
  }

  /** Trang xem: đã xuất bản (Admin/RSS) → User Web; còn lại → URL nguồn nếu có */
  function viewHref(a) {
    var live = a.status === 'published' || a.status === 'published_rss';
    if (!live && a.external_url) {
      return String(a.external_url);
    }
    var ref = a.slug || a.id;
    return '/tin-tuc/bai-viet/' + encodeURIComponent(ref);
  }

  function canPerm(key) {
    return !!(window.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function canDeleteArticle() {
    return canPerm('news.articles.delete');
  }

  function canEditArticle() {
    return canPerm('news.articles.edit');
  }

  var currentPage = 1;
  var perPage = 50;
  var totalCount = 0;
  var totalPages = 1;

  function render(list, total) {
    var tbody = document.getElementById('art-tbody');
    var count = document.getElementById('art-count');
    if (count) count.textContent = String(total != null ? total : list.length);
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

  function renderPagination(total, page, pages) {
    var pager = document.getElementById('art-pagination');
    if (!pager) return;
    pager.innerHTML = '';
    if (!total || pages <= 1) return;

    var start = (page - 1) * perPage + 1;
    var end = Math.min(page * perPage, total);

    var info = document.createElement('span');
    info.className = 'ix-page-info';
    info.style.marginLeft = '0';
    info.textContent = 'Hiển thị ' + start + '–' + end + ' / ' + total + ' bài viết';

    var nav = document.createElement('div');
    nav.style.display = 'flex';
    nav.style.gap = '4px';
    nav.style.alignItems = 'center';
    nav.style.marginLeft = 'auto';

    function makeBtn(label, targetPage, disabled, isActive) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ix-page-btn' + (isActive ? ' active' : '');
      b.textContent = label;
      b.disabled = !!disabled;
      if (!disabled && !isActive && typeof targetPage === 'number') {
        b.addEventListener('click', function () {
          load(targetPage);
        });
      }
      return b;
    }

    // First & Prev
    nav.appendChild(makeBtn('«', 1, page === 1, false));
    nav.appendChild(makeBtn('‹', page - 1, page === 1, false));

    // Page numbers range
    var range = [];
    var delta = 2;
    for (var i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }

    range.forEach(function (p) {
      if (p === '...') {
        var ellipsis = document.createElement('span');
        ellipsis.style.padding = '0 4px';
        ellipsis.style.color = 'var(--ix-text-muted)';
        ellipsis.style.fontSize = '13px';
        ellipsis.textContent = '...';
        nav.appendChild(ellipsis);
      } else {
        nav.appendChild(makeBtn(String(p), p, false, p === page));
      }
    });

    // Next & Last
    nav.appendChild(makeBtn('›', page + 1, page === pages, false));
    nav.appendChild(makeBtn('»', pages, page === pages, false));

    pager.appendChild(info);
    pager.appendChild(nav);
  }

  function load(p) {
    if (typeof p === 'number') currentPage = p;
    else currentPage = 1;

    var q = ((document.getElementById('art-q') || {}).value || '').trim();
    var st = ((document.getElementById('art-status') || {}).value || '');
    var path = '/news/admin/articles?page=' + currentPage + '&limit=' + perPage;
    if (q) path += '&q=' + encodeURIComponent(q);
    if (st) path += '&status=' + encodeURIComponent(st);

    request(path).then(function (data) {
      var list = data.articles || (Array.isArray(data) ? data : []);
      totalCount = typeof data.total === 'number' ? data.total : list.length;
      totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(totalCount / perPage) || 1;
      currentPage = typeof data.page === 'number' ? data.page : currentPage;

      render(list, totalCount);
      renderPagination(totalCount, currentPage, totalPages);
    }).catch(function (err) {
      var tbody = document.getElementById('art-tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--ix-danger);font-size:13px">' + esc(err.message) + '</td></tr>';
      }
      var pager = document.getElementById('art-pagination');
      if (pager) pager.innerHTML = '';
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
          load(1);
        }
      });
      q.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { load(1); }, 320);
      });
    }
    if (st) st.addEventListener('change', function () { load(1); });
    var btn = document.getElementById('art-reload');
    if (btn) btn.addEventListener('click', function () { load(currentPage); });
    document.addEventListener('click', function (e) {
      var del = e.target.closest('[data-art-del]');
      if (!del) return;
      var id = del.getAttribute('data-art-del');
      if (!id) return;
      if (!confirm('Xóa bài viết này? Thao tác không hoàn tác.')) return;
      request('/news/admin/articles/' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function () { load(currentPage); })
        .catch(function (err) { alert(err.message || 'Không xóa được bài viết.'); });
    });
    whenRbacReady(function () { load(1); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
