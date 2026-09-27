/**
 * TMP-HEATMAP — Heatmap nhóm.
 * Đầu vào: [0] nhãn phần tử · [1] trọng số (kích thước ô) · [2] giá trị màu (%). Tối đa 10 ô lớn nhất.
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates, M = global.IfxTreemap;
  if (!T || !M) return;
  var U = T.util;

  function items(input, keyName) {
    var c = U.columns([input[0], input[1], input[2]]);
    return c[0].map(function (name, i) {
      var perf = U.num(c[2][i]);
      return { name: name, weight: Math.max(U.num(c[1][i]) || 1, 1), perf: perf, direction: M.direction(perf) };
    }).filter(function (it) { return it.name; })
      .sort(function (a, b) { return b.weight - a.weight; }).slice(0, 10);
  }

  T.define('TMP-HEATMAP', {
    inputs: [
      { label: 'Danh sách phần tử (nhãn)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D | Nhóm E | Nhóm F | Nhóm G | Nhóm H | Nhóm I | Nhóm K | Nhóm L | Nhóm M' },
      { label: 'Trọng số (kích thước ô)', demo: '320 | 280 | 210 | 180 | 150 | 120 | 95 | 80 | 65 | 50 | 30 | 20' },
      { label: 'Giá trị màu (%)', demo: '1.8 | -0.9 | 2.4 | 0.3 | -1.5 | 0.7 | 1.2 | -0.4 | 0.5 | -1.1 | 0.2 | -0.6' }
    ],
    render: function () {
      return '<div class="ifx-treemap-new ifx-heatmap-canvas" data-ifx-heatmap role="img" aria-label="Heatmap"></div>';
    },
    bind: function (root, input) {
      M.mount(root.querySelector('[data-ifx-heatmap]'), items(input), {
        tile: function (it, tier) {
          return '<a class="ifx-treemap-cell is-' + it.direction + '" href="#" title="' + U.esc(it.name) + '">' +
            '<span class="ifx-treemap-name">' + U.esc(tier === 'tiny' ? String(it.name).split(' ')[0] : it.name) + '</span>' +
            (tier === 'tiny' ? '' : '<span class="ifx-treemap-value">' + U.fmtPct(it.perf) + '</span>') +
          '</a>';
        }
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
