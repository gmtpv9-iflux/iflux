import { loadScriptsSequential } from './legacy-bridge.js?v=r20260928n';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=appHeader20260928',
  ASSET + 'iflux-api-bundle.js',
  ASSET + 'auth.js?v=r20260928n',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'loyalty-affiliate-store.js?v=r20260928n',
  ASSET + 'iflux-otp-input.js?v=20260708otp',
  ASSET + 'iflux-mail-deeplink.js?v=20260708otp',
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ADMIN + 'iflux-admin-ui.js',
  ASSET + 'iflux-web-ui.js?v=r20260928n',
  ASSET + 'auth-otp-init.js?v=homeCd20260724'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth OTP] boot failed', err);
});
