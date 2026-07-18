'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const categories = require('./community-categories.service');

const STATUSES = ['draft', 'pending', 'published', 'scheduled'];

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160);
}

function uniqUpper(arr, max) {
  const out = [];
  const seen = {};
  (arr || []).forEach(function (x) {
    const v = String(x || '').trim().toUpperCase();
    if (!v || seen[v]) return;
    seen[v] = true;
    out.push(v);
  });
  return out.slice(0, max);
}

function uniqSlug(arr, max) {
  const out = [];
  const seen = {};
  (arr || []).forEach(function (x) {
    const v = slugify(x) || String(x || '').trim();
    if (!v || seen[v]) return;
    seen[v] = true;
    out.push(v);
  });
  return out.slice(0, max);
}

function rowToArticle(row) {
  if (!row) return null;
  const p = row.payload || {};
  return Object.assign({}, p, {
    id: p.id || row.id,
    status: p.status || row.status,
    content_type: p.content_type || row.content_type || 'article',
    user_id: row.user_id || p.user_id || null,
    created_at: p.created_at || row.created_at,
    updated_at: p.updated_at || row.updated_at
  });
}

function normalizeArticleInput(input, actor) {
  const title = String(input.title || '').trim();
  if (!title) throw AppError.badRequest('ARTICLE_TITLE_REQUIRED', 'Tiêu đề là bắt buộc');

  const categoryId = input.category_id || null;
  if (!categoryId) throw AppError.badRequest('ARTICLE_CATEGORY_REQUIRED', 'Danh mục là bắt buộc (chọn đúng 1)');

  const chuDeId = input.chu_de_id || (input.chu_de && input.chu_de.id) || null;
  const chuDeSlug = input.chu_de_slug || (input.chu_de && input.chu_de.slug) || '';
  const chuDeName = input.chu_de_name || (input.chu_de && (input.chu_de.name || input.chu_de.label)) || '';
  if (!chuDeId && !chuDeSlug && !chuDeName) {
    throw AppError.badRequest('ARTICLE_CHU_DE_REQUIRED', 'Chủ đề là bắt buộc (chọn đúng 1)');
  }

  const tickers = uniqUpper(input.tickers, 5);
  const sectors = uniqSlug(input.sectors, 3);
  const ecosystems = uniqSlug(input.ecosystems, 3);
  let exchange = input.exchange != null ? String(input.exchange).trim() : '';
  if (exchange) exchange = exchange.toUpperCase() === 'VNINDEX' ? 'VNIndex' : exchange;

  const attachedKinds =
    (tickers.length ? 1 : 0) +
    (sectors.length ? 1 : 0) +
    (ecosystems.length ? 1 : 0) +
    (exchange ? 1 : 0);
  if (attachedKinds > 1) {
    throw AppError.badRequest(
      'ARTICLE_ENTITY_XOR',
      'Chỉ gắn một nhóm: cổ phiếu (0–5) hoặc ngành (0–3) hoặc hệ sinh thái (0–3) hoặc sàn (0–1)'
    );
  }

  const status = STATUSES.indexOf(input.status) >= 0 ? input.status : 'draft';
  const slug = slugify(input.slug || title) || 'bai-viet-' + Date.now();
  const excerpt = String(input.excerpt || '').trim();
  const bodyHtml = String(input.body_html || input.body || '').trim();
  const seo = input.seo || {};
  const display = input.display || {};
  const cover = input.cover || {};

  return {
    title,
    slug,
    excerpt,
    body_html: bodyHtml,
    content_type: input.content_type || 'article',
    category_id: categoryId,
    category_name: String(input.category_name || '').trim(),
    chu_de_id: chuDeId,
    chu_de_slug: slugify(chuDeSlug || chuDeName),
    chu_de_name: chuDeName || chuDeSlug,
    tickers,
    sectors,
    ecosystems,
    exchange: exchange || null,
    cover: {
      url: String(cover.url || input.cover_url || '').trim(),
      alt: String(cover.alt || '').trim(),
      caption: String(cover.caption || '').trim(),
      credit: String(cover.credit || '').trim()
    },
    seo: {
      title: String(seo.title || seo.seo_title || '').trim() || title,
      description: String(seo.description || seo.seo_description || '').trim() || excerpt,
      keywords: String(seo.keywords || seo.seo_keywords || '').trim(),
      canonical: String(seo.canonical || seo.canonical_url || '').trim()
    },
    status,
    display: {
      featured: !!display.featured,
      pin: !!(display.pin || display.sticky),
      comments: display.comments !== false,
      share: display.share !== false
    },
    scheduled_at: status === 'scheduled' ? (input.scheduled_at || input.publish_at || null) : null,
    published_at: status === 'published' ? (input.published_at || new Date().toISOString()) : null,
    author: input.author || {
      id: actor && actor.id ? actor.id : 'admin',
      display_name: (actor && (actor.name || actor.email)) || 'Admin',
      tier: (actor && actor.tier) || 'admin',
      tier_label: (actor && actor.tier_label) || 'Admin'
    }
  };
}

