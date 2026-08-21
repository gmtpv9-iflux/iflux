'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

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

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    icon: row.icon || 'ti ti-folder',
    color: row.color || '#696CFF',
    cover_url: row.cover_url || '',
    parent_id: row.parent_id || null,
    parent_name: row.parent_name || null,
    sort_order: Number(row.sort_order) || 0,
    is_visible: !!row.is_visible,
    is_featured: !!row.is_featured,
    post_count: Number(row.post_count) || 0,
    seo_title: row.seo_title || '',
    seo_description: row.seo_description || '',
    seo_keywords: row.seo_keywords || '',
    created_by_name: row.created_by_name || 'Hệ thống',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

const SELECT_BASE = `
  SELECT c.*, p.name AS parent_name
  FROM news_categories c
  LEFT JOIN news_categories p ON p.id = c.parent_id
`;

async function listCategories(filters = {}) {
  const params = [];
  let sql = SELECT_BASE + ' WHERE 1=1';
  if (filters.visibleOnly) {
    sql += ' AND c.is_visible = TRUE';
  }
  if (filters.featuredOnly) {
    sql += ' AND c.is_featured = TRUE';
  }
  if (filters.parent_id === null) {
    sql += ' AND c.parent_id IS NULL';
  } else if (filters.parent_id) {
    params.push(filters.parent_id);
    sql += ` AND c.parent_id = $${params.length}`;
  }
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(c.name) LIKE $${params.length} OR LOWER(c.slug) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length})`;
  }
  sql += ' ORDER BY c.sort_order ASC, c.name ASC';
  const res = await query(sql, params);
  return res.rows.map(mapRow);
}

async function getCategory(id) {
  const res = await query(SELECT_BASE + ' WHERE c.id = $1', [id]);
  return mapRow(res.rows[0]);
}

async function getCategoryBySlug(slug) {
  const res = await query(SELECT_BASE + ' WHERE c.slug = $1', [slug]);
  return mapRow(res.rows[0]);
}

async function assertParentOk(parentId, selfId) {
  if (!parentId) return null;
  if (selfId && parentId === selfId) {
    throw AppError.badRequest('CATEGORY_PARENT_SELF', 'Danh mục cha không thể là chính nó');
  }
  const parent = await getCategory(parentId);
  if (!parent) {
    throw AppError.badRequest('CATEGORY_PARENT_NOT_FOUND', 'Không tìm thấy danh mục cha');
  }
  if (selfId) {
    /* chặn tạo vòng: parent không được là con của self */
    let cursor = parent;
    let guard = 0;
    while (cursor && cursor.parent_id && guard < 20) {
      if (cursor.parent_id === selfId) {
        throw AppError.badRequest('CATEGORY_PARENT_CYCLE', 'Không thể chọn danh mục con làm cha');
      }
      cursor = await getCategory(cursor.parent_id);
      guard += 1;
    }
  }
  return parent;
}

async function createCategory(input, actorName) {
  const name = String(input.name || '').trim();
  if (!name) throw AppError.badRequest('CATEGORY_NAME_REQUIRED', 'Tên danh mục là bắt buộc');

  let slug = slugify(input.slug || name);
  if (!slug) throw AppError.badRequest('CATEGORY_SLUG_REQUIRED', 'Slug không hợp lệ');

  const existing = await getCategoryBySlug(slug);
  if (existing) throw AppError.badRequest('CATEGORY_SLUG_EXISTS', 'Slug đã tồn tại');

  const parentId = input.parent_id || null;
  await assertParentOk(parentId, null);

  const res = await query(
    `INSERT INTO news_categories (
      name, slug, description, icon, color, cover_url, parent_id, sort_order,
      is_visible, is_featured, seo_title, seo_description, seo_keywords, created_by_name
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
    ) RETURNING id`,
    [
      name,
      slug,
      String(input.description || ''),
      String(input.icon || 'ti ti-folder').trim() || 'ti ti-folder',
      String(input.color || '#696CFF').trim() || '#696CFF',
      input.cover_url ? String(input.cover_url).trim() : null,
      parentId,
      Number.isFinite(Number(input.sort_order)) ? Number(input.sort_order) : 0,
      input.is_visible === false ? false : true,
      !!input.is_featured,
      String(input.seo_title || ''),
      String(input.seo_description || ''),
      String(input.seo_keywords || ''),
      String(actorName || input.created_by_name || 'Admin').slice(0, 120)
    ]
  );
  return getCategory(res.rows[0].id);
}

async function updateCategory(id, input) {
  const current = await getCategory(id);
  if (!current) throw AppError.notFound('Không tìm thấy danh mục');

  const name = input.name != null ? String(input.name).trim() : current.name;
  if (!name) throw AppError.badRequest('CATEGORY_NAME_REQUIRED', 'Tên danh mục là bắt buộc');

  let slug = input.slug != null ? slugify(input.slug) : current.slug;
  if (!slug) throw AppError.badRequest('CATEGORY_SLUG_REQUIRED', 'Slug không hợp lệ');
  if (slug !== current.slug) {
    const conflict = await getCategoryBySlug(slug);
    if (conflict) throw AppError.badRequest('CATEGORY_SLUG_EXISTS', 'Slug đã tồn tại');
  }

  const parentId = Object.prototype.hasOwnProperty.call(input, 'parent_id')
    ? (input.parent_id || null)
    : current.parent_id;
  await assertParentOk(parentId, id);

  await query(
    `UPDATE news_categories SET
      name = $2,
      slug = $3,
      description = $4,
      icon = $5,
      color = $6,
      cover_url = $7,
      parent_id = $8,
      sort_order = $9,
      is_visible = $10,
      is_featured = $11,
      seo_title = $12,
      seo_description = $13,
      seo_keywords = $14,
      updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      name,
      slug,
      input.description != null ? String(input.description) : current.description,
      input.icon != null ? (String(input.icon).trim() || 'ti ti-folder') : current.icon,
      input.color != null ? (String(input.color).trim() || '#696CFF') : current.color,
      Object.prototype.hasOwnProperty.call(input, 'cover_url')
        ? (input.cover_url ? String(input.cover_url).trim() : null)
        : (current.cover_url || null),
      parentId,
      input.sort_order != null && Number.isFinite(Number(input.sort_order))
        ? Number(input.sort_order)
        : current.sort_order,
      input.is_visible != null ? !!input.is_visible : current.is_visible,
      input.is_featured != null ? !!input.is_featured : current.is_featured,
      input.seo_title != null ? String(input.seo_title) : current.seo_title,
      input.seo_description != null ? String(input.seo_description) : current.seo_description,
      input.seo_keywords != null ? String(input.seo_keywords) : current.seo_keywords
    ]
  );
  return getCategory(id);
}

async function deleteCategory(id) {
  const current = await getCategory(id);
  if (!current) throw AppError.notFound('Không tìm thấy danh mục');

  const kids = await query('SELECT COUNT(*)::int AS n FROM news_categories WHERE parent_id = $1', [id]);
  if (kids.rows[0].n > 0) {
    throw AppError.badRequest('CATEGORY_HAS_CHILDREN', 'Hãy xóa hoặc chuyển danh mục con trước');
  }
  await query('DELETE FROM news_categories WHERE id = $1', [id]);
  return { id, deleted: true };
}

module.exports = {
  slugify,
  listCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
