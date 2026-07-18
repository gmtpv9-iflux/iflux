'use strict';

const crypto = require('crypto');
const { query } = require('../../core/database/connection');

function urlHash(url) {
  return crypto.createHash('sha256').update(String(url || '').trim().toLowerCase()).digest('hex').slice(0, 64);
}

function newId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function slugify(label) {
  return String(label || '')
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140) || 'topic';
}

async function ensureSource(code) {
  const res = await query('SELECT id FROM content_sources WHERE code = $1 LIMIT 1', [code]);
  if (res.rows[0]) return res.rows[0].id;
  const id = 'src_' + slugify(code).replace(/:/g, '_');
  await query(
    `INSERT INTO content_sources (id, code, name, source_type)
     VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
    [id, code, code, code.split(':')[0] || 'external']
  );
  const again = await query('SELECT id FROM content_sources WHERE code = $1 LIMIT 1', [code]);
  return again.rows[0] && again.rows[0].id;
}

async function ensureTopic(label, status) {
  const slug = slugify(label);
  const existing = await query('SELECT * FROM content_chu_de_candidates WHERE slug = $1 LIMIT 1', [slug]);
  if (existing.rows[0]) return existing.rows[0];
  const id = newId('topic');
  await query(
    `INSERT INTO content_chu_de_candidates (id, slug, label, status)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, updated_at = NOW()
     RETURNING *`,
    [id, slug, label, status || 'building']
  );
  const row = await query('SELECT * FROM content_chu_de_candidates WHERE slug = $1 LIMIT 1', [slug]);
  return row.rows[0];
}

async function linkTopic(articleId, topicId, method) {
  await query(
    `INSERT INTO content_article_chu_de_candidates (article_id, candidate_id, method)
     VALUES ($1, $2, $3)
     ON CONFLICT (article_id, candidate_id) DO NOTHING`,
    [articleId, topicId, method || 'auto']
  );
}

async function linkEntity(articleId, entityType, entityId, entityLabel, confidence, method) {
  await query(
    `INSERT INTO content_article_entities
      (article_id, entity_type, entity_id, entity_label, confidence, method)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (article_id, entity_type, entity_id)
     DO UPDATE SET entity_label = EXCLUDED.entity_label,
                   confidence = EXCLUDED.confidence`,
    [articleId, entityType, entityId, entityLabel || entityId, confidence == null ? 0.6 : confidence, method || 'auto']
  );
}

async function refreshTopicCounts() {
  await query(`
    UPDATE content_chu_de_candidates t SET
      article_count = COALESCE((
        SELECT COUNT(*)::int FROM content_article_chu_de_candidates at WHERE at.candidate_id = t.id
      ), 0),
      updated_at = NOW()
  `);
}

/**
 * Ingest 1 bài dạng Vnstock News (hoặc tương đương).
 * raw: { url, title, short_description, content, publish_time, author, category, tags, image_url, source, view_counts }
 * opts: { topics: string[], entities: [{type,id,label,confidence}], publishToFeed, sourceCode }
 *
 * Bài thiếu primary Chủ đề → needs_review=true, không lên feed (Admin bổ sung).
 */
async function ingestArticle(raw, opts) {
  opts = opts || {};
  const url = String(raw.url || '').trim();
  if (!url || !raw.title) {
    const err = new Error('url và title bắt buộc');
    err.statusCode = 400;
    throw err;
  }
  const hash = urlHash(url);
  const sourceCode = opts.sourceCode || ('vnstock:' + (raw.source || 'unknown'));
  const isInternal = String(sourceCode).indexOf('internal:') === 0;
  const sourceId = await ensureSource(sourceCode);
  const id = newId('art');
  const publishedAt = raw.publish_time ? new Date(raw.publish_time) : null;
  const excerpt = String(raw.short_description || raw.excerpt || '').slice(0, 2000);
  const body = String(raw.content || raw.body_text || '');
  const storageMode = body && body.length > excerpt.length + 80 ? 'full_private' : 'excerpt';

  const insert = await query(
    `INSERT INTO content_articles (
      id, source_id, external_url, url_hash, title, excerpt, body_text, body_storage_mode,
      author_name, category_raw, tags_raw, image_url, published_at, status, published_to_feed,
      view_counts, raw_payload, needs_review, missing_fields
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'normalized',FALSE,$14,$15::jsonb,TRUE,'[]'::jsonb
    )
    ON CONFLICT (url_hash) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_text = EXCLUDED.body_text,
      author_name = EXCLUDED.author_name,
      category_raw = EXCLUDED.category_raw,
      tags_raw = EXCLUDED.tags_raw,
      image_url = EXCLUDED.image_url,
      published_at = COALESCE(EXCLUDED.published_at, content_articles.published_at),
      view_counts = COALESCE(EXCLUDED.view_counts, content_articles.view_counts),
      raw_payload = EXCLUDED.raw_payload,
      updated_at = NOW()
    RETURNING *`,
    [
      id,
      sourceId,
      url,
      hash,
      String(raw.title).trim(),
      excerpt,
      storageMode === 'full_private' ? body : '',
      storageMode,
      String(raw.author || ''),
      String(raw.category || ''),
      String(raw.tags || ''),
      String(raw.image_url || ''),
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toISOString() : null,
      raw.view_counts != null ? Number(raw.view_counts) : null,
      JSON.stringify(raw)
    ]
  );
  const article = insert.rows[0];

  const topicLabels = Array.isArray(opts.topics) ? opts.topics.slice() : [];
  if (raw.category) topicLabels.push(String(raw.category));
  if (raw.tags) {
    String(raw.tags).split(/[,|]/).forEach(function (t) {
      const s = t.trim();
      if (s) topicLabels.push(s);
    });
  }
  const seen = {};
  const linkedTopics = [];
  for (let i = 0; i < topicLabels.length; i++) {
    const label = String(topicLabels[i] || '').trim();
    if (!label || seen[label.toLowerCase()]) continue;
    seen[label.toLowerCase()] = true;
    const topic = await ensureTopic(label, 'building');
    await linkTopic(article.id, topic.id, opts.topicMethod || 'ingest');
    linkedTopics.push(topic);
  }

  const entities = Array.isArray(opts.entities) ? opts.entities : [];
  for (let j = 0; j < entities.length; j++) {
    const e = entities[j];
    if (!e || !e.type || !e.id) continue;
    await linkEntity(article.id, e.type, String(e.id).toUpperCase(), e.label || e.id, e.confidence, e.method || 'ingest');
  }

  /* Heuristic ticker từ title/excerpt nếu chưa có stock entity */
  const hasStock = entities.some(function (e) { return e && e.type === 'stock'; });
  if (!hasStock) {
    const dict = ['FPT', 'CMG', 'CTR', 'HPG', 'VCB', 'SSI', 'MWG', 'VIC', 'VHM', 'GAS', 'NLG', 'HSG', 'ELC', 'TCB', 'MBB', 'ACB', 'VNM', 'MSN'];
    const blob = (raw.title || '') + ' ' + (excerpt || '');
    for (let k = 0; k < dict.length; k++) {
      const ticker = dict[k];
      const re = new RegExp('\\b' + ticker + '\\b', 'i');
      if (re.test(blob)) {
        await linkEntity(article.id, 'stock', ticker, ticker, 0.55, 'regex');
      }
    }
  }

  /* Auto gắn primary nếu đúng 1 candidate đã promote → content_chu_de */
  let primaryChuDeId = article.primary_chu_de_id || null;
  const promoted = [];
  for (let p = 0; p < linkedTopics.length; p++) {
    const t = linkedTopics[p];
    if (t && t.status === 'promoted' && t.chu_de_id) promoted.push(t.chu_de_id);
  }
  const uniqPromoted = promoted.filter(function (v, i, a) { return a.indexOf(v) === i; });
  if (!primaryChuDeId && uniqPromoted.length === 1) {
    primaryChuDeId = uniqPromoted[0];
  }

  const completeness = await applyArticleCompleteness(article.id, {
    primaryChuDeId: primaryChuDeId,
    categoryRaw: String(raw.category || article.category_raw || ''),
    forcePublish: isInternal ? opts.publishToFeed !== false : opts.publishToFeed === true,
    isInternal: isInternal
  });

  await refreshTopicCounts();
  const full = await getArticle(article.id);
  return full || Object.assign({}, article, completeness);
}

async function applyArticleCompleteness(articleId, opts) {
  opts = opts || {};
  const rowRes = await query('SELECT * FROM content_articles WHERE id = $1 LIMIT 1', [articleId]);
  const row = rowRes.rows[0];
  if (!row) return null;

  let primaryChuDeId = opts.primaryChuDeId != null ? opts.primaryChuDeId : row.primary_chu_de_id;
  if (primaryChuDeId) {
    const ok = await query('SELECT id FROM content_chu_de WHERE id = $1 LIMIT 1', [primaryChuDeId]);
    if (!ok.rows[0]) primaryChuDeId = null;
  }

  const categoryRaw = opts.categoryRaw != null ? String(opts.categoryRaw) : String(row.category_raw || '');
  const entities = await listArticleEntities(articleId);
  const missing = [];
  if (!primaryChuDeId) missing.push('chu_de');
  if (!categoryRaw.trim()) missing.push('category');
  if (!entities.length) missing.push('entity');

  const isInternal = !!opts.isInternal;
  /* SoT: thiếu chủ đề → bắt buộc Admin; category/entity nhắc nhưng không chặn nếu đã có chủ đề + internal seed */
  let needsReview = missing.indexOf('chu_de') >= 0;
  if (isInternal && !primaryChuDeId) needsReview = false;

  let publishToFeed = false;
  if (opts.forcePublish === true && !needsReview) publishToFeed = true;
  else if (!needsReview && opts.forcePublish !== false && row.published_to_feed) publishToFeed = true;
  else if (!needsReview && opts.forcePublish === true) publishToFeed = true;

  if (needsReview) publishToFeed = false;

  await query(
    `UPDATE content_articles SET
       primary_chu_de_id = $2,
       needs_review = $3,
       missing_fields = $4::jsonb,
       published_to_feed = $5,
       category_raw = CASE WHEN $6 <> '' THEN $6 ELSE category_raw END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      articleId,
      primaryChuDeId,
      needsReview,
      JSON.stringify(missing),
      publishToFeed,
      categoryRaw
    ]
  );

  return {
    primary_chu_de_id: primaryChuDeId,
    needs_review: needsReview,
    missing_fields: missing,
    published_to_feed: publishToFeed
  };
}

