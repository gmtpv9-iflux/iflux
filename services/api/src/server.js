'use strict';

require('dotenv').config();

const { loadConfig } = require('./config');
const { initPool, closePool } = require('./db');
const { createApp } = require('./app');

const config = loadConfig();
initPool(config);

const app = createApp(config);
const server = app.listen(config.PORT, config.HOST, function () {
  process.stdout.write(
    'iflux-staging2-api listening on ' + config.HOST + ':' + config.PORT + '\n'
  );
});

function shutdown() {
  server.close(function () {
    closePool().then(function () {
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
