/**
 * Widget WGT-MKT-001 — Tổng quan thị trường (ESM lazy module)
 * Export mount(el, ctx) — bọc IfluxCommunityMarketOverview qua legacy-bridge.
 * Chỉ nạp deps on-demand: community-market-overview + block-templates (không heatmap/rankings/...).
 * WP-4: bỏ module mock thị trường khỏi dep chain.
 */

import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-MKT-001',
  title: 'Tổng quan thị trường'
};

export async function mount(el, ctx) {
  ctx = ctx || {};
  /* WP-4: bỏ module mock thị trường — community-market-overview.js đã migrate (WP-1, UNAVAILABLE). */
  await ensureSequence([
    { global: 'IfluxCommunityMarketOverview', src: ASSET + 'community-market-overview.js?v=mockRmWp4_20260809' }
  ]);

  var Overview = window.IfluxCommunityMarketOverview;
  if (!Overview || typeof Overview.mount !== 'function') {
    throw new Error('Thiếu IfluxCommunityMarketOverview');
  }

  Overview.mount(el, {
    widgetId: 'WGT-MKT-001',
    sidebar: true,
    marketSidebar: true,
    includeBreadth: false,
    hideHead: false
  });

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
