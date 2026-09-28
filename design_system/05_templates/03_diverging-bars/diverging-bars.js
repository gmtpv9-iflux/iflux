/**
 * TMP-DIVERGING-BARS — Cột phân kỳ (+/−) theo mốc.
 * Đầu vào: [0] nhóm (tabs) · [1] dòng chú thích · [2] mốc trục hoành · [3] giá trị (+/−).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  function niceCeil(v) {
    v = Math.max(v, 1);
    var steps = [10, 20, 25, 50, 75, 100, 150, 200];
    for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i];
    var pow = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
  }

  /** Dòng chú thích dạng "A · Nhóm · B": phần giữa đổi theo nhóm đang chọn. */
  function hintFor(hint, group) {
    if (!hint) return group || '';
    var parts = hint.split(' · ');
    if (group && parts.length >= 3) { parts[1] = group; return parts.join(' · '); }
    return hint;
  }

  function plot(labels, values) {
    if (!labels.length) return '<small>Chưa có dữ liệu</small>';
    var maxAbs = values.reduce(function (m, v) { return Math.max(m, Math.abs(v)); }, 0);
    var half = niceCeil(Math.max(maxAbs, 1) * 1.1);
    var ticks = [half, half / 2, 0, -half / 2, -half];
    var bars = values.map(function (v, i) {
      var pct = Math.min(100, (Math.abs(v) / half) * 100).toFixed(1);
      var bar = '<div class="ifx-divbars-bar ' + (v >= 0 ? 'is-pos' : 'is-neg') + '" style="height:' + pct + '%"></div>';
      return '<div class="ifx-divbars-col" title="' + U.esc(labels[i] + ': ' + v) + '">' +
        '<div class="ifx-divbars-half is-top">' + (v >= 0 ? bar : '') + '</div>' +
        '<div class="ifx-divbars-half is-bottom">' + (v < 0 ? bar : '') + '</div>' +
      '</div>';
    }).join('');
    return '<div class="ifx-divbars-plot">' +
      '<div class="ifx-divbars-yaxis">' + ticks.map(function (t) {
        return '<span class="ifx-divbars-ytick" style="top:' + (((half - t) / (half * 2)) * 100).toFixed(2) + '%">' + t + '</span>';
      }).join('') + '</div>' +
      '<div class="ifx-divbars-area">' +
        '<div class="ifx-divbars-canvas"><div class="ifx-divbars-zero" aria-hidden="true"></div>' +
          '<div class="ifx-divbars-bars">' + bars + '</div></div>' +
        '<div class="ifx-divbars-xlabels">' + labels.map(function (l) { return '<span>' + U.esc(l) + '</span>'; }).join('') + '</div>' +
      '</div>' +
    '</div>';
  }

  T.define('TMP-DIVERGING-BARS', {
    inputs: [
      { label: 'Nhóm (tabs)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' },
      { label: 'Dòng chú thích', demo: 'Giá trị ròng · Nhóm A · 10 mốc' },
      { label: 'Mốc trục hoành', demo: 'Mốc 1 | Mốc 2 | Mốc 3 | Mốc 4 | Mốc 5 | Mốc 6 | Mốc 7 | Mốc 8 | Mốc 9 | Mốc 10' },
      { label: 'Giá trị (+ / −)', demo: '320 | -120 | 210 | -80 | 150 | 90 | -60 | 240 | -180 | 70' }
    ],
    render: function (input) {
      var tabs = U.list(input[0]);
      var c = U.columns([input[2], input[3]]);
      var labels = c[0].map(function (l) { return l || '—'; });
      var values = c[1].map(function (v) { return v !== '' ? U.num(v) : 0; });
      return '<div class="ifx-tabs ifx-tabs-segmented" role="tablist" data-ifx-divbars-tabs>' +
          tabs.map(function (t, i) {
            return '<button type="button" class="ifx-tab' + (i === 0 ? ' is-active' : '') + '" role="tab">' + U.esc(t) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ifx-divbars-hint" data-ifx-divbars-hint>' + U.esc(hintFor(String(input[1] || '').trim(), tabs[0])) + '</div>' +
        plot(labels, values);
    },
    bind: function (root, input) {
      var tabs = root.querySelector('[data-ifx-divbars-tabs]');
      var hint = root.querySelector('[data-ifx-divbars-hint]');
      if (!tabs) return;
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.ifx-tab');
        if (!btn) return;
        tabs.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        if (hint) hint.textContent = hintFor(String(input[1] || '').trim(), btn.textContent);
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
