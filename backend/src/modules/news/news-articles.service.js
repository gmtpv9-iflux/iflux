'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const categories = require('./news-categories.service');
const entityResolve = require('./news-entity-resolve.service');

const STATUSES = ['draft', 'pending', 'published', 'published_rss', 'scheduled'];

/** Bài đang lên User Web (Xuất bản Admin hoặc Xuất bản RSS) */
function isLivePublished(status) {
  return status === 'published' || status === 'published_rss';
}

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
  /* Chủ đề tuỳ chọn — bài không gắn chủ đề không đóng góp Topic Engine / Story */

  /* WP-1 / Amd B: cho phép tickers ∪ ecosystems; Sector không gắn kèm multi-membership.
   * Exchange vẫn exclusive (không trộn với entity groups). */
  const tickers = uniqUpper(input.tickers, 20);
  let sectors = uniqSlug(input.sectors, 3);
  const ecosystems = uniqSlug(input.ecosystems, 10);
  let exchange = input.exchange != null ? String(input.exchange).trim() : '';
  if (exchange) exchange = exchange.toUpperCase() === 'VNINDEX' ? 'VNIndex' : exchange;

  if (sectors.length && (tickers.length || ecosystems.length)) {
    sectors = [];
  }
  if (exchange && (tickers.length || ecosystems.length || sectors.length)) {
    throw AppError.badRequest(
      'ARTICLE_ENTITY_XOR',
      'Sàn (exchange) không gắn cùng cổ phiếu / ngành / hệ sinh thái'
    );
  }

  const status = STATUSES.indexOf(input.status) >= 0 ? input.status : 'draft';
  /* BR-11 Owner lock: identity slug = slugify(title); không lấy canonical RSS/editor. */
  const slug = slugify(title) || 'bai-viet-' + Date.now();
  const excerpt = String(input.excerpt || '').trim();
  const bodyHtml = String(input.body_html || input.body || '').trim();
  const seo = input.seo || {};
  const display = input.display || {};
  const cover = input.cover || {};

  let author;
  if (status === 'published') {
    author = entityResolve.resolveAdminAuthor(actor);
  } else if (status === 'published_rss') {
    author =
      entityResolve.resolveRssAuthor(input.source_id) ||
      entityResolve.resolveRssAuthor(input.source_name) ||
      (input.source && entityResolve.resolveRssAuthor(input.source.id || input.source.name)) ||
      entityResolve.resolveRssAuthor(
        input.author && (input.author.id || input.author.display_name)
      ) ||
      input.author ||
      null;
  } else {
    author = input.author || entityResolve.resolveAdminAuthor(actor);
  }

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
    entity_occurrences: Array.isArray(input.entity_occurrences) ? input.entity_occurrences : [],
    entities: input.entities && typeof input.entities === 'object' ? input.entities : { stocks: [], ecosystems: [] },
    publisher: null,
    provider: null,
    vendor: null,
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
      /* System-only Clean Public URL — không persist RSS/editor canonical */
      canonical: '',
      meta_title: String(seo.meta_title || seo.og_title || seo.title || seo.seo_title || '').trim() || title,
      meta_description: String(seo.meta_description || seo.og_description || seo.description || seo.seo_description || '').trim() || excerpt,
      og_title: String(seo.og_title || seo.meta_title || seo.title || seo.seo_title || '').trim() || title,
      og_description: String(seo.og_description || seo.meta_description || seo.description || seo.seo_description || '').trim() || excerpt,
      og_image: String(seo.og_image || cover.url || input.cover_url || '').trim(),
      og_image_alt: String(seo.og_image_alt || seo.ogImageAlt || '').trim()
    },
    status,
    display: {
      featured: !!display.featured,
      pin: !!(display.pin || display.sticky),
      comments: display.comments !== false,
      share: display.share !== false
    },
    scheduled_at: status === 'scheduled' ? (input.scheduled_at || input.publish_at || null) : null,
    published_at: isLivePublished(status) ? (input.published_at || new Date().toISOString()) : null,
    author
  };
}

