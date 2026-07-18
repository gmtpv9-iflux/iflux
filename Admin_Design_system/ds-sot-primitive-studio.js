/* DS SoT — Primitive Tokens: Preview 4/12 | Tên 2/12 | Property·Token·Value 6/12 */
(function (global) {
  'use strict';

  var PC = global.IfluxDsPrimitiveCatalog;
  if (!PC) return;

  var LS_PREFIX = 'iflux-ds-pt:';
  var store = { server: {}, loaded: false };
  var saveTimers = {};

  function apiBase() {
    if (global.location.protocol === 'file:') return '';
    return global.location.protocol + '//' + global.location.host + '/api/ds-sot';
  }

  function readLocal(id) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + id) || 'null'); } catch (e) { return null; }
  }

  function writeLocal(id, data) {
    try { localStorage.setItem(LS_PREFIX + id, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function getOverride(groupTitle, item) {
    var id = PC.propKey(groupTitle, item);
    if (store.server[id]) return store.server[id];
    return readLocal(id);
  }

  function resolveItem(groupTitle, item) {
    var ov = getOverride(groupTitle, item);
    return {
      token: (ov && ov.token) ? ov.token : item.token,
      value: (ov && ov.value != null) ? ov.value : item.value,
      cssVar: (ov && ov.cssVar) ? ov.cssVar : item.cssVar
    };
  }

  function cssBlock(variable, value) {
    return ':root {\n  ' + variable + ': ' + value + ';\n}';
  }

  function tokenToCssVar(token) {
    return PC.tokenToCssVar(token);
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
  }

  function pushServer(id, payload, row) {
    var base = apiBase();
    var code = cssBlock(payload.cssVar, payload.value);
    if (!base) {
      writeLocal(id, payload);
      flashRow(row);
      syncCatalogOverrides();
      return;
    }
    fetch(base + '/overrides/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: payload.value,
        code: code,
        html: '',
        meta: { token: payload.token, cssVar: payload.cssVar, kind: 'primitive-token' }
      })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok || !body.ok) throw new Error('fail');
        store.server[id] = payload;
        writeLocal(id, payload);
        flashRow(row);
        syncCatalogOverrides();
      });
    }).catch(function () {
      writeLocal(id, payload);
      flashRow(row);
      syncCatalogOverrides();
    });
  }

  function syncCatalogOverrides() {
    var map = {};
    Object.keys(store.server).forEach(function (k) { map[k] = store.server[k]; });
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf(LS_PREFIX) === 0) {
          var id = key.slice(LS_PREFIX.length);
          if (!map[id]) map[id] = readLocal(id);
        }
      }
    } catch (e) { /* ignore */ }
    PC.setPrimitiveOverrides(map);
  }

  function scheduleSave(id, payload, row) {
    writeLocal(id, payload);
    row.classList.add('is-pending');
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(function () {
      row.classList.remove('is-pending');
      pushServer(id, payload, row);
    }, 600);
  }

  function previewCell(item, resolved) {
    var pt = item.previewType;
    var val = resolved.value;
    if (pt === 'color') {
      return '<div class="ds-ref-preview__swatch" data-ds-preview style="background-color:' + PC.esc(val) + '"></div>';
    }
    if (pt === 'spacing') {
      return '<div class="ds-ref-preview__space" data-ds-preview style="width:' + PC.esc(val) + '"></div>';
    }
    if (pt === 'radius') {
      return '<div class="ds-ref-preview__radius" data-ds-preview style="border-radius:' + PC.esc(val) + '"></div>';
    }
    if (pt === 'shadow') {
      return '<div class="ds-ref-preview__shadow" data-ds-preview style="box-shadow:' + PC.esc(val) + '"></div>';
    }
    if (pt === 'opacity') {
      return '<div class="ds-ref-preview__opacity" data-ds-preview style="opacity:' + PC.esc(val) + '"><span>Aa</span></div>';
    }
    if (pt === 'blur') {
      return '<div class="ds-ref-preview__blur" data-ds-preview style="filter:blur(' + PC.esc(val) + ')"><span>Aa</span></div>';
    }
    if (pt === 'font-size') {
      return '<span class="ds-ref-preview__type" data-ds-preview style="font-size:' + PC.esc(val) + '">Aa</span>';
    }
    if (pt === 'font-weight') {
      return '<span class="ds-ref-preview__type" data-ds-preview style="font-weight:' + PC.esc(val) + '">Aa</span>';
    }
    if (pt === 'line-height' || pt === 'letter-spacing') {
      var style = pt === 'line-height' ? 'line-height:' + val : 'letter-spacing:' + val;
      return '<span class="ds-ref-preview__type" data-ds-preview style="' + style + '">Aa Bb</span>';
    }
    if (pt === 'typography') {
      return '<span class="ds-ref-preview__type" data-ds-preview style="font-family:' + PC.esc(val) + '">Aa</span>';
    }
    if (pt === 'border-width') {
      return '<div class="ds-ref-preview__border" data-ds-preview style="border-width:' + PC.esc(val) + '"></div>';
    }
    return '<span class="ds-ref-preview__mono" data-ds-preview>' + PC.esc(val).slice(0, 12) + '</span>';
  }

  function renderRow(groupTitle, item) {
    var id = PC.propKey(groupTitle, item);
    var resolved = resolveItem(groupTitle, item);
    return '<div class="ds-ref-bundle ds-ref-bundle--primitive" data-ds-pt-id="' + PC.esc(id) + '">' +
      '<div class="ds-ref-bundle__preview">' + previewCell(item, resolved) + '</div>' +
      '<div class="ds-ref-bundle__name">' + PC.esc(item.name) + '</div>' +
      '<div class="ds-ref-bundle__details">' +
        '<div class="ds-ref-prop-row" data-ds-pt-prop>' +
          '<div class="ds-ref-prop-row__property">' + PC.esc(item.property) + '</div>' +
          '<input type="text" class="ds-ref-prop-row__token ds-ref-prop-row__token--edit" spellcheck="false" data-ds-token value="' + PC.esc(resolved.token) + '" aria-label="Token" />' +
          '<input type="text" class="ds-ref-prop-row__value ds-ref-prop-row__value--edit" spellcheck="false" data-ds-value value="' + PC.esc(resolved.value) + '" aria-label="Value" />' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSection(group) {
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + PC.esc(group.title) + '</h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Property</span><span>Token</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(function (item) { return renderRow(group.title, item); }).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = PC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var counts = { total: 0 };
    groups.forEach(function (g) { counts.total += g.items.length; });
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + PC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + counts.total + ' token · ' + page.groups.length + ' nhóm · SoT · sửa <strong>Token</strong> và <strong>Value</strong></p>' +
      '</div>' +
      groups.map(renderSection).join('') +
    '</div>';
  }

  function updatePreview(row, item, value) {
    var preview = row.querySelector('[data-ds-preview]');
    if (!preview) return;
    var pt = item.previewType;
    if (pt === 'color') preview.style.backgroundColor = value;
    if (pt === 'spacing') preview.style.width = value;
    if (pt === 'radius') preview.style.borderRadius = value;
    if (pt === 'shadow') preview.style.boxShadow = value;
    if (pt === 'opacity') preview.style.opacity = value;
    if (pt === 'blur') preview.style.filter = 'blur(' + value + ')';
    if (pt === 'font-size') preview.style.fontSize = value;
    if (pt === 'font-weight') preview.style.fontWeight = value;
    if (pt === 'line-height') preview.style.lineHeight = value;
    if (pt === 'letter-spacing') preview.style.letterSpacing = value;
    if (pt === 'typography') preview.style.fontFamily = value;
    if (pt === 'border-width') preview.style.borderWidth = value;
  }

  function bindPage(root, pageCopy) {
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : PC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (item) {
        var id = PC.propKey(group.title, item);
        var row = root.querySelector('[data-ds-pt-id="' + id + '"]');
        if (!row) return;
        var tokenInput = row.querySelector('[data-ds-token]');
        var valueInput = row.querySelector('[data-ds-value]');

        function save() {
          var token = tokenInput.value.trim();
          var value = valueInput.value;
          var cssVar = tokenToCssVar(token);
          updatePreview(row, item, value);
          scheduleSave(id, { token: token, value: value, cssVar: cssVar }, row);
        }

        tokenInput.addEventListener('input', save);
        valueInput.addEventListener('input', save);
      });
    });
  }

  function loadServerOverrides() {
    var base = apiBase();
    if (!base) { store.loaded = true; syncCatalogOverrides(); return Promise.resolve(); }
    return fetch(base + '/overrides')
      .then(function (r) { return r.json(); })
      .then(function (body) {
        if (body && body.items) {
          Object.keys(body.items).forEach(function (k) {
            if (k.indexOf('primitive-tokens::') !== 0) return;
            var entry = body.items[k];
            if (entry && entry.meta) {
              store.server[k] = {
                token: entry.meta.token || '',
                value: entry.value,
                cssVar: entry.meta.cssVar || ''
              };
            } else if (entry && typeof entry.value === 'string') {
              store.server[k] = { token: '', value: entry.value, cssVar: '' };
            }
          });
        }
        store.loaded = true;
        syncCatalogOverrides();
      })
      .catch(function () {
        store.loaded = true;
        syncCatalogOverrides();
      });
  }

  global.IfluxDsPrimitiveStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides
  };
})(window);
