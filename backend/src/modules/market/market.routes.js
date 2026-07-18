'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const { getMarketSnapshot } = require('./market.service');

function createMarketRouter() {
  const router = express.Router();

  router.get('/snapshot/market', (req, res) => {
    const data = getMarketSnapshot();
    return success(res, data, 200, {
      cached: false,
      staleness_ms: 0
    });
  });

  router.get('/market/overview', (req, res) => {
    const data = getMarketSnapshot();
    return success(res, data, 200);
  });

  return router;
}

module.exports = { createMarketRouter };
