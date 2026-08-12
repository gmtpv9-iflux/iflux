/**
 * Phase A — Auth Shell Entry tối thiểu (R3).
 * Chỉ platform + api + auth. Feature auth (form/OTP/social) nạp sau trong HTML.
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

var SHELL = [
  ASSET + 'iflux-platform-boot.js?v=phaseA20260721c',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js'
];

async function main() {
  await loadScriptsSequential(SHELL);
  window.__IFLUX_SHELL_READY = 'auth';
  window.dispatchEvent(new CustomEvent('iflux-shell-ready', { detail: { pageKey: 'auth' } }));
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Auth Shell] boot failed', err);
});
