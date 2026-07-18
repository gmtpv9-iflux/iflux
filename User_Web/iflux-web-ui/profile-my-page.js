/* Tab Hồ sơ — sub-tab Hồ sơ cá nhân / Thanh toán / Quyền riêng tư / Bảo mật */
(function (global) {
  'use strict';

  var personalEditMode = false;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function userId() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : null;
  }

  function populateEditForm() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;
    document.querySelectorAll('[data-bind-input]').forEach(function (input) {
      var key = input.getAttribute('data-bind-input');
      input.value = user[key] != null ? user[key] : '';
    });
    if (global.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
  }

  function setPersonalMode(mode) {
    personalEditMode = mode === 'edit';
    var viewEl = document.querySelector('[data-ifx-personal-view]');
    var editEl = document.querySelector('[data-ifx-personal-edit]');
    var viewActions = document.querySelector('[data-ifx-personal-view-actions]');
    var editActions = document.querySelector('[data-ifx-personal-edit-actions]');

    if (viewEl) viewEl.hidden = personalEditMode;
    if (editEl) editEl.hidden = !personalEditMode;
    if (viewActions) viewActions.hidden = personalEditMode;
    if (editActions) editActions.hidden = !personalEditMode;

    if (personalEditMode) populateEditForm();
    else bindPersonalView();
  }

  function enterEditMode() {
    switchSubtab('mine-personal');
    setPersonalMode('edit');
  }

  function exitEditMode() {
    setPersonalMode('view');
  }

  function switchSubtab(subId) {
    if (subId !== 'mine-personal' && personalEditMode) {
      setPersonalMode('view');
    }
    document.querySelectorAll('[data-ifx-mine-sub]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-ifx-mine-sub') === subId);
    });
    document.querySelectorAll('.ifx-mine-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === subId);
    });
  }

  function bindPersonalView() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    var grid = document.getElementById('ifx-mine-personal-grid');
    if (!grid) return;

    var rows = [
      { label: 'Họ tên', val: user.display_name },
      { label: 'Tên đăng nhập', val: user.username },
      { label: 'Email', val: user.email },
      { label: 'Số điện thoại', val: user.phone },
      { label: 'Quốc gia', val: user.country },
      { label: 'Gói thành viên', val: user.tier_label || user.tier },
      { label: 'Tham gia', val: user.joined_at },
      { label: 'Giới thiệu', val: user.bio, full: true }
    ];

    grid.innerHTML = rows.map(function (r) {
      return '<div class="ifx-mine-field' + (r.full ? ' ifx-mine-field--full' : '') + '">' +
        '<label class="ix-label">' + esc(r.label) + '</label>' +
        '<div class="ifx-mine-val">' + esc(r.val || '—') + '</div></div>';
    }).join('');
  }

  function bindPersonalEditActions() {
    var editBtn = document.getElementById('btn-edit-from-personal');
    if (editBtn && !editBtn.dataset.ifxBound) {
      editBtn.dataset.ifxBound = '1';
      editBtn.addEventListener('click', enterEditMode);
    }

    var cancelBtn = document.getElementById('btn-cancel-personal-edit');
    if (cancelBtn && !cancelBtn.dataset.ifxBound) {
      cancelBtn.dataset.ifxBound = '1';
      cancelBtn.addEventListener('click', exitEditMode);
    }
  }

  function bindPaymentForm() {
    var uid = userId();
    if (!uid || !global.IfluxProfilePaymentStore) return;

    var data = IfluxProfilePaymentStore.get(uid);
    var form = document.getElementById('ifx-mine-payment-form');
    if (!form) return;

    form.querySelectorAll('[data-pay-field]').forEach(function (el) {
      var key = el.getAttribute('data-pay-field');
      if (data[key] != null) {
        if (el.type === 'radio') {
          el.checked = el.value === data.payMethod;
        } else {
          el.value = data[key];
        }
      }
    });

    if (form.dataset.ifxBound) return;
    form.dataset.ifxBound = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
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

  function bindGotoSubtab() {
    document.querySelectorAll('[data-ifx-goto-subtab]:not([data-ifx-goto-tab])').forEach(function (el) {
      if (el.dataset.ifxGotoBound) return;
      el.dataset.ifxGotoBound = '1';
      el.addEventListener('click', function () {
        var subId = el.getAttribute('data-ifx-goto-subtab');
        var mainTab = document.querySelector('[data-ix-profile-tab="tab-account"]');
        if (mainTab) mainTab.click();
        switchSubtab(subId);
        if (el.getAttribute('data-ifx-goto-edit') === '1') {
          enterEditMode();
        }
      });
    });
  }

  function initSubtabs() {
    document.querySelectorAll('[data-ifx-mine-sub]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchSubtab(btn.getAttribute('data-ifx-mine-sub'));
      });
    });
    bindGotoSubtab();
  }

  function init() {
    initSubtabs();
    bindPersonalEditActions();
    bindPersonalView();
    bindPaymentForm();
  }

  function refresh() {
    if (personalEditMode) populateEditForm();
    else bindPersonalView();
    bindPaymentForm();
  }

  global.IfluxProfileMyPage = {
    init: init,
    refresh: refresh,
    switchSubtab: switchSubtab,
    enterEditMode: enterEditMode,
    exitEditMode: exitEditMode
  };
})(window);
