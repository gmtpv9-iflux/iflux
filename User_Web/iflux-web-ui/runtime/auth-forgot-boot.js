import { loadScriptsSequential } from './legacy-bridge.js?v=r20261002communityfix';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=r20261003l',
  ASSET + 'iflux-api-bundle.js',
  '/design_system/04_components/17_toast/toast.js?v=r20260928q',
  ASSET + 'auth.js?v=r20261002g',
  ASSET + 'auth-forms.js?v=r20261002g',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ASSET + 'iflux-web-ui.js?v=r20261009c',
  ASSET + 'auth-forgot-init.js?v=r20261009c'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Forgot] boot failed', err);
});
