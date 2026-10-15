'use strict';

/**
 * Community Feed — FeedCard DTO only.
 * CẤM SELECT * / CẤM trả Persistence Model (body, body_html, comments[], …).
 */
const { query } = require('../../core/database/connection');
const { ensureSeeded } = require('./news.service');
const { AppError } = require('../../shared/exceptions/app-error');

const FEED_STRIP_KEYS = [
  'body',
  'body_html',
  'body_raw',
  'raw_content',
  'comments',
  'liked_by',
  'favorited_by',
  'rss',
  'display',
  'attachments',
  'seo',
  'geo',
  'geo_ai',
  'schema',
  'payload'
];

/** SQL: jsonb payload bỏ field Forbidden — không SELECT *. */
const FEED_PAYLOAD_SQL = `(
  payload
  - 'body' - 'body_html' - 'body_raw' - 'raw_content'
  - 'comments' - 'liked_by' - 'favorited_by'
  - 'rss' - 'display' - 'attachments' - 'seo'
  - 'geo' - 'geo_ai' - 'schema'
)`;

function pickAuthor(author) {
  if (!author || typeof author !== 'object') {
    return { id: null, display_name: 'Thành viên', tier: 'free', tier_label: 'Free' };
  }
  return {
    id: author.id || null,
    display_name: author.display_name || author.name || 'Thành viên',
    tier: author.tier || 'free',
    tier_label: author.tier_label || author.tier || 'Free',
    avatar: author.avatar || author.avatar_url || null
  };
}

function pickCover(cover, imageUrl) {
  if (cover && typeof cover === 'object' && cover.url) {
    var out = {
      url: cover.url,
      alt: cover.alt || null,
      caption: cover.caption || null
    };
    if (cover.asset_id) out.asset_id = cover.asset_id;
    if (cover.profiles) out.profiles = cover.profiles;
    if (cover.variants && typeof cover.variants === 'object') out.variants = cover.variants;
    return out;
  }
  if (imageUrl) return { url: String(imageUrl), alt: null, caption: null };
  return null;
}

function pickStats(stats) {
  const s = stats && typeof stats === 'object' ? stats : {};
  return {
    likes: Number(s.likes) || 0,
    comments: Number(s.comments) || 0,
    shares: Number(s.shares) || 0,
    views: Number(s.views) || 0,
    favorites: Number(s.favorites) || 0
  };
}

function pickCategory(p) {
  if (p.category && typeof p.category === 'object') {
    return {
      id: p.category.id || p.category_id || null,
      slug: p.category.slug || p.category_slug || null,
      name: p.category.name || p.category.label || p.category_name || null
    };
  }
  if (p.category_id || p.category_name || p.category_slug) {
    return {
      id: p.category_id || null,
      slug: p.category_slug || null,
      name: p.category_name || null
    };
  }
  return null;
}

/**
 * FeedCard DTO — whitelist. Forbidden fields không bao giờ lọt ra.
 */
function toFeedCard(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = Object.assign({}, raw);
  FEED_STRIP_KEYS.forEach(function (k) {
    delete p[k];
  });

  const id = p.id || null;
  if (!id) return null;

  const tickers = Array.isArray(p.tickers)
    ? p.tickers.map(function (t) { return String(t || '').toUpperCase(); }).filter(Boolean)
    : [];

  const card = {
    id: id,
    slug: p.slug || String(id),
    title: p.title || 'Bài viết cộng đồng',
    excerpt: p.excerpt || '',
    cover: pickCover(p.cover, p.image_url),
    author: pickAuthor(p.author),
    published_at: p.published_at || p.created_at || null,
    created_at: p.created_at || p.published_at || null,
    stats: pickStats(p.stats),
    category: pickCategory(p),
    category_id: p.category_id || (p.category && p.category.id) || null,
    category_name: p.category_name || (p.category && (p.category.name || p.category.label)) || null,
    category_slug: p.category_slug || (p.category && p.category.slug) || null,
    tickers: tickers,
    content_type: p.content_type || 'news',
    status: p.status || 'published',
    tags: Array.isArray(p.tags) ? p.tags : [],
    story_id: p.story_id || null,
    exchange: p.exchange || null,
    sectors: Array.isArray(p.sectors) ? p.sectors : [],
    ecosystems: Array.isArray(p.ecosystems) ? p.ecosystems : [],
    sort_at: p.sort_at || p.published_at || p.created_at || null,
    content_origin: p.content_origin || null,
    external_url: p.external_url || null,
    source_label: p.source_label || null,
    image_url: p.image_url || (p.cover && p.cover.url) || null
  };

  return card;
}

