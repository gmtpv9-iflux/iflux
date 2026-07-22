/**
 * Phase A — Feature /chia-se sau Shell bootstrap.
 * Hành vi hiện tại Production: attribution + redirect Nhà (giữ nguyên nghiệp vụ).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

var FEATURE = [
  ASSET + 'loyalty-affiliate-store.js',
  ASSET + 'insight-share-store.js'
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
  var params = new URLSearchParams(location.search || '');
  var ref = params.get('ref') || params.get('r') || '';
  var dest = '/nha-cua-toi' + (ref ? '?ref=' + encodeURIComponent(ref) : '');
  window.location.replace(dest);
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Share Feature] boot failed', err);
});
