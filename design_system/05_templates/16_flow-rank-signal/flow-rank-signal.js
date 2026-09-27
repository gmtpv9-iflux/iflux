/**
 * TMP-FLOW-RANK-SIGNAL — Top score kèm chỉ báo rủi ro và tín hiệu Cơ hội / Rủi ro.
 * Đầu vào: [0] đối tượng · [1] tín hiệu (Tích cực/Tiêu cực) · [2] score 0–100 · [3] chỉ báo rủi ro 0–100.
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  var S = global.IfxScoreRank;
  if (!T || !S) return;
  var U = T.util;
  var NEG = /ti[êe]u|r[ủu]i|âm|giảm|giam|bán|ban|^-/;

  function energy(v) {
    var on = Math.max(0, Math.min(5, Math.round(S.clamp(v) / 20)));
    var html = '';
    for (var i = 5; i >= 1; i--) html += '<span class="ifx-flow-signal-seg' + (i <= on ? ' is-on' : '') + '"></span>';
    return '<span class="ifx-flow-signal-risk" title="Chỉ báo rủi ro: ' + U.esc(v) + '">' +
      '<span class="ifx-flow-signal-energy">' + html + '</span>' +
      '<span class="ifx-flow-signal-risk-val">' + U.esc(v) + '</span></span>';
  }

  T.define('TMP-FLOW-RANK-SIGNAL', {
    inputs: [
      { label: 'Đối tượng (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5' },
      { label: 'Tín hiệu (Tích cực → Cơ hội / Tiêu cực → Rủi ro)', demo: 'Tích cực | Tích cực | Tiêu cực | Tích cực | Tiêu cực' },
      { label: 'Điểm (Score) 0–100', demo: '92 | 85 | 78 | 64 | 51' },
      { label: 'Chỉ báo rủi ro (0–100)', demo: '35 | 62 | 48 | 20 | 55' }
    ],
    frame: function () { return 'ifx-card-accent ifx-flow-signal-frame'; },
    aside: function () {
      return '<span class="ifx-badge ifx-badge-soft ifx-badge-success ifx-badge-status"><i class="ti ti-trending-up" aria-hidden="true"></i>Tích cực</span>';
    },
    render: function (input) {
      var c = U.columns(input.slice(0, 4));
      var items = c[0].map(function (label, i) {
        return { label: label, score: U.num(c[2][i]), risk: c[3][i], neg: NEG.test(String(c[1][i] || '').toLowerCase()) };
      }).filter(function (it) { return it.label; });
      var rows = items.map(function (it, i) {
        var sig = it.neg
          ? '<span class="ifx-badge ifx-badge-soft ifx-badge-danger">Rủi ro</span>'
          : '<span class="ifx-badge ifx-badge-soft ifx-badge-success">Cơ hội</span>';
        return S.row(it, i, (String(it.risk).trim() !== '' ? energy(it.risk) : '<span></span>') + sig, 'ifx-score-rank-in');
      }).join('');
      return '<div class="ifx-score-rank"><div class="ifx-score-rank-layout">' +
        S.chart(items.map(function (it) { return it.label; }), [{ tone: 'flow-in', values: items.map(function (it) { return S.clamp(it.score); }) }]) +
        '<div class="ifx-score-rank-list ifx-flow-signal">' +
          S.head(['#', 'Đối tượng', 'Score', '', 'Chỉ báo rủi ro', 'Tín hiệu']) + rows +
        '</div>' +
      '</div></div>';
    },
    bind: function (root) { S.bind(root); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
