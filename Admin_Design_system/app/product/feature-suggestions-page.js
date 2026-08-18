/* ADM-FEAT-001 — Quản trị đề xuất tính năng */
(function (global) {
  'use strict';

  var Store = global.IfluxFeatureSuggestionsStore;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function statusChip(status) {
    var meta = Store.STATUS_META[status];
    if (!meta) return esc(status);
    return '<span class="ix-chip ix-chip-' + meta.color + '">' + esc(meta.label) + '</span>';
  }

  function getFilters() {
    return {
      keyword: ((document.getElementById('adm-feat-search') || {}).value || '').trim().toLowerCase(),
      status: (document.getElementById('adm-feat-status') || {}).value || ''
    };
  }

  function renderStats() {
    if (!Store) return;
    var st = Store.stats();
    var el = document.getElementById('adm-feat-stats');
    if (!el) return;
    el.innerHTML =
      '<div class="ix-stat-card"><div><div class="ix-stat-label">Tổng đề xuất</div><div class="ix-stat-value">' + st.total + '</div></div></div>' +
      '<div class="ix-stat-card"><div><div class="ix-stat-label">Lượt ủng hộ</div><div class="ix-stat-value">' + st.totalVotes + '</div></div></div>' +
      '<div class="ix-stat-card"><div><div class="ix-stat-label">Đề xuất mới</div><div class="ix-stat-value">' + (st.byStatus.new || 0) + '</div></div></div>' +
      '<div class="ix-stat-card"><div><div class="ix-stat-label">Đang phát triển</div><div class="ix-stat-value">' + (st.byStatus.developing || 0) + '</div></div></div>';
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-feat-tbody');
    if (!tbody) return;

    var filters = getFilters();
    var list = Store.list({ status: filters.status || undefined, keyword: filters.keyword || undefined });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có đề xuất phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (item, idx) {
      var statusOpts = Store.STATUS_ORDER.map(function (k) {
        return '<option value="' + k + '"' + (item.status === k ? ' selected' : '') + '>' +
          esc(Store.STATUS_META[k].label) + '</option>';
      }).join('');

      return '<tr>' +
        '<td style="font-weight:600;color:var(--ix-text-muted);width:36px">' + (idx + 1) + '</td>' +
        '<td><div style="font-weight:600;color:var(--ix-text-primary)">' + esc(item.title) + '</div>' +
          '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:4px;line-height:1.45;max-width:420px">' + esc(item.description) + '</div></td>' +
        '<td style="text-align:center"><span class="ix-chip ix-chip-primary" style="font-size:13px;font-weight:700">' + (item.voteCount || 0) + '</span></td>' +
        '<td>' + statusChip(item.status) + '</td>' +
        '<td>' + esc(item.createdBy && item.createdBy.name) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(item.createdAt)) + '</td>' +
        '<td><select class="ix-select ix-select-sm" data-adm-feat-status="' + esc(item.id) + '" style="min-width:160px">' + statusOpts + '</select></td>' +
      '</tr>';
    }).join('');
  }

  function bindEvents() {
    var search = document.getElementById('adm-feat-search');
    var statusFilter = document.getElementById('adm-feat-status');
    if (search) search.addEventListener('input', function () { renderTable(); });
    if (statusFilter) statusFilter.addEventListener('change', function () { renderTable(); });

    document.addEventListener('change', function (e) {
      var sel = e.target.closest('[data-adm-feat-status]');
      if (!sel || !Store) return;
      var id = sel.getAttribute('data-adm-feat-status');
      var status = sel.value;
      try {
        Store.setStatus(id, status);
        renderTable();
        renderStats();
        toast('Đã cập nhật trạng thái', 'success');
      } catch (err) {
        toast(err.message || 'Cập nhật thất bại', 'danger');
      }
    });

    document.addEventListener('iflux-feature-suggestions-changed', function () {
      renderTable();
      renderStats();
    });
  }

  function init() {
    if (!Store) { toast('Thiếu IfluxFeatureSuggestionsStore', 'danger'); return; }
    renderStats();
    renderTable();
    bindEvents();
  }

  global.AdmFeatureSuggestions = { init: init, refresh: renderTable };
})(window);
