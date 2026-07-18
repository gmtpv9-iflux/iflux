/* iFlux Admin — Route + Page Registry (SoT). pageKey ↔ slug ↔ file */
(function (global) {
  'use strict';
  if (global.IfluxAdminRoutes) return;
  var PAGES = {
    "dashboard-index": { key: "dashboard-index", slug: "/admin/tong-quan", file: "dashboard/index.html" },
    "users-list": { key: "users-list", slug: "/admin/khach-hang/list", file: "users/list.html" },
    "users-export": { key: "users-export", slug: "/admin/khach-hang/export", file: "users/export.html" },
    "access-roles": { key: "access-roles", slug: "/admin/quyen-han/roles", file: "access/roles.html" },
    "access-permissions": { key: "access-permissions", slug: "/admin/quyen-han/permissions", file: "access/permissions.html" },
    "market-stocks": { key: "market-stocks", slug: "/admin/thi-truong/stocks", file: "market/stocks.html" },
    "market-ecosystems-index": { key: "market-ecosystems-index", slug: "/admin/thi-truong/ecosystems", file: "market/ecosystems/index.html" },
    "market-sectors-index": { key: "market-sectors-index", slug: "/admin/thi-truong/sectors", file: "market/sectors/index.html" },
    "market-lot-threshold": { key: "market-lot-threshold", slug: "/admin/thi-truong/lot-threshold", file: "market/lot-threshold.html" },
    "market-ranking": { key: "market-ranking", slug: "/admin/thi-truong/ranking", file: "market/ranking.html" },
    "market-formulas": { key: "market-formulas", slug: "/admin/thi-truong/formulas", file: "market/formulas.html" },
    "market-ops-feed-health": { key: "market-ops-feed-health", slug: "/admin/van-hanh-du-lieu/feed-health", file: "market-ops/feed-health.html" },
    "market-ops-sessions": { key: "market-ops-sessions", slug: "/admin/van-hanh-du-lieu/sessions", file: "market-ops/sessions.html" },
    "market-ops-missing-ticks": { key: "market-ops-missing-ticks", slug: "/admin/van-hanh-du-lieu/missing-ticks", file: "market-ops/missing-ticks.html" },
    "market-ops-corrections": { key: "market-ops-corrections", slug: "/admin/van-hanh-du-lieu/corrections", file: "market-ops/corrections.html" },
    "data-sources": { key: "data-sources", slug: "/admin/du-lieu/sources", file: "data/sources.html" },
    "data-etl-jobs": { key: "data-etl-jobs", slug: "/admin/du-lieu/etl-jobs", file: "data/etl-jobs.html" },
    "data-pipeline": { key: "data-pipeline", slug: "/admin/du-lieu/pipeline", file: "data/pipeline.html" },
    "data-quality": { key: "data-quality", slug: "/admin/du-lieu/quality", file: "data/quality.html" },
    "data-dictionary": { key: "data-dictionary", slug: "/admin/du-lieu/dictionary", file: "data/dictionary.html" },
    "data-reconciliation": { key: "data-reconciliation", slug: "/admin/du-lieu/reconciliation", file: "data/reconciliation.html" },
    "subscription-plans": { key: "subscription-plans", slug: "/admin/goi-cuoc/plans", file: "subscription/plans.html" },
    "subscription-entitlements": { key: "subscription-entitlements", slug: "/admin/goi-cuoc/entitlements", file: "subscription/entitlements.html" },
    "subscription-subscribers": { key: "subscription-subscribers", slug: "/admin/goi-cuoc/subscribers", file: "subscription/subscribers.html" },
    "subscription-transactions": { key: "subscription-transactions", slug: "/admin/goi-cuoc/transactions", file: "subscription/transactions.html" },
    "subscription-membership-intro": { key: "subscription-membership-intro", slug: "/admin/goi-cuoc/membership-intro", file: "subscription/membership-intro.html" },
    "subscription-loyalty": { key: "subscription-loyalty", slug: "/admin/goi-cuoc/loyalty", file: "subscription/loyalty.html" },
    "notifications-push": { key: "notifications-push", slug: "/admin/thong-bao/push", file: "notifications/push.html" },
    "notifications-in-app": { key: "notifications-in-app", slug: "/admin/thong-bao/in-app", file: "notifications/in-app.html" },
    "notifications-email": { key: "notifications-email", slug: "/admin/thong-bao/email", file: "notifications/email.html" },
    "notifications-history": { key: "notifications-history", slug: "/admin/thong-bao/history", file: "notifications/history.html" },
    "system-announcements": { key: "system-announcements", slug: "/admin/he-thong/announcements", file: "system/announcements.html" },
    "metadata-sector-types": { key: "metadata-sector-types", slug: "/admin/tham-so/sector-types", file: "metadata/sector-types.html" },
    "metadata-enums": { key: "metadata-enums", slug: "/admin/tham-so/enums", file: "metadata/enums.html" },
    "metadata-themes": { key: "metadata-themes", slug: "/admin/tham-so/themes", file: "metadata/themes.html" },
    "metadata-chu-de-lifecycle": { key: "metadata-chu-de-lifecycle", slug: "/admin/tham-so/chu-de-lifecycle", file: "metadata/chu-de-lifecycle.html" },
    "marketing-brand-identity": { key: "marketing-brand-identity", slug: "/admin/tiep-thi/brand-identity", file: "marketing/brand-identity.html" },
    "marketing-onboarding": { key: "marketing-onboarding", slug: "/admin/tiep-thi/onboarding", file: "marketing/onboarding.html" },
    "system-page-settings": { key: "system-page-settings", slug: "/admin/he-thong/page-settings", file: "system/page-settings.html" },
    "system-templates": { key: "system-templates", slug: "/admin/he-thong/templates", file: "system/templates.html" },
    "system-ds-studio": { key: "system-ds-studio", slug: "/admin/he-thong/ds-studio#page-primitive-tokens", file: "system/ds-studio.html" },
    "system-ds-studio-2": { key: "system-ds-studio-2", slug: "/admin/he-thong/ds-studio#page-foundations", file: "system/ds-studio.html" },
    "system-ds-studio-3": { key: "system-ds-studio-3", slug: "/admin/he-thong/ds-studio#page-design-tokens", file: "system/ds-studio.html" },
    "system-ds-studio-4": { key: "system-ds-studio-4", slug: "/admin/he-thong/ds-studio#page-icons", file: "system/ds-studio.html" },
    "system-ds-studio-5": { key: "system-ds-studio-5", slug: "/admin/he-thong/ds-studio#page-charts", file: "system/ds-studio.html" },
    "system-ds-studio-6": { key: "system-ds-studio-6", slug: "/admin/he-thong/ds-studio#page-atoms", file: "system/ds-studio.html" },
    "system-ds-studio-7": { key: "system-ds-studio-7", slug: "/admin/he-thong/ds-studio#page-items", file: "system/ds-studio.html" },
    "system-ds-studio-8": { key: "system-ds-studio-8", slug: "/admin/he-thong/ds-studio#page-blocks", file: "system/ds-studio.html" },
    "system-ds-studio-9": { key: "system-ds-studio-9", slug: "/admin/he-thong/ds-studio#page-cards", file: "system/ds-studio.html" },
    "system-ds-studio-10": { key: "system-ds-studio-10", slug: "/admin/he-thong/ds-studio#page-organisms", file: "system/ds-studio.html" },
    "system-ds-studio-11": { key: "system-ds-studio-11", slug: "/admin/he-thong/ds-studio#page-sections", file: "system/ds-studio.html" },
    "system-ds-studio-12": { key: "system-ds-studio-12", slug: "/admin/he-thong/ds-studio#page-business-objects", file: "system/ds-studio.html" },
    "system-ds-studio-13": { key: "system-ds-studio-13", slug: "/admin/he-thong/ds-studio#page-user-flows", file: "system/ds-studio.html" },
    "system-sla": { key: "system-sla", slug: "/admin/he-thong/sla", file: "system/sla.html" },
    "system-core-setup": { key: "system-core-setup", slug: "/admin/he-thong/core-setup", file: "system/core-setup.html" },
    "system-platform-layers": { key: "system-platform-layers", slug: "/admin/he-thong/platform-layers", file: "system/platform-layers.html" },
    "system-feature-flags": { key: "system-feature-flags", slug: "/admin/he-thong/feature-flags", file: "system/feature-flags.html" },
    "system-maintenance": { key: "system-maintenance", slug: "/admin/he-thong/maintenance", file: "system/maintenance.html" },
    "system-roles": { key: "system-roles", slug: "/admin/he-thong/roles", file: "system/roles.html" },
    "system-audit": { key: "system-audit", slug: "/admin/he-thong/audit", file: "system/audit.html" },
    "system-admin-users": { key: "system-admin-users", slug: "/admin/he-thong/admin-users", file: "system/admin-users.html" },
    "community-content-dashboard": { key: "community-content-dashboard", slug: "/admin/cong-dong/content/dashboard", file: "community/content/dashboard.html" },
    "community-content-index": { key: "community-content-index", slug: "/admin/cong-dong/content", file: "community/content/index.html" },
    "community-categories": { key: "community-categories", slug: "/admin/cong-dong/categories", file: "community/categories.html" },
    "community-chu-de-moderation": { key: "community-chu-de-moderation", slug: "/admin/cong-dong/chu-de-moderation", file: "community/chu-de-moderation.html" },
    "community-comments": { key: "community-comments", slug: "/admin/cong-dong/comments", file: "community/comments.html" },
    "community-reports": { key: "community-reports", slug: "/admin/cong-dong/reports", file: "community/reports.html" },
    "community-experts": { key: "community-experts", slug: "/admin/cong-dong/experts", file: "community/experts.html" },
    "chu-de-registry": { key: "chu-de-registry", slug: "/admin/chu-de/registry", file: "chu-de/registry.html" },
    "chu-de-detail": { key: "chu-de-detail", slug: "/admin/chu-de/detail", file: "chu-de/detail.html" },
    "chu-de-mapping": { key: "chu-de-mapping", slug: "/admin/chu-de/mapping", file: "chu-de/mapping.html" },
    "chu-de-analytics": { key: "chu-de-analytics", slug: "/admin/chu-de/analytics", file: "chu-de/analytics.html" },
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

  function hrefFor(key) {
    var p = PAGES[key];
    return p && p.slug ? p.slug : '#';
  }

  var VI_DIR = {
    'tong-quan': 'dashboard',
    'khach-hang': 'users',
    'quyen-han': 'access',
    'thi-truong': 'market',
    'van-hanh-du-lieu': 'market-ops',
    'du-lieu': 'data',
    'goi-cuoc': 'subscription',
    'thong-bao': 'notifications',
    'tham-so': 'metadata',
    'tiep-thi': 'marketing',
    'he-thong': 'system',
    'cong-dong': 'community',
    'phan-tich': 'analytics',
    'yeu-cau': 'requests',
    'trung-tam-ai': 'ai',
    'chu-de': 'chu-de',
    'san-pham': 'product'
  };

  function fileFromAdminPath(pathname) {
    if (pathname === '/admin/tong-quan') return 'dashboard/index.html';
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
      var slug = p.slug || '';
      var slugPath = slug.split('#')[0];
      var slugHash = slug.indexOf('#') >= 0 ? '#' + slug.split('#').slice(1).join('#') : '';
      var score = -1;
      if (slugHash && hash === slugHash && (pathname === slugPath || pathname.indexOf('/ds-studio') >= 0 || pathname.indexOf('/he-thong/ds-studio') >= 0)) {
        score = slug.length + 1000;
      } else if (!slugHash && (pathname === slugPath || pathname.indexOf(slugPath + '/') === 0)) {
        score = slugPath.length;
      }
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
      if (score > bestLen) { best = k; bestLen = score; }
    });
    return best;
  }

  function detectActiveKey() {
    var path = (global.location && global.location.pathname) || '';
    var hash = (global.location && global.location.hash) || '';
    return matchPath(path, hash);
  }

  global.IfluxAdminRoutes = {
    PAGES: PAGES,
    hrefFor: hrefFor,
    matchPath: matchPath,
    detectActiveKey: detectActiveKey,
    count: Object.keys(PAGES).length
  };
})(window);
