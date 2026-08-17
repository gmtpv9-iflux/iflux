'use strict';

const express = require('express');
const cors = require('cors');
const { createAdminAuthRouter } = require('./admin-auth/routes');
const { createAdminUsersRouter } = require('./admin-users/routes');
const { createAdminAdministratorsRouter } = require('./admin-administrators/routes');
const { errorHandler } = require('./errors');

function createApp(config) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
      credentials: true
    })
  );
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', function (req, res) {
    res.json({ ok: true, service: 'iflux-staging2-api' });
  });

  app.use('/api/admin/auth', createAdminAuthRouter(config));
  app.use('/api/admin/users', createAdminUsersRouter(config));
  app.use('/api/admin/administrators', createAdminAdministratorsRouter(config));

  app.use(function (req, res) {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
