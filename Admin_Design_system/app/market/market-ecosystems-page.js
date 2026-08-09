/* ADM-MKT-001 — Hệ sinh thái (Phase C6 · API + RBAC) */
(function (global) {
  'use strict';

  var items = [];
  var editingId = null;
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

  function parseTickers(raw) {
    return String(raw || '').split(/[,;\s]+/).map(function (t) {
      return t.trim().toUpperCase();
    }).filter(Boolean);
  }

  function renderTable() {
    var tbody = document.getElementById('adm-mkt-eco-tbody');
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="ix-caption" style="text-align:center;padding:32px">Chưa có hệ sinh thái.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(function (eco) {
      var active = eco.status === 'active' || eco.is_active;
      var canEdit = canPerm('market.ecosystems.edit');
      var canDelete = canPerm('market.ecosystems.delete');
      var canActivate = canPerm('market.ecosystems.status_active');
      var canDeactivate = canPerm('market.ecosystems.status_inactive');
      var canToggle = active ? canDeactivate : canActivate;

      var actions = '';
      if (canEdit) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-eco-edit="' + esc(eco.id) + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>';
      }
      if (canToggle || canEdit) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-eco-toggle="' + esc(eco.id) + '" title="' + (active ? 'Tắt' : 'Bật') + '"><i class="ti ti-' + (active ? 'toggle-right' : 'toggle-left') + '" style="font-size:14px"></i></button>';
      }
      if (canDelete) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-eco-del="' + esc(eco.id) + '" title="Xóa"><i class="ti ti-trash" style="font-size:14px"></i></button>';
      }

      return '<tr data-eco-id="' + esc(eco.id) + '">' +
        '<td><strong>' + esc(eco.name || eco.name_vi) + '</strong><div class="ix-caption">' + esc(eco.code || '') + '</div></td>' +
        '<td>' + esc(eco.stock_count || (eco.tickers || []).length || 0) + ' mã</td>' +
        '<td>' + esc(eco.post_count || 0) + ' bài</td>' +
        '<td>' + statusChip(active) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(eco.updated_at)) + '</td>' +
        '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
  }

  function resetModal() {
    editingId = null;
    var nameEl = document.getElementById('adm-mkt-eco-name');
    var tickersEl = document.getElementById('adm-mkt-eco-tickers');
    var statusEl = document.getElementById('adm-mkt-eco-status');
    var descEl = document.getElementById('adm-mkt-eco-desc');
    if (nameEl) nameEl.value = '';
    if (tickersEl) tickersEl.value = '';
    if (statusEl) statusEl.value = 'active';
    if (descEl) descEl.value = '';
    var title = document.getElementById('adm-mkt-eco-modal-title');
    if (title) title.textContent = 'Thêm hệ sinh thái';
  }

  function openModal(id) {
    resetModal();
    if (id && id !== 'new') {
      var eco = items.filter(function (x) { return String(x.id) === String(id); })[0];
      if (!eco) {
        toast('Không tìm thấy hệ sinh thái', 'danger');
        return;
      }
      editingId = eco.id;
      var nameEl = document.getElementById('adm-mkt-eco-name');
      var tickersEl = document.getElementById('adm-mkt-eco-tickers');
      var statusEl = document.getElementById('adm-mkt-eco-status');
      var descEl = document.getElementById('adm-mkt-eco-desc');
      if (nameEl) nameEl.value = eco.name || eco.name_vi || '';
      if (tickersEl) tickersEl.value = (eco.tickers || []).join(', ');
      if (statusEl) statusEl.value = eco.status || (eco.is_active ? 'active' : 'inactive');
      if (descEl) descEl.value = eco.description || '';
      var title = document.getElementById('adm-mkt-eco-modal-title');
      if (title) title.textContent = 'Sửa hệ sinh thái';
    }
    if (typeof global.ixOpenOffcanvas === 'function') global.ixOpenOffcanvas('offcanvas-eco-form');
  }

  function saveModal() {
    var name = ((document.getElementById('adm-mkt-eco-name') || {}).value || '').trim();
    var tickers = parseTickers((document.getElementById('adm-mkt-eco-tickers') || {}).value);
    var status = (document.getElementById('adm-mkt-eco-status') || {}).value || 'active';
    var description = ((document.getElementById('adm-mkt-eco-desc') || {}).value || '').trim();

    if (!name) {
      toast('Tên hệ sinh thái là bắt buộc', 'danger');
      return;
    }

    var body = {
      name: name,
      tickers: tickers,
      status: status,
      description: description
    };
    var req = editingId
      ? request('/admin/ecosystems/' + encodeURIComponent(editingId), { method: 'PATCH', body: body })
      : request('/admin/ecosystems', { method: 'POST', body: body });

    req.then(function () {
      if (typeof global.ixCloseOffcanvas === 'function') global.ixCloseOffcanvas('offcanvas-eco-form');
      toast(editingId ? 'Đã cập nhật hệ sinh thái' : 'Đã thêm hệ sinh thái', 'success');
      editingId = null;
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function loadList() {
    var q = ((document.getElementById('adm-mkt-eco-search') || {}).value || '').trim();
    var status = ((document.getElementById('adm-mkt-eco-filter-status') || {}).value || '').trim();
    var qs = [];
    if (q) qs.push('q=' + encodeURIComponent(q));
    if (status) qs.push('status=' + encodeURIComponent(status));
    var path = '/admin/ecosystems' + (qs.length ? ('?' + qs.join('&')) : '');
    return request(path).then(function (data) {
      items = data.ecosystems || [];
      renderTable();
    }).catch(function (e) {
      toast(e.message || 'Không tải được hệ sinh thái', 'danger');
      items = [];
      renderTable();
    });
  }

  function bindEvents() {
    var addBtn = document.getElementById('btn-adm-mkt-eco-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });

    var saveBtn = document.getElementById('btn-adm-mkt-eco-save');
    if (saveBtn) saveBtn.addEventListener('click', saveModal);

    var statusFilter = document.getElementById('adm-mkt-eco-filter-status');
    if (statusFilter) statusFilter.addEventListener('change', loadList);

    var search = document.getElementById('adm-mkt-eco-search');
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadList, 250);
      });
    }

    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-adm-mkt-eco-edit]');
      if (editBtn) {
        e.preventDefault();
        openModal(editBtn.getAttribute('data-adm-mkt-eco-edit'));
        return;
      }
      var toggleBtn = e.target.closest('[data-adm-mkt-eco-toggle]');
      if (toggleBtn) {
        e.preventDefault();
        var tid = toggleBtn.getAttribute('data-adm-mkt-eco-toggle');
        var cur = items.filter(function (x) { return String(x.id) === String(tid); })[0];
        if (!cur) return;
        var active = cur.status === 'active' || cur.is_active;
        var next = active ? 'inactive' : 'active';
        var path = '/admin/ecosystems/' + encodeURIComponent(tid);
        request(path, { method: 'PATCH', body: { status: next } })
          .then(function () {
            toast(active ? 'Đã tắt hệ sinh thái' : 'Đã bật hệ sinh thái', 'success');
            loadList();
          })
          .catch(function (err) {
            toast(err.message || 'Đổi trạng thái thất bại', 'danger');
          });
        return;
      }
      var delBtn = e.target.closest('[data-adm-mkt-eco-del]');
      if (delBtn) {
        e.preventDefault();
        var did = delBtn.getAttribute('data-adm-mkt-eco-del');
        if (!confirm('Xóa hệ sinh thái này? Không hoàn tác.')) return;
        request('/admin/ecosystems/' + encodeURIComponent(did), { method: 'DELETE' })
          .then(function () {
            toast('Đã xóa hệ sinh thái', 'success');
            loadList();
          })
          .catch(function (err) {
            toast(err.message || 'Xóa thất bại', 'danger');
          });
      }
    });
  }

  function init() {
    bindEvents();
    loadList();
  }

  global.AdmMarketEcosystems = { init: init, refresh: loadList };
})(window);
