/* DS SoT — Blocks: regions + composition + layout tokens · live preview */
(function (global) {
  'use strict';

  var BC = global.IfluxDsBlocksCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  var DC = global.IfluxDsDesignTokensCatalog;
  if (!BC || !PC) return;

  var LS_PREFIX = 'iflux-ds-block:';
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
    var id = BC.propKey(groupTitle, bundle, property);
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
    });
    return vars;
  }

  function applyPreviewStyles(bundleEl, groupTitle, bundle) {
    var host = bundleEl.querySelector('.ds-block-preview');
    if (!host) return;
    var el = host.querySelector('[data-ds-block-root]') || host.firstElementChild;
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
          kind: 'block-ref',
          refKind: payload.refKind,
          token: payload.token,
          variable: payload.variable,
          property: payload.key,
          logicalId: payload.logicalId || '',
          blockId: payload.blockId || ''
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
        return '<option value="' + BC.esc(e.logicalId) + '"' + sel + '>' + BC.esc(e.logicalId) + '</option>';
      }).join('');
    }
    var primList = PC.getTokensByProperty(propType);
    if (!primList.length) return '<option value="">— không có token —</option>';
    return primList.map(function (it) {
      var sel = it.token === selected ? ' selected' : '';
      return '<option value="' + BC.esc(it.token) + '"' + sel + '>' + BC.esc(it.token) + ' · ' + BC.esc(it.name) + '</option>';
    }).join('');
  }

  function surfaceLabel(surface) {
    if (surface === 'user') return 'User';
    if (surface === 'admin') return 'Admin';
    return 'Shared';
  }

  function metaHtml(bundle) {
    var parts = [];
    if (bundle.kind === 'template') parts.push('Template');
    else parts.push(BC.esc(bundle.blockId || ''));
    if (bundle.templateId && bundle.kind !== 'template') {
      parts.push('→ ' + BC.esc(bundle.templateId));
    }
    if (bundle.cardRef) parts.push('→ ' + BC.esc(bundle.cardRef));
    return parts.join(' · ');
  }

  function regionsHtml(bundle) {
    var tree = BC.esc(bundle.anatomy || bundle.regions || '').replace(/\n/g, '<br>');
    var comp = (bundle.composition || []).map(function (c) {
      var ref = c.ref ? ' → <code>' + BC.esc(c.ref) + '</code>' : '';
      return '<div class="ds-block-slot"><span class="ds-block-slot__id">' + BC.esc(c.slot) + '</span>' +
        '<span class="ds-block-slot__ref">' + BC.esc(c.label) + ref + '</span></div>';
    }).join('');
    var cardLine = bundle.cardRef
      ? '<div class="ds-block-card-ref"><span class="ds-block-anatomy__label">Card</span> <code>' + BC.esc(bundle.cardRef) + '</code></div>'
      : '<div class="ds-block-card-ref ds-block-card-ref--none"><span class="ds-block-anatomy__label">Card</span> <span class="ds-ref-section__note">none · block thuần</span></div>';
    var products = (bundle.productRefs || bundle.widgetRefs || []).length
      ? '<div class="ds-block-product-refs"><span class="ds-block-anatomy__label">Product · Admin Library</span> ' +
        (bundle.productRefs || bundle.widgetRefs).map(function (w) { return '<code>' + BC.esc(w) + '</code>'; }).join(' ') +
        '<div class="ds-ref-section__note">Dashboard instance · mapping sau</div></div>'
      : '';
    return '<div class="ds-block-anatomy">' +
      '<div class="ds-block-anatomy__label">Regions · ' + BC.esc(bundle.regions || 'body') + '</div>' +
      '<pre class="ds-block-anatomy__tree">' + tree + '</pre>' +
      cardLine +
      (comp ? '<div class="ds-block-anatomy__comp">' + comp + '</div>' : '') +
      products +
    '</div>';
  }

  function previewHtml(bundle) {
    var pt = bundle.previewType;

    if (pt === 'block-shell-card') {
      return '<div class="ifx-block ifx-block--card ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Top 10 Ngành</h3></div>' +
        '<div class="ifx-block__body" style="font-size:11px;color:var(--ix-text-muted)">Block mount</div></div>';
    }
    if (pt === 'block-shell-sidebar') {
      return '<div class="ifx-block ifx-block--sidebar ifx-mkt-sidebar-widget ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Độ rộng thị trường</h3></div>' +
        '<div class="ifx-block__body" style="font-size:11px;color:var(--ix-text-muted)">Sidebar body</div></div>';
    }
    if (pt === 'widget') {
      return '<div class="ifx-widget ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Tiện ích</h3></div>' +
        '<div class="ifx-widget__body" style="padding:10px;font-size:11px;color:var(--ix-text-muted)">Widget body</div></div>';
    }
    if (pt === 'tpl-breadth') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%;padding:8px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<div class="ifx-breadth-visual ifx-breadth-visual--6" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' +
        '<div class="ifx-breadth-stat is-up"><div class="ifx-breadth-stat__num">312</div><div class="ifx-breadth-stat__label">Tăng</div></div>' +
        '<div class="ifx-breadth-stat is-down"><div class="ifx-breadth-stat__num">198</div><div class="ifx-breadth-stat__label">Giảm</div></div>' +
        '<div class="ifx-breadth-stat is-ref"><div class="ifx-breadth-stat__num">45</div><div class="ifx-breadth-stat__label">TC</div></div></div>' +
        '<div class="ifx-breadth-ratio" style="display:flex;height:6px;margin-top:8px;border-radius:3px;overflow:hidden">' +
        '<div class="ifx-breadth-ratio__up" style="width:61%"></div><div class="ifx-breadth-ratio__down" style="width:39%"></div></div></div>';
    }
    if (pt === 'tpl-treemap') {
      return '<div class="ds-preview-block" data-ds-block-root style="display:flex;gap:6px;flex-wrap:wrap">' +
        '<span class="ifx-treemap-tile__link is-up" style="width:56px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10px;font-weight:700">+2.1%</span>' +
        '<span class="ifx-treemap-tile__link is-down" style="width:56px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10px;font-weight:700">-1.4%</span></div>';
    }
    if (pt === 'tpl-rank-bar') {
      return '<div class="ifx-rank-bar ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-rank-bar__row"><span class="ifx-rank-bar__idx">1</span><span class="ifx-rank-bar__name">Ngân hàng</span>' +
        '<div class="ifx-rank-bar__track"><div class="ifx-rank-bar__fill is-up" style="width:72%"></div></div>' +
        '<span class="ifx-rank-bar__val is-up">+2.4%</span></div></div>';
    }
    if (pt === 'tpl-flow-split' || pt === 'flow-card-split') {
      return '<div class="ifx-flow-card ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Mua/bán ròng</h3></div>' +
        '<div class="ifx-flow-card__body" style="padding:10px"><div class="ifx-flow-split">' +
        '<div class="ifx-flow-split__row"><div class="ifx-flow-split__buy"><div class="ifx-flow-split__bar ifx-flow-split__bar--buy" style="width:60%"></div></div>' +
        '<span class="ifx-flow-split__ticker ifx-flow-split__ticker--buy">HPG</span>' +
        '<span class="ifx-flow-split__ticker ifx-flow-split__ticker--sell">VCB</span>' +
        '<div class="ifx-flow-split__sell"><div class="ifx-flow-split__bar ifx-flow-split__bar--sell" style="width:40%"></div></div></div></div></div></div>';
    }
    if (pt === 'tpl-index-grid' || pt === 'com-overview') {
      return '<div class="ifx-com-overview ifx-com-overview--sidebar ds-preview-block" data-ds-block-root style="max-width:100%;padding:10px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<div class="ifx-widget__header"><h3>Tổng quan</h3></div>' +
        '<div class="ifx-com-ex-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">' +
        '<div class="ifx-com-ex-card" style="padding:6px;border:1px solid var(--ix-border);border-radius:8px"><div style="font-size:9px;color:var(--ix-text-muted)">VN-Index</div><div class="is-up" style="font-weight:700;font-size:13px">1,284</div></div>' +
        '<div class="ifx-com-ex-card" style="padding:6px;border:1px solid var(--ix-border);border-radius:8px"><div style="font-size:9px;color:var(--ix-text-muted)">HOSE</div><div class="is-up" style="font-weight:700;font-size:13px">1,102</div></div></div></div>';
    }
    if (pt === 'mkt-sidebar') {
      return '<div class="ifx-mkt-sidebar-widget ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Độ rộng</h3></div>' +
        '<div class="ifx-mkt-sidebar-widget__body" style="padding:10px;font-size:11px;color:var(--ix-text-muted)">Breadth mount</div></div>';
    }
    if (pt === 'mkt-card-treemap' || pt === 'flow-card') {
      return '<div class="ifx-mkt-card ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>Heatmap Ngành</h3></div>' +
        '<div class="ifx-mkt-card__body" style="padding:10px;font-size:11px;color:var(--ix-text-muted)">Chart / treemap mount</div></div>';
    }
    if (pt === 'mkt-liq') {
      return '<div class="ifx-mkt-liq-block ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-widget__header"><h3>KLGD</h3></div>' +
        '<div class="ifx-mkt-liq-chart" style="height:48px;margin:10px;background:rgba(0,0,0,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--ix-text-muted)">Chart</div></div>';
    }
    if (pt === 'movers-list' || pt === 'stock-row-list') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-movers-tabs" style="display:flex;gap:4px;margin-bottom:8px"><button class="ix-tab active" type="button" disabled style="flex:1;font-size:11px">1D</button><button class="ix-tab" type="button" disabled style="flex:1;font-size:11px">1W</button></div>' +
        '<a class="ifx-stock-row is-up" href="#" onclick="return false" style="padding:6px 8px"><span class="ifx-stock-row__ticker">HPG</span><span class="ifx-stock-row__name">Hòa Phát</span><span class="ifx-stock-row__chg">+2.1%</span></a></div>';
    }
    if (pt === 'flow-context') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%;padding:10px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg);font-size:11px">' +
        '<div style="font-weight:600;margin-bottom:6px">VN-Index 1,284</div><div style="color:var(--ix-text-muted)">Vùng hỗ trợ · kháng cự</div></div>';
    }
    if (pt === 'flow-smart') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-flow-panel" style="padding:8px 0"><div class="ifx-flow-panel__head"><span class="ifx-flow-panel__label">Khối ngoại</span><span class="ifx-flow-panel__net is-up">+450B</span></div></div>' +
        '<div class="ifx-flow-paywall" style="display:flex;align-items:center;gap:8px;padding:8px;font-size:11px"><i class="ti ti-lock"></i> Premium</div></div>';
    }
    if (pt === 'com-trend') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%;font-size:11px;color:var(--ix-text-muted)">Trending heat + story chips</div>';
    }
    if (pt === 'com-active') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%"><div class="ifx-com-post__author" style="margin-bottom:6px"><span class="ix-avatar ix-avatar-sm ix-avatar-accent">A</span><span class="ifx-com-post__author-name">User A</span></div>' +
        '<div class="ifx-com-post__author"><span class="ix-avatar ix-avatar-sm ix-avatar-accent">B</span><span class="ifx-com-post__author-name">User B</span></div></div>';
    }
    if (pt === 'com-topwl') {
      return '<div class="ifx-com-topwl ds-preview-block" data-ds-block-root style="max-width:100%;padding:8px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<div style="display:flex;gap:4px;margin-bottom:8px"><button class="ix-btn ix-btn-outline ix-btn-sm" disabled>1W</button></div>' +
        '<div class="ifx-com-topwl-row"><span class="ifx-com-topwl-rank">#1</span><span>Trader A</span><span class="ifx-com-topwl-perf is-up">+18%</span></div></div>';
    }
    if (pt === 'com-card') {
      return '<article class="ifx-com-card ds-preview-block" data-ds-block-root style="max-width:100%;padding:10px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<p style="font-size:var(--ifx-com-feed-card-title-size,16px);font-weight:600;margin:0 0 8px;line-height:1.4">Bài viết feed — tiêu đề 3 dòng</p>' +
        '<div class="ifx-com-post__stats" style="font-size:var(--ifx-com-feed-card-stats-size,12px);color:var(--ix-text-muted)"><span><i class="ti ti-heart"></i> 5</span> <span><i class="ti ti-message"></i> 2</span> <span><i class="ti ti-share"></i> 0</span></div></article>';
    }
    if (pt === 'price-panel') {
      return '<div class="ifx-stock-head ds-preview-block" data-ds-block-root style="max-width:100%;padding:10px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<div style="font-size:20px;font-weight:700" class="is-up">28.50</div><div style="font-size:11px;color:var(--ix-text-muted)">HPG · +1.2%</div></div>';
    }
    if (pt === 'comments') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%;font-size:12px;color:var(--ix-text-muted)">Comment thread · mentions</div>';
    }
    if (pt === 'watchlist-block') {
      return '<div class="ifx-wl-block ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ifx-wl-block__bar" style="margin-bottom:8px"><span class="ix-chip ix-chip-outline">Danh mục</span></div>' +
        '<div class="ifx-stock-row-wrap is-up"><div class="ds-preview-stock-wrap__line1 ifx-stock-row is-up" style="display:grid;grid-template-columns:1fr auto auto;gap:8px;padding:8px 10px">' +
        '<span class="ifx-stock-row__name">HPG</span><span class="ifx-stock-row__chg">+2.1%</span><span class="ifx-stock-row__vol">5M</span></div></div></div>';
    }
    if (pt === 'alert-list') {
      return '<div class="ifx-alert-page-item ds-preview-block" data-ds-block-root style="max-width:100%;padding:10px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<strong style="font-size:12px">VCB &gt; 115k</strong><div style="font-size:11px;color:var(--ix-text-muted)">Đang theo dõi</div></div>';
    }
    if (pt === 'profile-sidebar' || pt === 'hub-profile' || pt === 'plan-compare') {
      var title = pt === 'plan-compare' ? 'So sánh gói' : 'Hồ sơ';
      return '<div class="ix-card ds-preview-block" data-ds-block-root style="max-width:100%"><div class="ix-card-header"><div class="ix-card-title" style="font-size:13px">' + title + '</div></div>' +
        '<div class="ix-card-body" style="font-size:11px;color:var(--ix-text-muted)">Sidebar content</div></div>';
    }
    if (pt === 'search-dropdown') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%;padding:8px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg)">' +
        '<input class="ix-input" disabled placeholder="Tìm mã CP…" style="width:100%;margin-bottom:6px;font-size:12px" />' +
        '<div style="font-size:11px;color:var(--ix-text-muted)">HPG · VCB · FPT</div></div>';
    }
    if (pt === 'admin-kpi') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%;display:flex;gap:8px;flex-wrap:wrap">' +
        '<div class="ix-stat-card-h" style="flex:1;min-width:100px;padding:10px"><div class="ix-stat-label" style="font-size:10px">Users</div><div class="ix-stat-value" style="font-size:16px">12k</div></div></div>';
    }
    if (pt === 'admin-table') {
      return '<div class="ds-preview-block" data-ds-block-root style="max-width:100%">' +
        '<div class="ix-filter-bar" style="padding:8px;margin-bottom:8px;border:1px solid var(--ix-border);border-radius:var(--ix-radius)"><span style="font-size:11px">Filter bar</span></div>' +
        '<div style="font-size:11px;color:var(--ix-text-muted);padding:8px;border:1px solid var(--ix-border);border-radius:var(--ix-radius)">Table rows…</div></div>';
    }
    if (pt === 'admin-feed') {
      return '<div class="ix-card ds-preview-block" data-ds-block-root style="max-width:100%"><div class="ix-card-header"><div class="ix-card-title" style="font-size:13px">Feed health</div></div>' +
        '<div class="ix-card-body" style="font-size:11px;color:var(--ix-text-muted)">Pipeline status</div></div>';
    }

    return '<div class="ds-preview-block" data-ds-block-root style="font-size:12px;color:var(--ix-text-muted)">' + BC.esc(bundle.name) + '</div>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    if (!property || !property.key) return '';
    var domId = domPropId(bundle, property);
    var ref = resolvePropRef(groupTitle, bundle, property);
    var value = resolveRefValue(ref.refKind, ref.token);

    return '<div class="ds-ref-prop-row" data-ds-block-prop="' + BC.esc(domId) + '">' +
      '<div class="ds-ref-prop-row__property">' +
        '<span>' + BC.esc(property.key) + '</span>' +
        '<span class="ds-ref-section__note">' + BC.esc(property.variable || '') + '</span>' +
      '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Token ' + BC.esc(property.key) + '">' +
        tokenOptions(property, ref.token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + BC.esc(value) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var propsHtml = bundle.properties.map(function (p) { return renderPropRow(groupTitle, bundle, p); }).join('');
    var statusCls = bundle.status === 'partial' ? ' ds-ref-bundle--partial' : '';

    return '<div class="ds-ref-bundle ds-ref-bundle--block' + statusCls + '" data-ds-block-bundle="' + BC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview ds-block-preview">' + previewHtml(bundle) + '</div>' +
      '<div class="ds-ref-bundle__name">' +
        '<span class="ds-ref-bundle__name-title">' + BC.esc(bundle.name) + '</span>' +
        '<span class="ds-ref-bundle__name-meta">' + BC.esc(surfaceLabel(bundle.surface)) + (bundle.status === 'partial' ? ' · partial' : '') + '</span>' +
        '<span class="ds-ref-bundle__name-class">' + BC.esc(metaHtml(bundle)) + '</span>' +
      '</div>' +
      '<div class="ds-ref-bundle__details">' +
        regionsHtml(bundle) +
        '<div class="ds-block-props">' + propsHtml + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSection(group) {
    var note = group.note ? ' <span class="ds-ref-section__note">' + BC.esc(group.note) + '</span>' : '';
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + BC.esc(group.title) +
        ' <span class="ds-ref-section__count">' + group.items.length + '</span>' + note +
      '</h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Regions · Composition</span><span>Token</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(function (b) { return renderBundle(group.title, b); }).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = BC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var counts = BC.pageCounts();
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + BC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + counts.total + ' blocks · ' + counts.templates + ' templates · ' + counts.instances + ' instances · ' +
          'Block = composition (Items + chart) · mount trong <strong>Card (09)</strong> · WGT-* = Product · <a href="app/system/platform-layers.html#layer-4">Tầng 4 · Widget</a></p>' +
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
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : BC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        var bundleEl = root.querySelector('[data-ds-block-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        applyPreviewStyles(bundleEl, group.title, bundle);
        bundle.properties.forEach(function (property) {
          var id = BC.propKey(group.title, bundle, property);
          var domId = domPropId(bundle, property);
          var row = bundleEl.querySelector('[data-ds-block-prop="' + domId + '"]');
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
              blockId: bundle.blockId || ''
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
          if (k.indexOf('blocks::') !== 0) return;
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

  global.IfluxDsBlocksStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
