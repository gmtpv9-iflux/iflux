/* ADM-MKT-006 — Formula Registry */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;
  var selectedKey = null;

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
    if (status === 'active') return '<span class="ix-chip ix-chip-success">Đang dùng</span>';
    if (status === 'draft') return '<span class="ix-chip ix-chip-warning">Nháp</span>';
    if (status === 'deprecated') return '<span class="ix-chip ix-chip-secondary">Ngưng</span>';
    return '<span class="ix-chip ix-chip-primary">' + esc(status) + '</span>';
  }

  function getFilters() {
    return {
      category: (document.getElementById('adm-mkt-formula-filter-category') || {}).value || '',
      status: (document.getElementById('adm-mkt-formula-filter-status') || {}).value || '',
      search: ((document.getElementById('adm-mkt-formula-search') || {}).value || '').trim().toLowerCase()
    };
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-mkt-formula-tbody');
    if (!tbody) return;

    var list = Store.listFormulas(getFilters());
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có công thức.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (f) {
      var active = f.key === selectedKey;
      return '<tr data-formula-key="' + esc(f.key) + '"' + (active ? ' style="background:var(--ix-accent-soft)"' : '') + '>' +
        '<td><code style="font-size:12px">' + esc(f.key) + '</code></td>' +
        '<td>' + esc(f.name) + '</td>' +
        '<td>v' + esc(f.version) + '</td>' +
        '<td>' + statusChip(f.status) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(f.updatedAt)) + '</td>' +
        '<td><button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-formula-view="' + esc(f.key) + '" title="Chi tiết"><i class="ti ti-eye" style="font-size:14px"></i></button></td>' +
      '</tr>';
    }).join('');
  }

  function renderDetail(key) {
    if (!Store || !key) return;
    var f = Store.getFormula(key);
    if (!f) return;
    selectedKey = key;

    var panel = document.getElementById('adm-mkt-formula-detail');
    if (panel) panel.style.display = '';

    var set = function (id, html) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    set('adm-mkt-formula-detail-key', '<code>' + esc(f.key) + '</code>');
    set('adm-mkt-formula-detail-name', esc(f.name));
    set('adm-mkt-formula-detail-version', 'v' + esc(f.version));
    set('adm-mkt-formula-detail-status', statusChip(f.status));
    set('adm-mkt-formula-detail-category', esc(f.category || '—'));
    set('adm-mkt-formula-detail-desc', esc(f.description || '—'));
    set('adm-mkt-formula-detail-updated', esc(fmtDate(f.updatedAt)) + (f.updatedBy ? ' · ' + esc(f.updatedBy) : ''));
    set('adm-mkt-formula-detail-text', '<pre style="margin:0;white-space:pre-wrap;font-size:12px;font-family:ui-monospace,monospace;color:var(--ix-text-secondary)">' + esc(f.formulaText || '—') + '</pre>');

    var activateBtn = document.getElementById('btn-adm-mkt-formula-activate');
    if (activateBtn) {
      activateBtn.disabled = f.status === 'active';
      activateBtn.dataset.formulaKey = f.key;
      activateBtn.hidden = false;
    }
    var recalcBtn = document.getElementById('btn-adm-mkt-formula-recalc');
    if (recalcBtn) {
      recalcBtn.dataset.formulaKey = f.key;
      recalcBtn.hidden = false;
    }

    renderTable();
  }

  function openDetailModal(key) {
    renderDetail(key);
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-formula-detail');
  }

  function apiRequest(path, options) {
    options = options || {};
    function apiBase() {
      if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
      return '/api';
    }
    function token() {
      if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
        var s = IfluxAdminAuth.getSession();
        if (s && s.token) return s.token;
      }
      return null;
    }
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: h,
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(((data.error || {}).message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) ? data.data : data;
      });
    });
  }

  function activateFormula(key) {
    if (!Store || !key) return;
    if (!confirm('Kích hoạt công thức "' + key + '"? Phiên bản hiện active cùng key sẽ chuyển sang deprecated.')) return;
    Store.setFormulaActive(key);
    renderDetail(key);
    toast('Đã kích hoạt công thức ' + key, 'success');
    apiRequest('/admin/market-config/formulas').then(function (d) {
      var list = d.formulas || [];
      var hit = list.filter(function (f) { return f.code === key || f.name === key; })[0] || list[0];
      if (!hit) return;
      return apiRequest('/admin/market-config/formulas/' + encodeURIComponent(hit.id), {
        method: 'PATCH', body: { status: 'active' }
      });
    }).catch(function () { /* local store đã OK */ });
  }

  function recalculateSelected() {
    var key = selectedKey;
    if (!key) return;
    apiRequest('/admin/market-config/formulas').then(function (d) {
      var list = d.formulas || [];
      var hit = list.filter(function (f) { return f.code === key; })[0] || list[0];
      if (!hit) throw new Error('Không tìm thấy công thức API');
      return apiRequest('/admin/market-config/formulas/' + encodeURIComponent(hit.id) + '/recalculate', {
        method: 'POST', body: {}
      });
    }).then(function () {
      toast('Đã tính lại công thức', 'success');
    }).catch(function (e) {
      toast(e.message || 'Tính lại thất bại', 'danger');
    });
  }

  function bindEvents() {
    ['adm-mkt-formula-filter-category', 'adm-mkt-formula-filter-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', renderTable);
    });
    var search = document.getElementById('adm-mkt-formula-search');
    if (search) search.addEventListener('input', renderTable);

    var activateBtn = document.getElementById('btn-adm-mkt-formula-activate');
    if (activateBtn) {
      activateBtn.addEventListener('click', function () {
        activateFormula(activateBtn.dataset.formulaKey);
      });
    }
    var recalcBtn = document.getElementById('btn-adm-mkt-formula-recalc');
    if (recalcBtn) {
      recalcBtn.addEventListener('click', recalculateSelected);
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-adm-mkt-formula-view]');
      if (!btn) return;
      e.preventDefault();
      var key = btn.getAttribute('data-adm-mkt-formula-view');
      if (document.getElementById('modal-formula-detail')) {
        openDetailModal(key);
      } else {
        renderDetail(key);
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
    var first = Store.listFormulas({})[0];
    if (first && document.getElementById('adm-mkt-formula-detail')) renderDetail(first.key);
  }

  global.AdmMarketFormulas = { init: init, refresh: renderTable, showDetail: renderDetail };
})(window);
