import { ensureSequence } from '../../runtime/legacy-bridge.js?v=r20261002communityfix';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-PRF-002', title: 'Gói Promotion' };

export async function mount(el) {
  await ensureSequence([
    { global: 'IfluxAuth', src: ASSET + 'auth.js?v=r20261002g' },
    { global: 'IfluxPlansCatalog', src: ASSET + 'iflux-plans-catalog.js?v=r20260928n' },
    { global: 'ProfileBind', src: ASSET + 'profile-bind.js?v=r20260928q' },
    { global: 'IfluxProfileSidebarWidgets', src: ASSET + 'profile-sidebar-widgets.js' }
  ]);
  IfluxProfileSidebarWidgets.bindPlanWidget(el);
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}
