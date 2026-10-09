import { ensureSequence } from '../../runtime/legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-PRF-002', title: 'Gói Promotion' };

export async function mount(el) {
  await ensureSequence([
    { global: 'IfluxAuth', src: ASSET + 'auth.js?v=f9a8ae35e7' },
    { global: 'IfluxPlansCatalog', src: ASSET + 'iflux-plans-catalog.js?v=58ef6c230e' },
    { global: 'ProfileBind', src: ASSET + 'profile-bind.js?v=4bc9f42545' },
    { global: 'IfluxProfileSidebarWidgets', src: ASSET + 'profile-sidebar-widgets.js?v=8a2d029750' }
  ]);
  IfluxProfileSidebarWidgets.bindPlanWidget(el);
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}
