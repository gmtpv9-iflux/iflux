/**
 * Feature /binh-luan — Slice 4.5: API-only Host (không dual-read LS).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var V = '?v=ixP5s520260724';

var IX_FEATURE = [
  ASSET + 'iflux-user-data-sync.js',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'news-store.js' + V,
  ASSET + 'comment-composer.js' + V,
  ASSET + 'interaction/boot.js' + V,
  ASSET + 'comments-page.js' + V
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
