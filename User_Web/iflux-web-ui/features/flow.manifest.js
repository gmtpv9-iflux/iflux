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
  /* Identity = IfluxMarketMaster (SOL-IDENTITY / WP-0) — không qua mock producer cũ. */
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
    m('stock-mentions', 'js', ASSET + 'stock-mentions.js?v=63b1553d75', 'IfluxStockMentions'),
    m('widget-registry', 'js', ASSET + 'widget-registry.js?v=d4967c9d0c', 'IfluxWidgetRegistry'),
    m('page-layout-engine', 'js', ASSET + 'runtime/page-layout-engine.js?v=a6f64093c8', 'IfluxPageLayoutEngine'),
    m('flow-css', 'css', ASSET + 'flow.css?v=12a9aea56c', null)
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
