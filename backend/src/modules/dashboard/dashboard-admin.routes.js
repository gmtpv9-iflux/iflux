'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const ops = require('../data/data-ops.service');

function createDashboardAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/overview', perm('dashboard.overview.view'), async (req, res, next) => {
    try {
      return success(res, ops.dashboardOverview());
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createDashboardAdminRouter };
