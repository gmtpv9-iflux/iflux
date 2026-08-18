'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');

const GUIDE_KEYS = {
  checklist: 'guides.checklist.view',
  ui_components: 'guides.ui_components.view',
  patterns_table: 'guides.patterns_table.view',
  patterns_form: 'guides.patterns_form.view',
  patterns_charts: 'guides.patterns_charts.view'
};

function createGuidesAdminRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  Object.keys(GUIDE_KEYS).forEach(function (slug) {
    router.get('/' + slug, perm(GUIDE_KEYS[slug]), function (req, res) {
      return success(res, { guide: slug, ok: true });
    });
  });

  return router;
}

module.exports = { createGuidesAdminRouter, GUIDE_KEYS };
