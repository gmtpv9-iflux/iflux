/* Tab "Bình luận" trên trang chi tiết Thực thể (Cổ phiếu / Ngành / Hệ sinh thái) — Owner 2026-10.
 * "Bình luận trên Thực thể chỉ có 1, xuất hiện ở 2 nơi (Tab Bình luận + trang Cộng đồng), không
 * phải 2 owner khác nhau": viết ở đây = tạo 1 Social Post gắn thẻ Thực thể (createEntityPost),
 * nên mỗi "bình luận" hiển thị NGUYÊN 1 thẻ bài như trên Cộng đồng (Like/Dislike/Comment/Share
 * riêng) — KHÔNG phải Comment Thread rút gọn cũ (interaction_comments, route /threads/:type/:id,
 * vẫn giữ nguyên dữ liệu lịch sử, chỉ không còn là nơi TẠO MỚI cho stock/sector/family).
 * Dùng chung IfluxCommentModal/IfluxRepostModal với community-page.js — không viết lại UI mở
 * Bình luận/Chia sẻ lần 2.
 */
(function (global) {
  'use strict';
  if (global.IfluxEntityPostsPanel) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function icon(name, cls) {
    return '<i class="ti ti-' + name + (cls ? ' ' + cls : '') + '" aria-hidden="true"></i>';
  }

  function toast(msg, type) {
    if (global.IfxToast && IfxToast.show) IfxToast.show(msg, type || 'info');
  }

  function store() { return global.IfluxCommunityStore; }
  function auth() { return global.IfluxAuth; }

  function requireAuth() {
    if (auth() && auth().getUser && auth().getUser()) return true;
    if (auth() && auth().promptLogin) auth().promptLogin();
    return false;
  }

  function timeAgo(iso) {
    if (!iso) return '';
    var d = new Date(iso).getTime();
    if (!d) return '';
    var diff = Math.max(0, Date.now() - d);
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return mins + ' phút trước';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' giờ trước';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + ' ngày trước';
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  /* Nạp lazy hệ Interaction thật (Comment/Share) chỉ khi user bấm — cùng nguyên tắc community-page.js. */
  var interactionReady = null;
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
    interactionReady = loadScript(ASSET + 'comment-composer.js' + V)
      .then(function () { return loadScript(ASSET + 'interaction/boot.js' + V); })
      .then(function () { return global.IfluxInteractionBoot.ensureForInteractive(); })
      .then(function () { return loadScript(ASSET + 'interaction/comment-modal.js' + V); });
    return interactionReady;
  }

  function cardHtml(p) {
    var name = p.author && p.author.display_name ? p.author.display_name : 'Thành viên';
    var initials = name.trim().charAt(0).toUpperCase() || 'U';
    return (
      '<article class="ifx-card ifx-com-entitypost" data-post-id="' + esc(p.id) + '">' +
        '<div class="ifx-card-body">' +
          '<header class="ifx-com2-post__head">' +
            '<span class="ifx-avatar ifx-avatar-md ifx-avatar-accent">' + esc(initials) + '</span>' +
            '<div class="ifx-com2-post__who"><div class="name">' + esc(name) + '</div><div class="time">' + esc(timeAgo(p.created_at)) + '</div></div>' +
          '</header>' +
          (p.content ? '<p class="ifx-com2-post__text">' + esc(p.content) + '</p>' : '') +
          '<footer class="ifx-com2-post__stats">' +
            '<button type="button" class="' + (p.viewer_liked ? 'is-active' : '') + '" data-ep-action="like" data-post-id="' + esc(p.id) + '">' + icon('heart') + ' <span>' + p.stats.likes + '</span></button>' +
            '<button type="button" class="' + (p.viewer_disliked ? 'is-active' : '') + '" data-ep-action="dislike" data-post-id="' + esc(p.id) + '">' + icon('thumb-up', 'ifx-icon-flip-v') + ' <span>' + p.stats.dislikes + '</span></button>' +
            '<button type="button" data-ep-action="comment" data-post-id="' + esc(p.id) + '">' + icon('message-circle') + ' ' + p.stats.comments + '</button>' +
            '<button type="button" data-ep-action="share" data-post-id="' + esc(p.id) + '">' + icon('share') + ' ' + p.stats.shares + '</button>' +
          '</footer>' +
        '</div>' +
      '</article>'
    );
  }

  function mount(root, opts) {
    if (!root || !opts || !opts.entityType || !opts.entityId) return;
    var entityType = opts.entityType;
    var entityId = opts.entityId;
    var state = { posts: [], nextCursor: null, loading: false };

    root.innerHTML =
      '<div class="ifx-com-entitypanel">' +
        '<div class="ifx-card ifx-com-entitypanel__compose">' +
          '<div class="ifx-card-body">' +
            '<textarea class="ix-input" data-ep-compose rows="2" maxlength="6000" placeholder="Viết bình luận…"></textarea>' +
            '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ep-submit style="margin-top:8px">Gửi</button>' +
          '</div>' +
        '</div>' +
        '<div data-ep-list></div>' +
      '</div>';

    var listEl = root.querySelector('[data-ep-list]');

    function renderList() {
      if (state.loading && !state.posts.length) {
        listEl.innerHTML = '<p class="ifx-com-empty">Đang tải bình luận…</p>';
        return;
      }
      if (!state.posts.length) {
        listEl.innerHTML = '<p class="ifx-com-empty">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
        return;
      }
      var html = state.posts.map(cardHtml).join('');
      if (state.nextCursor) {
        html += '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ep-loadmore>Xem thêm</button>';
      }
      listEl.innerHTML = html;
      bindListActions();
    }

    function bindListActions() {
      listEl.querySelectorAll('[data-ep-action="like"]').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleLike(btn.getAttribute('data-post-id')); });
      });
      listEl.querySelectorAll('[data-ep-action="dislike"]').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleDislike(btn.getAttribute('data-post-id')); });
      });
      listEl.querySelectorAll('[data-ep-action="comment"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!requireAuth()) return;
          var id = btn.getAttribute('data-post-id');
          ensureInteractionReady().then(function () { global.IfluxCommentModal.open(id); })
            .catch(function () { toast('Không tải được tính năng Bình luận', 'danger'); });
        });
      });
      listEl.querySelectorAll('[data-ep-action="share"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!requireAuth()) return;
          var id = btn.getAttribute('data-post-id');
          var post = state.posts.find(function (p) { return String(p.id) === String(id); });
          var previewTitle = post ? String(post.content || '').slice(0, 140) : '';
          function doOpen() { global.IfluxRepostModal.open({ postId: id, title: previewTitle, sourceType: 'post' }); }
          if (global.IfluxRepostModal) { doOpen(); return; }
          ensureInteractionReady().then(doOpen).catch(function () { toast('Không tải được tính năng Chia sẻ', 'danger'); });
        });
      });
      var loadMoreBtn = listEl.querySelector('[data-ep-loadmore]');
      if (loadMoreBtn) loadMoreBtn.addEventListener('click', function () { load(true); });
    }

    /* Like/Dislike loại trừ nhau qua cùng 1 row interaction_likes (value=1/-1) — cùng logic đã
       kiểm chứng ở community-page.js's toggleLike/toggleDislike. */
    function toggleLike(postId) {
      if (!requireAuth()) return;
      var post = state.posts.find(function (p) { return String(p.id) === String(postId); });
      if (!post) return;
      var wasLiked = !!post.viewer_liked;
      var wasDisliked = !!post.viewer_disliked;
      post.viewer_liked = !wasLiked;
      post.viewer_disliked = false;
      post.stats.likes += wasLiked ? -1 : 1;
      if (wasDisliked) post.stats.dislikes = Math.max(0, (post.stats.dislikes || 0) - 1);
      renderList();
      var call = wasLiked ? store().unlikePost(postId) : store().likePost(postId);
      call.catch(function (err) {
        post.viewer_liked = wasLiked;
        post.viewer_disliked = wasDisliked;
        post.stats.likes += wasLiked ? 1 : -1;
        if (wasDisliked) post.stats.dislikes = (post.stats.dislikes || 0) + 1;
        renderList();
        toast(err.message || 'Không thực hiện được', 'danger');
      });
    }

    function toggleDislike(postId) {
      if (!requireAuth()) return;
      var post = state.posts.find(function (p) { return String(p.id) === String(postId); });
      if (!post) return;
      var wasDisliked = !!post.viewer_disliked;
      var wasLiked = !!post.viewer_liked;
      post.viewer_disliked = !wasDisliked;
      post.viewer_liked = false;
      post.stats.dislikes = (post.stats.dislikes || 0) + (wasDisliked ? -1 : 1);
      if (wasLiked) post.stats.likes = Math.max(0, post.stats.likes - 1);
      renderList();
      var call = wasDisliked ? store().unlikePost(postId) : store().dislikePost(postId);
      call.catch(function (err) {
        post.viewer_disliked = wasDisliked;
        post.viewer_liked = wasLiked;
        post.stats.dislikes = (post.stats.dislikes || 0) + (wasDisliked ? 1 : -1);
        if (wasLiked) post.stats.likes += 1;
        renderList();
        toast(err.message || 'Không thực hiện được', 'danger');
      });
    }

    function load(append) {
      state.loading = true;
      if (!append) { state.posts = []; state.nextCursor = null; }
      renderList();
      store().getEntityPosts(entityType, entityId, { cursor: append ? state.nextCursor : null, limit: 10 })
        .then(function (data) {
          state.loading = false;
          state.posts = append ? state.posts.concat(data.items) : data.items;
          state.nextCursor = data.next_cursor;
          renderList();
        })
        .catch(function (err) {
          state.loading = false;
          listEl.innerHTML = '<p class="ifx-com-empty" style="color:var(--ix-danger)">' + esc(err.message || 'Không tải được bình luận') + '</p>';
        });
    }

    var composeEl = root.querySelector('[data-ep-compose]');
    var submitBtn = root.querySelector('[data-ep-submit]');
    submitBtn.addEventListener('click', function () {
      if (!requireAuth()) return;
      var content = String(composeEl.value || '').trim();
      if (!content) return;
      submitBtn.disabled = true;
      store().createEntityPost(entityType, entityId, content).then(function (data) {
        composeEl.value = '';
        state.posts.unshift(data.post);
        renderList();
      }).catch(function (err) {
        toast(err.message || 'Không gửi được bình luận', 'danger');
      }).then(function () {
        submitBtn.disabled = false;
      });
    });

    load(false);
  }

  global.IfluxEntityPostsPanel = { mount: mount };
})(window);
