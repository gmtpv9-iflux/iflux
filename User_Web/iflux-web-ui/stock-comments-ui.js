/* UI bình luận CP — danh sách gọn + composer @mention + lazy scroll */
(function (global) {
  'use strict';

  function st() { return global.IfluxStockStore; }
  function auth() { return global.IfluxAuth; }
  function mn() { return global.IfluxStockMentions; }
  function comUi() { return global.IfluxNewsUI; }
  function scrollFeed() { return global.IfluxStockScrollFeed; }

  var lazyByRoot = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var lazyFallbackKey = '__ifxLazyFeed';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function userId() {
    var u = auth() && auth().getUser();
    return u && u.id ? u.id : 'usr_local';
  }

  function fmtTime(iso) {
    if (!iso) return '';
    if (comUi() && comUi().fmtPostCardTime) return comUi().fmtPostCardTime(iso);
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return ''; }
  }

  function commentDetailHref(feedKey, commentId, opts) {
    opts = opts || {};
    var base = opts.base || '';
    feedKey = String(feedKey || '');
    if (feedKey.indexOf(':') >= 0) {
      return base + 'comment.html?feed=' + encodeURIComponent(feedKey) + '&id=' + encodeURIComponent(commentId);
    }
    return base + 'comment.html?ticker=' + encodeURIComponent(feedKey) + '&id=' + encodeURIComponent(commentId);
  }

  function tagsHtml(tags, opts) {
    if (!tags) return '';
    opts = opts || { from: 'stock' };
    var html = '';
    (tags.tickers || []).forEach(function (tk) {
      var href = mn()
        ? mn().tagRefHref('ticker', { id: tk, name: tk }, opts)
        : (global.IfluxHref
          ? IfluxHref.forCanonical(global.IfluxSeoUrl
            ? IfluxSeoUrl.stockHref(tk)
            : '/co-phieu/' + encodeURIComponent(String(tk || '').toUpperCase()))
          : (global.IfluxSeoUrl
            ? IfluxSeoUrl.stockHref(tk)
            : '/co-phieu/' + encodeURIComponent(String(tk || '').toUpperCase())));
      html += '<a class="ifx-com-tag ifx-com-tag--ticker" href="' + esc(href) + '">' + esc(tk) + '</a>';
    });
    if (tags.sector && tags.sector.name) {
      var sectorHref = mn() ? mn().tagRefHref('sector', tags.sector, opts) : '';
      html += sectorHref
        ? '<a class="ifx-com-tag ifx-com-tag--sector" href="' + esc(sectorHref) + '">' + esc(tags.sector.name) + '</a>'
        : '<span class="ifx-com-tag ifx-com-tag--sector">' + esc(tags.sector.name) + '</span>';
    }
    if (tags.family && tags.family.name) {
      var familyHref = mn() ? mn().tagRefHref('family', tags.family, opts) : '';
      html += familyHref
        ? '<a class="ifx-com-tag ifx-com-tag--family" href="' + esc(familyHref) + '">' + esc(tags.family.name) + '</a>'
        : '<span class="ifx-com-tag ifx-com-tag--family">' + esc(tags.family.name) + '</span>';
    }
    if (tags.story && tags.story.name) {
      var storyHref = mn() ? mn().tagRefHref('story', tags.story, opts) : '';
      html += storyHref
        ? '<a class="ifx-com-tag ifx-com-tag--story" href="' + esc(storyHref) + '">' + esc(tags.story.name) + '</a>'
        : '<span class="ifx-com-tag ifx-com-tag--story">' + esc(tags.story.name) + '</span>';
    }
    return html ? '<div class="ifx-stock-cmt__tags">' + html + '</div>' : '';
  }

  function bodyHtml(body, opts) {
    if (!body) return '';
    var text = mn() ? mn().stripMentions(body) : body;
    return esc(text);
  }

  function emptyComposerTags() {
    return { tickers: [], sector: null, family: null, story: null };
  }

  function composerPickedTags(form) {
    if (!form.__ifxComposerTags) form.__ifxComposerTags = emptyComposerTags();
    return form.__ifxComposerTags;
  }

  function resetComposerTags(form, feedKey) {
    form.__ifxComposerTags = emptyComposerTags();
    var preview = form.querySelector('[data-ifx-tag-preview]');
    if (preview && st()) preview.innerHTML = tagPreviewHtml(st().pageTagsForFeed(feedKey));
  }

  function resolveComposerTags(feedKey, form, body) {
    var base = st() ? st().pageTagsForFeed(feedKey) : emptyComposerTags();
    var picked = composerPickedTags(form);
    var fromBody = mn() ? mn().extractMentions(body || '') : emptyComposerTags();
    var merged = mn()
      ? mn().mergeTags(base, mn().mergeTags(picked, fromBody))
      : base;
    return st() ? st().normalizeTags(merged) : merged;
  }

  function statIcon(icon, count) {
    if (!count) count = 0;
    return '<span class="ifx-stock-cmt__stat" aria-hidden="true"><i class="ti ' + icon + '"></i><span>' + count + '</span></span>';
  }

  function reactionActionsHtml(opts) {
    opts = opts || {};
    var posActive = opts.posActive ? ' is-active' : '';
    var negActive = opts.negActive ? ' is-active' : '';
    var commentAttr = opts.commentId ? ' data-ifx-comment-id="' + esc(opts.commentId) + '"' : '';
    var replyAttr = opts.replyId ? ' data-ifx-reply-id="' + esc(opts.replyId) + '"' : '';
    var reactTarget = opts.replyId ? 'reply' : 'comment';
    var html = '';
    if (opts.showReplyBtn) {
      html += '<button type="button" class="ifx-stock-cmt__act ifx-stock-cmt__act--reply"' + commentAttr + replyAttr +
        ' data-ifx-stock-reply-focus' +
        (opts.replyUserName ? ' data-ifx-reply-user="' + esc(opts.replyUserName) + '"' : '') +
        '>Phản hồi</button>';
    }
    html += '<button type="button" class="ifx-stock-cmt__act ifx-stock-cmt__act--pos' + posActive + '"' +
      ' data-ifx-stock-react="positive" data-ifx-react-target="' + reactTarget + '"' + commentAttr + replyAttr + '>Tích cực</button>';
    html += '<button type="button" class="ifx-stock-cmt__act ifx-stock-cmt__act--neg' + negActive + '"' +
      ' data-ifx-stock-react="negative" data-ifx-react-target="' + reactTarget + '"' + commentAttr + replyAttr + '>Tiêu cực</button>';
    return html;
  }

  function userNameLink(userId, userName, className, opts) {
    className = className || 'ifx-stock-cmt__name';
    opts = opts || {};
    if (!opts.base) opts.base = '../account/';
    if (global.IfluxProfileLinks) {
      return IfluxProfileLinks.nameLink(userId, userName, className, opts);
    }
    return '<span class="' + esc(className) + '">' + esc(userName) + '</span>';
  }

  function replyItemHtml(r, commentId, uid) {
    var pos = (r.reactions && r.reactions.positive) ? r.reactions.positive.length : 0;
    var neg = (r.reactions && r.reactions.negative) ? r.reactions.negative.length : 0;
    var posActive = r.reactions && r.reactions.positive && r.reactions.positive.indexOf(uid) >= 0;
    var negActive = r.reactions && r.reactions.negative && r.reactions.negative.indexOf(uid) >= 0;

    return (
      '<article class="ifx-stock-cmt-detail__reply" data-ifx-reply-id="' + esc(r.id) + '">' +
        '<div class="ifx-stock-cmt__head">' +
          userNameLink(r.user_id, r.user_name) +
          '<span class="ifx-stock-cmt__dot">·</span>' +
          '<span class="ifx-stock-cmt__time">' + esc(fmtTime(r.created_at)) + '</span>' +
        '</div>' +
        '<p class="ifx-stock-cmt__body">' + bodyHtml(r.body) + '</p>' +
        (global.IfluxCommentComposer ? IfluxCommentComposer.imageHtml(r.image) : '') +
        '<div class="ifx-stock-cmt__stats">' +
          statIcon('ti-mood-smile', pos) +
          statIcon('ti-mood-sad', neg) +
        '</div>' +
        '<div class="ifx-stock-cmt__actions">' +
          reactionActionsHtml({
            commentId: commentId,
            replyId: r.id,
            replyUserName: r.user_name,
            posActive: posActive,
            negActive: negActive,
            showReplyBtn: true
          }) +
        '</div>' +
      '</article>'
    );
  }

  function tagPreviewHtml(tags) {
    if (!tags) return '';
    var inner = '';
    (tags.tickers || []).forEach(function (tk) {
      inner += '<span class="ifx-com-tag ifx-com-tag--ticker">' + esc(tk) + '</span>';
    });
    if (tags.sector && tags.sector.name) {
      inner += '<span class="ifx-com-tag ifx-com-tag--sector">' + esc(tags.sector.name) + '</span>';
    }
    if (tags.family && tags.family.name) {
      inner += '<span class="ifx-com-tag ifx-com-tag--family">' + esc(tags.family.name) + '</span>';
    }
    if (tags.story && tags.story.name) {
      inner += '<span class="ifx-com-tag ifx-com-tag--story">' + esc(tags.story.name) + '</span>';
    }
    return inner;
  }

  function listItemHtml(c, feedKey, uid, opts) {
    opts = opts || {};
    var pos = (c.reactions && c.reactions.positive) ? c.reactions.positive.length : 0;
    var neg = (c.reactions && c.reactions.negative) ? c.reactions.negative.length : 0;
    var replies = (c.replies && c.replies.length) || 0;
    var posActive = c.reactions && c.reactions.positive && c.reactions.positive.indexOf(uid) >= 0;
    var negActive = c.reactions && c.reactions.negative && c.reactions.negative.indexOf(uid) >= 0;
    var threadHref = commentDetailHref(feedKey, c.id, opts);

    return (
      '<article class="ifx-stock-cmt' + (opts.profile ? ' ifx-profile-cmt' : '') + '" data-ifx-comment-id="' + esc(c.id) + '" data-ifx-feed="' + esc(feedKey) + '">' +
        '<div class="ifx-stock-cmt__head">' +
          userNameLink(c.user_id, c.user_name, 'ifx-stock-cmt__name', opts) +
          '<span class="ifx-stock-cmt__dot">·</span>' +
          '<span class="ifx-stock-cmt__time">' + esc(fmtTime(c.created_at)) + '</span>' +
        '</div>' +
        '<p class="ifx-stock-cmt__body">' + bodyHtml(c.body) + '</p>' +
        (global.IfluxCommentComposer ? IfluxCommentComposer.imageHtml(c.image) : '') +
        tagsHtml(c.tags) +
        '<div class="ifx-stock-cmt__stats">' +
          statIcon('ti-mood-smile', pos) +
          statIcon('ti-mood-sad', neg) +
          statIcon('ti-message', replies) +
        '</div>' +
        '<div class="ifx-stock-cmt__actions">' +
          '<a class="ifx-stock-cmt__act ifx-stock-cmt__act--thread" href="' + threadHref + '">Bình luận</a>' +
          reactionActionsHtml({
            commentId: c.id,
            posActive: posActive,
            negActive: negActive,
            showReplyBtn: false
          }) +
        '</div>' +
      '</article>'
    );
  }

  function composerHtml(feedKey, opts) {
    opts = opts || {};
    var formClass = opts.detail ? 'ifx-stock-cmt-detail__composer' : 'ifx-stock-chat__composer';
    var bodyKey = opts.detail ? 'data-ifx-stock-reply-body' : 'data-ifx-stock-comment-body';
    var formKey = opts.detail ? 'data-ifx-stock-reply-form' : 'data-ifx-stock-comment-form';
    var isGroup = String(feedKey || '').indexOf(':') >= 0;
    var placeholder = opts.detail
      ? 'Phản hồi — gõ @ để gắn thêm thẻ...'
      : (isGroup
        ? 'Chia sẻ nhận định về chủ đề này — gõ @ để gắn thêm thẻ...'
        : 'Chia sẻ nhận định về cổ phiếu này — gõ @ để gắn thêm thẻ...');
    var pageTags = st() ? st().pageTagsForFeed(feedKey) : null;
    var extraTop =
      (opts.detail
        ? '<div class="ifx-stock-cmt-detail__reply-bar" data-ifx-reply-bar hidden>' +
            '<span data-ifx-reply-bar-text></span>' +
            '<button type="button" class="ifx-stock-cmt-detail__reply-bar-cancel" data-ifx-reply-bar-cancel aria-label="Hủy phản hồi"><i class="ti ti-x"></i></button>' +
          '</div>'
        : '') +
      '<div class="ifx-stock-chat__tag-preview" data-ifx-tag-preview>' +
        (pageTags ? tagPreviewHtml(pageTags) : '') +
      '</div>';
    var formAttrs = formKey +
      ' data-ifx-composer-feed="' + esc(feedKey) + '"' +
      ' data-ifx-composer-ticker="' + esc(feedKey) + '" data-ifx-reply-to-id=""';

    if (global.IfluxCommentComposer) {
      return IfluxCommentComposer.html({
        formClass: formClass,
        formAttrs: formAttrs,
        bodyAttr: bodyKey,
        placeholder: placeholder,
        withMentionDrop: true,
        extraTop: extraTop
      });
    }

    return (
      '<form class="' + formClass + '" ' + formAttrs + '>' +
        extraTop +
        '<div class="ifx-mention-wrap">' +
          '<textarea class="ix-input" rows="2" placeholder="' + esc(placeholder) + '" ' + bodyKey + '></textarea>' +
          '<div class="ifx-mention-drop" data-ifx-mention-drop hidden></div>' +
        '</div>' +
        '<div class="ifx-stock-chat__composer-foot">' +
          '<button type="submit" class="ix-btn ix-btn-primary ix-btn-sm" aria-label="Gửi"><i class="ti ti-send"></i></button>' +
        '</div>' +
      '</form>'
    );
  }

  function panelHtml(feedKey) {
    var count = st() ? st().countActivity(feedKey) : 0;
    return (
      '<section class="ifx-stock-panel ifx-stock-panel--chat">' +
        '<header class="ifx-stock-chat__header">' +
          '<h2 class="ifx-stock-panel__title"><i class="ti ti-message"></i> Bình luận <span class="ifx-com-side-count">' + count + '</span></h2>' +
        '</header>' +
        '<div class="ifx-stock-chat" data-ifx-stock-chat data-ifx-chat-feed="' + esc(feedKey) + '">' +
          '<div class="ifx-stock-chat__feed" data-ifx-stock-comments></div>' +
          composerHtml(feedKey) +
        '</div>' +
      '</section>'
    );
  }

  function setLazy(root, lazy) {
    if (lazyByRoot) lazyByRoot.set(root, lazy);
    else root[lazyFallbackKey] = lazy;
  }

  function getLazy(root) {
    if (lazyByRoot) return lazyByRoot.get(root);
    return root[lazyFallbackKey];
  }

  function mountListFeed(root, feedKey) {
    var feed = root.querySelector('[data-ifx-stock-comments]');
    if (!feed || !scrollFeed()) return;

    var old = getLazy(root);
    if (old && old.destroy) old.destroy();

    var lazy = scrollFeed().mount(feed, {
      pageSize: 8,
      emptyHtml: '<div class="ifx-stock-chat__empty">Chưa có bình luận. Hãy làm người đầu tiên.</div>',
      getItems: function () { return st() ? st().getComments(feedKey) : []; },
      renderItem: function (c) { return listItemHtml(c, feedKey, userId()); },
      onRendered: function () { bindListActions(root, feedKey); }
    });
    setLazy(root, lazy);
  }

  function bindMentionForm(form) {
    if (!form || !mn()) return;
    var ta = form.querySelector('[data-ifx-stock-comment-body], [data-ifx-stock-reply-body], .ifx-cmt-composer__input, textarea');
    var drop = form.querySelector('[data-ifx-mention-drop]');
    var preview = form.querySelector('[data-ifx-tag-preview]');
    var feedKey = form.getAttribute('data-ifx-composer-feed') || form.getAttribute('data-ifx-composer-ticker') || '';

    composerPickedTags(form);

    function syncPreview(body) {
      if (!preview) return;
      preview.innerHTML = tagPreviewHtml(resolveComposerTags(feedKey, form, body || (ta ? ta.value : '')));
    }

    function onTagPicked(entity) {
      form.__ifxComposerTags = mn().applyEntityToTags(composerPickedTags(form), entity);
      syncPreview();
    }

    if (ta && drop) {
      mn().bindAutocomplete(ta, drop, syncPreview, onTagPicked);
      ta.addEventListener('iflux-mention-input', function () { syncPreview(); });
    }
  }

  function bindComposer(form, feedKey, root) {
    if (!form) return;
    if (global.IfluxCommentComposer) IfluxCommentComposer.bind(form);
    bindMentionForm(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = global.IfluxCommentComposer
        ? IfluxCommentComposer.readPayload(form)
        : { body: '', image: null };
      var ta = form.querySelector('[data-ifx-stock-comment-body]');
      var user = auth() ? auth().getUser() : null;
      try {
        var raw = (payload.body || (ta ? ta.value.trim() : '')).trim();
        var tags = resolveComposerTags(feedKey, form, raw);
        var body = mn() ? mn().stripMentions(raw) : raw;
        st().addComment(feedKey, user, { body: body, tags: tags, image: payload.image || null });
        if (global.IfluxCommentComposer) IfluxCommentComposer.reset(form);
        else if (ta) ta.value = '';
        resetComposerTags(form, feedKey);
        refreshFeed(root, feedKey, true);
      } catch (err) {
        if (global.ixToast) ixToast(err.message || 'Không gửi được', 'warning');
      }
    });
  }

  function bindListActions(root, feedKey, opts) {
    opts = opts || {};
    var uid = userId();

    root.querySelectorAll('[data-ifx-stock-react]').forEach(function (btn) {
      if (btn.__ifxBound) return;
      btn.__ifxBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var wrap = btn.closest('[data-ifx-feed]');
        var itemFeed = wrap ? wrap.getAttribute('data-ifx-feed') : feedKey;
        var commentId = btn.getAttribute('data-ifx-comment-id');
        var type = btn.getAttribute('data-ifx-stock-react');
        var target = btn.getAttribute('data-ifx-react-target') || 'comment';
        if (!st()) return;
        if (target === 'reply') {
          st().toggleReplyReaction(itemFeed, commentId, btn.getAttribute('data-ifx-reply-id'), uid, type);
        } else {
          st().toggleReaction(itemFeed, commentId, uid, type);
        }
        if (opts && opts.onReact) opts.onReact();
        else refreshFeed(root, itemFeed);
      });
    });
  }

  function bindProfileTimeline(root, onUpdate) {
    bindListActions(root, '', { onReact: onUpdate });
  }

  function clearReplyTarget(form) {
    if (!form) return;
    form.setAttribute('data-ifx-reply-to-id', '');
    var bar = form.querySelector('[data-ifx-reply-bar]');
    if (bar) bar.hidden = true;
  }

  function focusMainComposer(root, opts) {
    opts = opts || {};
    var form = root.querySelector('[data-ifx-stock-reply-form]');
    if (!form) return;
    var ta = form.querySelector('[data-ifx-stock-reply-body]');
    var userName = (opts.userName || '').trim();
    var replyId = opts.replyId || '';

    form.setAttribute('data-ifx-reply-to-id', replyId);
    var bar = form.querySelector('[data-ifx-reply-bar]');
    var barText = form.querySelector('[data-ifx-reply-bar-text]');
    if (bar && barText && userName) {
      bar.hidden = false;
      barText.textContent = 'Phản hồi ' + userName;
    }

    if (ta && userName) {
      var tag = '@' + userName + ' ';
      if (!ta.value.trim() || ta.value.indexOf('@' + userName) < 0) {
        ta.value = tag;
      }
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    } else if (ta) {
      ta.focus();
    }

    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function bindDetailActions(root, feedKey, commentId, onUpdate) {
    var uid = userId();

    root.querySelectorAll('[data-ifx-stock-react]').forEach(function (btn) {
      if (btn.__ifxDetailBound) return;
      btn.__ifxDetailBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var type = btn.getAttribute('data-ifx-stock-react');
        var target = btn.getAttribute('data-ifx-react-target') || 'comment';
        var cid = btn.getAttribute('data-ifx-comment-id') || commentId;
        if (!st()) return;
        if (target === 'reply') {
          st().toggleReplyReaction(feedKey, cid, btn.getAttribute('data-ifx-reply-id'), uid, type);
          if (onUpdate) onUpdate({ replies: true });
        } else {
          st().toggleReaction(feedKey, cid, uid, type);
          if (onUpdate) onUpdate({ replies: false });
        }
      });
    });

    root.querySelectorAll('[data-ifx-stock-reply-focus]').forEach(function (btn) {
      if (btn.__ifxReplyFocusBound) return;
      btn.__ifxReplyFocusBound = true;
      btn.addEventListener('click', function () {
        focusMainComposer(root, {
          userName: btn.getAttribute('data-ifx-reply-user') || '',
          replyId: btn.getAttribute('data-ifx-reply-id') || ''
        });
      });
    });

    var mainForm = root.querySelector('[data-ifx-stock-reply-form]');
    var cancelBar = mainForm && mainForm.querySelector('[data-ifx-reply-bar-cancel]');
    if (cancelBar && !cancelBar.__ifxBound) {
      cancelBar.__ifxBound = true;
      cancelBar.addEventListener('click', function () {
        clearReplyTarget(mainForm);
        var ta = mainForm.querySelector('[data-ifx-stock-reply-body]');
        if (ta) ta.value = '';
      });
    }
  }

  function refreshFeed(root, feedKey, reset) {
    var lazy = getLazy(root);
    if (lazy) {
      if (reset && lazy.reset) lazy.reset();
      else if (lazy.refresh) lazy.refresh();
    } else {
      mountListFeed(root, feedKey);
    }
    if (st()) {
      var n = st().countActivity(feedKey);
      root.querySelectorAll('.ifx-com-side-count').forEach(function (el) { el.textContent = n; });
    }
  }

  function bind(root, feedKey) {
    if (!root) return;
    mountListFeed(root, feedKey);
    bindComposer(root.querySelector('[data-ifx-stock-comment-form]'), feedKey, root);
  }

  global.IfluxStockCommentsUI = {
    panelHtml: panelHtml,
    listItemHtml: listItemHtml,
    replyItemHtml: replyItemHtml,
    composerHtml: composerHtml,
    commentDetailHref: commentDetailHref,
    tagsHtml: tagsHtml,
    bodyHtml: bodyHtml,
    fmtTime: fmtTime,
    statIcon: statIcon,
    reactionActionsHtml: reactionActionsHtml,
    resetComposerTags: resetComposerTags,
    resolveComposerTags: resolveComposerTags,
    refreshFeed: refreshFeed,
    bind: bind,
    bindComposer: bindComposer,
    bindDetailActions: bindDetailActions,
    focusMainComposer: focusMainComposer,
    clearReplyTarget: clearReplyTarget,
    mountListFeed: mountListFeed,
    bindMentionForm: bindMentionForm,
    bindProfileTimeline: bindProfileTimeline,
    userNameLink: userNameLink
  };
})(window);
