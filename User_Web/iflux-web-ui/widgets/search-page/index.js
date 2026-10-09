/**
 * WGT-SEARCH-PAGE — Composite Tìm kiếm (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-SEARCH-PAGE', title: 'Tìm kiếm' };

/* W4: registry/seeds/mock/taxonomy = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ASSET + 'stock-mentions.js?v=63b1553d75'],
  [ASSET + 'watchlist-store.js?v=f604e76323', ASSET + 'alert-store.js?v=d341795091', ASSET + 'alert-ui.js?v=559259d072', '/design_system/04_components/29_follow/follow.js?v=r20261002a', ASSET + 'watchlist-ui.js?v=7c1f5a3c0d'],
  [ASSET + 'search-page-inline.js?v=51a87c1c6b']
];

function renderLayout(manifest) {
  var title = (manifest && manifest.title) || 'Tìm kiếm';
  var intro = (manifest && manifest.intro) || 'Cổ phiếu · Ngành · Họ cổ phiếu · Câu chuyện';
  return '<h1 class="ix-page-title">' + title + '</h1>' +
    '<p style="color:var(--ix-text-muted);margin:-8px 0 16px;font-size:14px">' + intro + '</p>' +
    '<div class="ix-form-group" style="max-width:520px;margin-bottom:20px">' +
      '<div class="ix-search" style="max-width:none"><i class="ti ti-search"></i><input type="search" id="search-input" placeholder="Mã CP, tên ngành, họ, chủ đề…" autofocus /></div>' +
    '</div>' +
    '<div id="ifx-search-results"></div>';
}

export async function mount(el, ctx) {
  ctx = ctx || {};
  el.innerHTML = renderLayout(ctx.manifest);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxSearchPageInline) IfluxSearchPageInline.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
