/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-P2-010
Priority: P2
STATUS: Wrong-owner
OWNER (hiện tại): Pricing
Owner đích (map): Pricing
Usage audit: ✓ (symbol scan)
Dep động: Có thể
Migration ROI: 5
Khả năng bỏ load: Chưa
P1 Gate: N/A
Refs: docs/runtime-opt/task5/PhaseA-P1-Gate.json handoffP2
Note: Owner sai nếu Community load
===== IFX-AUDIT-END ===== */
/**
 * iFlux — Pricing / trial lifecycle modals (User Web)
 */
(function (global) {
  'use strict';

  var overlayEl = null;
  var SESSION_EXPIRY_KEY = 'iflux_trial_expiry_dismissed';
  var LOCAL_OFFER_KEY = 'iflux_trial_offer_dismissed';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function consumerNavigate(canonical) {
    /* P6-API-01 — internal nav chỉ Writer.navigate */
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical);
      return;
    }
    global.location.href = canonical;
  }

  function pricingUrl(opts) {
    if (global.IfluxWebUI && IfluxWebUI.pricingPageUrl) {
      return IfluxWebUI.pricingPageUrl(opts || {});
    }
    return '../pricing/index.html';
  }

  function checkoutUrl(tier, cycle) {
    var Cat = global.IfluxPlansCatalog;
    if (Cat && Cat.checkoutUrl) {
      return Cat.checkoutUrl(Cat.getPlan(tier) || { tier: tier }, cycle || 'annual');
    }
    return '../account/checkout.html?plan=' + encodeURIComponent(tier || 'premium') + '&cycle=' + encodeURIComponent(cycle || 'annual');
  }

  function defaultTrialTier() {
    var Cat = global.IfluxPlansCatalog;
    if (Cat && Cat.purchasablePlans) {
      var plans = Cat.purchasablePlans();
      var i;
      for (i = 0; i < plans.length; i++) {
        if (plans[i].trial > 0) return plans[i].tier || plans[i].id;
      }
      if (plans.length) return plans[0].tier || plans[0].id;
    }
    return 'premium';
  }

  function trialDaysFor(tier) {
    if (global.IfluxAuth && IfluxAuth.getUser) {
      var user = IfluxAuth.getUser();
      if (user && user.plan && user.plan.days_total && user.subscription_phase === 'trial_active') {
        return user.plan.days_total;
      }
    }
    var Cat = global.IfluxPlansCatalog;
    var plan = Cat && Cat.getPlan ? Cat.getPlan(tier) : null;
    if (plan && plan.trial > 0) return plan.trial;
    return tier === 'elite' ? 14 : 7;
  }

  function planLabel(tier) {
    var Cat = global.IfluxPlansCatalog;
    var plan = Cat && Cat.getPlan ? Cat.getPlan(tier) : null;
    if (plan) return Cat.displayName ? Cat.displayName(plan) : (plan.name || tier);
    var labels = { premium: 'Premium', elite: 'Elite', free: 'Miễn phí' };
    return labels[tier] || tier;
  }

  function closeModal() {
    if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    overlayEl = null;
    document.body.classList.remove('ifx-pricing-modal-open');
  }

  function openOverlay(html, onClose) {
    closeModal();
    overlayEl = document.createElement('div');
    overlayEl.className = 'ix-modal-overlay ifx-pricing-modal';
    overlayEl.setAttribute('data-ifx-pricing-modal', '');
    overlayEl.innerHTML = html;
    document.body.appendChild(overlayEl);
    document.body.classList.add('ifx-pricing-modal-open');

    function dismiss() {
      closeModal();
      if (onClose) onClose();
    }

    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl) dismiss();
    });
    overlayEl.querySelectorAll('[data-ifx-pricing-close]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        dismiss();
      });
    });

    requestAnimationFrame(function () {
      overlayEl.classList.add('open');
    });

    return { el: overlayEl, close: dismiss };
  }

  function refreshChips() {
    if (global.IfluxWebUI && IfluxWebUI.refreshTierChips) IfluxWebUI.refreshTierChips();
    document.dispatchEvent(new CustomEvent('iflux-tier-changed'));
  }

  function openTrialOffer(opts) {
    opts = opts || {};
    var tier = opts.tier || defaultTrialTier();
    var days = trialDaysFor(tier);
    var label = planLabel(tier);

    var modal = openOverlay(
      '<div class="ix-modal-box" style="max-width:440px">' +
        '<button type="button" class="ix-modal-close" data-ifx-pricing-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Bắt đầu dùng thử</div>' +
        '<div class="ix-modal-sub">Bạn mới đăng ký — kích hoạt gói dùng thử để trải nghiệm đầy đủ tính năng iFlux.</div>' +
        '<div class="ifx-pricing-modal__hero">' +
          '<i class="ti ti-sparkles"></i>' +
          '<strong>' + esc(label) + '</strong>' +
          '<span>Dùng thử ' + days + ' ngày miễn phí</span>' +
        '</div>' +
        '<ul class="ifx-pricing-modal__list">' +
          '<li><i class="ti ti-check"></i> Dòng tiền & biểu đồ nâng cao</li>' +
          '<li><i class="ti ti-check"></i> Dashboard không giới hạn tiện ích</li>' +
          '<li><i class="ti ti-check"></i> Cảnh báo thị trường Premium</li>' +
        '</ul>' +
        '<div class="ifx-pricing-modal__actions">' +
          '<button type="button" class="ix-btn ix-btn-primary ix-w-full" data-ifx-trial-activate="' + esc(tier) + '">Dùng thử ' + esc(label) + '</button>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-w-full" data-ifx-pricing-goto>Xem tất cả gói</button>' +
          '<button type="button" class="ix-btn ix-btn-ghost ix-w-full" data-ifx-trial-later>Để sau</button>' +
        '</div>' +
      '</div>'
    );

    var activateBtn = modal.el.querySelector('[data-ifx-trial-activate]');
    if (activateBtn) {
      activateBtn.addEventListener('click', function () {
        var t = activateBtn.getAttribute('data-ifx-trial-activate') || tier;
        if (global.IfluxAuth && IfluxAuth.activateTrial) {
          IfluxAuth.activateTrial(t);
          refreshChips();
          if (global.ixToast) ixToast('Đã kích hoạt dùng thử ' + planLabel(t) + '.', 'success');
        }
        modal.close();
      });
    }

    var gotoBtn = modal.el.querySelector('[data-ifx-pricing-goto]');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', function () {
        modal.close();
        consumerNavigate(pricingUrl({ showPropose: true }));
      });
    }

    var laterBtn = modal.el.querySelector('[data-ifx-trial-later]');
    if (laterBtn) {
      laterBtn.addEventListener('click', function () {
        try { localStorage.setItem(LOCAL_OFFER_KEY, '1'); } catch (e) { /* ignore */ }
        modal.close();
      });
    }
  }

  function openTrialExpired(opts) {
    opts = opts || {};
    var user = global.IfluxAuth && IfluxAuth.getUser ? IfluxAuth.getUser() : null;
    var tier = (user && user.tier) || 'premium';
    var label = planLabel(tier);

    var modal = openOverlay(
      '<div class="ix-modal-box" style="max-width:440px">' +
        '<button type="button" class="ix-modal-close" data-ifx-pricing-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Thời gian dùng thử đã hết</div>' +
        '<div class="ix-modal-sub">Gói dùng thử ' + esc(label) + ' của bạn đã kết thúc. Nâng cấp để tiếp tục dùng đầy đủ tính năng Premium.</div>' +
        '<div class="ifx-pricing-modal__hero ifx-pricing-modal__hero--warn">' +
          '<i class="ti ti-clock-off"></i>' +
          '<strong>Hết hạn dùng thử</strong>' +
          '<span>Tài khoản sẽ chuyển về Miễn phí nếu bạn không gia hạn</span>' +
        '</div>' +
        '<div class="ifx-pricing-modal__actions">' +
          '<a href="' + esc(checkoutUrl(tier, 'annual')) + '" class="ix-btn ix-btn-primary ix-w-full">Nâng cấp ' + esc(label) + ' →</a>' +
          '<a href="' + esc(global.IfluxHref ? global.IfluxHref.forCanonical(pricingUrl({ mode: 'expired', reason: 'expired' })) : pricingUrl({ mode: 'expired', reason: 'expired' })) + '" class="ix-btn ix-btn-outline ix-w-full">So sánh các gói</a>' +
          '<button type="button" class="ix-btn ix-btn-ghost ix-w-full" data-ifx-trial-freemium>Tiếp tục Miễn phí</button>' +
        '</div>' +
      '</div>',
      function () {
        try { sessionStorage.setItem(SESSION_EXPIRY_KEY, '1'); } catch (e) { /* ignore */ }
      }
    );

    var freemiumBtn = modal.el.querySelector('[data-ifx-trial-freemium]');
    if (freemiumBtn) {
      freemiumBtn.addEventListener('click', function () {
        if (global.IfluxAuth && IfluxAuth.acknowledgeTrialExpiry) {
          IfluxAuth.acknowledgeTrialExpiry();
          refreshChips();
          if (global.ixToast) ixToast('Bạn đang dùng gói Miễn phí.', 'info');
        }
        modal.close();
      });
    }
  }

  function open(opts) {
    opts = opts || {};
    var mode = opts.mode || opts.reason || 'upgrade';
    if (mode === 'trial_offer' || mode === 'propose') return openTrialOffer(opts);
    if (mode === 'trial_expired') return openTrialExpired(opts);
    if (mode === 'expired') return openTrialExpired(opts);
    consumerNavigate(pricingUrl(opts));
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

  function shouldOfferTrial() {
    if (!global.IfluxAuth || !IfluxAuth.isLoggedIn()) return false;
    if (hasPendingOnboarding()) return false;
    if (IfluxAuth.getSubscriptionState() !== 'trial_eligible') return false;
    try {
      if (localStorage.getItem(LOCAL_OFFER_KEY) === '1') return false;
    } catch (e) { /* ignore */ }
    if (/(\/pricing\/|\/account\/checkout|\/auth\/)/.test(global.location.pathname)) return false;
    return true;
  }

  function shouldPromptTrialExpiry() {
    if (!global.IfluxAuth || !IfluxAuth.isLoggedIn()) return false;
    if (IfluxAuth.getSubscriptionState() !== 'trial_expired') return false;
    try {
      if (sessionStorage.getItem(SESSION_EXPIRY_KEY) === '1') return false;
    } catch (e) { /* ignore */ }
    if (/(\/pricing\/|\/account\/checkout)/.test(global.location.pathname)) return false;
    return true;
  }

  function tryPromptLifecycle(opts) {
    opts = opts || {};
    if (shouldPromptTrialExpiry()) {
      openTrialExpired(opts);
      return true;
    }
    if ((opts.afterOnboarding || opts.allowTrialOffer) && shouldOfferTrial()) {
      openTrialOffer(opts);
      return true;
    }
    return false;
  }

  if (!document.getElementById('ifx-pricing-modal-css')) {
    var style = document.createElement('style');
    style.id = 'ifx-pricing-modal-css';
    style.textContent =
      '.ifx-pricing-modal{position:fixed;inset:0;z-index:10070;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(8,9,18,.55)}' +
      '.ifx-pricing-modal.open{display:flex}' +
      '.ifx-pricing-modal .ix-modal-box{position:relative;width:100%}' +
      '.ifx-pricing-modal__hero{margin:16px 0;padding:16px;border-radius:12px;background:var(--ix-bg-card);border:1px solid var(--ix-border);text-align:center}' +
      '.ifx-pricing-modal__hero i{font-size:28px;color:var(--ix-accent);display:block;margin-bottom:8px}' +
      '.ifx-pricing-modal__hero strong{display:block;font-size:18px;color:var(--ix-text-primary);margin-bottom:4px}' +
      '.ifx-pricing-modal__hero span{font-size:13px;color:var(--ix-text-muted)}' +
      '.ifx-pricing-modal__hero--warn i{color:var(--iflux-orange)}' +
      '.ifx-pricing-modal__list{margin:0 0 16px;padding:0;list-style:none}' +
      '.ifx-pricing-modal__list li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--ix-text-secondary);padding:6px 0}' +
      '.ifx-pricing-modal__list i{color:var(--ix-success);margin-top:2px}' +
      '.ifx-pricing-modal__actions{display:flex;flex-direction:column;gap:8px}' +
      'body.ifx-pricing-modal-open{overflow:hidden}';
    document.head.appendChild(style);
  }

  global.IfluxPricingModal = {
    open: open,
    close: closeModal,
    openTrialOffer: openTrialOffer,
    openTrialExpired: openTrialExpired,
    tryPromptLifecycle: tryPromptLifecycle,
    shouldOfferTrial: shouldOfferTrial,
    shouldPromptTrialExpiry: shouldPromptTrialExpiry
  };
})(window);
