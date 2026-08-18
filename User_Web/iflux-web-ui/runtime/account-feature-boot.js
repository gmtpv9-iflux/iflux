/**
 * Phase A — Feature Tài khoản (sau App Shell Entry).
 * Wave C — CORE boot (~22 script) · PUBLIC lazy khi ?user= xem hồ sơ người khác.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var VER = 'accountEarlyTab20260728';

/** Own account — tab Affiliate · Thanh toán · Quyền riêng tư · Mật khẩu · sidebar */
var CORE_SCRIPTS = [
  ASSET + 'profile-local-scope.js?v=' + VER,
  ASSET + 'iflux-user-data-sync.js',
  ASSET + 'profile-users-store.js',
  ASSET + 'profile-links.js',
  ASSET + 'profile-follow-store.js?v=' + VER,
  ASSET + 'profile-avatar.js',
  ASSET + 'profile-view.js?v=' + VER,
  ASSET + 'iflux-plans-catalog.js?v=planPromo20260708',
  ASSET + 'profile-bind.js?v=' + VER,
  ASSET + 'loyalty-affiliate-store.js?v=' + VER,
  ASSET + 'affiliate-payout-store.js?v=affP3_20260728',
  ASSET + 'affiliate-payout-ui.js?v=affP3_20260728',
  ASSET + 'profile-affiliate.js?v=' + VER,
  ASSET + 'subscription-orders-store.js?v=affP1_20260728',
  ASSET + 'profile-payment-store.js',
  ASSET + 'profile-payment-page.js?v=ownP05_20260728',
  ASSET + 'profile-privacy-store.js?v=chatGate20260708',
  ASSET + 'notification-preference-store.js?v=notifD1rev_20260728',
  ASSET + 'profile-privacy-page.js?v=notifPrefUi_20260728',
  ASSET + 'client-local-notification-types.js?v=notifPhaseD4_20260728',
  ASSET + 'inapp-notifications.js?v=notifPhaseD4_20260728',
  ASSET + 'profile-security-page.js?v=secRestore_20260728'
];

