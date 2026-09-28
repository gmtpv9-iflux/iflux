/**
 * User Web — hỏi xác nhận trước khi chuyển khách sang trang đăng nhập.
 * Nạp theo nhu cầu (IfluxAuth.promptLogin) chỉ khi khách mở nội dung cần đăng nhập; dựng bằng DS Modal (IfxModal).
 *   ask(dest, { onCancel }) — «Đăng nhập» → dest · «Để sau» / Esc / bấm nền → onCancel (nếu có).
 */
(function (global) {
  'use strict';

  var ID = 'uw-auth-prompt';
  var pending = null;

  function build() {
    var el = document.getElementById(ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = ID;
    el.className = 'ifx-modal-overlay';
    el.innerHTML =
      '<div class="ifx-modal" role="dialog" aria-modal="true" aria-labelledby="' + ID + '-title">' +
        '<div class="ifx-modal-header"><h3 id="' + ID + '-title">Cần đăng nhập</h3></div>' +
        '<div class="ifx-modal-body"><p>Nội dung này dành cho thành viên iFlux. Bạn có muốn chuyển tới trang đăng nhập không?</p></div>' +
        '<div class="ifx-modal-footer">' +
          '<button type="button" class="ifx-btn ifx-btn-ghost" data-ifx-dismiss="modal">Để sau</button>' +
          '<button type="button" class="ifx-btn ifx-btn-primary" data-uw-auth-go>Đăng nhập</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('[data-uw-auth-go]').addEventListener('click', function () {
      var p = pending;
      pending = null;
      if (p) global.location.assign(p.dest);
    });
    /* IfxModal đóng bằng class — mọi cách đóng (nút, Esc, bấm nền) đều quy về «Để sau». */
    new MutationObserver(function () {
      if (el.classList.contains('is-open') || !pending) return;
      var p = pending;
      pending = null;
      if (p.onCancel) p.onCancel();
    }).observe(el, { attributes: true, attributeFilter: ['class'] });
    return el;
  }

  function ask(dest, opts) {
    var el = build();
    pending = { dest: dest, onCancel: opts && opts.onCancel };
    global.IfxModal.open(el.id);
    el.querySelector('[data-uw-auth-go]').focus();
  }

  global.IfluxAuthPrompt = { ask: ask };
})(window);
