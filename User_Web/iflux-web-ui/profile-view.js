/* profile.html — chế độ xem hồ sơ user khác (?user=) + quyền riêng tư */
(function (global) {
  'use strict';

  var HIDE_TAB_IDS = ['tab-following', 'tab-activity', 'tab-messages', 'tab-affiliate', 'tab-account'];
  function pageDef() { return global.IfluxPageDefinition; }

  function queryUserId() {
    try {
      return (new URLSearchParams(location.search).get('user') ||
        new URLSearchParams(location.search).get('id') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function isOwnProfile(targetId) {
    var me = global.IfluxAuth && IfluxAuth.getUser();
    return !targetId || (me && me.id === targetId);
  }

  function setText(sel, text) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = text == null ? '—' : String(text);
    });
  }

  function showNotFound() {
    var grid = document.querySelector('.ix-profile-grid');
    if (grid) grid.hidden = true;
    var main = document.querySelector('.ifx-main');
    if (!main) return;
    var box = document.getElementById('ifx-profile-not-found');
    if (box) { box.hidden = false; return; }
    box = document.createElement('div');
    box.id = 'ifx-profile-not-found';
    box.className = 'ix-card';
    box.innerHTML = '<div class="ix-card-body" style="text-align:center;padding:48px 24px">' +
      '<i class="ti ti-user-off" class="ifx-display-s" style="color:var(--ix-text-muted);margin-bottom:12px"></i>' +
      '<p style="color:var(--ix-text-secondary);margin:0 0 16px">Không tìm thấy hồ sơ người dùng.</p>' +
      '<a href="profile.html" class="ix-btn ix-btn-outline ix-btn-sm">Về hồ sơ của tôi</a></div>';
    main.appendChild(box);
  }

  /** Gỡ khỏi DOM — không chỉ ẩn (tránh mở modal/chỉnh sửa qua DevTools) */
  function removeOwnOnlyNodes() {
    document.querySelectorAll('[data-ifx-own-only]').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  /** Theo dõi / nhắn tin / chặn — chỉ khi xem hồ sơ người khác */
  function removePublicOnlyNodes() {
    document.querySelectorAll('[data-ifx-public-only]').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function bindPublicSidebar(profile) {
    setText('[data-bind="display_name"]', profile.display_name);
    setText('[data-bind="username"]', profile.username || '—');
    setText('[data-bind="tier_label"]', profile.tier_label || 'Thành viên');
    setText('[data-bind="role"]', profile.role || 'Thành viên');
    setText('[data-bind="bio"]', profile.bio || '—');
    setText('[data-bind="joined_at"]', profile.joined_at || '—');
    setText('[data-bind="country"]', profile.country || '—');

    var stats = profile.stats || {};
    setText('[data-bind="posts"]', stats.posts != null ? stats.posts : 0);
    setText('[data-bind="followers"]', stats.followers != null ? stats.followers : 0);
    setText('[data-bind="following"]', stats.following != null ? stats.following : 0);

    if (global.IfluxProfileFollowStore) {
      setText('[data-bind="following"]', IfluxProfileFollowStore.countFollowing(profile.id));
    }

    if (global.IfluxProfileAvatar) IfluxProfileAvatar.initPublic(profile);
  }

  function bindPublicActions(profile) {
    var me = global.IfluxAuth && IfluxAuth.getUser();
    if (me && me.id === profile.id) {
      removePublicOnlyNodes();
      return;
    }
    bindFollowButton(profile);
    bindFriendButton(profile);
    bindMessageButton(profile);
    bindBlockButton(profile);
  }

  function bindFriendButton(profile) {
    var btn = document.getElementById('btn-friend-user');
    if (!btn || !global.IfluxProfileFriendStore || !global.IfluxAuth) return;

    var me = IfluxAuth.getUser();
    if (!me || !me.id || me.id === profile.id) {
      btn.hidden = true;
      return;
    }

    function refresh() {
      if (global.IfluxProfileBlockStore && IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ti ti-user-off"></i> Đã chặn';
        return;
      }
      var st = IfluxProfileFriendStore.status(me.id, profile.id);
      btn.disabled = false;
      if (st === 'friends') {
        btn.innerHTML = '<i class="ti ti-user-check"></i> Bạn bè';
        btn.className = 'ix-btn ix-btn-sm ix-btn-outline';
      } else if (st === 'outgoing') {
        btn.innerHTML = '<i class="ti ti-clock"></i> Đã gửi kết bạn';
        btn.className = 'ix-btn ix-btn-sm ix-btn-outline';
      } else if (st === 'incoming') {
        btn.innerHTML = '<i class="ti ti-user-plus"></i> Chấp nhận kết bạn';
        btn.className = 'ix-btn ix-btn-sm ix-btn-primary';
      } else {
        btn.innerHTML = '<i class="ti ti-user-plus"></i> Kết bạn';
        btn.className = 'ix-btn ix-btn-sm ix-btn-outline';
      }
      refreshMessageButton(profile);
    }

    if (!btn.dataset.ifxBound) {
      btn.dataset.ifxBound = '1';
      btn.addEventListener('click', function () {
        if (global.IfluxProfileBlockStore && IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
          if (global.ixToast) ixToast('Bạn đã chặn người dùng này', 'warning');
          return;
        }
        var st = IfluxProfileFriendStore.status(me.id, profile.id);
        if (st === 'friends') {
          IfluxProfileFriendStore.unfriend(me.id, profile.id);
          if (global.ixToast) ixToast('Đã hủy kết bạn', 'info');
        } else if (st === 'outgoing') {
          IfluxProfileFriendStore.cancel(me.id, profile.id);
          if (global.ixToast) ixToast('Đã hủy lời mời kết bạn', 'info');
        } else if (st === 'incoming') {
          IfluxProfileFriendStore.accept(me.id, profile.id);
          if (global.ixToast) ixToast('Đã trở thành bạn bè', 'success');
        } else {
          var res = IfluxProfileFriendStore.request(me, profile);
          if (res.status === 'friends') {
            if (global.ixToast) ixToast('Đã trở thành bạn bè', 'success');
          } else if (global.ixToast) {
            ixToast('Đã gửi lời mời kết bạn', 'success');
          }
        }
        refresh();
      });
    }
    refresh();
  }

  function refreshMessageButton(profile) {
    var btn = document.getElementById('btn-message-user');
    if (!btn || !global.IfluxAuth) return;
    var me = IfluxAuth.getUser();
    if (!me || !me.id) return;

    if (global.IfluxProfileBlockStore && IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
      btn.disabled = true;
      btn.title = 'Bạn đã chặn người dùng này';
      return;
    }

    if (global.IfluxProfileChatAccess) {
      var gate = IfluxProfileChatAccess.evaluate(me.id, profile.id);
      btn.disabled = !gate.ok;
      btn.title = gate.ok ? 'Nhắn tin' : (gate.message || '');
      return;
    }
    btn.disabled = false;
    btn.title = 'Nhắn tin';
  }

  function bindFollowButton(profile) {
    var btn = document.getElementById('btn-follow-user');
    if (!btn || !global.IfluxProfileFollowStore || !global.IfluxAuth) return;

    var me = IfluxAuth.getUser();
    if (!me || !me.id || me.id === profile.id) {
      btn.hidden = true;
      return;
    }

    var followingState = false;

    function paint() {
      if (global.IfluxProfileBlockStore && IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
        btn.disabled = true;
        btn.textContent = 'Đã chặn';
        btn.className = 'ix-btn ix-btn-sm ix-btn-outline';
        return;
      }
      btn.textContent = followingState ? 'Đang theo dõi' : 'Theo dõi';
      btn.className = 'ix-btn ix-btn-sm ' + (followingState ? 'ix-btn-outline' : 'ix-btn-primary');
      btn.disabled = false;
      refreshMessageButton(profile);
    }

    if (IfluxProfileFollowStore.existAsync) {
      IfluxProfileFollowStore.existAsync(profile.id).then(function (f) {
        followingState = !!f;
        paint();
      }).catch(function () { paint(); });
    } else {
      followingState = !!IfluxProfileFollowStore.isFollowing(me.id, profile.id);
      paint();
    }

    if (IfluxProfileFollowStore.countsAsync) {
      IfluxProfileFollowStore.countsAsync(profile.id).then(function (c) {
        if (c && c.following != null) setText('[data-bind="following"]', c.following);
        if (c && c.followers != null) setText('[data-bind="followers"]', c.followers);
      }).catch(function () { /* ignore */ });
    }

    if (!btn.dataset.ifxBound) {
      btn.dataset.ifxBound = '1';
      btn.addEventListener('click', function () {
        btn.disabled = true;
        var op = followingState
          ? IfluxProfileFollowStore.unfollow(me.id, profile.id)
          : IfluxProfileFollowStore.follow(me.id, profile);
        Promise.resolve(op).then(function () {
          followingState = !followingState;
          if (global.ixToast) {
            ixToast(followingState ? ('Đã theo dõi ' + profile.display_name) : 'Đã bỏ theo dõi', followingState ? 'success' : 'info');
          }
          paint();
        }).catch(function (err) {
          if (global.ixToast) ixToast((err && err.message) || 'Không thể cập nhật theo dõi', 'danger');
          paint();
        });
      });
    }
  }

  function bindMessageButton(profile) {
    var btn = document.getElementById('btn-message-user');
    if (!btn || !global.IfluxAuth) return;

    var me = IfluxAuth.getUser();
    if (!me || !me.id || me.id === profile.id) {
      btn.hidden = true;
      return;
    }

    refreshMessageButton(profile);

    if (!btn.dataset.ifxBound) {
      btn.dataset.ifxBound = '1';
      btn.addEventListener('click', function () {
        if (global.IfluxProfileBlockStore && IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
          if (global.ixToast) ixToast('Bạn đã chặn người dùng này', 'warning');
          return;
        }
        if (global.IfluxProfileChatAccess) {
          var gate = IfluxProfileChatAccess.evaluate(me.id, profile.id);
          if (!gate.ok) {
            if (global.ixToast) ixToast(gate.message, 'warning');
            return;
          }
        }
        if (global.IfluxProfileChatStore) {
          IfluxProfileChatStore.ensureThread(me.id, profile);
        }
        var msgPath = '/tin-nhan?with=' + encodeURIComponent(profile.id);
        /* P6-API-01 — internal nav chỉ Writer.navigate */
        if (global.IfluxShellUrlWriter && global.IfluxShellUrlWriter.navigate) {
          global.IfluxShellUrlWriter.navigate(msgPath);
        } else {
          global.location.href = msgPath;
        }
      });
    }
  }

  function bindBlockButton(profile) {
    var btn = document.getElementById('btn-block-user');
    if (!btn || !global.IfluxAuth || !global.IfluxProfileBlockStore) return;

    var me = IfluxAuth.getUser();
    if (!me || !me.id || me.id === profile.id) {
      btn.hidden = true;
      return;
    }

    function refresh() {
      var blocked = IfluxProfileBlockStore.isBlocked(me.id, profile.id);
      btn.innerHTML = blocked
        ? '<i class="ti ti-ban"></i> Bỏ chặn'
        : '<i class="ti ti-ban"></i> Chặn';
      btn.className = 'ix-btn ix-btn-outline ix-btn-sm ifx-btn-block' + (blocked ? ' ifx-btn-block--active' : '');
    }

    refresh();
    btn.addEventListener('click', function () {
      if (IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
        IfluxProfileBlockStore.unblock(me.id, profile.id);
        if (global.ixToast) ixToast('Đã bỏ chặn ' + profile.display_name, 'info');
      } else {
        IfluxProfileBlockStore.block(me.id, profile.id);
        if (global.IfluxProfileFollowStore && IfluxProfileFollowStore.isFollowing(me.id, profile.id)) {
          IfluxProfileFollowStore.unfollow(me.id, profile.id);
        }
        if (global.ixToast) ixToast('Đã chặn ' + profile.display_name, 'warning');
      }
      refresh();
      var followBtn = document.getElementById('btn-follow-user');
      if (followBtn && followBtn.dataset.ifxBound) {
        var following = IfluxProfileFollowStore && IfluxProfileFollowStore.isFollowing(me.id, profile.id);
        if (IfluxProfileBlockStore.isBlocked(me.id, profile.id)) {
          followBtn.disabled = true;
          followBtn.textContent = 'Đã chặn';
        } else {
          followBtn.disabled = false;
          followBtn.textContent = following ? 'Đang theo dõi' : 'Theo dõi';
          followBtn.className = 'ix-btn ix-btn-sm ' + (following ? 'ix-btn-outline' : 'ix-btn-primary');
        }
      }
      var msgBtn = document.getElementById('btn-message-user');
      if (msgBtn) refreshMessageButton(profile);
      var friendBtn = document.getElementById('btn-friend-user');
      if (friendBtn && friendBtn.dataset.ifxBound) {
        friendBtn.dispatchEvent(new Event('ifx-refresh'));
      }
      bindFriendButton(profile);
    });
  }

  function clearTabActive() {
    document.querySelectorAll('.ix-profile-tab').forEach(function (el) { el.classList.remove('active'); });
    document.querySelectorAll('.ix-tab-content').forEach(function (el) { el.classList.remove('active'); });
  }

  function applyPublicPrivacy(userId) {
    var settings = global.IfluxProfilePrivacyStore
      ? IfluxProfilePrivacyStore.get(userId)
      : { show_timeline: false, show_following_list: false };
    var DOM_MAP = global.IfluxProfilePrivacyStore ? IfluxProfilePrivacyStore.DOM_MAP : {};

    document.querySelectorAll('[data-ifx-privacy]').forEach(function (el) {
      var domKey = el.getAttribute('data-ifx-privacy');
      var fieldKey = DOM_MAP[domKey];
      if (fieldKey) el.hidden = !settings[fieldKey];
    });

    var emptyPanel = document.getElementById('ifx-profile-public-empty');
    clearTabActive();
    if (emptyPanel) {
      emptyPanel.hidden = false;
      emptyPanel.classList.add('active');
    }

    return { settings: settings, showTimeline: false, showFollowing: false };
  }

  function initPublicView(targetId) {
    if (isOwnProfile(targetId)) {
      removePublicOnlyNodes();
      return 'own';
    }

    var profile = global.IfluxProfileUsersStore && IfluxProfileUsersStore.getPublic(targetId);
    if (!profile || profile.id !== targetId) {
      showNotFound();
      return 'missing';
    }

    if (pageDef() && pageDef().applyPatch) {
      pageDef().applyPatch({ documentTitle: profile.display_name + ' · iFlux' });
    }

    var title = document.getElementById('ifx-profile-title');
    if (title) title.textContent = 'Hồ sơ · ' + profile.display_name;

    var crumb = document.getElementById('ifx-profile-crumb');
    if (crumb) crumb.textContent = profile.display_name;

    removeOwnOnlyNodes();
    document.querySelectorAll('[data-ifx-public-only]').forEach(function (el) { el.hidden = false; });

    HIDE_TAB_IDS.forEach(function (tabId) {
      document.querySelectorAll('[data-ix-profile-tab="' + tabId + '"]').forEach(function (el) { el.hidden = true; });
      var panel = document.getElementById(tabId);
      if (panel) {
        panel.classList.remove('active');
        if (tabId !== 'tab-following') panel.hidden = true;
      }
    });

    bindPublicSidebar(profile);
    var privacy = applyPublicPrivacy(targetId);
    bindPublicActions(profile);

    if (global.PatternUserProfile) PatternUserProfile.init();
    if (global.IfluxProfilePage) {
      IfluxProfilePage.init({
        userId: profile.id,
        stockBase: '../stock/',
        readOnlyFollowing: true,
        profileBase: '../account/',
        skipTimeline: !privacy.showTimeline,
        skipFollowing: !privacy.showFollowing
      });
    }

    return 'public';
  }

  function init() {
    var targetId = queryUserId();
    if (isOwnProfile(targetId)) {
      removePublicOnlyNodes();
      return 'own';
    }
    return initPublicView(targetId);
  }

  global.IfluxProfileView = {
    init: init,
    queryUserId: queryUserId,
    isOwnProfile: isOwnProfile,
    applyPublicPrivacy: applyPublicPrivacy,
    removePublicOnlyNodes: removePublicOnlyNodes
  };
})(window);
