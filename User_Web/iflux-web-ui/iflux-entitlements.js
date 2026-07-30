/* iFlux User Web — resolve tier entitlements (guest · free · premium · elite)
 * ABH E6 — consume published Plans Runtime Artifact only; no client normalize. */
(function (global) {
  'use strict';

  var PAGES = [
    { key: 'market', label: 'Thị trường', menu: true, icon: 'ti-chart-candle', guestNever: false },
    { key: 'flow', label: 'Độc quyền · Dòng tiền', menu: true, icon: 'ti-cash', guestNever: false },
    { key: 'community', label: 'Cộng đồng', menu: true, icon: 'ti-users', guestNever: false },
    { key: 'pricing', label: 'Gói cước', menu: true, icon: 'ti-crown', guestNever: false },
    { key: 'faq', label: 'FAQ', menu: true, icon: 'ti-help-circle', guestNever: false },
    { key: 'loyalty', label: 'Membership', menu: true, icon: 'ti-gift', guestNever: false },
    { key: 'dashboard', label: 'Nhà của tôi', menu: true, icon: 'ti-home', guestNever: true }
  ];

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
    if (global.PlansRuntimeReader && PlansRuntimeReader.getPlan) {
      var pr = PlansRuntimeReader.getPlan(tier);
      if (pr) return pr;
    }
    if (tier === 'guest') return FALLBACK_GUEST;
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
    var L4 = global.L4RuntimeReader;
    if (L4 && L4.widgetIdsForEntitlementDomain) {
      return L4.widgetIdsForEntitlementDomain(pageKey).length > 0;
    }
    return false;
  }

  function canAccessPage(pageKey) {
    pageKey = String(pageKey || '').toLowerCase();
    if (pageKey === 'communitypost') pageKey = 'community';
    if (pageKey === 'comments') pageKey = 'community';
    if (pageKey === 'dashboard' && isGuest()) return false;
    if (hasPage(pageKey)) return true;
    return hasAnyBlockOnPage(pageKey);
  }

  function visibleMenus() {
    return PAGES.filter(function (p) {
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
    if (type && global.IfluxBlockGate && IfluxBlockGate.isPermissionScopedWidget) {
      if (!IfluxBlockGate.isPermissionScopedWidget(type)) return true;
    }
    var plan = currentPlan();

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
    var plan = currentPlan();
    var bmap = (plan && plan.blocks) || {};
    return Object.keys(bmap).filter(function (id) {
      if (!bmap[id]) return false;
      if (!page) return true;
      var L4 = global.L4RuntimeReader;
      if (L4 && L4.entitlementMeta) {
        var meta = L4.entitlementMeta(id);
        if (meta && meta.pages && meta.pages.indexOf(page) >= 0) return true;
      }
      return false;
    });
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