/**
 * Admin sửa bài Content Engine — gắn 01 Chủ đề, category, entities, xuất feed.
 */
async function updateContentArticle(id, input) {
  input = input || {};
  const current = await getArticle(id);
  if (!current) {
    const err = new Error('Không tìm thấy bài viết');
    err.statusCode = 404;
    throw err;
  }

  const title = input.title != null ? String(input.title).trim() : current.title;
  const excerpt = input.excerpt != null ? String(input.excerpt).slice(0, 2000) : current.excerpt;
  const bodyText = input.body_text != null ? String(input.body_text) : current.body_text;
  const categoryRaw = input.category_raw != null ? String(input.category_raw) : (input.category != null ? String(input.category) : current.category_raw);
  const tagsRaw = input.tags_raw != null ? String(input.tags_raw) : current.tags_raw;
  const imageUrl = input.image_url != null ? String(input.image_url) : current.image_url;
  const authorName = input.author_name != null ? String(input.author_name) : current.author_name;

  await query(
    `UPDATE content_articles SET
       title = $2, excerpt = $3, body_text = $4, category_raw = $5, tags_raw = $6,
       image_url = $7, author_name = $8, updated_at = NOW()
     WHERE id = $1`,
    [id, title, excerpt, bodyText || '', categoryRaw || '', tagsRaw || '', imageUrl || '', authorName || '']
  );

  let primaryChuDeId = current.primary_chu_de_id || null;
  if (input.primary_chu_de_id != null || input.chu_de_id != null || input.chu_de_slug != null || input.chu_de_name != null) {
    primaryChuDeId = await resolveOrCreatePrimaryChuDe({
      id: input.primary_chu_de_id || input.chu_de_id,
      slug: input.chu_de_slug,
      name: input.chu_de_name || input.chu_de_label
    });
  }

  if (Array.isArray(input.entities)) {
    await query('DELETE FROM content_article_entities WHERE article_id = $1', [id]);
    for (let i = 0; i < input.entities.length; i++) {
      const e = input.entities[i];
      if (!e || !e.type || !e.id) continue;
      await linkEntity(id, e.type, String(e.id).toUpperCase(), e.label || e.id, e.confidence != null ? e.confidence : 0.9, e.method || 'admin');
    }
  }

  if (Array.isArray(input.topics) && input.topics.length) {
    for (let t = 0; t < input.topics.length; t++) {
      const label = String(input.topics[t] || '').trim();
      if (!label) continue;
      const topic = await ensureTopic(label, 'building');
      await linkTopic(id, topic.id, 'admin');
    }
  }

  const forcePublish = input.publish_to_feed === true || input.published_to_feed === true;
  await applyArticleCompleteness(id, {
    primaryChuDeId: primaryChuDeId,
    categoryRaw: categoryRaw,
    forcePublish: forcePublish,
    isInternal: false
  });

  await refreshTopicCounts();
  return getArticle(id);
}

async function resolveOrCreatePrimaryChuDe(ref) {
  ref = ref || {};
  if (ref.id) {
    const byId = await query('SELECT id FROM content_chu_de WHERE id = $1 LIMIT 1', [ref.id]);
    if (byId.rows[0]) return byId.rows[0].id;
    const cand = await query(
      'SELECT chu_de_id FROM content_chu_de_candidates WHERE id = $1 AND chu_de_id IS NOT NULL LIMIT 1',
      [ref.id]
    );
    if (cand.rows[0] && cand.rows[0].chu_de_id) return cand.rows[0].chu_de_id;
  }
  const slug = ref.slug ? slugify(ref.slug) : ref.name ? slugify(ref.name) : '';
  if (slug) {
    const bySlug = await query('SELECT id FROM content_chu_de WHERE slug = $1 LIMIT 1', [slug]);
    if (bySlug.rows[0]) return bySlug.rows[0].id;
  }
  if (ref.name || slug) {
    const label = String(ref.name || slug);
    const created = await upsertChuDeAdmin({
      slug: slug || slugify(label),
      label: label,
      status: 'active',
      lifecycle: 'emerging'
    });
    return created && created.id;
  }
  return null;
}

async function ensureSeeded() {
  const res = await query('SELECT COUNT(*)::int AS n FROM content_articles');
  if (res.rows[0].n > 0) return;

  const samples = [
    {
      raw: {
        url: 'https://iflux.internal/seed/ai-fpt-2026',
        title: 'FPT trong làn sóng AI Việt Nam: câu chuyện tăng trưởng 2026',
        short_description: 'Doanh nghiệp đẩy mạnh hợp đồng AI, cloud và trung tâm dữ liệu.',
        content: 'FPT, CMG và CTR được nhắc trong các hợp đồng AI và dữ liệu.',
        publish_time: '2026-07-02T09:00:00.000Z',
        author: 'iFlux Editorial',
        category: 'Công nghệ',
        tags: 'AI, Bán dẫn, Cloud',
        image_url: '',
        source: 'seed',
        view_counts: 286
      },
      topics: ['AI', 'Công nghệ'],
      entities: [
        { type: 'stock', id: 'FPT', label: 'FPT', confidence: 0.9 },
        { type: 'stock', id: 'CMG', label: 'CMG', confidence: 0.7 },
        { type: 'stock', id: 'CTR', label: 'CTR', confidence: 0.65 },
        { type: 'sector', id: 'cntt', label: 'CNTT', confidence: 0.8 },
        { type: 'ecosystem', id: 'fpt', label: 'Họ FPT', confidence: 0.75 },
        { type: 'organization', id: 'nvidia', label: 'NVIDIA', confidence: 0.4 }
      ]
    },
    {
      raw: {
        url: 'https://iflux.internal/seed/hpg-dau-tu-cong',
        title: 'HPG và chu kỳ thép: Dòng tiền đầu tư công hỗ trợ?',
        short_description: 'Ngành thép hưởng lợi khi giải ngân đầu tư công tăng tốc.',
        content: 'HPG và HSG nằm trong nhóm hưởng lợi đầu tư công.',
        publish_time: '2026-07-01T08:00:00.000Z',
        author: 'iFlux Editorial',
        category: 'Chứng khoán',
        tags: 'Đầu tư công, Thép',
        source: 'seed',
        view_counts: 890
      },
      topics: ['Đầu tư công', 'Thép'],
      entities: [
        { type: 'stock', id: 'HPG', label: 'HPG', confidence: 0.9 },
        { type: 'stock', id: 'HSG', label: 'HSG', confidence: 0.7 },
        { type: 'sector', id: 'thep', label: 'Thép', confidence: 0.85 }
      ]
    },
    {
      raw: {
        url: 'https://iflux.internal/seed/bank-nim',
        title: 'NIM ngân hàng 2026: áp lực cạnh tranh huy động',
        short_description: 'Biên lãi ròng nhóm ngân hàng bị siết khi lãi huy động nhích lên.',
        content: 'VCB và các ngân hàng lớn điều chỉnh chiến lược NIM.',
        publish_time: '2026-07-03T07:30:00.000Z',
        author: 'iFlux Editorial',
        category: 'Ngân hàng',
        tags: 'NIM, Ngân hàng',
        source: 'seed',
        view_counts: 410
      },
      topics: ['NIM ngân hàng', 'Ngân hàng'],
      entities: [
        { type: 'stock', id: 'VCB', label: 'VCB', confidence: 0.85 },
        { type: 'sector', id: 'ngan-hang', label: 'Ngân hàng', confidence: 0.9 }
      ]
    }
  ];

  for (let i = 0; i < samples.length; i++) {
    await ingestArticle(samples[i].raw, {
      sourceCode: 'internal:seed',
      topics: samples[i].topics,
      entities: samples[i].entities,
      publishToFeed: true,
      topicMethod: 'seed'
    });
  }

  /* Boost interest demo cho AI topic */
  await query(
    `UPDATE content_chu_de_candidates SET interest_score = 42, status = 'candidate', updated_at = NOW()
     WHERE slug = 'ai'`
  );
}

