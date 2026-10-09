/**
 * WGT-ELP-PAGE — Composite danh sách Entity (cổ phiếu / ngành / họ / câu chuyện)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=e4c886756c';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';

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
    ASSET + 'iflux-user-data-sync.js?v=c4488ad741'
  ],
  [
    ASSET + 'iflux-market-quotes.js?v=349c1e1a74',
    ASSET + 'watchlist-store.js?v=f604e76323',
    ASSET + 'alert-store.js?v=d341795091',
    '/design_system/04_components/29_follow/follow.js?v=r20261002a'
  ],
  [
    ASSET + 'watchlist-ui.js?v=7c1f5a3c0d',
    ASSET + 'alert-ui.js?v=559259d072',
    ASSET + 'stock-mentions.js?v=63b1553d75',
    ASSET + 'stock-scroll-feed.js?v=a15dedab89'
  ],
  [
    ASSET + 'alert-page.js?v=108f7707b5',
    ASSET + 'entity-list-page.js?v=75bc8e27c5' + ELP_VER,
    ASSET + 'runtime/page-layout-engine.js?v=a6f64093c8'
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
