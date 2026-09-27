/**
 * IfxTreemap — xếp ô theo trọng số (chia đôi tổng trọng số, cắt theo chiều dài hơn) và gắn vào khung.
 *   IfxTreemap.mount(el, items, { tile: function (item, tier) { return html } })
 *   items: [{ weight, direction: 'up'|'down'|'ref', … }]; tier: 'tiny'|'small'|'medium'|'large'.
 * Tự vẽ lại khi khung đổi kích thước.
 */
(function (global) {
  'use strict';
  var GAP = 2;

  function weightOf(it) { return Math.max(Number(it.weight) || 0, 1e-12); }
  function sum(list) { return list.reduce(function (s, it) { return s + weightOf(it); }, 0); }

  function partition(items, x, y, w, h, out) {
    if (!items.length || w <= 0 || h <= 0) return;
    if (items.length === 1) { out.push({ x: x, y: y, width: w, height: h, item: items[0] }); return; }
    var total = sum(items), acc = 0, idx = 0;
    while (idx < items.length - 1 && acc < total / 2) { acc += weightOf(items[idx]); idx += 1; }
    idx = Math.min(Math.max(idx, 1), items.length - 1);
    var left = items.slice(0, idx), right = items.slice(idx), share = sum(left) / total;
    if (w >= h) {
      partition(left, x, y, share * w, h, out);
      partition(right, x + share * w, y, w - share * w, h, out);
    } else {
      partition(left, x, y, w, share * h, out);
      partition(right, x, y + share * h, w, h - share * h, out);
    }
  }

  function layout(items, width, height) {
    if (!items.length || width <= 0 || height <= 0) return [];
    var out = [];
    partition(items.slice().sort(function (a, b) { return weightOf(b) - weightOf(a); }), 0, 0, width, height, out);
    return out;
  }

  function tier(w, h) {
    var area = w * h;
    if (area < 900 || w < 32 || h < 24) return 'tiny';
    if (w < 48 || h < 32) return 'small';
    if (area >= 8000) return 'large';
    if (area >= 2500) return 'medium';
    return 'small';
  }

  function mount(el, items, opts) {
    if (!el) return;
    opts = opts || {};
    function paint() {
      if (!el.isConnected) return;
      var w = el.clientWidth, h = el.clientHeight;
      if (w < 40 || h < 40) { setTimeout(paint, 80); return; }
      el.innerHTML = layout(items, w, h).map(function (r) {
        var t = tier(r.width, r.height);
        return '<div class="ifx-treemap-tile-new' + (t === 'tiny' ? ' is-tiny' : '') + '" style="left:' + r.x + 'px;top:' + r.y +
          'px;width:' + Math.max(0, r.width - GAP) + 'px;height:' + Math.max(0, r.height - GAP) + 'px">' +
          (opts.tile ? opts.tile(r.item, t) : '') + '</div>';
      }).join('');
    }
    paint();
    if (typeof ResizeObserver !== 'undefined' && !el._ifxTreemapRO) {
      el._ifxTreemapRO = new ResizeObserver(paint);
      el._ifxTreemapRO.observe(el);
    }
  }

  /** Trạng thái thị trường theo % (ngưỡng ±0.08 như bảng giá). */
  function direction(p) { return p > 0.08 ? 'up' : p < -0.08 ? 'down' : 'ref'; }

  global.IfxTreemap = { layout: layout, mount: mount, direction: direction };
})(typeof window !== 'undefined' ? window : globalThis);
