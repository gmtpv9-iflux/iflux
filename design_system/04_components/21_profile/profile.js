/**
 * IfxProfile — tab pane, copy-ref. Modal/Toast/DataList là owner riêng.
 */
(function (global) {
  'use strict';

  function copyText(text, inputEl) {
    text = String(text || '').trim();
    function notify(ok) {
      if (!global.IfxToast) return;
      global.IfxToast.show(
        ok ? 'Đã sao chép!' : 'Không sao chép được',
        ok ? 'success' : 'warning'
      );
    }
    if (!text) {
      notify(false);
      return;
    }
    if (global.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { notify(true); }).catch(function () {
        notify(legacyCopy(text, inputEl));
      });
      return;
    }
    notify(legacyCopy(text, inputEl));
  }

  function legacyCopy(text, inputEl) {
    try {
      if (inputEl && (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA')) {
        inputEl.focus();
        inputEl.select();
        return document.execCommand('copy');
      }
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function init(root) {
    var scope = root || document.querySelector('[data-ifx-profile]') || document;

    scope.querySelectorAll('[data-ifx-profile-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-ifx-profile-tab');
        scope.querySelectorAll('.ifx-profile-tab').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        scope.querySelectorAll('.ifx-profile-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.id === id);
        });
      });
    });

    scope.querySelectorAll('[data-ifx-copy-ref]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById(btn.getAttribute('data-ifx-copy-ref'));
        if (el) copyText(el.value || el.textContent || '', el);
      });
    });
  }

  global.IfxProfile = { init: init };
})(window);