async function listArticleTopics(articleId) {
  const res = await query(
    `SELECT t.id, t.slug, t.label, t.status, at.weight, at.method
     FROM content_article_chu_de_candidates at
     JOIN content_chu_de_candidates t ON t.id = at.candidate_id
     WHERE at.article_id = $1
     ORDER BY at.weight DESC, t.label ASC`,
    [articleId]
  );
  return res.rows;
}

async function listArticleEntities(articleId) {
  const res = await query(
    `SELECT entity_type AS type, entity_id AS id, entity_label AS label, confidence, method
     FROM content_article_entities WHERE article_id = $1
     ORDER BY confidence DESC`,
    [articleId]
  );
  return res.rows;
}

async function hydrateArticle(row) {
  if (!row) return null;
  const topics = await listArticleTopics(row.id);
  const entities = await listArticleEntities(row.id);
  let chuDe = null;
  if (row.primary_chu_de_id) {
    const s = await query(
      'SELECT id, slug, label, status, lifecycle FROM content_chu_de WHERE id = $1 LIMIT 1',
      [row.primary_chu_de_id]
    );
    chuDe = s.rows[0] || null;
  }
  const missing = Array.isArray(row.missing_fields)
    ? row.missing_fields
    : (typeof row.missing_fields === 'string'
      ? (function () { try { return JSON.parse(row.missing_fields); } catch (e) { return []; } })()
      : []);
  return Object.assign({}, row, {
    topics,
    entities,
    symbols: entities.filter(function (e) { return e.type === 'stock'; }).map(function (e) { return e.id; }),
    chu_de: chuDe,
    chu_de_id: row.primary_chu_de_id || null,
    chu_de_name: chuDe ? chuDe.label : null,
    chu_de_slug: chuDe ? chuDe.slug : null,
    missing_fields: missing,
    incomplete: !!row.needs_review
  });
}

