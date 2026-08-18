/**
 * WGT-FLW-SUBJ-* — Sidebar dòng tiền mua/bán ròng (ESM)
 * Chỉ nạp dependency của khối này — không kéo seed Admin / registry thị trường.
 */
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-FLW-SUBJ', title: 'Dòng tiền theo đối tượng' };

export async function mount(el, ctx) {
  ctx = ctx || {};
  var slot = ctx.slot || {};
  var scope = (slot.config && slot.config.scope) ||
    (slot.id === 'WGT-FLW-SUBJ-SECTOR' ? 'sector' : 'stock');

  el.setAttribute(
    'data-ifx-ent-block',
    scope === 'sector' ? 'BLK-FLW-NET-SECTOR' : 'BLK-FLW-NET-STOCK'
  );

  await ensureSequence([
    { global: 'IfluxFlowNetTop', src: ASSET + 'flow-net-top.js?v=mockRmWp5_20260809' }
  ]);

  if (window.IfluxFlowNetTop && IfluxFlowNetTop.mount) {
    IfluxFlowNetTop.mount(el, {
      subject: 'retail',
      scope: scope,
      withHead: true
    });
  }

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}
