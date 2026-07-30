'use strict';

const express = require('express');
const { success } = require('../../shared/response/api-response');
const follow = require('./follow.service');

function createFollowRouter(deps) {
  const router = express.Router();
  const auth = deps.auth || {};

  router.get('/users/me/following', auth.authenticate, async (req, res, next) => {
    try {
      const data = await follow.listFollowing(req.user.id, {
        cursor: req.query.cursor,
        limit: req.query.limit
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/users/:id/exist', auth.authenticate, async (req, res, next) => {
    try {
      const data = await follow.exists(req.user.id, req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/users/:id/counts', async (req, res, next) => {
    try {
      const data = await follow.counts(req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/users/:id', auth.authenticate, async (req, res, next) => {
    try {
      const data = await follow.follow(req.user.id, req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/users/:id', auth.authenticate, async (req, res, next) => {
    try {
      const data = await follow.unfollow(req.user.id, req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createFollowRouter };
