/**
 * WGT-SEARCH-PAGE — Composite Tìm kiếm (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-SEARCH-PAGE', title: 'Tìm kiếm' };

var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js', ADMIN + 'iflux-market-registry-store.js'],
  [ADMIN + 'iflux-market-seed-data.js', ADMIN + 'iflux-market-ecosystem-seeds.js'],
  [ASSET + 'mock-market.js', ASSET + 'watchlist-taxonomy.js', ASSET + 'stock-mentions.js'],
  [ASSET + 'watchlist-store.js', ASSET + 'alert-store.js', ASSET + 'alert-ui.js', ASSET + 'watchlist-ui.js'],
  [ASSET + 'search-page-inline.js']
];

var LAYOUT_HTML = `<h1>Tìm kiếm</h1>
    <p style="color:var(--ix-text-muted);margin:-8px 0 16px;font-size:14px">Cổ phiếu · Ngành · Họ CP · Chủ đề</p>
    <div class="ix-form-group" style="max-width:520px;margin-bottom:20px">
      <div class="ix-search" style="max-width:none"><i class="ti ti-search"></i><input type="search" id="search-input" placeholder="Mã CP, tên ngành, họ, chủ đề…" autofocus /></div>
    </div>
    <div id="ifx-search-results"></div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxSearchPageInline) IfluxSearchPageInline.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
