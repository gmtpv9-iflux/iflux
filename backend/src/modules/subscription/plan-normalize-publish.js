'use strict';

/**
 * ABH E6 — Plans Runtime Artifact builder (Publish pipeline ONLY).
 * ONE Rule Provenance: Permission → Publish → GET /api/plans/runtime → Runtime consume.
 * NOT loaded by User Web Runtime.
 */

const TIER_ORDER = { guest: 0, free: 1, premium: 2, elite: 3 };

const BASE = {
  guest: {
    id: 'guest', name: 'Vãng lai', tier: 'guest', sort: 0,
    desc: 'Quyền mặc định cho người chưa đăng nhập · website công khai',
    trial: 0, priceMonth: 0, priceYear: 0, priceLifetime: 0, lifetimeEnabled: false,
    purchasable: false, status: 'published', ent: {}, blocks: {}, limits: {}, actions: {},
    guestPlan: true, builtin: true
  },
  free: {
    id: 'free', name: 'Miễn phí', tier: 'free', sort: 1,
    desc: 'Gói mặc định · không thu phí', trial: 0,
    priceMonth: 0, priceYear: 0, priceLifetime: 0, lifetimeEnabled: false,
    purchasable: false, status: 'published', ent: {}, blocks: {}, limits: {}, actions: {},
    builtin: true
  },
  premium: {
    id: 'premium', name: 'Premium', tier: 'premium', sort: 2,
    desc: 'Dòng tiền real-time, biểu đồ nến ngành, alert nâng cao, widget không giới hạn.',
    trial: 7, priceMonth: 199000, priceYear: 1990000, priceLifetime: 4990000,
    lifetimeEnabled: true, purchasable: true, status: 'published', badge: 'popular',
    ent: {}, blocks: {}, limits: {}, actions: {}, builtin: true
  },
  elite: {
    id: 'elite', name: 'Elite', tier: 'elite', sort: 3,
    desc: 'Toàn bộ Premium + ưu tiên hỗ trợ.',
    trial: 14, priceMonth: 399000, priceYear: 3990000, priceLifetime: 9990000,
    lifetimeEnabled: true, purchasable: true, status: 'published', badge: 'best',
    ent: {}, blocks: {}, limits: {}, actions: {}, builtin: true
  }
};

const TIERS = ['guest', 'free', 'premium', 'elite'];

function collectWidgetIds(store) {
  const set = new Set();
  const addFromBlocks = (blocks) => {
    if (!blocks || typeof blocks !== 'object') return;
    Object.keys(blocks).forEach((k) => { if (k.indexOf('WGT-') === 0) set.add(k); });
  };
  Object.keys(store.overrides || {}).forEach((tier) => {
    addFromBlocks(store.overrides[tier] && store.overrides[tier].blocks);
  });
  (store.custom || []).forEach((p) => addFromBlocks(p.blocks));
  return Array.from(set).sort();
}

function createWidgetIndex(store) {
  const ids = collectWidgetIds(store);
  return {
    widgetIds: () => ids.slice(),
    allWidgetIdsInLibrary: () => ids.slice(),
    canonicalWidgetId: (id) => id,
    widgetDefaults: (id) => ({ title: id, tier: 'free' })
  };
}

function tierRank(tier) {
  const t = String(tier || '').toLowerCase();
  return TIER_ORDER[t] != null ? TIER_ORDER[t] : -1;
}

function isWidgetEntitlementId(id) {
  return String(id || '').indexOf('WGT-') === 0;
}

/* Quyền chỉ theo widget (Tầng 4, Phân quyền sử dụng) — không còn block trang cứng BLK-*. */
function buildBlocksCatalog(wl) {
  return wl.widgetIds().map((wid) => ({
    id: wid,
    kind: 'widget',
    minTier: (wl.widgetDefaults(wid).tier) || 'free'
  }));
}

function defaultBlocksForTier(tier, wl) {
  tier = String(tier || 'guest').toLowerCase();
  const blocks = buildBlocksCatalog(wl);
  const out = {};
  blocks.forEach((b) => {
    if (tier === 'guest') out[b.id] = false;
    else out[b.id] = tierRank(tier) >= tierRank(b.minTier);
  });
  if (tier === 'elite') {
    wl.widgetIds().forEach((id) => { if (isWidgetEntitlementId(id)) out[id] = true; });
  }
  return out;
}

