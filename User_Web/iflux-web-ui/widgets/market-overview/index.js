/**
 * Widget WGT-MKT-001 — Tổng quan thị trường (ESM lazy module)
 * Export mount(el, ctx) — bọc IfluxCommunityMarketOverview qua legacy-bridge.
 * Chỉ nạp deps on-demand: mock-market + block-templates (không heatmap/rankings/...).
 */

import { ensureSequence } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-MKT-001',
  title: 'Tổng quan thị trường'
};

export async function mount(el, ctx) {
  ctx = ctx || {};
  await ensureSequence([
    { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js' },
    { global: 'IfluxBlockTemplates', src: ASSET + 'block-templates.js' },
    { global: 'IfluxCommunityMarketOverview', src: ASSET + 'community-market-overview.js' }
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
