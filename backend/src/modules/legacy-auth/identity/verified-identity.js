'use strict';

/**
 * VerifiedIdentity — Domain result từ Verifier (OD-SOL-11).
 * Immutable-ish plain object. Verifier KHÔNG trả User/DB row.
 *
 * @typedef {object} VerifiedIdentity
 * @property {string} provider
 * @property {string} providerUserId  subject tại IdP
 * @property {string|null} email
 * @property {boolean} emailVerified
 * @property {string|null} displayName
 * @property {string|null} avatarUrl
 */

/**
 * @param {object} input
 * @returns {VerifiedIdentity}
 */
function createVerifiedIdentity(input) {
  const provider = String(input.provider || '').toLowerCase();
  const providerUserId = String(input.providerUserId || input.subject || '');
  if (!provider || !providerUserId) {
    const err = new Error('VerifiedIdentity thiếu provider/providerUserId');
    err.statusCode = 500;
    throw err;
  }
  return Object.freeze({
    provider,
    providerUserId,
    email: input.email ? String(input.email).toLowerCase() : null,
    emailVerified: !!input.emailVerified,
    displayName: input.displayName || null,
    avatarUrl: input.avatarUrl || null
  });
}

/** Map sang shape legacy createSocialUser (providerId). */
function toLegacySocialProfile(verified) {
  return {
    providerId: verified.providerUserId,
    email: verified.email,
    emailVerified: verified.emailVerified,
    displayName: verified.displayName,
    avatarUrl: verified.avatarUrl
  };
}

module.exports = {
  createVerifiedIdentity,
  toLegacySocialProfile
};
