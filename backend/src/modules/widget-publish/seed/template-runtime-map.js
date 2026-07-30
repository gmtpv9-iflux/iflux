'use strict';

/**
 * @deprecated Wave 3 — facade mỏng.
 * Nguồn sự thật Implementation(Web): `runtime-implementations.js`
 * Publish phải gọi resolveRuntimeImplementation(template, runtime).
 */
const {
  WEB_IMPLEMENTATIONS,
  templateRuntimeFor,
  resolveRuntimeImplementation
} = require('./runtime-implementations');

/** @deprecated dùng WEB_IMPLEMENTATIONS / resolveRuntimeImplementation */
const TEMPLATE_RUNTIME = Object.keys(WEB_IMPLEMENTATIONS).reduce(function (acc, id) {
  const impl = WEB_IMPLEMENTATIONS[id];
  acc[id] = { renderer: impl.renderer, module: impl.module };
  return acc;
}, {});

module.exports = {
  TEMPLATE_RUNTIME,
  templateRuntimeFor,
  resolveRuntimeImplementation
};
