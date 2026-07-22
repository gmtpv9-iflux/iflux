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
  requiresShell: [
    'IfluxBlockTemplates',
    'IfluxApiClient',
    'IfluxAuth',
    'IfluxGuestShell',
    'IfluxWatchlistTaxonomy',
    'IfluxMockMarket',
    'IfluxSeoUrl',
    'IfluxMarketSeedData',
    'IfluxMarketEcosystemSeeds',
    'IfluxMarketRegistryStore'
  ],
  requiresDefinition: true,
  requiresAPI: true,
  modules: [
    m('iflux-admin-ui', 'js', ADMIN + 'iflux-admin-ui.js', null),
    m('user-data-sync', 'js', ASSET + 'iflux-user-data-sync.js', 'IfluxUserDataSync'),
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js', 'IfluxProfileUsersStore'),
    m('apexcharts', 'js', 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js', 'ApexCharts'),
    m('profile-links', 'js', ASSET + 'profile-links.js', 'IfluxProfileLinks'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js', 'IfluxMarketQuotes'),
    m('watchlist-store', 'store', ASSET + 'watchlist-store.js?v=phaseBExit20260721b', 'IfluxWatchlistStore'),
    m('stock-store', 'store', ASSET + 'stock-store.js', 'IfluxStockStore'),
    m('community-store', 'store', ASSET + 'community-store.js', 'IfluxCommunityStore'),
    m('watchlist-ui', 'js', ASSET + 'watchlist-ui.js?v=phaseBExit20260721b', 'IfluxWatchlistUI'),
    m('community-ui', 'js', ASSET + 'community-ui.js', 'IfluxCommunityUI'),
    m('stock-mentions', 'js', ASSET + 'stock-mentions.js', 'IfluxStockMentions'),
    m('stock-comments-ui', 'js', ASSET + 'stock-comments-ui.js', 'IfluxStockCommentsUI'),
    m('stock-scroll-feed', 'js', ASSET + 'stock-scroll-feed.js', 'IfluxStockScrollFeed'),
    m('entity-timeline-feed', 'js', ASSET + 'entity-timeline-feed.js', 'IfluxEntityTimelineFeed'),
    m('community-daily-feed', 'js', ASSET + 'community-daily-feed.js', 'IfluxDailyFeed'),
    m('market-liquidity', 'js', ASSET + 'market-liquidity.js', 'IfluxMarketLiquidity'),
    m('entity-detail-center', 'js', ASSET + 'entity-detail-center.js', 'IfluxEntityDetailCenter'),
    m('stock-page', 'js', ASSET + 'stock-page.js?v=phaseB220260721a', 'IfluxStockPage'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=' + P4, 'IfluxPageLayoutEngine'),
    m('stock-css', 'css', ASSET + 'stock.css', null)
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