async function listArticles(filters) {
  filters = filters || {};
  await ensureSeeded();
  const params = [];
  let sql = `SELECT a.*, s.code AS source_code, s.name AS source_name
             FROM content_articles a
             LEFT JOIN content_sources s ON s.id = a.source_id
             WHERE 1=1`;
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND a.status = $${params.length}`;
  }
  if (filters.topic) {
    params.push(slugify(filters.topic));
    sql += ` AND EXISTS (
      SELECT 1 FROM content_article_chu_de_candidates at
      JOIN content_chu_de_candidates t ON t.id = at.candidate_id
      WHERE at.article_id = a.id AND t.slug = $${params.length}
    )`;
  }
  if (filters.symbol) {
    params.push(String(filters.symbol).toUpperCase());
    sql += ` AND EXISTS (
      SELECT 1 FROM content_article_entities e
      WHERE e.article_id = a.id AND e.entity_type = 'stock' AND e.entity_id = $${params.length}
    )`;
  }
  if (filters.feedOnly) {
    sql += ' AND a.published_to_feed = TRUE AND a.needs_review = FALSE';
  }
  if (filters.needsReview === true || filters.needs_review === true || filters.incomplete === true) {
    sql += ' AND a.needs_review = TRUE';
  }
  if (filters.needsReview === false || filters.needs_review === false) {
    sql += ' AND a.needs_review = FALSE';
  }
  if (filters.q) {
    params.push('%' + String(filters.q).trim() + '%');
    sql += ` AND (a.title ILIKE $${params.length} OR a.excerpt ILIKE $${params.length} OR a.external_url ILIKE $${params.length})`;
  }
  if (filters.source) {
    const src = String(filters.source);
    params.push(src);
    const pExact = params.length;
    params.push(src + '%');
    sql += ` AND (s.code = $${pExact} OR s.code LIKE $${params.length})`;
  }
  sql += ' ORDER BY a.needs_review DESC, COALESCE(a.published_at, a.ingested_at) DESC';
  const limit = filters.limit ? Number(filters.limit) : 50;
  params.push(limit);
  sql += ` LIMIT $${params.length}`;
  const res = await query(sql, params);
  const out = [];
  for (let i = 0; i < res.rows.length; i++) {
    out.push(await hydrateArticle(res.rows[i]));
  }
  return out;
}

async function getArticle(id) {
  await ensureSeeded();
  const res = await query(
    `SELECT a.*, s.code AS source_code, s.name AS source_name
     FROM content_articles a
     LEFT JOIN content_sources s ON s.id = a.source_id
     WHERE a.id = $1 LIMIT 1`,
    [id]
  );
  return hydrateArticle(res.rows[0] || null);
}

async function listTopics(filters) {
  filters = filters || {};
  await ensureSeeded();
  const params = [];
  let sql = 'SELECT * FROM content_chu_de_candidates WHERE 1=1';
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  }
  sql += ' ORDER BY interest_score DESC, article_count DESC, label ASC';
  const limit = filters.limit ? Number(filters.limit) : 40;
  params.push(limit);
  sql += ` LIMIT $${params.length}`;
  const res = await query(sql, params);
  return res.rows;
}

/** Shape cho BLK-COM-NEWS / community feed */
function articleToNewsCard(article) {
  const symbols = (article.entities || [])
    .filter(function (e) { return e.type === 'stock'; })
    .map(function (e) { return e.id; });
  const topics = (article.topics || []).map(function (t) {
    return { id: t.id, slug: t.slug, name: t.label, status: t.status };
  });
  return {
    id: article.id,
    slug: article.id,
    title: article.title,
    excerpt: article.excerpt || '',
    body_html: '',
    external_url: article.external_url,
    source_label: article.source_name || article.source_code || '',
    content_type: 'news',
    content_origin: 'content_engine',
    tickers: symbols,
    topics: topics,
    image_url: article.image_url || '',
    author: {
      id: 'content_engine',
      display_name: article.author_name || article.source_name || 'Nguồn tin',
      tier: 'system',
      tier_label: 'Nguồn'
    },
    stats: {
      likes: 0,
      comments: 0,
      shares: 0,
      views: article.view_counts || 0,
      favorites: 0
    },
    comments: [],
    liked_by: [],
    favorited_by: [],
    published_at: article.published_at || article.ingested_at,
    created_at: article.ingested_at,
    status: 'published'
  };
}

async function getFeed(limit) {
  const articles = await listArticles({
    feedOnly: true,
    status: 'normalized',
    needsReview: false,
    limit: limit || 30
  });
  return articles.map(articleToNewsCard);
}

async function countNeedsReview() {
  const res = await query(
    'SELECT COUNT(*)::int AS n FROM content_articles WHERE needs_review = TRUE'
  );
  return res.rows[0] ? res.rows[0].n : 0;
}

/* ===================== P1: Interest Score + Promote ===================== */

const INTEREST_WEIGHTS = {
  view: 1,
  search: 3,
  like: 5,
  favorite: 8,
  share: 8,
  comment: 10
};

const PERIOD_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000
};

const PERIOD_DAYS = { day: 1, week: 7, month: 30 };

const VALID_EVENTS = Object.keys(INTEREST_WEIGHTS);

function interestConfig(overrides) {
  const o = overrides || {};
  return {
    view: o.interest_w_view != null ? Number(o.interest_w_view) : INTEREST_WEIGHTS.view,
    search: o.interest_w_search != null ? Number(o.interest_w_search) : INTEREST_WEIGHTS.search,
    like: o.interest_w_like != null ? Number(o.interest_w_like) : INTEREST_WEIGHTS.like,
    favorite: o.interest_w_favorite != null ? Number(o.interest_w_favorite) : INTEREST_WEIGHTS.favorite,
    share: o.interest_w_share != null ? Number(o.interest_w_share) : INTEREST_WEIGHTS.share,
    comment: o.interest_w_comment != null ? Number(o.interest_w_comment) : INTEREST_WEIGHTS.comment,
    promoteMinArticles: o.topic_promote_min_articles != null ? Number(o.topic_promote_min_articles) : 3
  };
}

function scoreFromParts(parts, weights) {
  const w = weights || INTEREST_WEIGHTS;
  return (
    (parts.views || 0) * w.view +
    (parts.searches || 0) * w.search +
    (parts.likes || 0) * w.like +
    (parts.favorites || 0) * w.favorite +
    (parts.shares || 0) * w.share +
    (parts.comments || 0) * w.comment
  );
}

async function resolveTopicId(topicRef) {
  if (!topicRef) return null;
  const byId = await query('SELECT id FROM content_chu_de_candidates WHERE id = $1 LIMIT 1', [topicRef]);
  if (byId.rows[0]) return byId.rows[0].id;
  const slug = slugify(topicRef);
  const bySlug = await query('SELECT id FROM content_chu_de_candidates WHERE slug = $1 LIMIT 1', [slug]);
  return bySlug.rows[0] ? bySlug.rows[0].id : null;
}

async function recordInterestEvent(input) {
  input = input || {};
  const type = String(input.event_type || input.type || '').toLowerCase();
  if (VALID_EVENTS.indexOf(type) < 0) {
    const err = new Error('event_type phải là: ' + VALID_EVENTS.join(', '));
    err.statusCode = 400;
    throw err;
  }
  let topicId = input.candidate_id || null;
  if (!topicId && input.topic) topicId = await resolveTopicId(input.topic);
  if (!topicId && input.slug) topicId = await resolveTopicId(input.slug);
  if (!topicId && input.label) {
    const t = await ensureTopic(input.label, 'building');
    topicId = t.id;
  }
  if (!topicId) {
    const err = new Error('Thiếu candidate_id / topic / slug');
    err.statusCode = 400;
    throw err;
  }
  const res = await query(
    `INSERT INTO content_interest_events (candidate_id, event_type, user_id, article_id, meta)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [
      topicId,
      type,
      input.user_id || null,
      input.article_id || null,
      JSON.stringify(input.meta || {})
    ]
  );
  await query(
    `UPDATE content_chu_de_candidates SET last_interest_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [topicId]
  );
  return res.rows[0];
}

/**
 * Tính Interest Score trong cửa sổ period → ghi interest_score.
 * period: day|week|month|all
 */
async function recomputeInterestScores(opts) {
  opts = opts || {};
  await ensureSeeded();
  const cfg = interestConfig(opts.config);
  const periodKey = opts.period || 'week';
  const ms = periodKey === 'all' ? null : (PERIOD_MS[periodKey] || PERIOD_MS.week);
  const params = [];
  let sql =
    `SELECT t.id,
            COUNT(*) FILTER (WHERE e.event_type = 'view')::int AS views,
            COUNT(*) FILTER (WHERE e.event_type = 'search')::int AS searches,
            COUNT(*) FILTER (WHERE e.event_type = 'like')::int AS likes,
            COUNT(*) FILTER (WHERE e.event_type = 'favorite')::int AS favorites,
            COUNT(*) FILTER (WHERE e.event_type = 'share')::int AS shares,
            COUNT(*) FILTER (WHERE e.event_type = 'comment')::int AS comments
     FROM content_chu_de_candidates t
     LEFT JOIN content_interest_events e ON e.candidate_id = t.id`;
  if (ms) {
    params.push(new Date(Date.now() - ms).toISOString());
    sql += ` AND e.created_at >= $${params.length}`;
  }
  sql += ' GROUP BY t.id';

  const agg = await query(sql, params);

  let updated = 0;
  for (let i = 0; i < agg.rows.length; i++) {
    const row = agg.rows[i];
    const parts = {
      views: row.views || 0,
      searches: row.searches || 0,
      likes: row.likes || 0,
      favorites: row.favorites || 0,
      shares: row.shares || 0,
      comments: row.comments || 0
    };
    const score = scoreFromParts(parts, cfg);
    await query(
      `UPDATE content_chu_de_candidates SET interest_score = $2, updated_at = NOW() WHERE id = $1`,
      [row.id, score]
    );
    updated += 1;
  }

  const candidates = await markCandidates({ config: cfg });
  return { updated, period: periodKey, weights: cfg, candidates: candidates.length };
}

async function markCandidates(opts) {
  opts = opts || {};
  const cfg = interestConfig(opts.config);
  const res = await query(
    `UPDATE content_chu_de_candidates SET
       status = 'candidate',
       candidate_at = COALESCE(candidate_at, NOW()),
       promote_reason = $2,
       updated_at = NOW()
     WHERE status = 'building'
       AND article_count >= $1
       AND interest_score > 0
     RETURNING id, slug, label, interest_score, article_count`,
    [
      cfg.promoteMinArticles,
      'auto: article_count>=' + cfg.promoteMinArticles + ' & interest_score>0'
    ]
  );
  return res.rows;
}

async function promoteTopic(topicRef, opts) {
  opts = opts || {};
  await ensureSeeded();
  const topicId = await resolveTopicId(topicRef);
  if (!topicId) {
    const err = new Error('Không tìm thấy topic');
    err.statusCode = 404;
    throw err;
  }
  const tRes = await query('SELECT * FROM content_chu_de_candidates WHERE id = $1 LIMIT 1', [topicId]);
  const topic = tRes.rows[0];
  if (!topic) {
    const err = new Error('Không tìm thấy topic');
    err.statusCode = 404;
    throw err;
  }
  if (topic.status === 'promoted' && topic.chu_de_id) {
    const existing = await query('SELECT * FROM content_chu_de WHERE id = $1 LIMIT 1', [topic.chu_de_id]);
    return { topic, story: existing.rows[0] || null, already: true };
  }
  if (!opts.force && topic.status !== 'candidate' && topic.article_count < interestConfig(opts.config).promoteMinArticles) {
    const err = new Error('Topic chưa đủ tiêu chí candidate (cần Admin force hoặc đạt min articles + interest)');
    err.statusCode = 400;
    throw err;
  }

  const storyId = newId('chu_de');
  const storySlug = topic.slug;
  const storyIns = await query(
    `INSERT INTO content_chu_de (id, slug, label, origin_candidate_id, status, interest_score, promoted_at, promoted_by, meta)
     VALUES ($1, $2, $3, $4, 'active', $5, NOW(), $6, $7::jsonb)
     ON CONFLICT (slug) DO UPDATE SET
       label = EXCLUDED.label,
       interest_score = EXCLUDED.interest_score,
       origin_candidate_id = COALESCE(content_chu_de.origin_candidate_id, EXCLUDED.origin_candidate_id),
       promoted_at = COALESCE(content_chu_de.promoted_at, NOW()),
       updated_at = NOW()
     RETURNING *`,
    [
      storyId,
      storySlug,
      topic.label,
      topic.id,
      topic.interest_score || 0,
      opts.adminId || opts.promoted_by || 'admin',
      JSON.stringify({ reason: opts.reason || topic.promote_reason || 'admin_approve' })
    ]
  );
  const story = storyIns.rows[0];
  await query(
    `UPDATE content_chu_de_candidates SET
       status = 'promoted',
       chu_de_id = $2,
       promoted_at = NOW(),
       promote_reason = COALESCE(NULLIF($3, ''), promote_reason),
       updated_at = NOW()
     WHERE id = $1`,
    [topic.id, story.id, opts.reason || 'admin_approve']
  );
  const updated = await query('SELECT * FROM content_chu_de_candidates WHERE id = $1', [topic.id]);
  return { topic: updated.rows[0], story, already: false };
}

async function listStories(filters) {
  filters = filters || {};
  await ensureSeeded();
  await ensureFoundationChuDe();
  const params = [];
  let sql = 'SELECT * FROM content_chu_de WHERE 1=1';
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  } else if (!filters.include_all) {
    sql += ` AND status <> 'archived' AND status <> 'retired'`;
  }
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(label) LIKE $${params.length} OR LOWER(slug) LIKE $${params.length})`;
  }
  if (filters.lifecycle) {
    params.push(filters.lifecycle);
    sql += ` AND lifecycle = $${params.length}`;
  }
  sql += ' ORDER BY interest_score DESC, promoted_at DESC NULLS LAST, updated_at DESC';
  params.push(filters.limit ? Number(filters.limit) : 100);
  sql += ` LIMIT $${params.length}`;
  const res = await query(sql, params);
  return res.rows.map(rowToChuDeAdmin);
}

