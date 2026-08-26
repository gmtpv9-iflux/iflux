/**
 * Playground preview — chạy BÊN TRONG iframe.
 * JS chỉ đo + báo cáo viewport/breakpoint cho shell.
 * Layout responsive = CSS foundation/layout.css.
 */
(function () {
  'use strict';
  var bps = window.IFX_BREAKPOINTS || { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1440 };

  function activeBpId(w) {
    var active = 'base';
    Object.keys(bps).forEach(function (id) { if (w >= bps[id]) active = id; });
    return active;
  }

  function setText(id, text) {
    var n = document.getElementById(id);
    if (n) n.textContent = text;
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
    var demo = document.querySelector('.sb-pg-container-demo');
    var pad = demo ? parseFloat(getComputedStyle(demo).paddingLeft) : 0;
    setText('pgTokContainer', getComputedStyle(document.documentElement).getPropertyValue('--ifx-space-container').trim());
    setText('pgTokGutter', getComputedStyle(document.documentElement).getPropertyValue('--ifx-grid-gutter').trim());
    setText('pgTokSection', getComputedStyle(document.documentElement).getPropertyValue('--ifx-space-section').trim());
    if (demo) setText('pgContainerPad', getComputedStyle(demo).paddingLeft);
    return {
      type: 'ifx-pg-metrics',
      width: w,
      breakpoint: active,
      label: active === 'base' ? 'BASE (< ' + bps.sm + 'px)' : active + ' (≥ ' + bps[active] + 'px)',
      cols: cols,
      direction: abc ? getComputedStyle(abc).flexDirection : '',
      pad: pad,
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
    if (!e.data || e.data.type !== 'ifx-theme') return;
    if (window.IfxTheme) window.IfxTheme.apply(e.data.theme);
    report();
  });

  if (window.IfxTheme) window.IfxTheme.apply(window.IfxTheme.get());
  window.addEventListener('resize', report);
  window.addEventListener('load', report);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(report);
  report();
})();
