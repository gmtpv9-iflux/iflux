/**
 * WGT-ELP-PAGE — Composite danh sách Entity (cổ phiếu / ngành / họ / câu chuyện)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=r20260928q';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260929e';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';
var ELP_VER = 'sidebarVR03_20260811';
export const meta = { id: 'WGT-ELP-PAGE', title: 'Danh sách entity' };

var KIND_BY_PAGE = {
  stocks: 'stocks',
  sectors: 'sectors',
  ecosystems: 'ecosystems',
  cauChuyen: 'cau-chuyen',
  chuDe: 'cau-chuyen'
};

/* W4: taxonomy/seeds/mock/registry/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [
    ASSET + 'iflux-user-data-sync.js?v=r20260928n'
  ],
  [
    ASSET + 'iflux-market-quotes.js?v=r20260928n',
    ASSET + 'watchlist-store.js?v=r20260928n',
    ASSET + 'alert-store.js',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724'
  ],
  [
    ASSET + 'watchlist-ui.js?v=r20260928q',
    ASSET + 'alert-ui.js?v=r20260928q',
    ASSET + 'stock-mentions.js?v=r20260928n',
    ASSET + 'stock-scroll-feed.js'
  ],
  [
    ASSET + 'alert-page.js?v=r20260928n',
    ASSET + 'entity-list-page.js?v=' + ELP_VER,
    ASSET + 'runtime/page-layout-engine.js?v=r20260928n'
  ]
];

/* Khung trang chung (buildPageFrame): Sidebar trái + Main; danh sách chủ thể = nội dung đặc thù Main. */
function buildElpLayout(el) {
  el.innerHTML =
    '<h1 class="ix-page-title" data-elp-title></h1>' +
    '<p class="ifx-page-intro" data-elp-intro></p>';
  var frame = buildPageFrame(el, { sidebarLabel: 'Tổng quan chủ thể' });
  frame.mainContent.innerHTML = '<div data-elp-main></div>';
}

function resolveKind(ctx) {
  var slot = (ctx && ctx.slot) || {};
  var cfg = slot.config || (ctx && ctx.config) || {};
  if (cfg.kind) return cfg.kind;
  var pk = (ctx && ctx.pageKey) || '';
  return KIND_BY_PAGE[pk] || 'stocks';
}

function publishKeyForKind(kind) {
  if (kind === 'chu-de' || kind === 'cau-chuyen' || kind === 'stories') return 'cau-chuyen';
  return kind;
}

function mountFromHostTree(root, publishKey) {
  return mountPageWidgets(root, publishKey);
}

export async function mount(el, ctx) {
  var kind = resolveKind(ctx);
  var publishKey = publishKeyForKind(kind);
  buildElpLayout(el);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();

  if (window.IfluxAlertPage) IfluxAlertPage.init();
  if (window.IfluxEntityListPage) IfluxEntityListPage.init(kind);

  await mountFromHostTree(el, publishKey);
  /* Host trống = Residual Empty PASS — không fallback hardcode sidebar. */
  function onPlans() {
    mountFromHostTree(el, publishKey);
  }
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
