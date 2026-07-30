/* UI thông báo — chuông header + badge menu */
(function (global) {
  'use strict';

  var closeTimer = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      var mo = String(d.getMonth() + 1).padStart(2, '0');
      return hh + ':' + mm + ', ' + dd + '-' + mo + '-' + d.getFullYear();
    } catch (e) {
      return '';
    }
  }

  function renderNotifItem(n) {
    var unread = !n.read ? ' is-unread' : '';
    return '<a href="' + esc(n.href || '#') + '" class="ifx-user-notif-item' + unread + '" data-ifx-notif-id="' + esc(n.id) + '">' +
      '<span class="ifx-user-notif-item__icon" aria-hidden="true"><i class="ti ' + esc(n.icon || 'ti-bell') + '"></i></span>' +
      '<span class="ifx-user-notif-item__body">' +
        '<strong class="ifx-user-notif-item__title">' + esc(n.title) + '</strong>' +
        '<span class="ifx-user-notif-item__msg">' + esc(n.message) + '</span>' +
        '<time class="ifx-user-notif-item__time">' + esc(fmtTime(n.at)) + '</time>' +
      '</span></a>';
  }

  function currentUser() {
    return global.IfluxAuth && IfluxAuth.getUser();
  }

  function notifStore() {
    return global.IfluxInAppNotifications;
  }

  function matchMenuKey(href) {
    href = href || '';
    var path = location.pathname;
    if (/(?:^|\/)home\/index\.html$/.test(href) || (href === 'index.html' && path.indexOf('/home/') >= 0)) {
      return 'dashboard';
    }
    if (/(?:^|\/)community\/index\.html$/.test(href) || (href === 'index.html' && path.indexOf('/community/') >= 0)) {
      return 'community';
    }
    if (/(?:^|\/)loyalty\/index\.html$/.test(href) || (href === 'index.html' && path.indexOf('/loyalty/') >= 0)) {
      return 'loyalty';
    }
    return null;
  }

  function ensureMenuBadges() {
    document.querySelectorAll('.ifx-topnav-menu .ifx-topnav-link').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var matched = matchMenuKey(href);
      if (!matched) return;
      a.classList.add('ifx-topnav-link--badged');
      if (!a.querySelector('[data-ifx-menu-badge]')) {
        var badge = document.createElement('span');
        badge.className = 'ifx-topnav-badge';
        badge.setAttribute('data-ifx-menu-badge', matched);
        badge.hidden = true;
        a.appendChild(badge);
      }
      if (!a._ifxMenuBadgeBound) {
        a._ifxMenuBadgeBound = true;
        a.addEventListener('click', function () {
          var user = currentUser();
          var st = notifStore();
          if (user && st) st.markMenuRead(user.id, matched);
        });
      }
    });
  }

  function renderMenuBadges() {
    var user = currentUser();
    var st = notifStore();
    if (!user || !st) return;

    function paint() {
      var counts = st.groupedUnread(user.id);
      document.querySelectorAll('[data-ifx-menu-badge]').forEach(function (el) {
        var key = el.getAttribute('data-ifx-menu-badge');
        var n = counts[key] || 0;
        if (n > 0) {
          el.textContent = n > 9 ? '9+' : String(n);
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
      var bellBadge = document.querySelector('[data-ifx-bell-notif-badge]');
      if (bellBadge) {
        var total = st.unreadCount(user.id);
        if (total > 0) {
          bellBadge.textContent = total > 9 ? '9+' : String(total);
          bellBadge.hidden = false;
        } else {
          bellBadge.hidden = true;
        }
      }
    }

    paint();
    /* Need Now: badge summary từ server */
    if (st.fetchSummary) {
      st.fetchSummary().then(function () { paint(); }).catch(function () { /* keep local */ });
    }
  }

  function renderPanel(container) {
    var user = currentUser();
    var st = notifStore();
    if (!container || !user || !st) return;

    function paintLocal() {
      var groups = st.groupedForUser(user.id, { limit: 10 });
      if (!groups.length) {
        container.innerHTML = '<div class="ifx-user-notif-empty">Chưa có thông báo</div>';
        return;
      }
      container.innerHTML = groups.map(function (g) {
        return '<div class="ifx-user-notif-group">' +
          '<div class="ifx-user-notif-group__title">' + esc(g.label) + '</div>' +
          g.items.map(renderNotifItem).join('') +
          '</div>';
      }).join('');
    }

    /* Need Soon: panel page 1 từ server khi mở */
    if (st.fetchInboxPage) {
      container.innerHTML = '<div class="ifx-user-notif-empty">Đang tải…</div>';
      st.fetchInboxPage({ limit: 15 }).then(function (page) {
        var items = (page && page.items) || [];
        if (!items.length) {
          paintLocal();
          bindPanelActions(container, st);
          return;
        }
        container.innerHTML = '<div class="ifx-user-notif-group">' +
          '<div class="ifx-user-notif-group__title">Thông báo</div>' +
          items.map(renderNotifItem).join('') +
          '</div>';
        if (page.next_cursor) {
          container.insertAdjacentHTML('beforeend',
            '<button type="button" class="ifx-user-notif-more" data-ifx-notif-more="' + esc(page.next_cursor) + '">Xem thêm</button>');
        }
        bindPanelActions(container, st);
      }).catch(function () {
        paintLocal();
        bindPanelActions(container, st);
      });
      return;
    }
    paintLocal();
    bindPanelActions(container, st);
  }

  function bindPanelActions(container, st) {
    if (!container || !st) return;
    container.querySelectorAll('[data-ifx-notif-id]').forEach(function (a) {
      if (a._ifxNotifBound) return;
      a._ifxNotifBound = true;
      a.addEventListener('click', function () {
        var id = a.getAttribute('data-ifx-notif-id');
        if (st.markServerRead) st.markServerRead([id]);
        else st.markRead([id]);
      });
    });
    var moreBtn = container.querySelector('[data-ifx-notif-more]');
    if (moreBtn && !moreBtn._ifxNotifMoreBound && st.fetchInboxPage) {
      moreBtn._ifxNotifMoreBound = true;
      moreBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var cursor = moreBtn.getAttribute('data-ifx-notif-more');
        moreBtn.disabled = true;
        moreBtn.textContent = 'Đang tải…';
        st.fetchInboxPage({ limit: 15, cursor: cursor }).then(function (page) {
          var items = (page && page.items) || [];
          moreBtn.remove();
          if (!items.length) return;
          var html = items.map(renderNotifItem).join('');
          var group = container.querySelector('.ifx-user-notif-group');
          if (group) group.insertAdjacentHTML('beforeend', html);
          else container.insertAdjacentHTML('beforeend', html);
          if (page.next_cursor) {
            container.insertAdjacentHTML('beforeend',
              '<button type="button" class="ifx-user-notif-more" data-ifx-notif-more="' + esc(page.next_cursor) + '">Xem thêm</button>');
          }
          bindPanelActions(container, st);
        }).catch(function () {
          moreBtn.disabled = false;
          moreBtn.textContent = 'Xem thêm';
        });
      });
    }
  }

  function findNotifDropdown(notifWrap, header) {
    if (!notifWrap) return null;
    var dropdown = notifWrap.querySelector('[data-ifx-notif-dropdown]');
    if (dropdown) return dropdown;
    header = header || notifWrap.closest('.ifx-topnav');
    if (header) return header.querySelector('[data-ifx-notif-dropdown]');
    return null;
  }

  function purgeForeignNotifChrome(dropdown) {
    if (!dropdown || !dropdown.hasAttribute('data-ifx-notif-dropdown')) return;
    dropdown.querySelectorAll('.ifx-user-notif-head').forEach(function (head) {
      if (head.querySelector('.ti-messages')) head.remove();
    });
    dropdown.querySelectorAll('[data-ifx-messages-panel], .ifx-hdr-msg-item, .ifx-hdr-msg-all').forEach(function (el) {
      el.remove();
    });
  }

  function ensureNotifBellPanel(header) {
    header = header || document.querySelector('.ifx-topnav');
    var notifWrap = header ? header.querySelector('.ifx-topnav-notif') : document.querySelector('.ifx-topnav-notif');
    if (!notifWrap) return null;
    var dropdown = findNotifDropdown(notifWrap, header);
    if (!dropdown || !dropdown.hasAttribute('data-ifx-notif-dropdown')) return null;

    purgeForeignNotifChrome(dropdown);

    if (!notifWrap.querySelector('[data-ifx-bell-notif-badge]')) {
      var bellBtn = notifWrap.querySelector('[data-ifx-notif-bell]');
      if (bellBtn) {
        var bb = document.createElement('span');
        bb.className = 'ifx-topnav-notif-badge';
        bb.setAttribute('data-ifx-bell-notif-badge', '');
        bb.hidden = true;
        bellBtn.appendChild(bb);
      }
    }

    if (!dropdown.querySelector('[data-ifx-user-notif-panel]')) {
      var head = document.createElement('div');
      head.className = 'ifx-user-notif-head';
      head.innerHTML = '<span><i class="ti ti-bell"></i> Thông báo</span>' +
        '<button type="button" class="ifx-user-notif-mark-all" data-ifx-notif-mark-all>Đã đọc</button>';
      var panel = document.createElement('div');
      panel.className = 'ifx-user-notif-panel';
      panel.setAttribute('data-ifx-user-notif-panel', '');
      var foot = document.createElement('div');
      foot.className = 'ifx-user-notif-foot';
      foot.innerHTML = '<span class="ifx-user-notif-hint">Badge số hiển thị trên menu tương ứng</span>';
      dropdown.appendChild(head);
      dropdown.appendChild(panel);
      dropdown.appendChild(foot);

      head.querySelector('[data-ifx-notif-mark-all]').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var user = currentUser();
        var st = notifStore();
        if (user && st) st.markAllRead(user.id);
      });
    }

    return dropdown.querySelector('[data-ifx-user-notif-panel]');
  }

  function stripAvatarNotifPanel() {
    var menu = document.querySelector('.ifx-user-menu');
    if (!menu) return;
    var dropdown = menu.querySelector('.ix-dropdown-menu');
    if (!dropdown) return;
    var head = dropdown.querySelector('.ifx-user-notif-head');
    if (head) {
      var divider = head.previousElementSibling;
      if (divider && divider.classList.contains('ix-dropdown-divider')) divider.remove();
      head.remove();
    }
    dropdown.querySelectorAll('[data-ifx-user-notif-panel], .ifx-user-notif-foot').forEach(function (el) {
      el.remove();
    });
    var avatarBadge = menu.querySelector('[data-ifx-avatar-notif-badge]');
    if (avatarBadge) avatarBadge.remove();
  }

  function isMobileBar() {
    return global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell
      ? global.IfluxBreakpoint.isMobileShell()
      : false;
  }

  function renderBellPanel(header) {
    var panel = ensureNotifBellPanel(header);
    renderPanel(panel);
    return panel;
  }

  function bindBellMenu() {
    document.querySelectorAll('.ifx-topnav-notif').forEach(function (notifWrap) {
      if (notifWrap._ifxBellBound) return;
      notifWrap._ifxBellBound = true;

      var bellBtn = notifWrap.querySelector('[data-ifx-notif-bell]');
      if (!bellBtn) return;

      bellBtn.removeAttribute('data-ix-toggle');

      function openPanel() {
        clearTimeout(closeTimer);
        renderBellPanel();
      }

      function toggleBell(e) {
        if (isMobileBar()) return;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        var isOpen = notifWrap.classList.contains('open');
        document.querySelectorAll('.ix-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
        if (isOpen) {
          notifWrap.classList.remove('open');
          return;
        }
        notifWrap.classList.add('open');
        openPanel();
      }

      bellBtn.addEventListener('click', toggleBell);
      /* Chỉ mở bằng click — không hover mở panel. */
    });

    document.addEventListener('click', function (e) {
      if (isMobileBar()) return;
      if (e.target.closest('.ifx-topnav-notif')) return;
      document.querySelectorAll('.ifx-topnav-notif.open').forEach(function (d) {
        d.classList.remove('open');
      });
    });
  }

  function mountBell() {
    stripAvatarNotifPanel();
    ensureNotifBellPanel();
    bindBellMenu();
    refresh();
  }

  function refresh() {
    ensureMenuBadges();
    renderMenuBadges();
    stripAvatarNotifPanel();
    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      var panel = ensureNotifBellPanel(header);
      if (!panel) return;
      if (header.classList.contains('ifx-topnav--notif-open') || header.querySelector('.ifx-topnav-notif.open')) {
        renderPanel(panel);
      }
    });
  }

  function init() {
    if (!document.querySelector('.ifx-app') || !global.IfluxAuth || !IfluxAuth.isLoggedIn()) return;
    var user = currentUser();
    var st = notifStore();
    if (!user || !st) return;

    st.seedDemoIfEmpty(user.id);
    mountBell();

    document.addEventListener('iflux-notifications-change', refresh);
    if (!document._ifxNotifHydrateBound) {
      document._ifxNotifHydrateBound = true;
      document.addEventListener('iflux-user-data-hydrated', refresh);
    }
  }

  global.IfluxUserNotificationsUI = {
    init: init,
    refresh: refresh,
    mountBell: mountBell,
    renderBellPanel: renderBellPanel
  };
})(window);
