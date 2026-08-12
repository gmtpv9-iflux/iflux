'use strict';

/**
 * SEO Platform service — consumes Foundation site-seo effective config.
 */

var siteSeo = require('../site-seo/site-seo.service');
var contractBuilder = require('./seo-contract');
var headRenderer = require('./head-renderer');
var indexBoundary = require('./index-boundary');
var entityTemplates = require('./entity-templates');
var marketMaster = require('../market/market-master.service');
var db = require('../../core/database/connection');
var mediaService = require('../media/media.service');

var PATH_TO_PAGE_KEY = {
  '/': 'community',
  '/thi-truong': 'market',
  '/nha-cua-toi': 'dashboard',
  '/dong-tien': 'flow',
  '/cong-dong': 'community',
  '/co-phieu': 'stocks',
  '/nganh': 'sectors',
  '/he-sinh-thai': 'ecosystems',
  '/chu-de': 'cau-chuyen',
  '/cau-chuyen': 'cau-chuyen',
  '/hoi-dap': 'faq',
  '/thanh-vien': 'membership',
  '/tai-khoan': 'account',
  '/tin-nhan': 'messages',
  '/goi-cuoc': 'pricing'
};

var SITEMAP_STATIC = [
  { pageKey: 'market', path: '/thi-truong', changefreq: 'hourly', priority: '1.0' },
  { pageKey: 'community', path: '/cong-dong', changefreq: 'hourly', priority: '0.9' },
  { pageKey: 'flow', path: '/dong-tien', changefreq: 'hourly', priority: '0.9' },
  { pageKey: 'stocks', path: '/co-phieu', changefreq: 'daily', priority: '0.8' },
  { pageKey: 'sectors', path: '/nganh', changefreq: 'daily', priority: '0.8' },
  { pageKey: 'ecosystems', path: '/he-sinh-thai', changefreq: 'daily', priority: '0.8' },
  { pageKey: 'cau-chuyen', path: '/cau-chuyen', changefreq: 'daily', priority: '0.8' },
  { pageKey: 'faq', path: '/hoi-dap', changefreq: 'weekly', priority: '0.5' },
  { pageKey: 'membership', path: '/thanh-vien', changefreq: 'weekly', priority: '0.6' },
  { pageKey: 'pricing', path: '/goi-cuoc', changefreq: 'weekly', priority: '0.7' }
];

