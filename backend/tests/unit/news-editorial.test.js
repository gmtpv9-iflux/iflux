'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { sanitizeArticleHtml } = require('../../src/modules/news/news-articles.service');

it('sanitizes article HTML without losing image import IDs, alt, headings, safe links and tables', () => {
  const html = sanitizeArticleHtml('<h2>Nội dung</h2><p><a href="/co-phieu/AAA">AAA</a><a href="java&#x73;cript:alert(1)">x</a></p><figure><img src="/media/news/a.webp" alt="Ảnh" data-media-asset-id="asset-a" onerror="alert(1)"><figcaption>Nguồn ảnh</figcaption></figure><table><tbody><tr><td>0</td></tr></tbody></table><script>alert(1)</script><iframe src="https://example.org"></iframe>');
  assert.match(html, /<h2>Nội dung<\/h2>/); assert.match(html, /href="\/co-phieu\/AAA"/);
  assert.match(html, /data-media-asset-id="asset-a"/); assert.match(html, /alt="Ảnh"/);
  assert.match(html, /<td>0<\/td>/); assert.match(html, /<figcaption>Nguồn ảnh/);
  assert.doesNotMatch(html, /onerror|javascript|<script|<iframe/);
  assert.doesNotMatch(sanitizeArticleHtml('<img src="//evil.org/x"><img src="data:image/svg+xml,x">'), /<img/);
});

it('templates never replace empty public data with demo; missing and negative values remain distinct', () => {
  const context = vm.createContext({ console, Intl, Date });
  for (const file of ['00_widget/widget.js','03_diverging-bars/diverging-bars.js','17_event-timeline/event-timeline.js','18_stock-comparison/stock-comparison.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../../design_system/05_templates', file), 'utf8'), context);
  }
  const T = context.IfxTemplates;
  const empty = T.get('TMP-EVENT-TIMELINE').render(T.demo('TMP-EVENT-TIMELINE'), { data: [] });
  assert.doesNotMatch(empty, /minh họa|Đã công bố|Công bố kế hoạch/);
  const rows = [{ ticker:'AAA', value:0 }, { ticker:'BBB', value:-4 }, { ticker:'CCC', value:null }];
  const html = T.get('TMP-STOCK-COMPARISON').render([], { data: { chart:true, rows, scope:{name:'Ngành'}, unit:'VND', as_of:'2026-10-13' } });
  assert.match(html, /is-neg/); assert.match(html, />0<\/td>/); assert.match(html, />—<\/td>/);
  assert.doesNotMatch(html, /Nguồn minh họa/);
});

it('entity resolver rejects a shorter company name inside another company while retaining independent mentions', async () => {
  const master = require('../../src/modules/market/market-master.service');
  const oldStocks = master.listStocks, oldEcos = master.listEcosystems;
  master.listStocks = async () => [
    { ticker:'AAA',name:'Công ty Cổ phần Alpha',short_name:'Alpha' },
    { ticker:'BBB',name:'Công ty Cổ phần Alpha Miền Nam',short_name:'Alpha Miền Nam' }
  ]; master.listEcosystems = async () => [];
  const resolver = require('../../src/modules/news/news-entity-resolve.service');
  resolver.clearMasterCache();
  try {
    assert.deepEqual((await resolver.resolveArticleEntities({ title:'Công ty Cổ phần Alpha Miền Nam công bố kết quả' })).tickers, ['BBB']);
    const both = (await resolver.resolveArticleEntities({ title:'Công ty Cổ phần Alpha Miền Nam và Công ty Cổ phần Alpha công bố kết quả' })).tickers;
    assert.deepEqual(new Set(both), new Set(['AAA','BBB']));
  } finally { master.listStocks = oldStocks; master.listEcosystems = oldEcos; resolver.clearMasterCache(); }
});

it('entity resolver falls back to explicit ticker labels in title/lead without matching ordinary words', async () => {
  const master = require('../../src/modules/market/market-master.service');
  const oldStocks = master.listStocks, oldEcos = master.listEcosystems;
  master.listStocks = async () => [
    { ticker:'PNJ',name:'Công ty Cổ phần Vàng bạc đá quý Phú Nhuận',short_name:null },
    { ticker:'TIN',name:'Công ty Cổ phần TIN',short_name:null },
    { ticker:'VCI',name:'Công ty Cổ phần Chứng khoán Vietcap',short_name:'Vietcap' }
  ]; master.listEcosystems = async () => [];
  const resolver = require('../../src/modules/news/news-entity-resolve.service');
  resolver.clearMasterCache();
  try {
    const pnj = await resolver.resolveArticleEntities({
      title:'Cổ phiếu PNJ bất ngờ tăng cận trần',
      body_html:'Nhà đầu tư so sánh diễn biến với VCI.'
    });
    assert.deepEqual(pnj.tickers, ['PNJ']);
    assert.equal(pnj.entity_occurrences[0].presentation, 'ticker');
    const ordinaryWord = await resolver.resolveArticleEntities({ title:'Tin doanh nghiệp được công bố trong ngày' });
    assert.deepEqual(ordinaryWord.tickers, []);
    const unlabelled = await resolver.resolveArticleEntities({ title:'PNJ tăng trong phiên' });
    assert.deepEqual(unlabelled.tickers, []);
  } finally { master.listStocks = oldStocks; master.listEcosystems = oldEcos; resolver.clearMasterCache(); }
});
