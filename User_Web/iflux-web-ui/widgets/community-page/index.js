/**
 * WGT-COM-PAGE — Composite Cộng đồng
 *
 * Phase 4: Layout Engine generic + mount(display.module).
 * Không HOST_SEL / không createElement host / không catalog.
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';

export const meta = { id: 'WGT-COM-PAGE', title: 'Cộng đồng' };

var CORE_TIERS = [
  [
    ASSET + 'watchlist-taxonomy.js',
    ASSET + 'block-templates.js',
    ASSET + 'profile-users-store.js',
    ADMIN + 'iflux-market-registry-store.js'
  ],
  [
    ASSET + 'seo-url.js',
    ASSET + 'profile-links.js',
    ADMIN + 'iflux-market-seed-data.js',
    ADMIN + 'iflux-market-ecosystem-seeds.js'
  ],
  [
    ASSET + 'mock-market.js',
    ASSET + 'watchlist-store.js'
  ],
  [
    ASSET + 'watchlist-ui.js',
    ASSET + 'community-geo-ai.js',
    ASSET + 'runtime/page-layout-engine.js?v=' + P4_VER
  ],
  [
    ASSET + 'community-store.js'
  ],
  [
    ASSET + 'community-ui.js'
  ],
  [
    ASSET + 'community-daily-feed.js',
    ASSET + 'community-page.js?v=hostChrome20260720'
  ]
];

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-COM-PAGE] thiếu Layout Engine');
    }
    if (window.IfluxCommunityPage && IfluxCommunityPage.syncEmptyHostChrome) {
      IfluxCommunityPage.syncEmptyHostChrome(root);
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, 'community');
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('community');

  if (tree && tree.length) {
    await mountPublishedWidgets(tree, { logPrefix: '[WGT-COM-PAGE]' });
  } else if (window.console && console.warn) {
    console.warn('[WGT-COM-PAGE] Host Tree rỗng — chưa có placements Published');
  }

  if (window.IfluxCommunityPage && IfluxCommunityPage.syncEmptyHostChrome) {
    IfluxCommunityPage.syncEmptyHostChrome(root);
  }
}

function isCollectionIndexPath() {
  var path = String((typeof location !== 'undefined' && location.pathname) || '').replace(/\/+$/, '') || '/';
  return path === '/cong-dong/chu-de' ||
    path === '/cong-dong/tac-gia' ||
    path === '/cong-dong/danh-muc';
}

function applyCommunity(root) {
  if (window.IfluxCommunityPage && IfluxCommunityPage.init) IfluxCommunityPage.init();
  if (window.IfluxInsightShare && IfluxInsightShare.patchAll) IfluxInsightShare.patchAll(root || document);
}

export async function mount(el) {
  el.innerHTML = '<div data-ifx-community-feed></div>';
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  var indexOnly = isCollectionIndexPath();
  function onPlans() {
    applyCommunity(el);
    if (!indexOnly) mountFromHostTree(el);
  }
  function onRemount() {
    if (!indexOnly) mountFromHostTree(el);
  }
  applyCommunity(el);
  if (!indexOnly) await mountFromHostTree(el);
  if (indexOnly) {
    /* page-runtime có thể ghi đè document.title sau mount */
    setTimeout(function () {
      var path = String(location.pathname || '').replace(/\/+$/, '');
      var titles = {
        '/cong-dong/chu-de': 'Danh sách chủ đề · iFlux',
        '/cong-dong/tac-gia': 'Danh sách tác giả · iFlux',
        '/cong-dong/danh-muc': 'Danh sách danh mục · iFlux'
      };
      if (titles[path]) document.title = titles[path];
      document.querySelectorAll('.ifx-rt-page-head').forEach(function (node) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });
    }, 0);
  }
  document.addEventListener('iflux-plans-updated', onPlans);
  document.addEventListener('iflux-community-remount-widgets', onRemount);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      document.removeEventListener('iflux-community-remount-widgets', onRemount);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
