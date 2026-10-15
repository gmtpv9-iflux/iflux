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
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=3313b52579';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-COMMUNITY-PAGE', title: 'Cộng đồng' };

/* Phase 4 (2026-10-03): community-store.js (API client Post+Story thật) tải TRƯỚC
   community-page.js — community-page.js gọi global.IfluxCommunityStore ngay lúc init(). */
var CORE_TIERS = [
  [ASSET + 'community-store.js?v=17b421d80c'],
  [ASSET + 'community-page.js?v=e07ef39933']
];

export async function mount(el) {
  el.innerHTML = '';
  var frame = buildPageFrame(el, { rightSidebar: true, sidebarLabel: 'Sidebar Cộng đồng' });
  var rightAside = el.querySelector('.ifx-shell-sidebar-right');
  frame.rightSidebarContent = rightAside ? rightAside.querySelector('.ifx-shell-sidebar-content') : null;
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();

  var mobile = !!(window.IfluxBreakpoint && window.IfluxBreakpoint.isMobileShell && window.IfluxBreakpoint.isMobileShell());

  /* Mobile (Bottom Nav 2 cấp, xem docs/plan "Mobile Bottom Navigation 2 cấp"): Widget Host
     sidebar trái (4 widget thật — không đi qua community-page.js, cần import mountPageWidgets
     ở ĐÂY) chỉ mount khi region 'sidebar-left' được chọn LẦN ĐẦU — không mount/fetch trước khi
     user bấm "Thịnh hành". ĐĂNG KÝ LISTENER TRƯỚC KHI gọi init() bên dưới — cold-load thẳng vào
     URL có ?view=sidebar-left khiến init() tự phát 'iflux-level2-change' ĐỒNG BỘ ngay trong
     lúc chạy (qua applyViewFromUrl() — community-page.js); nếu đăng ký SAU init() như bản cũ,
     listener chưa tồn tại lúc event bắn ra → bỏ lỡ, Widget Host không bao giờ mount dù sidebar
     đã hiển thị (chỉ đúng khi vào Cấp 2 bằng cách TAP, không đúng khi mở thẳng URL/refresh).
     Desktop/tablet giữ nguyên hành vi CŨ: mount ngay, không qua cơ chế này. */
  if (!mobile) {
    mountPageWidgets(el, 'community', { sectionFilter: ['sidebar'], gateKey: 'community' });
  } else {
    var sidebarWidgetsMounted = false;
    var onLevel2Change = function (e) {
      var d = (e && e.detail) || {};
      if (sidebarWidgetsMounted || d.regionKey !== 'sidebar-left') return;
      sidebarWidgetsMounted = true;
      mountPageWidgets(el, 'community', { sectionFilter: ['sidebar'], gateKey: 'community' });
    };
    document.addEventListener('iflux-level2-change', onLevel2Change);
    el.__ifxOnLevel2Change = onLevel2Change; // tháo trong unmount
  }

  if (window.IfluxCommunityPage && IfluxCommunityPage.init) {
    IfluxCommunityPage.init(frame, { lazyRegions: mobile });
  }

  return {
    unmount: function () {
      if (window.IfluxCommunityPage && IfluxCommunityPage.dispose) IfluxCommunityPage.dispose();
      if (el && el.__ifxOnLevel2Change) document.removeEventListener('iflux-level2-change', el.__ifxOnLevel2Change);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (window.IfluxCommunityPage && IfluxCommunityPage.dispose) IfluxCommunityPage.dispose();
  if (el) el.innerHTML = '';
}
