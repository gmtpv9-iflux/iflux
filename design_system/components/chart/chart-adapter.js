/**
 * IfxChart — màu từ semantic token. Đổi theme → repaint.
 * Nếu window.ApexCharts có mặt, apply palette; không thì CSS bars (--ifx-chart-fill).
 */
(function (global) {
  'use strict';
  function colors() {
    var cs = getComputedStyle(document.documentElement);
    return {
      primary: cs.getPropertyValue('--ifx-action-primary').trim(),
      secondary: cs.getPropertyValue('--ifx-action-secondary').trim(),
      success: cs.getPropertyValue('--ifx-success').trim(),
      warning: cs.getPropertyValue('--ifx-warning').trim(),
      danger: cs.getPropertyValue('--ifx-danger').trim(),
      info: cs.getPropertyValue('--ifx-info').trim()
    };
  }
  function paint(root) {
    var c = colors();
    var fills = [c.primary, c.success, c.warning, c.danger, c.info, c.secondary];
    (root || document).querySelectorAll('[data-ifx-chart-bar]').forEach(function (bar, i) {
      bar.style.setProperty('--ifx-chart-fill', fills[i % fills.length]);
    });
    (root || document).querySelectorAll('[data-ifx-chart-swatch]').forEach(function (el, i) {
      el.style.setProperty('--ifx-chart-fill', fills[i % fills.length]);
    });
  }
  function init(root) {
    paint(root);
    window.addEventListener('ifx-theme-change', function () { paint(root); });
  }
  global.IfxChart = { colors: colors, paint: paint, init: init };
})(window);
