/**
 * TMP-COMMUNITY-LIST — ESM Widget module (Publish display.module).
 * Cùng Template SoT #3; phân nhánh theo widgetId (ViewModel / legacy mount).
 */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  templateId: 'TMP-COMMUNITY-LIST',
  title: 'Danh sách xếp hạng cộng đồng'
};

var DEPS_BY_WIDGET = {
  'WGT-COM-002': [
    [ASSET + 'stock-store.js', ASSET + 'profile-users-store.js', ASSET + 'profile-links.js'],
    [ASSET + 'news-active-members.js']
  ],
  'WGT-COM-003': [
    [ASSET + 'news-store.js', ASSET + 'profile-users-store.js', ASSET + 'profile-links.js'],
    [ASSET + 'news-featured-experts.js']
  ],
  'WGT-COM-004': [
    [
      ASSET + 'watchlist-store.js?v=followFound20260724',
      ASSET + 'profile-links.js',
      ASSET + 'news-top-watchlist-store.js'
    ],
    [
      '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724'
    ],
    [ASSET + 'watchlist-ui.js?v=followFound20260724'],
    [ASSET + 'news-top-watchlist.js?v=followFound20260724']
  ]
};

function widgetIdFromCtx(ctx) {
  ctx = ctx || {};
  return (
    ctx.widgetId ||
    (ctx.slot && ctx.slot.id) ||
    (ctx.artifact && ctx.artifact.id) ||
    ''
  );
}

export async function mount(el, ctx) {
  if (!el) return;
  var widgetId = widgetIdFromCtx(ctx);
  var tiers = DEPS_BY_WIDGET[widgetId];
  if (!tiers) {
    el.innerHTML =
      '<div class="ifx-wl-empty">TMP-COMMUNITY-LIST chưa hỗ trợ widget ' +
      (widgetId || '(thiếu id)') +
      '</div>';
    return;
  }
  await loadScriptTiers(tiers);

  if (widgetId === 'WGT-COM-002') {
    if (!window.IfluxCommunityActiveMembers) {
      el.innerHTML = '<div class="ifx-wl-empty">Thiếu news-active-members.js</div>';
      return;
    }
    window.IfluxCommunityActiveMembers.mount(el);
  } else if (widgetId === 'WGT-COM-003') {
    if (!window.IfluxCommunityFeaturedExperts) {
      el.innerHTML = '<div class="ifx-wl-empty">Thiếu news-featured-experts.js</div>';
      return;
    }
    window.IfluxCommunityFeaturedExperts.mount(el);
  } else if (widgetId === 'WGT-COM-004') {
    if (!window.IfluxCommunityTopWatchlist) {
      el.innerHTML = '<div class="ifx-wl-empty">Thiếu news-top-watchlist.js</div>';
      return;
    }
    window.IfluxCommunityTopWatchlist.mount(el, { withHead: true });
  }

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
