/* Wave D — metadata / brand / community-ops admin pages */
(function (global) {
  'use strict';

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'info');
  }
  function apiBase() {
    return (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
  }
  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
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
        if (!res.ok) throw new Error(((data.error || {}).message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) ? data.data : data;
      });
    });
  }
  function setCount(id, n) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(n);
  }

  function crudPage(opts) {
    var items = [];
    function render() {
      setCount(opts.countId, items.length);
      var tb = document.getElementById(opts.tbodyId);
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = '';
        if (opts.editPerm && canPerm(opts.editPerm)) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-wd-edit="' + esc(r.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button> ';
        }
        if (opts.delPerm && canPerm(opts.delPerm)) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-wd-del="' + esc(r.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>';
        }
        if (opts.execPerm && canPerm(opts.execPerm)) {
          actions += '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-wd-run="' + esc(r.id) + '">Chạy</button>';
        }
        return opts.rowHtml(r, actions);
      }).join('') || '<tr><td colspan="6" class="ix-caption">Trống</td></tr>';
    }
    function load() {
      return request(opts.listPath).then(function (d) {
        items = d.items || d.prompts || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
    }
    var addBtn = document.getElementById(opts.addId);
    if (addBtn && opts.createPerm) {
      addBtn.addEventListener('click', function () {
        var body = opts.buildCreate();
        if (!body) return;
        request(opts.listPath, { method: 'POST', body: body })
          .then(function () { toast('Đã thêm', 'success'); return load(); })
          .catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
      });
    }
    document.addEventListener('click', function (e) {
      var edit = e.target.closest('[data-wd-edit]');
      if (edit && opts.buildEdit) {
        var body = opts.buildEdit();
        if (!body) return;
        request(opts.listPath + '/' + encodeURIComponent(edit.getAttribute('data-wd-edit')), {
          method: 'PATCH', body: body
        }).then(function () { toast('Đã lưu', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
      var del = e.target.closest('[data-wd-del]');
      if (del) {
        if (!confirm('Xóa mục này?')) return;
        request(opts.listPath + '/' + encodeURIComponent(del.getAttribute('data-wd-del')), { method: 'DELETE' })
          .then(function () { toast('Đã xóa', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
      var run = e.target.closest('[data-wd-run]');
      if (run) {
        request(opts.listPath + '/' + encodeURIComponent(run.getAttribute('data-wd-run')) + '/execute', {
          method: 'POST', body: {}
        }).then(function () { toast('Đã chạy', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
    });
    load();
  }

  global.AdmWaveD = {
    initEnums: function () {
      crudPage({
        listPath: '/admin/metadata/enums', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody', addId: 'btn-adm-wd-add',
        createPerm: 'metadata.enums.create', editPerm: 'metadata.enums.edit', delPerm: 'metadata.enums.delete',
        buildCreate: function () {
          var code = prompt('Mã enum:'); if (!code) return null;
          var name = prompt('Tên:', code); if (!name) return null;
          return { code: code, name: name, values_text: '' };
        },
        buildEdit: function () {
          var name = prompt('Tên mới:'); return name ? { name: name } : null;
        },
        rowHtml: function (r, actions) {
          return '<tr><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) +
            '</div></td><td class="ix-caption">' + esc(r.values_text) + '</td><td>' + actions + '</td></tr>';
        }
      });
    },
    initSectorTypes: function () {
      crudPage({
        listPath: '/admin/metadata/sector-types', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody', addId: 'btn-adm-wd-add',
        createPerm: 'metadata.sector_types.create', editPerm: 'metadata.sector_types.edit', delPerm: 'metadata.sector_types.delete',
        buildCreate: function () {
          var code = prompt('Mã:'); if (!code) return null;
          var name = prompt('Tên:', code); if (!name) return null;
          return { code: code, name: name, description: '' };
        },
        buildEdit: function () {
          var name = prompt('Tên mới:'); return name ? { name: name } : null;
        },
        rowHtml: function (r, actions) {
          return '<tr><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) +
            '</div></td><td class="ix-caption">' + esc(r.description) + '</td><td>' + actions + '</td></tr>';
        }
      });
    },
    initThemes: function () {
      crudPage({
        listPath: '/admin/metadata/themes', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody',
        editPerm: 'metadata.themes.edit',
        buildEdit: function () {
          var name = prompt('Tên theme:'); return name ? { name: name } : null;
        },
        rowHtml: function (r, actions) {
          return '<tr><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) +
            '</div></td><td>' + actions + '</td></tr>';
        }
      });
    },
    initLifecycle: function () {
      crudPage({
        listPath: '/admin/metadata/story-lifecycle', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody',
        editPerm: 'metadata.story_lifecycle.edit',
        buildEdit: function () {
          var name = prompt('Tên giai đoạn:'); return name ? { name: name } : null;
        },
        rowHtml: function (r, actions) {
          return '<tr><td>' + esc(r.sort_order) + '</td><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' +
            esc(r.code) + '</div></td><td>' + actions + '</td></tr>';
        }
      });
    },
    initBrand: function () {
      request('/admin/marketing/brand-identity').then(function (d) {
        var p = (d.brand && d.brand.payload) || {};
        var nameEl = document.getElementById('adm-brand-name');
        var tagEl = document.getElementById('adm-brand-tagline');
        if (nameEl) nameEl.value = p.name || '';
        if (tagEl) tagEl.value = p.tagline || '';
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
      var save = document.getElementById('btn-adm-brand-save');
      if (save) {
        save.addEventListener('click', function () {
          var payload = {
            name: (document.getElementById('adm-brand-name') || {}).value || '',
            tagline: (document.getElementById('adm-brand-tagline') || {}).value || ''
          };
          request('/admin/marketing/brand-identity', { method: 'PATCH', body: { payload: payload } })
            .then(function () { toast('Đã lưu thương hiệu', 'success'); })
            .catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
        });
      }
    },
    initComments: function () {
      crudPage({
        listPath: '/admin/community-ops/comments', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody',
        delPerm: 'community.comments.delete',
        rowHtml: function (r, actions) {
          return '<tr><td>' + esc(r.author) + '</td><td>' + esc(r.body) + '</td><td>' + esc(r.status) +
            '</td><td>' + actions + '</td></tr>';
        }
      });
    },
    initReports: function () {
      crudPage({
        listPath: '/admin/community-ops/reports', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody',
        editPerm: 'community.reports.edit',
        buildEdit: function () { return { status: 'resolved' }; },
        rowHtml: function (r, actions) {
          return '<tr><td>' + esc(r.target_type) + '/' + esc(r.target_id) + '</td><td>' + esc(r.reason) +
            '</td><td>' + esc(r.status) + '</td><td>' + actions + '</td></tr>';
        }
      });
    },
    initContentDash: function () {
      request('/admin/community-ops/content-dashboard').then(function (d) {
        var root = document.getElementById('adm-wd-dash');
        if (!root) return;
        var cards = (d.cards || []).map(function (c) {
          return '<div class="ix-stat-card"><div class="ix-stat-label">' + esc(c.label) +
            '</div><div class="ix-stat-value">' + esc(c.value) + '</div></div>';
        }).join('');
        root.innerHTML = '<div class="ix-grid ix-grid-3">' + cards + '</div>';
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
    },
    /* DEAD — Wave D stub RSS UI đã bị khôi phục catalog (ADM-COM-RSS). Không call-site HTML.
    initRssSync: function () { ... },
    initRssSchema: function () { ... },
    */
  };
})(window);
