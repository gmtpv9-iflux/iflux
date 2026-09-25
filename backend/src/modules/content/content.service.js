'use strict';

const { query } = require('../../core/database/connection');

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

async function listTopics(filters) {
  filters = filters || {};
  const params = [];
  let sql = 'SELECT * FROM content_chu_de_candidates WHERE 1=1';
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  }
  sql += ' ORDER BY interest_score DESC, label ASC';
  const limit = filters.limit ? Number(filters.limit) : 40;
  params.push(limit);
  sql += ` LIMIT $${params.length}`;
  const res = await query(sql, params);
  return res.rows;
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
    comment: o.interest_w_comment != null ? Number(o.interest_w_comment) : INTEREST_WEIGHTS.comment
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
    `INSERT INTO content_interest_events (candidate_id, event_type, user_id, meta)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING *`,
    [
      topicId,
      type,
      input.user_id || null,
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

  const candidates = await markCandidates();
  return { updated, period: periodKey, weights: cfg, candidates: candidates.length };
}

async function markCandidates() {
  const res = await query(
    `UPDATE content_chu_de_candidates SET
       status = 'candidate',
       candidate_at = COALESCE(candidate_at, NOW()),
       promote_reason = $1,
       updated_at = NOW()
     WHERE status = 'building'
       AND interest_score > 0
     RETURNING id, slug, label, interest_score`,
    ['auto: interest_score>0']
  );
  return res.rows;
}

async function promoteTopic(topicRef, opts) {
  opts = opts || {};
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
  if (!opts.force && topic.status !== 'candidate') {
    const err = new Error('Topic chưa đủ tiêu chí candidate (cần Admin force hoặc đạt interest)');
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

async function deleteChuDeAdmin(idOrSlug) {
  const story = await getStory(idOrSlug);
  if (!story) {
    const err = new Error('Không tìm thấy chủ đề');
    err.statusCode = 404;
    throw err;
  }
  await query('DELETE FROM content_chu_de WHERE id = $1', [story.id]);
  return { id: story.id };
}

async function setChuDeLifecycleAdmin(idOrSlug, lifecycle) {
  const story = await getStory(idOrSlug);
  if (!story) {
    const err = new Error('Không tìm thấy chủ đề');
    err.statusCode = 404;
    throw err;
  }
  const life = String(lifecycle || '').trim();
  const upd = await query(
    `UPDATE content_chu_de SET lifecycle = $2, status = 'active', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [story.id, life]
  );
  return rowToChuDeAdmin(upd.rows[0]);
}

/**
 * Top topics theo Interest trong period — shape cho WGT-COM-CHUDE-TOP.
 */
async function listTrendingTopics(filters) {
  filters = filters || {};
  const periodKey = filters.period || 'week';
  await recomputeInterestScores({ period: periodKey, config: filters.config });

  const cfg = interestConfig(filters.config);
  const ms = PERIOD_MS[periodKey] || PERIOD_MS.week;
  const since = new Date(Date.now() - ms).toISOString();
  const limit = filters.limit ? Number(filters.limit) : 10;

  const res = await query(
    `SELECT t.id, t.slug, t.label, t.status, t.chu_de_id,
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
       t.label ASC
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
    follow: o.relevance_w_follow != null ? Number(o.relevance_w_follow) : RELEVANCE_WEIGHTS.follow,
    autoPromoteEnabled: o.topic_auto_promote === true || o.topic_auto_promote === 'true',
    autoPromoteMinInterest: o.topic_auto_promote_min_interest != null
      ? Number(o.topic_auto_promote_min_interest)
      : 50,
    mappingKeepMinScore: o.relevance_keep_min != null ? Number(o.relevance_keep_min) : 1
  });
}

function relevanceScoreFromParts(parts, cfg) {
  const w = cfg || RELEVANCE_WEIGHTS;
  return (
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
       (chu_de_id, candidate_id, ticker, event_type, user_id, weight, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [
      storyId,
      topicId,
      ticker,
      type,
      input.user_id || null,
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
 * Nguồn: tương tác người dùng (content_relevance_events). mention_count / confidence_avg của mapping
 * (seed / Admin) giữ nguyên, không tính lại.
 */
async function recomputeRelevanceScores(opts) {
  opts = opts || {};
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
     )
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
     GROUP BY COALESCE(r.chu_de_id, st.chu_de_id), UPPER(r.ticker)`,
    params
  );

  const byStory = {};
  let upserted = 0;
  for (let i = 0; i < agg.rows.length; i++) {
    const row = agg.rows[i];
    if (!row.chu_de_id || !row.ticker) continue;
    const parts = {
      views: row.views || 0,
      likes: row.likes || 0,
      favorites: row.favorites || 0,
      shares: row.shares || 0,
      comments: row.comments || 0,
      follows: row.follows || 0
    };
    const score = relevanceScoreFromParts(parts, cfg);
    if (score < cfg.mappingKeepMinScore) continue;
    await query(
      `INSERT INTO content_chu_de_mappings
         (chu_de_id, ticker, entity_label, relevance_score,
          views, likes, comments, shares, favorites, status, method, computed_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active','auto',NOW(),NOW())
       ON CONFLICT (chu_de_id, ticker) DO UPDATE SET
         relevance_score = EXCLUDED.relevance_score,
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
        row.ticker,
        Math.round(score * 100) / 100,
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
 * Auto-promote candidates khi bật topic_auto_promote + đủ Interest.
 */
async function autoPromoteCandidates(opts) {
  opts = opts || {};
  const cfg = relevanceConfig(opts.config);
  if (!cfg.autoPromoteEnabled && !opts.forceRun) {
    return { enabled: false, promoted: [], skipped: 'topic_auto_promote=false' };
  }
  await recomputeInterestScores({ period: opts.period || 'week', config: opts.config });
  const candidates = await query(
    `SELECT t.* FROM content_chu_de_candidates t
     WHERE t.status = 'candidate'
       AND t.interest_score >= $1
     ORDER BY t.interest_score DESC
     LIMIT $2`,
    [cfg.autoPromoteMinInterest, opts.limit ? Number(opts.limit) : 20]
  );

  const promoted = [];
  for (let i = 0; i < candidates.rows.length; i++) {
    const topic = candidates.rows[i];
    const result = await promoteTopic(topic.id, {
      reason: 'auto: interest>=' + cfg.autoPromoteMinInterest,
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
  listTopics,
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
  deleteChuDeAdmin,
  setChuDeLifecycleAdmin,
  seedFoundationChuDe,
  ensureFoundationChuDe,
  INTEREST_WEIGHTS,
  RELEVANCE_WEIGHTS,
  PERIOD_DAYS,
  scoreFromParts,
  relevanceScoreFromParts
};
