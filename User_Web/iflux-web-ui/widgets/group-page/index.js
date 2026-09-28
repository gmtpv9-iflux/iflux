/**
 * WGT-GROUP-PAGE — Composite chi tiết nhóm (ngành / họ CP / chủ đề)
 * Page Feature: header/chart/tabs → Layout Engine mount placements vào Host sidebar + trading.
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=r20260928n';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260928n';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';

export const meta = { id: 'WGT-GROUP-PAGE', title: 'Chi tiết nhóm' };

var KIND_BY_PAGE = {
  sector: 'sector',
  family: 'family',
  cauChuyenDetail: 'cau-chuyen',
  chuDeDetail: 'cau-chuyen'
};

var PUBLISH_BY_KIND = {
  sector: 'sector-detail',
  family: 'eco-detail',
  'cau-chuyen': 'cau-chuyen-detail',
  'chu-de': 'chu-de-detail'
};

/* W4: taxonomy/seeds/mock/registry/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [
    ADMIN + 'iflux-admin-ui.js',
    ASSET + 'iflux-user-data-sync.js?v=r20260928n',
    'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'
  ],
  [
    ASSET + 'watchlist-store.js?v=r20260928n',
    ASSET + 'stock-store.js?v=r20260928n',
    ASSET + 'news-store.js?v=r20260928n',
    ASSET + 'iflux-news-api-bridge.js?v=r20260928n',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724'
  ],
  [
    ASSET + 'watchlist-ui.js?v=r20260928n',
    ASSET + 'news-ui.js?v=r20260928n',
    ASSET + 'comments-cta.js?v=ix45Purge20260724',
    ASSET + 'news-daily-feed.js?v=r20260928n',
    ASSET + 'iflux-market-quotes.js?v=r20260928n'
  ],
  [
    ASSET + 'entity-detail-center.js?v=r20260928n',
    ASSET + 'group-page.js?v=r20260928n',
    ASSET + 'runtime/page-layout-engine.js?v=r20260928n'
  ]
];

function resolveKind(ctx) {
  var slot = (ctx && ctx.slot) || {};
  var cfg = slot.config || (ctx && ctx.config) || {};
  if (cfg.kind) return cfg.kind;
  var pk = (ctx && ctx.pageKey) || '';
  return KIND_BY_PAGE[pk] || 'sector';
}

function publishKeyForKind(kind) {
  return PUBLISH_BY_KIND[kind] || 'sector-detail';
}

function mountFromHostTree(root, publishKey) {
  return mountPageWidgets(root, publishKey);
}

export async function mount(el, ctx) {
  var kind = resolveKind(ctx);
  var publishKey = publishKeyForKind(kind);
  el.innerHTML = '<div data-ifx-group-page></div>';
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxAuth && !IfluxAuth.requireAuth()) return { unmount: function () { if (el) el.innerHTML = ''; } };
  /* Bridge khung trang chung cho script trang (IIFE) — render() dựng qua buildPageFrame. */
  window.IfluxRuntimeSections = { buildPageFrame: buildPageFrame };
  if (window.IfluxGroupPage) IfluxGroupPage.init(kind);
  function onRemount() {
    mountFromHostTree(el, publishKey);
  }
  function onPlans() {
    mountFromHostTree(el, publishKey);
  }
  await mountFromHostTree(el, publishKey);
  document.addEventListener('iflux-knowledge-remount-widgets', onRemount);
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-knowledge-remount-widgets', onRemount);
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
