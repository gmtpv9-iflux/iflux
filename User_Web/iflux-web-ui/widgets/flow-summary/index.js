/**
 * TMP-FLOW-SUMMARY — ESM (Publish display.module).
 * Markup khớp classic WGT-FLW-001 / Admin preview flow-summary.
 */
import { loadStyles } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { templateId: 'TMP-FLOW-SUMMARY', title: 'Dòng tiền thông minh (tóm tắt)' };

var DEMO = [
  { label: 'Khối ngoại', buy_pct: 54, sell_pct: 46, net_label: '+320', up: true },
  { label: 'Tổ chức', buy_pct: 48, sell_pct: 52, net_label: '-120', up: false },
  { label: 'Tự doanh', buy_pct: 51, sell_pct: 49, net_label: '+60', up: true },
  { label: 'Cá nhân', buy_pct: 47, sell_pct: 53, net_label: '-260', up: false }
];

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  await loadStyles([ASSET + 'flow.css', ASSET + 'block-templates.css']);
  var title =
    (ctx.artifact && ctx.artifact.content && ctx.artifact.content.title) ||
    (ctx.slot && ctx.slot.title) ||
    meta.title;
  var rows = DEMO.map(function (f) {
    return (
      '<div class="ifx-flow-panel">' +
        '<div class="ifx-flow-panel__head"><span class="ifx-flow-panel__label">' + f.label + '</span>' +
        '<span class="ifx-flow-panel__net ' + (f.up ? 'is-up' : 'is-down') + '">' + f.net_label + '</span></div>' +
        '<div class="ifx-flow-bar"><div class="ifx-flow-bar__buy" style="width:' + f.buy_pct + '%"></div>' +
        '<div class="ifx-flow-bar__sell" style="width:' + f.sell_pct + '%"></div></div></div>'
    );
  }).join('');
  el.innerHTML =
    '<div class="ifx-widget__header"><h3 class="ifx-widget__title">' + title + '</h3></div>' +
    '<div class="ifx-flow-summary">' + rows + '</div>';
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) { if (el) el.innerHTML = ''; }
