/**
 * iFlux Runtime — Widget Module Catalog (ESM, metadata-only)
 * Map widgetId → lazyModule + css. KHÔNG import implementation.
 */

export const WIDGET_RUNTIME_MODULES = {
  'WGT-MKT-001': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/market-overview/index.js',
    css: ['/User_Web/iflux-web-ui/block-templates.css', '/User_Web/iflux-web-ui/market.css']
  },
  'WGT-MKT-002': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/market-breadth/index.js',
    css: ['/User_Web/iflux-web-ui/block-templates.css', '/User_Web/iflux-web-ui/market.css']
  },
  'WGT-MKT-004': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
    css: [
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/market.css',
      '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
    ]
  },
  'WGT-MKT-005': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
    css: [
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/market.css',
      '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
    ]
  },
  'WGT-MKT-006': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
    css: [
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/market.css',
      '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
    ]
  },
  'WGT-PRF-001': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/profile-card/index.js',
    css: ['/User_Web/iflux-web-ui/hub.css', '/User_Web/iflux-web-ui/profile.css']
  },
  'WGT-PRF-002': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/plan-promo/index.js',
    css: ['/User_Web/iflux-web-ui/hub.css', '/User_Web/iflux-web-ui/profile.css']
  },
  'WGT-WAT-001': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/watchlist/index.js?v=phaseCW120260721',
    css: [
      '/User_Web/iflux-web-ui/widget-shell.css',
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/block-templates.css'
    ]
  },
  'WGT-HOME-DASH': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/home-dashboard/index.js?v=phaseCW120260721',
    css: [
      '/User_Web/iflux-web-ui/widget-shell.css',
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/feature-suggestions.css'
    ]
  },
  'WGT-FLW-SUBJ-STOCK': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-subj-net/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/block-templates.css'],
    flowPanel: null
  },
  'WGT-FLW-SUBJ-SECTOR': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-subj-net/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/block-templates.css'],
    flowPanel: null
  },
  'WGT-FLW-STAT_STOCK': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'basic'
  },
  'WGT-FLW-STAT_SECTOR': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'advanced'
  },
  'WGT-FLW-STAT_HST': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'advanced'
  },
  'WGT-FLW-STAT_STORY': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'advanced'
  },
  'WGT-FLW-EX_TM_IN': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'exclusive'
  },
  'WGT-FLW-EX_TM_SECTOR_IN': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'exclusive'
  },
  'WGT-FLW-EX_TM_HST_IN': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'exclusive'
  },
  'WGT-FLW-EX_TM_STORY_IN': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/flow.css', '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'],
    flowPanel: 'exclusive'
  },
  'WGT-COM-001': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/community-stock-heat/index.js?v=phaseCW120260721',
    css: [
      '/User_Web/iflux-web-ui/community.css?v=bodyFill20260809',
      '/User_Web/iflux-web-ui/block-templates.css?v=feedCard20260723',
      '/User_Web/iflux-web-ui/watchlist.css'
    ]
  },
  'WGT-COM-CHUDE-TOP': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js?v=phaseCW120260721',
    css: ['/User_Web/iflux-web-ui/community.css?v=bodyFill20260809', '/User_Web/iflux-web-ui/block-templates.css?v=feedCard20260723']
  },
  'WGT-COM-002': {
    lazyModule: '/User_Web/iflux-web-ui/widgets/community-active/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/community.css?v=bodyFill20260809']
  }
};

export function resolveWidgetRuntime(widgetId) {
  return WIDGET_RUNTIME_MODULES[widgetId] || null;
}

/*
 * Dashboard (Nhà của tôi) — Widget renderer-based (IIFE global) resources.
 * Manifest sở hữu JS/dependency của từng widget dashboard (keyed theo renderAs
 * trong IfluxWidgetRegistry). Dashboard KHÔNG hardcode map này — đọc qua
 * resolveDashboardWidgetDeps(). Áp Blueprint: Widget JS đi qua Manifest.
 */
var DASH_ASSET = '/User_Web/iflux-web-ui/';
function dashDep(g, s) { return { global: g, src: DASH_ASSET + s }; }

