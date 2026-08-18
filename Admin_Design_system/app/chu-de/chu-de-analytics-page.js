/* ADM-STR-004 — Chủ đề Analytics (operational) */
(function (global) {
  'use strict';

  var Store = global.IfluxChuDeRegistryStore;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function chip(meta, value) {
    if (!meta || !meta[value]) return esc(value);
    var m = meta[value];
    return '<span class="ix-chip ix-chip-' + m.color + ' ix-chip-sm">' + esc(m.label) + '</span>';
  }

  function barWidth(val, max) {
    if (!max) return 0;
    return Math.max(4, Math.round((val / max) * 100));
  }

  function getFilters() {
    return {
      lifecycle: (document.getElementById('adm-str-anl-lifecycle') || {}).value || '',
      keyword: ((document.getElementById('adm-str-anl-search') || {}).value || '').trim().toLowerCase()
    };
  }

  function renderSummary(list) {
    var el = document.getElementById('adm-str-anl-summary');
    if (!el || !list.length) return;
    var totalViews = list.reduce(function (s, r) { return s + (r.analytics.views || 0); }, 0);
    var totalPosts = list.reduce(function (s, r) { return s + (r.analytics.postsCount || 0); }, 0);
    var avgTrend = Math.round(list.reduce(function (s, r) { return s + (r.analytics.trendScore || 0); }, 0) / list.length);
    el.innerHTML =
      '<div class="adm-str-anl-kpi"><span>Tổng lượt xem</span><strong>' + totalViews.toLocaleString('vi-VN') + '</strong></div>' +
      '<div class="adm-str-anl-kpi"><span>Bài cộng đồng</span><strong>' + totalPosts.toLocaleString('vi-VN') + '</strong></div>' +
      '<div class="adm-str-anl-kpi"><span>Điểm xu hướng TB</span><strong>' + avgTrend + '</strong></div>' +
      '<div class="adm-str-anl-kpi"><span>Story theo dõi</span><strong>' + list.length + '</strong></div>';
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-str-anl-tbody');
    if (!tbody) return;
    var list = Store.listAnalytics(getFilters());
    renderSummary(list);
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Không có dữ liệu.</td></tr>';
      return;
    }
    var maxViews = Math.max.apply(null, list.map(function (r) { return r.analytics.views || 0; }).concat([1]));
    tbody.innerHTML = list.map(function (r, i) {
      var a = r.analytics;
      return '<tr>' +
        '<td style="font-weight:700;color:var(--ix-text-muted)">' + (i + 1) + '</td>' +
        '<td><a href="detail.html?id=' + encodeURIComponent(r.storyId) + '" style="font-weight:600;color:var(--ix-text-primary);text-decoration:none">' + esc(r.name) + '</a></td>' +
        '<td>' + chip(Store.LIFECYCLE_META, r.lifecycle) + '</td>' +
        '<td>' + r.stocksCount + '</td>' +
        '<td><div class="adm-str-anl-bar-wrap"><div class="adm-str-anl-bar" style="width:' + barWidth(a.views, maxViews) + '%"></div></div>' + (a.views || 0).toLocaleString('vi-VN') + '</td>' +
        '<td>' + (a.interactions || 0).toLocaleString('vi-VN') + '</td>' +
        '<td><strong style="color:var(--ix-accent)">' + (a.trendScore || 0) + '</strong></td>' +
      '</tr>';
    }).join('');
  }

  function init() {
    if (!Store) return;
    var lc = document.getElementById('adm-str-anl-lifecycle');
    if (lc) {
      lc.innerHTML = '<option value="">Tất cả lifecycle</option>' +
        Store.LIFECYCLE_ORDER.map(function (k) {
          return '<option value="' + k + '">' + Store.LIFECYCLE_META[k].label + '</option>';
        }).join('');
      lc.addEventListener('change', renderTable);
    }
    var search = document.getElementById('adm-str-anl-search');
    if (search) search.addEventListener('input', renderTable);
    renderTable();
  }

  global.AdmChuDeAnalytics = { init: init };
  global.AdmStoryAnalytics = global.AdmChuDeAnalytics;
})(window);
