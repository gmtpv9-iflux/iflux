/**
 * TMP-COMMUNITY-STORY-TOP — Top câu chuyện theo điểm.
 * Đầu vào: [0] tên · [1] điểm · [2] lượt xem · [3] bình luận · [4] yêu thích · [5] khung thời gian (tabs).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  function compact(v) {
    var n = Number(String(v).replace(/[^\d.-]/g, ''));
    if (isNaN(n)) return String(v);
    if (Math.abs(n) >= 1e6) return (Math.round(n / 1e5) / 10) + 'M';
    if (Math.abs(n) >= 1e3) return (Math.round(n / 100) / 10) + 'K';
    return String(n);
  }

  T.define('TMP-COMMUNITY-STORY-TOP', {
    inputs: [
      { label: 'Đối tượng (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5 | Mục 6 | Mục 7 | Mục 8 | Mục 9 | Mục 10' },
      { label: 'Điểm xếp hạng', demo: '9039 | 5790 | 5341 | 3901 | 3120 | 2880 | 2440 | 2100 | 1860 | 1540' },
      { label: 'Lượt xem', demo: '3850 | 2450 | 2620 | 2206 | 1840 | 1600 | 1420 | 1280 | 1100 | 980' },
      { label: 'Bình luận', demo: '94 | 63 | 43 | 17 | 14 | 31 | 22 | 18 | 12 | 9' },
      { label: 'Yêu thích', demo: '146 | 74 | 64 | 44 | 31 | 60 | 40 | 32 | 24 | 18' },
      { label: 'Khung thời gian (tab)', demo: 'Ngày | Tuần | Tháng' }
    ],
    render: function (input) {
      var c = U.columns(input.slice(0, 5));
      var tabs = U.list(input[5]);
      return '<div class="ifx-tabs ifx-tabs-segmented" role="tablist" aria-label="Khung thời gian" data-ifx-story-tabs>' +
          tabs.map(function (t, i) {
            return '<button type="button" class="ifx-tab' + (i === 0 ? ' is-active' : '') + '" role="tab">' + U.esc(t) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ifx-story-top-list">' + c[0].map(function (name, i) {
          var metrics = [['eye', c[2][i]], ['message', c[3][i]], ['heart', c[4][i]]].filter(function (m) {
            return String(m[1]).trim() !== '';
          }).map(function (m) {
            return '<span class="ifx-icon-list-item"><i class="ti ti-' + m[0] + ' ifx-icon ifx-icon-sm" aria-hidden="true"></i>' + U.esc(compact(m[1])) + '</span>';
          }).join('');
          return '<div class="ifx-story-top-row">' +
            '<span class="ifx-avatar ifx-avatar-32 ifx-avatar-accent ifx-story-top-num" aria-label="Top ' + (i + 1) + '">' + (i + 1) + '</span>' +
            '<div class="ifx-story-top-body">' +
              '<div class="ifx-story-top-title"><span>' + U.esc(name || '—') + '</span><span>' + U.esc(c[1][i] || '—') + '</span></div>' +
              (metrics ? '<div class="ifx-icon-list ifx-icon-list-inline">' + metrics + '</div>' : '') +
            '</div>' +
          '</div>';
        }).join('') + '</div>';
    },
    bind: function (root) {
      var tabs = root.querySelector('[data-ifx-story-tabs]');
      if (!tabs) return;
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.ifx-tab');
        if (btn) tabs.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
