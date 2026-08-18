/* DS SoT — Design Tokens: Semantic + Business · map --color-* / --biz-* */
(function (global) {
  'use strict';

  var DC = global.IfluxDsDesignTokensCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  if (!DC || !PC) return;

  var LS_PREFIX = 'iflux-ds-dt:';
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

  function getOverride(groupTitle, bundle, property) {
    var id = DC.propKey(groupTitle, bundle, property);
    if (store.server[id]) return store.server[id];
    return readLocal(id);
  }

  function resolvePropToken(groupTitle, bundle, property) {
    var ov = getOverride(groupTitle, bundle, property);
    return (ov && ov.token) ? ov.token : property.token;
  }

  function cssRefBlock(variable, primitiveCssVar) {
    return ':root,\n[data-theme="dark"] {\n  ' + variable + ': var(' + primitiveCssVar + ');\n}';
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
  }

  function primitiveValue(tokenId) {
    if (!tokenId) return '';
    if (PC.resolveLiteralValue) return PC.resolveLiteralValue(tokenId);
    return PC.resolveToken(tokenId).value || '';
  }

  function pushServer(id, payload, row) {
    var base = apiBase();
    var prim = PC.resolveToken(payload.token);
    var literal = primitiveValue(payload.token);
    var code = payload.variable
      ? cssRefBlock(payload.variable, prim.cssVar || PC.tokenToCssVar(payload.token))
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
          kind: 'design-token-ref',
          tier: payload.tier || 'semantic',
          logicalId: payload.logicalId || '',
          token: payload.token,
          variable: payload.variable,
          property: payload.property,
          primitiveCssVar: prim.cssVar
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

  function tokenOptions(propType, selected) {
    var list = PC.getTokensByProperty(propType);
    if (!list.length) {
      return '<option value="">— không có primitive —</option>';
    }
    return list.map(function (it) {
      var sel = it.token === selected ? ' selected' : '';
      return '<option value="' + DC.esc(it.token) + '"' + sel + '>' + DC.esc(it.token) + ' · ' + DC.esc(it.name) + '</option>';
    }).join('');
  }

  function bundleResolvedProps(groupTitle, bundle) {
    return bundle.properties.map(function (p) {
      var token = resolvePropToken(groupTitle, bundle, p);
      return {
        property: p,
        token: token,
        value: primitiveValue(token)
      };
    });
  }

  function previewHtml(bundle, resolved) {
    var pt = bundle.previewType;
    var color = resolved.find(function (r) { return r.property.property === 'color'; });
    var shadow = resolved.find(function (r) { return r.property.property === 'shadow'; });

    if ((pt === 'color' || pt === 'market-up' || pt === 'market-down') && color) {
      return '<div class="ds-ref-preview__swatch" style="background-color:' + DC.esc(color.value) + '"></div>';
    }
    if (pt === 'shadow' && shadow) {
      return '<div class="ds-ref-preview__shadow" style="box-shadow:' + DC.esc(shadow.value) + '"></div>';
    }
    return '<i class="ti ' + DC.esc(bundle.icon) + ' ds-ref-preview__icon"></i>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    var id = DC.propKey(groupTitle, bundle, property);
    var token = resolvePropToken(groupTitle, bundle, property);
    var logical = property.logicalId || property.property;
    return '<div class="ds-ref-prop-row" data-ds-dt-prop="' + DC.esc(id) + '">' +
      '<div class="ds-ref-prop-row__property">' +
        '<span>' + DC.esc(logical) + '</span>' +
        '<span class="ds-ref-section__note">' + DC.esc(property.variable) + '</span>' +
      '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Primitive ' + DC.esc(logical) + '">' +
        tokenOptions(property.property, token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + DC.esc(primitiveValue(token)) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var resolved = bundleResolvedProps(groupTitle, bundle);
    var propsHtml = bundle.properties.map(function (p) {
      return renderPropRow(groupTitle, bundle, p);
    }).join('');

    return '<div class="ds-ref-bundle" data-ds-dt-bundle="' + DC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview">' + previewHtml(bundle, resolved) + '</div>' +
      '<div class="ds-ref-bundle__name">' + DC.esc(bundle.name) + '</div>' +
      '<div class="ds-ref-bundle__details">' + propsHtml + '</div>' +
    '</div>';
  }

  function renderSection(group) {
    var tierLabel = group.tier === 'business' ? 'Business' : 'Semantic';
    var note = group.note
      ? ' <span class="ds-ref-section__note">' + DC.esc(group.note) + '</span>'
      : '';
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + DC.esc(group.title) +
        ' <span class="ds-ref-section__count">' + group.items.length + '</span>' +
        ' <span class="ds-ref-section__note">· ' + tierLabel + '</span>' + note +
      '</h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Token ID · CSS var</span><span>Primitive</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(function (b) { return renderBundle(group.title, b); }).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = DC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var counts = DC.pageCounts();
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + DC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + counts.total + ' mục · ' + counts.semantic + ' semantic · ' + counts.business + ' business · ' +
          'map <strong>--color-*</strong> / <strong>--biz-*</strong> · Primitive → Value readonly · <strong>không</strong> chứa Component tokens (Atoms)</p>' +
      '</div>' +
      groups.map(renderSection).join('') +
    '</div>';
  }

  function updateBundlePreview(bundleEl, groupTitle, bundle) {
    var resolved = bundleResolvedProps(groupTitle, bundle);
    var host = bundleEl.querySelector('.ds-ref-bundle__preview');
    if (host) host.innerHTML = previewHtml(bundle, resolved);
  }

  function bindPage(root, pageCopy) {
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : DC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        var bundleEl = root.querySelector('[data-ds-dt-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        bundle.properties.forEach(function (property) {
          var id = DC.propKey(group.title, bundle, property);
          var row = bundleEl.querySelector('[data-ds-dt-prop="' + id + '"]');
          if (!row) return;
          var select = row.querySelector('[data-ds-token]');
          var valueEl = row.querySelector('[data-ds-value]');
          select.addEventListener('change', function () {
            var token = select.value;
            var payload = {
              token: token,
              property: property.property,
              variable: property.variable,
              logicalId: property.logicalId || '',
              tier: bundle.tier || group.tier || 'semantic'
            };
            store.server[id] = payload;
            valueEl.textContent = primitiveValue(token);
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
        var id = key.slice('iflux-ds-pt:'.length);
        var data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data && (data.token || data.value != null)) map[id] = data;
      }
    } catch (e) { /* ignore */ }
    return map;
  }

  function syncPrimitiveOverrides() {
    var map = {};
    var base = apiBase();
    var done = function () {
      mergePrimitiveOverridesFromStorage(map);
      PC.setPrimitiveOverrides(map);
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
            if (k.indexOf('primitive-tokens::') !== 0) return;
            var entry = body.items[k];
            if (entry && entry.meta) {
              map[k] = {
                token: entry.meta.token || '',
                value: entry.value,
                cssVar: entry.meta.cssVar || ''
              };
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
          if (k.indexOf('design-tokens::') !== 0) return;
          var entry = body.items[k];
          if (entry && entry.meta && entry.meta.token) {
            store.server[k] = {
              token: entry.meta.token,
              property: entry.meta.property,
              variable: entry.meta.variable || '',
              logicalId: entry.meta.logicalId || ''
            };
          }
        });
      }
      store.loaded = true;
    }).catch(function () { store.loaded = true; });
  }

  global.IfluxDsDesignTokensStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
