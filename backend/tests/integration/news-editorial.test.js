'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const db = require('../../src/core/database/connection');
const newsService = require('../../src/modules/news/news.service');
newsService.ensureSeeded = async () => {}; // Không seed nội dung mẫu vào DB kiểm thử.
const articles = require('../../src/modules/news/news-articles.service');
const feed = require('../../src/modules/news/news-feed.service');
const events = require('../../src/modules/news/news-events.service');
const comparisons = require('../../src/modules/market/market-comparisons.service');
const seo = require('../../src/modules/seo-platform/seo-platform.service');
const { isContractSitemapEligible } = require('../../src/modules/seo-platform/seo-contract');
const bus = require('../../src/core/events/bus');

describe('RSS → editorial article, related pagination and verified widgets (PostgreSQL)', { skip: !process.env.NEWS_TEST_DATABASE_URL }, () => {
  const schema = 'news_editorial_test_' + process.pid;
  const category = randomUUID(), otherCategory = randomUUID(), topic = randomUUID(), story = randomUUID(), pendingStory = randomUUID();
  const actor = { id: 'editor-test', name: 'Biên tập iFlux' };
  let caseId;
  async function post(id, payload, status = 'published') {
    await db.query(`INSERT INTO news_posts (id, status, content_type, payload, created_at, updated_at)
      VALUES ($1,$2,'article',$3::jsonb,NOW(),NOW())`, [id, status, JSON.stringify({ id, slug: id, title: id, category_id: category, published_at: '2026-10-13T03:00:00Z', ...payload })]);
  }
  before(async () => {
    const url = new URL(process.env.NEWS_TEST_DATABASE_URL);
    url.searchParams.set('options', '-c search_path=' + schema);
    db.initPool({ DATABASE_URL: url.toString(), APP_ENV: 'local' });
    await db.query(`CREATE SCHEMA ${schema}`);
    await db.query(`CREATE TABLE sectors(id INT PRIMARY KEY, code TEXT, slug TEXT, name_vi TEXT);
      CREATE TABLE ecosystems(id INT PRIMARY KEY, code TEXT, slug TEXT, name_vi TEXT);
      CREATE TABLE stocks(ticker VARCHAR(10) PRIMARY KEY, name TEXT, sector_id INT REFERENCES sectors(id), ecosystem_id INT, market_cap NUMERIC, shares_outstanding NUMERIC, updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE market_sot_audit(id UUID DEFAULT gen_random_uuid(), entity TEXT, entity_key TEXT, field_key TEXT, to_value TEXT, source_code TEXT, result TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE topics(id UUID PRIMARY KEY, confirmed_at TIMESTAMPTZ);
      CREATE TABLE stories(id UUID PRIMARY KEY, topic_id UUID REFERENCES topics(id) ON DELETE CASCADE, title TEXT, slug TEXT, stock_tags TEXT[], status TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE news_categories(id UUID PRIMARY KEY, name TEXT, slug TEXT, parent_id UUID);
      CREATE TABLE ai_prompts(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT UNIQUE, name TEXT, body TEXT, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE news_posts(id TEXT PRIMARY KEY, user_id UUID, content_type TEXT, status TEXT, payload JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ);`);
    for (const name of ['081_news_event_timeline.sql','082_news_ai_jobs.sql','083_news_editorial_prompt.sql','084_news_editorial_v2.sql']) {
      await db.query(fs.readFileSync(path.join(__dirname, '../../migrations', name), 'utf8'));
    }
    await db.query("INSERT INTO sectors VALUES (1,'BANK','ngan-hang','Ngân hàng'),(2,'RETAIL','ban-le','Bán lẻ'); INSERT INTO ecosystems VALUES (1,'ECO','he-sinh-thai-a','Hệ A'); INSERT INTO stocks(ticker,name,sector_id,ecosystem_id,market_cap,shares_outstanding) VALUES ('AAA','Công ty A',1,1,1000,100),('BBB','Công ty B',1,1,2000,200),('CCC','Công ty C',2,1,3000,300)");
    await db.query("INSERT INTO news_categories VALUES ($1,'Doanh nghiệp','doanh-nghiep',NULL)", [category]);
    await db.query("INSERT INTO news_categories VALUES ($1,'Khác','khac',NULL)", [otherCategory]);
    await db.query('INSERT INTO topics VALUES ($1,NOW()),($2,NULL)', [topic, pendingStory]);
    await db.query("INSERT INTO stories (id,topic_id,title,slug,stock_tags,status) VALUES ($1,$2,'Chủ đề đã hình thành','topic-a',ARRAY['AAA'],'active'),($3,$3,'Chưa hình thành','pending',ARRAY['AAA'],'active')", [story, topic, pendingStory]);
    await post('seed', { story_id: story, tickers: ['AAA', 'BBB'] }, 'published_rss');
    await post('entity-and-topic', { story_id: story, tickers: ['BBB'] });
    await post('topic-only', { story_id: story, tickers: ['CCC'] });
    await post('category-only', { tickers: ['CCC'] });
    await post('unrelated', { category_id: randomUUID(), tickers: ['CCC'] });
    await post('private-draft', { story_id: story, tickers: ['AAA'] }, 'draft');
  });
  after(async () => { await db.query(`DROP SCHEMA ${schema} CASCADE`); await db.closePool(); });

  it('RSS remains readable but cannot override noindex; only official article is sitemap-eligible', async () => {
    const rss = await articles.getArticle('seed');
    assert.equal(rss.status, 'published_rss');
    const noindex = await seo.resolveArticleContract({ ...rss, seo: { robots: 'index,follow' } });
    assert.match(noindex.indexability.robots, /noindex/);
    assert.equal(isContractSitemapEligible(noindex), false);
    assert.match((await seo.resolveContract({ path: '/tin-tuc/bai-viet/seed' })).indexability.robots, /noindex/);
    assert.match((await seo.resolveContract({ path: '/tin-tuc/bai-viet/private-draft' })).indexability.robots, /noindex/);
    const official = await seo.resolveArticleContract({ ...rss, status: 'published', seo: {} });
    assert.equal(isContractSitemapEligible(official), true);
    const intentional = await seo.resolveArticleContract({ ...rss, status: 'published', seo: { robots: 'noindex' } });
    assert.equal(isContractSitemapEligible(intentional), false);
    const candidates = await seo.listPublishedArticleCandidatesPage({});
    assert.ok(!candidates.some((p) => p.slug === 'seed' || p.slug === 'private-draft'));
  });

  it('RSS stays noindex; official publication establishes one stable URL and activation date', async () => {
    let published = 0;
    const stop = bus.subscribe(bus.EVENTS.NEWS_POST_PUBLISHED, () => { published++; });
    const edited = await articles.updateArticle('seed', { title: 'Tiêu đề hoàn toàn mới' }, actor);
    assert.equal(edited.slug, 'seed'); assert.equal(edited.status, 'published_rss');
    const rssTime = edited.published_at;
    const official = await articles.updateArticle('seed', { status: 'published', title: 'Tiêu đề chính thức' }, actor);
    assert.equal(official.slug, 'tieu-de-chinh-thuc');
    assert.deepEqual(official.former_slugs, ['seed']);
    assert.notEqual(official.published_at, rssTime);
    assert.equal(official.official_published_at, official.published_at);
    assert.ok(Date.parse(official.published_at) > Date.parse(rssTime));
    assert.equal((await articles.getArticle('seed')).slug, official.slug);
    assert.equal(published, 1);
    const stablePublishedAt = official.published_at;
    await articles.updateArticle(official.slug, { title: 'Đính chính tiêu đề' }, actor);
    const corrected = await articles.getArticle(official.slug);
    assert.equal(corrected.slug, official.slug);
    assert.equal(corrected.published_at, stablePublishedAt);
    assert.equal(published, 1);
    const unpublished = await articles.updateArticle(official.slug, { status: 'draft' }, actor);
    assert.equal(unpublished.official_published_at, stablePublishedAt);
    const republished = await articles.updateArticle(official.slug, { status: 'published', title: 'Tiêu đề đăng lại' }, actor);
    assert.equal(republished.slug, official.slug);
    assert.equal(republished.published_at, stablePublishedAt);
    assert.equal(published, 2); stop();
  });

  it('promoted RSS keeps source date separately and synchronizes every description field from excerpt', async () => {
    const sourceDate = '2026-10-05T15:42:00.000Z';
    await post('excerpt-sync', {
      category_id: otherCategory,
      published_at: sourceDate,
      source_published_at: sourceDate,
      excerpt: 'Mô tả RSS cũ',
      seo: { description: 'Mô tả nguồn cũ', meta_description: 'Mô tả nguồn cũ', og_description: 'Mô tả nguồn cũ' }
    }, 'published_rss');
    const official = await articles.updateArticle('excerpt-sync', {
      status: 'published',
      title: 'Bài biên tập chính thức',
      excerpt: 'Mô tả ngắn do iFlux biên tập.',
      seo: { description: 'Mô tả RSS cũ', meta_description: 'Mô tả RSS cũ', og_description: 'Mô tả RSS cũ' }
    }, actor);
    assert.equal(official.source_published_at, sourceDate);
    assert.notEqual(official.published_at, sourceDate);
    assert.equal(official.seo.description, official.excerpt);
    assert.equal(official.seo.meta_description, official.excerpt);
    assert.equal(official.seo.og_description, official.excerpt);
  });

  it('rejects unformed or invented Story IDs; no Topic is required for an article', async () => {
    await assert.rejects(articles.updateArticle('seed', { story_id: pendingStory }, actor), /đã hình thành/);
    await assert.rejects(articles.updateArticle('seed', { story_id: randomUUID() }, actor), /đã hình thành/);
    const result = await articles.updateArticle('category-only', { story_id: null }, actor);
    assert.equal(result.story_id, null);
  });

  it('each related group is relevant, excludes seed/drafts and previews do not duplicate earlier groups', async () => {
    const entity = await feed.listFeed({ related_to: 'seed', related_group: 'entity', related_preview: true });
    assert.deepEqual(entity.cards.map((c) => c.id), ['entity-and-topic']);
    const sameTopic = await feed.listFeed({ related_to: 'seed', related_group: 'topic', related_preview: true });
    assert.deepEqual(sameTopic.cards.map((c) => c.id), ['topic-only']);
    const sameCategory = await feed.listFeed({ related_to: 'seed', related_group: 'category', related_preview: true });
    assert.deepEqual(sameCategory.cards.map((c) => c.id), ['category-only']);
    const allTopic = await feed.listFeed({ related_to: 'seed', related_group: 'topic' });
    assert.equal(allTopic.cards.length, 2);
    await assert.rejects(feed.listFeed({ related_to: 'seed', related_group: 'invented' }), /không hợp lệ/);
  });

  it('HTTP routes forbid User publishing and hidden articles, while RSS is visible with noindex', async () => {
    const express = require('express');
    const { createNewsRouter } = require('../../src/modules/news/news.routes');
    const app = express(); app.use(express.json());
    app.use('/news', createNewsRouter({ config:{ADMIN_API_KEY:'fixture-key-only'}, auth:{ optionalAuth:(req,res,next)=>next(), authenticate:(req,res,next)=>{req.user={id:randomUUID()};next();} } }));
    app.use((err,req,res,next)=>res.status(err.statusCode || 500).json({ error:err.message }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    const url = 'http://127.0.0.1:' + server.address().port + '/news';
    try {
      await post('rss-http', {}, 'published_rss');
      const rss = await fetch(url + '/articles/rss-http'); assert.equal(rss.status,200); assert.match(rss.headers.get('x-robots-tag'),/noindex/);
      assert.equal((await fetch(url + '/articles/private-draft')).status,404);
      assert.equal((await fetch(url + '/articles?status=draft')).status,400);
      assert.equal((await fetch(url + '/events')).status,400);
      const forbidden = await fetch(url + '/posts', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Không được tự xuất bản',status:'published',category_id:category}) });
      assert.equal(forbidden.status,400);
      const pending = await fetch(url + '/posts', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Chờ biên tập',status:'pending',body_html:'<p>Chờ duyệt</p><script>alert(1)</script>'})});
      const result = (await pending.json()).data.post;
      assert.equal(result.status,'pending'); assert.equal(result.published_at,null); assert.doesNotMatch(result.body_html,/<script/);
      const metrics = await fetch(url + '/admin/comparison-metrics',{headers:{'x-admin-key':'fixture-key-only'}});
      assert.equal(metrics.status,200); assert.ok((await metrics.json()).data.metrics.some(m=>m.key==='market_cap'&&m.available));
      assert.equal((await fetch(url + '/admin/ai/jobs')).status,403);
      const jobList=await fetch(url+'/admin/ai/jobs',{headers:{'x-admin-key':'fixture-key-only'}});
      assert.equal(jobList.status,200);assert.deepEqual((await jobList.json()).data.jobs,[]);
      const disabled=await fetch(url+'/admin/ai/jobs',{method:'POST',headers:{'x-admin-key':'fixture-key-only','Content-Type':'application/json'},body:JSON.stringify({source_post_id:'rss-http'})});
      assert.equal(disabled.status,400);
    } finally { await new Promise(resolve=>server.close(resolve)); }
  });

  it('editing preserves regenerated cover variants and imported body image IDs', async () => {
    await post('media-preserve', { cover:{url:'/media/cover.webp',alt:'Ảnh đã nhập',variants:{cover_card:'/media/card.webp',cover_detail:'/media/detail.webp'}},body_html:'<h2>Ảnh</h2><p><img src="/media/body.webp" alt="Thân bài" data-media-asset-id="imported-id"></p>' }, 'published_rss');
    const updated = await articles.updateArticle('media-preserve',{title:'Sửa tiêu đề sau khi nhập ảnh'},actor);
    assert.equal(updated.cover.variants.cover_card,'/media/card.webp');
    assert.equal(updated.cover.variants.cover_detail,'/media/detail.webp');
    assert.match(updated.body_html,/data-media-asset-id="imported-id"/);
    assert.match(updated.body_html,/src="\/media\/body.webp"/);
    assert.equal(updated.slug,'media-preserve');
  });

  it('date cursor handles tied timestamps and local-day boundaries without duplicates or gaps', async () => {
    await post('date-a', { published_at: '2026-10-12T17:30:00Z', category_id: 'date-test', tickers: [] });
    await post('date-b', { published_at: '2026-10-12T17:30:00Z', category_id: 'date-test', tickers: [] });
    await post('date-c', { published_at: '2026-10-12T16:30:00Z', category_id: 'date-test', tickers: [] });
    let cursor = null; const seen = [], days = [];
    do {
      const out = await feed.listFeed({ category_id: 'date-test', group_by: 'day', limit: 1, cursor });
      seen.push(...out.cards.map((c) => c.id)); days.push(out.section_date); cursor = out.next_cursor;
    } while (cursor);
    assert.deepEqual(seen, ['date-b', 'date-a', 'date-c']);
    assert.deepEqual(days, ['2026-10-13', '2026-10-13', '2026-10-12']);
    await assert.rejects(feed.listFeed({ cursor: 'bad-cursor' }), /không hợp lệ/);
    const out = await feed.listFeed({ category_id: 'date-test', group_by: 'day', limit: 10 });
    assert.equal(out.cards.length, 2); assert.equal(out.has_more, true);
  });

  it('creates sourced cases/milestones, preserves null/0, retries once and rejects conflicting facts', async () => {
    const milestone = { title: 'Đăng ký giao dịch', summary: 'Theo thông báo đăng ký', status: 'planned', announced_on: null, occurred_on: null, effective_on: null,
      evidence: [{ url: 'https://cafef.vn/disclosure', title: 'Thông báo đăng ký giao dịch', label: 'Thông báo đăng ký giao dịch', quote: 'Đăng ký 100; số thực hiện chưa có' }],
      metrics: [{ subject: 'Người đăng ký', indicator: 'registered', value: 100, unit: 'cổ phiếu', period: null, basis: 'planned' },
        { subject: 'Người đăng ký', indicator: 'executed', value: null, unit: 'cổ phiếu', period: null, basis: 'actual' }] };
    const data = { request_id: randomUUID(), title: 'Đợt giao dịch A', event_group: 4, subject_name: 'Người đăng ký', tickers: ['AAA'], story_id: story, milestone };
    const [first, retry] = await Promise.all([events.createCase(data, actor), events.createCase(data, actor)]);
    assert.equal(first.id, retry.id); caseId = first.id;
    const before = await events.timelineForStock('AAA'); assert.equal(before.length, 0);
    await articles.updateArticle('seed', { event_case_ids: [caseId] }, actor);
    await events.addMilestone(caseId, { ...milestone, title: 'Báo cáo kết quả', status: 'reported_result', announced_on: '2026-10-13', occurred_on: '2026-10-12',
      metrics: [{ ...milestone.metrics[1], value: 0 }] }, actor);
    const timeline = await events.timelineForStock('AAA');
    assert.equal(timeline.length, 2); assert.equal(timeline[0].metrics[0].value, 0); assert.equal(timeline[0].occurred_on, '2026-10-12');
    assert.equal(timeline[1].metrics[1].value, null); assert.equal(timeline[1].announced_on, null);
    await assert.rejects(events.addMilestone(caseId, { ...milestone, summary: 'Nội dung mâu thuẫn' }, actor), /dữ kiện khác/);
    assert.equal((await events.timelineForArticle({ status: 'published_rss', event_case_ids: [caseId] })).length, 0);
    await db.query('DELETE FROM topics WHERE id = $1', [topic]);
    assert.equal((await events.timelineForStock('AAA')).length, 2);
    assert.equal((await db.query('SELECT story_id FROM news_event_cases WHERE id=$1', [caseId])).rows[0].story_id, null);
  });

  it('comparison selects one related scope and reads canonical company data, without an extra fact store', async () => {
    const spec = { metric: 'market_cap', scope: { type: 'sector', id: '1' }, tickers: ['AAA', 'BBB'], purpose: 'Đối chiếu quy mô các doanh nghiệp được nhắc đến' };
    const input = { status: 'published', tickers: ['AAA'], comparison: spec };
    const first = await comparisons.buildComparison(input);
    assert.equal(first.data.rows.length, 2); assert.equal(first.data.rows[0].value, 1000); assert.equal(first.data.chart, true);
    await db.query("UPDATE stocks SET market_cap=NULL WHERE ticker='BBB'");
    assert.equal((await comparisons.buildComparison(input)).data, null);
    await db.query("UPDATE stocks SET market_cap=0 WHERE ticker='BBB'");
    assert.equal((await comparisons.buildComparison(input)).data.rows[1].value, 0);
    const ecosystem = await comparisons.buildComparison({ ...input, comparison: { ...spec, scope: { type: 'ecosystem', id: '1' }, tickers: ['AAA', 'CCC'] } });
    assert.equal(ecosystem.data.scope.type, 'ecosystem');
    await assert.rejects(comparisons.buildComparison({ ...input, comparison: { ...spec, tickers: ['AAA','CCC'] } }), /không thuộc/);
    await assert.rejects(comparisons.buildComparison({ ...input, comparison: { ...spec, scope: { type: 'sector', id: '2' }, tickers: ['CCC','AAA'] } }), /liên quan/);
    assert.equal((await comparisons.buildComparison({ ...input, comparison: { ...spec, metric: 'pe' } })).data, null);
    assert.equal(comparisons.comparisonSchema.safeParse({ ...spec, values: [100,200] }).success, false);
    assert.equal(comparisons.comparisonSchema.safeParse({ ...spec, metric: 'interest_rate' }).success, false);
    assert.equal(comparisons.comparisonSchema.safeParse({ ...spec, tickers: ['AAA','AAA'] }).success, false);
    const newTopic = randomUUID(), newStory = randomUUID();
    await db.query('INSERT INTO topics VALUES($1,NOW())', [newTopic]);
    await db.query("INSERT INTO stories(id,topic_id,title,stock_tags,status) VALUES($1,$2,'Câu chuyện so sánh',ARRAY['AAA','BBB'],'active')", [newStory,newTopic]);
    const storyResult = await comparisons.buildComparison({ ...input, story_id: newStory, comparison: { ...spec, scope: { type: 'story', id: newStory } } });
    assert.equal(storyResult.data.scope.type, 'story');
    const article = await articles.createArticle({ title: 'Bài so sánh', category_id: category, status: 'published', tickers: ['AAA'], comparison: spec }, actor);
    assert.equal(article.comparison_snapshot.rows[0].value, 1000);
    await db.query("UPDATE stocks SET market_cap=9999 WHERE ticker='AAA'");
    const changedTitle = await articles.updateArticle(article.id, { title: 'Tiêu đề mới' }, actor);
    assert.equal(changedTitle.comparison_snapshot.rows[0].value, 1000);
    assert.equal(changedTitle.slug, article.slug);
  });

  it('AI two-step jobs are idempotent, checkpoint retries and keep RSS unchanged and unpublished', async () => {
    const jobs = require('../../src/modules/news/news-ai-jobs.service');
    const config = { NEWS_AI_ENABLED:true,NEWS_AI_MODEL:'gpt-5.4',NEWS_AI_MAX_ATTEMPTS:3 };
    assert.ok((await db.query("SELECT body FROM ai_prompts WHERE code='news-editorial-v2' AND status='active'")).rows[0].body.length > 1000);
    await db.query("UPDATE ai_prompts SET body='Prompt test',status='active' WHERE code='news-editorial-v2'");
    await post('ai-source',{title:'Công ty A đăng ký giao dịch',body_html:'<p>Công ty A đăng ký bán 100 cổ phiếu.</p>',source_id:'fixture',source_name:'Nguồn thử',external_url:'https://example.org/ai-source',tickers:['FAKE']},'published_rss');
    assert.equal(await jobs.enqueueSource('ai-source',{NEWS_AI_ENABLED:false}),null);
    const queued = await Promise.all([jobs.enqueueSource('ai-source',config),jobs.enqueueSource('ai-source',config)]);
    assert.equal(queued[0].id,queued[1].id);
    assert.equal((await jobs.processOne(config)).status,'disabled'); // Không có key và không inject provider.
    let extractCalls=0,composeCalls=0,failOnce=true;
    const provider={run:async(stage,input)=>{
      if(stage==='extract') {
        extractCalls++;
        assert.ok(input.entity_candidates.some((e)=>e.ticker==='AAA'));
        assert.ok(!input.entity_candidates.some((e)=>e.ticker==='FAKE'));
        assert.equal(input.allowed_images.length,0);
        return {value:{facts:[{id:'f1',statement:'Đăng ký bán 100 cổ phiếu',metric:{subject:'Công ty A',indicator:'registered',value:100,unit:'cổ phiếu',period:null,basis:'planned'},evidence:[{source_id:input.source.id,quote:'Công ty A đăng ký bán 100 cổ phiếu.'}]}],entities:[{name:'Công ty A',ticker:'AAA',role:'subject',evidence:{source_id:input.source.id,quote:'Công ty A đăng ký bán 100 cổ phiếu.'},uncertainty:null}],events:[],story_candidates:[],comparison:null,context_requests:[],issues:[]},response_id:'extract-fixture',model:'gpt-5.4',usage:{input_tokens:100,output_tokens:50}};
      }
      composeCalls++;
      assert.equal(input.source.text,undefined); // compose chỉ nhận facts được đối chiếu, không nhận lại toàn nguồn.
      if(failOnce){failOnce=false;throw Object.assign(Error('fixture transport failure'),{code:'AI_HTTP_429',retryable:true});}
      return {value:{title:'Công ty A đăng ký bán cổ phiếu',excerpt:'Theo thông báo đăng ký',lead:'Công ty A đăng ký bán 100 cổ phiếu.',lead_fact_ids:['f1'],sections:[{h2:'Công ty A công bố số đăng ký',paragraphs:['Số đăng ký là 100 cổ phiếu; chưa có kết quả thực hiện.'],fact_ids:['f1'],event_refs:[],images:[]}],tickers:['AAA'],story_id:null,timeline_case_ids:[],comparison_metric:null,iflux_insight:null,insight_fact_ids:[],insight_omission_reason:'Thiếu dữ liệu bổ sung',seo:{title:'Công ty A đăng ký giao dịch',description:'Thông tin đăng ký, chưa phải kết quả thực hiện'},warnings:[]},response_id:'compose-fixture',model:'gpt-5.4',usage:{input_tokens:150,output_tokens:100}};
    }};
    const first=await jobs.processOne(config,provider);assert.equal(first.status,'queued');
    assert.equal((await jobs.getJob(first.id)).extraction.facts[0].metric.value,100);
    await db.query('UPDATE news_ai_jobs SET next_attempt_at=NOW() WHERE id=$1',[first.id]);
    const [next,other]=await Promise.all([jobs.processOne(config,provider),jobs.processOne(config,provider)]);
    assert.deepEqual([next.status,other.status].sort(),['idle','needs_review']);
    const done=await jobs.getJob(first.id);assert.equal(extractCalls,1);assert.equal(composeCalls,2);
    assert.equal(done.attempts,2);assert.equal(done.calls.length,2);
    assert.ok(done.review_reasons.includes('SEMANTIC_REVIEW_REQUIRED'));
    assert.equal(done.result.article_input.tickers[0],'AAA');assert.match(done.result.article_input.body_html,/<h2 id="ifx-section-1">/);assert.equal(done.result.article_input.section_manifest[0].section_id,'ifx-section-1');
    assert.equal(done.prompt_version,'news-editorial-v2');assert.equal(done.schema_version,'news-ai-v2');
    const promoted = await articles.updateArticle('ai-source',{ body_html:done.result.article_input.body_html,section_manifest:done.result.article_input.section_manifest },actor);
    assert.equal(promoted.section_manifest[0].section_id,'ifx-section-1');
    assert.match(promoted.body_html,/<h2 id="ifx-section-1">/);
    assert.equal(done.prompt_body,undefined);
    const source=await articles.getArticle('ai-source');assert.equal(source.status,'published_rss');assert.equal(source.title,'Công ty A đăng ký giao dịch');
    assert.equal((await jobs.processOne(config,provider)).status,'idle');
    assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM news_ai_jobs WHERE source_post_id='ai-source'")).rows[0].n,1);
    assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM news_event_cases')).rows[0].n,1);
    await assert.rejects(jobs.retryJob(done.id),/failed/);
    // Lỗi/schema thật không rò message; hàng chờ có thể retry bởi Admin.
    await post('ai-error',{title:'Công ty A',body_html:'<p>Công ty A thông báo.</p>',source_id:'fixture',external_url:'https://example.org/ai-error'},'published_rss');
    const queuedError=await jobs.enqueueSource('ai-error',config);
    await jobs.processOne(config,{run:async()=>{throw Error('Bearer not-for-logs');}});
    const failed=await jobs.getJob(queuedError.id);assert.equal(failed.status,'failed');assert.equal(failed.last_error,'AI_VALIDATION_OR_CONTEXT_ERROR');
    assert.equal((await jobs.retryJob(failed.id)).status,'queued');
    await jobs.processOne(config,{run:async()=>{throw Error('fixture permanent failure');}});
  });
});
