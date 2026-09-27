/**
 * TMP-COM-STOCK-HEAT — Cổ phiếu được quan tâm.
 * Đầu vào: [0] mã cổ phiếu · [1] lượt quan tâm (kích thước) · [2] hiệu suất hôm nay (%). Tối đa 10 ô.
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates, M = global.IfxTreemap;
  if (!T || !M) return;
  var U = T.util;

  T.define('TMP-COM-STOCK-HEAT', {
    inputs: [
      { label: 'Mã cổ phiếu', demo: 'VIN | VIC | VHM | VCB | HPG | SSI' },
      { label: 'Lượt quan tâm (kích thước)', demo: '639 | 629 | 569 | 426 | 156 | 180' },
      { label: 'Hiệu suất hôm nay (%)', demo: '1.2 | -0.8 | 2.1 | 0.4 | 3.1 | -0.5' }
    ],
    render: function () {
      return '<div class="ifx-treemap-new ifx-stock-heat-canvas" data-ifx-stock-heat role="img" aria-label="Treemap cổ phiếu quan tâm"></div>';
    },
    bind: function (root, input) {
      var c = U.columns([input[0], input[1], input[2]]);
      var items = c[0].map(function (tk, i) {
        var perf = U.num(c[2][i]);
        return { ticker: tk, weight: Math.max(U.num(c[1][i]) || 1, 1), perf: perf, direction: M.direction(perf) };
      }).filter(function (it) { return it.ticker; })
        .sort(function (a, b) { return b.weight - a.weight; }).slice(0, 10);
      M.mount(root.querySelector('[data-ifx-stock-heat]'), items, {
        tile: function (it) {
          return '<a class="ifx-treemap-cell is-' + it.direction + '" href="#">' +
            '<span class="ifx-treemap-name">' + U.esc(it.ticker) + '</span>' +
            '<span class="ifx-treemap-value">' + U.fmtPct(it.perf) + '</span>' +
          '</a>';
        }
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
