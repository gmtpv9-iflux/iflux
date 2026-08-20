/* Trang Membership — tab Giới thiệu + điều hướng Affiliate → Hồ sơ */
(function (global) {
  'use strict';

  function consumerNavigate(canonical) {
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical);
      return;
    }
    global.location.href = canonical;
  }

  function switchTab(tabId) {
    document.querySelectorAll('.ifx-loyalty-tab[data-ifx-loyalty-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-ifx-loyalty-tab') === tabId);
    });
    document.querySelectorAll('.ifx-loyalty-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  function initFromQuery() {
    try {
      var tab = new URLSearchParams(location.search).get('tab');
      if (tab === 'affiliate') {
        consumerNavigate('/trang-chu?tab=affiliate');
        return;
      }
    } catch (e) { /* ignore */ }
    switchTab('tab-membership-intro');
  }

  function init() {
    document.querySelectorAll('[data-ifx-loyalty-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var href = btn.getAttribute('data-ifx-loyalty-goto');
        if (href) consumerNavigate(href);
      });
    });
    document.querySelectorAll('[data-ifx-loyalty-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-ifx-loyalty-tab'));
      });
    });
    initFromQuery();
  }

  global.IfluxLoyaltyPage = { init: init, switchTab: switchTab };
})(window);
