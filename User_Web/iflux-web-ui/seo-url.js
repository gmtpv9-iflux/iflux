/* SEO / GEO — Entity-centric URL SoT
 * Knowledge: /stocks /sectors /ecosystems /chu-de (Chủ đề — entity narrative)
 * Community: /cong-dong/bai-viet/:id (bài viết — KHÔNG phải /chu-de)
 * Legacy /stories /community/tag → /chu-de
 */
(function (global) {
  'use strict';

  var PROD_ORIGIN = 'https://iflux.vn';

  function userWebRoot(loc) {
    loc = loc || global.location;
    var path = (loc && loc.pathname) || '';
    var idx = path.indexOf('/User_Web/');
    if (idx >= 0) return path.slice(0, idx + '/User_Web/'.length);
    if (loc && loc.protocol === 'file:') {
      var f = path.indexOf('/User_Web/');
      if (f >= 0) return path.slice(0, f + '/User_Web/'.length);
    }
    return '/User_Web/';
  }

  function appOrigin(loc) {
    loc = loc || global.location;
    if (loc && loc.origin && loc.origin !== 'null') return loc.origin;
    return PROD_ORIGIN;
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function isFileProto() {
    return global.location && global.location.protocol === 'file:';
  }

  function primaryTicker(post) {
    if (!post || !post.tickers || !post.tickers.length) return '';
    return String(post.tickers[0]).toUpperCase();
  }

  function primaryTopic(post) {
    var tags = (post && (post.chu_de_tags || post.story_tags)) || [];
    if (!tags.length) return '';
    var t = tags[0];
    return t.sourceId || slugify(t.name) || '';
  }

  function sectorSlug(slugOrId) {
    var tax = global.IfluxWatchlistTaxonomy;
    if (tax && tax.groupSlug) {
      var s = tax.groupSlug('sector', slugOrId);
      if (s) return s;
    }
    return slugify(slugOrId) || String(slugOrId || '');
  }

  /* ── Chủ đề ENTITY (narrative thị trường) → /chu-de/:slug ── */

  function chuDePath(slug) {
    slug = slugify(slug) || String(slug || '');
    if (isFileProto()) {
      return userWebRoot() + 'chu-de/chi-tiet.html' + (slug ? '?id=' + encodeURIComponent(slug) : '');
    }
    return slug ? '/chu-de/' + encodeURIComponent(slug) : '/chu-de';
  }

  function chuDeHref(slugOrId) {
    return chuDePath(slugOrId);
  }

  function chuDeCanonical(slug, origin) {
    slug = slugify(slug) || String(slug || '');
    return (origin || PROD_ORIGIN) + '/chu-de/' + encodeURIComponent(slug);
  }

  function parseChuDeSlug(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('id') ||
      new URLSearchParams(loc.search).get('story') ||
      new URLSearchParams(loc.search).get('chu-de') ||
      new URLSearchParams(loc.search).get('chude');
    if (q) return q;
    var m = (loc.pathname || '').match(/\/chu-de\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/stories\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/story\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    return null;
  }

  /* Aliases cũ — Story = Chủ đề */
  function storyEntityPath(slug) { return chuDePath(slug); }
  function storyEntityHref(slugOrId) { return chuDeHref(slugOrId); }
  function storyEntityCanonical(slug, origin) { return chuDeCanonical(slug, origin); }
  function parseStoryEntitySlug(loc) { return parseChuDeSlug(loc); }
  function parseChuDeEntitySlug(loc) { return parseChuDeSlug(loc); }

  /* ── Community POST → /cong-dong/bai-viet/:ref (id hoặc slug) ── */

  function postRef(postOrRef) {
    if (typeof postOrRef === 'string') return postOrRef;
    if (!postOrRef) return '';
    return postOrRef.id || postOrRef.slug || '';
  }

  function postPath(postOrRef) {
    var ref = postRef(postOrRef);
    if (isFileProto()) {
      return userWebRoot() + 'community/post.html' + (ref ? '?id=' + encodeURIComponent(ref) : '');
    }
    return ref ? '/cong-dong/bai-viet/' + encodeURIComponent(ref) : '/cong-dong/bai-viet';
  }

  function postHref(postOrRef) {
    return postPath(postOrRef);
  }

  function postCanonical(post, origin) {
    var seo = post && post.seo ? post.seo : {};
    if (seo.canonical_url) return seo.canonical_url;
    var ref = postRef(post);
    return (origin || PROD_ORIGIN) + '/cong-dong/bai-viet/' + encodeURIComponent(ref || '');
  }

  function postSlugPath(post) {
    return '/cong-dong/bai-viet/' + encodeURIComponent(postRef(post));
  }

  function parsePostRef(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('id') ||
      new URLSearchParams(loc.search).get('slug') ||
      new URLSearchParams(loc.search).get('post');
    if (q) return q;
    var path = loc.pathname || '';
    var m = path.match(/\/(?:cong-dong\/bai-viet|community\/posts)\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = path.match(/\/community\/stories\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = path.match(/\/cong-dong\/[^/]+\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    return null;
  }

  /* ── Stocks / Sectors / Ecosystems ── */

  function stockPath(ticker) {
    ticker = String(ticker || '').toUpperCase();
    if (isFileProto()) {
      return userWebRoot() + 'stock/index.html' + (ticker ? '?ticker=' + encodeURIComponent(ticker) : '');
    }
    return ticker ? '/co-phieu/' + encodeURIComponent(ticker) : '/co-phieu';
  }

  function sectorPath(slugOrId) {
    var s = sectorSlug(slugOrId);
    if (isFileProto()) {
      return userWebRoot() + 'sector/index.html' + (s ? '?id=' + encodeURIComponent(s) : '');
    }
    return s ? '/nganh/' + encodeURIComponent(s) : '/nganh';
  }

  function ecosystemPath(slugOrId) {
    var s = slugify(slugOrId) || String(slugOrId || '');
    if (isFileProto()) {
      return userWebRoot() + 'family/index.html' + (s ? '?id=' + encodeURIComponent(s) : '');
    }
    return s ? '/ho-co-phieu/' + encodeURIComponent(s) : '/ho-co-phieu';
  }

  function tagPath(slugOrId) {
    /* legacy community tag → Chủ đề entity */
    return chuDePath(slugOrId);
  }

  function topicPath(slugOrId) {
    return chuDePath(slugOrId);
  }

  function communityPath() {
    if (isFileProto()) return userWebRoot() + 'community/index.html';
    return '/cong-dong';
  }

  function pagePath(pageKey) {
    var map = {
      home: 'home', market: 'market', flow: 'flow', community: 'community',
      pricing: 'pricing', loyalty: 'loyalty', membership: 'loyalty',
      faq: 'faq', watchlist: 'watchlist', search: 'search',
      account: 'account', messages: 'account'
    };
    var seg = map[pageKey] || pageKey;
    return userWebRoot() + seg;
  }

  /* ── Href (absolute clean path) ── */

  function stockHref(ticker) { return stockPath(ticker); }
  function sectorHref(id) { return sectorPath(id); }
  function ecosystemHref(id) { return ecosystemPath(id); }
  function tagHref(id) { return tagPath(id); }
  function topicHref(id) { return topicPath(id); }

  /* Aliases — story* = Story ENTITY (không dùng cho community post) */
  function storyHref(slugOrId) { return storyEntityHref(slugOrId); }
  function storyPath(slug) { return storyEntityPath(slug); }
  function storyCanonical(slugOrPost, origin) {
    if (slugOrPost && typeof slugOrPost === 'object' && (slugOrPost.id || slugOrPost.slug) && slugOrPost.title) {
      return postCanonical(slugOrPost, origin);
    }
    return storyEntityCanonical(slugOrPost, origin);
  }
  function storySlugPath(slugOrPost) {
    if (slugOrPost && typeof slugOrPost === 'object' && (slugOrPost.id || slugOrPost.slug) && slugOrPost.title) {
      return postSlugPath(slugOrPost);
    }
    var s = typeof slugOrPost === 'string' ? slugOrPost : (slugOrPost && slugOrPost.slug);
    return '/chu-de/' + encodeURIComponent(s || '');
  }
  function parseStorySlug(loc) { return parseStoryEntitySlug(loc); }

  function stockCanonical(ticker, origin) {
    return (origin || PROD_ORIGIN) + '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
  }

  function sectorCanonical(slug, origin) {
    return (origin || PROD_ORIGIN) + '/nganh/' + encodeURIComponent(sectorSlug(slug));
  }

  function ecosystemCanonical(slug, origin) {
    return (origin || PROD_ORIGIN) + '/ho-co-phieu/' + encodeURIComponent(slugify(slug) || slug);
  }

  function parseStockTicker(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('ticker');
    if (q) return q.toUpperCase();
    var m = (loc.pathname || '').match(/\/(?:co-phieu|stocks)\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]).toUpperCase();
    m = (loc.pathname || '').match(/\/community\/stocks\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]).toUpperCase();
    m = (loc.pathname || '').match(/\/stock\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]).toUpperCase();
    return null;
  }

  function parseSectorId(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('id');
    if (q) return q;
    var m = (loc.pathname || '').match(/\/(?:nganh|sectors)\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/community\/sectors\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/sector\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    return null;
  }

  function parseEcosystemId(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('id');
    if (q) return q;
    var m = (loc.pathname || '').match(/\/(?:ho-co-phieu|ecosystems)\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/community\/ecosystems\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/family\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    return null;
  }

  function parseTopicSlug(loc) {
    return parseTagSlug(loc);
  }

  function parseTagSlug(loc) {
    /* legacy — resolve như Chủ đề */
    return parseChuDeSlug(loc);
  }

  function ensurePathBase(pageDir) {
    if (typeof document === 'undefined') return;
    if (document.querySelector('base[data-ifx-path-base]')) return;
    var root = userWebRoot();
    var dir = pageDir || 'community/';
    if (dir.charAt(dir.length - 1) !== '/') dir += '/';
    var b = document.createElement('base');
    b.setAttribute('data-ifx-path-base', '1');
    b.href = appOrigin() + root + dir;
    document.head.insertBefore(b, document.head.firstChild);
  }

  function autoPathBase() {
    var path = (global.location && global.location.pathname) || '';
    if (/^\/(?:co-phieu|stocks)\//i.test(path)) return ensurePathBase('stock/');
    if (/^\/(?:nganh|sectors)\//i.test(path)) return ensurePathBase('sector/');
    if (/^\/(?:ho-co-phieu|ecosystems)\//i.test(path)) return ensurePathBase('family/');
    if (/^\/chu-de\//i.test(path)) return ensurePathBase('chu-de/');
    if (/^\/stories\//i.test(path)) return ensurePathBase('chu-de/');
    if (/^\/(?:cong-dong\/bai-viet|community\/posts)\//i.test(path)) return ensurePathBase('community/');
    if (/^\/community\/tag\//i.test(path)) return ensurePathBase('chu-de/');
    if (/\/community\/stocks\//i.test(path)) return ensurePathBase('stock/');
    if (/\/community\/sectors\//i.test(path)) return ensurePathBase('sector/');
    if (/\/community\/ecosystems\//i.test(path)) return ensurePathBase('family/');
    if (/\/cong-dong\//i.test(path)) return ensurePathBase('community/');
  }

  function setMeta(name, content, attr) {
    if (!content) return;
    attr = attr || 'name';
    var sel = 'meta[' + attr + '="' + name + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setCanonical(href) {
    if (!href) return;
    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  function setJsonLd(id, data) {
    var old = document.getElementById(id);
    if (old) old.remove();
    var script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);
  }

  function applyPostSeoToDocument(post) {
    if (!post) return;
    var seo = post.seo || {};
    var canonical = postCanonical(post);
    var title = seo.meta_title || (post.title + ' | iFlux Cộng đồng');
    var desc = seo.meta_description || post.excerpt || '';
    document.title = title;
    setMeta('description', desc);
    setMeta('robots', seo.robots || 'index,follow');
    setMeta('og:title', seo.og_title || title, 'property');
    setMeta('og:description', seo.og_description || desc, 'property');
    setMeta('og:type', 'article', 'property');
    setMeta('og:url', canonical, 'property');
    if (seo.og_image) setMeta('og:image', seo.og_image, 'property');
    setCanonical(canonical);
    setJsonLd('ifx-story-jsonld', {
      '@context': 'https://schema.org',
      '@type': seo.schema_type || 'NewsArticle',
      headline: post.title,
      description: desc,
      url: canonical,
      datePublished: post.published_at || post.created_at,
      inLanguage: 'vi-VN',
      author: post.author ? { '@type': 'Person', name: post.author.display_name } : undefined,
      about: (post.tickers || []).map(function (t) {
        return { '@type': 'Corporation', tickerSymbol: t, url: stockCanonical(t) };
      })
    });
  }

  function applyStorySeoToDocument(post) {
    applyPostSeoToDocument(post);
  }

  function applyStockSeoToDocument(detail, opts) {
    if (!detail) return;
    opts = opts || {};
    var ticker = detail.ticker;
    var canonical = stockCanonical(ticker);
    var title = ticker + ' · ' + (detail.name || detail.short_name) + ' — Giá, dòng tiền, tin tức | iFlux';
    var desc = 'Theo dõi ' + ticker + ' (' + (detail.exchange || 'HSX') + '): thị giá ' +
      (detail.price != null ? detail.price : '—') + ', giao dịch ròng theo chủ thể, tin tức cộng đồng và bình luận trên iFlux.';
    var keywords = [ticker, detail.name, detail.short_name, 'cổ phiếu ' + ticker, detail.exchange, 'chứng khoán Việt Nam']
      .filter(Boolean).join(', ');

    document.title = title;
    setMeta('description', desc);
    setMeta('keywords', keywords);
    setMeta('robots', 'index,follow');
    setMeta('geo.region', 'VN');
    setMeta('geo.placename', 'Việt Nam');
    setMeta('language', 'vi-VN');
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:locale', 'vi_VN', 'property');
    setMeta('og:url', canonical, 'property');
    setCanonical(canonical);

    setJsonLd('ifx-stock-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: detail.name || ticker,
      tickerSymbol: ticker,
      description: desc,
      url: canonical,
      inLanguage: 'vi-VN',
      provider: { '@type': 'Organization', name: 'iFlux', url: PROD_ORIGIN }
    });

    if (opts.newsCount != null) {
      setMeta('iflux:news-count', String(opts.newsCount));
    }
  }

  function stockSlugPath(ticker) {
    return '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
  }

  if (typeof document !== 'undefined') {
    autoPathBase();
  }

  global.IfluxSeoUrl = {
    PROD_ORIGIN: PROD_ORIGIN,
    userWebRoot: userWebRoot,
    slugify: slugify,
    sectorSlug: sectorSlug,
    primaryTicker: primaryTicker,
    primaryTopic: primaryTopic,
    chuDePath: chuDePath,
    chuDeHref: chuDeHref,
    chuDeCanonical: chuDeCanonical,
    parseChuDeEntitySlug: parseChuDeEntitySlug,
    parseChuDeSlug: parseChuDeSlug,
    storyEntityPath: storyEntityPath,
    storyEntityHref: storyEntityHref,
    storyEntityCanonical: storyEntityCanonical,
    parseStoryEntitySlug: parseStoryEntitySlug,
    postPath: postPath,
    postHref: postHref,
    postCanonical: postCanonical,
    postSlugPath: postSlugPath,
    parsePostRef: parsePostRef,
    storyPath: storyPath,
    stockPath: stockPath,
    sectorPath: sectorPath,
    ecosystemPath: ecosystemPath,
    topicPath: topicPath,
    tagPath: tagPath,
    communityPath: communityPath,
    pagePath: pagePath,
    storySlugPath: storySlugPath,
    stockSlugPath: stockSlugPath,
    storyCanonical: storyCanonical,
    stockCanonical: stockCanonical,
    sectorCanonical: sectorCanonical,
    ecosystemCanonical: ecosystemCanonical,
    storyHref: storyHref,
    stockHref: stockHref,
    sectorHref: sectorHref,
    ecosystemHref: ecosystemHref,
    topicHref: topicHref,
    tagHref: tagHref,
    parseStorySlug: parseStorySlug,
    parseStockTicker: parseStockTicker,
    parseSectorId: parseSectorId,
    parseEcosystemId: parseEcosystemId,
    parseTopicSlug: parseTopicSlug,
    parseTagSlug: parseTagSlug,
    ensurePathBase: ensurePathBase,
    autoPathBase: autoPathBase,
    applyPostSeoToDocument: applyPostSeoToDocument,
    applyStorySeoToDocument: applyStorySeoToDocument,
    applyStockSeoToDocument: applyStockSeoToDocument
  };
})(window);
