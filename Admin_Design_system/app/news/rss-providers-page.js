/* ADM-COM-RSS-001 — Nguồn RSS (Phase C4) */
(function () {
  'use strict';

  var items = [];
  var editingId = null;
  var searchTimer = null;

  function canPerm(key) {
    return !!(window.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof window.ixToast === 'function') window.ixToast(msg, type || 'info');
  }

  function statusLabel(code) {
    var cat = window.IfluxRssCatalog;
    if (cat && cat.statusLabel) return cat.statusLabel(code);
    if (code === 'active') return 'Đang hoạt động';
    if (code === 'empty') return 'RSS trống';
    if (code === 'warning') return 'Cảnh báo';
    if (code === 'inactive') return 'Tắt';
    return code || '—';
  }

  function statusChipClass(code) {
    var cat = window.IfluxRssCatalog;
    if (cat && cat.statusChipClass) return cat.statusChipClass(code);
    if (code === 'active') return 'ix-chip ix-chip-success';
    if (code === 'empty' || code === 'warning') return 'ix-chip ix-chip-warning';
    return 'ix-chip';
  }

  function apiBase() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    try {
      if (window.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
        var b = IfluxApiConfig.getBaseUrl();
        if (b) return b.replace(/\/$/, '');
      }
    } catch (e) { /* ignore */ }
    return '/api';
  }

  function adminToken() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
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

  function openCanvas() {
    if (typeof window.ixOpenOffcanvas === 'function') {
      window.ixOpenOffcanvas('offcanvas-rss-provider');
      return;
    }
    var el = document.getElementById('offcanvas-rss-provider');
    var ov = document.getElementById('offcanvas-rss-provider-overlay');
    if (el) el.classList.add('ix-show');
    if (ov) ov.classList.add('ix-show');
  }

  function closeCanvas() {
    if (typeof window.ixCloseOffcanvas === 'function') {
      window.ixCloseOffcanvas('offcanvas-rss-provider');
      return;
    }
    var el = document.getElementById('offcanvas-rss-provider');
    var ov = document.getElementById('offcanvas-rss-provider-overlay');
    if (el) el.classList.remove('ix-show');
    if (ov) ov.classList.remove('ix-show');
  }

  function resetForm() {
    editingId = null;
    document.getElementById('rss-f-id').value = '';
    document.getElementById('rss-f-id').disabled = false;
    document.getElementById('rss-f-name').value = '';
    document.getElementById('rss-f-desc').value = '';
    document.getElementById('rss-f-website').value = '';
    document.getElementById('rss-f-rss').value = '';
    document.getElementById('rss-f-status').value = 'active';
  }

  function openModal(mode, id) {
    resetForm();
    var title = document.getElementById('rss-provider-modal-title');
    var saveBtn = document.getElementById('rss-provider-modal-save');
    if (mode === 'new') {
      if (title) title.textContent = 'Thêm nguồn RSS';
      if (saveBtn) {
        saveBtn.style.display = canPerm('news.rss_providers.create') ? '' : 'none';
        saveBtn.setAttribute('data-ix-perm', 'news.rss_providers.create');
      }
    } else {
      var item = items.filter(function (x) { return x.id === id; })[0];
      if (!item) {
        toast('Không tìm thấy nhà cung cấp', 'danger');
        return;
      }
      editingId = id;
      if (title) title.textContent = 'Sửa nguồn RSS';
      document.getElementById('rss-f-id').value = item.id || '';
      document.getElementById('rss-f-id').disabled = true;
      document.getElementById('rss-f-name').value = item.name || '';
      document.getElementById('rss-f-desc').value = item.description || '';
      document.getElementById('rss-f-website').value = item.website || '';
      document.getElementById('rss-f-rss').value = item.rssIndex || item.rss_index || '';
      document.getElementById('rss-f-status').value = item.status || 'active';
      if (saveBtn) {
        saveBtn.style.display = canPerm('news.rss_providers.edit') ? '' : 'none';
        saveBtn.setAttribute('data-ix-perm', 'news.rss_providers.edit');
      }
    }
    openCanvas();
  }

  function saveModal() {
    var body = {
      name: (document.getElementById('rss-f-name').value || '').trim(),
      description: (document.getElementById('rss-f-desc').value || '').trim(),
      website: (document.getElementById('rss-f-website').value || '').trim(),
      rss_index: (document.getElementById('rss-f-rss').value || '').trim(),
      status: document.getElementById('rss-f-status').value || 'active'
    };
    if (!body.name) {
      toast('Nhập tên nhà cung cấp', 'danger');
      return;
    }
    var req;
    if (editingId) {
      req = request('/news/admin/rss-providers/' + encodeURIComponent(editingId), {
        method: 'PATCH',
        body: body
      });
    } else {
      var idVal = (document.getElementById('rss-f-id').value || '').trim();
      if (idVal) body.id = idVal;
      req = request('/news/admin/rss-providers', { method: 'POST', body: body });
    }
    req.then(function () {
      toast(editingId ? 'Đã cập nhật' : 'Đã thêm nguồn', 'success');
      closeCanvas();
      loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function renderTable() {
    var tb = document.getElementById('rss-provider-tbody');
    var count = document.getElementById('rss-provider-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="4" class="ix-caption" style="text-align:center">Không có nhà cung cấp</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (p) {
      var actions = '';
      if (p.rssIndex || p.rss_index || p.website) {
        actions += '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(p.rssIndex || p.rss_index || p.website) + '" target="_blank" rel="noopener">Mở RSS</a> ';
      }
      if (canPerm('news.rss_providers.edit')) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-rss-edit="' + esc(p.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button>';
      }
      if (canPerm('news.rss_providers.delete')) {
        actions += '<button type="button" class="ix-btn ix-btn-icon" data-rss-del="' + esc(p.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>';
      }
      return (
        '<tr data-id="' + esc(p.id) + '">' +
          '<td><strong>' + esc(p.name) + '</strong><div class="ix-caption">' + esc(p.website || '') + '</div></td>' +
          '<td class="ix-caption">' + esc(p.description || '') + '</td>' +
          '<td><span class="' + esc(statusChipClass(p.status)) + '">' + esc(statusLabel(p.status)) + '</span></td>' +
          '<td style="white-space:nowrap">' + actions + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function loadList() {
    var q = ((document.getElementById('rss-provider-q') || {}).value || '').trim();
    var qs = q ? ('?q=' + encodeURIComponent(q)) : '';
    return request('/news/admin/rss-providers' + qs).then(function (data) {
      items = data.providers || [];
      renderTable();
    }).catch(function (e) {
      toast(e.message || 'Không tải được nguồn RSS', 'danger');
      items = [];
      renderTable();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('rss-provider-q');
    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadList, 250);
      });
    }
    var addBtn = document.getElementById('rss-provider-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });
    var saveBtn = document.getElementById('rss-provider-modal-save');
    if (saveBtn) saveBtn.addEventListener('click', saveModal);

    document.querySelectorAll('[data-ix-dismiss="offcanvas"]').forEach(function (btn) {
      btn.addEventListener('click', closeCanvas);
    });
    var ov = document.getElementById('offcanvas-rss-provider-overlay');
    if (ov) ov.addEventListener('click', closeCanvas);

    var tb = document.getElementById('rss-provider-tbody');
    if (tb) {
      tb.addEventListener('click', function (ev) {
        var editBtn = ev.target.closest('[data-rss-edit]');
        if (editBtn) {
          openModal('edit', editBtn.getAttribute('data-rss-edit'));
          return;
        }
        var delBtn = ev.target.closest('[data-rss-del]');
        if (delBtn) {
          var id = delBtn.getAttribute('data-rss-del');
          if (!confirm('Xóa nguồn RSS này? Không hoàn tác.')) return;
          request('/news/admin/rss-providers/' + encodeURIComponent(id), { method: 'DELETE' })
            .then(function () {
              toast('Đã xóa', 'success');
              loadList();
            })
            .catch(function (e) { toast(e.message || 'Xóa thất bại', 'danger'); });
        }
      });
    }

    loadList();
  });
})();
