import { loadScriptsSequential } from './legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

var ALL = [
  ASSET + 'iflux-platform-boot.js?v=9623ca3514',
  ASSET + 'iflux-api-bundle.js?v=aacd7e48c9',
  '/design_system/04_components/17_toast/toast.js?v=r20260928q',
  ASSET + 'auth.js?v=f9a8ae35e7',
  ASSET + 'auth-forms.js?v=5858563dfd',
  ADMIN + 'iflux-credentials-store.js?v=r20260928n',
  ASSET + 'iflux-user-data-sync.js?v=c4488ad741',
  ASSET + 'iflux-web-ui.js?v=04336eb4aa',
  ASSET + 'auth-forgot-init.js?v=915bfb26e2'
];

loadScriptsSequential(ALL).catch(function (err) {
  if (window.console && console.error) console.error('[Auth Forgot] boot failed', err);
});
