/**
 * Presentation Resolver — RC-IO-01 · RC-IO-04 · RC-IO-05 · IO-001 Q4
 * Neo: IfluxInteractionPresentationResolver
 * Chỉ Layout/Host gọi — Component CẤM resolve/matchMedia.
 *
 * Đọc luật product IU-001 §7.1 — không fork matrix nơi khác.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionPresentationResolver) return;

  var MOBILE_MAX = 768;

  /**
   * §7.1 LOCKED defaults
   * Desktop/Tablet: sidebar primary
   * Mobile: bottom-sheet primary interactive (entry = bottom-bar riêng)
   * Exception: Community Post Comments → page primary (IU-001)
   */
  function defaultRules() {
    return {
      desktopPrimary: 'sidebar',
      tabletPrimary: 'sidebar',
      mobilePrimaryInteractive: 'bottom-sheet',
      mobileEntry: 'bottom-bar',
      pageFallback: 'page',
      mobileMaxWidth: MOBILE_MAX
    };
  }

  function isCommunityPostComments(pd) {
    var key = pd && pd.pageKey;
    return key === 'comments' || key === 'communityPost';
  }

  /**
   * @param {{ pageDefinition?: object, viewport?: { width?: number }, productRules?: object, preferPage?: boolean, entryOnly?: boolean }} input
   * @returns {'inline'|'sidebar'|'bottom-bar'|'bottom-sheet'|'page'}
   */
  function resolve(input) {
    input = input || {};
    var rules = Object.assign({}, defaultRules(), input.productRules || {});
    var pd = input.pageDefinition || {};
    var width = input.viewport && input.viewport.width != null
      ? Number(input.viewport.width)
      : (typeof global.innerWidth === 'number' ? global.innerWidth : 1200);

    /* Deep link / “view all” / comments page chrome — page */
    if (input.preferPage || pd.presentation === 'page' || pd.forcePage) {
      return 'page';
    }

    /* IU-001 Exception: Community Post Comments — mobile Primary = page */
    if (isCommunityPostComments(pd) && width <= rules.mobileMaxWidth && !input.entryOnly) {
      return 'page';
    }

    /* Hint từ Page Definition (không phải Component) */
    if (pd.presentationHint && typeof pd.presentationHint === 'string') {
      var hint = pd.presentationHint;
      if (hint === 'inline' || hint === 'sidebar' || hint === 'bottom-bar' || hint === 'bottom-sheet' || hint === 'page') {
        /* Mobile: không cho sidebar */
        if (width <= rules.mobileMaxWidth && hint === 'sidebar') {
          if (isCommunityPostComments(pd)) return 'page';
          return rules.mobilePrimaryInteractive;
        }
        return hint;
      }
    }

    if (width <= rules.mobileMaxWidth) {
      /* Entry bar là host riêng; interactive primary = sheet — RC §7.1 */
      if (input.entryOnly) return rules.mobileEntry;
      return rules.mobilePrimaryInteractive;
    }

    if (width <= 1024) {
      return rules.tabletPrimary || 'sidebar';
    }

    return rules.desktopPrimary || 'sidebar';
  }

  global.IfluxInteractionPresentationResolver = {
    resolve: resolve,
    defaultRules: defaultRules,
    MOBILE_MAX: MOBILE_MAX
  };
})(typeof window !== 'undefined' ? window : globalThis);