async function ensureChuDe(normalized) {
  const hasAny =
    !!(normalized && (normalized.chu_de_id || normalized.chu_de_slug || normalized.chu_de_name));
  if (!hasAny) return null;

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
  if (!slug) return null;

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
  let whereSql = ' WHERE 1=1';
  if (filters.status) {
    params.push(filters.status);
    whereSql += ` AND status = $${params.length}`;
  } else if (!filters.include_all) {
    whereSql += ` AND status IN ('published', 'published_rss')`;
  }
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    whereSql += ` AND (LOWER(payload->>'title') LIKE $${params.length} OR LOWER(payload->>'slug') LIKE $${params.length})`;
  }
  if (filters.category_id) {
    params.push(filters.category_id);
    whereSql += ` AND payload->>'category_id' = $${params.length}`;
  }
  if (filters.chu_de_id) {
    params.push(filters.chu_de_id);
    whereSql += ` AND payload->>'chu_de_id' = $${params.length}`;
  }

  const countRes = await query(`SELECT COUNT(*)::int AS total FROM news_posts${whereSql}`, params);
  const total = countRes.rows[0] ? Number(countRes.rows[0].total) : 0;

  let sql = `SELECT * FROM news_posts${whereSql}`;
  sql += ' ORDER BY COALESCE((payload->>\'published_at\')::timestamptz, created_at) DESC';

  const queryParams = [...params];
  const limitVal = filters.limit ? Number(filters.limit) : 50;
  queryParams.push(limitVal);
  sql += ` LIMIT $${queryParams.length}`;

  if (filters.offset != null || filters.page != null) {
    const pageVal = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const offsetVal = filters.offset != null ? Number(filters.offset) : (pageVal - 1) * limitVal;
    queryParams.push(offsetVal);
    sql += ` OFFSET $${queryParams.length}`;
  }

  const res = await query(sql, queryParams);
  const list = res.rows.map(rowToArticle);

  if (filters.withTotal || filters.page != null) {
    return { articles: list, total };
  }
  return list;
}


/** ArticleDetail — có body_html; vẫn CẤM dump comments[] / liked_by / rss / display. */
const ARTICLE_DETAIL_PAYLOAD_SQL = `(
  payload
  - 'comments' - 'liked_by' - 'favorited_by'
  - 'rss' - 'display'
)`;

async function getArticle(idOrSlug) {
  const cols =
    `id, user_id, content_type, status, created_at, updated_at, ${ARTICLE_DETAIL_PAYLOAD_SQL} AS payload`;
  const byId = await query(
    `SELECT ${cols} FROM news_posts WHERE id = $1 LIMIT 1`,
    [idOrSlug]
  );
  if (byId.rows[0]) return rowToArticle(byId.rows[0]);
  const bySlug = await query(
    `SELECT ${cols} FROM news_posts WHERE payload->>'slug' = $1 LIMIT 1`,
    [idOrSlug]
  );
  if (bySlug.rows[0]) return rowToArticle(bySlug.rows[0]);
  /* BR-12 slug change: former slug → current article (caller 301 nếu param ≠ slug) */
  const byFormer = await query(
    `SELECT ${cols} FROM news_posts
     WHERE COALESCE(payload->'former_slugs', '[]'::jsonb) ? $1
     LIMIT 1`,
    [idOrSlug]
  );
  return rowToArticle(byFormer.rows[0]);
}

/** Đảm bảo slug không trùng bài khác (current slug). */
async function ensureUniqueSlug(baseSlug, excludeId) {
  let slug = String(baseSlug || '').trim() || 'bai-viet';
  const exclude = excludeId || '';
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? slug : slug.slice(0, 140) + '-' + n;
    const res = await query(
      `SELECT id FROM news_posts
       WHERE payload->>'slug' = $1 AND id <> $2
       LIMIT 1`,
      [candidate, exclude]
    );
    if (!res.rows[0]) return candidate;
  }
  return slug.slice(0, 120) + '-' + Date.now().toString(36);
}

function mergeFormerSlugs(currentFormer, oldSlug, newSlug) {
  const out = [];
  const seen = {};
  function push(s) {
    const v = String(s || '').trim();
    if (!v || v === newSlug || seen[v]) return;
    seen[v] = true;
    out.push(v);
  }
  push(oldSlug);
  (Array.isArray(currentFormer) ? currentFormer : []).forEach(push);
  return out.slice(0, 30);
}