/** Public profile (?user=) — follow · block · chat gate · timeline */
var PUBLIC_PROFILE_SCRIPTS = [
  ADMIN + 'iflux-customers-store.js',
  ASSET + 'profile-friend-store.js?v=chatGate20260708',
  ASSET + 'profile-block-store.js',
  ASSET + 'profile-chat-access.js?v=chatGate20260708',
  ASSET + 'profile-chat-store.js',
  ASSET + 'stock-mentions.js',
  ASSET + 'stock-store.js',
  ASSET + 'community-store.js',
  ASSET + 'community-ui.js',
  ASSET + 'profile-page.js'
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

function consumerNavigate(canonical, opts) {
  opts = opts || {};
  if (opts.replace == null) opts.replace = true;
  /* P6-API-01 — internal nav chỉ Writer.navigate */
  var W = window.IfluxShellUrlWriter;
  if (W && W.navigate) {
    W.navigate(canonical, opts);
    return;
  }
  location.replace(canonical);
}

function iconClass(icon) {
  var ic = String(icon || '').trim();
  if (!ic) return 'ti';
  return ic.indexOf('ti ') === 0 ? ic : ('ti ' + ic);
}

function isAccountMobileNav() {
  var bp = window.IfluxBreakpoint;
  if (bp && bp.isMobileShell) return bp.isMobileShell();
  if (bp && bp.belowSemantic) return bp.belowSemantic('mobile-shell');
  return false;
}

function resolveAccountTabIdFromUrl() {
  try {
    var tab = new URLSearchParams(location.search).get('tab');
    if (!tab) return 'tab-affiliate';
    if (tab === 'personal' || tab === 'account') {
      return isAccountMobileNav() ? 'tab-profile' : 'tab-affiliate';
    }
    var map = {
      timeline: 'tab-affiliate',
      affiliate: 'tab-affiliate',
      payment: 'tab-payment',
      billing: 'tab-payment',
      privacy: 'tab-privacy',
      security: 'tab-security',
      profile: 'tab-profile'
    };
    if (map[tab]) return map[tab];
    if (tab.indexOf('tab-') === 0) return tab;
    return 'tab-' + tab;
  } catch (e) {
    return 'tab-affiliate';
  }
}

function clearEarlyAccountShellHtmlState() {
  var html = document.documentElement;
  html.removeAttribute('data-ifx-account-tab');
  html.removeAttribute('data-ifx-account-view');
}

function getActiveAccountTabIdFromResolver() {
  var shell = window.IfluxAppShell;
  if (shell && shell.resolveNavigationItems) {
    var items = shell.resolveNavigationItems('accountProfile', shell.resolveNavigationContext());
    var active = items.filter(function (it) { return it.active; })[0];
    if (active) return active.tabId;
  }
  return resolveAccountTabIdFromUrl();
}

function activateAccountProfilePanel(tabId) {
  document.querySelectorAll('.ix-profile-tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-ix-profile-tab') === tabId);
  });
  if (tabId === 'tab-profile') {
    document.querySelectorAll('.ix-tab-content').forEach(function (panel) {
      panel.classList.remove('active');
    });
    return;
  }
  document.querySelectorAll('.ix-tab-content').forEach(function (panel) {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

/** Mobile: sidebar chỉ trên tab Hồ sơ. Desktop: luôn hiện. */
function syncAccountMobileLayout(tabId) {
  tabId = tabId || getActiveAccountTabIdFromResolver();
  var app = document.querySelector('.ifx-app');
  if (!app) return;
  if (!isAccountMobileNav()) {
    app.removeAttribute('data-ifx-account-view');
    return;
  }
  app.setAttribute('data-ifx-account-view', tabId === 'tab-profile' ? 'profile' : 'sub');
}

function profileSidebarBound() {
  var sidebar = document.querySelector('[data-ifx-profile-sidebar]');
  return !!(sidebar && sidebar.getAttribute('data-ifx-bound') === '1');
}

/** Desktop: bind lúc boot. Mobile: chỉ khi tab Hồ sơ. */
function ensureProfileSidebar(tabId) {
  tabId = tabId || getActiveAccountTabIdFromResolver();
  if (!window.IfluxProfileSidebar) return;
  if (profileSidebarBound()) return;
  if (isAccountMobileNav()) {
    if (tabId !== 'tab-profile') return;
  }
  IfluxProfileSidebar.init();
}

/** Mobile bottom + desktop tabs — switch panel + URL SoT (resolver active). */
function switchAccountProfileTab(tabId) {
  if (window.IfluxAppShell && IfluxAppShell.syncAccountProfileTabUrl) {
    IfluxAppShell.syncAccountProfileTabUrl(tabId);
  }
  activateAccountProfilePanel(tabId);
  syncAccountMobileLayout(tabId);
  ensureProfileSidebar(tabId);
  if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) IfluxWebUI.syncMobileTabbar();
}

/** Desktop consumer — mobile không hydrate tab row (bottom nav là consumer). */
function renderAccountProfileTabs() {
  var mount = document.querySelector('[data-ifx-account-profile-tabs]');
  var shell = window.IfluxAppShell;
  if (!mount || !shell || !shell.resolveNavigationItems) return;
  if (isAccountMobileNav()) {
    mount.replaceChildren();
    syncAccountMobileLayout(getActiveAccountTabIdFromResolver());
    return;
  }
  var ctx = shell.resolveNavigationContext();
  var items = shell.resolveNavigationItems('accountProfile', ctx);
  mount.replaceChildren();
  items.forEach(function (it) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ix-profile-tab' + (it.active ? ' active' : '');
    btn.setAttribute('data-ix-profile-tab', it.tabId);
    var icon = document.createElement('i');
    icon.className = iconClass(it.icon);
    icon.style.fontSize = '14px';
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' ' + it.label));
    mount.appendChild(btn);
  });
  syncAccountMobileLayout(getActiveAccountTabIdFromResolver());
  activateAccountProfilePanel(getActiveAccountTabIdFromResolver());
}

window.IfluxAccountProfileNav = {
  switchTab: switchAccountProfileTab,
  isMobileNav: isAccountMobileNav,
  syncLayout: syncAccountMobileLayout
};

function queryProfileTargetId() {
  try {
    return (new URLSearchParams(location.search).get('user') ||
      new URLSearchParams(location.search).get('id') || '').trim();
  } catch (e) {
    return '';
  }
}

