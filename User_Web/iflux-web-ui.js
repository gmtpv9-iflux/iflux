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

  /* Nhận diện thương hiệu = chữ iFlux (ix-auth-brand-name), không dùng logo SVG tự tạo */
  function patchTextBrand() {
    document.querySelectorAll('.ifx-brand-auth-logo').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('.ix-auth-brand-name').forEach(function (el) {
      el.style.display = '';
      if (!String(el.textContent || '').trim()) el.textContent = 'iFlux';
    });
    document.querySelectorAll('.ifx-topnav-brand .ix-brand-logo').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('.ifx-topnav-name').forEach(function (el) {
      if (!String(el.textContent || '').trim()) el.textContent = 'iFlux';
    });
  }
  patchTextBrand();

  function appNavigate(canonical, opts) {
    if (window.IfluxHref && IfluxHref.navigate) {
      IfluxHref.navigate(canonical, opts);
      return;
    }
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
    document.querySelectorAll('.ix-dropdown-menu [data-ifx-tier], .ifx-topnav-drawer-user [data-ifx-tier]').forEach(function (el) {
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
        if (window.ixToast) ixToast('Bạn đang dùng gói cao nhất.', 'info');
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

  /* Chỉ sau onboarding (tương tác thật) — không idle sau login. */
  document.addEventListener('iflux-onboarding-finished', function () {
    ensurePricingModal().then(function (modal) {
      if (modal && modal.tryPromptLifecycle) {
        modal.tryPromptLifecycle({ afterOnboarding: true });
      }
    });
  });

  if (window.IfluxAuth && IfluxAuth.isLoggedIn()) {
    if (IfluxAuth.syncSubscriptionLifecycle) IfluxAuth.syncSubscriptionLifecycle();
    refreshTierChips();
  }
  function findMarketLink(menu) {
    var link = menu.querySelector('a[href*="market/"]');
    if (link) return link;

    var links = menu.querySelectorAll('a.ifx-topnav-link');
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
    var exclusive = menu.querySelector('a.ifx-topnav-link--exclusive');
    if (exclusive) return exclusive;

    var link = menu.querySelector('a[href*="flow/"]');
    if (link) return link;

    if (location.pathname.indexOf('/flow/') >= 0) {
      link = menu.querySelector('a[href="index.html"]');
      if (link && /Dòng tiền/i.test(link.textContent || '')) return link;
    }

    var links = menu.querySelectorAll('a.ifx-topnav-link');
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
      '<span class="ifx-topnav-link__stack">' +
        '<span class="ifx-topnav-chip">Độc quyền</span>' +
        '<span class="ifx-topnav-link__label">Dòng tiền</span>' +
      '</span>'
    );
  }

  function upgradeFlowNavLink(link, onFlow) {
    if (!link) return;
    if (link.getAttribute('data-ifx-flow-nav') === '1' || link.classList.contains('ifx-topnav-link--exclusive')) {
      link.classList.toggle('active', !!onFlow);
      return;
    }
    link.className = 'ifx-topnav-link ifx-topnav-link--exclusive' + (onFlow ? ' active' : '');
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
    document.querySelectorAll('.ifx-topnav-menu a[href*="alerts/"]').forEach(function (a) {
      a.style.display = 'none';
    });

    var onFlow = location.pathname.indexOf('/flow/') >= 0;

    document.querySelectorAll('.ifx-topnav-menu').forEach(function (menu) {
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
        marketLink.classList.remove('active');
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
    a.className = 'ix-dropdown-item';
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

  /* Menu avatar chuẩn: hover mở menu (CSS), click avatar → /account. */
  function patchUserMenu() {
    document.querySelectorAll('.ifx-user-menu').forEach(function (menu) {
      var dropdown = menu.querySelector('.ix-dropdown-menu');
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
      divider.className = 'ix-dropdown-divider';
      frag.appendChild(divider);

      if (logoutItem) {
        frag.appendChild(logoutItem);
      } else {
        var lo = document.createElement('a');
        lo.className = 'ix-dropdown-item';
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

      var avatar = menu.querySelector('.ix-avatar');
      if (avatar) {
        avatar.style.cursor = 'pointer';
        avatar.setAttribute('title', 'Trang cá nhân');
      }
    });
    /* Xóa chip cấp thành viên khỏi header (không ẩn — xóa DOM). Tier chỉ còn trong menu avatar nếu có. */
    document.querySelectorAll('.ifx-topnav-actions > [data-ifx-tier], .ifx-topnav-actions > .ix-chip[data-ifx-tier]').forEach(function (el) {
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
          { global: 'IfluxFeatureSuggestionsUI', file: 'feature-suggestions-ui.js' }
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
          { global: 'IfluxBugReportsUI', file: 'bug-reports-ui.js' }
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
     Menu vẫn mở khi hover (CSS). Chỉ áp dụng cho avatar trong .ifx-user-menu
     (không đụng avatar đã chuyển vào drawer mobile). */
  function bindAvatarNav() {
    if (document._ifxAvatarNavBound) return;
    document._ifxAvatarNavBound = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var avatar = t.closest('.ifx-user-menu .ix-avatar');
      if (!avatar) return;
      e.preventDefault();
      e.stopPropagation();
      /* Mobile: toggle User Hub full-page (tap lần nữa để đóng). Desktop: hover xem menu,
         click → trang cá nhân. */
      var header = avatar.closest('.ifx-topnav');
      if (window.innerWidth <= 1023.98 && header && header._ifxOpenUserHub) {
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

  var mobileNavControllers = [];

  function syncTopnavActiveHeight(header) {
    var h = header && header.offsetHeight ? header.offsetHeight : 56;
    document.documentElement.style.setProperty('--ifx-topnav-active-h', h + 'px');
  }

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
    return resolveHeaderDropdown(header, '.ifx-topnav-notif', 'data-ifx-notif-dropdown');
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
    var wrap = header.querySelector('.ifx-topnav-messages');
    if (wrap) {
      wrap.classList.remove('ix-dropdown', 'open');
      header.classList.remove('ifx-topnav--messages-open');
    }
    var btn = header.querySelector('[data-ifx-messages-btn]');
    if (!btn || btn._ifxMsgNavBound) return;
    btn._ifxMsgNavBound = true;
    btn.removeAttribute('aria-expanded');
    btn.removeAttribute('data-ix-toggle');
    /* Giữ nguyên button + icon ti-messages — chỉ đổi hành vi click. */
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      appNavigate(messagesPageHref());
    }, true);
  }

  function closeMobileSearch(header) {
    if (!header) {
      document.querySelectorAll('.ifx-topnav--search-open').forEach(closeMobileSearch);
      return;
    }
    header.classList.remove('ifx-topnav--search-open');
    var trigger = header.querySelector('[data-ifx-search-trigger]');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', 'Tìm kiếm');
      trigger.innerHTML = '<i class="ti ti-search"></i>';
    }
  }

  function closeMobileNotif(header) {
    if (!header) {
      document.querySelectorAll('.ifx-topnav--notif-open').forEach(closeMobileNotif);
      document.querySelectorAll('.ifx-topnav-notif.open').forEach(function (n) {
        n.classList.remove('open');
      });
      return;
    }
    header.classList.remove('ifx-topnav--notif-open');
    var bellBtn = header.querySelector('[data-ifx-notif-bell]');
    if (bellBtn) {
      bellBtn.setAttribute('aria-expanded', 'false');
      bellBtn.setAttribute('aria-label', 'Thông báo');
      bellBtn.innerHTML = '<i class="ti ti-bell"></i>';
    }
    var notifWrap = header.querySelector('.ifx-topnav-notif');
    if (notifWrap) notifWrap.classList.remove('open');
  }

  function closeMobileMessages(header) {
    if (!header) {
      document.querySelectorAll('.ifx-topnav--messages-open').forEach(closeMobileMessages);
      document.querySelectorAll('.ifx-topnav-messages.open').forEach(function (n) {
        n.classList.remove('open');
      });
      return;
    }
    header.classList.remove('ifx-topnav--messages-open');
    var msgBtn = header.querySelector('[data-ifx-messages-btn]');
    if (msgBtn) {
      msgBtn.setAttribute('aria-expanded', 'false');
      msgBtn.setAttribute('aria-label', 'Tin nhắn');
      msgBtn.innerHTML = '<i class="ti ti-messages"></i>';
    }
    var msgWrap = header.querySelector('.ifx-topnav-messages');
    if (msgWrap) msgWrap.classList.remove('open');
  }

  /* ĐỢT 2 — Mobile User Hub (thay hamburger cũ).
   * Trên mobile Primary Nav đã ở bottom bar → header KHÔNG cần hamburger + drawer nav.
   * Avatar (mobile) tap → mở panel User Hub full-page (tái dùng class .ifx-topnav-menu
   * cho style drawer, đã chỉnh full-width), header hiện nút Back. Consumer thuần của
   * IfluxAppShell.getUserHub(). KHÔNG tạo class DS mới. */
  function initMobileUserHub() {
    var DRAWER_MAX = 1023.98;
    function isMobile() { return window.innerWidth <= DRAWER_MAX; }

    document.querySelectorAll('.ifx-topnav').forEach(function (header, idx) {
      if (header.getAttribute('data-ifx-userhub') === '1') return;
      header.setAttribute('data-ifx-userhub', '1');

      var brand = header.querySelector('.ifx-topnav-brand');

      var overlay = document.createElement('div');
      overlay.className = 'ifx-topnav-overlay';
      overlay.setAttribute('data-ifx-nav-overlay', '');
      document.body.appendChild(overlay);

      /* Panel User Hub — tái dùng class drawer .ifx-topnav-menu (full-page trên mobile). */
      var panel = document.createElement('nav');
      panel.className = 'ifx-topnav-menu';
      panel.id = 'ifx-user-hub-' + idx;
      panel.setAttribute('aria-label', 'Menu cá nhân');
      document.body.appendChild(panel);

      /* Nút Back — tái dùng .ifx-topnav-navbtn.ix-nav-btn, chỉ hiện khi hub mở. */
      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ifx-topnav-navbtn ix-nav-btn';
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
        divider.className = 'ix-dropdown-divider';
        frag.appendChild(divider);
        var lo = document.createElement('a');
        lo.className = 'ix-dropdown-item';
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
          closeMobileSearch(header);
        closeMobileNotif(header);
        closeMobileMessages(header);
        }
        panel.classList.toggle('is-open', open);
        overlay.classList.toggle('is-visible', open);
        header.classList.toggle('ifx-topnav--nav-open', open);
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

      /* Cho initMobileTopbar đóng hub khi mở tìm kiếm/thông báo/tin nhắn. */
      mobileNavControllers.push({
        setOpen: setOpen,
        isDrawerMode: isMobile,
        header: header
      });
      /* Toggle: tap avatar lần nữa (khi đang mở) sẽ đóng hub — cùng nút Back. */
      header._ifxOpenUserHub = function () { setOpen(!panel.classList.contains('is-open')); };
    });
  }

  function initMobileTopbar() {
    var DRAWER_MAX = 1023.98;

    function isMobileBar() {
      return window.innerWidth <= DRAWER_MAX;
    }

    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      if (header.getAttribute('data-ifx-mobile-bar') === '1') return;
      header.setAttribute('data-ifx-mobile-bar', '1');

      var actions = header.querySelector('.ifx-topnav-actions');
      var searchWrap = actions && actions.querySelector('.ifx-topnav-search-wrap');
      var searchInput = searchWrap && searchWrap.querySelector('input');

      function insertBeforeAvatar(el) {
        if (!actions || !el) return;
        var um = actions.querySelector('.ifx-user-menu');
        if (um && um.parentNode === actions) um.insertAdjacentElement('beforebegin', el);
        else actions.appendChild(el);
      }

      var searchTrigger = header.querySelector('[data-ifx-search-trigger]');
      if (!searchTrigger && actions) {
        searchTrigger = document.createElement('button');
        searchTrigger.type = 'button';
        searchTrigger.className = 'ifx-topnav-search-trigger ix-nav-btn';
        searchTrigger.setAttribute('data-ifx-search-trigger', '');
        searchTrigger.setAttribute('aria-label', 'Tìm kiếm');
        searchTrigger.setAttribute('aria-expanded', 'false');
        searchTrigger.innerHTML = '<i class="ti ti-search"></i>';
        insertBeforeAvatar(searchTrigger);
      }

      if (!header.querySelector('[data-ifx-notif-bell]') && actions) {
        var notifWrap = document.createElement('div');
        notifWrap.className = 'ix-dropdown ifx-topnav-notif';
        var bellBtn = document.createElement('button');
        bellBtn.type = 'button';
        bellBtn.className = 'ifx-topnav-notif-btn ix-nav-btn';
        bellBtn.setAttribute('data-ifx-notif-bell', '');
        bellBtn.setAttribute('aria-label', 'Thông báo');
        bellBtn.setAttribute('aria-expanded', 'false');
        bellBtn.innerHTML = '<i class="ti ti-bell"></i>';
        var notifMenu = document.createElement('div');
        notifMenu.className = 'ix-dropdown-menu';
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
        msgWrapEl.className = 'ifx-topnav-messages';
        var msgBtnEl = document.createElement('button');
        msgBtnEl.type = 'button';
        msgBtnEl.className = 'ifx-topnav-messages-btn ix-nav-btn';
        msgBtnEl.setAttribute('data-ifx-messages-btn', '');
        msgBtnEl.setAttribute('aria-label', 'Tin nhắn');
        msgBtnEl.innerHTML = '<i class="ti ti-messages"></i>';
        msgWrapEl.appendChild(msgBtnEl);
        insertBeforeAvatar(msgWrapEl);
      }

      var notifWrap = header.querySelector('.ifx-topnav-notif');
      var bellBtn = header.querySelector('[data-ifx-notif-bell]');
      var msgWrap = header.querySelector('.ifx-topnav-messages');
      var msgBtn = header.querySelector('[data-ifx-messages-btn]');
      wireMessagesShortcut(header);

      /* Desktop + mobile: avatar luôn item cuối trong .ifx-topnav-actions (cùng vị trí desktop). */
      function orderHeaderActions() {
        if (!actions) return;
        var userMenu = actions.querySelector('.ifx-user-menu');
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
        mobileNavControllers.forEach(function (ctrl) {
          if (ctrl.header !== header) return;
          ctrl.setOpen(false);
        });
        closeMobileSearch(header);
        closeMobileMessages(header);
        mountNotifDropdown();
        if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
          IfluxUserNotificationsUI.renderBellPanel(header);
        }
        header.classList.add('ifx-topnav--notif-open');
        if (bellBtn) {
          bellBtn.setAttribute('aria-expanded', 'true');
          bellBtn.setAttribute('aria-label', 'Đóng thông báo');
          bellBtn.innerHTML = '<i class="ti ti-x"></i>';
        }
        syncTopnavActiveHeight(header);
      }

      function openSearch() {
        if (!searchWrap) return;
        mobileNavControllers.forEach(function (ctrl) {
          if (ctrl.header !== header) return;
          ctrl.setOpen(false);
        });
        closeMobileNotif(header);
        closeMobileMessages(header);
        mountSearchWrap();
        header.classList.add('ifx-topnav--search-open');
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
          if (header.classList.contains('ifx-topnav--notif-open')) {
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
          if (header.classList.contains('ifx-topnav--search-open')) {
            closeMobileSearch(header);
            if (searchInput) searchInput.blur();
          } else {
            openSearch();
          }
        });
      }

      document.addEventListener('click', function (e) {
        if (!isMobileBar()) return;
        if (header.classList.contains('ifx-topnav--search-open')) {
          if (!e.target.closest('.ifx-topnav-search-wrap') && !e.target.closest('[data-ifx-search-trigger]')) {
            closeMobileSearch(header);
          }
        }
        if (header.classList.contains('ifx-topnav--notif-open')) {
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

  function initMobileTabbar() {
    if (!document.querySelector('.ifx-app')) return;

    var DRAWER_MAX = 1023.98;
    function isMobileBar() { return window.innerWidth <= DRAWER_MAX; }

    var bar = document.getElementById('ifx-mobile-tabbar');
    if (!bar) {
      bar = document.createElement('nav');
    bar.id = 'ifx-mobile-tabbar';
    bar.className = 'ifx-mobile-tabbar';
    bar.setAttribute('aria-label', 'Điều hướng chính');
      document.body.appendChild(bar);
    }

    var SHORT = { dashboard: 'Nhà' };
    var ORDER = ['dashboard', 'market', 'community', 'flow', 'pricing'];

    function tabbarItemHtml(it, label) {
      var chip = it.exclusive ? '<span class="ifx-mobile-tabbar__chip">ĐỘC QUYỀN</span>' : '';
      return (
        '<span class="ifx-mobile-tabbar__icon-wrap">' +
          chip +
          '<span class="ifx-mobile-tabbar__fab"><i class="ti ' + it.icon + '"></i></span>' +
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
        link.className = 'ifx-mobile-tabbar__item' + (it.active ? ' is-active' : '');
        if (mode === 'primary' && it.exclusive) link.className += ' ifx-mobile-tabbar__item--flow';
        var badge = '';
        if (mode === 'context' && it.key === 'comments' && commentN && commentN !== '0') {
          badge = '<span class="ifx-mobile-tabbar__comment-count' + (it.active ? ' is-active' : '') + '">' + commentN + '</span>';
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
            } else {
              if (window.IfluxAppShell && IfluxAppShell.syncAccountProfileTabUrl) {
                IfluxAppShell.syncAccountProfileTabUrl(tabId);
              }
              var tabBtn = document.querySelector('[data-ix-profile-tab="' + tabId + '"]');
              if (tabBtn) tabBtn.click();
            }
            syncMobileTabbar();
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
        slot.className = 'ifx-mobile-tabbar__ix';
        bar.appendChild(slot);
      } else {
        if (entities.parentNode !== bar) {
          bar.insertBefore(entities, slot);
        } else if (slot.previousElementSibling !== entities) {
          bar.insertBefore(entities, slot);
        }
      }
      try {
        document.dispatchEvent(new CustomEvent('iflux-ix-bottom-slot-ready'));
      } catch (e) { /* ignore */ }
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
      if (ctx && ctx.entityType === 'communityPost') {
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
      document.querySelectorAll('.ifx-topnav').forEach(function (header) {
        if (header._ifxSyncContextBack) header._ifxSyncContextBack();
      });
    }

    window.IfluxWebUI.syncMobileTabbar = syncMobileTabbar;
    window.IfluxWebUI.ensureArticleIxBottomSlot = ensureArticleIxBottomSlot;
    syncMobileTabbar();
    window.addEventListener('resize', syncMobileTabbar);
    document.addEventListener('iflux-context-ready', syncMobileTabbar);
  }

  /* ĐỢT 2 — Nút Back header khi CONTEXT mode (mobile). Khác User Hub back (chỉ khi hub mở). */
  function initMobileContextBack() {
    var DRAWER_MAX = 1023.98;
    function isMobile() { return window.innerWidth <= DRAWER_MAX; }
    function isMessagesPage() {
      var path = '';
      try { path = (window.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
      return /\/(tin-nhan|messages)(\/|$)/.test(path) || /\/User_Web\/messages\//.test(path);
    }

    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      if (header.getAttribute('data-ifx-context-back-init') === '1') return;
      header.setAttribute('data-ifx-context-back-init', '1');

      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ifx-topnav-navbtn ix-nav-btn';
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
        var hubOpen = header.classList.contains('ifx-topnav--nav-open');
        backBtn.style.display = ((isCtx || isComments) && !hubOpen && !isMessagesPage()) ? 'flex' : 'none';
        syncTopnavActiveHeight(header);
      }

      header._ifxSyncContextBack = applyMode;
      window.addEventListener('resize', applyMode);
      applyMode();
    });
  }

  /** Comments page: đổ title + likes vào .ifx-topnav sẵn có (reuse context-back). */
  function setCommentsShellHeader(opts) {
    opts = opts || {};
    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      header.setAttribute('data-ifx-header-mode', 'comments');

      var backBtn = header.querySelector('[data-ifx-context-back]');
      if (backBtn && opts.backHref) backBtn.setAttribute('data-ifx-back-href', String(opts.backHref));

      var titleEl = header.querySelector('[data-ifx-comments-title]');
      if (!titleEl) {
        titleEl = document.createElement('span');
        titleEl.className = 'ifx-topnav-name';
        titleEl.setAttribute('data-ifx-comments-title', '');
        if (backBtn) backBtn.insertAdjacentElement('afterend', titleEl);
        else header.insertBefore(titleEl, header.querySelector('.ifx-topnav-actions'));
      }
      titleEl.textContent = opts.title != null ? String(opts.title) : 'Bình luận';

      var actions = header.querySelector('.ifx-topnav-actions') || header;
      var likeBtn = header.querySelector('[data-ifx-ix-post-like]');
      var showLike = opts.likes != null || typeof opts.onLike === 'function';
      if (!showLike) {
        if (likeBtn) likeBtn.remove();
      } else {
        if (!likeBtn) {
          likeBtn = document.createElement('button');
          likeBtn.type = 'button';
          likeBtn.className = 'ifx-topnav-navbtn ix-nav-btn';
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

  /* Mobile — trang Tin nhắn (/tin-nhan): nút Back App Shell đồng bộ stack chat. */
  function initMobileMessagesShell() {
    var DRAWER_MAX = 1023.98;
    function isMobile() { return window.innerWidth <= DRAWER_MAX; }
    function isMessagesPage() {
      var path = '';
      try { path = (window.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
      return /\/(tin-nhan|messages)(\/|$)/.test(path) || /\/User_Web\/messages\//.test(path);
    }

    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      if (header.getAttribute('data-ifx-msg-shell') === '1') return;
      header.setAttribute('data-ifx-msg-shell', '1');

      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ifx-topnav-navbtn ix-nav-btn';
      backBtn.setAttribute('aria-label', 'Quay lại');
      backBtn.setAttribute('data-ifx-messages-back', '');
      backBtn.innerHTML = '<i class="ti ti-arrow-left"></i>';
      backBtn.style.display = 'none';

      var ctxBack = header.querySelector('[data-ifx-context-back]');
      if (ctxBack) ctxBack.insertAdjacentElement('afterend', backBtn);
      else header.insertBefore(backBtn, header.firstChild);

      function applyMode() {
        var show = isMobile() && isMessagesPage();
        var hubOpen = header.classList.contains('ifx-topnav--nav-open');
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
        else appNavigate((window.IfluxRoutes && IfluxRoutes.to) ? IfluxRoutes.to('home', { canonical: true, skipDecorate: true }) : '/nha-cua-toi');
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

  window.IfluxWebUI.closeMobileSearch = function () {
    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      closeMobileSearch(header);
    });
  };
  window.IfluxWebUI.closeMobileNotif = function () {
    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      closeMobileNotif(header);
    });
  };
  window.IfluxWebUI.closeMobileMessages = function () {
    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      closeMobileMessages(header);
    });
  };
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
      var open = ctrl.header && ctrl.header.classList.contains('ifx-topnav--nav-open');
      ctrl.setOpen(!open);
    });
  };

  function syncMobileHeaderPanels() {
    document.querySelectorAll('.ifx-topnav').forEach(function (header) {
      var notifDropdown = getNotifDropdown(header);
      if (window.innerWidth <= 1023.98) {
        if (notifDropdown && notifDropdown.parentNode !== header) header.appendChild(notifDropdown);
      }
      if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
        IfluxUserNotificationsUI.renderBellPanel(header);
      }
      wireMessagesShortcut(header);
    });
  }

  window.IfluxWebUI.syncMobileHeaderPanels = syncMobileHeaderPanels;

  initMobileUserHub();
  initMobileContextBack();
  initMobileMessagesShell();
  initMobileTopbar();
  initMobileTabbar();

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
    if (!document.querySelector('.ifx-user-menu') || !window.IfluxAuth || !IfluxAuth.isLoggedIn()) {
      return Promise.resolve();
    }
    function finish() {
      if (window.IfluxUserNotificationsUI) {
        IfluxUserNotificationsUI.init();
        if (window.IfluxWebUI && IfluxWebUI.syncMobileHeaderPanels) IfluxWebUI.syncMobileHeaderPanels();
      }
      if (!openAfter) return;
      var wrap = document.querySelector('.ifx-topnav-notif');
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
          { src: 'inapp-notifications.js?v=fn00120260724', g: 'IfluxInAppNotifications' },
          { src: 'iflux-user-notifications-ui.js?v=fn00120260724', g: 'IfluxUserNotificationsUI' }
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
    bindHeaderChromeLazy(document.querySelector('.ifx-topnav-notif'), ensureUserNotifications);
  }

  window.IfluxWebUI.installHeaderChromeLazy = installHeaderChromeLazy;
  window.IfluxWebUI.ensureUserNotifications = ensureUserNotifications;

  /* Foundation Share Action — không idle / shell preload.
     Trigger: click nút Share · hoặc Widget/Feature gọi ensureShareAction(). */
  var FOUNDATION = '/Admin_Design_system/iflux-admin-ui/foundation/';
  var shareLoadPromise = null;

  function ensureShareAction() {
    var api = window.IfluxShareAction || window.IfluxInsightShare;
    if (api && window.IfluxInsightShareStore) {
      return Promise.resolve(api);
    }
    if (shareLoadPromise) return shareLoadPromise;
    var ver = 'shareBndWP2_20260727';
    shareLoadPromise = new Promise(function (resolve) {
      var link = document.querySelector('link[href*="share-action.css"], link[href*="insight-share.css"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FOUNDATION + 'share-action.css?v=' + ver;
        document.head.appendChild(link);
      }
      loadScriptChain(FOUNDATION, [
        { src: 'share-action-store.js?v=' + ver, g: 'IfluxInsightShareStore' },
        { src: 'share-action.js?v=' + ver, g: 'IfluxInsightShare' }
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

  /* Google One Tap — đề xuất đăng ký/đăng nhập Google cho khách khi vào web. */
  function loadGoogleOneTap() {
    if (!document.querySelector('.ifx-app')) return;
    if (window.IfluxAuth && IfluxAuth.isLoggedIn && IfluxAuth.isLoggedIn()) return;
    if (/\/auth\//.test(window.location.pathname)) return;
    if (window.IfluxData && IfluxData.isApi && !IfluxData.isApi()) return;
    if (window.IfluxGoogleOneTap) { IfluxGoogleOneTap.boot(); return; }
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
    var s = document.createElement('script');
    s.src = base + 'google-onetap.js';
    document.body.appendChild(s);
  }

  ifxDeferIdle(loadGoogleOneTap);

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
