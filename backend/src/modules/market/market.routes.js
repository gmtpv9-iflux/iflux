'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const { getMarketSnapshot } = require('./market.service');
const master = require('./market-master.service');
const runtimeQuotes = require('./market-runtime-quotes.service');

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

  /* Public Market Master — PG SoT (not provider / not Mock authority) */
  router.get('/market/master/stocks', async (req, res, next) => {
    try {
      const items = await master.listStocks({
        status: req.query.status,
        exchange: req.query.exchange
      });
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/market/master/stocks/:ticker', async (req, res, next) => {
    try {
      return success(res, { item: await master.getStock(req.params.ticker) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/market/master/sectors', async (req, res, next) => {
    try {
      const items = await master.listSectors();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/market/master/ecosystems', async (req, res, next) => {
    try {
      const items = await master.listEcosystems();
      return success(res, { items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  /* BR-11A — governed runtime quotes (server-side provider) */
  router.get('/market/runtime/quotes', async (req, res, next) => {
    try {
      const raw = req.query.tickers || req.query.symbols || '';
      const tickers = String(raw)
        .split(',')
        .map(function (t) {
          return t.trim();
        })
        .filter(Boolean);
      const out = await runtimeQuotes.getQuotes(tickers);
      return success(res, out.quotes, 200, out.meta);
    } catch (err) {
      next(err);
    }
  });

  router.get('/market/runtime/ohlc/:ticker', async (req, res, next) => {
    try {
      const out = await runtimeQuotes.getOhlc(req.params.ticker, req.query.days);
      return success(res, out, 200, out.meta);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMarketRouter };
