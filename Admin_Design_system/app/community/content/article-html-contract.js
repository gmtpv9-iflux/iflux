/* FN-CMS-ED-001 — Article HTML Contract (config only; engine = DOMPurify) */
(function (global) {
  'use strict';

  var ALLOWED_TAGS = [
    'h2', 'h3', 'p', 'strong', 'em', 'blockquote',
    'ul', 'ol', 'li', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'br'
  ];

  var ALLOWED_ATTR = [
    'href', 'title', 'rel', 'target',
    'src', 'alt',
    'colspan', 'rowspan',
    'data-media-asset-id'
  ];

  function trimStr(s) {
    return String(s == null ? '' : s).trim();
  }

  function isAllowedHref(raw) {
    var v = trimStr(raw);
    if (!v) return false;
    if (/^(javascript|data|vbscript|blob):/i.test(v)) return false;
    if (/^https?:\/\//i.test(v)) return true;
    if (/^mailto:/i.test(v)) return true;
    return false;
  }

  /** IMG: https/http hoặc Public Media URL nội bộ (/media/…) */
  function isAllowedImgSrc(raw) {
    var v = trimStr(raw);
    if (!v) return false;
    if (/^(javascript|data|vbscript|blob):/i.test(v)) return false;
    if (/^https?:\/\//i.test(v)) return true;
    if (/^\/media\//i.test(v)) return true;
    return false;
  }

  function getPurify() {
    return global.DOMPurify || (global.DomPurify) || null;
  }

  var hooksInstalled = false;

  function ensureHooks(purify) {
    if (hooksInstalled || !purify || typeof purify.addHook !== 'function') return;
    hooksInstalled = true;
    purify.addHook('uponSanitizeAttribute', function (node, data) {
      if (!data || !data.attrName) return;
      var name = String(data.attrName).toLowerCase();
      var val = data.attrValue == null ? '' : String(data.attrValue);
      if (name === 'href') {
        if (!isAllowedHref(val)) data.keepAttr = false;
      }
      if (name === 'src') {
        if (!isAllowedImgSrc(val)) data.keepAttr = false;
      }
      if (name === 'target') {
        if (trimStr(val) !== '_blank') data.keepAttr = false;
      }
    });
    purify.addHook('afterSanitizeAttributes', function (node) {
      if (!node || !node.tagName) return;
      var tag = String(node.tagName).toLowerCase();
      if (tag === 'a') {
        var href = node.getAttribute('href');
        if (!isAllowedHref(href)) {
          node.removeAttribute('href');
          /* unwrap: keep text, drop dangerous link */
          if (node.parentNode) {
            while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node);
            node.parentNode.removeChild(node);
          }
        } else if (node.getAttribute('target') === '_blank') {
          node.setAttribute('rel', 'noopener');
        }
      }
      if (tag === 'img') {
        var src = node.getAttribute('src');
        if (!isAllowedImgSrc(src)) {
          if (node.parentNode) node.parentNode.removeChild(node);
        }
      }
    });
  }

  /**
   * Sanitize article body HTML per Contract + URL/Image Policy.
   * Uses DOMPurify engine — never regex HTML parsing.
   */
  function sanitizeArticleHtml(html) {
    var purify = getPurify();
    if (!purify || typeof purify.sanitize !== 'function') {
      console.error('[IfluxArticleHtmlContract] DOMPurify missing — refusing unsanitized HTML');
      return '';
    }
    ensureHooks(purify);
    var input = html == null ? '' : String(html);
    return purify.sanitize(input, {
      ALLOWED_TAGS: ALLOWED_TAGS.slice(),
      ALLOWED_ATTR: ALLOWED_ATTR.slice(),
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SAFE_FOR_TEMPLATES: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    });
  }

  global.IfluxArticleHtmlContract = {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    isAllowedHref: isAllowedHref,
    isAllowedImgSrc: isAllowedImgSrc,
    sanitizeArticleHtml: sanitizeArticleHtml
  };
})(typeof window !== 'undefined' ? window : this);
