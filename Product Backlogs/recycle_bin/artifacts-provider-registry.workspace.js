/**
 * Social Auth — ProviderRegistry (OD-SOL-13).
 * resolve(provider) → Provider adapter. Không business logic.
 */
(function (global) {
  'use strict';

  var providers = Object.create(null);

  function register(provider, adapter) {
    var id = String(provider || '').toLowerCase();
    if (!id || !adapter || typeof adapter.getProof !== 'function') {
      throw new Error('ProviderRegistry.register yêu cầu id + adapter.getProof');
    }
    providers[id] = adapter;
  }

  function resolve(provider) {
    var id = String(provider || '').toLowerCase();
    var adapter = providers[id];
    if (!adapter) {
      throw new Error('Social provider chưa đăng ký: ' + id);
    }
    return adapter;
  }

  function has(provider) {
    return !!providers[String(provider || '').toLowerCase()];
  }

  // Bootstrap: register Google when present (registration layer — switch OK here only via register calls)
  if (global.IfluxGoogleProvider) {
    register('google', global.IfluxGoogleProvider);
  }

  global.IfluxSocialProviderRegistry = {
    register: register,
    resolve: resolve,
    has: has
  };
})(window);
