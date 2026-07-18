'use strict';

const crypto = require('crypto');

function stableStringify(obj) {
  return JSON.stringify(obj, function (key, value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted = {};
      Object.keys(value).sort().forEach(function (k) {
        sorted[k] = value[k];
      });
      return sorted;
    }
    return value;
  });
}

function checksumArtifact(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(stableStringify(obj));
  return hash.digest('hex');
}

function etagFromChecksum(checksum) {
  return '"' + checksum.slice(0, 32) + '"';
}

module.exports = { checksumArtifact, etagFromChecksum };
