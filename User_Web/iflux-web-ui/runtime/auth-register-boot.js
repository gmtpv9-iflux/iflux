import { loadScriptsSequential } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=homeCd20260724',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js?v=p6Writer20260730',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=20260706',
  ASSET + 'loyalty-affiliate-store.js?v=regAffLock20260728',
  ASSET + 'auth-social.js?v=gisBtnUi20260730',
  ASSET + 'iflux-user-data-sync.js?v=btnRace20260728',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=phaseA20260721c',
  ASSET + 'auth-register-init.js?v=gisArch20260730'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Register] boot failed', err);
});
