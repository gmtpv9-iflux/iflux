/**
 * WGT-COMMUNITY-PAGE — Composite Cộng đồng (mạng xã hội nhà đầu tư)
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * Khung trang dùng đúng buildPageFrame({ rightSidebar: true }) — Sidebar trái (3/12)
 * + Sidebar phải (2/12, capability có sẵn từ trước nhưng chưa trang nào dùng) đều là
 * Widget host qua Admin > Cài đặt trang (giống mọi trang khác). Main (7/12) KHÔNG host
 * widget — Composer + Timeline do community-page.js tự dựng (IIFE, giống news-page.js).
 */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=r20260928q';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260929e';

var ASSET = '/User_Web/iflux-web-ui/';
var PUBLISH_KEY = 'community';

export const meta = { id: 'WGT-COMMUNITY-PAGE', title: 'Cộng đồng' };

/* Phase 0: chỉ cần community-page.js (render Composer + trạng thái rỗng Timeline).
   Phase 1+ (Post model thật) sẽ thêm community-store.js / community-feed.js vào đây
   theo đúng pattern news-store.js + news-daily-feed.js đã có cho Tin tức. */
var CORE_TIERS = [
  [ASSET + 'community-page.js?v=r20261002a']
];

export async function mount(el) {
  el.innerHTML = '';
  var frame = buildPageFrame(el, { rightSidebar: true, sidebarLabel: 'Sidebar Cộng đồng' });
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxCommunityPage && IfluxCommunityPage.init) {
    IfluxCommunityPage.init(frame.mainContent);
  }
  /* 1 lệnh gọi — page-layout-engine tự dựng host tree cho CẢ sidebar lẫn sidebar-right
     theo đúng Widget Placement Admin đã cấu hình cho publishKey 'community'. */
  await mountPageWidgets(el, PUBLISH_KEY);
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
