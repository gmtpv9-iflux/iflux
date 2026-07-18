/* iFlux Admin — client phân quyền: nạp permissions + ẩn menu/nút theo quyền */
(function (global) {
  'use strict';

  var Auth = global.IfluxAdminAuth;
  var cache = { loaded: false, isSuper: false, perms: new Set() };

  /** Ánh xạ href menu → permission view (key trong catalog backend). */
  var HREF_PERM = [
    { re: /\/admin\/tong-quan|\/dashboard\/index|\/dashboard|\/admin\/dashboard/, p: 'dashboard.overview.view' },
    { re: /\/admin\/khach-hang\/list|\/users\/list/, p: 'users.list.view' },
    { re: /\/admin\/khach-hang\/export|\/users\/export/, p: 'users.list.export' },
    { re: /\/admin\/quyen-han\/roles|\/access\/roles/, p: 'users.list.view' },
    { re: /\/admin\/quyen-han\/permissions|\/access\/permissions/, p: 'users.list.view' },
    { re: /\/admin\/thi-truong\/stocks|\/market\/stocks/, p: 'market.stocks.view' },
    { re: /\/admin\/thi-truong\/ecosystems|\/market\/ecosystems/, p: 'market.ecosystems.view' },
    { re: /\/admin\/thi-truong\/sectors|\/market\/sectors/, p: 'market.sectors.view' },
    { re: /\/admin\/thi-truong\/lot-threshold|\/market\/lot-threshold/, p: 'market.lot_threshold.view' },
    { re: /\/admin\/thi-truong\/ranking|\/market\/ranking/, p: 'market.ranking.view' },
    { re: /\/admin\/thi-truong\/formulas|\/market\/formulas/, p: 'market.formulas.view' },
    { re: /\/admin\/van-hanh-du-lieu\/feed-health|\/market-ops\/feed-health/, p: 'market_ops.feed_health.view' },
    { re: /\/admin\/van-hanh-du-lieu\/sessions|\/market-ops\/sessions/, p: 'market_ops.sessions.view' },
    { re: /\/admin\/van-hanh-du-lieu\/missing-ticks|\/market-ops\/missing-ticks/, p: 'market_ops.missing_ticks.view' },
    { re: /\/admin\/van-hanh-du-lieu\/corrections|\/market-ops\/corrections/, p: 'market_ops.corrections.view' },
    { re: /\/admin\/du-lieu\/sources|\/data\/sources/, p: 'data.sources.view' },
    { re: /\/admin\/du-lieu\/etl-jobs|\/data\/etl-jobs/, p: 'data.etl_jobs.view' },
    { re: /\/admin\/du-lieu\/pipeline|\/data\/pipeline/, p: 'data.pipeline.view' },
    { re: /\/admin\/du-lieu\/quality|\/data\/quality/, p: 'data.quality.view' },
    { re: /\/admin\/du-lieu\/dictionary|\/data\/dictionary/, p: 'data.dictionary.view' },
    { re: /\/admin\/du-lieu\/reconciliation|\/data\/reconciliation/, p: 'data.reconciliation.view' },
    { re: /\/admin\/goi-cuoc\/plans|\/subscription\/plans/, p: 'subscription.plans.view' },
    { re: /\/admin\/goi-cuoc\/entitlements|\/subscription\/entitlements/, p: 'subscription.entitlements.view' },
    { re: /\/admin\/goi-cuoc\/subscribers|\/subscription\/subscribers/, p: 'subscription.subscribers.view' },
    { re: /\/admin\/goi-cuoc\/transactions|\/subscription\/transactions/, p: 'subscription.transactions.view' },
    { re: /\/admin\/goi-cuoc\/loyalty|\/admin\/goi-cuoc\/membership-intro|\/subscription\/loyalty|\/subscription\/membership-intro/, p: 'subscription.loyalty.view' },
    { re: /\/admin\/thong-bao\/push|\/notifications\/push/, p: 'notifications.push.view' },
    { re: /\/admin\/thong-bao\/in-app|\/notifications\/in-app/, p: 'notifications.in_app.view' },
    { re: /\/admin\/thong-bao\/email|\/notifications\/email/, p: 'notifications.email.view' },
    { re: /\/admin\/thong-bao\/history|\/notifications\/history/, p: 'notifications.history.view' },
    { re: /\/admin\/he-thong\/announcements|\/system\/announcements/, p: 'notifications.templates.view' },
    { re: /\/admin\/tham-so\/sector-types|\/metadata\/sector-types/, p: 'metadata.sector_types.view' },
    { re: /\/admin\/tham-so\/enums|\/metadata\/enums/, p: 'metadata.enums.view' },
    { re: /\/admin\/tham-so\/themes|\/metadata\/themes/, p: 'metadata.themes.view' },
    { re: /\/admin\/tham-so\/chu-de-lifecycle|\/metadata\/story-lifecycle|\/metadata\/chu-de-lifecycle/, p: 'metadata.story_lifecycle.view' },
    { re: /\/admin\/tiep-thi\/brand-identity|\/marketing\/brand-identity/, p: 'marketing.brand_identity.view' },
    { re: /\/admin\/tiep-thi\/onboarding|\/marketing\/onboarding/, p: 'marketing.onboarding.view' },
    { re: /\/admin\/he-thong\/page-settings|\/system\/page-settings/, p: 'interface.page_settings.view' },
    { re: /\/admin\/he-thong\/widget-library|\/system\/widget-library/, p: 'interface.widget_library.view' },
    { re: /\/admin\/he-thong\/templates|\/system\/templates/, p: 'interface.design_system.view' },
    { re: /\/admin\/he-thong\/ds-studio|\/system\/ds-studio/, p: 'interface.design_system.view' },
    { re: /\/admin\/he-thong\/sla|\/system\/sla/, p: 'system.sla.view' },
    { re: /\/admin\/he-thong\/core-setup|\/system\/core-setup/, p: 'system.core_setup.view' },
    { re: /\/admin\/he-thong\/platform-layers|\/system\/platform-layers/, p: 'system.platform_layers.view' },
    { re: /\/admin\/he-thong\/feature-flags|\/system\/feature-flags/, p: 'system.feature_flags.view' },
    { re: /\/admin\/he-thong\/maintenance|\/system\/maintenance/, p: 'system.maintenance.view' },
    { re: /\/admin\/he-thong\/roles|\/system\/roles/, p: 'access.roles.view' },
    { re: /\/admin\/he-thong\/admin-users|\/system\/admin-users/, p: 'access.admin_accounts.view' },
    { re: /\/admin\/he-thong\/audit|\/system\/audit/, p: 'access.audit.view' },
    { re: /\/admin\/cong-dong\/chu-de-moderation|\/community\/stories|\/community\/chu-de-moderation/, p: 'community.stories.view' },
    { re: /\/admin\/cong-dong\/comments|\/community\/comments/, p: 'community.comments.view' },
    { re: /\/admin\/cong-dong\/reports|\/community\/reports/, p: 'community.reports.view' },
    { re: /\/admin\/cong-dong\/experts|\/community\/experts/, p: 'community.experts.view' },
    { re: /\/admin\/chu-de\/registry|\/story\/registry|\/chu-de\/registry/, p: 'stories.registry.view' },
    { re: /\/admin\/chu-de\/detail|\/story\/detail|\/chu-de\/detail/, p: 'stories.detail.view' },
    { re: /\/admin\/chu-de\/mapping|\/story\/mapping|\/chu-de\/mapping/, p: 'stories.mapping.view' },
    { re: /\/admin\/chu-de\/analytics|\/story\/analytics|\/chu-de\/analytics/, p: 'stories.analytics.view' },
    { re: /\/admin\/trung-tam-ai\/prompts|\/ai\/prompts/, p: 'ai.prompts.view' },
    { re: /\/admin\/trung-tam-ai\/prompt-detail|\/ai\/prompt-detail/, p: 'ai.prompts.view' },
    { re: /\/admin\/trung-tam-ai\/logs|\/ai\/logs/, p: 'ai.logs.view' },
    { re: /\/admin\/trung-tam-ai\/cost|\/ai\/cost/, p: 'ai.cost.view' },
    { re: /\/admin\/trung-tam-ai\/quality|\/ai\/quality/, p: 'ai.quality.view' },
    { re: /\/admin\/phan-tich\/users|\/analytics\/users/, p: 'dashboard.overview.view' },
    { re: /\/admin\/phan-tich\/chu-de|\/analytics\/stories|\/analytics\/chu-de/, p: 'stories.analytics.view' },
    { re: /\/admin\/phan-tich\/revenue|\/analytics\/revenue/, p: 'subscription.transactions.view' },
    { re: /\/admin\/phan-tich\/funnel|\/analytics\/funnel/, p: 'dashboard.overview.view' },
    { re: /\/admin\/yeu-cau\/|\/requests\//, p: 'users.list.view' }
  ];

  function permForHref(href) {
    var h = String(href || '');
    for (var i = 0; i < HREF_PERM.length; i++) {
      if (HREF_PERM[i].re.test(h)) return HREF_PERM[i].p;
    }
    return null;
  }

  function hasPermission(key) {
    if (!key) return true;
    if (cache.isSuper) return true;
    return cache.perms.has(key);
  }

  /** Dùng cache phiên (sau lần /me thành công trước) — tránh khóa oan khi API tạm lỗi. */
  function hydrateFromSession() {
    if (!Auth || !Auth.getSession) return;
    var s = Auth.getSession();
    var a = s && s.admin;
    if (!a) return;
    if (a.isSuper) cache.isSuper = true;
    if (a.permissions && a.permissions.length) {
      cache.perms = new Set(a.permissions);
      cache.loaded = true;
    }
  }

  function fetchAccessMe() {
    if (!Auth || !Auth.getSession || !Auth.apiBase) return Promise.resolve(null);
    hydrateFromSession();
    var s = Auth.getSession();
    if (!s || !s.token) return Promise.resolve(null);
    /* API backend: /api/admin/access/* (slug UI là /admin/quyen-han). */
    return fetch(Auth.apiBase() + '/admin/access/me', {
      headers: { Authorization: 'Bearer ' + s.token }
    }).then(function (r) {
      if (!r || !r.ok) return null;
      return r.json();
    }).then(function (d) {
      if (d && d.admin) {
        cache.isSuper = !!d.admin.isSuper;
        cache.perms = new Set(d.admin.permissions || []);
        cache.loaded = true;
        try {
          var raw = Auth.getSession();
          if (raw) {
            raw.admin = raw.admin || {};
            raw.admin.isSuper = cache.isSuper;
            raw.admin.permissions = Array.from(cache.perms);
            var store = localStorage.getItem(Auth.STORAGE_KEY) ? localStorage : sessionStorage;
            store.setItem(Auth.STORAGE_KEY, JSON.stringify(raw));
          }
        } catch (e) { /* ignore */ }
      }
      return d;
    }).catch(function () { return null; });
  }

  function hideEmptyMenuGroups() {
    document.querySelectorAll('.ix-menu .ix-menu-header').forEach(function (h) {
      var el = h.nextElementSibling;
      var any = false;
      while (el && !el.classList.contains('ix-menu-header')) {
        if (el.classList.contains('ix-menu-item') && el.style.display !== 'none' && el.offsetParent !== null) {
          any = true;
          break;
        }
        el = el.nextElementSibling;
      }
      h.style.display = any ? '' : 'none';
    });
  }

  function gateMenu() {
    /* Ưu tiên re-render từ App Shell (ẩn item theo permission trong Registry). */
    if (global.IfluxAdminAppShell && global.IfluxAdminAppShell.refresh) {
      try {
        global.IfluxAdminAppShell.refresh();
        hideEmptyMenuGroups();
        return;
      } catch (e) { /* fall through */ }
    }
    document.querySelectorAll('.ix-menu a.ix-menu-item[href]').forEach(function (a) {
      var need = a.getAttribute('data-ix-perm') || permForHref(a.getAttribute('href'));
      if (need && !hasPermission(need)) a.style.display = 'none';
    });
    document.querySelectorAll('[data-ix-perm]').forEach(function (el) {
      var need = el.getAttribute('data-ix-perm');
      if (need && !hasPermission(need)) el.style.display = 'none';
    });
    hideEmptyMenuGroups();
  }

  function gateCurrentPage() {
    /* Chưa nạp được quyền — không thay nội dung trang (tránh false deny). */
    if (!cache.loaded) return;
    var path = (global.location && global.location.pathname) || '';
    for (var i = 0; i < HREF_PERM.length; i++) {
      if (HREF_PERM[i].re.test(path) && !hasPermission(HREF_PERM[i].p)) {
        var denied = document.createElement('div');
        denied.className = 'ix-content';
        denied.innerHTML = '<div class="ix-card" style="padding:32px;text-align:center">' +
          '<h1 class="ix-page-title">Không có quyền truy cập</h1>' +
          '<p class="ix-fs-13" style="color:var(--ix-text-muted);margin-top:8px">Tài khoản của bạn không được phép xem trang này.</p>' +
          '<a href="/admin/tong-quan" class="ix-btn ix-btn-primary ix-mt-24">Về Tổng quan</a></div>';
        var main = document.querySelector('.ix-content');
        if (main) main.replaceWith(denied);
        return;
      }
    }
  }

  function init() {
    if (!Auth || Auth.isLoginPage && Auth.isLoginPage()) return;
    if (!Auth.isAuthenticated || !Auth.isAuthenticated()) return;
    fetchAccessMe().then(function () {
      gateMenu();
      gateCurrentPage();
    });
  }

  global.IfluxAdminRbac = {
    hasPermission: hasPermission,
    permForHref: permForHref,
    getPermissions: function () { return Array.from(cache.perms); },
    isSuper: function () { return cache.isSuper; },
    isLoaded: function () { return !!cache.loaded; },
    refresh: function () { return fetchAccessMe().then(function () { gateMenu(); }); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
