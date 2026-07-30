'use strict';

/**
 * RSS → community_posts.
 * Đủ trường bắt buộc (title + category) → status=published_rss (lên User Web ngay).
 * Thiếu bắt buộc → status=pending (Chờ duyệt).
 * Chủ đề tuỳ chọn — Admin có thể bổ sung / chuyển Xuất bản sau khi edit.
 */
const { query } = require('../../core/database/connection');
const categories = require('./community-categories.service');
const { MAPPINGS, PROVIDER_NAMES } = require('./rss-mappings');

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

const UA = 'iFluxRssIngest/1.0 (+https://iflux.vn)';
const DEFAULT_LIMIT_PER_FEED = 5;
const FETCH_TIMEOUT_MS = 20000;

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function metaContent(html, key) {
  const patterns = [
    new RegExp(
      '<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]+content=["\']([^"\']+)["\']',
      'i'
    ),
    new RegExp(
      '<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + key + '["\']',
      'i'
    )
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = html.match(patterns[i]);
    if (m && m[1]) return decodeEntities(m[1]);
  }
  return '';
}

function extractBlock(html, needle, maxLen) {
  maxLen = maxLen || 180000;
  const lower = html.toLowerCase();
  const idx = lower.indexOf(needle.toLowerCase());
  if (idx < 0) return '';
  /* tìm '>' mở thẻ chứa needle */
  const gt = html.indexOf('>', idx);
  if (gt < 0) return '';
  let i = gt + 1;
  let depth = 1;
  const openRe = /<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g;
  openRe.lastIndex = i;
  let m;
  while ((m = openRe.exec(html)) && depth > 0 && openRe.lastIndex - i < maxLen) {
    const tag = m[1].toLowerCase();
    if (['br', 'img', 'hr', 'meta', 'link', 'input', 'source'].indexOf(tag) >= 0) continue;
    if (m[0].charAt(1) === '/') depth -= 1;
    else if (!/\/>$/.test(m[0])) depth += 1;
    if (depth === 0) {
      return html.slice(i, m.index);
    }
  }
  return html.slice(i, Math.min(html.length, i + maxLen));
}

function extractBySelectorApprox(html, classOrId) {
  const byClass = extractBlock(html, 'class="' + classOrId) || extractBlock(html, "class='" + classOrId) ||
    extractBlock(html, 'class="' + classOrId.replace(/-/g, ' ')) || '';
  if (byClass && stripTags(byClass).length > 80) return byClass;
  const byId = extractBlock(html, 'id="' + classOrId) || extractBlock(html, "id='" + classOrId) || '';
  if (byId && stripTags(byId).length > 80) return byId;
  /* partial class contains */
  const re = new RegExp('(class|id)=["\'][^"\']*' + classOrId + '[^"\']*["\']', 'i');
  const m = html.match(re);
  if (m) {
    const block = extractBlock(html, m[0].slice(0, Math.min(40, m[0].length)));
    if (block) return block;
  }
  return '';
}

function parseIsoOrRssDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  /* DD/MM/YYYY HH:mm */
  const m = String(raw).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const iso = new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4]),
      Number(m[5])
    );
    if (!Number.isNaN(iso.getTime())) return iso.toISOString();
  }
  return null;
}

