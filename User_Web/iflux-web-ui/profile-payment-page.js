/* Owner: tab-payment (#tab-payment · #ifx-mine-payment-form) — một entry bind DOM */
(function (global) {
  'use strict';

  function userId() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : null;
  }

  function hydrateForm() {
    var uid = userId();
    if (!uid || !global.IfluxProfilePaymentStore) return;

    var data = IfluxProfilePaymentStore.get(uid);
    var form = document.getElementById('ifx-mine-payment-form');
    if (!form) return;

    form.querySelectorAll('[data-pay-field]').forEach(function (el) {
      var key = el.getAttribute('data-pay-field');
      if (data[key] == null) return;
      if (el.type === 'radio') {
        el.checked = el.value === data.payMethod;
      } else {
        el.value = data[key];
      }
    });
  }

  function bindSubmit() {
    var form = document.getElementById('ifx-mine-payment-form');
    if (!form || form.dataset.ifxPaymentOwnerBound) return;
    form.dataset.ifxPaymentOwnerBound = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var uid = userId();
      if (!uid || !global.IfluxProfilePaymentStore) return;

      var patch = { payMethod: 'card' };
      form.querySelectorAll('[data-pay-field]').forEach(function (el) {
        var key = el.getAttribute('data-pay-field');
        if (el.type === 'radio') {
          if (el.checked && key === 'payMethod') patch.payMethod = el.value;
        } else {
          patch[key] = el.value.trim();
        }
      });

      IfluxProfilePaymentStore.save(uid, patch);
      if (global.IfluxProfileActivityStore) {
        IfluxProfileActivityStore.log(uid, {
          type: 'payment',
          icon: 'ti-credit-card',
          iconClass: 'info',
          title: 'Cập nhật tài khoản thanh toán',
          desc: 'Đã lưu phương thức thanh toán & thông tin nhận hoa hồng.'
        });
      }
      if (global.ixToast) ixToast('Đã lưu tài khoản thanh toán', 'success');
    });
  }

  function init() {
    if (!document.getElementById('ifx-mine-payment-form')) return;
    hydrateForm();
    bindSubmit();
  }

  function refresh() {
    hydrateForm();
  }

  global.IfluxProfilePaymentPage = { init: init, refresh: refresh };
})(window);
