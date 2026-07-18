/* Treemap layout — binary partition (diện tích ∝ weight, lấp đầy hình chữ nhật) */
(function (global) {
  'use strict';

  function sumWeights(list) {
    var s = 0;
    var i;
    for (i = 0; i < list.length; i++) s += Math.max(Number(list[i].weight) || 0, 1e-12);
    return s;
  }

  var REMAINDER_ID = '__heatmap_remainder__';
  var TAIL_THRESHOLD = 0.05;

  /**
   * Gộp phần đuôi heatmap: nếu tổng weight các mục còn lại ≤ 5% tổng vốn hóa
   * → thay bằng 1 ô "..." (không link, không trái tim, không màu tăng/giảm).
   * @param {Array<{weight:number}>} items
   * @param {number} [threshold=0.05]
   */
  function collapseHeatmapTail(items, threshold) {
    threshold = threshold == null ? TAIL_THRESHOLD : threshold;
    if (!items || !items.length) return [];

    var sorted = items.slice().sort(function (a, b) {
      return (b.weight || 0) - (a.weight || 0);
    });

    var total = sumWeights(sorted);
    if (total <= 0) return sorted;

    var kept = [];
    var i;
    for (i = 0; i < sorted.length; i++) {
      var tail = sorted.slice(i);
      var tailSum = sumWeights(tail);
      var tailRatio = tailSum / total;

      if (tailRatio <= threshold && tail.length > 1) {
        kept.push({
          id: REMAINDER_ID,
          name: '...',
          isRemainder: true,
          weight: tailSum,
          remainderCount: tail.length
        });
        return kept;
      }
      kept.push(sorted[i]);
    }
    return kept;
  }

  function isHeatmapRemainder(item) {
    return !!(item && (item.isRemainder || item.id === REMAINDER_ID));
  }

  function partition(items, x, y, w, h, out) {
    if (!items.length || w <= 0 || h <= 0) return;

    if (items.length === 1) {
      out.push({ x: x, y: y, width: w, height: h, item: items[0] });
      return;
    }

    var total = sumWeights(items);
    var half = total / 2;
    var acc = 0;
    var idx = 0;

    while (idx < items.length - 1 && acc < half) {
      acc += Math.max(Number(items[idx].weight) || 0, 1e-12);
      idx += 1;
    }

    if (idx <= 0) idx = 1;
    if (idx >= items.length) idx = items.length - 1;

    var left = items.slice(0, idx);
    var right = items.slice(idx);
    var leftSum = sumWeights(left);
    var horizontal = w >= h;

    if (horizontal) {
      var lw = (leftSum / total) * w;
      partition(left, x, y, lw, h, out);
      partition(right, x + lw, y, w - lw, h, out);
    } else {
      var lh = (leftSum / total) * h;
      partition(left, x, y, w, lh, out);
      partition(right, x, y + lh, w, h - lh, out);
    }
  }

  /**
   * @param {Array<{weight:number}>} items
   * @param {number} width
   * @param {number} height
   * @returns {Array<{x,y,width,height,item}>}
   */
  function layout(items, width, height) {
    if (!items.length || width <= 0 || height <= 0) return [];

    var sorted = items.slice().sort(function (a, b) {
      return (b.weight || 0) - (a.weight || 0);
    });

    var out = [];
    partition(sorted, 0, 0, width, height, out);
    return out;
  }

  global.IfluxSquarifiedTreemap = {
    layout: layout,
    collapseHeatmapTail: collapseHeatmapTail,
    isHeatmapRemainder: isHeatmapRemainder,
    REMAINDER_ID: REMAINDER_ID,
    TAIL_THRESHOLD: TAIL_THRESHOLD
  };
})(window);
