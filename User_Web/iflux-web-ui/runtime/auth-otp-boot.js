import { loadScriptsSequential } from './legacy-bridge.js?v=r20260928q';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=appHeader20260928',
  ASSET + 'iflux-api-bundle.js',
  '/design_system/04_components/17_toast/toast.js?v=r20260928q',
  ASSET + 'auth.js?v=r20260928q',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'loyalty-affiliate-store.js?v=r20260928n',
  ASSET + 'iflux-otp-input.js?v=20260708otp',
  ASSET + 'iflux-mail-deeplink.js?v=20260708otp',
  ASSET + 'iflux-user-data-sync.js?v=r20260928n',
  ASSET + 'iflux-web-ui.js?v=r20261001a',
  ASSET + 'auth-otp-init.js?v=r20260928q'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth OTP] boot failed', err);
});
