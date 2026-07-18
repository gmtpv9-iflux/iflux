'use strict';

const express = require('express');
const { listCustomers } = require('./admin-users.service');

function createAdminUsersRouter(deps) {
  deps = deps || {};
  const { auth } = deps;
  const router = express.Router();
  const adminGuard = auth && auth.authenticateAdmin;

  // ── ADMIN: danh sách khách hàng thật (bảng users) ──
  router.get('/', adminGuard, async (req, res, next) => {
    try {
      const customers = await listCustomers({ q: req.query.q });
      res.json({ customers: customers, total: customers.length });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminUsersRouter };
