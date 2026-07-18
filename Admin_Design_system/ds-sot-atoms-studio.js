/* DS SoT — Atoms: Component tokens · Semantic + Primitive refs · live preview */
(function (global) {
  'use strict';

  var AC = global.IfluxDsAtomsCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  var DC = global.IfluxDsDesignTokensCatalog;
  if (!AC || !PC) return;

  var LS_PREFIX = 'iflux-ds-atom:';
  var DT_LS_PREFIX = 'iflux-ds-dt:';
  var store = { server: {}, dtPrim: {}, loaded: false };
  var saveTimers = {};
  var semanticIndex = null;

  function apiBase() {
    if (global.location.protocol === 'file:') return '';
    return global.location.protocol + '//' + global.location.host + '/api/ds-sot';
  }

  function buildSemanticIndex() {
    if (semanticIndex) return semanticIndex;
    semanticIndex = {};
    if (!DC || !DC.allEntries) return semanticIndex;
    DC.allEntries().forEach(function (e) {
      semanticIndex[e.logicalId] = e;
    });
    return semanticIndex;
  }

  function domPropId(bundle, property) {
    return bundle.id + '--' + property.key;
  }

  function readLocal(id) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + id) || 'null'); } catch (e) { return null; }
  }

  function writeLocal(id, data) {
    try { localStorage.setItem(LS_PREFIX + id, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function mergeDtOverridesFromStorage() {
    var map = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(DT_LS_PREFIX) !== 0) continue;
        var data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data && data.token && data.logicalId) map[data.logicalId] = data.token;
      }
    } catch (e) { /* ignore */ }
    return map;
  }

  function getOverride(groupTitle, bundle, property) {
    var id = AC.propKey(groupTitle, bundle, property);
    if (store.server[id]) return store.server[id];
    return readLocal(id);
  }

  function resolvePropRef(groupTitle, bundle, property) {
    var ov = getOverride(groupTitle, bundle, property);
    if (ov && ov.token) {
      return { refKind: ov.refKind || property.refKind, token: ov.token };
    }
    return { refKind: property.refKind, token: property.token };
  }

  function primitiveValue(tokenId) {
    if (!tokenId) return '';
    if (PC.resolveLiteralValue) return PC.resolveLiteralValue(tokenId);
    return PC.resolveToken(tokenId).value || '';
  }

  function semanticPrimitive(logicalId) {
    var idx = buildSemanticIndex();
    var entry = idx[logicalId];
    if (!entry) return '';
    if (store.dtPrim[logicalId]) return store.dtPrim[logicalId];
    return entry.token;
  }

  function resolveRefValue(refKind, token) {
    if (!token) return '';
    if (refKind === 'semantic') {
      var prim = semanticPrimitive(token);
      return prim ? primitiveValue(prim) : '';
    }
    return primitiveValue(token);
  }

  function cssPropFromKey(key, value) {
    if (!value) return {};
    if (key === 'background') return { backgroundColor: value };
    if (key === 'color') return { color: value };
    if (key === 'border-color') return { borderColor: value, borderWidth: '1px', borderStyle: 'solid' };
    if (key === 'padding-y') return { paddingTop: value, paddingBottom: value };
    if (key === 'padding-x') return { paddingLeft: value, paddingRight: value };
    if (key === 'radius') return { borderRadius: value };
    if (key === 'font-size') return { fontSize: value };
    if (key === 'font-weight') return { fontWeight: value };
    if (key === 'shadow') return { boxShadow: value };
    return {};
  }

  function applyPreviewStyles(bundleEl, groupTitle, bundle) {
    var host = bundleEl.querySelector('.ds-atom-preview');
    if (!host) return;
    var el = host.firstElementChild;
    if (!el) return;
    el.removeAttribute('style');
    var styleParts = [];
    bundle.properties.forEach(function (property) {
      var ref = resolvePropRef(groupTitle, bundle, property);
      var val = resolveRefValue(ref.refKind, ref.token);
      var css = cssPropFromKey(property.key, val);
      Object.keys(css).forEach(function (k) {
        styleParts.push(k.replace(/([A-Z])/g, '-$1').toLowerCase() + ':' + css[k]);
      });
    });
    if (styleParts.length) el.setAttribute('style', styleParts.join(';'));
  }

  function cssComponentBlock(className, variable, refKind, token) {
    var idx = buildSemanticIndex();
    var val = '';
    if (refKind === 'semantic' && idx[token]) {
      val = 'var(' + idx[token].variable + ')';
    } else {
      var prim = PC.resolveToken(token);
      val = 'var(' + (prim.cssVar || PC.tokenToCssVar(token)) + ')';
    }
    return className + ' {\n  ' + variable + ': ' + val + ';\n}';
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
  }

  function pushServer(id, payload, row) {
    var base = apiBase();
    var literal = resolveRefValue(payload.refKind, payload.token);
    var code = payload.variable && payload.className
      ? cssComponentBlock(payload.className, payload.variable, payload.refKind, payload.token)
      : '';
    if (!base) {
      writeLocal(id, payload);
      flashRow(row);
      return;
    }
    fetch(base + '/overrides/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: literal,
        code: code,
        html: '',
        meta: {
          kind: 'atom-ref',
          refKind: payload.refKind,
          token: payload.token,
          variable: payload.variable,
          property: payload.key,
          logicalId: payload.logicalId || '',
          className: payload.className || ''
        }
      })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok || !body.ok) throw new Error('fail');
        store.server[id] = payload;
        writeLocal(id, payload);
        flashRow(row);
      });
    }).catch(function () {
      writeLocal(id, payload);
      flashRow(row);
    });
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

  function tokenOptions(property, selected) {
    var refKind = property.refKind;
    var propType = property.property;
    if (refKind === 'semantic' && DC && DC.allEntries) {
      var list = DC.allEntries().filter(function (e) {
        if (propType === 'color' || propType === 'background' || propType === 'border-color') {
          return e.property === 'color';
        }
        return e.property === propType;
      });
      if (!list.length) list = DC.allEntries();
      return list.map(function (e) {
        var sel = e.logicalId === selected ? ' selected' : '';
        return '<option value="' + AC.esc(e.logicalId) + '"' + sel + '>' + AC.esc(e.logicalId) + '</option>';
      }).join('');
    }
    var primList = PC.getTokensByProperty(propType);
    if (!primList.length) return '<option value="">— không có token —</option>';
    return primList.map(function (it) {
      var sel = it.token === selected ? ' selected' : '';
      return '<option value="' + AC.esc(it.token) + '"' + sel + '>' + AC.esc(it.token) + ' · ' + AC.esc(it.name) + '</option>';
    }).join('');
  }

  function surfaceLabel(surface) {
    if (surface === 'user') return 'User';
    if (surface === 'admin') return 'Admin';
    return 'Shared';
  }

  function previewHtml(bundle) {
    var cls = bundle.className;
    var label = AC.esc(bundle.previewLabel || bundle.name);
    var pt = bundle.previewType;

    if (pt === 'button') {
      return '<button type="button" class="' + AC.esc(cls) + '" disabled>' + label + '</button>';
    }
    if (pt === 'button-icon') {
      return '<button type="button" class="' + AC.esc(cls) + '" disabled aria-label="' + label + '"><i class="ti ti-plus"></i></button>';
    }
    if (pt === 'input' || pt === 'textarea') {
      var tag = pt === 'textarea' ? 'textarea' : 'input';
      var extra = tag === 'input' ? ' type="text" disabled' : ' disabled rows="2"';
      return '<' + tag + ' class="' + AC.esc(cls) + '"' + extra + ' placeholder="' + label + '" style="max-width:140px"></' + tag + '>';
    }
    if (pt === 'select') {
      return '<select class="' + AC.esc(cls) + '" disabled style="max-width:140px"><option>' + label + '</option></select>';
    }
    if (pt === 'checkbox') {
      return '<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="' + AC.esc(cls) + '" checked disabled><span>' + label + '</span></label>';
    }
    if (pt === 'radio') {
      return '<input type="radio" class="' + AC.esc(cls) + '" checked disabled>';
    }
    if (pt === 'switch') {
      return '<label class="' + AC.esc(cls) + '"><input type="checkbox" checked disabled><span class="ix-switch-slider"></span></label>';
    }
    if (pt === 'segmented') {
      return '<div class="' + AC.esc(cls) + '"><span class="ix-segment is-active">A</span><span class="ix-segment">B</span></div>';
    }
    if (pt === 'label') {
      return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
    }
    if (pt === 'badge' || pt === 'pill') {
      return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
    }
    if (pt === 'badge-dot' || pt === 'dot') {
      return '<span class="' + AC.esc(cls) + '"></span>';
    }
    if (pt === 'chip') {
      return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
    }
    if (pt === 'avatar') {
      return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
    }
    if (pt === 'avatar-group') {
      return '<div class="' + AC.esc(cls) + '"><span class="ix-avatar ix-avatar-sm ix-avatar-accent">A</span><span class="ix-avatar ix-avatar-sm ix-avatar-accent">B</span><span class="ix-avatar-group-count">+3</span></div>';
    }
    if (pt === 'progress') {
      return '<div class="' + AC.esc(cls) + '"><div class="ix-progress-bar" style="width:62%"></div></div>';
    }
    if (pt === 'progress-circle') {
      return '<span class="' + AC.esc(cls) + '"></span>';
    }
    if (pt === 'skeleton') {
      return '<span class="' + AC.esc(cls) + '" style="width:80px"></span>';
    }
    if (pt === 'spinner' || pt === 'pulse') {
      return '<span class="' + AC.esc(cls) + '"></span>';
    }
    if (pt === 'divider') {
      return '<span class="' + AC.esc(cls) + '" style="display:inline-block;min-width:60px"></span>';
    }
    if (pt === 'tooltip') {
      return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
    }
    if (pt === 'link') {
      return '<a href="#" class="' + AC.esc(cls) + '" onclick="return false">' + label + '</a>';
    }
    if (pt === 'image') {
      return '<span class="' + AC.esc(cls) + '" role="img" aria-label="image"></span>';
    }
    if (pt === 'price' || pt === 'percent-up' || pt === 'percent-down' || pt === 'volume' || pt === 'money') {
      return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
    }
    return '<span class="' + AC.esc(cls) + '">' + label + '</span>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    if (!property || !property.key) return '';
    var id = AC.propKey(groupTitle, bundle, property);
    var domId = domPropId(bundle, property);
    var ref = resolvePropRef(groupTitle, bundle, property);
    var value = resolveRefValue(ref.refKind, ref.token);

    return '<div class="ds-ref-prop-row" data-ds-atom-prop="' + AC.esc(domId) + '">' +
      '<div class="ds-ref-prop-row__property">' +
        '<span>' + AC.esc(property.key) + '</span>' +
        '<span class="ds-ref-section__note">' + AC.esc(property.variable || '') + '</span>' +
      '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Token ' + AC.esc(property.key) + '">' +
        tokenOptions(property, ref.token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + AC.esc(value) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var propsHtml = bundle.properties.length
      ? bundle.properties.map(function (p) { return renderPropRow(groupTitle, bundle, p); }).join('')
      : '<div class="ds-ref-prop-row ds-ref-prop-row--empty"><div class="ds-ref-prop-row__property">—</div><div class="ds-ref-prop-row__token">Anatomy only</div><div class="ds-ref-prop-row__value">—</div></div>';

    return '<div class="ds-ref-bundle" data-ds-atom-bundle="' + AC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview ds-atom-preview">' + previewHtml(bundle) + '</div>' +
      '<div class="ds-ref-bundle__name">' +
        '<span class="ds-ref-bundle__name-title">' + AC.esc(bundle.name) + '</span>' +
        '<span class="ds-ref-bundle__name-meta">' + AC.esc(surfaceLabel(bundle.surface)) + '</span>' +
        '<span class="ds-ref-bundle__name-class">' + AC.esc(bundle.className) + '</span>' +
      '</div>' +
      '<div class="ds-ref-bundle__details">' + propsHtml + '</div>' +
    '</div>';
  }

  function renderSection(group) {
    var note = group.note ? ' <span class="ds-ref-section__note">' + AC.esc(group.note) + '</span>' : '';
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + AC.esc(group.title) +
        ' <span class="ds-ref-section__count">' + group.items.length + '</span>' + note +
      '</h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Property · CSS var</span><span>Token</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(function (b) { return renderBundle(group.title, b); }).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = AC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var counts = AC.pageCounts();
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + AC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + counts.total + ' atoms · ' + counts.shared + ' shared · ' + counts.user + ' user · ' +
          'Color → <strong>Design Token</strong> · Layout → <strong>Primitive</strong> · preview HTML thật · Component tokens (không Item/Block)</p>' +
      '</div>' +
      groups.map(renderSection).join('') +
    '</div>';
  }

  function updateBundlePreview(bundleEl, groupTitle, bundle) {
    var host = bundleEl.querySelector('.ds-ref-bundle__preview');
    if (host) host.innerHTML = previewHtml(bundle);
    applyPreviewStyles(bundleEl, groupTitle, bundle);
  }

  function bindPage(root, pageCopy) {
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : AC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        var bundleEl = root.querySelector('[data-ds-atom-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        applyPreviewStyles(bundleEl, group.title, bundle);
        bundle.properties.forEach(function (property) {
          var id = AC.propKey(group.title, bundle, property);
          var domId = domPropId(bundle, property);
          var row = bundleEl.querySelector('[data-ds-atom-prop="' + domId + '"]');
          if (!row) return;
          var select = row.querySelector('[data-ds-token]');
          var valueEl = row.querySelector('[data-ds-value]');
          select.addEventListener('change', function () {
            var token = select.value;
            var refKind = property.refKind;
            var payload = {
              refKind: refKind,
              token: token,
              key: property.key,
              variable: property.variable,
              logicalId: bundle.logicalId,
              className: bundle.className
            };
            store.server[id] = payload;
            valueEl.textContent = resolveRefValue(refKind, token);
            updateBundlePreview(bundleEl, group.title, bundle);
            scheduleSave(id, payload, row);
          });
        });
      });
    });
  }

  function mergePrimitiveOverridesFromStorage(map) {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('iflux-ds-pt:') !== 0) continue;
        var pid = key.slice('iflux-ds-pt:'.length);
        var data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data && (data.token || data.value != null)) map[pid] = data;
      }
    } catch (e) { /* ignore */ }
    return map;
  }

  function syncPrimitiveOverrides() {
    semanticIndex = null;
    store.dtPrim = mergeDtOverridesFromStorage();
    var map = {};
    var base = apiBase();
    var done = function () {
      mergePrimitiveOverridesFromStorage(map);
      PC.setPrimitiveOverrides(map);
      buildSemanticIndex();
    };
    if (!base) {
      done();
      return Promise.resolve();
    }
    return fetch(base + '/overrides')
      .then(function (r) { return r.json(); })
      .then(function (body) {
        if (body && body.items) {
          Object.keys(body.items).forEach(function (k) {
            if (k.indexOf('primitive-tokens::') === 0) {
              var entry = body.items[k];
              if (entry && entry.meta) {
                map[k] = {
                  token: entry.meta.token || '',
                  value: entry.value,
                  cssVar: entry.meta.cssVar || ''
                };
              }
            }
            if (k.indexOf('design-tokens::') === 0) {
              var dt = body.items[k];
              if (dt && dt.meta && dt.meta.logicalId && dt.meta.token) {
                store.dtPrim[dt.meta.logicalId] = dt.meta.token;
              }
            }
          });
        }
        done();
      })
      .catch(function () { done(); });
  }

  function loadServerOverrides() {
    var base = apiBase();
    var prim = syncPrimitiveOverrides();
    if (!base) {
      store.loaded = true;
      return prim.then(function () { store.loaded = true; });
    }
    return Promise.all([
      prim,
      fetch(base + '/overrides').then(function (r) { return r.json(); })
    ]).then(function (results) {
      var body = results[1];
      if (body && body.items) {
        Object.keys(body.items).forEach(function (k) {
          if (k.indexOf('atoms::') !== 0) return;
          var entry = body.items[k];
          if (entry && entry.meta && entry.meta.token) {
            store.server[k] = {
              refKind: entry.meta.refKind,
              token: entry.meta.token,
              key: entry.meta.property,
              variable: entry.meta.variable || '',
              logicalId: entry.meta.logicalId || ''
            };
          }
        });
      }
      store.loaded = true;
    }).catch(function () { store.loaded = true; });
  }

  global.IfluxDsAtomsStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
