'use strict';

/**
 * Social auth — public config only (WP6).
 * Verify = identity/verifier-registry. Không shim verifyGoogleIdToken / verifySocialToken.
 */

const verifierRegistry = require('./identity/verifier-registry');

const SUPPORTED_PROVIDERS = verifierRegistry.list();

function getPublicSocialConfig(config) {
  return {
    google: {
      enabled: !!config.GOOGLE_CLIENT_ID,
      clientId: config.GOOGLE_CLIENT_ID || null
    },
    apple: {
      enabled: !!config.APPLE_CLIENT_ID,
      clientId: config.APPLE_CLIENT_ID || null
    },
    facebook: {
      enabled: !!(config.FACEBOOK_APP_ID && config.FACEBOOK_APP_SECRET),
      appId: config.FACEBOOK_APP_ID || null
    },
    zalo: {
      enabled: !!(config.ZALO_APP_ID && config.ZALO_APP_SECRET),
      appId: config.ZALO_APP_ID || null,
      redirectUri: config.ZALO_OAUTH_REDIRECT_URI || null
    }
  };
}

module.exports = {
  SUPPORTED_PROVIDERS,
  getPublicSocialConfig
};
