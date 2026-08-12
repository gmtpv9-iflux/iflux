'use strict';

/**
 * SoT — schema field keys của bài Cộng đồng (community_posts.payload + cột bảng).
 * Khớp normalizeArticleInput / RSS ingest. Trang Đồng bộ cấu trúc đọc qua API → DB;
 * module này là contract seed/merge để key luôn đúng tên runtime.
 *
 * mapping RSS (cafef/vietstock/baodautu/note) lưu trong community_rss_schema.mapping_json.
 */

const SCHEMA_CODE = 'default_article';
const SCHEMA_VERSION = 2;

/** @typedef {{ key: string, label: string, group: string, cafef?: string, vietstock?: string, baodautu?: string, note?: string }} ArticleSchemaField */

/** @type {ArticleSchemaField[]} */
const ARTICLE_SCHEMA_FIELDS = [
  { key: 'title', label: 'Tiêu đề', group: 'content', cafef: 'title / og:title / headline', vietstock: 'title / og:title / h1', baodautu: 'og:title / .title-detail', note: 'Ưu tiên HTML > RSS' },
  { key: 'slug', label: 'URL (slug nội bộ)', group: 'content', cafef: '', vietstock: '', baodautu: '', note: 'iFlux tự sinh từ tiêu đề; URL gốc nguồn → external_url' },
  { key: 'excerpt', label: 'Mô tả bài viết', group: 'content', cafef: 'description / og:description / sapo', vietstock: 'description / og:description', baodautu: 'description / .sapo_detail', note: 'Ưu tiên HTML; RSS description nếu chưa có HTML' },
  { key: 'body_html', label: 'Nội dung bài viết', group: 'content', cafef: 'detail-content / articleBody', vietstock: '.article-content', baodautu: '.main_content.main_detail', note: 'Parse HTML full; cần selector đúng từng nguồn' },
  { key: 'content_type', label: 'Loại nội dung', group: 'content', cafef: '', vietstock: '', baodautu: '', note: 'Thường article — chỉ iFlux' },

  { key: 'category_id', label: 'Danh mục (id)', group: 'taxonomy', cafef: 'Breadcrumb JSON-LD', vietstock: 'article:section', baodautu: 'Chuyên mục từ URL / breadcrumb', note: 'Map sang Danh mục iFlux qua Đồng bộ danh mục' },
  { key: 'category_name', label: 'Danh mục (tên)', group: 'taxonomy', cafef: '', vietstock: '', baodautu: '', note: 'Derived từ category_id' },
  { key: 'chu_de_id', label: 'Chủ đề (id)', group: 'taxonomy', cafef: '', vietstock: '', baodautu: '', note: 'Nguồn không có — Admin / Cộng tác viên bổ sung sau' },
  { key: 'chu_de_slug', label: 'Chủ đề (slug)', group: 'taxonomy', cafef: '', vietstock: '', baodautu: '', note: 'Derived' },
  { key: 'chu_de_name', label: 'Chủ đề (tên)', group: 'taxonomy', cafef: '', vietstock: '', baodautu: '', note: 'Derived / hiển thị' },
  { key: 'chu_de_tags', label: 'Chủ đề (tags)', group: 'taxonomy', cafef: '', vietstock: '', baodautu: '', note: 'Array sau ensureChuDe; User Web story_tags' },

  { key: 'tickers', label: 'Chủ thể — Mã cổ phiếu', group: 'entity', cafef: 'news:stock_tickers + keywords', vietstock: 'keywords + tag', baodautu: 'keywords + tag_detail_item', note: 'Map Entity iFlux' },
  { key: 'sectors', label: 'Chủ thể — Ngành', group: 'entity', cafef: '', vietstock: '', baodautu: '', note: 'XOR với tickers/ecosystems theo rule bài' },
  { key: 'ecosystems', label: 'Chủ thể — Hệ sinh thái', group: 'entity', cafef: '', vietstock: '', baodautu: '', note: '' },
  { key: 'exchange', label: 'Chủ thể — Sàn', group: 'entity', cafef: '', vietstock: '', baodautu: '', note: 'Exclusive — không trộn entity khác' },
  { key: 'entity_occurrences', label: 'Entity occurrences', group: 'entity', cafef: '', vietstock: '', baodautu: '', note: 'Chi tiết vị trí entity trong body' },
  { key: 'entities', label: 'Entities (object legacy)', group: 'entity', cafef: '', vietstock: '', baodautu: '', note: '{ stocks, ecosystems } — shape phụ' },

  { key: 'cover.url', label: 'Ảnh đại diện — URL', group: 'cover', cafef: 'og:image / image.url / RSS description img', vietstock: 'og:image / RSS description img', baodautu: 'og:image', note: '' },
  { key: 'cover.alt', label: 'Ảnh đại diện — Alt', group: 'cover', cafef: 'image:title (sitemap) / alt img', vietstock: '', baodautu: '', note: 'Thường thiếu — có thể = tiêu đề' },
  { key: 'cover.caption', label: 'Ảnh đại diện — Caption', group: 'cover', cafef: 'image:caption (sitemap)', vietstock: '', baodautu: '', note: '' },
  { key: 'cover.credit', label: 'Ảnh đại diện — Credit', group: 'cover', cafef: '', vietstock: '', baodautu: '', note: 'Nguồn không cung cấp ổn định' },

  { key: 'seo.title', label: 'SEO Title', group: 'seo', cafef: 'og:title / title', vietstock: 'og:title / title', baodautu: 'og:title / title', note: '' },
  { key: 'seo.description', label: 'SEO Description', group: 'seo', cafef: 'meta description / og:description', vietstock: 'meta description / og:description', baodautu: 'meta description / og:description', note: '' },
  { key: 'seo.keywords', label: 'SEO Keywords', group: 'seo', cafef: 'keywords / news_keywords', vietstock: 'keywords', baodautu: 'keywords', note: '' },
  { key: 'seo.canonical', label: 'Canonical URL', group: 'seo', cafef: 'og:url / canonical', vietstock: 'og:url / canonical', baodautu: 'og:url / canonical', note: 'Thường = URL nguồn khi RSS' },
  { key: 'seo.meta_title', label: 'SEO meta_title', group: 'seo', cafef: '', vietstock: '', baodautu: '', note: 'Normalize ghi — thường = seo.title' },
  { key: 'seo.meta_description', label: 'SEO meta_description', group: 'seo', cafef: '', vietstock: '', baodautu: '', note: 'Normalize ghi' },
  { key: 'seo.og_title', label: 'SEO og_title', group: 'seo', cafef: '', vietstock: '', baodautu: '', note: 'Normalize ghi' },
  { key: 'seo.og_description', label: 'SEO og_description', group: 'seo', cafef: '', vietstock: '', baodautu: '', note: 'Normalize ghi' },
  { key: 'seo.og_image', label: 'SEO og_image', group: 'seo', cafef: 'og:image', vietstock: 'og:image', baodautu: 'og:image', note: 'Thường = cover.url' },
  { key: 'seo.og_image_alt', label: 'SEO OG Image ALT', group: 'seo', cafef: 'og:image:alt', vietstock: '', baodautu: '', note: 'Optional override — fallback cover.alt → title → empty' },

  { key: 'status', label: 'Trạng thái', group: 'lifecycle', cafef: '', vietstock: '', baodautu: '', note: 'Đủ title + category → published_rss; Admin Xuất bản → published' },
  { key: 'published_at', label: 'Ngày đăng', group: 'lifecycle', cafef: 'pubDate / datePublished / article:published_time', vietstock: 'pubDate / article:published_time', baodautu: 'Thời gian trên trang (DD/MM/YYYY HH:mm)', note: '' },
  { key: 'scheduled_at', label: 'Ngày lên lịch', group: 'lifecycle', cafef: '', vietstock: '', baodautu: '', note: 'Khi status = scheduled' },
  { key: 'updated_at', label: 'Ngày cập nhật', group: 'lifecycle', cafef: 'dateModified', vietstock: 'article:modified_time', baodautu: '', note: 'Cột bảng community_posts (+ payload mirror nếu có)' },
  { key: 'created_at', label: 'Ngày tạo', group: 'lifecycle', cafef: '', vietstock: '', baodautu: '', note: 'Cột bảng — chỉ iFlux' },

  { key: 'display.featured', label: 'Nổi bật', group: 'display', cafef: '', vietstock: '', baodautu: '', note: 'Chỉ cấu hình trên iFlux' },
  { key: 'display.pin', label: 'Ghim đầu trang', group: 'display', cafef: '', vietstock: '', baodautu: '', note: 'Chỉ cấu hình trên iFlux' },
  { key: 'display.comments', label: 'Cho phép bình luận', group: 'display', cafef: '', vietstock: '', baodautu: '', note: 'Mặc định theo policy iFlux' },
  { key: 'display.share', label: 'Cho phép chia sẻ', group: 'display', cafef: '', vietstock: '', baodautu: '', note: 'Mặc định theo policy iFlux' },

  { key: 'author.id', label: 'Tác giả / Nguồn — id', group: 'attribution', cafef: '', vietstock: '', baodautu: '', note: 'RSS: cafef|vietstock|baodautu · iFlux: admin/sub id' },
  { key: 'author.display_name', label: 'Tác giả / Nguồn — display_name', group: 'attribution', cafef: 'author.name / article:author → brand CafeF', vietstock: '.pAuthor / author meta → VietStock', baodautu: '.author → Báo Đầu Tư', note: 'SoT byline — không dùng VCCorp' },
  { key: 'author.tier', label: 'Tác giả — tier', group: 'attribution', cafef: '', vietstock: '', baodautu: '', note: 'Kỹ thuật / badge' },
  { key: 'author.tier_label', label: 'Tác giả — tier_label', group: 'attribution', cafef: '', vietstock: '', baodautu: '', note: 'Hiển thị badge User Web' },

  { key: 'external_url', label: 'URL nguồn', group: 'provenance', cafef: 'link / og:url', vietstock: 'link / og:url', baodautu: 'og:url', note: 'URL gốc bài trên trang nguồn' },
  { key: 'source_id', label: 'source_id', group: 'provenance', cafef: 'cafef', vietstock: 'vietstock', baodautu: 'baodautu', note: 'Provider id kỹ thuật' },
  { key: 'source_name', label: 'source_name', group: 'provenance', cafef: 'CafeF', vietstock: 'VietStock', baodautu: 'Báo Đầu Tư', note: 'Legacy — byline dùng author.display_name' },
  { key: 'source_category', label: 'source_category', group: 'provenance', cafef: 'Chuyên mục RSS', vietstock: 'Chuyên mục RSS', baodautu: 'Chuyên mục RSS', note: 'Category raw nguồn' },
  { key: 'from_rss', label: 'from_rss', group: 'provenance', cafef: 'true', vietstock: 'true', baodautu: 'true', note: 'Flag kỹ thuật' },
  { key: 'origin', label: 'origin', group: 'provenance', cafef: 'rss', vietstock: 'rss', baodautu: 'rss', note: '' },
  { key: 'rss_mapping_id', label: 'rss_mapping_id', group: 'provenance', cafef: '', vietstock: '', baodautu: '', note: 'Id mapping feed' },
  { key: 'source', label: 'source (object)', group: 'provenance', cafef: '', vietstock: '', baodautu: '', note: '{ type, id, name, category, rss_url }' },
  { key: 'publisher', label: 'publisher', group: 'provenance', cafef: '', vietstock: '', baodautu: '', note: 'Legacy cạnh tranh byline — không SoT hiển thị' },
  { key: 'provider', label: 'provider', group: 'provenance', cafef: '', vietstock: '', baodautu: '', note: 'Legacy cạnh tranh byline' },
  { key: 'vendor', label: 'vendor', group: 'provenance', cafef: '', vietstock: '', baodautu: '', note: 'Legacy (từng ghi VCCorp) — không SoT hiển thị' },

  { key: 'stats', label: 'Thống kê tương tác', group: 'engagement', cafef: '', vietstock: '', baodautu: '', note: 'likes/comments/shares/views — chỉ iFlux' },
  { key: 'geo', label: 'GEO / AI metadata', group: 'engagement', cafef: '', vietstock: '', baodautu: '', note: 'User Web GEO AI — không từ RSS' },
  { key: 'id', label: 'id (PK)', group: 'system', cafef: '', vietstock: '', baodautu: '', note: 'Cột bảng community_posts' },
  { key: 'user_id', label: 'user_id', group: 'system', cafef: '', vietstock: '', baodautu: '', note: 'Cột bảng' }
];

