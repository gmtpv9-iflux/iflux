'use strict';

const articles = require('../news/news-articles.service');
const mediaService = require('./media.service');
const processImg = require('./media-process');
const { isExternalImageUrl, isMediaPublicUrl } = require('./media-util');
const { AppError } = require('../../shared/exceptions/app-error');

function extractImgSrcs(html) {
  const out = [];
  const re = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(String(html || '')))) {
    out.push({ url: m[1].trim(), alt: extractAlt(m[0]) });
  }
  return out;
}

function extractAlt(tag) {
  const m = /\balt\s*=\s*["']([^"']*)["']/i.exec(tag || '');
  return m ? m[1] : '';
}

function replaceImgSrcs(html, urlMap) {
  return String(html || '').replace(/<img\b[^>]*>/gi, function (tag) {
    const sm = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!sm) return tag;
    const old = sm[1].trim();
    const mapped = urlMap[old];
    if (!mapped) return tag;
    let next = tag.replace(sm[0], 'src="' + mapped.media_url + '"');
    if (mapped.asset_id && !/\bdata-media-asset-id\s*=/i.test(next)) {
      next = next.replace(/^<img\b/i, '<img data-media-asset-id="' + mapped.asset_id + '"');
    }
    if (mapped.alt && !/\balt\s*=\s*["'][^"']+["']/i.test(next)) {
      next = next.replace(/^<img\b/i, '<img alt="' + escapeAttr(mapped.alt) + '"');
    }
    return next;
  });
}

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function collectExternal(article, config) {
  const items = [];
  const seen = Object.create(null);
  function add(url, location, alt) {
    const u = String(url || '').trim();
    if (!u || !isExternalImageUrl(u, config)) return;
    if (seen[u]) {
      seen[u].locations.push(location);
      return;
    }
    seen[u] = { source_url: u, locations: [location], alt: alt || '' };
    items.push(seen[u]);
  }

  extractImgSrcs(article.body_html || article.body || '').forEach(function (img) {
    add(img.url, 'body', img.alt);
  });
  const cover = article.cover || {};
  add(cover.url, 'cover', cover.alt || '');
  const seo = article.seo || {};
  add(seo.og_image, 'seo', '');
  return items;
}

async function importArticle(config, articleId, actor) {
  const article = await articles.getArticle(articleId);
  if (!article) throw AppError.notFound('Không tìm thấy bài viết');

  const jobId = await mediaService.createJob(
    'import',
    article.id,
    actor && (actor.admin_id || actor.user_id || actor.email)
  );

  const found = collectExternal(article, config);
  if (!found.length) {
    const result = {
      status: 'noop',
      found: 0,
      succeeded: 0,
      failed: 0,
      reused: 0,
      items: [],
      article_id: article.id
    };
    await mediaService.finishJob(jobId, 'succeeded', result);
    return Object.assign({ job_id: jobId }, result);
  }

  const urlMap = Object.create(null);
  const items = [];
  let succeeded = 0;
  let failed = 0;
  let reused = 0;
  const titleHint = article.slug || article.title || 'img';
  let seq = 1;

  for (let i = 0; i < found.length; i++) {
    const item = found[i];
    const row = {
      source_url: item.source_url,
      locations: item.locations,
      status: 'pending'
    };
    try {
      const buf = await processImg.downloadImage(item.source_url);
      const created = await mediaService.createAssetFromBuffer(config, buf, {
        filenameHint: titleHint,
        seq: seq++,
        alt: item.alt || article.title || '',
        sourceUrl: item.source_url,
        channel: 'import',
        provider: null,
        createdBy: actor && (actor.admin_id || actor.email)
      });
      if (created.reused) reused += 1;
      else succeeded += 1;
      urlMap[item.source_url] = {
        media_url: created.asset.public_url,
        asset_id: created.asset.id,
        alt: created.asset.alt_text || item.alt || ''
      };
      row.status = created.reused ? 'reused' : 'succeeded';
      row.asset_id = created.asset.id;
      row.media_url = created.asset.public_url;
    } catch (err) {
      failed += 1;
      row.status = 'failed';
      row.error = (err && err.message) || 'Import failed';
      row.error_code = err && err.code;
    }
    items.push(row);
  }

  let bodyHtml = article.body_html || article.body || '';
  bodyHtml = replaceImgSrcs(bodyHtml, urlMap);

  const cover = Object.assign({}, article.cover || {});
  const coverOrig = String((article.cover && article.cover.url) || '').trim();
  if (coverOrig && urlMap[coverOrig]) {
    cover.url = urlMap[coverOrig].media_url;
    if (!cover.alt) cover.alt = urlMap[coverOrig].alt || '';
  }

  const seo = Object.assign({}, article.seo || {});
  const ogOrig = String(seo.og_image || '').trim();
  if (ogOrig && urlMap[ogOrig]) {
    seo.og_image = urlMap[ogOrig].media_url;
  }

  await articles.updateArticle(
    article.id,
    {
      body_html: bodyHtml,
      cover: cover,
      seo: seo,
      status: article.status,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category_id: article.category_id,
      content_type: article.content_type,
      author: article.author,
      tickers: article.tickers,
      sectors: article.sectors,
      ecosystems: article.ecosystems,
      exchange: article.exchange,
      chu_de_id: article.chu_de_id,
      display: article.display,
      published_at: article.published_at
    },
    actor || {}
  );

  const assetIds = Object.create(null);
  Object.keys(urlMap).forEach(function (k) {
    const m = urlMap[k];
    if (!m || !m.asset_id) return;
    assetIds[m.asset_id] = true;
  });
  const ids = Object.keys(assetIds);
  for (let u = 0; u < ids.length; u++) {
    const locs = found
      .filter(function (f) {
        return urlMap[f.source_url] && urlMap[f.source_url].asset_id === ids[u];
      })
      .reduce(function (acc, f) {
        return acc.concat(f.locations);
      }, []);
    const uniq = Array.from(new Set(locs));
    for (let L = 0; L < uniq.length; L++) {
      await mediaService.upsertUsage(ids[u], article.id, uniq[L]);
    }
  }

  const status = failed === 0 ? 'succeeded' : succeeded + reused > 0 ? 'partial' : 'failed';
  const result = {
    status: status,
    found: found.length,
    succeeded: succeeded,
    failed: failed,
    reused: reused,
    items: items,
    article_id: article.id
  };
  await mediaService.finishJob(jobId, status === 'failed' ? 'failed' : 'succeeded', result);
  return Object.assign({ job_id: jobId }, result);
}

function publishCheck(article, config) {
  const external = collectExternal(article, config).map(function (x) {
    return { url: x.source_url, locations: x.locations };
  });
  const missingAlt = [];
  extractImgSrcs(article.body_html || '').forEach(function (img) {
    if (isMediaPublicUrl(img.url, config) && !String(img.alt || '').trim()) {
      missingAlt.push({ url: img.url, location: 'body' });
    }
  });
  const cover = article.cover || {};
  if (cover.url && isMediaPublicUrl(cover.url, config) && !String(cover.alt || '').trim()) {
    missingAlt.push({ url: cover.url, location: 'cover' });
  }
  return {
    ok: external.length === 0 && missingAlt.length === 0,
    external: external,
    missing_alt: missingAlt
  };
}

module.exports = {
  importArticle,
  publishCheck,
  collectExternal,
  extractImgSrcs,
  replaceImgSrcs
};