function isPublicProfileBoot() {
  var targetId = queryProfileTargetId();
  if (!targetId) return false;
  var me = window.IfluxAuth && IfluxAuth.getUser();
  return !(me && String(me.id) === String(targetId));
}

function bootAccountPage() {
  (function () {
    var p = new URLSearchParams(location.search);
    var uid0 = (p.get('user') || p.get('id') || '').trim();
    if (!uid0) {
      var t = p.get('tab');
      if (t === 'messages') {
        var peer = p.get('with') || p.get('peer');
        consumerNavigate('/tin-nhan' + (peer ? '?with=' + encodeURIComponent(peer) : ''));
        return;
      }
      if (t === 'following') {
        consumerNavigate('/tin-nhan/following');
        return;
      }
    }
  })();

  function bindProfileGotoTab() {
    document.querySelectorAll('[data-ifx-goto-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-ifx-goto-tab');
        switchAccountProfileTab(tabId);
        if (btn.getAttribute('data-ifx-goto-edit') === '1' && window.IfluxProfileSidebar) {
          setTimeout(function () { IfluxProfileSidebar.enterEditMode(); }, 0);
        }
      });
    });
  }

  function applyProfileUrlTab() {
    var params = new URLSearchParams(location.search);
    var tab = params.get('tab');
    if (!tab) {
      switchAccountProfileTab('tab-affiliate');
      clearEarlyAccountShellHtmlState();
      return;
    }
    if (tab === 'personal' || tab === 'account') {
      if (isAccountMobileNav()) {
        switchAccountProfileTab('tab-profile');
      } else {
        switchAccountProfileTab('tab-affiliate');
      }
      clearEarlyAccountShellHtmlState();
      if (params.get('edit') === '1') {
        setTimeout(function () {
          if (window.IfluxProfileSidebar) IfluxProfileSidebar.enterEditMode();
        }, 0);
      }
      return;
    }
    var map = {
      timeline: 'tab-affiliate',
      affiliate: 'tab-affiliate',
      payment: 'tab-payment', billing: 'tab-payment',
      privacy: 'tab-privacy',
      security: 'tab-security',
      profile: 'tab-profile'
    };
    var tabId = map[tab] || (tab.indexOf('tab-') === 0 ? tab : 'tab-' + tab);
    switchAccountProfileTab(tabId);
    clearEarlyAccountShellHtmlState();
  }

  function bindAccountTabUrlSync() {
    var mount = document.querySelector('[data-ifx-account-profile-tabs]');
    if (!mount || mount.dataset.ifxTabUrlSync === '1') return;
    mount.dataset.ifxTabUrlSync = '1';
    mount.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ix-profile-tab]');
      if (!btn) return;
      var tabId = btn.getAttribute('data-ix-profile-tab');
      switchAccountProfileTab(tabId);
    });
  }

  if (!window.__ifxAccountProfileResizeBound) {
    window.__ifxAccountProfileResizeBound = true;
    window.addEventListener('resize', function () {
      renderAccountProfileTabs();
      ensureProfileSidebar(getActiveAccountTabIdFromResolver());
      if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) IfluxWebUI.syncMobileTabbar();
    });
  }

  var profileMode = window.IfluxProfileView ? IfluxProfileView.init() : 'own';
  if (profileMode !== 'own') return;

  bindAccountTabUrlSync();
  bindProfileGotoTab();
  applyProfileUrlTab();
  renderAccountProfileTabs();
  if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) IfluxWebUI.syncMobileTabbar();
  ensureProfileSidebar(getActiveAccountTabIdFromResolver());
  if (window.IfluxProfileAffiliate) IfluxProfileAffiliate.init();
  if (window.IfluxProfilePaymentPage) IfluxProfilePaymentPage.init();
  if (window.IfluxProfilePrivacyPage) IfluxProfilePrivacyPage.init();
  if (window.IfluxProfileSecurityPage) IfluxProfileSecurityPage.init();
  if (window.IfluxUserNotificationsUI) IfluxUserNotificationsUI.refresh();
}

async function main() {
  await waitShellReady('account');
  var scripts = CORE_SCRIPTS.slice();
  if (isPublicProfileBoot()) {
    scripts = scripts.concat(PUBLIC_PROFILE_SCRIPTS);
  }
  await loadScriptsSequential(scripts);
  bootAccountPage();
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Account Feature] boot failed', err);
});