function rowToFeedCard(row) {
  if (!row) return null;
  const payload = row.payload || {};
  return toFeedCard(
    Object.assign({}, payload, {
      id: payload.id || row.id,
      status: payload.status || row.status,
      content_type: payload.content_type || row.content_type,
      created_at: payload.created_at || row.created_at
    })
  );
}

async function fetchCommunityRows(filters) {
  const params = [];
  let sql =
    `SELECT id, content_type, status, created_at,
       ${FEED_PAYLOAD_SQL} || jsonb_build_object('sort_at', COALESCE((payload->>'published_at')::timestamptz, created_at)) AS payload` +
    ` FROM news_posts WHERE status IN ('published', 'published_rss')`;

  if (filters.content_type) {
    params.push(filters.content_type);
    sql += ` AND content_type = $${params.length}`;
  }

  if (filters.tickers && filters.tickers.length) {
    params.push(filters.tickers);
    sql += ` AND COALESCE(payload->'tickers', '[]'::jsonb) ?| $${params.length}::text[]`;
  }

  if (filters.ticker) {
    const tk = String(filters.ticker).trim().toUpperCase();
    params.push(tk);
    sql += ` AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(payload->'tickers', '[]'::jsonb)) t(val)
      WHERE UPPER(t.val) = $${params.length}
    )`;
  }

  if (filters.category_id) {
    params.push(String(filters.category_id));
    sql += ` AND (
      payload->>'category_id' = $${params.length}
      OR payload->'category'->>'id' = $${params.length}
    )`;
  }

  if (filters.story_id) {
    params.push(String(filters.story_id));
    sql += ` AND payload->>'story_id' = $${params.length}`;
  }

  /* Ngành / Hệ sinh thái (id, code hoặc slug): bài gắn trực tiếp, hoặc có mã CP thuộc nhóm đó. */
  [['sector', 'sectors', 'sector_id'], ['ecosystem', 'ecosystems', 'ecosystem_id']].forEach(function (g) {
    const key = filters[g[0]];
    if (!key) return;
    params.push(String(key).trim());
    const n = params.length;
    sql += ` AND (
      EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(payload->'tickers', '[]'::jsonb)) t(val)
        JOIN stocks st ON st.ticker = UPPER(t.val)
        JOIN ${g[1]} grp ON grp.id = st.${g[2]}
        WHERE grp.id::text = $${n} OR grp.code = $${n} OR grp.slug = $${n}
      )
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(payload->'${g[1]}', '[]'::jsonb)) e(val)
        WHERE (CASE WHEN jsonb_typeof(e.val) = 'object'
                 THEN COALESCE(e.val->>'id', e.val->>'slug', e.val->>'code')
                 ELSE e.val #>> '{}' END) = $${n}
      )
    )`;
  });

  if (filters.exclude_id) {
    params.push(String(filters.exclude_id));
    sql += ` AND id <> $${params.length} AND COALESCE(payload->>'slug', '') <> $${params.length}`;
  }

  if (filters.cursor) {
    let cursor;
    try { cursor = JSON.parse(Buffer.from(filters.cursor, 'base64url').toString()); }
    catch (_) { throw AppError.badRequest('FEED_CURSOR_INVALID', 'Mốc tải bài không hợp lệ'); }
    if (!Array.isArray(cursor) || cursor.length !== 2 || !Number.isFinite(Date.parse(cursor[0])) || typeof cursor[1] !== 'string') {
      throw AppError.badRequest('FEED_CURSOR_INVALID', 'Mốc tải bài không hợp lệ');
    }
    params.push(cursor[0], cursor[1]);
    sql += ` AND (COALESCE((payload->>'published_at')::timestamptz, created_at), id) < ($${params.length - 1}::timestamptz, $${params.length})`;
  }
  function entityCondition(entity, exclude) {
    const clauses = [];
    [['tickers', 'tickers'], ['sectors', 'sectors'], ['ecosystems', 'ecosystems']].forEach(([field, column]) => {
      const keys = (entity[field] || []).map((v) => typeof v === 'object' ? String(v.slug || v.code || v.id) : String(v));
      if (keys.length) { params.push(keys); clauses.push(`COALESCE(payload->'${column}', '[]'::jsonb) ?| $${params.length}::text[]`); }
    });
    if (entity.exchange) { params.push(entity.exchange); clauses.push(`payload->>'exchange' = $${params.length}`); }
    /* story_ids trong CÙNG nhóm OR (không phải AND riêng) — "Bạn đang quan tâm" (listFollowedFeed)
       cần match bài khớp BẤT KỲ thực thể nào đang Follow (ticker/sector/ecosystem/story), không
       phải khớp đồng thời tất cả. */
    if (entity.story_ids && entity.story_ids.length) {
      params.push(entity.story_ids.map(String));
      clauses.push(`payload->>'story_id' = ANY($${params.length}::text[])`);
    }
    if (clauses.length) sql += ` AND ${exclude ? 'NOT ' : ''}(${clauses.join(' OR ')})`;
  }
  if (filters.entity_match) entityCondition(filters.entity_match, false);
  if (filters.exclude_entities) entityCondition(filters.exclude_entities, true);
  if (filters.exclude_story) {
    params.push(filters.exclude_story);
    sql += ` AND COALESCE(payload->>'story_id', '') <> $${params.length}`;
  }
  if (filters.exclude_tickers && filters.exclude_tickers.length) {
    params.push(filters.exclude_tickers);
    sql += ` AND NOT (COALESCE(payload->'tickers', '[]'::jsonb) ?| $${params.length}::text[])`;
  }
  sql += ` ORDER BY COALESCE((payload->>'published_at')::timestamptz, created_at) DESC, id DESC`;

  /* Cho phép 51 khi listFeed hỏi L+1 (FEED_PAGE_SIZE max trả client vẫn 50) */
  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 51);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  params.push(limit);
  sql += ` LIMIT $${params.length}`;
  if (offset > 0) {
    params.push(offset);
    sql += ` OFFSET $${params.length}`;
  }

  const res = await query(sql, params);
  return res.rows.map(rowToFeedCard).filter(Boolean);
}

