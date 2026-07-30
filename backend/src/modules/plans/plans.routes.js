'use strict';

const { Router } = require('express');
const { readRuntimeFile, writeRuntimeFile } = require('../subscription/plans-runtime-file');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');

function createPlansRouter(deps) {
  deps = deps || {};
  const config = deps.config || {};
  const router = Router();
  const writeGuard = requireAdminPermission(
    { config, auth: deps.auth },
    'subscription.entitlements.edit'
  );

  router.get('/runtime', (req, res) => {
    res.json(readRuntimeFile());
  });

  router.put('/runtime', writeGuard, (req, res) => {
    const body = req.body || {};
    const payload = writeRuntimeFile({
      version: body.version || 1,
      updatedAt: body.updatedAt || Date.now(),
      overrides: body.overrides || {},
      custom: body.custom || []
    });
    res.json({ ok: true, updatedAt: payload.updatedAt, planCount: (payload.plans || []).length });
  });

  return router;
}

module.exports = { createPlansRouter };
