/**
 * TMP-TREND-LINE — Xu hướng 2 chuỗi theo trục mốc.
 * Đầu vào: [0] mốc trục hoành · [1] chuỗi A · [2] chuỗi B · [3] tab khoảng so sánh · [4] bộ lọc.
 * Biểu đồ vẽ bằng component Chart (IfxChart, area) — màu từ token, tự vẽ lại khi đổi theme/kích thước.
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  T.define('TMP-TREND-LINE', {
    inputs: [
      { label: 'Mốc trên trục hoành', demo: 'Mốc 1 | Mốc 2 | Mốc 3 | Mốc 4 | Mốc 5 | Mốc 6 | Mốc 7 | Mốc 8 | Mốc 9' },
      { label: 'Chuỗi dữ liệu A', demo: '1.2 | 2.8 | 4.1 | 5.6 | 7.0 | 8.4 | 10.1 | 12.0 | 13.5' },
      { label: 'Chuỗi dữ liệu B', demo: '1.0 | 2.4 | 3.6 | 5.0 | 6.2 | 7.5 | 9.0 | 10.6 | 12.1' },
      { label: 'Các tab so sánh', demo: 'Khoảng 1 | Khoảng 2 | Khoảng 3 | Khoảng 4' },
      { label: 'Danh sách bộ lọc', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' }
    ],
    render: function (input) {
      var tabs = U.list(input[3]);
      var filters = U.list(input[4]);
      var data = {
        baseline: 0, curve: 'straight', fill: 'gradient', legendValues: false,
        labels: U.list(input[0]),
        series: [
          { name: 'Chuỗi A', tone: 'chart-1', values: U.list(input[1]).map(U.num) },
          { name: 'Chuỗi B', tone: 'chart-5', values: U.list(input[2]).map(U.num) }
        ]
      };
      return '<div class="ifx-trend-filters">' +
          (tabs.length ? '<div class="ifx-tabs ifx-tabs-segmented" role="tablist" aria-label="Khoảng so sánh" data-ifx-trend-tabs>' +
            tabs.map(function (t, i) {
              return '<button type="button" class="ifx-tab' + (i === 0 ? ' is-active' : '') + '" role="tab">' + U.esc(t) + '</button>';
            }).join('') + '</div>' : '') +
          (filters.length ? '<select class="ifx-select ifx-trend-filter" aria-label="Bộ lọc">' +
            filters.map(function (f) { return '<option>' + U.esc(f) + '</option>'; }).join('') + '</select>' : '') +
        '</div>' +
        '<div class="ifx-chart" data-ifx-chart="area" data-ifx-plot="md" data-ifx-legend="center">' +
          '<div class="ifx-chart-plot"></div>' +
          '<script type="application/json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>' +
        '</div>';
    },
    bind: function (root) {
      var tabs = root.querySelector('[data-ifx-trend-tabs]');
      if (tabs) tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.ifx-tab');
        if (btn) tabs.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
      var chart = root.querySelector('[data-ifx-chart]');
      if (!chart || !global.IfxChart) return;
      global.IfxChart.render(chart);
      if (global.ResizeObserver) {
        var w = 0;
        new ResizeObserver(function (entries) {
          var nw = Math.round(entries[0].contentRect.width);
          if (nw && nw !== w) { w = nw; global.IfxChart.render(chart); }
        }).observe(chart);
      }
      /* Đổi theme = đổi thuộc tính trên <html> → vẽ lại với màu token mới. */
      new MutationObserver(function () { global.IfxChart.render(chart); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
