'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const cors = require('cors');
const { requestId } = require('./middleware/request-id');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');
const { createAuthMiddleware } = require('./middleware/auth');
const { createV1Router } = require('./routes/v1');
const { createLegacyAuthRouter } = require('./modules/legacy-auth/auth.routes');
const { createUserDataRouter } = require('./modules/user-data/user-data.routes');
const { createSubscriptionsRouter } = require('./modules/subscriptions/subscriptions.routes');
const { createMarketRouter } = require('./modules/market/market.routes');
  const { createCommunityRouter } = require('./modules/community/community.routes');
  const { createMediaRouter } = require('./modules/media/media.routes');
  const { mediaRoot } = require('./modules/media/media-util');
  const { createOnboardingRouter } = require('./modules/onboarding/onboarding.routes');
  const { createPlansRouter } = require('./modules/plans/plans.routes');
  const { AppError } = require('./shared/exceptions/app-error');

function adminWebRoot(config) {
  if (process.env.IFLUX_WEB_ROOT) return process.env.IFLUX_WEB_ROOT;
  if (config.APP_ENV === 'staging') return '/var/www/iflux/staging';
  if (config.APP_ENV === 'local') return path.resolve(__dirname, '../..');
  return null;
}

function loadAdminUiPack(webRoot) {
  const ctx = { window: {} };
  ctx.window = ctx;
  ctx.global = ctx;
  vm.runInNewContext(
    fs.readFileSync(path.join(webRoot, 'Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js'), 'utf8'),
    ctx
  );
  vm.runInNewContext(
    fs.readFileSync(path.join(webRoot, 'Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js'), 'utf8'),
    ctx
  );
  return ctx;
}

function mountAdminUi(app, config) {
  const webRoot = adminWebRoot(config);
  if (!webRoot) return;
  let pack;
  function ui() {
    if (!pack) pack = loadAdminUiPack(webRoot);
    return pack;
  }
  app.get(/^\/admin(?:\/.*)?$/, (req, res, next) => {
    const pathname = String(req.path || '').replace(/\/+$/, '') || '/';
    if (pathname === '/admin') return res.redirect(302, '/admin/overview');
    let ctx;
    try {
      ctx = ui();
    } catch (e) {
      return next(e);
    }
    const R = ctx.IfluxAdminRoutes;
    const Nav = ctx.IfluxAdminNavRegistry;
    if (!R || !R.matchPath) return next();
    const key = R.matchPath(pathname, '');
    if (!key) return next();
    const canonical = (Nav && Nav.pathFor && Nav.pathFor(key)) || (R.hrefFor && R.hrefFor(key)) || '';
    const canPath = String(canonical).split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (canPath && canPath !== '#' && pathname !== canPath) {
      const q = req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?')) : '';
      return res.redirect(301, canPath + q);
    }
    let file = null;
    Object.keys(R.PAGES || {}).some((k) => {
      if (R.PAGES[k] && R.PAGES[k].key === key && R.PAGES[k].file) {
        file = R.PAGES[k].file;
        return true;
      }
      return false;
    });
    if (!file) return next();
    const abs = path.join(webRoot, 'Admin_Design_system', 'app', file);
    if (!fs.existsSync(abs)) return next();
    res.set('Cache-Control', 'no-store');
    return res.sendFile(abs);
  });
}

function legacyErrorAdapter(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  next(err);
}

