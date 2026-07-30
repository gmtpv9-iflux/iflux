/* ADM-DATA-005 — Data Dictionary (Wave A) */
(function (global) {
  'use strict';

  var items = [];
  var editingId = null;

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    return h;
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
          throw new Error((err && err.message) || data.message || ('HTTP ' + res.status));
        }
        return (data && data.data) ? data.data : data;
      });
    });
  }

  function render() {
    var tb = document.getElementById('adm-dict-tbody');
    var count = document.getElementById('adm-dict-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption">Chưa có trường từ điển</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (r) {
      var actions = '';
      if (canPerm('data.dictionary.edit')) {
        actions = '<button type="button" class="ix-btn ix-btn-icon" data-dict-edit="' + esc(r.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button>';
      }
      return '<tr>' +
        '<td><strong>' + esc(r.code) + '</strong></td>' +
        '<td>' + esc(r.name) + '</td>' +
        '<td>' + esc(r.field_type) + '</td>' +
        '<td class="ix-caption">' + esc(r.description) + '</td>' +
        '<td>' + actions + '</td>' +
        '</tr>';
    }).join('');
  }

  function openEdit(id) {
    var item = items.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!item) return;
    editingId = item.id;
    document.getElementById('adm-dict-name').value = item.name || '';
    document.getElementById('adm-dict-type').value = item.field_type || 'string';
    document.getElementById('adm-dict-desc').value = item.description || '';
    document.getElementById('adm-dict-modal-title').textContent = 'Sửa trường · ' + (item.code || '');
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-dict-form');
  }

  function save() {
    if (!editingId) return;
    var body = {
      name: (document.getElementById('adm-dict-name').value || '').trim(),
      field_type: (document.getElementById('adm-dict-type').value || '').trim(),
      description: (document.getElementById('adm-dict-desc').value || '').trim()
    };
    request('/admin/data-ops/dictionary/' + encodeURIComponent(editingId), { method: 'PATCH', body: body })
      .then(function () {
        toast('Đã lưu trường từ điển', 'success');
        if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-dict-form');
        return load();
      })
      .catch(function (e) { toast(e.message || 'Lưu thất bại', 'danger'); });
  }

  function load() {
    return request('/admin/data-ops/dictionary').then(function (data) {
      items = data.fields || [];
      render();
    }).catch(function (e) {
      toast(e.message || 'Không tải được từ điển', 'danger');
    });
  }

  function init() {
    var saveBtn = document.getElementById('btn-adm-dict-save');
    if (saveBtn) saveBtn.addEventListener('click', save);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dict-edit]');
      if (btn) openEdit(btn.getAttribute('data-dict-edit'));
    });
    load();
  }

  global.AdmDataDictionary = { init: init };
})(window);
