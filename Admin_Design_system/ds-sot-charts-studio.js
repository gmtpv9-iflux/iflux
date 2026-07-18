/* DS SoT — Charts: Data Visualization · token ref từ Primitive */
(function (global) {
  'use strict';

  var CC = global.IfluxDsChartsCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  if (!CC || !PC) return;

  var LS_PREFIX = 'iflux-ds-cht:';
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
    var id = CC.propKey(groupTitle, bundle, property);
    if (store.server[id]) return store.server[id];
    return readLocal(id);
  }

  function resolvePropToken(groupTitle, bundle, property) {
    if (property.readonly) return property.token;
    var ov = getOverride(groupTitle, bundle, property);
    return (ov && ov.token) ? ov.token : property.token;
  }

  function primitiveValue(tokenId) {
    if (!tokenId || tokenId === '—') return '';
    if (PC.resolveLiteralValue) return PC.resolveLiteralValue(tokenId);
    return PC.resolveToken(tokenId).value || '';
  }

  function cssRefBlock(variable, primitiveCssVar) {
    return ':root {\n  ' + variable + ': var(' + primitiveCssVar + ');\n}';
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
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
          kind: 'chart-ref',
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

  function tokenOptions(property, selected) {
    var list = PC.getTokensByProperty(property);
    if (!list.length) {
      return '<option value="">— không có primitive —</option>';
    }
    return list.map(function (it) {
      var sel = it.token === selected ? ' selected' : '';
      return '<option value="' + CC.esc(it.token) + '"' + sel + '>' + CC.esc(it.token) + ' · ' + CC.esc(it.name) + '</option>';
    }).join('');
  }

  function bundleResolvedProps(groupTitle, bundle) {
    return bundle.properties.map(function (p) {
      var token = resolvePropToken(groupTitle, bundle, p);
      return {
        property: p,
        token: token,
        value: p.readonly ? (p.value || '') : primitiveValue(token)
      };
    });
  }

  function previewHtml(bundle, resolved) {
    if (bundle.previewType === 'chart-type') {
      return '<i class="ti ' + CC.esc(bundle.icon) + ' ds-ref-preview__glyph"></i>';
    }
    var color = resolved.find(function (r) { return r.property.property === 'color'; });
    var spacing = resolved.find(function (r) { return r.property.property === 'spacing'; });
    var radius = resolved.find(function (r) { return r.property.property === 'radius'; });
    var shadow = resolved.find(function (r) { return r.property.property === 'shadow'; });
    var opacity = resolved.find(function (r) { return r.property.property === 'opacity'; });
    var border = resolved.find(function (r) { return r.property.property === 'border-width'; });
    var fs = resolved.find(function (r) { return r.property.property === 'font-size'; });
    var duration = resolved.find(function (r) { return r.property.property === 'duration'; });

    if (bundle.previewType === 'color' && color) {
      return '<div class="ds-ref-preview__swatch" style="background-color:' + CC.esc(color.value) + '"></div>';
    }
    if (bundle.previewType === 'spacing' && spacing) {
      return '<div class="ds-ref-preview__space" style="width:' + CC.esc(spacing.value) + '"></div>';
    }
    if (bundle.previewType === 'radius' && radius) {
      return '<div class="ds-ref-preview__radius" style="border-radius:' + CC.esc(radius.value) + '"></div>';
    }
    if (bundle.previewType === 'shadow' && shadow) {
      return '<div class="ds-ref-preview__shadow" style="box-shadow:' + CC.esc(shadow.value) + '"></div>';
    }
    if (bundle.previewType === 'opacity' && opacity) {
      return '<div class="ds-ref-preview__opacity" style="opacity:' + CC.esc(opacity.value) + '"><span>Aa</span></div>';
    }
    if (bundle.previewType === 'border-width' && border) {
      return '<div class="ds-ref-preview__border" style="border-width:' + CC.esc(border.value) + '"></div>';
    }
    if (bundle.previewType === 'font-size' && fs) {
      return '<span class="ds-ref-preview__type" style="font-size:' + CC.esc(fs.value) + '">12</span>';
    }
    if (bundle.previewType === 'duration' && duration) {
      return '<span class="ds-ref-preview__mono">' + CC.esc(duration.value) + '</span>';
    }
    return '<i class="ti ' + CC.esc(bundle.icon) + ' ds-ref-preview__glyph"></i>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    var id = CC.propKey(groupTitle, bundle, property);
    var token = resolvePropToken(groupTitle, bundle, property);
    var value = property.readonly ? (property.value || '') : primitiveValue(token);

    if (property.readonly) {
      return '<div class="ds-ref-prop-row ds-ref-prop-row--readonly">' +
        '<div class="ds-ref-prop-row__property">' + CC.esc(property.property) + '</div>' +
        '<div class="ds-ref-prop-row__token ds-ref-prop-row__token--readonly">' + CC.esc(token) + '</div>' +
        '<div class="ds-ref-prop-row__value">' + CC.esc(value) + '</div>' +
      '</div>';
    }

    return '<div class="ds-ref-prop-row" data-ds-cht-prop="' + CC.esc(id) + '">' +
      '<div class="ds-ref-prop-row__property">' + CC.esc(property.property) + '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Token ' + CC.esc(property.property) + '">' +
        tokenOptions(property.property, token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + CC.esc(value) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var resolved = bundleResolvedProps(groupTitle, bundle);
    var propsHtml = bundle.properties.map(function (p) {
      return renderPropRow(groupTitle, bundle, p);
    }).join('');

    return '<div class="ds-ref-bundle' + (bundle.readonly ? ' ds-ref-bundle--readonly' : '') + '" data-ds-cht-bundle="' + CC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview">' + previewHtml(bundle, resolved) + '</div>' +
      '<div class="ds-ref-bundle__name">' + CC.esc(bundle.name) + '</div>' +
      '<div class="ds-ref-bundle__details">' + propsHtml + '</div>' +
    '</div>';
  }

  function renderSection(group) {
    var note = group.kind === 'catalog'
      ? ' <span class="ds-ref-section__note">Catalogue · readonly · màu định danh ở Foundations → Data Visualization</span>'
      : '';
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + CC.esc(group.title) +
        ' <span class="ds-ref-section__count">' + group.items.length + '</span>' + note + '</h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Property</span><span>Token</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(function (b) { return renderBundle(group.title, b); }).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = CC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var total = 0;
    groups.forEach(function (g) { total += g.items.length; });
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + CC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + total + ' mục · ' + groups.length + ' nhóm · <strong>Data Visualization</strong> · Token từ Primitive · không chứa widget config</p>' +
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
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : CC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        if (bundle.readonly) return;
        var bundleEl = root.querySelector('[data-ds-cht-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        bundle.properties.forEach(function (property) {
          if (property.readonly) return;
          var id = CC.propKey(group.title, bundle, property);
          var row = bundleEl.querySelector('[data-ds-cht-prop="' + id + '"]');
          if (!row) return;
          var select = row.querySelector('[data-ds-token]');
          var valueEl = row.querySelector('[data-ds-value]');
          select.addEventListener('change', function () {
            var token = select.value;
            store.server[id] = {
              token: token,
              property: property.property,
              variable: property.variable
            };
            valueEl.textContent = primitiveValue(token);
            updateBundlePreview(bundleEl, group.title, bundle);
            scheduleSave(id, {
              token: token,
              property: property.property,
              variable: property.variable
            }, row);
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
          if (k.indexOf('charts::') !== 0) return;
          var entry = body.items[k];
          if (entry && entry.meta && entry.meta.token) {
            store.server[k] = {
              token: entry.meta.token,
              property: entry.meta.property,
              variable: entry.meta.variable || ''
            };
          }
        });
      }
      store.loaded = true;
    }).catch(function () { store.loaded = true; });
  }

  global.IfluxDsChartsStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
