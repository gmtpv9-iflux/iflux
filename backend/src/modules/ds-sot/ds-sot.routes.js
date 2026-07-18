'use strict';

const express = require('express');
const fs = require('fs/promises');
const path = require('path');

function resolveOverridesPath(config) {
  if (config.DS_SOT_OVERRIDES_PATH) return config.DS_SOT_OVERRIDES_PATH;
  if (config.APP_ENV === 'production') {
    return '/var/www/iflux/production/Admin_Design_system/data/ds-sot-overrides.json';
  }
  return path.resolve(__dirname, '../../../../Admin_Design_system/data/ds-sot-overrides.json');
}

async function readStore(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw new Error('invalid');
    if (!data.items || typeof data.items !== 'object') data.items = {};
    return data;
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { version: 1, updatedAt: null, items: {} };
    }
    throw err;
  }
}

async function writeStore(filePath, data) {
  data.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

function createDsSotRouter({ config }) {
  const router = express.Router();
  const filePath = resolveOverridesPath(config);

  router.get('/overrides', async (req, res, next) => {
    try {
      const data = await readStore(filePath);
      res.json({ ok: true, items: data.items, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  router.put('/overrides/:itemId', async (req, res, next) => {
    try {
      const itemId = String(req.params.itemId || '').trim();
      if (!itemId || itemId.length > 120) {
        return res.status(400).json({ ok: false, error: 'itemId không hợp lệ' });
      }
      const html = typeof req.body.html === 'string' ? req.body.html : '';
      const code = typeof req.body.code === 'string' ? req.body.code : '';
      const value = typeof req.body.value === 'string' ? req.body.value : '';
      const payload = html || code || value;
      if (!payload) {
        return res.status(400).json({ ok: false, error: 'Thiếu html, code hoặc value' });
      }
      if (html.length > 120000 || code.length > 120000 || value.length > 120000) {
        return res.status(400).json({ ok: false, error: 'Nội dung quá dài' });
      }
      const data = await readStore(filePath);
      const prev = data.items[itemId] || {};
      data.items[itemId] = {
        html: html || prev.html || '',
        code: code || prev.code || '',
        value: value || prev.value || '',
        updatedAt: new Date().toISOString(),
        meta: req.body.meta && typeof req.body.meta === 'object' ? req.body.meta : undefined
      };
      await writeStore(filePath, data);
      res.json({ ok: true, itemId: itemId, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/overrides/:itemId', async (req, res, next) => {
    try {
      const itemId = String(req.params.itemId || '').trim();
      const data = await readStore(filePath);
      delete data.items[itemId];
      await writeStore(filePath, data);
      res.json({ ok: true, itemId: itemId, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createDsSotRouter };
