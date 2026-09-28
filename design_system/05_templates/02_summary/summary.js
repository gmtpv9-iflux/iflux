/**
 * TMP-SUMMARY — Thẻ chỉ số.
 * Đầu vào: [0] nhãn · [1] giá trị · [2] mức thay đổi (%).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  T.define('TMP-SUMMARY', {
    inputs: [
      { label: 'Nhãn', demo: 'Mục A | Mục B | Mục C' },
      { label: 'Giá trị', demo: '128.5 | 86.2 | 42.4' },
      { label: 'Mức thay đổi / trạng thái', demo: '0.68 | -0.42 | 0.21' }
    ],
    render: function (input) {
      var c = U.columns([input[0], input[1], input[2]]);
      return '<div class="ifx-summary-grid">' + c[0].map(function (name, i) {
        var chg = U.num(c[2][i]);
        return '<div class="ifx-summary-card">' +
          '<div class="ifx-summary-label">' + U.esc(name || '—') + '</div>' +
          '<div class="ifx-summary-value">' + U.fmtNum(c[1][i] !== '' ? U.num(c[1][i]) : null) + '</div>' +
          '<div class="ifx-summary-change ' + U.dir(chg) + '">' + U.fmtPct(chg) + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
