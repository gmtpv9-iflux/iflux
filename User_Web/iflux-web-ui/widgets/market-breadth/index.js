/**
 * Widget WGT-MKT-002 — Độ rộng thị trường (ESM lazy module)
 */
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-MKT-002',
  title: 'Độ rộng thị trường'
};

export async function mount(el, ctx) {
  ctx = ctx || {};
  /* WP-4: bỏ module mock thị trường — độ rộng thị trường không còn phụ thuộc mock (UNAVAILABLE). */
  await ensureSequence([
    { global: 'IfluxBreadthBlock', src: ASSET + 'breadth-block.js?v=mockRmWp4_20260809' }
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