async function createArticle(input, actor) {
  const normalized = normalizeArticleInput(input, actor);
  normalized.slug = await ensureUniqueSlug(normalized.slug, null);
  const cat = await categories.getCategory(normalized.category_id);
  if (!cat) throw AppError.badRequest('ARTICLE_CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
  normalized.category_name = cat.name;

  const chuDe = await ensureChuDe(normalized);
  if (chuDe) {
    normalized.chu_de_id = chuDe.id;
    normalized.chu_de_slug = chuDe.slug;
    normalized.chu_de_name = chuDe.name;
  } else {
    normalized.chu_de_id = null;
    normalized.chu_de_slug = '';
    normalized.chu_de_name = '';
  }

  const id = input.id || 'post_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();
  const record = Object.assign({}, normalized, {
    id,
    former_slugs: [],
    chu_de: chuDe,
    chu_de_tags: chuDe ? [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }] : [],
    story_tags: chuDe ? [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }] : [],
    created_at: now,
    updated_at: now,
    stats: { likes: 0, comments: 0, shares: 0, views: 0, favorites: 0 },
    comments: [],
    liked_by: [],
    favorited_by: []
  });

  await query(
    `INSERT INTO news_posts (id, user_id, content_type, status, payload, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())`,
    [
      id,
      actor && actor.user_id ? actor.user_id : null,
      record.content_type,
      record.status,
      JSON.stringify(record)
    ]
  );

  if (isLivePublished(record.status) && chuDe) {
    await bumpChuDeStats(chuDe, record.tickers);
  }
  try {
    const bus = require('../../core/events/bus');
    if (isLivePublished(record.status)) {
      const author = record.author || {};
      await bus.publish(bus.EVENTS.NEWS_POST_PUBLISHED, {
        postId: record.id,
        id: record.id,
        slug: record.slug,
        title: record.title,
        status: record.status,
        tickers: record.tickers || [],
        authorId: record.user_id || author.id || (actor && (actor.user_id || actor.id)) || null,
        authorName: author.display_name || author.name || (actor && actor.name) || 'Thành viên'
      });
    }
  } catch (e) { /* event bus optional at boot */ }
  return record;
}

