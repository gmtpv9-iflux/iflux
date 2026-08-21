/* User profile — Timeline bài viết chuyên gia + bình luận CP + tab Theo dõi */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var _ctx = { userId: null, stockBase: '../stock/', communityBase: '../news/', readOnlyFollowing: false };

  function stockPageHref(ticker) {
    var c = global.IfluxSeoUrl
      ? IfluxSeoUrl.stockHref(ticker)
      : '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function userId() {
    if (_ctx.userId) return _ctx.userId;
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : 'usr_local';
  }

  function contextLabel(tags) {
    if (!tags) return 'Cổ phiếu';
    if (tags.story && tags.story.name) return 'Chủ đề · ' + tags.story.name;
    if (tags.family && tags.family.name) return 'Họ CP · ' + tags.family.name;
    if (tags.sector && tags.sector.name) return 'Ngành · ' + tags.sector.name;
    if (tags.tickers && tags.tickers[0]) return 'Cổ phiếu · ' + tags.tickers[0];
    return 'Thị trường';
  }

  function fmtTimelineDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  function isOwnTimeline() {
    return !_ctx.readOnlyFollowing;
  }

  function sessionUser() {
    return global.IfluxAuth && IfluxAuth.getUser();
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      var bare = String(src || '').split('?')[0];
      if (document.querySelector('script[data-ifx-lazy-src="' + src + '"]')) {
        resolve();
        return;
      }
      var existing = document.querySelector('script[src="' + src + '"],script[src^="' + bare + '?"]');
      if (existing) {
        resolve();
        return;
      }
      var el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.setAttribute('data-ifx-lazy-src', src);
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error('lazy fail ' + src)); };
      document.head.appendChild(el);
    });
  }

  /** Slice 4.5: không lazy stock-comments-ui — LS key đã retire */
  function renderRecentPosts() {
    var wrap = document.getElementById('ifx-profile-posts');
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="ifx-profile-empty"><i class="ti ti-message-off"></i>' +
      '<p>Bạn chưa có bình luận nào.</p>' +
      '<p>Hãy tham gia thảo luận trên trang bình luận.</p>' +
      (_ctx.readOnlyFollowing
        ? ''
        : '<a href="' + esc(stockPageHref('HPG')) + '" class="ix-btn ix-btn-outline ix-btn-sm">Mở cổ phiếu</a>') +
      '</div>';
  }

  function renderTimeline() {
    var wrap = document.getElementById('ifx-profile-timeline');
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="ifx-profile-empty"><i class="ti ti-message-off"></i>' +
      '<p>Bạn chưa có bình luận nào.</p>' +
      '<p>Hãy tham gia thảo luận.</p>' +
      (_ctx.readOnlyFollowing
        ? ''
        : '<a href="' + esc(stockPageHref('HPG')) + '" class="ix-btn ix-btn-outline ix-btn-sm">Viết bình luận đầu tiên</a>') +
      '</div>';
  }

  function renderFollowing() {
    var wrap = document.getElementById('ifx-profile-following');
    if (!wrap || !global.IfluxProfileFollowStore) return;

    var list = IfluxProfileFollowStore.listFollowing(userId());
    if (!list.length) {
      wrap.innerHTML = '<div class="ifx-profile-empty"><i class="ti ti-users-minus"></i><p>' +
        (_ctx.readOnlyFollowing ? 'User chưa theo dõi ai.' : 'Bạn chưa theo dõi ai.') + '</p></div>';
      return;
    }

    wrap.innerHTML = '<div class="ifx-follow-grid">' + list.map(function (u) {
      var unfollowBtn = _ctx.readOnlyFollowing ? '' :
        '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-unfollow="' + esc(u.id) + '">Bỏ theo dõi</button>';
      var profileBase = _ctx.profileBase || '../account/';
      var nameHtml = global.IfluxProfileLinks
        ? IfluxProfileLinks.nameLink(u.id, u.display_name, 'ifx-follow-card__name', { base: profileBase })
        : esc(u.display_name);
      var avatarHtml = global.IfluxProfileLinks
        ? IfluxProfileLinks.avatarLink(u.id, u.initials || 'U', 'ix-avatar-sm ix-avatar-accent ifx-profile-link-avatar', { base: profileBase })
        : '<div class="ix-avatar-sm ix-avatar-accent">' + esc(u.initials || 'U') + '</div>';
      return '<div class="ifx-follow-card">' +
        avatarHtml +
        '<div class="ifx-follow-card__main">' +
          '<div class="ifx-follow-card__name">' + nameHtml + '</div>' +
          '<div class="ifx-follow-card__sub">' + esc(u.username || '') + ' · ' + esc(u.role || 'Thành viên') + '</div>' +
          '<div class="ifx-follow-card__sub">' + Number(u.followers || 0).toLocaleString('vi-VN') + ' người theo dõi</div>' +
        '</div>' +
        unfollowBtn +
      '</div>';
    }).join('') + '</div>';

    wrap.querySelectorAll('[data-ifx-unfollow]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        IfluxProfileFollowStore.unfollow(userId(), btn.getAttribute('data-ifx-unfollow'));
        renderFollowing();
        syncFollowingCount();
      });
    });
  }

  function syncFollowingCount() {
    if (!global.IfluxProfileFollowStore) return;
    var n = IfluxProfileFollowStore.countFollowing(userId());
    document.querySelectorAll('[data-bind="following"]').forEach(function (el) {
      el.textContent = String(n);
    });
  }

  function init(opts) {
    opts = opts || {};
    _ctx.userId = opts.userId || null;
    _ctx.stockBase = opts.stockBase || '../stock/';
    _ctx.communityBase = opts.communityBase || '../news/';
    _ctx.readOnlyFollowing = !!opts.readOnlyFollowing;
    _ctx.profileBase = opts.profileBase || '../account/';
    syncFollowingCount();
    if (!opts.skipTimeline) {
      renderRecentPosts();
      renderTimeline();
    }
    if (!opts.skipFollowing) renderFollowing();

    document.addEventListener('iflux-news-change', function () {
      renderRecentPosts();
    });

    document.querySelectorAll('[data-ix-profile-tab="tab-timeline"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTimeout(function () {
          renderRecentPosts();
          renderTimeline();
        }, 0);
      });
    });
    document.querySelectorAll('[data-ix-profile-tab="tab-following"]').forEach(function (btn) {
      btn.addEventListener('click', function () { setTimeout(renderFollowing, 0); });
    });
  }

  global.IfluxProfilePage = {
    init: init,
    renderRecentPosts: renderRecentPosts,
    renderTimeline: renderTimeline,
    renderFollowing: renderFollowing
  };
})(window);
