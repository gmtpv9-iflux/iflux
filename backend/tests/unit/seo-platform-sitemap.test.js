'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSeoContract,
  isContractSitemapEligible
} = require('../../src/modules/seo-platform/seo-contract');
const {
  collectSitemapEntries,
  buildSitemapXml,
  ARTICLE_CANDIDATE_BATCH
} = require('../../src/modules/seo-platform/seo-platform.service');

describe('isContractSitemapEligible (Contract gate)', () => {
  it('allows clean 200 indexable contract', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'Hub' },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200
    });
    assert.equal(isContractSitemapEligible(c), true);
  });

  it('rejects decorated URL contract', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'X' },
      pageKey: 'community',
      path: '/IFLABCDE12345/cong-dong',
      requestedUrl: 'https://iflux.vn/IFLABCDE12345/cong-dong',
      httpStatus: 200
    });
    assert.equal(c.classification.variant, 'DECORATED');
    assert.equal(isContractSitemapEligible(c), false);
  });

  it('rejects noindex override', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'X' },
      pageKey: 'community',
      path: '/tin-tuc/bai-viet/abc',
      httpStatus: 200,
      overrides: { robots: 'noindex,nofollow', cleanPath: '/tin-tuc/bai-viet/abc' }
    });
    assert.equal(isContractSitemapEligible(c), false);
  });

  it('rejects 404 HTTP class', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'X' },
      path: '/missing',
      httpStatus: 404
    });
    assert.equal(isContractSitemapEligible(c), false);
  });
});

describe('P5 sitemap Contract eligibility + scale (>5000)', () => {
  it('includes Contract-eligible articles beyond old LIMIT 5000; excludes noindex', async () => {
    const TOTAL = 5500;
    const NOINDEX_EVERY = 100;
    const candidates = [];
    for (let i = 0; i < TOTAL; i++) {
      candidates.push({
        slug: 'article-' + i,
        updated_at: new Date(Date.UTC(2026, 0, 1) + i * 1000).toISOString(),
        seo: i % NOINDEX_EVERY === 0 ? { robots: 'noindex' } : { title: 'A' + i },
        status: 'published',
        content_type: 'article'
      });
    }

    async function listArticleCandidatesPage({ limit, offset }) {
      return candidates.slice(offset, offset + limit);
    }

    const collected = await collectSitemapEntries({
      listArticleCandidatesPage,
      foundationEffectiveByPageKey: { community: { site_name: 'iFlux', title: 'Tin tức' } },
      skipFoundationFetch: true
    });

    const noindexCount = Math.floor((TOTAL - 1) / NOINDEX_EVERY) + 1;
    assert.equal(collected.stats.articleCandidates, TOTAL);
    assert.equal(collected.stats.articleExcludedByContract, noindexCount);
    assert.equal(collected.stats.articleIncluded, TOTAL - noindexCount);
    assert.ok(collected.stats.articleIncluded > 5000, 'must exceed old LIMIT 5000');
    assert.equal(collected.stats.staticIncluded, 9);
    assert.ok(ARTICLE_CANDIDATE_BATCH < TOTAL);

    const articleLocs = collected.urls.filter((u) => u.loc.includes('/tin-tuc/bai-viet/'));
    assert.equal(articleLocs.length, TOTAL - noindexCount);
    assert.ok(articleLocs.every((u) => !/\/IFL[A-Za-z0-9]{5,17}(\/|$)/i.test(u.loc)));
    assert.ok(articleLocs.every((u) => !/[?&]ref=/.test(u.loc)));

    const xmlOut = await buildSitemapXml({
      listArticleCandidatesPage,
      foundationEffectiveByPageKey: { community: { site_name: 'iFlux' } },
      skipFoundationFetch: true
    });
    assert.equal(xmlOut.mode, 'urlset');
    assert.equal(xmlOut.stats.totalUrls, 9 + (TOTAL - noindexCount));
    assert.ok(xmlOut.stats.totalUrls > 5000);
  });

  it('emits sitemap index when maxUrlsPerFile soft cap exceeded', async () => {
    const candidates = [];
    for (let i = 0; i < 20; i++) {
      candidates.push({
        slug: 'chunk-' + i,
        updated_at: '2026-01-01T00:00:00.000Z',
        seo: {},
        status: 'published'
      });
    }
    async function listArticleCandidatesPage({ limit, offset }) {
      return candidates.slice(offset, offset + limit);
    }
    const out = await buildSitemapXml({
      listArticleCandidatesPage,
      foundationEffectiveByPageKey: { community: {} },
      skipFoundationFetch: true,
      maxUrlsPerFile: 10
    });
    assert.equal(out.mode, 'index');
    assert.ok(out.chunks.length >= 2);
    assert.ok(out.body.indexOf('<sitemapindex') >= 0);
    assert.ok(out.body.indexOf('/sitemap-1.xml') >= 0);
  });
});
