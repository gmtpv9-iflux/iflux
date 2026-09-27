/**
 * TMP-NET-SUBJECT — Top đối xứng hai phía theo nhóm (tabs).
 * Đầu vào: [0] nhóm · [1] nhãn trái · [2] giá trị trái · [3] nhãn phải · [4] giá trị phải.
 * ctx.headers: { left, right } — tiêu đề hai cột (mặc định Top bên trái / Top bên phải).
 */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  if (!T) return;
  var U = T.util;

  function side(kind, label, value, max) {
    if (!label) return '<div class="ifx-flow-split-side is-' + kind + '"></div>';
    return '<div class="ifx-flow-split-side is-' + kind + '"><div class="ifx-flow-split-bar" style="width:' +
      Math.round((value / max) * 100) + '%"><span class="ifx-flow-split-val">' + U.esc(String(value)) + '</span></div></div>';
  }
  function ticker(kind, label) {
    return label
      ? '<a class="ifx-flow-split-ticker is-' + kind + '" href="#" title="' + U.esc(label) + '">' + U.esc(label) + '</a>'
      : '<span class="ifx-flow-split-ticker is-' + kind + ' is-empty">—</span>';
  }

  T.define('TMP-NET-SUBJECT', {
    inputs: [
      { label: 'Nhóm (tabs)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' },
      { label: 'Nhãn bên trái', demo: 'Mục T1 | Mục T2 | Mục T3 | Mục T4 | Mục T5' },
      { label: 'Giá trị bên trái', demo: '320 | 240 | 180 | 120 | 80' },
      { label: 'Nhãn bên phải', demo: 'Mục P1 | Mục P2 | Mục P3 | Mục P4 | Mục P5' },
      { label: 'Giá trị bên phải', demo: '300 | 210 | 160 | 110 | 70' }
    ],
    render: function (input, ctx) {
      var h = (ctx && ctx.headers) || {};
      var tabs = U.list(input[0]);
      var c = U.columns([input[1], input[2], input[3], input[4]]);
      var lv = c[1].map(U.num), rv = c[3].map(U.num);
      var lmax = Math.max.apply(null, lv.concat([1])), rmax = Math.max.apply(null, rv.concat([1]));
      return (tabs.length ? '<div class="ifx-tabs ifx-tabs-segmented" role="tablist" data-ifx-net-tabs>' + tabs.map(function (t, i) {
          return '<button type="button" class="ifx-tab' + (i === 0 ? ' is-active' : '') + '" role="tab">' + U.esc(t) + '</button>';
        }).join('') + '</div>' : '') +
        '<div class="ifx-flow-split-new">' +
          '<div class="ifx-flow-split-head">' +
            '<div><span class="ifx-flow-split-dot is-in"></span>' + U.esc(h.left || 'Top bên trái') + '</div>' +
            '<div>Bên trái</div><div>Bên phải</div>' +
            '<div><span class="ifx-flow-split-dot is-out"></span>' + U.esc(h.right || 'Top bên phải') + '</div>' +
          '</div>' +
          c[0].map(function (l, i) {
            return '<div class="ifx-flow-split-row">' +
              side('in', l, lv[i], lmax) + ticker('in', l) + ticker('out', c[2][i]) + side('out', c[2][i], rv[i], rmax) +
            '</div>';
          }).join('') +
        '</div>';
    },
    bind: function (root) {
      var tabs = root.querySelector('[data-ifx-net-tabs]');
      if (!tabs) return;
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.ifx-tab');
        if (btn) tabs.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
