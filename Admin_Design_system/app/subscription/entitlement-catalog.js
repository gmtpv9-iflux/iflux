/**
 * iFlux — Catalog quyền sử dụng
 * Trang & Menu (nội dung mặc định) · Widget · Giới hạn
 *
 * Nguồn Widget = Core 4 tầng · Tầng 4 (PlatformLayersWidgets) — SoT DUY NHẤT.
 * Thêm/sửa widget ở Tầng 4 → tự đồng bộ sang Phân quyền sử dụng.
 * Fallback Thư viện Widget chỉ khi Tầng 4 chưa nạp (giữ trang cũ không vỡ).
 */
(function (global) {
  'use strict';

  var TIER_ORDER = { guest: 0, free: 1, premium: 2, elite: 3 };

  var TIER_LABELS = {
    guest: 'Vãng lai',
    free: 'Free',
    premium: 'Premium',
    elite: 'Elite'
  };

  var OPERATIONS = [
    { key: 'view', label: 'Xem', icon: 'ti-eye' },
    { key: 'add', label: 'Thêm', icon: 'ti-plus' },
    { key: 'edit', label: 'Sửa', icon: 'ti-pencil' },
    { key: 'delete', label: 'Xóa', icon: 'ti-trash' }
  ];


  /* Quyền thao tác trên tính năng hệ thống */
  var ACTIONS = [
    { key: 'search', label: 'Tìm kiếm toàn cục', group: 'Hệ thống' },
    { key: 'watchlist', label: 'Watchlist cá nhân', group: 'Cá nhân' },
    { key: 'alerts', label: 'Cảnh báo giá / thị trường', group: 'Công cụ' },
    { key: 'dashboardWidgets', label: 'Widget dashboard', group: 'Dashboard' },
    { key: 'newsRead', label: 'Đọc feed Tin tức', group: 'Tin tức' },
    { key: 'newsWrite', label: 'Viết bài Tin tức (tạm đóng)', group: 'Tin tức' },
    { key: 'newsComment', label: 'Bình luận Tin tức', group: 'Tin tức' },
    { key: 'flowRt', label: 'Dòng tiền real-time (WSS)', group: 'Dòng tiền' },
    { key: 'candles', label: 'Biểu đồ nến chi tiết', group: 'Thị trường' },
    { key: 'flowExclusive', label: 'Block Độc quyền Elite', group: 'Dòng tiền' },
    { key: 'checkout', label: 'Thanh toán / nâng cấp gói', group: 'Gói cước' },
    { key: 'profile', label: 'Hồ sơ & cài đặt tài khoản', group: 'Cá nhân' }
  ];


  /* Tính năng hệ thống (không phải menu / widget) — lưu trong plan.ent */
  var CAPABILITIES = [
    { key: 'flowRt', label: 'Dòng tiền real-time (WSS)', group: 'Dòng tiền' },
    { key: 'candles', label: 'Biểu đồ nến chi tiết', group: 'Thị trường' },
    { key: 'alerts', label: 'Cảnh báo nâng cao', group: 'Công cụ' },
    { key: 'widgets', label: 'Thêm widget dashboard', group: 'Dashboard' },
    { key: 'search', label: 'Tìm kiếm toàn cục', group: 'Hệ thống' },
    { key: 'watchlist', label: 'Watchlist cá nhân', group: 'Cá nhân' },
    { key: 'newsWrite', label: 'Viết bài Tin tức (tạm đóng)', group: 'Tin tức' },
    { key: 'flowExclusive', label: 'Block Độc quyền Elite', group: 'Dòng tiền' }
  ];

  var LIMITS = [
    { key: 'alerts', label: 'Số cảnh báo tối đa', unit: 'cảnh báo', min: 0, step: 1 },
    { key: 'maxWidgets', label: 'Widget dashboard tối đa', unit: 'widget', min: 0, step: 1 },
    { key: 'watchlistTabs', label: 'Số tab watchlist', unit: 'tab', min: 0, step: 1 },
    { key: 'watchlistItems', label: 'Mã tối đa / tab watchlist', unit: 'mã', min: 0, step: 1 },
    { key: 'apiRate', label: 'API rate', unit: 'req/phút', min: 0, step: 10 },
    { key: 'wssChannels', label: 'Kênh WSS đồng thời', unit: 'kênh', min: 0, step: 1 },
    { key: 'searchResults', label: 'Kết quả tìm kiếm / lần', unit: 'kết quả', min: 0, step: 1 }
  ];

  /* ---------------------------------------------------------------
   * Nguồn Widget = Core 4 tầng · Tầng 4 (PlatformLayersWidgets) — SoT DUY NHẤT.
   * Nếu Tầng 4 chưa nạp (một số trang cũ), fallback Thư viện Widget để không vỡ.
   * Adapter mô phỏng đúng bề mặt hàm WidgetLibraryCatalog nên toàn bộ logic
   * bên dưới (resolveBlockEnabled...) không cần đổi.
   * --------------------------------------------------------------- */
  function l4() {
    var P = global.PlatformLayersWidgets;
    return (P && typeof P.entitlementList === 'function') ? P : null;
  }

  var L4_ADAPTER = null;

  function buildL4Adapter() {
    var P = l4();
    if (!P) return null;
    var list = P.entitlementList().filter(Boolean);
    var byId = {};
    list.forEach(function (m) { byId[m.id] = m; });

    function dep(id) {
      var m = byId[id];
      return m ? { pages: m.pages.slice() } : { pages: ['dashboard'] };
    }

    return {
      __l4: true,
      allWidgetIdsInLibrary: function () { return list.map(function (m) { return m.id; }); },
      widgetDefaults: function (id) {
        var m = byId[id] || {};
        return { title: m.title || id, description: m.description || m.title || id, tier: m.tier || 'free', computeRequired: true, planned: false };
      },
      getPageDeploy: function (id) { return dep(id); },
      canonicalWidgetId: function (id) { return id; },
      groupForWidget: function (id) {
        var m = byId[id];
        return m
          ? { id: m.groupId, title: m.groupTitle, domain: m.domain, category: m.category, widgetIds: [id] }
          : { id: 'GRP-OTHER', title: 'Widget', domain: 'Khác', category: 'unclassified', widgetIds: [id] };
      },
      widgetsForPage: function (pageKey) {
        return list.filter(function (m) { return m.pages.indexOf(pageKey) >= 0; }).map(function (m) { return m.id; });
      },
      groupsForPage: function (pageKey) {
        var map = {};
        var order = [];
        list.forEach(function (m) {
          if (m.pages.indexOf(pageKey) < 0) return;
          if (!map[m.groupId]) {
            map[m.groupId] = { id: m.groupId, title: m.groupTitle, domain: m.domain, category: m.category, widgetIds: [] };
            order.push(m.groupId);
          }
          if (map[m.groupId].widgetIds.indexOf(m.id) < 0) map[m.groupId].widgetIds.push(m.id);
        });
        return order.map(function (gid) { return map[gid]; });
      },
      deployLabel: function (id) {
        var d = dep(id);
        var parts = d.pages.slice();
        return parts.join(' · ');
      }
    };
  }

  /** Nguồn dữ liệu widget cho Phân quyền: ưu tiên Tầng 4, fallback Thư viện Widget. */
  function wl() {
    if (l4()) {
      if (!L4_ADAPTER) L4_ADAPTER = buildL4Adapter();
      if (L4_ADAPTER) return L4_ADAPTER;
    }
    return global.WidgetLibraryCatalog;
  }

  function widgetMinTier(widgetId) {
    if (wl() && wl().widgetDefaults) {
      return wl().widgetDefaults(widgetId).tier || 'free';
    }
    if (global.IfluxWidgetRegistry && IfluxWidgetRegistry.byType) {
      var w = IfluxWidgetRegistry.byType(widgetId);
      if (w && w.tier) return w.tier;
    }
    return 'free';
  }

  function widgetPageKey(widgetId) {
    var dep = wl() && wl().getPageDeploy ? wl().getPageDeploy(widgetId) : null;
    if (dep && dep.pages && dep.pages.length === 1) return dep.pages[0];
    if (dep && dep.pages && dep.pages.indexOf('dashboard') >= 0 && dep.pages.length > 1) {
      var nonDash = dep.pages.filter(function (p) { return p !== 'dashboard'; });
      return nonDash[0] || 'dashboard';
    }
    return dep && dep.pages && dep.pages[0] ? dep.pages[0] : 'dashboard';
  }

  function widgetGroupLabel(widgetId) {
    if (!wl() || !wl().groupForWidget) return 'Widget';
    var grp = wl().groupForWidget(widgetId);
    return (grp.domain || 'Widget') + ' · ' + (grp.title || widgetId);
  }

  /**
   * Build BLOCKS từ Tầng 4 (PlatformLayersWidgets) — SoT duy nhất.
   * Thêm widget ở Tầng 4 → tự xuất hiện trong Phân quyền (sau refreshBlocksCatalog).
   */
  function buildBlocksCatalog() {
    var list = [];
    var ids = wl() && wl().allWidgetIdsInLibrary ? wl().allWidgetIdsInLibrary() : [];
    ids.forEach(function (wid) {
      list.push({
        id: wid,
        label: getWidgetTitle(wid),
        kind: 'widget',
        group: widgetGroupLabel(wid),
        minTier: widgetMinTier(wid),
        page: widgetPageKey(wid),
        library: true
      });
    });
    return list;
  }

  /** Migrates legacy alias WGT-* keys in plan.blocks → canonical library IDs */
  function migratePlanWidgetAliases(plan) {
    if (!plan || !plan.blocks || !wl() || !wl().canonicalWidgetId) return plan;
    Object.keys(plan.blocks).forEach(function (id) {
      if (String(id).indexOf('WGT-') !== 0) return;
      var can = wl().canonicalWidgetId(id);
      if (can === id) return;
      if (plan.blocks[id]) plan.blocks[can] = true;
      delete plan.blocks[id];
    });
    return plan;
  }

  function getWidgetTitle(widgetId) {
    if (wl() && wl().widgetDefaults) {
      var d = wl().widgetDefaults(widgetId);
      if (d && d.title) return d.title;
    }
    if (global.IfluxWidgetRegistry && IfluxWidgetRegistry.byType) {
      var w = IfluxWidgetRegistry.byType(widgetId);
      if (w && w.title) return w.title;
    }
    return widgetId;
  }

  var BLOCKS = buildBlocksCatalog();

  /** Quyền chỉ theo widget (Tầng 4) — bỏ mọi khoá cũ không phải widget (BLK-* block trang cứng). */
  function dropNonWidgetBlocks(plan) {
    if (!plan || !plan.blocks) return plan;
    Object.keys(plan.blocks).forEach(function (id) {
      if (!isWidgetEntitlementId(id)) delete plan.blocks[id];
    });
    return plan;
  }

  function isWidgetEntitlementId(id) {
    return String(id || '').indexOf('WGT-') === 0;
  }

  /** Widget thuộc SoT Phân quyền = có trong Tầng 4. Ngoài danh sách → không áp dụng Permission. */
  function isPermissionScopedWidget(id) {
    id = String(id || '');
    if (!isWidgetEntitlementId(id)) return false;
    var P = l4();
    if (P && typeof P.widgetIds === 'function') {
      return P.widgetIds().indexOf(id) >= 0;
    }
    if (wl() && wl().allWidgetIdsInLibrary) {
      return wl().allWidgetIdsInLibrary().indexOf(id) >= 0;
    }
    return false;
  }

  function resolveBlockEnabled(plan, id) {
    if (!plan || !plan.blocks || !isWidgetEntitlementId(id)) return false;
    /* WGT-* không có trong Tầng 4 (vd Page Composite) → ngoài phạm vi Permission → luôn mở. */
    if (!isPermissionScopedWidget(id)) return true;
    if (plan.blocks[id]) return true;
    if (wl() && wl().canonicalWidgetId) {
      var can = wl().canonicalWidgetId(id);
      if (can !== id && plan.blocks[can]) return true;
    }
    return false;
  }

  var FEATURES = CAPABILITIES;

  function tierRank(tier) {
    return TIER_ORDER[String(tier || '').toLowerCase()] != null
      ? TIER_ORDER[String(tier).toLowerCase()]
      : -1;
  }

  function defaultBlocksForTier(tier) {
    tier = String(tier || 'guest').toLowerCase();
    var out = {};
    BLOCKS.forEach(function (b) {
      if (tier === 'guest') {
        out[b.id] = false;
      } else {
        out[b.id] = tierRank(tier) >= tierRank(b.minTier);
      }
    });
    /* Elite: Widget mới trong thư viện mặc định bật (kể cả chưa có trong BLOCKS catalog). */
    if (tier === 'elite') {
      var ids = [];
      if (wl() && wl().allWidgetIdsInLibrary) ids = wl().allWidgetIdsInLibrary();
      if ((!ids || !ids.length) && global.PlatformLayersWidgets && PlatformLayersWidgets.widgetIds) {
        ids = PlatformLayersWidgets.widgetIds();
      }
      if ((!ids || !ids.length) && global.WidgetRegistryReader && WidgetRegistryReader.widgetIds) {
        ids = WidgetRegistryReader.widgetIds();
      }
      (ids || []).forEach(function (id) {
        if (isWidgetEntitlementId(id)) out[id] = true;
      });
    }
    var plan = { tier: tier, blocks: out };
    dropNonWidgetBlocks(plan);
    return plan.blocks;
  }

  function defaultCapabilitiesForTier(tier) {
    tier = String(tier || 'guest').toLowerCase();
    var all = {};
    CAPABILITIES.forEach(function (c) { all[c.key] = false; });
    if (tier === 'guest') {
      return Object.assign(all, { search: true });
    }
    if (tier === 'free') {
      return Object.assign(all, { search: true, watchlist: true });
    }
    if (tier === 'premium') {
      return Object.assign(all, {
        flowRt: true, candles: true, alerts: true, widgets: true,
        search: true, watchlist: true
      });
    }
    return Object.assign(all, {
      flowRt: true, candles: true, alerts: true, widgets: true,
      search: true, watchlist: true, flowExclusive: true
    });
  }

  function defaultLimitsForTier(tier) {
    tier = String(tier || 'guest').toLowerCase();
    if (tier === 'guest') {
      return { alerts: 0, maxWidgets: 0, watchlistTabs: 0, watchlistItems: 0, apiRate: 30, wssChannels: 0, searchResults: 5 };
    }
    if (tier === 'free') {
      return { alerts: 3, maxWidgets: 3, watchlistTabs: 10, watchlistItems: 100, apiRate: 120, wssChannels: 10, searchResults: 20 };
    }
    if (tier === 'premium') {
      return { alerts: 50, maxWidgets: 99, watchlistTabs: 10, watchlistItems: 100, apiRate: 500, wssChannels: 50, searchResults: 50 };
    }
    return { alerts: 50, maxWidgets: 99, watchlistTabs: 10, watchlistItems: 100, apiRate: 500, wssChannels: 50, searchResults: 50 };
  }

  function defaultActionsForTier(tier) {
    tier = String(tier || 'guest').toLowerCase();
    var out = {};
    ACTIONS.forEach(function (a) {
      out[a.key] = { view: false, add: false, edit: false, delete: false };
    });

    function set(key, ops) {
      if (!out[key]) out[key] = { view: false, add: false, edit: false, delete: false };
      ops.forEach(function (op) { out[key][op] = true; });
    }

    if (tier === 'guest') {
      set('search', ['view']);
      set('newsRead', ['view']);
      return out;
    }
    if (tier === 'free') {
      set('search', ['view']);
      set('watchlist', ['view', 'add', 'edit', 'delete']);
      set('newsRead', ['view']);
      set('newsComment', ['view', 'add']);
      set('profile', ['view', 'edit']);
      set('checkout', ['view']);
      return out;
    }
    if (tier === 'premium') {
      set('search', ['view']);
      set('watchlist', ['view', 'add', 'edit', 'delete']);
      set('alerts', ['view', 'add', 'edit', 'delete']);
      set('dashboardWidgets', ['view', 'add', 'edit', 'delete']);
      set('newsRead', ['view']);
      /* newsWrite: tắt toàn hệ thống — bài chuyên gia giai đoạn sau (Admin). */
      set('newsComment', ['view', 'add', 'edit', 'delete']);
      set('flowRt', ['view']);
      set('candles', ['view']);
      set('profile', ['view', 'edit']);
      set('checkout', ['view']);
      return out;
    }
    ACTIONS.forEach(function (a) {
      if (a.key === 'newsWrite') return;
      set(a.key, ['view', 'add', 'edit', 'delete']);
    });
    return out;
  }

  function getAccessValue(plan, node) {
    plan = plan || {};
    if (node.type === 'group') return false;
    if (node.blockId) return resolveBlockEnabled(plan, node.blockId);
    return false;
  }

  function setAccessValue(plan, node, enabled) {
    if (!plan) plan = {};
    if (!plan.blocks) plan.blocks = {};
    if (node.blockId && node.type !== 'group') {
      plan.blocks[node.blockId] = !!enabled;
      if (isWidgetEntitlementId(node.blockId)) dropNonWidgetBlocks(plan);
    }
    return plan;
  }

  function syncLegacyEntFromActions(plan) {
    var a = plan.actions || {};
    function op(key, operation) {
      return !!(a[key] && a[key][operation || 'view']);
    }
    plan.ent = plan.ent || {};
    plan.ent.search = op('search', 'view');
    plan.ent.watchlist = op('watchlist', 'view');
    plan.ent.alerts = op('alerts', 'view');
    plan.ent.widgets = op('dashboardWidgets', 'add');
    plan.ent.flowRt = op('flowRt', 'view');
    plan.ent.candles = op('candles', 'view');
    plan.ent.newsWrite = op('newsWrite', 'add');
    plan.ent.flowExclusive = op('flowExclusive', 'view');
  }

  function legacyEntToFeatures(ent) {
    ent = ent || {};
    return {
      candles: !!ent.candles,
      flowRt: !!ent.flowRt,
      alerts: !!ent.alerts,
      widgets: !!ent.widgets
    };
  }

  function normalizePlan(plan) {
    if (!plan) return plan;
    plan = JSON.parse(JSON.stringify(plan));
    var tier = plan.tier || plan.id || 'free';

    /* Không còn quyền theo trang: khách xem mọi trang; quyền chỉ ở widget + hành động. */
    delete plan.pages;

    plan.ent = Object.assign(defaultCapabilitiesForTier(tier), plan.ent || {});
    var leg = legacyEntToFeatures(plan.ent);
    plan.ent.candles = plan.ent.candles != null ? plan.ent.candles : leg.candles;
    plan.ent.flowRt = plan.ent.flowRt != null ? plan.ent.flowRt : leg.flowRt;
    plan.ent.alerts = plan.ent.alerts != null ? plan.ent.alerts : leg.alerts;
    plan.ent.widgets = plan.ent.widgets != null ? plan.ent.widgets : leg.widgets;

    plan.blocks = Object.assign(defaultBlocksForTier(tier), plan.blocks || {});
    migratePlanWidgetAliases(plan);
    plan.actions = Object.assign(defaultActionsForTier(tier), plan.actions || {});
    plan.limits = Object.assign(defaultLimitsForTier(tier), plan.limits || {});

    dropNonWidgetBlocks(plan);
    syncLegacyEntFromActions(plan);

    /* SoT tạm thời: không cho User Web viết bài (mọi tier / override). */
    plan.ent = plan.ent || {};
    plan.ent.newsWrite = false;
    plan.actions = plan.actions || {};
    plan.actions.newsWrite = { view: false, add: false, edit: false, delete: false };

    if (plan.limits.maxWidgets == null && plan.ent.widgets) {
      plan.limits.maxWidgets = tier === 'free' ? 3 : 99;
    }
    return plan;
  }

  function getBlockById(id) {
    return BLOCKS.find(function (b) { return b.id === id; });
  }

  /** Tên hiển thị — ưu tiên Thư viện Widget / registry */
  function getBlockLabel(id) {
    if (isWidgetEntitlementId(id)) return getWidgetTitle(id);
    var b = getBlockById(id);
    if (b) return b.label;
    return id;
  }

  /** Nhóm hiển thị giống ma trận Phân quyền sử dụng */
  global.EntitlementCatalog = {
    TIERS: ['guest', 'free', 'premium', 'elite'],
    TIER_ORDER: TIER_ORDER,
    TIER_LABELS: TIER_LABELS,
    OPERATIONS: OPERATIONS,
    ACTIONS: ACTIONS,
    CAPABILITIES: CAPABILITIES,
    FEATURES: FEATURES,
    BLOCKS: BLOCKS,
    LIMITS: LIMITS,
    getBlockById: getBlockById,
    getBlockLabel: getBlockLabel,
    tierRank: tierRank,
    defaultBlocksForTier: defaultBlocksForTier,
    defaultActionsForTier: defaultActionsForTier,
    defaultFeaturesForTier: defaultCapabilitiesForTier,
    defaultCapabilitiesForTier: defaultCapabilitiesForTier,
    defaultLimitsForTier: defaultLimitsForTier,
    getAccessValue: getAccessValue,
    setAccessValue: setAccessValue,
    dropNonWidgetBlocks: dropNonWidgetBlocks,
    resolveBlockEnabled: resolveBlockEnabled,
    isPermissionScopedWidget: isPermissionScopedWidget,
    isWidgetEntitlementId: isWidgetEntitlementId,
    buildBlocksCatalog: buildBlocksCatalog,
    refreshBlocksCatalog: function () {
      L4_ADAPTER = null; /* rebuild adapter — Tầng 4 có thể nạp sau file này */
      BLOCKS = buildBlocksCatalog();
      /* Giữ export EntitlementCatalog.BLOCKS đồng bộ (EntitlementMatrixUI / plans-store đọc Cat.BLOCKS) */
      if (global.EntitlementCatalog) global.EntitlementCatalog.BLOCKS = BLOCKS;
      return BLOCKS;
    },
    migratePlanWidgetAliases: migratePlanWidgetAliases,
    normalizePlan: normalizePlan
  };
})(window);
