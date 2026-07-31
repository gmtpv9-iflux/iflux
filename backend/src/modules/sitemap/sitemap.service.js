'use strict';

const registry = require('./sitemap.registry');
const cache = require('../../core/cache/redis');

// Register sitemap providers
registry.register('static', require('./providers/static'));
registry.register('posts', require('./providers/posts'));
registry.register('stocks', require('./providers/stocks'));
registry.register('sectors', require('./providers/sectors'));
registry.register('ecosystems', require('./providers/ecosystems'));
registry.register('stories', require('./providers/stories'));

const CACHE_TTL_SECONDS = 1800; // 30 minutes cache as configured
const memoryCache = new Map();

function buildSitemapXml(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    xml += '  </url>\n';
  }
  xml += '</urlset>';
  return xml;
}

function buildSitemapIndexXml(keys) {
  const PROD_ORIGIN = 'https://iflux.vn';
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const key of keys) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${PROD_ORIGIN}/sitemap-${key}.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  xml += '</sitemapindex>';
  return xml;
}

async function getCachedXml(cacheKey, generatorFn) {
  try {
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
  } catch (err) {
    // Ignore Redis errors, fallback to memory cache
  }

  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.xml;
  }

  const xml = await generatorFn();

  try {
    await cache.set(cacheKey, xml, CACHE_TTL_SECONDS);
  } catch (err) {
    // Ignore Redis writing errors
  }

  memoryCache.set(cacheKey, {
    xml,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000
  });

  return xml;
}

async function getSitemapIndex() {
  const keys = registry.list();
  return getCachedXml('sitemap:index', async () => {
    return buildSitemapIndexXml(keys);
  });
}

async function getSitemapByType(type) {
  const provider = registry.get(type);
  if (!provider) return null;

  return getCachedXml(`sitemap:type:${type}`, async () => {
    const urls = await provider.getUrls();
    // Cap at 50,000 URLs to follow Google Search Console limits
    const cappedUrls = urls.slice(0, 50000);
    return buildSitemapXml(cappedUrls);
  });
}

module.exports = {
  getSitemapIndex,
  getSitemapByType
};
