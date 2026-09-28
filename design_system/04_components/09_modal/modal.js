/**
 * IfxModal — class .is-open. API IfxModal.open/close. data-ifx-modal / data-ifx-dismiss.
 */
(function (global) {
  'use strict';
  function open(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('is-open');
  }
  function close(id) {
    var el = id ? document.getElementById(id) : document.querySelector('.ifx-modal-overlay.is-open');
    if (el) el.classList.remove('is-open');
  }
  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-ifx-modal]');
    if (openBtn) { open(openBtn.getAttribute('data-ifx-modal')); return; }
    var dismiss = e.target.closest('[data-ifx-dismiss="modal"]');
    if (dismiss) {
      var m = dismiss.closest('.ifx-modal-overlay');
      if (m) close(m.id);
      return;
    }
    if (e.target.classList.contains('ifx-modal-overlay')) close(e.target.id);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
  global.IfxModal = { open: open, close: close };
})(window);
