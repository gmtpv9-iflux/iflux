'use strict';

/**
 * Map legacy runtime (chỉ dùng lúc Publish/Seed — KHÔNG dùng ở User Web runtime).
 * Nguồn tạm: widget-module-catalog.js cho đến khi Admin publish từ Template đầy đủ.
 */
const LEGACY_WIDGET_RUNTIME = {
  'WGT-MKT-001': { renderer: 'market-overview', module: '/User_Web/iflux-web-ui/widgets/market-overview/index.js' },
  'WGT-MKT-002': { renderer: 'market-breadth', module: '/User_Web/iflux-web-ui/widgets/market-breadth/index.js' },
  'WGT-MKT-004': { renderer: 'market-heatmap', module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js' },
  'WGT-MKT-005': { renderer: 'market-heatmap', module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js' },
  'WGT-MKT-006': { renderer: 'market-heatmap', module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js' },
  'WGT-PRF-001': { renderer: 'profile-card', module: '/User_Web/iflux-web-ui/widgets/profile-card/index.js' },
  'WGT-PRF-002': { renderer: 'plan-promo', module: '/User_Web/iflux-web-ui/widgets/plan-promo/index.js' },
  'WGT-WAT-001': { renderer: 'watchlist', module: '/User_Web/iflux-web-ui/widgets/watchlist/index.js' },
  'WGT-HOME-DASH': { renderer: 'home-dashboard', module: '/User_Web/iflux-web-ui/widgets/home-dashboard/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-SUBJ-STOCK': { renderer: 'flow-subj-net', module: '/User_Web/iflux-web-ui/widgets/flow-subj-net/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-SUBJ-SECTOR': { renderer: 'flow-subj-net', module: '/User_Web/iflux-web-ui/widgets/flow-subj-net/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-STAT_STOCK': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-STAT_SECTOR': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-STAT_HST': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-STAT_STORY': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-EX_TM_IN': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-EX_TM_SECTOR_IN': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-EX_TM_HST_IN': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-FLW-EX_TM_STORY_IN': { renderer: 'flow-score-board', module: '/User_Web/iflux-web-ui/widgets/flow-score-board/index.js?v=bpPhaseD20260716' },
  'WGT-NEWS-001': { renderer: 'community-stock-heat', module: '/User_Web/iflux-web-ui/widgets/news-stock-heat/index.js?v=comStockHeat20260722' },
  'WGT-NEWS-TOPIC-TOP': { renderer: 'community-story-top', module: '/User_Web/iflux-web-ui/widgets/news-story-top/index.js?v=stocksOnlyH20260722' },
  'WGT-NEWS-002': { renderer: 'community-active', module: '/User_Web/iflux-web-ui/widgets/news-active/index.js?v=bpPhaseD20260716' }
};

const LEGACY_WIDGET_DEPS = {
  'flow-score-board': [{ kind: 'script', global: 'ApexCharts', src: 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js' }],
  'watchlist': [
    { kind: 'script', global: 'IfluxWatchlistStore', src: '/User_Web/iflux-web-ui/watchlist-store.js' }
  ]
};

/** CSS mặc định theo renderer khi composition không có css[] (seed Flow). */
const LEGACY_RENDERER_CSS = {
  'flow-subj-net': [
    '/User_Web/iflux-web-ui/flow.css',
    '/User_Web/iflux-web-ui/block-templates.css'
  ],
  'flow-score-board': [
    '/User_Web/iflux-web-ui/flow.css',
    '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
  ],
  'profile-card': [
    '/User_Web/iflux-web-ui/hub.css',
    '/User_Web/iflux-web-ui/profile.css'
  ],
  'plan-promo': [
    '/User_Web/iflux-web-ui/hub.css',
    '/User_Web/iflux-web-ui/profile.css'
  ],
  'market-overview': [
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/market.css'
  ],
  'market-breadth': [
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/market.css'
  ],
  'market-heatmap': [
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/market.css',
    '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
  ],
  'community-list': [
    '/User_Web/iflux-web-ui/news.css',
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/watchlist.css'
  ],
  'community-story-top': [
    '/User_Web/iflux-web-ui/news.css',
    '/User_Web/iflux-web-ui/block-templates.css'
  ],
  'community-active': [
    '/User_Web/iflux-web-ui/news.css'
  ],
  'community-stock-heat': [
    '/User_Web/iflux-web-ui/news.css',
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/watchlist.css'
  ],
  'diverging-bars': [
    '/User_Web/iflux-web-ui/block-templates.css'
  ],
  'trend-line': [
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
  ],
  'watchlist': [
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/watchlist.css'
  ],
  'rank-perf': [
    '/User_Web/iflux-web-ui/block-templates.css',
    '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
  ],
  'flow-summary': [
    '/User_Web/iflux-web-ui/flow.css',
    '/User_Web/iflux-web-ui/block-templates.css'
  ],
  'flow-rank-duo': [
    '/User_Web/iflux-web-ui/flow.css',
    '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
  ],
  'flow-rank-signal': [
    '/User_Web/iflux-web-ui/flow.css',
    '/User_Web/iflux-web-ui/market-components.css?v=bpPhaseD20260716'
  ],
  'zone-position': [
    '/User_Web/iflux-web-ui/block-templates.css'
  ],
  'sr-history': [
    '/User_Web/iflux-web-ui/block-templates.css'
  ]
};

function legacyRuntimeFor(widgetId) {
  return LEGACY_WIDGET_RUNTIME[widgetId] || null;
}

function legacyDepsFor(renderer) {
  return LEGACY_WIDGET_DEPS[renderer] ? LEGACY_WIDGET_DEPS[renderer].slice() : [];
}

function legacyCssFor(renderer) {
  return LEGACY_RENDERER_CSS[renderer] ? LEGACY_RENDERER_CSS[renderer].slice() : [];
}

module.exports = {
  legacyRuntimeFor,
  legacyDepsFor,
  legacyCssFor,
  LEGACY_WIDGET_RUNTIME
};
