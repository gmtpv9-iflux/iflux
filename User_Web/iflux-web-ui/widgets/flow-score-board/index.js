/**
 * WGT-FLW-STAT_* / WGT-FLW-EX_TM_* — Bảng Top 10 điểm dòng tiền (ESM)
 * ApexCharts chỉ nạp tại đây (cần cho radar). Không kéo seed Admin.
 */
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-FLW-SCORE', title: 'Top dòng tiền' };

function blocksForWidgetId(id) {
  var M = window.IfluxFlowScoreMock;
  if (!M) return [];
  id = String(id || '');
  if (id === 'WGT-FLW-STAT_STOCK') return M.getBasic();
  if (id === 'WGT-FLW-STAT_SECTOR') {
    return [M.getBlock('stat-sector-in'), M.getBlock('stat-sector-out')].filter(Boolean);
  }
  if (id === 'WGT-FLW-STAT_HST') {
    return [M.getBlock('stat-hst-in'), M.getBlock('stat-hst-out')].filter(Boolean);
  }
  if (id === 'WGT-FLW-STAT_STORY' || id === 'WGT-FLW-STAT_CHUDE') {
    return [M.getBlock('stat-chude-in'), M.getBlock('stat-chude-out')].filter(Boolean);
  }
  if (id === 'WGT-FLW-EX_TM_IN') {
    return [M.getBlock('ex-tm-in'), M.getBlock('ex-tm-out')].filter(Boolean);
  }
  if (id === 'WGT-FLW-EX_TM_SECTOR_IN') {
    return [M.getBlock('ex-tm-sector-in'), M.getBlock('ex-tm-sector-out')].filter(Boolean);
  }
  if (id === 'WGT-FLW-EX_TM_HST_IN') {
    return [M.getBlock('ex-tm-hst-in'), M.getBlock('ex-tm-hst-out')].filter(Boolean);
  }
  if (id === 'WGT-FLW-EX_TM_STORY_IN' || id === 'WGT-FLW-EX_TM_CHUDE_IN') {
    return [M.getBlock('ex-tm-chude-in'), M.getBlock('ex-tm-chude-out')].filter(Boolean);
  }
  return [];
}

export async function mount(el, ctx) {
  ctx = ctx || {};
  var slot = ctx.slot || {};
  var widgetId = slot.id || ctx.widgetId || '';

  await ensureSequence([
    {
      global: 'ApexCharts',
      src: 'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'
    },
    { global: 'IfluxBlockTemplates', src: ASSET + 'block-templates.js' },
    { global: 'IfluxSeoUrl', src: ASSET + 'seo-url.js' },
    { global: 'IfluxFlowScoreMock', src: ASSET + 'flow-score-top-mock.js' },
    { global: 'IfluxFlowScoreTop', src: ASSET + 'flow-score-top.js?v=bpPhaseD20260716' }
  ]);

  var blocks = blocksForWidgetId(widgetId);
  /* "Widget cần Elite?" = tier trong Widget Registry (SoT metadata) — KHÔNG hardcode
     prefix id. Quyết định "user đủ quyền" do IfluxEntitlements (engine) đảm nhiệm. */
  var reg = window.IfluxWidgetRegistry;
  var meta = reg && reg.byType ? reg.byType(widgetId) : null;
  var eliteGate = !!(meta && meta.tier === 'elite');
  if (window.IfluxFlowScoreTop && IfluxFlowScoreTop.mount) {
    IfluxFlowScoreTop.mount(el, blocks, { eliteGate: eliteGate });
  }

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}
