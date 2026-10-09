/**
 * WGT-WL-PAGE — Composite Danh sách theo dõi (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-WL-PAGE', title: 'Danh sách theo dõi' };

/* W4: registry/seeds/mock/taxonomy = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ASSET + 'stock-mentions.js?v=63b1553d75'],
  [
    ASSET + 'watchlist-store.js?v=f604e76323',
    ASSET + 'alert-store.js?v=d341795091',
    ASSET + 'alert-ui.js?v=559259d072',
    '/design_system/04_components/29_follow/follow.js?v=r20261002a',
    ASSET + 'watchlist-ui.js?v=7c1f5a3c0d',
    ASSET + 'watchlist-block.js?v=02655cb8cf'
  ],
  [ASSET + 'alert-page.js?v=108f7707b5', ASSET + 'watchlist-page.js?v=4165359c1b']
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
