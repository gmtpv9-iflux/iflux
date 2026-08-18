/* B1 — Single URL Reader implementation (ADR-AFF-007)
 * Pure function — no URL/history/context mutation.
 * Public: IfluxNormalizePath(path) → canonical path
 * IfluxRoutes.normalizePath delegates here when loaded.
 */
(function (global) {
  'use strict';

  var PUBLIC_ID_RE = /^IFL[A-Z0-9]{5,17}$/;

  function isPublicIdSegment(seg) {
    return PUBLIC_ID_RE.test(String(seg || '').trim().toUpperCase());
  }

  function normalizePath(path) {
    path = String(path || '/').split('?')[0].split('#')[0];
    if (path.length > 1 && path.charAt(path.length - 1) === '/') {
      path = path.slice(0, -1);
    }
    if (!path) path = '/';
    var parts = path.split('/');
    if (parts.length >= 2 && parts[0] === '' && isPublicIdSegment(parts[1])) {
      var rest = parts.slice(2).join('/');
      path = rest ? '/' + rest : '/';
    }
    return path || '/';
  }

  global.IfluxNormalizePath = normalizePath;
})(typeof window !== 'undefined' ? window : this);
