/**
 * Phase A — Feature chi tiết bình luận CP (sau Shell bootstrap).
 * Backlog: URL Việt chuẩn (vd /co-phieu/{ticker}/binh-luan/{id}) — không làm trong A.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var FEATURE = [
  ASSET + 'iflux-user-data-sync.js',
  /* W4: seo + market stack = Shell MARKET_PLATFORM (stockComment) */
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'stock-mentions.js',
  ASSET + 'stock-scroll-feed.js',
  ASSET + 'stock-store.js',
  ASSET + 'profile-users-store.js',
  ASSET + 'profile-links.js',
  ASSET + 'stock-comments-ui.js',
  ASSET + 'stock-comment-page.js'
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
  await waitShell('stockComment');
  await loadScriptsSequential(FEATURE);
  if (window.IfluxStockCommentPage) IfluxStockCommentPage.init();
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Stock Comment Feature] boot failed', err);
});
