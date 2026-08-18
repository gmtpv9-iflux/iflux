/* DS SoT — Foundations: Preview 4/12 | Tên 2/12 | Property·Token·Value 6/12 */
(function (global) {
  'use strict';

  var FC = global.IfluxDsFoundationsCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  if (!FC || !PC) return;

  var LS_PREFIX = 'iflux-ds-fdn:';
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
    var id = FC.propKey(groupTitle, bundle, property);
    if (store.server[id]) return store.server[id];
    return readLocal(id);
  }

  function resolvePropToken(groupTitle, bundle, property) {
    var ov = getOverride(groupTitle, bundle, property);
    return (ov && ov.token) ? ov.token : property.token;
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
          kind: 'foundation-ref',
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
      return '<option value="' + FC.esc(it.token) + '"' + sel + '>' + FC.esc(it.token) + ' · ' + FC.esc(it.name) + '</option>';
    }).join('');
  }

  function primitiveValue(tokenId) {
    if (!tokenId) return '';
    if (PC.resolveLiteralValue) return PC.resolveLiteralValue(tokenId);
    return PC.resolveToken(tokenId).value || '';
  }

  function bundleResolvedProps(groupTitle, bundle) {
    return bundle.properties.map(function (p) {
      var token = resolvePropToken(groupTitle, bundle, p);
      var prim = PC.resolveToken(token);
      return {
        property: p,
        token: token,
        value: primitiveValue(token),
        cssVar: prim.cssVar
      };
    });
  }

  function previewHtml(bundle, resolved) {
    var pt = bundle.previewType;
    var color = resolved.find(function (r) { return r.property.property === 'color'; });
    var radius = resolved.find(function (r) { return r.property.property === 'radius'; });
    var shadow = resolved.find(function (r) { return r.property.property === 'shadow'; });
    var spacing = resolved.find(function (r) { return r.property.property === 'spacing'; });
    var border = resolved.find(function (r) { return r.property.property === 'border-width'; });
    var fs = resolved.find(function (r) { return r.property.property === 'font-size'; });
    var fw = resolved.find(function (r) { return r.property.property === 'font-weight'; });
    var ff = resolved.find(function (r) { return r.property.property === 'font-family'; });
    var lh = resolved.find(function (r) { return r.property.property === 'line-height'; });

    if (pt === 'guideline') {
      return '<i class="ti ' + FC.esc(bundle.icon) + ' ds-ref-preview__icon"></i>';
    }
    if (pt === 'color' && color) {
      return '<div class="ds-ref-preview__swatch" style="background-color:' + FC.esc(color.value) + '"></div>';
    }
    if (pt === 'typography') {
      var style = '';
      if (fs) style += 'font-size:' + fs.value + ';';
      if (fw) style += 'font-weight:' + fw.value + ';';
      if (ff) style += 'font-family:' + ff.value + ';';
      if (lh) style += 'line-height:' + lh.value + ';';
      return '<span class="ds-ref-preview__type" style="' + style + '">Aa</span>';
    }
    if (pt === 'radius' && radius) {
      return '<div class="ds-ref-preview__radius" style="border-radius:' + FC.esc(radius.value) + '"></div>';
    }
    if (pt === 'shadow' && shadow) {
      return '<div class="ds-ref-preview__shadow" style="box-shadow:' + FC.esc(shadow.value) + '"></div>';
    }
    if (pt === 'spacing' && spacing) {
      return '<div class="ds-ref-preview__space" style="width:' + FC.esc(spacing.value) + '"></div>';
    }
    if (pt === 'border' && border) {
      return '<div class="ds-ref-preview__border" style="border-width:' + FC.esc(border.value) + '"></div>';
    }
    if (pt === 'breakpoint') {
      var bp = resolved.find(function (r) { return r.property.property === 'breakpoint'; });
      return '<span class="ds-ref-preview__mono">' + FC.esc(bp ? bp.value : '—') + '</span>';
    }
    if (pt === 'motion') {
      return '<i class="ti ' + FC.esc(bundle.icon) + ' ds-ref-preview__icon"></i>';
    }
    if (pt === 'opacity') {
      var op = resolved.find(function (r) { return r.property.property === 'opacity'; });
      return '<div class="ds-ref-preview__opacity" style="opacity:' + FC.esc(op ? op.value : '1') + '"><span>Aa</span></div>';
    }
    if (pt === 'text') {
      var gc = resolved.find(function (r) { return r.property.property === 'grid-columns'; });
      return '<span class="ds-ref-preview__mono">' + FC.esc(gc ? gc.value : '—') + '</span>';
    }
    return '<i class="ti ' + FC.esc(bundle.icon) + ' ds-ref-preview__icon"></i>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    var id = FC.propKey(groupTitle, bundle, property);
    var token = resolvePropToken(groupTitle, bundle, property);
    var prim = PC.resolveToken(token);
    return '<div class="ds-ref-prop-row" data-ds-fdn-prop="' + FC.esc(id) + '">' +
      '<div class="ds-ref-prop-row__property">' + FC.esc(property.property) + '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Token ' + FC.esc(property.property) + '">' +
        tokenOptions(property.property, token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + FC.esc(primitiveValue(token)) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var resolved = bundleResolvedProps(groupTitle, bundle);
    var propsHtml = bundle.properties.length
      ? bundle.properties.map(function (p) { return renderPropRow(groupTitle, bundle, p); }).join('')
      : '<div class="ds-ref-prop-row ds-ref-prop-row--empty"><div class="ds-ref-prop-row__property">—</div><div class="ds-ref-prop-row__token">Quy chuẩn · không tham chiếu primitive</div><div class="ds-ref-prop-row__value">—</div></div>';

    return '<div class="ds-ref-bundle" data-ds-fdn-bundle="' + FC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview">' + previewHtml(bundle, resolved) + '</div>' +
      '<div class="ds-ref-bundle__name">' + FC.esc(bundle.name) + '</div>' +
      '<div class="ds-ref-bundle__details">' + propsHtml + '</div>' +
    '</div>';
  }

  function renderSection(group) {
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + FC.esc(group.title) + '</h2>' +
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
    var page = FC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var total = 0;
    groups.forEach(function (g) { total += g.items.length; });
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + FC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + total + ' mục · ' + groups.length + ' nhóm · Token chọn từ <strong>Primitive Tokens</strong> · Value tự resolve</p>' +
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
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : FC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        var bundleEl = root.querySelector('[data-ds-fdn-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        bundle.properties.forEach(function (property) {
          var id = FC.propKey(group.title, bundle, property);
          var row = bundleEl.querySelector('[data-ds-fdn-prop="' + id + '"]');
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
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var data = JSON.parse(raw);
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
          if (k.indexOf('foundations::') !== 0) return;
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

  global.IfluxDsFoundationsStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
