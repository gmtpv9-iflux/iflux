/**
 * iFlux Runtime — phụ thuộc JS của Dashboard cá nhân (Trang chủ), theo renderAs.
 * Widget đặt qua Widget Placement không dùng file này — hiển thị theo Template (mount-published-widgets.js).
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
  'WGT-MKT-001': [dashDep('IfluxCommunityMarketOverview', 'news-market-overview.js')],
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
    dashDep('IfluxNewsStore', 'news-store.js'),
    dashDep('IfluxWatchlistStore', 'watchlist-store.js?v=followFound20260724'),
    { global: 'IfluxHeartAction', src: '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724' },
    dashDep('IfluxCommunityTrending', 'news-trending.js?v=mockRmWp1_20260809')
  ],
  'WGT-COM-ACTIVE': [
    dashDep('IfluxNewsStore', 'news-store.js'),
    dashDep('IfluxCommunityActiveMembers', 'news-active-members.js')
  ],
  'WGT-COM-EXPERTS': [
    dashDep('IfluxNewsStore', 'news-store.js'),
    dashDep('IfluxCommunityFeaturedExperts', 'news-featured-experts.js')
  ],
  'WGT-COM-TOPWL': [
    dashDep('IfluxWatchlistStore', 'watchlist-store.js?v=followFound20260724'),
    { global: 'IfluxHeartAction', src: '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724' },
    dashDep('IfluxWatchlistUI', 'watchlist-ui.js?v=followFound20260724'),
    dashDep('IfluxCommunityTopWatchlist', 'news-top-watchlist.js?v=followFound20260724')
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
