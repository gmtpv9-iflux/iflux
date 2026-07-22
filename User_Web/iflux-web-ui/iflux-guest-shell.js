/* Guest shell — menu động + nút Đăng nhập trên trang thật (Market/Flow/…)
 * Không còn trang /guest riêng. Guest = cùng trang + entitlement hẹp + CTA auth.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function routeTo(key) {
    if (global.IfluxRoutes) return IfluxRoutes.to(key);
    var legacy = {
      home: '../home/index.html',
      market: '../market/index.html',
      flow: '../flow/index.html',
      community: '../community/index.html',
      pricing: '../pricing/index.html',
      faq: '../faq/index.html',
      loyalty: '../loyalty/index.html'
    };
    return legacy[key] || '/';
  }

  function isLoggedIn() {
    return global.IfluxAuth && IfluxAuth.isLoggedIn();
  }

  function loginUrl() {
    if (global.IfluxRoutes) {
      return IfluxRoutes.to('auth.login') + '?return=' + encodeURIComponent(IfluxRoutes.to('home'));
    }
    return '/dang-nhap?return=/nha-cua-toi';
  }

  /* Top-nav do App Shell (IfluxAppShellHeader, trong platform-boot) sinh ra — MỘT SoT
   * cho cả khách lẫn đã đăng nhập. Hàm này chỉ ủy quyền để tránh 2 nguồn render nav. */
  function renderGuestNav(activePage) {
    if (global.IfluxAppShellHeader && IfluxAppShellHeader.render) {
      IfluxAppShellHeader.render(activePage);
    }
  }

  function renderGuestActions() {
    var actions = document.querySelector('[data-ifx-guest-actions]');
    if (!actions) return;
    /* Giữ slot Search (nếu có) — chỉ thay CTA auth, không innerHTML cả khối. */
    var search = actions.querySelector('[data-ifx-header-search]');
    var loginHtml =
      '<a href="' + loginUrl() + '" class="ix-btn ix-btn-primary ifx-guest-auth-btn" aria-label="Đăng nhập">' +
        '<i class="ti ti-login"></i>' +
        '<span class="ifx-guest-auth-btn__label">Đăng nhập</span>' +
      '</a>';
    if (search) {
      Array.prototype.slice.call(actions.children).forEach(function (child) {
        if (child !== search && child.parentNode === actions) actions.removeChild(child);
      });
      if (!actions.querySelector('.ifx-guest-auth-btn')) {
        actions.insertAdjacentHTML('beforeend', loginHtml);
      }
    } else {
      actions.innerHTML = loginHtml;
    }
  }

  function firstGuestPageUrl() {
    if (!global.IfluxEntitlements) return routeTo('market');
    var menus = IfluxEntitlements.visibleMenus();
    if (!menus.length) return routeTo('market');
    return menus[0].path || routeTo('market');
  }

  function syncBrandHref() {
    var brand = document.querySelector('a.ifx-topnav-brand');
    if (!brand) return;
    var href;
    if (isLoggedIn()) {
      href = global.IfluxRoutes ? IfluxRoutes.to('home') : '/nha-cua-toi';
    } else {
      href = global.IfluxRoutes ? IfluxRoutes.to('community') : '/cong-dong';
      if (!href || href === '/') href = '/cong-dong';
    }
    brand.setAttribute('href', href);
  }

  function bootstrapPage(pageKey, initFn) {
    pageKey = String(pageKey || '').toLowerCase();

    function applyEntitlements() {
      if (global.IfluxBlockGate) IfluxBlockGate.apply(pageKey);
    }

    function run() {
      var proceed = true;
      if (isLoggedIn()) {
        if (!IfluxAuth.requireAuth()) {
          /* Đang chuyển tới login — vẫn resolve callback để shell-boot không treo. */
          proceed = false;
        } else {
          renderGuestNav(pageKey);
          /* Đã login: bỏ hardcode «Đăng nhập» còn sót trong HTML (vd Outline cũ). */
          document.querySelectorAll('[data-ifx-guest-actions] > a.ix-btn[href*="dang-nhap"], [data-ifx-guest-actions] > a.ifx-guest-auth-btn').forEach(function (el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
          });
          document.querySelectorAll('[data-ifx-app-only]').forEach(function (el) {
            el.hidden = false;
            el.style.display = '';
          });
        }
      } else {
        if (!IfluxEntitlements.canAccessPage(pageKey)) {
          global.location.replace(firstGuestPageUrl());
          proceed = false;
        } else {
          renderGuestNav(pageKey);
          renderGuestActions();
        }
      }

      syncBrandHref();

      if (proceed) applyEntitlements();
      /* Luôn gọi initFn — shell-boot await Promise dựa vào đây; thiếu = treo trang. */
      if (typeof initFn === 'function') initFn();

      document.addEventListener('iflux-plans-updated', function () {
        if (!isLoggedIn()) {
          if (!IfluxEntitlements.canAccessPage(pageKey)) {
            global.location.replace(firstGuestPageUrl());
            return;
          }
          renderGuestNav(pageKey);
          renderGuestActions();
        }
        syncBrandHref();
        applyEntitlements();
        if (typeof initFn === 'function') initFn();
      });
    }

    if (global.PlansStore && PlansStore.hydrate) {
      PlansStore.hydrate().then(run).catch(run);
    } else {
      run();
    }
  }

  /** Điểm vào gốc: đã login → Nhà; chưa → trang public đầu tiên (thường Market). */
  function initGuestLanding() {
    function goPublic() {
      global.location.replace(firstGuestPageUrl());
    }

    function goHomeIfSession() {
      if (!isLoggedIn()) {
        goPublic();
        return;
      }
      if (global.IfluxAuth && IfluxAuth.refreshSessionFromApi && global.IfluxRuntime && IfluxRuntime.isApiMode && IfluxRuntime.isApiMode()) {
        IfluxAuth.refreshSessionFromApi().then(function (user) {
          if (user) global.location.replace(routeTo('home'));
          else goPublic();
        }).catch(goPublic);
        return;
      }
      global.location.replace(routeTo('home'));
    }

    if (global.PlansStore && PlansStore.hydrate) {
      PlansStore.hydrate().then(goHomeIfSession).catch(goHomeIfSession);
    } else {
      goHomeIfSession();
    }
  }

  global.IfluxGuestShell = {
    bootstrapPage: bootstrapPage,
    initGuestLanding: initGuestLanding,
    renderGuestNav: renderGuestNav,
    renderGuestActions: renderGuestActions,
    firstGuestPageUrl: firstGuestPageUrl
  };
})(window);