async function updateArticle(id, input, actor) {
  const current = await getArticle(id);
  if (!current) throw AppError.notFound('Không tìm thấy bài viết');

  const merged = Object.assign({}, current, input, {
    category_id: input.category_id != null ? input.category_id : current.category_id,
    chu_de_id: Object.prototype.hasOwnProperty.call(input, 'chu_de_id') ? input.chu_de_id : current.chu_de_id,
    chu_de_name: Object.prototype.hasOwnProperty.call(input, 'chu_de_name')
      ? input.chu_de_name
      : (current.chu_de_name || (current.chu_de && current.chu_de.name)),
    chu_de_slug: Object.prototype.hasOwnProperty.call(input, 'chu_de_slug')
      ? input.chu_de_slug
      : (current.chu_de_slug || (current.chu_de && current.chu_de.slug)),
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
  normalized.slug = await ensureUniqueSlug(normalized.slug, current.id);
  const cat = await categories.getCategory(normalized.category_id);
  if (!cat) throw AppError.badRequest('ARTICLE_CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
  normalized.category_name = cat.name;

  const chuDe = await ensureChuDe(normalized);
  const now = new Date().toISOString();
  const wasPublished = isLivePublished(current.status);
  const oldSlug = String(current.slug || '').trim();
  const newSlug = String(normalized.slug || '').trim();
  const former =
    oldSlug && newSlug && oldSlug !== newSlug
      ? mergeFormerSlugs(current.former_slugs, oldSlug, newSlug)
      : Array.isArray(current.former_slugs)
        ? current.former_slugs.slice(0, 30)
        : [];
  const record = Object.assign({}, current, normalized, {
    id: current.id,
    former_slugs: former,
    chu_de: chuDe,
    chu_de_id: chuDe ? chuDe.id : null,
    chu_de_slug: chuDe ? chuDe.slug : '',
    chu_de_name: chuDe ? chuDe.name : '',
    chu_de_tags: chuDe ? [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }] : [],
    story_tags: chuDe ? [{ source: 'chu-de', sourceId: chuDe.slug, name: chuDe.name }] : [],
    updated_at: now,
    published_at: isLivePublished(normalized.status)
      ? (current.published_at || now)
      : current.published_at || null
  });

  await query(
    `UPDATE news_posts SET
       content_type = $2,
       status = $3,
       payload = $4::jsonb,
       updated_at = NOW()
     WHERE id = $1`,
    [current.id, record.content_type, record.status, JSON.stringify(record)]
  );

  if (!wasPublished && isLivePublished(record.status) && chuDe) {
    await bumpChuDeStats(chuDe, record.tickers);
  }
  try {
    const bus = require('../../core/events/bus');
    if (!wasPublished && isLivePublished(record.status)) {
      const author = record.author || {};
      await bus.publish(bus.EVENTS.NEWS_POST_PUBLISHED, {
        postId: record.id,
        id: record.id,
        slug: record.slug,
        title: record.title,
        status: record.status,
        tickers: record.tickers || [],
        authorId: record.user_id || author.id || (actor && (actor.user_id || actor.id)) || null,
        authorName: author.display_name || author.name || (actor && actor.name) || 'Thành viên'
      });
    }
  } catch (e) { /* ignore */ }
  return record;
}

async function deleteArticle(id) {
  const current = await getArticle(id);
  if (!current) throw AppError.notFound('Không tìm thấy bài viết');
  await query('DELETE FROM news_posts WHERE id = $1', [current.id]);
  return { id: current.id, deleted: true };
}

/**
 * Kiểm duyệt story (news.stories.*) — tái dùng updateArticle, không đụng articles.* perm.
 * action: publish | feature | pin | lock | unlock | unfeature | unpin
 */
async function moderateStoryPost(id, action, actor) {
  const current = await getArticle(id);
  if (!current) throw AppError.notFound('Không tìm thấy bài viết');
  const act = String(action || '').toLowerCase();
  const display = Object.assign({}, current.display || {});
  let status = current.status;
  if (act === 'publish') {
    status = 'published';
  } else if (act === 'feature') {
    display.featured = true;
  } else if (act === 'unfeature') {
    display.featured = false;
  } else if (act === 'pin') {
    display.pin = true;
    display.sticky = true;
  } else if (act === 'unpin') {
    display.pin = false;
    display.sticky = false;
  } else if (act === 'lock') {
    display.locked = true;
    display.comments = false;
  } else if (act === 'unlock') {
    display.locked = false;
    display.comments = true;
  } else {
    throw AppError.badRequest('INVALID_STORY_ACTION', 'Hành động kiểm duyệt không hợp lệ.');
  }
  return updateArticle(id, { status: status, display: display }, actor);
}

/** Sửa nhẹ tiêu đề / body / status cho news.stories.edit */
async function editStoryPost(id, patch, actor) {
  const current = await getArticle(id);
  if (!current) throw AppError.notFound('Không tìm thấy bài viết');
  const input = {};
  if (patch.title != null) input.title = patch.title;
  if (patch.body_html != null) input.body_html = patch.body_html;
  if (patch.excerpt != null) input.excerpt = patch.excerpt;
  if (patch.status != null) input.status = patch.status;
  if (patch.display) input.display = patch.display;
  return updateArticle(id, input, actor);
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

async function listChuDeAdmin(filters) {
  filters = filters || {};
  const lim = Math.min(Math.max(Number(filters.limit) || 200, 1), 500);
  const params = [];
  let sql =
    `SELECT id, slug, label, status, interest_score, meta, created_at, updated_at
     FROM content_chu_de WHERE 1=1`;
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(label) LIKE $${params.length} OR LOWER(slug) LIKE $${params.length})`;
  }
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  }
  sql += ` ORDER BY COALESCE((meta->>'post_count')::int, 0) DESC, updated_at DESC NULLS LAST LIMIT $${params.length + 1}`;
  params.push(lim);
  const res = await query(sql, params);
  return res.rows.map(function (r) {
    const meta = r.meta || {};
    return {
      id: r.id,
      slug: r.slug,
      name: r.label,
      label: r.label,
      status: r.status,
      interest_score: r.interest_score,
      post_count: Number(meta.post_count) || 0,
      meta: meta,
      created_at: r.created_at,
      updated_at: r.updated_at
    };
  });
}

/** Danh sách tác giả suy ra từ bài viết (Content_Entity — tác giả từ người viết). */
async function listAuthorsAdmin(filters) {
  filters = filters || {};
  const lim = Math.min(Math.max(Number(filters.limit) || 200, 1), 500);
  const res = await query(
    `SELECT payload->'author' AS author, COUNT(*)::int AS post_count,
            MAX(COALESCE((payload->>'published_at')::timestamptz, created_at)) AS last_published_at
     FROM news_posts
     WHERE payload->'author' IS NOT NULL
     GROUP BY payload->'author'
     ORDER BY post_count DESC
     LIMIT $1`,
    [lim]
  );
  let rows = res.rows.map(function (r) {
    const a = r.author || {};
    return {
      id: a.id || a.user_id || '',
      display_name: a.display_name || a.name || a.email || '—',
      tier: a.tier || '',
      tier_label: a.tier_label || '',
      post_count: Number(r.post_count) || 0,
      last_published_at: r.last_published_at
    };
  });
  if (filters.q) {
    const q = String(filters.q).trim().toLowerCase();
    rows = rows.filter(function (a) {
      return String(a.display_name || '').toLowerCase().indexOf(q) >= 0 ||
        String(a.id || '').toLowerCase().indexOf(q) >= 0;
    });
  }
  return rows;
}

const PUBLIC_ORIGIN = 'https://iflux.vn';

function firstHtmlImage(html) {
  const m = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m && m[1] ? m[1] : '';
}

function absoluteAssetUrl(url, origin) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.indexOf('//') === 0) return 'https:' + raw;
  const base = origin || PUBLIC_ORIGIN;
  return base + (raw.charAt(0) === '/' ? raw : '/' + raw);
}

function escapeHtmlAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Article Metadata — P4: consume SEO Platform Contract + one Head Renderer.
 * Foundation effective is input to Contract (PD-02); no second head engine.
 */
async function attachArticleMetadata(article, origin, opts) {
  if (!article) return article;
  opts = opts || {};
  const seoPlatform = require('../seo-platform/seo-platform.service');
  const headRenderer = require('../seo-platform/head-renderer');
  const contract = await seoPlatform.resolveArticleContract(article, {
    origin: origin || PUBLIC_ORIGIN,
    requestUri: opts.requestUri,
    search: opts.search,
    requestedUrl: opts.requestedUrl,
    httpStatus: opts.httpStatus
  });
  article.seoContract = contract;
  article.metadata = seoPlatform.metadataFromContract(contract);
  article.metadata._singleton = headRenderer.detectSingletonViolations(
    '<head>\n' + article.metadata._headHtml + '</head>'
  );
  return article;
}

/**
 * Head tags — P4: always from Contract renderer when `_headHtml` present.
 * Legacy meta bag path kept only as defensive fallback (commented authority removed).
 */
function buildArticleMetadataHeadHtml(meta) {
  const m = meta && typeof meta === 'object' ? meta : {};
  if (m._headHtml) return m._headHtml;
  // Defensive fallback for callers without Contract attach — still one renderer shape.
  const headRenderer = require('../seo-platform/head-renderer');
  return headRenderer.renderHeadFromContract(
    {
      http: { httpClass: 'indexable_success' },
      document: {
        title: m.title || 'iFlux',
        documentTitle: m.documentTitle || m.title || 'iFlux',
        description: m.description || ''
      },
      identity: {
        canonicalUrl: m.canonical || m.url || PUBLIC_ORIGIN,
        seoIdentityUrl: m.url || m.canonical || PUBLIC_ORIGIN
      },
      indexability: { robots: m.robots || 'index,follow', indexUniverse: true },
      social: {
        og: {
          title: m.title || 'iFlux',
          description: m.description || '',
          image: m.image || '',
          url: m.url || m.canonical || PUBLIC_ORIGIN,
          type: 'article',
          site_name: m.site_name || 'iFlux'
        },
        twitter: {
          card: m.twitter_card || 'summary',
          title: m.title || 'iFlux',
          description: m.description || '',
          image: m.image || ''
        }
      },
      assets: { faviconUrl: m.favicon || '', ogImageUrl: m.image || '' }
    },
    { includeJsonLd: false, forceImage: true, schemaType: 'Article' }
  );
}

/** @deprecated sync path — prefer attachArticleMetadata (async Contract). */
function resolveArticleMetadata(article, origin, globalPayload) {
  /* Kept for rare sync callers; does not rebuild Foundation authority.
   * Prefer attachArticleMetadata → SEO Contract. */
  const item = article || {};
  const base = origin || PUBLIC_ORIGIN;
  const seoResolver = require('../site-seo/site-seo-resolver');
  const resolved = seoResolver.resolveEffectiveConfig({
    global: globalPayload || {},
    page: {},
    article: item,
    fallback: { siteName: 'iFlux' }
  });
  const pub = resolved.public;
  const title = String(pub.title || item.title || 'iFlux').trim();
  const description = String(pub.description || '').trim();
  const image = absoluteAssetUrl(pub.og_image || pub.social_image || '', base);
  const slug = item.slug || item.id || '';
  const canonical = base + '/cong-dong/bai-viet/' + encodeURIComponent(slug);
  const siteName = String(pub.site_name || 'iFlux').trim() || 'iFlux';
  const documentTitle = title.indexOf(siteName) >= 0 ? title : title + ' · ' + siteName;
  return {
    title,
    description,
    image,
    url: canonical,
    canonical,
    site_name: siteName,
    favicon: String(pub.favicon_url || '').trim(),
    robots: 'index,follow',
    twitter_card: image ? 'summary_large_image' : 'summary',
    documentTitle,
    _fieldStates: resolved.fields,
    _legacySync: true
  };
}

/** @deprecated alias — dùng attachArticleMetadata (Contract). */
function resolveOpenGraphMeta(article, origin) {
  return resolveArticleMetadata(article, origin);
}

/**
 * Pipeline A — Share Preview renderer (OG-only shell).
 * Hằng số shell (refresh, stub body) là khung HTML A — không phải metadata bài.
 */
function renderOpenGraphHtml(meta) {
  const m = meta && typeof meta === 'object' ? meta : {};
  const canonical = escapeHtmlAttr(m.canonical || m.url || PUBLIC_ORIGIN);
  const head = buildArticleMetadataHeadHtml(meta);
  return '<!DOCTYPE html>\n' +
    '<html lang="vi">\n' +
    '<head>\n' +
    '  <meta charset="utf-8" />\n' +
    head +
    '  <meta http-equiv="refresh" content="0;url=' + canonical + '" />\n' +
    '</head>\n' +
    '<body>\n' +
    '  <p><a href="' + canonical + '">Xem bài viết trên iFlux</a></p>\n' +
    '</body>\n' +
    '</html>\n';
}

function resolveUserWebRoot() {
  if (process.env.IFLUX_WEB_ROOT) return process.env.IFLUX_WEB_ROOT;
  if (process.env.APP_ENV === 'staging') return '/var/www/iflux/staging';
  if (process.env.APP_ENV === 'production') {
    return process.env.DEPLOY_WEB_PRODUCTION || '/var/www/iflux/newprod';
  }
  const path = require('path');
  return path.resolve(__dirname, '../../../..');
}

/**
 * Pipeline B — SPA shell + Metadata SoT trong <head> (cùng head builder với A).
 * Template: User_Web/news/post.html (Reuse). Không hardcode title bài.
 */
function renderArticleSpaHtml(meta) {
  const fs = require('fs');
  const path = require('path');
  const templatePath = path.join(resolveUserWebRoot(), 'User_Web', 'news', 'post.html');
  let html;
  try {
    html = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    throw new AppError('Không đọc được shell bài viết', 500, 'SPA_SHELL_MISSING');
  }
  const head = buildArticleMetadataHeadHtml(meta);
  /* Bỏ title placeholder trong template — thay bằng Contract head (có <title>). */
  html = html.replace(/<title>[^<]*<\/title>\s*/i, '');
  html = html.replace(/<!-- Title \+ OG[\s\S]*?-->\s*/i, '');
  /* Gỡ meta SoT cũ nếu inject lại (idempotent) — singleton guarantee. */
  html = html.replace(/\s*<meta name="description"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<meta name="robots"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<link rel="canonical"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<link rel="icon"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<meta property="og:[^"]+"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<meta name="twitter:[^"]+"[^>]*>\s*/gi, '\n');
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '\n');
  /* Inject sớm sau charset/viewport — crawler đọc head đầu trang. */
  if (/<meta charset="utf-8"[^>]*>\s*<meta name="viewport"[^>]*>/i.test(html)) {
    html = html.replace(
      /(<meta charset="utf-8"[^>]*>\s*<meta name="viewport"[^>]*>)/i,
      '$1\n' + head
    );
  } else if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, head + '</head>');
  } else {
    html = head + html;
  }
  const headRenderer = require('../seo-platform/head-renderer');
  const singleton = headRenderer.detectSingletonViolations(html);
  if (!singleton.ok && meta && typeof meta === 'object') {
    meta._singleton = singleton;
  }
  return html;
}

function articlePublicPath(slug) {
  return '/cong-dong/bai-viet/' + encodeURIComponent(String(slug || '').trim());
}

module.exports = {
  slugify,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  moderateStoryPost,
  editStoryPost,
  suggestChuDe,
  suggestTickersForChuDe,
  resolveArticleMetadata,
  resolveOpenGraphMeta,
  attachArticleMetadata,
  buildArticleMetadataHeadHtml,
  renderOpenGraphHtml,
  renderArticleSpaHtml,
  PUBLIC_ORIGIN,
  createChuDeQuick,
  listChuDeAdmin,
  listAuthorsAdmin,
  STATUSES,
  isLivePublished,
  ensureUniqueSlug,
  articlePublicPath
};