function rowToChuDeAdmin(row) {
  if (!row) return null;
  const meta = row.meta || {};
  return Object.assign({}, row, {
    name: row.label,
    description: meta.description || '',
    source: meta.source || null,
    createdBy: row.promoted_by || meta.created_by || 'system',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stocksCount: Number(row.mapping_count) || 0
  });
}

const FOUNDATION_CHU_DE = [
  {
    slug: 'chien-tranh-my-iran',
    label: 'Chiến tranh Mỹ - Iran',
    lifecycle: 'trending',
    description:
      'Xung đột địa chính trị đẩy giá dầu thô leo thang, kích hoạt sóng tăng giá nhóm cổ phiếu Dầu khí, nhưng làm tăng áp lực lạm phát và rủi ro chi phí vận tải toàn cầu.',
    tickers: ['PVD', 'PVS', 'PLX', 'GAS', 'PVT']
  },
  {
    slug: 'dau-tu-cong',
    label: 'Đầu tư công',
    lifecycle: 'trending',
    description:
      'Chiến lược dùng ngân sách nhà nước xây dựng hạ tầng quy mô lớn (cao tốc, sân bay), tạo ra kỳ vọng tăng trưởng dài hạn cho các doanh nghiệp xây dựng, vật liệu và bất động sản.',
    tickers: ['HPG', 'VCG', 'HHV', 'CII', 'PC1', 'NKG']
  },
  {
    slug: 'thoai-von-nn',
    label: 'Thoái vốn nhà nước',
    lifecycle: 'growing',
    description:
      'Quá trình giảm tỷ lệ sở hữu của Nhà nước tại các tổng công ty lớn, thường tạo ra các thương vụ định giá cao, giúp cổ phiếu liên quan bật tăng mạnh và thu hút dòng tiền lớn.',
    tickers: ['VNM', 'SAB', 'BVH', 'MSN', 'HPG']
  },
  {
    slug: 'my-ap-thue-quan',
    label: 'Mỹ áp thuế quan',
    lifecycle: 'growing',
    description:
      'Rủi ro thương mại từ bên ngoài làm giảm biên lợi nhuận của các ngành xuất khẩu (thủy sản, dệt may), nhưng có thể thúc đẩy làn sóng dịch chuyển nhà máy, có lợi cho hạ tầng khu công nghiệp.',
    tickers: ['VHC', 'ASM', 'GIL', 'KBC', 'SIP', 'IDC']
  },
  {
    slug: 'nang-hang-ftse',
    label: 'Nâng hạng thị trường FTSE',
    lifecycle: 'peak',
    description:
      'Bước ngoặt thay đổi vị thế của chứng khoán Việt Nam từ cận biên lên mới nổi, giúp kích hoạt dòng vốn ngoại khổng lồ từ các quỹ ETF quốc tế bắt buộc phải giải ngân vào các mã vốn hóa lớn.',
    tickers: ['VCB', 'VHM', 'FPT', 'HPG', 'MWG', 'VIC']
  },
  {
    slug: 'giai-ngan-dau-tu-cong',
    label: 'Giải ngân đầu tư công',
    lifecycle: 'trending',
    description:
      'Hành động bơm tiền thực tế từ ngân sách vào nền kinh tế; tiến độ giải ngân càng nhanh thì doanh thu, lợi nhuận của nhóm hạ tầng, đá, thép, xi măng càng sớm được ghi nhận.',
    tickers: ['VCG', 'HHV', 'IDC', 'CII', 'HPG', 'NKG']
  }
];

let foundationReady = false;

async function ensureFoundationChuDe() {
  if (foundationReady) return;
  await seedFoundationChuDe();
  foundationReady = true;
}

async function seedFoundationChuDe() {
  const out = [];
  for (let i = 0; i < FOUNDATION_CHU_DE.length; i++) {
    const item = FOUNDATION_CHU_DE[i];
    const existing = await query('SELECT id FROM content_chu_de WHERE slug = $1 LIMIT 1', [item.slug]);
    let chuDeId;
    if (existing.rows[0]) {
      chuDeId = existing.rows[0].id;
      await query(
        `UPDATE content_chu_de SET
           label = $2,
           lifecycle = COALESCE(NULLIF(lifecycle, ''), $3),
           status = CASE WHEN status IN ('archived','retired') THEN status ELSE 'active' END,
           meta = COALESCE(meta, '{}'::jsonb) || $4::jsonb,
           updated_at = NOW()
         WHERE id = $1`,
        [
          chuDeId,
          item.label,
          item.lifecycle,
          JSON.stringify({
            description: item.description,
            source: 'foundation'
          })
        ]
      );
    } else {
      chuDeId = 'chu_de_' + item.slug;
      await query(
        `INSERT INTO content_chu_de
           (id, slug, label, status, interest_score, lifecycle, meta, promoted_at, promoted_by, created_at, updated_at)
         VALUES ($1,$2,$3,'active',70,$4,$5::jsonb,NOW(),'admin',NOW(),NOW())
         ON CONFLICT (slug) DO UPDATE SET
           label = EXCLUDED.label,
           meta = content_chu_de.meta || EXCLUDED.meta,
           updated_at = NOW()`,
        [
          chuDeId,
          item.slug,
          item.label,
          item.lifecycle,
          JSON.stringify({
            description: item.description,
            source: 'foundation'
          })
        ]
      );
      const again = await query('SELECT id FROM content_chu_de WHERE slug = $1 LIMIT 1', [item.slug]);
      chuDeId = again.rows[0].id;
    }

    for (let t = 0; t < item.tickers.length; t++) {
      const ticker = item.tickers[t];
      await query(
        `INSERT INTO content_chu_de_mappings
           (chu_de_id, ticker, entity_label, relevance_score, mention_count, status, method, meta)
         VALUES ($1,$2,$2,$3,1,'active','seed', '{"source":"foundation"}'::jsonb)
         ON CONFLICT (chu_de_id, ticker) DO UPDATE SET
           status = 'active',
           updated_at = NOW()`,
        [chuDeId, ticker, Math.max(0.4, 1 - t * 0.08)]
      );
    }
    await query(
      `UPDATE content_chu_de SET
         mapping_count = (SELECT COUNT(*)::int FROM content_chu_de_mappings WHERE chu_de_id = $1 AND status = 'active'),
         updated_at = NOW()
       WHERE id = $1`,
      [chuDeId]
    );
    out.push({ id: chuDeId, slug: item.slug, label: item.label });
  }
  return { seeded: out.length, items: out };
}

