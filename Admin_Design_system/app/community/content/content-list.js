/* ADM-COM-CNT-002 — Danh sách nội dung */
(function (global) {
  'use strict';

  var page = 1;
  var perPage = 15;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getFilters() {
    return {
      q: (document.getElementById('cnt-filter-q') || {}).value || '',
      status: (document.getElementById('cnt-filter-status') || {}).value || '',
      contentType: (document.getElementById('cnt-filter-type') || {}).value || '',
      category: (document.getElementById('cnt-filter-category') || {}).value || '',
      tag: (document.getElementById('cnt-filter-tag') || {}).value || '',
      source: (document.getElementById('cnt-filter-source') || {}).value || '',
      author: (document.getElementById('cnt-filter-author') || {}).value || '',
      reviewer: (document.getElementById('cnt-filter-reviewer') || {}).value || '',
      dateFrom: (document.getElementById('cnt-filter-from') || {}).value || '',
      dateTo: (document.getElementById('cnt-filter-to') || {}).value || '',
      hasImage: (document.getElementById('cnt-filter-image') || {}).value || '',
      hasVideo: (document.getElementById('cnt-filter-video') || {}).value || '',
      hasAttachment: (document.getElementById('cnt-filter-attach') || {}).value || '',
      hasAiSummary: (document.getElementById('cnt-filter-ai') || {}).value || '',
      hasStock: (document.getElementById('cnt-filter-stock') || {}).value || '',
      hasStory: (document.getElementById('cnt-filter-story') || {}).value || ''
    };
  }

  function fillSelect(id, options, allLabel) {
    var el = document.getElementById(id);
    if (!el) return;
    var html = '<option value="">' + (allLabel || 'Tất cả') + '</option>';
    Object.keys(options).forEach(function (k) {
      html += '<option value="' + k + '">' + options[k] + '</option>';
    });
    el.innerHTML = html;
  }

  function fillAuthors() {
    var S = global.IfluxContentStore;
    var posts = S.getAll();
    var authors = {};
    var reviewers = {};
    posts.forEach(function (p) {
      if (p.author) authors[p.author] = 1;
      if (p.reviewer) reviewers[p.reviewer] = 1;
    });
    function opts(map) {
      return Object.keys(map).sort().map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(k) + '</option>';
      }).join('');
    }
    var aEl = document.getElementById('cnt-filter-author');
    var rEl = document.getElementById('cnt-filter-reviewer');
    if (aEl) aEl.innerHTML = '<option value="">Tất cả</option>' + opts(authors);
    if (rEl) rEl.innerHTML = '<option value="">Tất cả</option>' + opts(reviewers);
  }

  function fillCategories() {
    var el = document.getElementById('cnt-filter-category');
    if (!el || !global.IfluxContentStore) return;
    var html = '<option value="">Tất cả</option>';
    IfluxContentStore.CATEGORIES.forEach(function (c) {
      html += '<option value="' + c.id + '">' + c.name + '</option>';
      (c.children || []).forEach(function (ch) {
        html += '<option value="' + ch.id + '">→ ' + ch.name + '</option>';
      });
    });
    el.innerHTML = html;
  }

  function renderTable(rows) {
    var tbody = document.getElementById('cnt-tbody');
    if (!tbody) return;
    var S = global.IfluxContentStore;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="16" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Không có bài viết phù hợp</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (p) {
      var chip = S.STATUS_CHIP[p.status] || 'ix-chip-muted';
      var thumb = p.hasImage
        ? '<div class="ix-avatar ix-avatar-sm" style="background:var(--ix-surface-2)"><i class="ti ti-photo"></i></div>'
        : '<div class="ix-avatar ix-avatar-sm ix-avatar-muted"><i class="ti ti-photo-off"></i></div>';
      return '<tr>' +
        '<td><span style="font-family:ui-monospace,monospace;font-size:12px">' + esc(p.id) + '</span></td>' +
        '<td>' + thumb + '</td>' +
        '<td><a href="edit.html?id=' + encodeURIComponent(p.id) + '" style="font-weight:500;color:var(--ix-text-primary)">' + esc(p.title) + '</a></td>' +
        '<td>' + esc(S.CONTENT_TYPES[p.contentType] || p.contentType) + '</td>' +
        '<td style="max-width:140px;font-size:12px">' + esc(S.categoryLabel(p.categories)) + '</td>' +
        '<td style="max-width:120px;font-size:12px">' + esc((p.tags || []).join(', ') || '—') + '</td>' +
        '<td>' + esc(p.author || '—') + '</td>' +
        '<td>' + esc(p.reviewer || '—') + '</td>' +
        '<td><span class="ix-chip ' + chip + ' ix-chip-sm">' + esc(S.STATUS[p.status] || p.status) + '</span></td>' +
        '<td>' + esc(S.SOURCES[p.source] || p.source) + '</td>' +
        '<td>' + ((p.stats && p.stats.views) || 0).toLocaleString('vi-VN') + '</td>' +
        '<td>' + ((p.stats && p.stats.comments) || 0).toLocaleString('vi-VN') + '</td>' +
        '<td style="font-size:12px;white-space:nowrap">' + S.fmtDate(p.createdAt) + '</td>' +
        '<td style="font-size:12px;white-space:nowrap">' + S.fmtDate(p.updatedAt) + '</td>' +
        '<td style="font-size:12px;white-space:nowrap">' + S.fmtDate(p.publishedAt) + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<a href="edit.html?id=' + encodeURIComponent(p.id) + '" class="ix-btn ix-btn-icon ix-btn-sm" title="Sửa"><i class="ti ti-edit"></i></a>' +
          '<button type="button" class="ix-btn ix-btn-icon ix-btn-sm" data-cnt-del="' + esc(p.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');
  }

  function renderPagination(total) {
    var el = document.getElementById('cnt-pagination');
    if (!el) return;
    var pages = Math.max(1, Math.ceil(total / perPage));
    if (page > pages) page = pages;
    var html = '<span class="ix-caption">' + total.toLocaleString('vi-VN') + ' bài viết</span><div style="display:flex;gap:4px">';
    for (var i = 1; i <= pages; i++) {
      html += '<button type="button" class="ix-btn ix-btn-sm ' + (i === page ? 'ix-btn-primary' : 'ix-btn-outline') + '" data-cnt-page="' + i + '">' + i + '</button>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function refresh() {
    var S = global.IfluxContentStore;
    var all = S.filterPosts(S.getAll(), getFilters());
    var total = all.length;
    var start = (page - 1) * perPage;
    renderTable(all.slice(start, start + perPage));
    renderPagination(total);
    var countEl = document.getElementById('cnt-result-count');
    if (countEl) countEl.textContent = total.toLocaleString('vi-VN');
  }

  function bindEvents() {
    document.querySelectorAll('#cnt-filter-form select, #cnt-filter-form input').forEach(function (el) {
      el.addEventListener('change', function () { page = 1; refresh(); });
    });
    var q = document.getElementById('cnt-filter-q');
    if (q) {
      var t;
      q.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { page = 1; refresh(); }, 300);
      });
    }
    var reset = document.getElementById('cnt-filter-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        document.getElementById('cnt-filter-form').reset();
        page = 1;
        refresh();
      });
    }
    document.addEventListener('click', function (e) {
      var pg = e.target.closest('[data-cnt-page]');
      if (pg) { page = parseInt(pg.getAttribute('data-cnt-page'), 10); refresh(); return; }
      var del = e.target.closest('[data-cnt-del]');
      if (del && confirm('Chuyển bài viết sang trạng thái Đã xóa?')) {
        IfluxContentStore.remove(del.getAttribute('data-cnt-del'));
        refresh();
      }
    });
  }

  function init() {
    if (!global.IfluxContentStore) return;
    var S = IfluxContentStore;
    fillSelect('cnt-filter-status', S.STATUS);
    fillSelect('cnt-filter-type', S.CONTENT_TYPES);
    fillSelect('cnt-filter-source', S.SOURCES);
    fillCategories();
    var tagEl = document.getElementById('cnt-filter-tag');
    if (tagEl) {
      tagEl.innerHTML = '<option value="">Tất cả</option>' + S.TAGS.map(function (t) {
        return '<option value="' + t + '">' + t + '</option>';
      }).join('');
    }
    ['cnt-filter-image', 'cnt-filter-video', 'cnt-filter-attach', 'cnt-filter-ai', 'cnt-filter-stock', 'cnt-filter-story'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<option value="">Tất cả</option><option value="yes">Có</option><option value="no">Không</option>';
    });
    fillAuthors();
    bindEvents();
    refresh();
  }

  global.ContentList = { init: init };
})(window);
