/**
 * Slice 4.5 — stock-comment URL cũ: chỉ redirect → /binh-luan (không nạp LS UI).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var V = '?v=b4w3_20260727';

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
  await waitShell('stockComment');
  await loadScriptsSequential([ASSET + 'stock-comment-page.js' + V]);
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Stock Comment Feature] boot failed', err);
});
