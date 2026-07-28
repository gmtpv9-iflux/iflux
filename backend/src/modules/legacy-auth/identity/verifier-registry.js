'use strict';

/**
 * VerifierRegistry — resolve(provider) → Verifier (OD-SOL-13).
 * Registration layer only — không switch(provider) trong IdentityService.
 */

const googleVerifier = require('./verifiers/google-verifier');
const appleVerifier = require('./verifiers/apple-verifier');
const facebookVerifier = require('./verifiers/facebook-verifier');
const zaloVerifier = require('./verifiers/zalo-verifier');

const registry = Object.create(null);

function register(provider, verifier) {
  const id = String(provider || '').toLowerCase();
  if (!id || !verifier || typeof verifier.verify !== 'function') {
    throw new Error('VerifierRegistry.register requires id + verifier.verify');
  }
  registry[id] = verifier;
}

function resolve(provider) {
  const id = String(provider || '').toLowerCase();
  const verifier = registry[id];
  if (!verifier) {
    const err = new Error('Unsupported social provider');
    err.statusCode = 422;
    throw err;
  }
  return verifier;
}

function has(provider) {
  return !!registry[String(provider || '').toLowerCase()];
}

/**
 * @returns {Promise<import('./verified-identity').VerifiedIdentity>}
 */
async function verify(config, provider, payload) {
  return resolve(provider).verify(config, payload || {});
}

function list() {
  return Object.keys(registry);
}

// Bootstrap registration (allowed here — not in IdentityService)
register('google', googleVerifier);
register('apple', appleVerifier);
register('facebook', facebookVerifier);
register('zalo', zaloVerifier);

module.exports = {
  register,
  resolve,
  has,
  verify,
  list
};
