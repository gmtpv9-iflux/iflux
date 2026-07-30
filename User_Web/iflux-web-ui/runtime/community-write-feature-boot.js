/**
 * Phase A — Feature Viết bài Cộng đồng sau App Shell Entry.
 * Hiện tạm đóng UI viết bài (entitlement communityWrite = false toàn hệ thống).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

var FEATURE_SCRIPTS = [
  ASSET + 'community-write-page.js?v=b4w2Nav20260727'
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
  await waitShellReady('communityWrite');
  await loadScriptsSequential(FEATURE_SCRIPTS);
  if (window.IfluxCommunityWritePage) IfluxCommunityWritePage.init();
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Community Write Feature] boot failed', err);
});
