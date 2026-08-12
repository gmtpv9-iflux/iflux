'use strict';

const registry = require('./sitemap.registry');
const cache = require('../../core/cache/redis');
const { getLogger } = require('../../core/logger/logger');

const CACHE_TTL_SECONDS = 1800; // 30 minutes cache
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

function buildSitemapIndexXml(sitemaps, origin) {
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const sm of sitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${origin}/${sm.filename}</loc>\n`;
    xml += `    <lastmod>${sm.lastmod || today}</lastmod>\n`;
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

async function getSitemapIndex(config) {
  const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
  
  return getCachedXml('sitemap:index', async () => {
    const sitemaps = [];
    const keys = registry.list();

    for (const key of keys) {
      const provider = registry.get(key);
      try {
        const urls = await provider.getUrls(config);
        if (!urls || urls.length === 0) continue;
        
        const total = urls.length;
        const pages = Math.ceil(total / 50000);
        
        // Find the latest modification date in the provider's URLs
        let latestLastmod = null;
        for (const u of urls) {
          if (u.lastmod && (!latestLastmod || u.lastmod > latestLastmod)) {
            latestLastmod = u.lastmod;
          }
        }

        if (pages <= 1) {
          sitemaps.push({ filename: `sitemap-${key}.xml`, lastmod: latestLastmod });
        } else {
          for (let p = 1; p <= pages; p++) {
            sitemaps.push({ filename: `sitemap-${key}-${p}.xml`, lastmod: latestLastmod });
          }
        }
      } catch (err) {
        getLogger().error({ err, key }, 'Failed to fetch URLs for sitemap index from provider');
        // Fault tolerance: continue to index other sitemaps even if one fails
      }
    }

    return buildSitemapIndexXml(sitemaps, origin);
  });
}

async function getSitemapByType(config, type, page) {
  const provider = registry.get(type);
  if (!provider) return null;

  return getCachedXml(`sitemap:type:${type}:page:${page}`, async () => {
    try {
      const urls = await provider.getUrls(config);
      if (!urls || urls.length === 0) {
        return buildSitemapXml([]);
      }

      // Deduplicate URLs based on location to ensure no duplicate URLs exist
      const seen = new Set();
      const uniqueUrls = [];
      for (const u of urls) {
        if (!seen.has(u.loc)) {
          seen.add(u.loc);
          uniqueUrls.push(u);
        }
      }

      const start = (page - 1) * 50000;
      const end = start + 50000;
      const pageUrls = uniqueUrls.slice(start, end);

      return buildSitemapXml(pageUrls);
    } catch (err) {
      getLogger().error({ err, type, page }, 'Failed to generate sitemap by type');
      // Fault tolerance: return empty valid sitemap instead of 500 server error
      return buildSitemapXml([]);
    }
  });
}

module.exports = {
  getSitemapIndex,
  getSitemapByType
};
