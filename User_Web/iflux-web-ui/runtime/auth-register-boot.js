import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=homeCd20260724',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js?v=regSoT_20260728',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=20260706',
  ASSET + 'loyalty-affiliate-store.js?v=shareAffP5_20260727',
  ASSET + 'auth-social.js?v=affiliateE2E20260728',
  ASSET + 'iflux-user-data-sync.js',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=phaseA20260721c',
  ASSET + 'auth-register-init.js?v=shareAffP5_20260727'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Register] boot failed', err);
});
