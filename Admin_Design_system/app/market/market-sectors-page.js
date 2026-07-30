/* ADM-MKT-003 — Sector Management (Phase C5 · API + RBAC) */
(function (global) {
  'use strict';

  var items = [];
  var editingId = null;
  var inlineEditId = null;
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
      var isInline = inlineEditId === sec.id;
      var canEdit = canPerm('market.sectors.edit');
      var canDelete = canPerm('market.sectors.delete');

      var divisorCell = isInline && canEdit
        ? '<input type="number" class="ix-input" style="width:80px" id="adm-mkt-sector-inline-' + sec.id + '" value="' + esc(sec.divisor) + '" min="1" max="99" />' +
          ' <button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-adm-mkt-sector-inline-save="' + sec.id + '"><i class="ti ti-check"></i></button>' +
          ' <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-mkt-sector-inline-cancel="' + sec.id + '"><i class="ti ti-x"></i></button>'
        : '<span style="font-weight:600">' + esc(sec.divisor) + '</span> ' +
          (canEdit
            ? '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-inline-edit="' + sec.id + '" title="Sửa divisor"><i class="ti ti-pencil" style="font-size:13px"></i></button>'
            : '');

      var actions = '';
      if (canEdit) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-edit="' + sec.id + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>';
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-toggle="' + sec.id + '" title="' + (active ? 'Tắt' : 'Bật') + '"><i class="ti ti-' + (active ? 'toggle-right' : 'toggle-left') + '" style="font-size:14px"></i></button>';
      }
      if (canDelete) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-sector-del="' + sec.id + '" title="Xóa"><i class="ti ti-trash" style="font-size:14px"></i></button>';
      }

      return '<tr data-sector-id="' + esc(sec.id) + '">' +
        '<td><strong>' + esc(sec.name || sec.name_vi) + '</strong><div class="ix-caption">' + esc(sec.code || '') + '</div></td>' +
        '<td>' + esc(sec.stock_count || 0) + '</td>' +
        '<td>' + divisorCell + '</td>' +
        '<td>' + statusChip(active) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(sec.updated_at)) + '</td>' +
        '<td><div style="display:flex;gap:4px">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
  }

  function resetModal() {
    editingId = null;
    var nameEl = document.getElementById('adm-mkt-sector-name');
    var divEl = document.getElementById('adm-mkt-sector-divisor');
    var statusEl = document.getElementById('adm-mkt-sector-status');
    if (nameEl) nameEl.value = '';
    if (divEl) divEl.value = '5';
    if (statusEl) statusEl.value = 'active';
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
      var divEl = document.getElementById('adm-mkt-sector-divisor');
      var statusEl = document.getElementById('adm-mkt-sector-status');
      if (nameEl) nameEl.value = sec.name || sec.name_vi || '';
      if (divEl) divEl.value = sec.divisor || 5;
      if (statusEl) statusEl.value = sec.status || (sec.is_active ? 'active' : 'inactive');
      var title = document.getElementById('adm-mkt-sector-modal-title');
      if (title) title.textContent = 'Sửa ngành';
    }
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-sector-form');
  }

  function saveModal() {
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

    var body = { name: name, divisor: divisor, status: status };
    var req = editingId
      ? request('/admin/sectors/' + encodeURIComponent(editingId), { method: 'PATCH', body: body })
      : request('/admin/sectors', { method: 'POST', body: body });

    req.then(function () {
      if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-sector-form');
      toast(editingId ? 'Đã cập nhật ngành' : 'Đã thêm ngành mới', 'success');
      editingId = null;
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function saveInline(id) {
    var input = document.getElementById('adm-mkt-sector-inline-' + id);
    if (!input) return;
    var divisor = Number(input.value);
    if (!divisor || divisor < 1) {
      toast('Divisor phải ≥ 1', 'danger');
      return;
    }
    request('/admin/sectors/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: { divisor: divisor }
    }).then(function () {
      inlineEditId = null;
      toast('Đã cập nhật divisor', 'success');
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Cập nhật thất bại', 'danger');
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

    var search = document.getElementById('adm-mkt-sector-search');
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadList, 250);
      });
    }

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
    bindEvents();
    loadList();
  }

  global.AdmMarketSectors = { init: init, refresh: loadList };
})(window);
