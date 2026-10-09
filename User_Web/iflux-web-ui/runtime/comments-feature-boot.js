/**
 * Feature /binh-luan — Slice 4.5: API-only Host (không dual-read LS).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var V = '?v=r20261008c';

var IX_FEATURE = [
  ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
  ASSET + 'news-store.js?v=84bb9b875c' + V,
  ASSET + 'comment-composer.js?v=6c56717875',
  ASSET + 'interaction/boot.js?v=41e479c913',
  ASSET + 'comments-page.js?v=0bc42a108d'
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
  await waitShell('comments');
  await loadScriptsSequential(IX_FEATURE);
  /* Retire key — không cần stock-store */
  try {
    var KEY = 'iflux_stock_comments_v6';
    if (localStorage.getItem(KEY)) {
      localStorage.removeItem(KEY);
      document.dispatchEvent(new CustomEvent('iflux-stock-comments-change'));
    }
  } catch (e) { /* ignore */ }
  if (window.IfluxCommentsPage) IfluxCommentsPage.init();
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Comments Feature] boot failed', err);
});
