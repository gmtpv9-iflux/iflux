/* Trang bình luận (/binh-luan)
 * Slice 4.4: post + entity qua Interaction Host (RC-API-08…12).
 * Dual-read LS qua Store; cấm WRITE authoritative mới (RC-PS-04).
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function comSt() { return global.IfluxCommunityStore; }
  function seo() { return global.IfluxSeoUrl; }
  function store() { return global.IfluxInteractionStore; }
  function catalog() { return global.IfluxInteractionCatalog; }
  function composer() { return global.IfluxCommentComposer; }

  function assertIxOwner() {
    return !!(global.IfluxInteractionHost && IfluxInteractionHost.mountInteraction);
  }

  function parseCtx() {
    if (seo() && seo().parseCommentsContext) return seo().parseCommentsContext();
    var params = new URLSearchParams(location.search || '');
    return {
      scope: params.get('scope') || '',
      id: params.get('id') || ''
    };
  }

  function titleFor(ctx) {
    if (!ctx || !ctx.scope) return 'Bình luận';
    if (ctx.scope === 'post') {
      var post = comSt() && (comSt().getPostBySlug(ctx.id) || comSt().getPostById(ctx.id));
      return post ? ('Bình luận · ' + (post.title || 'Bài viết')) : 'Bình luận bài viết';
    }
    if (ctx.scope === 'stock') return 'Bình luận · ' + String(ctx.id || '').toUpperCase();
    if (ctx.scope === 'sector') return 'Bình luận · Ngành';
    if (ctx.scope === 'family') return 'Bình luận · Hệ sinh thái';
    if (ctx.scope === 'story') return 'Bình luận · Câu chuyện';
    return 'Bình luận';
  }

  function backHref(ctx) {
    if (!ctx) return '/cong-dong';
    if (seo()) {
      if (ctx.scope === 'post') return seo().postPath(ctx.id);
      if (ctx.scope === 'stock') return seo().stockPath(ctx.id);
      if (ctx.scope === 'sector') return seo().sectorPath(ctx.id);
      if (ctx.scope === 'family') return seo().ecosystemPath(ctx.id);
      if (ctx.scope === 'story') return seo().chuDePath ? seo().chuDePath(ctx.id) : ('/cau-chuyen/' + encodeURIComponent(ctx.id));
    }
    return '/';
  }

  function entityTarget(ctx) {
    var type = String((ctx && ctx.scope) || '').toLowerCase();
    if (type === 'article') type = 'post';
    if (type === 'ecosystem') type = 'family';
    var id = String((ctx && ctx.id) || '').trim();
    if (type === 'stock') id = id.toUpperCase();
    return { type: type, id: id };
  }

  function shellTitle(ctx, post) {
    if (ctx.scope === 'post' && post) return post.title || 'Bài viết';
    if (ctx.scope === 'stock') return String(ctx.id || '').toUpperCase() || 'Cổ phiếu';
    if (ctx.scope === 'sector') return 'Ngành';
    if (ctx.scope === 'family') return 'Hệ sinh thái';
    if (ctx.scope === 'story') return 'Câu chuyện';
    return 'Bình luận';
  }

  function resolvePresentation() {
    if (global.IfluxInteractionPresentationResolver && IfluxInteractionPresentationResolver.resolve) {
      return IfluxInteractionPresentationResolver.resolve({
        pageDefinition: { pageKey: 'comments', forcePage: true },
        preferPage: true,
        viewport: { width: typeof window !== 'undefined' ? window.innerWidth : 1200 }
      });
    }
    return 'page';
  }

  function resolvePost(ctx) {
    if (!comSt() || !ctx || !ctx.id) return null;
    return comSt().getPostBySlug(ctx.id) || comSt().getPostById(ctx.id);
  }

  function syncPostLikes(counts) {
    var n = counts && counts.likes != null ? counts.likes : null;
    if (n == null) return;
    document.querySelectorAll('[data-ifx-ix-post-likes]').forEach(function (el) {
      el.textContent = String(n);
    });
  }

  function applyReplyPrefix(root, name) {
    var form = root.querySelector('[data-ifx-cmt-page-composer] form');
    if (!form) return;
    var input = form.querySelector('[data-ifx-cmt-body]');
    if (!input) return;
    var prefix = '@' + String(name || '').trim() + ' ';
    var cur = String(input.value || '');
    if (cur.indexOf(prefix) === 0) {
      try { input.focus(); } catch (e) { /* ignore */ }
      return;
    }
    if (/^@\S+\s/.test(cur)) {
      cur = cur.replace(/^@\S+\s+/, '');
    }
    input.value = prefix + cur;
    form.setAttribute('data-ifx-reply-name', String(name || ''));
    var chip = root.querySelector('[data-ifx-reply-chip]');
    if (chip) {
      chip.hidden = false;
      chip.innerHTML =
        'Đang trả lời <strong>' + esc(name) + '</strong> ' +
        '<button type="button" class="ifx-com-comment__reply" data-ifx-reply-clear aria-label="Hủy trả lời"><i class="ti ti-x"></i></button>';
      var clr = chip.querySelector('[data-ifx-reply-clear]');
      if (clr) {
        clr.addEventListener('click', function () {
          chip.hidden = true;
          chip.innerHTML = '';
          form.removeAttribute('data-ifx-reply-name');
          var v = String(input.value || '');
          if (v.indexOf(prefix) === 0) input.value = v.slice(prefix.length);
        });
      }
    }
    try {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    } catch (e2) { /* ignore */ }
  }

  function bindComposer(root, target) {
    var wrap = root.querySelector('[data-ifx-cmt-page-composer]');
    if (!wrap || !composer()) return;
    var form = wrap.querySelector('form');
    if (!form) return;
    composer().bind(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pr = global.IfluxInteractionPermission
        ? IfluxInteractionPermission.resolve({ action: 'comment', target: target })
        : 'LoginRequired';
      if (pr !== 'Allow') {
        if (global.ixToast) ixToast('Đăng nhập để bình luận', 'warning');
        return;
      }
      var payload = composer().readPayload(form);
      if (!payload.body && !payload.image) {
        if (global.ixToast) ixToast('Nhập nội dung hoặc đính kèm ảnh', 'warning');
        return;
      }
      if (!store() || !store().addComment) return;
      store().addComment(target, {
        body: payload.body,
        image: payload.image || null
      }).then(function () {
        composer().reset(form);
        form.removeAttribute('data-ifx-reply-name');
        var chip = root.querySelector('[data-ifx-reply-chip]');
        if (chip) { chip.hidden = true; chip.innerHTML = ''; }
        var hostRoot = root.querySelector('[data-ifx-ix-interactive-root]');
        var thread = store().getThread(target);
        if (hostRoot && thread && catalog() && catalog().renderThread) {
          catalog().renderThread(hostRoot, thread, {
            target: target,
            onReply: function (d) { applyReplyPrefix(root, d && d.name); }
          });
        }
      }).catch(function (err) {
        if (global.ixToast) ixToast((err && err.message) || 'Không gửi được', 'warning');
      });
    });
  }

  function mountHost(root, target) {
    if (!global.IfluxInteractionHost || !IfluxInteractionHost.mountInteraction) return;
    var slot = root.querySelector('[data-ifx-ix-interactive-root]');
    if (!slot) return;
    IfluxInteractionHost.mountInteraction({
      root: slot,
      target: target,
      mode: 'interactive',
      presentation: resolvePresentation(),
      variant: 'thread',
      pageDefinition: { pageKey: 'comments', forcePage: true },
      preferPage: true,
      onReply: function (d) { applyReplyPrefix(root, d && d.name); }
    });
  }

  function renderIxChrome(root, ctx, opts) {
    opts = opts || {};
    var target = opts.target;
    var likes = opts.likes != null ? opts.likes : null;
    var title = opts.title || 'Bình luận';
    var composerHtml = composer()
      ? composer().html({
          placeholder: 'Viết bình luận…',
          bodyAttr: 'data-ifx-cmt-body',
          extraTop: '<div class="ifx-cmt-page__reply-chip" data-ifx-reply-chip hidden></div>'
        })
      : '<p class="ifx-com-empty">Thiếu composer.</p>';

    if (global.IfluxWebUI && IfluxWebUI.setCommentsShellHeader) {
      var headerOpts = {
        title: title,
        backHref: backHref(ctx)
      };
      if (likes != null && ctx.scope === 'post') {
        headerOpts.likes = likes;
        headerOpts.onLike = function () {
          var pr = global.IfluxInteractionPermission
            ? IfluxInteractionPermission.resolve({ action: 'like', target: target })
            : 'LoginRequired';
          if (pr !== 'Allow') {
            if (global.ixToast) ixToast('Đăng nhập để thích', 'warning');
            return;
          }
          if (!store() || !store().runMutation) return;
          store().runMutation(target, 'like').then(function (out) {
            syncPostLikes(out && out.projection);
          }).catch(function (err) {
            if (global.ixToast) ixToast((err && err.message) || 'Không thích được', 'warning');
          });
        };
      }
      IfluxWebUI.setCommentsShellHeader(headerOpts);
      /* Entity: không hiện like post (kể cả khi shell UI cache cũ) */
      if (ctx.scope !== 'post') {
        document.querySelectorAll('[data-ifx-ix-post-like]').forEach(function (el) {
          el.remove();
        });
      }
    }

    root.innerHTML =
      '<div class="ifx-cmt-page" data-ifx-article-comments-surface="page" data-ifx-ix-comments-page="1">' +
        '<div class="ifx-cmt-page__feed">' +
          '<div class="ifx-cmt-page__host" data-ifx-ix-interactive-root></div>' +
        '</div>' +
        '<div class="ifx-cmt-page__composer" data-ifx-cmt-page-composer>' + composerHtml + '</div>' +
      '</div>';

    document.addEventListener('iflux-ix-projection', function onProj(ev) {
      if (!root.isConnected) {
        document.removeEventListener('iflux-ix-projection', onProj);
        return;
      }
      if (ctx.scope === 'post') syncPostLikes(ev.detail && ev.detail.counts);
    });

    document.addEventListener('iflux-ix-reply', function onReply(ev) {
      if (!root.isConnected) {
        document.removeEventListener('iflux-ix-reply', onReply);
        return;
      }
      applyReplyPrefix(root, ev.detail && ev.detail.name);
    });

    if (store() && store().initInteractive) store().initInteractive();
    mountHost(root, target);
    bindComposer(root, target);

    if (store() && store().refreshProjection) {
      store().refreshProjection(target).then(function (counts) {
        if (ctx.scope === 'post') syncPostLikes(counts);
      }).catch(function () { /* ignore */ });
    }

    document.title = titleFor(ctx) + ' · iFlux';
    if (global.IfluxWebUI && IfluxWebUI.syncMobileTabbar) {
      try { IfluxWebUI.syncMobileTabbar(); } catch (e) { /* ignore */ }
    }
  }

  function renderPostPage(root, ctx) {
    if (!assertIxOwner()) {
      root.innerHTML = '<div class="ifx-com-empty">Thiếu Interaction Host — không dùng stack bình luận cũ.</div>';
      return;
    }
    var post = resolvePost(ctx);
    if (!post) {
      root.innerHTML = '<div class="ifx-com-empty">Đang tải bình luận…</div>';
      var url = '/api/community/articles/' + encodeURIComponent(ctx.id);
      fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (body) {
          var raw = (body && body.data && body.data.article)
            ? body.data.article
            : (body && body.data ? body.data : null);
          if (raw && raw.article) raw = raw.article;
          if (raw && comSt() && typeof comSt().upsertPostLocal === 'function') {
            comSt().upsertPostLocal(raw);
          }
          if (!resolvePost(ctx)) {
            root.innerHTML = '<div class="ifx-com-empty">Không tìm thấy bài viết.</div>';
            return;
          }
          renderPostPage(root, ctx);
        })
        .catch(function () {
          root.innerHTML = '<div class="ifx-com-empty">Không tìm thấy bài viết.</div>';
        });
      return;
    }
    var target = { type: 'post', id: String(post.id || post.slug || '') };
    renderIxChrome(root, ctx, {
      target: target,
      title: shellTitle(ctx, post),
      likes: (post.stats && post.stats.likes) || 0
    });
  }

  function renderEntityPage(root, ctx) {
    if (!assertIxOwner()) {
      root.innerHTML = '<div class="ifx-com-empty">Thiếu Interaction Host.</div>';
      return;
    }
    var target = entityTarget(ctx);
    if (!target.type || !target.id) {
      root.innerHTML = '<div class="ifx-com-empty">Thiếu ngữ cảnh bình luận.</div>';
      return;
    }
    renderIxChrome(root, ctx, {
      target: target,
      title: shellTitle(ctx, null)
    });
  }

  function render(root) {
    var ctx = parseCtx();
    if (!ctx || !ctx.scope || !ctx.id) {
      root.innerHTML = '<div class="ifx-com-empty">Thiếu ngữ cảnh bình luận.</div>';
      return;
    }
    if (global.IfluxInteractionHost && IfluxInteractionHost.unmountAll) {
      try { IfluxInteractionHost.unmountAll(); } catch (e) { /* ignore */ }
    }
    if (ctx.scope === 'post') renderPostPage(root, ctx);
    else renderEntityPage(root, ctx);
  }

  function init() {
    var root = document.querySelector('[data-ifx-comments-page]');
    if (!root) return;

    function run() {
      render(root);
    }

    if (global.IfluxInteractionBoot && IfluxInteractionBoot.ensureForInteractive) {
      IfluxInteractionBoot.ensureForInteractive().then(run).catch(function (err) {
        if (global.console && console.warn) console.warn('[CommentsPage] IX boot', err);
        run();
      });
    } else {
      run();
    }
  }

  global.IfluxCommentsPage = { init: init, render: render };
})(window);
