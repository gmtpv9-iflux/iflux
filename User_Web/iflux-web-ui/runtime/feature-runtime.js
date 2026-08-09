/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-008
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * iFlux Feature Runtime — Manifest Contract §4.1.1 + State Machine §4.1.2
 * Wave 3 Phase C: assert Shell/Definition · tải modules[] Feature-only · lifecycle.
 *
 * KHÔNG tải Shell deps · KHÔNG apply Definition · KHÔNG preload lazyChildren.
 */

import { loadScript, loadStyle } from './legacy-bridge.js?v=cssPin20260808';

var STATES = {
  NOT_LOADED: 'NOT_LOADED',
  BOOTING: 'BOOTING',
  READY: 'READY',
  DISPOSED: 'DISPOSED'
};

/** AD-C3: allowlist — cấm modules[] trỏ resource Shell/Platform. */
var SHELL_SRC_BLOCKLIST = [
  /\/block-templates\.js$/i,
  /\/iflux-api-bundle\.js$/i,
  /\/iflux-platform-boot\.js$/i,
  /\/auth\.js$/i,
  /\/iflux-guest-shell\.js$/i,
  /\/watchlist-taxonomy\.js$/i,
  /\/iflux-market-master\.js$/i,
  /\/mock-market\.js$/i,
  /\/seo-url\.js$/i,
  /\/iflux-market-seed-data\.js$/i,
  /\/iflux-market-ecosystem-seeds\.js$/i,
  /\/iflux-market-registry-store\.js$/i,
  /\/entitlement-catalog\.js$/i,
  /\/plans-store\.js$/i,
  /\/iflux-entitlements\.js$/i
];

var REQUIRED_MANIFEST_KEYS = [
  'id', 'pageKey', 'version', 'pattern', 'class',
  'requiresShell', 'requiresDefinition', 'requiresAPI',
  'modules', 'lazyChildren', 'lifecycle'
];

function barePath(src) {
  return String(src || '').split('?')[0];
}

function isShellSrc(src) {
  var bare = barePath(src);
  for (var i = 0; i < SHELL_SRC_BLOCKLIST.length; i++) {
    if (SHELL_SRC_BLOCKLIST[i].test(bare)) return true;
  }
  return false;
}

export function validateFeatureManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('[FeatureRuntime] Manifest thiếu');
  }
  for (var i = 0; i < REQUIRED_MANIFEST_KEYS.length; i++) {
    var key = REQUIRED_MANIFEST_KEYS[i];
    if (manifest[key] === undefined || manifest[key] === null) {
      throw new Error('[FeatureRuntime] Manifest thiếu field: ' + key);
    }
  }
  if (!Array.isArray(manifest.class) || !manifest.class.length) {
    throw new Error('[FeatureRuntime] class[] bắt buộc');
  }
  if (!Array.isArray(manifest.requiresShell)) {
    throw new Error('[FeatureRuntime] requiresShell[] bắt buộc');
  }
  if (!Array.isArray(manifest.modules)) {
    throw new Error('[FeatureRuntime] modules[] bắt buộc');
  }
  if (!Array.isArray(manifest.lazyChildren)) {
    throw new Error('[FeatureRuntime] lazyChildren[] bắt buộc (có thể [])');
  }
  var life = manifest.lifecycle;
  if (!life || typeof life !== 'object') {
    throw new Error('[FeatureRuntime] lifecycle bắt buộc');
  }
  ['boot', 'init', 'ready', 'dispose'].forEach(function (h) {
    if (!(h in life)) throw new Error('[FeatureRuntime] lifecycle.' + h + ' bắt buộc');
  });

  manifest.modules.forEach(function (mod, idx) {
    if (!mod || !mod.id || !mod.kind || !mod.src) {
      throw new Error('[FeatureRuntime] modules[' + idx + '] thiếu id/kind/src');
    }
    if (mod.businessOwner !== 'feature' || mod.runtimeOwner !== 'feature') {
      throw new Error('[FeatureRuntime] modules[' + idx + '] Owner phải = feature');
    }
    if (isShellSrc(mod.src)) {
      throw new Error('[FeatureRuntime] modules[] cấm Shell src: ' + mod.src);
    }
  });
  return manifest;
}