async function fetchText(url) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(function () {
    if (ctrl) ctrl.abort();
  }, FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: ctrl ? ctrl.signal : undefined,
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseRssItems(xml, limit) {
  const items = [];
  const re = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) && items.length < limit) {
    const block = m[1];
    const title = decodeEntities((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link =
      decodeEntities((block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '').trim() ||
      decodeEntities((block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) || [])[1] || '').trim();
    const desc = decodeEntities((block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || '');
    const pub = decodeEntities((block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || '');
    const imgFromDesc = (desc.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || '';
    if (!link || !title) continue;
    items.push({
      title: stripTags(title),
      url: link,
      description: stripTags(desc).slice(0, 2000),
      pubDate: pub,
      image_url: imgFromDesc
    });
  }
  return items;
}

function enrichFromHtml(providerId, html, seed) {
  const title =
    metaContent(html, 'og:title') ||
    ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] &&
      stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1])) ||
    seed.title;

  const description =
    metaContent(html, 'og:description') ||
    metaContent(html, 'description') ||
    seed.description ||
    '';

  const image =
    metaContent(html, 'og:image') ||
    seed.image_url ||
    '';

  const canonical = metaContent(html, 'og:url') || seed.url;
  const keywords = metaContent(html, 'keywords') || metaContent(html, 'news_keywords') || '';
  const published =
    metaContent(html, 'article:published_time') ||
    metaContent(html, 'pubdate') ||
    seed.pubDate;
  const modified = metaContent(html, 'article:modified_time') || '';

  let author = metaContent(html, 'author') || metaContent(html, 'article:author') || '';
  let bodyHtml = '';

  if (providerId === 'cafef') {
    bodyHtml =
      extractBySelectorApprox(html, 'detail-content') ||
      extractBySelectorApprox(html, 'mainContent') ||
      '';
    if (!author) {
      const am = html.match(/article:author["'][^>]+content=["']([^"']+)/i);
      if (am) author = decodeEntities(am[1]);
    }
  } else if (providerId === 'vietstock') {
    bodyHtml =
      extractBySelectorApprox(html, 'article-content') ||
      extractBySelectorApprox(html, 'pAuthor') ||
      '';
    const am = html.match(/class=["'][^"']*pAuthor[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|span)>/i);
    if (am) author = stripTags(am[1]);
  } else if (providerId === 'baodautu') {
    bodyHtml =
      extractBySelectorApprox(html, 'main_detail') ||
      extractBySelectorApprox(html, 'sapo_detail') ||
      '';
    const am = html.match(/class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|span)>/i);
    if (am) author = stripTags(am[1]);
    const dm = html.match(/(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2})/);
    if (dm && !published) {
      /* keep */
    }
  }

  /* Fallback: article / og body */
  if (!bodyHtml || stripTags(bodyHtml).length < 80) {
    const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (art) bodyHtml = art[1];
  }

  const bodyText = stripTags(bodyHtml);
  const excerpt = (description || bodyText).slice(0, 500);

  /* Tickers heuristic từ keywords/title */
  const tickers = [];
  const blob = (title + ' ' + keywords + ' ' + excerpt).toUpperCase();
  const dict = [
    'FPT', 'HPG', 'VCB', 'SSI', 'MWG', 'VIC', 'VHM', 'GAS', 'TCB', 'MBB', 'ACB', 'VNM', 'MSN',
    'CTR', 'CMG', 'NLG', 'HSG', 'ELC', 'BID', 'CTG', 'VPB', 'TPB', 'STB', 'HDB', 'LPB'
  ];
  dict.forEach(function (t) {
    if (new RegExp('\\b' + t + '\\b').test(blob) && tickers.indexOf(t) < 0 && tickers.length < 5) {
      tickers.push(t);
    }
  });

  return {
    title: stripTags(title).slice(0, 300) || seed.title,
    excerpt,
    body_html: bodyHtml ? String(bodyHtml).slice(0, 200000) : '',
    body: bodyText.slice(0, 100000),
    cover_url: image,
    seo_title: stripTags(title).slice(0, 255),
    seo_description: excerpt.slice(0, 500),
    seo_keywords: keywords.slice(0, 500),
    canonical: canonical || seed.url,
    author_name: author.slice(0, 160),
    published_at: parseIsoOrRssDate(published) || parseIsoOrRssDate(seed.pubDate),
    updated_at: parseIsoOrRssDate(modified),
    tickers
  };
}

async function findByExternalUrl(url) {
  const res = await query(
    `SELECT id FROM community_posts
     WHERE payload->>'external_url' = $1
        OR payload->'seo'->>'canonical' = $1
     LIMIT 1`,
    [url]
  );
  return res.rows[0] || null;
}

/** Trường bắt buộc bài viết: title + category_id (đồng bộ community-articles.service) */
function isRssReadyToPublish(payload) {
  const title = String(payload && payload.title || '').trim();
  const categoryId = payload && payload.category_id;
  return !!(title && categoryId);
}

function resolveRssStatus(payload) {
  return isRssReadyToPublish(payload) ? 'published_rss' : 'pending';
}

async function upsertRssArticle(payload) {
  const desiredStatus = resolveRssStatus(payload);
  const existing = await findByExternalUrl(payload.external_url);
  const now = new Date().toISOString();
  if (existing) {
    /* Không ghi đè bài đã xuất bản / lên lịch — chỉ cập nhật pending/draft */
    const cur = await query('SELECT id, status, payload FROM community_posts WHERE id = $1', [existing.id]);
    const row = cur.rows[0];
    if (!row) return { id: existing.id, action: 'skip' };
    if (row.status !== 'pending' && row.status !== 'draft') {
      return { id: row.id, action: 'skip_locked' };
    }
    const merged = Object.assign({}, row.payload || {}, payload, {
      id: row.id,
      updated_at: now,
      status: desiredStatus,
      published_at: desiredStatus === 'published_rss'
        ? (payload.published_at || (row.payload && row.payload.published_at) || now)
        : null
    });
    await query(
      `UPDATE community_posts SET status = $2, payload = $3::jsonb, updated_at = NOW() WHERE id = $1`,
      [row.id, desiredStatus, JSON.stringify(merged)]
    );
    return { id: row.id, action: 'updated', status: desiredStatus };
  }

  const id = 'post_rss_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const record = Object.assign({}, payload, {
    id,
    created_at: now,
    updated_at: now,
    status: desiredStatus,
    published_at: desiredStatus === 'published_rss' ? (payload.published_at || now) : null,
    stats: { likes: 0, comments: 0, shares: 0, views: 0, favorites: 0 },
    comments: [],
    liked_by: [],
    favorited_by: []
  });
  await query(
    `INSERT INTO community_posts (id, user_id, content_type, status, payload, created_at, updated_at)
     VALUES ($1, NULL, $2, $3, $4::jsonb, NOW(), NOW())`,
    [id, 'article', desiredStatus, JSON.stringify(record)]
  );
  return { id, action: 'created', status: desiredStatus };
}

