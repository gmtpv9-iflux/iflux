/**
 * IfxScoreRank — dựng HTML cho component Score rank (radar + danh sách điểm 0–100).
 * Dùng bởi template; không đọc dữ liệu, không biết widget.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function clamp(v) { return Math.max(0, Math.min(100, Number(v) || 0)); }
  function short(label, max) {
    label = String(label || '');
    return label.length <= max ? label : label.slice(0, max - 1) + '…';
  }

  /** Radar: series = [{ tone, values }], labelTones tuỳ chọn. */
  function chart(labels, series, labelTones) {
    var data = { labels: labels.map(function (l) { return short(l, 12); }), labelTones: labelTones || null, series: series };
    return '<div class="ifx-score-rank-chart"><div class="ifx-chart" data-ifx-chart="radar">' +
      '<div class="ifx-chart-plot"></div>' +
      '<script type="application/json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>' +
    '</div></div>';
  }

  function head(cols) {
    return '<div class="ifx-score-rank-head">' + cols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>';
  }

  /** Một hàng: item = { label, score }, extra = HTML các cột thêm. */
  function row(item, i, extra, cls) {
    var s = clamp(item.score);
    return '<div class="ifx-score-rank-row' + (cls ? ' ' + cls : '') + '">' +
      '<span class="ifx-score-rank-pos">' + (i + 1) + '</span>' +
      '<span class="ifx-score-rank-name" title="' + esc(item.label) + '">' + esc(item.label) + '</span>' +
      '<span class="ifx-progress"><span class="ifx-progress-bar" style="--ifx-progress-value:' + s + '%"></span></span>' +
      '<span class="ifx-score-rank-val">' + esc(item.score) + '</span>' +
      (extra || '') +
    '</div>';
  }

  /** Vẽ radar trong root; vẽ lại khi đổi kích thước hoặc theme. */
  function bind(root) {
    var el = root.querySelector('.ifx-score-rank-chart [data-ifx-chart]');
    if (!el || !global.IfxChart) return;
    var draw = function () { global.IfxChart.render(el); };
    draw();
    if (global.ResizeObserver) {
      var w = 0;
      new ResizeObserver(function (entries) {
        var nw = Math.round(entries[0].contentRect.width);
        if (nw && nw !== w) { w = nw; draw(); }
      }).observe(el);
    }
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  }

  global.IfxScoreRank = { chart: chart, head: head, row: row, bind: bind, clamp: clamp };
})(typeof window !== 'undefined' ? window : globalThis);
