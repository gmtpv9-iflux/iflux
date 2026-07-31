'use strict';

const express = require('express');
const { getSitemapIndex, getSitemapByType } = require('./sitemap.service');

function createSitemapRouter() {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const xml = await getSitemapIndex();
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:type', async (req, res, next) => {
    try {
      const { type } = req.params;
      const xml = await getSitemapByType(type);
      if (!xml) {
        return res.status(404).send('Sitemap not found');
      }
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createSitemapRouter };
