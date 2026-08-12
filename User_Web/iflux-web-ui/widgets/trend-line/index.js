/**
 * TMP-TREND-LINE — ESM Widget module (Publish display.module).
 * WGT-MKT-007 KLGD · WGT-MKT-008 GTGD → IfluxMarketLiquidity.mountBlock
 */
import { ensureSequence, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  templateId: 'TMP-TREND-LINE',
  title: 'Biểu đồ vùng nhiều chuỗi'
};

var CSS = [
  ASSET + 'block-templates.css',
  ASSET + 'market-components.css?v=bpPhaseD20260716'
];

function widgetIdFromCtx(ctx) {
  ctx = ctx || {};
  return (
    ctx.widgetId ||
    (ctx.slot && ctx.slot.id) ||
    (ctx.artifact && ctx.artifact.id) ||
    ''
  );
}

function resolveMetric(ctx, widgetId) {
  var cfg = (ctx && ctx.slot && ctx.slot.config) || (ctx && ctx.config) || {};
  if (cfg.metric === 'value' || cfg.metric === 'volume') return cfg.metric;
  if (widgetId === 'WGT-MKT-008') return 'value';
  return 'volume';
}

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  var widgetId = widgetIdFromCtx(ctx);
  var metric = resolveMetric(ctx, widgetId);

  await loadStyles(CSS);
  /* WP-4: bỏ module mock thị trường + ApexCharts — thanh khoản UNAVAILABLE (không có runtime authority), không còn vẽ chart. */
  await ensureSequence([
    { global: 'IfluxBlockTemplates', src: ASSET + 'block-templates.js?v=entEntity20260720' },
    { global: 'IfluxMarketLiquidity', src: ASSET + 'market-liquidity.js?v=mockRmWp4_20260809' }
  ]);

  if (!window.IfluxMarketLiquidity || typeof window.IfluxMarketLiquidity.mountBlock !== 'function') {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu market-liquidity.js</div>';
    return;
  }

  var title =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.title) || null;
  var description =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.description) || null;

  window.IfluxMarketLiquidity.mountBlock(el, metric, {
    widgetId: widgetId || (metric === 'value' ? 'WGT-MKT-008' : 'WGT-MKT-007'),
    withHead: true,
    title: title,
    description: description
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
