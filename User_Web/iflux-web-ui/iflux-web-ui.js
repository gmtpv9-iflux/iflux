/* iFlux User Web — shared UI helpers */
(function () {
  'use strict';

  if (document.body.classList.contains('ifx-onboard-active')) {
    document.documentElement.classList.remove('ifx-onboard-active');
    document.body.classList.remove('ifx-onboard-active');
  }

  if (document.querySelector('.ifx-app')) {
    document.documentElement.classList.add('ifx-user-web');
    document.body.classList.add('ifx-user-web');
  }

  /** mobile-shell semantic → bp-lg (Foundation via IfluxBreakpoint) */
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

  /* Auth pages: chữ thương hiệu (không đụng header User Web — logo = SEO only). */
  function patchTextBrand() {
    document.querySelectorAll('.ifx-brand-auth-logo').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('.ix-auth-brand-name').forEach(function (el) {
      el.style.display = '';
      if (!String(el.textContent || '').trim()) el.textContent = 'iFlux';
    });
  }
  patchTextBrand();

  function appNavigate(canonical, opts) {
    /* P6-API-01 — internal nav chỉ Writer.navigate */
    var W = window.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical, opts);
      return;
    }
    window.location.href = canonical;
  }

  function appHref(canonical) {
    if (window.IfluxHref && IfluxHref.forCanonical) return IfluxHref.forCanonical(canonical);
    if (window.IfluxRoutes && IfluxRoutes.to) return IfluxRoutes.to(canonical);
    return canonical;
  }

  window.IfluxWebUI = window.IfluxWebUI || {};
  window.IfluxWebUI._bridge = window.IfluxWebUI._bridge || {};
  window.IfluxWebUI._bridge.appNavigate = appNavigate;

  document.querySelectorAll('[data-ix-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-ix-toggle-password'));
      if (!input) return;
      var isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      var icon = btn.querySelector('i');
      if (icon) icon.className = isPw ? 'ti ti-eye' : 'ti ti-eye-off';
    });
  });

  document.querySelectorAll('[data-ifx-logout]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.IfluxAuth) IfluxAuth.logout();
      var base = el.getAttribute('data-logout-href');
      if (!base && window.IfluxAuth && IfluxAuth.guestHomePath) {
        base = IfluxAuth.guestHomePath();
      }
      if (!base) base = (window.IfluxRoutes && IfluxRoutes.siteRoot) ? IfluxRoutes.siteRoot() : '/';
      appNavigate(base);
    });
  });

  function tierChipClass(user) {
    if (!user) return 'ix-chip-primary';
    var phase = user.subscription_phase || '';
    if (phase === 'trial_eligible') return 'ix-chip-warning';
    if (phase === 'freemium' || String(user.tier || 'free').toLowerCase() === 'free') return 'ix-chip-primary';
    if (String(user.tier || '').toLowerCase() === 'elite') return 'ix-chip-warning';
    return 'ix-chip-primary';
  }

  function refreshTierChips() {
    var user = window.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;
    var label = window.IfluxAuth.getMenuTierLabel
      ? IfluxAuth.getMenuTierLabel()
      : (user.tier_label || (user.tier === 'free' ? 'Miễn phí' : user.tier) || 'Miễn phí');
    var chipClass = tierChipClass(user);
    /* Chỉ cập nhật chip trong menu avatar — không còn chip cấp trên header topnav. */
    document.querySelectorAll('.ifx-dropdown-menu [data-ifx-tier], .ifx-app-header-drawer-user [data-ifx-tier]').forEach(function (el) {
      el.textContent = label;
      el.className = 'ix-chip ' + chipClass;
    });
  }

  var user = window.IfluxAuth && IfluxAuth.getUser();
  if (user) {
    document.querySelectorAll('[data-ifx-user-name]').forEach(function (el) {
      el.textContent = user.display_name;
    });
    document.querySelectorAll('[data-ifx-user-initials]').forEach(function (el) {
      var parts = (user.display_name || 'U').split(' ');
      el.textContent = parts.map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
    });
    refreshTierChips();
  }

  document.addEventListener('iflux-tier-changed', refreshTierChips);

  function pricingPageUrl(opts) {
    opts = opts || {};
    var q = [];
    if (opts.reason) q.push('reason=' + encodeURIComponent(opts.reason));
    if (opts.mode) q.push('mode=' + encodeURIComponent(opts.mode));
    if (opts.message) q.push('message=' + encodeURIComponent(opts.message));
    if (opts.showPropose) q.push('propose=1');

    var base;
    if (window.IfluxRoutes && IfluxRoutes.to) {
      base = IfluxRoutes.to('pricing', { canonical: true, skipDecorate: true });
    } else {
      var parts = location.pathname.split('/');
      var idx = parts.indexOf('User_Web');
      if (idx >= 0) {
        base = parts.slice(0, idx + 1).join('/') + '/pricing/index.html';
      } else {
        base = '../pricing/index.html';
      }
    }
    return base + (q.length ? '?' + q.join('&') : '');
  }

  window.IfluxWebUI = window.IfluxWebUI || {};
  window.IfluxWebUI.refreshTierChips = refreshTierChips;
  window.IfluxWebUI.pricingPageUrl = pricingPageUrl;
  window.IfluxWebUI.syncTopnav = syncTopnav;

  var pricingLoadPromise = null;
  function ensurePricingModal() {
    if (window.IfluxPricingModal) return Promise.resolve(window.IfluxPricingModal);
    if (pricingLoadPromise) return pricingLoadPromise;
    var base = resolveWebUiBaseSafe();
    pricingLoadPromise = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = base + 'iflux-pricing-modal.js?v=b4w3_20260727';
      s.onload = function () { resolve(window.IfluxPricingModal); };
      s.onerror = function () { resolve(null); };
      document.body.appendChild(s);
    });
    return pricingLoadPromise;
  }

  function resolveWebUiBaseSafe() {
    var scripts = document.getElementsByTagName('script');
    var base = '/User_Web/iflux-web-ui/';
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('iflux-web-ui.js') >= 0) {
        return src.replace(/iflux-web-ui\.js.*$/, '');
      }
    }
    return base;
  }

  /* Click CTA → dynamic import Pricing Modal. Không idle / login preload. */
  window.IfluxWebUI.openPricing = function (opts) {
    opts = opts || {};
    var user = window.IfluxAuth && IfluxAuth.getUser();
    if (user) {
      var tier = String(user.tier || 'free').toLowerCase();
      var atMax = tier === 'elite' || tier === 'partner' || tier === 'admin';
      if (!atMax && window.IfluxPlansCatalog && IfluxPlansCatalog.hasUpgradePath) {
        atMax = !IfluxPlansCatalog.hasUpgradePath(tier);
      }
      if (atMax) {
        if (window.IfxToast) IfxToast.show('Bạn đang dùng gói cao nhất.', 'info');
        return;
      }
    }
    ensurePricingModal().then(function (modal) {
      if (modal && modal.open) {
        modal.open(opts);
        return;
      }
      appNavigate(pricingPageUrl(opts));
    });
  };
  window.IfluxWebUI.ensurePricingModal = ensurePricingModal;

  document.querySelectorAll('[data-ifx-pricing-open]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.IfluxWebUI.openPricing(JSON.parse(el.getAttribute('data-ifx-pricing-open') || '{}'));
    });
  });

  if (window.IfluxAuth && IfluxAuth.isLoggedIn()) {
    if (IfluxAuth.syncSubscriptionLifecycle) IfluxAuth.syncSubscriptionLifecycle();
    refreshTierChips();
  }
  function findMarketLink(menu) {
    var link = menu.querySelector('a[href*="market/"]');
    if (link) return link;

    var links = menu.querySelectorAll('a.ifx-app-header-link');
    var i;
    for (i = 0; i < links.length; i++) {
      if (links[i].querySelector('.ti-chart-candle')) return links[i];
    }
    for (i = 0; i < links.length; i++) {
      if (/Thị trường/i.test(links[i].textContent || '')) return links[i];
    }
    return null;
  }

  function findFlowLink(menu) {
    if (!menu) return null;
    var exclusive = menu.querySelector('a.ifx-app-header-link-exclusive');
    if (exclusive) return exclusive;

    var link = menu.querySelector('a[href*="flow/"]');
    if (link) return link;

    if (location.pathname.indexOf('/flow/') >= 0) {
      link = menu.querySelector('a[href="index.html"]');
      if (link && /Dòng tiền/i.test(link.textContent || '')) return link;
    }

    var links = menu.querySelectorAll('a.ifx-app-header-link');
    var i;
    for (i = 0; i < links.length; i++) {
      if (links[i].querySelector('.ti-arrows-exchange')) return links[i];
      if (/Dòng tiền/i.test(links[i].textContent || '')) return links[i];
    }
    return null;
  }

  function flowNavInnerHtml() {
    return (
      '<i class="ti ti-arrows-exchange"></i>' +
      '<span class="ifx-app-header-link-stack">' +
        '<span class="ifx-app-header-chip">Độc quyền</span>' +
        '<span class="ifx-app-header-link-label">Dòng tiền</span>' +
      '</span>'
    );
  }

  function upgradeFlowNavLink(link, onFlow) {
    if (!link) return;
    if (link.getAttribute('data-ifx-flow-nav') === '1' || link.classList.contains('ifx-app-header-link-exclusive')) {
      link.classList.toggle('is-active', !!onFlow);
      return;
    }
    link.className = 'ifx-app-header-link ifx-app-header-link-exclusive' + (onFlow ? ' is-active' : '');
    link.setAttribute('data-ifx-onboard', 'flow');
    link.setAttribute('data-ifx-flow-nav', '1');
    link.innerHTML = flowNavInnerHtml();
  }

  function resolveFlowHref(marketHref) {
    var href = marketHref || '';
    if (/market\/index\.html/.test(href)) {
      return href.replace(/market\/index\.html(?:\?.*)?$/, 'flow/index.html');
    }
    if (href === 'index.html' && location.pathname.indexOf('/market/') >= 0) {
      return '../flow/index.html';
    }
    return '../flow/index.html';
  }

  function patchTopnav() {
    document.querySelectorAll('.ifx-app-header-menu a[href*="alerts/"]').forEach(function (a) {
      a.style.display = 'none';
    });

    /* '/flow/' = đường dẫn file tĩnh cũ; URL canonical thật là /dong-tien (đổi tên từ lâu) —
       chỉ check '/flow/' khiến is-active luôn bị tắt trên /dong-tien (upgradeFlowNavLink dưới
       đây toggle is-active=false, xoá mất trạng thái active mà nav-registry đã gán đúng). */
    var onFlow = /\/(dong-tien|flow)(\/|$)/.test(location.pathname);

    document.querySelectorAll('.ifx-app-header-menu').forEach(function (menu) {
      var marketLink = findMarketLink(menu);
      var flowLink = findFlowLink(menu);
      var flowHref = flowLink && flowLink.getAttribute('href')
        ? flowLink.getAttribute('href')
        : resolveFlowHref(marketLink ? marketLink.getAttribute('href') : '');

      if (!flowLink && marketLink) {
        flowLink = document.createElement('a');
        flowLink.href = flowHref;
        if (marketLink.nextSibling) {
          menu.insertBefore(flowLink, marketLink.nextSibling);
        } else {
          menu.appendChild(flowLink);
        }
      }

      if (!flowLink) return;

      if (!flowLink.getAttribute('href') || flowLink.getAttribute('href') === '#') {
        flowLink.href = flowHref;
      }

      upgradeFlowNavLink(flowLink, onFlow);

      if (onFlow && marketLink) {
        marketLink.classList.remove('is-active');
      }
    });
  }

  function patchAccountFormAutofill() {
    document.querySelectorAll('input[data-bind-input="email"], input[type="email"].ix-input').forEach(function (el) {
      if (el.closest('[data-ifx-header-search]')) return;
      el.setAttribute('autocomplete', 'email');
    });
    document.querySelectorAll('.ifx-main input[type="password"], .ifx-hub-main input[type="password"]').forEach(function (el, idx) {
      el.setAttribute('autocomplete', idx === 0 ? 'current-password' : 'new-password');
    });
  }

  /* Menu Cá nhân (avatar / User Hub) — dữ liệu nằm trong IfluxNavRegistry.userHub
     (SoT), resolve qua IfluxAppShell.getUserHub(). Renderer bên dưới chỉ tiêu thụ. */
  var GROUP_HEADER_STYLE =
    'padding:var(--ifx-space-8) var(--ifx-space-16) var(--ifx-space-4);' +
    'font-size:var(--ifx-font-size-10);font-weight:700;letter-spacing:.04em;' +
    'text-transform:uppercase;color:var(--ix-text-muted)';

  function buildMenuItem(it) {
    var a = document.createElement('a');
    a.className = 'ifx-dropdown-item';
    if (it.greet) {
      a.href = appHref(it.href || '/tai-khoan');
      a.innerHTML = '<i class="ti ti-user-circle"></i> Chào ';
      var s = document.createElement('span');
      s.setAttribute('data-ifx-user-name', '');
      s.textContent = it.name || 'bạn';
      a.appendChild(s);
      var tier = it.tier;
      if (tier && tier.label) {
        a.appendChild(document.createTextNode(' '));
        var chip = document.createElement('span');
        chip.className = 'ix-chip ' + (tier.chipClass || 'ix-chip-primary');
        chip.setAttribute('data-ifx-tier', '');
        chip.textContent = tier.label;
        a.appendChild(chip);
      }
      return a;
    }
    if (it.partner) {
      a.href = '#';
      a.setAttribute('data-ifx-partner-open', '');
    } else if (it.feature) {
      a.href = '#';
      a.setAttribute('data-ifx-open-feature', '');
    } else if (it.bug) {
      a.href = '#';
      a.setAttribute('data-ifx-open-bug', '');
    } else {
      a.href = appHref(it.href);
    }
    var i = document.createElement('i');
    i.className = 'ti ' + it.icon;
    a.appendChild(i);
    a.appendChild(document.createTextNode(' ' + it.label));
    return a;
  }

  window.IfluxWebUI._bridge.buildMenuItem = buildMenuItem;
  window.IfluxWebUI._bridge.GROUP_HEADER_STYLE = GROUP_HEADER_STYLE;

  /* Menu avatar chuẩn: hover mở menu (CSS), click avatar → /account. */
  function patchUserMenu() {
    document.querySelectorAll('.ifx-app-header-user').forEach(function (menu) {
      var dropdown = menu.querySelector('.ifx-dropdown-menu');
      if (!dropdown || dropdown.getAttribute('data-ifx-user-menu-built') === '1') return;

      var logoutItem = dropdown.querySelector('[data-ifx-logout]');

      /* Consumer thuần: nội dung User Hub đến từ IfluxAppShell.getUserHub()
       * (đã resolve greet/name/tier) — renderer KHÔNG tự đọc Auth/Route. */
      var groups = (window.IfluxAppShell && IfluxAppShell.getUserHub)
        ? IfluxAppShell.getUserHub() : [];

      var frag = document.createDocumentFragment();
      groups.forEach(function (group) {
        var h = document.createElement('div');
        h.style.cssText = GROUP_HEADER_STYLE;
        h.textContent = group.title;
        frag.appendChild(h);
        group.items.forEach(function (it) {
          frag.appendChild(buildMenuItem(it));
        });
      });

      var divider = document.createElement('div');
      divider.className = 'ifx-dropdown-divider';
      frag.appendChild(divider);

      if (logoutItem) {
        frag.appendChild(logoutItem);
      } else {
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
      }

      dropdown.innerHTML = '';
      dropdown.appendChild(frag);
      dropdown.setAttribute('data-ifx-user-menu-built', '1');

      var avatar = menu.querySelector('.ifx-avatar');
      if (avatar) {
        avatar.style.cursor = 'pointer';
        avatar.setAttribute('title', 'Trang cá nhân');
      }
    });
    /* Xóa chip cấp thành viên khỏi header (không ẩn — xóa DOM). Tier chỉ còn trong menu avatar nếu có. */
    document.querySelectorAll('.ifx-app-header-actions > [data-ifx-tier], .ifx-app-header-actions > .ix-chip[data-ifx-tier]').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    bindAvatarNav();
    bindPartnerOpen();
    bindSystemToolsOpen();
  }

  /* Base path của thư mục iflux-web-ui (để lazy-load script/css). */
  function iwuAssetBase() {
    var s = document.querySelector('script[src*="iflux-web-ui.js"]');
    var src = s ? s.getAttribute('src') : '';
    return src ? src.replace(/iflux-web-ui\.js.*$/, '') : '../iflux-web-ui/';
  }

  function ensureCss(file) {
    var base = iwuAssetBase();
    if (document.querySelector('link[href*="' + file + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + file;
    document.head.appendChild(link);
  }

  /* Nạp tuần tự [{global, file}] rồi gọi done(). */
  function loadChainThen(chain, done) {
    var base = iwuAssetBase();
    var i = 0;
    (function next() {
      if (i >= chain.length) { done(); return; }
      var step = chain[i];
      if (window[step.global]) { i += 1; next(); return; }
      var sc = document.createElement('script');
      sc.src = base + step.file;
      sc.onload = function () { i += 1; next(); };
      sc.onerror = function () { i += 1; next(); };
      document.body.appendChild(sc);
    })();
  }

  /* Lazy-load + mở modal Đề xuất tính năng / Báo lỗi từ menu avatar. */
  function bindSystemToolsOpen() {
    if (document._ifxSysToolsBound) return;
    document._ifxSysToolsBound = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;

      if (t.closest('[data-ifx-open-feature]')) {
        e.preventDefault();
        ensureCss('feature-suggestions.css');
        loadChainThen([
          { global: 'IfluxVisitorId', file: 'visitor-id.js' },
          { global: 'IfluxTurnstile', file: 'turnstile-helper.js' },
          { global: 'IfluxFeatureSuggestionsStore', file: 'feature-suggestions-store.js' },
          { global: 'IfluxFeatureSuggestionsUI', file: 'feature-suggestions-ui.js?v=r20261009c' }
        ], function () {
          if (window.IfluxFeatureSuggestionsUI) {
            if (IfluxFeatureSuggestionsUI.init) IfluxFeatureSuggestionsUI.init();
            IfluxFeatureSuggestionsUI.open();
          }
        });
        return;
      }

      if (t.closest('[data-ifx-open-bug]')) {
        e.preventDefault();
        ensureCss('feature-suggestions.css');
        loadChainThen([
          { global: 'IfluxVisitorId', file: 'visitor-id.js' },
          { global: 'IfluxTurnstile', file: 'turnstile-helper.js' },
          { global: 'IfluxBugReportsUI', file: 'bug-reports-ui.js?v=r20261009c' }
        ], function () {
          if (window.IfluxBugReportsUI) {
            if (IfluxBugReportsUI.init) IfluxBugReportsUI.init();
            IfluxBugReportsUI.open();
          }
        });
        return;
      }
    });
  }

  /* Lazy-load modal Liên hệ hợp tác khi bấm item trong menu Cá nhân */
  function bindPartnerOpen() {
    if (document._ifxPartnerBound) return;
    document._ifxPartnerBound = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var el = t.closest('[data-ifx-partner-open]');
      if (!el) return;
      e.preventDefault();
      openPartnershipModal();
    });
  }

  function partnershipScriptUrl() {
    var s = document.querySelector('script[src*="iflux-web-ui.js"]');
    var src = s ? s.getAttribute('src') : '';
    var base = src ? src.replace(/iflux-web-ui\.js.*$/, '') : '/iflux-web-ui/';
    return base + 'partnership-request-ui.js';
  }

  function openPartnershipModal() {
    if (window.IfluxPartnershipRequest) { IfluxPartnershipRequest.open(); return; }
    var existing = document.querySelector('script[data-ifx-partner-script]');
    if (existing) {
      existing.addEventListener('load', function () {
        if (window.IfluxPartnershipRequest) IfluxPartnershipRequest.open();
      });
      return;
    }
    var sc = document.createElement('script');
    sc.src = partnershipScriptUrl();
    sc.setAttribute('data-ifx-partner-script', '');
    sc.onload = function () { if (window.IfluxPartnershipRequest) IfluxPartnershipRequest.open(); };
    document.head.appendChild(sc);
  }

  /* Bấm avatar → luôn vào /account. Delegation ở document (capture phase) để chạy
     TRƯỚC listener toggle dropdown của admin-ui trên chính avatar, và chặn hẳn nó.
     Menu vẫn mở khi hover (CSS). Chỉ áp dụng cho avatar trong .ifx-app-header-user
     (không đụng avatar đã chuyển vào drawer mobile). */
  function bindAvatarNav() {
    if (document._ifxAvatarNavBound) return;
    document._ifxAvatarNavBound = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var avatar = t.closest('.ifx-app-header-user .ifx-avatar');
      if (!avatar) return;
      e.preventDefault();
      e.stopPropagation();
      /* Mobile: toggle User Hub full-page (tap lần nữa để đóng). Desktop: hover xem menu,
         click → trang cá nhân. */
      var header = avatar.closest('.ifx-app-header');
      if (ifxIsMobileShell() && header && header._ifxOpenUserHub) {
        header._ifxOpenUserHub();
        return;
      }
      appNavigate('/tai-khoan');
    }, true);
  }

  /* Membership + FAQ đã chuyển vào menu Cá nhân (avatar) → gỡ khỏi topnav */
  function syncTopnav() {
    patchTopnav();
    patchAccountFormAutofill();
    patchUserMenu();
  }

  syncTopnav();

  function syncTopnavActiveHeight(header) {
    var h = header && header.offsetHeight ? header.offsetHeight : 56;
    document.documentElement.style.setProperty('--ifx-app-header-offset', h + 'px');
  }

  window.IfluxWebUI._bridge.syncTopnavActiveHeight = syncTopnavActiveHeight;

  function resolveHeaderDropdown(header, wrapSelector, attr) {
    if (!header) return null;
    var wrap = header.querySelector(wrapSelector);
    if (wrap) {
      var inWrap = wrap.querySelector('[' + attr + ']');
      if (inWrap) return inWrap;
    }
    return header.querySelector('[' + attr + ']');
  }

  function getNotifDropdown(header) {
    return resolveHeaderDropdown(header, '.ifx-app-header-notif', 'data-ifx-notif-dropdown');
  }

  /** Icon Chat → trang Tin nhắn. Không dropdown, không load JS chat trên trang khác. */
  function messagesPageHref() {
    if (window.IfluxRoutes && IfluxRoutes.to) {
      return IfluxRoutes.to('messages');
    }
    try {
      if (window.IfluxRoutes && IfluxRoutes.routes && IfluxRoutes.routes.messages) {
        return appHref(IfluxRoutes.routes.messages.public || '/tin-nhan');
      }
    } catch (e) { /* ignore */ }
    return appHref('/tin-nhan');
  }

  function wireMessagesShortcut(header) {
    if (!header) return;
    header.querySelectorAll('[data-ifx-messages-dropdown]').forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    var wrap = header.querySelector('.ifx-app-header-messages');
    if (wrap) {
      wrap.classList.remove('ifx-dropdown', 'is-open');
      header.classList.remove('is-messages-open');
    }
    var btn = header.querySelector('[data-ifx-messages-btn]');
    if (!btn || btn._ifxMsgNavBound) return;
    btn._ifxMsgNavBound = true;
    btn.removeAttribute('aria-expanded');
    btn.removeAttribute('data-ifx-toggle');
    /* Giữ nguyên button + icon ti-messages — chỉ đổi hành vi click. */
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      appNavigate(messagesPageHref());
    }, true);
  }

  function closeMobileSearch(header) {
    if (!header) {
      document.querySelectorAll('.ifx-app-header.is-search-open').forEach(closeMobileSearch);
      return;
    }
    header.classList.remove('is-search-open');
    var trigger = header.querySelector('[data-ifx-search-trigger]');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', 'Tìm kiếm');
      trigger.innerHTML = '<i class="ti ti-search"></i>';
    }
  }

  function closeMobileNotif(header) {
    if (!header) {
      document.querySelectorAll('.ifx-app-header.is-notif-open').forEach(closeMobileNotif);
      document.querySelectorAll('.ifx-app-header-notif.is-open').forEach(function (n) {
        n.classList.remove('is-open');
      });
      return;
    }
    header.classList.remove('is-notif-open');
    var bellBtn = header.querySelector('[data-ifx-notif-bell]');
    if (bellBtn) {
      bellBtn.setAttribute('aria-expanded', 'false');
      bellBtn.setAttribute('aria-label', 'Thông báo');
      bellBtn.innerHTML = '<i class="ti ti-bell"></i>';
    }
    var notifWrap = header.querySelector('.ifx-app-header-notif');
    if (notifWrap) notifWrap.classList.remove('is-open');
  }

  function closeMobileMessages(header) {
    if (!header) {
      document.querySelectorAll('.ifx-app-header.is-messages-open').forEach(closeMobileMessages);
      document.querySelectorAll('.ifx-app-header-messages.is-open').forEach(function (n) {
        n.classList.remove('is-open');
      });
      return;
    }
    header.classList.remove('is-messages-open');
    var msgBtn = header.querySelector('[data-ifx-messages-btn]');
    if (msgBtn) {
      msgBtn.setAttribute('aria-expanded', 'false');
      msgBtn.setAttribute('aria-label', 'Tin nhắn');
      msgBtn.innerHTML = '<i class="ti ti-messages"></i>';
    }
    var msgWrap = header.querySelector('.ifx-app-header-messages');
    if (msgWrap) msgWrap.classList.remove('is-open');
  }

  function initMobileTopbar() {
    function isMobileBar() {
      return ifxIsMobileShell();
    }

    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      if (header.getAttribute('data-ifx-mobile-bar') === '1') return;
      header.setAttribute('data-ifx-mobile-bar', '1');

      var actions = header.querySelector('.ifx-app-header-actions');
      var searchWrap = actions && actions.querySelector('.ifx-app-header-search');
      var searchInput = searchWrap && searchWrap.querySelector('input');

      function insertBeforeAvatar(el) {
        if (!actions || !el) return;
        var um = actions.querySelector('.ifx-app-header-user');
        if (um && um.parentNode === actions) um.insertAdjacentElement('beforebegin', el);
        else actions.appendChild(el);
      }

      var searchTrigger = header.querySelector('[data-ifx-search-trigger]');
      if (!searchTrigger && actions) {
        searchTrigger = document.createElement('button');
        searchTrigger.type = 'button';
        searchTrigger.className = 'ifx-app-header-search-trigger';
        searchTrigger.setAttribute('data-ifx-search-trigger', '');
        searchTrigger.setAttribute('aria-label', 'Tìm kiếm');
        searchTrigger.setAttribute('aria-expanded', 'false');
        searchTrigger.innerHTML = '<i class="ti ti-search"></i>';
        insertBeforeAvatar(searchTrigger);
      }

      if (!header.querySelector('[data-ifx-notif-bell]') && actions) {
        var notifWrap = document.createElement('div');
        notifWrap.className = 'ifx-dropdown ifx-app-header-notif';
        var bellBtn = document.createElement('button');
        bellBtn.type = 'button';
        bellBtn.className = 'ifx-app-header-notif-btn';
        bellBtn.setAttribute('data-ifx-notif-bell', '');
        bellBtn.setAttribute('aria-label', 'Thông báo');
        bellBtn.setAttribute('aria-expanded', 'false');
        bellBtn.innerHTML = '<i class="ti ti-bell"></i>';
        var notifMenu = document.createElement('div');
        notifMenu.className = 'ifx-dropdown-menu';
        notifMenu.setAttribute('data-ifx-notif-dropdown', '');
        notifMenu.setAttribute('data-ifx-panel', 'notifications');
        notifWrap.appendChild(bellBtn);
        notifWrap.appendChild(notifMenu);
        insertBeforeAvatar(notifWrap);
        if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.mountBell) {
          IfluxUserNotificationsUI.mountBell();
        }
      }

      if (!header.querySelector('[data-ifx-messages-btn]') && actions) {
        var msgWrapEl = document.createElement('div');
        msgWrapEl.className = 'ifx-app-header-messages';
        var msgBtnEl = document.createElement('button');
        msgBtnEl.type = 'button';
        msgBtnEl.className = 'ifx-app-header-messages-btn';
        msgBtnEl.setAttribute('data-ifx-messages-btn', '');
        msgBtnEl.setAttribute('aria-label', 'Tin nhắn');
        msgBtnEl.innerHTML = '<i class="ti ti-messages"></i>';
        msgWrapEl.appendChild(msgBtnEl);
        insertBeforeAvatar(msgWrapEl);
      }

      var notifWrap = header.querySelector('.ifx-app-header-notif');
      var bellBtn = header.querySelector('[data-ifx-notif-bell]');
      var msgWrap = header.querySelector('.ifx-app-header-messages');
      var msgBtn = header.querySelector('[data-ifx-messages-btn]');
      wireMessagesShortcut(header);

      /* Desktop + mobile: avatar luôn item cuối trong .ifx-app-header-actions (cùng vị trí desktop). */
      function orderHeaderActions() {
        if (!actions) return;
        var userMenu = actions.querySelector('.ifx-app-header-user');
        if (!userMenu) return;
        if (searchTrigger && searchTrigger.parentNode === actions) {
          userMenu.insertAdjacentElement('beforebegin', searchTrigger);
        }
        if (notifWrap && notifWrap.parentNode === actions) {
          userMenu.insertAdjacentElement('beforebegin', notifWrap);
        }
        if (msgWrap && msgWrap.parentNode === actions) {
          userMenu.insertAdjacentElement('beforebegin', msgWrap);
        }
      }

      function mountSearchWrap() {
        if (!searchWrap || !actions) return;
        if (isMobileBar()) {
          if (searchWrap.parentNode !== header) header.appendChild(searchWrap);
        } else if (searchWrap.parentNode !== actions) {
          actions.insertBefore(searchWrap, actions.firstChild);
        }
      }

      function mountNotifDropdown() {
        var notifDropdown = getNotifDropdown(header);
        if (!notifDropdown || !notifWrap) return;
        if (isMobileBar()) {
          if (notifDropdown.parentNode !== header) header.appendChild(notifDropdown);
        } else if (notifDropdown.parentNode !== notifWrap) {
          notifWrap.appendChild(notifDropdown);
        }
      }

      function openMobileNotif() {
        var notifDropdown = getNotifDropdown(header);
        if (!notifDropdown) return;
        if (window.IfluxWebUI.closeMobileNav) window.IfluxWebUI.closeMobileNav();
        closeMobileSearch(header);
        closeMobileMessages(header);
        mountNotifDropdown();
        if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
          IfluxUserNotificationsUI.renderBellPanel(header);
        }
        header.classList.add('is-notif-open');
        if (bellBtn) {
          bellBtn.setAttribute('aria-expanded', 'true');
          bellBtn.setAttribute('aria-label', 'Đóng thông báo');
          bellBtn.innerHTML = '<i class="ti ti-x"></i>';
        }
        syncTopnavActiveHeight(header);
      }

      function openSearch() {
        if (!searchWrap) return;
        if (window.IfluxWebUI.closeMobileNav) window.IfluxWebUI.closeMobileNav();
        closeMobileNotif(header);
        closeMobileMessages(header);
        mountSearchWrap();
        header.classList.add('is-search-open');
        if (searchTrigger) {
          searchTrigger.setAttribute('aria-expanded', 'true');
          searchTrigger.setAttribute('aria-label', 'Đóng tìm kiếm');
          searchTrigger.innerHTML = '<i class="ti ti-x"></i>';
        }
        if (searchInput) {
          window.setTimeout(function () {
            searchInput.focus();
          }, 60);
        }
      }

      if (bellBtn && !bellBtn._ifxMobileNotifBound) {
        bellBtn._ifxMobileNotifBound = true;
        bellBtn.addEventListener('click', function (e) {
          if (!isMobileBar()) return;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (header.classList.contains('is-notif-open')) {
            closeMobileNotif(header);
            return;
          }
          function open() { openMobileNotif(); }
          if (window.IfluxUserNotificationsUI) {
            open();
          } else if (window.IfluxWebUI && IfluxWebUI.ensureUserNotifications) {
            IfluxWebUI.ensureUserNotifications(false).then(open);
          } else {
            open();
          }
        }, true);
      }

      if (msgBtn && !msgBtn._ifxMobileMsgBound) {
        /* Icon Chat = link /tin-nhan — không mở panel mobile. */
        msgBtn._ifxMobileMsgBound = true;
      }

      if (searchTrigger && !searchTrigger._ifxSearchBound) {
        searchTrigger._ifxSearchBound = true;
        searchTrigger.addEventListener('click', function (e) {
          e.stopPropagation();
          if (!isMobileBar()) return;
          if (header.classList.contains('is-search-open')) {
            closeMobileSearch(header);
            if (searchInput) searchInput.blur();
          } else {
            openSearch();
          }
        });
      }

      document.addEventListener('click', function (e) {
        if (!isMobileBar()) return;
        if (header.classList.contains('is-search-open')) {
          if (!e.target.closest('.ifx-app-header-search') && !e.target.closest('[data-ifx-search-trigger]')) {
            closeMobileSearch(header);
          }
        }
        if (header.classList.contains('is-notif-open')) {
          if (!e.target.closest('[data-ifx-notif-dropdown]') && !e.target.closest('[data-ifx-notif-bell]')) {
            closeMobileNotif(header);
          }
        }
      });

      function onLayoutChange() {
        mountSearchWrap();
        if (isMobileBar()) {
          if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
            IfluxUserNotificationsUI.renderBellPanel(header);
          }
        }
        mountNotifDropdown();
        orderHeaderActions();
        wireMessagesShortcut(header);
        if (!isMobileBar()) {
          closeMobileSearch(header);
          closeMobileNotif(header);
          closeMobileMessages(header);
        }
        syncTopnavActiveHeight(header);
      }

      window.addEventListener('resize', onLayoutChange);
      onLayoutChange();
    });
    installHeaderChromeLazy();
  }

  /** Comments page: đổ title + likes vào .ifx-app-header sẵn có (reuse context-back). */
  function setCommentsShellHeader(opts) {
    opts = opts || {};
    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      header.setAttribute('data-ifx-header-mode', 'comments');

      var backBtn = header.querySelector('[data-ifx-context-back]');
      if (backBtn && opts.backHref) backBtn.setAttribute('data-ifx-back-href', String(opts.backHref));

      var titleEl = header.querySelector('[data-ifx-comments-title]');
      if (!titleEl) {
        titleEl = document.createElement('span');
        titleEl.setAttribute('data-ifx-comments-title', '');
        if (backBtn) backBtn.insertAdjacentElement('afterend', titleEl);
        else header.insertBefore(titleEl, header.querySelector('.ifx-app-header-actions'));
      }
      titleEl.textContent = opts.title != null ? String(opts.title) : 'Bình luận';

      var actions = header.querySelector('.ifx-app-header-actions') || header;
      var likeBtn = header.querySelector('[data-ifx-ix-post-like]');
      var showLike = opts.likes != null || typeof opts.onLike === 'function';
      if (!showLike) {
        if (likeBtn) likeBtn.remove();
      } else {
        if (!likeBtn) {
          likeBtn = document.createElement('button');
          likeBtn.type = 'button';
          likeBtn.className = 'ifx-app-header-navbtn';
          likeBtn.setAttribute('data-ifx-ix-post-like', '');
          likeBtn.setAttribute('aria-label', 'Thích');
          likeBtn.innerHTML =
            '<span class="ifx-com-side-count" data-ifx-ix-post-likes>0</span>' +
            ' <i class="ti ti-heart"></i>';
          actions.appendChild(likeBtn);
        }
        var likesEl = likeBtn.querySelector('[data-ifx-ix-post-likes]');
        if (likesEl && opts.likes != null) likesEl.textContent = String(opts.likes);
        if (typeof opts.onLike === 'function') {
          likeBtn.onclick = function (e) {
            e.preventDefault();
            opts.onLike();
          };
        }
      }

      if (header._ifxSyncContextBack) header._ifxSyncContextBack();
      else syncTopnavActiveHeight(header);
    });
  }

  window.IfluxWebUI.setCommentsShellHeader = setCommentsShellHeader;

  window.IfluxWebUI.closeMobileSearch = function () {
    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      closeMobileSearch(header);
    });
  };
  window.IfluxWebUI.closeMobileNotif = function () {
    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      closeMobileNotif(header);
    });
  };
  window.IfluxWebUI.closeMobileMessages = function () {
    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      closeMobileMessages(header);
    });
  };
  function syncMobileHeaderPanels() {
    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      var notifDropdown = getNotifDropdown(header);
      if (ifxIsMobileShell()) {
        if (notifDropdown && notifDropdown.parentNode !== header) header.appendChild(notifDropdown);
      }
      if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
        IfluxUserNotificationsUI.renderBellPanel(header);
      }
      wireMessagesShortcut(header);
    });
  }

  window.IfluxWebUI.syncMobileHeaderPanels = syncMobileHeaderPanels;

  initMobileTopbar();

  /* mobile-nav.js (User Hub panel, bottom tabbar, context/messages back) — chỉ 4 hành vi
     THỰC SỰ dành riêng cho viewport mobile (initMobileTopbar ở trên tạo icon chuông/search/
     tin nhắn dùng CHUNG desktop+mobile nên vẫn ở core). Mobile: tải ngay (giống hành vi cũ).
     Desktop: không tải — chỉ tải lần đầu nếu resize thật xuống ngưỡng mobile. */
  var mobileNavLoaded = false;
  function loadMobileNav() {
    if (mobileNavLoaded) return;
    mobileNavLoaded = true;
    var s = document.createElement('script');
    s.src = iwuAssetBase() + 'mobile-nav.js?v=r20261003b';
    document.body.appendChild(s);
  }
  if (ifxIsMobileShell()) {
    loadMobileNav();
  } else {
    window.addEventListener('resize', function onDesktopResizeCheckMobile() {
      if (ifxIsMobileShell()) {
        loadMobileNav();
        window.removeEventListener('resize', onDesktopResizeCheckMobile);
      }
    });
  }

  if (window.IfluxHeaderSearch) IfluxHeaderSearch.init();

  // Lazy Page Runtime: các tiện ích header phụ (thông báo, tin nhắn, báo lỗi nổi,
  // onboarding, one-tap) KHÔNG thuộc critical path của nội dung trang → đẩy sang
  // requestIdleCallback để trang dựng nội dung trước, các script này nạp lúc rảnh.
  function ifxDeferIdle(fn) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: 2500 });
    } else {
      setTimeout(fn, 200);
    }
  }

  function resolveWebUiBase() {
    var scripts = document.getElementsByTagName('script');
    var base = '../iflux-web-ui/';
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('iflux-web-ui.js') >= 0) {
        return src.replace(/iflux-web-ui\.js.*$/, '');
      }
    }
    return base;
  }

  function loadScriptChain(base, steps, done) {
    var idx = 0;
    function loadNext() {
      if (idx >= steps.length) {
        if (done) done();
        return;
      }
      var step = steps[idx];
      if (step.g && window[step.g]) {
        idx += 1;
        loadNext();
        return;
      }
      var s = document.createElement('script');
      s.src = base + step.src;
      s.onload = function () {
        idx += 1;
        loadNext();
      };
      s.onerror = function () {
        if (step.optional) {
          idx += 1;
          loadNext();
        }
      };
      document.body.appendChild(s);
    }
    loadNext();
  }

  /* Task5 Lazy L12 — chuông: chỉ tải khi click (không hover). */
  var notifLoadPromise = null;

  function ensureUserNotifications(openAfter) {
    if (!document.querySelector('.ifx-app-header-user') || !window.IfluxAuth || !IfluxAuth.isLoggedIn()) {
      return Promise.resolve();
    }
    function finish() {
      if (window.IfluxUserNotificationsUI) {
        IfluxUserNotificationsUI.init();
        if (window.IfluxWebUI && IfluxWebUI.syncMobileHeaderPanels) IfluxWebUI.syncMobileHeaderPanels();
      }
      if (!openAfter) return;
      var wrap = document.querySelector('.ifx-app-header-notif');
      var bell = wrap && wrap.querySelector('[data-ifx-notif-bell]');
      if (!bell || !wrap || wrap.classList.contains('open')) return;
      setTimeout(function () { bell.click(); }, 0);
    }
    if (window.IfluxInAppNotifications && window.IfluxUserNotificationsUI) {
      finish();
      return Promise.resolve();
    }
    if (!notifLoadPromise) {
      var base = resolveWebUiBase();
      notifLoadPromise = new Promise(function (resolve) {
        loadScriptChain(base, [
          { src: 'client-local-notification-types.js?v=notifPhaseD4_20260728', g: 'IfluxClientLocalNotificationTypes' },
          { src: 'inapp-notifications.js?v=notifPhaseD4_20260728', g: 'IfluxInAppNotifications' },
          { src: 'iflux-user-notifications-ui.js?v=appHeader20260928', g: 'IfluxUserNotificationsUI' }
        ], resolve);
      });
    }
    return notifLoadPromise.then(finish);
  }

  function bindHeaderChromeLazy(root, ensureFn) {
    if (!root || root.getAttribute('data-ifx-chrome-lazy')) return;
    root.setAttribute('data-ifx-chrome-lazy', '1');
    var btn = root.querySelector('[data-ifx-notif-bell]');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      if (window.IfluxUserNotificationsUI) return;
      e.preventDefault();
      e.stopPropagation();
      ensureFn(true);
    }, true);
  }

  function installHeaderChromeLazy() {
    if (!window.IfluxAuth || !IfluxAuth.isLoggedIn()) return;
    bindHeaderChromeLazy(document.querySelector('.ifx-app-header-notif'), ensureUserNotifications);
  }

  window.IfluxWebUI.installHeaderChromeLazy = installHeaderChromeLazy;
  window.IfluxWebUI.ensureUserNotifications = ensureUserNotifications;

  /* Share — design_system/04_components/28_share (DS component, dùng toàn cục) —
     không idle / shell preload. Trigger: click nút Share · hoặc Widget/Feature gọi
     ensureShareAction(). CSS nạp sẵn ở Shell Boot — JS vẫn lazy khi click. */
  var SHARE_DS = '/design_system/04_components/28_share/';
  var shareLoadPromise = null;

  function ensureShareAction() {
    var api = window.IfluxShareAction || window.IfluxInsightShare;
    if (api && window.IfluxInsightShareStore) {
      return Promise.resolve(api);
    }
    if (shareLoadPromise) return shareLoadPromise;
    var ver = 'r20261008a';
    shareLoadPromise = new Promise(function (resolve) {
      var link = document.querySelector('link[href*="04_components/28_share/share.css"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = SHARE_DS + 'share.css?v=' + ver;
        document.head.appendChild(link);
      }
      loadScriptChain(SHARE_DS, [
        { src: 'share-store.js?v=' + ver, g: 'IfluxInsightShareStore' },
        { src: 'share.js?v=' + ver, g: 'IfluxInsightShare' }
      ], function () {
        var S = window.IfluxShareAction || window.IfluxInsightShare;
        if (S && S.init) S.init();
        resolve(S);
      });
    });
    return shareLoadPromise;
  }

  function installShareActionLazy() {
    if (document.__ifxShareClickLazy) return;
    document.__ifxShareClickLazy = true;
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.ifx-insight-share-btn, [data-ifx-share-action]');
      if (!btn) return;
      /* P7-DQ-01 — Guest → Login trước khi load / chạy Share */
      if (!window.IfluxAuth || !IfluxAuth.isLoggedIn || !IfluxAuth.isLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();
        if (IfluxAuth && IfluxAuth.promptLogin) IfluxAuth.promptLogin();
        else if (window.IfxToast) IfxToast.show('Đăng nhập để chia sẻ link của bạn.', 'warning');
        return;
      }
      if (window.IfluxShareAction || window.IfluxInsightShare) return;
      e.preventDefault();
      e.stopPropagation();
      ensureShareAction().then(function (S) {
        if (!S) return;
        if (S.patchAll) S.patchAll(document);
        setTimeout(function () { btn.click(); }, 0);
      });
    }, true);
  }

  window.IfluxWebUI.ensureShareAction = ensureShareAction;
  window.IfluxWebUI.ensureInsightShare = ensureShareAction;
  installShareActionLazy();

  function loadOnboarding() {
    if (!document.querySelector('.ifx-app')) return;
    if (!window.IfluxAuth || !IfluxAuth.isLoggedIn()) return;

    var scripts = document.getElementsByTagName('script');
    var base = '../iflux-web-ui/';
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('iflux-web-ui.js') >= 0) {
        base = src.replace(/iflux-web-ui\.js.*$/, '');
        break;
      }
    }

    function boot() {
      if (window.IfluxOnboarding && IfluxOnboarding.cleanupStale) {
        IfluxOnboarding.cleanupStale();
      }
      if (window.IfluxOnboarding) {
        setTimeout(function () {
          var force = /[?&]onboarding=1(?:&|$)/.test(window.location.search);
          IfluxOnboarding.tryStart({ force: force });
        }, 300);
      }
    }

    if (window.IfluxOnboarding) {
      boot();
      return;
    }

    var s = document.createElement('script');
    s.src = base + 'iflux-onboarding.js';
    s.onload = boot;
    document.body.appendChild(s);
  }

  if (window.IfluxAuth && IfluxAuth.isLoggedIn()) {
    ifxDeferIdle(loadOnboarding);
  }

  /* Staging gate — port 8888 */
  (function () {
    if (!document.querySelector('.ifx-app') && !document.querySelector('.ifx-auth-page')) return;
    var port = window.location.port;
    if (port !== '8888' && !/[?&]iflux_env=staging/.test(window.location.search)) return;
    var parts = window.location.pathname.split('/');
    var idx = parts.indexOf('User_Web');
    var base = idx >= 0 ? parts.slice(0, idx + 1).join('/') + '/iflux-web-ui/' : '../iflux-web-ui/';
    var s = document.createElement('script');
    s.src = base + 'iflux-staging-gate.js';
    document.body.appendChild(s);
  })();
})();
