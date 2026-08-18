'use strict';

/**
 * Singleton head emission from SEO Contract (one authoritative instance per field).
 */

function escapeHtmlAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHeadFromContract(contract, opts) {
  opts = opts || {};
  var c = contract || {};
  var doc = c.document || {};
  var identity = c.identity || {};
  var indexability = c.indexability || {};
  var social = (c.social && c.social.og) || {};
  var twitter = (c.social && c.social.twitter) || {};
  var assets = c.assets || {};

  var title = escapeHtmlAttr(doc.documentTitle || doc.title || 'iFlux');
  var description = escapeHtmlAttr(doc.description || '');
  var canonical = escapeHtmlAttr(identity.canonicalUrl || identity.seoIdentityUrl || '');
  var robots = escapeHtmlAttr(indexability.robots || 'index,follow');
  var siteName = escapeHtmlAttr(social.site_name || 'iFlux');
  var ogTitle = escapeHtmlAttr(social.title || doc.title || 'iFlux');
  var ogDesc = escapeHtmlAttr(social.description || description);
  var ogUrl = escapeHtmlAttr(social.url || canonical);
  var ogType = escapeHtmlAttr(social.type || 'website');
  var image = escapeHtmlAttr(social.image || assets.ogImageUrl || '');
  if (image && image.charAt(0) === '/') {
    image = 'https://iflux.vn' + image;
  } else if (image && image.indexOf('//') === 0) {
    image = 'https:' + image;
  }
  var favicon = escapeHtmlAttr(assets.faviconUrl || '');
  var twCard = escapeHtmlAttr(twitter.card || 'summary');

  var lines = [];
  lines.push('  <title>' + title + '</title>');
  if (description) lines.push('  <meta name="description" content="' + description + '" />');
  lines.push('  <meta name="robots" content="' + robots + '" />');
  if (canonical) lines.push('  <link rel="canonical" href="' + canonical + '" />');
  if (favicon) {
    lines.push('  <link rel="icon" href="' + favicon + '" />');
    lines.push('  <link rel="apple-touch-icon" href="' + favicon + '" />');
  }
  lines.push('  <meta property="og:site_name" content="' + siteName + '" />');
  lines.push('  <meta property="og:type" content="' + ogType + '" />');
  lines.push('  <meta property="og:title" content="' + ogTitle + '" />');
  if (ogDesc) lines.push('  <meta property="og:description" content="' + ogDesc + '" />');
  if (ogUrl) lines.push('  <meta property="og:url" content="' + ogUrl + '" />');
  if (image && ((c.http && c.http.httpClass === 'indexable_success') || opts.forceImage)) {
    lines.push('  <meta property="og:image" content="' + image + '" />');
    lines.push('  <meta property="og:image:secure_url" content="' + image + '" />');
    if (social.imageMime) {
      lines.push('  <meta property="og:image:type" content="' + escapeHtmlAttr(social.imageMime) + '" />');
    }
    if (social.imageWidth) {
      lines.push('  <meta property="og:image:width" content="' + escapeHtmlAttr(social.imageWidth) + '" />');
    }
    if (social.imageHeight) {
      lines.push('  <meta property="og:image:height" content="' + escapeHtmlAttr(social.imageHeight) + '" />');
    }
    var imageAlt = escapeHtmlAttr(social.imageAlt || '');
    if (imageAlt) lines.push('  <meta property="og:image:alt" content="' + imageAlt + '" />');
  }
  lines.push('  <meta name="twitter:card" content="' + twCard + '" />');
  lines.push('  <meta name="twitter:title" content="' + ogTitle + '" />');
  if (ogDesc) lines.push('  <meta name="twitter:description" content="' + ogDesc + '" />');
  if (image && ((c.http && c.http.httpClass === 'indexable_success') || opts.forceImage)) {
    lines.push('  <meta name="twitter:image" content="' + image + '" />');
  }

  if (opts.includeJsonLd && identity.seoIdentityUrl && indexability.indexUniverse) {
    var ld = {
      '@context': 'https://schema.org',
      '@type': opts.schemaType || 'WebPage',
      name: doc.title || 'iFlux',
      url: identity.seoIdentityUrl,
      description: doc.description || undefined
    };
    lines.push(
      '  <script type="application/ld+json">' +
        JSON.stringify(ld).replace(/</g, '\\u003c') +
        '</script>'
    );
    var bcLd = c.breadcrumb && c.breadcrumb.jsonLd;
    if (!bcLd && c.structuredData && c.structuredData.breadcrumb) {
      bcLd = c.structuredData.breadcrumb;
    }
    if (bcLd && bcLd.itemListElement && bcLd.itemListElement.length) {
      lines.push(
        '  <script type="application/ld+json">' +
          JSON.stringify(bcLd).replace(/</g, '\\u003c') +
          '</script>'
      );
    }
  }

  return lines.join('\n') + '\n';
}

function renderShellHtml(contract, opts) {
  opts = opts || {};
  var head = renderHeadFromContract(contract, Object.assign({ includeJsonLd: true, forceImage: true }, opts));
  var body = opts.bodyHtml || '<p>iFlux</p>';
  return (
    '<!DOCTYPE html>\n' +
    '<html lang="vi">\n' +
    '<head>\n' +
    '  <meta charset="utf-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    head +
    '</head>\n' +
    '<body>\n' +
    body +
    '\n</body>\n</html>\n'
  );
}

/**
 * P4 — Detect duplicate singleton SEO tags in emitted HTML (SoT §11).
 * One authoritative instance per field.
 */
function detectSingletonViolations(html) {
  var src = String(html || '');
  var counts = {
    title: (src.match(/<title[\s>]/gi) || []).length,
    description: (src.match(/name\s*=\s*["']description["']/gi) || []).length,
    canonical: (src.match(/rel\s*=\s*["']canonical["']/gi) || []).length,
    robots: (src.match(/name\s*=\s*["']robots["']/gi) || []).length,
    'og:title': (src.match(/property\s*=\s*["']og:title["']/gi) || []).length,
    'og:description': (src.match(/property\s*=\s*["']og:description["']/gi) || []).length,
    'og:url': (src.match(/property\s*=\s*["']og:url["']/gi) || []).length,
    'og:image': (src.match(/property\s*=\s*["']og:image["']/gi) || []).length,
    'twitter:title': (src.match(/name\s*=\s*["']twitter:title["']/gi) || []).length,
    'twitter:image': (src.match(/name\s*=\s*["']twitter:image["']/gi) || []).length
  };
  var violations = [];
  Object.keys(counts).forEach(function (field) {
    var n = counts[field];
    if (n > 1) {
      violations.push({ field: field, count: n, severity: 'ERROR', code: 'SINGLETON_DUPLICATE' });
    }
  });
  if (counts.title === 0) {
    violations.push({ field: 'title', count: 0, severity: 'ERROR', code: 'SINGLETON_MISSING' });
  }
  if (counts.canonical === 0) {
    violations.push({ field: 'canonical', count: 0, severity: 'ERROR', code: 'SINGLETON_MISSING' });
  }
  return { ok: violations.length === 0, counts: counts, violations: violations };
}

module.exports = {
  escapeHtmlAttr,
  renderHeadFromContract,
  renderShellHtml,
  detectSingletonViolations
};