async function resolveRelatedSeed(relatedTo) {
  if (!relatedTo) return null;
  const key = String(relatedTo);
  const byId = await query(
    `SELECT id, content_type, status, created_at, ${FEED_PAYLOAD_SQL} AS payload
     FROM news_posts WHERE id = $1 AND status IN ('published', 'published_rss') LIMIT 1`,
    [key]
  );
  let row = byId.rows[0];
  if (!row) {
    const bySlug = await query(
      `SELECT id, content_type, status, created_at, ${FEED_PAYLOAD_SQL} AS payload
       FROM news_posts WHERE payload->>'slug' = $1 AND status IN ('published', 'published_rss') LIMIT 1`,
      [key]
    );
    row = bySlug.rows[0];
  }
  if (!row) return null;
  const card = rowToFeedCard(row);
  return card
    ? {
        id: card.id,
        slug: card.slug,
        category_id: card.category_id,
        story_id: card.story_id,
        tickers: card.tickers || [],
        sectors: card.sectors || [], ecosystems: card.ecosystems || [], exchange: card.exchange || null
      }
    : null;
}

/**
 * GET /news/feed — FeedCard[] (trước đây dual-mount /community/feed — alias đã gỡ 2026-10-03, /community giờ là Post model thật, xem backend/src/modules/community/)
 * Query: limit, offset, ticker, category_id, story_id, sector, ecosystem, related_to, type (content_type)
 */
