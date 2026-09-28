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
    m('user-data-sync', 'js', ASSET + 'iflux-user-data-sync.js?v=r20260928n', 'IfluxUserDataSync'),
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js', 'IfluxProfileUsersStore'),
    m('apexcharts', 'js', 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js', 'ApexCharts'),
    m('profile-links', 'js', ASSET + 'profile-links.js', 'IfluxProfileLinks'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=r20260928n', 'IfluxMarketQuotes'),
    m('watchlist-store', 'store', ASSET + 'watchlist-store.js?v=r20260928n', 'IfluxWatchlistStore'),
    m('heart-action', 'js', ADMIN + 'foundation/heart-action.js?v=followFound20260724', 'IfluxHeartAction'),
    m('stock-store', 'store', ASSET + 'stock-store.js?v=r20260928n', 'IfluxStockStore'),
    m('community-store', 'store', ASSET + 'news-store.js?v=r20260928n', 'IfluxNewsStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-news-api-bridge.js?v=r20260928n', 'IfluxNewsApiBridge'),
    m('watchlist-ui', 'js', ASSET + 'watchlist-ui.js?v=r20260928q', 'IfluxWatchlistUI'),
    m('community-ui', 'js', ASSET + 'news-ui.js?v=r20260928n', 'IfluxNewsUI'),
    m('comments-cta', 'js', ASSET + 'comments-cta.js?v=ix45Purge20260724', 'IfluxCommentsCta'),
    m('community-daily-feed', 'js', ASSET + 'news-daily-feed.js?v=r20260928n', 'IfluxDailyFeed'),
    m('entity-detail-center', 'js', ASSET + 'entity-detail-center.js?v=r20260928n', 'IfluxEntityDetailCenter'),
    m('stock-page', 'js', ASSET + 'stock-page.js?v=r20260928n', 'IfluxStockPage'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=r20260928n', 'IfluxPageLayoutEngine'),
    m('stock-css', 'css', ASSET + 'stock.css?v=appHeader20260928', null)
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
