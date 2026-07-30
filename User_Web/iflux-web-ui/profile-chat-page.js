/* Tab Tin nhắn — giao diện Admin Chat pattern */
(function (global) {
  'use strict';

  var _activePeerId = null;

  function isMobileChat() {
    return global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell
      ? global.IfluxBreakpoint.isMobileShell()
      : false;
  }

  function updateUrlPeer(peerId) {
    try {
      var url = new URL(location.href);
      var tab = url.searchParams.get('tab');
      if (tab && tab !== 'messages') return;
      if (peerId) url.searchParams.set('with', peerId);
      else {
        url.searchParams.delete('with');
        url.searchParams.delete('peer');
      }
      if (!tab) url.searchParams.set('tab', 'messages');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* ignore */ }
  }

  function syncMobileView(mode) {
    var layout = document.getElementById('ifx-profile-chat');
    var backBtn = document.querySelector('[data-ifx-chat-back]');
    if (!layout) return;

    layout.classList.remove('ifx-chat-mobile-list', 'ifx-chat-mobile-detail', 'ifx-chat-profile-open');

    if (!isMobileChat()) {
      if (backBtn) backBtn.hidden = true;
      document.dispatchEvent(new CustomEvent('iflux-chat-mobile-view', { detail: { mode: 'desktop' } }));
      return;
    }

    if (mode === 'detail') {
      layout.classList.add('ifx-chat-mobile-detail');
      if (backBtn) backBtn.hidden = false;
      layoutMobileDetailHeader(true);
      document.dispatchEvent(new CustomEvent('iflux-chat-mobile-view', { detail: { mode: 'detail' } }));
    } else {
      layout.classList.add('ifx-chat-mobile-list');
      if (backBtn) backBtn.hidden = true;
      layoutMobileDetailHeader(false);
      document.dispatchEvent(new CustomEvent('iflux-chat-mobile-view', { detail: { mode: 'list' } }));
    }
  }

  function layoutMobileDetailHeader(detailMode) {
    var header = document.querySelector('#ifx-profile-chat .ix-chat-header');
    if (!header || !isMobileChat()) return;
    var row = header.firstElementChild;
    if (!row) return;
    row.style.display = detailMode ? 'grid' : '';
    row.style.gridTemplateColumns = detailMode ? 'auto 1fr auto' : '';
    row.style.alignItems = detailMode ? 'center' : '';
    row.style.gap = detailMode ? '8px' : '';
    row.style.width = detailMode ? '100%' : '';

    var nameWrap = row.querySelector('[data-ifx-chat-header-center]');
    if (detailMode && !nameWrap) {
      var avatarEl = document.getElementById('ifx-chat-active-avatar');
      var nameEl = document.getElementById('ifx-chat-active-name');
      var roleEl = document.getElementById('ifx-chat-active-role');
      if (nameEl && roleEl) {
        nameWrap = document.createElement('div');
        nameWrap.setAttribute('data-ifx-chat-header-center', '');
        nameWrap.style.textAlign = 'center';
        nameWrap.style.minWidth = '0';
        nameEl.parentNode.insertBefore(nameWrap, nameEl);
        nameWrap.appendChild(nameEl);
        nameWrap.appendChild(roleEl);
        nameEl.style.overflow = 'hidden';
        nameEl.style.textOverflow = 'ellipsis';
        nameEl.style.whiteSpace = 'nowrap';
      }
      if (avatarEl) {
        avatarEl.style.marginLeft = 'auto';
      }
    }
  }

  function ensureChatBackButton() {
    var header = document.querySelector('#ifx-profile-chat .ix-chat-header');
    if (!header || header.querySelector('[data-ifx-chat-back]')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ifx-chat-back-btn';
    btn.setAttribute('data-ifx-chat-back', '');
    btn.setAttribute('aria-label', 'Danh sách tin nhắn');
    btn.innerHTML = '<i class="ti ti-chevron-left"></i>';
    btn.hidden = true;

    var row = header.firstElementChild;
    if (row) row.insertBefore(btn, row.firstChild);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      showThreadList();
    });
  }

  function showThreadList() {
    _activePeerId = null;
    var layout = document.getElementById('ifx-profile-chat');
    if (layout) layout.classList.remove('ifx-chat-has-peer');

    syncMobileView('list');
    updateUrlPeer(null);
    renderThreadList();
    updateHeader(null);

    var msgsEl = document.getElementById('ifx-chat-messages');
    if (msgsEl) {
      msgsEl.innerHTML = '<div class="ifx-profile-empty" style="padding:40px 20px"><i class="ti ti-message"></i><p style="margin:0">Chọn cuộc trò chuyện</p></div>';
    }
    var input = document.getElementById('ifx-chat-input');
    if (input) input.value = '';
  }

  function syncFromUrl() {
    var params = new URLSearchParams(location.search);
    var peer = params.get('with') || params.get('peer');
    if (peer) openPeer(peer);
    else showThreadList();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function meId() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : null;
  }

  function meProfile() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    if (!u) return { id: '', display_name: 'Bạn', initials: 'BN' };
    return {
      id: u.id,
      display_name: u.display_name,
      initials: global.IfluxProfileAvatar
        ? IfluxProfileAvatar.initials(u.display_name)
        : 'BN',
      avatar_url: u.avatar_url || ''
    };
  }

  function fmtTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var now = new Date();
      var diff = now - d;
      if (diff < 60000) return 'Vừa xong';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' phút';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ';
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function fmtMsgTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function avatarHtml(profile, cls) {
    cls = cls || 'ix-avatar-sm ix-avatar-accent';
    if (profile.avatar_url) {
      return '<div class="' + esc(cls) + ' ifx-chat-avatar-img" style="flex-shrink:0;overflow:hidden;padding:0">' +
        '<img src="' + esc(profile.avatar_url) + '" alt="" style="width:100%;height:100%;object-fit:cover" /></div>';
    }
    return '<div class="' + esc(cls) + '" style="flex-shrink:0">' + esc(profile.initials || 'U') + '</div>';
  }

  function peerFromStore(peerId) {
    if (!peerId || !global.IfluxProfileUsersStore) return null;
    var p = IfluxProfileUsersStore.getPublic(peerId);
    if (!p) return null;
    p.initials = IfluxProfileUsersStore.initials(p.display_name);
    return p;
  }

  function matchQ(text, q) {
    return String(text || '').toLowerCase().indexOf(q) !== -1;
  }

  function threadItemHtml(peer, opts) {
    opts = opts || {};
    var active = _activePeerId === peer.id ? ' active' : '';
    var pinTitle = opts.pinned ? 'Bỏ ghim' : 'Ghim lên đầu';
    var pinBtn = opts.suggestion ? '' :
      '<button type="button" class="ix-btn ix-btn-icon ix-btn-sm" data-ifx-chat-pin="' + esc(peer.id) + '" title="' + pinTitle + '" style="flex-shrink:0">' +
        '<i class="ti ti-pin"' + (opts.pinned ? ' style="color:var(--ix-accent)"' : ' style="color:var(--ix-text-muted)"') + '></i></button>';
    var pinnedMark = opts.pinned
      ? ' <i class="ti ti-pin" style="font-size:11px;color:var(--ix-accent)" title="Đã ghim"></i>'
      : '';
    var right = opts.suggestion
      ? '<i class="ti ti-message-plus" style="color:var(--ix-text-muted);flex-shrink:0"></i>'
      : '<div class="ix-chat-item-time">' + esc(opts.time || '') + '</div>';
    return '<div class="ix-chat-item' + active + (opts.unread ? ' is-unread' : '') + '" data-ifx-chat-peer="' + esc(peer.id) + '">' +
      avatarHtml(peer, 'ix-avatar-sm ix-avatar-accent') +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px">' +
          '<div class="ix-chat-item-name" style="display:flex;align-items:center;gap:4px;min-width:0"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(peer.display_name) + '</span>' + pinnedMark + '</div>' +
          right +
        '</div>' +
        '<div class="ix-chat-item-preview" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(opts.preview || '') + '</div>' +
      '</div>' + pinBtn + '</div>';
  }

  function followingSuggestions(uid, q, existingIds) {
    if (!q || !global.IfluxProfileFollowStore) return [];
    var list = IfluxProfileFollowStore.listFollowing(uid) || [];
    return list.filter(function (u) {
      if (!u || !u.id || u.id === uid) return false;
      if (existingIds.indexOf(String(u.id)) !== -1) return false;
      return matchQ(u.display_name, q) || matchQ(u.username, q);
    });
  }

  function renderThreadList(query) {
    var listEl = document.getElementById('ifx-chat-thread-list');
    if (!listEl || !global.IfluxProfileChatStore) return;

    var uid = meId();
    if (!uid) return;
    IfluxProfileChatStore.seedIfEmpty(uid);
    var threads = IfluxProfileChatStore.listThreads(uid);
    var q = String(query || '').trim().toLowerCase();

    var shownThreads = threads;
    if (q) {
      shownThreads = threads.filter(function (t) {
        var p = t.peer || {};
        return matchQ(p.display_name, q) || matchQ(p.username, q);
      });
    }

    var html = '';

    if (shownThreads.length) {
      html += shownThreads.map(function (t) {
        var peer = t.peer || {};
        var last = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
        return threadItemHtml(peer, {
          pinned: !!t.pinned,
          time: fmtTime(t.updated_at),
          preview: last ? last.text : 'Bắt đầu trò chuyện',
          unread: IfluxProfileChatStore.isThreadUnread ? IfluxProfileChatStore.isThreadUnread(uid, t) : false
        });
      }).join('');
    }

    if (q) {
      var existingIds = threads.map(function (t) { return String((t.peer || {}).id); });
      var sugg = followingSuggestions(uid, q, existingIds);
      if (sugg.length) {
        html += '<div style="padding:10px 16px 4px;font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--ix-text-muted)">Người bạn theo dõi</div>';
        html += sugg.map(function (u) {
          var peer = {
            id: u.id,
            display_name: u.display_name,
            username: u.username,
            role: u.role || 'Thành viên',
            initials: u.initials || (global.IfluxProfileUsersStore ? IfluxProfileUsersStore.initials(u.display_name) : 'U')
          };
          return threadItemHtml(peer, { suggestion: true, preview: u.username || 'Nhắn tin' });
        }).join('');
      }
    }

    if (!html) {
      html = q
        ? '<div class="ifx-profile-empty" style="padding:24px 16px"><i class="ti ti-search-off"></i><p class="ifx-body-s" style="margin:0">Không tìm thấy cuộc trò chuyện hay người bạn theo dõi.</p></div>'
        : '<div class="ifx-profile-empty" style="padding:24px 16px"><i class="ti ti-message-off"></i><p class="ifx-body-s" style="margin:0">Chưa có cuộc trò chuyện. Dùng ô tìm kiếm để nhắn tin với người bạn theo dõi.</p></div>';
    }

    listEl.innerHTML = html;

    listEl.querySelectorAll('[data-ifx-chat-pin]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        IfluxProfileChatStore.togglePin(uid, btn.getAttribute('data-ifx-chat-pin'));
        renderThreadList(document.getElementById('ifx-chat-search') ? document.getElementById('ifx-chat-search').value : '');
      });
    });

    listEl.querySelectorAll('[data-ifx-chat-peer]').forEach(function (item) {
      item.addEventListener('click', function () {
        openPeer(item.getAttribute('data-ifx-chat-peer'));
      });
    });
  }

  function statusHtml(status) {
    var map = {
      sending: { icon: 'ti-clock', label: 'Đang gửi…', color: 'var(--ix-text-muted)' },
      failed: { icon: 'ti-alert-circle', label: 'Gửi lỗi', color: 'var(--ix-danger)' },
      sent: { icon: 'ti-check', label: 'Đã gửi', color: 'var(--ix-text-muted)' },
      seen: { icon: 'ti-checks', label: 'Đã xem', color: 'var(--ix-accent)' }
    };
    var s = map[status] || map.sent;
    var extra = status === 'failed'
      ? ' · <a href="#" data-ifx-msg-retry style="color:var(--ix-danger);text-decoration:underline">Thử lại</a>'
      : '';
    return '<div class="ix-chat-time" style="text-align:right;color:' + s.color + '">' +
      '<i class="ti ' + s.icon + '"></i> ' + s.label + extra + '</div>';
  }

  function renderMessages(peerId) {
    var msgsEl = document.getElementById('ifx-chat-messages');
    if (!msgsEl || !global.IfluxProfileChatStore) return;

    var uid = meId();
    var peer = peerFromStore(peerId);
    if (!uid || !peer) {
      msgsEl.innerHTML = '<div class="ifx-profile-empty" style="padding:40px 20px"><i class="ti ti-message"></i><p style="margin:0">Chọn cuộc trò chuyện bên trái</p></div>';
      return;
    }

    var me = meProfile();
    var rows = IfluxProfileChatStore.getMessages(uid, peerId);

    if (!rows.length) {
      msgsEl.innerHTML = '<div class="ifx-profile-empty" style="padding:40px 20px"><i class="ti ti-message-plus"></i><p style="margin:0">Gửi tin nhắn đầu tiên cho ' + esc(peer.display_name) + '</p></div>';
      return;
    }

    var lastSentIdx = -1;
    rows.forEach(function (m, i) { if (m.from === uid) lastSentIdx = i; });

    msgsEl.innerHTML = rows.map(function (m, i) {
      var sent = m.from === uid;
      var who = sent ? me : peer;
      var avatar = sent
        ? avatarHtml(who, 'ix-avatar')
        : '<span data-ifx-chat-peer-info="' + esc(peer.id) + '" style="cursor:pointer" title="Xem thông tin ' + esc(peer.display_name) + '">' + avatarHtml(who, 'ix-avatar-sm ix-avatar-accent') + '</span>';
      var meta = (sent && i === lastSentIdx)
        ? statusHtml(m.status)
        : '<div class="ix-chat-time"' + (sent ? ' style="text-align:right"' : '') + '>' + esc(fmtMsgTime(m.at)) + '</div>';
      return '<div class="ix-chat-msg' + (sent ? ' sent' : '') + '">' +
        avatar +
        '<div><div class="ix-chat-bubble">' + esc(m.text) + '</div>' + meta + '</div></div>';
    }).join('');

    msgsEl.scrollTop = msgsEl.scrollHeight;

    var retry = msgsEl.querySelector('[data-ifx-msg-retry]');
    if (retry) {
      retry.addEventListener('click', function (e) {
        e.preventDefault();
        var failed = null;
        rows.forEach(function (m) { if (m.from === uid && m.status === 'failed') failed = m; });
        if (failed) resendMessage(peerId, failed);
      });
    }

    msgsEl.querySelectorAll('[data-ifx-chat-peer-info]').forEach(function (el) {
      el.addEventListener('click', function () {
        showPeerInfo(el.getAttribute('data-ifx-chat-peer-info'));
      });
    });
  }

  function updateHeader(peerId) {
    var peer = peerFromStore(peerId);
    var nameEl = document.getElementById('ifx-chat-active-name');
    var roleEl = document.getElementById('ifx-chat-active-role');
    var avatarEl = document.getElementById('ifx-chat-active-avatar');

    if (!peer) {
      if (nameEl) nameEl.textContent = 'Tin nhắn';
      if (roleEl) roleEl.textContent = 'Chọn cuộc trò chuyện';
      if (avatarEl) { avatarEl.textContent = '—'; avatarEl.style.cursor = ''; avatarEl.removeAttribute('title'); }
      return;
    }

    if (nameEl) nameEl.textContent = peer.display_name;
    if (roleEl) roleEl.textContent = peer.role || peer.username || '';

    if (avatarEl) {
      if (global.IfluxProfileAvatar) IfluxProfileAvatar.renderInto(avatarEl, peer);
      else avatarEl.textContent = peer.initials || 'U';
      avatarEl.style.cursor = 'pointer';
      avatarEl.setAttribute('title', 'Xem thông tin ' + peer.display_name);
      if (!avatarEl._ifxInfoBound) {
        avatarEl._ifxInfoBound = true;
        avatarEl.addEventListener('click', function () {
          if (_activePeerId) showPeerInfo(_activePeerId);
        });
      }
    }
  }

  /* Panel thông tin user (bên phải) — mở khi bấm avatar trong khung chat */
  function hidePeerInfo() {
    var layout = document.getElementById('ifx-profile-chat');
    var panel = document.querySelector('#ifx-profile-chat .ix-chat-profile');
    if (layout) layout.classList.remove('ifx-chat-profile-open');
    if (panel) panel.style.display = 'none';
    if (isMobileChat()) {
      document.dispatchEvent(new CustomEvent('iflux-chat-mobile-view', {
        detail: { mode: _activePeerId ? 'detail' : 'list' }
      }));
    }
  }

  function showPeerInfo(peerId) {
    var layout = document.getElementById('ifx-profile-chat');
    var panel = document.querySelector('#ifx-profile-chat .ix-chat-profile');
    var peer = peerFromStore(peerId);
    if (!panel || !peer) return;

    var uid = meId();
    var stats = peer.stats || {};
    var following = global.IfluxProfileFollowStore && uid
      ? IfluxProfileFollowStore.isFollowing(uid, peerId) : false;
    var profileHref = global.IfluxProfileLinks
      ? IfluxProfileLinks.profileHref(peerId, { base: '../account/' })
      : ('../account/profile.html?user=' + encodeURIComponent(peerId));

    var avatar = peer.avatar_url
      ? '<div class="ix-avatar-sm ix-avatar-accent" style="width:64px;height:64px;overflow:hidden;padding:0"><img src="' + esc(peer.avatar_url) + '" alt="" style="width:100%;height:100%;object-fit:cover"></div>'
      : '<div class="ix-avatar-sm ix-avatar-accent" style="width:64px;height:64px;font-size:22px">' + esc(peer.initials || 'U') + '</div>';

    var statRow = function (val, label) {
      return '<div style="text-align:center"><div style="font-size:16px;font-weight:700;color:var(--ix-text-primary)">' +
        esc(val != null ? val : 0) + '</div><div style="font-size:11px;color:var(--ix-text-muted)">' + esc(label) + '</div></div>';
    };

    panel.style.display = 'flex';
    if (layout && isMobileChat()) {
      layout.classList.add('ifx-chat-profile-open');
      document.dispatchEvent(new CustomEvent('iflux-chat-mobile-view', { detail: { mode: 'profile' } }));
    }
    panel.innerHTML =
      '<div style="display:flex;justify-content:flex-end">' +
        '<button type="button" class="ix-btn ix-btn-icon ix-btn-sm" data-ifx-peer-info-close title="Đóng"><i class="ti ti-x"></i></button>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px">' +
        avatar +
        '<div style="font-size:15px;font-weight:600;color:var(--ix-text-primary)">' + esc(peer.display_name) + '</div>' +
        (peer.username ? '<div style="font-size:12px;color:var(--ix-text-muted)">' + esc(peer.username) + '</div>' : '') +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">' +
          (peer.tier_label ? '<span class="ix-chip ix-chip-primary" style="font-size:11px">' + esc(peer.tier_label) + '</span>' : '') +
          (peer.role ? '<span class="ix-chip ix-chip-outline" style="font-size:11px">' + esc(peer.role) + '</span>' : '') +
        '</div>' +
      '</div>' +
      (peer.bio ? '<div style="font-size:13px;line-height:1.5;color:var(--ix-text-secondary)">' + esc(peer.bio) + '</div>' : '') +
      '<div style="display:flex;justify-content:space-around;padding:12px 0;border-top:1px solid var(--ix-border);border-bottom:1px solid var(--ix-border)">' +
        statRow(stats.posts, 'Bài viết') + statRow(stats.followers, 'Theo dõi') + statRow(stats.following, 'Đang theo') +
      '</div>' +
      (following ? '<div style="font-size:12px;color:var(--ix-success);text-align:center"><i class="ti ti-user-check"></i> Bạn đang theo dõi</div>' : '') +
      '<a href="' + esc(profileHref) + '" class="ix-btn ix-btn-outline ix-btn-sm" style="justify-content:center"><i class="ti ti-user"></i> Xem hồ sơ đầy đủ</a>';

    var closeBtn = panel.querySelector('[data-ifx-peer-info-close]');
    if (closeBtn) closeBtn.addEventListener('click', hidePeerInfo);
  }

  function openPeer(peerId) {
    if (!peerId || !global.IfluxProfileChatStore) return;
    var uid = meId();
    var peer = peerFromStore(peerId);
    if (!uid || !peer) return;

    if (global.IfluxProfileBlockStore && IfluxProfileBlockStore.isBlocked(uid, peerId)) {
      if (global.ixToast) ixToast('Bạn đã chặn người dùng này', 'warning');
      return;
    }

    var gate = canMessage(uid, peerId);
    if (!gate.ok) {
      if (global.ixToast) ixToast(gate.message, 'warning');
      return;
    }

    IfluxProfileChatStore.ensureThread(uid, peer);
    IfluxProfileChatStore.markThreadRead(uid, peerId);
    _activePeerId = peerId;
    hidePeerInfo();
    var searchEl = document.getElementById('ifx-chat-search');
    renderThreadList(searchEl ? searchEl.value : '');
    updateHeader(peerId);
    renderMessages(peerId);
    updateUrlPeer(peerId);
    syncMobileView(isMobileChat() ? 'detail' : 'desktop');

    var layout = document.getElementById('ifx-profile-chat');
    if (layout) layout.classList.add('ifx-chat-has-peer');
    if (global.IfluxHeaderMessagesUI && IfluxHeaderMessagesUI.refresh) {
      IfluxHeaderMessagesUI.refresh();
    }
  }

  /* Được nhắn nếu theo dõi người đó, hoặc thỏa điều kiện chat access chung */
  function canMessage(uid, peerId) {
    if (uid && global.IfluxProfileFollowStore && IfluxProfileFollowStore.isFollowing(uid, peerId)) {
      return { ok: true };
    }
    if (global.IfluxProfileChatAccess) {
      return IfluxProfileChatAccess.evaluate(uid, peerId);
    }
    return { ok: true };
  }

  /* Mô phỏng vòng đời gửi: sending → sent → seen (peer đọc). Offline → failed. */
  function runSendLifecycle(uid, peerId, msgId) {
    if (!global.IfluxProfileChatStore) return;
    var store = IfluxProfileChatStore;
    setTimeout(function () {
      store.updateMessageStatus(uid, peerId, msgId, 'sent');
      if (_activePeerId === peerId) renderMessages(peerId);
      setTimeout(function () {
        store.markSentMessagesSeen(uid, peerId);
        if (_activePeerId === peerId) renderMessages(peerId);
      }, 1600);
    }, 550);
  }

  function deliverMessage(uid, peer, text) {
    var offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    var status = offline ? 'failed' : 'sending';
    var msg = IfluxProfileChatStore.sendMessage(uid, peer, text, status);
    var searchEl = document.getElementById('ifx-chat-search');
    renderThreadList(searchEl ? searchEl.value : '');
    renderMessages(peer.id);
    if (!offline && msg) runSendLifecycle(uid, peer.id, msg.id);
    return msg;
  }

  function resendMessage(peerId, msg) {
    var uid = meId();
    if (!uid || !msg || !global.IfluxProfileChatStore) return;
    var offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    if (offline) {
      if (global.ixToast) ixToast('Vẫn đang ngoại tuyến — chưa gửi được', 'warning');
      return;
    }
    IfluxProfileChatStore.updateMessageStatus(uid, peerId, msg.id, 'sending');
    renderMessages(peerId);
    runSendLifecycle(uid, peerId, msg.id);
  }

  function sendCurrent() {
    var input = document.getElementById('ifx-chat-input');
    if (!input || !_activePeerId || !global.IfluxProfileChatStore) return;
    var text = input.value.trim();
    if (!text) return;

    var uid = meId();
    var peer = peerFromStore(_activePeerId);
    if (!uid || !peer) return;

    var gate = canMessage(uid, peer.id);
    if (!gate.ok) {
      if (global.ixToast) ixToast(gate.message, 'warning');
      return;
    }

    deliverMessage(uid, peer, text);
    input.value = '';
    input.focus();
  }

  function bindSend() {
    var layout = document.getElementById('ifx-profile-chat');
    var input = document.getElementById('ifx-chat-input');
    if (!layout) return;

    layout.querySelectorAll('[data-ifx-chat-send]').forEach(function (btn) {
      btn.addEventListener('click', sendCurrent);
    });
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendCurrent();
      });
    }
  }

  function bindSearch() {
    var input = document.getElementById('ifx-chat-search');
    if (!input) return;
    if (input.getAttribute('placeholder')) {
      input.setAttribute('placeholder', 'Tìm cuộc trò chuyện hoặc người bạn theo dõi…');
    }
    input.addEventListener('input', function () {
      renderThreadList(input.value);
    });
  }

  function switchToTab(tabId) {
    var btn = document.querySelector('[data-ix-profile-tab="' + tabId + '"]');
    if (btn && !btn.hidden) btn.click();
  }

  function init(opts) {
    opts = opts || {};
    ensureChatBackButton();
    hidePeerInfo();
    renderThreadList();
    bindSend();
    bindSearch();

    if (opts.openPeerId) {
      openPeer(opts.openPeerId);
    } else if (isMobileChat()) {
      showThreadList();
    } else {
      var threads = global.IfluxProfileChatStore ? IfluxProfileChatStore.listThreads(meId()) : [];
      if (threads.length && threads[0].peer) openPeer(threads[0].peer.id);
    }

    if (!global._ifxChatResizeBound) {
      global._ifxChatResizeBound = true;
      global.addEventListener('resize', function () {
        if (!_activePeerId) syncMobileView(isMobileChat() ? 'list' : 'desktop');
        else syncMobileView(isMobileChat() ? 'detail' : 'desktop');
      });
    }
  }

  global.IfluxProfileChatPage = {
    init: init,
    openPeer: openPeer,
    showThreadList: showThreadList,
    hidePeerInfo: hidePeerInfo,
    syncFromUrl: syncFromUrl,
    switchToTab: switchToTab,
    renderThreadList: renderThreadList
  };
})(window);
