/**
 * WGT-COM-POST-PAGE — Composite Bài viết cộng đồng (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-COM-POST-PAGE', title: 'Bài viết cộng đồng' };

var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js', ADMIN + 'iflux-market-registry-store.js'],
  [ADMIN + 'iflux-market-seed-data.js', ADMIN + 'iflux-market-ecosystem-seeds.js'],
  [ASSET + 'mock-market.js', ASSET + 'watchlist-taxonomy.js', ASSET + 'stock-mentions.js', ASSET + 'seo-url.js'],
  [ASSET + 'community-geo-ai.js', ASSET + 'community-store.js', ASSET + 'profile-users-store.js', ASSET + 'profile-links.js', ASSET + 'block-templates.js'],
  [ASSET + 'watchlist-store.js', ASSET + 'watchlist-ui.js', ASSET + 'community-ui.js', ASSET + 'community-daily-feed.js', ASSET + 'community-post-page.js']
];

var LAYOUT_HTML = `<div data-ifx-community-story></div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxCommunityPostPage) IfluxCommunityPostPage.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