async function ensureChuDe(normalized) {
  if (normalized.chu_de_id) {
    const byId = await query('SELECT id, slug, label FROM content_chu_de WHERE id = $1 LIMIT 1', [normalized.chu_de_id]);
    if (byId.rows[0]) {
      return {
        id: byId.rows[0].id,
        slug: byId.rows[0].slug,
        name: byId.rows[0].label
      };
    }
  }
  const slug = normalized.chu_de_slug || slugify(normalized.chu_de_name);
  if (!slug) throw AppError.badRequest('ARTICLE_CHU_DE_REQUIRED', 'Chủ đề không hợp lệ');

  const bySlug = await query('SELECT id, slug, label FROM content_chu_de WHERE slug = $1 LIMIT 1', [slug]);
  if (bySlug.rows[0]) {
    return {
      id: bySlug.rows[0].id,
      slug: bySlug.rows[0].slug,
      name: bySlug.rows[0].label
    };
  }

  const id = 'chu_de_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const label = normalized.chu_de_name || slug;
  await query(
    `INSERT INTO content_chu_de (id, slug, label, status, interest_score, meta, created_at, updated_at)
     VALUES ($1,$2,$3,'active',1,'{}'::jsonb,NOW(),NOW())
     ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
     RETURNING id, slug, label`,
    [id, slug, label]
  );
  const again = await query('SELECT id, slug, label FROM content_chu_de WHERE slug = $1 LIMIT 1', [slug]);
  return {
    id: again.rows[0].id,
    slug: again.rows[0].slug,
    name: again.rows[0].label
  };
}

async function bumpChuDeStats(chuDe, tickers) {
  if (!chuDe || !chuDe.id) return;
  try {
    await query(
      `UPDATE content_chu_de SET
         meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object(
           'post_count', COALESCE((meta->>'post_count')::int, 0) + 1
         ),
         updated_at = NOW()
       WHERE id = $1`,
      [chuDe.id]
    );
  } catch (e) { /* optional column shape */ }

  for (let i = 0; i < (tickers || []).length; i++) {
    const ticker = tickers[i];
    try {
      await query(
        `INSERT INTO content_chu_de_mappings (chu_de_id, ticker, entity_label, relevance_score, mention_count, status, method, meta)
         VALUES ($1,$2,$2,1,1,'active','article','{}'::jsonb)
         ON CONFLICT (chu_de_id, ticker) DO UPDATE SET
           mention_count = content_chu_de_mappings.mention_count + 1,
           relevance_score = content_chu_de_mappings.relevance_score + 1,
           updated_at = NOW()`,
        [chuDe.id, ticker]
      );
    } catch (e) { /* mapping table may differ */ }
  }
}

