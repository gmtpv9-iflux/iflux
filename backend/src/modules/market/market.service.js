'use strict';

const fs = require('fs');
const path = require('path');

let cached = null;

function loadSnapshot() {
  if (cached) return cached;
  const file = path.join(__dirname, '../../../data/market-snapshot-seed.json');
  cached = JSON.parse(fs.readFileSync(file, 'utf8'));
  cached.meta = cached.meta || {};
  cached.meta.data_as_of = new Date().toISOString();
  cached.meta.source = 'api';
  return cached;
}

function getMarketSnapshot() {
  const snap = loadSnapshot();
  return {
    as_of: snap.meta.data_as_of,
    market: snap.entities.market,
    exchanges: snap.entities.exchanges,
    breadth: snap.entities.breadth,
    flow: snap.entities.flow,
    movers: snap.movers
  };
}

module.exports = { getMarketSnapshot, loadSnapshot };
