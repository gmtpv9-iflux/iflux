/* ADM-COM-CAT-001 — Quản lý danh mục Cộng đồng */
(function () {
  'use strict';

  var items = [];
  var editingId = null;
  var viewOnly = false;

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

  function actorName() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.getAdmin) {
      var a = IfluxAdminAuth.getAdmin();
      if (a && (a.name || a.email)) return a.name || a.email;
    }
    return 'Admin';
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

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN');
    } catch (e) {
      return iso;
    }
  }

  function loadList() {
    var q = ((document.getElementById('com-cat-search') || {}).value || '').trim();
    var qs = q ? ('?q=' + encodeURIComponent(q)) : '';
    return request('/news/admin/categories' + qs).then(function (data) {
      items = data.categories || [];
      renderTable();
      fillParentSelect();
    }).catch(function (e) {
      toast(e.message || 'Không tải được danh mục', 'danger');
    });
  }

  function renderTable() {
    var tbody = document.getElementById('com-cat-tbody');
    var countEl = document.getElementById('com-cat-count');
    if (countEl) countEl.textContent = String(items.length);
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--ix-text-muted);font-size:13px">Chưa có danh mục.</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function (c) {
      var icon = c.icon || 'ti ti-folder';
      var color = c.color || 'var(--ix-accent)';
      return '<tr data-id="' + esc(c.id) + '">' +
        '<td>' + esc(c.sort_order) + '</td>' +
        '<td>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:' + esc(color) + ';flex-shrink:0"></span>' +
            '<i class="' + esc(icon) + '" style="color:' + esc(color) + '"></i>' +
            '<strong>' + esc(c.name) + '</strong>' +
          '</div>' +
          (c.description ? '<div class="ix-caption" style="margin-top:2px">' + esc(c.description.slice(0, 72)) + (c.description.length > 72 ? '…' : '') + '</div>' : '') +
        '</td>' +
        '<td><code style="font-size:12px">' + esc(c.slug) + '</code></td>' +
        '<td>' + esc(c.parent_name || '—') + '</td>' +
        '<td>' + (c.is_visible
          ? '<span class="ix-chip ix-chip-success">Hiện</span>'
          : '<span class="ix-chip ix-chip-muted">Ẩn</span>') + '</td>' +
        '<td>' + (c.is_featured ? '<span class="ix-chip ix-chip-warning">Nổi bật</span>' : '—') + '</td>' +
        '<td>' + esc(c.post_count) + '</td>' +
        '<td style="font-size:12px">' + esc(c.created_by_name || '—') + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(c.created_at)) + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button type="button" class="ix-btn ix-btn-icon" data-cat-view="' + esc(c.id) + '" title="Xem"><i class="ti ti-eye"></i></button>' +
          (canPerm('news.categories.edit')
            ? '<button type="button" class="ix-btn ix-btn-icon" data-cat-edit="' + esc(c.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button>'
            : '') +
          (canPerm('news.categories.status_visible') && !c.is_visible
            ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-cat-show="' + esc(c.id) + '">Hiện</button> '
            : '') +
          (canPerm('news.categories.status_hidden') && c.is_visible
            ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-cat-hide="' + esc(c.id) + '">Ẩn</button> '
            : '') +
          (canPerm('news.categories.delete')
            ? '<button type="button" class="ix-btn ix-btn-icon" data-cat-del="' + esc(c.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>'
            : '') +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function fillParentSelect(excludeId) {
    var sel = document.getElementById('com-cat-f-parent');
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">— Không —</option>' + items
      .filter(function (c) { return !excludeId || c.id !== excludeId; })
      .filter(function (c) { return !c.parent_id; })
      .map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
      }).join('');
    if (cur) sel.value = cur;
  }

  function setFieldsDisabled(disabled) {
    ['com-cat-f-name', 'com-cat-f-slug', 'com-cat-f-desc', 'com-cat-f-icon', 'com-cat-f-color',
      'com-cat-f-color-text', 'com-cat-f-cover', 'com-cat-f-parent', 'com-cat-f-order',
      'com-cat-f-visible', 'com-cat-f-featured', 'com-cat-f-seo-title', 'com-cat-f-seo-desc',
      'com-cat-f-seo-kw'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = !!disabled;
    });
    var saveBtn = document.getElementById('com-cat-modal-save');
    if (saveBtn) saveBtn.style.display = disabled ? 'none' : '';
  }

  function resetForm() {
    editingId = null;
    viewOnly = false;
    document.getElementById('com-cat-f-name').value = '';
    document.getElementById('com-cat-f-slug').value = '';
    document.getElementById('com-cat-f-desc').value = '';
    document.getElementById('com-cat-f-icon').value = 'ti ti-folder';
    document.getElementById('com-cat-f-color').value = '#696CFF';
    document.getElementById('com-cat-f-color-text').value = '#696CFF';
    document.getElementById('com-cat-f-cover').value = '';
    document.getElementById('com-cat-f-parent').value = '';
    document.getElementById('com-cat-f-order').value = '0';
    document.getElementById('com-cat-f-visible').checked = true;
    document.getElementById('com-cat-f-featured').checked = false;
    document.getElementById('com-cat-f-seo-title').value = '';
    document.getElementById('com-cat-f-seo-desc').value = '';
    document.getElementById('com-cat-f-seo-kw').value = '';
    document.getElementById('com-cat-view-meta').style.display = 'none';
    setFieldsDisabled(false);
  }

  function openModal(mode, id) {
    resetForm();
    viewOnly = mode === 'view';
    fillParentSelect(id);
    var title = document.getElementById('com-cat-modal-title');
    if (mode === 'new') {
      if (title) title.textContent = 'Thêm danh mục';
    } else {
      var item = items.filter(function (x) { return x.id === id; })[0];
      if (!item) {
        toast('Không tìm thấy danh mục', 'danger');
        return;
      }
      editingId = id;
      if (title) title.textContent = viewOnly ? 'Xem danh mục' : 'Sửa danh mục';
      document.getElementById('com-cat-f-name').value = item.name || '';
      document.getElementById('com-cat-f-slug').value = item.slug || '';
      document.getElementById('com-cat-f-desc').value = item.description || '';
      document.getElementById('com-cat-f-icon').value = item.icon || 'ti ti-folder';
      var color = item.color || '#696CFF';
      document.getElementById('com-cat-f-color').value = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#696CFF';
      document.getElementById('com-cat-f-color-text').value = color;
      document.getElementById('com-cat-f-cover').value = item.cover_url || '';
      document.getElementById('com-cat-f-parent').value = item.parent_id || '';
      document.getElementById('com-cat-f-order').value = String(item.sort_order || 0);
      document.getElementById('com-cat-f-visible').checked = !!item.is_visible;
      document.getElementById('com-cat-f-featured').checked = !!item.is_featured;
      document.getElementById('com-cat-f-seo-title').value = item.seo_title || '';
      document.getElementById('com-cat-f-seo-desc').value = item.seo_description || '';
      document.getElementById('com-cat-f-seo-kw').value = item.seo_keywords || '';
      document.getElementById('com-cat-view-meta').style.display = '';
      document.getElementById('com-cat-v-posts').textContent = String(item.post_count || 0);
      document.getElementById('com-cat-v-created').textContent = fmtDate(item.created_at);
      document.getElementById('com-cat-v-creator').textContent = item.created_by_name || '—';
      setFieldsDisabled(viewOnly);
    }
    if (typeof window.ixOpenOffcanvas === 'function') window.ixOpenOffcanvas('offcanvas-com-cat');
  }

  function closeModal() {
    if (typeof window.ixCloseOffcanvas === 'function') window.ixCloseOffcanvas('offcanvas-com-cat');
  }

  function readForm() {
    return {
      name: (document.getElementById('com-cat-f-name').value || '').trim(),
      slug: (document.getElementById('com-cat-f-slug').value || '').trim() || undefined,
      description: document.getElementById('com-cat-f-desc').value || '',
      icon: (document.getElementById('com-cat-f-icon').value || '').trim() || 'ti ti-folder',
      color: (document.getElementById('com-cat-f-color-text').value || document.getElementById('com-cat-f-color').value || '').trim(),
      cover_url: (document.getElementById('com-cat-f-cover').value || '').trim() || null,
      parent_id: document.getElementById('com-cat-f-parent').value || null,
      sort_order: Number(document.getElementById('com-cat-f-order').value) || 0,
      is_visible: !!document.getElementById('com-cat-f-visible').checked,
      is_featured: !!document.getElementById('com-cat-f-featured').checked,
      seo_title: document.getElementById('com-cat-f-seo-title').value || '',
      seo_description: document.getElementById('com-cat-f-seo-desc').value || '',
      seo_keywords: document.getElementById('com-cat-f-seo-kw').value || '',
      created_by_name: actorName()
    };
  }

  function saveForm() {
    if (viewOnly) return;
    var payload = readForm();
    if (!payload.name) {
      toast('Tên danh mục là bắt buộc', 'danger');
      return;
    }
    var p = editingId
      ? request('/news/admin/categories/' + encodeURIComponent(editingId), { method: 'PUT', body: payload })
      : request('/news/admin/categories', { method: 'POST', body: payload });
    p.then(function () {
      closeModal();
      toast(editingId ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục', 'success');
      return loadList();
    }).catch(function (e) {
      toast(e.message || 'Lưu thất bại', 'danger');
    });
  }

  function deleteItem(id) {
    var item = items.filter(function (x) { return x.id === id; })[0];
    if (!item) return;
    if (!window.confirm('Xóa danh mục «' + item.name + '»?')) return;
    request('/news/admin/categories/' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function () {
        toast('Đã xóa danh mục', 'success');
        return loadList();
      })
      .catch(function (e) {
        toast(e.message || 'Xóa thất bại', 'danger');
      });
  }

  function bind() {
    var addBtn = document.getElementById('com-cat-add');
    if (addBtn) addBtn.addEventListener('click', function () { openModal('new'); });

    var search = document.getElementById('com-cat-search');
    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(loadList, 250);
      });
    }

    ['com-cat-modal-close', 'com-cat-modal-cancel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', closeModal);
    });
    var saveBtn = document.getElementById('com-cat-modal-save');
    if (saveBtn) saveBtn.addEventListener('click', saveForm);

    var colorPicker = document.getElementById('com-cat-f-color');
    var colorText = document.getElementById('com-cat-f-color-text');
    if (colorPicker && colorText) {
      colorPicker.addEventListener('input', function () { colorText.value = colorPicker.value; });
      colorText.addEventListener('change', function () {
        if (/^#[0-9A-Fa-f]{6}$/.test(colorText.value)) colorPicker.value = colorText.value;
      });
    }

    var tbody = document.getElementById('com-cat-tbody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cat-view],[data-cat-edit],[data-cat-del],[data-cat-show],[data-cat-hide]');
        if (!btn) return;
        e.preventDefault();
        if (btn.hasAttribute('data-cat-view')) openModal('view', btn.getAttribute('data-cat-view'));
        else if (btn.hasAttribute('data-cat-edit')) openModal('edit', btn.getAttribute('data-cat-edit'));
        else if (btn.hasAttribute('data-cat-del')) deleteItem(btn.getAttribute('data-cat-del'));
        else if (btn.hasAttribute('data-cat-show')) {
          request('/news/admin/categories/' + encodeURIComponent(btn.getAttribute('data-cat-show')) + '/status-visible', { method: 'POST', body: {} })
            .then(function () { toast('Đã hiện danh mục', 'success'); return loadList(); })
            .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
        } else if (btn.hasAttribute('data-cat-hide')) {
          request('/news/admin/categories/' + encodeURIComponent(btn.getAttribute('data-cat-hide')) + '/status-hidden', { method: 'POST', body: {} })
            .then(function () { toast('Đã ẩn danh mục', 'success'); return loadList(); })
            .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    loadList();
  });
})();
