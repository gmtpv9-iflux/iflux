/**
 * iFlux — OTP 6 ô nhập mã (Design System)
 * Dùng class ix-input ix-otp-digit trên từng ô
 */
(function (global) {
  'use strict';

  function createOtpInput(container, opts) {
    opts = opts || {};
    var length = opts.length || 6;
    var inputs = [];
    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = opts.hiddenId || 'verify-code';
    hidden.setAttribute('autocomplete', 'one-time-code');

    container.innerHTML = '';
    container.classList.add('ix-otp-row');
    container.appendChild(hidden);

    for (var i = 0; i < length; i++) {
      var input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.className = 'ix-input ix-otp-digit';
      input.setAttribute('aria-label', 'Chữ số OTP ' + (i + 1));
      input.setAttribute('data-otp-index', String(i));
      input.autocomplete = 'off';
      inputs.push(input);
      container.appendChild(input);
    }

    function syncHidden() {
      hidden.value = inputs.map(function (el) { return el.value; }).join('');
    }

    function getCode() {
      syncHidden();
      return hidden.value;
    }

    function setCode(code) {
      code = String(code || '').replace(/\D/g, '').slice(0, length);
      inputs.forEach(function (el, idx) {
        el.value = code.charAt(idx) || '';
      });
      syncHidden();
    }

    function focusIndex(idx) {
      if (idx < 0) idx = 0;
      if (idx >= length) idx = length - 1;
      inputs[idx].focus();
      inputs[idx].select();
    }

    inputs.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        var val = input.value.replace(/\D/g, '');
        if (val.length > 1) {
          setCode(val);
          var nextIdx = Math.min(val.length, length - 1);
          focusIndex(nextIdx);
          if (opts.onComplete && getCode().length === length) opts.onComplete(getCode());
          return;
        }
        input.value = val;
        syncHidden();
        if (val && idx < length - 1) focusIndex(idx + 1);
        if (opts.onComplete && getCode().length === length) opts.onComplete(getCode());
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          focusIndex(idx - 1);
        }
        if (e.key === 'Enter' && opts.onEnter) {
          e.preventDefault();
          opts.onEnter(getCode());
        }
        if (e.key === 'ArrowLeft' && idx > 0) {
          e.preventDefault();
          focusIndex(idx - 1);
        }
        if (e.key === 'ArrowRight' && idx < length - 1) {
          e.preventDefault();
          focusIndex(idx + 1);
        }
      });

      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var pasted = (e.clipboardData || global.clipboardData).getData('text') || '';
        setCode(pasted);
        var len = getCode().length;
        focusIndex(len >= length ? length - 1 : len);
        if (opts.onComplete && len === length) opts.onComplete(getCode());
      });
    });

    if (opts.autofocus !== false) {
      setTimeout(function () { focusIndex(0); }, 0);
    }

    return {
      inputs: inputs,
      hidden: hidden,
      getCode: getCode,
      setCode: setCode,
      focus: function () { focusIndex(0); }
    };
  }

  global.IfluxOtpInput = { create: createOtpInput };
})(window);
