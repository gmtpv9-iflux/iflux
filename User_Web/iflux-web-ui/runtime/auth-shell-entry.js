/**
 * Phase A — Auth Shell Entry tối thiểu (R3).
 * Chỉ platform + api + auth. Feature auth (form/OTP/social) nạp sau trong HTML.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';

var SHELL = [
  ASSET + 'iflux-platform-boot.js?v=9623ca3514',
  ASSET + 'iflux-api-bundle.js?v=aacd7e48c9',
  ASSET + 'auth.js?v=f9a8ae35e7'
];

async function main() {
  await loadScriptsSequential(SHELL);
  window.__IFLUX_SHELL_READY = 'auth';
  window.dispatchEvent(new CustomEvent('iflux-shell-ready', { detail: { pageKey: 'auth' } }));
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Auth Shell] boot failed', err);
});
