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
    m('user-data-sync', 'js', ASSET + 'iflux-user-data-sync.js?v=c4488ad741', 'IfluxUserDataSync'),
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js?v=4fb82084de', 'IfluxProfileUsersStore'),
    m('apexcharts', 'js', 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js', 'ApexCharts'),
    m('profile-links', 'js', ASSET + 'profile-links.js?v=31f14c2ed9', 'IfluxProfileLinks'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=349c1e1a74', 'IfluxMarketQuotes'),
    m('watchlist-store', 'store', ASSET + 'watchlist-store.js?v=f604e76323', 'IfluxWatchlistStore'),
    m('heart-action', 'js', '/design_system/04_components/29_follow/follow.js?v=r20261002a', 'IfluxHeartAction'),
    m('stock-store', 'store', ASSET + 'stock-store.js?v=4dc55126ff', 'IfluxStockStore'),
    m('community-store', 'store', ASSET + 'news-store.js?v=84bb9b875c', 'IfluxNewsStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-news-api-bridge.js?v=70487a5208', 'IfluxNewsApiBridge'),
    m('watchlist-ui', 'js', ASSET + 'watchlist-ui.js?v=7c1f5a3c0d', 'IfluxWatchlistUI'),
    m('community-ui', 'js', ASSET + 'news-ui.js?v=8bd1108a4b', 'IfluxNewsUI'),
    m('comments-cta', 'js', ASSET + 'comments-cta.js?v=5537ba40da', 'IfluxCommentsCta'),
    m('community-daily-feed', 'js', ASSET + 'news-daily-feed.js?v=407fadedc0', 'IfluxDailyFeed'),
    m('entity-detail-center', 'js', ASSET + 'entity-detail-center.js?v=57d506954b', 'IfluxEntityDetailCenter'),
    m('stock-page', 'js', ASSET + 'stock-page.js?v=df7184eb95', 'IfluxStockPage'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=a6f64093c8', 'IfluxPageLayoutEngine'),
    m('stock-css', 'css', ASSET + 'stock.css?v=eab675e4cc', null)
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
