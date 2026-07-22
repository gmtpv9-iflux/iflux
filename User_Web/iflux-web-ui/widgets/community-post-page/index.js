/**
 * WGT-COM-POST-PAGE — Composite Bài viết cộng đồng (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-COM-POST-PAGE', title: 'Bài viết cộng đồng' };

/* W4: registry/seeds/mock/taxonomy/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js'],
  [ASSET + 'stock-mentions.js'],
  [ASSET + 'community-geo-ai.js', ASSET + 'community-store.js', ASSET + 'profile-users-store.js', ASSET + 'profile-links.js'],
  [ASSET + 'watchlist-store.js', ASSET + 'watchlist-ui.js', ASSET + 'community-ui.js?v=phaseCW120260721c', ASSET + 'community-daily-feed.js', ASSET + 'community-post-page.js']
];

var LAYOUT_HTML = `<div data-ifx-community-story></div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
if (window.IfluxCommunityPostPage) IfluxCommunityPostPage.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
