/**
 * IfxDropdown — data-ifx-toggle="dropdown"
 */
(function (global) {
  'use strict';
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-ifx-toggle="dropdown"]');
    if (trigger) {
      e.stopPropagation();
      var dd = trigger.closest('.ifx-dropdown');
      if (!dd) return;
      var open = dd.classList.contains('is-open');
      document.querySelectorAll('.ifx-dropdown.is-open').forEach(function (d) { d.classList.remove('is-open'); });
      if (!open) dd.classList.add('is-open');
      return;
    }
    document.querySelectorAll('.ifx-dropdown.is-open').forEach(function (d) { d.classList.remove('is-open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.ifx-dropdown.is-open').forEach(function (d) { d.classList.remove('is-open'); });
    }
  });
  global.IfxDropdown = {};
})(window);
