/**
 * Interaction Feature entry — load order RC-PS → API → Store → IP → IO → IU
 * Phase 5: Summary path ≠ Interactive path (RC-IR-01…04).
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionBoot) return;

  var BASE = '/User_Web/iflux-web-ui/interaction/';
  var V = '?v=b5ixFlat20260727';
  var SHARE_STORE = '/Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js?v=p7ShareSheet20260730';

  /* RC-IR-01: Summary — Persistence + Api + Store projection + Permission + Catalog + Host */
  var SCRIPTS_SUMMARY = [
    SHARE_STORE,
    BASE + 'persistence-adapter.js' + V,
    BASE + 'interaction-api.js' + V,
    BASE + 'interaction-store.js' + V,
    BASE + 'permission.js' + V,
    BASE + 'catalog/index.js' + V,
    BASE + 'interaction-host.js' + V
  ];

  /* Interactive thêm Resolver (presentation) */
  var SCRIPTS_INTERACTIVE_EXTRA = [
    BASE + 'presentation-resolver.js' + V
  ];

  var SCRIPTS = SCRIPTS_SUMMARY.concat(SCRIPTS_INTERACTIVE_EXTRA);

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadChain(list, flag) {
    if (global[flag]) return Promise.resolve();
    var chain = Promise.resolve();
    list.forEach(function (src) {
      chain = chain.then(function () { return loadScript(src); });
    });
    return chain.then(function () {
      global[flag] = true;
    });
  }

  function ensureForSummary() {
    return loadChain(SCRIPTS_SUMMARY, '__IFLUX_IX_SUMMARY_LOADED__');
  }

  function ensureForInteractive() {
    return ensureForSummary().then(function () {
      return loadChain(SCRIPTS_INTERACTIVE_EXTRA, '__IFLUX_IX_INTERACTIVE_LOADED__');
    }).then(function () {
      global.__IFLUX_IX_LOADED__ = true;
    });
  }

  function loadAll() {
    return ensureForInteractive();
  }

  global.IfluxInteractionBoot = {
    loadAll: loadAll,
    ensureForSummary: ensureForSummary,
    ensureForInteractive: ensureForInteractive,
    SCRIPTS: SCRIPTS,
    SCRIPTS_SUMMARY: SCRIPTS_SUMMARY,
    SCRIPTS_INTERACTIVE_EXTRA: SCRIPTS_INTERACTIVE_EXTRA
  };
})(typeof window !== 'undefined' ? window : globalThis);
