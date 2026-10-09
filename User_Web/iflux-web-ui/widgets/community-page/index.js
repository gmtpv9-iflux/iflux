/**
 * WGT-COMMUNITY-PAGE — Composite Cộng đồng (mạng xã hội nhà đầu tư)
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * Khung trang dùng đúng buildPageFrame({ rightSidebar: true }) — Sidebar trái (3/12) +
 * Main (7/12) + Sidebar phải (2/12). Main (Composer/Timeline) vẫn do community-page.js tự
 * dựng (dữ liệu thật qua API, không phải Widget Host). Sidebar trái (2026-10, Phase 5):
 * ĐÃ bỏ seed/hardcode tạm ("Mã được thảo luận nhiều"/"Nhà đầu tư nên theo dõi") — Widget Host
 * thật qua mountPageWidgets('community', {sectionFilter:['sidebar']}), apply đúng Cài đặt
 * trang > Widget Placement > Cộng đồng > Sidebar trái. pageKey 'community' cùng nguồn Admin
 * đang publish vào (xác nhận GET /api/pages/community trả version mới nhất, không còn là
 * bản ghi cũ trước Topic Engine — bản ghi đó đã bị version mới nhất thay thế khi Admin publish
 * lại). "Chủ đề đang thịnh hành" vẫn do community-page.js tự vẽ (dữ liệu Topic thật, Owner
 * 2026-10 chốt vị trí ở Sidebar trái — không qua Widget Placement). */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=dec30759da';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=4460ae8318';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-COMMUNITY-PAGE', title: 'Cộng đồng' };

/* Phase 4 (2026-10-03): community-store.js (API client Post+Story thật) tải TRƯỚC
   community-page.js — community-page.js gọi global.IfluxCommunityStore ngay lúc init(). */
var CORE_TIERS = [
  [ASSET + 'community-store.js?v=17b421d80c'],
  [ASSET + 'community-page.js?v=8fdba340ea']
];

export async function mount(el) {
  el.innerHTML = '';
  var frame = buildPageFrame(el, { rightSidebar: true, sidebarLabel: 'Sidebar Cộng đồng' });
  var rightAside = el.querySelector('.ifx-shell-sidebar-right');
  frame.rightSidebarContent = rightAside ? rightAside.querySelector('.ifx-shell-sidebar-content') : null;
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxCommunityPage && IfluxCommunityPage.init) {
    IfluxCommunityPage.init(frame);
  }
  mountPageWidgets(el, 'community', { sectionFilter: ['sidebar'], gateKey: 'community' });
  return {
    unmount: function () {
      if (window.IfluxCommunityPage && IfluxCommunityPage.dispose) IfluxCommunityPage.dispose();
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (window.IfluxCommunityPage && IfluxCommunityPage.dispose) IfluxCommunityPage.dispose();
  if (el) el.innerHTML = '';
}
