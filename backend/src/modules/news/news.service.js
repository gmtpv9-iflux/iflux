'use strict';

const { query } = require('../../core/database/connection');

const SEED_POSTS = [
  {
    id: 'post_seed_hpg',
    content_type: 'news',
    status: 'published',
    payload: {
      id: 'post_seed_hpg',
      slug: 'hpg-tri-vong-thep-dau-tu-cong-2026',
      title: 'HPG và chu kỳ thép: Dòng tiền đầu tư công hỗ trợ?',
      excerpt: 'Phân tích HPG khi ngành thép hưởng lợi từ đầu tư công.',
      body_html: '<p>HPG duy trì vị thế dẫn đầu ngành thép.</p>',
      tickers: ['HPG', 'HSG'],
      author: { id: 'admin_iflux', display_name: 'iFlux Editorial', tier: 'admin', tier_label: 'Admin' },
      stats: { likes: 42, comments: 8, shares: 12, views: 890, favorites: 15 },
      comments: [],
      liked_by: [],
      favorited_by: [],
      created_at: '2026-07-01T08:00:00.000Z',
      published_at: '2026-07-01T08:00:00.000Z'
    }
  },
  {
    id: 'post_seed_fpt',
    content_type: 'news',
    status: 'published',
    payload: {
      id: 'post_seed_fpt',
      slug: 'fpt-ai-viet-nam-tang-truong-2026',
      title: 'FPT trong làn sóng AI Việt Nam: Câu chuyện tăng trưởng 2026',
      excerpt: 'Đánh giá vị thế FPT khi doanh nghiệp Việt tăng chi cho AI.',
      body_html: '<p>FPT đẩy mạnh hợp đồng AI và cloud.</p>',
      tickers: ['FPT'],
      author: { id: 'usr_demo_001', display_name: 'Nguyễn Văn Minh', tier: 'premium', tier_label: 'Premium' },
      stats: { likes: 18, comments: 1, shares: 5, views: 286, favorites: 7 },
      comments: [],
      liked_by: [],
      favorited_by: [],
      created_at: '2026-07-02T09:00:00.000Z',
      published_at: '2026-07-02T09:00:00.000Z'
    }
  }
];

async function ensureSeeded() {
  const res = await query('SELECT COUNT(*)::int AS n FROM news_posts');
  if (res.rows[0].n > 0) return;
  for (const p of SEED_POSTS) {
    await query(
      `INSERT INTO news_posts (id, content_type, status, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
      [p.id, p.content_type, p.status, JSON.stringify(p.payload)]
    );
  }
}

function rowToPost(row) {
  const payload = row.payload || {};
  payload.id = payload.id || row.id;
  payload.status = payload.status || row.status;
  payload.content_type = payload.content_type || row.content_type;
  return payload;
}

async function listPosts(filters = {}) {
  await ensureSeeded();
  const params = [];
  const status = filters.status || 'published';
  let sql;
  /* Mặc định / published: gồm cả Xuất bản (RSS) — cùng hiện trên User Web */
  if (status === 'published' || status === 'public') {
    sql = `SELECT * FROM news_posts WHERE status IN ('published', 'published_rss')`;
  } else {
    sql = 'SELECT * FROM news_posts WHERE status = $1';
    params.push(status);
  }
  if (filters.content_type) {
    params.push(filters.content_type);
    sql += ` AND content_type = $${params.length}`;
  }
  sql += ' ORDER BY created_at DESC';
  if (filters.limit) {
    params.push(Number(filters.limit));
    sql += ` LIMIT $${params.length}`;
  }
  const res = await query(sql, params);
  const posts = res.rows.map(rowToPost);

  /* P0: trộn bài Content Engine (tin ngoài) vào feed news */
  if (!filters.content_type || filters.content_type === 'news') {
    try {
      const content = require('../content/content.service');
      const feed = await content.getFeed(filters.limit ? Number(filters.limit) : 30);
      const seen = {};
      posts.forEach(function (p) { if (p && p.id) seen[p.id] = true; });
      feed.forEach(function (p) {
        if (p && p.id && !seen[p.id]) posts.push(p);
      });
      posts.sort(function (a, b) {
        const ta = new Date(a.published_at || a.created_at || 0).getTime();
        const tb = new Date(b.published_at || b.created_at || 0).getTime();
        return tb - ta;
      });
    } catch (e) {
      /* content module / migration chưa sẵn — bỏ qua */
    }
  }
  if (filters.limit) return posts.slice(0, Number(filters.limit));
  return posts;
}

async function createPost(userId, payload) {
  const id = payload.id || 'post_' + Date.now();
  const record = Object.assign({}, payload, {
    id,
    author: payload.author || { id: userId },
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    status: 'published',
    stats: payload.stats || { likes: 0, comments: 0, shares: 0, views: 0, favorites: 0 },
    comments: payload.comments || [],
    liked_by: [],
    favorited_by: []
  });
  await query(
    `INSERT INTO news_posts (id, user_id, content_type, status, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [id, userId, payload.content_type || 'news', 'published', JSON.stringify(record)]
  );
  return record;
}

module.exports = { listPosts, createPost, ensureSeeded };
