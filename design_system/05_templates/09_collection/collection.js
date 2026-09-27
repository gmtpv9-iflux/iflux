/**
 * TMP-COLLECTION — Danh sách theo dõi: dòng mã (component Stock row).
 * Đầu vào: [0] mã · [1] tên đầy đủ · [2] giá trị · [3] % thay đổi.
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  T.define('TMP-COLLECTION', {
    inputs: [
      { label: 'Mã (nhãn ngắn)', demo: 'Mã A | Mã B | Mã C | Mã D' },
      { label: 'Tên đầy đủ', demo: 'Đối tượng 1 | Đối tượng 2 | Đối tượng 3 | Đối tượng 4' },
      { label: 'Giá trị', demo: '92.5 | 27.8 | 38.4 | 45.1' },
      { label: '% thay đổi', demo: '1.2 | -0.8 | 2.1 | 0.4' }
    ],
    render: function (input) {
      var c = U.columns(input.slice(0, 4));
      return '<div class="ifx-stock-rows">' + c[0].map(function (tk, i) {
        var chg = U.num(c[3][i]);
        return '<a class="ifx-stock-row-new ' + U.dir(chg) + '" href="#">' +
          '<span class="ifx-stock-row-ticker" data-ifx-role="entity-name">' + U.esc(tk || '—') + '</span>' +
          '<span class="ifx-stock-row-name">' + U.esc(c[1][i]) + '</span>' +
          '<span class="ifx-stock-row-price">' + U.esc(c[2][i] !== '' ? c[2][i] : '—') + '</span>' +
          '<span class="ifx-stock-row-change">' + U.fmtPct(chg) + '</span>' +
        '</a>';
      }).join('') + '</div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
