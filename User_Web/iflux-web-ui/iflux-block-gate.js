/* Hiển thị block theo quyền — luôn giữ tiêu đề/mô tả; nội dung khóa hiện CTA nâng cấp */
(function (global) {
  'use strict';

  function apply(pageKey) {
    pageKey = String(pageKey || '').toLowerCase();
    var ent = global.IfluxEntitlements;
    var paywall = global.IfluxBlockPaywall;
    if (!ent) return;

    document.querySelectorAll('[data-ifx-ent-block]').forEach(function (el) {
      var id = el.getAttribute('data-ifx-ent-block');
      var allowed = ent.hasBlock(id);

      el.hidden = false;
      el.style.display = '';
      el.removeAttribute('aria-hidden');

      if (allowed) {
        if (paywall) paywall.unlockBlock(el);
        el.setAttribute('data-ifx-ent-access', 'full');
      } else if (paywall) {
        paywall.lockBlock(el, id);
      } else {
        el.setAttribute('data-ifx-ent-access', 'teaser');
      }
    });

    document.querySelectorAll('[data-ifx-ent-block-section]').forEach(function (section) {
      section.hidden = false;
      section.style.display = '';
    });
  }

  global.IfluxBlockGate = { apply: apply };
})(window);
