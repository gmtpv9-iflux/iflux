/**
 * TMP-ZONE-POSITION — Vị trí trong vùng Hỗ trợ / Kháng cự.
 * Đầu vào: [0] giai đoạn · [1] vùng trái · [2] vùng phải · [3] giá trị giữa · [4] % trái · [5] % phải.
 * ctx.headers: { left, right } — nhãn hai phía (mặc định Hỗ trợ / Kháng cự).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  function signedPct(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '—';
    var n = parseFloat(s.replace(/%\s*$/, '').replace(/[^0-9.\-+]/g, ''));
    if (isNaN(n)) return s;
    var abs = Math.abs(n);
    return (n > 0 ? '+' : n < 0 ? '−' : '') + (abs % 1 === 0 ? String(abs) : abs.toFixed(1).replace(/\.0$/, '')) + '%';
  }
  function absPct(raw) {
    return Math.abs(parseFloat(String(raw == null ? '' : raw).replace(/[^0-9.\-]/g, '')) || 0);
  }

  function row(r, L, R) {
    var l = absPct(r.lp), rr = absPct(r.rp);
    var lw = l + rr > 0 ? (l / (l + rr)) * 100 : 50;
    var lt = signedPct(r.lp), rt = signedPct(r.rp);
    return '<div class="ifx-zone-pos-row">' +
      '<div class="ifx-zone-pos-period">' + U.esc(r.period || '—') + '</div>' +
      '<div class="ifx-zone-pos-track">' +
        '<span class="ifx-zone-pos-side is-left">' + U.esc(L) + '</span>' +
        '<div class="ifx-zone-pos-bar" role="img" aria-label="' + U.esc(L + ' ' + lt + ' · ' + (r.center || '') + ' · ' + R + ' ' + rt) + '">' +
          '<div class="ifx-zone-pos-seg is-left" style="width:' + lw.toFixed(1) + '%"><span class="ifx-zone-pos-pct">' + U.esc(lt) + '</span></div>' +
          '<span class="ifx-zone-pos-marker" aria-hidden="true"></span>' +
          '<div class="ifx-zone-pos-seg is-right" style="width:' + (100 - lw).toFixed(1) + '%"><span class="ifx-zone-pos-pct">' + U.esc(rt) + '</span></div>' +
        '</div>' +
        '<span class="ifx-zone-pos-side is-right">' + U.esc(R) + '</span>' +
      '</div>' +
      '<div class="ifx-zone-pos-values">' +
        '<span class="ifx-zone-pos-range">' + U.esc(r.left || '—') + '</span>' +
        '<span class="ifx-zone-pos-center">' + U.esc(r.center || '—') + '</span>' +
        '<span class="ifx-zone-pos-range is-right">' + U.esc(r.right || '—') + '</span>' +
      '</div>' +
    '</div>';
  }

  T.define('TMP-ZONE-POSITION', {
    inputs: [
      { label: 'Nhãn giai đoạn', demo: '3 tháng | 6 tháng | 1 năm | Lịch sử' },
      { label: 'Vùng bên trái (text)', demo: '18.20 - 18.80 | 17.50 - 18.40 | 16.80 - 18.05 | 16.05 - 18.05' },
      { label: 'Vùng bên phải (text)', demo: '22.40 - 23.00 | 22.10 - 23.50 | 21.90 - 24.00 | 22.05 - 23.10' },
      { label: 'Giá trị giữa', demo: '21.55 | 21.55 | 21.55 | 21.55' },
      { label: '% bên trái (±)', demo: '-16 | -18 | -22 | -16' },
      { label: '% bên phải (±)', demo: '3 | 5 | 8 | 3' }
    ],
    render: function (input, ctx) {
      var h = (ctx && ctx.headers) || {};
      var L = h.left || 'Hỗ trợ', R = h.right || 'Kháng cự';
      var c = U.columns(input.slice(0, 6));
      return '<div class="ifx-zone-pos-new">' + c[0].map(function (p, i) {
        return row({ period: p, left: c[1][i], right: c[2][i], center: c[3][i], lp: c[4][i], rp: c[5][i] }, L, R);
      }).join('') + '</div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
