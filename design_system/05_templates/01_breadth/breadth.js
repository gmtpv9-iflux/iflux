/**
 * TMP-BREADTH — Độ rộng thị trường.
 * Đầu vào: [0] tab sàn · [1] nhãn 6 ô · [2] giá trị 6 ô (thứ tự: toàn bộ, tăng, giảm, tham chiếu, trần, sàn).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;
  var STATE = ['is-total', 'is-up', 'is-down', 'is-ref', 'is-ceiling', 'is-floor'];

  T.define('TMP-BREADTH', {
    inputs: [
      { label: 'Tab sàn', demo: 'VN-Index | HOSE | HNX | UPCOM' },
      { label: 'Nhãn ô thống kê', demo: 'Toàn bộ | Mã tăng | Mã giảm | Mã tham chiếu | Mã tím trần | Mã sàn xanh' },
      { label: 'Giá trị ô', demo: '385 | 142 | 98 | 120 | 15 | 10' }
    ],
    render: function (input) {
      var tabs = U.list(input[0]);
      var labels = U.list(input[1]);
      var values = U.list(input[2]);
      var up = U.num(values[1]);
      var down = U.num(values[2]);
      var upPct = Math.round((up / (up + down || 1)) * 100);
      return (
        '<div class="ifx-tabs ifx-tabs-segmented" data-ifx-breadth-tabs>' +
          tabs.map(function (t, i) {
            return '<button type="button" class="ifx-tab' + (i === 0 ? ' is-active' : '') + '">' + U.esc(t) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ifx-breadth-grid">' +
          STATE.map(function (cls, i) {
            return '<div class="ifx-breadth-stat-new ' + cls + '">' +
              '<div class="ifx-breadth-value">' + U.esc(values[i] != null ? values[i] : '—') + '</div>' +
              '<div class="ifx-breadth-label">' + U.esc(labels[i] || '') + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="ifx-breadth-ratio-new" title="Tỷ lệ tăng ' + upPct + '%">' +
          '<div class="ifx-breadth-ratio-up" style="width:' + upPct + '%"></div>' +
          '<div class="ifx-breadth-ratio-down" style="width:' + (100 - upPct) + '%"></div>' +
        '</div>'
      );
    },
    bind: function (root) {
      var tabs = root.querySelector('[data-ifx-breadth-tabs]');
      if (!tabs) return;
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.ifx-tab');
        if (!btn) return;
        tabs.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
