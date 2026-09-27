/**
 * IfxChart — semantic token palette + internal SVG plots.
 * Không Apex. Theme change → paint + render.
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var gradSeq = 0;

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    return {
      primary: cs.getPropertyValue('--ifx-action-primary').trim(),
      secondary: cs.getPropertyValue('--ifx-action-secondary').trim(),
      success: cs.getPropertyValue('--ifx-success').trim(),
      warning: cs.getPropertyValue('--ifx-warning').trim(),
      danger: cs.getPropertyValue('--ifx-danger').trim(),
      info: cs.getPropertyValue('--ifx-info').trim(),
      muted: cs.getPropertyValue('--ifx-text-muted').trim(),
      grid: cs.getPropertyValue('--ifx-border-subtle').trim(),
      on: cs.getPropertyValue('--ifx-text-primary').trim()
    };
  }

  function fillsFrom(el) {
    var c = colors();
    var base = [c.primary, c.success, c.warning, c.danger, c.info, c.secondary];
    var extra = [];
    var cs = getComputedStyle(el);
    var i;
    for (i = 1; i <= 10; i++) {
      var v = cs.getPropertyValue('--ifx-chart-series-' + i).trim();
      if (v) extra.push(v);
    }
    return extra.length ? extra : base;
  }

  function paint(root) {
    var scope = root || document;
    var c = colors();
    var fills = [c.primary, c.success, c.warning, c.danger, c.info, c.secondary];
    scope.querySelectorAll('[data-ifx-chart-bar]').forEach(function (bar, i) {
      bar.style.setProperty('--ifx-chart-fill', fills[i % fills.length]);
    });
    scope.querySelectorAll('[data-ifx-chart-swatch]').forEach(function (el, i) {
      el.style.setProperty('--ifx-chart-fill', fills[i % fills.length]);
    });
    scope.querySelectorAll('[data-ifx-chart]').forEach(function (el) {
      try { render(el); } catch (err) {}
    });
  }

  function readData(el) {
    var node = el.querySelector('template[data-ifx-chart-data], script[type="application/json"]');
    if (!node) return null;
    var raw = '';
    if (node.content) raw = node.content.textContent;
    if (!raw) raw = node.textContent;
    if (!raw) raw = node.innerHTML;
    try { return JSON.parse((raw || '').trim()); } catch (e) { return null; }
  }

  function svgEl(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function ensurePlot(el) {
    var plot = el.querySelector('.ifx-chart-plot');
    if (!plot) {
      plot = document.createElement('div');
      plot.className = 'ifx-chart-plot';
      el.insertBefore(plot, el.firstChild);
    }
    plot.textContent = '';
    return plot;
  }

  function ensureLegend(el) {
    var legend = el.querySelector('.ifx-chart-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.className = 'ifx-chart-legend';
      el.appendChild(legend);
    }
    if (el.getAttribute('data-ifx-legend') === 'rail') {
      legend.classList.add('ifx-chart-legend-rail');
    }
    legend.textContent = '';
    return legend;
  }

  function writeLegend(el, items, fills) {
    var legend = ensureLegend(el);
    if (el.getAttribute('data-ifx-legend') === 'center') legend.classList.add('ifx-chart-legend-center');
    items.forEach(function (item, i) {
      var row = document.createElement('span');
      row.className = 'ifx-chart-legend-item';
      var sw = document.createElement('i');
      sw.className = 'ifx-chart-swatch';
      sw.style.setProperty('--ifx-chart-fill', fills[i % fills.length]);
      row.appendChild(sw);
      var name = document.createElement('span');
      name.className = 'ifx-chart-legend-name';
      name.textContent = item.name;
      row.appendChild(name);
      if (item.value != null) {
        var val = document.createElement('span');
        val.className = 'ifx-chart-legend-val';
        if (item.dir === 'up') val.classList.add('is-up');
        if (item.dir === 'down') val.classList.add('is-down');
        val.textContent = item.value;
        row.appendChild(val);
      }
      legend.appendChild(row);
    });
  }

  function extent(values) {
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    if (min === max) { min -= 1; max += 1; }
    var pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }

  /** Trục từ 0, bước tròn (1·2·2.5·5 × 10^n), tối đa 4 khoảng — data.baseline === 0. */
  function niceFromZero(values) {
    var max = Math.max.apply(null, values.concat([0]));
    if (max <= 0) return { min: 0, max: 1, ticks: 4 };
    var mag = Math.pow(10, Math.floor(Math.log10(max / 4)));
    var step = [1, 2, 2.5, 5, 10].map(function (k) { return k * mag; })
      .filter(function (s) { return Math.ceil(max / s) <= 4; })[0];
    var ticks = Math.ceil(max / step);
    return { min: 0, max: step * ticks, ticks: ticks };
  }

  function yAt(v, ext, top, h) {
    return top + (1 - (v - ext.min) / (ext.max - ext.min)) * h;
  }

  function grid(svg, ext, left, top, w, h, c) {
    var i, n = ext.ticks || 4;
    for (i = 0; i <= n; i++) {
      var y = top + (h * i) / n;
      svg.appendChild(svgEl('line', {
        x1: left, x2: left + w, y1: y, y2: y,
        stroke: c.grid, 'stroke-dasharray': '4 4', 'stroke-width': '1'
      }));
    }
  }

  function yLabels(svg, ext, left, top, h, c) {
    var i, n = ext.ticks || 4;
    for (i = 0; i <= n; i++) {
      var v = ext.max - ((ext.max - ext.min) * i) / n;
      var y = top + (h * i) / n;
      var t = svgEl('text', {
        x: left - 6, y: y, fill: c.muted, 'font-size': '10',
        'text-anchor': 'end', 'dominant-baseline': 'middle'
      });
      t.textContent = Math.abs(v) >= 100 ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1);
      svg.appendChild(t);
    }
  }

  function linePath(vals, left, w, top, h, ext, straight) {
    var pts = vals.map(function (v, i) {
      return [
        left + (vals.length === 1 ? w / 2 : (w * i) / (vals.length - 1)),
        yAt(v, ext, top, h)
      ];
    });
    if (straight || pts.length < 3) {
      return pts.map(function (p, i) {
        return (i ? 'L ' : 'M ') + p[0] + ' ' + p[1];
      }).join(' ');
    }
    var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
    var i;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += ' C ' +
        (p1[0] + (p2[0] - p0[0]) / 6) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6) + ' ' +
        p2[0] + ' ' + p2[1];
    }
    return d;
  }

  function xLabels(svg, labels, left, top, w, h, c) {
    if (!labels || !labels.length) return;
    var step = Math.max(1, Math.ceil(labels.length / Math.max(1, Math.floor(w / 44))));
    labels.forEach(function (lab, i) {
      if (i % step && i !== labels.length - 1) return;
      var x = left + (labels.length === 1 ? w / 2 : (w * i) / (labels.length - 1));
      var t = svgEl('text', {
        x: x, y: top + h + 14, fill: c.muted, 'font-size': '10',
        /* Nhãn đầu/cuối neo vào mép để không bị cắt. */
        'text-anchor': labels.length > 1 && i === labels.length - 1 ? 'end' : 'middle'
      });
      t.textContent = lab;
      svg.appendChild(t);
    });
  }

  function mountSvg(plot, w, h) {
    var svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'none' });
    plot.appendChild(svg);
    return svg;
  }

  function drawLine(el, data, filled) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(240, box.width || 400);
    var H = Math.max(96, box.height || 160);
    var left = 36, right = 8, top = 8, bottom = 22;
    var w = W - left - right, h = H - top - bottom;
    var c = colors();
    var fills = fillsFrom(el);
    var series = data.series || [];
    var labels = data.labels || [];
    var all = [];
    series.forEach(function (s) { (s.values || []).forEach(function (v) { all.push(v); }); });
    if (!all.length) return;
    var ext = data.baseline === 0 ? niceFromZero(all) : extent(all);
    var straight = data.curve === 'straight';
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    grid(svg, ext, left, top, w, h, c);
    yLabels(svg, ext, left, top, h, c);
    series.forEach(function (s, si) {
      var vals = s.values || [];
      /* s.tone = màu ngữ nghĩa (primary · info …) hoặc bảng chart (chart-1 … chart-10). */
      var color = toneColor(el, c, s.tone) || fills[si % fills.length];
      fills[si] = color;
      var d = linePath(vals, left, w, top, h, ext, straight);
      if (filled && vals.length) {
        var x0 = left;
        var x1 = left + w;
        var area = d + ' L ' + x1 + ' ' + (top + h) + ' L ' + x0 + ' ' + (top + h) + ' Z';
        var paint = { fill: color, 'fill-opacity': '0.22' };
        if (data.fill === 'gradient') {
          var id = 'ifx-chart-grad-' + (++gradSeq);
          var lg = svgEl('linearGradient', { id: id, x1: '0', y1: '0', x2: '0', y2: '1' });
          lg.appendChild(svgEl('stop', { offset: '0', 'stop-color': color, 'stop-opacity': '0.35' }));
          lg.appendChild(svgEl('stop', { offset: '0.9', 'stop-color': color, 'stop-opacity': '0.05' }));
          svg.appendChild(lg);
          paint = { fill: 'url(#' + id + ')' };
        }
        paint.d = area;
        paint.stroke = 'none';
        svg.appendChild(svgEl('path', paint));
      }
      svg.appendChild(svgEl('path', {
        d: d, fill: 'none', stroke: color, 'stroke-width': '2',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    });
    xLabels(svg, labels, left, top, w, h, c);
    writeLegend(el, series.map(function (s) {
      var last = (s.values || [])[(s.values || []).length - 1];
      var first = (s.values || [])[0];
      var dir = last > first ? 'up' : (last < first ? 'down' : '');
      if (data.legendValues === false) return { name: s.name || '', value: null };
      return { name: s.name || '', value: last != null ? last : null, dir: dir };
    }), fills);
  }

  function drawGroup(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(240, box.width || 400);
    var H = Math.max(96, box.height || 160);
    var left = 36, right = 8, top = 8, bottom = 22;
    var w = W - left - right, h = H - top - bottom;
    var c = colors();
    var fills = fillsFrom(el);
    var series = data.series || [];
    var labels = data.labels || [];
    var n = labels.length || (series[0] && series[0].values.length) || 0;
    var all = [];
    series.forEach(function (s) { (s.values || []).forEach(function (v) { all.push(v); }); });
    if (!n || !all.length) return;
    var ext = { min: 0, max: Math.max.apply(null, all) * 1.08 };
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    grid(svg, ext, left, top, w, h, c);
    yLabels(svg, ext, left, top, h, c);
    var slot = w / n;
    var bw = Math.max(4, (slot * 0.7) / series.length);
    labels.forEach(function (lab, i) {
      series.forEach(function (s, si) {
        var v = (s.values || [])[i] || 0;
        var x = left + slot * i + slot * 0.15 + si * bw;
        var y = yAt(v, ext, top, h);
        svg.appendChild(svgEl('rect', {
          x: x, y: y, width: bw - 1, height: Math.max(0, top + h - y),
          fill: fills[si % fills.length], rx: '2'
        }));
      });
      var t = svgEl('text', {
        x: left + slot * i + slot / 2, y: top + h + 14,
        fill: c.muted, 'font-size': '10', 'text-anchor': 'middle'
      });
      t.textContent = lab;
      svg.appendChild(t);
    });
    writeLegend(el, series.map(function (s) { return { name: s.name || '' }; }), fills);
  }

  function polar(cx, cy, r, a) {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  /** Màu theo tên: ngữ nghĩa (primary…) → token --ifx-<tone> → bảng --ifx-color-<tone>. */
  function toneColor(el, c, tone) {
    if (!tone) return '';
    if (c[tone]) return c[tone];
    var cs = getComputedStyle(el);
    return cs.getPropertyValue('--ifx-' + tone).trim() || cs.getPropertyValue('--ifx-color-' + tone).trim();
  }

  /**
   * Radar — data: { labels, labelTones?, max? (100), ticks? (4), series: [{ name, tone, values }] }.
   * Trục bắt đầu 12h, theo chiều kim đồng hồ; điểm 0 không vẽ marker.
   */
  function drawRadar(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(200, box.width || 280);
    var H = Math.max(200, box.height || 280);
    var c = colors();
    var fills = fillsFrom(el);
    var labels = data.labels || [];
    var n = labels.length;
    if (n < 3) return;
    var max = data.max || 100;
    var ticks = data.ticks || 4;
    var cx = W / 2, cy = H / 2;
    var R = Math.min(W, H) / 2 - 28;
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    function pt(i, r) {
      var a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    var i, k;
    for (k = 1; k <= ticks; k++) {
      var rr = (R * k) / ticks;
      var ring = [];
      for (i = 0; i < n; i++) ring.push(pt(i, rr).join(','));
      svg.appendChild(svgEl('polygon', { points: ring.join(' '), fill: 'none', stroke: c.grid, 'stroke-width': '1' }));
      var tl = svgEl('text', { x: cx, y: cy - rr, fill: c.muted, 'font-size': '10', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      tl.textContent = Math.round((max * k) / ticks);
      svg.appendChild(tl);
    }
    for (i = 0; i < n; i++) {
      var e = pt(i, R);
      svg.appendChild(svgEl('line', { x1: cx, y1: cy, x2: e[0], y2: e[1], stroke: c.grid, 'stroke-width': '1' }));
      var lp = pt(i, R + 14);
      var dx = lp[0] - cx;
      var lab = svgEl('text', {
        x: lp[0], y: lp[1], 'font-size': '10', 'dominant-baseline': 'middle',
        fill: toneColor(el, c, (data.labelTones || [])[i]) || c.muted,
        'text-anchor': Math.abs(dx) < 4 ? 'middle' : (dx > 0 ? 'start' : 'end')
      });
      lab.textContent = labels[i];
      svg.appendChild(lab);
    }
    var surface = getComputedStyle(el).getPropertyValue('--ifx-bg-surface').trim() || c.on;
    (data.series || []).forEach(function (s, si) {
      var color = toneColor(el, c, s.tone) || fills[si % fills.length];
      var vals = s.values || [];
      var pts = vals.map(function (v, j) { return pt(j, (R * Math.max(0, Math.min(max, v))) / max); });
      svg.appendChild(svgEl('polygon', {
        points: pts.map(function (p) { return p.join(','); }).join(' '),
        fill: color, 'fill-opacity': '0.2', stroke: color, 'stroke-width': '2', 'stroke-linejoin': 'round'
      }));
      pts.forEach(function (p, j) {
        if (!vals[j]) return;
        svg.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: '4', fill: color, stroke: surface, 'stroke-width': '2' }));
      });
    });
  }

  function drawDonut(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(200, box.width || 280);
    var H = Math.max(160, box.height || 220);
    var c = colors();
    var fills = fillsFrom(el);
    var labels = data.labels || [];
    var values = data.values || (data.series && data.series[0] && data.series[0].values) || [];
    var total = values.reduce(function (a, b) { return a + b; }, 0) || 1;
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    var cx = W / 2, cy = H / 2 - 4;
    var r = Math.min(W, H) * 0.32;
    var r0 = r * 0.62;
    var a = -Math.PI / 2;
    values.forEach(function (v, i) {
      var slice = (v / total) * Math.PI * 2;
      var a2 = a + slice;
      var p1 = polar(cx, cy, r, a);
      var p2 = polar(cx, cy, r, a2);
      var p3 = polar(cx, cy, r0, a2);
      var p4 = polar(cx, cy, r0, a);
      var large = slice > Math.PI ? 1 : 0;
      var d = 'M ' + p1[0] + ' ' + p1[1] +
        ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0] + ' ' + p2[1] +
        ' L ' + p3[0] + ' ' + p3[1] +
        ' A ' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + p4[0] + ' ' + p4[1] + ' Z';
      svg.appendChild(svgEl('path', { d: d, fill: fills[i % fills.length] }));
      a = a2;
    });
    writeLegend(el, labels.map(function (name, i) {
      return { name: name, value: values[i] };
    }), fills);
  }

  function drawRadial(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(200, box.width || 280);
    var H = Math.max(160, box.height || 220);
    var c = colors();
    var fills = fillsFrom(el);
    var labels = data.labels || [];
    var values = data.values || [];
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    var cx = W / 2, cy = H / 2 - 6;
    var maxR = Math.min(W, H) * 0.36;
    values.forEach(function (v, i) {
      var r = maxR - i * (maxR / (values.length + 0.4));
      var pct = Math.max(0, Math.min(100, v)) / 100;
      svg.appendChild(svgEl('circle', {
        cx: cx, cy: cy, r: r, fill: 'none',
        stroke: c.grid, 'stroke-width': '8'
      }));
      var circ = 2 * Math.PI * r;
      var arc = svgEl('circle', {
        cx: cx, cy: cy, r: r, fill: 'none',
        stroke: fills[i % fills.length], 'stroke-width': '8',
        'stroke-linecap': 'round',
        'stroke-dasharray': (circ * pct) + ' ' + circ,
        transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
      });
      svg.appendChild(arc);
    });
    writeLegend(el, labels.map(function (name, i) {
      return { name: name, value: values[i] + '%' };
    }), fills);
  }

  function drawScatter(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(240, box.width || 400);
    var H = Math.max(96, box.height || 160);
    var left = 36, right = 8, top = 8, bottom = 22;
    var w = W - left - right, h = H - top - bottom;
    var c = colors();
    var fills = fillsFrom(el);
    var series = data.series || [];
    var xs = [], ys = [];
    series.forEach(function (s) {
      (s.points || []).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    });
    if (!xs.length) return;
    var ex = extent(xs), ey = extent(ys);
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    grid(svg, ey, left, top, w, h, c);
    yLabels(svg, ey, left, top, h, c);
    series.forEach(function (s, si) {
      (s.points || []).forEach(function (p) {
        var x = left + ((p[0] - ex.min) / (ex.max - ex.min)) * w;
        var y = yAt(p[1], ey, top, h);
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: '3.5', fill: fills[si % fills.length] }));
      });
    });
    writeLegend(el, series.map(function (s) { return { name: s.name || '' }; }), fills);
  }

  function drawHeatmap(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(240, box.width || 400);
    var H = Math.max(96, box.height || 160);
    var left = 28, right = 4, top = 4, bottom = 18;
    var rows = data.y || data.rows || [];
    var cols = data.x || data.labels || [];
    var gridV = data.values || [];
    var c = colors();
    var fill = fillsFrom(el)[0];
    var max = 1;
    gridV.forEach(function (row) {
      row.forEach(function (v) { if (v > max) max = v; });
    });
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    var cw = (W - left - right) / Math.max(1, cols.length);
    var rh = (H - top - bottom) / Math.max(1, rows.length);
    rows.forEach(function (lab, r) {
      var t = svgEl('text', {
        x: left - 4, y: top + r * rh + rh / 2,
        fill: c.muted, 'font-size': '9', 'text-anchor': 'end', 'dominant-baseline': 'middle'
      });
      t.textContent = lab;
      svg.appendChild(t);
      (gridV[r] || []).forEach(function (v, ci) {
        svg.appendChild(svgEl('rect', {
          x: left + ci * cw + 1, y: top + r * rh + 1,
          width: Math.max(1, cw - 2), height: Math.max(1, rh - 2),
          fill: fill, 'fill-opacity': String(0.12 + 0.88 * (v / max)),
          rx: '2'
        }));
      });
    });
    var step = Math.max(1, Math.ceil(cols.length / 6));
    cols.forEach(function (lab, ci) {
      if (ci % step && ci !== cols.length - 1) return;
      var t = svgEl('text', {
        x: left + ci * cw + cw / 2, y: H - 4,
        fill: c.muted, 'font-size': '9', 'text-anchor': 'middle'
      });
      t.textContent = lab;
      svg.appendChild(t);
    });
  }

  function drawCandle(el, data) {
    var plot = ensurePlot(el);
    var box = plot.getBoundingClientRect();
    var W = Math.max(240, box.width || 400);
    var H = Math.max(96, box.height || 160);
    var left = 44, right = 8, top = 8, bottom = 8;
    var w = W - left - right, h = H - top - bottom;
    var c = colors();
    var ohlc = data.ohlc || [];
    var all = [];
    ohlc.forEach(function (k) { all.push(k[1], k[2]); });
    if (!all.length) return;
    var ext = extent(all);
    el.classList.add('is-plot');
    var svg = mountSvg(plot, W, H);
    grid(svg, ext, left, top, w, h, c);
    yLabels(svg, ext, left, top, h, c);
    var slot = w / ohlc.length;
    ohlc.forEach(function (k, i) {
      var o = k[0], hi = k[1], lo = k[2], cl = k[3];
      var up = cl >= o;
      var color = up ? c.success : c.danger;
      var x = left + slot * i + slot / 2;
      var yH = yAt(hi, ext, top, h);
      var yL = yAt(lo, ext, top, h);
      var yO = yAt(o, ext, top, h);
      var yC = yAt(cl, ext, top, h);
      svg.appendChild(svgEl('line', {
        x1: x, x2: x, y1: yH, y2: yL, stroke: color, 'stroke-width': '1'
      }));
      var topB = Math.min(yO, yC);
      var hB = Math.max(1, Math.abs(yC - yO));
      svg.appendChild(svgEl('rect', {
        x: x - slot * 0.28, y: topB, width: slot * 0.56, height: hB, fill: color
      }));
    });
  }

  function render(el) {
    var type = (el.getAttribute('data-ifx-chart') || '').trim();
    if (!type) return;
    var data = readData(el);
    if (!data) return;
    if (type === 'area') drawLine(el, data, true);
    else if (type === 'line') drawLine(el, data, false);
    else if (type === 'group') drawGroup(el, data);
    else if (type === 'donut') drawDonut(el, data);
    else if (type === 'radar') drawRadar(el, data);
    else if (type === 'radial') drawRadial(el, data);
    else if (type === 'scatter') drawScatter(el, data);
    else if (type === 'heatmap') drawHeatmap(el, data);
    else if (type === 'candle') drawCandle(el, data);
    else if (type === 'volume') drawGroup(el, {
      labels: data.labels || [],
      series: data.series || [{ name: 'Vol', values: data.values || [] }]
    });
  }

  function init(root) {
    paint(root);
    window.addEventListener('ifx-theme-change', function () { paint(root); });
    window.addEventListener('resize', function () { paint(root); });
  }

  global.IfxChart = { colors: colors, paint: paint, render: render, init: init };
})(window);
