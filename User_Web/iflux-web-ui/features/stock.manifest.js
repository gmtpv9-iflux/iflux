/**
 * Feature Manifest — PF-stock (Phase C §4.1.1)
 */
var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4 = 'phase4Pub20260716b';

function m(id, kind, src, globalName) {
  return {
    id: id,
    kind: kind,
    src: src,
    global: globalName || null,
    businessOwner: 'feature',
    runtimeOwner: 'feature'
  };
}

var manifest = {
  id: 'PF-stock',
  pageKey: 'stock',
  version: '1.0.0',
  pattern: 'A',
  class: ['Core', 'Entity', 'Authenticated'],
  /* Prod shell: Master via IfluxMarketMaster — không phụ thuộc mock authority */
  requiresShell: [
    'IfluxBlockTemplates',
    'IfluxApiClient',
    'IfluxAuth',
    'IfluxGuestShell',
    'IfluxWatchlistTaxonomy',
    'IfluxMarketMaster',
    'IfluxSeoUrl'
  ],
  requiresDefinition: true,
  requiresAPI: true,
  modules: [
    m('iflux-admin-ui', 'js', ADMIN + 'iflux-admin-ui.js', null),
    m('user-data-sync', 'js', ASSET + 'iflux-user-data-sync.js', 'IfluxUserDataSync'),
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js', 'IfluxProfileUsersStore'),
    m('apexcharts', 'js', 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js', 'ApexCharts'),
    m('profile-links', 'js', ASSET + 'profile-links.js', 'IfluxProfileLinks'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=mockRmWp2_20260809', 'IfluxMarketQuotes'),
    m('watchlist-store', 'store', ASSET + 'watchlist-store.js?v=followFound20260724', 'IfluxWatchlistStore'),
    m('heart-action', 'js', ADMIN + 'foundation/heart-action.js?v=followFound20260724', 'IfluxHeartAction'),
    m('stock-store', 'store', ASSET + 'stock-store.js?v=ix45Purge20260724', 'IfluxStockStore'),
    m('community-store', 'store', ASSET + 'community-store.js?v=feedDto20260724', 'IfluxCommunityStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-community-api-bridge.js?v=feedDto20260724', 'IfluxCommunityApiBridge'),
    m('watchlist-ui', 'js', ASSET + 'watchlist-ui.js?v=followFound20260724', 'IfluxWatchlistUI'),
    m('community-ui', 'js', ASSET + 'community-ui.js?v=mockRmWp1_20260809', 'IfluxCommunityUI'),
    m('comments-cta', 'js', ASSET + 'comments-cta.js?v=ix45Purge20260724', 'IfluxCommentsCta'),
    m('entity-timeline-feed', 'js', ASSET + 'entity-timeline-feed.js', 'IfluxEntityTimelineFeed'),
    m('community-daily-feed', 'js', ASSET + 'community-daily-feed.js?v=entFeed20260724', 'IfluxDailyFeed'),
    m('market-liquidity', 'js', ASSET + 'market-liquidity.js?v=mockRmWp4_20260809', 'IfluxMarketLiquidity'),
    m('entity-detail-center', 'js', ASSET + 'entity-detail-center.js?v=mockRmWp2_20260809', 'IfluxEntityDetailCenter'),
    m('stock-page', 'js', ASSET + 'stock-page.js?v=sidebarVR04_20260811', 'IfluxStockPage'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=' + P4, 'IfluxPageLayoutEngine'),
    m('stock-css', 'css', ASSET + 'stock.css?v=sidebarVR04_20260811', null)
  ],
  lazyChildren: [],
  lifecycle: {
    boot: 'boot',
    init: 'init',
    ready: 'ready',
    dispose: 'dispose'
  }
};

export default manifest;
