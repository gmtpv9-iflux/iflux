/* Hub — Nhà của tôi (trang) + tab Bảng điều khiển & Hồ sơ */
(function (global) {
  'use strict';

  var profileInited = false;
  var dashboardInited = false;

  function switchTab(tabId) {
    var scope = document.querySelector('[data-ifx-hub-tab-panels]') || document;
    scope.querySelectorAll('[data-ix-profile-tab]').forEach(function (btn) {
      var id = btn.getAttribute('data-ix-profile-tab');
      btn.classList.toggle('active', id === tabId);
    });
    scope.querySelectorAll('.ix-tab-content').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });
    if (tabId === 'tab-dashboard') {
      bootDashboard();
    } else {
      bootProfileModules();
      onProfileTabShown(tabId);
    }
    try {
      var url = new URL(location.href);
      if (tabId === 'tab-dashboard') url.searchParams.delete('tab');
      else url.searchParams.set('tab', tabId.replace(/^tab-/, ''));
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* ignore */ }
  }

  function onProfileTabShown(tabId) {
    if (tabId === 'tab-timeline' && global.IfluxProfilePage) {
      IfluxProfilePage.renderRecentPosts();
      IfluxProfilePage.renderTimeline();
    }
    if (tabId === 'tab-following' && global.IfluxProfilePage) {
      IfluxProfilePage.renderFollowing();
    }
    if (tabId === 'tab-activity' && global.IfluxProfileActivityPage) {
      IfluxProfileActivityPage.render();
    }
    if (tabId === 'tab-affiliate' && global.IfluxProfileAffiliate) {
      IfluxProfileAffiliate.render();
    }
    if (tabId === 'tab-messages' && global.IfluxProfileChatPage) {
      var chatParams = new URLSearchParams(location.search);
      var peer = chatParams.get('with') || chatParams.get('peer');
      if (peer && IfluxProfileChatPage.openPeer) IfluxProfileChatPage.openPeer(peer);
    }
  }

  function bindProfileGotoTab() {
    document.querySelectorAll('[data-ifx-goto-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-ifx-goto-tab'));
        var subId = btn.getAttribute('data-ifx-goto-subtab');
        if (subId && global.IfluxProfileMyPage) {
          setTimeout(function () {
            IfluxProfileMyPage.switchSubtab(subId);
            if (btn.getAttribute('data-ifx-goto-edit') === '1') {
              IfluxProfileMyPage.enterEditMode();
            }
          }, 0);
        }
      });
    });
  }

  function applyProfileUrlTab() {
    var params = new URLSearchParams(location.search);
    var tab = params.get('tab');
    if (!tab) {
      switchTab('tab-dashboard');
      return;
    }

    var accountSubMap = {
      account: 'mine-personal',
      personal: 'mine-personal',
      payment: 'mine-payment',
      privacy: 'mine-privacy',
      security: 'mine-security'
    };

    if (accountSubMap[tab]) {
      switchTab('tab-account');
      if (global.IfluxProfileMyPage) {
        setTimeout(function () {
          var sub = params.get('subtab') || params.get('sub') || accountSubMap[tab];
          IfluxProfileMyPage.switchSubtab(sub);
          if (params.get('edit') === '1') {
            IfluxProfileMyPage.enterEditMode();
          }
        }, 0);
      }
      return;
    }

    if (tab === 'dashboard') {
      switchTab('tab-dashboard');
      return;
    }

    var tabId = tab.indexOf('tab-') === 0 ? tab : 'tab-' + tab;
    var btn = document.querySelector('[data-ix-profile-tab="' + tabId + '"]');
    if (btn && !btn.hidden) switchTab(tabId);
    else switchTab('tab-dashboard');
  }

  function bootProfileModules() {
    if (profileInited) return;
    profileInited = true;

    if (global.ProfileBind) ProfileBind.init();
    if (global.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
    bindProfileGotoTab();

    if (global.IfluxProfilePage) IfluxProfilePage.init();
    if (global.IfluxProfileMyPage) IfluxProfileMyPage.init();
    if (global.IfluxProfileActivityPage) IfluxProfileActivityPage.init();
    if (global.IfluxProfileAffiliate) IfluxProfileAffiliate.init();
    if (global.IfluxUserNotificationsUI) IfluxUserNotificationsUI.refresh();
    if (global.IfluxProfilePrivacyPage) IfluxProfilePrivacyPage.init();

    if (global.IfluxProfileChatPage) {
      var chatParams = new URLSearchParams(location.search);
      IfluxProfileChatPage.init({
        openPeerId: chatParams.get('with') || chatParams.get('peer') || null
      });
      if (chatParams.get('tab') === 'messages') {
        IfluxProfileChatPage.switchToTab('tab-messages');
      }
    }

    var saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn && !saveBtn.dataset.ifxBound) {
      saveBtn.dataset.ifxBound = '1';
      saveBtn.addEventListener('click', function () {
        var patch = {};
        document.querySelectorAll('[data-bind-input]').forEach(function (input) {
          patch[input.getAttribute('data-bind-input')] = input.value;
        });
        if (global.IfluxAuth) IfluxAuth.updateUser(patch);
        if (global.ProfileBind) ProfileBind.init();
        if (global.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
        if (global.IfluxProfileMyPage) IfluxProfileMyPage.refresh();
        if (global.IfluxProfileMyPage && IfluxProfileMyPage.exitEditMode) IfluxProfileMyPage.exitEditMode();
        if (global.IfluxProfileActivityStore && global.IfluxAuth && IfluxAuth.getUser()) {
          IfluxProfileActivityStore.log(IfluxAuth.getUser().id, {
            type: 'profile',
            icon: 'ti-user-edit',
            iconClass: 'info',
            title: 'Cập nhật tài khoản',
            desc: 'Đã lưu thông tin tài khoản và hồ sơ.'
          });
        }
        if (global.ixToast) ixToast('Đã lưu hồ sơ', 'success');
        if (global.IfluxDashboardEngine && IfluxDashboardEngine.refreshSidebar) {
          IfluxDashboardEngine.refreshSidebar();
        }
      });
    }

    document.querySelectorAll('[data-bind-input]').forEach(function (input) {
      var key = input.getAttribute('data-bind-input');
      var u = global.IfluxAuth && IfluxAuth.getUser();
      if (u && u[key]) input.value = u[key];
    });

    ['HPG', 'VCB', 'FPT'].forEach(function (tk) {
      if (global.IfluxStockStore) IfluxStockStore.getComments(tk);
    });
  }

  function bootDashboard() {
    if (dashboardInited) return;
    dashboardInited = true;
    try {
      if (global.IfluxWatchlistStore && IfluxWatchlistStore.ensureSeedFromDemo) {
        IfluxWatchlistStore.ensureSeedFromDemo();
      }
    } catch (e) { /* ignore */ }
    try {
      if (global.IfluxWatchlistUI && IfluxWatchlistUI.bindRowActions) {
        IfluxWatchlistUI.bindRowActions(document);
      } else if (global.IfluxHeartAction) {
        IfluxHeartAction.bind(document);
      }
    } catch (e) { /* ignore */ }
    try {
      if (global.IfluxDashboardEngine) IfluxDashboardEngine.init();
    } catch (e) { /* ignore */ }
    try {
      if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAll();
    } catch (e) { /* ignore */ }
    try {
      if (global.ProfileBind) ProfileBind.init();
    } catch (e) { /* ignore */ }
    if (global.IfluxAlertPage) IfluxAlertPage.init();
  }

  function bindTabUi() {
    document.querySelectorAll('[data-ix-profile-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-ix-profile-tab'));
      });
    });
    document.querySelectorAll('[data-ix-copy-ref]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (global.PatternUserProfile) PatternUserProfile.copyRef(btn.getAttribute('data-ix-copy-ref'));
      });
    });
  }

  function loadPanels(cb) {
    var mount = document.querySelector('[data-ifx-hub-tab-panels]');
    if (!mount) return cb && cb();
    if (!mount.querySelector('[data-ix-profile-tab]') && global.console && console.error) {
      console.error('Hub: thiếu nội dung tab — cần mở home/index.html phiên bản mới nhất.');
    }
    mount.dataset.loaded = '1';
    if (cb) cb();
  }

  function init() {
    loadPanels(function () {
      bindTabUi();
      bootDashboard();
      applyProfileUrlTab();
      if (global.IfluxWebUI && IfluxWebUI.syncTopnav) {
        IfluxWebUI.syncTopnav();
      }
      document.addEventListener('iflux-watchlist-change', function () {
        if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAll();
      });
    });
  }

  global.IfluxHubPage = {
    init: init,
    switchTab: switchTab,
    bootProfileModules: bootProfileModules,
    bootDashboard: bootDashboard
  };
})(window);
