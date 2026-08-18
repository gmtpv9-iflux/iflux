/**
 * TMP-RANK-PERF — ESM (Publish display.module).
 */
import { loadScriptTiers, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { templateId: 'TMP-RANK-PERF', title: 'Bảng xếp hạng theo chỉ số' };

var DEMO_ITEMS = [
  { name: 'Mục 1', perf: 6.8 },
  { name: 'Mục 2', perf: 5.2 },
  { name: 'Mục 3', perf: 4.1 },
  { name: 'Mục 4', perf: 3.3 },
  { name: 'Mục 5', perf: 2.0 }
];

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  await loadStyles([ASSET + 'block-templates.css', ASSET + 'market-components.css?v=bpPhaseD20260716']);
  await loadScriptTiers([[ASSET + 'block-templates.js?v=entEntity20260720']]);
  var T = window.IfluxBlockTemplates;
  if (!T || typeof T.renderRankBarList !== 'function') {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu block-templates (renderRankBarList)</div>';
    return;
  }
  var title =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.title) ||
    (ctx.slot && ctx.slot.title) ||
    meta.title;
  var desc = (ctx.artifact && ctx.artifact.content && ctx.artifact.content.description) || '';
  var head = typeof T.renderWgtHead === 'function' ? T.renderWgtHead(title, desc) : '';
  var body = T.renderRankBarList({
    items: DEMO_ITEMS,
    headLabel: 'Đối tượng',
    headValue: 'Chỉ số',
    emptyMsg: 'Chưa có dữ liệu'
  });
  el.innerHTML = head + body;
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) { if (el) el.innerHTML = ''; }
