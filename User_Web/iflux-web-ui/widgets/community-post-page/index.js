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
  [
    ASSET + 'community-store.js?v=metaSotB20260725',
    ASSET + 'iflux-community-api-bridge.js?v=feedDto20260724',
    ASSET + 'profile-users-store.js',
    ASSET + 'profile-links.js'
  ],
  [
    ASSET + 'watchlist-store.js?v=followFound20260724',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724',
    ASSET + 'community-ui.js?v=b5wp1_20260727',
    ASSET + 'community-daily-feed.js?v=entFeed20260724',
    ASSET + 'interaction/boot.js?v=b5ixFlat20260727',
    ASSET + 'community-post-page.js?v=b5ixFlat20260727'
  ]
];

var LAYOUT_HTML = `<div data-ifx-community-story></div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxCommunityApiBridge && IfluxCommunityApiBridge.loadPostPage) {
    var ref = window.IfluxSeoUrl && IfluxSeoUrl.parsePostRef ? IfluxSeoUrl.parsePostRef() : null;
    if (ref) await IfluxCommunityApiBridge.loadPostPage({ idOrSlug: ref });
  }
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxCommunityPostPage) IfluxCommunityPostPage.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
