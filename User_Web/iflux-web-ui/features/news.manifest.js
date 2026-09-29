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
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js', 'IfluxProfileUsersStore'),
    m('profile-links', 'js', ASSET + 'profile-links.js', 'IfluxProfileLinks'),
    /* Task5: Heart = Foundation (click / widget mount). Không boot watchlist-ui trên feed. */
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=r20260928n', 'IfluxPageLayoutEngine'),
    m('community-store', 'store', ASSET + 'news-store.js?v=r20260928r', 'IfluxNewsStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-news-api-bridge.js?v=r20260928n', 'IfluxNewsApiBridge'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=r20260928n', 'IfluxMarketQuotes'),
    m('community-ui', 'js', ASSET + 'news-ui.js?v=r20260929a', 'IfluxNewsUI'),
    m('community-daily-feed', 'js', ASSET + 'news-daily-feed.js?v=r20260928r', 'IfluxDailyFeed'),
    m('community-page', 'js', ASSET + 'news-page.js?v=r20260928r', 'IfluxNewsPage'),
    m('community-css', 'css', ASSET + 'news.css?v=r20260928n', null)
  ],
  lazyChildren: [
    'WGT-NEWS-001',
    'WGT-NEWS-TOPIC-TOP',
    'WGT-MKT-006',
    'WGT-NEWS-002'
  ],
  lifecycle: {
    boot: 'boot',
    init: 'init',
    ready: 'ready',
    dispose: 'dispose'
  }
};

export default manifest;
