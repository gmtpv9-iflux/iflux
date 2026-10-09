/* Comment Modal — mở Interactive Host thật (hệ Interaction dùng chung với bài Tin tức) trong 1
 * modal độc lập, cho entityType='communitypost' (Owner 2026-10). Dùng chung cho Community Feed
 * (community-page.js) VÀ Tab Bình luận Thực thể (entity-posts-panel.js) — viết 1 lần, tránh lặp
 * UI mở Comment 2 nơi. Pattern độc lập giống IfluxRepostModal (tự build modal, tự lazy-load
 * interaction/boot.js — KHÔNG tải sẵn khi chưa cần).
 */
(function (global) {
  'use strict';
  if (global.IfluxCommentModal) return;

  var modalEl = null;
  var interactionReady = null;

  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'ix-modal-overlay';
    modalEl.id = 'ifxCommentModal';
    modalEl.style.display = 'none';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl || e.target.closest('[data-ifx-modal-close]')) close();
    });
    return modalEl;
  }

  function close() {
    if (modalEl) {
      if (global.IfluxInteractionHost && IfluxInteractionHost.unmountAll) {
        try { IfluxInteractionHost.unmountAll(); } catch (e) { /* ignore */ }
      }
      modalEl.style.display = 'none';
    }
  }

  function ensureInteractionReady() {
    if (interactionReady) return interactionReady;
    function loadScript(src) {
      return new Promise(function (resolve, reject) {
        if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error('Không tải được script ' + src)); };
        document.head.appendChild(s);
      });
    }
    var ASSET = '/User_Web/iflux-web-ui/';
    var V = '?v=r20261008c';
    interactionReady = loadScript(ASSET + 'comment-composer.js?v=6c56717875')
      .then(function () { return loadScript(ASSET + 'interaction/boot.js?v=41e479c913'); })
      .then(function () { return global.IfluxInteractionBoot.ensureForInteractive(); });
    return interactionReady;
  }

  /** target: { type: 'communitypost', id } — mặc định communitypost (Post Cộng đồng/Bình luận Thực thể). */
  function open(postId, target) {
    target = target || { type: 'communitypost', id: String(postId) };
    buildModal();
    modalEl.innerHTML =
      '<div class="ix-modal-box">' +
        '<button type="button" class="ix-modal-close" data-ifx-modal-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Bình luận</div>' +
        '<div data-ifx-comment-root><p class="ifx-com-empty">Đang tải bình luận…</p></div>' +
      '</div>';
    modalEl.style.display = 'flex';
    var root = modalEl.querySelector('[data-ifx-comment-root]');
    ensureInteractionReady().then(function () {
      if (!modalEl || modalEl.style.display === 'none') return;
      global.IfluxInteractionHost.mountInteraction({
        root: root,
        target: target,
        mode: 'interactive',
        presentation: 'sidebar'
      });
    }).catch(function () {
      root.innerHTML = '<p class="ifx-com-empty" style="color:var(--ix-danger)">Không tải được bình luận</p>';
    });
  }

  global.IfluxCommentModal = { open: open, close: close };
})(window);
