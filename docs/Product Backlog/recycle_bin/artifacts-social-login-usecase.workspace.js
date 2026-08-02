/**
 * Social Auth — SocialLoginUseCase (orchestration only).
 * Registry → IdentityProof → AR (một lần) → loginWithSocial → Session → AuthRedirectPolicy.
 * Không GIS · không verify · không Attribution write · không self-navigate.
 */
(function (global) {
  'use strict';

  function readActiveOwnerOnce() {
    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
      return IfluxIdentityContext.getActiveOwner() || null;
    }
    return null;
  }

  function proofToTokens(proof) {
    if (!proof || !proof.provider || !proof.kind || !proof.value) {
      throw new Error('IdentityProof không hợp lệ.');
    }
    if (proof.kind === 'id_token' || proof.kind === 'identity_token') {
      return { id_token: proof.value };
    }
    if (proof.kind === 'access_token') {
      return { access_token: proof.value };
    }
    if (proof.kind === 'authorization_code') {
      return { oauth_code: proof.value };
    }
    throw new Error('IdentityProof.kind không hỗ trợ: ' + proof.kind);
  }

  function ensureAuth() {
    if (!global.IfluxAuth || !IfluxAuth.loginWithSocial) {
      return Promise.reject(new Error('Hệ thống đăng nhập chưa sẵn sàng.'));
    }
    return Promise.resolve();
  }

  /** Authentication-owned redirect only (OD-SOL-12). */
  function applyAuthRedirectPolicy() {
    var policy = global.IfluxAuthRedirectPolicy;
    if (policy && typeof policy.execute === 'function') {
      policy.execute();
      return;
    }
    if (global.IfluxAuth && typeof IfluxAuth.redirectAfterAuth === 'function') {
      IfluxAuth.redirectAfterAuth();
    }
  }

  /**
   * @param {string} provider
   * @param {object} tokens
   * @param {{ remember_me?: boolean, skipRedirect?: boolean }} [pageOpts]
   */
  function completeWithTokens(provider, tokens, pageOpts) {
    pageOpts = pageOpts || {};
    return ensureAuth().then(function () {
      var referral_code = readActiveOwnerOnce();
      var opts = {
        remember_me: !!pageOpts.remember_me
      };
      if (referral_code) opts.referral_code = referral_code;
      return IfluxAuth.loginWithSocial(String(provider || '').toLowerCase(), tokens || {}, opts).then(
        function (user) {
          if (!pageOpts.skipRedirect) {
            setTimeout(function () {
              applyAuthRedirectPolicy();
            }, 400);
          }
          return user;
        }
      );
    });
  }

  /**
   * @param {string} provider
   * @param {{ remember_me?: boolean, skipRedirect?: boolean }} [pageOpts]
   */
  function execute(provider, pageOpts) {
    pageOpts = pageOpts || {};
    var reg = global.IfluxSocialProviderRegistry;
    if (!reg || typeof reg.resolve !== 'function') {
      return Promise.reject(new Error('ProviderRegistry chưa sẵn sàng.'));
    }
    var id = String(provider || '').toLowerCase();
    var adapter;
    try {
      adapter = reg.resolve(id);
    } catch (err) {
      return Promise.reject(err);
    }
    return adapter.getProof().then(function (proof) {
      return completeWithTokens(proof.provider, proofToTokens(proof), pageOpts);
    });
  }

  global.IfluxSocialLoginUseCase = {
    execute: execute,
    completeWithTokens: completeWithTokens
  };
})(window);
