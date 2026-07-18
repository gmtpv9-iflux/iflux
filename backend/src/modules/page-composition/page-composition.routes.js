'use strict';

/**
 * Page Composition — Product Composition (Admin) → Lazy Page Runtime (User Web)
 * Lưu manifest ĐÃ RESOLVE cho từng Page (metadata-only: widget IDs + layout + lazyModule).
 * Admin "Quản lý giao diện" PUT manifest; User Web runtime GET manifest để render.
 * File-backed (không phụ thuộc DB) — cùng pattern với module ds-sot.
 */

const express = require('express');
const fs = require('fs/promises');
const path = require('path');

var PAGE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;
var MAX_BODY_BYTES = 200000;

function resolveStorePath(config) {
  if (config.PAGE_COMPOSITION_PATH) return config.PAGE_COMPOSITION_PATH;
  if (config.APP_ENV === 'production') {
    return '/var/www/iflux/production/Admin_Design_system/data/page-composition.json';
  }
  return path.resolve(__dirname, '../../../../Admin_Design_system/data/page-composition.json');
}

async function readStore(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw new Error('invalid');
    if (!data.pages || typeof data.pages !== 'object') data.pages = {};
    return data;
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { version: 1, updatedAt: null, pages: {} };
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

function isValidManifest(m) {
  if (!m || typeof m !== 'object') return false;
  if (typeof m.pageKey !== 'string') return false;
  if (!Array.isArray(m.widgets)) return false;
  if (!Array.isArray(m.sections)) return false;
  return true;
}

function createPageCompositionRouter({ config }) {
  const router = express.Router();
  const filePath = resolveStorePath(config);

  router.get('/', async (req, res, next) => {
    try {
      const data = await readStore(filePath);
      res.json({ ok: true, pages: data.pages, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:pageKey', async (req, res, next) => {
    try {
      const pageKey = String(req.params.pageKey || '').trim().toLowerCase();
      if (!PAGE_KEY_RE.test(pageKey)) {
        return res.status(400).json({ ok: false, error: 'pageKey không hợp lệ' });
      }
      const data = await readStore(filePath);
      const manifest = data.pages[pageKey] || null;
      res.json({ ok: true, pageKey: pageKey, manifest: manifest, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  router.put('/:pageKey', async (req, res, next) => {
    try {
      const pageKey = String(req.params.pageKey || '').trim().toLowerCase();
      if (!PAGE_KEY_RE.test(pageKey)) {
        return res.status(400).json({ ok: false, error: 'pageKey không hợp lệ' });
      }
      const manifest = req.body && req.body.manifest;
      if (!isValidManifest(manifest)) {
        return res.status(400).json({ ok: false, error: 'manifest không hợp lệ (cần pageKey, sections[], widgets[])' });
      }
      if (JSON.stringify(manifest).length > MAX_BODY_BYTES) {
        return res.status(400).json({ ok: false, error: 'manifest quá lớn' });
      }
      const data = await readStore(filePath);
      manifest.pageKey = pageKey;
      manifest.publishedAt = new Date().toISOString();
      data.pages[pageKey] = manifest;
      await writeStore(filePath, data);
      res.json({ ok: true, pageKey: pageKey, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:pageKey', async (req, res, next) => {
    try {
      const pageKey = String(req.params.pageKey || '').trim().toLowerCase();
      if (!PAGE_KEY_RE.test(pageKey)) {
        return res.status(400).json({ ok: false, error: 'pageKey không hợp lệ' });
      }
      const data = await readStore(filePath);
      delete data.pages[pageKey];
      await writeStore(filePath, data);
      res.json({ ok: true, pageKey: pageKey, updatedAt: data.updatedAt });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createPageCompositionRouter };
