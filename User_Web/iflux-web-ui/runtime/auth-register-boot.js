import { loadScriptsSequential } from './legacy-bridge.js?v=r20261002communityfix';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=r20261003l',
  ASSET + 'iflux-api-bundle.js',
  '/design_system/04_components/17_toast/toast.js?v=r20260928q',
  ASSET + 'auth.js?v=r20261002g',
  ASSET + 'auth-forms.js?v=r20261002g',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'loyalty-affiliate-store.js?v=r20260928n',
  ASSET + 'auth-social.js?v=affOwnerRead20260808',
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ASSET + 'iflux-web-ui.js?v=r20261003m',
  ASSET + 'auth-register-init.js?v=r20260928q'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Register] boot failed', err);
});