export const WIDGET_DASHBOARD_DEPS = {
  'WGT-WAT-001': [
    dashDep('IfluxWatchlistStore', 'watchlist-store.js?v=followFound20260724'),
    dashDep('IfluxWatchlistTaxonomy', 'watchlist-taxonomy.js'),
    { global: 'IfluxHeartAction', src: '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724' },
    dashDep('IfluxWatchlistUI', 'watchlist-ui.js?v=followFound20260724'),
    dashDep('IfluxWatchlistBlock', 'watchlist-block.js?v=followFound20260724')
  ],
  'WGT-MKT-001': [dashDep('IfluxCommunityMarketOverview', 'community-market-overview.js')],
  'WGT-MKT-002': [dashDep('IfluxBreadthBlock', 'breadth-block.js?v=mockRmWp4_20260809')],
  'WGT-MKT-HEAT': [dashDep('IfluxMarketHeatmap', 'market-heatmap.js?v=mockRmWp4_20260809')],
  'WGT-MKT-LIQ': [dashDep('IfluxMarketLiquidity', 'market-liquidity.js?v=mockRmWp4_20260809')],
  'WGT-FLW-MKT-SIDE': [
    dashDep('IfluxFlowNetTop', 'flow-net-top.js'),
    dashDep('IfluxFlowMarketSidebar', 'flow-market-sidebar.js')
  ],
  'WGT-FLW-NETTOP': [dashDep('IfluxFlowNetTop', 'flow-net-top.js')],
  'WGT-FLW-SCORE': [
    { global: 'ApexCharts', src: 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js' },
    dashDep('IfluxFlowScoreTopMock', 'flow-score-top-mock.js'),
    dashDep('IfluxFlowScoreTop', 'flow-score-top.js')
  ],
  'WGT-COM-TREND': [
    dashDep('IfluxStockStore', 'stock-store.js'),
    dashDep('IfluxCommunityStore', 'community-store.js'),
    dashDep('IfluxWatchlistStore', 'watchlist-store.js?v=followFound20260724'),
    { global: 'IfluxHeartAction', src: '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724' },
    dashDep('IfluxCommunityTrending', 'community-trending.js?v=mockRmWp1_20260809')
  ],
  'WGT-COM-ACTIVE': [
    dashDep('IfluxCommunityStore', 'community-store.js'),
    dashDep('IfluxCommunityActiveMembers', 'community-active-members.js')
  ],
  'WGT-COM-EXPERTS': [
    dashDep('IfluxCommunityStore', 'community-store.js'),
    dashDep('IfluxCommunityFeaturedExperts', 'community-featured-experts.js')
  ],
  'WGT-COM-TOPWL': [
    dashDep('IfluxWatchlistStore', 'watchlist-store.js?v=followFound20260724'),
    { global: 'IfluxHeartAction', src: '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724' },
    dashDep('IfluxWatchlistUI', 'watchlist-ui.js?v=followFound20260724'),
    dashDep('IfluxCommunityTopWatchlist', 'community-top-watchlist.js?v=followFound20260724')
  ]
};

/* Hook chạy sau khi nạp dep (vd seed watchlist từ demo). */
export const WIDGET_DASHBOARD_AFTER_LOAD = {
  'WGT-WAT-001': function () {
    try {
      if (window.IfluxWatchlistStore && window.IfluxWatchlistStore.ensureSeedFromDemo) {
        window.IfluxWatchlistStore.ensureSeedFromDemo();
      }
    } catch (e) { /* ignore */ }
  }
};

/** Resolve JS deps + afterLoad cho 1 widget dashboard (theo renderAs). */
export function resolveDashboardWidgetDeps(key) {
  var deps = WIDGET_DASHBOARD_DEPS[key];
  if (!deps || !deps.length) return null;
  return { deps: deps, afterLoad: WIDGET_DASHBOARD_AFTER_LOAD[key] || null };
}

/** Bổ sung lazyModule/css nếu slot từ API composition thiếu. */
export function enrichSlot(slot) {
  if (!slot || !slot.id) return slot;
  var rt = resolveWidgetRuntime(slot.id);
  if (!rt) return slot;
  var out = Object.assign({}, slot);
  if (!out.lazyModule) out.lazyModule = rt.lazyModule;
  if (!out.css || !out.css.length) out.css = rt.css.slice();
  if (slot.id === 'WGT-MKT-004' && !(out.config && out.config.source)) {
    out.config = Object.assign({}, out.config || {}, { source: 'sector' });
  }
  if (slot.id === 'WGT-MKT-005' && !(out.config && out.config.source)) {
    out.config = Object.assign({}, out.config || {}, { source: 'family' });
  }
  if (slot.id === 'WGT-MKT-006' && !(out.config && out.config.source)) {
    out.config = Object.assign({}, out.config || {}, { source: 'chu-de' });
  }
  if (slot.id === 'WGT-FLW-SUBJ-STOCK' && !(out.config && out.config.scope)) {
    out.config = Object.assign({}, out.config || {}, { scope: 'stock' });
  }
  if (slot.id === 'WGT-FLW-SUBJ-SECTOR' && !(out.config && out.config.scope)) {
    out.config = Object.assign({}, out.config || {}, { scope: 'sector' });
  }
  if (!out.flowPanel && rt.flowPanel) out.flowPanel = rt.flowPanel;
  return out;
}
