'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');

function createInterfaceAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/page-settings', perm('interface.page_settings.view'), function (req, res) {
    return success(res, { ok: true, page: 'page_settings' });
  });

  router.get('/design-system', perm('interface.design_system.view'), function (req, res) {
    return success(res, { ok: true, page: 'design_system' });
  });

  return router;
}

module.exports = { createInterfaceAdminRouter };
