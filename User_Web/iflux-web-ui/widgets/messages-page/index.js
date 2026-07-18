/**
 * WGT-MSG-PAGE — Composite Tin nhắn (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-MSG-PAGE', title: 'Tin nhắn' };

var CORE_TIERS = [
  [ASSET + 'stock-store.js', ASSET + 'stock-comments-ui.js', ASSET + 'seo-url.js'],
  [ASSET + 'community-store.js', ASSET + 'community-ui.js', ASSET + 'profile-users-store.js', ASSET + 'profile-links.js'],
  [ASSET + 'profile-follow-store.js?v=chatGate20260708', ASSET + 'profile-friend-store.js?v=chatGate20260708', ASSET + 'profile-block-store.js'],
  [ASSET + 'profile-chat-access.js?v=chatGate20260708', ASSET + 'profile-chat-store.js?v=msg20260711', ASSET + 'profile-chat-page.js?v=msg20260711'],
  [ASSET + 'profile-avatar.js', ASSET + 'system-notification-catalog.js', ASSET + 'system-notification-templates-store.js', ASSET + 'inapp-notifications.js'],
  [ASSET + 'profile-page.js', ASSET + 'profile-bind.js?v=planPromo20260708']
];

var LAYOUT_HTML = `<h1 class="ix-page-title">Tin nhắn</h1>
    <div class="ix-breadcrumb ix-mb-24">
      <a href="/nha-cua-toi">Nhà của tôi</a><i class="ti ti-chevron-right" style="font-size:12px"></i><span>Tin nhắn</span>
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
                <input type="text" id="ifx-chat-search" style="width:100%;padding:7px 10px 7px 32px;background:var(--ix-bg-input);border:1px solid var(--ix-border);border-radius:var(--ix-radius);font-size:13px;color:var(--ix-text-primary);font-family:var(--ix-font);outline:none" placeholder="Tìm cuộc trò chuyện..." />
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

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxProfileAvatar) IfluxProfileAvatar.initOwn();
  if (window.IfluxProfilePage) IfluxProfilePage.init();
  var params = new URLSearchParams(location.search || '');
  if (window.IfluxProfileChatPage) {
    IfluxProfileChatPage.init({ openPeerId: params.get('with') || params.get('peer') || null });
  }
  if (window.IfluxUserNotificationsUI) IfluxUserNotificationsUI.refresh();
  setTimeout(function () { if (window.IfluxProfilePage) IfluxProfilePage.renderFollowing(); }, 0);
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
