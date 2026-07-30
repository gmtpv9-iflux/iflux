/**
 * Phase A — Feature /chia-se sau Shell bootstrap.
 * P5 — path-only affiliate; không parse query ref/r.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=shareAffP5_20260727';

var ASSET = '/User_Web/iflux-web-ui/';

var FEATURE = [
  ASSET + 'loyalty-affiliate-store.js?v=shareAffP5_20260727',
  '/Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js?v=p7ShareSheet20260730'
];

function waitShell(pageKey) {
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
  await waitShell('share');
  await loadScriptsSequential(FEATURE);
  var Store = window.IfluxInsightShareStore;
  if (Store) {
    Store.clearShareStorage();
    Store.registerUrlAttribution();
  }
  /* P6-API-01 — internal nav chỉ Writer.navigate */
  if (window.IfluxShellUrlWriter && window.IfluxShellUrlWriter.navigate) {
    window.IfluxShellUrlWriter.navigate('/nha-cua-toi', { replace: true });
  } else {
    window.location.replace('/nha-cua-toi');
  }
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Share Feature] boot failed', err);
});
