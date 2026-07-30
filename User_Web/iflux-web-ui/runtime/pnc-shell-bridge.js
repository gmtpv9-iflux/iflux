/* B2 — Shell bridge: Initial Context Event → lifecycle gate (ADR-AFF-007) */
(function (global) {
  'use strict';

  var EVENT_TYPE = 'iflux-incoming-referrer';

  function onIncomingReferrer(detail) {
    if (global.IfluxPncLifecycle && IfluxPncLifecycle.onIncomingReferrer) {
      IfluxPncLifecycle.onIncomingReferrer(detail);
    }
  }

  function init() {
    if (global.__IFLUX_PNC_BRIDGE_INIT__) return;
    global.__IFLUX_PNC_BRIDGE_INIT__ = true;
    global.addEventListener(EVENT_TYPE, function (e) {
      onIncomingReferrer(e && e.detail);
    });
    /* Replay deferred to IfluxPncLifecycle.init — after auth/session restore (G7 foreign refresh) */
  }

  init();

  global.IfluxPncShellBridge = {
    EVENT_TYPE: EVENT_TYPE,
    init: init,
    replayPendingIncoming: function () {
      if (global.__IFLUX_INITIAL_CONTEXT_EVENT__) {
        onIncomingReferrer(global.__IFLUX_INITIAL_CONTEXT_EVENT__);
      }
    }
  };
})(typeof window !== 'undefined' ? window : this);
