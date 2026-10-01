/**
 * Phase A — Feature /chia-se sau Shell bootstrap.
 * P5 — path-only affiliate; không parse query ref/r.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=r20260928q';

var ASSET = '/User_Web/iflux-web-ui/';

var FEATURE = [
  ASSET + 'loyalty-affiliate-store.js?v=r20260928n',
  '/Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js?v=r20261001a'
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
    window.IfluxShellUrlWriter.navigate('/trang-chu', { replace: true });
  } else {
    window.location.replace('/trang-chu');
  }
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Share Feature] boot failed', err);
});
