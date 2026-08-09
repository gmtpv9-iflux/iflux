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
  id: 'PF-community',
  pageKey: 'community',
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
    m('community-store', 'store', ASSET + 'community-store.js?v=b4Href20260727', 'IfluxCommunityStore'),
    m('community-api-bridge', 'js', ASSET + 'iflux-community-api-bridge.js?v=calFeed20260808', 'IfluxCommunityApiBridge'),
    m('market-quotes', 'js', ASSET + 'iflux-market-quotes.js?v=mockRmWp1_20260809', 'IfluxMarketQuotes'),
    m('community-ui', 'js', ASSET + 'community-ui.js?v=mockRmWp1_20260809', 'IfluxCommunityUI'),
    m('community-daily-feed', 'js', ASSET + 'community-daily-feed.js?v=mockRmWp1_20260809', 'IfluxDailyFeed'),
    m('community-page', 'js', ASSET + 'community-page.js?v=calFeed20260808', 'IfluxCommunityPage'),
    m('community-css', 'css', ASSET + 'community.css?v=bodyFill20260809', null)
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