function createApp(config) {
  const app = express();
  app.locals.config = config;

  const auth = createAuthMiddleware(config);
  const { createAdminAuthRouter, createAdminAuthMiddleware } = require('./modules/admin-auth/admin-auth.routes');
  const adminAuthMw = createAdminAuthMiddleware(config);
  const userAndAdminAuth = { ...auth, authenticateAdmin: adminAuthMw.authenticateAdmin };

  app.use(requestId());
  app.use(
    cors({
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'iflux-api', env: config.APP_ENV });
  });

  const v1 = createV1Router({ config, auth });
  app.use(config.API_PREFIX, v1);

  const legacyAuth = createLegacyAuthRouter({ auth, config });
  app.use(`${config.LEGACY_API_PREFIX}/auth`, legacyAuth);
  app.use(`${config.LEGACY_API_PREFIX}/users`, legacyAuth);

  const userData = createUserDataRouter(auth);
  app.use(`${config.LEGACY_API_PREFIX}/user-data`, userData);

  const subscriptions = createSubscriptionsRouter({ config, auth: userAndAdminAuth });
  app.use(`${config.LEGACY_API_PREFIX}/subscriptions`, subscriptions);

  const { createAffiliatePayoutsRouter } = require('./modules/affiliate-payouts/payouts.routes');
  app.use(`${config.LEGACY_API_PREFIX}/affiliate-payouts`, createAffiliatePayoutsRouter({ config, auth: userAndAdminAuth }));

  app.use(`${config.LEGACY_API_PREFIX}`, createMarketRouter());
  app.use(`${config.LEGACY_API_PREFIX}/community`, createCommunityRouter({ auth: userAndAdminAuth, config }));
  app.use(`${config.LEGACY_API_PREFIX}/admin/media`, createMediaRouter({ config, auth: adminAuthMw }));
  app.use('/media', express.static(mediaRoot(config), { fallthrough: true, maxAge: '7d', index: false }));
  const { createInteractionV1Router } = require('./modules/interaction/interaction.routes');
  app.use(`${config.LEGACY_API_PREFIX}/interaction/v1`, createInteractionV1Router({ auth: userAndAdminAuth, config }));

  const { createFollowRouter } = require('./modules/follow/follow.routes');
  app.use(`${config.LEGACY_API_PREFIX}/follow`, createFollowRouter({ auth }));

  const { createNotificationsRouter } = require('./modules/notifications/notifications.routes');
  app.use(`${config.LEGACY_API_PREFIX}/notifications`, createNotificationsRouter({ auth }));

  try {
    const { registerFnNotificationSubscribers } = require('./modules/notifications/fn-subscriber');
    registerFnNotificationSubscribers();
  } catch (e) {
    console.warn('[FN-001] subscriber register', e && e.message);
  }

  const { createContentRouter } = require('./modules/content/content.routes');
  app.use(
    `${config.LEGACY_API_PREFIX}/content`,
    createContentRouter({
      auth: { authenticate: auth.authenticate, authenticateAdmin: adminAuthMw.authenticateAdmin },
      config
    })
  );
  app.use(`${config.LEGACY_API_PREFIX}/onboarding`, createOnboardingRouter({ config, auth: userAndAdminAuth }));
  app.use(`${config.LEGACY_API_PREFIX}/plans`, createPlansRouter({ config, auth: adminAuthMw }));

  const { createDsSotRouter } = require('./modules/ds-sot/ds-sot.routes');
  app.use(`${config.LEGACY_API_PREFIX}/ds-sot`, createDsSotRouter({ config, auth: adminAuthMw }));

  const { createPageCompositionRouter } = require('./modules/page-composition/page-composition.routes');
  app.use(`${config.LEGACY_API_PREFIX}/page-composition`, createPageCompositionRouter({ config, auth: adminAuthMw }));

  const { createWidgetPublishRouter } = require('./modules/widget-publish/widget-publish.routes');
  app.use(`${config.LEGACY_API_PREFIX}`, createWidgetPublishRouter({ config, auth: adminAuthMw }));

  app.use(`${config.LEGACY_API_PREFIX}/admin/auth`, createAdminAuthRouter({ config, auth: adminAuthMw }));

  const { createAdminUsersRouter } = require('./modules/admin-users/admin-users.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/users`, createAdminUsersRouter({ config, auth: adminAuthMw }));

  const { createSectorsAdminRouter } = require('./modules/market/sectors-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/sectors`, createSectorsAdminRouter({ config, auth: adminAuthMw }));

  const { createEcosystemsAdminRouter } = require('./modules/market/ecosystems-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/ecosystems`, createEcosystemsAdminRouter({ config, auth: adminAuthMw }));

  const { createEtlJobsAdminRouter } = require('./modules/data/etl-jobs-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/etl-jobs`, createEtlJobsAdminRouter({ config, auth: adminAuthMw }));

  const { createSourcesAdminRouter } = require('./modules/data/sources-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/sources`, createSourcesAdminRouter({ config, auth: adminAuthMw }));

  const { createDataOpsRouter } = require('./modules/data/data-ops.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/data-ops`, createDataOpsRouter({ config, auth: adminAuthMw }));

  const { createDashboardAdminRouter } = require('./modules/dashboard/dashboard-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/dashboard`, createDashboardAdminRouter({ config, auth: adminAuthMw }));

  const { createGuidesAdminRouter } = require('./modules/guides/guides-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/guides`, createGuidesAdminRouter({ config, auth: adminAuthMw }));

  const { createInterfaceAdminRouter } = require('./modules/interface/interface-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/interface`, createInterfaceAdminRouter({ config, auth: adminAuthMw }));

  const { createMarketWaveBRouter, createMarketOpsWaveBRouter } = require('./modules/market/market-wave-b.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/market-config`, createMarketWaveBRouter({ config, auth: adminAuthMw }));
  app.use(`${config.LEGACY_API_PREFIX}/admin/market-ops`, createMarketOpsWaveBRouter({ config, auth: adminAuthMw }));
  const { createMarketStocksWaveFRouter } = require('./modules/market/market-wave-f.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/market/stocks`, createMarketStocksWaveFRouter({ config, auth: adminAuthMw }));

  const { createMarketMdmRouter } = require('./modules/market/market-mdm.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/market/mdm`, createMarketMdmRouter({ config, auth: adminAuthMw }));
  const { createMarketPriceSyncRouter } = require('./modules/market/market-price-sync.routes');
  app.use(
    `${config.LEGACY_API_PREFIX}/admin/market/price-sync`,
    createMarketPriceSyncRouter({ config, auth: adminAuthMw })
  );

  const { createAiAdminRouter, createNotificationsAdminRouter } = require('./modules/ai/ai-notif-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/ai`, createAiAdminRouter({ config, auth: adminAuthMw }));
  app.use(`${config.LEGACY_API_PREFIX}/admin/notifications`, createNotificationsAdminRouter({ config, auth: adminAuthMw }));

  const {
    createMetadataAdminRouter,
    createMarketingBrandRouter,
    createCommunityOpsAdminRouter
  } = require('./modules/metadata/wave-d-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/metadata`, createMetadataAdminRouter({ config, auth: adminAuthMw }));
  app.use(`${config.LEGACY_API_PREFIX}/admin/marketing`, createMarketingBrandRouter({ config, auth: adminAuthMw }));
  const { createSiteSeoAdminRouter, createSiteSeoPublicRouter } = require('./modules/site-seo/site-seo.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/seo`, createSiteSeoAdminRouter({ config, auth: adminAuthMw }));
  app.use(`${config.LEGACY_API_PREFIX}/seo`, createSiteSeoPublicRouter());
  const {
    createSeoPlatformApiRouter,
    mountSeoPlatformPublicRoots
  } = require('./modules/seo-platform/seo-platform.routes');
  app.use(`${config.LEGACY_API_PREFIX}/seo/platform`, createSeoPlatformApiRouter());
  mountSeoPlatformPublicRoots(app);
  app.use(`${config.LEGACY_API_PREFIX}/admin/community-ops`, createCommunityOpsAdminRouter({ config, auth: adminAuthMw }));

  const {
    createSubscriptionWaveERouter,
    createSystemWaveERouter,
    createStoriesWaveERouter
  } = require('./modules/subscription/wave-e-admin.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/subscription`, createSubscriptionWaveERouter({ config, auth: adminAuthMw }));
  app.use(`${config.LEGACY_API_PREFIX}/admin/system`, createSystemWaveERouter({ config, auth: adminAuthMw }));
  app.use(`${config.LEGACY_API_PREFIX}/admin/stories`, createStoriesWaveERouter({ config, auth: adminAuthMw }));

  const { createAdminRbacRouter } = require('./modules/admin-rbac/admin-rbac.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/access`, createAdminRbacRouter({ config, auth: adminAuthMw }));

  const { createPartnershipRouter } = require('./modules/partnership-requests/partnership.routes');
  app.use(`${config.LEGACY_API_PREFIX}/partnership-requests`, createPartnershipRouter({ config, auth: adminAuthMw }));

  const { createFeatureRequestsRouter } = require('./modules/feature-requests/feature.routes');
  app.use(`${config.LEGACY_API_PREFIX}/feature-suggestions`, createFeatureRequestsRouter({ config, auth: userAndAdminAuth }));

  const { createBugReportsRouter } = require('./modules/bug-reports/bug.routes');
  app.use(`${config.LEGACY_API_PREFIX}/bug-reports`, createBugReportsRouter({ config, auth: userAndAdminAuth }));

  const { createDnseRouter } = require('./modules/dnse/dnse.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/dnse`, createDnseRouter({ config, auth: adminAuthMw }));

  mountAdminUi(app, config);

  app.use(legacyErrorAdapter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
