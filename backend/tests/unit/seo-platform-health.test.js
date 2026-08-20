'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildSeoContract } = require('../../src/modules/seo-platform/seo-contract');
const {
  evaluateSeoHealth,
  buildPreviewFromContract,
  buildObservabilityBundle
} = require('../../src/modules/seo-platform/health');
const { renderShellHtml, detectSingletonViolations } = require('../../src/modules/seo-platform/head-renderer');

describe('P7 health / preview / observability', () => {
  it('flags 404 + sitemap/indexable as ERROR', () => {
    const c = buildSeoContract({
      foundationEffective: { title: '404' },
      path: '/missing',
      httpStatus: 404
    });
    // Force illegal claim to prove matrix
    c.indexability.sitemapEligible = true;
    c.indexability.indexUniverse = true;
    const h = evaluateSeoHealth(c);
    assert.equal(h.status, 'ERROR');
    assert.ok(h.issues.some((i) => i.code === 'HTTP_404_SITEMAP' || i.code === 'HTTP_404_INDEXABLE'));
  });

  it('flags noindex + sitemapEligible as ERROR', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'X' },
      pageKey: 'community',
      path: '/tin-tuc',
      httpStatus: 200,
      overrides: { robots: 'noindex,nofollow', forceNonIndex: true }
    });
    c.indexability.sitemapEligible = true;
    const h = evaluateSeoHealth(c);
    assert.equal(h.status, 'ERROR');
    assert.ok(h.issues.some((i) => i.code === 'SITEMAP_NOINDEX_CONFLICT'));
  });

  it('flags singleton duplicate as Contract Violation ERROR', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'Hub', description: 'D' },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200
    });
    const badHtml =
      renderShellHtml(c) + '<title>dup</title><link rel="canonical" href="https://iflux.vn/x" />';
    const h = evaluateSeoHealth(c, { html: badHtml });
    assert.equal(h.status, 'ERROR');
    assert.ok(h.issues.some((i) => String(i.code).indexOf('SINGLETON') >= 0));
  });

  it('preview matches Contract head fields', () => {
    const c = buildSeoContract({
      foundationEffective: {
        site_name: 'iFlux',
        title: 'Thị trường chứng khoán | iFlux',
        description: 'Mô tả thị trường',
        og_image: 'https://iflux.vn/media/og.png'
      },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200
    });
    const p = buildPreviewFromContract(c);
    assert.equal(p.google.title, c.document.documentTitle);
    assert.equal(p.google.url, c.identity.seoIdentityUrl);
    assert.equal(p.google.description, c.document.description);
    assert.equal(p.openGraph.url, c.identity.seoIdentityUrl);
    assert.ok(p.headHtml.indexOf('<title>') >= 0);
    assert.equal(detectSingletonViolations('<head>\n' + p.headHtml + '</head>').ok, true);
  });

  it('observability bundle exposes full chain', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'Tin tức', description: 'x' },
      pageKey: 'community',
      path: '/tin-tuc',
      httpStatus: 200
    });
    const b = buildObservabilityBundle(c, { path: '/tin-tuc' });
    assert.deepEqual(b.chain, ['url', 'resolve', 'contract', 'render', 'health']);
    assert.ok(b.contract);
    assert.ok(b.preview.google);
    assert.ok(b.health.status);
    assert.ok(b.emittedHead);
  });
});
