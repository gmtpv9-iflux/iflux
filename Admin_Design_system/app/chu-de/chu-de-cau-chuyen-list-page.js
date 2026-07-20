/* ADM-STR — Danh sách câu chuyện = chủ đề trạng thái Trưởng thành */
(function (global) {
  'use strict';

  var Store = global.IfluxChuDeRegistryStore;

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

  function render() {
    if (!Store) return;
    var q = ((document.getElementById('adm-story-search') || {}).value || '').trim().toLowerCase();
    var list = Store.listStories({ status: 'mature', keyword: q });
    var count = document.getElementById('adm-story-count');
    var tbody = document.getElementById('adm-story-tbody');
    if (count) count.textContent = String(list.length);
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có câu chuyện (chưa có chủ đề ở trạng thái Trưởng thành).</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (s) {
      var stockN = Store.countStocks(s.id) || s.mapping_count || 0;
      return '<tr>' +
        '<td><a href="/admin/chu-de/detail?id=' + encodeURIComponent(s.id) + '" style="font-weight:600;color:var(--ix-text-primary);text-decoration:none">' + esc(s.name) + '</a>' +
          '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:2px">' + esc(s.slug) + '</div></td>' +
        '<td>' + chip(Store.LIFECYCLE_META, s.lifecycle) + '</td>' +
        '<td>' + chip(Store.STATUS_META, s.status) + '</td>' +
        '<td>' + stockN + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(s.updatedAt)) + '</td>' +
        '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' +
          '<a href="/admin/chu-de/detail?id=' + encodeURIComponent(s.id) + '" class="ix-btn ix-btn-icon" title="Chi tiết"><i class="ti ti-file-description" style="font-size:14px"></i></a>' +
          '<a href="/admin/chu-de/mapping?id=' + encodeURIComponent(s.id) + '" class="ix-btn ix-btn-icon" title="Ánh xạ"><i class="ti ti-route" style="font-size:14px"></i></a>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function boot() {
    if (!Store) return;
    var tbody = document.getElementById('adm-story-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Đang tải…</td></tr>';
    var search = document.getElementById('adm-story-search');
    if (search) search.addEventListener('input', render);
    var btn = document.getElementById('adm-story-reload');
    if (btn) btn.addEventListener('click', function () {
      Store.loadFromApi().then(render);
    });
    Store.loadFromApi().then(render).catch(function (err) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ix-danger)">' +
          esc(err.message || 'Không tải được') + '</td></tr>';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
