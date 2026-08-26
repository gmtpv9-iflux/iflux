/**
 * IfxWizard — data-ifx-wizard, data-ifx-wizard-next|prev|submit
 */
(function (global) {
  'use strict';
  function init(root) {
    var wrap = root || document.querySelector('[data-ifx-wizard]');
    if (!wrap) return;
    var step = 0;
    var items = wrap.querySelectorAll('.ifx-wizard-step');
    var panels = wrap.querySelectorAll('.ifx-wizard-panel');
    function paint() {
      items.forEach(function (item, i) {
        item.classList.toggle('is-active', i === step);
        item.classList.toggle('is-done', i < step);
      });
      panels.forEach(function (p, i) { p.classList.toggle('is-active', i === step); });
    }
    wrap.querySelectorAll('[data-ifx-wizard-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (step < items.length - 1) { step += 1; paint(); }
      });
    });
    wrap.querySelectorAll('[data-ifx-wizard-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (step > 0) { step -= 1; paint(); }
      });
    });
    wrap.querySelectorAll('[data-ifx-wizard-submit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (global.IfxToast) global.IfxToast.show('Đã lưu (demo generic)', 'success');
      });
    });
    items.forEach(function (item, i) {
      item.addEventListener('click', function () {
        if (i <= step) { step = i; paint(); }
      });
    });
    paint();
  }
  global.IfxWizard = { init: init };
})(window);
