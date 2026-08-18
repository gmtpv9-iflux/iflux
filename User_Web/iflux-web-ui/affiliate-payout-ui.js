/* Modal rút hoa hồng — cập nhật thông tin thiếu hoặc nhập số tiền */
(function (global) {
  'use strict';

  var modalEl = null;
  var state = {
    mode: 'amount',
    max: 0,
    min: 0,
    user: null,
    check: null,
    onSuccess: null
  };

  function Store() {
    return global.IfluxAffiliatePayoutStore;
  }

  function parseDigits(str) {
    return Math.round(Number(String(str || '').replace(/[^\d]/g, '')) || 0);
  }

  function formatInput(n) {
    n = Math.round(Number(n) || 0);
    return n > 0 ? n.toLocaleString('vi-VN') : '';
  }

  function clampAmount(amount, max) {
    amount = parseDigits(amount);
    if (amount > max) amount = max;
    return amount;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'ifx-aff-payout-modal';
    modalEl.className = 'ix-modal-overlay';
    modalEl.style.display = 'none';
    modalEl.innerHTML =
      '<div class="ix-modal-box" style="max-width:480px;width:min(480px,94vw)">' +
        '<button type="button" class="ix-modal-close" data-ifx-payout-close aria-label="Đóng"><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title" id="ifx-aff-payout-title">Rút hoa hồng</div>' +
        '<div class="ix-modal-sub" id="ifx-aff-payout-sub"></div>' +
        '<div id="ifx-aff-payout-body" style="margin-top:12px"></div>' +
        '<div id="ifx-aff-payout-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px"></div>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalEl.querySelectorAll('[data-ifx-payout-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) close();
    });
    return modalEl;
  }

  function setActions(html) {
    var wrap = modalEl.querySelector('#ifx-aff-payout-actions');
    if (!wrap) return;
    wrap.innerHTML = html;
    wrap.querySelectorAll('[data-ifx-payout-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
  }

  function bindAmountInput(input) {
    if (!input || input.dataset.ifxAmountBound) return;
    input.dataset.ifxAmountBound = '1';
    input.addEventListener('input', function () {
      var val = clampAmount(input.value, state.max);
      input.value = formatInput(val);
      updateAmountHint(val);
    });
    input.addEventListener('blur', function () {
      var val = clampAmount(input.value, state.max);
      input.value = formatInput(val);
      updateAmountHint(val);
    });
  }

  function updateAmountHint(amount) {
    var hint = modalEl && modalEl.querySelector('#ifx-aff-payout-hint');
    var Payout = Store();
    if (!hint || !Payout) return;
    amount = clampAmount(amount, state.max);
    if (!amount) {
      hint.textContent = 'Nhập số tiền từ ' + Payout.formatVnd(state.min) + ' đến ' + Payout.formatVnd(state.max);
      hint.style.color = 'var(--ix-text-muted)';
      return;
    }
    if (amount < state.min) {
      hint.textContent = 'Tối thiểu ' + Payout.formatVnd(state.min);
      hint.style.color = 'var(--ix-warning)';
      return;
    }
    if (amount >= state.max) {
      hint.textContent = 'Đã đạt số dư tối đa có thể rút';
      hint.style.color = 'var(--ix-accent)';
      return;
    }
    hint.textContent = 'Còn lại sau rút: ' + Payout.formatVnd(state.max - amount);
    hint.style.color = 'var(--ix-text-muted)';
  }

  function renderAmountView() {
    var Payout = Store();
    state.mode = 'amount';
    modalEl.querySelector('#ifx-aff-payout-title').textContent = 'Rút hoa hồng';
    modalEl.querySelector('#ifx-aff-payout-sub').innerHTML =
      'Số dư khả dụng: <strong style="color:var(--ix-success)">' + Payout.formatVnd(state.max) + '</strong>';

    modalEl.querySelector('#ifx-aff-payout-body').innerHTML =
      '<div class="ifx-caption-m" style="margin-bottom:16px">' +
        'Rút tối thiểu ' + Payout.formatVnd(state.min) + ' · Tối đa ' + Payout.formatVnd(state.max) +
        ' (nhập vượt quá sẽ tự điều chỉnh về ' + Payout.formatVnd(state.max) + ')' +
      '</div>' +
      '<div class="ix-form-group">' +
        '<label class="ix-label" for="ifx-aff-payout-amount">Số tiền muốn rút (₫)</label>' +
        '<input type="text" class="ix-input" id="ifx-aff-payout-amount" inputmode="numeric" autocomplete="off" placeholder="VD: 1.000.000" />' +
        '<div id="ifx-aff-payout-hint" class="ifx-caption-m" style="margin-top:8px"></div>' +
      '</div>';

    setActions(
      '<button type="button" class="ix-btn ix-btn-outline" data-ifx-payout-close>Huỷ</button>' +
      '<button type="button" class="ix-btn ix-btn-success" id="ifx-aff-payout-submit"><i class="ti ti-cash"></i> Gửi yêu cầu</button>'
    );

    var input = modalEl.querySelector('#ifx-aff-payout-amount');
    bindAmountInput(input);
    input.value = formatInput(state.max);
    updateAmountHint(state.max);

    var submitBtn = modalEl.querySelector('#ifx-aff-payout-submit');
    submitBtn.addEventListener('click', submitAmount);
    setTimeout(function () { input.focus(); input.select(); }, 50);
  }

  function renderPrereqView() {
    var check = state.check;
    var user = state.user;
    var pay = global.IfluxProfilePaymentStore && user.id
      ? IfluxProfilePaymentStore.get(user.id)
      : {};

    state.mode = 'prereq';
    modalEl.querySelector('#ifx-aff-payout-title').textContent = 'Cập nhật thông tin rút tiền';
    modalEl.querySelector('#ifx-aff-payout-sub').textContent =
      'Vui lòng bổ sung thông tin còn thiếu trước khi gửi yêu cầu rút tiền.';

    var html = '';
    if (check.profileMissing.length) {
      html += '<div class="ifx-label-m" style="margin-bottom:10px"><i class="ti ti-user"></i> Thông tin cá nhân</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">';
      check.profileMissing.forEach(function (f) {
        var inputType = f.key === 'email' ? 'email' : (f.key === 'phone' ? 'tel' : 'text');
        html +=
          '<div class="ix-form-group" style="margin:0">' +
            '<label class="ix-label" for="ifx-prereq-' + esc(f.key) + '">' + esc(f.label) + ' *</label>' +
            '<input type="' + inputType + '" class="ix-input" id="ifx-prereq-' + esc(f.key) + '" data-prereq-key="' + esc(f.key) + '" data-prereq-source="profile" value="' + esc(user[f.key] || '') + '" />' +
          '</div>';
      });
      html += '</div>';
    }

    if (check.bankMissing.length) {
      html += '<div class="ifx-label-m" style="margin-bottom:10px"><i class="ti ti-building-bank"></i> Tài khoản ngân hàng</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
      check.bankMissing.forEach(function (f) {
        var placeholder = f.key === 'bankHolder' ? 'NGUYEN VAN A' : (f.key === 'bankName' ? 'VD: Vietcombank' : '0123456789');
        html +=
          '<div class="ix-form-group" style="margin:0">' +
            '<label class="ix-label" for="ifx-prereq-' + esc(f.key) + '">' + esc(f.label) + ' *</label>' +
            '<input type="text" class="ix-input" id="ifx-prereq-' + esc(f.key) + '" data-prereq-key="' + esc(f.key) + '" data-prereq-source="bank" placeholder="' + esc(placeholder) + '" value="' + esc(pay[f.key] || '') + '" />' +
          '</div>';
      });
      html += '</div>';
    }

    modalEl.querySelector('#ifx-aff-payout-body').innerHTML = html;
    setActions(
      '<button type="button" class="ix-btn ix-btn-outline" data-ifx-payout-close>Huỷ</button>' +
      '<button type="button" class="ix-btn ix-btn-primary" id="ifx-aff-payout-save-prereq"><i class="ti ti-device-floppy"></i> Lưu &amp; tiếp tục</button>'
    );
    modalEl.querySelector('#ifx-aff-payout-save-prereq').addEventListener('click', savePrereqAndContinue);
  }

  function collectPrereqValues() {
    var profilePatch = {};
    var bankPatch = {};
    modalEl.querySelectorAll('[data-prereq-key]').forEach(function (el) {
      var key = el.getAttribute('data-prereq-key');
      var source = el.getAttribute('data-prereq-source');
      var val = String(el.value || '').trim();
      if (source === 'bank') bankPatch[key] = val;
      else profilePatch[key] = val;
    });
    return { profilePatch: profilePatch, bankPatch: bankPatch };
  }

  function savePrereqAndContinue() {
    var Payout = Store();
    if (!Payout || !state.user || !modalEl) return;

    var collected = collectPrereqValues();
    var empty = [];
    (state.check.profileMissing || []).forEach(function (f) {
      if (!String(collected.profilePatch[f.key] || '').trim()) empty.push(f.label);
    });
    (state.check.bankMissing || []).forEach(function (f) {
      if (!String(collected.bankPatch[f.key] || '').trim()) empty.push(f.label);
    });
    if (empty.length) {
      if (global.ixToast) ixToast('Vui lòng điền: ' + empty.join(', '), 'warning');
      return;
    }

    var btn = modalEl.querySelector('#ifx-aff-payout-save-prereq');
    if (btn) btn.disabled = true;

    Payout.savePrerequisites(state.user, collected).then(function (res) {
      if (btn) btn.disabled = false;
      if (!res.ok) {
        if (global.ixToast) ixToast(res.error || 'Không lưu được thông tin', 'danger');
        return;
      }
      state.user = res.user;
      state.check = Payout.checkPrerequisites(state.user);
      if (!state.check.ok) {
        renderPrereqView();
        if (global.ixToast) ixToast('Vui lòng hoàn tất các mục còn thiếu', 'warning');
        return;
      }
      prepareAmountStep();
      if (state.max < state.min) {
        if (global.ixToast) {
          ixToast('Số dư khả dụng (' + Payout.formatVnd(state.max) + ') chưa đủ ngưỡng rút tối thiểu (' + Payout.formatVnd(state.min) + ')', 'warning');
        }
        close();
        return;
      }
      renderAmountView();
      if (global.ixToast) ixToast('Đã lưu thông tin. Nhập số tiền muốn rút.', 'success');
    });
  }

  function prepareAmountStep() {
    var Payout = Store();
    state.max = Payout.getAvailableBalance(state.user.id);
    state.min = Payout.getMinPayout();
  }

  function showInsufficientBalance(Payout, max, min) {
    ensureModal();
    state.mode = 'blocked';
    modalEl.querySelector('#ifx-aff-payout-title').textContent = 'Chưa đủ điều kiện rút tiền';
    modalEl.querySelector('#ifx-aff-payout-sub').textContent = '';
    modalEl.querySelector('#ifx-aff-payout-body').innerHTML =
      '<div class="ix-alert ix-alert-warning" style="margin:0">' +
        '<i class="ti ti-info-circle ix-alert-icon"></i>' +
        '<div class="ix-alert-body">Số dư khả dụng hiện tại là <strong>' + Payout.formatVnd(max) + '</strong>. ' +
        'Bạn cần tối thiểu <strong>' + Payout.formatVnd(min) + '</strong> để gửi yêu cầu rút tiền.</div>' +
      '</div>';
    setActions('<button type="button" class="ix-btn ix-btn-primary" data-ifx-payout-close>Đã hiểu</button>');
    modalEl.style.display = 'flex';
    document.body.classList.add('ix-body-noscroll');
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
    document.body.classList.remove('ix-body-noscroll');
  }

  function open(user, opts) {
    opts = opts || {};
    var Payout = Store();
    if (!Payout || !user) return;

    state.user = user;
    state.onSuccess = opts.onSuccess || null;
    state.check = Payout.checkPrerequisites(user);
    prepareAmountStep();

    ensureModal();

    if (state.max < state.min && state.check.ok) {
      showInsufficientBalance(Payout, state.max, state.min);
      return;
    }

    if (!state.check.ok) {
      renderPrereqView();
    } else {
      renderAmountView();
    }

    modalEl.style.display = 'flex';
    document.body.classList.add('ix-body-noscroll');
  }

  function submitAmount() {
    var Payout = Store();
    if (!Payout || !state.user || !modalEl || state.mode !== 'amount') return;
    var input = modalEl.querySelector('#ifx-aff-payout-amount');
    var amount = clampAmount(parseDigits(input.value), state.max);
    input.value = formatInput(amount);

    if (amount < state.min) {
      if (global.ixToast) ixToast('Số tiền tối thiểu là ' + Payout.formatVnd(state.min), 'warning');
      updateAmountHint(amount);
      return;
    }
    if (!amount) {
      if (global.ixToast) ixToast('Vui lòng nhập số tiền muốn rút', 'warning');
      return;
    }

    var btn = modalEl.querySelector('#ifx-aff-payout-submit');
    btn.disabled = true;
    Payout.createRequest(state.user, amount).then(function (res) {
      btn.disabled = false;
      if (!res.ok) {
        if (res.prerequisites) {
          state.check = res.prerequisites;
          renderPrereqView();
          if (global.ixToast) ixToast('Vui lòng cập nhật thông tin còn thiếu', 'warning');
          return;
        }
        if (global.ixToast) ixToast(res.error || 'Không gửi được yêu cầu', 'danger');
        return;
      }
      close();
      if (global.ixToast) ixToast('Yêu cầu rút tiền đã gửi! Admin sẽ xử lý trong giờ hành chính.', 'success');
      if (typeof state.onSuccess === 'function') state.onSuccess(res);
    });
  }

  global.IfluxAffiliatePayoutUI = { open: open, close: close };
})(window);
