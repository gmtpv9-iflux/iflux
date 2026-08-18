'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveEntitySeo,
  filterEditorialOverrides,
  TITLE_TEMPLATES
} = require('../../src/modules/seo-platform/entity-templates');
const { buildSeoContract } = require('../../src/modules/seo-platform/seo-contract');

describe('P3 entity templates / field ownership', () => {
  it('applies article title template when editor SEO empty', () => {
    const r = resolveEntitySeo({
      entityType: 'article',
      entity: { title: 'Giá thép tăng mạnh', excerpt: 'Tóm tắt ngắn về thị trường thép.' },
      foundationEffective: { site_name: 'iFlux', description: 'Mô tả site' }
    });
    assert.equal(r.mode, 'automatic');
    assert.equal(r.title, 'Giá thép tăng mạnh | Cộng đồng iFlux');
    assert.equal(r.fields.title.source, 'entity_template');
    assert.equal(r.description, 'Tóm tắt ngắn về thị trường thép.');
    assert.equal(r.fields.description.source, 'entity_excerpt');
  });

  it('treats seo.title identical to entity.title as auto-fill not override', () => {
    const r = resolveEntitySeo({
      entityType: 'article',
      entity: {
        title: 'Tin nóng',
        excerpt: 'Đoạn trích',
        seo: { title: 'Tin nóng', description: 'Đoạn trích' }
      }
    });
    assert.equal(r.fields.title.source, 'entity_template');
    assert.equal(r.title, 'Tin nóng | Cộng đồng iFlux');
    assert.equal(r.fields.description.source, 'entity_excerpt');
  });

  it('honors distinct editorial SEO title as override', () => {
    const r = resolveEntitySeo({
      entityType: 'article',
      entity: {
        title: 'Tin nóng',
        excerpt: 'Đoạn trích',
        seo: { title: 'SEO riêng cho Google', description: 'Mô tả SEO riêng' }
      }
    });
    assert.equal(r.mode, 'entity_override');
    assert.equal(r.title, 'SEO riêng cho Google');
    assert.equal(r.description, 'Mô tả SEO riêng');
  });

  it('applies stock / sector templates', () => {
    assert.equal(
      resolveEntitySeo({
        entityType: 'stock',
        entity: { name: 'Vietcombank', ticker: 'VCB' }
      }).title,
      'Vietcombank (VCB) | iFlux'
    );
    assert.equal(
      resolveEntitySeo({
        entityType: 'sector',
        entity: { name: 'Ngân hàng' }
      }).title,
      'Ngân hàng | Phân tích ngành | iFlux'
    );
    assert.ok(TITLE_TEMPLATES.ecosystem);
  });

  it('rejects system-only editorial overrides', () => {
    const f = filterEditorialOverrides({
      title: 'OK',
      canonical: 'https://evil.example/x',
      robots: 'index,follow',
      sitemapEligible: true
    });
    assert.equal(f.safe.title, 'OK');
    assert.equal(f.safe.canonical, undefined);
    assert.equal(f.rejected.length, 3);
  });

  it('Contract uses template when entity provided without SEO fill', () => {
    const c = buildSeoContract({
      foundationEffective: { site_name: 'iFlux', description: 'Global desc' },
      pageKey: 'community',
      entityType: 'article',
      path: '/cong-dong/bai-viet/gia-thep',
      httpStatus: 200,
      entity: { title: 'Giá thép', excerpt: '' },
      overrides: {
        cleanPath: '/cong-dong/bai-viet/gia-thep',
        canonical: 'https://iflux.vn/cong-dong/bai-viet/gia-thep',
        ogType: 'article'
      }
    });
    assert.equal(c.document.title, 'Giá thép | Cộng đồng iFlux');
    assert.equal(c.document.documentTitle, 'Giá thép | Cộng đồng iFlux');
    assert.equal(c.document.description, 'Giá thép trên iFlux.');
    assert.equal(c.trace.mode, 'automatic');
    assert.ok(c.templates);
    assert.equal(c.templates.fields.title.source, 'entity_template');
  });

  it('Contract ignores editorial canonical override (system_only)', () => {
    const c = buildSeoContract({
      foundationEffective: { title: 'Hub' },
      pageKey: 'market',
      path: '/thi-truong',
      httpStatus: 200,
      manualOverride: {
        title: 'Tiêu đề tay',
        canonical: 'https://evil.example/hijack'
      }
    });
    assert.equal(c.document.title, 'Tiêu đề tay');
    assert.ok(String(c.identity.canonicalUrl).endsWith('/thi-truong'));
    assert.ok(c.ownership.rejectedOverrides.some(function (r) {
      return r.field === 'canonical';
    }));
  });
});
