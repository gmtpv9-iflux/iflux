/**
 * TMP-FLOW-RANK-SIGNAL — ESM (Publish display.module).
 */
import { loadScriptTiers, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { templateId: 'TMP-FLOW-RANK-SIGNAL', title: 'Ranking · Dòng tiền thông minh' };

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
  var block = IfluxFlowScoreMock.getBlock('stat-stock-in') || IfluxFlowScoreMock.getBlock('ex-tm-stock-in');
  if (!block) {
    el.innerHTML = '<div class="ifx-wl-empty">Không có dữ liệu demo Signal</div>';
    return;
  }
  var next = Object.assign({}, block, {
    showRecommendation: true,
    recommendationKind: 'insight',
    showRisk: true,
    riskLabel: 'Chỉ báo rủi ro',
    hideCompliance: true
  });
  IfluxFlowScoreTop.mount(el, [next], { mergePairs: false });
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) { if (el) el.innerHTML = ''; }