async function listFeed(filters) {
  filters = filters || {};
  await ensureSeeded();

  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 50);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  if (filters.related_to) {
    const seed = await resolveRelatedSeed(filters.related_to);
    if (!seed) return { cards: [], total: 0, limit, offset, has_more: false };

    const group = filters.related_group === 'stock' ? 'entity' : (filters.related_group || 'entity');
    if (!['topic', 'entity', 'category'].includes(group)) {
      throw AppError.badRequest('RELATED_GROUP_INVALID', 'Nhóm bài liên quan không hợp lệ');
    }
    if ((group === 'topic' && !seed.story_id) || (group === 'entity' && !seed.tickers.length && !seed.sectors.length && !seed.ecosystems.length && !seed.exchange) || (group === 'category' && !seed.category_id)) {
      return { cards: [], total: 0, limit, offset, has_more: false, next_cursor: null };
    }
    const rows = await fetchCommunityRows({
      limit: limit + 1, offset, cursor: filters.cursor,
      story_id: group === 'topic' ? seed.story_id : null,
      entity_match: group === 'entity' ? seed : null,
      category_id: group === 'category' ? seed.category_id : null,
      content_type: 'article', exclude_id: seed.id,
      exclude_story: filters.related_preview && group === 'category' ? seed.story_id : null,
      exclude_entities: filters.related_preview && group !== 'entity' ? seed : null
    });
    return pageResult(rows, filters, limit, offset);
  }

  /* L+1 → has_more; cùng filter + ORDER BY deterministic (fetchCommunityRows) */
  const communityCards = await fetchCommunityRows({
    limit: limit + 1,
    offset: offset,
    ticker: filters.ticker,
    category_id: filters.category_id,
    story_id: filters.story_id,
    sector: filters.sector,
    ecosystem: filters.ecosystem,
    cursor: filters.cursor,
    exclude_id: filters.exclude_id,
    content_type: filters.content_type || filters.type || null
  });

  return pageResult(communityCards, filters, limit, offset);
}

/**
 * "Bạn đang quan tâm" — feed OR theo TẤT CẢ thực thể user đang Follow (Stock/Sector/Ecosystem/
 * Story, xem entity-follow.service.js). Tái dùng entityCondition() (đã có sẵn cho group_by=entity
 * ở related_to) + story_ids (mới, xem fetchCommunityRows). followed rỗng cả 4 loại → trả rỗng
 * luôn (không query, tránh quét toàn bộ news_posts).
 */
async function listFollowedFeed(followed, filters) {
  filters = filters || {};
  followed = followed || {};
  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 50);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const hasEntity = (followed.stocks && followed.stocks.length) ||
    (followed.sectors && followed.sectors.length) ||
    (followed.ecosystems && followed.ecosystems.length);
  const hasStory = followed.stories && followed.stories.length;
  if (!hasEntity && !hasStory) {
    return { cards: [], total: 0, limit, offset, has_more: false, next_cursor: null };
  }

  const rows = await fetchCommunityRows({
    limit: limit + 1,
    offset,
    cursor: filters.cursor,
    entity_match: {
      tickers: followed.stocks || [],
      sectors: followed.sectors || [],
      ecosystems: followed.ecosystems || [],
      story_ids: followed.stories || []
    },
    content_type: filters.content_type || filters.type || null
  });
  return pageResult(rows, filters, limit, offset);
}

/**
 * Lấy FeedCard theo danh sách id cụ thể (không giữ thứ tự SQL — caller tự re-sort theo nhu cầu,
 * vd news-hot.service.js re-sort theo điểm). Dùng cho "Tin nóng" (ids đã được xếp hạng sẵn ở nơi
 * khác, chỉ cần lấy dữ liệu hiển thị FeedCard ở đây).
 */
async function getFeedCardsByIds(ids) {
  if (!ids || !ids.length) return [];
  const res = await query(
    `SELECT id, content_type, status, created_at,
       ${FEED_PAYLOAD_SQL} || jsonb_build_object('sort_at', COALESCE((payload->>'published_at')::timestamptz, created_at)) AS payload
     FROM news_posts WHERE id = ANY($1::varchar[]) AND status IN ('published', 'published_rss')`,
    [ids.map(String)]
  );
  return res.rows.map(rowToFeedCard).filter(Boolean);
}

function pageResult(rows, filters, limit, offset) {
  let cards = rows.slice(0, limit);
  let sectionDate = null;
  if (filters.group_by === 'day' && cards.length) {
    const dayOf = (card) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(card.sort_at));
    sectionDate = dayOf(cards[0]);
    cards = cards.filter((card) => dayOf(card) === sectionDate);
  }
  const hasMore = rows.length > cards.length;
  const last = cards[cards.length - 1];
  return {
    cards, total: cards.length, limit, offset, has_more: hasMore,
    section_date: sectionDate,
    next_cursor: hasMore && last ? Buffer.from(JSON.stringify([last.sort_at, last.id])).toString('base64url') : null
  };
}

module.exports = {
  listFeed,
  listFollowedFeed,
  getFeedCardsByIds,
  toFeedCard,
  FEED_STRIP_KEYS
};