function buildDefaultMappingJson() {
  return {
    version: SCHEMA_VERSION,
    fields: ARTICLE_SCHEMA_FIELDS.map(function (f) {
      return {
        key: f.key,
        label: f.label,
        group: f.group,
        cafef: f.cafef || '',
        vietstock: f.vietstock || '',
        baodautu: f.baodautu || '',
        note: f.note || ''
      };
    })
  };
}

/**
 * Merge DB mapping overlays lên contract keys (thứ tự + tên = SoT code/DB payload).
 * @param {object|null} mappingJson
 */
function resolveFields(mappingJson) {
  const raw = mappingJson && typeof mappingJson === 'object' ? mappingJson : {};
  const byKey = Object.create(null);
  const list = Array.isArray(raw.fields) ? raw.fields : null;
  if (list) {
    list.forEach(function (row) {
      if (!row || !row.key) return;
      byKey[String(row.key)] = row;
    });
  } else {
    /* legacy stub {"title":"title","body":"content"} — bỏ qua */
    Object.keys(raw).forEach(function (k) {
      if (k === 'version' || k === 'fields') return;
      if (typeof raw[k] === 'string') {
        byKey[k] = { key: k, cafef: raw[k], vietstock: '', baodautu: '', note: '' };
      }
    });
  }

  return ARTICLE_SCHEMA_FIELDS.map(function (base) {
    const ov = byKey[base.key] || {};
    return {
      key: base.key,
      label: base.label,
      group: base.group,
      cafef: ov.cafef != null ? String(ov.cafef) : (base.cafef || ''),
      vietstock: ov.vietstock != null ? String(ov.vietstock) : (base.vietstock || ''),
      baodautu: ov.baodautu != null ? String(ov.baodautu) : (base.baodautu || ''),
      note: ov.note != null ? String(ov.note) : (base.note || '')
    };
  });
}

function needsSchemaUpgrade(mappingJson) {
  const raw = mappingJson && typeof mappingJson === 'object' ? mappingJson : {};
  const ver = Number(raw.version) || 0;
  if (ver < SCHEMA_VERSION) return true;
  if (!Array.isArray(raw.fields) || !raw.fields.length) return true;
  const keys = {};
  raw.fields.forEach(function (f) {
    if (f && f.key) keys[f.key] = true;
  });
  for (let i = 0; i < ARTICLE_SCHEMA_FIELDS.length; i++) {
    if (!keys[ARTICLE_SCHEMA_FIELDS[i].key]) return true;
  }
  return false;
}

module.exports = {
  SCHEMA_CODE,
  SCHEMA_VERSION,
  ARTICLE_SCHEMA_FIELDS,
  buildDefaultMappingJson,
  resolveFields,
  needsSchemaUpgrade
};
