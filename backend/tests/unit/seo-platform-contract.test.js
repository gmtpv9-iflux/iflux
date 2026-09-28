'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const httpPolicy = require('../../src/modules/seo-platform/http-policy');
const indexBoundary = require('../../src/modules/seo-platform/index-boundary');
const { buildSeoContract } = require('../../src/modules/seo-platform/seo-contract');
const { renderHeadFromContract } = require('../../src/modules/seo-platform/head-renderer');

describe('seo-platform http-policy P1.1', () => {
  it('classifies 200 as indexable success', () => {
    const p = httpPolicy.resolveHttpPolicy(200);
    assert.equal(p.httpClass, 'indexable_success');
    assert.equal(p.mayBeIndexable, true);
    assert.equal(p.sitemapEligibleDefault, true);
  });

  it('classifies 301/302 as redirect', () => {
    assert.equal(httpPolicy.resolveHttpPolicy(301).httpClass, 'redirect');
    assert.equal(httpPolicy.resolveHttpPolicy(302).sitemapEligibleDefault, false);
  });

  it('classifies 404/410 as not-found/gone', () => {
    assert.equal(httpPolicy.resolveHttpPolicy(404).httpClass, 'not_found_gone');
    assert.equal(httpPolicy.resolveHttpPolicy(410).mayBeIndexable, false);
  });

  it('classifies 403 as non-indexable non-success', () => {
    const p = httpPolicy.resolveHttpPolicy(403);
    assert.equal(p.httpClass, 'non_indexable_non_success');
    assert.equal(p.cacheAsIndexableSuccess, false);
  });

  it('classifies 429/5xx as transient failure', () => {
    assert.equal(httpPolicy.resolveHttpPolicy(429).httpClass, 'transient_server_failure');
    assert.equal(httpPolicy.resolveHttpPolicy(503).httpClass, 'transient_server_failure');
    assert.equal(httpPolicy.resolveHttpPolicy(500).healthIfIndexableClaim, 'WARN');
  });
});

describe('seo-platform index-boundary D-SEO-09', () => {
  it('classifies publicId path as DECORATED outside index universe', () => {
    const c = indexBoundary.classifyUrlVariant({ path: '/IFLABC12345/cong-dong/bai-viet/x' });
    assert.equal(c.variant, 'DECORATED');
    assert.equal(c.inIndexUniverse, false);
    assert.equal(c.cleanPath, '/cong-dong/bai-viet/x');
  });

  it('classifies ?ref= as QUERY_REF', () => {
    const c = indexBoundary.classifyUrlVariant({ path: '/cong-dong', search: '?ref=abc' });
    assert.equal(c.variant, 'QUERY_REF');
    assert.equal(c.inIndexUniverse, false);
  });
});

describe('seo-platform contract consume foundation', () => {
  it('builds coherent 200 contract from foundation effective input', () => {
    const contract = buildSeoContract({
      foundationEffective: {
        site_name: 'iFlux',
        title: 'Thị trường chứng khoán | iFlux',
        description: 'Mô tả',
        favicon_url: 'https://iflux.vn/media/x.png',
        og_image: 'https://iflux.vn/media/og.png'
      },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200
    });
    assert.equal(contract.foundationInput.consumed, true);
    assert.equal(contract.http.httpClass, 'indexable_success');
    assert.equal(contract.indexability.indexUniverse, true);
    assert.equal(contract.indexability.sitemapEligible, true);
    assert.ok(String(contract.identity.canonicalUrl).endsWith('/thi-truong'));
    assert.equal(contract.coherent, true);
  });

  it('decorated URL collapses to Clean identity and noindex', () => {
    const contract = buildSeoContract({
      foundationEffective: { site_name: 'iFlux', title: 'Tin tức' },
      pageKey: 'community',
      path: '/IFLABCDEF12/cong-dong',
      requestedUrl: 'https://iflux.vn/IFLABCDEF12/cong-dong',
      httpStatus: 200
    });
    assert.equal(contract.classification.variant, 'DECORATED');
    assert.equal(contract.indexability.indexUniverse, false);
    assert.equal(contract.indexability.sitemapEligible, false);
    assert.ok(contract.indexability.robots.indexOf('noindex') >= 0);
    assert.ok(String(contract.identity.seoIdentityUrl).endsWith('/cong-dong'));
  });

  it('404 cannot be sitemap eligible', () => {
    const contract = buildSeoContract({
      foundationEffective: { title: 'Không tìm thấy' },
      path: '/missing',
      httpStatus: 404
    });
    assert.equal(contract.http.httpClass, 'not_found_gone');
    assert.equal(contract.indexability.sitemapEligible, false);
    assert.equal(contract.indexability.indexUniverse, false);
  });

  it('singleton head has one title and one canonical', () => {
    const contract = buildSeoContract({
      foundationEffective: { title: 'A', description: 'B', site_name: 'iFlux' },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200
    });
    const head = renderHeadFromContract(contract, { forceImage: true });
    assert.equal((head.match(/<title>/g) || []).length, 1);
    assert.equal((head.match(/rel="canonical"/g) || []).length, 1);
    assert.equal((head.match(/name="robots"/g) || []).length, 1);
  });
});
