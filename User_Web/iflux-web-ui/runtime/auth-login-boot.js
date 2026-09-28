/**
 * Phase A — Auth login: Shell Entry tối thiểu + Feature (không viết lại nghiệp vụ).
 */
import { loadScriptsSequential } from './legacy-bridge.js?v=r20260928q';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var SHELL = [
  ASSET + 'iflux-platform-boot.js?v=appHeader20260928',
  ASSET + 'iflux-api-bundle.js',
  '/design_system/04_components/17_toast/toast.js?v=r20260928q',
  ASSET + 'auth.js?v=r20260928q'
];

var FEATURE = [
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'loyalty-affiliate-store.js?v=r20260928n',
  ASSET + 'auth-social.js?v=affOwnerRead20260808',
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ASSET + 'iflux-web-ui.js?v=r20260928q',
  ASSET + 'auth-login-init.js?v=r20260928q'
];

async function main() {
  await loadScriptsSequential(SHELL.concat(FEATURE));
  window.__IFLUX_SHELL_READY = 'auth';
}

main().catch(function (err) {
  if (window.console && console.error) console.error('[Auth Login] boot failed', err);
});
