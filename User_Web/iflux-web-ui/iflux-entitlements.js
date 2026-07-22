/* iFlux User Web — resolve tier entitlements (guest · free · premium · elite) */
(function (global) {
  'use strict';

  var FALLBACK_GUEST = {
    tier: 'guest',
    pages: { market: true, flow: true, community: true, pricing: true, faq: true, loyalty: true, dashboard: false },
    ent: { search: true },
    blocks: {},
    limits: { alerts: 0, maxWidgets: 0, watchlistTabs: 0, watchlistItems: 0, apiRate: 30, wssChannels: 0, searchResults: 5 }
  };

  function resolveTier(user) {
    if (user === undefined) {
      user = global.IfluxAuth && IfluxAuth.getUser();
    }
    if (!user) return 'guest';
    return String(user.tier || 'free').toLowerCase();
  }

  function getPlan(tier) {
    tier = tier != null ? String(tier).toLowerCase() : resolveTier();
    if (global.PlansStore && PlansStore.getPlan) {
      var p = PlansStore.getPlan(tier);
      if (p) {
        if (global.EntitlementCatalog && EntitlementCatalog.normalizePlan) {
          return EntitlementCatalog.normalizePlan(p);
        }
        return p;
      }
    }
    if (tier === 'guest') {
      if (global.EntitlementCatalog && EntitlementCatalog.normalizePlan) {
        return EntitlementCatalog.normalizePlan(FALLBACK_GUEST);
      }
      return FALLBACK_GUEST;
    }
    return null;
  }

  function currentPlan() {
    return getPlan(resolveTier());
  }

  function hasPage(pageKey) {
    var plan = currentPlan();
    if (!plan || !plan.pages) return false;
    return !!plan.pages[pageKey];
  }

  function hasAnyBlockOnPage(pageKey) {
    if (global.EntitlementCatalog && EntitlementCatalog.blocksForPage) {
      return EntitlementCatalog.blocksForPage(pageKey).length > 0;
    }
    if (global.WidgetLibraryCatalog && WidgetLibraryCatalog.widgetsForPage) {
      return WidgetLibraryCatalog.widgetsForPage(pageKey).length > 0;
    }
    return false;
  }

  function canAccessPage(pageKey) {
    pageKey = String(pageKey || '').toLowerCase();
    /* Chi tiết bài viết Tin tức = cùng quyền trang Cộng đồng (công khai với vãng lai). */
    if (pageKey === 'communitypost') pageKey = 'community';
    if (pageKey === 'dashboard' && isGuest()) return false;
    if (hasPage(pageKey)) return true;
    return hasAnyBlockOnPage(pageKey);
  }

  function visibleMenus() {
    if (!global.EntitlementCatalog) return [];
    return EntitlementCatalog.PAGES.filter(function (p) {
      if (!p.menu) return false;
      if (p.guestNever && isGuest()) return false;
      return canAccessPage(p.key);
    });
  }

  function hasFeature(key) {
    var plan = currentPlan();
    return !!(plan && plan.ent && plan.ent[key]);
  }

  function hasBlock(id) {
    var plan = currentPlan();
    if (!plan || !plan.blocks) return false;
    if (global.EntitlementCatalog && EntitlementCatalog.resolveBlockEnabled) {
      return EntitlementCatalog.resolveBlockEnabled(plan, id);
    }
    return !!plan.blocks[id];
  }

  function canShowBlock(id) {
    return hasBlock(id);
  }

  function getLimit(key, fallback) {
    var plan = currentPlan();
    if (!plan || !plan.limits || plan.limits[key] == null) {
      return fallback != null ? fallback : 0;
    }
    return plan.limits[key];
  }

  function canAccessWidget(meta) {
    if (!meta) return false;
    var type = meta.type || meta.widget_type;
    /* Ngoài Tầng 4 → không thuộc Phân quyền sử dụng → luôn cho xem. */
    if (type && global.IfluxBlockGate && IfluxBlockGate.isPermissionScopedWidget) {
      if (!IfluxBlockGate.isPermissionScopedWidget(type)) return true;
    } else if (type && global.EntitlementCatalog && EntitlementCatalog.isPermissionScopedWidget) {
      if (!EntitlementCatalog.isPermissionScopedWidget(type)) return true;
    }
    var plan = currentPlan();

    /* Phân quyền sử dụng (Admin matrix) là SoT cao hơn meta.tier */
    if (type && plan && plan.blocks && Object.prototype.hasOwnProperty.call(plan.blocks, type)) {
      return hasBlock(type);
    }
    if (type && hasBlock(type)) return true;

    if (isGuest()) return false;
    var tier = resolveTier();
    if (meta.tier === 'premium') {
      return tier === 'premium' || tier === 'elite' || tier === 'partner' || tier === 'admin';
    }
    if (meta.tier === 'elite') {
      return tier === 'elite' || tier === 'partner' || tier === 'admin';
    }
    return true;
  }

  function enabledBlocks(page) {
    if (!global.EntitlementCatalog) {
      var plan = currentPlan();
      var blocks = (plan && plan.blocks) || {};
      return Object.keys(blocks).filter(function (id) { return blocks[id]; });
    }
    return EntitlementCatalog.BLOCKS.filter(function (b) {
      if (page && b.page !== page) return false;
      return hasBlock(b.id);
    }).map(function (b) { return b.id; });
  }

  function isGuest() {
    return resolveTier() === 'guest';
  }

  function isPremium() {
    var t = resolveTier();
    return t === 'premium' || t === 'elite' || t === 'partner' || t === 'admin';
  }

  function isElite() {
    var t = resolveTier();
    return t === 'elite' || t === 'partner' || t === 'admin';
  }

  global.IfluxEntitlements = {
    resolveTier: resolveTier,
    getPlan: getPlan,
    currentPlan: currentPlan,
    hasPage: hasPage,
    canAccessPage: canAccessPage,
    visibleMenus: visibleMenus,
    hasFeature: hasFeature,
    hasBlock: hasBlock,
    canShowBlock: canShowBlock,
    getLimit: getLimit,
    canAccessWidget: canAccessWidget,
    enabledBlocks: enabledBlocks,
    isGuest: isGuest,
    isPremium: isPremium,
    isElite: isElite
  };
})(window);
