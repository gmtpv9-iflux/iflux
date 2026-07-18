/* Bind profile UI from IfluxAuth session */
(function (global) {
  'use strict';

  function initials(name) {
    return (name || 'U').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function setText(sel, text) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (text != null && text !== '') el.textContent = text;
    });
  }

  function currentTier(user) {
    if (!user) return 'free';
    return String(user.tier || (user.plan && user.plan.tier) || 'free').toLowerCase();
  }

  function isMaxTier(user) {
    if (!user) return false;
    var tier = currentTier(user);
    if (tier === 'elite' || tier === 'partner' || tier === 'admin') return true;
    var Cat = global.IfluxPlansCatalog;
    if (Cat && Cat.hasUpgradePath) return !Cat.hasUpgradePath(tier);
    return tier === 'elite';
  }

  function nextPlan(user) {
    var Cat = global.IfluxPlansCatalog;
    if (!Cat || !Cat.nextUpgradeablePlan) return null;
    return Cat.nextUpgradeablePlan(currentTier(user));
  }

  function renderPlanFeatures(user) {
    var wraps = document.querySelectorAll('[data-ifx-plan-features]');
    if (!wraps.length) return;
    var Cat = global.IfluxPlansCatalog;
    if (!Cat || !Cat.buildFeatures) return;

    var target = nextPlan(user);
    if (!target) {
      wraps.forEach(function (wrap) { wrap.innerHTML = ''; });
      return;
    }

    var feats = Cat.buildFeatures(target).filter(function (f) { return f.has; }).slice(0, 4);
    if (!feats.length) return;
    var color = target.iconClass === 'warning' ? 'var(--iflux-orange)' : 'var(--ix-accent)';
    var html = feats.map(function (f) {
      return '<div class="ix-plan-feat"><i class="ti ti-check" style="color:' + color + ';font-size:14px"></i> ' + Cat.esc(f.text) + '</div>';
    }).join('');
    wraps.forEach(function (wrap) { wrap.innerHTML = html; });
  }

  function bindPlanUpgrade(user) {
    var max = isMaxTier(user);
    var target = nextPlan(user);
    var Cat = global.IfluxPlansCatalog;

    document.querySelectorAll('[data-ifx-plan-promo], .ifx-hub-plan-card, .ix-plan-card').forEach(function (card) {
      card.hidden = max;
    });

    document.querySelectorAll('[data-ifx-plan-max-note]').forEach(function (note) {
      note.hidden = true;
    });

    document.querySelectorAll('[data-ifx-plan-upgrade]').forEach(function (upgrade) {
      if (max || !target) {
        upgrade.hidden = true;
        return;
      }
      upgrade.hidden = false;
      var label = Cat && Cat.displayName ? Cat.displayName(target) : (target.name || target.tier);
      upgrade.innerHTML = '<i class="ti ti-arrow-up-circle" style="font-size:13px"></i> Nâng cấp ' + label;
      if (Cat && Cat.checkoutUrl) {
        upgrade.setAttribute('href', Cat.checkoutUrl(target, 'annual'));
      } else {
        upgrade.setAttribute('href', '../pricing/index.html?propose=1&plan=' + encodeURIComponent(target.tier || 'premium'));
      }
    });

    if (target) {
      var chipLabel = Cat && Cat.displayName ? Cat.displayName(target) : (target.name || target.tier);
      document.querySelectorAll('.ix-plan-card [data-bind="plan_name"], .ifx-hub-plan-card [data-bind="plan_name"]').forEach(function (el) {
        el.textContent = chipLabel;
      });
      document.querySelectorAll('.ix-plan-card .ix-chip, .ifx-hub-plan-card .ix-chip').forEach(function (chip) {
        chip.classList.remove('ix-chip-primary', 'ix-chip-warning');
        chip.classList.add(target.iconClass === 'warning' ? 'ix-chip-warning' : 'ix-chip-primary');
      });
      document.querySelectorAll('[data-bind="plan_price"]').forEach(function (priceEl) {
        var amount = target.priceMonth || 0;
        if (Cat && Cat.priceAmount) amount = Cat.priceAmount(target, 'monthly') || amount;
        var display = amount >= 1000 ? Math.round(amount / 1000) + 'K' : String(amount || '—');
        priceEl.innerHTML =
          '<span class="ix-plan-price-cur">₫</span>' +
          '<span class="ix-plan-price-num">' + display + '</span>' +
          '<span class="ix-plan-price-per">/tháng</span>';
      });
    }
  }

  function init() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    var ini = initials(user.display_name);
    setText('[data-bind="display_name"]', user.display_name);
    setText('[data-bind="username"]', user.username);
    setText('[data-bind="email"]', user.email);
    setText('[data-bind="phone"]', user.phone);
    setText('[data-bind="tier_label"]', global.IfluxAuth.getMenuTierLabel
      ? IfluxAuth.getMenuTierLabel()
      : user.tier_label);
    setText('[data-bind="role"]', user.role);
    setText('[data-bind="country"]', user.country);
    setText('[data-bind="joined_at"]', user.joined_at);
    setText('[data-bind="bio"]', user.bio);
    setText('[data-bind="referral_code"]', user.referral_code);
    setText('[data-bind="posts"]', user.stats && user.stats.posts);
    setText('[data-bind="followers"]', user.stats && user.stats.followers);
    setText('[data-bind="following"]', user.stats && user.stats.following);

    document.querySelectorAll('[data-bind="avatar"]').forEach(function (el) {
      if (el.id === 'ifx-account-avatar-preview') return;
      if (global.IfluxProfileAvatar) {
        IfluxProfileAvatar.renderInto(el, Object.assign({}, user, {
          initials: initials(user.display_name)
        }));
      } else {
        el.textContent = ini;
      }
    });

    var refLink = document.getElementById('ref-link');
    var refCode = document.getElementById('ref-code');
    if (refLink && user.referral_code) {
      refLink.value = global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.getReferralLinkForUser
        ? IfluxLoyaltyAffiliateStore.getReferralLinkForUser(user)
        : (user.referral_link || '');
    }
    if (refCode && user.referral_code) refCode.value = user.referral_code;

    if (user.plan) {
      var bar = document.querySelectorAll('[data-bind="plan_progress"]');
      bar.forEach(function (el) {
        if (user.plan.days_total) {
          var pct = Math.round((user.plan.days_left / user.plan.days_total) * 100);
          el.style.width = pct + '%';
        }
      });
      setText('[data-bind="plan_days"]', (user.plan.days_left || 0) + ' / ' + (user.plan.days_total || 30) + ' ngày');
    }

    /* Promo gói: ẩn khi Elite; Free→Premium; Premium→Elite */
    bindPlanUpgrade(user);
    renderPlanFeatures(user);
  }

  global.ProfileBind = { init: init };
})(window);
