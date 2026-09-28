/* Tin nhắn header — panel giống chuông thông báo */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function meId() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : null;
  }

  function fmtTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var diff = Date.now() - d.getTime();
      if (diff < 60000) return 'Vừa xong';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' phút';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ';
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function homeMessagesUrl(peerId) {
    var url = (global.IfluxRoutes && IfluxRoutes.to)
      ? IfluxRoutes.to('messages', { canonical: true })
      : '/tin-nhan';
    if (peerId) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'with=' + encodeURIComponent(peerId);
    return url;
  }

  function unreadCount(uid) {
    if (!uid || !global.IfluxProfileChatStore) return 0;
    if (IfluxProfileChatStore.unreadCount) return IfluxProfileChatStore.unreadCount(uid);
    var threads = IfluxProfileChatStore.listThreads(uid);
    return threads.filter(function (t) {
      return IfluxProfileChatStore.isThreadUnread
        ? IfluxProfileChatStore.isThreadUnread(uid, t)
        : false;
    }).length;
  }

  function renderPanel(container) {
    if (!container) return;
    var uid = meId();
    if (!uid || !global.IfluxAuth || !IfluxAuth.isLoggedIn()) {
      container.innerHTML = '<div class="ifx-app-header-notif-empty">Đăng nhập để xem tin nhắn</div>';
      return;
    }

    if (!global.IfluxProfileChatStore) {
      container.innerHTML = '<div class="ifx-app-header-notif-empty">Đang tải tin nhắn…</div>';
      return;
    }

    IfluxProfileChatStore.seedIfEmpty(uid);
    var threads = IfluxProfileChatStore.listThreads(uid);
    if (!threads.length) {
      container.innerHTML =
        '<div class="ifx-app-header-notif-empty">Chưa có tin nhắn</div>' +
        '<a class="ifx-app-header-msg-all" href="' + esc(homeMessagesUrl()) + '">Mở tin nhắn</a>';
      bindPanelLinks(container.closest('[data-ifx-messages-dropdown]'));
      return;
    }

    container.innerHTML =
      threads.slice(0, 5).map(function (t) {
        var peer = t.peer || {};
        var last = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
        var preview = last ? last.text : 'Bắt đầu trò chuyện';
        var unread = IfluxProfileChatStore.isThreadUnread
          ? IfluxProfileChatStore.isThreadUnread(uid, t)
          : false;
        return '<a href="' + esc(homeMessagesUrl(peer.id)) + '" class="ifx-app-header-msg-item' + (unread ? ' is-unread' : '') + '">' +
          '<span class="ifx-hdr-msg-item__avatar">' + esc(peer.initials || 'U') + '</span>' +
          '<span class="ifx-app-header-msg-item-body">' +
            '<span class="ifx-app-header-msg-item-name">' + esc(peer.display_name || 'Thành viên') + '</span>' +
            '<span class="ifx-app-header-msg-item-preview">' + esc(preview) + '</span>' +
          '</span>' +
          '<span class="ifx-app-header-msg-item-time">' + esc(fmtTime(t.updated_at)) + '</span>' +
        '</a>';
      }).join('') +
      '<a class="ifx-app-header-msg-all" href="' + esc(homeMessagesUrl()) + '">Xem tất cả</a>';

    renderBadge();
    bindPanelLinks(container.closest('[data-ifx-messages-dropdown]'));
  }

  function isMobileBar() {
    return global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell
      ? global.IfluxBreakpoint.isMobileShell()
      : false;
  }

  function bindPanelLinks(scope) {
    if (!scope || scope._ifxHdrMsgLinksBound) return;
    scope._ifxHdrMsgLinksBound = true;
    scope.addEventListener('click', function (e) {
      var link = e.target.closest('.ifx-app-header-msg-item, .ifx-app-header-msg-all');
      if (!link) return;
      if (isMobileBar() && global.IfluxWebUI && IfluxWebUI.closeMobileMessages) {
        IfluxWebUI.closeMobileMessages();
      }
    });
  }

  function renderBadge() {
    var uid = meId();
    var badge = document.querySelector('[data-ifx-messages-badge]');
    if (!badge) return;
    var n = unreadCount(uid);
    if (n > 0) {
      badge.textContent = n > 9 ? '9+' : String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function findMessagesDropdown(wrap, header) {
    if (!wrap) return null;
    var dropdown = wrap.querySelector('[data-ifx-messages-dropdown]');
    if (dropdown) return dropdown;
    header = header || wrap.closest('.ifx-app-header');
    if (header) return header.querySelector('[data-ifx-messages-dropdown]');
    return null;
  }

  function purgeForeignMsgChrome(dropdown) {
    if (!dropdown || !dropdown.hasAttribute('data-ifx-messages-dropdown')) return;
    dropdown.querySelectorAll('.ifx-app-header-notif-head').forEach(function (head) {
      if (head.querySelector('.ti-bell')) head.remove();
    });
    dropdown.querySelectorAll('[data-ifx-user-notif-panel], .ifx-app-header-notif-foot, .ifx-app-header-notif-item, .ifx-app-header-notif-group, .ifx-app-header-notif-mark-all').forEach(function (el) {
      el.remove();
    });
  }

  function ensureMessagesPanel(header) {
    header = header || document.querySelector('.ifx-app-header');
    var wrap = header ? header.querySelector('.ifx-app-header-messages') : document.querySelector('.ifx-app-header-messages');
    if (!wrap) return null;
    var dropdown = findMessagesDropdown(wrap, header);
    if (!dropdown || !dropdown.hasAttribute('data-ifx-messages-dropdown')) return null;

    purgeForeignMsgChrome(dropdown);

    if (!wrap.querySelector('[data-ifx-messages-badge]')) {
      var btn = wrap.querySelector('[data-ifx-messages-btn]');
      if (btn) {
        var bb = document.createElement('span');
        bb.className = 'ifx-app-header-badge';
        bb.setAttribute('data-ifx-messages-badge', '');
        bb.hidden = true;
        btn.appendChild(bb);
      }
    }

    if (!dropdown.querySelector('[data-ifx-messages-panel]')) {
      var head = document.createElement('div');
      head.className = 'ifx-app-header-notif-head';
      head.innerHTML = '<span><i class="ti ti-messages"></i> Tin nhắn</span>';
      var panel = document.createElement('div');
      panel.className = 'ifx-app-header-notif-panel ifx-app-header-msg-panel';
      panel.setAttribute('data-ifx-messages-panel', '');
      dropdown.appendChild(head);
      dropdown.appendChild(panel);
    }

    bindPanelLinks(dropdown);
    return dropdown.querySelector('[data-ifx-messages-panel]');
  }

  function bindMessagesMenu() {
    document.querySelectorAll('.ifx-app-header-messages').forEach(function (wrap) {
      if (wrap._ifxMsgBound) return;
      wrap._ifxMsgBound = true;

      var btn = wrap.querySelector('[data-ifx-messages-btn]');
      if (!btn) return;

      btn.removeAttribute('data-ifx-toggle');
      var closeTimer = null;

      function openPanel() {
        renderPanel(ensureMessagesPanel());
      }

      function cancelClose() {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      }

      function scheduleClose() {
        cancelClose();
        closeTimer = setTimeout(function () {
          wrap.classList.remove('is-open');
          closeTimer = null;
        }, 260);
      }

      btn.addEventListener('click', function (e) {
        if (global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell && global.IfluxBreakpoint.isMobileShell()) return;
        e.preventDefault();
        e.stopPropagation();
        cancelClose();
        var isOpen = wrap.classList.contains('open');
        document.querySelectorAll('.ifx-dropdown.is-open').forEach(function (d) {
          d.classList.remove('is-open');
        });
        if (isOpen) {
          wrap.classList.remove('is-open');
          return;
        }
        wrap.classList.add('is-open');
        openPanel();
      });

      wrap.addEventListener('mouseenter', function () {
        if (global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell && global.IfluxBreakpoint.isMobileShell()) return;
        cancelClose();
        wrap.classList.add('is-open');
        openPanel();
      });
      wrap.addEventListener('mouseleave', function () {
        if (global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell && global.IfluxBreakpoint.isMobileShell()) return;
        scheduleClose();
      });
    });

    document.addEventListener('click', function (e) {
      if (global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell && global.IfluxBreakpoint.isMobileShell()) return;
      if (e.target.closest('.ifx-app-header-messages')) return;
      document.querySelectorAll('.ifx-app-header-messages.is-open').forEach(function (d) {
        d.classList.remove('is-open');
      });
    });
  }

  function mountMessages() {
    ensureMessagesPanel();
    bindMessagesMenu();
    renderBadge();
  }

  function renderMessagesPanel(header) {
    renderPanel(ensureMessagesPanel(header));
    renderBadge();
  }

  function refresh() {
    document.querySelectorAll('.ifx-app-header').forEach(function (hdr) {
      renderPanel(ensureMessagesPanel(hdr));
    });
    renderBadge();
  }

  function init() {
    if (!document.querySelector('.ifx-app')) return;
    mountMessages();
    if (!document._ifxMsgHydrateBound) {
      document._ifxMsgHydrateBound = true;
      document.addEventListener('iflux-user-data-hydrated', refresh);
      document.addEventListener('iflux-messages-change', refresh);
    }
  }

  global.IfluxHeaderMessagesUI = {
    init: init,
    mountMessages: mountMessages,
    renderMessagesPanel: renderMessagesPanel,
    refresh: refresh
  };
})(window);
