/* ADM-COM-CNT-001 — Dashboard quản lý nội dung */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderTopList(el, items, valueKey) {
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<div class="ix-caption">Chưa có dữ liệu</div>';
      return;
    }
    el.innerHTML = items.map(function (it, i) {
      var val = valueKey ? it[valueKey] : it.count;
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ix-border)">' +
        '<span style="font-size:13px;color:var(--ix-text-secondary)"><span style="color:var(--ix-text-muted);margin-right:8px">' + (i + 1) + '.</span>' + esc(it.name || it.title) + '</span>' +
        '<strong style="font-size:13px;color:var(--ix-text-primary)">' + (val != null ? val.toLocaleString('vi-VN') : '—') + '</strong></div>';
    }).join('');
  }

  function init() {
    if (!global.IfluxContentStore) return;
    var S = IfluxContentStore;
    var stats = S.getDashboardStats();

    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v != null ? v.toLocaleString('vi-VN') : '—';
    }

    set('cnt-stat-total', stats.total);
    set('cnt-stat-published', stats.published);
    set('cnt-stat-draft', stats.draft);
    set('cnt-stat-pending', stats.pending);
    set('cnt-stat-scheduled', stats.scheduled);
    set('cnt-stat-hidden', stats.hidden);
    set('cnt-stat-ai-rate', stats.aiRate + '%');
    set('cnt-stat-link-rate', stats.linkRate + '%');

    renderTopList(document.getElementById('cnt-top-views'), stats.topViews.map(function (p) {
      return { name: p.title, count: (p.stats && p.stats.views) || 0 };
    }));
    renderTopList(document.getElementById('cnt-top-authors'), stats.topAuthors);
    renderTopList(document.getElementById('cnt-top-stories'), stats.topStories);
    renderTopList(document.getElementById('cnt-top-sectors'), stats.topSectors);
    renderTopList(document.getElementById('cnt-top-families'), stats.topFamilies);
    renderTopList(document.getElementById('cnt-top-stocks'), stats.topStocks);
  }

  global.ContentDashboard = { init: init };
})(window);
