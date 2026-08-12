'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const sectors = require('./sectors-admin.service');
const ecosystems = require('./ecosystems-admin.service');

function createMarketPublicRouter() {
  const router = express.Router();

  // GET /api/market/sectors
  router.get('/sectors', async (req, res, next) => {
    try {
      const list = await sectors.listSectors({ status: 'active' });
      return success(res, { sectors: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/market/ecosystems
  router.get('/ecosystems', async (req, res, next) => {
    try {
      const list = await ecosystems.listEcosystems({ status: 'active' });
      return success(res, { ecosystems: list, total: list.length });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMarketPublicRouter };
