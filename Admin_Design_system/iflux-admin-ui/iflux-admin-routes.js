/* iFlux Admin — Route + Page Registry (SoT). pageKey ↔ slug ↔ file */
(function (global) {
  'use strict';
  if (global.IfluxAdminRoutes) return;
  var PAGES = {
    "dashboard-index": { key: "dashboard-index", slug: "/admin/tong-quan", file: "dashboard/index.html", legacySlugs: ["/admin/dashboard"] },
    "users-list": { key: "users-list", slug: "/admin/khach-hang/list", file: "users/list.html" },
    "users-export": { key: "users-export", slug: "/admin/khach-hang/export", file: "users/export.html" },
    "market-stocks": { key: "market-stocks", slug: "/admin/thi-truong/stocks", file: "market/stocks.html" },
    "market-ecosystems-index": { key: "market-ecosystems-index", slug: "/admin/thi-truong/ecosystems", file: "market/ecosystems.html" },
    "market-sectors-index": { key: "market-sectors-index", slug: "/admin/thi-truong/sectors", file: "market/sectors.html" },
    "market-lot-threshold": { key: "market-lot-threshold", slug: "/admin/thi-truong/lot-threshold", file: "market/lot-threshold.html" },
    "market-ranking": { key: "market-ranking", slug: "/admin/thi-truong/ranking", file: "market/ranking.html" },
    "market-formulas": { key: "market-formulas", slug: "/admin/thi-truong/formulas", file: "market/formulas.html" },
    "market-ops-feed-health": { key: "market-ops-feed-health", slug: "/admin/van-hanh-du-lieu/feed-health", file: "market-ops/feed-health.html", legacySlugs: ["/admin/market-ops/feed-health"] },
    "market-ops-sessions": { key: "market-ops-sessions", slug: "/admin/van-hanh-du-lieu/sessions", file: "market-ops/sessions.html", legacySlugs: ["/admin/market-ops/sessions"] },
    "market-ops-missing-ticks": { key: "market-ops-missing-ticks", slug: "/admin/van-hanh-du-lieu/missing-ticks", file: "market-ops/missing-ticks.html", legacySlugs: ["/admin/market-ops/missing-ticks"] },
    "market-ops-corrections": { key: "market-ops-corrections", slug: "/admin/van-hanh-du-lieu/corrections", file: "market-ops/corrections.html", legacySlugs: ["/admin/market-ops/corrections"] },
    "data-sources": { key: "data-sources", slug: "/admin/thi-truong/data-sources", file: "data/sources.html" },
    "market-stock-schema": { key: "market-stock-schema", slug: "/admin/thi-truong/dong-bo-cau-truc-co-phieu", file: "data/dong-bo-cau-truc-co-phieu.html" },
    "market-price-data": { key: "market-cau-hinh-thoi-gian", slug: "/admin/thi-truong/cau-hinh-thoi-gian", file: "market/cau-hinh-thoi-gian.html", legacy: true },
    "market-sync-history": { key: "market-sync-history", slug: "/admin/thi-truong/lich-su-dong-bo", file: "data/lich-su-dong-bo.html" },
    "data-sources-legacy": { key: "data-sources", slug: "/admin/du-lieu/sources", file: "data/sources.html", legacy: true },
    "data-etl-jobs": { key: "data-etl-jobs", slug: "/admin/du-lieu/etl-jobs", file: "data/etl-jobs.html" },
    "data-pipeline": { key: "data-pipeline", slug: "/admin/du-lieu/pipeline", file: "data/pipeline.html" },
    "data-quality": { key: "data-quality", slug: "/admin/du-lieu/quality", file: "data/quality.html" },
    "data-dictionary": { key: "data-dictionary", slug: "/admin/du-lieu/dictionary", file: "data/dictionary.html" },
    "data-reconciliation": { key: "data-reconciliation", slug: "/admin/du-lieu/reconciliation", file: "data/reconciliation.html" },
    "subscription-plans": { key: "subscription-plans", slug: "/admin/goi-cuoc/plans", file: "subscription/plans.html", legacySlugs: ["/admin/subscription/plans"] },
    "subscription-plan-add": { key: "subscription-plan-add", slug: "/admin/goi-cuoc/plan-edit?plan=new", file: "subscription/plan-edit.html", legacySlugs: ["/admin/subscription/plan-edit"] },
    "subscription-entitlements": { key: "subscription-entitlements", slug: "/admin/goi-cuoc/entitlements", file: "subscription/entitlements.html", legacySlugs: ["/admin/subscription/entitlements", "/admin/quyen-han", "/admin/access"] },
    "subscription-transactions": { key: "orders-list", slug: "/admin/don-hang/list", file: "orders/list.html", legacy: true },
    "orders-list": { key: "orders-list", slug: "/admin/don-hang/list", file: "orders/list.html" },
    "orders-add": { key: "orders-add", slug: "/admin/don-hang/add", file: "orders/add.html" },
    "orders-edit": { key: "orders-edit", slug: "/admin/don-hang/edit", file: "orders/edit.html" },
    "subscription-membership-intro": { key: "subscription-membership-intro", slug: "/admin/thanh-vien/membership", file: "loyalty/membership.html", legacy: true },
    "subscription-loyalty": { key: "loyalty-membership-list", slug: "/admin/thanh-vien/membership", file: "loyalty/membership.html", legacy: true },
    "loyalty-promo-list": { key: "loyalty-promo-list", slug: "/admin/thanh-vien/ma-list", file: "loyalty/ma-list.html", legacySlugs: ["/admin/loyalty/ma-list"] },
    "loyalty-promo-add": { key: "loyalty-promo-add", slug: "/admin/thanh-vien/ma-them", file: "loyalty/ma-them.html", legacySlugs: ["/admin/loyalty/ma-them"] },
    "loyalty-promo-usage": { key: "loyalty-promo-usage", slug: "/admin/thanh-vien/ma-su-dung", file: "loyalty/ma-su-dung.html", legacySlugs: ["/admin/loyalty/ma-su-dung"] },
    "loyalty-membership-list": { key: "loyalty-membership-list", slug: "/admin/thanh-vien/membership", file: "loyalty/membership.html", legacySlugs: ["/admin/loyalty/membership"] },
    "notifications-push": { key: "notifications-push", slug: "/admin/thong-bao/push", file: "notifications/push.html" },
    "notifications-in-app": { key: "notifications-in-app", slug: "/admin/thong-bao/in-app", file: "notifications/in-app.html" },
    "notifications-email": { key: "notifications-email", slug: "/admin/thong-bao/email", file: "notifications/email.html" },
    "notifications-history": { key: "notifications-history", slug: "/admin/thong-bao/history", file: "notifications/history.html" },
    "system-announcements": { key: "system-announcements", slug: "/admin/he-thong/announcements", file: "system/announcements.html" },
    "metadata-sector-types": { key: "metadata-sector-types", slug: "/admin/tham-so/sector-types", file: "metadata/sector-types.html" },
    "metadata-enums": { key: "metadata-enums", slug: "/admin/tham-so/enums", file: "metadata/enums.html" },
    "metadata-themes": { key: "metadata-themes", slug: "/admin/tham-so/themes", file: "metadata/themes.html" },
    "metadata-chu-de-lifecycle": { key: "metadata-chu-de-lifecycle", slug: "/admin/tham-so/chu-de-lifecycle", file: "metadata/chu-de-lifecycle.html" },
    /* Owner 2026-08-10: Nhận diện thương hiệu UI removed — SEO hệ thống owns name/logo/favicon.
       Keep key as alias → Thiết lập SEO hệ thống (bookmark/redirect). */
    "marketing-brand-identity": { key: "marketing-seo-system", slug: "/admin/tiep-thi/brand-identity", file: "marketing/thiet-lap-seo-he-thong.html", legacy: true },
    "marketing-seo-system": { key: "marketing-seo-system", slug: "/admin/tiep-thi/thiet-lap-seo-he-thong", file: "marketing/thiet-lap-seo-he-thong.html", legacySlugs: ["/admin/tiep-thi/seo-system"] },
    "marketing-seo-pages": { key: "marketing-seo-pages", slug: "/admin/tiep-thi/thiet-lap-seo-tung-trang", file: "marketing/thiet-lap-seo-tung-trang.html", legacySlugs: ["/admin/tiep-thi/seo-pages"] },
    "marketing-onboarding": { key: "marketing-onboarding", slug: "/admin/tiep-thi/onboarding", file: "marketing/onboarding.html" },
    "library-image-profiles": { key: "library-image-profiles", slug: "/admin/thu-vien/quy-chuan-hinh-anh", file: "library/quy-chuan-hinh-anh.html" },
    "system-page-settings": { key: "system-page-settings", slug: "/admin/he-thong/page-settings", file: "system/page-settings.html" },
    "system-templates": { key: "system-templates", slug: "/admin/he-thong/templates", file: "system/templates.html" },
    "system-ds-studio": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-primitive-tokens", file: "system/ds-studio.html" },
    "system-ds-studio-2": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-foundations", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-3": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-design-tokens", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-4": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-icons", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-5": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-charts", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-6": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-atoms", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-7": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-items", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-8": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-blocks", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-9": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-cards", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-10": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-organisms", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-11": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-sections", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-12": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-business-objects", file: "system/ds-studio.html", legacy: true },
    "system-ds-studio-13": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-user-flows", file: "system/ds-studio.html", legacy: true },
    "system-sla": { key: "system-sla", slug: "/admin/he-thong/sla", file: "system/sla.html" },
    "market-cau-hinh-thoi-gian": { key: "market-cau-hinh-thoi-gian", slug: "/admin/thi-truong/cau-hinh-thoi-gian", file: "market/cau-hinh-thoi-gian.html", legacySlugs: ["/admin/thi-truong/du-lieu-giao-dich", "/admin/du-lieu/du-lieu-giao-dich"] },
    /* legacy bookmark → cùng trang Thị trường */
    "system-core-setup": { key: "market-cau-hinh-thoi-gian", slug: "/admin/thi-truong/cau-hinh-thoi-gian", file: "market/cau-hinh-thoi-gian.html", legacy: true },
    "system-core-setup-legacy": { key: "system-core-setup-legacy", slug: "/admin/he-thong/core-setup", file: "system/core-setup.html", legacy: true },
    "system-platform-layers": { key: "system-platform-layers", slug: "/admin/he-thong/platform-layers", file: "system/platform-layers.html" },
    "system-feature-flags": { key: "system-feature-flags", slug: "/admin/he-thong/feature-flags", file: "system/feature-flags.html" },
    "system-maintenance": { key: "system-maintenance", slug: "/admin/he-thong/maintenance", file: "system/maintenance.html" },
    "system-admin-list": { key: "system-admin-list", slug: "/admin/administrators/list", file: "system/admin-list.html", legacySlugs: ["/admin/system-settings/administrators/list", "/admin/he-thong/admin-list", "/admin/system/admin-list", "/admin/he-thong/admin-users"] },
    "system-admin-profile": { key: "system-admin-profile", slug: "/admin/administrators/profile", file: "system/admin-profile.html", legacySlugs: ["/admin/system-settings/administrators/profile", "/admin/he-thong/admin-profile", "/admin/system/admin-profile"] },
    "system-admin-roles": { key: "system-admin-roles", slug: "/admin/administrators/roles", file: "system/admin-roles.html", legacySlugs: ["/admin/system-settings/administrators/roles", "/admin/he-thong/admin-roles", "/admin/system/admin-roles", "/admin/he-thong/roles"] },
    "system-admin-permissions": { key: "system-admin-permissions", slug: "/admin/administrators/permissions", file: "system/admin-permissions.html", legacySlugs: ["/admin/system-settings/administrators/permissions", "/admin/he-thong/admin-permissions", "/admin/system/admin-permissions"] },
    "system-roles": { key: "system-admin-roles", slug: "/admin/administrators/roles", file: "system/admin-roles.html", legacy: true },
    "system-audit": { key: "system-audit", slug: "/admin/he-thong/audit", file: "system/audit.html" },
    "system-admin-users": { key: "system-admin-list", slug: "/admin/administrators/list", file: "system/admin-list.html", legacy: true },
    "community-content-dashboard": { key: "community-content-dashboard", slug: "/admin/cong-dong/content/dashboard", file: "community/content/dashboard.html" },
    "community-content-edit": { key: "community-content-edit", slug: "/admin/cong-dong/content/edit", file: "community/content/edit.html" },
    "community-content-index": { key: "community-content-index", slug: "/admin/cong-dong/danh-sach-bai-viet", file: "community/danh-sach-bai-viet.html", legacySlugs: ["/admin/cong-dong/content"] },
    "community-categories": { key: "community-categories", slug: "/admin/cong-dong/categories", file: "community/categories.html" },
    "community-chu-de-list": { key: "community-chu-de-list", slug: "/admin/cong-dong/danh-sach-chu-de", file: "community/danh-sach-chu-de.html", legacySlugs: ["/admin/chu-de/registry", "/admin/story/registry"] },
    "community-author-list": { key: "community-author-list", slug: "/admin/cong-dong/danh-sach-tac-gia", file: "community/danh-sach-tac-gia.html" },
    "community-chu-de-moderation": { key: "community-chu-de-moderation", slug: "/admin/cong-dong/chu-de-moderation", file: "community/chu-de-moderation.html" },
    "community-comments": { key: "community-comments", slug: "/admin/cong-dong/comments", file: "community/comments.html" },
    "community-reports": { key: "community-reports", slug: "/admin/cong-dong/reports", file: "community/reports.html" },
    "community-experts": { key: "community-experts", slug: "/admin/cong-dong/experts", file: "community/experts.html" },
    "community-rss-providers": { key: "community-rss-providers", slug: "/admin/cong-dong/nguon-rss", file: "community/nguon-rss.html" },
    "community-rss-category-sync": { key: "community-rss-category-sync", slug: "/admin/cong-dong/dong-bo-danh-muc", file: "community/dong-bo-danh-muc.html" },
    "community-rss-article-schema": { key: "community-rss-article-schema", slug: "/admin/cong-dong/dong-bo-cau-truc-bai-viet", file: "community/dong-bo-cau-truc-bai-viet.html" },
    "cau-chuyen-list": { key: "cau-chuyen-list", slug: "/admin/cau-chuyen/danh-sach", file: "chu-de/danh-sach-cau-chuyen.html", legacySlugs: ["/admin/chu-de/danh-sach-cau-chuyen", "/admin/cau-chuyen"] },
    "cau-chuyen-detail": { key: "cau-chuyen-detail", slug: "/admin/cau-chuyen/chi-tiet", file: "chu-de/chi-tiet-cau-chuyen.html" },
    "chu-de-registry": { key: "community-chu-de-list", slug: "/admin/cong-dong/danh-sach-chu-de", file: "community/danh-sach-chu-de.html", legacy: true },
    "chu-de-detail": { key: "chu-de-detail", slug: "/admin/chu-de/detail", file: "chu-de/detail.html", legacySlugs: ["/admin/story/detail"] },
    "chu-de-mapping": { key: "chu-de-mapping", slug: "/admin/chu-de/mapping", file: "chu-de/mapping.html", legacySlugs: ["/admin/story/mapping"] },
    "chu-de-analytics": { key: "chu-de-analytics", slug: "/admin/chu-de/analytics", file: "chu-de/analytics.html", legacySlugs: ["/admin/story/analytics"] },
    "ai-prompts": { key: "ai-prompts", slug: "/admin/trung-tam-ai/prompts", file: "ai/prompts.html" },
    "ai-prompt-detail": { key: "ai-prompt-detail", slug: "/admin/trung-tam-ai/prompt-detail", file: "ai/prompt-detail.html" },
    "ai-logs": { key: "ai-logs", slug: "/admin/trung-tam-ai/logs", file: "ai/logs.html" },
    "ai-cost": { key: "ai-cost", slug: "/admin/trung-tam-ai/cost", file: "ai/cost.html" },
    "ai-quality": { key: "ai-quality", slug: "/admin/trung-tam-ai/quality", file: "ai/quality.html" },
    "analytics-users": { key: "analytics-users", slug: "/admin/phan-tich/users", file: "analytics/users.html" },
    "analytics-chu-de": { key: "analytics-chu-de", slug: "/admin/phan-tich/chu-de", file: "analytics/chu-de.html" },
    "analytics-revenue": { key: "analytics-revenue", slug: "/admin/phan-tich/revenue", file: "analytics/revenue.html" },
    "analytics-funnel": { key: "analytics-funnel", slug: "/admin/phan-tich/funnel", file: "analytics/funnel.html" },
    "Admin-Design-system-hub": { key: "Admin-Design-system-hub", slug: "/Admin_Design_system/hub.html", file: null },
    "Admin-Design-system-design-system": { key: "Admin-Design-system-design-system", slug: "/Admin_Design_system/design-system.html", file: null },
    "Admin-Design-system-patterns-table-list": { key: "Admin-Design-system-patterns-table-list", slug: "/Admin_Design_system/patterns/table-list.html", file: null },
    "Admin-Design-system-patterns-form-add": { key: "Admin-Design-system-patterns-form-add", slug: "/Admin_Design_system/patterns/form-add.html", file: null },
    "Admin-Design-system-patterns-charts": { key: "Admin-Design-system-patterns-charts", slug: "/Admin_Design_system/patterns/charts.html", file: null },
    "req-partnership": { key: "req-partnership", slug: "/admin/yeu-cau/partnership", file: "requests/partnership.html" },
    "req-withdrawals": { key: "req-withdrawals", slug: "/admin/yeu-cau/withdrawals", file: "requests/withdrawals.html" },
    "req-features": { key: "req-features", slug: "/admin/yeu-cau/features", file: "requests/features.html" },
    "req-bugs": { key: "req-bugs", slug: "/admin/yeu-cau/bugs", file: "requests/bugs.html" },
  };

  function normalizePath(path) {
    path = String(path || '').split('?')[0];
    var hash = '';
    var hi = path.indexOf('#');
    if (hi >= 0) { hash = path.slice(hi); path = path.slice(0, hi); }
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    return { path: path || '/', hash: hash };
  }

  function decorateFromSlug(ia, slug) {
    slug = String(slug || '');
    var hash = '';
    var q = '';
    var qi = slug.indexOf('?');
    var hi = slug.indexOf('#');
    if (qi >= 0) {
      var rest = slug.slice(qi);
      var hi2 = rest.indexOf('#');
      q = hi2 >= 0 ? rest.slice(0, hi2) : rest;
    }
    if (hi >= 0) hash = '#' + slug.split('#').slice(1).join('#');
    return ia + q + hash;
  }

  function hrefFor(key) {
    var Nav = global.IfluxAdminNavRegistry;
    var p = PAGES[key];
    if (Nav && Nav.pathFor) {
      var ia = Nav.pathFor(key);
      if (!ia && p && p.key && p.key !== key) ia = Nav.pathFor(p.key);
      if (ia) return decorateFromSlug(ia, p && p.slug);
    }
    if (p && p.slug) return p.slug;
    /* Alias: object key ≠ value.key (vd. market-price-data → market-cau-hinh-thoi-gian). */
    var k;
    for (k in PAGES) {
      if (!Object.prototype.hasOwnProperty.call(PAGES, k)) continue;
      if (PAGES[k] && PAGES[k].key === key && PAGES[k].slug) return PAGES[k].slug;
    }
    return '#';
  }

  var VI_DIR = {
    'tong-quan': 'dashboard',
    'khach-hang': 'users',
    'quyen-han': 'access',
    'thi-truong': 'market',
    'van-hanh-du-lieu': 'market-ops',
    'du-lieu': 'data',
    'goi-cuoc': 'subscription',
    'don-hang': 'orders',
    'thanh-vien': 'loyalty',
    'thong-bao': 'notifications',
    'tham-so': 'metadata',
    'tiep-thi': 'marketing',
    'he-thong': 'system',
    'cong-dong': 'community',
    'phan-tich': 'analytics',
    'yeu-cau': 'requests',
    'trung-tam-ai': 'ai',
    'chu-de': 'chu-de',
    'cau-chuyen': 'chu-de',
    'san-pham': 'product'
  };

  function fileFromAdminPath(pathname) {
    if (pathname === '/admin/tong-quan' || pathname === '/admin/overview') return 'dashboard/index.html';
    /* BR-11 — MDM under Thị trường → data/* */
    if (pathname === '/admin/thi-truong/data-sources') return 'data/sources.html';
    if (pathname === '/admin/thi-truong/dong-bo-cau-truc-co-phieu') return 'data/dong-bo-cau-truc-co-phieu.html';
    if (pathname === '/admin/thi-truong/lich-su-dong-bo') return 'data/lich-su-dong-bo.html';
    var m = pathname.match(/^\/admin\/([^/]+)(?:\/(.+))?$/);
    if (!m) return null;
    var dir = VI_DIR[m[1]];
    if (!dir) return null;
    var rest = m[2] || '';
    if (!rest) return dir + '/index.html';
    if (rest.indexOf('.') >= 0) return dir + '/' + rest;
    return dir + '/' + rest + '.html';
  }

  function matchPath(pathname, hash) {
    pathname = String(pathname || '').replace(/\/+$/, '') || '/';
    hash = String(hash || '');
    var pathFile = fileFromAdminPath(pathname);
    var best = null, bestLen = -1;
    Object.keys(PAGES).forEach(function (k) {
      var p = PAGES[k];
      var slugs = [p.slug || ''];
      if (p.legacySlugs && p.legacySlugs.length) slugs = slugs.concat(p.legacySlugs);
      var Nav = global.IfluxAdminNavRegistry;
      if (Nav && Nav.pathFor) {
        var ia = Nav.pathFor(p.key);
        if (ia) slugs.push(ia);
      }
      var score = -1;
      slugs.forEach(function (slug) {
        var slugPath = String(slug || '').split('#')[0];
        var slugHash = slug.indexOf('#') >= 0 ? '#' + slug.split('#').slice(1).join('#') : '';
        var s = -1;
        if (slugHash && hash === slugHash && (pathname === slugPath || pathname.indexOf('/ds-studio') >= 0 || pathname.indexOf('/he-thong/ds-studio') >= 0)) {
          s = slug.length + 1000;
        } else if (!slugHash && slugPath && (pathname === slugPath || pathname.indexOf(slugPath + '/') === 0)) {
          s = slugPath.length;
        }
        if (s > score) score = s;
      });
      var slug = p.slug || '';
      var slugHash = slug.indexOf('#') >= 0 ? '#' + slug.split('#').slice(1).join('#') : '';
      if (p.file) {
        var fileBase = '/Admin_Design_system/app/' + p.file;
        if (pathname === fileBase || pathname.indexOf(fileBase) === 0) {
          var fs = p.file.length;
          if (slugHash && hash === slugHash) fs += 1000;
          if (fs > score) score = fs;
        }
        if (pathFile && pathFile === p.file) {
          var ps = p.file.length + 500;
          if (slugHash && hash === slugHash) ps += 1000;
          if (!slugHash && !hash) ps += 50;
          if (ps > score) score = ps;
        }
        if (pathname.indexOf('/' + p.file) >= 0 || pathname.endsWith('/' + p.file.replace(/\.html$/, ''))) {
          var rs = p.file.length;
          if (rs > score) score = rs;
        }
      }
      if (p.legacy) score -= 1;
      if (score > bestLen) { best = k; bestLen = score; }
    });
    if (!best) return best;
    return (PAGES[best] && PAGES[best].key) || best;
  }

  function detectActiveKey() {
    var path = (global.location && global.location.pathname) || '';
    var hash = (global.location && global.location.hash) || '';
    var search = (global.location && global.location.search) || '';
    var pathOnly = String(path).split('?')[0];
    if (/\/plan-edit(\.html)?$/.test(pathOnly) || /\/goi-cuoc\/plan-edit$/.test(pathOnly) || /\/subscriptions\/plan-edit$/.test(pathOnly)) {
      var plan = '';
      try { plan = new URLSearchParams(search).get('plan') || ''; } catch (e) { plan = ''; }
      if (plan === 'new') return 'subscription-plan-add';
      /* Sửa gói → giữ highlight Danh sách Gói */
      return 'subscription-plans';
    }
    if (/\/don-hang\/edit(\.html)?$/.test(pathOnly) || /\/orders\/edit(\.html)?$/.test(pathOnly) || /\/admin\/orders\/edit$/.test(pathOnly)) {
      return 'orders-list';
    }
    var ident = matchPath(path, hash);
    /* D-03: identity = system-ds-studio; nav highlight vẫn theo region hash. */
    if (ident === 'system-ds-studio' && hash) {
      var sk;
      for (sk in PAGES) {
        if (!Object.prototype.hasOwnProperty.call(PAGES, sk)) continue;
        var sp = PAGES[sk];
        if (!sp || String(sp.slug || '').indexOf('/ds-studio') < 0) continue;
        var sh = String(sp.slug);
        var shash = sh.indexOf('#') >= 0 ? '#' + sh.split('#').slice(1).join('#') : '';
        if (shash && shash === hash) return sk;
      }
    }
    return ident;
  }

  global.IfluxAdminRoutes = {
    PAGES: PAGES,
    hrefFor: hrefFor,
    matchPath: matchPath,
    detectActiveKey: detectActiveKey,
    count: Object.keys(PAGES).length
  };
})(window);
