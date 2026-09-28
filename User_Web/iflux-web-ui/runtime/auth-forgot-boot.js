import { loadScriptsSequential } from './legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=appHeader20260928',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js',
  ADMIN + 'iflux-credentials-store.js',
  ASSET + 'iflux-user-data-sync.js',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=appHeader20260928',
  ASSET + 'auth-forgot-init.js?v=phaseA20260721c'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Forgot] boot failed', err);
});
