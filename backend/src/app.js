'use strict';

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
const { createOnboardingRouter } = require('./modules/onboarding/onboarding.routes');
const { createPlansRouter } = require('./modules/plans/plans.routes');
const { AppError } = require('./shared/exceptions/app-error');

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

  app.use(`${config.LEGACY_API_PREFIX}`, createMarketRouter());
  app.use(`${config.LEGACY_API_PREFIX}/community`, createCommunityRouter({ auth: userAndAdminAuth, config }));
  const { createContentRouter } = require('./modules/content/content.routes');
  app.use(
    `${config.LEGACY_API_PREFIX}/content`,
    createContentRouter({
      auth: { authenticate: auth.authenticate, authenticateAdmin: adminAuthMw.authenticateAdmin },
      config
    })
  );
  app.use(`${config.LEGACY_API_PREFIX}/onboarding`, createOnboardingRouter({ config, auth }));
  app.use(`${config.LEGACY_API_PREFIX}/plans`, createPlansRouter({ config }));

  const { createDsSotRouter } = require('./modules/ds-sot/ds-sot.routes');
  app.use(`${config.LEGACY_API_PREFIX}/ds-sot`, createDsSotRouter({ config }));

  const { createPageCompositionRouter } = require('./modules/page-composition/page-composition.routes');
  app.use(`${config.LEGACY_API_PREFIX}/page-composition`, createPageCompositionRouter({ config }));

  const { createWidgetPublishRouter } = require('./modules/widget-publish/widget-publish.routes');
  app.use(`${config.LEGACY_API_PREFIX}`, createWidgetPublishRouter({ config, auth: adminAuthMw }));

  app.use(`${config.LEGACY_API_PREFIX}/admin/auth`, createAdminAuthRouter({ config, auth: adminAuthMw }));

  const { createAdminUsersRouter } = require('./modules/admin-users/admin-users.routes');
  app.use(`${config.LEGACY_API_PREFIX}/admin/users`, createAdminUsersRouter({ config, auth: adminAuthMw }));

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

  app.use(legacyErrorAdapter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
