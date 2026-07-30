/**
 * Comments CTA — Slice 4.5: entity pages → Comments Host (/binh-luan).
 * Summary counts từ API (không UI++). Class DS sẵn: ifx-com-empty, ix-btn.
 */
(function (global) {
  'use strict';
  if (global.IfluxCommentsCta) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function commentsHref(target) {
    target = target || {};
    var type = String(target.type || '').toLowerCase();
    var id = String(target.id || '').trim();
    var c;
    if (global.IfluxSeoUrl && IfluxSeoUrl.commentsPath) {
      c = IfluxSeoUrl.commentsPath(type, id);
    } else if (type === 'stock') c = '/co-phieu/' + encodeURIComponent(id.toUpperCase()) + '/binh-luan';
    else if (type === 'sector') c = '/nganh/' + encodeURIComponent(id) + '/binh-luan';
    else if (type === 'family') c = '/he-sinh-thai/' + encodeURIComponent(id) + '/binh-luan';
    else if (type === 'story') c = '/cau-chuyen/' + encodeURIComponent(id) + '/binh-luan';
    else c = '/binh-luan';
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function html(opts) {
    opts = opts || {};
    var href = opts.href || commentsHref(opts.target);
    var n = opts.count != null ? Number(opts.count) : null;
    var loading = n == null;
    if (loading) {
      return (
        '<div class="ifx-com-empty" data-ifx-comments-cta>' +
          '<p><strong>Bình luận</strong></p>' +
          '<p class="ifx-com-side-count" data-ifx-cta-count>…</p>' +
          '<a class="ix-btn ix-btn-outline" href="' + esc(href) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (n > 0) {
      return (
        '<div class="ifx-com-empty" data-ifx-comments-cta>' +
          '<p><strong>Bình luận</strong></p>' +
          '<p><span data-ifx-cta-count>' + n + '</span> bình luận</p>' +
          '<a class="ix-btn ix-btn-outline" href="' + esc(href) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    return (
      '<div class="ifx-com-empty" data-ifx-comments-cta>' +
        '<p>Chưa có bình luận</p>' +
        '<a class="ix-btn ix-btn-outline" href="' + esc(href) + '">Bình luận đầu tiên</a>' +
      '</div>'
    );
  }

  function fetchCount(target) {
    if (global.IfluxInteractionApi && IfluxInteractionApi.fetchSummary) {
      return IfluxInteractionApi.fetchSummary(target).then(function (c) {
        return Number(c && c.comments) || 0;
      });
    }
    var type = encodeURIComponent(String((target && target.type) || ''));
    var id = encodeURIComponent(String((target && target.id) || ''));
    var base = (global.IFLUX_API_BASE || global.__IFLUX_API_BASE__ || '/api').replace(/\/$/, '');
    return fetch(base + '/interaction/v1/summary?type=' + type + '&id=' + id, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    }).then(function (res) { return res.json(); }).then(function (body) {
      var d = body && body.data != null ? body.data : body;
      return Number(d && d.comments) || 0;
    }).catch(function () { return 0; });
  }

  function mount(root, target) {
    if (!root || !target) return;
    var slot = root.querySelector('[data-ifx-comments-cta]') || root;
    var href = commentsHref(target);
    slot.outerHTML = html({ target: target, href: href, count: null });
    var host = (root.querySelector && root.querySelector('[data-ifx-comments-cta]')) || null;
    if (!host && root.getAttribute && root.getAttribute('data-ifx-comments-cta') != null) host = root;
    fetchCount(target).then(function (n) {
      var el = root.querySelector('[data-ifx-comments-cta]');
      if (!el) return;
      el.outerHTML = html({ target: target, href: href, count: n });
    });
  }

  global.IfluxCommentsCta = {
    html: html,
    commentsHref: commentsHref,
    fetchCount: fetchCount,
    mount: mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
