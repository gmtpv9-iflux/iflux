/**
 * TMP-SR-HISTORY — Lịch sử Hỗ trợ | Kháng cự.
 * Đầu vào (mỗi cột = 1 tab): [0] tab · [1] vùng hỗ trợ · [2] giá hiện tại · [3] vùng kháng cự · [4] % tới hỗ trợ · [5] % tới kháng cự.
 * ctx.headers: { left, center, right } — nhãn (mặc định Hỗ trợ / Hiện tại / Kháng cự).
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

  function panel(c, i, h) {
    var L = h.left || 'Hỗ trợ', C = h.center || 'Hiện tại', R = h.right || 'Kháng cự';
    var l = absPct(c[4][i]), r = absPct(c[5][i]);
    var lw = l + r > 0 ? (l / (l + r)) * 100 : 50;
    var lt = signedPct(c[4][i]), rt = signedPct(c[5][i]);
    return '<div class="ifx-sr-hist-labels">' +
        '<span class="ifx-sr-hist-label is-left">' + U.esc(L) + '</span>' +
        '<span class="ifx-sr-hist-label">' + U.esc(C) + '</span>' +
        '<span class="ifx-sr-hist-label is-right">' + U.esc(R) + '</span>' +
      '</div>' +
      '<div class="ifx-sr-hist-bar" role="img" aria-label="' + U.esc(L + ' · ' + (c[2][i] || '') + ' · ' + R) + '">' +
        '<div class="ifx-sr-hist-seg is-left" style="width:' + lw.toFixed(1) + '%"></div>' +
        '<span class="ifx-sr-hist-dot" aria-hidden="true"></span>' +
        '<div class="ifx-sr-hist-seg is-right" style="width:' + (100 - lw).toFixed(1) + '%"></div>' +
      '</div>' +
      '<div class="ifx-sr-hist-values">' +
        '<span class="ifx-sr-hist-range">' + U.esc(c[1][i] || '—') + '</span>' +
        '<span class="ifx-sr-hist-price">' + U.esc(c[2][i] || '—') + '</span>' +
        '<span class="ifx-sr-hist-range is-right">' + U.esc(c[3][i] || '—') + '</span>' +
      '</div>' +
      '<div class="ifx-sr-hist-hints">' +
        '<span class="ifx-sr-hist-hint is-left">' + (lt !== '—' ? 'Còn ' + U.esc(lt) + ' nữa' : '') + '</span>' +
        '<span class="ifx-sr-hist-hint is-right">' + (rt !== '—' ? 'còn ' + U.esc(rt) + ' nữa' : '') + '</span>' +
      '</div>';
  }

  T.define('TMP-SR-HISTORY', {
    inputs: [
      { label: 'Tab khung thời gian', demo: '1 tháng | 3 tháng | 1 năm | Lịch sử' },
      { label: 'Vùng hỗ trợ (text)', demo: '18.20–18.60 | 17.80–18.40 | 16.50–18.00 | 15.20–17.80' },
      { label: 'Giá hiện tại', demo: '20.85 | 20.85 | 20.85 | 20.85' },
      { label: 'Vùng kháng cự (text)', demo: '21.20–21.60 | 22.00–22.80 | 23.10–24.00 | 22.50–24.20' },
      { label: '% còn tới hỗ trợ (±)', demo: '-15 | -18 | -22 | -25' },
      { label: '% còn tới kháng cự (±)', demo: '3 | 6 | 10 | 12' }
    ],
    render: function (input, ctx) {
      var c = U.columns(input.slice(0, 6));
      var h = (ctx && ctx.headers) || {};
      return '<div class="ifx-sr-hist-new">' +
        '<div class="ifx-tabs ifx-tabs-segmented ifx-sr-hist-tabs" role="tablist" data-ifx-sr-tabs>' +
          c[0].map(function (t, i) {
            return '<button type="button" class="ifx-tab' + (i === 0 ? ' is-active' : '') + '" role="tab" data-ifx-sr-tab="' + i + '">' + U.esc(t) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ifx-sr-hist-panel" data-ifx-sr-panel>' + panel(c, 0, h) + '</div>' +
      '</div>';
    },
    bind: function (root, input, ctx) {
      var c = U.columns(input.slice(0, 6));
      var h = (ctx && ctx.headers) || {};
      var tabs = root.querySelector('[data-ifx-sr-tabs]');
      var box = root.querySelector('[data-ifx-sr-panel]');
      if (!tabs || !box) return;
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-ifx-sr-tab]');
        if (!btn) return;
        tabs.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        box.innerHTML = panel(c, Number(btn.getAttribute('data-ifx-sr-tab')) || 0, h);
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
