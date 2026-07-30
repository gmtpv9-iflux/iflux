/* Owner: sidebar ([data-ifx-profile-sidebar] · hero · plan promo · edit form) — một entry bind DOM */
(function (global) {
  'use strict';

  var editBound = false;

  function initials(name) {
    return (name || 'U').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function setText(sel, text) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (text == null || text === '') return;
      el.textContent = text;
    });
  }

  function setStatText(sel, val) {
    setText(sel, val != null && val !== '' ? val : '0');
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

  function populateEditInputs() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    document.querySelectorAll('[data-ifx-side-edit] [data-bind-input]').forEach(function (input) {
      var key = input.getAttribute('data-bind-input');
      input.value = (user && user[key] != null) ? user[key] : '';
    });
  }

  function setEditMode(edit) {
    var viewEl = document.querySelector('[data-ifx-side-view]');
    var editEl = document.querySelector('[data-ifx-side-edit]');
    var heroEl = document.querySelector('[data-ifx-profile-hero]');
    if (viewEl) viewEl.hidden = !!edit;
    if (editEl) editEl.hidden = !edit;
    if (heroEl) heroEl.classList.toggle('is-editing', !!edit);
    if (edit) populateEditInputs();
  }

  function saveProfileFromSidebar() {
    var patch = {};
    document.querySelectorAll('[data-ifx-side-edit] [data-bind-input]').forEach(function (input) {
      patch[input.getAttribute('data-bind-input')] = input.value;
    });
    if (global.IfluxAuth) IfluxAuth.updateUser(patch);
    if (global.IfluxProfileActivityStore && global.IfluxAuth && IfluxAuth.getUser()) {
      IfluxProfileActivityStore.log(IfluxAuth.getUser().id, {
        type: 'profile',
        icon: 'ti-user-edit',
        iconClass: 'info',
        title: 'Cập nhật tài khoản',
        desc: 'Đã lưu thông tin tài khoản và hồ sơ.'
      });
    }
    setEditMode(false);
    init();
    if (global.ixToast) ixToast('Đã lưu hồ sơ', 'success');
  }

  function bindEditChrome() {
    if (editBound || !document.querySelector('[data-ifx-profile-sidebar]')) return;
    editBound = true;

    document.querySelectorAll('[data-ifx-side-edit-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { setEditMode(true); });
    });
    document.querySelectorAll('[data-ifx-side-edit-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () { setEditMode(false); });
    });

    var saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveProfileFromSidebar);
    }
  }

  function paintSidebarStats(user, sidebar) {
    if (!user || !user.stats) return;
    function scoped(sel) {
      return sidebar ? sidebar.querySelectorAll(sel) : document.querySelectorAll(sel);
    }
    scoped('[data-bind="posts"]').forEach(function (el) {
      el.textContent = user.stats.posts != null ? String(user.stats.posts) : '0';
    });
    scoped('[data-bind="followers"]').forEach(function (el) {
      el.textContent = user.stats.followers != null ? String(user.stats.followers) : '0';
    });
    scoped('[data-bind="following"]').forEach(function (el) {
      el.textContent = user.stats.following != null ? String(user.stats.following) : '0';
    });
  }

  function loadSidebarStatsFromApi(user) {
    if (!user || !user.id) return Promise.resolve();
    user.stats = user.stats || { posts: 0, followers: 0, following: 0 };

    var token = global.IfluxAuth && IfluxAuth.getToken ? IfluxAuth.getToken() : null;
    if (token && token.indexOf('mock_jwt_') === 0) return Promise.resolve();
    if (!global.IfluxProfileFollowStore || !IfluxProfileFollowStore.countsAsync) {
      return Promise.resolve();
    }

    return IfluxProfileFollowStore.countsAsync(user.id).then(function (c) {
      if (!c) return;
      user.stats.posts = c.posts != null ? c.posts : 0;
      user.stats.followers = c.followers != null ? c.followers : 0;
      user.stats.following = c.following != null ? c.following : 0;
      if (global.IfluxAuth && IfluxAuth.updateUser) {
        IfluxAuth.updateUser({ stats: user.stats });
      }
      paintSidebarStats(user, document.querySelector('[data-ifx-profile-sidebar]'));
    }).catch(function () { /* offline — giữ 0 */ });
  }

  function bindView() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    var ini = initials(user.display_name);
    var sidebar = document.querySelector('[data-ifx-profile-sidebar]');
    var scope = sidebar || document;

    function scoped(sel) {
      return sidebar ? sidebar.querySelectorAll(sel) : document.querySelectorAll(sel);
    }

    scoped('[data-bind="display_name"]').forEach(function (el) { if (user.display_name) el.textContent = user.display_name; });
    scoped('[data-bind="username"]').forEach(function (el) { if (user.username) el.textContent = user.username; });
    scoped('[data-bind="email"]').forEach(function (el) { if (user.email) el.textContent = user.email; });
    scoped('[data-bind="phone"]').forEach(function (el) { if (user.phone) el.textContent = user.phone; });
    scoped('[data-bind="tier_label"]').forEach(function (el) {
      el.textContent = global.IfluxAuth.getMenuTierLabel ? IfluxAuth.getMenuTierLabel() : (user.tier_label || '');
    });
    scoped('[data-bind="role"]').forEach(function (el) { el.textContent = user.role || 'Thành viên'; });
    scoped('[data-bind="country"]').forEach(function (el) { if (user.country) el.textContent = user.country; });
    scoped('[data-bind="joined_at"]').forEach(function (el) { if (user.joined_at) el.textContent = user.joined_at; });
    scoped('[data-bind="bio"]').forEach(function (el) { el.textContent = user.bio || '—'; });
    scoped('[data-bind="referral_code"]').forEach(function (el) { if (user.referral_code) el.textContent = user.referral_code; });
    scoped('[data-bind="status_label"]').forEach(function (el) {
      el.textContent = user.status_label || (user.status === 'suspended' ? 'Tạm khóa' : 'Hoạt động');
    });
    scoped('[data-bind="posts"]').forEach(function (el) {
      el.textContent = (user.stats && user.stats.posts != null) ? String(user.stats.posts) : '0';
    });
    scoped('[data-bind="followers"]').forEach(function (el) {
      el.textContent = (user.stats && user.stats.followers != null) ? String(user.stats.followers) : '0';
    });
    scoped('[data-bind="following"]').forEach(function (el) {
      el.textContent = (user.stats && user.stats.following != null) ? String(user.stats.following) : '0';
    });

    scoped('[data-bind="avatar"]').forEach(function (el) {
      if (el.id === 'ifx-account-avatar-preview') return;
      if (global.IfluxProfileAvatar) {
        IfluxProfileAvatar.renderInto(el, Object.assign({}, user, { initials: ini }));
      } else {
        el.textContent = ini;
      }
    });

    if (user.plan) {
      scoped('[data-bind="plan_progress"]').forEach(function (el) {
        if (user.plan.days_total) {
          el.style.width = Math.round((user.plan.days_left / user.plan.days_total) * 100) + '%';
        }
      });
      scoped('[data-bind="plan_days"]').forEach(function (el) {
        el.textContent = (user.plan.days_left || 0) + ' / ' + (user.plan.days_total || 30) + ' ngày';
      });
    }

    bindPlanUpgrade(user);
    renderPlanFeatures(user);

    if (sidebar) sidebar.setAttribute('data-ifx-bound', '1');
    var hero = document.querySelector('[data-ifx-profile-hero]');
    if (hero) hero.setAttribute('data-ifx-bound', '1');
  }

  function init() {
    bindView();
    var user = global.IfluxAuth && IfluxAuth.getUser();
    loadSidebarStatsFromApi(user);
    if (global.IfluxProfileAvatar && document.querySelector('[data-ifx-profile-sidebar]')) {
      IfluxProfileAvatar.initOwn();
    }
    bindEditChrome();
  }

  global.IfluxProfileSidebar = {
    init: init,
    refresh: init,
    setEditMode: setEditMode,
    enterEditMode: function () { setEditMode(true); }
  };

  /* Widget / dashboard legacy alias */
  global.ProfileBind = global.IfluxProfileSidebar;
})(window);
