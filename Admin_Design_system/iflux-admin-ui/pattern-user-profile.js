/* User profile pattern — patterns/user-profile.html */
(function (global) {
  'use strict';

  function openProfileModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeProfileModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function legacyCopyText(text, inputEl) {
    text = String(text || '');
    try {
      if (inputEl && (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA')) {
        inputEl.focus();
        inputEl.select();
        inputEl.setSelectionRange(0, text.length);
        return document.execCommand('copy');
      }
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyText(text, inputEl) {
    text = String(text || '').trim();
    if (!text) {
      if (global.ixToast) global.ixToast('Không có nội dung để sao chép', 'warning');
      return;
    }
    function notify(ok) {
      if (!global.ixToast) return;
      global.ixToast(
        ok ? 'Đã sao chép!' : 'Không sao chép được — hãy chọn nội dung và copy thủ công (Ctrl/Cmd+C)',
        ok ? 'success' : 'warning'
      );
    }
    if (global.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        notify(true);
      }).catch(function () {
        notify(legacyCopyText(text, inputEl));
      });
      return;
    }
    notify(legacyCopyText(text, inputEl));
  }

  function copyRef(inputId) {
    var el = document.getElementById(inputId);
    if (!el) return;
    copyText(el.value || el.textContent || '', el);
  }

  function initProfile(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-ix-profile-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-ix-profile-tab');
        scope.querySelectorAll('.ix-profile-tab').forEach(function (b) {
          b.classList.remove('active');
        });
        scope.querySelectorAll('.ix-tab-content').forEach(function (t) {
          t.classList.remove('active');
        });
        btn.classList.add('active');
        var panel = document.getElementById(tabId);
        if (panel) panel.classList.add('active');
      });
    });

    scope.querySelectorAll('[data-ix-profile-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openProfileModal(btn.getAttribute('data-ix-profile-modal-open'));
      });
    });

    scope.querySelectorAll('[data-ix-profile-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-ix-profile-modal-close');
        closeProfileModal(id || (btn.closest('[data-profile-modal]') && btn.closest('[data-profile-modal]').id));
      });
    });

    scope.querySelectorAll('[data-profile-modal]').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeProfileModal(overlay.id);
      });
    });

    scope.querySelectorAll('[data-ix-copy-ref]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyRef(btn.getAttribute('data-ix-copy-ref'));
      });
    });

    var firstTab = scope.querySelector('.ix-profile-tab.active');
    if (firstTab) {
      var firstId = firstTab.getAttribute('data-ix-profile-tab');
      if (firstId) {
        var firstPanel = document.getElementById(firstId);
        if (firstPanel) firstPanel.classList.add('active');
      }
    }
  }

  global.PatternUserProfile = {
    init: initProfile,
    openModal: openProfileModal,
    closeModal: closeProfileModal,
    copyRef: copyRef,
    copyText: copyText
  };
})(window);
