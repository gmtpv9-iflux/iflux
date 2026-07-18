/**
 * WGT-COM-002 — Thành viên tích cực (ESM lazy Widget module)
 */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-COM-002',
  title: 'Thành viên tích cực'
};

/** Giữ nguyên URL deps; nhóm tiers theo pattern Blueprint (community-page / flow-page). */
var DEPS_TIERS = [
  [
    ASSET + 'stock-store.js',
    ASSET + 'profile-users-store.js',
    ASSET + 'profile-links.js'
  ],
  [
    ASSET + 'community-active-members.js'
  ]
];

export async function mount(el, ctx) {
  if (!el) return;
  await loadScriptTiers(DEPS_TIERS);
  if (!window.IfluxCommunityActiveMembers) {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu community-active-members.js</div>';
    return;
  }
  window.IfluxCommunityActiveMembers.mount(el);
  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