function assertRequiresShell(names) {
  var missing = [];
  (names || []).forEach(function (g) {
    if (!window[g]) missing.push(g);
  });
  if (missing.length) {
    throw new Error('[FeatureRuntime] requiresShell thiếu: ' + missing.join(', '));
  }
}

function assertRequiresDefinition(flag) {
  if (!flag) return;
  var store = window.__IFLUX_PAGE_DEFINITION__;
  if (!store || !store.current) {
    throw new Error('[FeatureRuntime] requiresDefinition: chưa apply Page Definition');
  }
}

function canTransition(from, to) {
  if (from === STATES.NOT_LOADED && to === STATES.BOOTING) return true;
  if (from === STATES.DISPOSED && to === STATES.BOOTING) return true;
  if (from === STATES.BOOTING && to === STATES.READY) return true;
  if (from === STATES.READY && to === STATES.DISPOSED) return true;
  if (from === STATES.BOOTING && to === STATES.DISPOSED) return true; /* boot fail cleanup */
  return false;
}

async function loadModules(modules) {
  var css = [];
  var js = [];
  (modules || []).forEach(function (mod) {
    if (!mod || !mod.src) return;
    if (mod.kind === 'css') {
      css.push(mod.src);
      return;
    }
    /* js | store — skip nếu global đã có (idempotent) */
    if (mod.global && window[mod.global]) return;
    js.push(mod.src);
  });
  if (css.length) await Promise.all(css.map(loadStyle));
  /* loadScript async=false → tải song song, thực thi đúng thứ tự chèn */
  if (js.length) await Promise.all(js.map(loadScript));
}

function publishState(pageKey, state) {
  if (!window.__IFLUX_FEATURE_STATE__) window.__IFLUX_FEATURE_STATE__ = {};
  window.__IFLUX_FEATURE_STATE__[pageKey] = state;
  try {
    document.dispatchEvent(new CustomEvent('iflux-feature-state', {
      detail: { pageKey: pageKey, state: state }
    }));
  } catch (e) { /* ignore */ }
}

/**
 * @param {object} manifest FeatureManifest §4.1.1
 * @returns {{ getState: Function, boot: Function, dispose: Function, manifest: object }}
 */
export function createFeatureRuntime(manifest) {
  validateFeatureManifest(manifest);
  var state = STATES.NOT_LOADED;
  var pageKey = manifest.pageKey;
  publishState(pageKey, state);

  function setState(next) {
    if (!canTransition(state, next)) {
      throw new Error('[FeatureRuntime] chuyển trạng thái cấm: ' + state + ' → ' + next);
    }
    state = next;
    publishState(pageKey, state);
  }

  async function boot(hooks) {
    hooks = hooks || {};
    if (state === STATES.READY) return { state: state };
    if (state === STATES.BOOTING) {
      throw new Error('[FeatureRuntime] đang BOOTING — không boot chồng');
    }
    setState(STATES.BOOTING);

    try {
      /* lifecycle.boot */
      assertRequiresShell(manifest.requiresShell);
      assertRequiresDefinition(manifest.requiresDefinition);
      /* lazyChildren: chỉ khai báo — KHÔNG preload */
      await loadModules(manifest.modules);
      if (typeof hooks.init === 'function') await hooks.init();
      setState(STATES.READY);
      if (typeof hooks.ready === 'function') await hooks.ready();
      try {
        document.dispatchEvent(new CustomEvent('iflux-feature-ready', {
          detail: { pageKey: pageKey, id: manifest.id, version: manifest.version }
        }));
      } catch (e2) { /* ignore */ }
      return { state: state };
    } catch (err) {
      try { setState(STATES.DISPOSED); } catch (e3) { /* ignore */ }
      throw err;
    }
  }

  function dispose(hooks) {
    hooks = hooks || {};
    if (state === STATES.NOT_LOADED || state === STATES.DISPOSED) {
      return { state: state };
    }
    if (typeof hooks.dispose === 'function') hooks.dispose();
    setState(STATES.DISPOSED);
    try {
      document.dispatchEvent(new CustomEvent('iflux-feature-disposed', {
        detail: { pageKey: pageKey, id: manifest.id }
      }));
    } catch (e) { /* ignore */ }
    return { state: state };
  }

  return {
    getState: function () { return state; },
    boot: boot,
    dispose: dispose,
    manifest: manifest
  };
}

export var FeatureStates = STATES;
