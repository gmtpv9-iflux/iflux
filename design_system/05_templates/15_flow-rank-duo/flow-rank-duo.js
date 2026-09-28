/**
 * TMP-FLOW-RANK-DUO — Đối chiếu hai chiều vào / ra.
 * Đầu vào: [0] đối tượng chiều vào · [1] score vào · [2] đối tượng chiều ra · [3] score ra.
 * Radar: nửa phải = vào (Top1 ở 12h → xuống), nửa trái = ra (Top1 ở 6h → lên).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  var S = global.IfxScoreRank;
  if (!T || !S) return;
  var U = T.util;

  function pick(namesRaw, scoresRaw) {
    var c = U.columns([namesRaw, scoresRaw]);
    return c[0].map(function (label, i) { return { label: label, score: U.num(c[1][i]) }; })
      .filter(function (it) { return it.label && it.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  T.define('TMP-FLOW-RANK-DUO', {
    inputs: [
      { label: 'Đối tượng chiều vào (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3' },
      { label: 'Score chiều vào (0–100)', demo: '92 | 85 | 78' },
      { label: 'Đối tượng chiều ra (nhãn)', demo: 'Mục 4 | Mục 5 | Mục 6' },
      { label: 'Score chiều ra (0–100)', demo: '74 | 68 | 55' }
    ],
    frame: function () { return 'ifx-card-accent ifx-flow-duo-frame'; },
    aside: function () {
      return '<span class="ifx-badge ifx-badge-soft ifx-badge-danger ifx-badge-status"><i class="ti ti-trending-down" aria-hidden="true"></i>Tiêu cực</span>' +
        '<span class="ifx-badge ifx-badge-soft ifx-badge-success ifx-badge-status"><i class="ti ti-trending-up" aria-hidden="true"></i>Tích cực</span>';
    },
    render: function (input) {
      var pos = pick(input[0], input[1]);
      var neg = pick(input[2], input[3]);
      var n = Math.max(pos.length, neg.length, 1);
      var labels = [], tones = [], inVals = [], outVals = [];
      var i;
      for (i = 0; i < n; i++) {
        labels.push(pos[i] ? pos[i].label : '—'); tones.push('flow-in');
        inVals.push(pos[i] ? S.clamp(pos[i].score) : 0); outVals.push(0);
      }
      for (i = 0; i < n; i++) {
        labels.push(neg[i] ? neg[i].label : '—'); tones.push('flow-out');
        inVals.push(0); outVals.push(neg[i] ? S.clamp(neg[i].score) : 0);
      }
      var cols = ['#', 'Đối tượng', 'Score', ''];
      var rows = '';
      for (i = 0; i < n; i++) {
        rows += (neg[i] ? S.row(neg[i], i, '', 'ifx-score-rank-out is-mirror') : '<div class="ifx-score-rank-row is-empty"></div>') +
          '<span class="ifx-flow-duo-axis" aria-hidden="true"></span>' +
          (pos[i] ? S.row(pos[i], i, '', 'ifx-score-rank-in') : '<div class="ifx-score-rank-row is-empty"></div>');
      }
      return '<div class="ifx-score-rank"><div class="ifx-score-rank-layout">' +
        S.chart(labels, [{ tone: 'flow-out', values: outVals }, { tone: 'flow-in', values: inVals }], tones) +
        '<div class="ifx-score-rank-list"><div class="ifx-flow-duo-grid">' +
          '<div class="ifx-score-rank-head is-mirror">' + cols.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>' +
          '<span class="ifx-flow-duo-axis" aria-hidden="true"></span>' +
          '<div class="ifx-score-rank-head">' + cols.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>' +
          rows +
        '</div></div>' +
      '</div></div>';
    },
    bind: function (root) { S.bind(root); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
