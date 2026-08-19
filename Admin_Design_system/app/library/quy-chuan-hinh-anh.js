/* Quy chuẩn hình ảnh — Profile Registry (Task 04 P6). Không list asset. */
(function (global) {
  'use strict';

  var STATUSES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'RETIRED'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    return null;
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = adminToken();
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  function errorMessage(data, fallback) {
    var err = data && data.error;
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    return err.message || fallback;
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(errorMessage(data, res.statusText));
        return data && data.data ? data.data : data;
      });
    });
  }

  function sizeLabel(row) {
    if (row.width && row.height) return row.width + '×' + row.height;
    if (row.max_width) return 'max ' + row.max_width + '×auto';
    return '—';
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setVal(id, v) {
    var el = document.getElementById(id);
    if (el) el.value = v == null ? '' : String(v);
  }

  function statusOptions(current) {
    return STATUSES.map(function (s) {
      return '<option value="' + s + '"' + (s === current ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
  }

  function resetForm() {
    setVal('adm-mip-edit-key', '');
    setVal('adm-mip-key', '');
    setVal('adm-mip-name', '');
    setVal('adm-mip-purpose', '');
    setVal('adm-mip-status-field', 'DRAFT');
    setVal('adm-mip-width', '');
    setVal('adm-mip-height', '');
    setVal('adm-mip-maxw', '');
    setVal('adm-mip-quality', '82');
    setVal('adm-mip-crop', 'none');
    setVal('adm-mip-format', 'webp');
    var keyEl = document.getElementById('adm-mip-key');
    if (keyEl) keyEl.disabled = false;
    var title = document.getElementById('adm-mip-form-title');
    if (title) title.textContent = 'Tạo profile';
    var save = document.getElementById('adm-mip-save');
    if (save) save.textContent = 'Tạo (DRAFT)';
    var cancel = document.getElementById('adm-mip-cancel');
    if (cancel) cancel.hidden = true;
  }

  function fillForm(row) {
    setVal('adm-mip-edit-key', row.profile_key);
    setVal('adm-mip-key', row.profile_key);
    setVal('adm-mip-name', row.display_name);
    setVal('adm-mip-purpose', row.purpose);
    setVal('adm-mip-status-field', row.status || 'DRAFT');
    setVal('adm-mip-width', row.width);
    setVal('adm-mip-height', row.height);
    setVal('adm-mip-maxw', row.max_width);
    setVal('adm-mip-quality', row.quality != null ? row.quality : 82);
    setVal('adm-mip-crop', row.crop || 'none');
    setVal('adm-mip-format', row.format || 'webp');
    var keyEl = document.getElementById('adm-mip-key');
    if (keyEl) keyEl.disabled = true;
    var title = document.getElementById('adm-mip-form-title');
    if (title) title.textContent = 'Sửa ' + row.profile_key;
    var save = document.getElementById('adm-mip-save');
    if (save) save.textContent = 'Lưu thay đổi';
    var cancel = document.getElementById('adm-mip-cancel');
    if (cancel) cancel.hidden = false;
  }

  function formBody() {
    var body = {
      profile_key: val('adm-mip-key'),
      display_name: val('adm-mip-name'),
      purpose: val('adm-mip-purpose'),
      status: val('adm-mip-status-field') || 'DRAFT',
      crop: val('adm-mip-crop') || 'none',
      format: val('adm-mip-format') || 'webp',
      quality: val('adm-mip-quality') ? Number(val('adm-mip-quality')) : 82
    };
    if (val('adm-mip-width')) body.width = Number(val('adm-mip-width'));
    if (val('adm-mip-height')) body.height = Number(val('adm-mip-height'));
    if (val('adm-mip-maxw')) body.max_width = Number(val('adm-mip-maxw'));
    return body;
  }

  function render(rows) {
    var tb = document.getElementById('adm-mip-tbody');
    if (!tb) return;
    tb.innerHTML = rows.map(function (r) {
      return (
        '<tr>' +
          '<td><code>' + esc(r.profile_key) + '</code></td>' +
          '<td>' + esc(r.display_name) + '</td>' +
          '<td>' + esc(sizeLabel(r)) + '</td>' +
          '<td>' + esc(r.crop) + '</td>' +
          '<td>' + esc(r.format) + '</td>' +
          '<td>' + esc(r.quality) + '</td>' +
          '<td>v' + esc(r.version) + '</td>' +
          '<td><select class="ix-input" data-status-key="' + esc(r.profile_key) +
            '" data-ix-perm="media.profile.manage" style="min-width:120px">' +
            statusOptions(r.status) + '</select></td>' +
          '<td>' +
            '<button type="button" class="ix-btn ix-btn-sm ix-btn-outline" data-edit="' +
              esc(r.profile_key) + '" data-ix-perm="media.profile.manage">Sửa</button> ' +
            '<button type="button" class="ix-btn ix-btn-sm ix-btn-outline" data-regen="' +
              esc(r.profile_key) + '" data-ix-perm="media.profile.regenerate">Tạo lại</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
    tb._rows = rows;
  }

  function setStatus(msg) {
    var status = document.getElementById('adm-mip-status');
    if (status) status.textContent = msg;
  }

  function load() {
    return request('/admin/media/profiles').then(function (data) {
      var rows = (data && data.profiles) || [];
      render(rows);
      setStatus('Đã tải ' + rows.length + ' profile.');
      return rows;
    }).catch(function (err) {
      setStatus((err && err.message) || 'Không tải được registry');
    });
  }

  function findRow(key) {
    var tb = document.getElementById('adm-mip-tbody');
    var rows = (tb && tb._rows) || [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].profile_key === key) return rows[i];
    }
    return null;
  }

  function enqueueNote(out) {
    if (out && out.enqueue) {
      return ' Đã xếp ' + (out.enqueue.enqueued || 0) + ' job GENERATE.';
    }
    return '';
  }

  function init() {
    load();
    var save = document.getElementById('adm-mip-save');
    var cancel = document.getElementById('adm-mip-cancel');
    if (save) {
      save.addEventListener('click', function () {
        var editing = val('adm-mip-edit-key');
        var body = formBody();
        save.disabled = true;
        var req = editing
          ? request('/admin/media/profiles/' + encodeURIComponent(editing), { method: 'PATCH', body: body })
          : request('/admin/media/profiles', { method: 'POST', body: body });
        req.then(function (out) {
          setStatus((editing ? 'Đã lưu ' : 'Đã tạo ') + (body.profile_key || editing) + '.' + enqueueNote(out));
          resetForm();
          return load();
        }).catch(function (err) {
          setStatus((err && err.message) || 'Lưu profile lỗi');
        }).then(function () {
          save.disabled = false;
        });
      });
    }
    if (cancel) cancel.addEventListener('click', resetForm);
    document.addEventListener('click', function (ev) {
      var editBtn = ev.target && ev.target.closest ? ev.target.closest('[data-edit]') : null;
      if (editBtn) {
        var row = findRow(editBtn.getAttribute('data-edit'));
        if (row) fillForm(row);
        return;
      }
      var btn = ev.target && ev.target.closest ? ev.target.closest('[data-regen]') : null;
      if (!btn) return;
      var key = btn.getAttribute('data-regen');
      btn.disabled = true;
      request('/admin/media/profiles/' + encodeURIComponent(key) + '/regenerate', {
        method: 'POST',
        body: { limit: 50 }
      }).then(function (out) {
        setStatus('Đã xếp ' + (out.enqueued || 0) + ' job GENERATE cho ' + key);
      }).catch(function (err) {
        setStatus((err && err.message) || 'Regen lỗi');
      }).then(function () {
        btn.disabled = false;
      });
    });
    document.addEventListener('change', function (ev) {
      var sel = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-status-key')
        ? ev.target
        : null;
      if (!sel) return;
      var key = sel.getAttribute('data-status-key');
      sel.disabled = true;
      request('/admin/media/profiles/' + encodeURIComponent(key), {
        method: 'PATCH',
        body: { status: sel.value }
      }).then(function (out) {
        setStatus('Đã đổi ' + key + ' → ' + sel.value + '.' + enqueueNote(out));
        return load();
      }).catch(function (err) {
        setStatus((err && err.message) || 'Đổi trạng thái lỗi');
      }).then(function () {
        sel.disabled = false;
      });
    });
  }

  global.AdmMediaProfiles = { init: init };
})(window);
