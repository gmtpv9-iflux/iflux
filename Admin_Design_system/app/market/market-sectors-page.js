/* ADM-MKT-003 — Sector Management */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;
  var editingId = null;
  var inlineEditId = null;

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

  function countStocks(sectorId) {
    if (!Store) return 0;
    return Store.listStocks({ sectorId: String(sectorId) }).length;
  }

  function statusChip(active) {
    return active
      ? '<span class="ix-chip ix-chip-success">Hoạt động</span>'
      : '<span class="ix-chip ix-chip-secondary">Tắt</span>';
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-mkt-sector-tbody');
    if (!tbody) return;

    var search = ((document.getElementById('adm-mkt-sector-search') || {}).value || '').trim().toLowerCase();
    var list = Store.listSectors().filter(function (s) {
      if (!search) return true;
      return (s.name || '').toLowerCase().indexOf(search) >= 0;
    });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có ngành.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (sec) {
      var active = sec.status === 'active';
      var isInline = inlineEditId === sec.id;
      var divisorCell = isInline
        ? '<input type="number" class="ix-input" style="width:80px" id="adm-mkt-sector-inline-' + sec.id + '" value="' + esc(sec.divisor) + '" min="1" max="99" />' +
          ' <button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-adm-mkt-sector-inline-save="' + sec.id + '"><i class="ti ti-check"></i></button>' +
          ' <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-mkt-sector-inline-cancel="' + sec.id + '"><i class="ti ti-x"></i></button>'
        : '<span style="font-weight:600">' + esc(sec.divisor) + '</span> ' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-inline-edit="' + sec.id + '" title="Sửa divisor"><i class="ti ti-pencil" style="font-size:13px"></i></button>';

      return '<tr data-sector-id="' + esc(sec.id) + '">' +
        '<td><strong>' + esc(sec.name) + '</strong></td>' +
        '<td>' + countStocks(sec.id) + '</td>' +
        '<td>' + divisorCell + '</td>' +
        '<td>' + statusChip(active) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(sec.updatedAt)) + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-edit="' + sec.id + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-toggle="' + sec.id + '" title="' + (active ? 'Tắt' : 'Bật') + '"><i class="ti ti-' + (active ? 'toggle-right' : 'toggle-left') + '" style="font-size:14px"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function resetModal() {
    editingId = null;
    var nameEl = document.getElementById('adm-mkt-sector-name');
    var divEl = document.getElementById('adm-mkt-sector-divisor');
    var statusEl = document.getElementById('adm-mkt-sector-status');
    if (nameEl) nameEl.value = '';
    if (divEl) divEl.value = '8';
    if (statusEl) statusEl.value = 'active';
    var title = document.getElementById('adm-mkt-sector-modal-title');
    if (title) title.textContent = 'Thêm ngành';
  }

  function openModal(id) {
    resetModal();
    if (id && id !== 'new') {
      var sec = Store.getSector(Number(id));
      if (!sec) {
        toast('Không tìm thấy ngành', 'danger');
        return;
      }
      editingId = sec.id;
      var nameEl = document.getElementById('adm-mkt-sector-name');
      var divEl = document.getElementById('adm-mkt-sector-divisor');
      var statusEl = document.getElementById('adm-mkt-sector-status');
      if (nameEl) nameEl.value = sec.name || '';
      if (divEl) divEl.value = sec.divisor || 8;
      if (statusEl) statusEl.value = sec.status || 'active';
      var title = document.getElementById('adm-mkt-sector-modal-title');
      if (title) title.textContent = 'Sửa ngành';
    }
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-sector-form');
  }

  function saveModal() {
    if (!Store) return;
    var name = ((document.getElementById('adm-mkt-sector-name') || {}).value || '').trim();
    var divisor = Number((document.getElementById('adm-mkt-sector-divisor') || {}).value);
    var status = (document.getElementById('adm-mkt-sector-status') || {}).value || 'active';

    if (!name) {
      toast('Tên ngành là bắt buộc', 'danger');
      return;
    }
    if (!divisor || divisor < 1) {
      toast('Divisor phải ≥ 1', 'danger');
      return;
    }

    Store.upsertSector({ id: editingId || undefined, name: name, divisor: divisor, status: status });
    if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-sector-form');
    renderTable();
    toast(editingId ? 'Đã cập nhật ngành' : 'Đã thêm ngành mới', 'success');
    editingId = null;
  }

  function saveInline(id) {
    var input = document.getElementById('adm-mkt-sector-inline-' + id);
    if (!input) return;
    var divisor = Number(input.value);
    if (!divisor || divisor < 1) {
      toast('Divisor phải ≥ 1', 'danger');
      return;
    }
    Store.upsertSector({ id: Number(id), divisor: divisor });
    inlineEditId = null;
    renderTable();
    toast('Đã cập nhật divisor', 'success');
  }

  function bindEvents() {
    var addBtn = document.getElementById('btn-adm-mkt-sector-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });

    var saveBtn = document.getElementById('btn-adm-mkt-sector-save');
    if (saveBtn) saveBtn.addEventListener('click', saveModal);

    var search = document.getElementById('adm-mkt-sector-search');
    if (search) search.addEventListener('input', renderTable);

    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-adm-mkt-sector-edit]');
      if (editBtn) {
        e.preventDefault();
        openModal(editBtn.getAttribute('data-adm-mkt-sector-edit'));
        return;
      }
      var toggleBtn = e.target.closest('[data-adm-mkt-sector-toggle]');
      if (toggleBtn) {
        e.preventDefault();
        Store.toggleSector(Number(toggleBtn.getAttribute('data-adm-mkt-sector-toggle')));
        renderTable();
        toast('Đã đổi trạng thái ngành', 'success');
        return;
      }
      var inlineEdit = e.target.closest('[data-adm-mkt-sector-inline-edit]');
      if (inlineEdit) {
        e.preventDefault();
        inlineEditId = Number(inlineEdit.getAttribute('data-adm-mkt-sector-inline-edit'));
        renderTable();
        var inp = document.getElementById('adm-mkt-sector-inline-' + inlineEditId);
        if (inp) inp.focus();
        return;
      }
      var inlineSave = e.target.closest('[data-adm-mkt-sector-inline-save]');
      if (inlineSave) {
        e.preventDefault();
        saveInline(Number(inlineSave.getAttribute('data-adm-mkt-sector-inline-save')));
        return;
      }
      var inlineCancel = e.target.closest('[data-adm-mkt-sector-inline-cancel]');
      if (inlineCancel) {
        e.preventDefault();
        inlineEditId = null;
        renderTable();
      }
    });
  }

  function init() {
    if (!Store) {
      toast('Thiếu IfluxMarketRegistryStore', 'danger');
      return;
    }
    renderTable();
    bindEvents();
  }

  global.AdmMarketSectors = { init: init, refresh: renderTable };
})(window);
