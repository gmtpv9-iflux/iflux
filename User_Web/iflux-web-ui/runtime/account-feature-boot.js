/**
 * Phase A — Feature Tài khoản (sau App Shell Entry).
 * Shell do bootstrap.js → shell-boot; file này chỉ nạp Feature + init trang.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var ADMIN_APP = '/Admin_Design_system/';

var FEATURE_SCRIPTS = [
  ASSET + 'iflux-user-data-sync.js',
  ADMIN + 'iflux-admin-ui.js',
  ADMIN + 'pattern-user-profile.js',
  /* W4: market seed/registry/mock/taxonomy/seo = Shell MARKET_PLATFORM (account) */
  ASSET + 'stock-mentions.js',
  ASSET + 'stock-store.js',
  ASSET + 'stock-comments-ui.js',
  ASSET + 'community-store.js',
  ASSET + 'community-ui.js',
  ASSET + 'profile-users-store.js',
  ASSET + 'profile-links.js',
  ASSET + 'profile-follow-store.js?v=chatGate20260708',
  ASSET + 'profile-friend-store.js?v=chatGate20260708',
  ASSET + 'profile-block-store.js',
  ASSET + 'loyalty-affiliate-store.js',
  ASSET + 'profile-chat-access.js?v=chatGate20260708',
  ASSET + 'profile-chat-store.js',
  ASSET + 'profile-chat-page.js?v=chatGate20260708',
  ASSET + 'profile-avatar.js',
  ASSET + 'profile-privacy-store.js?v=chatGate20260708',
  ASSET + 'profile-privacy-page.js?v=chatGate20260708',
  ASSET + 'system-notification-catalog.js',
  ASSET + 'system-notification-templates-store.js',
  ASSET + 'inapp-notifications.js',
  ADMIN + 'iflux-customers-store.js',
  ASSET + 'profile-affiliate.js',
  ASSET + 'subscription-orders-store.js',
  ASSET + 'profile-payment-store.js',
  ASSET + 'profile-activity-store.js',
  ASSET + 'profile-activity-page.js',
  ASSET + 'profile-my-page.js',
  ASSET + 'profile-view.js?v=chatGate20260708',
  ASSET + 'profile-page.js',
  ASSET + 'iflux-plans-catalog.js?v=planPromo20260708',
  ASSET + 'profile-bind.js?v=planPromo20260708'
];

function waitShellReady(pageKey) {
  if (window.__IFLUX_SHELL_READY === pageKey) return Promise.resolve();
  return new Promise(function (resolve) {
    function onReady(ev) {
      if (ev.detail && ev.detail.pageKey === pageKey) {
        window.removeEventListener('iflux-shell-ready', onReady);
        resolve();
      }
    }
    window.addEventListener('iflux-shell-ready', onReady);
  });
}

