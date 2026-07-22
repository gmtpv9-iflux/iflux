import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-PRF-002', title: 'Gói Promotion' };

export async function mount(el) {
  await ensureSequence([
    { global: 'IfluxAuth', src: ASSET + 'auth.js' },
    { global: 'IfluxPlansCatalog', src: ASSET + 'iflux-plans-catalog.js' },
    { global: 'ProfileBind', src: ASSET + 'profile-bind.js' },
    { global: 'IfluxProfileSidebarWidgets', src: ASSET + 'profile-sidebar-widgets.js' }
  ]);
  IfluxProfileSidebarWidgets.bindPlanWidget(el);
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}
