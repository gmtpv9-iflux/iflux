/**
 * Interaction Host — RC-IO-02 · RC-IO-03 · RC-IO-06…08
 * Neo: IfluxInteractionHost
 * Nhiều mount đồng thời (summary + interactive) — mỗi root một handle.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionHost && global.IfluxInteractionHost.__ixMulti) return;

  var _byRoot = [];

  function resolver() {
    return global.IfluxInteractionPresentationResolver;
  }

  function store() {
    return global.IfluxInteractionStore;
  }

  function catalog() {
    return global.IfluxInteractionCatalog;
  }

  function findHandle(root) {
    for (var i = 0; i < _byRoot.length; i++) {
      if (_byRoot[i].root === root) return _byRoot[i];
    }
    return null;
  }

  function unmountRoot(root) {
    var h = findHandle(root);
    if (h) h.unmount();
  }

  function anyInteractiveMounted() {
    return _byRoot.some(function (h) { return h.mode === 'interactive'; });
  }

  function mountInteraction(opts) {
    opts = opts || {};
    var target = opts.target || {};
    var mode = opts.mode === 'interactive' ? 'interactive' : 'summary';
    var presentation = opts.presentation;

    if (!presentation && resolver()) {
      presentation = resolver().resolve({
        pageDefinition: opts.pageDefinition,
        viewport: opts.viewport || { width: global.innerWidth },
        preferPage: opts.preferPage,
        entryOnly: opts.entryOnly
      });
    }
    presentation = presentation || 'sidebar';

    var root = opts.root || opts.el;
    if (!root) {
      throw new Error('RC-IO: mountInteraction cần root element');
    }

    unmountRoot(root);

    root.setAttribute('data-ifx-ix-host', '1');
    root.setAttribute('data-ifx-ix-mode', mode);
    root.setAttribute('data-ifx-ix-presentation', presentation);

    var handle = {
      target: target,
      mode: mode,
      presentation: presentation,
      root: root,
      unmount: function () {
        teardown(handle);
      }
    };

    if (mode === 'summary') {
      if (store() && store().resetForSummaryMode && !anyInteractiveMounted()) {
        store().resetForSummaryMode();
      }
      if (catalog() && catalog().renderSummary) {
        catalog().renderSummary(root, {
          target: target,
          projection: store() ? store().getProjection(target) : { likes: 0, comments: 0, shares: 0, favorites: 0 },
          onOpenInteractive: opts.onOpenInteractive,
          variant: opts.variant
        });
      }
      if (store() && store().refreshProjection) {
        store().refreshProjection(target).then(function (counts) {
          if (catalog() && catalog().updateSummaryCounts) {
            catalog().updateSummaryCounts(root, counts);
          }
          try {
            document.dispatchEvent(new CustomEvent('iflux-ix-projection', { detail: { target: target, counts: counts } }));
          } catch (e) { /* ignore */ }
        }).catch(function () { /* ignore */ });
      }
    } else {
      if (store() && store().initInteractive) store().initInteractive();
      if (catalog() && catalog().renderInteractive) {
        catalog().renderInteractive(root, {
          target: target,
          projection: store() ? store().getProjection(target) : { likes: 0, comments: 0, shares: 0, favorites: 0 },
          variant: opts.variant,
          onReply: opts.onReply
        });
      }
      if (store() && store().refreshProjection) {
        store().refreshProjection(target).then(function (counts) {
          if (catalog() && catalog().updateSummaryCounts) {
            catalog().updateSummaryCounts(root, counts);
          }
          try {
            document.dispatchEvent(new CustomEvent('iflux-ix-projection', { detail: { target: target, counts: counts } }));
          } catch (e) { /* ignore */ }
        }).catch(function () { /* ignore */ });
      }
      if (store() && store().loadThread) {
        store().loadThread(target, { limit: 50 }).then(function (thread) {
          if (catalog() && catalog().renderThread) {
            catalog().renderThread(root, thread, {
              target: target,
              onReply: opts.onReply
            });
          }
          if (catalog() && catalog().updateSummaryCounts && store().getProjection) {
            catalog().updateSummaryCounts(root, store().getProjection(target));
          }
        }).catch(function (err) {
          if (global.console && console.warn) console.warn('[IX Host]', err);
        });
      }
    }

    _byRoot.push(handle);
    return handle;
  }

  function teardown(handle) {
    if (!handle || !handle.root) return;
    handle.root.removeAttribute('data-ifx-ix-host');
    handle.root.removeAttribute('data-ifx-ix-mode');
    handle.root.removeAttribute('data-ifx-ix-presentation');
    handle.root.innerHTML = '';
    _byRoot = _byRoot.filter(function (h) { return h !== handle; });
    if (handle.mode === 'interactive' && store() && store().resetForSummaryMode && !anyInteractiveMounted()) {
      store().resetForSummaryMode();
    }
  }

  function unmountAll() {
    _byRoot.slice().forEach(function (h) { h.unmount(); });
  }

  global.IfluxInteractionHost = {
    __ixMulti: true,
    mountInteraction: mountInteraction,
    unmountRoot: unmountRoot,
    unmountAll: unmountAll
  };

  global.mountInteraction = function (opts) {
    return mountInteraction(opts);
  };
})(typeof window !== 'undefined' ? window : globalThis);
