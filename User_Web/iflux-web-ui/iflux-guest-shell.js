/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-012
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/* Guest shell — menu động + nút Đăng nhập trên trang thật (Market/Flow/…)
 * Không còn trang /guest riêng. Guest = cùng trang + entitlement hẹp + CTA auth.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function isLoggedIn() {
    return global.IfluxAuth && IfluxAuth.isLoggedIn();
  }

  function loginUrl() {
    if (global.IfluxRoutes) {
      return IfluxRoutes.to('auth.login') + '?return=' + encodeURIComponent(IfluxRoutes.to('news', { canonical: true, skipDecorate: true }));
    }
    return '/dang-nhap?return=/tin-tuc';
  }

  /* Top-nav do App Shell (IfluxAppShellHeader, trong platform-boot) sinh ra — MỘT SoT
   * cho cả khách lẫn đã đăng nhập. Hàm này chỉ ủy quyền để tránh 2 nguồn render nav. */
  function renderGuestNav(activePage) {
    if (global.IfluxAppShellHeader && IfluxAppShellHeader.render) {
      IfluxAppShellHeader.render(activePage);
    }
  }

  function renderGuestActions() {
    try {
      if (/\/binh-luan\/?$/i.test(global.location.pathname || '')) return;
    } catch (e0) { /* ignore */ }
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

  function syncBrandHref() {
    var brand = document.querySelector('a.ifx-app-header-brand');
    if (!brand) return;
    var href = global.IfluxRoutes
      ? IfluxRoutes.to('news', { canonical: true, skipDecorate: true })
      : '/tin-tuc';
    brand.setAttribute('href', global.IfluxHref ? IfluxHref.forCanonical(href) : href);
  }

  var plansListenerBound = false;
  var currentPageKey = '';
  var currentInitFn = null;

  function bootstrapPage(pageKey, initFn) {
    pageKey = String(pageKey || '').toLowerCase();
    currentPageKey = pageKey;
    currentInitFn = typeof initFn === 'function' ? initFn : null;

    function applyEntitlements() {
      if (global.IfluxBlockGate) IfluxBlockGate.apply(currentPageKey);
    }

    /* Paint nav sync ngay khi đã có session — không chờ PlansStore.hydrate */
    if (isLoggedIn()) {
      renderGuestNav(currentPageKey);
      syncBrandHref();
    }

    function run() {
      var pk = currentPageKey;
      if (isLoggedIn()) {
        renderGuestNav(pk);
        /* Đã login: bỏ hardcode «Đăng nhập» còn sót trong HTML (vd Outline cũ). */
        document.querySelectorAll('[data-ifx-guest-actions] > a.ix-btn[href*="dang-nhap"], [data-ifx-guest-actions] > a.ifx-guest-auth-btn').forEach(function (el) {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        document.querySelectorAll('[data-ifx-app-only]').forEach(function (el) {
          el.hidden = false;
          el.style.display = '';
        });
      } else {
        /* Khách xem được mọi trang; chỉ nội dung cần danh tính mới hỏi đăng nhập (IfluxAuth.promptLogin). */
        renderGuestNav(pk);
        renderGuestActions();
      }

      syncBrandHref();

      applyEntitlements();
      /* Luôn gọi initFn — shell-boot await Promise dựa vào đây; thiếu = treo trang. */
      if (typeof currentInitFn === 'function') currentInitFn();

      if (!plansListenerBound) {
        plansListenerBound = true;
        document.addEventListener('iflux-plans-updated', function () {
          if (!isLoggedIn()) {
            renderGuestNav(currentPageKey);
            renderGuestActions();
          }
          syncBrandHref();
          applyEntitlements();
          if (typeof currentInitFn === 'function') currentInitFn();
        });
      }
    }

    if (global.PlansRuntimeReader && PlansRuntimeReader.load) {
      PlansRuntimeReader.load().then(run).catch(run);
    } else {
      run();
    }
  }

  global.IfluxGuestShell = {
    bootstrapPage: bootstrapPage,
    renderGuestNav: renderGuestNav,
    renderGuestActions: renderGuestActions
  };
})(window);
