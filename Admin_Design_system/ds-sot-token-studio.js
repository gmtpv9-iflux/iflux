/* DS SoT — Spec: [Tên·Preview] | [Scope?] Property | Token | Value | ✏️ */
(function (global) {
  'use strict';

  var FT = global.IfluxDsFtCatalog;
  if (!FT) return;

  var LS_PREFIX = 'iflux-ds-ft:';
  var store = { server: {}, loaded: false, foundationIndex: {} };
  var saveTimers = {};

  function apiBase() {
    if (global.location.protocol === 'file:') return '';
    return global.location.protocol + '//' + global.location.host + '/api/ds-sot';
  }

  function readLocal(id) {
    try { return localStorage.getItem(LS_PREFIX + id); } catch (e) { return null; }
  }

  function writeLocal(id, val) {
    try { localStorage.setItem(LS_PREFIX + id, val); } catch (e) { /* ignore */ }
  }

  function resolveValue(fileId, bundle, prop) {
    var id = FT.propKey(fileId, bundle, prop);
    if (store.server[id] && typeof store.server[id].value === 'string') return store.server[id].value;
    var local = readLocal(id);
    if (local !== null) return local;
    return prop.value || '';
  }

  function buildFoundationIndex() {
    var map = {};
    FT.forEachFoundationProp(function (pg, bundle, prop) {
      if (!prop.variable) return;
      map[prop.variable] = resolveValue(pg.id, bundle, prop);
    });
    store.foundationIndex = map;
    return map;
  }

  function resolveTokenRef(ref, index, depth) {
    depth = depth || 0;
    if (!ref || depth > 10) return ref || '';
    var s = String(ref).trim();
    var m = s.match(/^var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^)]+))?\s*\)$/);
    var key = m ? m[1] : (s.indexOf('--') === 0 ? s : null);
    if (!key) return s;
    var next = index[key];
    if (next == null) return s;
    if (/^var\(/.test(next) || /^--/.test(String(next).trim())) {
      return resolveTokenRef(next, index, depth + 1);
    }
    return next;
  }

  function cssBlock(variable, value) {
    return ':root {\n  ' + variable + ': ' + value + ';\n}';
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
  }

  function pushServer(id, value, row, meta) {
    var base = apiBase();
    var code = meta.variable ? cssBlock(meta.variable, value) : value;
    if (!base) {
      writeLocal(id, value);
      flashRow(row);
      return;
    }
    fetch(base + '/overrides/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: value, code: code, html: '', meta: meta || {} })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok || !body.ok) throw new Error('fail');
        store.server[id] = { value: value, code: code };
        writeLocal(id, value);
        flashRow(row);
      });
    }).catch(function () {
      writeLocal(id, value);
      flashRow(row);
    });
  }

  function scheduleSave(id, value, row, meta) {
    writeLocal(id, value);
    row.classList.add('is-pending');
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(function () {
      row.classList.remove('is-pending');
      pushServer(id, value, row, meta);
    }, 600);
  }

  function previewHtml(bundle, prop) {
    var pt = bundle.previewType;
    var cls = (bundle.className || '').replace(/^\./, '');
    var v = prop.variable;

    if (pt === 'naming-goodbad') {
      return '<div class="ds-spec-preview__goodbad">' +
        (bundle.previewGood ? '<span class="ds-spec-preview__good">' + FT.esc(bundle.previewGood) + '</span>' : '') +
        (bundle.previewBad ? '<span class="ds-spec-preview__bad">' + FT.esc(bundle.previewBad) + '</span>' : '') +
      '</div>';
    }
    if (pt === 'naming-pattern') {
      return '<code class="ds-spec-preview__pattern">' + FT.esc(bundle.previewGood || '···') + '</code>';
    }
    if (pt === 'naming-icon') {
      var icon = (bundle.previewGood || 'ti ti-check').replace(/^ti\s+/, '');
      return '<i class="ti ' + FT.esc(icon) + ' ds-spec-preview__icon"></i>';
    }
    if (pt === 'naming-chip') {
      var chips = String(bundle.previewGood || prop.value || '').split(/[,·]/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!chips.length) chips = ['···'];
      return '<div class="ds-spec-preview__chips">' +
        chips.slice(0, 2).map(function (c) { return '<span class="ix-chip ix-chip-outline">' + FT.esc(c) + '</span>'; }).join('') +
      '</div>';
    }
    if (pt === 'color') return '<div class="ds-spec-preview__swatch" data-ds-swatch></div>';
    if (pt === 'border') return '<div class="ds-spec-preview__borderbox" data-ds-swatch></div>';
    if (pt === 'radius') return '<div class="ds-spec-preview__radiusbox" data-ds-swatch></div>';
    if (pt === 'shadow') return '<div class="ds-spec-preview__shadowbox" data-ds-swatch></div>';
    if (pt === 'spacing') return '<div class="ds-spec-preview__spacebar" data-ds-swatch></div>';
    if (pt === 'typography' && cls) {
      return '<span class="' + cls + '" data-ds-typo-sample>' + FT.esc(bundle.previewSample || 'Aa Bb') + '</span>';
    }
    if (pt === 'numeric') {
      var sample = cls.indexOf('price') >= 0 ? '28.50' : cls.indexOf('percent') >= 0 ? '+4.25%' : cls.indexOf('volume') >= 0 ? '1.25B' : '09:15';
      return '<span class="' + (cls || 'ifx-typo-price-m') + '" data-ds-typo-sample>' + FT.esc(sample) + '</span>';
    }
    if (pt === 'market-up') return '<span class="ifx-typo-status-positive" data-ds-typo-sample>+2.35%</span>';
    if (pt === 'market-down') return '<span class="ifx-typo-status-negative" data-ds-typo-sample>-1.12%</span>';
    if (pt === 'text') return '<span data-ds-typo-sample style="color:var(' + v + ')">Aa</span>';
    if (pt === 'button') return '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" disabled>' + FT.esc(bundle.groupName) + '</button>';
    if (pt === 'icon') return '<i class="ti ti-search ds-spec-preview__icon"></i>';
    return '<span class="ds-spec-preview__mono">···</span>';
  }

  function applyBundleStyles(bundleEl, bundle, props, values) {
    var styleHost = bundleEl.querySelector('[data-ds-style-host]');
    if (!styleHost) return;
    styleHost.innerHTML = '';
    var css = '';
    props.forEach(function (p, i) {
      if (p.variable) css += cssBlock(p.variable, values[i] || p.value);
    });
    if (css) {
      var style = document.createElement('style');
      style.setAttribute('data-ds-style-injected', '1');
      style.textContent = css;
      styleHost.appendChild(style);
    }

    var swatch = bundleEl.querySelector('[data-ds-swatch]');
    if (swatch) {
      var colorProp = props.find(function (p) { return p.property === 'Color' || bundle.previewType === 'color'; }) || props[0];
      var idx = props.indexOf(colorProp);
      var val = idx >= 0 ? values[idx] : values[0];
      if (bundle.previewType === 'color' || bundle.previewType === 'border') {
        if (colorProp && colorProp.variable) {
          swatch.style.backgroundColor = 'var(' + colorProp.variable + ')';
          if (bundle.previewType === 'border') swatch.style.borderColor = 'var(' + colorProp.variable + ')';
        } else if (val) swatch.style.backgroundColor = val;
      }
      if (bundle.previewType === 'radius' && colorProp) swatch.style.borderRadius = 'var(' + colorProp.variable + ')';
      if (bundle.previewType === 'shadow' && colorProp) swatch.style.boxShadow = 'var(' + colorProp.variable + ')';
      if (bundle.previewType === 'spacing' && colorProp) swatch.style.width = 'var(' + colorProp.variable + ')';
    }
  }

  function scopeLabel(prop) {
    return prop.scope ? prop.scope : '—';
  }

  function editModeHint(page) {
    if (FT.pageEditMode(page) === 'tokenRef') {
      return 'Sửa <strong>Token</strong> (reference) · Value tự resolve từ Foundation';
    }
    return 'Sửa <strong>Value</strong> · Token là tên biến CSS (readonly)';
  }

  function renderPropRow(page, bundle, prop) {
    var id = FT.propKey(page.id, bundle, prop);
    var mode = FT.pageEditMode(page);
    var scopeCell = FT.pageUsesScope(page)
      ? '<div class="ds-spec-prop-row__scope">' + FT.esc(scopeLabel(prop)) + '</div>'
      : '';

    var semanticCode = mode === 'tokenRef' && prop.variable
      ? '<span class="ds-spec-prop-row__semantic" title="Semantic variable">' + FT.esc(prop.variable) + '</span>'
      : '';

    var tokenCell;
    var valueCell;
    var actionLabel;
    if (mode === 'tokenRef') {
      tokenCell = '<input type="text" class="ds-spec-prop-row__token-input" spellcheck="false" data-ds-token aria-label="Token reference ' + FT.esc(prop.property) + '" />';
      valueCell = '<span class="ds-spec-prop-row__value-readonly" data-ds-resolved aria-label="Resolved value"></span>';
      actionLabel = 'Sửa Token';
    } else {
      tokenCell = '<code class="ds-spec-prop-row__token ds-spec-prop-row__token--readonly">' + FT.esc(prop.variable || '—') + '</code>';
      valueCell = '<input type="text" class="ds-spec-prop-row__value" spellcheck="false" data-ds-value aria-label="Value ' + FT.esc(prop.property) + '" />';
      actionLabel = 'Sửa Value';
    }

    return '<div class="ds-spec-prop-row" data-ds-prop-id="' + FT.esc(id) + '" data-ds-edit-mode="' + mode + '">' +
      scopeCell +
      '<div class="ds-spec-prop-row__property">' + FT.esc(prop.property) + semanticCode + '</div>' +
      tokenCell +
      valueCell +
      '<button type="button" class="ds-spec-prop-row__action ix-btn ix-btn-ghost ix-btn-sm" data-ds-action aria-label="' + actionLabel + '" title="' + actionLabel + '"><i class="ti ti-pencil"></i></button>' +
    '</div>';
  }

  function renderBundle(page, bundle) {
    var firstProp = bundle.properties[0] || { property: '', variable: '' };
    var rows = bundle.properties.map(function (p) {
      return renderPropRow(page, bundle, p);
    }).join('');

    return '<div class="ds-spec-bundle" data-ds-bundle="' + FT.esc(bundle.bundleId) + '">' +
      '<div class="ds-spec-bundle__style-host" data-ds-style-host hidden></div>' +
      '<div class="ds-spec-bundle__identity">' +
        '<div class="ds-spec-identity__name">' + FT.esc(bundle.groupName) + '</div>' +
        '<div class="ds-spec-identity__preview">' + previewHtml(bundle, firstProp) + '</div>' +
      '</div>' +
      '<div class="ds-spec-bundle__props">' + rows + '</div>' +
    '</div>';
  }

  function renderSection(page, sec) {
    var scopeClass = FT.pageUsesScope(page) ? ' ds-spec-table--scope' : '';
    var scopeHead = FT.pageUsesScope(page) ? '<span>Scope</span>' : '';
    var sectionKind = sec.groupKind ? ' ds-spec-section--' + sec.groupKind : '';
    var bundlesHtml = sec.bundles.map(function (b) { return renderBundle(page, b); }).join('');

    return '<section class="ds-spec-section' + sectionKind + '">' +
      '<h2 class="ds-spec-section__title">' + FT.esc(sec.title) + '</h2>' +
      '<div class="ds-spec-table' + scopeClass + '">' +
        '<div class="ds-spec-table__head">' +
          '<span class="ds-spec-table__head-identity">Tên · Preview</span>' +
          '<div class="ds-spec-table__head-props">' +
            scopeHead +
            '<span>Property</span><span>Token</span><span>Value</span><span>✏️</span>' +
          '</div>' +
        '</div>' +
        bundlesHtml +
      '</div>' +
    '</section>';
  }

  function moduleLabel(page) {
    if (!page) return '';
    return page.layer === 'token' ? '02 Design Tokens' : '01 Foundations';
  }

  function tierLabel(page) {
    if (!page || !page.pageTier) return 'TRANG';
    if (page.pageTier === 'naming') return 'Naming Convention';
    if (page.pageTier === 'primitive') return 'Primitive Token';
    return 'Semantic Token';
  }

  function renderFilePage(page) {
    var norm = FT.normalizePage(page);
    var total = FT.pageCounts(norm).total;
    var fileLine = '<p class="ds-spec-page__file"><strong>MODULE</strong> ' + moduleLabel(page) +
      ' · <strong>TRANG</strong> <code>' + FT.esc(page.path) + '</code></p>';
    var cols = FT.pageUsesScope(page)
      ? 'Tên · Preview | Scope | Property | Token | Value | ✏️'
      : 'Tên · Preview | Property | Token | Value | ✏️';

    return '<div class="ds-spec-page">' +
      '<div class="ds-spec-page__head">' +
        '<h1 class="ix-page-title">' + FT.esc(page.file) + '</h1>' +
        fileLine +
        '<p class="ds-spec-page__meta">' + total + ' token · ' + tierLabel(page) + ' · tự lưu</p>' +
        '<p class="ds-spec-page__hint">' + editModeHint(page) + '</p>' +
      '</div>' +
      norm.groups.map(function (g) { return renderSection(page, g); }).join('') +
    '</div>';
  }

  function updateResolvedDisplay(row, ref) {
    var el = row.querySelector('[data-ds-resolved]');
    if (!el) return;
    var resolved = resolveTokenRef(ref, store.foundationIndex);
    el.textContent = resolved || '—';
    el.title = resolved ? 'Resolved: ' + resolved : 'Không resolve được';
  }

  function bindBundle(root, page, bundle) {
    var bundleEl = root.querySelector('[data-ds-bundle="' + bundle.bundleId + '"]');
    if (!bundleEl) return;
    var mode = FT.pageEditMode(page);

    var values = bundle.properties.map(function (p) {
      return resolveValue(page.id, bundle, p);
    });

    bundle.properties.forEach(function (prop) {
      var id = FT.propKey(page.id, bundle, prop);
      var row = bundleEl.querySelector('[data-ds-prop-id="' + id + '"]');
      if (!row) return;
      var actionBtn = row.querySelector('[data-ds-action]');

      if (mode === 'tokenRef') {
        var tokenInput = row.querySelector('[data-ds-token]');
        if (!tokenInput) return;
        var ref = resolveValue(page.id, bundle, prop);
        tokenInput.value = ref;
        updateResolvedDisplay(row, ref);

        tokenInput.addEventListener('input', function () {
          var idx = bundle.properties.indexOf(prop);
          if (idx >= 0) values[idx] = tokenInput.value;
          updateResolvedDisplay(row, tokenInput.value);
          applyBundleStyles(bundleEl, bundle, bundle.properties, values);
          scheduleSave(id, tokenInput.value, row, {
            fileId: page.id, bundleId: bundle.bundleId, propId: prop.id,
            property: prop.property, scope: prop.scope, variable: prop.variable,
            kind: 'spec-token-ref', editMode: 'tokenRef'
          });
        });

        if (actionBtn) {
          actionBtn.addEventListener('click', function () {
            tokenInput.focus();
            tokenInput.select();
          });
        }
      } else {
        var input = row.querySelector('[data-ds-value]');
        if (!input) return;
        input.value = resolveValue(page.id, bundle, prop);

        input.addEventListener('input', function () {
          var idx = bundle.properties.indexOf(prop);
          if (idx >= 0) values[idx] = input.value;
          if (page.layer === 'foundation' && prop.variable) {
            store.foundationIndex[prop.variable] = input.value;
          }
          applyBundleStyles(bundleEl, bundle, bundle.properties, values);
          scheduleSave(id, input.value, row, {
            fileId: page.id, bundleId: bundle.bundleId, propId: prop.id,
            property: prop.property, scope: prop.scope, variable: prop.variable,
            kind: 'spec-value', editMode: 'value'
          });
        });

        if (actionBtn) {
          actionBtn.addEventListener('click', function () {
            input.focus();
            input.select();
          });
        }
      }
    });

    applyBundleStyles(bundleEl, bundle, bundle.properties, values);
  }

  function bindFilePage(root, page) {
    if (FT.pageEditMode(page) === 'tokenRef') buildFoundationIndex();
    var norm = FT.normalizePage(page);
    norm.groups.forEach(function (g) {
      g.bundles.forEach(function (b) { bindBundle(root, page, b); });
    });
  }

  function loadServerOverrides() {
    var base = apiBase();
    if (!base) {
      store.loaded = true;
      buildFoundationIndex();
      return Promise.resolve();
    }
    return fetch(base + '/overrides')
      .then(function (r) { return r.json(); })
      .then(function (body) {
        if (body && body.items) {
          Object.keys(body.items).forEach(function (k) {
            var entry = body.items[k];
            if (entry && typeof entry.value === 'string') store.server[k] = entry;
          });
        }
        store.loaded = true;
        buildFoundationIndex();
      })
      .catch(function () {
        store.loaded = true;
        buildFoundationIndex();
      });
  }

  global.IfluxDsFtStudio = {
    renderFilePage: renderFilePage,
    bindFilePage: bindFilePage,
    loadServerOverrides: loadServerOverrides,
    resolveValue: resolveValue,
    buildFoundationIndex: buildFoundationIndex,
    resolveTokenRef: resolveTokenRef
  };
})(window);
