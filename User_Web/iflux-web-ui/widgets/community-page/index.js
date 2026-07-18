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
    ASSET + 'community-page.js?v=phase3Com20260716'
  ]
];

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-COM-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, 'community');
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('community');

  if (!tree || !tree.length) {
    if (window.console && console.warn) {
      console.warn('[WGT-COM-PAGE] Host Tree rỗng — chưa có placements Published');
    }
    return;
  }

  await mountPublishedWidgets(tree, { logPrefix: '[WGT-COM-PAGE]' });
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
  function onPlans() {
    applyCommunity(el);
    mountFromHostTree(el);
  }
  function onRemount() {
    mountFromHostTree(el);
  }
  applyCommunity(el);
  await mountFromHostTree(el);
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
