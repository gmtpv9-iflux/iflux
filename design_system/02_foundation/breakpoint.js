/**
 * Foundation — Runtime breakpoint abstraction (ECR 270727 Slice 2)
 * Owner: capability D1–D4 · Agent path: foundation/iflux-breakpoint.js
 * Px SoT: layout.css --ifx-bp-* ONLY (read via getComputedStyle — never hardcode px)
 * Semantic catalog v1: Phase C Matrix GO — mobile-shell → bp-lg
 * CSS bridge (D3): consumers use below()/matches(); @media uses SYNC comment + Foundation literal
 */
(function (global) {
  'use strict';
  if (global.IfluxBreakpoint) return;

  /** token id → CSS custom property (Foundation layout.css) */
  var TOKEN_VAR = {
    'bp-xs': '--ifx-bp-xs',
    'bp-sm': '--ifx-bp-sm',
    'bp-md': '--ifx-bp-md',
    'bp-lg': '--ifx-bp-lg',
    'bp-xl': '--ifx-bp-xl',
    'bp-2xl': '--ifx-bp-2xl',
    'bp-3xl': '--ifx-bp-3xl'
  };

  /** Semantic → Foundation token (D4 / Matrix GO) */
  var SEMANTIC_TOKEN = {
    'mobile-shell': 'bp-lg'
  };

  function rootEl() {
    return global.document && global.document.documentElement;
  }

  /** Read px from Foundation CSS var — single px authority */
  function tokenPx(tokenId) {
    var key = TOKEN_VAR[tokenId];
    if (!key) return null;
    var el = rootEl();
    if (!el || !global.getComputedStyle) return null;
    var raw = global.getComputedStyle(el).getPropertyValue(key).trim();
    if (!raw) return null;
    var n = parseFloat(raw, 10);
    return isNaN(n) ? null : n;
  }

  function semanticToken(semanticId) {
    return SEMANTIC_TOKEN[semanticId] || null;
  }

  function semanticPx(semanticId) {
    var tok = semanticToken(semanticId);
    return tok ? tokenPx(tok) : null;
  }

  function maxWidthQuery(px) {
    return '(max-width: ' + px + 'px)';
  }

  function matchesToken(tokenId) {
    var px = tokenPx(tokenId);
    if (px == null || !global.matchMedia) return false;
    return global.matchMedia(maxWidthQuery(px)).matches;
  }

  function below(tokenId) {
    return matchesToken(tokenId);
  }

  function above(tokenId) {
    var px = tokenPx(tokenId);
    if (px == null || !global.matchMedia) return false;
    return global.matchMedia('(min-width: ' + (px + 1) + 'px)').matches;
  }

  function matchesSemantic(semanticId) {
    var tok = semanticToken(semanticId);
    return tok ? matchesToken(tok) : false;
  }

  /** mobile-shell semantic — Matrix MAP → bp-lg */
  function isMobileShell() {
    return matchesSemantic('mobile-shell');
  }

  function viewportWidth() {
    return typeof global.innerWidth === 'number' ? global.innerWidth : null;
  }

  function belowSemantic(semanticId) {
    var px = semanticPx(semanticId);
    if (px == null || viewportWidth() == null) return false;
    return viewportWidth() <= px;
  }

  global.IfluxBreakpoint = {
    tokenPx: tokenPx,
    semanticToken: semanticToken,
    semanticPx: semanticPx,
    matches: matchesToken,
    below: below,
    above: above,
    matchesSemantic: matchesSemantic,
    isMobileShell: isMobileShell,
    belowSemantic: belowSemantic,
    viewportWidth: viewportWidth,
    TOKEN_VAR: TOKEN_VAR,
    SEMANTIC_TOKEN: Object.freeze(Object.assign({}, SEMANTIC_TOKEN))
  };
})(typeof window !== 'undefined' ? window : globalThis);
