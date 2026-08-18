/**
 * WGT-WL-PAGE — Composite Danh sách theo dõi (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-WL-PAGE', title: 'Danh sách theo dõi' };

/* W4: registry/seeds/mock/taxonomy = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js'],
  [ASSET + 'stock-mentions.js'],
  [
    ASSET + 'watchlist-store.js?v=followFound20260724',
    ASSET + 'alert-store.js',
    ASSET + 'alert-ui.js',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724',
    ASSET + 'watchlist-ui.js?v=followFound20260724',
    ASSET + 'watchlist-block.js?v=followFound20260724'
  ],
  [ASSET + 'alert-page.js?v=followFound20260724', ASSET + 'watchlist-page.js?v=followFound20260724']
];

function renderLayout(manifest) {
  var title = (manifest && manifest.title) || 'Danh sách theo dõi';
  return '<h1 class="ix-page-title">' + title + '</h1>' +
    '<div class="ifx-wl-stock-panel ifx-wl-block" data-ifx-wl-page data-ifx-wl-block></div>';
}

export async function mount(el, ctx) {
  ctx = ctx || {};
  el.innerHTML = renderLayout(ctx.manifest);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxAlertPage) IfluxAlertPage.init();
  if (window.IfluxWatchlistPage) IfluxWatchlistPage.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
