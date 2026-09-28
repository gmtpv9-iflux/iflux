import { loadScriptsSequential } from './legacy-bridge.js?v=r20260928n';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=appHeader20260928',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js?v=r20260928n',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=r20260928n',
  ASSET + 'auth-forgot-init.js?v=phaseA20260721c'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Forgot] boot failed', err);
});
