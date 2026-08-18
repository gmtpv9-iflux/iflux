/**
 * TMP-FLOW-RANK-DUO — ESM (Publish display.module).
 */
import { loadScriptTiers, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { templateId: 'TMP-FLOW-RANK-DUO', title: 'Đối chiếu xếp hạng hai chiều' };

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  await loadStyles([
    ASSET + 'flow.css',
    ASSET + 'market-components.css?v=bpPhaseD20260716',
    ASSET + 'block-templates.css'
  ]);
  await loadScriptTiers([
    [
      ASSET + 'flow-score-top-mock.js',
      ASSET + 'flow-score-top.js?v=duoTitle20260708'
    ]
  ]);
  if (!window.IfluxFlowScoreTop || !window.IfluxFlowScoreMock) {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu flow-score-top</div>';
    return;
  }
  var outBlock = IfluxFlowScoreMock.getBlock('stat-stock-out');
  var inBlock = IfluxFlowScoreMock.getBlock('stat-stock-in');
  var blocks = [];
  if (outBlock) blocks.push(outBlock);
  if (inBlock) blocks.push(inBlock);
  if (!blocks.length) {
    el.innerHTML = '<div class="ifx-wl-empty">Không có dữ liệu demo Duo</div>';
    return;
  }
  IfluxFlowScoreTop.mount(el, blocks, { mergePairs: true });
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) { if (el) el.innerHTML = ''; }
