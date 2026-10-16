'use strict';

const { z } = require('zod');

// Một định nghĩa sinh cả JSON Schema gửi provider và validator backend.
const str = (max = 6000) => ({ json: { type: 'string', minLength: 1, maxLength: max }, z: z.string().min(1).max(max) });
const num = () => ({ json: { type: 'number' }, z: z.number().finite() });
const en = (values) => ({ json: { type: 'string', enum: values }, z: z.enum(values) });
const nullable = (v) => ({ json: { anyOf: [v.json, { type: 'null' }] }, z: v.z.nullable() });
const arr = (v, max = 60) => ({ json: { type: 'array', items: v.json, maxItems: max }, z: z.array(v.z).max(max) });
const obj = (fields) => ({
  json: { type: 'object', properties: Object.fromEntries(Object.entries(fields).map(([k,v]) => [k,v.json])), required: Object.keys(fields), additionalProperties: false },
  z: z.object(Object.fromEntries(Object.entries(fields).map(([k,v]) => [k,v.z]))).strict()
});
const refs = () => arr(str(100));
const evidence = obj({ source_id: str(160), quote: str(4000) });
const metric = obj({ subject: str(240), indicator: str(160), value: nullable(num()), unit: nullable(str(80)), period: nullable(str(160)), basis: en(['actual','planned']) });
const eventStatus = en(['announced','under_review','planned','approved','effective','in_progress','delayed','reported_result','completed','cancelled','corrected']);
const comparison = nullable(obj({
  metric: en(['market_cap','shares_outstanding','pe','pb','foreign_room']),
  scope: obj({ type: en(['sector','ecosystem','story']), id: str(160) }),
  tickers: arr(str(10),30), purpose: str(600)
}));
const sectionManifest = obj({ section_id: str(80), h2: str(240), fact_ids: refs(), event_refs: refs() });
const extract = obj({
  facts: arr(obj({ id: str(100), statement: str(), metric: nullable(metric), evidence: arr(evidence,20) })),
  entities: arr(obj({ name: str(240), ticker: nullable(str(10)), role: en(['subject','partner','comparison','mention']), evidence, uncertainty: nullable(str(600)) })),
  events: arr(obj({ event_ref: str(100), group: en(['1','2','3','4','5','6','7','8']), case_id: nullable(str(100)), subject_ticker: nullable(str(10)),
    title: str(240), summary: str(), status: eventStatus,
    announced_on: nullable(str(10)), occurred_on: nullable(str(10)), effective_on: nullable(str(10)), internal_section_refs: refs(), metrics: arr(metric,30), evidence: arr(evidence,20) }),20),
  story_candidates: arr(obj({ story_id: str(100), reason: str(600) }),10),
  comparison,
  context_requests: arr(str(600),20),
  issues: arr(obj({ code: str(80), detail: str(1000) }),30)
});
const compose = obj({
  title: str(240), excerpt: str(1600), lead: str(), lead_fact_ids: refs(),
  sections: arr(obj({ h2: str(240), paragraphs: arr(str(),30), fact_ids: refs(), event_refs: refs(), images: arr(obj({ image_id: str(100), alt: str(400), title: nullable(str(240)), caption: nullable(str(600)) }),10) }),30),
  tickers: arr(str(10),20), story_id: nullable(str(100)), timeline_case_ids: arr(str(100),20),
  comparison_metric: nullable(str(80)),
  iflux_insight: nullable(str(600)), insight_fact_ids: refs(), insight_omission_reason: nullable(str(600)),
  seo: obj({ title: str(240), description: str(1000) }),
  warnings: arr(str(1000),30)
});

module.exports = { SCHEMA_VERSION: 'news-ai-v2', sectionManifest, contracts: { extract, compose } };
