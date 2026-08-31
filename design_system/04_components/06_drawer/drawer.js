/**
 * IfxDrawer — open/close bằng class. Không set style inline.
 */
(function (global) {
  'use strict';
  function panel(id) { return document.getElementById(id); }
  function overlayOf(el) {
    var id = el && el.getAttribute('data-ifx-overlay');
    return id ? document.getElementById(id) : el && el.previousElementSibling;
  }
  function open(id) {
    var el = panel(id);
    if (!el) return;
    el.classList.add('is-open');
    var ov = overlayOf(el);
    if (ov) ov.classList.add('is-open');
  }
  function close(id) {
    var el = id ? panel(id) : document.querySelector('.ifx-drawer.is-open');
    if (!el) return;
    el.classList.remove('is-open');
    var ov = overlayOf(el);
    if (ov) ov.classList.remove('is-open');
  }
  function bind() {
    document.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-ifx-drawer]');
      if (openBtn) { open(openBtn.getAttribute('data-ifx-drawer')); return; }
      var dismiss = e.target.closest('[data-ifx-dismiss="drawer"]');
      if (dismiss) {
        var d = dismiss.closest('.ifx-drawer');
        if (d) close(d.id);
        return;
      }
      if (e.target.classList.contains('ifx-drawer-overlay')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }
  bind();
  global.IfxDrawer = { open: open, close: close };
})(window);
