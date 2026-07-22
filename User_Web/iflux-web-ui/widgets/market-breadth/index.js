/**
 * Widget WGT-MKT-002 — Độ rộng thị trường (ESM lazy module)
 */
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-MKT-002',
  title: 'Độ rộng thị trường'
};

export async function mount(el, ctx) {
  ctx = ctx || {};
  await ensureSequence([
    { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js' },
    { global: 'IfluxBreadthBlock', src: ASSET + 'breadth-block.js' }
  ]);

  var Breadth = window.IfluxBreadthBlock;
  if (!Breadth || typeof Breadth.mount !== 'function') {
    throw new Error('Thiếu IfluxBreadthBlock');
  }

  Breadth.mount(el, Object.assign({ withHead: true }, (ctx.slot && ctx.slot.config) || {}));

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
