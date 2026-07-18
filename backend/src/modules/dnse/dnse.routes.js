'use strict';

const { createDnseClient } = require('./dnse.client');
const { getRawCatalog } = require('./dnse.raw-catalog');

function createDnseRouter({ config, auth }) {
  const router = require('express').Router();
  const client = createDnseClient(config);

  router.get('/raw-catalog', auth.authenticateAdmin, async (req, res, next) => {
    try {
      res.json({ ok: true, ...getRawCatalog() });
    } catch (err) {
      next(err);
    }
  });

  router.get('/status', auth.authenticateAdmin, async (req, res, next) => {
    try {
      const catalog = getRawCatalog();
      const configured = client.isConfigured();
      let connection = 'missing_secret';
      const auth_ = { ok: false };

      if (configured) {
        const result = await client.login(false);
        auth_.ok = result.ok;
        auth_.status = result.status || 0;
        auth_.error = result.error || null;
        auth_.investorId = result.investorId || null;
        auth_.fullName = result.fullName || null;
        auth_.tokenExpiresAt = result.exp ? new Date(result.exp * 1000).toISOString() : null;
        connection = result.ok ? 'connected' : 'auth_failed';
      }

      res.json({
        ok: true,
        connection,
        configured,
        authMode: 'username_password',
        username: config.DNSE_USERNAME || null,
        auth: auth_,
        datafeed: client.datafeed(),
        catalog: {
          summary: catalog.summary,
          coreRequirements: catalog.coreRequirements,
          gaps: catalog.gaps.filter((g) => g.id !== 'GAP-API-SECRET' || connection !== 'connected')
        }
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createDnseRouter };
