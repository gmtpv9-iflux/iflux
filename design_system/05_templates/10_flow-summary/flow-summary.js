/**
 * TMP-FLOW-SUMMARY — Tỉ lệ vào/ra kèm giá trị ròng theo nhóm.
 * Đầu vào: [0] nhóm · [1] tỉ lệ phần trái/vào (%) · [2] giá trị ròng (± có dấu).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  T.define('TMP-FLOW-SUMMARY', {
    inputs: [
      { label: 'Nhóm (nhãn)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' },
      { label: 'Tỉ lệ phần trái (%)', demo: '58 | 52 | 47 | 44' },
      { label: 'Giá trị ròng (± có dấu)', demo: '+320 | +80 | -40 | -360' }
    ],
    render: function (input) {
      var c = U.columns([input[0], input[1], input[2]]);
      return '<div class="ifx-flow-summary-new">' + c[0].map(function (name, i) {
        var inPct = Math.max(0, Math.min(100, U.num(c[1][i])));
        var net = String(c[2][i] || '').trim();
        var up = !/^-/.test(net.replace(/\s/g, ''));
        return '<div class="ifx-flow-summary-row">' +
          '<div class="ifx-flow-summary-head">' +
            '<span class="ifx-flow-summary-label">' + U.esc(name || '—') + '</span>' +
            '<span class="ifx-flow-summary-net ' + (up ? 'is-up' : 'is-down') + '">' + U.esc(net) + '</span>' +
          '</div>' +
          '<div class="ifx-flow-summary-bar">' +
            '<div class="ifx-flow-summary-in" style="width:' + inPct + '%"></div>' +
            '<div class="ifx-flow-summary-out" style="width:' + (100 - inPct) + '%"></div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
