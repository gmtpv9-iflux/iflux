/**
 * Feature Manifest — PF-flow (Phase C §4.1.1)
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
  id: 'PF-flow',
  pageKey: 'flow',
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
    m('user-data-sync', 'js', ASSET + 'iflux-user-data-sync.js', 'IfluxUserDataSync'),
    m('iflux-admin-ui', 'js', ADMIN + 'iflux-admin-ui.js', null),
    m('stock-mentions', 'js', ASSET + 'stock-mentions.js', 'IfluxStockMentions'),
    m('widget-registry', 'js', ASSET + 'widget-registry.js', 'IfluxWidgetRegistry'),
    m('flow-page', 'js', ASSET + 'flow-page.js?v=bpPhaseD20260716', 'IfluxFlowPage'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=' + P4, 'IfluxPageLayoutEngine'),
    m('flow-css', 'css', ASSET + 'flow.css', null)
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
