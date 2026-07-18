/**
 * iFlux — Onboarding spotlight tour (User Web)
 */
(function (global) {
  'use strict';

  var LOCAL_DONE_KEY = 'iflux_onboarding_web_done';
  var running = false;
  var maskId = 'ifx-onboard-mask';
  var MASK_OVERLAY = 'rgba(8, 9, 18, 0.5)';
  var scrollLockY = 0;
  var maskEl = null;
  var panelEl = null;
  var spotlightEl = null;

  var FALLBACK_STEPS = [
    { title: 'Nhà của tôi', body_text: 'Trung tâm cá nhân: bảng điều khiển, watchlist và timeline hoạt động của bạn.', target_key: 'home', image_url: '' },
    { title: 'Thị trường', body_text: 'Theo dõi VN-Index, biểu đồ và tổng quan thị trường.', target_key: 'market', image_url: '' },
    { title: 'Độc quyền', body_text: 'Nhãn tính năng chỉ có trên iFlux — dòng tiền và insight độc quyền.', target_key: 'flow_exclusive', image_url: '' },
    { title: 'Dòng tiền', body_text: 'Phân tích dòng tiền vào/ra theo thời gian thực.', target_key: 'flow', image_url: '' },
    { title: 'Cộng đồng', body_text: 'Insight, chủ đề và quan điểm từ cộng đồng nhà đầu tư.', target_key: 'community', image_url: '' },
    { title: 'Gói cước', body_text: 'So sánh gói Miễn phí, Premium và Elite — nâng cấp khi sẵn sàng.', target_key: 'pricing', image_url: '' },
    { title: 'Membership', body_text: 'Ưu đãi, coupon và chương trình thành viên iFlux.', target_key: 'loyalty', image_url: '' },
    { title: 'FAQ', body_text: 'Câu hỏi thường gặp về tài khoản, gói cước và sử dụng nền tảng.', target_key: 'faq', image_url: '' }
  ];

  function menuOnboardingSteps(steps) {
    var byKey = {};
    (steps || []).forEach(function (step) {
      if (step && step.target_key) byKey[step.target_key] = step;
    });
    return FALLBACK_STEPS.map(function (tpl) {
      var fromList = byKey[tpl.target_key];
      return fromList ? Object.assign({}, tpl, fromList) : tpl;
    });
  }

  function useApi() {
    return global.IfluxAuth && IfluxAuth.useApi && IfluxAuth.useApi();
  }

  function isCompletedLocal() {
    try {
      return localStorage.getItem(LOCAL_DONE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function markCompletedLocal() {
    try {
      localStorage.setItem(LOCAL_DONE_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  function hasPendingOnboarding() {
    if (global.IfluxAuth && IfluxAuth.hasPendingOnboarding) {
      return IfluxAuth.hasPendingOnboarding();
    }
    try {
      return sessionStorage.getItem('iflux_pending_onboarding') === '1';
    } catch (e) {
      return false;
    }
  }

  function clearPendingOnboarding() {
    if (global.IfluxAuth && IfluxAuth.clearPendingOnboarding) {
      IfluxAuth.clearPendingOnboarding();
      return;
    }
    try {
      sessionStorage.removeItem('iflux_pending_onboarding');
    } catch (e) { /* ignore */ }
  }

  function fetchCompletionState() {
    if (!useApi() || !global.IfluxApiClient) {
      return Promise.resolve({ web_completed: isCompletedLocal() });
    }
    var token = global.IfluxAuth.getToken();
    if (!token) return Promise.resolve({ web_completed: isCompletedLocal() });
    return IfluxApiClient.getOnboardingState(token).then(function (res) {
      var data = (res && res.data) || {};
      return { web_completed: !!data.web_completed_at };
    }).catch(function () {
      return { web_completed: isCompletedLocal() };
    });
  }

  function saveCompletionState() {
    markCompletedLocal();
    if (!useApi() || !global.IfluxApiClient) return Promise.resolve();
    var token = global.IfluxAuth.getToken();
    if (!token) return Promise.resolve();
    return IfluxApiClient.saveOnboardingState(token, {
      web_completed_at: new Date().toISOString()
    }).catch(function () { return null; });
  }

  function fetchSteps() {
    if (useApi() && global.IfluxApiClient) {
      return IfluxApiClient.listOnboardingSteps('web').then(function (res) {
        var steps = (res && res.steps) || [];
        return menuOnboardingSteps(steps.length ? steps : FALLBACK_STEPS);
      }).catch(function () {
        return menuOnboardingSteps(FALLBACK_STEPS);
      });
    }
    return Promise.resolve(menuOnboardingSteps(FALLBACK_STEPS));
  }

  function resolveFlowMenuLink() {
    return document.querySelector('[data-ifx-onboard="flow"]')
      || document.querySelector('a.ifx-topnav-link--exclusive')
      || document.querySelector('a[href*="flow/"]');
  }

  function resolveTarget(step) {
    if (!step || !step.target_key) return null;
    var el = document.querySelector('[data-ifx-onboard="' + step.target_key + '"]');
    if (el) return el;
    var map = {
      home: '.ifx-topnav-menu a:has(.ti-home)',
      market: 'a[href*="market/"]:not(.ifx-topnav-link--exclusive)',
      flow_exclusive: resolveFlowMenuLink,
      flow: resolveFlowMenuLink,
      community: 'a[href*="community/"]',
      pricing: 'a[href*="pricing/"]',
      loyalty: 'a[href*="loyalty/"]',
      faq: 'a[href*="faq/"], a[data-ifx-nav="faq"]'
    };
    var sel = map[step.target_key];
    if (typeof sel === 'function') return sel();
    return sel ? document.querySelector(sel) : null;
  }

  function rectWithPad(el, pad) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return {
      x: Math.max(0, r.left - pad),
      y: Math.max(0, r.top - pad),
      w: r.width + pad * 2,
      h: r.height + pad * 2
    };
  }

  function viewportMainHole() {
    var pad = 12;
    var topnav = document.querySelector('.ifx-topnav');
    var top = topnav ? topnav.getBoundingClientRect().bottom + pad : pad + 56;
    return {
      x: pad,
      y: top,
      w: Math.max(0, window.innerWidth - pad * 2),
      h: Math.max(0, window.innerHeight - top - pad),
      rx: 14
    };
  }

  function buildMaskSvg(holes) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var id = maskId + '-' + Date.now();
    var holeRects = holes.map(function (hole) {
      return '<rect x="' + hole.x + '" y="' + hole.y + '" width="' + hole.w + '" height="' + hole.h + '" rx="' + (hole.rx || 10) + '" fill="black"/>';
    }).join('');
    return (
      '<svg class="ifx-onboard-mask" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs><mask id="' + id + '">' +
          '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="white"/>' +
          holeRects +
        '</mask></defs>' +
        '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + MASK_OVERLAY + '" mask="url(#' + id + ')"/>' +
      '</svg>'
    );
  }

  function updateMask(menuTarget) {
    if (!maskEl) return;
    var holes = [];
    var menuRect = rectWithPad(menuTarget, 6);
    if (menuRect) {
      menuRect.rx = 10;
      holes.push(menuRect);
    }
    if (!holes.length) {
      holes.push(viewportMainHole());
    }
    maskEl.innerHTML = buildMaskSvg(holes);
  }

  function ensureCriticalStyles() {
    if (document.getElementById('ifx-onboard-critical-css')) return;
    var style = document.createElement('style');
    style.id = 'ifx-onboard-critical-css';
    style.textContent =
      '.ifx-onboard-mask-host{position:fixed;inset:0;z-index:10050;pointer-events:none;background:#000;opacity:.6}' +
      '.ifx-onboard-mask{display:block;width:100%;height:100%}' +
      '.ifx-onboard-center{position:fixed;z-index:10060;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:auto;width:min(520px,calc(100vw - 28px));max-height:min(520px,calc(100vh - 40px));padding:26px 28px 20px}' +
      'html.ifx-onboard-active,body.ifx-onboard-active{overflow:hidden!important}';
    document.head.appendChild(style);
  }

  function lockPageScroll() {
    scrollLockY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add('ifx-onboard-active');
    document.body.classList.add('ifx-onboard-active');
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove('ifx-onboard-active');
    document.body.classList.remove('ifx-onboard-active');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollLockY);
  }

  function clearSpotlight() {
    if (spotlightEl) {
      spotlightEl.classList.remove('ifx-onboard-spotlight');
      spotlightEl = null;
    }
  }

  function applySpotlight(el) {
    clearSpotlight();
    if (!el) return;
    el.classList.add('ifx-onboard-spotlight');
    spotlightEl = el;
  }

  function removeLayers() {
    clearSpotlight();
    if (maskEl && maskEl.parentNode) maskEl.parentNode.removeChild(maskEl);
    if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    maskEl = null;
    panelEl = null;
  }

  function forceClose() {
    running = false;
    removeLayers();
    unlockPageScroll();
  }

  function cleanupStale() {
    if (!maskEl && !panelEl) {
      if (document.body.style.position === 'fixed' ||
          document.body.classList.contains('ifx-onboard-active')) {
        unlockPageScroll();
      }
      document.querySelectorAll('.ifx-onboard-root, .ifx-onboard-mask-host, .ifx-onboard-center').forEach(function (el) {
        el.parentNode.removeChild(el);
      });
    }
  }

  function startTour(steps) {
    if (running || !steps || !steps.length) return;
    if (!document.querySelector('.ifx-app')) return;

    forceClose();
    ensureCriticalStyles();
    running = true;
    var index = 0;
    var prevTarget = null;

    maskEl = document.createElement('div');
    maskEl.className = 'ifx-onboard-mask-host';
    maskEl.setAttribute('aria-hidden', 'true');

    panelEl = document.createElement('div');
    panelEl.className = 'ifx-onboard-center';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.innerHTML =
      '<div class="ifx-onboard-center__media" hidden></div>' +
      '<div class="ifx-onboard-center__step"></div>' +
      '<h3 class="ifx-onboard-center__title" id="ifx-onboard-title"></h3>' +
      '<p class="ifx-onboard-center__body"></p>' +
      '<div class="ifx-onboard-center__actions">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-onboard-skip>Bỏ qua</button>' +
        '<div style="display:flex;gap:8px">' +
          '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-onboard-prev>Quay lại</button>' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-onboard-next>Tiếp</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(maskEl);
    document.body.appendChild(panelEl);
    lockPageScroll();

    var media = panelEl.querySelector('.ifx-onboard-center__media');
    var stepEl = panelEl.querySelector('.ifx-onboard-center__step');
    var titleEl = panelEl.querySelector('.ifx-onboard-center__title');
    var bodyEl = panelEl.querySelector('.ifx-onboard-center__body');
    var btnPrev = panelEl.querySelector('[data-onboard-prev]');
    var btnNext = panelEl.querySelector('[data-onboard-next]');
    var btnSkip = panelEl.querySelector('[data-onboard-skip]');

    function finish() {
      running = false;
      clearPendingOnboarding();
      window.removeEventListener('resize', onResize);
      removeLayers();
      unlockPageScroll();
      if (global.IfluxWebUI && IfluxWebUI.closeMobileNav) IfluxWebUI.closeMobileNav();
      saveCompletionState();
      document.dispatchEvent(new CustomEvent('iflux-onboarding-finished'));
    }

    function renderStep() {
      var step = steps[index];
      var target = resolveTarget(step);
      prevTarget = target;
      stepEl.textContent = 'Bước ' + (index + 1) + ' / ' + steps.length;
      titleEl.textContent = step.title || '';
      bodyEl.textContent = step.body_text || step.body || '';

      if (step.image_url) {
        media.hidden = false;
        media.innerHTML = '<img alt="" />';
        media.querySelector('img').src = step.image_url;
      } else {
        media.hidden = true;
        media.innerHTML = '';
      }

      btnPrev.disabled = index === 0;
      btnNext.textContent = index === steps.length - 1 ? 'Hoàn tất' : 'Tiếp';

      if (target && target.closest && target.closest('.ifx-topnav-menu') &&
          global.IfluxWebUI && IfluxWebUI.openMobileNav &&
          window.innerWidth <= 1023.98) {
        IfluxWebUI.openMobileNav();
      }

      applySpotlight(target);

      window.requestAnimationFrame(function () {
        updateMask(target);
        window.requestAnimationFrame(function () {
          updateMask(target);
        });
      });
    }

    function onResize() {
      updateMask(prevTarget);
    }

    btnSkip.addEventListener('click', finish);
    btnPrev.addEventListener('click', function () {
      if (index > 0) {
        index -= 1;
        renderStep();
      }
    });
    btnNext.addEventListener('click', function () {
      if (index < steps.length - 1) {
        index += 1;
        renderStep();
      } else {
        finish();
      }
    });

    window.addEventListener('resize', onResize);
    renderStep();
  }

  function shouldStart(opts) {
    if (opts.force === true) return Promise.resolve(true);
    if (hasPendingOnboarding()) return Promise.resolve(true);
    if (isCompletedLocal()) return Promise.resolve(false);
    return fetchCompletionState().then(function (state) {
      return !state.web_completed;
    });
  }

  function tryStart(opts) {
    opts = opts || {};
    if (running) return Promise.resolve(false);
    if (!global.IfluxAuth || !IfluxAuth.isLoggedIn()) return Promise.resolve(false);
    if (!document.querySelector('.ifx-app')) return Promise.resolve(false);

    return shouldStart(opts).then(function (ok) {
      if (!ok) return false;
      return fetchSteps().then(function (steps) {
        if (!steps.length) {
          clearPendingOnboarding();
          return false;
        }
        startTour(steps);
        return true;
      });
    });
  }

  cleanupStale();

  global.IfluxOnboarding = {
    tryStart: tryStart,
    forceClose: forceClose,
    cleanupStale: cleanupStale,
    resetLocal: function () {
      forceClose();
      try { localStorage.removeItem(LOCAL_DONE_KEY); } catch (e) { /* ignore */ }
      clearPendingOnboarding();
      try { sessionStorage.setItem('iflux_pending_onboarding', '1'); } catch (e2) { /* ignore */ }
    }
  };
})(window);
