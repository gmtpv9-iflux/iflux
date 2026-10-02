/**
 * Phase A — Feature Checkout sau App Shell Entry.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=r20261002communityfix';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var FEATURE_SCRIPTS = [
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ASSET + 'iflux-plans-catalog.js?v=r20260928n',
  /* W4: market stack = Shell MARKET_PLATFORM (checkout) */
  ASSET + 'stock-mentions.js?v=r20260928n',
  ASSET + 'loyalty-coupon-store.js',
  ASSET + 'loyalty-affiliate-store.js?v=r20260928n',
  ASSET + 'client-local-notification-types.js?v=notifPhaseD4_20260728',
  ASSET + 'inapp-notifications.js?v=notifPhaseD4_20260728',
  ASSET + 'subscription-orders-store.js?v=r20260928n',
  ADMIN + 'iflux-customers-store.js',
  ASSET + 'checkout-page.js'
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

async function main() {
  await waitShellReady('checkout');
  await loadScriptsSequential(FEATURE_SCRIPTS);
  function start() {
    if (window.IfluxCheckoutPage) IfluxCheckoutPage.init();
  }
  if (window.PlansRuntimeReader && PlansRuntimeReader.load) {
    PlansRuntimeReader.load().then(start).catch(start);
  } else {
    start();
  }
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Checkout Feature] boot failed', err);
});