async function listArticles(filters) {
  filters = filters || {};
  const params = [];
  let sql = 'SELECT * FROM community_posts WHERE 1=1';
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  } else if (!filters.include_all) {
    params.push('published');
    sql += ` AND status = $${params.length}`;
  }
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(payload->>'title') LIKE $${params.length} OR LOWER(payload->>'slug') LIKE $${params.length})`;
  }
  if (filters.category_id) {
    params.push(filters.category_id);
    sql += ` AND payload->>'category_id' = $${params.length}`;
  }
  if (filters.chu_de_id) {
    params.push(filters.chu_de_id);
    sql += ` AND payload->>'chu_de_id' = $${params.length}`;
  }
  sql += ' ORDER BY COALESCE((payload->>\'published_at\')::timestamptz, created_at) DESC';
  if (filters.limit) {
    params.push(Number(filters.limit));
    sql += ` LIMIT $${params.length}`;
  }
  const res = await query(sql, params);
  return res.rows.map(rowToArticle);
}

async function getArticle(idOrSlug) {
  const byId = await query('SELECT * FROM community_posts WHERE id = $1 LIMIT 1', [idOrSlug]);
  if (byId.rows[0]) return rowToArticle(byId.rows[0]);
  const bySlug = await query(`SELECT * FROM community_posts WHERE payload->>'slug' = $1 LIMIT 1`, [idOrSlug]);
  return rowToArticle(bySlug.rows[0]);
}

async function createArticle(input, actor) {
  const normalized = normalizeArticleInput(input, actor);
  const cat = await categories.getCategory(normalized.category_id);
  if (!cat) throw AppError.badRequest('ARTICLE_CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
  normalized.category_name = cat.name;

  const chuDe = await ensureChuDe(normalized);
  normalized.chu_de_id = chuDe.id;
  normalized.chu_de_slug = chuDe.slug;
  normalized.chu_de_name = chuDe.name;

  const id = input.id || 'post_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();
  const record = Object.assign({}, normalized, {
    id,
    chu_de: chuDe,
    chu_de_tags: [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }],
    story_tags: [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }],
    created_at: now,
    updated_at: now,
    stats: { likes: 0, comments: 0, shares: 0, views: 0, favorites: 0 },
    comments: [],
    liked_by: [],
    favorited_by: []
  });

  await query(
    `INSERT INTO community_posts (id, user_id, content_type, status, payload, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())`,
    [
      id,
      actor && actor.user_id ? actor.user_id : null,
      record.content_type,
      record.status,
      JSON.stringify(record)
    ]
  );

  if (record.status === 'published') {
    await bumpChuDeStats(chuDe, record.tickers);
  }
  return record;
}

async function updateArticle(id, input, actor) {
  const current = await getArticle(id);
  if (!current) throw AppError.notFound('Không tìm thấy bài viết');

  const merged = Object.assign({}, current, input, {
    category_id: input.category_id != null ? input.category_id : current.category_id,
    chu_de_id: input.chu_de_id != null ? input.chu_de_id : current.chu_de_id,
    chu_de_name: input.chu_de_name != null ? input.chu_de_name : (current.chu_de_name || (current.chu_de && current.chu_de.name)),
    chu_de_slug: input.chu_de_slug != null ? input.chu_de_slug : (current.chu_de_slug || (current.chu_de && current.chu_de.slug)),
    tickers: input.tickers != null ? input.tickers : current.tickers,
    sectors: input.sectors != null ? input.sectors : current.sectors,
    ecosystems: input.ecosystems != null ? input.ecosystems : current.ecosystems,
    exchange: Object.prototype.hasOwnProperty.call(input, 'exchange') ? input.exchange : current.exchange,
    status: input.status != null ? input.status : current.status,
    seo: Object.assign({}, current.seo || {}, input.seo || {}),
    display: Object.assign({}, current.display || {}, input.display || {}),
    cover: Object.assign({}, current.cover || {}, input.cover || {})
  });

  const normalized = normalizeArticleInput(merged, actor || current.author);
  const cat = await categories.getCategory(normalized.category_id);
  if (!cat) throw AppError.badRequest('ARTICLE_CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
  normalized.category_name = cat.name;

  const chuDe = await ensureChuDe(normalized);
  const now = new Date().toISOString();
  const wasPublished = current.status === 'published';
  const record = Object.assign({}, current, normalized, {
    id: current.id,
    chu_de: chuDe,
    chu_de_id: chuDe.id,
    chu_de_slug: chuDe.slug,
    chu_de_name: chuDe.name,
    chu_de_tags: [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }],
    story_tags: [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }],
    updated_at: now,
    published_at: normalized.status === 'published'
      ? (current.published_at || now)
      : current.published_at || null
  });

  await query(
    `UPDATE community_posts SET
       content_type = $2,
       status = $3,
       payload = $4::jsonb,
       updated_at = NOW()
     WHERE id = $1`,
    [current.id, record.content_type, record.status, JSON.stringify(record)]
  );

  if (!wasPublished && record.status === 'published') {
    await bumpChuDeStats(chuDe, record.tickers);
  }
  return record;
}

async function deleteArticle(id) {
  const current = await getArticle(id);
  if (!current) throw AppError.notFound('Không tìm thấy bài viết');
  await query('DELETE FROM community_posts WHERE id = $1', [current.id]);
  return { id: current.id, deleted: true };
}

/** Gợi ý chủ đề từ tiêu đề / từ khóa tìm kiếm */
async function suggestChuDe(q, limit) {
  const term = String(q || '').trim();
  const lim = Math.min(Math.max(Number(limit) || 8, 1), 20);
  if (!term) {
    const top = await query(
      `SELECT id, slug, label,
              COALESCE((meta->>'post_count')::int, 0) AS post_count
       FROM content_chu_de
       WHERE status = 'active'
       ORDER BY COALESCE((meta->>'post_count')::int, 0) DESC, interest_score DESC NULLS LAST
       LIMIT $1`,
      [lim]
    );
    return top.rows.map(function (r) {
      return { id: r.id, slug: r.slug, name: r.label, post_count: Number(r.post_count) || 0 };
    });
  }

  const tokens = term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .split(/[^a-z0-9]+/)
    .filter(function (t) { return t.length >= 2; })
    .slice(0, 6);

  const likeRaw = '%' + term.toLowerCase() + '%';
  const likeSlug = '%' + slugify(term).replace(/-/g, '%') + '%';
  const tokenLikes = tokens.map(function (t) { return '%' + t + '%'; });
  const res = await query(
    `SELECT id, slug, label,
            COALESCE((meta->>'post_count')::int, 0) AS post_count,
            interest_score
     FROM content_chu_de
     WHERE status = 'active'
       AND (
         LOWER(label) LIKE $1
         OR LOWER(slug) LIKE $1
         OR LOWER(slug) LIKE $2
         OR LOWER(slug) LIKE ANY($3::text[])
       )
     ORDER BY
       CASE WHEN LOWER(slug) = $4 OR LOWER(label) = LOWER($5) THEN 0
            WHEN LOWER(slug) LIKE $4 || '%' OR LOWER(label) LIKE LOWER($5) || '%' THEN 1
            ELSE 2 END,
       COALESCE((meta->>'post_count')::int, 0) DESC,
       interest_score DESC NULLS LAST
     LIMIT $6`,
    [
      likeRaw,
      likeSlug,
      tokenLikes.length ? tokenLikes : [likeSlug],
      slugify(term),
      term,
      lim
    ]
  );
  return res.rows.map(function (r) {
    return { id: r.id, slug: r.slug, name: r.label, post_count: Number(r.post_count) || 0 };
  });
}

async function suggestTickersForChuDe(chuDeRef, limit) {
  const lim = Math.min(Math.max(Number(limit) || 10, 1), 30);
  let chuDeId = chuDeRef;
  if (chuDeRef && String(chuDeRef).indexOf('chu_de_') !== 0 && String(chuDeRef).indexOf('story_') !== 0) {
    const bySlug = await query('SELECT id FROM content_chu_de WHERE slug = $1 LIMIT 1', [slugify(chuDeRef)]);
    if (bySlug.rows[0]) chuDeId = bySlug.rows[0].id;
  }
  if (!chuDeId) return [];
  const res = await query(
    `SELECT ticker, mention_count, relevance_score
     FROM content_chu_de_mappings
     WHERE chu_de_id = $1 AND status = 'active'
     ORDER BY mention_count DESC, relevance_score DESC
     LIMIT $2`,
    [chuDeId, lim]
  );
  return res.rows.map(function (r) {
    return {
      ticker: r.ticker,
      mention_count: Number(r.mention_count) || 0,
      relevance_score: Number(r.relevance_score) || 0
    };
  });
}

async function createChuDeQuick(name) {
  const label = String(name || '').trim();
  if (!label) throw AppError.badRequest('CHU_DE_NAME_REQUIRED', 'Tên chủ đề là bắt buộc');
  const slug = slugify(label);
  const existing = await query('SELECT id, slug, label FROM content_chu_de WHERE slug = $1 LIMIT 1', [slug]);
  if (existing.rows[0]) {
    return { id: existing.rows[0].id, slug: existing.rows[0].slug, name: existing.rows[0].label, created: false };
  }
  const id = 'chu_de_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  await query(
    `INSERT INTO content_chu_de (id, slug, label, status, interest_score, meta, created_at, updated_at)
     VALUES ($1,$2,$3,'active',1, jsonb_build_object('post_count', 0), NOW(), NOW())`,
    [id, slug, label]
  );
  return { id, slug, name: label, created: true, post_count: 0 };
}

module.exports = {
  slugify,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  suggestChuDe,
  suggestTickersForChuDe,
  createChuDeQuick,
  STATUSES
};
