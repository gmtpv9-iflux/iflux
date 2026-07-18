/* Widget sidebar — thông tin hồ sơ + gói cước (hub trái) */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initials(name) {
    return (name || 'U').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function profileCardHtml(user) {
    user = user || {};
    var ini = initials(user.display_name);
    var avatarHtml = global.IfluxProfileAvatar
      ? '<div class="ix-profile-avatar ifx-hub-wgt-avatar" data-bind="avatar">' + esc(ini) + '</div>'
      : '<div class="ix-profile-avatar ifx-hub-wgt-avatar" data-bind="avatar">' + esc(ini) + '</div>';

    var tierLabel = global.IfluxAuth && IfluxAuth.getMenuTierLabel
      ? IfluxAuth.getMenuTierLabel()
      : (user.tier_label || 'Miễn phí');
    return (
      '<div class="ifx-hub-profile-card ix-card">' +
        '<div class="ix-card-body" style="padding:16px">' +
        '<div class="ix-profile-hero" style="padding:0">' +
          avatarHtml +
          '<div class="ifx-profile-name-row">' +
            '<div class="ix-profile-name"><span data-bind="display_name">' + esc(user.display_name || 'Thành viên') + '</span></div>' +
            '<span class="ix-chip ix-chip-primary ifx-profile-tier-chip"><span data-bind="tier_label">' + esc(tierLabel) + '</span></span>' +
          '</div>' +
          '<div class="ix-profile-stats" data-ifx-privacy="stats">' +
            '<div class="ix-profile-stat"><div class="ix-profile-stat-value"><span data-bind="posts">' + esc(user.stats && user.stats.posts != null ? user.stats.posts : 0) + '</span></div><div class="ix-profile-stat-label">Bài viết</div></div>' +
            '<div class="ix-profile-stat"><div class="ix-profile-stat-value"><span data-bind="followers">' + esc(user.stats && user.stats.followers != null ? user.stats.followers : 0) + '</span></div><div class="ix-profile-stat-label">Người theo dõi</div></div>' +
            '<div class="ix-profile-stat"><div class="ix-profile-stat-value"><span data-bind="following">' + esc(user.stats && user.stats.following != null ? user.stats.following : 0) + '</span></div><div class="ix-profile-stat-label">Đang theo dõi</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="ifx-hub-profile-details">' +
          '<div style="font-size:13px;font-weight:600;color:var(--ix-text-primary);margin-bottom:10px">Chi tiết</div>' +
          '<ul class="ix-detail-list">' +
            '<li><span class="ix-detail-label">Tên đăng nhập</span><span class="ix-detail-val"><span data-bind="username">' + esc(user.username || '—') + '</span></span></li>' +
            '<li><span class="ix-detail-label">Email</span><span class="ix-detail-val"><span data-bind="email">' + esc(user.email || '—') + '</span></span></li>' +
            '<li><span class="ix-detail-label">Trạng thái</span><span class="ix-chip ix-chip-success" style="font-size:11px">Hoạt động</span></li>' +
            '<li><span class="ix-detail-label">Tham gia</span><span class="ix-detail-val"><span data-bind="joined_at">' + esc(user.joined_at || '—') + '</span></span></li>' +
            '<li><span class="ix-detail-label">Giới thiệu</span><span class="ix-detail-val" style="font-size:13px;line-height:1.5"><span data-bind="bio">' + esc(user.bio || '—') + '</span></span></li>' +
          '</ul>' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" style="width:100%;margin-top:12px" data-ifx-goto-tab="tab-account" data-ifx-goto-subtab="mine-personal" data-ifx-goto-edit="1">' +
            '<i class="ti ti-edit" style="font-size:13px"></i> Chỉnh sửa hồ sơ' +
          '</button>' +
        '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function planCardHtml(user) {
    user = user || {};
    var Cat = global.IfluxPlansCatalog;
    var tier = String(user.tier || (user.plan && user.plan.tier) || 'free').toLowerCase();
    var target = Cat && Cat.nextUpgradeablePlan ? Cat.nextUpgradeablePlan(tier) : null;
    if (!target && (tier === 'elite' || tier === 'partner' || tier === 'admin')) {
      return '';
    }
    var proposeName = target
      ? (Cat.displayName ? Cat.displayName(target) : (target.name || target.tier))
      : 'Premium';
    var proposeTier = target ? (target.tier || 'premium') : 'premium';
    var chipCls = target && target.iconClass === 'warning' ? 'ix-chip-warning' : 'ix-chip-primary';
    var href = Cat && target && Cat.checkoutUrl
      ? Cat.checkoutUrl(target, 'annual')
      : '../pricing/index.html?propose=1&plan=' + encodeURIComponent(proposeTier);
    return (
      '<div class="ix-plan-card ifx-hub-plan-card ix-card" data-ifx-plan-promo>' +
        '<div class="ix-card-body" style="padding:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<span class="ix-chip ' + chipCls + '"><span data-bind="plan_name">' + esc(proposeName) + '</span></span>' +
          '<div class="ix-plan-price" data-bind="plan_price"><span class="ix-plan-price-cur">₫</span><span class="ix-plan-price-num">—</span><span class="ix-plan-price-per">/tháng</span></div>' +
        '</div>' +
        '<div data-ifx-plan-features></div>' +
        '<div style="margin:14px 0 8px">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ix-text-muted);margin-bottom:6px">' +
            '<span>Chu kỳ thanh toán</span><span style="color:var(--ix-text-primary);font-weight:600"><span data-bind="plan_days">—</span></span>' +
          '</div>' +
          '<div style="height:6px;background:rgba(105,108,255,.2);border-radius:3px;overflow:hidden">' +
            '<div data-bind="plan_progress" style="width:0%;height:100%;background:var(--ix-accent);border-radius:3px"></div>' +
          '</div>' +
        '</div>' +
        '<a href="' + href + '" class="ix-btn ix-btn-primary" data-ifx-plan-upgrade style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px">' +
          '<i class="ti ti-arrow-up-circle" style="font-size:13px"></i> Nâng cấp ' + esc(proposeName) +
        '</a>' +
        '</div>' +
      '</div>'
    );
  }

  function bindProfileWidget(el) {
    if (!el) return;
    var user = global.IfluxAuth && IfluxAuth.getUser();
    el.innerHTML = profileCardHtml(user);
    if (global.IfluxProfileAvatar && user) {
      var av = el.querySelector('[data-bind="avatar"]');
      if (av) IfluxProfileAvatar.renderInto(av, Object.assign({}, user, { initials: initials(user.display_name) }));
    }
    if (global.ProfileBind) ProfileBind.init();
    if (global.IfluxWatchlistUI) IfluxWatchlistUI.bindHearts(el);
    el.querySelectorAll('[data-ifx-goto-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (global.IfluxHubPage) IfluxHubPage.switchTab(btn.getAttribute('data-ifx-goto-tab'));
        var sub = btn.getAttribute('data-ifx-goto-subtab');
        if (sub && global.IfluxProfileMyPage) {
          setTimeout(function () {
            IfluxProfileMyPage.switchSubtab(sub);
            if (btn.getAttribute('data-ifx-goto-edit') === '1') {
              IfluxProfileMyPage.enterEditMode();
            }
          }, 0);
        }
      });
    });
  }

  function bindPlanWidget(el) {
    if (!el) return;
    var html = planCardHtml(global.IfluxAuth && IfluxAuth.getUser());
    el.innerHTML = html;
    if (!html) {
      var wrap = el.closest('.ifx-widget');
      if (wrap) wrap.hidden = true;
      return;
    }
    if (global.ProfileBind) ProfileBind.init();
  }

  global.IfluxProfileSidebarWidgets = {
    profileCardHtml: profileCardHtml,
    planCardHtml: planCardHtml,
    bindProfileWidget: bindProfileWidget,
    bindPlanWidget: bindPlanWidget
  };
})(window);
