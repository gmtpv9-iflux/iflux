/* ADM-MKT-001 — Ecosystem CMS */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;
  var editingId = null;

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

  function statusChip(active) {
    return active
      ? '<span class="ix-chip ix-chip-success">Đang hoạt động</span>'
      : '<span class="ix-chip ix-chip-secondary">Tắt</span>';
  }

  function getFilters() {
    return {
      status: (document.getElementById('adm-mkt-eco-filter-status') || {}).value || '',
      search: ((document.getElementById('adm-mkt-eco-search') || {}).value || '').trim().toLowerCase()
    };
  }

  function matchesFilters(eco, f) {
    var active = eco.status === 'active';
    if (f.status === 'active' && !active) return false;
    if (f.status === 'inactive' && active) return false;
    if (f.search) {
      var hay = (eco.name + ' ' + (eco.tickers || []).join(' ')).toLowerCase();
      if (hay.indexOf(f.search) < 0) return false;
    }
    return true;
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-mkt-eco-tbody');
    if (!tbody) return;

    var f = getFilters();
    var list = Store.listEcosystems().filter(function (eco) { return matchesFilters(eco, f); });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có họ cổ phiếu.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (eco) {
      var members = (eco.tickers || []).length;
      var divisor = eco.divisor != null ? eco.divisor : members;
      var active = eco.status === 'active';
      return '<tr data-eco-id="' + esc(eco.id) + '">' +
        '<td><strong style="color:var(--ix-text-primary)">' + esc(eco.name) + '</strong></td>' +
        '<td>' + members + ' mã</td>' +
        '<td>' + divisor + '</td>' +
        '<td>' + statusChip(active) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(eco.updatedAt)) + '</td>' +
        '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' +
          '<a href="detail.html?id=' + encodeURIComponent(eco.id) + '" class="ix-btn ix-btn-icon" title="Chi tiết thành viên"><i class="ti ti-users" style="font-size:14px"></i></a>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-eco-edit="' + esc(eco.id) + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-eco-toggle="' + esc(eco.id) + '" title="' + (active ? 'Tắt' : 'Bật') + '"><i class="ti ti-' + (active ? 'toggle-right' : 'toggle-left') + '" style="font-size:14px"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function resetForm() {
    editingId = null;
    var nameEl = document.getElementById('adm-mkt-eco-name');
    var tickersEl = document.getElementById('adm-mkt-eco-tickers');
    var statusEl = document.getElementById('adm-mkt-eco-status');
    if (nameEl) nameEl.value = '';
    if (tickersEl) tickersEl.value = '';
    if (statusEl) statusEl.value = 'active';
    var title = document.getElementById('adm-mkt-eco-modal-title');
    if (title) title.textContent = 'Thêm họ cổ phiếu';
  }

  function openForm(id) {
    resetForm();
    if (id && id !== 'new') {
      var eco = Store.getEcosystem(id);
      if (!eco) {
        toast('Không tìm thấy họ CP', 'danger');
        return;
      }
      editingId = id;
      var nameEl = document.getElementById('adm-mkt-eco-name');
      var tickersEl = document.getElementById('adm-mkt-eco-tickers');
      var statusEl = document.getElementById('adm-mkt-eco-status');
      if (nameEl) nameEl.value = eco.name || '';
      if (tickersEl) tickersEl.value = (eco.tickers || []).join(', ');
      if (statusEl) statusEl.value = eco.status || 'active';
      var title = document.getElementById('adm-mkt-eco-modal-title');
      if (title) title.textContent = 'Sửa họ cổ phiếu';
    }
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-eco-form');
  }

  function parseTickers(raw) {
    return String(raw || '').split(/[,;\s]+/).map(function (t) {
      return t.trim().toUpperCase();
    }).filter(Boolean);
  }

  function saveForm() {
    if (!Store) return;
    var name = ((document.getElementById('adm-mkt-eco-name') || {}).value || '').trim();
    var tickers = parseTickers((document.getElementById('adm-mkt-eco-tickers') || {}).value);
    var status = (document.getElementById('adm-mkt-eco-status') || {}).value || 'active';

    if (!name) {
      toast('Tên họ là bắt buộc', 'danger');
      return;
    }
    if (!tickers.length) {
      toast('Cần ít nhất một mã thành viên', 'danger');
      return;
    }

    var payload = {
      id: editingId || undefined,
      name: name,
      tickers: tickers,
      status: status,
      divisor: tickers.length
    };

    Store.upsertEcosystem(payload);
    if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-eco-form');
    renderTable();
    toast(editingId ? 'Đã cập nhật họ CP' : 'Đã thêm họ CP mới', 'success');
    editingId = null;
  }

  function toggleEco(id) {
    if (!Store) return;
    var eco = Store.getEcosystem(id);
    if (!eco) return;
    Store.toggleEcosystem(id);
    renderTable();
    toast(eco.status === 'active' ? 'Đã tắt họ CP' : 'Đã bật họ CP', 'success');
  }

  function bindEvents() {
    var addBtn = document.getElementById('btn-adm-mkt-eco-add');
    if (addBtn) addBtn.addEventListener('click', function () { openForm('new'); });

    var saveBtn = document.getElementById('btn-adm-mkt-eco-save');
    if (saveBtn) saveBtn.addEventListener('click', saveForm);

    ['adm-mkt-eco-filter-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', renderTable);
    });
    var search = document.getElementById('adm-mkt-eco-search');
    if (search) search.addEventListener('input', renderTable);

    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-adm-mkt-eco-edit]');
      if (editBtn) {
        e.preventDefault();
        openForm(editBtn.getAttribute('data-adm-mkt-eco-edit'));
        return;
      }
      var toggleBtn = e.target.closest('[data-adm-mkt-eco-toggle]');
      if (toggleBtn) {
        e.preventDefault();
        toggleEco(toggleBtn.getAttribute('data-adm-mkt-eco-toggle'));
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

  global.AdmMarketEcosystems = { init: init, refresh: renderTable };
})(window);
