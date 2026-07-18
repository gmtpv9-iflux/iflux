'use strict';

const express = require('express');
const { healthLive, healthReady, healthInfo } = require('./health.controller');

const router = express.Router();

router.get('/live', healthLive);
router.get('/ready', healthReady);
router.get('/info', healthInfo);

module.exports = router;