async function processFeed(mapping, limit) {
  const providerName = PROVIDER_NAMES[mapping.providerId] || mapping.providerId;
  const cat = await categories.getCategoryBySlug(mapping.ifluxCategorySlug);
  if (!cat) {
    return { mapping: mapping.id, error: 'category_not_found', created: 0, updated: 0 };
  }

  let xml;
  try {
    xml = await fetchText(mapping.rssUrl);
  } catch (err) {
    return { mapping: mapping.id, error: 'rss_fetch:' + err.message, created: 0, updated: 0 };
  }

  const items = parseRssItems(xml, limit);
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      let enriched = {
        title: item.title,
        excerpt: item.description,
        body_html: '',
        body: item.description,
        cover_url: item.image_url,
        seo_title: item.title,
        seo_description: item.description,
        seo_keywords: '',
        canonical: item.url,
        author_name: '',
        published_at: parseIsoOrRssDate(item.pubDate),
        updated_at: null,
        tickers: []
      };
      try {
        const html = await fetchText(item.url);
        enriched = enrichFromHtml(mapping.providerId, html, item);
      } catch (e) {
        /* giữ dữ liệu RSS nếu HTML fail */
      }

      const slugBase = slugify(enriched.title) || 'bai-rss';
      const payload = {
        title: enriched.title,
        slug: slugBase + '-' + Date.now().toString(36).slice(-4),
        excerpt: enriched.excerpt || '',
        body_html: enriched.body_html || enriched.body || '',
        body: enriched.body || stripTags(enriched.body_html || ''),
        content_type: 'article',
        category_id: cat.id,
        category_name: cat.name,
        chu_de_id: null,
        chu_de_slug: '',
        chu_de_name: '',
        tickers: enriched.tickers || [],
        sectors: [],
        ecosystems: [],
        exchange: null,
        cover: {
          url: enriched.cover_url || '',
          alt: enriched.title || '',
          caption: '',
          credit: providerName
        },
        seo: {
          title: enriched.seo_title || enriched.title,
          description: enriched.seo_description || enriched.excerpt || '',
          keywords: enriched.seo_keywords || '',
          canonical: enriched.canonical || item.url,
          meta_title: enriched.seo_title || enriched.title,
          meta_description: enriched.seo_description || enriched.excerpt || '',
          og_title: enriched.seo_title || enriched.title,
          og_description: enriched.seo_description || enriched.excerpt || '',
          og_image: enriched.cover_url || ''
        },
        status: resolveRssStatus({ title: enriched.title, category_id: cat.id }),
        display: { featured: false, pin: false, comments: true, share: true },
        scheduled_at: null,
        published_at: enriched.published_at,
        external_url: item.url,
        source_id: mapping.providerId,
        source_name: providerName,
        source_category: mapping.sourceCategory,
        origin: 'rss',
        from_rss: true,
        rss_mapping_id: mapping.id,
        author: {
          id: 'rss:' + mapping.providerId,
          display_name: enriched.author_name || providerName,
          tier: 'rss',
          tier_label: providerName
        },
        source: {
          type: 'rss',
          id: mapping.providerId,
          name: providerName,
          category: mapping.sourceCategory,
          rss_url: mapping.rssUrl
        }
      };

      const result = await upsertRssArticle(payload);
      if (result.action === 'created') created += 1;
      else if (result.action === 'updated') updated += 1;
      else skipped += 1;
    } catch (err) {
      errors.push({ url: item.url, error: err.message });
    }
  }

  return {
    mapping: mapping.id,
    feed: mapping.rssUrl,
    items: items.length,
    created,
    updated,
    skipped,
    errors: errors.slice(0, 3)
  };
}

async function runRssCommunityIngest(opts) {
  opts = opts || {};
  const limit = Math.min(Math.max(Number(opts.limitPerFeed) || Number(process.env.RSS_LIMIT_PER_FEED) || DEFAULT_LIMIT_PER_FEED, 1), 20);
  const only = opts.mappingIds || null;
  const mappings = MAPPINGS.filter(function (m) {
    if (only && only.indexOf(m.id) < 0) return false;
    return true;
  });

  const results = [];
  let created = 0;
  let updated = 0;
  for (let i = 0; i < mappings.length; i++) {
    const r = await processFeed(mappings[i], limit);
    results.push(r);
    created += r.created || 0;
    updated += r.updated || 0;
  }

  return {
    ok: true,
    ts: new Date().toISOString(),
    feeds: mappings.length,
    created,
    updated,
    results
  };
}

module.exports = {
  runRssCommunityIngest,
  processFeed,
  MAPPINGS
};
