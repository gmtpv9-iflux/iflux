/**
 * WGT-STOCK-PAGE — Composite chi tiết cổ phiếu
 * Page Feature: header/OHLC/tabs → Layout Engine mount placements vào Host sidebar + trading.
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';
var PUBLISH_KEY = 'stock-detail';

export const meta = { id: 'WGT-STOCK-PAGE', title: 'Chi tiết cổ phiếu' };

var CORE_TIERS = [
  [
    ADMIN + 'iflux-admin-ui.js',
    ASSET + 'iflux-user-data-sync.js',
    ADMIN + 'iflux-market-registry-store.js',
    ASSET + 'watchlist-taxonomy.js',
    ASSET + 'block-templates.js',
    ASSET + 'profile-users-store.js',
    'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'
  ],
  [
    ADMIN + 'iflux-market-seed-data.js',
    ADMIN + 'iflux-market-ecosystem-seeds.js',
    ASSET + 'seo-url.js',
    ASSET + 'profile-links.js'
  ],
  [
    ASSET + 'mock-market.js',
    ASSET + 'iflux-market-quotes.js',
    ASSET + 'watchlist-store.js',
    ASSET + 'stock-store.js',
    ASSET + 'community-store.js'
  ],
  [
    ASSET + 'watchlist-ui.js',
    ASSET + 'community-ui.js',
    ASSET + 'stock-mentions.js',
    ASSET + 'stock-comments-ui.js',
    ASSET + 'stock-scroll-feed.js',
    ASSET + 'entity-timeline-feed.js',
    ASSET + 'community-daily-feed.js',
    ASSET + 'market-liquidity.js'
  ],
  [
    ASSET + 'entity-detail-center.js',
    ASSET + 'stock-page.js',
    ASSET + 'runtime/page-layout-engine.js?v=' + P4_VER
  ]
];

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-STOCK-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, PUBLISH_KEY);
  if (!tree || !tree.length) {
    if (window.console && console.warn) {
      console.warn('[WGT-STOCK-PAGE] Host Tree rỗng — chưa có placements Published');
    }
    return;
  }
  await mountPublishedWidgets(tree, { logPrefix: '[WGT-STOCK-PAGE]' });
}

export async function mount(el) {
  el.innerHTML = '<div data-ifx-stock-page></div>';
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxAuth && !IfluxAuth.requireAuth()) return { unmount: function () { if (el) el.innerHTML = ''; } };
  if (window.IfluxStockPage) IfluxStockPage.init();
  function onRemount() {
    mountFromHostTree(el);
  }
  function onPlans() {
    mountFromHostTree(el);
  }
  await mountFromHostTree(el);
  document.addEventListener('iflux-knowledge-remount-widgets', onRemount);
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-knowledge-remount-widgets', onRemount);
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
