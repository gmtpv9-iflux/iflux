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
  ASSET + 'auth-social.js?v=a9cdec32bc',
  ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
  ASSET + 'iflux-web-ui.js?v=e5768ce7d6',
  ASSET + 'auth-register-init.js?v=821ca893e9'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Register] boot failed', err);
});
