/* ADM-DATA-002 — Tác vụ ETL (Phase C7) */
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

  function fmtDuration(ms) {
    if (ms == null) return '—';
    if (ms < 1000) return ms + 'ms';
    return (Math.round(ms / 100) / 10) + 's';
  }

  function statusChip(status) {
    if (status === 'success') return '<span class="ix-chip ix-chip-success">Thành công</span>';
    if (status === 'running') return '<span class="ix-chip ix-chip-warning">Đang chạy</span>';
    if (status === 'failed') return '<span class="ix-chip ix-chip-danger">Lỗi</span>';
    return '<span class="ix-chip">Chờ</span>';
  }

  function renderTable() {
    var tb = document.getElementById('adm-etl-tbody');
    var count = document.getElementById('adm-etl-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="7" class="ix-caption" style="text-align:center;padding:28px">Chưa có tác vụ ETL.</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (j) {
      var actions = '';
      if (canPerm('data.etl_jobs.execute')) {
        actions += '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-etl-run="' + esc(j.id) + '" title="Chạy"><i class="ti ti-player-play"></i> Chạy</button> ';
      }
      if (canPerm('data.etl_jobs.edit')) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-etl-edit="' + esc(j.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button>';
      }
      if (canPerm('data.etl_jobs.delete')) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-etl-del="' + esc(j.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>';
      }
      return '<tr>' +
        '<td><strong>' + esc(j.name) + '</strong><div class="ix-caption"><code>' + esc(j.code) + '</code></div></td>' +
        '<td class="ix-caption"><code>' + esc(j.schedule || '—') + '</code></td>' +
        '<td class="ix-caption">' + esc(fmtDate(j.last_run_at)) + '</td>' +
        '<td>' + statusChip(j.status) + '</td>' +
        '<td class="ix-caption">' + esc(fmtDuration(j.last_duration_ms)) + '</td>' +
        '<td class="ix-caption">' + (j.last_records != null ? esc(j.last_records) : '—') + '</td>' +
        '<td style="white-space:nowrap">' + actions + '</td>' +
      '</tr>';
    }).join('');
  }

  function resetForm() {
    editingId = null;
    document.getElementById('adm-etl-code').value = '';
    document.getElementById('adm-etl-code').disabled = false;
    document.getElementById('adm-etl-name').value = '';
    document.getElementById('adm-etl-schedule').value = '';
    document.getElementById('adm-etl-desc').value = '';
    document.getElementById('adm-etl-modal-title').textContent = 'Thêm tác vụ ETL';
  }

  function openModal(mode, id) {
    resetForm();
    if (mode === 'edit') {
      var item = items.filter(function (x) { return x.id === id; })[0];
      if (!item) {
        toast('Không tìm thấy tác vụ', 'danger');
        return;
      }
      editingId = id;
      document.getElementById('adm-etl-code').value = item.code || '';
      document.getElementById('adm-etl-code').disabled = true;
      document.getElementById('adm-etl-name').value = item.name || '';
      document.getElementById('adm-etl-schedule').value = item.schedule || '';
      document.getElementById('adm-etl-desc').value = item.description || '';
      document.getElementById('adm-etl-modal-title').textContent = 'Sửa tác vụ ETL';
    }
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-etl-form');
  }

  function saveModal() {
    var body = {
      name: (document.getElementById('adm-etl-name').value || '').trim(),
      schedule: (document.getElementById('adm-etl-schedule').value || '').trim(),
      description: (document.getElementById('adm-etl-desc').value || '').trim()
    };
    if (!body.name) {
      toast('Nhập tên tác vụ', 'danger');
      return;
    }
    var req;
    if (editingId) {
      req = request('/admin/etl-jobs/' + encodeURIComponent(editingId), { method: 'PATCH', body: body });
    } else {
      var code = (document.getElementById('adm-etl-code').value || '').trim();
      if (code) body.code = code;
      req = request('/admin/etl-jobs', { method: 'POST', body: body });
    }
    req.then(function () {
      toast(editingId ? 'Đã cập nhật' : 'Đã thêm tác vụ', 'success');
      if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-etl-form');
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function loadList() {
    var q = ((document.getElementById('adm-etl-search') || {}).value || '').trim();
    var qs = q ? ('?q=' + encodeURIComponent(q)) : '';
    return request('/admin/etl-jobs' + qs).then(function (data) {
      items = data.jobs || [];
      renderTable();
    }).catch(function (e) {
      toast(e.message || 'Không tải được tác vụ ETL', 'danger');
      items = [];
      renderTable();
    });
  }

  function bindEvents() {
    var addBtn = document.getElementById('btn-adm-etl-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });
    var saveBtn = document.getElementById('btn-adm-etl-save');
    if (saveBtn) saveBtn.addEventListener('click', saveModal);
    var search = document.getElementById('adm-etl-search');
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadList, 250);
      });
    }
    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-etl-edit]');
      if (editBtn) {
        openModal('edit', editBtn.getAttribute('data-etl-edit'));
        return;
      }
      var runBtn = e.target.closest('[data-etl-run]');
      if (runBtn) {
        var rid = runBtn.getAttribute('data-etl-run');
        request('/admin/etl-jobs/' + encodeURIComponent(rid) + '/execute', { method: 'POST', body: {} })
          .then(function () {
            toast('Đã chạy tác vụ', 'success');
            loadList();
          })
          .catch(function (err) { toast(err.message || 'Chạy thất bại', 'danger'); });
        return;
      }
      var delBtn = e.target.closest('[data-etl-del]');
      if (delBtn) {
        var did = delBtn.getAttribute('data-etl-del');
        if (!confirm('Xóa tác vụ này? Không hoàn tác.')) return;
        request('/admin/etl-jobs/' + encodeURIComponent(did), { method: 'DELETE' })
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

  global.AdmEtlJobs = { init: init, refresh: loadList };
})(window);
