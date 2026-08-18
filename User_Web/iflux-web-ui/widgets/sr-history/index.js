/**
 * TMP-SR-HISTORY — ESM (Publish display.module).
 */
import { loadScriptTiers, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { templateId: 'TMP-SR-HISTORY', title: 'Lịch sử Hỗ trợ — Kháng cự' };

var DEMO = {
  tabs: ['1 tháng', '3 tháng', '1 năm', 'Lịch sử'],
  leftRange: '20–24',
  center: '26.5',
  rightRange: '28–32',
  leftPct: 42,
  rightPct: 28
};

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  await loadStyles([ASSET + 'block-templates.css']);
  await loadScriptTiers([[ASSET + 'block-templates.js?v=entEntity20260720']]);
  var T = window.IfluxBlockTemplates;
  if (!T || typeof T.renderSrHistory !== 'function') {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu renderSrHistory</div>';
    return;
  }
  var title =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.title) ||
    (ctx.slot && ctx.slot.title) ||
    meta.title;
  var desc = (ctx.artifact && ctx.artifact.content && ctx.artifact.content.description) || '';
  var head = typeof T.renderWgtHead === 'function' ? T.renderWgtHead(title, desc) : '';
  var active = 0;

  function paint() {
    el.innerHTML =
      head +
      T.renderSrHistory({
        tabs: DEMO.tabs,
        activeIndex: active,
        leftRange: DEMO.leftRange,
        center: DEMO.center,
        rightRange: DEMO.rightRange,
        leftPct: DEMO.leftPct,
        rightPct: DEMO.rightPct,
        leftLabel: 'Hỗ trợ',
        centerLabel: 'Hiện tại',
        rightLabel: 'Kháng cự'
      });
  }

  paint();
  el.addEventListener('click', function onTab(e) {
    var btn = e.target.closest('[data-ifx-sr-tab]');
    if (!btn || !el.contains(btn)) return;
    active = Number(btn.getAttribute('data-ifx-sr-tab')) || 0;
    paint();
  });

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) { if (el) el.innerHTML = ''; }
