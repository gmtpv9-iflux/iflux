/**
 * WGT-NEWS-POST-PAGE — Composite Bài viết cộng đồng (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=730cdbd2ef';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=3313b52579';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var PUBLISH_KEY = 'article';

export const meta = { id: 'WGT-NEWS-POST-PAGE', title: 'Bài viết cộng đồng' };

/* W4: registry/seeds/mock/taxonomy/seo = Shell MARKET_PLATFORM
 * Trước đây tách 4 tầng tuần tự (tầng sau đợi tầng trước tải xong) — không file
 * nào trong 9 file này gọi hàm của file khác NGAY khi vừa tải (chỉ định nghĩa
 * hàm/export global, mọi lệnh gọi chéo đều nằm trong init() — chạy sau khi CẢ
 * 9 file đã tải xong). Không có phụ thuộc thứ tự thật → gộp 1 tầng, tải song
 * song toàn bộ giống đúng cách trang danh sách tin tức đang làm (nhanh hơn). */
var CORE_TIERS = [
  [
    ASSET + 'runtime/page-layout-engine.js?v=c3d1bce3f2',
    ASSET + 'stock-mentions.js?v=63b1553d75',
    ASSET + 'news-store.js?v=41bb32b4bc',
    ASSET + 'iflux-news-api-bridge.js?v=f47b340d7b',
    ASSET + 'profile-users-store.js?v=4fb82084de',
    ASSET + 'profile-links.js?v=31f14c2ed9',
    ASSET + 'iflux-market-quotes.js?v=349c1e1a74',
    ASSET + 'watchlist-store.js?v=f604e76323',
    '/design_system/04_components/29_follow/follow.js?v=r20261016a',
    ASSET + 'news-ui.js?v=a57f24c0e1',
    ASSET + 'news-daily-feed.js?v=be2cb197c0',
    ASSET + 'interaction/boot.js?v=b13165436a',
    ASSET + 'news-post-page.js?v=d03dc68f82'
  ]
];

var LAYOUT_HTML = `<div data-ifx-community-story></div>`;

async function mountFromHostTree(root) {
  var host = root.querySelector('[data-news-event-timeline]');
  var ref = window.IfluxSeoUrl && IfluxSeoUrl.parsePostRef();
  var store = window.IfluxNewsStore;
  var post = store && (store.getPostById(ref) || store.getPostBySlug(ref));
  var tasks = [mountPageWidgets(root, PUBLISH_KEY)];
  if (host && post && post.event_timeline && post.event_timeline.length) {
    tasks.push(mountPublishedWidgets([{
      widgetId: 'WGT-NEWS-EVENT-TIMELINE', host: host,
      data: post.event_timeline,
      artifact: {
        content: { title: 'Diễn biến sự việc', description: 'Các mốc có nguồn trong hồ sơ được gắn với bài viết', icon: 'calendar-event' },
        display: { renderSpec: { templateId: 'TMP-EVENT-TIMELINE' } }
      }
    }]));
  }
  var comparisonHost = root.querySelector('[data-news-comparison]');
  if (comparisonHost && post && post.comparison_data) {
    tasks.push(mountPublishedWidgets([{
      widgetId: 'WGT-NEWS-STOCK-COMPARISON', host: comparisonHost, data: post.comparison_data,
      artifact: { content: { title: post.comparison_data.title, icon: 'chart-bar' }, display: { renderSpec: { templateId: 'TMP-STOCK-COMPARISON' } } }
    }]));
  }
  return Promise.all(tasks);
}

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxNewsApiBridge && IfluxNewsApiBridge.loadPostPage) {
    var ref = window.IfluxSeoUrl && IfluxSeoUrl.parsePostRef ? IfluxSeoUrl.parsePostRef() : null;
    if (ref) await IfluxNewsApiBridge.loadPostPage({ idOrSlug: ref });
  }
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  /* Bridge khung trang chung cho news-post-page.js (IIFE) — paintPost() dựng qua buildPageFrame.
   * iflux-context-ready = khung đã dựng xong (dispatch cuối paintPost()) → mount widget vào host. */
  window.IfluxRuntimeSections = { buildPageFrame: buildPageFrame };
  function onContextReady() {
    mountFromHostTree(el);
  }
  function onPlans() {
    mountFromHostTree(el);
  }
  document.addEventListener('iflux-context-ready', onContextReady);
  document.addEventListener('iflux-plans-updated', onPlans);
  if (window.IfluxCommunityPostPage) IfluxCommunityPostPage.init();
  return {
    unmount: function () {
      document.removeEventListener('iflux-context-ready', onContextReady);
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (window.IfluxCommunityPostPage) IfluxCommunityPostPage.dispose();
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
