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
    'IfluxMarketMaster',
    'IfluxSeoUrl'
    /* Seed/registry/ecosystem: không boot Community (MARKET_CORE).
       Search tự ensureDeps khi mở ô tìm. */
  ],
  requiresDefinition: true,
  requiresAPI: true,
  modules: [
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js', 'IfluxProfileUsersStore'),
    m('profile-links', 'js', ASSET + 'profile-links.js', 'IfluxProfileLinks'),
    /* Task5: Heart = Foundation (click / widget mount). Không boot watchlist-ui trên feed. */
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=' + P4, 'IfluxPageLayoutEngine'),
    m('community-store', 'store', ASSET + 'news-store.js?v=tickerNoDup20260810', 'IfluxNewsStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-news-api-bridge.js?v=calFeed20260808', 'IfluxNewsApiBridge'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=mockRmWp1_20260809', 'IfluxMarketQuotes'),
    m('community-ui', 'js', ASSET + 'news-ui.js?v=mockRmWp1_20260809', 'IfluxNewsUI'),
    m('community-daily-feed', 'js', ASSET + 'news-daily-feed.js?v=mockRmWp1_20260809', 'IfluxDailyFeed'),
    m('community-page', 'js', ASSET + 'news-page.js?v=stickyRefactor20260811', 'IfluxNewsPage'),
    m('community-css', 'css', ASSET + 'news.css?v=stickyRefactor20260811', null)
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
