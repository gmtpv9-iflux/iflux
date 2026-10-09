/**
 * WGT-GROUP-PAGE — Composite chi tiết nhóm (ngành / họ CP / chủ đề)
 * Page Feature: header/chart/tabs → Layout Engine mount placements vào Host sidebar + trading.
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=f23703a85b';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';

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
    ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
    'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'
  ],
  [
    ASSET + 'watchlist-store.js?v=f604e76323',
    ASSET + 'stock-store.js?v=4dc55126ff',
    ASSET + 'news-store.js?v=41bb32b4bc',
    ASSET + 'iflux-news-api-bridge.js?v=70487a5208',
    '/design_system/04_components/29_follow/follow.js?v=r20261002a'
  ],
  [
    ASSET + 'watchlist-ui.js?v=7c1f5a3c0d',
    ASSET + 'news-ui.js?v=0654c01137',
    ASSET + 'comments-cta.js?v=5537ba40da',
    ASSET + 'news-daily-feed.js?v=407fadedc0',
    ASSET + 'iflux-market-quotes.js?v=349c1e1a74'
  ],
  [
    ASSET + 'entity-detail-center.js?v=57d506954b',
    ASSET + 'group-page.js?v=c799efa11e',
    ASSET + 'runtime/page-layout-engine.js?v=a6f64093c8'
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
