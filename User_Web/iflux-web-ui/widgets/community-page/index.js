/**
 * WGT-COMMUNITY-PAGE — Composite Cộng đồng (mạng xã hội nhà đầu tư)
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * Khung trang dùng đúng buildPageFrame({ rightSidebar: true }) — Sidebar trái (3/12) +
 * Main (7/12) + Sidebar phải (2/12). Phase 0: CẢ 3 vùng do community-page.js tự dựng
 * bằng seed data (chủ sản phẩm cho phép hardcode để khớp wireframe-cong-dong.png) —
 * KHÔNG gọi mountPageWidgets('community') nữa, vì pageKey này trùng với 1 bản ghi
 * PagePublished cũ (Cộng đồng kiểu cũ, Topic Engine đã thay thế) gây lẫn widget rác.
 * Khi Phase 5 (widget thật cho Cộng đồng) xong, cân nhắc đưa sidebar quay lại Widget
 * host qua Admin > Cài đặt trang với 1 pageKey MỚI, tránh đụng bản ghi cũ. */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=r20261002communityfix';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-COMMUNITY-PAGE', title: 'Cộng đồng' };

/* Phase 0: community-page.js (render Composer + Feed + Sidebar trái/phải seed data) +
   ApexCharts (biểu đồ nến mini đính kèm bài viết có mã chính — xem postCardHtml/chart).
   Phase 1+ (Post model thật) sẽ thêm community-store.js / community-feed.js vào đây
   theo đúng pattern news-store.js + news-daily-feed.js đã có cho Tin tức. */
var CORE_TIERS = [
  ['https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'],
  [ASSET + 'community-page.js?v=r20261002c']
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
