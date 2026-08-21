'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

function crudList(table, order) {
  return async function list() {
    return (await query(`SELECT * FROM ${table} ORDER BY ${order}`)).rows || [];
  };
}

async function crudCreate(table, cols, vals) {
  const ph = cols.map((_, i) => '$' + (i + 1)).join(', ');
  const res = await query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${ph}) RETURNING *`,
    vals
  );
  return res.rows[0];
}

async function crudGet(table, id) {
  const res = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function crudDelete(table, id) {
  const res = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy');
  return { id };
}

const listEnums = crudList('meta_enums', 'code ASC');
const listSectorTypes = crudList('meta_sector_types', 'code ASC');
const listThemes = crudList('meta_themes', 'code ASC');
const listLifecycle = crudList('meta_story_lifecycle', 'sort_order ASC, code ASC');
const listComments = crudList('news_admin_comments', 'updated_at DESC');
const listReports = crudList('news_admin_reports', 'updated_at DESC');
const listRssSync = crudList('news_rss_sync_jobs', 'code ASC');

const articleSchemaFields = require('../news/news-article-schema-fields');

function enrichRssSchemaRow(row) {
  if (!row) return row;
  const mapping =
    row.mapping_json && typeof row.mapping_json === 'object' ? row.mapping_json : {};
  const fields = articleSchemaFields.resolveFields(mapping);
  return Object.assign({}, row, {
    fields,
    field_count: fields.length,
    schema_version: articleSchemaFields.SCHEMA_VERSION
  });
}

async function ensureDefaultArticleSchema() {
  const code = articleSchemaFields.SCHEMA_CODE;
  const existing = await query(
    `SELECT * FROM news_rss_schema WHERE code = $1 LIMIT 1`,
    [code]
  );
  const row = existing.rows[0] || null;
  const mapping = row && row.mapping_json ? row.mapping_json : null;
  if (row && !articleSchemaFields.needsSchemaUpgrade(mapping)) {
    return enrichRssSchemaRow(row);
  }

  const next = {
    version: articleSchemaFields.SCHEMA_VERSION,
    fields: articleSchemaFields.resolveFields(mapping)
  };

  if (row) {
    const res = await query(
      `UPDATE news_rss_schema
       SET name = $2, mapping_json = $3::jsonb, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [row.id, 'Schema bài viết Cộng đồng (news_posts)', JSON.stringify(next)]
    );
    return enrichRssSchemaRow(res.rows[0]);
  }

  const ins = await query(
    `INSERT INTO news_rss_schema (code, name, mapping_json)
     VALUES ($1, $2, $3::jsonb)
     RETURNING *`,
    [code, 'Schema bài viết Cộng đồng (news_posts)', JSON.stringify(next)]
  );
  return enrichRssSchemaRow(ins.rows[0]);
}

async function listRssSchema() {
  await ensureDefaultArticleSchema();
  const rows = (await query(`SELECT * FROM news_rss_schema ORDER BY code ASC`)).rows || [];
  return rows.map(enrichRssSchemaRow);
}

async function createEnum(input) {
  return crudCreate('meta_enums', ['code', 'name', 'values_text'], [
    String(input.code || '').trim(),
    String(input.name || '').trim(),
    String(input.values_text || '')
  ]);
}

async function updateEnum(id, input) {
  const cur = await crudGet('meta_enums', id);
  if (!cur) throw AppError.notFound('Không tìm thấy enum');
  const res = await query(
    `UPDATE meta_enums SET name=$2, values_text=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      input.values_text != null ? String(input.values_text) : cur.values_text
    ]
  );
  return res.rows[0];
}

async function createSectorType(input) {
  return crudCreate('meta_sector_types', ['code', 'name', 'description'], [
    String(input.code || '').trim(),
    String(input.name || '').trim(),
    String(input.description || '')
  ]);
}

async function updateSectorType(id, input) {
  const cur = await crudGet('meta_sector_types', id);
  if (!cur) throw AppError.notFound('Không tìm thấy loại ngành');
  const res = await query(
    `UPDATE meta_sector_types SET name=$2, description=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      input.description != null ? String(input.description) : cur.description
    ]
  );
  return res.rows[0];
}