function pageKeyFromPath(path) {
  var clean = indexBoundary.stripPublicIdPath(path || '/');
  if (PATH_TO_PAGE_KEY[clean]) return PATH_TO_PAGE_KEY[clean];
  if (/^\/co-phieu\//i.test(clean)) return 'stock-detail';
  if (/^\/nganh\//i.test(clean)) return 'sector-detail';
  if (/^\/he-sinh-thai\//i.test(clean)) return 'eco-detail';
  if (/^\/chu-de\//i.test(clean) || /^\/cau-chuyen\//i.test(clean)) return 'cau-chuyen-detail';
  if (/^\/cong-dong\/tac-gia\//i.test(clean)) return 'com-author';
  if (/^\/cong-dong\/danh-muc\//i.test(clean)) return 'com-cat';
  if (/^\/cong-dong\/chu-de\//i.test(clean)) return 'com-topic';
  if (/^\/cong-dong\/bai-viet\//i.test(clean)) return 'community';
  return PATH_TO_PAGE_KEY[clean] || 'market';
}

function decodeSeg(raw) {
  try {
    return decodeURIComponent(String(raw || '').trim());
  } catch (e) {
    return String(raw || '').trim();
  }
}

/**
 * Wave B — load Admin VI placeholder vars for entity detail paths (bot shell / Contract).
 * Does NOT pass entity into P3 TITLE_TEMPLATES — Admin page_seo_configs wins via getPublicEffective(vars).
 */
async function loadEntitySeoContext(path) {
  var clean = indexBoundary.stripPublicIdPath(path || '/');
  var m;
  if ((m = clean.match(/^\/co-phieu\/([^/]+)\/?$/i))) {
    var ticker = decodeSeg(m[1]).toUpperCase();
    var stockName = ticker;
    try {
      var stock = await marketMaster.getStock(ticker);
      ticker = stock.ticker || ticker;
      stockName = stock.name || ticker;
    } catch (e) {
      /* keep ticker fallback */
    }
    return {
      pageKey: 'stock-detail',
      cleanPath: '/co-phieu/' + ticker,
      vars: { ticker: ticker, stockName: stockName }
    };
  }
  if ((m = clean.match(/^\/nganh\/([^/]+)\/?$/i))) {
    var sectorRef = decodeSeg(m[1]);
    var sectorName = sectorRef;
    var sectorSlug = sectorRef;
    try {
      var secRes = await db.query(
        `SELECT slug, name_vi FROM sectors
         WHERE lower(slug) = lower($1) OR lower(code) = lower($1) OR id::text = $1
         LIMIT 1`,
        [sectorRef]
      );
      if (secRes.rows[0]) {
        sectorSlug = secRes.rows[0].slug || sectorRef;
        sectorName = secRes.rows[0].name_vi || sectorSlug;
      }
    } catch (e) {
      /* keep ref fallback */
    }
    return {
      pageKey: 'sector-detail',
      cleanPath: '/nganh/' + sectorSlug,
      vars: { sectorName: sectorName }
    };
  }
  if ((m = clean.match(/^\/he-sinh-thai\/([^/]+)\/?$/i))) {
    var ecoRef = decodeSeg(m[1]);
    var ecoName = ecoRef;
    var ecoSlug = ecoRef;
    try {
      var ecoRes = await db.query(
        `SELECT slug, name_vi FROM ecosystems
         WHERE lower(slug) = lower($1) OR lower(code) = lower($1) OR id::text = $1
         LIMIT 1`,
        [ecoRef]
      );
      if (ecoRes.rows[0]) {
        ecoSlug = ecoRes.rows[0].slug || ecoRef;
        ecoName = ecoRes.rows[0].name_vi || ecoSlug;
      }
    } catch (e) {
      /* keep ref fallback */
    }
    return {
      pageKey: 'eco-detail',
      cleanPath: '/he-sinh-thai/' + ecoSlug,
      vars: { ecoName: ecoName }
    };
  }
  if ((m = clean.match(/^\/(?:cau-chuyen|chu-de)\/([^/]+)\/?$/i))) {
    var storyRef = decodeSeg(m[1]);
    var storyName = storyRef;
    var storySlug = storyRef;
    try {
      var storyRes = await db.query(
        `SELECT slug, label FROM content_chu_de
         WHERE lower(slug) = lower($1) OR id::text = $1
         LIMIT 1`,
        [storyRef]
      );
      if (storyRes.rows[0]) {
        storySlug = storyRes.rows[0].slug || storyRef;
        storyName = storyRes.rows[0].label || storySlug;
      }
    } catch (e) {
      /* keep ref fallback */
    }
    return {
      pageKey: 'cau-chuyen-detail',
      cleanPath: '/cau-chuyen/' + storySlug,
      vars: { storyName: storyName }
    };
  }
  if ((m = clean.match(/^\/cong-dong\/tac-gia\/([^/]+)\/?$/i))) {
    var authorRef = decodeSeg(m[1]);
    var authorName = authorRef;
    var authorKey = authorRef;
    try {
      var authRes = await db.query(
        `SELECT payload->'author'->>'id' AS id,
                COALESCE(payload->'author'->>'display_name', payload->'author'->>'name') AS display_name
         FROM community_posts
         WHERE payload->'author' IS NOT NULL
           AND (
             lower(payload->'author'->>'id') = lower($1)
             OR lower(COALESCE(payload->'author'->>'display_name', '')) = lower($1)
           )
         LIMIT 1`,
        [authorRef]
      );
      if (authRes.rows[0]) {
        authorKey = authRes.rows[0].id || authorRef;
        authorName = authRes.rows[0].display_name || authorKey;
      }
    } catch (e) {
      /* keep ref fallback */
    }
    return {
      pageKey: 'com-author',
      cleanPath: '/cong-dong/tac-gia/' + authorKey,
      vars: { authorName: authorName }
    };
  }
  if ((m = clean.match(/^\/cong-dong\/danh-muc\/([^/]+)\/?$/i))) {
    var catRef = decodeSeg(m[1]);
    var categoryName = catRef;
    var categorySlug = catRef;
    try {
      var catRes = await db.query(
        `SELECT slug, name FROM community_categories
         WHERE lower(slug) = lower($1) OR id::text = $1
         LIMIT 1`,
        [catRef]
      );
      if (catRes.rows[0]) {
        categorySlug = catRes.rows[0].slug || catRef;
        categoryName = catRes.rows[0].name || categorySlug;
      }
    } catch (e) {
      /* keep ref fallback */
    }
    return {
      pageKey: 'com-cat',
      cleanPath: '/cong-dong/danh-muc/' + categorySlug,
      vars: { categoryName: categoryName }
    };
  }
  if ((m = clean.match(/^\/cong-dong\/chu-de\/([^/]+)\/?$/i))) {
    var topicRef = decodeSeg(m[1]);
    var topicName = topicRef;
    var topicSlug = topicRef;
    try {
      var topicRes = await db.query(
        `SELECT slug, label FROM content_chu_de
         WHERE lower(slug) = lower($1) OR id::text = $1
         LIMIT 1`,
        [topicRef]
      );
      if (topicRes.rows[0]) {
        topicSlug = topicRes.rows[0].slug || topicRef;
        topicName = topicRes.rows[0].label || topicSlug;
      }
    } catch (e) {
      /* keep ref fallback */
    }
    return {
      pageKey: 'com-topic',
      cleanPath: '/cong-dong/chu-de/' + topicSlug,
      /* storyName alias — nếu Admin thêm placeholder {Tên câu chuyện} / name */
      vars: { storyName: topicName, name: topicName, title: topicName }
    };
  }
  return null;
}

async function resolveContract(input) {
  input = input || {};
  var path = input.path || '/';
  var entityCtx = null;
  if (!input.entity && !input.entityType && !input.manualOverride) {
    try {
      entityCtx = await loadEntitySeoContext(path);
    } catch (e) {
      entityCtx = null;
    }
  }
  var pageKey = input.pageKey || (entityCtx && entityCtx.pageKey) || pageKeyFromPath(path);
  var foundationEffective = {};
  try {
    foundationEffective =
      (await siteSeo.getPublicEffective(
        pageKey,
        entityCtx && entityCtx.vars ? entityCtx.vars : null
      )) || {};
  } catch (e) {
    foundationEffective = {};
  }
  var overrides = Object.assign({}, input.overrides || {});
  if (entityCtx && entityCtx.cleanPath) {
    if (!overrides.cleanPath) overrides.cleanPath = entityCtx.cleanPath;
    if (!overrides.canonical) {
      overrides.canonical =
        (input.origin || contractBuilder.PUBLIC_ORIGIN) + entityCtx.cleanPath;
    }
  }
  var contract = contractBuilder.buildSeoContract({
    foundationEffective: foundationEffective,
    pageKey: pageKey,
    httpStatus: input.httpStatus != null ? input.httpStatus : 200,
    requestedUrl: input.requestedUrl,
    path: (entityCtx && entityCtx.cleanPath) || path,
    search: input.search,
    requestUri: input.requestUri,
    redirectTarget: input.redirectTarget,
    origin: input.origin || contractBuilder.PUBLIC_ORIGIN,
    overrides: overrides,
    entity: input.entity,
    entityType: input.entityType,
    manualOverride: input.manualOverride,
    breadcrumbHints: (entityCtx && entityCtx.vars) || input.breadcrumbHints || {}
  });
  return applySocialCompatibleImage(contract);
}

async function applySocialCompatibleImage(contract) {
  if (!contract || !contract.social || !contract.social.og) return contract;
  var img = contract.social.og.image || (contract.assets && contract.assets.ogImageUrl) || '';
  if (!img) return contract;
  try {
    var resolved = await mediaService.resolveSocialCompatibleImage(img);
    if (resolved && resolved.url) {
      if (resolved.url !== img) {
        contract.social.og.image = resolved.url;
        if (contract.social.twitter) contract.social.twitter.image = resolved.url;
        if (contract.assets) contract.assets.ogImageUrl = resolved.url;
      }
      contract.social.og.imageWidth = resolved.width || null;
      contract.social.og.imageHeight = resolved.height || null;
      contract.social.og.imageMime = resolved.mime || '';
    }
  } catch (e) {
    /* keep */
  }
  return contract;
}

async function resolveContractAndHead(input) {
  var contract = await resolveContract(input);
  return {
    contract: contract,
    headHtml: headRenderer.renderHeadFromContract(contract, { includeJsonLd: true, forceImage: true })
  };
}

async function renderPublicShell(input) {
  var contract = await resolveContract(input);
  var html = headRenderer.renderShellHtml(contract, {
    bodyHtml: '<main><h1>' + headRenderer.escapeHtmlAttr((contract.document && contract.document.title) || 'iFlux') + '</h1></main>'
  });
  var singleton = headRenderer.detectSingletonViolations(html);
  return { contract: contract, html: html, singleton: singleton };
}

/** BR-07.404 / BR-06.4 — governed error shell (noindex · not sitemap · HTTP class). */
async function renderHttpErrorShell(input) {
  input = input || {};
  var httpStatus = input.httpStatus != null ? Number(input.httpStatus) : 404;
  if (httpStatus !== 404 && httpStatus !== 410) httpStatus = 404;
  var path = input.path || '/';
  var contract = await resolveContract({
    path: path,
    pageKey: input.pageKey,
    httpStatus: httpStatus,
    requestUri: input.requestUri,
    search: input.search,
    origin: input.origin,
    overrides: Object.assign(
      {
        title: input.title || 'Không tìm thấy · iFlux',
        description: input.description || 'Trang không tồn tại hoặc đã bị gỡ.',
        forceNonIndex: true,
        robots: 'noindex,nofollow'
      },
      input.overrides || {}
    )
  });
  var html = headRenderer.renderShellHtml(contract, {
    bodyHtml:
      '<main><h1>' +
      headRenderer.escapeHtmlAttr((contract.document && contract.document.title) || 'Không tìm thấy') +
      '</h1><p>Trang không tồn tại hoặc đã bị gỡ.</p></main>'
  });
  return { contract: contract, html: html, httpStatus: httpStatus };
}

/**
 * P4 — Article → SEO Contract (one head boundary). Community module consumes; does not emit competing tags.
 */
async function resolveArticleContract(article, opts) {
  opts = opts || {};
  article = article || {};
  var slug = String(article.slug || article.id || '').trim();
  var cleanPath = '/cong-dong/bai-viet/' + encodeURIComponent(slug);
  var origin = opts.origin || contractBuilder.PUBLIC_ORIGIN;
  var foundationEffective = {};
  try {
    foundationEffective = (await siteSeo.getPublicEffective('community')) || {};
  } catch (e) {
    foundationEffective = {};
  }
  var seo = article.seo && typeof article.seo === 'object' ? article.seo : {};
  var robots = seo.robots || seo.meta_robots || '';
  var contract = contractBuilder.buildSeoContract({
    foundationEffective: foundationEffective,
    pageKey: 'community',
    entityType: 'article',
    path: cleanPath,
    httpStatus: opts.httpStatus != null ? opts.httpStatus : 200,
    requestUri: opts.requestUri,
    search: opts.search,
    requestedUrl: opts.requestedUrl || (opts.requestUri ? origin + String(opts.requestUri).split('?')[0] : undefined),
    origin: origin,
    entity: {
      title: article.title,
      excerpt: article.excerpt,
      summary: article.summary,
      slug: slug,
      seo: seo,
      cover: article.cover || {}
    },
    overrides: {
      cleanPath: cleanPath,
      canonical: origin + cleanPath,
      ogType: 'article',
      robots: robots || undefined,
      forceNonIndex: !!(robots && String(robots).toLowerCase().indexOf('noindex') >= 0)
    }
  });
  return applySocialCompatibleImage(contract);
}

function metadataFromContract(contract) {
  var c = contract || {};
  var doc = c.document || {};
  var identity = c.identity || {};
  var social = (c.social && c.social.og) || {};
  var twitter = (c.social && c.social.twitter) || {};
  var assets = c.assets || {};
  var indexability = c.indexability || {};
  return {
    title: doc.title || 'iFlux',
    documentTitle: doc.documentTitle || doc.title || 'iFlux',
    description: doc.description || '',
    image: social.image || assets.ogImageUrl || '',
    url: identity.seoIdentityUrl || identity.canonicalUrl || '',
    canonical: identity.canonicalUrl || identity.seoIdentityUrl || '',
    site_name: social.site_name || 'iFlux',
    favicon: assets.faviconUrl || '',
    robots: indexability.robots || 'index,follow',
    twitter_card: twitter.card || 'summary',
    _fromContract: true,
    _headHtml: headRenderer.renderHeadFromContract(c, {
      includeJsonLd: true,
      forceImage: true,
      schemaType: 'Article'
    })
  };
}

/** Google soft caps — chunk before hard limits; NOT an eligibility gate. */
var SITEMAP_MAX_URLS_PER_FILE = 45000;
var ARTICLE_CANDIDATE_BATCH = 500;

/**
 * Inventory adapter only — NOT sitemap eligibility.
 * Eligibility = SEO Contract (isContractSitemapEligible).
 */
async function listPublishedArticleCandidatesPage(opts) {
  opts = opts || {};
  var limit = opts.limit != null ? opts.limit : ARTICLE_CANDIDATE_BATCH;
  var offset = opts.offset != null ? opts.offset : 0;
  var queryFn = opts.query || require('../../core/database/connection').query;
  var res = await queryFn(
    `SELECT payload->>'slug' AS slug,
            payload->>'title' AS title,
            payload->>'excerpt' AS excerpt,
            payload->>'summary' AS summary,
            payload->'cover' AS cover,
            payload->'seo' AS seo,
            updated_at,
            status,
            content_type
     FROM community_posts
     WHERE status IN ('published', 'published_rss')
       AND COALESCE(payload->>'slug', '') <> ''
     ORDER BY updated_at DESC NULLS LAST, id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows || [];
}

function articleOverridesFromCandidate(row) {
  var seo = row && row.seo && typeof row.seo === 'object' ? row.seo : {};
  if (typeof seo === 'string') {
    try {
      seo = JSON.parse(seo) || {};
    } catch (e) {
      seo = {};
    }
  }
  var cover = row && row.cover && typeof row.cover === 'object' ? row.cover : {};
  if (typeof cover === 'string') {
    try {
      cover = JSON.parse(cover) || {};
    } catch (e) {
      cover = {};
    }
  }
  var slug = String((row && row.slug) || '').trim();
  var cleanPath = '/cong-dong/bai-viet/' + encodeURIComponent(slug);
  var robots = seo.robots || seo.meta_robots || '';
  var entity = {
    title: row && row.title,
    excerpt: row && row.excerpt,
    summary: row && row.summary,
    slug: slug,
    seo: seo,
    cover: cover
  };
  var resolved = entityTemplates.resolveEntitySeo({
    entityType: 'article',
    entity: entity,
    foundationEffective: {}
  });
  return entityTemplates.toContractOverrides(resolved, {
    cleanPath: cleanPath,
    canonical: contractBuilder.PUBLIC_ORIGIN + cleanPath,
    robots: robots || undefined,
    forceNonIndex: !!(robots && String(robots).toLowerCase().indexOf('noindex') >= 0)
  });
}

function articleContractInputFromCandidate(row, foundationCommunity) {
  var seo = row && row.seo && typeof row.seo === 'object' ? row.seo : {};
  if (typeof seo === 'string') {
    try {
      seo = JSON.parse(seo) || {};
    } catch (e) {
      seo = {};
    }
  }
  var cover = row && row.cover && typeof row.cover === 'object' ? row.cover : {};
  if (typeof cover === 'string') {
    try {
      cover = JSON.parse(cover) || {};
    } catch (e) {
      cover = {};
    }
  }
  var slug = String((row && row.slug) || '').trim();
  var cleanPath = '/cong-dong/bai-viet/' + encodeURIComponent(slug);
  var robots = seo.robots || seo.meta_robots || '';
  return {
    foundationEffective: foundationCommunity || {},
    pageKey: 'community',
    entityType: 'article',
    path: cleanPath,
    httpStatus: 200,
    entity: {
      title: row && row.title,
      excerpt: row && row.excerpt,
      summary: row && row.summary,
      slug: slug,
      seo: seo,
      cover: cover
    },
    overrides: {
      cleanPath: cleanPath,
      canonical: contractBuilder.PUBLIC_ORIGIN + cleanPath,
      robots: robots || undefined,
      forceNonIndex: !!(robots && String(robots).toLowerCase().indexOf('noindex') >= 0),
      ogType: 'article'
    }
  };
}

function renderUrlsetXml(urls) {
  var body = (urls || [])
    .map(function (u) {
      var last = u.lastmod ? '\n    <lastmod>' + u.lastmod + '</lastmod>' : '';
      return (
        '  <url>\n    <loc>' +
        u.loc +
        '</loc>' +
        last +
        '\n    <changefreq>' +
        (u.changefreq || 'weekly') +
        '</changefreq>\n    <priority>' +
        (u.priority || '0.5') +
        '</priority>\n  </url>'
      );
    })
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '\n</urlset>\n'
  );
}

function renderSitemapIndexXml(entries) {
  var body = (entries || [])
    .map(function (e) {
      return '  <sitemap>\n    <loc>' + e.loc + '</loc>\n  </sitemap>';
    })
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '\n</sitemapindex>\n'
  );
}

/**
 * Build sitemap URL entries via SEO Contract eligibility only.
 * @param {object} [opts]
 * @param {function} [opts.resolveContract] — only for hubs when provided together with article path default
 * @param {function} [opts.listArticleCandidatesPage]
 * @param {object} [opts.foundationEffectiveByPageKey]
 * @param {number} [opts.maxUrlsPerFile] — override soft cap (tests)
 */
async function collectSitemapEntries(opts) {
  opts = opts || {};
  var resolve = opts.resolveContract || resolveContract;
  var listPage = opts.listArticleCandidatesPage || listPublishedArticleCandidatesPage;
  var origin = contractBuilder.PUBLIC_ORIGIN;
  var urls = [];
  var stats = {
    staticCandidates: SITEMAP_STATIC.length,
    staticIncluded: 0,
    articleCandidates: 0,
    articleIncluded: 0,
    articleExcludedByContract: 0
  };

  for (var i = 0; i < SITEMAP_STATIC.length; i++) {
    var row = SITEMAP_STATIC[i];
    var hubContract;
    if (opts.skipFoundationFetch || (opts.foundationEffectiveByPageKey && opts.foundationEffectiveByPageKey[row.pageKey] !== undefined)) {
      hubContract = contractBuilder.buildSeoContract({
        foundationEffective:
          (opts.foundationEffectiveByPageKey && opts.foundationEffectiveByPageKey[row.pageKey]) || {},
        pageKey: row.pageKey,
        path: row.path,
        httpStatus: 200
      });
    } else {
      hubContract = await resolve({ pageKey: row.pageKey, path: row.path, httpStatus: 200 });
    }
    if (!contractBuilder.isContractSitemapEligible(hubContract)) continue;
    var hubLoc = (hubContract.identity && hubContract.identity.seoIdentityUrl) || origin + row.path;
    urls.push({
      loc: hubLoc,
      changefreq: row.changefreq,
      priority: row.priority
    });
    stats.staticIncluded += 1;
  }

  var offset = 0;
  var foundationCommunity = opts.foundationEffectiveByPageKey && opts.foundationEffectiveByPageKey.community;
  if (foundationCommunity === undefined && !opts.skipFoundationFetch) {
    try {
      foundationCommunity = (await siteSeo.getPublicEffective('community')) || {};
    } catch (e) {
      foundationCommunity = {};
    }
  }

  try {
    while (true) {
      var batch = await listPage({ limit: ARTICLE_CANDIDATE_BATCH, offset: offset });
      if (!batch.length) break;
      for (var j = 0; j < batch.length; j++) {
        var cand = batch[j];
        stats.articleCandidates += 1;
        if (!cand || !cand.slug) {
          stats.articleExcludedByContract += 1;
          continue;
        }
        var ov = articleOverridesFromCandidate(cand);
        var articleInput = articleContractInputFromCandidate(cand, foundationCommunity);
        var articleContract;
        if (opts.resolveContract) {
          articleContract = await resolve(
            Object.assign({}, articleInput, {
              overrides: ov
            })
          );
        } else {
          articleContract = contractBuilder.buildSeoContract(articleInput);
        }
        if (!contractBuilder.isContractSitemapEligible(articleContract)) {
          stats.articleExcludedByContract += 1;
          continue;
        }
        var loc = articleContract.identity.seoIdentityUrl;
        urls.push({
          loc: loc,
          lastmod: cand.updated_at ? new Date(cand.updated_at).toISOString() : null,
          changefreq: 'weekly',
          priority: '0.7'
        });
        stats.articleIncluded += 1;
      }
      if (batch.length < ARTICLE_CANDIDATE_BATCH) break;
      offset += ARTICLE_CANDIDATE_BATCH;
    }
  } catch (e) {
    stats.articleError = String(e && e.message ? e.message : e);
  }

  return { urls: urls, stats: stats };
}

async function buildSitemapXml(opts) {
  opts = opts || {};
  var collected = await collectSitemapEntries(opts);
  var urls = collected.urls;
  var origin = contractBuilder.PUBLIC_ORIGIN;
  var maxPerFile = opts.maxUrlsPerFile != null ? opts.maxUrlsPerFile : SITEMAP_MAX_URLS_PER_FILE;

  if (urls.length <= maxPerFile) {
    return {
      contentType: 'application/xml; charset=utf-8',
      body: renderUrlsetXml(urls),
      mode: 'urlset',
      stats: Object.assign({}, collected.stats, { totalUrls: urls.length, chunks: 1 })
    };
  }

  var chunks = [];
  for (var i = 0; i < urls.length; i += maxPerFile) {
    chunks.push(urls.slice(i, i + maxPerFile));
  }
  var indexEntries = chunks.map(function (_c, idx) {
    return { loc: origin + '/sitemap-' + (idx + 1) + '.xml' };
  });
  return {
    contentType: 'application/xml; charset=utf-8',
    body: renderSitemapIndexXml(indexEntries),
    mode: 'index',
    chunks: chunks.map(renderUrlsetXml),
    stats: Object.assign({}, collected.stats, { totalUrls: urls.length, chunks: chunks.length })
  };
}

/** Backward-compatible string body for callers expecting XML text. */
async function buildSitemapXmlString(opts) {
  var out = await buildSitemapXml(opts);
  return out.body;
}

async function buildSitemapChunkXml(chunkIndex1Based, opts) {
  var out = await buildSitemapXml(opts);
  if (out.mode === 'urlset') {
    if (Number(chunkIndex1Based) === 1) return out.body;
    return null;
  }
  var idx = Number(chunkIndex1Based) - 1;
  if (!out.chunks || idx < 0 || idx >= out.chunks.length) return null;
  return out.chunks[idx];
}

function buildRobotsTxt() {
  // Owner LOCK 2026-08-09 — AI discovery YES / AI training NO
  // search=yes · use=reference · ai-train=no
  // AI crawlers ALLOW (no Disallow GPTBot/ClaudeBot/…) — training denied via Content-Signal only
  return (
    '# iFlux robots.txt — SEO Platform (040826)\n' +
    '#\n' +
    '# As a condition of accessing this website, you agree to abide by the following\n' +
    '# content signals:\n' +
    '#\n' +
    '# (a)  If a Content-Signal = yes, you may collect content for the corresponding use.\n' +
    '# (b)  If a Content-Signal = no, you may not collect content for the corresponding use.\n' +
    '# (c)  If the website operator does not include a Content-Signal for a corresponding\n' +
    '#      use, the website operator neither grants nor restricts permission via\n' +
    '#      Content-Signal with respect to the corresponding use.\n' +
    '#\n' +
    '# search:   building a search index and providing search results (hyperlinks / short excerpts).\n' +
    '#           Search does not include providing AI-generated search summaries.\n' +
    '# ai-train: training or fine-tuning AI models.\n' +
    '# use:      how AI systems may consume the content (immediate, reference, or full).\n' +
    '#\n' +
    '# iFlux policy (LOCKED):\n' +
    '#   AI crawlers  = ALLOW (crawl / search / reference public content)\n' +
    '#   AI training  = DENY\n' +
    '#\n' +
    '# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF RIGHTS\n' +
    '# UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED\n' +
    '# RIGHTS IN THE DIGITAL SINGLE MARKET.\n' +
    '#\n' +
    'User-agent: *\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    'Disallow: /tai-khoan\n' +
    'Disallow: /tin-nhan\n' +
    'Disallow: /cong-dong/viet-bai\n' +
    'Disallow: /api/\n' +
    '\n' +
    '# Explicit: known AI crawlers may crawl public content (same Content-Signal applies).\n' +
    '# Do NOT Disallow — training preference is expressed only via Content-Signal ai-train=no.\n' +
    'User-agent: GPTBot\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: ClaudeBot\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: Google-Extended\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: Amazonbot\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: Applebot-Extended\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: Bytespider\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: CCBot\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: meta-externalagent\n' +
    'Content-Signal: search=yes,ai-train=no,use=reference\n' +
    'Allow: /\n' +
    '\n' +
    'Sitemap: https://iflux.vn/sitemap.xml\n'
  );
}

async function resolveFaviconRedirect() {
  try {
    var eff = await siteSeo.getPublicEffective('market');
    var url = eff && eff.favicon_url ? String(eff.favicon_url).trim() : '';
    if (url) return url;
  } catch (e) {
    /* fallthrough */
  }
  return null;
}

module.exports = {
  PATH_TO_PAGE_KEY,
  SITEMAP_STATIC,
  SITEMAP_MAX_URLS_PER_FILE,
  ARTICLE_CANDIDATE_BATCH,
  pageKeyFromPath,
  resolveContract,
  resolveContractAndHead,
  renderPublicShell,
  renderHttpErrorShell,
  resolveArticleContract,
  metadataFromContract,
  listPublishedArticleCandidatesPage,
  articleOverridesFromCandidate,
  articleContractInputFromCandidate,
  collectSitemapEntries,
  buildSitemapXml,
  buildSitemapXmlString,
  buildSitemapChunkXml,
  buildRobotsTxt,
  resolveFaviconRedirect
};