async function upsertChuDeAdmin(input, actor) {
  input = input || {};
  const label = String(input.label || input.name || '').trim();
  if (!label) {
    const err = new Error('Tên chủ đề là bắt buộc');
    err.statusCode = 400;
    throw err;
  }
  const slug = slugify(input.slug || label);
  const lifecycle = input.lifecycle || 'emerging';
  const status = input.status || 'active';
  const description = String(input.description || '').trim();
  const tickers = Array.isArray(input.tickers)
    ? input.tickers.map(function (t) { return String(t || '').trim().toUpperCase(); }).filter(Boolean).slice(0, 20)
    : null;

  let row = null;
  if (input.id) {
    const byId = await query('SELECT * FROM content_chu_de WHERE id = $1 LIMIT 1', [input.id]);
    row = byId.rows[0] || null;
  }
  if (!row) {
    const bySlug = await query('SELECT * FROM content_chu_de WHERE slug = $1 LIMIT 1', [slug]);
    row = bySlug.rows[0] || null;
  }

  const metaPatch = {
    description: description,
    created_by: (actor && (actor.name || actor.id)) || 'Admin',
    source: (row && row.meta && row.meta.source) || input.source || 'admin'
  };

  if (row) {
    const upd = await query(
      `UPDATE content_chu_de SET
         label = $2,
         slug = $3,
         lifecycle = $4,
         status = $5,
         meta = COALESCE(meta, '{}'::jsonb) || $6::jsonb,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [row.id, label, slug, lifecycle, status, JSON.stringify(metaPatch)]
    );
    row = upd.rows[0];
  } else {
    const id = input.id || newId('chu_de');
    const ins = await query(
      `INSERT INTO content_chu_de
         (id, slug, label, status, interest_score, lifecycle, meta, promoted_at, promoted_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,1,$5,$6::jsonb,NOW(),$7,NOW(),NOW())
       RETURNING *`,
      [
        id,
        slug,
        label,
        status,
        lifecycle,
        JSON.stringify(metaPatch),
        (actor && (actor.name || actor.id)) || 'Admin'
      ]
    );
    row = ins.rows[0];
  }

  if (tickers) {
    for (let i = 0; i < tickers.length; i++) {
      await query(
        `INSERT INTO content_chu_de_mappings
           (chu_de_id, ticker, entity_label, relevance_score, mention_count, status, method, meta)
         VALUES ($1,$2,$2,$3,1,'active','admin','{}'::jsonb)
         ON CONFLICT (chu_de_id, ticker) DO UPDATE SET status = 'active', updated_at = NOW()`,
        [row.id, tickers[i], Math.max(0.4, 1 - i * 0.08)]
      );
    }
    await query(
      `UPDATE content_chu_de SET
         mapping_count = (SELECT COUNT(*)::int FROM content_chu_de_mappings WHERE chu_de_id = $1 AND status = 'active'),
         updated_at = NOW()
       WHERE id = $1`,
      [row.id]
    );
    const refreshed = await query('SELECT * FROM content_chu_de WHERE id = $1', [row.id]);
    row = refreshed.rows[0];
  }

  return rowToChuDeAdmin(row);
}

async function archiveChuDeAdmin(idOrSlug) {
  const story = await getStory(idOrSlug);
  if (!story) {
    const err = new Error('Không tìm thấy chủ đề');
    err.statusCode = 404;
    throw err;
  }
  const upd = await query(
    `UPDATE content_chu_de SET status = 'archived', lifecycle = 'archived', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [story.id]
  );
  return rowToChuDeAdmin(upd.rows[0]);
}

/**
 * Top topics theo Interest trong period — shape cho WGT-COM-CHUDE-TOP.
 */
async function listTrendingTopics(filters) {
  filters = filters || {};
  await ensureSeeded();
  const periodKey = filters.period || 'week';
  await recomputeInterestScores({ period: periodKey, config: filters.config });

  const cfg = interestConfig(filters.config);
  const ms = PERIOD_MS[periodKey] || PERIOD_MS.week;
  const since = new Date(Date.now() - ms).toISOString();
  const limit = filters.limit ? Number(filters.limit) : 10;

  const res = await query(
    `SELECT t.id, t.slug, t.label, t.status, t.chu_de_id, t.article_count,
            t.interest_score AS stored_score,
            COUNT(*) FILTER (WHERE e.event_type = 'view')::int AS views,
            COUNT(*) FILTER (WHERE e.event_type = 'search')::int AS searches,
            COUNT(*) FILTER (WHERE e.event_type = 'like')::int AS likes,
            COUNT(*) FILTER (WHERE e.event_type = 'favorite')::int AS favorites,
            COUNT(*) FILTER (WHERE e.event_type = 'share')::int AS shares,
            COUNT(*) FILTER (WHERE e.event_type = 'comment')::int AS comments
     FROM content_chu_de_candidates t
     LEFT JOIN content_interest_events e
       ON e.candidate_id = t.id AND e.created_at >= $1
     WHERE t.status IN ('building', 'candidate', 'promoted')
     GROUP BY t.id
     ORDER BY
       (
         COUNT(*) FILTER (WHERE e.event_type = 'view') * $2 +
         COUNT(*) FILTER (WHERE e.event_type = 'search') * $3 +
         COUNT(*) FILTER (WHERE e.event_type = 'like') * $4 +
         COUNT(*) FILTER (WHERE e.event_type = 'favorite') * $5 +
         COUNT(*) FILTER (WHERE e.event_type = 'share') * $6 +
         COUNT(*) FILTER (WHERE e.event_type = 'comment') * $7
       ) DESC,
       t.article_count DESC
     LIMIT $8`,
    [since, cfg.view, cfg.search, cfg.like, cfg.favorite, cfg.share, cfg.comment, limit]
  );

  const mapped = res.rows.map(function (row, idx) {
    const parts = {
      views: row.views || 0,
      searches: row.searches || 0,
      likes: row.likes || 0,
      favorites: row.favorites || 0,
      shares: row.shares || 0,
      comments: row.comments || 0
    };
    const score = scoreFromParts(parts, cfg);
    return {
      id: row.chu_de_id || row.id,
      candidate_id: row.id,
      chu_de_id: row.chu_de_id || null,
      slug: row.slug,
      name: row.label,
      label: row.label,
      status: row.status,
      period: periodKey,
      period_days: PERIOD_DAYS[periodKey] || 7,
      top_n: limit,
      score: score,
      views: parts.views,
      searches: parts.searches,
      likes: parts.likes,
      comments: parts.comments,
      shares: parts.shares,
      favorites: parts.favorites,
      rank: idx + 1,
      article_count: row.article_count,
      href: row.chu_de_id || row.status === 'promoted'
        ? '/stories/' + encodeURIComponent(row.slug)
        : '/community/topic.html?topic=' + encodeURIComponent(row.slug)
    };
  });

  for (let i = 0; i < mapped.length; i++) {
    if (!mapped[i].chu_de_id) continue;
    try {
      const st = await query(
        `SELECT lifecycle, flow_net_value, top_relevance, mapping_count FROM content_chu_de WHERE id = $1`,
        [mapped[i].chu_de_id]
      );
      if (st.rows[0]) {
        mapped[i].lifecycle = st.rows[0].lifecycle;
        mapped[i].flow_net_value = Number(st.rows[0].flow_net_value) || 0;
        mapped[i].top_relevance = Number(st.rows[0].top_relevance) || 0;
        mapped[i].mapping_count = st.rows[0].mapping_count || 0;
      }
      const maps = await query(
        `SELECT ticker, relevance_score, mention_count
         FROM content_chu_de_mappings
         WHERE chu_de_id = $1 AND status = 'active'
         ORDER BY relevance_score DESC LIMIT 5`,
        [mapped[i].chu_de_id]
      );
      mapped[i].mappings = maps.rows.map(function (m, mi) {
        return {
          ticker: m.ticker,
          relevance_score: Number(m.relevance_score) || 0,
          mention_count: m.mention_count || 0,
          rank: mi + 1
        };
      });
    } catch (e) {
      /* bảng P2 chưa migrate — bỏ qua enrich */
    }
  }
  return mapped;
}

/* ===================== P2: Relevance + Auto-promote + Flow snapshot ===================== */

const RELEVANCE_WEIGHTS = {
  mention: 10,
  view: 1,
  like: 5,
  favorite: 8,
  share: 8,
  comment: 10,
  follow: 12
};

function relevanceConfig(overrides) {
  const o = overrides || {};
  const base = interestConfig(o);
  return Object.assign({}, base, {
    mention: o.relevance_w_mention != null ? Number(o.relevance_w_mention) : RELEVANCE_WEIGHTS.mention,
    follow: o.relevance_w_follow != null ? Number(o.relevance_w_follow) : RELEVANCE_WEIGHTS.follow,
    autoPromoteEnabled: o.topic_auto_promote === true || o.topic_auto_promote === 'true',
    autoPromoteMinInterest: o.topic_auto_promote_min_interest != null
      ? Number(o.topic_auto_promote_min_interest)
      : 50,
    autoPromoteMinStocks: o.topic_auto_promote_min_stocks != null
      ? Number(o.topic_auto_promote_min_stocks)
      : 2,
    mappingKeepMinScore: o.relevance_keep_min != null ? Number(o.relevance_keep_min) : 1
  });
}

function relevanceScoreFromParts(parts, cfg) {
  const w = cfg || RELEVANCE_WEIGHTS;
  const conf = parts.confidence_avg != null ? Number(parts.confidence_avg) : 0.5;
  return (
    (parts.mention_count || 0) * (w.mention || RELEVANCE_WEIGHTS.mention) * Math.max(conf, 0.2) +
    (parts.views || 0) * (w.view != null ? w.view : RELEVANCE_WEIGHTS.view) +
    (parts.likes || 0) * (w.like != null ? w.like : RELEVANCE_WEIGHTS.like) +
    (parts.favorites || 0) * (w.favorite != null ? w.favorite : RELEVANCE_WEIGHTS.favorite) +
    (parts.shares || 0) * (w.share != null ? w.share : RELEVANCE_WEIGHTS.share) +
    (parts.comments || 0) * (w.comment != null ? w.comment : RELEVANCE_WEIGHTS.comment) +
    (parts.follows || 0) * (w.follow || RELEVANCE_WEIGHTS.follow)
  );
}

/** Deterministic Flow snapshot placeholder until Money Flow Engine wires story membership. */
function flowSnapshotForTickers(tickers) {
  let buy = 0;
  let sell = 0;
  (tickers || []).forEach(function (tk, i) {
    let h = 0;
    const s = String(tk || '');
    for (let j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) >>> 0;
    const base = 5e8 + (h % 25e8) + i * 1.1e8;
    const skew = ((h % 100) - 45) / 100;
    buy += base * (1 + Math.max(skew, 0));
    sell += base * (1 + Math.max(-skew, 0));
  });
  return {
    flow_buy_value: Math.round(buy),
    flow_sell_value: Math.round(sell),
    flow_net_value: Math.round(buy - sell),
    flow_updated_at: new Date().toISOString(),
    method: 'content_engine_stub'
  };
}

function lifecycleFromSignals(interestScore, mappingCount, flowNet) {
  const interest = Number(interestScore) || 0;
  const maps = Number(mappingCount) || 0;
  const net = Number(flowNet) || 0;
  if (interest < 15 && maps < 1) return 'emerging';
  if (interest >= 80 && maps >= 3 && net > 0) return 'peak';
  if (interest >= 55 && maps >= 2) return 'trending';
  if (interest >= 30 || maps >= 1) return 'growing';
  if (interest < 20 && net < 0) return 'fading';
  return 'emerging';
}

async function recordRelevanceEvent(input) {
  input = input || {};
  const type = String(input.event_type || input.type || '').toLowerCase();
  const allowed = ['view', 'like', 'favorite', 'share', 'comment', 'follow'];
  if (allowed.indexOf(type) < 0) {
    const err = new Error('event_type phải là: ' + allowed.join(', '));
    err.statusCode = 400;
    throw err;
  }
  const ticker = String(input.ticker || input.symbol || '').toUpperCase().trim();
  if (!ticker) {
    const err = new Error('Thiếu ticker');
    err.statusCode = 400;
    throw err;
  }
  let storyId = input.chu_de_id || null;
  let topicId = input.candidate_id || null;
  if (!topicId && input.topic) topicId = await resolveTopicId(input.topic);
  if (!storyId && topicId) {
    const t = await query('SELECT chu_de_id FROM content_chu_de_candidates WHERE id = $1', [topicId]);
    storyId = (t.rows[0] && t.rows[0].chu_de_id) || null;
  }
  if (!storyId && input.slug) {
    const s = await query('SELECT id FROM content_chu_de WHERE slug = $1 LIMIT 1', [slugify(input.slug)]);
    storyId = s.rows[0] ? s.rows[0].id : null;
  }
  const res = await query(
    `INSERT INTO content_relevance_events
       (chu_de_id, candidate_id, ticker, event_type, user_id, article_id, weight, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING *`,
    [
      storyId,
      topicId,
      ticker,
      type,
      input.user_id || null,
      input.article_id || null,
      input.weight != null ? Number(input.weight) : 1,
      JSON.stringify(input.meta || {})
    ]
  );
  if (storyId) {
    await recomputeRelevanceScores({ storyId: storyId, config: input.config });
  }
  return res.rows[0];
}

/**
 * Cumulative Relevance Score Story ↔ Stock.
 * Nguồn: mention entity trên bài thuộc Topic gốc + content_relevance_events.
 */
async function recomputeRelevanceScores(opts) {
  opts = opts || {};
  await ensureSeeded();
  const cfg = relevanceConfig(opts.config);
  const params = [];
  let storyFilter = '';
  if (opts.storyId) {
    params.push(opts.storyId);
    storyFilter = ` AND s.id = $${params.length}`;
  }

  const agg = await query(
    `WITH story_topics AS (
       SELECT s.id AS chu_de_id, t.id AS candidate_id
       FROM content_chu_de s
       LEFT JOIN content_chu_de_candidates t
         ON t.chu_de_id = s.id OR t.id = s.origin_candidate_id
       WHERE 1=1` + storyFilter + `
     ),
     mentions AS (
       SELECT st.chu_de_id,
              UPPER(e.entity_id) AS ticker,
              COALESCE(MAX(e.entity_label), UPPER(e.entity_id)) AS entity_label,
              COUNT(DISTINCT e.article_id)::int AS mention_count,
              AVG(COALESCE(e.confidence, 0.5))::float AS confidence_avg
       FROM story_topics st
       JOIN content_article_chu_de_candidates at ON at.candidate_id = st.candidate_id
       JOIN content_article_entities e
         ON e.article_id = at.article_id AND e.entity_type = 'stock'
       GROUP BY st.chu_de_id, UPPER(e.entity_id)
     ),
     signals AS (
       SELECT COALESCE(r.chu_de_id, st.chu_de_id) AS chu_de_id,
              UPPER(r.ticker) AS ticker,
              COUNT(*) FILTER (WHERE r.event_type = 'view')::int AS views,
              COUNT(*) FILTER (WHERE r.event_type = 'like')::int AS likes,
              COUNT(*) FILTER (WHERE r.event_type = 'favorite')::int AS favorites,
              COUNT(*) FILTER (WHERE r.event_type = 'share')::int AS shares,
              COUNT(*) FILTER (WHERE r.event_type = 'comment')::int AS comments,
              COUNT(*) FILTER (WHERE r.event_type = 'follow')::int AS follows
       FROM content_relevance_events r
       LEFT JOIN story_topics st ON st.candidate_id = r.candidate_id OR st.chu_de_id = r.chu_de_id
       WHERE COALESCE(r.chu_de_id, st.chu_de_id) IS NOT NULL
       GROUP BY COALESCE(r.chu_de_id, st.chu_de_id), UPPER(r.ticker)
     )
     SELECT COALESCE(m.chu_de_id, sig.chu_de_id) AS chu_de_id,
            COALESCE(m.ticker, sig.ticker) AS ticker,
            COALESCE(m.entity_label, COALESCE(m.ticker, sig.ticker)) AS entity_label,
            COALESCE(m.mention_count, 0) AS mention_count,
            COALESCE(m.confidence_avg, 0.5) AS confidence_avg,
            COALESCE(sig.views, 0) AS views,
            COALESCE(sig.likes, 0) AS likes,
            COALESCE(sig.favorites, 0) AS favorites,
            COALESCE(sig.shares, 0) AS shares,
            COALESCE(sig.comments, 0) AS comments,
            COALESCE(sig.follows, 0) AS follows
     FROM mentions m
     FULL OUTER JOIN signals sig
       ON sig.chu_de_id = m.chu_de_id AND sig.ticker = m.ticker`,
    params
  );

  const byStory = {};
  let upserted = 0;
  for (let i = 0; i < agg.rows.length; i++) {
    const row = agg.rows[i];
    if (!row.chu_de_id || !row.ticker) continue;
    const parts = {
      mention_count: row.mention_count || 0,
      confidence_avg: row.confidence_avg || 0.5,
      views: row.views || 0,
      likes: row.likes || 0,
      favorites: row.favorites || 0,
      shares: row.shares || 0,
      comments: row.comments || 0,
      follows: row.follows || 0
    };
    const score = relevanceScoreFromParts(parts, cfg);
    if (score < cfg.mappingKeepMinScore && parts.mention_count < 1) continue;
    await query(
      `INSERT INTO content_chu_de_mappings
         (chu_de_id, ticker, entity_label, relevance_score, mention_count, confidence_avg,
          views, likes, comments, shares, favorites, status, method, computed_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active','auto',NOW(),NOW())
       ON CONFLICT (chu_de_id, ticker) DO UPDATE SET
         entity_label = EXCLUDED.entity_label,
         relevance_score = EXCLUDED.relevance_score,
         mention_count = EXCLUDED.mention_count,
         confidence_avg = EXCLUDED.confidence_avg,
         views = EXCLUDED.views,
         likes = EXCLUDED.likes,
         comments = EXCLUDED.comments,
         shares = EXCLUDED.shares,
         favorites = EXCLUDED.favorites,
         computed_at = NOW(),
         updated_at = NOW()`,
      [
        row.chu_de_id,
        row.ticker,
        row.entity_label || row.ticker,
        Math.round(score * 100) / 100,
        parts.mention_count,
        Math.round(parts.confidence_avg * 1000) / 1000,
        parts.views,
        parts.likes,
        parts.comments,
        parts.shares,
        parts.favorites
      ]
    );
    upserted += 1;
    if (!byStory[row.chu_de_id]) byStory[row.chu_de_id] = [];
    byStory[row.chu_de_id].push(row.ticker);
  }

  const storyIds = Object.keys(byStory);
  if (!storyIds.length && opts.storyId) storyIds.push(opts.storyId);

  const allStories = opts.storyId
    ? [{ id: opts.storyId }]
    : (await query('SELECT id FROM content_chu_de')).rows;

  for (let s = 0; s < allStories.length; s++) {
    const sid = allStories[s].id;
    const maps = await query(
      `SELECT ticker, relevance_score FROM content_chu_de_mappings
       WHERE chu_de_id = $1 AND status = 'active'
       ORDER BY relevance_score DESC`,
      [sid]
    );
    const tickers = maps.rows.map(function (r) { return r.ticker; });
    const flow = flowSnapshotForTickers(tickers);
    const topRel = maps.rows[0] ? Number(maps.rows[0].relevance_score) : 0;
    const storyRow = await query('SELECT interest_score FROM content_chu_de WHERE id = $1', [sid]);
    const interest = storyRow.rows[0] ? Number(storyRow.rows[0].interest_score) : 0;
    const life = lifecycleFromSignals(interest, maps.rows.length, flow.flow_net_value);
    await query(
      `UPDATE content_chu_de SET
         mapping_count = $2,
         top_relevance = $3,
         flow_buy_value = $4,
         flow_sell_value = $5,
         flow_net_value = $6,
         flow_updated_at = NOW(),
         lifecycle = $7,
         meta = COALESCE(meta, '{}'::jsonb) || $8::jsonb,
         updated_at = NOW()
       WHERE id = $1`,
      [
        sid,
        maps.rows.length,
        topRel,
        flow.flow_buy_value,
        flow.flow_sell_value,
        flow.flow_net_value,
        life,
        JSON.stringify({ flow: flow })
      ]
    );
  }

  return { upserted, stories: allStories.length, weights: cfg };
}

async function listStoryMappings(filters) {
  filters = filters || {};
  await ensureSeeded();
  var chuDeId = filters.chu_de_id || filters.story_id || filters.storyId || null;
  if (filters.recompute) {
    await recomputeRelevanceScores({
      storyId: chuDeId,
      config: filters.config
    });
  }
  const params = [];
  let sql =
    `SELECT m.*, s.slug AS story_slug, s.label AS story_label, s.lifecycle, s.flow_net_value
     FROM content_chu_de_mappings m
     JOIN content_chu_de s ON s.id = m.chu_de_id
     WHERE m.status = 'active'`;
  if (chuDeId) {
    params.push(chuDeId);
    sql += ` AND m.chu_de_id = $${params.length}`;
  }
  if (filters.slug) {
    params.push(slugify(filters.slug));
    sql += ` AND s.slug = $${params.length}`;
  }
  if (filters.ticker) {
    params.push(String(filters.ticker).toUpperCase());
    sql += ` AND m.ticker = $${params.length}`;
  }
  sql += ' ORDER BY m.relevance_score DESC, m.mention_count DESC';
  params.push(filters.limit ? Number(filters.limit) : 50);
  sql += ` LIMIT $${params.length}`;
  const res = await query(sql, params);
  return res.rows;
}

async function getStory(ref) {
  await ensureSeeded();
  let res = await query('SELECT * FROM content_chu_de WHERE id = $1 LIMIT 1', [ref]);
  if (!res.rows[0]) {
    res = await query('SELECT * FROM content_chu_de WHERE slug = $1 LIMIT 1', [slugify(ref)]);
  }
  const story = res.rows[0];
  if (!story) return null;
  const mappings = await listStoryMappings({ chu_de_id: story.id, limit: 30 });
  return Object.assign({}, story, { mappings: mappings });
}

/**
 * Auto-promote candidates khi bật topic_auto_promote + đủ Interest + ≥N mã đề xuất.
 */
async function autoPromoteCandidates(opts) {
  opts = opts || {};
  await ensureSeeded();
  const cfg = relevanceConfig(opts.config);
  if (!cfg.autoPromoteEnabled && !opts.forceRun) {
    return { enabled: false, promoted: [], skipped: 'topic_auto_promote=false' };
  }
  await recomputeInterestScores({ period: opts.period || 'week', config: opts.config });
  const candidates = await query(
    `SELECT t.* FROM content_chu_de_candidates t
     WHERE t.status = 'candidate'
       AND t.interest_score >= $1
       AND t.article_count >= $2
     ORDER BY t.interest_score DESC
     LIMIT $3`,
    [cfg.autoPromoteMinInterest, cfg.promoteMinArticles, opts.limit ? Number(opts.limit) : 20]
  );

  const promoted = [];
  for (let i = 0; i < candidates.rows.length; i++) {
    const topic = candidates.rows[i];
    const stockRes = await query(
      `SELECT COUNT(DISTINCT UPPER(e.entity_id))::int AS n
       FROM content_article_chu_de_candidates at
       JOIN content_article_entities e
         ON e.article_id = at.article_id AND e.entity_type = 'stock'
       WHERE at.candidate_id = $1`,
      [topic.id]
    );
    const stockN = stockRes.rows[0] ? stockRes.rows[0].n : 0;
    if (stockN < cfg.autoPromoteMinStocks && !opts.force) continue;
    const result = await promoteTopic(topic.id, {
      reason: 'auto: interest>=' + cfg.autoPromoteMinInterest +
        ' articles>=' + cfg.promoteMinArticles +
        ' stocks>=' + cfg.autoPromoteMinStocks,
      force: true,
      promoted_by: opts.promoted_by || 'auto_promote'
    });
    if (result.story) {
      await recomputeRelevanceScores({ storyId: result.story.id, config: opts.config });
    }
    promoted.push({
      candidate_id: topic.id,
      slug: topic.slug,
      chu_de_id: result.story && result.story.id,
      stocks: stockN,
      already: !!result.already
    });
  }
  return { enabled: true, promoted: promoted, total: promoted.length, config: cfg };
}

/* Hook promote → ngay lập tức tính Relevance + Flow stub */
const _promoteTopicBase = promoteTopic;
async function promoteTopicWithRelevance(topicRef, opts) {
  const result = await _promoteTopicBase(topicRef, opts);
  if (result && result.story && result.story.id) {
    try {
      await recomputeRelevanceScores({ storyId: result.story.id, config: opts && opts.config });
      const enriched = await getStory(result.story.id);
      return Object.assign({}, result, { story: enriched || result.story });
    } catch (e) {
      return result;
    }
  }
  return result;
}

module.exports = {
  ingestArticle,
  listArticles,
  getArticle,
  updateContentArticle,
  applyArticleCompleteness,
  countNeedsReview,
  listTopics,
  getFeed,
  articleToNewsCard,
  ensureSeeded,
  ensureTopic,
  slugify,
  recordInterestEvent,
  recomputeInterestScores,
  markCandidates,
  promoteTopic: promoteTopicWithRelevance,
  listStories,
  listChuDe: listStories,
  listTrendingTopics,
  recordRelevanceEvent,
  recomputeRelevanceScores,
  listStoryMappings,
  listChuDeMappings: listStoryMappings,
  getStory,
  getChuDe: getStory,
  autoPromoteCandidates,
  upsertChuDeAdmin,
  upsertChuDe: upsertChuDeAdmin,
  archiveChuDeAdmin,
  seedFoundationChuDe,
  ensureFoundationChuDe,
  INTEREST_WEIGHTS,
  RELEVANCE_WEIGHTS,
  PERIOD_DAYS,
  scoreFromParts,
  relevanceScoreFromParts
};
