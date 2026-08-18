'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  renderHeadFromContract,
  detectSingletonViolations,
  renderShellHtml
} = require('../../src/modules/seo-platform/head-renderer');
const { buildSeoContract } = require('../../src/modules/seo-platform/seo-contract');
const { metadataFromContract } = require('../../src/modules/seo-platform/seo-platform.service');

describe('P4 singleton First HTML', () => {
  it('detects duplicate title/canonical as ERROR', () => {
    const bad =
      '<html><head><title>A</title><title>B</title>' +
      '<link rel="canonical" href="https://iflux.vn/a" />' +
      '<link rel="canonical" href="https://iflux.vn/b" /></head></html>';
    const d = detectSingletonViolations(bad);
    assert.equal(d.ok, false);
    assert.ok(d.violations.some((v) => v.field === 'title' && v.code === 'SINGLETON_DUPLICATE'));
    assert.ok(d.violations.some((v) => v.field === 'canonical' && v.code === 'SINGLETON_DUPLICATE'));
  });

  it('hub shell from Contract is singleton-clean', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'Thị trường', description: 'Mô tả', site_name: 'iFlux' },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200
    });
    const html = renderShellHtml(c);
    const d = detectSingletonViolations(html);
    assert.equal(d.ok, true);
    assert.equal(d.counts.title, 1);
    assert.equal(d.counts.canonical, 1);
    assert.ok(html.indexOf('<title>') >= 0);
    assert.ok(html.indexOf('og:title') >= 0);
    assert.ok(html.indexOf('name="robots"') >= 0);
  });

  it('decorated requestUri collapses identity + noindex in Contract', () => {
    const c = buildSeoContract({
      foundationEffective: { site_name: 'iFlux', title: 'Bài' },
      pageKey: 'community',
      entityType: 'article',
      path: '/cong-dong/bai-viet/demo',
      requestUri: '/IFLABCDE12345/cong-dong/bai-viet/demo',
      httpStatus: 200,
      entity: { title: 'Demo bài', excerpt: 'Tóm tắt' },
      overrides: {
        cleanPath: '/cong-dong/bai-viet/demo',
        canonical: 'https://iflux.vn/cong-dong/bai-viet/demo',
        ogType: 'article'
      }
    });
    assert.equal(c.classification.variant, 'DECORATED');
    assert.ok(c.indexability.robots.indexOf('noindex') >= 0);
    assert.ok(String(c.identity.canonicalUrl).endsWith('/cong-dong/bai-viet/demo'));
    assert.equal(c.indexability.sitemapEligible, false);
    const head = renderHeadFromContract(c, { forceImage: true });
    assert.equal(detectSingletonViolations('<head>\n' + head + '</head>').ok, true);
    assert.ok(head.indexOf('noindex') >= 0);
  });

  it('metadataFromContract carries Contract head for article pipelines', () => {
    const c = buildSeoContract({
      foundationEffective: { site_name: 'iFlux' },
      pageKey: 'community',
      entityType: 'article',
      path: '/cong-dong/bai-viet/x',
      httpStatus: 200,
      entity: { title: 'Tin A', excerpt: 'Mô tả A' },
      overrides: {
        cleanPath: '/cong-dong/bai-viet/x',
        canonical: 'https://iflux.vn/cong-dong/bai-viet/x',
        ogType: 'article'
      }
    });
    const meta = metadataFromContract(c);
    assert.equal(meta._fromContract, true);
    assert.ok(meta._headHtml.indexOf('<title>') >= 0);
    assert.equal(meta.title, 'Tin A | Cộng đồng iFlux');
    assert.ok(meta.canonical.endsWith('/cong-dong/bai-viet/x'));
  });
});
