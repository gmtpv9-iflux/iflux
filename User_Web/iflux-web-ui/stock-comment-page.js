/* Trang chi tiết bình luận — thread đầy đủ + tương tác reply + lazy scroll */
(function (global) {
  'use strict';

  function st() { return global.IfluxStockStore; }
  function ui() { return global.IfluxStockCommentsUI; }
  function auth() { return global.IfluxAuth; }
  function scrollFeed() { return global.IfluxStockScrollFeed; }

  var lazyFeed = null;
  var pageRoot = null;
  var pageFeedKey = '';
  var pageCommentId = '';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function parsePageFeed(params) {
    var feed = params.get('feed');
    if (feed && st()) return st().normalizeFeedKey(feed);
    return (params.get('ticker') || 'VHM').toUpperCase();
  }

  function pageTitleLabel(feedKey) {
    if (String(feedKey).indexOf(':') < 0) return feedKey;
    var i = feedKey.indexOf(':');
    var type = feedKey.slice(0, i);
    var id = feedKey.slice(i + 1);
    var tax = global.IfluxWatchlistTaxonomy;
    var group = tax ? tax.getGroup(type, id) : null;
    return group ? group.name : feedKey;
  }

  function backLinkHtml(feedKey) {
    if (String(feedKey).indexOf(':') >= 0) {
      var i = feedKey.indexOf(':');
      var type = feedKey.slice(0, i);
      var id = feedKey.slice(i + 1);
      var bases = { sector: '../sector/', family: '../family/', story: '../story/' };
      var base = bases[type] || '../sector/';
      return '<a href="' + base + 'index.html?id=' + encodeURIComponent(id) + '"><i class="ti ti-arrow-left"></i> ' + esc(pageTitleLabel(feedKey)) + '</a>';
    }
    var stockBack = global.IfluxSeoUrl
      ? IfluxSeoUrl.stockHref(feedKey)
      : '/co-phieu/' + encodeURIComponent(String(feedKey || '').toUpperCase());
    return '<a href="' + stockBack + '"><i class="ti ti-arrow-left"></i> ' + esc(feedKey) + '</a>';
  }

  function userId() {
    var u = auth() && auth().getUser();
    return u && u.id ? u.id : 'usr_local';
  }

  function getSortedReplies(comment) {
    return (comment.replies || []).slice().sort(function (a, b) {
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  function updateRootComment(root, comment) {
    var article = root.querySelector('[data-ifx-comment-id="' + comment.id + '"]');
    if (!article) return;
    var uid = userId();
    var pos = comment.reactions.positive.length;
    var neg = comment.reactions.negative.length;
    var posActive = comment.reactions.positive.indexOf(uid) >= 0;
    var negActive = comment.reactions.negative.indexOf(uid) >= 0;

    var stats = article.querySelector('.ifx-stock-cmt__stats');
    if (stats && ui()) {
      stats.innerHTML =
        ui().statIcon('ti-mood-smile', pos) +
        ui().statIcon('ti-mood-sad', neg) +
        ui().statIcon('ti-message', comment.replies.length);
    }

    var actions = article.querySelector('.ifx-stock-cmt__actions');
    if (actions && ui()) {
      actions.innerHTML = ui().reactionActionsHtml({
        commentId: comment.id,
        replyUserName: comment.user_name,
        posActive: posActive,
        negActive: negActive,
        showReplyBtn: true
      });
    }

    var title = root.querySelector('.ifx-stock-cmt-detail__title');
    if (title) title.textContent = 'Thảo luận (' + comment.replies.length + ')';
  }

  function mountReplyFeed(root, comment) {
    var feed = root.querySelector('[data-ifx-stock-replies]');
    if (!feed || !scrollFeed() || !ui()) return;

    if (lazyFeed && lazyFeed.destroy) lazyFeed.destroy();

    lazyFeed = scrollFeed().mount(feed, {
      pageSize: 8,
      emptyHtml: '<div class="ifx-stock-chat__empty">Chưa có phản hồi.</div>',
      getItems: function () {
        var c = st().getComment(pageFeedKey, pageCommentId);
        return c ? getSortedReplies(c) : [];
      },
      renderItem: function (r) { return ui().replyItemHtml(r, pageCommentId, userId()); },
      onRendered: function () {
        ui().bindDetailActions(root, pageFeedKey, pageCommentId, function (next) {
          refreshContent(root, next);
        });
      }
    });
  }

  function refreshContent(root, opts) {
    opts = opts === true ? { scrollEnd: true } : (opts || {});
    var comment = st().getComment(pageFeedKey, pageCommentId);
    if (!comment) return;
    updateRootComment(root, comment);
    if (opts.replies !== false && lazyFeed) {
      if (opts.scrollEnd) {
        while (lazyFeed.loadMore()) { /* expand to end */ }
      } else {
        lazyFeed.refresh();
      }
    }
    ui().bindDetailActions(root, pageFeedKey, pageCommentId, function (next) {
      refreshContent(root, next);
    });
  }

  function renderShell(root) {
    if (!root || !st() || !ui()) return;
    var params = new URLSearchParams(location.search);
    pageFeedKey = parsePageFeed(params);
    pageCommentId = params.get('id');
    if (!pageCommentId) {
      root.innerHTML = '<div class="ifx-stock-empty">Thiếu id bình luận.</div>';
      return;
    }
    var comment = st().getComment(pageFeedKey, pageCommentId);
    if (!comment) {
      root.innerHTML = '<div class="ifx-stock-empty">Không tìm thấy bình luận.</div>';
      return;
    }
    document.title = 'Bình luận · ' + pageTitleLabel(pageFeedKey) + ' · iFlux';
    pageRoot = root;

    var uid = userId();
    var pos = comment.reactions.positive.length;
    var neg = comment.reactions.negative.length;
    var posActive = comment.reactions.positive.indexOf(uid) >= 0;
    var negActive = comment.reactions.negative.indexOf(uid) >= 0;

    root.innerHTML =
      '<nav class="ifx-com-breadcrumb ifx-stock-cmt-detail__crumb">' +
        backLinkHtml(pageFeedKey) +
        '<span class="ifx-com-breadcrumb__sep">/</span>' +
        '<span class="ifx-com-breadcrumb__current">Bình luận</span>' +
      '</nav>' +
      '<section class="ifx-stock-panel ifx-stock-cmt-detail">' +
        '<div class="ifx-stock-cmt-detail__scroll" data-ifx-stock-detail-scroll>' +
          '<article class="ifx-stock-cmt ifx-stock-cmt--detail" data-ifx-comment-id="' + esc(comment.id) + '">' +
            '<div class="ifx-stock-cmt__head">' +
              ui().userNameLink(comment.user_id, comment.user_name) +
              '<span class="ifx-stock-cmt__dot">·</span>' +
              '<span class="ifx-stock-cmt__time">' + esc(ui().fmtTime(comment.created_at)) + '</span>' +
            '</div>' +
            '<p class="ifx-stock-cmt__body ifx-stock-cmt__body--lead">' + ui().bodyHtml(comment.body) + '</p>' +
            ui().tagsHtml(comment.tags) +
            '<div class="ifx-stock-cmt__stats">' +
              ui().statIcon('ti-mood-smile', pos) +
              ui().statIcon('ti-mood-sad', neg) +
              ui().statIcon('ti-message', comment.replies.length) +
            '</div>' +
            '<div class="ifx-stock-cmt__actions">' +
              ui().reactionActionsHtml({
                commentId: comment.id,
                replyUserName: comment.user_name,
                posActive: posActive,
                negActive: negActive,
                showReplyBtn: true
              }) +
            '</div>' +
          '</article>' +
          '<div class="ifx-stock-cmt-detail__thread">' +
            '<h2 class="ifx-stock-cmt-detail__title">Thảo luận (' + comment.replies.length + ')</h2>' +
            '<div class="ifx-stock-cmt-detail__replies" data-ifx-stock-replies></div>' +
          '</div>' +
        '</div>' +
        ui().composerHtml(pageFeedKey, { detail: true }) +
      '</section>';

    mountReplyFeed(root, comment);
    bindComposer(root);
    ui().bindDetailActions(root, pageFeedKey, pageCommentId, function (next) {
      refreshContent(root, next);
    });
  }

  function bindComposer(root) {
    var form = root.querySelector('[data-ifx-stock-reply-form]');
    if (!form) return;
    ui().bindMentionForm(form);
    var user = auth() ? auth().getUser() : null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ta = form.querySelector('[data-ifx-stock-reply-body]');
      try {
        st().addReply(pageFeedKey, pageCommentId, user, ta ? ta.value : '', {
          replyToId: form.getAttribute('data-ifx-reply-to-id') || null
        });
        if (ta) ta.value = '';
        ui().clearReplyTarget(form);
        ui().resetComposerTags(form, pageFeedKey);
        refreshContent(root, { scrollEnd: true, replies: true });
        var scroll = root.querySelector('[data-ifx-stock-detail-scroll]');
        if (scroll) scroll.scrollTop = scroll.scrollHeight;
      } catch (err) {
        if (global.ixToast) ixToast(err.message, 'warning');
      }
    });
  }

  function init() {
    var root = document.querySelector('[data-ifx-stock-comment-page]');
    renderShell(root);
    document.addEventListener('iflux-stock-comments-change', function () {
      if (pageRoot) refreshContent(pageRoot);
    });
  }

  global.IfluxStockCommentPage = { init: init };
})(window);
