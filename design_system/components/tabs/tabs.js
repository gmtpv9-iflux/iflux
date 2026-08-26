/**
 * IfxTabs — [data-ifx-tabs] > .ifx-tab[data-ifx-tab] + .ifx-tab-panel[data-ifx-panel]
 */
(function (global) {
  'use strict';
  function init(root) {
    var wrap = root || document.querySelector('[data-ifx-tabs]');
    if (!wrap) return;
    var root = wrap.closest('[data-ifx-tabs-root]') || wrap.parentElement;
    wrap.addEventListener('click', function (e) {
      var tab = e.target.closest('.ifx-tab');
      if (!tab || !wrap.contains(tab)) return;
      var id = tab.getAttribute('data-ifx-tab');
      wrap.querySelectorAll('.ifx-tab').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      root.querySelectorAll('[data-ifx-panel]').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-ifx-panel') === id);
      });
    });
  }
  global.IfxTabs = { init: init };
})(window);
