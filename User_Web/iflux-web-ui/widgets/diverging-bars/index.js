/**
 * TMP-DIVERGING-BARS — ESM Widget module (Publish display.module).
 * Render qua IfluxBlockTemplates.renderDivergingBars (Design System).
 */
import { loadScriptTiers, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  templateId: 'TMP-DIVERGING-BARS',
  title: 'Biểu đồ cột hai chiều quanh trục 0'
};

var DEPS = [
  [ASSET + 'block-templates.js?v=entEntity20260720']
];

var CSS = [
  ASSET + 'block-templates.css'
];

/* Demo khớp Mẫu giao diện TMP-DIVERGING-BARS (inputs catalog) — ViewModel thật sau. */
var DEMO = {
  tabs: ['Nhóm A', 'Nhóm B', 'Nhóm C', 'Nhóm D'],
  hint: 'Giá trị ròng · Nhóm A · 10 mốc',
  marks: ['Mốc 1', 'Mốc 2', 'Mốc 3', 'Mốc 4', 'Mốc 5', 'Mốc 6', 'Mốc 7', 'Mốc 8', 'Mốc 9', 'Mốc 10'],
  values: [320, -120, 210, -80, 150, 90, -60, 240, -180, 70]
};

function num(v) {
  var n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function pointsFromDemo() {
  var out = [];
  for (var i = 0; i < DEMO.marks.length; i++) {
    out.push({
      value: DEMO.values[i] != null ? num(DEMO.values[i]) : 0,
      label: DEMO.marks[i] || '—',
      title: (DEMO.marks[i] || '—') + ': ' + (DEMO.values[i] != null ? DEMO.values[i] : '—')
    });
  }
  return out;
}

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  await loadStyles(CSS);
  await loadScriptTiers(DEPS);
  var T = window.IfluxBlockTemplates;
  if (!T || typeof T.renderDivergingBars !== 'function') {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu block-templates.js (renderDivergingBars)</div>';
    return;
  }

  var title =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.title) ||
    (ctx.slot && ctx.slot.title) ||
    meta.title;
  var desc =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.description) ||
    '';

  var tabs = DEMO.tabs.map(function (lb, idx) {
    return { key: 't' + idx, label: lb };
  });
  var activeKey = tabs[0] ? tabs[0].key : '';
  var body = T.renderDivergingBars({
    tabs: tabs,
    activeKey: activeKey,
    hint: DEMO.hint,
    points: pointsFromDemo()
  });
  var head =
    typeof T.renderWgtHead === 'function'
      ? T.renderWgtHead(title, desc)
      : '<div class="ifx-widget__header"><h3>' + title + '</h3></div>';

  el.innerHTML = head + body;

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
