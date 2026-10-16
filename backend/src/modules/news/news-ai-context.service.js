'use strict';

const sanitizeHtml = require('sanitize-html');
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const comparisons = require('../market/market-comparisons.service');
const events = require('./news-events.service');
const { contracts } = require('../ai/news-ai.contract');

function plain(html) { return sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim(); }
function sourceSnapshot(article) {
  const text = plain([article.title, article.excerpt, article.body_html || article.body].filter(Boolean).join('\n'));
  const url = article.external_url || (article.source && article.source.url) || null;
  if (!text || text.length > 120000) throw AppError.badRequest('AI_SOURCE_SIZE', 'Nguồn trống hoặc vượt giới hạn; cần kiểm tra');
  if (!/^https?:\/\//i.test(url || '')) throw AppError.badRequest('AI_SOURCE_URL', 'Bài nguồn cần URL HTTP(S) để truy vết');
  return { id: 'rss:' + article.id, post_id: article.id, title: article.title, text, url,
    source_name: article.source_name || (article.source && article.source.name) || null,
    source_published_at: article.source_published_at || article.published_at || null, category_id: article.category_id || null };
}

function articleSections(bodyHtml) {
  const sections = [];
  const matches = String(bodyHtml || '').matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi);
  for (const match of matches) {
    const attrs = match[1] || '';
    const id = (attrs.match(/\bid=["'](ifx-section-\d+)["']/i) || [])[1] || null;
    const heading = plain(match[2]);
    if (heading) sections.push({ section_id:id,heading });
  }
  return sections;
}

async function buildExtractContext(source) {
  // Candidate retrieval chỉ dùng catalog; không nhận mã của bài RSS cũ làm xác nhận.
  const stocks = (await query(`SELECT ticker, name, to_jsonb(s)->>'short_name' AS short_name,
    to_jsonb(s)->>'english_name' AS english_name, sector_id, ecosystem_id FROM stocks s ORDER BY ticker`)).rows;
  const folded = source.text.toLocaleLowerCase('vi');
  const words = new Set(source.text.match(/\b[A-Z][A-Z0-9]{1,9}\b/g) || []);
  const candidates = stocks.filter((s) => words.has(s.ticker) || [s.name,s.short_name,s.english_name].some((n) => n && n.length >= 3 && folded.includes(n.toLocaleLowerCase('vi'))));
  if (candidates.length > 60) throw AppError.badRequest('AI_TOO_MANY_ENTITIES', 'Quá nhiều ứng viên; cần kiểm tra riêng');
  const tickers = candidates.map((s) => s.ticker);
  const stories = (await query(`SELECT s.id, s.topic_id, s.title, s.stock_tags,
      to_jsonb(s)->>'description' AS description
    FROM stories s JOIN topics t ON t.id=s.topic_id
    WHERE s.status='active' AND t.confirmed_at IS NOT NULL
      AND (s.stock_tags && $1::text[] OR strpos(lower($2),lower(s.title))>0)
    ORDER BY s.created_at DESC, s.id DESC LIMIT 60`, [tickers,source.text])).rows;
  const cases = tickers.length ? (await query(`SELECT id,title,event_group,subject_name,tickers,story_id FROM news_event_cases
    WHERE tickers && $1::text[] ORDER BY created_at DESC,id DESC LIMIT 60`,[tickers])).rows : [];
  const storyIds = stories.map((s) => String(s.id));
  const internalRows = (storyIds.length || tickers.length) ? (await query(`SELECT id,payload FROM news_posts
    WHERE status='published' AND content_type='article'
      AND (payload->>'story_id'=ANY($1::text[]) OR COALESCE(payload->'tickers','[]'::jsonb) ?| $2::text[])
    ORDER BY COALESCE((payload->>'published_at')::timestamptz,created_at) DESC,id DESC LIMIT 40`,[storyIds,tickers])).rows : [];
  const internalArticleSections = internalRows.flatMap((row) => {
    const payload = row.payload || {};
    const slug = String(payload.slug || '').trim();
    if (!slug) return [];
    const base = { article_id:String(row.id),title:String(payload.title || ''),url:'/tin-tuc/bai-viet/' + encodeURIComponent(slug) };
    const sections = articleSections(payload.body_html || payload.body);
    return sections.length ? sections.map((section,index) => ({
      ref:'article:' + row.id + ':' + (section.section_id || ('section-' + (index + 1))),
      ...base,section_id:section.section_id,heading:section.heading,
      href:base.url + (section.section_id ? '#' + section.section_id : '')
    })) : [{ ref:'article:' + row.id,title:base.title,url:base.url,href:base.url,section_id:null,heading:null,...base }];
  });
  const scopes = [];
  for (const type of ['sector','ecosystem']) {
    const table = type === 'sector' ? 'sectors' : 'ecosystems';
    const field = type + '_id';
    const ids = [...new Set(candidates.map((c) => c[field]).filter((v) => v != null).map(String))];
    if (!ids.length) continue;
    const rows = (await query(`SELECT id::text, name_vi AS name FROM ${table} WHERE id::text=ANY($1::text[]) ORDER BY id`,[ids])).rows;
    for (const row of rows) scopes.push({ ...row,type,members: stocks.filter((s) => String(s[field])===row.id).map((s) => s.ticker) });
  }
  stories.forEach((s) => scopes.push({ type:'story',id:s.id,name:s.title,members:s.stock_tags || [] }));
  return { source, entity_candidates: candidates, story_candidates: stories,internal_article_sections:internalArticleSections,
    community_context_policy: 'Chỉ metadata Story từ Topic đã hình thành; không dùng thảo luận làm dữ kiện.',
    case_candidates: cases, comparison_scopes: scopes, supported_metrics: comparisons.metricCatalog().filter((m) => m.available),
    allowed_images: [], image_policy: 'Chưa có projection quyền ảnh đã kiểm chứng. Không chọn ảnh mới; giữ luồng media hiện có khi biên tập.' };
}

function checkExtraction(raw, ctx) {
  const data = contracts.extract.z.parse(raw);
  const reasons = data.issues.map((v) => v.code + ': ' + v.detail);
  const evidenceOk = (e) => e.source_id === ctx.source.id && ctx.source.text.includes(e.quote);
  const candidates = new Map(ctx.entity_candidates.map((s) => [s.ticker,s]));
  const accepted = [];
  for (const e of data.entities) {
    const stock = candidates.get(e.ticker);
    const labels = stock ? [stock.name,stock.short_name,stock.english_name,stock.ticker].filter(Boolean) : [];
    const sameName = (s) => [s.name,s.short_name,s.english_name,s.ticker].filter(Boolean).some((n) => n.toLocaleLowerCase('vi') === e.name.toLocaleLowerCase('vi'));
    const duplicateName = ctx.entity_candidates.filter(sameName).length !== 1;
    if (!stock || e.uncertainty || !evidenceOk(e.evidence) || !labels.some((n) => n.toLocaleLowerCase('vi')===e.name.toLocaleLowerCase('vi')) || duplicateName || !e.evidence.quote.includes(e.name)) {
      reasons.push('ENTITY_REVIEW: ' + e.name); continue;
    }
    accepted.push(e);
  }
  const seen = new Set();
  const facts = data.facts.filter((f) => {
    if (seen.has(f.id) || !f.evidence.length || !f.evidence.every(evidenceOk)) { reasons.push('FACT_EVIDENCE_INVALID: ' + f.id); return false; }
    seen.add(f.id); return true;
  });
  if (!facts.length) reasons.push('NO_SUPPORTED_FACTS');
  const storyIds = new Set(ctx.story_candidates.map((s) => s.id));
  for (const s of data.story_candidates) if (!storyIds.has(s.story_id)) reasons.push('STORY_NOT_IN_CONTEXT');
  if (data.story_candidates.length > 1) reasons.push('STORY_AMBIGUOUS: bài hiện hỗ trợ một Story');
  const subjects = new Set(accepted.filter((e) => e.role==='subject').map((e) => e.ticker));
  const eventRefs = new Set();
  const internalSectionRefs = new Set((ctx.internal_article_sections || []).map((s) => s.ref));
  for (const e of data.events) {
    if (eventRefs.has(e.event_ref)) reasons.push('EVENT_REF_DUPLICATE: ' + e.event_ref);
    eventRefs.add(e.event_ref);
    if (e.internal_section_refs.some((ref) => !internalSectionRefs.has(ref))) reasons.push('EVENT_INTERNAL_SECTION_INVALID: ' + e.event_ref);
    if (!subjects.has(e.subject_ticker) || !e.evidence.length || !e.evidence.every(evidenceOk)) reasons.push('EVENT_SUBJECT_OR_EVIDENCE_INVALID');
    if (e.case_id && !ctx.case_candidates.some((c) => c.id===e.case_id && c.tickers.includes(e.subject_ticker))) reasons.push('EVENT_CASE_INVALID');
    // Các trường chỉ dành cho đề xuất không thuộc schema mốc được ghi.
    const milestone = { title:e.title,summary:e.summary,status:e.status,announced_on:e.announced_on,occurred_on:e.occurred_on,effective_on:e.effective_on,
      evidence:e.evidence.map((v) => ({ url:ctx.source.url,title:ctx.source.title || ctx.source.source_name || 'Bài nguồn',label:ctx.source.title || ctx.source.source_name || 'Bài nguồn',quote:v.quote })),metrics:e.metrics };
    if (!events.milestoneSchema.safeParse(milestone).success) reasons.push('EVENT_FIELDS_INVALID');
  }
  if (data.context_requests.length) reasons.push('CONTEXT_LOOKUP_REQUIRES_REVIEW');
  return { data, facts, entities:accepted, reasons:[...new Set(reasons)] };
}

async function buildComposeContext(checked, ctx) {
  const story_id = checked.data.story_candidates[0]?.story_id || null;
  const tickers = [...new Set(checked.entities.map((e) => e.ticker))];
  let comparison = { data:null,reason:null };
  if (checked.data.comparison) {
    const spec = comparisons.comparisonSchema.parse(checked.data.comparison);
    if (!ctx.supported_metrics.some((m) => m.key===spec.metric)) throw AppError.badRequest('AI_COMPARISON_METRIC_INVALID','Chỉ tiêu chưa được backend hỗ trợ');
    if (!ctx.comparison_scopes.some((s) => s.type===spec.scope.type && s.id===spec.scope.id && spec.tickers.every((t) => s.members.includes(t)))) throw AppError.badRequest('AI_COMPARISON_SCOPE_INVALID','Phạm vi ngoài context');
    comparison = await comparisons.buildComparison({ story_id,tickers,comparison:spec });
  }
  const caseIds = [...new Set(checked.data.events.map((e) => e.case_id).filter(Boolean))];
  await events.validateArticleLinks({ story_id,event_case_ids:caseIds });
  const history = await events.timelineForArticle({ status:'published',event_case_ids:caseIds });
  const allowedInternalRefs = new Set((ctx.internal_article_sections || []).map((s) => s.ref));
  const eventProposals = checked.data.events.map((event) => ({ ...event,internal_section_refs:event.internal_section_refs.filter((ref) => allowedInternalRefs.has(ref)) }));
  return { source: { id:ctx.source.id,url:ctx.source.url,source_name:ctx.source.source_name,source_published_at:ctx.source.source_published_at },
    facts:checked.facts, entities:checked.entities, story_id, event_proposals:eventProposals,internal_article_sections:ctx.internal_article_sections || [],
    timeline:history, timeline_case_ids:caseIds, comparison:comparison.data, comparison_omission_reason:comparison.reason,
    allowed_images:ctx.allowed_images,
    editorial_policy:'Dữ kiện chỉ đối chiếu bằng chứng nguồn, chưa được iFlux trực tiếp xác minh. Không thêm claim ngoài facts; output phải được biên tập kiểm tra.' };
}

const escape = (s) => String(s).replace(/[&<>"']/g,(c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function composePreview(raw, ctx) {
  const value = contracts.compose.z.parse(raw), reasons = [...value.warnings];
  const ids = new Set(ctx.facts.map((f) => f.id));
  const checkRefs = (refs) => refs.length && refs.every((id) => ids.has(id));
  if (!checkRefs(value.lead_fact_ids) || !value.sections.length || value.sections.some((s) => !s.paragraphs.length || !checkRefs(s.fact_ids))) reasons.push('COMPOSE_FACT_REFERENCE_INVALID');
  if (value.tickers.some((t) => !ctx.entities.some((e) => e.ticker===t))) reasons.push('COMPOSE_ENTITY_INVALID');
  if (value.story_id !== ctx.story_id) reasons.push('COMPOSE_STORY_INVALID');
  if (value.timeline_case_ids.some((id) => !ctx.timeline_case_ids.includes(id))) reasons.push('COMPOSE_TIMELINE_INVALID');
  if (value.comparison_metric !== (ctx.comparison?.metric || null)) reasons.push('COMPOSE_COMPARISON_INVALID');
  if (value.iflux_insight && (value.iflux_insight.length < 400 || !checkRefs(value.insight_fact_ids))) reasons.push('INSIGHT_REVIEW');
  if (!value.iflux_insight && !value.insight_omission_reason) reasons.push('INSIGHT_OMISSION_REASON_REQUIRED');
  if (value.sections.some((s) => s.images.some((im) => !ctx.allowed_images.some((a) => a.id===im.image_id)))) reasons.push('IMAGE_NOT_ALLOWED');
  const eventRefs = new Set((ctx.event_proposals || []).map((e) => e.event_ref));
  const usedEventRefs = new Set();
  const sectionManifest = value.sections.map((section,index) => {
    const heading = section.h2.replace(/\s+/g,' ').trim();
    const normalizedHeading = heading.toLocaleLowerCase('vi').replace(/[.!?\s]+$/g,'');
    const firstParagraph = String(section.paragraphs[0] || '').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi').replace(/[.!?\s]+$/g,'');
    if (/<\/?a\b|(?:https?:\/\/|www\.)/i.test(heading)) reasons.push('COMPOSE_HEADING_LINK_INVALID');
    if (firstParagraph === normalizedHeading) reasons.push('COMPOSE_HEADING_REPEATED');
    section.event_refs.forEach((ref) => {
      if (!eventRefs.has(ref)) reasons.push('COMPOSE_EVENT_REFERENCE_INVALID: ' + ref);
      usedEventRefs.add(ref);
    });
    return { section_id:'ifx-section-' + (index + 1), h2:heading, fact_ids:section.fact_ids, event_refs:section.event_refs };
  });
  (ctx.event_proposals || []).forEach((event) => { if (!usedEventRefs.has(event.event_ref)) reasons.push('EVENT_WITHOUT_SECTION: ' + event.event_ref); });
  // Đây là bản xem trước: renderer backend escape toàn bộ prose, không nhận HTML từ AI.
  const body_html = '<p>' + escape(value.lead) + '</p>' + value.sections.map((s,index) => '<h2 id="ifx-section-' + (index + 1) + '">' + escape(s.h2) + '</h2>' + s.paragraphs.map((p) => '<p>' + escape(p) + '</p>').join('')).join('');
  return { article_input:{ title:value.title,excerpt:value.excerpt,body_html,section_manifest:sectionManifest,tickers:value.tickers,story_id:value.story_id,
    event_case_ids:value.timeline_case_ids,iflux_insight:value.iflux_insight,seo:value.seo },
    structured:value,section_manifest:sectionManifest,event_section_links:sectionManifest.flatMap((s) => s.event_refs.map((event_ref) => ({event_ref,section_id:s.section_id,heading:s.h2,anchor:'#'+s.section_id}))),
    event_source_links:(ctx.event_proposals || []).flatMap((event) => event.internal_section_refs.map((ref) => { const target=(ctx.internal_article_sections || []).find((s)=>s.ref===ref); return target ? {event_ref:event.event_ref,title:target.title,heading:target.heading,href:target.href} : null; }).filter(Boolean)),
    comparison_data:ctx.comparison,review_reasons:[...new Set(reasons)] };
}

module.exports = { sourceSnapshot, buildExtractContext, checkExtraction, buildComposeContext, composePreview };
