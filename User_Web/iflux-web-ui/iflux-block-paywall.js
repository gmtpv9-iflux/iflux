/**
 * Legacy Block Paywall — thu hẹp: không inject overlay Widget Publish.
 * Overlay / badge = IfluxWidgetShell. Giữ API resolveCta cho chỗ cũ còn gọi.
 */
(function (global) {
  'use strict';

  function resolveCta(blockId) {
    var shell = global.IfluxWidgetShell;
    if (shell && shell.badgeCopyForTier && global.IfluxEntitlements) {
      if (IfluxEntitlements.hasBlock(blockId)) return null;
      return shell.badgeCopyForTier(IfluxEntitlements.resolveTier());
    }
    return null;
  }

  function lockBlock(blockEl, blockId) {
    if (!blockEl) return;
    if (global.IfluxWidgetShell && IfluxWidgetShell.setLocked) {
      IfluxWidgetShell.setLocked(blockEl, true);
      return;
    }
    blockEl.classList.add('ifx-widget-locked');
    blockEl.setAttribute('data-ifx-ent-access', 'teaser');
  }

  function unlockBlock(blockEl) {
    if (!blockEl) return;
    if (global.IfluxWidgetShell && IfluxWidgetShell.setLocked) {
      IfluxWidgetShell.setLocked(blockEl, false);
      return;
    }
    blockEl.classList.remove('ifx-widget-locked');
    blockEl.setAttribute('data-ifx-ent-access', 'full');
  }

  global.IfluxBlockPaywall = {
    resolveCta: resolveCta,
    lockBlock: lockBlock,
    unlockBlock: unlockBlock
  };
})(window);
