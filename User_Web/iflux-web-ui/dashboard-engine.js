/* Dashboard engine — 2 cột trái hẹp / phải rộng + pointer drag ghost */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_web_dashboard_layout_v2';
  var LEGACY_STORAGE_KEYS = ['iflux_web_dashboard_layout_v2', 'iflux_web_dashboard_layout'];
  var SUBJ_WIDTH_MIGRATED_KEY = 'iflux_dash_subj_width_half_v1';
  var STAT_WIDTH_MIGRATED_KEY = 'iflux_dash_stat_width_full_v1';
  var STAT_DUO_MIGRATED_KEY = 'iflux_dash_stat_duo_v1';
  var SUBJ_WIDGET_TYPES = {
    'WGT-FLW-SUBJ-STOCK': 1,
    'WGT-FLW-SUBJ-SECTOR': 1,
    'WGT-FLW-SUBJ-HST': 1,
    'WGT-FLW-SUBJ-STORY': 1
  };
  var STAT_SCORE_WIDGET_TYPES = {
    'WGT-FLW-STAT_STOCK': 1,
    'WGT-FLW-STAT_SECTOR': 1,
    'WGT-FLW-STAT_HST': 1,
    'WGT-FLW-STAT_STORY': 1,
    'WGT-FLW-STAT_STOCK_IN': 1,
    'WGT-FLW-STAT_STOCK_OUT': 1,
    'WGT-FLW-STAT_SECTOR_IN': 1,
    'WGT-FLW-STAT_SECTOR_OUT': 1,
    'WGT-FLW-STAT_HST_IN': 1,
    'WGT-FLW-STAT_HST_OUT': 1,
    'WGT-FLW-STAT_STORY_IN': 1,
    'WGT-FLW-STAT_STORY_OUT': 1
  };
  var STAT_DUO_ALIASES = {
    'WGT-FLW-STAT_STOCK_IN': 'WGT-FLW-STAT_STOCK',
    'WGT-FLW-STAT_STOCK_OUT': 'WGT-FLW-STAT_STOCK',
    'WGT-FLW-STAT_SECTOR_IN': 'WGT-FLW-STAT_SECTOR',
    'WGT-FLW-STAT_SECTOR_OUT': 'WGT-FLW-STAT_SECTOR',
    'WGT-FLW-STAT_HST_IN': 'WGT-FLW-STAT_HST',
    'WGT-FLW-STAT_HST_OUT': 'WGT-FLW-STAT_HST',
    'WGT-FLW-STAT_STORY_IN': 'WGT-FLW-STAT_STORY',
    'WGT-FLW-STAT_STORY_OUT': 'WGT-FLW-STAT_STORY'
  };
  var COLS = ['left', 'right'];
  var SCOPES = { sidebar: 'sidebar', dashboard: 'dashboard' };
  var SIDEBAR_COL = 'main';
  var DASH_GRID_COL = 'grid';

  var TYPE_ALIASES = {
    'W-MARKET': 'WGT-MKT-001',
    'W-MOVERS': 'WGT-MKT-003',
    'W-SECTOR': 'WGT-SEC-001',
    'W-FLOW': 'WGT-FLW-001',
    'W-WATCHLIST': 'WGT-WAT-001'
  };

  function us() { return global.IfluxUserStorage; }

  function registry() { return global.IfluxWidgetRegistry; }

  function normalizeWidgetRecord(w, index) {
    if (!w || typeof w !== 'object') return null;
    var type = w.widget_type || w.type || w.widgetType;
    if (type && TYPE_ALIASES[type]) type = TYPE_ALIASES[type];
    if (!type) return null;
    var meta = registry() && registry().byType(type);
    var scope = w.scope || (meta && meta.scope) || inferScopeFromLegacy(w);
    var col = w.column || w.col;
    if (scope === SCOPES.sidebar) col = SIDEBAR_COL;
    return {
      instance_id: w.instance_id || w.id || uid(),
      widget_type: type,
      scope: scope,
      column: col,
      position: typeof w.position === 'number' ? w.position : index,
      config: w.config || {}
    };
  }

  function inferScopeFromLegacy(w) {
    if (!w) return SCOPES.dashboard;
    if (w.widget_type && w.widget_type.indexOf('WGT-PRF') === 0) {
      return SCOPES.sidebar;
    }
    return SCOPES.dashboard;
  }

  function parseLayoutPayload(parsed) {
    if (!parsed) return null;
    if (Array.isArray(parsed)) {
      return {
        widgets: parsed.map(normalizeWidgetRecord).filter(Boolean)
      };
    }
    if (parsed && Array.isArray(parsed.widgets)) {
      return {
        widgets: parsed.widgets.map(normalizeWidgetRecord).filter(Boolean)
      };
    }
    return null;
  }

  function scopedStorageKey() {
    var store = us();
    if (store) return store.scopedKey(STORAGE_KEY);
    return STORAGE_KEY;
  }

  function migrateLegacyStorageKeys() {
    var targetKey = scopedStorageKey();
    var existing = localStorage.getItem(targetKey);
    if (existing) {
      try {
        var current = parseLayoutPayload(JSON.parse(existing));
        if (current && current.widgets && current.widgets.length) return;
      } catch (e) { /* fall through — sửa layout hỏng */ }
      localStorage.removeItem(targetKey);
    }

    var i;
    for (i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
      if (localStorage.getItem(targetKey)) break;
      var legacyKey = LEGACY_STORAGE_KEYS[i];
      if (legacyKey === targetKey) continue;
      var raw = localStorage.getItem(legacyKey);
      if (!raw) continue;
      try {
        var layout = parseLayoutPayload(JSON.parse(raw));
        if (layout && layout.widgets && layout.widgets.length) {
          writeStorageRaw(repairLayout(layout));
          if (legacyKey !== targetKey) localStorage.removeItem(legacyKey);
          break;
        }
      } catch (e) { /* ignore */ }
    }
  }

  function readStorageRaw() {
    migrateLegacyStorageKeys();
    var store = us();
    if (store) {
      store.migrateLegacyOnce(STORAGE_KEY);
      return store.readJson(STORAGE_KEY, null);
    }
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeStorageRaw(layout) {
    var store = us();
    if (store) store.writeJson(STORAGE_KEY, layout);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    if (global.IfluxUserDataSync) {
      IfluxUserDataSync.scheduleDashboardSync(layout);
    }
  }

  function removeStorage() {
    var store = us();
    if (store) store.removeScoped(STORAGE_KEY);
    else localStorage.removeItem(STORAGE_KEY);
  }

  function clearAllLayoutStorage() {
    removeStorage();
    var store = us();
    LEGACY_STORAGE_KEYS.forEach(function (key) {
      localStorage.removeItem(key);
      if (store) store.removeScoped(key);
    });
  }

  function closeRegistryModal() {
    var modal = document.getElementById('widgetRegistryModal');
    if (modal) modal.classList.remove('open');
  }

  function closePopularModal() {
    var modal = document.getElementById('popularWidgetsModal');
    if (modal) modal.classList.remove('open');
  }

  function layoutFromPreset(presetItems) {
    var reg = registry();
    if (!reg || !presetItems || !presetItems.length) return { widgets: [] };
    return repairLayout({
      widgets: presetItems.map(function (item, i) {
        return migrateWidget({
          instance_id: uid(),
          widget_type: item.widget_type,
          scope: item.scope,
          column: item.column,
          position: item.position,
          config: item.config || {}
        }, i);
      })
    });
  }

  function resetLayoutToDefaults() {
    clearAllLayoutStorage();
    var next = layoutFromPreset(registry().DEFAULT_LAYOUT);
    saveLayout(next);
    return next;
  }

  function applyPopularLayout() {
    clearAllLayoutStorage();
    var preset = (registry() && registry().POPULAR_LAYOUT) || registry().DEFAULT_LAYOUT;
    var next = layoutFromPreset(preset);
    saveLayout(next);
    return next;
  }

  function draftDefaultLayout() {
    return layoutFromPreset(registry().DEFAULT_LAYOUT);
  }

  function draftPopularLayout() {
    var preset = (registry() && registry().POPULAR_LAYOUT) || registry().DEFAULT_LAYOUT;
    return layoutFromPreset(preset);
  }

  function cloneLayout(layout) {
    return repairLayout({
      widgets: (layout.widgets || []).map(function (w, i) {
        return migrateWidget({
          instance_id: w.instance_id || uid(),
          widget_type: w.widget_type,
          scope: w.scope,
          column: w.column,
          position: w.position,
          config: Object.assign({}, w.config || {})
        }, i);
      })
    });
  }

  function uid() {
    return 'wgt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function ent() { return global.IfluxEntitlements; }

  function getTier() {
    if (ent() && ent().resolveTier) return ent().resolveTier();
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return (u && u.tier) || 'free';
  }

  function isPremium() {
    if (ent() && ent().isPremium) return ent().isPremium();
    var t = getTier();
    return t === 'premium' || t === 'elite' || t === 'partner' || t === 'admin';
  }

  function isElite() {
    if (ent() && ent().isElite) return ent().isElite();
    var t = getTier();
    return t === 'elite' || t === 'partner' || t === 'admin';
  }

  function maxWidgets() {
    if (ent() && ent().getLimit) {
      var cap = ent().getLimit('maxWidgets', null);
      if (cap != null) return cap;
    }
    var registryCap = (registry() && registry().FREE_MAX_WIDGETS) || 3;
    return isPremium() ? 99 : registryCap;
  }

  function defaultColumnForType(type) {
    var meta = registry() && registry().byType(type);
    if (meta && meta.scope === SCOPES.sidebar) return SIDEBAR_COL;
    return type === 'WGT-WAT-001' ? 'left' : 'right';
  }

  function subjWidthMigrated() {
    var store = us();
    if (store) return !!store.readJson(SUBJ_WIDTH_MIGRATED_KEY, null);
    try { return localStorage.getItem(SUBJ_WIDTH_MIGRATED_KEY) === '1'; } catch (e) { return false; }
  }

  function markSubjWidthMigrated() {
    var store = us();
    if (store) store.writeJson(SUBJ_WIDTH_MIGRATED_KEY, { at: Date.now() });
    else try { localStorage.setItem(SUBJ_WIDTH_MIGRATED_KEY, '1'); } catch (e) { /* ignore */ }
  }

  /** Widget SUBJ từng mặc định full — chuẩn hóa về ½ width theo spec nhóm entity. */
  function migrateSubjWidgetWidths(layout) {
    if (subjWidthMigrated() || !layout || !layout.widgets) return false;
    var changed = false;
    layout.widgets.forEach(function (w) {
      if (!w || !SUBJ_WIDGET_TYPES[w.widget_type]) return;
      if (widgetScope(w) !== SCOPES.dashboard) return;
      if (!w.config) w.config = {};
      if (w.config.width === 'full') {
        w.config.width = 'half';
        changed = true;
      }
    });
    markSubjWidthMigrated();
    return changed;
  }

  function statWidthMigrated() {
    var store = us();
    if (store) return !!store.readJson(STAT_WIDTH_MIGRATED_KEY, null);
    try { return localStorage.getItem(STAT_WIDTH_MIGRATED_KEY) === '1'; } catch (e) { return false; }
  }

  function markStatWidthMigrated() {
    var store = us();
    if (store) store.writeJson(STAT_WIDTH_MIGRATED_KEY, { at: Date.now() });
    else try { localStorage.setItem(STAT_WIDTH_MIGRATED_KEY, '1'); } catch (e) { /* ignore */ }
  }

  /** TOP dòng tiền vào/ra — mặc định full width trên dashboard. */
  function migrateStatScoreWidgetWidths(layout) {
    if (statWidthMigrated() || !layout || !layout.widgets) return false;
    var changed = false;
    layout.widgets.forEach(function (w) {
      if (!w || !STAT_SCORE_WIDGET_TYPES[w.widget_type]) return;
      if (widgetScope(w) !== SCOPES.dashboard) return;
      if (!w.config) w.config = {};
      if (w.config.width !== 'full') {
        w.config.width = 'full';
        changed = true;
      }
    });
    markStatWidthMigrated();
    return changed;
  }

  function statDuoMigrated() {
    var store = us();
    if (store) return !!store.readJson(STAT_DUO_MIGRATED_KEY, null);
    try { return localStorage.getItem(STAT_DUO_MIGRATED_KEY) === '1'; } catch (e) { return false; }
  }

  function markStatDuoMigrated() {
    var store = us();
    if (store) store.writeJson(STAT_DUO_MIGRATED_KEY, { at: Date.now() });
    else try { localStorage.setItem(STAT_DUO_MIGRATED_KEY, '1'); } catch (e) { /* ignore */ }
  }

  /** Gộp STAT_*_IN/OUT legacy → STAT_* duo (1 widget / entity), bỏ trùng. */
  function migrateStatDuoWidgets(layout) {
    if (!layout || !layout.widgets) return false;
    var seen = {};
    var next = [];
    var changed = false;
    layout.widgets.forEach(function (w, i) {
      if (!w) return;
      var type = w.widget_type || w.type;
      if (type && STAT_DUO_ALIASES[type]) {
        type = STAT_DUO_ALIASES[type];
        changed = true;
      }
      if (type && /^WGT-FLW-STAT_(STOCK|SECTOR|HST|STORY)$/.test(type)) {
        if (seen[type]) {
          changed = true;
          return;
        }
        seen[type] = true;
      }
      w.widget_type = type;
      if (STAT_SCORE_WIDGET_TYPES[type]) {
        if (!w.config) w.config = {};
        w.config.width = 'full';
      }
      next.push(w);
    });
    if (changed || !statDuoMigrated()) {
      layout.widgets = next;
      markStatDuoMigrated();
      return true;
    }
    return false;
  }

  function migrateWidget(w, fallbackIndex) {
    if (!w.widget_type && w.type) w.widget_type = w.type;
    if (w.widget_type && TYPE_ALIASES[w.widget_type]) {
      w.widget_type = TYPE_ALIASES[w.widget_type];
    }
    if (w.widget_type && STAT_DUO_ALIASES[w.widget_type]) {
      w.widget_type = STAT_DUO_ALIASES[w.widget_type];
      if (!w.config) w.config = {};
      w.config.width = 'full';
    }
    if (!w.scope) w.scope = inferScopeFromLegacy(w);
    if (w.scope === SCOPES.sidebar) w.column = SIDEBAR_COL;
    else if (!w.column || COLS.indexOf(w.column) < 0) {
      w.column = defaultColumnForType(w.widget_type);
    }
    if (typeof w.position !== 'number') w.position = fallbackIndex;
    if (w.scope === SCOPES.dashboard) {
      ensureWidgetWidth(w);
    }
    return w;
  }

  function widgetScope(w) {
    return w.scope || inferScopeFromLegacy(w);
  }

  function widgetsInScope(layout, scope) {
    return layout.widgets.filter(function (w) { return widgetScope(w) === scope; })
      .sort(function (a, b) { return a.position - b.position; });
  }

  function dashboardWidgetCount(layout) {
    return widgetsInScope(layout, SCOPES.dashboard).length;
  }

  function getWidgetWidth(w) {
    if (w && w.config && w.config.width) {
      var valid = { full: 1, twothirds: 1, half: 1, third: 1 };
      if (valid[w.config.width]) return w.config.width;
    }
    if (w && STAT_SCORE_WIDGET_TYPES[w.widget_type]) return 'full';
    if (w && w.column === 'left') return 'third';
    if (w && w.column === 'right') return 'twothirds';
    return 'half';
  }

  function setWidgetWidth(w, width) {
    if (!w) return;
    if (!w.config) w.config = {};
    w.config.width = width;
  }

  function ensureWidgetWidth(w) {
    setWidgetWidth(w, getWidgetWidth(w));
    return w.config.width;
  }

  function dashboardWidgetsOrdered(layout) {
    return layout.widgets.filter(function (w) { return widgetScope(w) === SCOPES.dashboard; })
      .sort(function (a, b) {
        var order = { left: 0, right: 1, grid: 0, main: 0 };
        var ca = order[a.column] != null ? order[a.column] : 0;
        var cb = order[b.column] != null ? order[b.column] : 0;
        if (ca !== cb) return ca - cb;
        return a.position - b.position;
      });
  }

  function widthToggleHtml(current, instanceId) {
    var opts = [
      { id: 'third', label: '⅓', title: 'Rộng 1/3' },
      { id: 'half', label: '½', title: 'Rộng 1/2' },
      { id: 'twothirds', label: '⅔', title: 'Rộng 2/3' },
      { id: 'full', label: 'Full', title: 'Rộng toàn hàng' }
    ];
    return (
      '<div class="ifx-widget-width" data-ifx-widget-width-toggle="' + instanceId + '">' +
        opts.map(function (o) {
          var active = o.id === current ? ' is-active' : '';
          return '<button type="button" class="ifx-widget-width__btn' + active + '" data-ifx-set-width="' + o.id + '" title="' + o.title + '">' + o.label + '</button>';
        }).join('') +
      '</div>'
    );
  }

  function applyWidthToNode(node, width) {
    if (!node) return;
    node.setAttribute('data-ifx-widget-width', width || 'half');
  }

  function normalizeLayout(layout) {
    var sidebarItems = layout.widgets.filter(function (w) {
      return widgetScope(w) === SCOPES.sidebar && w.column === SIDEBAR_COL;
    }).sort(function (a, b) { return a.position - b.position; });
    sidebarItems.forEach(function (w, i) { w.position = i; });

    var dash = dashboardWidgetsOrdered(layout);
    dash.forEach(function (w, i) {
      w.position = i;
      w.column = DASH_GRID_COL;
      ensureWidgetWidth(w);
    });
  }

  function isValidWidget(w) {
    var reg = registry();
    return !!(w && w.widget_type && reg && reg.byType(w.widget_type));
  }

  function freshDefaultLayout() {
    var reg = registry();
    if (!reg || !reg.DEFAULT_LAYOUT) return { widgets: [] };
    return repairLayout({
      widgets: reg.DEFAULT_LAYOUT.map(function (item, i) {
        return migrateWidget({
          instance_id: uid(),
          widget_type: item.widget_type,
          scope: item.scope,
          column: item.column,
          position: item.position,
          config: item.config || {}
        }, i);
      })
    });
  }

  function trimToMaxWidgets(layout) {
    var cap = maxWidgets();
    if (isPremium()) return layout;
    var sidebar = layout.widgets.filter(function (w) { return widgetScope(w) === SCOPES.sidebar; });
    var dash = layout.widgets.filter(function (w) { return widgetScope(w) === SCOPES.dashboard; });
    if (dash.length <= cap) {
      normalizeLayout(layout);
      return layout;
    }
    var locked = [];
    var rest = [];
    dash.forEach(function (w) {
      var meta = registry().byType(w.widget_type);
      if (meta && meta.locked) locked.push(w);
      else rest.push(w);
    });
    dash = locked.concat(rest).slice(0, cap);
    layout.widgets = sidebar.concat(dash);
    normalizeLayout(layout);
    return layout;
  }

  function ensureSidebarDefaults(layout) {
    var reg = registry();
    if (!reg || !reg.SIDEBAR_DEFAULT) return layout;

    layout.widgets.forEach(function (w) {
      var t = w.widget_type;
      if (t && t.indexOf('WGT-PRF') === 0) {
        w.scope = SCOPES.sidebar;
        w.column = SIDEBAR_COL;
        return;
      }
      if (widgetScope(w) === SCOPES.sidebar) {
        w.scope = SCOPES.dashboard;
        w.column = !w.column || w.column === SIDEBAR_COL ? 'left' : w.column;
      }
    });

    var sidebarTypes = {};
    layout.widgets = layout.widgets.filter(function (w) {
      var t = w.widget_type;
      if (t && t.indexOf('WGT-PRF') === 0) {
        if (sidebarTypes[t]) return false;
        sidebarTypes[t] = true;
      }
      return true;
    });

    reg.SIDEBAR_DEFAULT.forEach(function (def, i) {
      var exists = layout.widgets.some(function (w) { return w.widget_type === def.widget_type; });
      if (!exists) {
        layout.widgets.push(migrateWidget({
          instance_id: uid(),
          widget_type: def.widget_type,
          scope: SCOPES.sidebar,
          column: SIDEBAR_COL,
          position: i,
          config: def.config || {}
        }, layout.widgets.length));
      }
    });
    normalizeLayout(layout);
    return layout;
  }

  function repairLayout(layout) {
    var reg = registry();
    if (!reg) return layout || { widgets: [] };
    if (!layout.widgets || !Array.isArray(layout.widgets)) layout.widgets = [];
    migrateSubjWidgetWidths(layout);
    migrateStatDuoWidgets(layout);
    migrateStatScoreWidgetWidths(layout);
    layout.widgets = layout.widgets.map(function (w, i) {
      return normalizeWidgetRecord(w, i);
    }).filter(Boolean).filter(isValidWidget);
    layout.widgets.forEach(function (w, i) {
      if (!w.instance_id) w.instance_id = uid();
      migrateWidget(w, i);
    });
    ensureSidebarDefaults(layout);
    normalizeLayout(layout);
    return trimToMaxWidgets(layout);
  }

  function loadLayout() {
    try {
      var parsed = parseLayoutPayload(readStorageRaw());
      if (parsed && Array.isArray(parsed.widgets) && parsed.widgets.length) {
        var layout = repairLayout(parsed);
        saveLayout(layout);
        return layout;
      }
    } catch (e) {
      if (global.console && console.error) console.error('Dashboard loadLayout:', e);
    }
    var fresh = layoutFromPreset(registry().DEFAULT_LAYOUT);
    saveLayout(fresh);
    return fresh;
  }

  function saveLayout(layout) {
    repairLayout(layout);
    writeStorageRaw(layout);
  }

  function widgetsInColumn(layout, col, scope) {
    scope = scope || SCOPES.dashboard;
    return layout.widgets.filter(function (w) {
      return widgetScope(w) === scope && w.column === col;
    }).sort(function (a, b) { return a.position - b.position; });
  }

  function canAccessWidget(meta) {
    if (!meta) return false;
    if (ent() && ent().canAccessWidget) return ent().canAccessWidget(meta);
    if (meta.tier === 'premium' && !isPremium()) return false;
    if (meta.tier === 'elite' && !isElite()) return false;
    return true;
  }

  function openPaywall(opts) {
    if (global.IfluxWebUI && global.IfluxWebUI.openPricing) {
      IfluxWebUI.openPricing(opts || {});
    } else if (global.IfluxPricingModal) {
      IfluxPricingModal.open(opts || {});
    } else if (global.ixToast) {
      ixToast('Nâng cấp Premium để tiếp tục', 'warning');
    }
  }

  function paywallHtml(meta) {
    var tierLabel = meta.tier === 'elite' ? 'Elite' : 'Premium';
    return (
      '<div class="ifx-widget-paywall">' +
        '<div><i class="ti ti-lock"></i></div>' +
        '<p><strong>' + meta.title + '</strong> là tính năng ' + tierLabel + '.</p>' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-paywall-cta>Nâng cấp ' + tierLabel + '</button>' +
      '</div>'
    );
  }

  function defaultConfigFor(meta, scope) {
    var cfg = Object.assign({}, meta && meta.defaultConfig || {});
    if (scope === SCOPES.dashboard && !cfg.width) cfg.width = 'half';
    return cfg;
  }

  function buildWidgetNode(instance, editMode) {
    var meta = IfluxWidgetRegistry.byType(instance.widget_type);
    if (!meta) return null;

    var copy = global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy
      ? L4RuntimeReader.resolveWidgetCopy(instance.widget_type)
      : (global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy
        ? L4RuntimeReader.resolveWidgetCopy(instance.widget_type)
        : null);
    var displayTitle = copy ? copy.title : meta.title;
    var displayDescription = copy ? copy.description : (meta.description || '');
    if (meta.type === 'WGT-WAT-001' && displayTitle === 'Watchlist') displayTitle = 'Theo dõi';
    var footerLabel = meta.footerLabel || '';
    if (meta.type === 'WGT-WAT-001' && /Watchlist/i.test(footerLabel)) {
      footerLabel = 'Mở danh sách theo dõi đầy đủ';
    }

    var node = document.createElement('div');
    node.className = 'ifx-widget';
    node.setAttribute('data-instance-id', instance.instance_id);
    node.setAttribute('data-widget-type', instance.widget_type);

    var removeBtn = editMode && !meta.locked
      ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm ifx-widget-remove" title="Gỡ tiện ích"><i class="ti ti-x"></i></button>'
      : '';

    /* Share stub — Foundation Share Action lazy khi click. */
    var shareInHeader = !editMode
      ? '<span class="ifx-block-share-actions">' +
          '<button type="button" class="ifx-insight-share-btn" title="Chia sẻ Insight" aria-label="Chia sẻ Insight">' +
            '<i class="ti ti-share-3"></i></button></span>'
      : '';

    var dragHandle = editMode
      ? '<span class="ifx-widget__drag" title="Kéo thả để sắp xếp"><i class="ti ti-grip-vertical"></i></span>'
      : '';

    var widthToggle = editMode && widgetScope(instance) === SCOPES.dashboard
      ? widthToggleHtml(getWidgetWidth(instance), instance.instance_id)
      : '';

    /* UI-001: .ifx-widget = host layout; .ifx-widget__surface = TPL-SHELL-CARD fallback (không gắn .ifx-mkt-card để tránh block-templates ghi đè khi demote) */
    node.innerHTML =
      '<div class="ifx-widget__surface">' +
        '<div class="ifx-widget__header">' +
          dragHandle +
          '<h3>' + displayTitle + '</h3>' +
          (displayDescription ? '<p class="ifx-widget__subtitle">' + displayDescription + '</p>' : '') +
          '<div class="ifx-widget__actions">' +
            widthToggle +
            shareInHeader +
            removeBtn + '</div>' +
        '</div>' +
        '<div class="ifx-widget__body"></div>' +
        (meta.footerHref
          ? '<div class="ifx-widget__footer"><a href="' + meta.footerHref + '">' + footerLabel + ' →</a></div>'
          : '') +
      '</div>';

    var body = node.querySelector('.ifx-widget__body');
    if (!canAccessWidget(meta)) {
      body.innerHTML = paywallHtml(meta);
      body.querySelector('[data-ifx-paywall-cta]').addEventListener('click', function () {
        openPaywall({
          reason: meta.tier === 'elite' ? 'elite_feature' : 'premium_feature',
          message: meta.title + ' là tiện ích ' + (meta.tier === 'elite' ? 'Elite' : 'Premium') + '. Nâng cấp để sử dụng.'
        });
      });
    } else if (global.IfluxWidgetRenderers) {
      try {
        IfluxWidgetRenderers.render(instance.widget_type, body, instance.config);
      } catch (err) {
        body.innerHTML = '<div class="ifx-wl-empty">Không tải được tiện ích</div>';
        if (global.console && console.error) console.error('Widget render failed:', instance.widget_type, err);
      }
    }

    if (widgetScope(instance) === SCOPES.dashboard) {
      applyWidthToNode(node, getWidgetWidth(instance));
    }

    return node;
  }

  function insertWidget(layout, type, col, index, scope) {
    var meta = registry() && registry().byType(type);
    scope = scope || (meta && meta.scope) || SCOPES.dashboard;
    if (scope === SCOPES.sidebar) col = SIDEBAR_COL;

    var others = layout.widgets.filter(function (w) { return widgetScope(w) !== scope; });
    var scoped = layout.widgets.filter(function (w) { return widgetScope(w) === scope; });

    if (scope === SCOPES.sidebar) {
      var list = scoped.slice();
      if (index < 0) index = 0;
      if (index > list.length) index = list.length;
      list.splice(index, 0, migrateWidget({
        instance_id: uid(),
        widget_type: type,
        scope: scope,
        column: SIDEBAR_COL,
        position: index,
        config: defaultConfigFor(meta, scope)
      }, index));
      list.forEach(function (w, i) { w.column = SIDEBAR_COL; w.position = i; });
      layout.widgets = others.concat(list);
      return;
    }

    var sidebar = layout.widgets.filter(function (w) { return widgetScope(w) === SCOPES.sidebar; });
    var dash = dashboardWidgetsOrdered(layout).slice();
    if (index < 0) index = 0;
    if (index > dash.length) index = dash.length;
    dash.splice(index, 0, migrateWidget({
      instance_id: uid(),
      widget_type: type,
      scope: scope,
      column: DASH_GRID_COL,
      position: index,
      config: defaultConfigFor(meta, scope)
    }, index));
    dash.forEach(function (w, i) {
      w.column = DASH_GRID_COL;
      w.position = i;
      ensureWidgetWidth(w);
    });
    layout.widgets = sidebar.concat(dash);
  }

  function heroEmptyHtml() {
    return (
      '<div class="ifx-dash-empty ifx-dash-empty--hero" data-ifx-dash-empty="1">' +
        '<div class="ifx-dash-empty__icon"><i class="ti ti-layout-dashboard"></i></div>' +
        '<p class="ifx-dash-empty__lead">Bạn chưa có block nào.</p>' +
        '<p class="ifx-dash-empty__sub">Vui lòng chọn ' +
          '<button type="button" class="ifx-dash-empty__action ix-btn ix-btn-outline ix-btn-sm" data-ifx-empty-popular>' +
            '<i class="ti ti-flame"></i> Phổ biến' +
          '</button> ' +
          'để thiết kế nhanh Dashboard của mình. Hoặc ' +
          '<button type="button" class="ifx-dash-empty__action ix-btn ix-btn-primary ix-btn-sm" data-ifx-empty-customize">' +
            '<i class="ti ti-layout-grid-add"></i> Tùy chỉnh' +
          '</button> ' +
          'để bắt đầu xây dựng theo cách của riêng bạn.' +
        '</p>' +
      '</div>'
    );
  }

  function buildAddSlot(col, index, canAdd) {
    if (!canAdd) return null;
    var slot = document.createElement('div');
    slot.className = 'ifx-dash-add-slot';
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');
    slot.setAttribute('data-ifx-add-col', col);
    slot.setAttribute('data-ifx-add-index', String(index));
    slot.innerHTML = '<i class="ti ti-plus"></i><span>Thêm tiện ích</span>';
    return slot;
  }

  function appendColumnAddSlot(stack, col, layout, editMode, onSlotClick, scope) {
    if (!editMode || !stack || scope === SCOPES.sidebar) return;
    scope = scope || SCOPES.dashboard;
    var canAdd = isPremium() || dashboardWidgetCount(layout) < maxWidgets();
    var count = scope === SCOPES.dashboard
      ? dashboardWidgetsOrdered(layout).length
      : widgetsInColumn(layout, col, scope).length;
    var slot = buildAddSlot(col, count, canAdd);
    if (!slot) return;
    slot.setAttribute('data-add-scope', scope);
    if (typeof onSlotClick === 'function') {
      slot.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        onSlotClick(col, count, scope);
      });
      slot.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onSlotClick(col, count, scope);
      });
    }
    stack.appendChild(slot);
  }

  function renderCanvas(canvas, layout, editMode, afterChange, onAddSlotClick) {
    canvas.classList.remove('is-empty-hero');
    var dashWidgets = widgetsInScope(layout, SCOPES.dashboard);

    if (!dashWidgets.length && !editMode) {
      canvas.innerHTML = heroEmptyHtml();
      return;
    }

    canvas.innerHTML =
      '<div class="ifx-dash-grid" data-drop-zone="' + DASH_GRID_COL + '" data-dash-scope="dashboard">' +
        (editMode ? '<div class="ifx-dash-grid__label">Kéo thả block · chọn ⅓ · ½ · ⅔ · Full</div>' : '') +
        '<div class="ifx-dash-grid__stack" data-col-stack="' + DASH_GRID_COL + '"></div>' +
      '</div>';

    var stack = canvas.querySelector('[data-col-stack="' + DASH_GRID_COL + '"]');
    dashboardWidgetsOrdered(layout).forEach(function (inst) {
      var node = buildWidgetNode(inst, editMode);
      if (node) stack.appendChild(node);
    });
    appendColumnAddSlot(stack, DASH_GRID_COL, layout, editMode, onAddSlotClick, SCOPES.dashboard);

    bindWidgetActions(canvas, layout, editMode, afterChange);
    if (editMode) bindPointerDrag(canvas, layout, afterChange, SCOPES.dashboard);
  }

  function renderSidebarStack(canvas, layout) {
    if (!canvas) return;
    canvas.innerHTML = '';

    widgetsInColumn(layout, SIDEBAR_COL, SCOPES.sidebar)
      .filter(function (inst) {
        return inst.widget_type && inst.widget_type.indexOf('WGT-PRF') === 0;
      })
      .forEach(function (inst) {
        var node = buildWidgetNode(inst, false);
        if (node) canvas.appendChild(node);
      });

    // Top Watchlist (WGT-COM-004) là shared/custom — không hardcode khi Widget tùy chỉnh tắt.
    // User thêm qua Tùy chỉnh nếu Admin bật shared cho trang dashboard.

    if (global.ProfileBind) ProfileBind.init();
  }

  function bindWidgetActions(canvas, layout, editMode, afterChange) {
    canvas.querySelectorAll('.ifx-widget').forEach(function (wrap) {
      if (editMode || !global.IfluxInsightShare) return;
      var wtype = wrap.getAttribute('data-widget-type') || '';
      if (['WGT-MKT-001', 'WGT-MKT-007', 'WGT-MKT-008'].indexOf(wtype) >= 0) return;
      IfluxInsightShare.bindWidgetShare(wrap, wtype);
    });
    canvas.querySelectorAll('.ifx-widget-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.ifx-widget');
        var id = wrap.getAttribute('data-instance-id');
        layout.widgets = layout.widgets.filter(function (w) { return w.instance_id !== id; });
        if (typeof afterChange === 'function') afterChange();
        else renderCanvas(canvas, layout, editMode);
        if (global.ixToast) ixToast('Đã gỡ tiện ích', 'info');
      });
    });
    canvas.querySelectorAll('[data-ifx-set-width]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var width = btn.getAttribute('data-ifx-set-width');
        var wrap = btn.closest('.ifx-widget');
        if (!wrap || !width) return;
        var id = wrap.getAttribute('data-instance-id');
        var w = getWidget(layout, id);
        if (!w) return;
        setWidgetWidth(w, width);
        applyWidthToNode(wrap, width);
        wrap.querySelectorAll('[data-ifx-set-width]').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-ifx-set-width') === width);
        });
      });
    });
  }

  function findInsertIndex(stack, clientY, skipId) {
    var widgets = stack.querySelectorAll('.ifx-widget');
    var idx = 0;
    for (var i = 0; i < widgets.length; i++) {
      if (skipId && widgets[i].getAttribute('data-instance-id') === skipId) continue;
      var rect = widgets[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return idx;
      idx += 1;
    }
    return idx;
  }

  function moveWidget(layout, id, targetCol, targetIndex, scope) {
    scope = scope || SCOPES.dashboard;
    var w = getWidget(layout, id);
    if (!w) return;

    var others = layout.widgets.filter(function (item) { return widgetScope(item) !== scope; });
    var scoped = layout.widgets.filter(function (item) { return widgetScope(item) === scope; })
      .filter(function (x) { return x.instance_id !== id; });

    w = getWidget(layout, id);
    w.scope = scope;

    if (scope === SCOPES.sidebar) {
      targetCol = SIDEBAR_COL;
      if (targetIndex < 0) targetIndex = 0;
      if (targetIndex > scoped.length) targetIndex = scoped.length;
      scoped.splice(targetIndex, 0, w);
      scoped.forEach(function (x, i) { x.column = SIDEBAR_COL; x.position = i; });
      layout.widgets = others.concat(scoped);
      return;
    }

    var sidebar = layout.widgets.filter(function (item) { return widgetScope(item) === SCOPES.sidebar; });
    var dash = dashboardWidgetsOrdered(layout).filter(function (x) { return x.instance_id !== id; });

    w = getWidget(layout, id);
    w.scope = scope;
    w.column = DASH_GRID_COL;

    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > dash.length) targetIndex = dash.length;
    dash.splice(targetIndex, 0, w);
    dash.forEach(function (x, i) {
      x.column = DASH_GRID_COL;
      x.position = i;
      ensureWidgetWidth(x);
    });
    layout.widgets = sidebar.concat(dash);
  }

  function getColumnAt(canvas, clientX, scope) {
    if (scope === SCOPES.sidebar) return SIDEBAR_COL;
    return DASH_GRID_COL;
  }

  function getWidget(layout, id) {
    var found = null;
    layout.widgets.forEach(function (w) {
      if (w.instance_id === id) found = w;
    });
    return found;
  }

  function bindPointerDrag(canvas, layout, afterChange, scope) {
    scope = scope || SCOPES.dashboard;
    var dragScope = scope;
    var ghost = null;
    var dragId = null;
    var sourceEl = null;
    var hoverCol = null;

    function clearMarks() {
      canvas.querySelectorAll('[data-drop-placeholder]').forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      canvas.querySelectorAll('.ifx-widget').forEach(function (w) {
        w.classList.remove('is-drop-push-before', 'is-drop-push-after', 'is-dragging');
      });
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      ghost = null;
      hoverCol = null;
    }

    function updateDropIndicator(colKey, clientY) {
      canvas.querySelectorAll('[data-drop-placeholder]').forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      canvas.querySelectorAll('.ifx-widget').forEach(function (w) {
        w.classList.remove('is-drop-push-before', 'is-drop-push-after');
      });

      var stack = canvas.querySelector('[data-col-stack="' + (dragScope === SCOPES.sidebar ? SIDEBAR_COL : colKey) + '"]');
      if (!stack) return;

      var idx = findInsertIndex(stack, clientY, dragId);
      var ph = document.createElement('div');
      ph.className = 'ifx-drop-placeholder';
      ph.setAttribute('data-drop-placeholder', '1');
      ph.style.minHeight = (ghost && ghost._height ? ghost._height : 72) + 'px';

      var widgets = stack.querySelectorAll('.ifx-widget:not(.is-dragging)');
      if (idx >= widgets.length) {
        stack.appendChild(ph);
        if (widgets.length > 0) {
          widgets[widgets.length - 1].classList.add('is-drop-push-after');
        }
      } else {
        stack.insertBefore(ph, widgets[idx]);
        widgets[idx].classList.add('is-drop-push-before');
        if (idx > 0) widgets[idx - 1].classList.add('is-drop-push-after');
      }
    }

    function onMove(e) {
      if (!ghost) return;
      ghost.style.left = (e.clientX - ghost._offsetX) + 'px';
      ghost.style.top = (e.clientY - ghost._offsetY) + 'px';

      var colKey = getColumnAt(canvas, e.clientX, dragScope);
      hoverCol = colKey;
      updateDropIndicator(colKey, e.clientY);
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      if (!dragId) {
        clearMarks();
        return;
      }

      var targetCol = getColumnAt(canvas, e.clientX, dragScope);
      var stack = canvas.querySelector('[data-col-stack="' + (dragScope === SCOPES.sidebar ? SIDEBAR_COL : targetCol) + '"]');
      var targetIndex = findInsertIndex(stack, e.clientY, dragId);

      moveWidget(layout, dragId, targetCol, targetIndex, dragScope);
      if (typeof afterChange === 'function') afterChange();
      else renderCanvas(canvas, layout, true);
      if (global.ixToast) ixToast('Đã sắp xếp tiện ích', 'info');

      clearMarks();
      dragId = null;
      sourceEl = null;
    }

    canvas.querySelectorAll('.ifx-widget__drag').forEach(function (handle) {
      handle.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        var widget = handle.closest('.ifx-widget');
        dragId = widget.getAttribute('data-instance-id');
        sourceEl = widget;
        widget.classList.add('is-dragging');

        var rect = widget.getBoundingClientRect();
        ghost = widget.cloneNode(true);
        ghost.classList.add('ifx-drag-ghost');
        ghost.classList.remove('is-dragging');
        ghost.style.width = rect.width + 'px';
        ghost._height = rect.height;
        ghost._offsetX = e.clientX - rect.left;
        ghost._offsetY = e.clientY - rect.top;
        ghost.style.left = rect.left + 'px';
        ghost.style.top = rect.top + 'px';
        document.body.appendChild(ghost);

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  function widgetDisplayCopy(type) {
    if (global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy) {
      return L4RuntimeReader.resolveWidgetCopy(type);
    }
    if (global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy) {
      return L4RuntimeReader.resolveWidgetCopy(type);
    }
    var meta = registry() && registry().byType(type);
    return {
      title: meta ? meta.title : type,
      description: meta ? (meta.description || '') : ''
    };
  }

  function openRegistryModal(layout, canvas, editMode, afterChange, targetCol, targetIndex, targetScope) {
    var overlay = document.getElementById('widgetRegistryModal');
    if (!overlay) return;
    var list = overlay.querySelector('[data-ifx-registry-list]');
    var titleEl = overlay.querySelector('.ix-modal-title');
    var subEl = overlay.querySelector('.ix-modal-sub');
    var groups = IfluxWidgetRegistry.grouped();
    var atMaxAll = dashboardWidgetCount(layout) >= maxWidgets() && !isPremium();
    targetScope = targetScope || SCOPES.dashboard;
    var colLabel = targetScope === SCOPES.sidebar
      ? 'cột tiện ích hồ sơ'
      : 'bảng điều khiển';

    if (titleEl) {
      titleEl.textContent = targetCol ? 'Thêm tiện ích · ' + colLabel : 'Danh mục tiện ích';
    }
    if (subEl) {
      subEl.textContent = targetCol
        ? 'Chọn tiện ích để thêm vào ' + colLabel
        : 'Chọn tiện ích để thêm vào bảng tổng quan';
    }

    var html = '';
    if (atMaxAll) {
      html += '<div class="ifx-registry-cap" style="margin-bottom:14px;padding:12px 14px;border-radius:var(--ix-radius-lg);background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.25);font-size:13px;color:var(--ix-text-secondary);line-height:1.5">' +
        'Đã đủ <strong>' + dashboardWidgetCount(layout) + ' / ' + maxWidgets() + '</strong> tiện ích. ' +
        'Gỡ một tiện ích (nút <strong>×</strong>) rồi thêm block khác.' +
      '</div>';
    }
    Object.keys(groups).forEach(function (key) {
      var g = groups[key];
      html += '<div class="ifx-registry-group"><div class="ifx-registry-group__title">' + g.label + '</div>';
      g.items.forEach(function (w) {
        if (w.pageComponent || (w.type && w.type.indexOf('WGT-PRF') === 0)) return;
        if (targetScope === SCOPES.sidebar && w.scope !== SCOPES.sidebar) return;
        if (targetScope === SCOPES.dashboard && w.scope === SCOPES.sidebar) return;
        var onDash = layout.widgets.some(function (x) {
          return x.widget_type === w.type && widgetScope(x) === SCOPES.dashboard;
        });
        /* Permission decision = engine (canAccessWidget delegate IfluxEntitlements, tôn trọng
           plan.blocks Admin). KHÔNG tự quyết inline từ w.tier. w.tier chỉ còn là metadata hiển thị chip. */
        var locked = !canAccessWidget(w);
        var atMax = dashboardWidgetCount(layout) >= maxWidgets() && !isPremium();
        var btnDisabled = onDash || atMax ? ' disabled' : '';
        var tierChip = w.tier === 'elite'
          ? ' <span class="ix-chip ix-chip-warning" style="font-size:10px">Elite</span>'
          : (w.tier === 'premium' ? ' <span class="ix-chip ix-chip-primary" style="font-size:10px">Premium</span>' : '');
        var display = widgetDisplayCopy(w.type);
        var actionCol = targetCol || 'right';
        html +=
          '<div class="ifx-registry-item">' +
            '<div><div class="ifx-registry-item__name">' + display.title + tierChip +
              (onDash ? ' <span class="ix-chip ix-chip-secondary" style="font-size:10px">Đã có</span>' : '') +
            '</div><div class="ifx-registry-item__desc">' + display.description + '</div></div>' +
            '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-add-type="' + w.type + '" data-add-col="' + actionCol + '"' +
              ' data-add-locked="' + (locked ? '1' : '0') + '" data-add-max="' + (atMax ? '1' : '0') + '"' + btnDisabled + '>Thêm</button>' +
          '</div>';
      });
      html += '</div>';
    });
    list.innerHTML = html;

    list.querySelectorAll('[data-add-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var type = btn.getAttribute('data-add-type');
        var col = targetCol || btn.getAttribute('data-add-col') || 'right';
        var meta = IfluxWidgetRegistry.byType(type);
        if (btn.getAttribute('data-add-locked') === '1') {
          openPaywall({
            reason: meta.tier === 'elite' ? 'elite_feature' : 'premium_widget',
            message: '«' + meta.title + '» là tiện ích ' + (meta.tier === 'elite' ? 'Elite' : 'Premium') + '. Nâng cấp để thêm vào Dashboard.'
          });
          return;
        }
        if (btn.getAttribute('data-add-max') === '1') {
          if (global.ixToast) {
            ixToast('Gói Miễn phí tối đa ' + maxWidgets() + ' tiện ích. Gỡ một tiện ích hoặc nâng cấp Premium.', 'warning');
          } else {
            openPaywall({ reason: 'widget_limit', message: 'Gói Miễn phí tối đa ' + maxWidgets() + ' tiện ích.' });
          }
          return;
        }
        if (layout.widgets.some(function (w) { return w.widget_type === type; })) {
          if (global.ixToast) ixToast('«' + widgetDisplayCopy(type).title + '» đã có trên bảng điều khiển', 'info');
          return;
        }
        var index = typeof targetIndex === 'number'
          ? targetIndex
          : (targetScope === SCOPES.dashboard
            ? dashboardWidgetsOrdered(layout).length
            : widgetsInColumn(layout, col, targetScope).length);
        insertWidget(layout, type, targetScope === SCOPES.dashboard ? DASH_GRID_COL : col, index, targetScope);
        if (typeof afterChange === 'function') afterChange();
        else renderCanvas(canvas, layout, editMode);
        overlay.classList.remove('open');
        if (global.ixToast) ixToast('Đã thêm ' + widgetDisplayCopy(type).title, 'info');
      });
    });

    overlay.classList.add('open');
  }

  function openPopularModal(onApply) {
    var overlay = document.getElementById('popularWidgetsModal');
    if (!overlay || !registry()) return;
    var listEl = overlay.querySelector('[data-ifx-popular-list]');
    var items = registry().sortedByPopularity ? registry().sortedByPopularity() : registry().CATALOG.slice();
    var preset = registry().POPULAR_LAYOUT || registry().DEFAULT_LAYOUT;
    var presetTypes = preset.map(function (p) { return p.widget_type; });

    var html = '<div style="font-size:13px;color:var(--ix-text-muted);margin-bottom:12px;line-height:1.5">' +
      'Bố cục đề xuất: <strong>Theo dõi</strong> (⅓) + tiện ích thị trường (⅔ / ½) xếp linh hoạt trên một hàng.</div>';

    html += items.slice(0, 6).map(function (w, i) {
      var inPreset = presetTypes.indexOf(w.type) >= 0;
      var pct = w.popularity || 0;
      var display = widgetDisplayCopy(w.type);
      return '<div class="ifx-registry-item" style="margin-bottom:10px' + (inPreset ? ';border-color:var(--ix-accent)' : '') + '">' +
        '<div style="flex:1;min-width:0">' +
          '<div class="ifx-registry-item__name">' +
            '<span style="color:var(--ix-text-muted);font-size:12px;margin-right:6px">#' + (i + 1) + '</span>' +
            display.title +
            (inPreset ? ' <span class="ix-chip ix-chip-primary" style="font-size:10px">Trong bố cục</span>' : '') +
          '</div>' +
          '<div class="ifx-registry-item__desc">' + display.description + '</div>' +
          '<div style="margin-top:8px;height:4px;border-radius:2px;background:var(--ix-border);overflow:hidden">' +
            '<div style="height:100%;width:' + pct + '%;background:var(--ix-accent);border-radius:2px"></div>' +
          '</div>' +
          '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:4px">' + pct + '% người dùng</div>' +
        '</div></div>';
    }).join('');

    listEl.innerHTML = html;

    var applyBtn = overlay.querySelector('[data-ifx-popular-apply]');
    var newApply = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApply, applyBtn);
    newApply.addEventListener('click', function () {
      if (typeof onApply === 'function') onApply();
      closePopularModal();
    });

    overlay.classList.add('open');
  }

  function layoutSignature(layout) {
    return (layout && layout.widgets ? layout.widgets : []).map(function (w) {
      return w.widget_type + ':' + (widgetScope(w) === SCOPES.dashboard ? getWidgetWidth(w) : w.column) + ':' + w.position;
    }).sort().join('|');
  }

  function setEditUi(editMode, activeAction, layout, committedLayout) {
    var primary = document.querySelector('[data-ifx-dash-primary]');
    var confirm = document.querySelector('[data-ifx-dash-confirm]');
    var hint = document.querySelector('[data-ifx-dash-hint]');

    if (primary) primary.hidden = editMode;
    if (confirm) confirm.hidden = !editMode;

    if (hint) {
      if (!editMode) {
        var count = 0;
        try {
          var c = document.querySelector('[data-ifx-dash-canvas]');
          if (c) count = c.querySelectorAll('.ifx-widget').length;
        } catch (e) { /* ignore */ }
        if (!count) {
          hint.textContent = 'Chưa có block · Chọn Phổ biến hoặc Tùy chỉnh để bắt đầu';
        } else {
          var max = maxWidgets();
          hint.textContent = isPremium()
            ? count + ' tiện ích · Bấm Tùy chỉnh để sắp xếp'
            : count + ' / ' + max + ' tiện ích · Bấm Tùy chỉnh để thêm hoặc sắp xếp';
        }
      } else if (activeAction === 'default') {
        hint.textContent = 'Xem trước bố cục mặc định · Bấm Xong để áp dụng hoặc Hủy để quay lại';
      } else if (activeAction === 'popular') {
        var previewing = layoutSignature(layout) !== layoutSignature(committedLayout);
        hint.textContent = previewing
          ? 'Đang xem trước · Bấm Xong để áp dụng hoặc Hủy để quay lại'
          : 'Chọn «Xem trước bố cục» trong hộp thoại · Hủy để quay lại';
      } else {
        hint.textContent = 'Chọn ⅓ · ½ · ⅔ · Full cho từng block · Kéo thả để sắp xếp · Xong để áp dụng · Hủy để bỏ';
      }
    }
  }

  function init() {
    if (!registry() || !registry().DEFAULT_LAYOUT) {
      if (global.console && console.error) console.error('Dashboard: thiếu IfluxWidgetRegistry');
      return;
    }

    var sidebarCanvas = document.querySelector('[data-ifx-hub-sidebar-canvas]');
    var canvas = document.querySelector('[data-ifx-dash-canvas]');
    if (!canvas && !sidebarCanvas) return;

    var layout;
    var editMode = false;
    var activeAction = null;
    var committedLayout;

    try {
      committedLayout = loadLayout();
      layout = cloneLayout(committedLayout);
    } catch (e) {
      if (global.console && console.error) console.error('Dashboard init load:', e);
      committedLayout = { widgets: [] };
      layout = { widgets: [] };
    }

    function enterEditMode(action) {
      editMode = true;
      activeAction = action || 'customize';
      closePopularModal();
      if (activeAction === 'customize') {
        layout = cloneLayout(committedLayout);
      }
      render();
    }

    function commitEditMode() {
      saveLayout(layout);
      committedLayout = cloneLayout(layout);
      editMode = false;
      activeAction = null;
      closeRegistryModal();
      closePopularModal();
      render();
    }

    function cancelEditMode() {
      layout = cloneLayout(committedLayout);
      editMode = false;
      activeAction = null;
      closeRegistryModal();
      closePopularModal();
      render();
    }

    function openPopularFlow() {
      enterEditMode('popular');
      openPopularModal(function () {
        var preview = draftPopularLayout();
        if (!preview.widgets || !preview.widgets.length) {
          if (global.ixToast) ixToast('Không thể tải bố cục phổ biến', 'danger');
          return;
        }
        layout = preview;
        activeAction = 'popular';
        render();
        if (global.ixToast) ixToast('Đã xem trước · Bấm Xong để áp dụng hoặc Hủy để quay lại', 'info');
      });
    }

    function handleAddSlotClick(col, index, scope) {
      if (!editMode) return;
      if (dashboardWidgetCount(layout) >= maxWidgets() && !isPremium()) {
        if (global.ixToast) ixToast('Gói Miễn phí tối đa ' + maxWidgets() + ' tiện ích', 'warning');
        return;
      }
      openRegistryModal(layout, canvas, true, render, col, index, scope);
    }

    function render() {
      try {
        setEditUi(editMode, activeAction, layout, committedLayout);
        if (sidebarCanvas) {
          renderSidebarStack(sidebarCanvas, layout);
        }
        if (canvas) {
          renderCanvas(canvas, layout, editMode, render, handleAddSlotClick);
          var dashCount = widgetsInScope(layout, SCOPES.dashboard).length;
          if (!dashCount && !editMode) {
            canvas.classList.add('is-empty-hero');
          }
          canvas.classList.toggle('is-edit', editMode);
        }
      } catch (e) {
        if (global.console && console.error) console.error('Dashboard render:', e);
      }
    }

    render();

    canvas.addEventListener('click', function (e) {
      if (e.target.closest('[data-ifx-add-col]')) return;

      if (e.target.closest('[data-ifx-empty-popular]')) {
        openPopularFlow();
        return;
      }
      if (e.target.closest('[data-ifx-empty-customize]')) {
        enterEditMode('customize');
        return;
      }
    });

    var btnDone = document.querySelector('[data-ifx-dash-done]');
    if (btnDone) {
      btnDone.addEventListener('click', function () {
        commitEditMode();
        if (global.ixToast) ixToast('Đã áp dụng thay đổi', 'success');
      });
    }

    var btnCancel = document.querySelector('[data-ifx-dash-cancel]');
    if (btnCancel) {
      btnCancel.addEventListener('click', function () {
        cancelEditMode();
        if (global.ixToast) ixToast('Đã hủy thay đổi', 'info');
      });
    }

    var btnDefault = document.querySelector('[data-ifx-dash-default]');
    if (btnDefault) {
      btnDefault.addEventListener('click', function () {
        editMode = true;
        activeAction = 'default';
        closeRegistryModal();
        closePopularModal();
        layout = draftDefaultLayout();
        render();
      });
    }

    var btnPopular = document.querySelector('[data-ifx-dash-popular]');
    if (btnPopular) {
      btnPopular.addEventListener('click', openPopularFlow);
    }

    var btnEdit = document.querySelector('[data-ifx-dash-edit]');
    if (btnEdit) {
      btnEdit.addEventListener('click', function () {
        enterEditMode('customize');
        closeRegistryModal();
        closePopularModal();
      });
    }

    document.querySelectorAll('[data-ifx-popular-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closePopularModal();
      });
    });
    var popularModal = document.getElementById('popularWidgetsModal');
    if (popularModal) {
      popularModal.addEventListener('click', function (e) {
        if (e.target === popularModal) closePopularModal();
      });
    }

    document.querySelectorAll('[data-ix-registry-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeRegistryModal();
      });
    });
    var modal = document.getElementById('widgetRegistryModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeRegistryModal();
      });
    }
  }

  global.IfluxDashboardEngine = {
    init: init,
    refreshSidebar: function () {
      var sidebarCanvas = document.querySelector('[data-ifx-hub-sidebar-canvas]');
      if (!sidebarCanvas) return;
      try {
        var layout = loadLayout();
        renderSidebarStack(sidebarCanvas, layout);
        if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAll();
        if (global.ProfileBind) ProfileBind.init();
      } catch (e) { /* ignore */ }
    },
    resetToDefaults: function () {
      var canvas = document.querySelector('[data-ifx-dash-canvas]');
      if (!canvas) return;
      var layout = resetLayoutToDefaults();
      closeRegistryModal();
      closePopularModal();
      renderCanvas(canvas, layout, false);
    }
  };
})(window);
