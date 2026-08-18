/**
 * Interaction Catalog — RC-IU-01…05 · IU-001
 * MUST be presentation-agnostic: không matchMedia, không if (presentation).
 * Presentation = Host.
 * variant: bar | thread | (default) — layout slot, không phải presentation.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionCatalog) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function perm() {
    return global.IfluxInteractionPermission;
  }

  function store() {
    return global.IfluxInteractionStore;
  }

  function shareFoundation() {
    return global.IfluxShareFoundation || global.IfluxInsightShareStore || null;
  }

  /** Canonical sạch cho bài — metadata SoT; không lấy affiliate từ query location. */
  function stripPublicIdFromPath(pathname) {
    pathname = String(pathname || '/').split('?')[0].split('#')[0];
    if (!pathname.startsWith('/')) pathname = '/' + pathname;
    var segs = pathname.split('/').filter(Boolean);
    if (segs.length > 0 && /^IFL[A-Z0-9]{5,17}$/.test(segs[0].toUpperCase())) {
      segs.shift();
      pathname = segs.length ? '/' + segs.join('/') : '/';
    }
    if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') {
      pathname = pathname.slice(0, -1);
    }
    return pathname || '/';
  }

  /** Normalized current route — strip publicId + ref/r query (fallback sau metadata). */
  function normalizeCurrentRouteCanonical() {
    var loc = global.location;
    if (!loc) return '';
    var SF = shareFoundation();
    var path = stripPublicIdFromPath(loc.pathname);
    var origin = loc.origin && loc.origin !== 'null' ? loc.origin : 'https://iflux.vn';
    var search = '';
    try {
      var u = new URL(loc.href);
      u.searchParams.delete('ref');
      u.searchParams.delete('r');
      search = u.searchParams.toString();
    } catch (e) { /* ignore */ }
    var raw = origin + path + (search ? '?' + search : '');
    if (SF && SF.normalizeShareUrl) return SF.normalizeShareUrl(raw);
    return raw;
  }

  function resolveCommunityCanonical(target) {
    var id = target && (target.id || target.postId || target.slug);
    if (global.IfluxCommunityStore && id) {
      var post = null;
      if (IfluxCommunityStore.getPostById) post = IfluxCommunityStore.getPostById(id);
      if (!post && IfluxCommunityStore.getPostBySlug) post = IfluxCommunityStore.getPostBySlug(id);
      if (post && post.metadata && (post.metadata.canonical || post.metadata.url)) {
        return post.metadata.canonical || post.metadata.url;
      }
      if (post && global.IfluxSeoUrl && IfluxSeoUrl.postCanonical) {
        return IfluxSeoUrl.postCanonical(post);
      }
    }
    var routeCanon = normalizeCurrentRouteCanonical();
    if (routeCanon) return routeCanon;
    var SF = shareFoundation();
    if (SF && SF.normalizeShareUrl) {
      return SF.normalizeShareUrl((global.location && global.location.href) || '');
    }
    try {
      var u = new URL(global.location.href);
      u.hash = '';
      u.searchParams.delete('ref');
      u.searchParams.delete('r');
      return u.toString();
    } catch (e) {
      return (global.location && global.location.href) || '';
    }
  }

  function ensureShareFoundation(done) {
    var SF = shareFoundation();
    if (SF && SF.buildShareUrl) {
      done(SF);
      return;
    }
    var src = '/Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js?v=p7ShareSheet20260730';
    function finish() {
      done(shareFoundation());
    }
    if (document.querySelector('script[src="' + src + '"]')) {
      var n = 0;
      var t = setInterval(function () {
        n += 1;
        if (shareFoundation() && shareFoundation().buildShareUrl) {
          clearInterval(t);
          finish();
        } else if (n > 40) {
          clearInterval(t);
          finish();
        }
      }, 50);
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.onload = finish;
    s.onerror = finish;
    document.head.appendChild(s);
  }

  /** Copy đồng bộ trong user-gesture — desktop sidebar cần execCommand trước async clipboard. */
  function copyShareUrl(url) {
    url = String(url || '').trim();
    if (!url) {
      if (global.ixToast) ixToast('Không có link chia sẻ', 'warning');
      return false;
    }
    function toast(ok) {
      if (global.ixToast) {
        ixToast(ok ? 'Đã sao chép link chia sẻ' : 'Không sao chép được — thử chọn và copy thủ công', ok ? 'success' : 'warning');
      }
      return ok;
    }
    function syncCopy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, url.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) {
        return false;
      }
    }
    if (syncCopy()) return toast(true);
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast(true);
      }).catch(function () {
        toast(false);
      });
      return true;
    }
    return toast(false);
  }

  function buildArticleShareUrl(target, SF) {
    var canonical = resolveCommunityCanonical(target);
    if (!canonical) return '';
    if (SF && SF.buildShareUrl) {
      try {
        return SF.buildShareUrl({
          entityType: 'community_post',
          entityId: target && (target.id || target.postId),
          canonicalUrl: canonical,
          affiliate: true
        }).shareUrl || canonical;
      } catch (err) {
        return canonical;
      }
    }
    return canonical;
  }

  function handleShareUrlClick(target) {
    var r = perm() ? perm().resolve({ action: 'share_url', target: target }) : 'Allow';
    if (r === 'LoginRequired') {
      if (global.IfluxAuth && IfluxAuth.requireAuth) IfluxAuth.requireAuth();
      else if (global.ixToast) ixToast('Đăng nhập để chia sẻ link của bạn.', 'warning');
      return;
    }
    if (r !== 'Allow') return;

    var Share = global.IfluxShareAction || global.IfluxInsightShare;
    var canonical = resolveCommunityCanonical(target);
    if (!canonical) {
      if (global.ixToast) ixToast('Không xác định được link bài viết', 'warning');
      return;
    }

    function runExecuteShare() {
      var S = global.IfluxShareAction || global.IfluxInsightShare;
      if (S && S.executeShare) {
        S.executeShare({
          canonicalUrl: canonical,
          entityType: 'community_post',
          entityId: target && (target.id || target.postId),
          title: (target && (target.title || target.name)) || ''
        });
        return;
      }
      /* Fallback nếu Foundation UI chưa load — vẫn qua Store Self-only */
      var SF = shareFoundation();
      var url = buildArticleShareUrl(target, SF);
      if (url) copyShareUrl(url);
    }

    if (Share && Share.executeShare) {
      runExecuteShare();
      return;
    }
    ensureShareFoundation(function () {
      if (global.IfluxWebUI && IfluxWebUI.ensureShareAction) {
        IfluxWebUI.ensureShareAction().then(runExecuteShare);
      } else {
        runExecuteShare();
      }
    });
  }

  function countBadge(attr, n) {
    return '<span class="ifx-com-side-count" ' + attr + '>' + esc(n == null ? 0 : n) + '</span>';
  }

  /** Thời gian tương đối tiếng Việt — xx phút / giờ / ngày */
  function relativeTime(iso) {
    if (!iso) return '';
    var t = new Date(iso).getTime();
    if (!t || isNaN(t)) return '';
    var sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (sec < 60) return 'Vừa xong';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + ' phút';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' giờ';
    var day = Math.floor(hr / 24);
    if (day < 30) return day + ' ngày';
    var mo = Math.floor(day / 30);
    if (mo < 12) return mo + ' tháng';
    return Math.floor(mo / 12) + ' năm';
  }

  function renderActionBar(el, ctx) {
    if (!el) return;
    ctx = ctx || {};
    var target = ctx.target || {};
    var p = ctx.projection || { likes: 0, comments: 0, shares: 0, favorites: 0 };
    /* UI Ownership: Thích → Bình luận → Chia sẻ; badge số = ifx-com-side-count (DS). Chia sẻ không badge. */
    el.innerHTML =
      '<div class="ifx-ix-action-bar ifx-com-article__actions" data-ifx-ix-actions role="toolbar" aria-label="Tương tác">' +
        '<button type="button" class="ifx-com-action" data-ifx-ix-act="like" data-ifx-com-like>' +
          '<i class="ti ti-heart"></i> <span data-ifx-ix-like-label>Thích</span> ' + countBadge('data-ifx-ix-likes', p.likes) +
        '</button>' +
        '<button type="button" class="ifx-com-action" data-ifx-ix-act="open">' +
          '<i class="ti ti-message"></i> Bình luận ' + countBadge('data-ifx-ix-comments', p.comments) +
        '</button>' +
        '<button type="button" class="ifx-com-action" data-ifx-ix-act="share_url" data-ifx-com-share>' +
          '<i class="ti ti-share"></i> Chia sẻ' +
        '</button>' +
      '</div>';

    el.querySelectorAll('[data-ifx-ix-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-ifx-ix-act');
        if (act === 'open') {
          if (typeof ctx.onOpenInteractive === 'function') {
            ctx.onOpenInteractive(target);
            return;
          }
          var composer = el.closest('[data-ifx-ix-host]') &&
            el.closest('[data-ifx-ix-host]').querySelector('[data-ifx-ix-body]');
          if (composer) {
            try { composer.focus(); } catch (err) { /* ignore */ }
          }
          return;
        }
        if (act === 'share_url') {
          handleShareUrlClick(target);
          return;
        }
        if (act === 'like') {
          var pr = perm() ? perm().resolve({ action: 'like', target: target }) : 'LoginRequired';
          if (pr !== 'Allow') {
            if (global.ixToast) ixToast('Đăng nhập để thích', 'warning');
            return;
          }
          /* RC-IA-01: Summary like không init Interactive Store — runMutation đủ */
          if (store() && store().runMutation) {
            store().runMutation(target, 'like').then(function (out) {
              var host = el.closest('[data-ifx-ix-host]');
              if (host && out && out.projection) updateSummaryCounts(host, out.projection);
              try {
                document.dispatchEvent(new CustomEvent('iflux-ix-projection', {
                  detail: { target: target, counts: out && out.projection }
                }));
              } catch (e) { /* ignore */ }
            }).catch(function (err) {
              if (global.ixToast) ixToast((err && err.message) || 'Không thích được', 'warning');
            });
          }
        }
      });
    });
  }

  function updateSummaryCounts(root, counts) {
    if (!root || !counts) return;
    var likes = root.querySelector('[data-ifx-ix-likes]');
    var comments = root.querySelector('[data-ifx-ix-comments]');
    if (likes) likes.textContent = String(counts.likes || 0);
    if (comments) comments.textContent = String(counts.comments || 0);
  }

  /** RC-IU-01 — không nhận/branch presentation */
  function renderSummary(root, ctx) {
    ctx = ctx || {};
    var p = ctx.projection || { likes: 0, comments: 0, shares: 0, favorites: 0 };
    /* variant bar = chỉ ActionBar (bottom Entry) — không nhánh presentation */
    if (ctx.variant === 'bar') {
      root.innerHTML = '<div class="ifx-ix-summary ifx-ix-summary--bar" data-ifx-ix-summary="1"><div data-ifx-ix-action-bar></div></div>';
      renderActionBar(root.querySelector('[data-ifx-ix-action-bar]'), {
        target: ctx.target,
        mode: 'summary',
        projection: p,
        onOpenInteractive: ctx.onOpenInteractive
      });
      return;
    }
    /* Số lượng trên badge nút (ifx-com-side-count) — không lặp hàng counts riêng */
    root.innerHTML =
      '<div class="ifx-ix-summary" data-ifx-ix-summary="1">' +
        '<div class="ifx-ix-summary__actions" data-ifx-ix-action-bar></div>' +
      '</div>';
    renderActionBar(root.querySelector('[data-ifx-ix-action-bar]'), {
      target: ctx.target,
      mode: 'summary',
      projection: p,
      onOpenInteractive: ctx.onOpenInteractive
    });
  }

  function bindComposerForm(root, ctx) {
    var form = root.querySelector('[data-ifx-ix-composer]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var body = (root.querySelector('[data-ifx-ix-body]') || {}).value || '';
      var pr = perm() ? perm().resolve({ action: 'comment', target: ctx.target }) : 'LoginRequired';
      if (pr !== 'Allow') {
        if (global.ixToast) ixToast('Đăng nhập để bình luận', 'warning');
        return;
      }
      if (!store() || !store().addComment) return;
      store().addComment(ctx.target, { body: String(body).trim() }).then(function () {
        var ta = root.querySelector('[data-ifx-ix-body]');
        if (ta) ta.value = '';
        var thread = store().getThread(ctx.target);
        if (thread) renderThread(root, thread, ctx);
        if (store().getProjection) updateSummaryCounts(root, store().getProjection(ctx.target));
      }).catch(function (err) {
        if (global.ixToast) ixToast((err && err.message) || 'Không gửi được', 'warning');
      });
    });
  }

  function renderInteractive(root, ctx) {
    ctx = ctx || {};
    var p = ctx.projection || { likes: 0, comments: 0, shares: 0, favorites: 0 };
    root.setAttribute('data-ifx-ix-interactive', '1');
    /* variant thread = list only — page chrome owns action bar + composer */
    if (ctx.variant === 'thread') {
      root.innerHTML =
        '<div class="ifx-com-comments__list" data-ifx-ix-thread>Đang tải bình luận…</div>';
      return;
    }
    /* Default: Catalog render domain content only — card/page chrome do consumer (RC-IU-01) */
    root.innerHTML =
      '<div data-ifx-ix-action-bar></div>' +
      '<div class="ifx-com-comments__list ifx-com-comments__list--side" data-ifx-ix-thread>Đang tải bình luận…</div>' +
      '<form class="ifx-com-comment-form ifx-com-comment-form--side" data-ifx-ix-composer>' +
        '<textarea class="ix-input" data-ifx-ix-body rows="2" placeholder="Viết bình luận…"></textarea>' +
        '<button type="submit" class="ix-btn ix-btn-primary ix-btn-sm">Gửi</button>' +
      '</form>';
    renderActionBar(root.querySelector('[data-ifx-ix-action-bar]'), {
      target: ctx.target,
      mode: 'interactive',
      projection: p
    });
    bindComposerForm(root, ctx);
  }

  function commentImageHtml(url) {
    if (!url) return '';
    if (global.IfluxCommentComposer && IfluxCommentComposer.imageHtml) {
      return IfluxCommentComposer.imageHtml(url);
    }
    return '<div class="ifx-cmt-image"><img src="' + esc(url) + '" alt="Ảnh bình luận" loading="lazy" /></div>';
  }

  function renderThread(root, thread, ctx) {
    var el = root.querySelector('[data-ifx-ix-thread]');
    if (!el) return;
    ctx = ctx || {};
    var list = (thread && thread.comments) || [];
    if (!list.length) {
      el.innerHTML = '<div class="ifx-com-comments__empty">Chưa có bình luận.</div>';
      return;
    }
    /* 2A: không nút Thích comment — chỉ Trả lời + thời gian */
    el.innerHTML = list.map(function (c) {
      var name = c.user_name || 'Thành viên';
      var time = relativeTime(c.created_at);
      return (
        '<div class="ifx-com-comment" data-ifx-ix-comment-id="' + esc(c.id) + '">' +
          '<strong class="ifx-com-comment__name">' + esc(name) + '</strong>' +
          '<p class="ifx-com-comment__body">' + esc(c.body || '') + '</p>' +
          commentImageHtml(c.image || c.image_url) +
          '<div class="ifx-com-comment__meta">' +
            '<button type="button" class="ifx-com-comment__reply" data-ifx-ix-reply' +
              ' data-ifx-ix-reply-name="' + esc(name) + '">Trả lời</button>' +
            (time ? '<span class="ifx-com-comment__time">' + esc(time) + '</span>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');

    el.querySelectorAll('[data-ifx-ix-reply]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-ifx-ix-reply-name') || '';
        try {
          document.dispatchEvent(new CustomEvent('iflux-ix-reply', {
            detail: { name: name, target: ctx.target }
          }));
        } catch (e) { /* ignore */ }
        if (typeof ctx.onReply === 'function') ctx.onReply({ name: name });
      });
    });
  }

  global.IfluxInteractionCatalog = {
    renderSummary: renderSummary,
    updateSummaryCounts: updateSummaryCounts,
    renderInteractive: renderInteractive,
    renderThread: renderThread,
    renderActionBar: renderActionBar
  };
})(typeof window !== 'undefined' ? window : globalThis);
