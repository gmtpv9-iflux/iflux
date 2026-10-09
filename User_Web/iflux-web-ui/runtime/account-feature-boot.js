/**
 * Phase A — Feature Tài khoản (sau App Shell Entry).
 * Wave C — CORE boot (~22 script) · PUBLIC lazy khi ?user= xem hồ sơ người khác.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=dec30759da';
import { mountPageWidgets } from './page-widgets.js?v=e4c886756c';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var VER = 'pageFrame20260928';

/** Own account — tab Affiliate · Thanh toán · Quyền riêng tư · Mật khẩu · sidebar */
var CORE_SCRIPTS = [
  ASSET + 'profile-local-scope.js?v=b96a094057' + VER,
  ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
  ASSET + 'profile-users-store.js?v=4fb82084de',
  ASSET + 'profile-links.js?v=31f14c2ed9',
  ASSET + 'profile-follow-store.js?v=7a97f86263' + VER,
  ASSET + 'profile-avatar.js?v=8eb9a8b60d',
  ASSET + 'profile-view.js?v=b38bbd490a' + VER,
  ASSET + 'iflux-plans-catalog.js?v=58ef6c230e',
  ASSET + 'profile-bind.js?v=4bc9f42545' + VER,
  ASSET + 'loyalty-affiliate-store.js?v=b225fb0132' + VER,
  ASSET + 'affiliate-payout-store.js?v=c3c0f9375b',
  ASSET + 'affiliate-payout-ui.js?v=995d3eec51',
  ASSET + 'profile-affiliate.js?v=fb3477ca1e' + VER,
  ASSET + 'subscription-orders-store.js?v=c6beeaca9e',
  ASSET + 'profile-payment-store.js?v=3e1d3b162b',
  ASSET + 'profile-payment-page.js?v=01104c12a0',
  ASSET + 'profile-privacy-store.js?v=d206957542',
  ASSET + 'notification-preference-store.js?v=16ff7f1479',
  ASSET + 'profile-privacy-page.js?v=f77d2a4f93',
  ASSET + 'client-local-notification-types.js?v=32f1add69c',
  ASSET + 'inapp-notifications.js?v=73382215b8',
  ASSET + 'profile-security-page.js?v=0b0607149c'
];

/** Public profile (?user=) — follow · block · chat gate · timeline */
var PUBLIC_PROFILE_SCRIPTS = [
  ADMIN + 'iflux-customers-store.js',
  ASSET + 'profile-friend-store.js?v=8a4ea4af6d',
  ASSET + 'profile-block-store.js?v=901ca0d67c',
  ASSET + 'profile-chat-access.js?v=bedda7bf40',
  ASSET + 'profile-chat-store.js?v=d551f20f1b',
  ASSET + 'stock-mentions.js?v=63b1553d75',
  ASSET + 'stock-store.js?v=4dc55126ff',
  ASSET + 'news-store.js?v=84bb9b875c',
  ASSET + 'news-ui.js?v=8bd1108a4b',
  ASSET + 'profile-page.js?v=5a969de78b'
];

/* Chờ Shell sẵn sàng — tổng quát theo pageKey (mảng chấp nhận nhiều key), vì script này giờ
 * boot từ CẢ 2 ngữ cảnh: trang tĩnh SHELL_ONLY cũ ('account', bắn qua event 'iflux-shell-ready')
 * LẪN trang composite mới ('home' — Cá nhân, Shell đã sẵn sàng ngay khi page-runtime gọi tới
 * composite widget, không bắn event riêng — coi như sẵn sàng luôn). */
function waitShellReady(pageKeys) {
  var keys = [].concat(pageKeys);
  if (keys.indexOf(window.__IFLUX_SHELL_READY) >= 0) return Promise.resolve();
  if (keys.indexOf('home') >= 0 && document.querySelector('[data-ifx-page-runtime]')) {
    /* Composite page (vd Cá nhân): page-runtime đã mount tới widget này nghĩa là Shell xong rồi. */
    return Promise.resolve();
  }
  return new Promise(function (resolve) {
    function onReady(ev) {
      if (ev.detail && keys.indexOf(ev.detail.pageKey) >= 0) {
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
  /* Tab Dashboard (chỉ có ở trang Cá nhân mới) mount lazy qua cầu nối widgets/home-page —
     không mount sẵn vì canvas dashboard-engine khá nặng (template loader, watchlist…). */
  if (tabId === 'tab-dashboard' && window.IfluxHomeDashboardTab && window.IfluxHomeDashboardTab.ensureMounted) {
    var panel = document.getElementById('tab-dashboard');
    if (panel) window.IfluxHomeDashboardTab.ensureMounted(panel);
  }
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
      /* Không ?tab= → mặc định theo resolver (tab-dashboard ở trang Cá nhân mới /ca-nhan,
         tab-affiliate ở /tai-khoan cũ — xem resolveActiveAccountTabId trong iflux-platform-boot.js). */
      switchAccountProfileTab(getActiveAccountTabIdFromResolver());
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

/** Gọi lại được nhiều lần (export) — trang Cá nhân mới (composite, soft-nav) rebuild DOM mỗi lần
 * ghé lại nên cần boot lại để bind đúng node mới; loadScriptsSequential tự cache theo src, gọi
 * lại không tải/":chạy đôi" classic script. */
export async function boot() {
  await waitShellReady(['account', 'home']);
  var scripts = CORE_SCRIPTS.slice();
  if (isPublicProfileBoot()) {
    scripts = scripts.concat(PUBLIC_PROFILE_SCRIPTS);
  }
  await loadScriptsSequential(scripts);
  bootAccountPage();
  /* Widget Placement publishKey 'account' — CHỈ cho trang /tai-khoan cũ (SHELL_ONLY). Trang Cá
     nhân mới (pageKey 'home') tự quản sidebar/widget riêng, không qua publishKey này nữa. */
  if (window.__IFLUX_SHELL_READY === 'account') {
    var layout = document.querySelector('.ifx-shell-layout');
    if (layout) await mountPageWidgets(layout.parentElement, 'account');
  }
}

/* /tai-khoan cũ (SHELL_ONLY, luôn hard-reload) → tự boot khi module nạp, như trước giờ.
   Trang Cá nhân mới (composite, có [data-ifx-page-runtime]) soft-nav rebuild DOM mỗi lần ghé —
   widgets/home-page/index.js tự gọi boot() lại sau khi dựng markup, KHÔNG tự boot ở đây (tránh
   chạy 2 lần trên cùng 1 DOM lúc mới vào trang lần đầu). */
if (!document.querySelector('[data-ifx-page-runtime]')) {
  boot().catch(function (err) {
    if (window.console && console.error) console.error('[Account Feature] boot failed', err);
  });
}
