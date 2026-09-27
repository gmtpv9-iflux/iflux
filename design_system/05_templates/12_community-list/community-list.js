/**
 * TMP-COMMUNITY-LIST — Danh sách xếp hạng (người / đối tượng).
 * Đầu vào: [0] tên · [1] chú thích phụ · [2] avatar URL (trống = chữ cái) · [3] chỉ số "type:value, …"
 * type: like share comment post view follower score rank (icon Tabler của foundation).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;
  var ICON = { like: 'heart', share: 'repeat', comment: 'message', post: 'note', view: 'eye', follower: 'user', score: 'star', rank: 'trophy' };

  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    return (p.length >= 2 ? p[0].charAt(0) + p[p.length - 1].charAt(0) : String(name || 'E').trim().slice(0, 2)).toUpperCase();
  }
  /** 1240 → 1.2K · 24000 → 24K */
  function compact(v) {
    var n = Number(String(v).replace(/[^\d.-]/g, ''));
    if (isNaN(n)) return String(v);
    if (Math.abs(n) >= 1e6) return (Math.round(n / 1e5) / 10) + 'M';
    if (Math.abs(n) >= 1e3) return (Math.round(n / 100) / 10) + 'K';
    return String(n);
  }
  function metrics(cell) {
    return String(cell || '').split(',').map(function (p) {
      var s = p.trim().split(':');
      if (!s[0]) return '';
      var type = s[0].trim(), label = (s[2] || '').trim();
      return '<span class="ifx-icon-list-item" title="' + U.esc(label || type) + '">' +
        '<i class="ti ti-' + (ICON[type] || ICON.score) + ' ifx-icon ifx-icon-sm" aria-hidden="true"></i>' +
        U.esc(compact((s[1] || '').trim())) + (label ? ' ' + U.esc(label) : '') + '</span>';
    }).join('');
  }

  T.define('TMP-COMMUNITY-LIST', {
    inputs: [
      { label: 'Đối tượng (tên)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5' },
      { label: 'Chú thích phụ', demo: 'Ghi chú 1 | Ghi chú 2 | Ghi chú 3 | Ghi chú 4 | Ghi chú 5' },
      { label: 'Avatar (URL ảnh — trống = chữ cái)', demo: ' |  |  |  | ' },
      { label: 'Chỉ số (type:value, phẩy = nhiều — type: like share comment post view follower score rank)', demo: 'like:1240, comment:320 | view:24000 | like:530, share:210, view:8200 | post:42, follower:1900 | score:92, rank:3' }
    ],
    render: function (input) {
      var c = U.columns([input[0], input[1], String(input[2] || ''), input[3]]);
      return '<div class="ifx-rank-list">' + c[0].map(function (name, i) {
        name = name || '—';
        var url = String(c[2][i] || '').trim();
        var m = metrics(c[3][i]);
        return '<div class="ifx-rank-list-row">' +
          '<span class="ifx-rank-list-pos">#' + (i + 1) + '</span>' +
          '<a class="ifx-rank-list-user" href="#">' +
            '<span class="ifx-avatar ifx-avatar-md ifx-avatar-accent ifx-avatar-ring">' +
              (url ? '<img src="' + U.esc(url) + '" alt="" />' : U.esc(initials(name))) + '</span>' +
            '<span class="ifx-rank-list-meta"><span class="ifx-rank-list-name">' + U.esc(name) + '</span>' +
              '<span class="ifx-rank-list-sub">' + U.esc(c[1][i]) + '</span></span>' +
          '</a>' +
          (m ? '<span class="ifx-icon-list ifx-icon-list-inline">' + m + '</span>' : '') +
        '</div>';
      }).join('') + '</div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
