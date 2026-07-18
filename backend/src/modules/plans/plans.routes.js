'use strict';

const fs = require('fs');
const path = require('path');
const { Router } = require('express');

const RUNTIME_FILE = path.join(__dirname, '../../../data/plans-runtime.json');
const USER_WEB_FILE = path.join(__dirname, '../../../../User_Web/data/iflux-plans-v1.json');

function readRuntimeFile() {
  try {
    if (!fs.existsSync(RUNTIME_FILE)) {
      return { version: 1, updatedAt: 0, overrides: {}, custom: [] };
    }
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'));
  } catch (e) {
    return { version: 1, updatedAt: 0, overrides: {}, custom: [] };
  }
}

function writeRuntimeFile(data) {
  const json = JSON.stringify(data, null, 2);
  fs.mkdirSync(path.dirname(RUNTIME_FILE), { recursive: true });
  fs.writeFileSync(RUNTIME_FILE, json, 'utf8');
  try {
    fs.mkdirSync(path.dirname(USER_WEB_FILE), { recursive: true });
    fs.writeFileSync(USER_WEB_FILE, json, 'utf8');
  } catch (e) {
    /* User_Web path optional in some deploy layouts */
  }
}

function createPlansRouter({ config }) {
  const router = Router();

  router.get('/runtime', (req, res) => {
    res.json(readRuntimeFile());
  });

  router.put('/runtime', (req, res) => {
    const adminKey = req.get('x-admin-key') || req.get('x-iflux-admin-key');
    if (config.APP_ENV !== 'local' && adminKey !== config.ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = req.body || {};
    const payload = {
      version: body.version || 1,
      updatedAt: body.updatedAt || Date.now(),
      overrides: body.overrides || {},
      custom: body.custom || []
    };
    writeRuntimeFile(payload);
    res.json({ ok: true, updatedAt: payload.updatedAt });
  });

  return router;
}

module.exports = { createPlansRouter };
