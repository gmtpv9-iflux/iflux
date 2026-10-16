/**
 * iFlux — OTP 6 ô nhập mã (Design System)
 * 1 input ẩn-trong-vai-trò-chính nhận đủ mã (autocomplete="one-time-code" để hệ điều hành
 * tự gợi ý điền mã từ Gmail/SMS) — 6 ô vuông chỉ là CSS vẽ giả trên 1 input, không phải 6
 * input riêng: input riêng + maxlength=1 từng ô sẽ xung đột với auto-fill thật của OS vì
 * OS luôn điền CẢ mã vào 1 field đang focus, field maxlength=1 chỉ nhận được 1 ký tự đầu.
 */
(function (global) {
  'use strict';

  function createOtpInput(container, opts) {
    opts = opts || {};
    var length = opts.length || 6;

    container.innerHTML = '';
    container.classList.add('ix-otp-row');

    var input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'one-time-code';
    input.setAttribute('pattern', '[0-9]*');
    input.maxLength = length;
    input.id = opts.hiddenId || 'verify-code';
    input.className = 'ix-input ix-otp-combined';
    input.style.setProperty('--ix-otp-len', String(length));
    input.setAttribute('aria-label', 'Mã OTP ' + length + ' số');

    container.appendChild(input);

    function getCode() {
      return input.value.replace(/\D/g, '').slice(0, length);
    }

    function setCode(code) {
      input.value = String(code == null ? '' : code).replace(/\D/g, '').slice(0, length);
    }

    function focus() {
      input.focus();
    }

    input.addEventListener('input', function () {
      var clean = input.value.replace(/\D/g, '').slice(0, length);
      if (clean !== input.value) input.value = clean;
      if (opts.onComplete && clean.length === length) opts.onComplete(clean);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && opts.onEnter) {
        e.preventDefault();
        opts.onEnter(getCode());
      }
    });

    if (opts.autofocus !== false) {
      setTimeout(function () { input.focus(); }, 0);
    }

    return {
      inputs: [input],
      hidden: input,
      getCode: getCode,
      setCode: setCode,
      focus: focus
    };
  }

  global.IfluxOtpInput = { create: createOtpInput };
})(window);
