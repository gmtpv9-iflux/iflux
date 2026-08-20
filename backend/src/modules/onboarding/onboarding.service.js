'use strict';

const { query } = require('../../core/database/connection');

const SEED_STEPS = [
  {
    channel: 'web',
    step_order: 1,
    title: 'Trang chủ',
    body_text: 'Trung tâm cá nhân: bảng điều khiển, watchlist và timeline hoạt động của bạn.',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&q=80',
    target_key: 'home'
  },
  {
    channel: 'web',
    step_order: 2,
    title: 'Thị trường',
    body_text: 'Theo dõi VN-Index, bản đồ nhiệt ngành và tổng quan thị trường theo thời gian thực.',
    image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=640&q=80',
    target_key: 'market'
  },
  {
    channel: 'web',
    step_order: 3,
    title: 'Dòng tiền',
    body_text: 'Công cụ độc quyền phân tích dòng tiền vào/ra theo mã và ngành.',
    image_url: 'https://images.unsplash.com/photo-1642543492484-46e09c27c9a1?w=640&q=80',
    target_key: 'flow'
  },
  {
    channel: 'web',
    step_order: 4,
    title: 'Cộng đồng',
    body_text: 'Đọc insight, theo dõi chuyên gia và chia sẻ quan điểm đầu tư.',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80',
    target_key: 'community'
  },
  {
    channel: 'web',
    step_order: 5,
    title: 'Tìm kiếm',
    body_text: 'Tìm nhanh mã CP, ngành, họ cổ phiếu hoặc câu chuyện — phím ⌘K.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&q=80',
    target_key: 'search'
  },
  {
    channel: 'web',
    step_order: 6,
    title: 'Gói cước',
    body_text: 'Nâng cấp Premium để mở khóa dòng tiền RT, alert nâng cao và widget không giới hạn.',
    image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=640&q=80',
    target_key: 'pricing'
  },
  {
    channel: 'app',
    step_order: 1,
    title: 'Chào mừng đến iFlux',
    body_text: 'Nền tảng theo dõi thị trường chứng khoán Việt Nam dành cho nhà đầu tư cá nhân.',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&q=80',
    target_key: null
  },
  {
    channel: 'app',
    step_order: 2,
    title: 'Thị trường realtime',
    body_text: 'Xem chỉ số, biểu đồ và bản đồ nhiệt ngay trên điện thoại.',
    image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=640&q=80',
    target_key: null
  },
  {
    channel: 'app',
    step_order: 3,
    title: 'Watchlist & Alert',
    body_text: 'Theo dõi mã yêu thích và nhận push khi điều kiện alert được kích hoạt.',
    image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e279e113?w=640&q=80',
    target_key: null
  },
  {
    channel: 'app',
    step_order: 4,
    title: 'Cộng đồng NĐT',
    body_text: 'Kết nối, học hỏi và chia sẻ chiến lược với cộng đồng iFlux.',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80',
    target_key: null
  },
  {
    channel: 'app',
    step_order: 5,
    title: 'Sẵn sàng bắt đầu!',
    body_text: 'Khám phá thị trường và cá nhân hóa trải nghiệm của bạn ngay hôm nay.',
    image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=640&q=80',
    target_key: null
  }
];

function mapRow(row) {
  return {
    id: row.id,
    channel: row.channel,
    step_order: row.step_order,
    title: row.title,
    body_text: row.body_text,
    image_url: row.image_url,
    target_key: row.target_key,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function ensureSeed() {
  const count = await query('SELECT COUNT(*)::int AS n FROM onboarding_steps');
  if (count.rows[0].n > 0) return;

  for (const step of SEED_STEPS) {
    await query(
      `INSERT INTO onboarding_steps (channel, step_order, title, body_text, image_url, target_key)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [step.channel, step.step_order, step.title, step.body_text, step.image_url, step.target_key]
    );
  }
}

async function listSteps(channel, { activeOnly = true } = {}) {
  await ensureSeed();
  const params = [channel];
  let sql =
    'SELECT * FROM onboarding_steps WHERE channel = $1';
  if (activeOnly) sql += ' AND is_active = TRUE';
  sql += ' ORDER BY step_order ASC, created_at ASC';
  const res = await query(sql, params);
  return res.rows.map(mapRow);
}

async function listAllSteps(channel) {
  await ensureSeed();
  const params = [];
  let sql = 'SELECT * FROM onboarding_steps';
  if (channel) {
    params.push(channel);
    sql += ' WHERE channel = $1';
  }
  sql += ' ORDER BY channel ASC, step_order ASC, created_at ASC';
  const res = await query(sql, params);
  return res.rows.map(mapRow);
}

async function getStepById(id) {
  const res = await query('SELECT * FROM onboarding_steps WHERE id = $1', [id]);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

async function createStep(payload) {
  const res = await query(
    `INSERT INTO onboarding_steps (channel, step_order, title, body_text, image_url, target_key, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      payload.channel,
      payload.step_order ?? 0,
      payload.title,
      payload.body_text || '',
      payload.image_url || null,
      payload.target_key || null,
      payload.is_active !== false
    ]
  );
  return mapRow(res.rows[0]);
}

async function updateStep(id, payload) {
  const existing = await getStepById(id);
  if (!existing) {
    const err = new Error('Step not found');
    err.statusCode = 404;
    throw err;
  }
  const res = await query(
    `UPDATE onboarding_steps SET
       channel = COALESCE($2, channel),
       step_order = COALESCE($3, step_order),
       title = COALESCE($4, title),
       body_text = COALESCE($5, body_text),
       image_url = COALESCE($6, image_url),
       target_key = COALESCE($7, target_key),
       is_active = COALESCE($8, is_active),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      payload.channel ?? null,
      payload.step_order ?? null,
      payload.title ?? null,
      payload.body_text ?? null,
      payload.image_url ?? null,
      payload.target_key ?? null,
      payload.is_active ?? null
    ]
  );
  return mapRow(res.rows[0]);
}

async function deleteStep(id) {
  const res = await query('DELETE FROM onboarding_steps WHERE id = $1 RETURNING id', [id]);
  if (!res.rows[0]) {
    const err = new Error('Step not found');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}

module.exports = {
  listSteps,
  listAllSteps,
  getStepById,
  createStep,
  updateStep,
  deleteStep,
  ensureSeed
};
