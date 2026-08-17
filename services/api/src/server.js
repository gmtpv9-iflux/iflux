'use strict';

require('dotenv').config();

const { loadConfig } = require('./config');
const { initPool, closePool } = require('./db');
const { createApp } = require('./app');
const { sync } = require('./admin-rbac/registry');

const config = loadConfig();
initPool(config);

let server;

sync()
  .then(function () {
    const app = createApp(config);
    server = app.listen(config.PORT, config.HOST, function () {
      process.stdout.write(
        'iflux-staging2-api listening on ' + config.HOST + ':' + config.PORT + '\n'
      );
    });
  })
  .catch(function (err) {
    process.stderr.write(String(err && err.stack ? err.stack : err) + '\n');
    process.exit(1);
  });

function shutdown() {
  if (!server) {
    closePool().then(function () {
      process.exit(0);
    });
    return;
  }
  server.close(function () {
    closePool().then(function () {
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
