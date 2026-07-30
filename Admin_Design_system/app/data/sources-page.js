/* ADM-DATA-001 — Nguồn dữ liệu (Phase C8) */
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
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'info');
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
    h['X-Admin-Key'] = 'iflux-admin-local-dev';
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
          var msg = (err && err.message) || data.message || ('HTTP ' + res.status);
          throw new Error(msg);
        }
        return unwrap(data);
      });
    });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function statusChip(status) {
    if (status === 'success' || status === 'connected') return '<span class="ix-chip ix-chip-success">Đang kết nối</span>';
    if (status === 'degraded') return '<span class="ix-chip ix-chip-warning">Suy giảm</span>';
    if (status === 'failed') return '<span class="ix-chip ix-chip-danger">Lỗi</span>';
    return '<span class="ix-chip">Chờ</span>';
  }

  function renderTable() {
    var tb = document.getElementById('adm-src-tbody');
    var count = document.getElementById('adm-src-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="6" class="ix-caption" style="text-align:center;padding:28px">Chưa có nguồn dữ liệu.</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (s) {
      var actions = '';
      if (canPerm('data.sources.execute')) {
        actions += '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-src-run="' + esc(s.id) + '" title="Kiểm tra"><i class="ti ti-plug"></i> Kiểm tra</button> ';
      }
      if (canPerm('data.sources.edit')) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-src-edit="' + esc(s.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button>';
      }
      if (canPerm('data.sources.delete')) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-src-del="' + esc(s.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>';
      }
      return '<tr>' +
        '<td><strong>' + esc(s.name) + '</strong><div class="ix-caption"><code>' + esc(s.code) + '</code></div></td>' +
        '<td>' + esc(s.source_type || s.type || '—') + '</td>' +
        '<td class="ix-caption">' + (s.latency_ms != null ? esc(s.latency_ms) + 'ms' : '—') + '</td>' +
        '<td>' + statusChip(s.status) + '</td>' +
        '<td class="ix-caption">' + esc(fmtDate(s.last_check_at || s.updated_at)) + '</td>' +
        '<td style="white-space:nowrap">' + actions + '</td>' +
      '</tr>';
    }).join('');
  }

  function resetForm() {
    editingId = null;
    document.getElementById('adm-src-code').value = '';
    document.getElementById('adm-src-code').disabled = false;
    document.getElementById('adm-src-name').value = '';
    document.getElementById('adm-src-type').value = 'REST';
    document.getElementById('adm-src-desc').value = '';
    document.getElementById('adm-src-modal-title').textContent = 'Thêm nguồn dữ liệu';
  }

  function openModal(mode, id) {
    resetForm();
    if (mode === 'edit') {
      var item = items.filter(function (x) { return x.id === id; })[0];
      if (!item) {
        toast('Không tìm thấy nguồn', 'danger');
        return;
      }
      editingId = id;
      document.getElementById('adm-src-code').value = item.code || '';
      document.getElementById('adm-src-code').disabled = true;
      document.getElementById('adm-src-name').value = item.name || '';
      document.getElementById('adm-src-type').value = item.source_type || item.type || 'REST';
      document.getElementById('adm-src-desc').value = item.description || '';
      document.getElementById('adm-src-modal-title').textContent = 'Sửa nguồn dữ liệu';
    }
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-src-form');
  }

  function saveModal() {
    var body = {
      name: (document.getElementById('adm-src-name').value || '').trim(),
      source_type: document.getElementById('adm-src-type').value || 'REST',
      description: (document.getElementById('adm-src-desc').value || '').trim()
    };
    if (!body.name) {
      toast('Nhập tên nguồn', 'danger');
      return;
    }
    var req;
    if (editingId) {
      req = request('/admin/sources/' + encodeURIComponent(editingId), { method: 'PATCH', body: body });
    } else {
      var code = (document.getElementById('adm-src-code').value || '').trim();
      if (code) body.code = code;
      req = request('/admin/sources', { method: 'POST', body: body });
    }
    req.then(function () {
      toast(editingId ? 'Đã cập nhật' : 'Đã thêm nguồn', 'success');
      if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-src-form');
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function loadList() {
    var q = ((document.getElementById('adm-src-search') || {}).value || '').trim();
    var qs = q ? ('?q=' + encodeURIComponent(q)) : '';
    return request('/admin/sources' + qs).then(function (data) {
      items = data.sources || [];
      renderTable();
    }).catch(function (e) {
      toast(e.message || 'Không tải được nguồn dữ liệu', 'danger');
      items = [];
      renderTable();
    });
  }

  function bindEvents() {
    var addBtn = document.getElementById('btn-adm-src-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });
    var saveBtn = document.getElementById('btn-adm-src-save');
    if (saveBtn) saveBtn.addEventListener('click', saveModal);
    var search = document.getElementById('adm-src-search');
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadList, 250);
      });
    }
    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-src-edit]');
      if (editBtn) {
        openModal('edit', editBtn.getAttribute('data-src-edit'));
        return;
      }
      var runBtn = e.target.closest('[data-src-run]');
      if (runBtn) {
        var rid = runBtn.getAttribute('data-src-run');
        request('/admin/sources/' + encodeURIComponent(rid) + '/execute', { method: 'POST', body: {} })
          .then(function () {
            toast('Đã kiểm tra kết nối', 'success');
            loadList();
          })
          .catch(function (err) { toast(err.message || 'Kiểm tra thất bại', 'danger'); });
        return;
      }
      var delBtn = e.target.closest('[data-src-del]');
      if (delBtn) {
        var did = delBtn.getAttribute('data-src-del');
        if (!confirm('Xóa nguồn này? Không hoàn tác.')) return;
        request('/admin/sources/' + encodeURIComponent(did), { method: 'DELETE' })
          .then(function () {
            toast('Đã xóa', 'success');
            loadList();
          })
          .catch(function (err) { toast(err.message || 'Xóa thất bại', 'danger'); });
      }
    });
  }

  function init() {
    bindEvents();
    loadList();
  }

  global.AdmDataSources = { init: init, refresh: loadList };
})(window);
