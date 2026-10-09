/* iFlux User Web — Mobile Nav (User Hub panel, bottom tabbar, context/messages back)
 * Tách khỏi iflux-web-ui.js (Task 4 tinh thần: chỉ tải khi cần — thiết bị mobile).
 * Phụ thuộc Core qua window.IfluxWebUI._bridge (appNavigate, buildMenuItem,
 * GROUP_HEADER_STYLE, syncTopnavActiveHeight) + API công khai đã có sẵn
 * (IfluxWebUI.closeMobileSearch/closeMobileNotif/closeMobileMessages/refreshTierChips). */
(function () {
  'use strict';

  var W = window.IfluxWebUI || {};
  var B = W._bridge || {};
  function appNavigate(href, opts) { return B.appNavigate ? B.appNavigate(href, opts) : (window.location.href = href); }
  function buildMenuItem(it) { return B.buildMenuItem ? B.buildMenuItem(it) : document.createElement('a'); }
  var GROUP_HEADER_STYLE = B.GROUP_HEADER_STYLE || '';
  function syncTopnavActiveHeight(header) { if (B.syncTopnavActiveHeight) B.syncTopnavActiveHeight(header); }
  function ifxIsMobileShell() {
    var bp = window.IfluxBreakpoint;
    if (bp && bp.isMobileShell) return bp.isMobileShell();
    if (bp && bp.belowSemantic) return bp.belowSemantic('mobile-shell');
    var el = document.documentElement;
    if (el && window.getComputedStyle && typeof window.innerWidth === 'number') {
      var raw = window.getComputedStyle(el).getPropertyValue('--ifx-bp-lg').trim();
      var n = parseFloat(raw, 10);
      if (!isNaN(n)) return window.innerWidth <= n;
    }
    return false;
  }
  function closeMobileSearch() { if (W.closeMobileSearch) W.closeMobileSearch(); }
  function closeMobileNotif() { if (W.closeMobileNotif) W.closeMobileNotif(); }
  function closeMobileMessages() { if (W.closeMobileMessages) W.closeMobileMessages(); }
  function refreshTierChips() { if (W.refreshTierChips) W.refreshTierChips(); }

  var mobileNavControllers = [];

  /* ĐỢT 2 — Mobile User Hub (thay hamburger cũ).
   * Trên mobile Primary Nav đã ở bottom bar → header KHÔNG cần hamburger + drawer nav.
   * Avatar (mobile) tap → mở panel User Hub full-page (tái dùng class .ifx-app-header-menu
   * cho style drawer, đã chỉnh full-width), header hiện nút Back. Consumer thuần của
   * IfluxAppShell.getUserHub(). KHÔNG tạo class DS mới. */
  function initMobileUserHub() {
    function isMobile() { return ifxIsMobileShell(); }

    document.querySelectorAll('.ifx-app-header').forEach(function (header, idx) {
      if (header.getAttribute('data-ifx-userhub') === '1') return;
      header.setAttribute('data-ifx-userhub', '1');

      var brand = header.querySelector('.ifx-app-header-brand');

      var overlay = document.createElement('div');
      overlay.className = 'ifx-app-header-overlay';
      overlay.setAttribute('data-ifx-nav-overlay', '');
      document.body.appendChild(overlay);

      /* Panel User Hub — tái dùng class drawer .ifx-app-header-menu (full-page trên mobile). */
      var panel = document.createElement('nav');
      panel.className = 'ifx-app-header-menu';
      panel.id = 'ifx-user-hub-' + idx;
      panel.setAttribute('aria-label', 'Menu cá nhân');
      document.body.appendChild(panel);

      /* Nút Back — tái dùng .ifx-app-header-navbtn, chỉ hiện khi hub mở. */
      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ifx-app-header-navbtn';
      backBtn.setAttribute('aria-label', 'Quay lại');
      backBtn.setAttribute('data-ifx-userhub-back', '');
      backBtn.innerHTML = '<i class="ti ti-arrow-left"></i>';
      backBtn.style.display = 'none';
      header.insertBefore(backBtn, header.firstChild);

      function renderHub() {
        var shell = window.IfluxAppShell;
        var groups = (shell && shell.getUserHub) ? shell.getUserHub() : [];
        panel.innerHTML = '';
        var frag = document.createDocumentFragment();
        groups.forEach(function (group) {
          var h = document.createElement('div');
          h.style.cssText = GROUP_HEADER_STYLE;
          h.textContent = group.title;
          frag.appendChild(h);
          group.items.forEach(function (it) { frag.appendChild(buildMenuItem(it)); });
        });
        var divider = document.createElement('div');
        divider.className = 'ifx-dropdown-divider';
        frag.appendChild(divider);
        var lo = document.createElement('a');
        lo.className = 'ifx-dropdown-item';
        lo.href = '#';
        lo.setAttribute('data-ifx-logout', '');
        lo.innerHTML = '<i class="ti ti-logout"></i> Đăng xuất';
        lo.addEventListener('click', function (e) {
          e.preventDefault();
          if (window.IfluxAuth) IfluxAuth.logout();
          appNavigate((window.IfluxRoutes && IfluxRoutes.siteRoot) ? IfluxRoutes.siteRoot() : '/');
        });
        frag.appendChild(lo);
        panel.appendChild(frag);
        refreshTierChips();
      }

      function setOpen(open) {
        if (open && !isMobile()) return;
        if (open) {
          renderHub();
          closeMobileSearch();
          closeMobileNotif();
          closeMobileMessages();
        }
        panel.classList.toggle('is-open', open);
        overlay.classList.toggle('is-visible', open);
        header.classList.toggle('is-nav-open', open);
        document.body.classList.toggle('ifx-nav-drawer-open', open);
        backBtn.style.display = open ? 'flex' : 'none';
        if (brand) brand.style.display = open ? 'none' : '';
        if (header._ifxSyncContextBack) header._ifxSyncContextBack();
        syncTopnavActiveHeight(header);
      }

      function applyMode() {
        if (isMobile()) {
          panel.style.display = '';
        } else {
          setOpen(false);
          panel.style.display = 'none';
        }
        syncTopnavActiveHeight(header);
      }

      backBtn.addEventListener('click', function () { setOpen(false); });
      overlay.addEventListener('click', function () { setOpen(false); });
      panel.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
      });
      window.addEventListener('resize', applyMode);

      applyMode();

      /* Cho initMobileTopbar (core) đóng hub khi mở tìm kiếm/thông báo/tin nhắn. */
      mobileNavControllers.push({
        setOpen: setOpen,
        isDrawerMode: isMobile,
        header: header
      });
      /* Toggle: tap avatar lần nữa (khi đang mở) sẽ đóng hub — cùng nút Back. */
      header._ifxOpenUserHub = function () { setOpen(!panel.classList.contains('is-open')); };
    });
  }

  function initMobileTabbar() {
    if (!document.querySelector('.ifx-app')) return;

    function isMobileBar() { return ifxIsMobileShell(); }

    var bar = document.getElementById('ifx-tabbar');
    if (!bar) {
      bar = document.createElement('nav');
      bar.id = 'ifx-tabbar';
      bar.className = 'ifx-tabbar';
      bar.setAttribute('aria-label', 'Điều hướng chính');
      document.body.appendChild(bar);
    }

    var SHORT = {};
    var ORDER = ['community', 'news', 'flow', 'pricing', 'dashboard'];

    function tabbarItemHtml(it, label) {
      var chip = it.exclusive ? '<span class="ifx-tabbar-chip">ĐỘC QUYỀN</span>' : '';
      return (
        '<span class="ifx-tabbar-icon">' +
          chip +
          '<span class="ifx-tabbar-fab"><i class="ti ' + it.icon + '"></i></span>' +
        '</span>' +
        '<span>' + label + '</span>'
      );
    }

    function getActiveContextKey() {
      var active = document.querySelector('[data-ec-tabs] [data-ec-tab].active');
      return active ? active.getAttribute('data-ec-tab') : null;
    }

    function activateContextTab(key) {
      var tabsWrap = document.querySelector('[data-ec-tabs]');
      if (!tabsWrap) return;
      var btn = tabsWrap.querySelector('[data-ec-tab="' + key + '"]');
      if (btn) btn.click();
    }

    function renderTabbar(items, mode, opts) {
      opts = opts || {};
      mode = mode || 'primary';
      bar.innerHTML = '';
      if (mode === 'primary') {
        bar.setAttribute('aria-label', 'Điều hướng chính');
        bar.removeAttribute('data-ifx-tabbar-mode');
      } else if (mode === 'context') {
        bar.setAttribute('aria-label', 'Tab chi tiết');
        bar.setAttribute('data-ifx-tabbar-mode', 'context');
      } else if (mode === 'account') {
        bar.setAttribute('aria-label', 'Tab hồ sơ');
        bar.setAttribute('data-ifx-tabbar-mode', 'account');
      }
      var commentN = opts.commentN || '';
      var list = items;
      if (mode === 'primary') {
        var byKey = {};
        items.forEach(function (it) { byKey[it.key] = it; });
        list = ORDER.map(function (k) { return byKey[k]; }).filter(Boolean);
        items.forEach(function (it) { if (ORDER.indexOf(it.key) < 0) list.push(it); });
      }
      list.forEach(function (it) {
        var link = document.createElement('a');
        var label = (mode === 'primary') ? (SHORT[it.key] || it.label) : it.label;
        link.href = (mode === 'primary' && it.href) ? it.href : '#';
        link.className = 'ifx-tabbar-item' + (it.active ? ' is-active' : '');
        if (mode === 'primary' && it.exclusive) link.className += ' ifx-tabbar-item-exclusive';
        var badge = '';
        if (mode === 'context' && it.key === 'comments' && commentN && commentN !== '0') {
          badge = '<span class="ifx-tabbar-count' + (it.active ? ' is-active' : '') + '">' + commentN + '</span>';
        }
        link.innerHTML = tabbarItemHtml(it, label) + badge;
        if (mode === 'context') {
          link.setAttribute('data-ifx-context-tab', it.key);
          link.addEventListener('click', function (e) {
            e.preventDefault();
            if (it.key === 'comments') {
              if (openCommentsPage()) return;
            }
            activateContextTab(it.key);
            syncMobileTabbar();
          });
        } else if (mode === 'account') {
          var tabId = it.tabId || it.key;
          link.setAttribute('data-ifx-account-tab', tabId);
          link.addEventListener('click', function (e) {
            e.preventDefault();
            if (window.IfluxHubPage && IfluxHubPage.switchTab && document.querySelector('[data-ifx-hub-tab-panels]')) {
              IfluxHubPage.switchTab(tabId);
              syncMobileTabbar();
            } else if (window.IfluxAccountProfileNav && IfluxAccountProfileNav.switchTab) {
              IfluxAccountProfileNav.switchTab(tabId);
            }
          });
        }
        bar.appendChild(link);
      });
    }

    function renderPrimary(items) {
      renderTabbar(items, 'primary');
    }

    function renderContext(items) {
      var countEl = document.querySelector('[data-ec-comment-count]');
      var commentN = countEl ? String(countEl.textContent || '').trim() : '';
      renderTabbar(items, 'context', { commentN: commentN });
    }

    function renderAccount() {
      var shell = window.IfluxAppShell;
      if (!shell || !shell.resolveNavigationItems) return;
      var ctx = shell.resolveNavigationContext();
      renderTabbar(shell.resolveNavigationItems('accountProfile', ctx), 'account');
    }

    /** Chi tiết bài viết — entity row (trên) + Host ActionBar (dưới). Không proxy-click. */
    function ensureArticleIxBottomSlot() {
      bar.removeAttribute('hidden');
      bar.style.display = '';
      bar.setAttribute('aria-label', 'Tương tác bài viết');
      bar.setAttribute('data-ifx-tabbar-mode', 'article');

      /* Idempotent — chỉ DỰNG ô nếu chưa có, không đụng nội dung ô đã có. Hàm này còn bị gọi lại
       * bởi listener resize chung (syncMobileTabbar, không riêng bài viết) mỗi khi viewport đổi
       * (kể cả URL bar mobile co/giãn lúc scroll, không phải đổi bài) — xoá nội dung ở ĐÂY mà
       * không có bước điền lại tương ứng sẽ làm mã gắn kèm biến mất vĩnh viễn sau khi cuộn.
       * Xoá đúng lúc "đổi bài" (paintPost → clearArticleEntityStrip) nằm ở news-post-page.js. */
      var entities = bar.querySelector('[data-ifx-ix-article-entities]');
      if (!entities) {
        entities = document.createElement('div');
        entities.setAttribute('data-ifx-ix-article-entities', '');
        entities.className = 'ifx-com-article__entities';
        entities.setAttribute('aria-label', 'Gắn kèm bài viết');
        entities.setAttribute('hidden', 'hidden');
      }

      var slot = bar.querySelector('[data-ifx-ix-article-bottom-root]');
      if (!slot) {
        bar.innerHTML = '';
        bar.appendChild(entities);
        slot = document.createElement('div');
        slot.setAttribute('data-ifx-ix-article-bottom-root', '');
        slot.className = 'ifx-tabbar-ix';
        bar.appendChild(slot);
        /* Chỉ báo khi ô vừa được tạo — người nghe (bài viết) gắn Host vào ô rồi gọi lại hàm này;
           báo lại mỗi lần gọi sẽ thành đệ quy vô hạn (mỗi vòng một request summary). */
        try {
          document.dispatchEvent(new CustomEvent('iflux-ix-bottom-slot-ready'));
        } catch (e) { /* ignore */ }
      } else if (entities.parentNode !== bar || slot.previousElementSibling !== entities) {
        bar.insertBefore(entities, slot);
      }
      return slot;
    }

    function renderArticleActions() {
      ensureArticleIxBottomSlot();
    }

    function hideMobileTabbar() {
      bar.innerHTML = '';
      bar.removeAttribute('data-ifx-tabbar-mode');
      bar.setAttribute('hidden', 'hidden');
      bar.style.display = 'none';
    }

    function syncMobileTabbar() {
      var shell = window.IfluxAppShell;
      if (!isMobileBar() || !shell) return;
      /* Trang bình luận riêng — không hiện bottom menu (composer thay chỗ) */
      if (document.querySelector('[data-ifx-comments-page]') || window.__IFLUX_SHELL_READY === 'comments') {
        hideMobileTabbar();
        return;
      }
      bar.removeAttribute('hidden');
      bar.style.display = '';
      var ctx = shell.detectContext ? shell.detectContext() : null;
      var model = shell.currentNavigationModel ? shell.currentNavigationModel() : null;
      if (ctx && ctx.entityType === 'article') {
        renderArticleActions();
      } else if (model && model.modelId === 'accountProfile') {
        renderAccount();
      } else if (shell.getNavMode && shell.getNavMode() === 'CONTEXT' && document.querySelector('[data-ec-tabs]')) {
        var items = shell.getContextNav(ctx ? ctx.entityType : null);
        var activeKey = getActiveContextKey();
        items = items.map(function (it) {
          return {
            key: it.key,
            label: it.label,
            icon: it.icon,
            active: activeKey ? it.key === activeKey : !!it.active
          };
        });
        renderContext(items);
      } else {
        var primaryItems = (shell.getPrimaryNav) ? shell.getPrimaryNav() : [];
        if (primaryItems.length) renderPrimary(primaryItems);
      }
      document.querySelectorAll('.ifx-app-header').forEach(function (header) {
        if (header._ifxSyncContextBack) header._ifxSyncContextBack();
      });
    }

    window.IfluxWebUI.syncMobileTabbar = syncMobileTabbar;
    window.IfluxWebUI.ensureArticleIxBottomSlot = ensureArticleIxBottomSlot;
    syncMobileTabbar();
    window.addEventListener('resize', syncMobileTabbar);
    document.addEventListener('iflux-context-ready', syncMobileTabbar);
  }

  function openCommentsPage() {
    /* Giữ hành vi gốc: tab "comments" trong context tabbar có thể điều hướng
       sang trang riêng nếu Feature đã đăng ký — placeholder giữ tương thích,
       bản gốc không tự điều hướng (return falsy) nên context tab xử lý tiếp. */
    return false;
  }

  /* ĐỢT 2 — Nút Back header khi CONTEXT mode (mobile). Khác User Hub back (chỉ khi hub mở). */
  function initMobileContextBack() {
    function isMobile() { return ifxIsMobileShell(); }
    function isMessagesPage() {
      var path = '';
      try { path = (window.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
      return /\/(tin-nhan|messages)(\/|$)/.test(path) || /\/User_Web\/messages\//.test(path);
    }

    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      if (header.getAttribute('data-ifx-context-back-init') === '1') return;
      header.setAttribute('data-ifx-context-back-init', '1');

      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ifx-app-header-navbtn';
      backBtn.setAttribute('aria-label', 'Quay lại');
      backBtn.setAttribute('data-ifx-context-back', '');
      backBtn.innerHTML = '<i class="ti ti-arrow-left"></i>';
      backBtn.style.display = 'none';

      var hubBack = header.querySelector('[data-ifx-userhub-back]');
      if (hubBack) hubBack.insertAdjacentElement('afterend', backBtn);
      else header.insertBefore(backBtn, header.firstChild);

      backBtn.addEventListener('click', function () {
        var forced = backBtn.getAttribute('data-ifx-back-href');
        if (forced) {
          appNavigate(forced);
          return;
        }
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        var href = (window.IfluxAppShell && IfluxAppShell.getBackHref)
          ? IfluxAppShell.getBackHref()
          : '/';
        appNavigate(href);
      });

      function applyMode() {
        var shell = window.IfluxAppShell;
        var isCtx = isMobile() && shell && shell.getNavMode && shell.getNavMode() === 'CONTEXT';
        var isComments = header.getAttribute('data-ifx-header-mode') === 'comments';
        var hubOpen = header.classList.contains('is-nav-open');
        backBtn.style.display = ((isCtx || isComments) && !hubOpen && !isMessagesPage()) ? 'flex' : 'none';
        syncTopnavActiveHeight(header);
      }

      header._ifxSyncContextBack = applyMode;
      window.addEventListener('resize', applyMode);
      applyMode();
    });
  }

  /* Mobile — trang Tin nhắn (/tin-nhan): nút Back App Shell đồng bộ stack chat. */
  function initMobileMessagesShell() {
    function isMobile() { return ifxIsMobileShell(); }
    function isMessagesPage() {
      var path = '';
      try { path = (window.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
      return /\/(tin-nhan|messages)(\/|$)/.test(path) || /\/User_Web\/messages\//.test(path);
    }

    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      if (header.getAttribute('data-ifx-msg-shell') === '1') return;
      header.setAttribute('data-ifx-msg-shell', '1');

      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ifx-app-header-navbtn';
      backBtn.setAttribute('aria-label', 'Quay lại');
      backBtn.setAttribute('data-ifx-messages-back', '');
      backBtn.innerHTML = '<i class="ti ti-arrow-left"></i>';
      backBtn.style.display = 'none';

      var ctxBack = header.querySelector('[data-ifx-context-back]');
      if (ctxBack) ctxBack.insertAdjacentElement('afterend', backBtn);
      else header.insertBefore(backBtn, header.firstChild);

      function applyMode() {
        var show = isMobile() && isMessagesPage();
        var hubOpen = header.classList.contains('is-nav-open');
        var chatMode = header.getAttribute('data-ifx-chat-mode') || 'list';
        backBtn.style.display = (show && !hubOpen) ? 'flex' : 'none';
        if (show && chatMode === 'detail' && header._ifxSyncContextBack) {
          header._ifxSyncContextBack();
        }
        syncTopnavActiveHeight(header);
      }

      backBtn.addEventListener('click', function () {
        var mode = header.getAttribute('data-ifx-chat-mode') || 'list';
        if (mode === 'profile' && window.IfluxProfileChatPage && IfluxProfileChatPage.hidePeerInfo) {
          IfluxProfileChatPage.hidePeerInfo();
          return;
        }
        if (mode === 'detail' && window.IfluxProfileChatPage && IfluxProfileChatPage.showThreadList) {
          IfluxProfileChatPage.showThreadList();
          return;
        }
        if (window.history.length > 1) window.history.back();
        else appNavigate((window.IfluxRoutes && IfluxRoutes.to) ? IfluxRoutes.to('home', { canonical: true, skipDecorate: true }) : '/trang-chu');
      });

      document.addEventListener('iflux-chat-mobile-view', function (e) {
        var mode = (e && e.detail && e.detail.mode) ? e.detail.mode : 'list';
        header.setAttribute('data-ifx-chat-mode', mode);
        applyMode();
      });

      window.addEventListener('resize', applyMode);
      applyMode();
    });
  }

  window.IfluxWebUI.openMobileNav = function () {
    mobileNavControllers.forEach(function (ctrl) {
      if (ctrl.isDrawerMode()) ctrl.setOpen(true);
    });
  };
  window.IfluxWebUI.closeMobileNav = function () {
    mobileNavControllers.forEach(function (ctrl) {
      ctrl.setOpen(false);
    });
  };
  window.IfluxWebUI.toggleMobileNav = function () {
    mobileNavControllers.forEach(function (ctrl) {
      if (!ctrl.isDrawerMode()) return;
      var open = ctrl.header && ctrl.header.classList.contains('is-nav-open');
      ctrl.setOpen(!open);
    });
  };

  initMobileUserHub();
  initMobileContextBack();
  initMobileMessagesShell();
  initMobileTabbar();

  if (window.IfluxWebUI._onMobileNavReady) {
    try { window.IfluxWebUI._onMobileNavReady(); } catch (e) { /* ignore */ }
  }
})();
