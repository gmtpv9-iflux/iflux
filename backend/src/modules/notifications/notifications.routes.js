'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const inbox = require('./inbox.service');

function createNotificationsRouter(deps) {
  const router = express.Router();
  const auth = deps.auth || {};

  router.get('/summary', auth.authenticate, async (req, res, next) => {
    try {
      const data = await inbox.summary(req.user.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', auth.authenticate, async (req, res, next) => {
    try {
      const data = await inbox.listInbox(req.user.id, {
        cursor: req.query.cursor,
        limit: req.query.limit
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/read', auth.authenticate, async (req, res, next) => {
    try {
      const data = await inbox.markRead(req.user.id, req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/read-all', auth.authenticate, async (req, res, next) => {
    try {
      const data = await inbox.markAllRead(req.user.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createNotificationsRouter };