async function updateTheme(id, input) {
  const cur = await crudGet('meta_themes', id);
  if (!cur) throw AppError.notFound('Không tìm thấy theme');
  const res = await query(
    `UPDATE meta_themes SET name=$2, config_json=$3::jsonb, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      JSON.stringify(input.config_json != null ? input.config_json : cur.config_json)
    ]
  );
  return res.rows[0];
}

async function updateLifecycle(id, input) {
  const cur = await crudGet('meta_story_lifecycle', id);
  if (!cur) throw AppError.notFound('Không tìm thấy giai đoạn');
  const res = await query(
    `UPDATE meta_story_lifecycle SET name=$2, sort_order=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      input.sort_order != null ? Number(input.sort_order) : cur.sort_order
    ]
  );
  return res.rows[0];
}

async function getBrand() {
  const res = await query(`SELECT * FROM marketing_brand_identity WHERE code='primary' LIMIT 1`);
  return res.rows[0] || { code: 'primary', payload: {} };
}

async function updateBrand(payload) {
  const cur = await getBrand();
  const prev =
    cur.payload && typeof cur.payload === 'object' && !Array.isArray(cur.payload)
      ? cur.payload
      : {};
  const patch = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const next = Object.assign({}, prev, patch);
  const res = await query(
    `UPDATE marketing_brand_identity SET payload=$1::jsonb, updated_at=NOW()
     WHERE code='primary' RETURNING *`,
    [JSON.stringify(next)]
  );
  if (!res.rows[0]) {
    return crudCreate('marketing_brand_identity', ['code', 'payload'], [
      'primary',
      JSON.stringify(next)
    ]);
  }
  return res.rows[0];
}

async function deleteComment(id) {
  return crudDelete('news_admin_comments', id);
}

async function updateReport(id, input) {
  const cur = await crudGet('news_admin_reports', id);
  if (!cur) throw AppError.notFound('Không tìm thấy báo cáo');
  const res = await query(
    `UPDATE news_admin_reports SET status=$2, reason=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [
      id,
      input.status != null ? String(input.status).trim() : cur.status,
      input.reason != null ? String(input.reason) : cur.reason
    ]
  );
  return res.rows[0];
}

function contentDashboard() {
  return {
    cards: [
      { key: 'posts', label: 'Bài viết', value: '—' },
      { key: 'comments', label: 'Bình luận', value: '—' },
      { key: 'reports', label: 'Báo cáo mở', value: '—' }
    ],
    updated_at: new Date().toISOString()
  };
}

async function updateRssSync(id, input) {
  const cur = await crudGet('news_rss_sync_jobs', id);
  if (!cur) throw AppError.notFound('Không tìm thấy job đồng bộ');
  const res = await query(
    `UPDATE news_rss_sync_jobs SET name=$2, config_json=$3::jsonb, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      JSON.stringify(input.config_json != null ? input.config_json : cur.config_json)
    ]
  );
  return res.rows[0];
}

async function executeRssSync(id) {
  const cur = await crudGet('news_rss_sync_jobs', id);
  if (!cur) throw AppError.notFound('Không tìm thấy job đồng bộ');
  const res = await query(
    `UPDATE news_rss_sync_jobs SET status='success', last_run_at=NOW(), updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id]
  );
  return res.rows[0];
}

async function updateRssSchema(id, input) {
  const cur = await crudGet('news_rss_schema', id);
  if (!cur) throw AppError.notFound('Không tìm thấy schema');
  let mappingJson = input.mapping_json != null ? input.mapping_json : cur.mapping_json;
  if (mappingJson && Array.isArray(mappingJson.fields)) {
    mappingJson = {
      version: articleSchemaFields.SCHEMA_VERSION,
      fields: articleSchemaFields.resolveFields(mappingJson)
    };
  }
  const res = await query(
    `UPDATE news_rss_schema SET name=$2, mapping_json=$3::jsonb, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      JSON.stringify(mappingJson)
    ]
  );
  return enrichRssSchemaRow(res.rows[0]);
}

module.exports = {
  listEnums,
  createEnum,
  updateEnum,
  deleteEnum: (id) => crudDelete('meta_enums', id),
  listSectorTypes,
  createSectorType,
  updateSectorType,
  deleteSectorType: (id) => crudDelete('meta_sector_types', id),
  listThemes,
  updateTheme,
  listLifecycle,
  updateLifecycle,
  getBrand,
  updateBrand,
  listComments,
  deleteComment,
  listReports,
  updateReport,
  contentDashboard,
  listRssSync,
  updateRssSync,
  executeRssSync,
  listRssSchema,
  updateRssSchema,
  ensureDefaultArticleSchema
};
