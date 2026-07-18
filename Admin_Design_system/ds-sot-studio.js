/* DS SoT Studio — live UI preview + editable HTML + auto-save */
(function (global) {
  'use strict';

  var C = global.IfluxDsCatalog;
  if (!C) return;

  var LS_PREFIX = 'iflux-ds-sot:';
  var store = { server: {}, loaded: false };
  var saveTimers = {};
  var statusTimers = {};

  function slug(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
  }

  function itemId(secId, item) {
    return secId + '::' + slug(item.name);
  }

  function apiBase() {
    if (global.location.protocol === 'file:') return '';
    return (global.location.protocol + '//' + global.location.host + '/api/ds-sot');
  }

  function defaultHtml(it) {
    if (it.preview === 'tokens') return C.tokenPreviewHtml();
    if (it.preview && C.PREVIEWS[it.preview]) return C.PREVIEWS[it.preview];
    var hint = it.cls ? ' class gợi ý: ' + it.cls : '';
    return '<!-- Preview HTML — chỉnh trực tiếp, tự lưu' + hint + ' -->\n' +
      '<div class="ix-card" style="max-width:320px">\n' +
      '  <div class="ix-card-header"><div class="ix-card-title">' + C.esc(it.name) + '</div></div>\n' +
      '  <div class="ix-card-body" style="font-size:13px;color:var(--ix-text-muted)">Thêm markup UI tại đây.</div>\n' +
      '</div>';
  }

  function readLocal(id) {
    try {
      return localStorage.getItem(LS_PREFIX + id);
    } catch (e) {
      return null;
    }
  }

  function writeLocal(id, html) {
    try {
      localStorage.setItem(LS_PREFIX + id, html);
    } catch (e) { /* ignore */ }
  }

  function removeLocal(id) {
    try {
      localStorage.removeItem(LS_PREFIX + id);
    } catch (e) { /* ignore */ }
  }

  function resolveHtml(secId, item) {
    var id = itemId(secId, item);
    if (store.server[id] && typeof store.server[id].html === 'string') return store.server[id].html;
    var local = readLocal(id);
    if (local !== null) return local;
    return defaultHtml(item);
  }

  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = 'ds-sot-studio__status' + (kind ? ' is-' + kind : '');
    clearTimeout(statusTimers[el]);
    if (kind === 'ok' || kind === 'saved') {
      statusTimers[el] = setTimeout(function () {
        el.textContent = 'Đã lưu';
        el.className = 'ds-sot-studio__status is-saved';
      }, 2000);
    }
  }

  function pushServer(id, html, statusEl, meta) {
    var base = apiBase();
    if (!base) {
      writeLocal(id, html);
      setStatus(statusEl, 'Đã lưu (local)', 'saved');
      return;
    }
    setStatus(statusEl, 'Đang lưu…', 'pending');
    fetch(base + '/overrides/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: html, meta: meta || {} })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok || !body.ok) throw new Error((body && body.error) || 'Lưu thất bại');
        store.server[id] = { html: html, updatedAt: body.updatedAt };
        writeLocal(id, html);
        setStatus(statusEl, 'Đã lưu server', 'saved');
      });
    }).catch(function (err) {
      writeLocal(id, html);
      setStatus(statusEl, 'Offline — đã lưu local', 'warn');
      console.warn('[ds-sot-studio]', err);
    });
  }

  function scheduleSave(id, html, statusEl, meta) {
    writeLocal(id, html);
    setStatus(statusEl, 'Đang gõ…', 'pending');
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(function () {
      pushServer(id, html, statusEl, meta);
    }, 700);
  }

  function applyPreview(previewEl, html) {
    if (!previewEl) return;
    try {
      previewEl.innerHTML = html;
    } catch (err) {
      previewEl.innerHTML = '<div class="ix-alert ix-alert-danger" style="margin:0"><div class="ix-alert-text">HTML lỗi: ' + C.esc(err.message) + '</div></div>';
    }
  }

  function renderStudio(secId, item) {
    var id = itemId(secId, item);
    var html = resolveHtml(secId, item);
    var hasOverride = !!(store.server[id] || readLocal(id) !== null);

    return '<article class="ds-sandbox-item is-open ds-sot-item" id="ds-item-' + C.esc(id) + '" data-ds-item-id="' + C.esc(id) + '" data-status="' + item.status + '">' +
      '<div class="ds-sandbox-item__head ds-sot-item__head">' +
        C.statusBadge(item.status) +
        '<div><div class="ds-sot-studio__label ds-sot-studio__label--inline">Name</div>' +
        '<div class="ds-sandbox-item__name">' + C.esc(item.name) + '</div>' +
        (item.cls ? '<div class="ds-sandbox-item__code">' + C.esc(item.cls) + '</div>' : '') +
        '</div>' +
        (item.surface ? '<span class="ds-surface">' + C.esc(item.surface) + '</span>' : '') +
        (hasOverride ? '<span class="ix-chip ix-chip-warning">Đã chỉnh</span>' : '') +
      '</div>' +
      '<div class="ds-sandbox-item__body ds-sot-item__body">' +
        (item.file ? '<div class="ds-sandbox-item__row"><strong>File CSS/JS:</strong> <code>' + C.esc(item.file) + '</code></div>' : '') +
        (item.note ? '<div class="ds-sandbox-item__row"><strong>Ghi chú:</strong> ' + C.esc(item.note) + '</div>' : '') +
        '<div class="ds-sot-studio">' +
          '<div class="ds-sot-studio__col ds-sot-studio__col--preview">' +
            '<div class="ds-sot-studio__label"><i class="ti ti-eye"></i> Preview</div>' +
            '<div class="ds-sot-studio__preview ds-sandbox-preview" data-ds-preview-live></div>' +
          '</div>' +
          '<div class="ds-sot-studio__col ds-sot-studio__col--code">' +
            '<div class="ds-sot-studio__label"><i class="ti ti-file-text"></i> Summary' +
              '<span class="ds-sot-studio__status is-saved">Đã lưu</span>' +
              '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ds-reset title="Action — về mặc định catalog"><i class="ti ti-pencil"></i> Action</button>' +
            '</div>' +
            '<textarea class="ds-sot-studio__textarea" spellcheck="false" data-ds-summary aria-label="Summary"></textarea>' +
          '</div>' +
        '</div>' +
      '</div></article>';
  }

  function bindStudio(root, secId, item) {
    var id = itemId(secId, item);
    var article = root.querySelector('[data-ds-item-id="' + id + '"]');
    if (!article) return;

    var previewEl = article.querySelector('[data-ds-preview-live]');
    var textarea = article.querySelector('[data-ds-summary]');
    var statusEl = article.querySelector('.ds-sot-studio__status');
    var resetBtn = article.querySelector('[data-ds-reset]');
    if (!textarea || !previewEl) return;

    var html = resolveHtml(secId, item);
    textarea.value = html;
    applyPreview(previewEl, html);

    textarea.addEventListener('input', function () {
      applyPreview(previewEl, textarea.value);
      scheduleSave(id, textarea.value, statusEl, {
        sectionId: secId,
        name: item.name,
        preview: item.preview || null
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!global.confirm('Reset về HTML mặc định catalog?')) return;
        var base = defaultHtml(item);
        textarea.value = base;
        applyPreview(previewEl, base);
        removeLocal(id);
        delete store.server[id];
        var api = apiBase();
        if (api) {
          fetch(api + '/overrides/' + encodeURIComponent(id), { method: 'DELETE' }).catch(function () {});
        }
        setStatus(statusEl, 'Đã reset', 'ok');
      });
    }
  }

  function bindAll(root, secId, items) {
    items.forEach(function (it) {
      bindStudio(root, secId, it);
    });
  }

  function loadServerOverrides() {
    var base = apiBase();
    if (!base) {
      store.loaded = true;
      return Promise.resolve();
    }
    return fetch(base + '/overrides')
      .then(function (r) { return r.json(); })
      .then(function (body) {
        if (body && body.items) store.server = body.items;
        store.loaded = true;
      })
      .catch(function (err) {
        console.warn('[ds-sot-studio] load overrides', err);
        store.loaded = true;
      });
  }

  global.IfluxDsStudio = {
    itemId: itemId,
    renderStudio: renderStudio,
    bindAll: bindAll,
    loadServerOverrides: loadServerOverrides,
    resolveHtml: resolveHtml,
    defaultHtml: defaultHtml
  };
})(window);
