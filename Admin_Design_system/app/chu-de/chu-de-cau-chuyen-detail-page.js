/* ADM-STR — Chi tiết câu chuyện: tổng quan + bảng phân tích */
(function (global) {
  'use strict';

  var Store = global.IfluxChuDeRegistryStore;
  var STORY_STATUSES = ['mature', 'declining'];

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
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

  function parseId() {
    return new URLSearchParams(global.location.search).get('id') || '';
  }

  function getFilters() {
    return {
      lifecycle: (document.getElementById('adm-story-dt-lifecycle') || {}).value || '',
      keyword: ((document.getElementById('adm-story-dt-search') || {}).value || '').trim().toLowerCase(),
      statuses: STORY_STATUSES
    };
  }

  function renderOverview(story) {
    var el = document.getElementById('adm-story-dt-overview');
    if (!el) return;
    if (!story) {
      el.innerHTML =
        '<div class="ix-card" style="padding:20px">' +
          '<p style="margin:0;font-size:13px;color:var(--ix-text-muted)">Chọn một câu chuyện từ danh sách để xem tổng quan, hoặc xem bảng phân tích bên dưới.</p>' +
          '<a href="/admin/cau-chuyen/danh-sach" class="ix-btn ix-btn-outline ix-btn-sm" style="margin-top:12px"><i class="ti ti-list"></i> Danh sách Câu chuyện</a>' +
        '</div>';
      return;
    }
    var a = story.analytics || {};
    var stockN = Store.countStocks(story.id) || story.mapping_count || 0;
    document.title = story.name + ' · Câu chuyện · iFlux Admin';
    var titleEl = document.getElementById('adm-story-dt-title');
    if (titleEl) titleEl.textContent = 'Chi tiết: ' + story.name;
    el.innerHTML =
      '<div class="ix-card" style="padding:20px;margin-bottom:16px">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">' +
          '<div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--ix-text-primary)">' + esc(story.name) + '</div>' +
            '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:4px">' + esc(story.slug) + '</div>' +
            (story.description ? '<p style="font-size:13px;color:var(--ix-text-secondary);margin:10px 0 0">' + esc(story.description) + '</p>' : '') +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            chip(Store.LIFECYCLE_META, story.lifecycle) +
            chip(Store.STATUS_META, story.status) +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:16px;font-size:13px">' +
          '<div><span style="color:var(--ix-text-muted)">Số CP</span><div style="font-weight:700;margin-top:2px">' + stockN + '</div></div>' +
          '<div><span style="color:var(--ix-text-muted)">Tạo bởi</span><div style="font-weight:700;margin-top:2px">' + esc(story.createdBy || '—') + '</div></div>' +
          '<div><span style="color:var(--ix-text-muted)">Cập nhật</span><div style="font-weight:700;margin-top:2px">' + esc(fmtDate(story.updatedAt)) + '</div></div>' +
          '<div><span style="color:var(--ix-text-muted)">Lượt xem</span><div style="font-weight:700;margin-top:2px">' + (a.views || 0).toLocaleString('vi-VN') + '</div></div>' +
          '<div><span style="color:var(--ix-text-muted)">Tương tác</span><div style="font-weight:700;margin-top:2px">' + (a.interactions || 0).toLocaleString('vi-VN') + '</div></div>' +
          '<div><span style="color:var(--ix-text-muted)">Xu hướng</span><div style="font-weight:700;margin-top:2px;color:var(--ix-accent)">' + (a.trendScore || 0) + '</div></div>' +
        '</div>' +
      '</div>';
  }

  function renderSummary(list) {
    var el = document.getElementById('adm-story-dt-summary');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '';
      return;
    }
    var totalViews = list.reduce(function (s, r) { return s + (r.analytics.views || 0); }, 0);
    var totalPosts = list.reduce(function (s, r) { return s + (r.analytics.postsCount || 0); }, 0);
    var avgTrend = Math.round(list.reduce(function (s, r) { return s + (r.analytics.trendScore || 0); }, 0) / list.length);
    el.innerHTML =
      '<div class="adm-str-anl-kpi"><span>Tổng lượt xem</span><strong>' + totalViews.toLocaleString('vi-VN') + '</strong></div>' +
      '<div class="adm-str-anl-kpi"><span>Bài cộng đồng</span><strong>' + totalPosts.toLocaleString('vi-VN') + '</strong></div>' +
      '<div class="adm-str-anl-kpi"><span>Điểm xu hướng TB</span><strong>' + avgTrend + '</strong></div>' +
      '<div class="adm-str-anl-kpi"><span>Câu chuyện</span><strong>' + list.length + '</strong></div>';
  }

  function renderTable(focusId) {
    if (!Store) return;
    var tbody = document.getElementById('adm-story-dt-tbody');
    if (!tbody) return;
    var list = Store.listAnalytics(getFilters());
    renderSummary(list);
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Không có dữ liệu phân tích.</td></tr>';
      return;
    }
    var maxViews = Math.max.apply(null, list.map(function (r) { return r.analytics.views || 0; }).concat([1]));
    tbody.innerHTML = list.map(function (r, i) {
      var a = r.analytics;
      var hl = focusId && r.storyId === focusId ? ' style="background:var(--ix-bg-subtle)"' : '';
      return '<tr' + hl + '>' +
        '<td style="font-weight:700;color:var(--ix-text-muted)">' + (i + 1) + '</td>' +
        '<td><a href="/admin/cau-chuyen/chi-tiet?id=' + encodeURIComponent(r.storyId) + '" style="font-weight:600;color:var(--ix-text-primary);text-decoration:none">' + esc(r.name) + '</a></td>' +
        '<td>' + chip(Store.LIFECYCLE_META, r.lifecycle) + '</td>' +
        '<td>' + r.stocksCount + '</td>' +
        '<td><div class="adm-str-anl-bar-wrap"><div class="adm-str-anl-bar" style="width:' + barWidth(a.views, maxViews) + '%"></div></div>' + (a.views || 0).toLocaleString('vi-VN') + '</td>' +
        '<td>' + (a.interactions || 0).toLocaleString('vi-VN') + '</td>' +
        '<td><strong style="color:var(--ix-accent)">' + (a.trendScore || 0) + '</strong></td>' +
      '</tr>';
    }).join('');
  }

  function refresh() {
    var id = parseId();
    var story = id ? Store.getStory(id) : null;
    if (story && !Store.isStoryStatus(story.status)) story = null;
    renderOverview(story);
    renderTable(id);
  }

  function init() {
    if (!Store) return;
    var lc = document.getElementById('adm-story-dt-lifecycle');
    if (lc) {
      lc.innerHTML = '<option value="">Tất cả lifecycle</option>' +
        Store.LIFECYCLE_ORDER.map(function (k) {
          return '<option value="' + k + '">' + Store.LIFECYCLE_META[k].label + '</option>';
        }).join('');
      lc.addEventListener('change', refresh);
    }
    var search = document.getElementById('adm-story-dt-search');
    if (search) search.addEventListener('input', refresh);
    var tbody = document.getElementById('adm-story-dt-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Đang tải…</td></tr>';
    Store.loadFromApi().then(refresh).catch(function (err) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ix-danger)">' +
          esc(err.message || 'Không tải được') + '</td></tr>';
      }
    });
  }

  global.AdmCauChuyenDetail = { init: init, refresh: refresh };
})(window);
