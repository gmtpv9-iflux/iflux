/**
 * Phase A — Feature Checkout sau App Shell Entry.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var FEATURE_SCRIPTS = [
  ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
  ASSET + 'iflux-plans-catalog.js?v=58ef6c230e',
  /* W4: market stack = Shell MARKET_PLATFORM (checkout) */
  ASSET + 'stock-mentions.js?v=63b1553d75',
  ASSET + 'loyalty-coupon-store.js?v=7e19d32c79',
  ASSET + 'loyalty-affiliate-store.js?v=b225fb0132',
  ASSET + 'client-local-notification-types.js?v=32f1add69c',
  ASSET + 'inapp-notifications.js?v=73382215b8',
  ASSET + 'subscription-orders-store.js?v=c6beeaca9e',
  ADMIN + 'iflux-customers-store.js',
  ASSET + 'checkout-page.js?v=7f856d90c2'
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
