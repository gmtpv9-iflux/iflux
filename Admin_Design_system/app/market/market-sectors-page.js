/* ADM-MKT-003 — Sector Management (Phase C5 · API + RBAC) */
(function (global) {
  'use strict';

  var items = [];
  var editingId = null;
  var stocksSectorId = null;
  var searchTimer = null;

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function adminToken() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = adminToken();
    if (token) {
      h.Authorization = 'Bearer ' + token;
      return h;
    }
    var key = 'iflux-admin-local-dev';
    try {
      var stored = localStorage.getItem('iflux_admin_api_key');
      if (stored) key = stored;
    } catch (e) { /* ignore */ }
    h['X-Admin-Key'] = key;
    return h;
  }

  function unwrap(data) {
    if (data && data.data) return data.data;
    return data || {};
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = data.error;
          var msg = (err && err.message) || (typeof err === 'string' ? err : null) || data.message || ('HTTP ' + res.status);
          throw new Error(msg);
        }
        return unwrap(data);
      });
    });
  }

  function statusChip(active) {
    return active
      ? '<span class="ix-chip ix-chip-success">Hoạt động</span>'
      : '<span class="ix-chip ix-chip-secondary">Tắt</span>';
  }

  function renderTable() {
    var tbody = document.getElementById('adm-mkt-sector-tbody');
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="ix-caption" style="text-align:center;padding:32px">Chưa có ngành.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(function (sec) {
      var active = sec.status === 'active' || sec.is_active;
      var canEdit = canPerm('market.sectors.edit');
      var canDelete = canPerm('market.sectors.delete');

      var actions = '';
      if (canEdit) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-stocks="' + sec.id + '" title="Thêm cổ phiếu"><i class="ti ti-list-details" style="font-size:14px"></i></button>';
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-edit="' + sec.id + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>';
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-toggle="' + sec.id + '" title="' + (active ? 'Tắt' : 'Bật') + '"><i class="ti ti-' + (active ? 'toggle-right' : 'toggle-left') + '" style="font-size:14px"></i></button>';
      }
      if (canDelete) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-del="' + sec.id + '" title="Xóa"><i class="ti ti-trash" style="font-size:14px"></i></button>';
      }

      return '<tr data-sector-id="' + esc(sec.id) + '">' +
        '<td><strong>' + esc(sec.name || sec.name_vi) + '</strong><div class="ix-caption">' + esc(sec.code || '') + '</div></td>' +
        '<td>' + esc(sec.stock_count || 0) + '</td>' +
        '<td>' + esc(sec.post_count || 0) + '</td>' +
        '<td>' + statusChip(active) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(sec.updated_at)) + '</td>' +
        '<td><div style="display:flex;gap:4px">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
  }

  function resetModal() {
    editingId = null;
    var nameEl = document.getElementById('adm-mkt-sector-name');
    var statusEl = document.getElementById('adm-mkt-sector-status');
    var descEl = document.getElementById('adm-mkt-sector-desc');
    if (nameEl) nameEl.value = '';
    if (statusEl) statusEl.value = 'active';
    if (descEl) descEl.value = '';
    var title = document.getElementById('adm-mkt-sector-modal-title');
    if (title) title.textContent = 'Thêm ngành';
  }

  function openModal(id) {
    resetModal();
    if (id && id !== 'new') {
      var sec = items.filter(function (x) { return String(x.id) === String(id); })[0];
      if (!sec) {
        toast('Không tìm thấy ngành', 'danger');
        return;
      }
      editingId = sec.id;
      var nameEl = document.getElementById('adm-mkt-sector-name');
      var statusEl = document.getElementById('adm-mkt-sector-status');
      var descEl = document.getElementById('adm-mkt-sector-desc');
      if (nameEl) nameEl.value = sec.name || sec.name_vi || '';
      if (statusEl) statusEl.value = sec.status || (sec.is_active ? 'active' : 'inactive');
      if (descEl) descEl.value = sec.description || '';
      var title = document.getElementById('adm-mkt-sector-modal-title');
      if (title) title.textContent = 'Sửa ngành';
    }
    if (typeof global.ixOpenOffcanvas === 'function') global.ixOpenOffcanvas('offcanvas-sector-form');
  }

  function openStocksDrawer(id) {
    var sec = items.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!sec) {
      toast('Không tìm thấy ngành', 'danger');
      return;
    }
    stocksSectorId = sec.id;
    var title = document.getElementById('adm-mkt-sector-stocks-title');
    if (title) title.textContent = 'Cổ phiếu · ' + (sec.name || sec.name_vi || '');
    var ta = document.getElementById('adm-mkt-sector-tickers');
    if (ta) ta.value = (sec.tickers || []).join(', ');
    if (typeof global.ixOpenOffcanvas === 'function') {
      global.ixOpenOffcanvas('offcanvas-sector-stocks');
    }
  }

  function parseTickers(raw) {
    return String(raw || '')
      .split(/[\s,;]+/)
      .map(function (t) { return t.trim().toUpperCase(); })
      .filter(Boolean);
  }

  function saveStocks() {
    if (!stocksSectorId) return;
    var tickers = parseTickers((document.getElementById('adm-mkt-sector-tickers') || {}).value);
    request('/admin/sectors/' + encodeURIComponent(stocksSectorId) + '/tickers', {
      method: 'PUT',
      body: { tickers: tickers }
    }).then(function (data) {
      var missing = (data.sync && data.sync.missing) || [];
      if (missing.length) {
        toast('Đã lưu. Mã chưa có trong Master: ' + missing.join(', '), 'warning');
      } else {
        toast('Đã cập nhật danh sách mã ngành', 'success');
      }
      if (typeof global.ixCloseOffcanvas === 'function') global.ixCloseOffcanvas('offcanvas-sector-stocks');
      stocksSectorId = null;
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu danh sách mã thất bại', 'danger');
    });
  }

  function saveModal() {
    var name = ((document.getElementById('adm-mkt-sector-name') || {}).value || '').trim();
    var status = (document.getElementById('adm-mkt-sector-status') || {}).value || 'active';
    var description = ((document.getElementById('adm-mkt-sector-desc') || {}).value || '').trim();

    if (!name) {
      toast('Tên ngành là bắt buộc', 'danger');
      return;
    }

    var body = { name: name, status: status, description: description };
    var req = editingId
      ? request('/admin/sectors/' + encodeURIComponent(editingId), { method: 'PATCH', body: body })
      : request('/admin/sectors', { method: 'POST', body: body });

    req.then(function () {
      if (typeof global.ixCloseOffcanvas === 'function') global.ixCloseOffcanvas('offcanvas-sector-form');
      toast(editingId ? 'Đã cập nhật ngành' : 'Đã thêm ngành mới', 'success');
      editingId = null;
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function loadList() {
    var q = ((document.getElementById('adm-mkt-sector-search') || {}).value || '').trim();
    var qs = q ? ('?q=' + encodeURIComponent(q)) : '';
    return request('/admin/sectors' + qs).then(function (data) {
      items = data.sectors || [];
      renderTable();
    }).catch(function (e) {
      toast(e.message || 'Không tải được danh sách ngành', 'danger');
      items = [];
      renderTable();
    });
  }

  function bindEvents() {
    var addBtn = document.getElementById('btn-adm-mkt-sector-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });

    var saveBtn = document.getElementById('btn-adm-mkt-sector-save');
    if (saveBtn) saveBtn.addEventListener('click', saveModal);
    var stocksSave = document.getElementById('btn-adm-mkt-sector-stocks-save');
    if (stocksSave) stocksSave.addEventListener('click', saveStocks);

    var search = document.getElementById('adm-mkt-sector-search');
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadList, 250);
      });
    }

    document.addEventListener('click', function (e) {
      var stocksBtn = e.target.closest('[data-adm-mkt-sector-stocks]');
      if (stocksBtn) {
        e.preventDefault();
        openStocksDrawer(stocksBtn.getAttribute('data-adm-mkt-sector-stocks'));
        return;
      }
      var editBtn = e.target.closest('[data-adm-mkt-sector-edit]');
      if (editBtn) {
        e.preventDefault();
        openModal(editBtn.getAttribute('data-adm-mkt-sector-edit'));
        return;
      }
      var toggleBtn = e.target.closest('[data-adm-mkt-sector-toggle]');
      if (toggleBtn) {
        e.preventDefault();
        var tid = toggleBtn.getAttribute('data-adm-mkt-sector-toggle');
        var cur = items.filter(function (x) { return String(x.id) === String(tid); })[0];
        if (!cur) return;
        var next = (cur.status === 'active' || cur.is_active) ? 'inactive' : 'active';
        request('/admin/sectors/' + encodeURIComponent(tid), {
          method: 'PATCH',
          body: { status: next }
        }).then(function () {
          toast('Đã đổi trạng thái ngành', 'success');
          loadList();
        }).catch(function (err) {
          toast(err.message || 'Đổi trạng thái thất bại', 'danger');
        });
        return;
      }
      var delBtn = e.target.closest('[data-adm-mkt-sector-del]');
      if (delBtn) {
        e.preventDefault();
        var did = delBtn.getAttribute('data-adm-mkt-sector-del');
        if (!confirm('Xóa ngành này? Không hoàn tác.')) return;
        request('/admin/sectors/' + encodeURIComponent(did), { method: 'DELETE' })
          .then(function () {
            toast('Đã xóa ngành', 'success');
            loadList();
          })
          .catch(function (err) {
            toast(err.message || 'Xóa thất bại', 'danger');
          });
        return;
      }
    });
  }

  function init() {
    bindEvents();
    loadList();
  }

  global.AdmMarketSectors = { init: init, refresh: loadList };
})(window);
