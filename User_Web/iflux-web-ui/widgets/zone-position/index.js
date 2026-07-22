/**
 * TMP-ZONE-POSITION — ESM (Publish display.module).
 */
import { loadScriptTiers, loadStyles } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { templateId: 'TMP-ZONE-POSITION', title: 'Vị trí giữa hai vùng' };

var DEMO_ROWS = [
  { period: '1 tháng', leftRange: '20–24', rightRange: '28–32', center: '26', leftPct: 40, rightPct: 35 },
  { period: '3 tháng', leftRange: '18–22', rightRange: '30–34', center: '25', leftPct: 45, rightPct: 30 }
];

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  await loadStyles([ASSET + 'block-templates.css']);
  await loadScriptTiers([[ASSET + 'block-templates.js?v=entEntity20260720']]);
  var T = window.IfluxBlockTemplates;
  if (!T || typeof T.renderZonePosition !== 'function') {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu renderZonePosition</div>';
    return;
  }
  var title =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.title) ||
    (ctx.slot && ctx.slot.title) ||
    meta.title;
  var desc = (ctx.artifact && ctx.artifact.content && ctx.artifact.content.description) || '';
  var head = typeof T.renderWgtHead === 'function' ? T.renderWgtHead(title, desc) : '';
  el.innerHTML =
    head +
    T.renderZonePosition({
      rows: DEMO_ROWS,
      leftLabel: 'Hỗ trợ',
      rightLabel: 'Kháng cự',
      emptyMsg: 'Chưa có dữ liệu'
    });
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) { if (el) el.innerHTML = ''; }
