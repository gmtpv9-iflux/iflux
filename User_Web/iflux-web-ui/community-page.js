/* iFlux User Web — Cộng đồng (mạng xã hội nhà đầu tư).
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * Phase 0 (hiện tại): dựng đúng khung Composer + Timeline theo wireframe, CHƯA có
 * API Post/Story thật (Phase 1/2 trong SoT) — mọi hành động đăng bài/tạo chủ đề hiện
 * báo "đang hoàn thiện" thay vì giả lập dữ liệu (đúng nguyên tắc không dữ liệu dự phòng
 * ngầm). Khi Phase 1 xong, thay initComposerActions()/loadInitialTimeline() bằng gọi
 * API thật — không cần đổi cấu trúc DOM/CSS đã dựng ở đây.
 */
(function (global) {
  'use strict';
  if (global.IfluxCommunityPage) return;

  function auth() { return global.IfluxAuth; }
  function currentUser() {
    var a = auth();
    return (a && a.getUser) ? a.getUser() : null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (global.IfxToast && IfxToast.show) IfxToast.show(msg, type || 'info');
  }

  function comingSoon(label) {
    toast((label ? label + ' — ' : '') + 'Tính năng đang hoàn thiện, sẽ sớm ra mắt.', 'info');
  }

  function composerHtml() {
    var user = currentUser();
    var initials = (user && user.display_name ? user.display_name.trim().charAt(0) : 'U').toUpperCase();
    return (
      '<div class="ifx-com2-composer">' +
        '<div class="ifx-com2-composer__row">' +
          '<span class="ix-avatar ix-avatar-md ix-avatar-accent">' + esc(initials) + '</span>' +
          '<input type="text" class="ifx-com2-composer__input" data-ifx-com2-open-composer readonly ' +
            'placeholder="Bạn đang nghĩ gì về thị trường?" aria-label="Tạo bài viết" />' +
        '</div>' +
        '<div class="ifx-com2-composer__actions">' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="write"><i class="ti ti-edit"></i> Viết bài</button>' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="share"><i class="ti ti-share"></i> Chia sẻ tin</button>' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="tag"><i class="ti ti-chart-candle"></i> Gắn mã</button>' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="story"><i class="ti ti-hash"></i> Tạo chủ đề</button>' +
          '<button type="button" class="ix-btn ix-btn-primary ifx-com2-composer__submit" data-ifx-com2-action="submit">Đăng bài</button>' +
        '</div>' +
      '</div>'
    );
  }

  function emptyTimelineHtml() {
    return (
      '<div class="ifx-com2-empty">' +
        '<i class="ti ti-message-circle-2" aria-hidden="true"></i>' +
        '<h3>Dòng thời gian Cộng đồng sắp ra mắt</h3>' +
        '<p>Tính năng đăng bài, theo dõi nhà đầu tư khác và thảo luận chủ đề thị trường đang được hoàn thiện. ' +
          'Quay lại sớm nhé!</p>' +
      '</div>'
    );
  }

  function bindComposerActions(root) {
    root.querySelectorAll('[data-ifx-com2-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-ifx-com2-action');
        var labels = { write: 'Viết bài', share: 'Chia sẻ tin', tag: 'Gắn mã', story: 'Tạo chủ đề', submit: 'Đăng bài' };
        comingSoon(labels[action] || '');
      });
    });
    var openEl = root.querySelector('[data-ifx-com2-open-composer]');
    if (openEl) openEl.addEventListener('click', function () { comingSoon('Viết bài'); });
  }

  /* Phase 1: thay bằng gọi GET /community/feed?mode=following|trending|latest&cursor=...&limit=10
     (xem SoT §6, §10 — lazy-load 10 bài/lần, cuộn chạm đáy tải tiếp). */
  function loadInitialTimeline(root) {
    var host = root.querySelector('[data-ifx-com2-timeline]');
    if (host) host.innerHTML = emptyTimelineHtml();
  }

  function render(mainContent) {
    mainContent.innerHTML = (
      '<div class="ifx-com2-feed">' +
        composerHtml() +
        '<div class="ifx-com2-timeline" data-ifx-com2-timeline></div>' +
      '</div>'
    );
    bindComposerActions(mainContent);
    loadInitialTimeline(mainContent);
  }

  function init(mainContent) {
    if (!mainContent) return;
    render(mainContent);
  }

  function dispose() { /* không có listener toàn cục cần gỡ ở Phase 0 */ }

  global.IfluxCommunityPage = { init: init, dispose: dispose };
})(window);
