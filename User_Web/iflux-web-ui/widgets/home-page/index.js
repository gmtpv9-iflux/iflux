/**
 * WGT-HOME-PAGE — Trang chủ composite (/trang-chu)
 *
 * Đăng nhập: Sidebar (Widget Placement Admin + Gói cước) + Main 3 tab
 *   Dashboard (watchlist + xây nhà, giữ nguyên WGT-HOME-DASH) | Timeline | Hoạt động gần đây.
 * Vãng lai: không sidebar, landing phẳng — nội dung Discovery/giới thiệu iFlux bổ sung sau.
 */
import { buildPageFrame, applyHubLayout } from '../../runtime/app-shell.js?v=appHeader20260928';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260929e';
import { loadWidget } from '../../runtime/widget-loader.js?v=r20260928q';
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=r20260928q';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { id: 'WGT-HOME-PAGE', title: 'Trang chủ' };

var TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
  { key: 'timeline', label: 'Timeline', icon: 'ti-timeline' },
  { key: 'activity', label: 'Hoạt động gần đây', icon: 'ti-history' }
];

function tabsBarHtml(active) {
  var btns = TABS.map(function (t) {
    return '<button type="button" class="ix-tab' + (t.key === active ? ' active' : '') +
      '" role="tab" aria-selected="' + (t.key === active) + '" data-ifx-home-tab="' + t.key + '">' +
      '<i class="ti ' + t.icon + '"></i> ' + t.label + '</button>';
  }).join('');
  return '<div class="ix-tabs" role="tablist" data-ifx-home-tabs>' + btns + '</div>';
}

function panelHtml(key, active) {
  return '<div class="ix-tab-content' + (key === active ? ' active' : '') + '" data-ifx-home-panel="' + key + '"></div>';
}

async function mountDashboardTab(panelEl) {
  if (panelEl._ifxMounted) return;
  panelEl._ifxMounted = true;
  var mod = await import('../home-dashboard/index.js' + '?v=r20261002a');
  await mod.mount(panelEl);
}

async function mountTimelineTab(panelEl) {
  if (panelEl._ifxMounted) return;
  panelEl._ifxMounted = true;
  panelEl.innerHTML = '<div id="ifx-profile-timeline"></div>';
  await ensureSequence([{ global: 'IfluxProfilePage', src: ASSET + 'profile-page.js' }]);
  if (window.IfluxProfilePage) IfluxProfilePage.renderTimeline();
}

async function mountActivityTab(panelEl) {
  if (panelEl._ifxMounted) return;
  panelEl._ifxMounted = true;
  panelEl.innerHTML = '<div id="ifx-profile-activity"></div>';
  await ensureSequence([
    { global: 'IfluxProfileActivityStore', src: ASSET + 'profile-activity-store.js' },
    { global: 'IfluxProfileActivityPage', src: ASSET + 'profile-activity-page.js' }
  ]);
  if (window.IfluxProfileActivityPage) IfluxProfileActivityPage.init();
}

var TAB_MOUNTERS = { dashboard: mountDashboardTab, timeline: mountTimelineTab, activity: mountActivityTab };

function wireTabs(root) {
  var bar = root.querySelector('[data-ifx-home-tabs]');
  if (!bar) return;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ifx-home-tab]');
    if (!btn || btn.classList.contains('active')) return;
    var key = btn.getAttribute('data-ifx-home-tab');
    bar.querySelectorAll('.ix-tab').forEach(function (b) {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    root.querySelectorAll('[data-ifx-home-panel]').forEach(function (p) {
      var active = p.getAttribute('data-ifx-home-panel') === key;
      p.classList.toggle('active', active);
      if (active && TAB_MOUNTERS[key]) TAB_MOUNTERS[key](p);
    });
  });
}

async function mountLoggedIn(el) {
  var frame = buildPageFrame(el, { sidebarLabel: 'Trang chủ' });
  applyHubLayout(el);
  frame.mainContent.innerHTML =
    tabsBarHtml('dashboard') +
    panelHtml('dashboard', 'dashboard') +
    panelHtml('timeline', 'dashboard') +
    panelHtml('activity', 'dashboard');
  wireTabs(frame.mainContent);

  /* Gói cước — widget trang tĩnh, luôn hiện, không qua Widget Placement Admin. */
  await loadWidget({
    id: 'WGT-PRF-002',
    lazyModule: ASSET + 'widgets/plan-promo/index.js?v=r20260929e',
    css: [ASSET + 'hub.css?v=r20260928n', ASSET + 'profile.css?v=r20260928n']
  }, frame.sidebarContent, {});

  /* Widget Placement Admin (Cài đặt trang "dashboard") — sidebar/main còn lại nếu Admin bật. */
  await mountPageWidgets(el, 'dashboard', { gateKey: 'home' });

  var firstPanel = frame.mainContent.querySelector('[data-ifx-home-panel="dashboard"]');
  if (firstPanel) await mountDashboardTab(firstPanel);
}

function mountGuest(el) {
  el.innerHTML = '<h1 class="ix-page-title">Trang chủ vãng lai</h1>';
}

export async function mount(el) {
  var loggedIn = !!(window.IfluxAuth && IfluxAuth.isLoggedIn());
  var greet = document.querySelector('.ifx-hub-greet-row');
  if (greet) greet.hidden = !loggedIn;
  if (loggedIn) {
    await mountLoggedIn(el);
  } else {
    mountGuest(el);
  }
  return {
    unmount: function () { if (el) el.innerHTML = ''; }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
