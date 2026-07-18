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
      window.location.href = base;
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
    document.querySelectorAll('[data-ifx-tier]').forEach(function (el) {
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

    var parts = location.pathname.split('/');
    var idx = parts.indexOf('User_Web');
    if (idx >= 0) {
      return parts.slice(0, idx + 1).join('/') + '/pricing/index.html' + (q.length ? '?' + q.join('&') : '');
    }
    return '../pricing/index.html' + (q.length ? '?' + q.join('&') : '');
  }

  document.querySelectorAll('[data-ifx-pricing-open]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.IfluxWebUI.openPricing(JSON.parse(el.getAttribute('data-ifx-pricing-open') || '{}'));
    });
  });

  window.IfluxWebUI = window.IfluxWebUI || {};
  window.IfluxWebUI.refreshTierChips = refreshTierChips;
  window.IfluxWebUI.pricingPageUrl = pricingPageUrl;
  window.IfluxWebUI.syncTopnav = syncTopnav;
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
    window.location.href = pricingPageUrl(opts);
  };

  function checkSubscriptionLifecyclePrompts(opts) {
    opts = opts || {};
    if (!window.IfluxAuth || !IfluxAuth.isLoggedIn()) return;
    if (window.IfluxPricingModal && IfluxPricingModal.tryPromptLifecycle) {
      IfluxPricingModal.tryPromptLifecycle(opts);
      return;
    }
    if (location.pathname.indexOf('/pricing/') >= 0) return;
    var sub = IfluxAuth.getSubscriptionState ? IfluxAuth.getSubscriptionState() : 'free';
    if (sub !== 'expired') return;
    try {
      if (sessionStorage.getItem('iflux_pricing_entry_dismissed') === '1') return;
    } catch (e) { /* ignore */ }
    window.location.href = pricingPageUrl({ mode: 'expired' });
  }

  function loadPricingModalAndPrompts(opts) {
    opts = opts || {};
    function boot() {
      checkSubscriptionLifecyclePrompts(opts);
    }
    if (window.IfluxPricingModal) {
      boot();
      return;
    }
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
    s.src = base + 'iflux-pricing-modal.js';
    s.onload = boot;
    document.body.appendChild(s);
  }

  if (window.IfluxAuth && IfluxAuth.isLoggedIn()) {
    if (IfluxAuth.syncSubscriptionLifecycle) IfluxAuth.syncSubscriptionLifecycle();
    refreshTierChips();
    loadPricingModalAndPrompts({ allowTrialOffer: true });
  }

  document.addEventListener('iflux-onboarding-finished', function () {
    loadPricingModalAndPrompts({ afterOnboarding: true });
  });

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
      a.href = it.href || '/tai-khoan';
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
      a.href = it.href;
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
          window.location.href = (window.IfluxRoutes && IfluxRoutes.siteRoot) ? IfluxRoutes.siteRoot() : '/';
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
    /* Cấp thành viên đã chuyển vào menu avatar (dòng "Chào …") → ẩn chip lẻ trên topnav */
    document.querySelectorAll('.ifx-topnav-actions [data-ifx-tier]').forEach(function (el) {
      if (!el.closest('.ix-dropdown-menu')) el.style.display = 'none';
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
      window.location.href = '/tai-khoan';
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

  function getMsgDropdown(header) {
    return resolveHeaderDropdown(header, '.ifx-topnav-messages', 'data-ifx-messages-dropdown');
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
          window.location.href = (window.IfluxRoutes && IfluxRoutes.siteRoot) ? IfluxRoutes.siteRoot() : '/';
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
        msgWrapEl.className = 'ix-dropdown ifx-topnav-messages';
        var msgBtnEl = document.createElement('button');
        msgBtnEl.type = 'button';
        msgBtnEl.className = 'ifx-topnav-messages-btn ix-nav-btn';
        msgBtnEl.setAttribute('data-ifx-messages-btn', '');
        msgBtnEl.setAttribute('aria-label', 'Tin nhắn');
        msgBtnEl.setAttribute('aria-expanded', 'false');
        msgBtnEl.innerHTML = '<i class="ti ti-messages"></i>';
        var msgMenuEl = document.createElement('div');
        msgMenuEl.className = 'ix-dropdown-menu';
        msgMenuEl.setAttribute('data-ifx-messages-dropdown', '');
        msgMenuEl.setAttribute('data-ifx-panel', 'messages');
        msgWrapEl.appendChild(msgBtnEl);
        msgWrapEl.appendChild(msgMenuEl);
        insertBeforeAvatar(msgWrapEl);
        if (window.IfluxHeaderMessagesUI && IfluxHeaderMessagesUI.mountMessages) {
          IfluxHeaderMessagesUI.mountMessages();
        }
      }

      var notifWrap = header.querySelector('.ifx-topnav-notif');
      var bellBtn = header.querySelector('[data-ifx-notif-bell]');
      var msgWrap = header.querySelector('.ifx-topnav-messages');
      var msgBtn = header.querySelector('[data-ifx-messages-btn]');

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

      function mountMsgDropdown() {
        var msgDropdown = getMsgDropdown(header);
        if (!msgDropdown || !msgWrap) return;
        if (isMobileBar()) {
          if (msgDropdown.parentNode !== header) header.appendChild(msgDropdown);
        } else if (msgDropdown.parentNode !== msgWrap) {
          msgWrap.appendChild(msgDropdown);
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

      function openMobileMessages() {
        var msgDropdown = getMsgDropdown(header);
        if (!msgDropdown) return;
        mobileNavControllers.forEach(function (ctrl) {
          if (ctrl.header !== header) return;
          ctrl.setOpen(false);
        });
        closeMobileSearch(header);
        closeMobileNotif(header);
        mountMsgDropdown();
        if (window.IfluxHeaderMessagesUI && IfluxHeaderMessagesUI.renderMessagesPanel) {
          IfluxHeaderMessagesUI.renderMessagesPanel(header);
        }
        header.classList.add('ifx-topnav--messages-open');
        if (msgBtn) {
          msgBtn.setAttribute('aria-expanded', 'true');
          msgBtn.setAttribute('aria-label', 'Đóng tin nhắn');
          msgBtn.innerHTML = '<i class="ti ti-x"></i>';
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
          } else {
            openMobileNotif();
          }
        }, true);
      }

      if (msgBtn && !msgBtn._ifxMobileMsgBound) {
        msgBtn._ifxMobileMsgBound = true;
        msgBtn.addEventListener('click', function (e) {
          if (!isMobileBar()) return;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (header.classList.contains('ifx-topnav--messages-open')) {
            closeMobileMessages(header);
          } else {
            openMobileMessages();
          }
        }, true);
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
        if (header.classList.contains('ifx-topnav--messages-open')) {
          if (!e.target.closest('[data-ifx-messages-dropdown]') && !e.target.closest('[data-ifx-messages-btn]')) {
            closeMobileMessages(header);
          }
        }
      });

      function onLayoutChange() {
        mountSearchWrap();
        if (isMobileBar()) {
          if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
            IfluxUserNotificationsUI.renderBellPanel(header);
          }
          if (window.IfluxHeaderMessagesUI && IfluxHeaderMessagesUI.renderMessagesPanel) {
            IfluxHeaderMessagesUI.renderMessagesPanel(header);
          }
        }
        mountNotifDropdown();
        mountMsgDropdown();
        orderHeaderActions();
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

    function renderPrimary(items) {
      bar.innerHTML = '';
      bar.setAttribute('aria-label', 'Điều hướng chính');
      bar.removeAttribute('data-ifx-tabbar-mode');
      var byKey = {};
      items.forEach(function (it) { byKey[it.key] = it; });
      var ordered = ORDER.map(function (k) { return byKey[k]; }).filter(Boolean);
      items.forEach(function (it) { if (ORDER.indexOf(it.key) < 0) ordered.push(it); });
      ordered.forEach(function (it) {
        var link = document.createElement('a');
        link.href = it.href;
        link.className = 'ifx-mobile-tabbar__item' + (it.active ? ' is-active' : '');
        if (it.exclusive) link.className += ' ifx-mobile-tabbar__item--flow';
        link.innerHTML = tabbarItemHtml(it, SHORT[it.key] || it.label);
      bar.appendChild(link);
    });
    }

    function renderContext(items) {
      bar.innerHTML = '';
      bar.setAttribute('aria-label', 'Tab chi tiết');
      bar.setAttribute('data-ifx-tabbar-mode', 'context');
      var countEl = document.querySelector('[data-ec-comment-count]');
      var commentN = countEl ? String(countEl.textContent || '').trim() : '';
      items.forEach(function (it) {
        var link = document.createElement('a');
        link.href = '#';
        link.className = 'ifx-mobile-tabbar__item' + (it.active ? ' is-active' : '');
        link.setAttribute('data-ifx-context-tab', it.key);
        var badge = '';
        if (it.key === 'comments' && commentN && commentN !== '0') {
          badge = '<span class="ifx-mobile-tabbar__comment-count' + (it.active ? ' is-active' : '') + '">' + commentN + '</span>';
        }
        link.innerHTML = tabbarItemHtml(it, it.label) + badge;
        link.addEventListener('click', function (e) {
          e.preventDefault();
          activateContextTab(it.key);
          syncMobileTabbar();
        });
        bar.appendChild(link);
      });
    }

    function syncMobileTabbar() {
      var shell = window.IfluxAppShell;
      if (!isMobileBar() || !shell) return;
      if (shell.getNavMode && shell.getNavMode() === 'CONTEXT' && document.querySelector('[data-ec-tabs]')) {
        var ctx = shell.detectContext ? shell.detectContext() : null;
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
        var items = (shell.getPrimaryNav) ? shell.getPrimaryNav() : [];
        if (items.length) renderPrimary(items);
      }
      document.querySelectorAll('.ifx-topnav').forEach(function (header) {
        if (header._ifxSyncContextBack) header._ifxSyncContextBack();
      });
    }

    window.IfluxWebUI.syncMobileTabbar = syncMobileTabbar;
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
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        var href = (window.IfluxAppShell && IfluxAppShell.getBackHref)
          ? IfluxAppShell.getBackHref()
          : '/';
        window.location.href = href;
      });

      function applyMode() {
        var shell = window.IfluxAppShell;
        var isCtx = isMobile() && shell && shell.getNavMode && shell.getNavMode() === 'CONTEXT';
        var hubOpen = header.classList.contains('ifx-topnav--nav-open');
        backBtn.style.display = (isCtx && !hubOpen && !isMessagesPage()) ? 'flex' : 'none';
        syncTopnavActiveHeight(header);
      }

      header._ifxSyncContextBack = applyMode;
      window.addEventListener('resize', applyMode);
      applyMode();
    });
  }

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
        else window.location.href = (window.IfluxRoutes && IfluxRoutes.to) ? IfluxRoutes.to('home', { canonical: true }) : '/nha-cua-toi';
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
      var msgDropdown = getMsgDropdown(header);
      if (window.innerWidth <= 1023.98) {
        if (notifDropdown && notifDropdown.parentNode !== header) header.appendChild(notifDropdown);
        if (msgDropdown && msgDropdown.parentNode !== header) header.appendChild(msgDropdown);
      }
      if (window.IfluxUserNotificationsUI && IfluxUserNotificationsUI.renderBellPanel) {
        IfluxUserNotificationsUI.renderBellPanel(header);
      }
      if (window.IfluxHeaderMessagesUI && IfluxHeaderMessagesUI.renderMessagesPanel) {
        IfluxHeaderMessagesUI.renderMessagesPanel(header);
      }
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

  function loadUserNotifications() {
    if (!document.querySelector('.ifx-user-menu') || !window.IfluxAuth || !IfluxAuth.isLoggedIn()) return;
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
      if (window.IfluxUserNotificationsUI) {
        IfluxUserNotificationsUI.init();
        if (window.IfluxWebUI && IfluxWebUI.syncMobileHeaderPanels) IfluxWebUI.syncMobileHeaderPanels();
      }
    }
    if (window.IfluxInAppNotifications && window.IfluxUserNotificationsUI) {
      boot();
      return;
    }
    var chain = ['inapp-notifications.js', 'iflux-user-notifications-ui.js'];
    var idx = 0;
    function loadNext() {
      if (idx >= chain.length) {
        boot();
        return;
      }
      if (chain[idx] === 'inapp-notifications.js' && window.IfluxInAppNotifications) {
        idx += 1;
        loadNext();
        return;
      }
      if (chain[idx] === 'iflux-user-notifications-ui.js' && window.IfluxUserNotificationsUI) {
        idx += 1;
        loadNext();
        return;
      }
      var s = document.createElement('script');
      s.src = base + chain[idx];
      s.onload = function () {
        idx += 1;
        loadNext();
      };
      document.body.appendChild(s);
    }
    loadNext();
  }

  ifxDeferIdle(loadUserNotifications);

  function loadHeaderMessages() {
    if (!document.querySelector('.ifx-app')) return;
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
      if (window.IfluxHeaderMessagesUI) {
        IfluxHeaderMessagesUI.init();
        syncMobileHeaderPanels();
      }
    }
    if (window.IfluxHeaderMessagesUI) {
      boot();
      return;
    }
    var chain = ['profile-chat-store.js', 'iflux-header-messages-ui.js'];
    var idx = 0;
    function loadNext() {
      if (idx >= chain.length) {
        boot();
        return;
      }
      if (chain[idx] === 'profile-chat-store.js' && window.IfluxProfileChatStore) {
        idx += 1;
        loadNext();
        return;
      }
      if (chain[idx] === 'iflux-header-messages-ui.js' && window.IfluxHeaderMessagesUI) {
        idx += 1;
        loadNext();
        return;
      }
      var s = document.createElement('script');
      s.src = base + chain[idx];
      s.onload = function () {
        idx += 1;
        loadNext();
      };
      s.onerror = function () {
        if (chain[idx] === 'profile-chat-store.js') {
          idx += 1;
          loadNext();
          return;
        }
      };
      document.body.appendChild(s);
    }
    loadNext();
  }

  ifxDeferIdle(loadHeaderMessages);

  function loadInsightShare() {
    if (!document.querySelector('.ifx-app')) return;
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
    var link = document.querySelector('link[href*="insight-share.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + 'insight-share.css';
      document.head.appendChild(link);
    }
    function bootShare() {
      if (window.IfluxInsightShare) IfluxInsightShare.init();
    }
    if (window.IfluxInsightShareStore && window.IfluxInsightShare) {
      bootShare();
      return;
    }
    var chain = ['insight-share-store.js', 'insight-share-ui.js'];
    var idx = 0;
    function loadNext() {
      if (idx >= chain.length) {
        bootShare();
        return;
      }
      if (chain[idx] === 'insight-share-store.js' && window.IfluxInsightShareStore) {
        idx += 1;
        loadNext();
        return;
      }
      if (chain[idx] === 'insight-share-ui.js' && window.IfluxInsightShare) {
        idx += 1;
        loadNext();
        return;
      }
      var s = document.createElement('script');
      s.src = base + chain[idx];
      s.onload = function () {
        idx += 1;
        loadNext();
      };
      document.body.appendChild(s);
    }
    loadNext();
  }

  loadInsightShare();

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
