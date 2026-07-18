/**
 * WGT-WL-PAGE — Composite Danh sách theo dõi (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-WL-PAGE', title: 'Danh sách theo dõi' };

var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js', ADMIN + 'iflux-market-registry-store.js'],
  [ADMIN + 'iflux-market-seed-data.js', ADMIN + 'iflux-market-ecosystem-seeds.js'],
  [ASSET + 'mock-market.js', ASSET + 'watchlist-taxonomy.js', ASSET + 'stock-mentions.js', ASSET + 'block-templates.js'],
  [ASSET + 'watchlist-store.js', ASSET + 'alert-store.js', ASSET + 'alert-ui.js', ASSET + 'watchlist-ui.js', ASSET + 'watchlist-block.js'],
  [ASSET + 'alert-page.js', ASSET + 'watchlist-page.js']
];

var LAYOUT_HTML = `<h1 class="ix-page-title">Watchlist</h1>
    <div class="ifx-wl-stock-panel ifx-wl-block" data-ifx-wl-page data-ifx-wl-block></div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxAlertPage) IfluxAlertPage.init();
  if (window.IfluxWatchlistPage) IfluxWatchlistPage.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
