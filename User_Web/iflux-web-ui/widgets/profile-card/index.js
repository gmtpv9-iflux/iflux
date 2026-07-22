import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/';

export const meta = { id: 'WGT-PRF-001', title: 'Thông tin hồ sơ' };

export async function mount(el) {
  await ensureSequence([
    { global: 'IfluxAuth', src: ASSET + 'auth.js' },
    { global: 'IfluxProfileAvatar', src: ASSET + 'profile-avatar.js' },
    { global: 'IfluxPlansCatalog', src: ASSET + 'iflux-plans-catalog.js' },
    { global: 'ProfileBind', src: ASSET + 'profile-bind.js' },
    { global: 'IfluxProfileSidebarWidgets', src: ASSET + 'profile-sidebar-widgets.js' }
  ]);
  IfluxProfileSidebarWidgets.bindProfileWidget(el);
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}
