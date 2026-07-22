import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=phaseA20260721c',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js?v=20260708social',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=20260706',
  ASSET + 'loyalty-affiliate-store.js',
  ASSET + 'auth-social.js?v=20260708social',
  ASSET + 'iflux-user-data-sync.js',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=phaseA20260721c',
  ASSET + 'auth-register-init.js?v=phaseA20260721c'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Register] boot failed', err);
});