function defaultCapabilitiesForTier(tier) {
  tier = String(tier || 'guest').toLowerCase();
  const all = { flowRt: false, candles: false, alerts: false, widgets: false,
    search: false, watchlist: false, newsWrite: false, flowExclusive: false };
  if (tier === 'guest') return Object.assign({}, all, { search: true });
  if (tier === 'free') return Object.assign({}, all, { search: true, watchlist: true });
  if (tier === 'premium') {
    return Object.assign({}, all, {
      flowRt: true, candles: true, alerts: true, widgets: true, search: true, watchlist: true
    });
  }
  return Object.assign({}, all, {
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
  return { alerts: 50, maxWidgets: 99, watchlistTabs: 10, watchlistItems: 100, apiRate: 500, wssChannels: 50, searchResults: 50 };
}

function defaultActionsForTier(tier) {
  tier = String(tier || 'guest').toLowerCase();
  const keys = ['search', 'watchlist', 'alerts', 'dashboardWidgets', 'newsRead',
    'newsWrite', 'newsComment', 'flowRt', 'candles', 'flowExclusive', 'checkout', 'profile'];
  const out = {};
  keys.forEach((k) => { out[k] = { view: false, add: false, edit: false, delete: false }; });
  const set = (key, ops) => { ops.forEach((op) => { out[key][op] = true; }); };
  if (tier === 'guest') { set('search', ['view']); set('newsRead', ['view']); return out; }
  if (tier === 'free') {
    set('search', ['view']); set('watchlist', ['view', 'add', 'edit', 'delete']);
    set('newsRead', ['view']); set('newsComment', ['view', 'add']);
    set('profile', ['view', 'edit']); set('checkout', ['view']); return out;
  }
  if (tier === 'premium') {
    set('search', ['view']); set('watchlist', ['view', 'add', 'edit', 'delete']);
    set('alerts', ['view', 'add', 'edit', 'delete']); set('dashboardWidgets', ['view', 'add', 'edit', 'delete']);
    set('newsRead', ['view']); set('newsComment', ['view', 'add', 'edit', 'delete']);
    set('flowRt', ['view']); set('candles', ['view']); set('profile', ['view', 'edit']); set('checkout', ['view']);
    return out;
  }
  keys.forEach((k) => { if (k !== 'newsWrite') set(k, ['view', 'add', 'edit', 'delete']); });
  return out;
}

function legacyEntToFeatures(ent) {
  ent = ent || {};
  return { candles: !!ent.candles, flowRt: !!ent.flowRt, alerts: !!ent.alerts, widgets: !!ent.widgets };
}

function syncLegacyEntFromActions(plan) {
  const a = plan.actions || {};
  const op = (key, operation) => !!(a[key] && a[key][operation || 'view']);
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

function migratePlanWidgetAliases(plan, wl) {
  if (!plan || !plan.blocks) return plan;
  Object.keys(plan.blocks).forEach((id) => {
    if (String(id).indexOf('WGT-') !== 0) return;
    const can = wl.canonicalWidgetId(id);
    if (can === id) return;
    if (plan.blocks[id]) plan.blocks[can] = true;
    delete plan.blocks[id];
  });
  return plan;
}

function normalizePlan(plan, wl) {
  if (!plan) return plan;
  plan = JSON.parse(JSON.stringify(plan));
  const tier = plan.tier || plan.id || 'free';

  /* Không còn quyền theo trang: khách xem mọi trang; quyền chỉ ở widget (Phân quyền sử dụng) + hành động. */
  delete plan.pages;

  plan.ent = Object.assign(defaultCapabilitiesForTier(tier), plan.ent || {});
  const leg = legacyEntToFeatures(plan.ent);
  plan.ent.candles = plan.ent.candles != null ? plan.ent.candles : leg.candles;
  plan.ent.flowRt = plan.ent.flowRt != null ? plan.ent.flowRt : leg.flowRt;
  plan.ent.alerts = plan.ent.alerts != null ? plan.ent.alerts : leg.alerts;
  plan.ent.widgets = plan.ent.widgets != null ? plan.ent.widgets : leg.widgets;

  plan.blocks = Object.assign(defaultBlocksForTier(tier, wl), plan.blocks || {});
  /* Dữ liệu cũ: bỏ mọi khoá không phải widget (BLK-* block trang cứng). */
  Object.keys(plan.blocks).forEach((id) => { if (!isWidgetEntitlementId(id)) delete plan.blocks[id]; });
  migratePlanWidgetAliases(plan, wl);
  plan.actions = Object.assign(defaultActionsForTier(tier), plan.actions || {});
  plan.limits = Object.assign(defaultLimitsForTier(tier), plan.limits || {});

  syncLegacyEntFromActions(plan);

  plan.ent.newsWrite = false;
  plan.actions.newsWrite = { view: false, add: false, edit: false, delete: false };

  if (plan.limits.maxWidgets == null && plan.ent.widgets) {
    plan.limits.maxWidgets = tier === 'free' ? 3 : 99;
  }
  return plan;
}

function mergePlan(base, override) {
  if (!override) return JSON.parse(JSON.stringify(base));
  const p = JSON.parse(JSON.stringify(base));
  Object.keys(override).forEach((k) => {
    if (k === 'blocks' || k === 'limits' || k === 'ent' || k === 'actions') {
      p[k] = Object.assign({}, p[k] || {}, override[k] || {});
    } else {
      p[k] = override[k];
    }
  });
  return p;
}

/** Build published Plans Runtime Artifact from raw store (overrides + custom). */
function buildPublishedArtifact(store) {
  store = store || { version: 1, updatedAt: 0, overrides: {}, custom: [] };
  const wl = createWidgetIndex(store);
  const plans = TIERS.map((k) => normalizePlan(mergePlan(BASE[k], store.overrides[k]), wl));
  (store.custom || []).forEach((p) => {
    plans.push(normalizePlan(JSON.parse(JSON.stringify(p)), wl));
  });
  plans.sort((a, b) => (a.sort || 99) - (b.sort || 99));
  return {
    version: store.version || 1,
    updatedAt: store.updatedAt || Date.now(),
    overrides: store.overrides || {},
    custom: store.custom || [],
    plans
  };
}

module.exports = {
  buildPublishedArtifact,
  normalizePlan,
  BASE,
  TIERS
};