function bootAccountPage() {
  (function () {
    var p = new URLSearchParams(location.search);
    var uid0 = (p.get('user') || p.get('id') || '').trim();
    if (!uid0) {
      var t = p.get('tab');
      if (t === 'messages') {
        var peer = p.get('with') || p.get('peer');
        location.replace('/tin-nhan' + (peer ? '?with=' + encodeURIComponent(peer) : ''));
        return;
      }
      if (t === 'following') {
        location.replace('/tin-nhan/following');
        return;
      }
    }
  })();

  ['HPG', 'VCB', 'FPT'].forEach(function (tk) {
    if (window.IfluxStockStore) IfluxStockStore.getComments(tk);
  });

  function activateTab(tabId) {
    document.querySelectorAll('.ix-profile-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-ix-profile-tab') === tabId);
    });
    document.querySelectorAll('.ix-tab-content').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  function populateSidebarInputs() {
    var u = window.IfluxAuth && IfluxAuth.getUser();
    document.querySelectorAll('[data-ifx-side-edit] [data-bind-input]').forEach(function (input) {
      var key = input.getAttribute('data-bind-input');
      input.value = (u && u[key] != null) ? u[key] : '';
    });
    if (window.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
  }

  function setSidebarEdit(edit) {
    var viewEl = document.querySelector('[data-ifx-side-view]');
    var editEl = document.querySelector('[data-ifx-side-edit]');
    var heroEl = document.querySelector('[data-ifx-profile-hero]');
    if (viewEl) viewEl.hidden = !!edit;
    if (editEl) editEl.hidden = !edit;
    if (heroEl) heroEl.classList.toggle('is-editing', !!edit);
    if (edit) populateSidebarInputs();
  }

  function bindSidebarEdit() {
    document.querySelectorAll('[data-ifx-side-edit-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { setSidebarEdit(true); });
    });
    document.querySelectorAll('[data-ifx-side-edit-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () { setSidebarEdit(false); });
    });
  }

  function bindProfileGotoTab() {
    document.querySelectorAll('[data-ifx-goto-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-ifx-goto-tab');
        var tabBtn = document.querySelector('[data-ix-profile-tab="' + tabId + '"]');
        if (tabBtn) tabBtn.click();
        else activateTab(tabId);
        if (btn.getAttribute('data-ifx-goto-edit') === '1' && window.IfluxProfileMyPage) {
          setTimeout(function () { IfluxProfileMyPage.enterEditMode(); }, 0);
        }
      });
    });
  }

  function applyProfileUrlTab() {
    var params = new URLSearchParams(location.search);
    var tab = params.get('tab');
    if (!tab) return;
    if (tab === 'personal' || tab === 'account') {
      if (params.get('edit') === '1') {
        setTimeout(function () { setSidebarEdit(true); }, 0);
      }
      return;
    }
    var map = {
      timeline: 'tab-timeline',
      affiliate: 'tab-affiliate',
      payment: 'tab-payment', billing: 'tab-payment',
      privacy: 'tab-privacy',
      security: 'tab-security'
    };
    var tabId = map[tab] || (tab.indexOf('tab-') === 0 ? tab : 'tab-' + tab);
    var btn = document.querySelector('[data-ix-profile-tab="' + tabId + '"]');
    if (btn && !btn.hidden) btn.click();
    else activateTab(tabId);
  }

  var profileMode = window.IfluxProfileView ? IfluxProfileView.init() : 'own';
  if (profileMode !== 'own') return;

  if (window.ProfileBind) ProfileBind.init();
  if (window.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
  if (window.PatternUserProfile) PatternUserProfile.init();
  bindProfileGotoTab();
  if (window.IfluxProfilePage) IfluxProfilePage.init();
  if (window.IfluxProfileMyPage) IfluxProfileMyPage.init();
  if (window.IfluxProfileAffiliate) IfluxProfileAffiliate.init();
  if (window.IfluxUserNotificationsUI) IfluxUserNotificationsUI.refresh();
  if (window.IfluxProfilePrivacyPage) IfluxProfilePrivacyPage.init();
  applyProfileUrlTab();
  bindSidebarEdit();

  var saveBtn = document.getElementById('btn-save-profile');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var patch = {};
      document.querySelectorAll('[data-bind-input]').forEach(function (input) {
        patch[input.getAttribute('data-bind-input')] = input.value;
      });
      if (window.IfluxAuth) IfluxAuth.updateUser(patch);
      if (window.ProfileBind) ProfileBind.init();
      if (window.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
      if (window.IfluxProfileMyPage) IfluxProfileMyPage.refresh();
      if (window.IfluxProfileActivityStore && window.IfluxAuth && IfluxAuth.getUser()) {
        IfluxProfileActivityStore.log(IfluxAuth.getUser().id, {
          type: 'profile',
          icon: 'ti-user-edit',
          iconClass: 'info',
          title: 'Cập nhật tài khoản',
          desc: 'Đã lưu thông tin tài khoản và hồ sơ.'
        });
      }
      setSidebarEdit(false);
      if (window.ixToast) ixToast('Đã lưu hồ sơ', 'success');
    });
  }
}

async function main() {
  await waitShellReady('account');
  await loadScriptsSequential(FEATURE_SCRIPTS);
  bootAccountPage();
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Account Feature] boot failed', err);
});
