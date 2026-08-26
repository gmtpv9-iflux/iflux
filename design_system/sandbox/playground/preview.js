/**
 * Playground preview — chạy BÊN TRONG iframe.
 * JS chỉ: nhận span từ shell, đo + báo cáo.
 * Layout / width = CSS foundation/layout.css.
 */
(function () {
  'use strict';
  var bps = window.IFX_BREAKPOINTS || { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1440 };
  var span = 6;
  var NOMINAL = {
    1: '8.333%', 2: '16.667%', 3: '25%', 4: '33.333%', 5: '41.667%',
    6: '50%', 7: '58.333%', 8: '66.667%', 9: '75%', 10: '83.333%',
    11: '91.667%', 12: '100%'
  };

  function activeBpId(w) {
    var active = 'base';
    Object.keys(bps).forEach(function (id) { if (w >= bps[id]) active = id; });
    return active;
  }

  function setText(id, text) {
    var n = document.getElementById(id);
    if (n) n.textContent = text;
  }

  function applySpan(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 12)) n = 6;
    span = n;
    var cell = document.getElementById('pgSpanCell');
    var rest = document.getElementById('pgSpanRest');
    if (cell) {
      cell.className = 'ifx-col-' + n + ' sb-pg-cell sb-pg-span-fill';
      cell.textContent = n + '/12';
    }
    if (rest) {
      if (n >= 12) {
        rest.hidden = true;
      } else {
        rest.hidden = false;
        rest.className = 'ifx-col-' + (12 - n) + ' sb-pg-cell sb-pg-span-rest';
        rest.textContent = 'phần còn lại ' + (12 - n) + '/12';
      }
    }
    var ticks = document.querySelectorAll('#pgRuler > i');
    ticks.forEach(function (el, i) {
      el.classList.toggle('is-on', i < n);
    });
    setText('pgSpanClass', '.ifx-col-' + n);
    setText('pgSpanShare', n + '/12 = ' + NOMINAL[n]);
  }

  function boxMetrics(el, inner) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    var padL = parseFloat(cs.paddingLeft);
    var padR = parseFloat(cs.paddingRight);
    var innerW = inner ? inner.getBoundingClientRect().width : (r.width - padL - padR);
    return {
      outer: Math.round(r.width * 10) / 10,
      gutterL: padL,
      gutterR: padR,
      content: Math.round(innerW * 10) / 10,
      left: r.left
    };
  }

  function metrics() {
    var w = window.innerWidth;
    var active = activeBpId(w);
    var cells = document.querySelectorAll('.sb-pg-grid > .sb-pg-cell');
    var firstTop = cells[0] ? cells[0].getBoundingClientRect().top : 0;
    var cols = 0;
    cells.forEach(function (c) {
      if (Math.abs(c.getBoundingClientRect().top - firstTop) < 1) cols += 1;
    });
    var abc = document.querySelector('.sb-pg-abc');
    var fluid = boxMetrics(document.getElementById('pgFluid'), document.getElementById('pgFluidInner'));
    var maxb = boxMetrics(document.getElementById('pgMax'), document.getElementById('pgMaxInner'));
    var grid = document.getElementById('pgSpanGrid');
    var cell = document.getElementById('pgSpanCell');
    var gridW = grid ? grid.getBoundingClientRect().width : 0;
    var cellW = cell ? cell.getBoundingClientRect().width : 0;
    var ofGrid = gridW ? (cellW / gridW) * 100 : 0;
    if (cellW) setText('pgSpanPx', Math.round(cellW) + 'px');
    if (ofGrid) setText('pgSpanPct', ofGrid.toFixed(1) + '%');
    setText('pgTokContainer', getComputedStyle(document.documentElement).getPropertyValue('--ifx-space-container').trim());
    setText('pgTokGutter', getComputedStyle(document.documentElement).getPropertyValue('--ifx-grid-gutter').trim());
    setText('pgTokSection', getComputedStyle(document.documentElement).getPropertyValue('--ifx-space-section').trim());
    if (fluid) {
      document.getElementById('pgFluidInner').textContent =
        'CONTENT  ' + fluid.content + 'px  ·  ' + (fluid.content / w * 100).toFixed(1) + '% viewport';
    }
    if (maxb) {
      document.getElementById('pgMaxInner').textContent =
        'CONTENT  ' + maxb.content + 'px  ·  outer ' + maxb.outer + 'px';
    }
    return {
      type: 'ifx-pg-metrics',
      width: w,
      breakpoint: active,
      label: active === 'base' ? 'BASE (< ' + bps.sm + 'px)' : active + ' (≥ ' + bps[active] + 'px)',
      cols: cols,
      direction: abc ? getComputedStyle(abc).flexDirection : '',
      pad: fluid ? fluid.gutterL : 0,
      span: span,
      spanClass: 'ifx-col-' + span,
      spanPx: Math.round(cellW * 10) / 10,
      spanOfGrid: Math.round(ofGrid * 10) / 10,
      spanNominal: NOMINAL[span],
      fluid: fluid,
      max: maxb,
      maxOuterMargin: maxb ? Math.round(maxb.left * 10) / 10 : 0,
      fluidRatio: fluid ? Math.round((fluid.content / w) * 1000) / 10 : 0,
      maxRatio: maxb ? Math.round((maxb.content / w) * 1000) / 10 : 0,
      height: document.documentElement.scrollHeight
    };
  }

  function report() {
    var m = metrics();
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(m, '*');
    }
  }

  window.addEventListener('message', function (e) {
    if (!e.data) return;
    if (e.data.type === 'ifx-theme' && window.IfxTheme) {
      window.IfxTheme.apply(e.data.theme);
    }
    if (e.data.type === 'ifx-pg-span') applySpan(e.data.span);
    report();
  });

  applySpan(span);
  if (window.IfxTheme) window.IfxTheme.apply(window.IfxTheme.get());
  window.addEventListener('resize', report);
  window.addEventListener('load', report);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(report);
  report();
})();
