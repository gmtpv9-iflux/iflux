'use strict';

/**
 * Community Feed — FeedCard DTO only.
 * CẤM SELECT * / CẤM trả Persistence Model (body, body_html, comments[], …).
 */
const { query } = require('../../core/database/connection');
const { ensureSeeded } = require('./news.service');

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
    chu_de_id: p.chu_de_id || null,
    chu_de_slug: p.chu_de_slug || null,
    chu_de_name: p.chu_de_name || null,
    chu_de: p.chu_de || null,
    chu_de_tags: Array.isArray(p.chu_de_tags) ? p.chu_de_tags : undefined,
    story_tags: Array.isArray(p.story_tags) ? p.story_tags : (Array.isArray(p.chu_de_tags) ? p.chu_de_tags : []),
    sectors: Array.isArray(p.sectors) ? p.sectors : [],
    ecosystems: Array.isArray(p.ecosystems) ? p.ecosystems : [],
    content_origin: p.content_origin || null,
    external_url: p.external_url || null,
    source_label: p.source_label || null,
    image_url: p.image_url || (p.cover && p.cover.url) || null
  };

  if (!card.chu_de_tags && card.story_tags) card.chu_de_tags = card.story_tags;
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
    `SELECT id, content_type, status, created_at, ${FEED_PAYLOAD_SQL} AS payload` +
    ` FROM news_posts WHERE status IN ('published', 'published_rss')`;

  if (filters.content_type) {
    params.push(filters.content_type);
    sql += ` AND content_type = $${params.length}`;
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

  if (filters.chu_de_id) {
    params.push(String(filters.chu_de_id));
    sql += ` AND (
      payload->>'chu_de_id' = $${params.length}
      OR payload->'chu_de'->>'id' = $${params.length}
    )`;
  }

  if (filters.exclude_id) {
    params.push(String(filters.exclude_id));
    sql += ` AND id <> $${params.length} AND COALESCE(payload->>'slug', '') <> $${params.length}`;
  }

  sql += ` ORDER BY COALESCE((payload->>'published_at')::timestamptz, created_at) DESC`;

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
     FROM news_posts WHERE id = $1 LIMIT 1`,
    [key]
  );
  let row = byId.rows[0];
  if (!row) {
    const bySlug = await query(
      `SELECT id, content_type, status, created_at, ${FEED_PAYLOAD_SQL} AS payload
       FROM news_posts WHERE payload->>'slug' = $1 LIMIT 1`,
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
        chu_de_id: card.chu_de_id,
        tickers: card.tickers || []
      }
    : null;
}

async function mergeContentEngineCards(limit) {
  try {
    const content = require('../content/content.service');
    const feed = await content.getFeed(limit);
    return (feed || []).map(toFeedCard).filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * GET /community/feed — FeedCard[]
 * Query: limit, offset, ticker, category_id, chu_de_id, related_to, type (content_type)
 */
async function listFeed(filters) {
  filters = filters || {};
  await ensureSeeded();

  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 50);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  if (filters.related_to) {
    const seed = await resolveRelatedSeed(filters.related_to);
    if (!seed) return { cards: [], total: 0, limit, offset, has_more: false };

    let cards = [];
    if (seed.category_id) {
      cards = await fetchCommunityRows({
        limit: limit + 1,
        offset: 0,
        category_id: seed.category_id,
        exclude_id: seed.id
      });
    }
    if (cards.length < limit + 1 && seed.chu_de_id) {
      const more = await fetchCommunityRows({
        limit: limit + 1,
        offset: 0,
        chu_de_id: seed.chu_de_id,
        exclude_id: seed.id
      });
      const seen = {};
      cards.forEach(function (c) { seen[c.id] = true; });
      more.forEach(function (c) {
        if (!seen[c.id]) {
          seen[c.id] = true;
          cards.push(c);
        }
      });
    }
    if (cards.length < limit + 1 && seed.tickers && seed.tickers.length) {
      const more = await fetchCommunityRows({
        limit: limit + 1,
        offset: 0,
        ticker: seed.tickers[0],
        exclude_id: seed.id
      });
      const seen = {};
      cards.forEach(function (c) { seen[c.id] = true; });
      more.forEach(function (c) {
        if (!seen[c.id]) {
          seen[c.id] = true;
          cards.push(c);
        }
      });
    }
    if (cards.length < limit + 1) {
      const more = await fetchCommunityRows({
        limit: limit + 1,
        offset: 0,
        exclude_id: seed.id
      });
      const seen = {};
      cards.forEach(function (c) { seen[c.id] = true; });
      more.forEach(function (c) {
        if (!seen[c.id]) {
          seen[c.id] = true;
          cards.push(c);
        }
      });
    }
    const has_more = cards.length > limit;
    cards = cards.slice(0, limit);
    return { cards: cards, total: cards.length, limit: limit, offset: 0, has_more: has_more };
  }

  /* L+1 → has_more; cùng filter + ORDER BY deterministic (fetchCommunityRows) */
  const communityCards = await fetchCommunityRows({
    limit: limit + 1,
    offset: offset,
    ticker: filters.ticker,
    category_id: filters.category_id,
    chu_de_id: filters.chu_de_id,
    content_type: filters.content_type || filters.type || null
  });

  let has_more = communityCards.length > limit;
  let cards = communityCards.slice(0, limit);

  /* Trộn Content Engine chỉ khi feed tổng (không ticker/entity filter) · page 0 */
  if (!filters.ticker && !filters.category_id && !filters.chu_de_id && offset === 0) {
    if (!filters.content_type || filters.content_type === 'news' || filters.type === 'news') {
      const external = await mergeContentEngineCards(limit + 1);
      const pool = communityCards.slice();
      const seen = {};
      pool.forEach(function (c) { if (c && c.id) seen[c.id] = true; });
      external.forEach(function (c) {
        if (c && c.id && !seen[c.id]) {
          seen[c.id] = true;
          pool.push(c);
        }
      });
      pool.sort(function (a, b) {
        const ta = new Date(a.published_at || a.created_at || 0).getTime();
        const tb = new Date(b.published_at || b.created_at || 0).getTime();
        return tb - ta;
      });
      has_more = pool.length > limit || has_more;
      cards = pool.slice(0, limit);
    }
  }

  return { cards: cards, total: cards.length, limit: limit, offset: offset, has_more: !!has_more };
}

module.exports = {
  listFeed,
  toFeedCard,
  FEED_STRIP_KEYS
};
