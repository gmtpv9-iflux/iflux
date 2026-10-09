import { loadScriptsSequential } from './legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=9623ca3514',
  ASSET + 'iflux-api-bundle.js?v=aacd7e48c9',
  '/design_system/04_components/17_toast/toast.js?v=r20260928q',
  ASSET + 'auth.js?v=f9a8ae35e7',
  ASSET + 'auth-forms.js?v=5858563dfd',
  ADMIN + 'iflux-customers-store.js',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'loyalty-affiliate-store.js?v=b225fb0132',
  ASSET + 'iflux-otp-input.js?v=eb09ba649a',
  ASSET + 'iflux-mail-deeplink.js?v=458ad345d5',
  ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
  ASSET + 'iflux-web-ui.js?v=36db72f0c8',
  ASSET + 'auth-otp-init.js?v=2e18d783a0'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth OTP] boot failed', err);
});
