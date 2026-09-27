/**
 * TMP-RANK-PERF — Xếp hạng theo chỉ số (%).
 * Đầu vào: [0] đối tượng · [1] chỉ số. Thứ tự giữ nguyên như đầu vào.
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  T.define('TMP-RANK-PERF', {
    inputs: [
      { label: 'Đối tượng (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5' },
      { label: 'Chỉ số (tự xếp theo thứ tự)', demo: '6.8 | 5.2 | 4.1 | 3.3 | 2.0' }
    ],
    render: function (input) {
      var c = U.columns([input[0], input[1]]);
      var vals = c[1].map(U.num);
      var max = Math.max.apply(null, vals.map(Math.abs).concat([0.01]));
      return '<div class="ifx-rank-perf-head"><span>#</span><span>Đối tượng</span><span>Chỉ số</span></div>' +
        '<div class="ifx-rank-perf-list">' + c[0].map(function (name, i) {
          var v = vals[i];
          var cls = v > 0.08 ? 'is-up' : v < -0.08 ? 'is-down' : '';
          return '<div class="ifx-rank-perf-row">' +
            '<span class="ifx-rank-perf-idx">' + (i + 1) + '</span>' +
            '<span class="ifx-rank-perf-name">' + U.esc(name || '—') + '</span>' +
            '<div class="ifx-rank-perf-track"><div class="ifx-rank-perf-fill ' + cls + '" style="width:' + Math.min(100, Math.round(Math.abs(v) / max * 100)) + '%"></div></div>' +
            '<span class="ifx-rank-perf-val ' + cls + '">' + U.fmtPct(v) + '</span>' +
          '</div>';
        }).join('') + '</div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
