/**
 * WGT-SEARCH-PAGE — Composite Tìm kiếm (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-SEARCH-PAGE', title: 'Tìm kiếm' };

/* W4: registry/seeds/mock/taxonomy = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js'],
  [ASSET + 'stock-mentions.js'],
  [ASSET + 'watchlist-store.js', ASSET + 'alert-store.js', ASSET + 'alert-ui.js', ADMIN + 'foundation/heart-action.js?v=followFound20260724', ASSET + 'watchlist-ui.js'],
  [ASSET + 'search-page-inline.js']
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
