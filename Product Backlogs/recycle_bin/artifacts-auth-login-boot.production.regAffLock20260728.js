/**
 * Phase A — Auth login: Shell Entry tối thiểu + Feature (không viết lại nghiệp vụ).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var SHELL = [
  ASSET + 'iflux-platform-boot.js?v=homeCd20260724',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js?v=regSoT_20260728'
];

var FEATURE = [
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=20260706',
  ASSET + 'loyalty-affiliate-store.js?v=regAffLock20260728',
  ASSET + 'auth-social.js?v=googleProxy20260728',
  ASSET + 'iflux-user-data-sync.js?v=btnRace20260728',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=phaseA20260721c',
  ASSET + 'auth-login-init.js?v=btnRace20260728'
];

async function main() {
  await loadScriptsSequential(SHELL.concat(FEATURE));
  window.__IFLUX_SHELL_READY = 'auth';
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Auth Login] boot failed', err);
});
