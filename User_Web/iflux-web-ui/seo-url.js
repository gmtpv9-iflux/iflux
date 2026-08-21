/* SEO / GEO — Entity-centric URL SoT
 * Knowledge: /stocks /sectors /ecosystems /chu-de (Chủ đề — entity narrative)
 * Community: /tin-tuc/bai-viet/:id (bài viết — KHÔNG phải /chu-de)
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

  /* ── Câu chuyện ENTITY (narrative thị trường) → /cau-chuyen/:slug ── */

  function chuDePath(slug) {
    slug = slugify(slug) || String(slug || '');
    if (isFileProto()) {
      return userWebRoot() + 'cau-chuyen/chi-tiet.html' + (slug ? '?id=' + encodeURIComponent(slug) : '');
    }
    return slug ? '/cau-chuyen/' + encodeURIComponent(slug) : '/cau-chuyen';
  }

  function chuDeHref(slugOrId) {
    return chuDePath(slugOrId);
  }

  function chuDeCanonical(slug, origin) {
    slug = slugify(slug) || String(slug || '');
    return (origin || PROD_ORIGIN) + '/cau-chuyen/' + encodeURIComponent(slug);
  }

  function parseChuDeSlug(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('id') ||
      new URLSearchParams(loc.search).get('story') ||
      new URLSearchParams(loc.search).get('chu-de') ||
      new URLSearchParams(loc.search).get('chude') ||
      new URLSearchParams(loc.search).get('cau-chuyen');
    if (q) return q;
    var m = (loc.pathname || '').match(/\/cau-chuyen\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/chu-de\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html' && (loc.pathname || '').indexOf('/tin-tuc/') < 0) {
      return decodeURIComponent(m[1]);
    }
    m = (loc.pathname || '').match(/\/stories\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = (loc.pathname || '').match(/\/story\/([^/?#]+)\/?$/i);
    if (m && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    return null;
  }

  /* Community Topic collection → /tin-tuc/chu-de/:slug */
  function communityTopicHref(slug) {
    slug = slugify(slug) || String(slug || '');
    return slug ? '/tin-tuc/chu-de/' + encodeURIComponent(slug) : '/tin-tuc/chu-de';
  }

  function communityAuthorHref(username) {
    var key = String(username || '').trim();
    return key ? '/tin-tuc/tac-gia/' + encodeURIComponent(key) : '/tin-tuc/tac-gia';
  }

  function communityCategoryHref(slug) {
    slug = slugify(slug) || String(slug || '');
    return slug ? '/tin-tuc/danh-muc/' + encodeURIComponent(slug) : '/tin-tuc/danh-muc';
  }

  /* Aliases cũ — Story = Chủ đề */
  function storyEntityPath(slug) { return chuDePath(slug); }
  function storyEntityHref(slugOrId) { return chuDeHref(slugOrId); }
  function storyEntityCanonical(slug, origin) { return chuDeCanonical(slug, origin); }
  function parseStoryEntitySlug(loc) { return parseChuDeSlug(loc); }
  function parseChuDeEntitySlug(loc) { return parseChuDeSlug(loc); }

  /* ── Community POST → /tin-tuc/bai-viet/:ref (id hoặc slug) ── */

  function postRef(postOrRef) {
    if (typeof postOrRef === 'string') return postOrRef;
    if (!postOrRef) return '';
    /* Ưu tiên slug SEO; id chỉ khi chưa có slug (draft/seed cũ). */
    return postOrRef.slug || postOrRef.id || '';
  }

  function postPath(postOrRef) {
    var ref = postRef(postOrRef);
    if (isFileProto()) {
      return userWebRoot() + 'news/post.html' + (ref ? '?id=' + encodeURIComponent(ref) : '');
    }
    return ref ? '/tin-tuc/bai-viet/' + encodeURIComponent(ref) : '/tin-tuc/bai-viet';
  }

  function postHref(postOrRef) {
    return postPath(postOrRef);
  }

  function postCanonical(post, origin) {
    /* Article Metadata SoT — không dùng seo.canonical / canonical_url RSS ngoài. */
    var meta = post && post.metadata;
    if (meta && typeof meta === 'object') {
      var fromMeta = meta.canonical || meta.url;
      if (fromMeta) return fromMeta;
    }
    var ref = postRef(post);
    return (origin || PROD_ORIGIN) + '/tin-tuc/bai-viet/' + encodeURIComponent(ref || '');
  }

  function postSlugPath(post) {
    return '/tin-tuc/bai-viet/' + encodeURIComponent(postRef(post));
  }

  function parsePostRef(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search).get('id') ||
      new URLSearchParams(loc.search).get('slug') ||
      new URLSearchParams(loc.search).get('post');
    if (q) return q;
    var path = loc.pathname || '';
    var m = path.match(/\/(?:tin-tuc|cong-dong)\/bai-viet\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    m = path.match(/\/community\/posts\/([^/?#]+)\/?$/i);
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
    return s ? '/he-sinh-thai/' + encodeURIComponent(s) : '/he-sinh-thai';
  }

  function tagPath(slugOrId) {
    /* legacy community tag → Chủ đề entity */
    return chuDePath(slugOrId);
  }

  function topicPath(slugOrId) {
    return chuDePath(slugOrId);
  }

  function communityPath() {
    if (isFileProto()) return userWebRoot() + 'news/index.html';
    return '/tin-tuc';
  }

  function pagePath(pageKey) {
    var map = {
      home: 'home', market: 'market', flow: 'flow', news: 'news',
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
    return '/cau-chuyen/' + encodeURIComponent(s || '');
  }
  function parseStorySlug(loc) { return parseStoryEntitySlug(loc); }

  function stockCanonical(ticker, origin) {
    return (origin || PROD_ORIGIN) + '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
  }

  function sectorCanonical(slug, origin) {
    return (origin || PROD_ORIGIN) + '/nganh/' + encodeURIComponent(sectorSlug(slug));
  }

  function ecosystemCanonical(slug, origin) {
    return (origin || PROD_ORIGIN) + '/he-sinh-thai/' + encodeURIComponent(slugify(slug) || slug);
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
    var m = (loc.pathname || '').match(/\/(?:he-sinh-thai|ho-co-phieu|ecosystems)\/([^/?#]+)\/?$/i);
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
    var dir = pageDir || 'news/';
    if (dir.charAt(dir.length - 1) !== '/') dir += '/';
    var b = document.createElement('base');
    b.setAttribute('data-ifx-path-base', '1');
    b.href = appOrigin() + root + dir;
    document.head.insertBefore(b, document.head.firstChild);
  }

  function autoPathBase() {
    var path = (global.location && global.location.pathname) || '';
    if (/\/binh-luan\/?$/i.test(path)) return ensurePathBase('comments/');
    if (/^\/(?:co-phieu|stocks)\//i.test(path)) return ensurePathBase('stock/');
    if (/^\/(?:nganh|sectors)\//i.test(path)) return ensurePathBase('sector/');
    if (/^\/(?:he-sinh-thai|ho-co-phieu|ecosystems)\//i.test(path)) return ensurePathBase('family/');
    if (/^\/cau-chuyen\//i.test(path)) return ensurePathBase('cau-chuyen/');
    if (/^\/chu-de\//i.test(path) && path.indexOf('/tin-tuc/') < 0) return ensurePathBase('cau-chuyen/');
    if (/^\/stories\//i.test(path)) return ensurePathBase('cau-chuyen/');
    if (/^\/(?:cong-dong\/bai-viet|community\/posts)\//i.test(path)) return ensurePathBase('news/');
    if (/^\/community\/tag\//i.test(path)) return ensurePathBase('cau-chuyen/');
    if (/\/community\/stocks\//i.test(path)) return ensurePathBase('stock/');
    if (/\/community\/sectors\//i.test(path)) return ensurePathBase('sector/');
    if (/\/community\/ecosystems\//i.test(path)) return ensurePathBase('family/');
    if (/\/tin-tuc\//i.test(path)) return ensurePathBase('news/');
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

  function pageDefinition() {
    return global.IfluxPageDefinition || null;
  }

  /**
   * Consume Article Metadata SoT từ Backend — không derive.
   * Chỉ return post.metadata (hoặc object rỗng nếu thiếu).
   */
  function resolvePostShareMeta(post) {
    var m = post && post.metadata;
    if (!m || typeof m !== 'object') return {};
    return m;
  }

  /** Pipeline B: chỉ expose metadata.* — thiếu field thì bỏ qua, không defensive default. */
  function applyPostSeoToDocument(post) {
    if (!post) return;
    var seo = post.seo || {};
    var meta = resolvePostShareMeta(post);
    if (!meta || !Object.keys(meta).length) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[iFlux] article.metadata thiếu — bỏ qua apply SEO share');
      }
      return;
    }
    var canonical = meta.canonical || meta.url || null;
    var ogUrl = meta.url || meta.canonical || null;
    var jsonLd = {
      '@context': 'https://schema.org',
      '@type': seo.schema_type || 'NewsArticle',
      headline: meta.title,
      description: meta.description,
      url: canonical || undefined,
      image: meta.image || undefined,
      datePublished: post.published_at || post.created_at,
      inLanguage: 'vi-VN',
      author: post.author ? { '@type': 'Person', name: post.author.display_name } : undefined,
      about: (post.tickers || []).map(function (t) {
        return { '@type': 'Corporation', tickerSymbol: t, url: stockCanonical(t) };
      })
    };
    if (!pageDefinition() || !pageDefinition().applyPatch) return;
    var patch = {
      title: meta.title,
      intro: meta.description,
      documentTitle: meta.documentTitle || meta.title,
      seo: {
        description: meta.description,
        robots: seo.robots || 'index,follow',
        canonical: canonical,
        'og:title': meta.title,
        'og:description': meta.description,
        'og:type': 'article',
        'og:url': ogUrl,
        'og:image': meta.image || null,
        'og:site_name': meta.site_name || null,
        'twitter:card': meta.twitter_card || null,
        'twitter:title': meta.title,
        'twitter:description': meta.description,
        'twitter:image': meta.image || null,
        jsonLd: [{ id: 'ifx-story-jsonld', data: jsonLd }]
      }
    };
    pageDefinition().applyPatch(patch);
  }

  function applyStorySeoToDocument(post) {
    applyPostSeoToDocument(post);
  }

  /* Tên pháp lý — ưu tiên SoT B2 (IfluxEntityDefinition); fallback map local. */
  var STOCK_DOC_TITLE_NAMES = {
    SHB: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    HPG: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    VCB: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    FPT: 'Công ty Cổ phần FPT',
    MWG: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
    VHM: 'Công ty Cổ phần Vinhomes',
    VIC: 'Tập đoàn Vingroup',
    TCB: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    MBB: 'Ngân hàng TMCP Quân Đội',
    ACB: 'Ngân hàng TMCP Á Châu',
    SSI: 'Công ty Cổ phần Chứng khoán SSI',
    STB: 'Ngân hàng TMCP Sài Gòn Thương Tín'
  };

  function stockDocCompanyName(detail) {
    if (!detail) return '';
    var ticker = String(detail.ticker || '').toUpperCase();
    if (global.IfluxEntityDefinition && IfluxEntityDefinition.companyNameForTicker) {
      var fromSoT = IfluxEntityDefinition.companyNameForTicker(ticker);
      if (fromSoT && fromSoT !== ticker) return fromSoT;
    }
    return STOCK_DOC_TITLE_NAMES[ticker] || detail.name || detail.short_name || ticker;
  }

  /* ── Admin page SEO title templates (VI placeholders) ── */

  function hasSeoPlaceholder(s) {
    return /\{[^}]+\}/.test(String(s || ''));
  }

  function applySeoTemplate(pattern, vars) {
    var out = String(pattern || '');
    Object.keys(vars || {}).forEach(function (k) {
      out = out.split('{' + k + '}').join(String(vars[k] == null ? '' : vars[k]).trim() || '');
    });
    return out.replace(/\s{2,}/g, ' ').replace(/\(\s*\)/g, '').trim();
  }

  function buildSeoPlaceholderVars(input) {
    input = input || {};
    var ticker = String(input.ticker || input['Mã'] || '').trim();
    var stockName = String(input.stockName || input['Tên cổ phiếu'] || '').trim();
    var sectorName = String(input.sectorName || input['Tên ngành'] || '').trim();
    var ecoName = String(input.ecoName || input['Tên hệ sinh thái'] || '').trim();
    var authorName = String(input.authorName || input['Tên tác giả'] || '').trim();
    var storyName = String(input.storyName || input['Tên câu chuyện'] || '').trim();
    var categoryName = String(input.categoryName || input['Tên danh mục'] || '').trim();
    var v = {};
    if (ticker) {
      v['Mã'] = ticker;
      v.ticker = ticker;
    }
    if (stockName) {
      v['Tên cổ phiếu'] = stockName;
      v.name = stockName;
    }
    if (sectorName) {
      v['Tên ngành'] = sectorName;
      if (!v.name) v.name = sectorName;
    }
    if (ecoName) {
      v['Tên hệ sinh thái'] = ecoName;
      if (!v.name) v.name = ecoName;
    }
    if (authorName) {
      v['Tên tác giả'] = authorName;
      if (!v.name) v.name = authorName;
    }
    if (storyName) {
      v['Tên câu chuyện'] = storyName;
      if (!v.name) v.name = storyName;
    }
    if (categoryName) v['Tên danh mục'] = categoryName;
    return v;
  }

  function resolveSeoTitleTemplate(template, inputVars) {
    var tpl = String(template || '').trim();
    if (!tpl) return { title: '', unresolved: false, template: '' };
    if (!hasSeoPlaceholder(tpl)) return { title: tpl, unresolved: false, template: tpl };
    var resolved = applySeoTemplate(tpl, buildSeoPlaceholderVars(inputVars));
    if (!resolved || hasSeoPlaceholder(resolved)) {
      return { title: '', unresolved: true, template: tpl };
    }
    return { title: resolved, unresolved: false, template: tpl };
  }

  function siteSeoFromManifest() {
    var def = pageDefinition() && pageDefinition().getCurrent && pageDefinition().getCurrent();
    return (def && def.siteSeo) || {};
  }

  /**
   * Sole writer for Admin SEO page title on dynamic detail pages.
   * Resolved Admin template > fallbackTitle. Never publishes unresolved {…}.
   */
  function applySeoPageTitle(opts) {
    opts = opts || {};
    var siteSeo = opts.siteSeo || siteSeoFromManifest();
    var template = String(
      opts.template != null
        ? opts.template
        : siteSeo.title_template || ''
    ).trim();
    var fallback = String(opts.fallbackTitle || '').trim();
    var resolved = resolveSeoTitleTemplate(template, opts.vars || {});
    var title = resolved.title || fallback;
    if (!title || hasSeoPlaceholder(title)) return null;

    if (pageDefinition() && pageDefinition().applyPatch) {
      var patch = {
        documentTitle: title,
        seo: {
          'og:title': title,
          'twitter:title': title
        }
      };
      if (opts.patch) {
        if (opts.patch.title != null) patch.title = opts.patch.title;
        if (opts.patch.intro != null) patch.intro = opts.patch.intro;
        if (opts.patch.seo) patch.seo = Object.assign({}, opts.patch.seo, patch.seo);
      }
      pageDefinition().applyPatch(patch);
    } else {
      try {
        document.title = title;
      } catch (e) { /* ignore */ }
    }
    return title;
  }

  function applyStockSeoToDocument(detail, opts) {
    if (!detail) return;
    opts = opts || {};
    var ticker = String(detail.ticker || '').toUpperCase();
    var company = stockDocCompanyName(detail);
    var canonical = stockCanonical(ticker);
    var fallbackTitle = ticker + ' - ' + company;
    var siteSeo = siteSeoFromManifest();
    var descTpl = String(siteSeo.description_template || '').trim();
    var descResolved = descTpl
      ? resolveSeoTitleTemplate(descTpl, { ticker: ticker, stockName: company })
      : { title: '' };
    var desc =
      descResolved.title ||
      String(siteSeo.description || '').trim() ||
      ('Theo dõi ' + ticker + ' (' + (detail.exchange || 'HSX') + ') trên iFlux.');
    var keywords = [ticker, company, detail.name, detail.short_name, 'cổ phiếu ' + ticker, detail.exchange, 'chứng khoán Việt Nam']
      .filter(Boolean).join(', ');

    var jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: company,
      tickerSymbol: ticker,
      description: desc,
      url: canonical,
      inLanguage: 'vi-VN',
      provider: { '@type': 'Organization', name: 'iFlux', url: PROD_ORIGIN }
    };

    var docTitle = applySeoPageTitle({
      vars: { ticker: ticker, stockName: company },
      fallbackTitle: fallbackTitle,
      patch: {
        title: fallbackTitle,
        intro: desc,
        seo: {
          description: desc,
          keywords: keywords,
          robots: 'index,follow',
          canonical: canonical,
          'geo.region': 'VN',
          'geo.placename': 'Việt Nam',
          language: 'vi-VN',
          'og:description': desc,
          'og:type': 'website',
          'og:locale': 'vi_VN',
          'og:url': canonical,
          jsonLd: [{ id: 'ifx-stock-jsonld', data: jsonLd }]
        }
      }
    }) || fallbackTitle;

    if (opts.newsCount != null) {
      setMeta('iflux:news-count', String(opts.newsCount));
    }
    return docTitle;
  }

  function stockSlugPath(ticker) {
    return '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
  }

  /* ── Trang bình luận riêng ── */

  function commentsPath(scope, id) {
    scope = String(scope || '');
    id = String(id || '');
    if (!scope || !id) return '/binh-luan';
    if (isFileProto()) {
      return userWebRoot() + 'comments/index.html?scope=' + encodeURIComponent(scope) + '&id=' + encodeURIComponent(id);
    }
    if (scope === 'post') return '/tin-tuc/bai-viet/' + encodeURIComponent(id) + '/binh-luan';
    if (scope === 'stock') return '/co-phieu/' + encodeURIComponent(String(id).toUpperCase()) + '/binh-luan';
    if (scope === 'sector') return '/nganh/' + encodeURIComponent(id) + '/binh-luan';
    if (scope === 'family') return '/he-sinh-thai/' + encodeURIComponent(id) + '/binh-luan';
    if (scope === 'story') return '/cau-chuyen/' + encodeURIComponent(id) + '/binh-luan';
    return '/binh-luan';
  }

  function postCommentsPath(postOrRef) {
    return commentsPath('post', postRef(postOrRef) || postOrRef);
  }

  function stockCommentsPath(ticker) {
    return commentsPath('stock', ticker);
  }

  function sectorCommentsPath(slugOrId) {
    return commentsPath('sector', sectorSlug(slugOrId) || slugOrId);
  }

  function familyCommentsPath(slugOrId) {
    return commentsPath('family', slugify(slugOrId) || slugOrId);
  }

  function storyCommentsPath(slugOrId) {
    return commentsPath('story', slugify(slugOrId) || slugOrId);
  }

  function parseCommentsContext(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var params = new URLSearchParams(loc.search || '');
    var scopeQ = params.get('scope');
    var idQ = params.get('id');
    if (scopeQ && idQ) return { scope: scopeQ, id: idQ };

    var path = loc.pathname || '';
    var m = path.match(/\/(?:tin-tuc|cong-dong)\/bai-viet\/([^/?#]+)\/binh-luan\/?$/i);
    if (m) return { scope: 'post', id: decodeURIComponent(m[1]) };
    m = path.match(/\/co-phieu\/([^/?#]+)\/binh-luan\/?$/i);
    if (m) return { scope: 'stock', id: decodeURIComponent(m[1]).toUpperCase() };
    m = path.match(/\/nganh\/([^/?#]+)\/binh-luan\/?$/i);
    if (m) return { scope: 'sector', id: decodeURIComponent(m[1]) };
    m = path.match(/\/he-sinh-thai\/([^/?#]+)\/binh-luan\/?$/i);
    if (m) return { scope: 'family', id: decodeURIComponent(m[1]) };
    m = path.match(/\/cau-chuyen\/([^/?#]+)\/binh-luan\/?$/i);
    if (m) return { scope: 'story', id: decodeURIComponent(m[1]) };
    m = path.match(/\/chu-de\/([^/?#]+)\/binh-luan\/?$/i);
    if (m) return { scope: 'story', id: decodeURIComponent(m[1]) };
    return null;
  }

  function commentsHrefFromLocation(loc) {
    loc = loc || global.location;
    var ctx = parseCommentsContext(loc);
    if (ctx) return commentsPath(ctx.scope, ctx.id);

    var postId = parsePostRef(loc);
    if (postId && /\/(?:cong-dong\/bai-viet|community\/posts)/i.test(loc.pathname || '')) {
      return postCommentsPath(postId);
    }
    var ticker = parseStockTicker(loc);
    if (ticker) return stockCommentsPath(ticker);
    var sectorId = parseSectorId(loc);
    if (sectorId) return sectorCommentsPath(sectorId);
    var ecoId = parseEcosystemId(loc);
    if (ecoId) return familyCommentsPath(ecoId);
    var storyId = parseChuDeEntitySlug ? parseChuDeEntitySlug(loc) : parseChuDeSlug(loc);
    if (storyId) return storyCommentsPath(storyId);
    return null;
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
    communityTopicHref: communityTopicHref,
    communityAuthorHref: communityAuthorHref,
    communityCategoryHref: communityCategoryHref,
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
    commentsPath: commentsPath,
    postCommentsPath: postCommentsPath,
    stockCommentsPath: stockCommentsPath,
    sectorCommentsPath: sectorCommentsPath,
    familyCommentsPath: familyCommentsPath,
    storyCommentsPath: storyCommentsPath,
    parseCommentsContext: parseCommentsContext,
    commentsHrefFromLocation: commentsHrefFromLocation,
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
    resolvePostShareMeta: resolvePostShareMeta,
    applyPostSeoToDocument: applyPostSeoToDocument,
    applyStorySeoToDocument: applyStorySeoToDocument,
    applyStockSeoToDocument: applyStockSeoToDocument,
    resolveSeoTitleTemplate: resolveSeoTitleTemplate,
    applySeoPageTitle: applySeoPageTitle,
    buildSeoPlaceholderVars: buildSeoPlaceholderVars
  };

  global.IfluxSeoTitle = {
    resolve: resolveSeoTitleTemplate,
    apply: applySeoPageTitle,
    buildVars: buildSeoPlaceholderVars,
    hasPlaceholder: hasSeoPlaceholder
  };
})(window);
