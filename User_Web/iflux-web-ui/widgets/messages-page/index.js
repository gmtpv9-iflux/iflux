/**
 * WGT-MSG-PAGE — Composite Tin nhắn (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=f23703a85b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-MSG-PAGE', title: 'Tin nhắn' };

function routeUrl(key) {
  var R = typeof window !== 'undefined' && window.IfluxRoutes;
  if (R && R.to) return R.to(key);
  var fb = { home: '/trang-chu' };
  return fb[key] || '/';
}

function applyConsumerLinks(root) {
  if (!root) return;
  root.querySelectorAll('[data-route-key]').forEach(function (a) {
    a.href = routeUrl(a.getAttribute('data-route-key'));
  });
}

var CORE_TIERS = [
  /* RC-IR-05: Tin nhắn không phải Interactive comment surface — không kéo stock-comments-ui */
  [ASSET + 'news-store.js?v=41bb32b4bc', ASSET + 'news-ui.js?v=d80479b1c4', ASSET + 'profile-users-store.js?v=4fb82084de', ASSET + 'profile-links.js?v=31f14c2ed9'],
  [ASSET + 'profile-follow-store.js?v=7a97f86263', ASSET + 'profile-friend-store.js?v=8a4ea4af6d', ASSET + 'profile-block-store.js?v=901ca0d67c'],
  [ASSET + 'profile-chat-access.js?v=bedda7bf40', ASSET + 'profile-chat-store.js?v=d551f20f1b', ASSET + 'profile-chat-page.js?v=ea50d1b30a'],
  [ASSET + 'profile-avatar.js?v=8eb9a8b60d', ASSET + 'client-local-notification-types.js?v=32f1add69c', ASSET + 'inapp-notifications.js?v=73382215b8'],
  [ASSET + 'profile-page.js?v=5a969de78b', ASSET + 'profile-bind.js?v=4bc9f42545']
];

function renderLayout(manifest) {
  var title = (manifest && manifest.title) || 'Tin nhắn';
  return `<h1 class="ix-page-title">` + title + `</h1>
    <div class="ix-breadcrumb ix-mb-24">
      <a href="#" data-route-key="home">Trang chủ</a><i class="ti ti-chevron-right" style="font-size:12px"></i><span>Tin nhắn</span>
    </div>

    <div class="ix-profile-tabs">
      <button type="button" class="ix-profile-tab active" data-ix-profile-tab="tab-messages">
        <i class="ti ti-messages" style="font-size:14px"></i> Tin nhắn
      </button>
      <button type="button" class="ix-profile-tab" data-ix-profile-tab="tab-following">
        <i class="ti ti-user-plus" style="font-size:14px"></i> Theo dõi
      </button>
    </div>

    <!-- ── TAB: TIN NHẮN ── -->
    <div id="tab-messages" class="ix-tab-content active">
      <div class="ix-card" style="padding:0;overflow:hidden">
        <div class="ix-chat-layout ifx-profile-chat-layout" id="ifx-profile-chat" data-ix-chat>
          <div class="ix-chat-sidebar">
            <div class="ix-chat-sidebar-header">
              <div style="font-size:13px;font-weight:600;color:var(--ix-text-primary);margin-bottom:10px">Cuộc trò chuyện</div>
              <div style="position:relative">
                <i class="ti ti-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--ix-text-muted);font-size:13px"></i>
                <input type="text" id="ifx-chat-search" style="width:100%;padding:7px 10px 7px 32px;background:var(--ix-bg-input);border:1px solid var(--ix-border);border-radius:var(--ix-radius);font-size:13px;color:var(--ix-text-primary);font-family:var(--ifx-font-primary);outline:none" placeholder="Tìm cuộc trò chuyện..." />
              </div>
            </div>
            <div class="ix-chat-list" id="ifx-chat-thread-list"></div>
          </div>
          <div class="ix-chat-main">
            <div class="ix-chat-header">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="ix-avatar-sm ix-avatar-accent" id="ifx-chat-active-avatar" style="font-size:12px">—</div>
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--ix-text-primary)" id="ifx-chat-active-name">Tin nhắn</div>
                  <div style="font-size:12px;color:var(--ix-text-muted)" id="ifx-chat-active-role">Chọn cuộc trò chuyện</div>
                </div>
              </div>
            </div>
            <div class="ix-chat-body" id="ifx-chat-messages"></div>
            <div class="ix-chat-footer">
              <input class="ix-chat-input" id="ifx-chat-input" placeholder="Nhập tin nhắn..." />
              <button type="button" class="ix-btn ix-btn-primary" data-ifx-chat-send><span>Gửi</span> <i class="ti ti-send" style="font-size:14px"></i></button>
            </div>
          </div>
          <div class="ix-chat-profile ifx-chat-profile-panel">
            <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px">
              <div class="ix-avatar-sm ix-avatar-accent" id="ifx-chat-right-avatar" style="width:56px;height:56px;font-size:20px">—</div>
              <div style="font-size:14px;font-weight:600;color:var(--ix-text-primary)" id="ifx-chat-right-name">—</div>
              <div style="font-size:12px;color:var(--ix-text-muted)" id="ifx-chat-right-role">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB: THEO DÕI ── -->
    <div id="tab-following" class="ix-tab-content">
      <div class="ix-card">
        <div class="ix-card-header"><div class="ix-card-title">Đang theo dõi</div></div>
        <div class="ix-card-body" id="ifx-profile-following"></div>
      </div>
    </div>`;
}

export async function mount(el, ctx) {
  ctx = ctx || {};
  /* Khung trang chung: nội dung trang ở Main, host widget Sidebar/Main theo Cài đặt trang. */
  el.innerHTML = '';
  buildPageFrame(el).mainContent.innerHTML = renderLayout(ctx.manifest);
  applyConsumerLinks(el);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  if (window.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
  if (window.IfluxProfilePage) IfluxProfilePage.init();
  var params = new URLSearchParams(location.search || '');
  if (window.IfluxProfileChatPage) {
    IfluxProfileChatPage.init({ openPeerId: params.get('with') || params.get('peer') || null });
  }
  if (window.IfluxUserNotificationsUI) IfluxUserNotificationsUI.refresh();
  setTimeout(function () { if (window.IfluxProfilePage) IfluxProfilePage.renderFollowing(); }, 0);
  await mountPageWidgets(el, 'messages');
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
