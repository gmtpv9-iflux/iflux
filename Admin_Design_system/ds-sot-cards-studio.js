/* DS SoT — Cards: structure + chrome tokens · live preview */
(function (global) {
  'use strict';

  var CC = global.IfluxDsCardsCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  var DC = global.IfluxDsDesignTokensCatalog;
  if (!CC || !PC) return;

  var LS_PREFIX = 'iflux-ds-card:';
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
    var id = CC.propKey(groupTitle, bundle, property);
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

  function previewVarStyle(bundle, groupTitle) {
    var vars = [];
    bundle.properties.forEach(function (property) {
      var ref = resolvePropRef(groupTitle, bundle, property);
      var val = resolveRefValue(ref.refKind, ref.token);
      if (!val) return;
      if (property.key === 'gap') vars.push('--ds-preview-gap:' + val);
      if (property.key === 'padding-body') vars.push('--ds-preview-body-py:' + val);
      if (property.key === 'padding-head') vars.push('--ds-preview-head-py:' + val);
      if (property.key === 'radius') vars.push('--ds-preview-radius:' + val);
      if (property.key === 'background') vars.push('--ds-preview-bg:' + val);
      if (property.key === 'border-color') vars.push('--ds-preview-border:' + val);
    });
    return vars;
  }

  function applyPreviewStyles(bundleEl, groupTitle, bundle) {
    var host = bundleEl.querySelector('.ds-card-preview');
    if (!host) return;
    var el = host.querySelector('[data-ds-card-root]') || host.firstElementChild;
    if (!el) return;
    var vars = previewVarStyle(bundle, groupTitle);
    if (vars.length) el.setAttribute('style', vars.join(';'));
    else el.removeAttribute('style');
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
  }

  function pushServer(id, payload, row) {
    var base = apiBase();
    if (!base) {
      writeLocal(id, payload);
      flashRow(row);
      return;
    }
    fetch(base + '/overrides/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: resolveRefValue(payload.refKind, payload.token),
        code: '',
        html: '',
        meta: {
          kind: 'card-ref',
          refKind: payload.refKind,
          token: payload.token,
          variable: payload.variable,
          property: payload.key,
          logicalId: payload.logicalId || '',
          cardId: payload.cardId || ''
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
        if (propType === 'color') return e.property === 'color';
        return e.property === propType;
      });
      if (!list.length) list = DC.allEntries();
      return list.map(function (e) {
        var sel = e.logicalId === selected ? ' selected' : '';
        return '<option value="' + CC.esc(e.logicalId) + '"' + sel + '>' + CC.esc(e.logicalId) + '</option>';
      }).join('');
    }
    var primList = PC.getTokensByProperty(propType);
    if (!primList.length) return '<option value="">— không có token —</option>';
    return primList.map(function (it) {
      var sel = it.token === selected ? ' selected' : '';
      return '<option value="' + CC.esc(it.token) + '"' + sel + '>' + CC.esc(it.token) + ' · ' + CC.esc(it.name) + '</option>';
    }).join('');
  }

  function surfaceLabel(surface) {
    if (surface === 'user') return 'User';
    if (surface === 'admin') return 'Admin';
    return 'Shared';
  }

  function structureHtml(bundle) {
    var tree = CC.esc(bundle.structure || bundle.anatomy || '').replace(/\n/g, '<br>');
    var blocks = (bundle.blockRefs || []).length
      ? '<div class="ds-card-structure__refs"><span class="ds-card-structure__label">Blocks</span> ' +
        bundle.blockRefs.map(function (b) { return '<code>' + CC.esc(b) + '</code>'; }).join(' ') + '</div>'
      : '';
    var products = (bundle.productRefs || bundle.widgetRefs || []).length
      ? '<div class="ds-card-structure__refs ds-card-structure__refs--product"><span class="ds-card-structure__label">Product · Admin Library</span> ' +
        (bundle.productRefs || bundle.widgetRefs).map(function (w) { return '<code>' + CC.esc(w) + '</code>'; }).join(' ') +
        '<div class="ds-ref-section__note">Dashboard instance · mapping sau</div></div>'
      : '';
    var note = bundle.note
      ? '<div class="ds-card-structure__note">' + CC.esc(bundle.note) + '</div>'
      : '';
    return '<div class="ds-card-structure">' +
      '<div class="ds-card-structure__label">Regions · ' + CC.esc(bundle.regions || 'body') + '</div>' +
      '<pre class="ds-card-structure__tree">' + tree + '</pre>' +
      blocks + products + note +
    '</div>';
  }

  function previewHtml(bundle) {
    var pt = bundle.previewType;
    var e = CC.esc;

    if (pt === 'shell-generic') {
      return '<div class="ifx-block ifx-block--card ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Top 10 Ngành</h3></div>' +
        '<div class="ifx-block__body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Block mount</div></div>';
    }
    if (pt === 'shell-admin') {
      return '<div class="ix-card ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ix-card-header" style="padding:var(--ds-preview-head-py,var(--ifx-inset-widget))"><div class="ix-card-title" style="font-size:13px">KPI Dashboard</div></div>' +
        '<div class="ix-card-body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Admin block mount</div></div>';
    }
    if (pt === 'shell-market') {
      return '<div class="ifx-mkt-card ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Heatmap Ngành</h3></div>' +
        '<div class="ifx-mkt-card__body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Treemap / rank mount</div></div>';
    }
    if (pt === 'shell-liquidity') {
      return '<div class="ifx-mkt-liq-block ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>KLGD</h3></div>' +
        '<div class="ifx-mkt-liq-block__body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Area chart mount</div></div>';
    }
    if (pt === 'shell-sidebar') {
      return '<div class="ifx-mkt-sidebar-widget ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Độ rộng thị trường</h3></div>' +
        '<div class="ifx-mkt-sidebar-widget__body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Breadth mount</div></div>';
    }
    if (pt === 'shell-flow') {
      return '<div class="ifx-flow-card ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Mua/bán ròng</h3><p class="ifx-widget__subtitle">Theo cổ phiếu</p></div>' +
        '<div class="ifx-flow-card__body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Flow split mount</div></div>';
    }
    if (pt === 'shell-com-overview') {
      return '<div class="ifx-com-overview ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Tổng quan</h3></div>' +
        '<div class="ifx-com-overview__body" style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget))">' +
          '<div class="ifx-com-ex-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
            '<div class="ifx-com-ex-card" style="padding:6px;border:1px solid var(--ix-border);border-radius:8px"><div style="font-size:9px;color:var(--ix-text-muted)">VN-Index</div><div class="is-up" style="font-weight:700;font-size:13px">1,284</div></div>' +
            '<div class="ifx-com-ex-card" style="padding:6px;border:1px solid var(--ix-border);border-radius:8px"><div style="font-size:9px;color:var(--ix-text-muted)">HOSE</div><div class="is-up" style="font-weight:700;font-size:13px">1,102</div></div>' +
          '</div></div></div>';
    }
    if (pt === 'shell-com-breadth') {
      return '<div class="ifx-com-breadth-sidebar ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Độ rộng</h3></div>' +
        '<div style="padding:var(--ds-preview-body-py,var(--ifx-inset-widget));font-size:11px;color:var(--ix-text-muted)">Breadth stats mount</div></div>';
    }
    if (pt === 'shell-com-post') {
      return '<article class="ifx-com-card ds-preview-card" data-ds-card-root style="max-width:100%;padding:var(--ds-preview-body-py,12px);border:1px solid var(--ix-border);border-radius:var(--ds-preview-radius,var(--ix-radius-lg))">' +
        '<div style="font-size:var(--ifx-com-feed-card-title-size,16px);font-weight:600;margin-bottom:8px;line-height:1.4;-webkit-line-clamp:3;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">Xu hướng ngành ngân hàng quý này và tác động dòng tiền</div>' +
        '<div class="ifx-com-post__stats" style="font-size:var(--ifx-com-feed-card-stats-size,12px);color:var(--ix-text-muted)"><span><i class="ti ti-heart"></i> 24</span> <span><i class="ti ti-message"></i> 8</span> <span><i class="ti ti-share"></i> 3</span></div></article>';
    }
    if (pt === 'shell-widget') {
      return '<div class="ifx-widget ds-preview-card" data-ds-card-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Heatmap Ngành</h3></div>' +
        '<div class="ifx-widget__body" style="padding:var(--ds-preview-body-py,10px);font-size:11px;color:var(--ix-text-muted)">Card + Block mount</div>' +
        '<div class="ifx-widget__footer" style="padding:6px 12px;font-size:10px;color:var(--ix-text-muted)">Cập nhật · Mở Thị trường →</div></div>';
    }
    if (pt === 'shell-hub') {
      return '<div class="ifx-hub-profile-card ds-preview-card" data-ds-card-root style="max-width:100%;padding:var(--ds-preview-body-py,12px);border:1px solid var(--ix-border);border-radius:var(--ds-preview-radius,var(--ix-radius-lg))">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:4px">Hồ sơ iFlux</div>' +
        '<div style="font-size:11px;color:var(--ix-text-muted)">Premium · 12 tiện ích</div></div>';
    }

    return '<div class="ds-preview-card" data-ds-card-root style="font-size:12px;color:var(--ix-text-muted)">' + e(bundle.name) + '</div>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    if (!property || !property.key) return '';
    var domId = domPropId(bundle, property);
    var ref = resolvePropRef(groupTitle, bundle, property);
    var value = resolveRefValue(ref.refKind, ref.token);

    return '<div class="ds-ref-prop-row" data-ds-card-prop="' + CC.esc(domId) + '">' +
      '<div class="ds-ref-prop-row__property">' +
        '<span>' + CC.esc(property.key) + '</span>' +
        '<span class="ds-ref-section__note">' + CC.esc(property.variable || '') + '</span>' +
      '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Token ' + CC.esc(property.key) + '">' +
        tokenOptions(property, ref.token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + CC.esc(value) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var propsHtml = bundle.properties.map(function (p) { return renderPropRow(groupTitle, bundle, p); }).join('');

    return '<div class="ds-ref-bundle ds-ref-bundle--card" data-ds-card-bundle="' + CC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview ds-card-preview">' + previewHtml(bundle) + '</div>' +
      '<div class="ds-ref-bundle__name">' +
        '<span class="ds-ref-bundle__name-title">' + CC.esc(bundle.name) + '</span>' +
        '<span class="ds-ref-bundle__name-meta">' + CC.esc(surfaceLabel(bundle.surface)) + '</span>' +
        '<span class="ds-ref-bundle__name-class">' + CC.esc(bundle.cardId || '') + ' · ' + CC.esc(bundle.className || '') + '</span>' +
      '</div>' +
      '<div class="ds-ref-bundle__structure">' + structureHtml(bundle) + '</div>' +
      '<div class="ds-ref-bundle__details">' +
        '<div class="ds-card-props">' + propsHtml + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSection(group) {
    var note = group.note ? ' <span class="ds-ref-section__note">' + CC.esc(group.note) + '</span>' : '';
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + CC.esc(group.title) +
        ' <span class="ds-ref-section__count">' + group.items.length + '</span>' + note +
      '</h2>' +
      '<div class="ds-ref-table ds-ref-table--card">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<span class="ds-ref-table__head-structure">Structure</span>' +
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
    var counts = CC.pageCounts();
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + CC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + counts.total + ' card shells · ' + counts.user + ' user · ' + counts.admin + ' admin · ' +
          'Card = Information Container · chứa <strong>Blocks</strong> · WGT-* = Product · <a href="app/system/platform-layers.html#layer-4">Tầng 4 · Widget</a></p>' +
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
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : CC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        var bundleEl = root.querySelector('[data-ds-card-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        applyPreviewStyles(bundleEl, group.title, bundle);
        bundle.properties.forEach(function (property) {
          var id = CC.propKey(group.title, bundle, property);
          var domId = domPropId(bundle, property);
          var row = bundleEl.querySelector('[data-ds-card-prop="' + domId + '"]');
          if (!row) return;
          var select = row.querySelector('[data-ds-token]');
          var valueEl = row.querySelector('[data-ds-value]');
          select.addEventListener('change', function () {
            var token = select.value;
            var payload = {
              refKind: property.refKind,
              token: token,
              key: property.key,
              variable: property.variable,
              logicalId: bundle.logicalId,
              cardId: bundle.cardId || ''
            };
            store.server[id] = payload;
            valueEl.textContent = resolveRefValue(property.refKind, token);
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
                map[k] = { token: entry.meta.token || '', value: entry.value, cssVar: entry.meta.cssVar || '' };
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
          if (k.indexOf('cards::') !== 0) return;
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

  global.IfluxDsCardsStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
