'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const healthRoutes = require('../../modules/health/health.routes');
const { createLegacyAuthRouter } = require('../../modules/legacy-auth/auth.routes');
const { createUserDataRouter } = require('../../modules/user-data/user-data.routes');
const { createSubscriptionsRouter } = require('../../modules/subscriptions/subscriptions.routes');
const { buildOpenApiSpec } = require('../../docs/openapi');

function createV1Router(deps) {
  const router = express.Router();

  router.use('/health', healthRoutes);
  router.use('/auth', createLegacyAuthRouter(deps));
  router.use('/users', createLegacyAuthRouter(deps));
  router.use('/user-data', createUserDataRouter(deps.auth));
  router.use('/subscriptions', createSubscriptionsRouter(deps));

  const spec = buildOpenApiSpec(deps.config);
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));

  return router;
}

module.exports = { createV1Router };
