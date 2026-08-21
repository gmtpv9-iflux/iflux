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
    /* Owner 2026-08-10: UI Nhận diện thương hiệu removed — use initSeoSystem / Thiết lập SEO.
       Keep stub so old HTML script tags do not throw. */
    initBrand: function () {
      try {
        location.replace('/admin/tiep-thi/thiet-lap-seo-he-thong');
      } catch (e) { /* ignore */ }
    },
    initSeoSystem: function () {
      function val(id) {
        var el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
      }
      function setVal(id, v) {
        var el = document.getElementById(id);
        if (el) el.value = v == null ? '' : String(v);
      }
      function setSrc(fieldKey, fields) {
        var el = document.getElementById('seo-g-src-' + fieldKey);
        if (!el || !fields || !fields[fieldKey]) return;
        var f = fields[fieldKey];
        var bits = [(f.state || '') + (f.source ? ' · ' + f.source : '')];
        if (f.value) bits.push('Hiệu lực: ' + f.value);
        el.textContent = bits.filter(Boolean).join(' · ');
      }
      function applyAltHint(fields) {
        var el = document.getElementById('seo-g-defaultOgImageAlt');
        if (!el || !fields || !fields.ogImageAlt) return;
        var resolved = fields.ogImageAlt.value || '';
        el.placeholder = resolved && !val('seo-g-defaultOgImageAlt') ? resolved : 'Tuỳ chọn — để trống nếu title đủ';
      }
      function registerUsage(assetId, fieldRef) {
        if (!assetId) return Promise.resolve();
        return request('/admin/media/usages', {
          method: 'POST',
          body: { asset_id: assetId, scope: 'GLOBAL', owner_ref: 'primary', field_ref: fieldRef }
        }).catch(function () { /* audit-first — không chặn lưu */ });
      }
      function uploadTo(fileInputId, urlId, assetIdId, fieldRef) {
        var fileEl = document.getElementById(fileInputId);
        if (!fileEl) return;
        fileEl.addEventListener('change', function () {
          var file = fileEl.files && fileEl.files[0];
          if (!file) return;
          if (fieldRef === 'social' || fieldRef === 'og') {
            var okType = /image\/(jpeg|jpg|png)/i.test(file.type) || /\.(jpe?g|png)$/i.test(file.name || '');
            if (!okType) {
              toast('Ảnh Social/OG phải là JPEG hoặc PNG', 'danger');
              fileEl.value = '';
              return;
            }
          }
          var fd = new FormData();
          fd.append('file', file);
          if (fieldRef === 'social' || fieldRef === 'og') fd.append('purpose', fieldRef);
          var h = authHeaders();
          delete h['Content-Type'];
          fetch(apiBase() + '/admin/media/upload', { method: 'POST', headers: h, body: fd })
            .then(function (res) {
              return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) throw new Error(((data.error || {}).message) || data.message || ('HTTP ' + res.status));
                return (data && data.data) ? data.data : data;
              });
            })
            .then(function (d) {
              var asset = d.asset || {};
              setVal(urlId, asset.public_url || asset.url || '');
              setVal(assetIdId, asset.id || '');
              return registerUsage(asset.id, fieldRef);
            })
            .then(function () { toast('Đã tải ảnh', 'success'); })
            .catch(function (e) { toast(e.message || 'Lỗi tải ảnh', 'danger'); });
          fileEl.value = '';
        });
      }
      function bindUploadBtn(btnId, fileId) {
        var btn = document.getElementById(btnId);
        var file = document.getElementById(fileId);
        if (btn && file) btn.addEventListener('click', function () { file.click(); });
      }
      bindUploadBtn('seo-g-favicon-upload', 'seo-g-favicon-file');
      bindUploadBtn('seo-g-logo-upload', 'seo-g-logo-file');
      bindUploadBtn('seo-g-og-upload', 'seo-g-og-file');
      bindUploadBtn('seo-g-social-upload', 'seo-g-social-file');
      uploadTo('seo-g-favicon-file', 'seo-g-faviconUrl', 'seo-g-faviconAssetId', 'favicon');
      uploadTo('seo-g-logo-file', 'seo-g-logoUrl', 'seo-g-logoAssetId', 'logo');
      uploadTo('seo-g-og-file', 'seo-g-defaultOgImageUrl', 'seo-g-defaultOgImageAssetId', 'og');
      uploadTo('seo-g-social-file', 'seo-g-defaultSocialImageUrl', 'seo-g-defaultSocialImageAssetId', 'social');

      function load() {
        return Promise.all([
          request('/admin/seo/global'),
          request('/admin/seo/preview')
        ]).then(function (pair) {
          var d = pair[0] || {};
          var preview = pair[1] || {};
          var p = d.payload || {};
          setVal('seo-g-siteName', p.name || p.siteName || '');
          setVal('seo-g-siteDescription', p.siteDescription || '');
          setVal('seo-g-defaultSeoTitle', p.defaultSeoTitle || '');
          setVal('seo-g-defaultMetaDescription', p.defaultMetaDescription || '');
          setVal('seo-g-faviconUrl', p.faviconUrl || '');
          setVal('seo-g-faviconAssetId', p.faviconAssetId || '');
          setVal('seo-g-logoUrl', p.logoUrl || '');
          setVal('seo-g-logoAssetId', p.logoAssetId || '');
          setVal('seo-g-defaultOgImageUrl', p.defaultOgImageUrl || '');
          setVal('seo-g-defaultOgImageAssetId', p.defaultOgImageAssetId || '');
          setVal('seo-g-defaultOgImageAlt', p.defaultOgImageAlt || '');
          setVal('seo-g-defaultSocialImageUrl', p.defaultSocialImageUrl || '');
          setVal('seo-g-defaultSocialImageAssetId', p.defaultSocialImageAssetId || '');
          ['siteName', 'siteDescription', 'seoTitle', 'metaDescription', 'faviconUrl', 'logoUrl', 'ogImageUrl', 'ogImageAlt', 'socialImageUrl'].forEach(function (k) {
            setSrc(k, preview.fields);
          });
          applyAltHint(preview.fields);
        }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
      }
      load();
      var save = document.getElementById('seo-g-save');
      if (save) {
        save.addEventListener('click', function () {
          var body = {
            siteName: val('seo-g-siteName'),
            siteDescription: val('seo-g-siteDescription'),
            defaultSeoTitle: val('seo-g-defaultSeoTitle'),
            defaultMetaDescription: val('seo-g-defaultMetaDescription'),
            faviconUrl: val('seo-g-faviconUrl'),
            faviconAssetId: val('seo-g-faviconAssetId') || null,
            logoUrl: val('seo-g-logoUrl'),
            logoAssetId: val('seo-g-logoAssetId') || null,
            defaultOgImageUrl: val('seo-g-defaultOgImageUrl'),
            defaultOgImageAssetId: val('seo-g-defaultOgImageAssetId') || null,
            defaultOgImageAlt: val('seo-g-defaultOgImageAlt'),
            defaultSocialImageUrl: val('seo-g-defaultSocialImageUrl'),
            defaultSocialImageAssetId: val('seo-g-defaultSocialImageAssetId') || null
          };
          request('/admin/seo/global', { method: 'PATCH', body: body })
            .then(function () {
              return Promise.all([
                registerUsage(body.faviconAssetId, 'favicon'),
                registerUsage(body.logoAssetId, 'logo'),
                registerUsage(body.defaultOgImageAssetId, 'og'),
                registerUsage(body.defaultSocialImageAssetId, 'social')
              ]);
            })
            .then(function () { toast('Đã lưu SEO hệ thống', 'success'); return load(); })
            .catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
        });
      }
    },
    initSeoPages: function () {
      function val(id) {
        var el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
      }
      function setVal(id, v) {
        var el = document.getElementById(id);
        if (el) el.value = v == null ? '' : String(v);
      }
      function setSrc(fieldKey, fields) {
        var el = document.getElementById('seo-p-src-' + fieldKey);
        if (!el || !fields || !fields[fieldKey]) { if (el) el.textContent = ''; return; }
        var f = fields[fieldKey];
        var bits = [(f.state || '') + (f.source ? ' · ' + f.source : '')];
        if (f.value) bits.push('Hiệu lực: ' + f.value);
        el.textContent = bits.filter(Boolean).join(' · ');
      }
      function applyAltHint(fields) {
        var el = document.getElementById('seo-p-ogImageAlt');
        if (!el || !fields || !fields.ogImageAlt) return;
        var resolved = fields.ogImageAlt.value || '';
        el.placeholder = resolved && !val('seo-p-ogImageAlt') ? resolved : 'Tuỳ chọn — để trống = kế thừa';
      }
      function registerUsage(assetId, pageKey, fieldRef) {
        if (!assetId || !pageKey) return Promise.resolve();
        return request('/admin/media/usages', {
          method: 'POST',
          body: { asset_id: assetId, scope: 'PAGE', owner_ref: pageKey, field_ref: fieldRef }
        }).catch(function () {});
      }
      function uploadTo(fileInputId, urlId, assetIdId, fieldRef) {
        var fileEl = document.getElementById(fileInputId);
        if (!fileEl) return;
        fileEl.addEventListener('change', function () {
          var file = fileEl.files && fileEl.files[0];
          if (!file) return;
          if (fieldRef === 'social' || fieldRef === 'og') {
            var okType = /image\/(jpeg|jpg|png)/i.test(file.type) || /\.(jpe?g|png)$/i.test(file.name || '');
            if (!okType) {
              toast('Ảnh Social/OG phải là JPEG hoặc PNG', 'danger');
              fileEl.value = '';
              return;
            }
          }
          var pageKey = val('seo-p-pageKey');
          var fd = new FormData();
          fd.append('file', file);
          if (fieldRef === 'social' || fieldRef === 'og') fd.append('purpose', fieldRef);
          var h = authHeaders();
          delete h['Content-Type'];
          fetch(apiBase() + '/admin/media/upload', { method: 'POST', headers: h, body: fd })
            .then(function (res) {
              return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) throw new Error(((data.error || {}).message) || data.message || ('HTTP ' + res.status));
                return (data && data.data) ? data.data : data;
              });
            })
            .then(function (d) {
              var asset = d.asset || {};
              setVal(urlId, asset.public_url || asset.url || '');
              setVal(assetIdId, asset.id || '');
              return registerUsage(asset.id, pageKey, fieldRef);
            })
            .then(function () { toast('Đã tải ảnh', 'success'); })
            .catch(function (e) { toast(e.message || 'Lỗi tải ảnh', 'danger'); });
          fileEl.value = '';
        });
      }
      function bindUploadBtn(btnId, fileId) {
        var btn = document.getElementById(btnId);
        var file = document.getElementById(fileId);
        if (btn && file) btn.addEventListener('click', function () { file.click(); });
      }
      bindUploadBtn('seo-p-og-upload', 'seo-p-og-file');
      bindUploadBtn('seo-p-social-upload', 'seo-p-social-file');
      uploadTo('seo-p-og-file', 'seo-p-ogImageUrl', 'seo-p-ogImageAssetId', 'og');
      uploadTo('seo-p-social-file', 'seo-p-socialImageUrl', 'seo-p-socialImageAssetId', 'social');

      var sel = document.getElementById('seo-p-pageKey');
      if (sel && global.PageSettingsCatalog) {
        var cat = PageSettingsCatalog;
        /* pricing nằm PLATFORM_PAGES — cần trong Thiết lập SEO (Owner 2026-08-10) */
        var pages = [].concat(
          cat.DEFAULT_PAGES || [],
          (cat.PLATFORM_PAGES || []).filter(function (p) { return p && p.key === 'pricing'; }),
          cat.KNOWLEDGE_PAGES || [],
          cat.COMMUNITY_PAGES || []
        );
        sel.innerHTML = pages.map(function (p) {
          return '<option value="' + esc(p.key) + '">' + esc(p.title || p.key) + ' (' + esc(p.key) + ')</option>';
        }).join('');
      }

      function loadPage() {
        var pageKey = val('seo-p-pageKey');
        if (!pageKey) return;
        return Promise.all([
          request('/admin/seo/pages/' + encodeURIComponent(pageKey)),
          request('/admin/seo/preview?pageKey=' + encodeURIComponent(pageKey))
        ]).then(function (pair) {
          var d = pair[0] || {};
          var preview = pair[1] || {};
          var p = d.payload || {};
          setVal('seo-p-seoTitle', p.seoTitle || '');
          setVal('seo-p-metaDescription', p.metaDescription || '');
          setVal('seo-p-ogImageUrl', p.ogImageUrl || '');
          setVal('seo-p-ogImageAssetId', p.ogImageAssetId || '');
          setVal('seo-p-ogImageAlt', p.ogImageAlt || '');
          setVal('seo-p-socialImageUrl', p.socialImageUrl || '');
          setVal('seo-p-socialImageAssetId', p.socialImageAssetId || '');
          ['seoTitle', 'metaDescription', 'ogImageUrl', 'ogImageAlt', 'socialImageUrl'].forEach(function (k) {
            setSrc(k, preview.fields);
          });
          applyAltHint(preview.fields);
        }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
      }
      if (sel) sel.addEventListener('change', loadPage);
      loadPage();

      var save = document.getElementById('seo-p-save');
      if (save) {
        save.addEventListener('click', function () {
          var pageKey = val('seo-p-pageKey');
          if (!pageKey) return;
          var body = {
            seoTitle: val('seo-p-seoTitle'),
            metaDescription: val('seo-p-metaDescription'),
            ogImageUrl: val('seo-p-ogImageUrl'),
            ogImageAssetId: val('seo-p-ogImageAssetId') || null,
            ogImageAlt: val('seo-p-ogImageAlt'),
            socialImageUrl: val('seo-p-socialImageUrl'),
            socialImageAssetId: val('seo-p-socialImageAssetId') || null
          };
          request('/admin/seo/pages/' + encodeURIComponent(pageKey), { method: 'PUT', body: body })
            .then(function () {
              return Promise.all([
                registerUsage(body.ogImageAssetId, pageKey, 'og'),
                registerUsage(body.socialImageAssetId, pageKey, 'social')
              ]);
            })
            .then(function () { toast('Đã lưu SEO trang', 'success'); return loadPage(); })
            .catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
        });
      }
    },
    initComments: function () {
      crudPage({
        listPath: '/admin/news-ops/comments', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody',
        delPerm: 'news.comments.delete',
        rowHtml: function (r, actions) {
          return '<tr><td>' + esc(r.author) + '</td><td>' + esc(r.body) + '</td><td>' + esc(r.status) +
            '</td><td>' + actions + '</td></tr>';
        }
      });
    },
    initReports: function () {
      crudPage({
        listPath: '/admin/news-ops/reports', countId: 'adm-wd-count', tbodyId: 'adm-wd-tbody',
        editPerm: 'news.reports.edit',
        buildEdit: function () { return { status: 'resolved' }; },
        rowHtml: function (r, actions) {
          return '<tr><td>' + esc(r.target_type) + '/' + esc(r.target_id) + '</td><td>' + esc(r.reason) +
            '</td><td>' + esc(r.status) + '</td><td>' + actions + '</td></tr>';
        }
      });
    },
    initContentDash: function () {
      request('/admin/news-ops/content-dashboard').then(function (d) {
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
