'use strict';

/**
 * ABH E6 — Plans Runtime Artifact builder (Publish pipeline ONLY).
 * ONE Rule Provenance: Permission → Publish → GET /api/plans/runtime → Runtime consume.
 * NOT loaded by User Web Runtime.
 */

const TIER_ORDER = { guest: 0, free: 1, premium: 2, elite: 3 };

const PAGES = [
  { key: 'market', guestDefault: true, guestNever: false },
  { key: 'flow', guestDefault: true, guestNever: false },
  { key: 'news', guestDefault: true, guestNever: false },
  { key: 'pricing', guestDefault: true, guestNever: false },
  { key: 'faq', guestDefault: true, guestNever: false },
  { key: 'loyalty', guestDefault: true, guestNever: false },
  { key: 'dashboard', guestDefault: false, guestNever: true }
];

const STATIC_PAGE_BLOCKS = [
  { id: 'BLK-COM-NEWS', minTier: 'guest', page: 'news' },
  { id: 'BLK-LOY-INTRO', minTier: 'free', page: 'loyalty' },
  { id: 'BLK-LOY-AFFILIATE', minTier: 'free', page: 'loyalty' },
  { id: 'BLK-FAQ-LIST', minTier: 'guest', page: 'faq' },
  { id: 'BLK-FAQ-SUPPORT', minTier: 'guest', page: 'faq' }
];

const BLOCK_ALIASES = {
  'BLK-MKT-HEAT-STORY': 'BLK-MKT-HEAT-CHUDE',
  'BLK-FLW-NET-STORY': 'BLK-FLW-NET-CHUDE'
};

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

function pageForWidget(id) {
  if (/^WGT-FLW|^WGT-FLOW/.test(id)) return ['flow'];
  if (/^WGT-COM/.test(id)) return ['news'];
  if (/^WGT-WAT/.test(id)) return ['dashboard'];
  return ['market', 'dashboard'];
}

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
    widgetDefaults: (id) => ({ title: id, tier: 'free' }),
    widgetDeploy: (id) => ({ pages: pageForWidget(id), blocks: [] }),
    getPageDeploy: (id) => ({ pages: pageForWidget(id), blocks: [] }),
    widgetsForPage: (pageKey) => ids.filter((id) => pageForWidget(id).indexOf(pageKey) >= 0)
  };
}

function tierRank(tier) {
  const t = String(tier || '').toLowerCase();
  return TIER_ORDER[t] != null ? TIER_ORDER[t] : -1;
}

function isWidgetEntitlementId(id) {
  return String(id || '').indexOf('WGT-') === 0;
}

function buildBlocksCatalog(wl) {
  const list = [];
  wl.widgetIds().forEach((wid) => {
    list.push({
      id: wid,
      kind: 'widget',
      minTier: (wl.widgetDefaults(wid).tier) || 'free',
      page: wl.widgetDeploy(wid).pages[0] || 'dashboard'
    });
  });
  STATIC_PAGE_BLOCKS.forEach((b) => list.push(Object.assign({ kind: 'page' }, b)));
  return list;
}

function syncPageBlocksFromWidgets(plan, wl) {
  if (!plan) return plan;
  if (!plan.blocks) plan.blocks = {};
  const blkNeeded = {};
  STATIC_PAGE_BLOCKS.forEach((b) => { blkNeeded[b.id] = !!plan.blocks[b.id]; });
  Object.keys(plan.blocks).forEach((key) => {
    if (key.indexOf('WGT-') !== 0 || !plan.blocks[key]) return;
    const dep = wl.getPageDeploy(key);
    (dep && dep.blocks ? dep.blocks : []).forEach((blk) => { blkNeeded[blk] = true; });
  });
  Object.keys(blkNeeded).forEach((blk) => { plan.blocks[blk] = blkNeeded[blk]; });
  return plan;
}

function defaultPagesForTier(tier) {
  tier = String(tier || 'guest').toLowerCase();
  const out = {};
  PAGES.forEach((p) => {
    if (tier === 'guest') out[p.key] = p.guestNever ? false : !!p.guestDefault;
    else if (tier === 'free') out[p.key] = p.key !== 'loyalty';
    else out[p.key] = true;
  });
  return out;
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
  syncPageBlocksFromWidgets({ tier, blocks: out }, wl);
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

function applyPageBlockDefaults(plan, wl) {
  if (!plan || !plan.pages || !plan.blocks) return plan;
  const tier = String(plan.tier || plan.id || 'guest').toLowerCase();
  const blocks = buildBlocksCatalog(wl);
  PAGES.forEach((page) => {
    if (!plan.pages[page.key]) return;
    const pageWidgets = wl.widgetsForPage(page.key);
    if (!pageWidgets.length) return;
    if (pageWidgets.some((wid) => !!plan.blocks[wid])) return;
    pageWidgets.forEach((wid) => {
      const b = blocks.find((x) => x.id === wid);
      if (b && tierRank(tier) >= tierRank(b.minTier)) plan.blocks[wid] = true;
    });
  });
  syncPageBlocksFromWidgets(plan, wl);
  return plan;
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

  plan.pages = Object.assign(defaultPagesForTier(tier), plan.pages || {});
  if (tier === 'guest') plan.pages.dashboard = false;

  plan.ent = Object.assign(defaultCapabilitiesForTier(tier), plan.ent || {});
  const leg = legacyEntToFeatures(plan.ent);
  plan.ent.candles = plan.ent.candles != null ? plan.ent.candles : leg.candles;
  plan.ent.flowRt = plan.ent.flowRt != null ? plan.ent.flowRt : leg.flowRt;
  plan.ent.alerts = plan.ent.alerts != null ? plan.ent.alerts : leg.alerts;
  plan.ent.widgets = plan.ent.widgets != null ? plan.ent.widgets : leg.widgets;

  plan.blocks = Object.assign(defaultBlocksForTier(tier, wl), plan.blocks || {});
  migratePlanWidgetAliases(plan, wl);
  plan.actions = Object.assign(defaultActionsForTier(tier), plan.actions || {});
  plan.limits = Object.assign(defaultLimitsForTier(tier), plan.limits || {});

  applyPageBlockDefaults(plan, wl);
  syncPageBlocksFromWidgets(plan, wl);
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
    if (k === 'blocks' || k === 'pages' || k === 'limits' || k === 'ent' || k === 'actions') {
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
