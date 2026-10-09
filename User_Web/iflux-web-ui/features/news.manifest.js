/**
 * Feature Manifest — PF-community (Phase C §4.1.1)
 * Runtime Owner modules = Feature. Shell/Platform → requiresShell (assert).
 */
var ASSET = '/User_Web/iflux-web-ui/';
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
  id: 'PF-news',
  pageKey: 'news',
  version: '1.0.0',
  pattern: 'A',
  class: ['Core'],
  requiresShell: [
    'IfluxBlockTemplates',
    'IfluxApiClient',
    'IfluxAuth',
    'IfluxGuestShell',
    'IfluxWatchlistTaxonomy',
    'IfluxSeoUrl'
    /* Market Master / seed / registry / ecosystem: không boot danh sách tin (MARKET_CORE).
       Search tự ensureDeps khi mở ô tìm. */
  ],
  requiresDefinition: true,
  requiresAPI: true,
  modules: [
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js?v=4fb82084de', 'IfluxProfileUsersStore'),
    m('profile-links', 'js', ASSET + 'profile-links.js?v=31f14c2ed9', 'IfluxProfileLinks'),
    /* Task5: Heart = Foundation (click / widget mount). Không boot watchlist-ui trên feed. */
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=a6f64093c8', 'IfluxPageLayoutEngine'),
    m('community-store', 'store', ASSET + 'news-store.js?v=41bb32b4bc', 'IfluxNewsStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-news-api-bridge.js?v=70487a5208', 'IfluxNewsApiBridge'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=349c1e1a74', 'IfluxMarketQuotes'),
    m('community-ui', 'js', ASSET + 'news-ui.js?v=0654c01137', 'IfluxNewsUI'),
    m('community-daily-feed', 'js', ASSET + 'news-daily-feed.js?v=407fadedc0', 'IfluxDailyFeed'),
    m('community-page', 'js', ASSET + 'news-page.js?v=fb329301b1', 'IfluxNewsPage'),
    m('community-css', 'css', ASSET + 'news.css?v=f0b8282b62', null)
  ],
  lazyChildren: [
    'WGT-COM-001',
    'WGT-COM-CHUDE-TOP',
    'WGT-MKT-006',
    'WGT-COM-002'
  ],
  lifecycle: {
    boot: 'boot',
    init: 'init',
    ready: 'ready',
    dispose: 'dispose'
  }
};

export default manifest;
