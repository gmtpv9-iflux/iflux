/**
 * Widget WGT-MKT-004/005/006 — Heatmap (ESM lazy module)
 * source lấy từ slot.config.source hoặc ctx.source: sector | family | story
 */
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-MKT-HEAT',
  title: 'Heatmap'
};

function resolveSource(ctx) {
  ctx = ctx || {};
  var cfg = (ctx.slot && ctx.slot.config) || ctx.config || {};
  if (cfg.source) return cfg.source;
  var id = (ctx.slot && ctx.slot.id) || ctx.widgetId || '';
  if (id === 'WGT-MKT-005') return 'family';
  if (id === 'WGT-MKT-006') return 'chu-de';
  return 'sector';
}

export async function mount(el, ctx) {
  ctx = ctx || {};
  await ensureSequence([
    { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js' },
    /* W4: IfluxBlockTemplates = Shell — ensureSequence skip nếu đã có */
    { global: 'IfluxMarketHeatmap', src: ASSET + 'market-heatmap.js' }
  ]);

  var Heatmap = window.IfluxMarketHeatmap;
  if (!Heatmap || typeof Heatmap.mount !== 'function') {
    throw new Error('Thiếu IfluxMarketHeatmap');
  }

  var source = resolveSource(ctx);
  var widgetId = (ctx.slot && ctx.slot.id) || ctx.widgetId || '';
  Heatmap.mount(el, source, Object.assign({
    withHead: true,
    widgetId: widgetId,
    artifact: ctx.artifact || null,
    title: ctx.artifact && ctx.artifact.content && ctx.artifact.content.title,
    description: ctx.artifact && ctx.artifact.content && ctx.artifact.content.description
  }, (ctx.slot && ctx.slot.config) || {}, ctx.config || {}));

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
