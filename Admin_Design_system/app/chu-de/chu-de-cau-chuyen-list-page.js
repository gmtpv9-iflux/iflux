/* ADM-STR — Danh sách câu chuyện = chủ đề Trưởng thành / Suy yếu */
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
    return '<span class="ix-chip ix-chip-' + m.color + '">' + esc(m.label) + '</span>';
  }

  function getFilters() {
    return {
      keyword: ((document.getElementById('adm-story-search') || {}).value || '').trim().toLowerCase(),
      lifecycle: (document.getElementById('adm-story-lifecycle') || {}).value || '',
      statuses: STORY_STATUSES,
      status: (document.getElementById('adm-story-status') || {}).value || ''
    };
  }

  function listFiltered() {
    var f = getFilters();
    var statuses = f.status ? [f.status] : STORY_STATUSES;
    return Store.listStories({
      statuses: statuses,
      lifecycle: f.lifecycle,
      keyword: f.keyword
    });
  }

  function render() {
    if (!Store) return;
    var list = listFiltered();
    var count = document.getElementById('adm-story-count');
    var tbody = document.getElementById('adm-story-tbody');
    if (count) count.textContent = String(list.length);
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có câu chuyện (chưa có chủ đề Trưởng thành / Suy yếu).</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (s) {
      var stockN = Store.countStocks(s.id) || s.mapping_count || 0;
      return '<tr>' +
        '<td><a href="/admin/cau-chuyen/chi-tiet?id=' + encodeURIComponent(s.id) + '" style="font-weight:600;color:var(--ix-text-primary);text-decoration:none">' + esc(s.name) + '</a>' +
          '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:2px">' + esc(s.slug) + '</div></td>' +
        '<td>' + chip(Store.LIFECYCLE_META, s.lifecycle) + '</td>' +
        '<td>' + chip(Store.STATUS_META, s.status) + '</td>' +
        '<td>' + stockN + '</td>' +
        '<td>' + esc(s.createdBy) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(s.updatedAt)) + '</td>' +
        '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' +
          '<a href="/admin/cau-chuyen/chi-tiet?id=' + encodeURIComponent(s.id) + '" class="ix-btn ix-btn-icon" title="Chi tiết"><i class="ti ti-file-description" style="font-size:14px"></i></a>' +
          '<a href="/admin/chu-de/detail?id=' + encodeURIComponent(s.id) + '" class="ix-btn ix-btn-icon" title="Sửa chủ đề"><i class="ti ti-edit" style="font-size:14px"></i></a>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function fillLifecycle() {
    var el = document.getElementById('adm-story-lifecycle');
    if (!el || !Store) return;
    el.innerHTML = '<option value="">Tất cả</option>' +
      Store.LIFECYCLE_ORDER.map(function (k) {
        return '<option value="' + k + '">' + esc(Store.LIFECYCLE_META[k].label) + '</option>';
      }).join('');
  }

  function boot() {
    if (!Store) return;
    fillLifecycle();
    var tbody = document.getElementById('adm-story-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Đang tải…</td></tr>';
    ['adm-story-lifecycle', 'adm-story-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', render);
    });
    var search = document.getElementById('adm-story-search');
    if (search) search.addEventListener('input', render);
    var btn = document.getElementById('adm-story-reload');
    if (btn) btn.addEventListener('click', function () {
      Store.loadFromApi().then(render);
    });
    Store.loadFromApi().then(render).catch(function (err) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ix-danger)">' +
          esc(err.message || 'Không tải được') + '</td></tr>';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
