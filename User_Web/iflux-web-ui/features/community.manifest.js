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
    'IfluxMockMarket',
    'IfluxSeoUrl',
    'IfluxMarketSeedData',
    'IfluxMarketEcosystemSeeds',
    'IfluxMarketRegistryStore'
  ],
  requiresDefinition: true,
  requiresAPI: true,
  modules: [
    m('profile-users-store', 'store', ASSET + 'profile-users-store.js', 'IfluxProfileUsersStore'),
    m('profile-links', 'js', ASSET + 'profile-links.js', 'IfluxProfileLinks'),
    m('watchlist-store', 'store', ASSET + 'watchlist-store.js', 'IfluxWatchlistStore'),
    m('watchlist-ui', 'js', ASSET + 'watchlist-ui.js', 'IfluxWatchlistUI'),
    m('community-geo-ai', 'js', ASSET + 'community-geo-ai.js', 'IfluxCommunityGeoAi'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=' + P4, 'IfluxPageLayoutEngine'),
    m('community-store', 'store', ASSET + 'community-store.js', 'IfluxCommunityStore'),
    m('community-ui', 'js', ASSET + 'community-ui.js', 'IfluxCommunityUI'),
    m('community-daily-feed', 'js', ASSET + 'community-daily-feed.js', 'IfluxDailyFeed'),
    m('community-page', 'js', ASSET + 'community-page.js?v=entStaticOpen20260721', 'IfluxCommunityPage'),
    m('community-css', 'css', ASSET + 'community.css', null)
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
