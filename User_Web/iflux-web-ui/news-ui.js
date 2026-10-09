/* Cộng đồng — UI components, SEO head, thẻ CP/chủ đề */
(function (global) {
  'use strict';

  function store() { return global.IfluxNewsStore; }
  function auth() { return global.IfluxAuth; }
  function tax() { return global.IfluxWatchlistTaxonomy; }
  function seo() { return global.IfluxSeoUrl; }

  function idHref(canonical) {
    return global.IfluxHref ? IfluxHref.forCanonical(canonical) : canonical;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function fmtRelative(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var h = Math.floor(diff / 3600000);
    if (h < 24) return h <= 1 ? 'Vừa xong' : h + ' giờ trước';
    var d = Math.floor(h / 24);
    return d + ' ngày trước';
  }

  /** Thời gian cuối dòng tiêu đề trên card feed */
  function fmtPostCardTime(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) diff = 0;
    var min = Math.floor(diff / 60000);
    if (min < 15) return 'vừa xong';
    if (min < 60) return min + ' phút';
    var h = Math.floor(min / 60);
    if (h < 24) return h + ' giờ';
    return Math.floor(h / 24) + ' ngày';
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  function getGroupPerformance(source, sourceId) {
    /* D1 / SOL-UNAVAIL: sector/eco/family/story aggregate không có runtime authority → UNAVAILABLE (null).
     * Cấm getSectorPerf / avg mock change_pct / FE aggregate. */
    return null;
  }

  function quoteChangePct(q) {
    if (!q) return null;
    if (q.change_pct != null && !isNaN(Number(q.change_pct))) return Number(q.change_pct);
    if (q.pctChange != null && !isNaN(Number(q.pctChange))) return Number(q.pctChange);
    return null;
  }

  function quotePrice(q) {
    if (!q) return null;
    if (q.price != null && !isNaN(Number(q.price))) return Number(q.price);
    if (q.close != null && !isNaN(Number(q.close))) return Number(q.close);
    return null;
  }

  /**
   * Quote hiển thị Community = runtime only (IfluxMarketQuotes).
   * CẤM fallback IfluxMockMarket — seed lệch giá thật (TCB 28.9 mock vs 29.7 runtime).
   */
  function getStockQuote(ticker) {
    var t = String(ticker || '').toUpperCase();
    if (!t) return null;
    var mq = global.IfluxMarketQuotes;
    if (!mq || typeof mq.peekQuote !== 'function') return null;
    var rq = mq.peekQuote(t);
    if (!rq) return null;
    return {
      ticker: t,
      name: rq.name || null,
      price: quotePrice(rq),
      change_pct: quoteChangePct(rq),
      /* ref/ceiling/floor — thiếu 3 field này thì không phân biệt được Tham chiếu/Trần/Sàn với
         Tăng/Giảm thường (chỉ còn so dấu %, luôn rơi về is-up/is-down hoặc rỗng — xem
         tickerTagHtml). IfluxMarketQuotes.priceState() (SoT, đã đúng ở entity-list-page.js)
         cần đủ 4 giá trị close/ref/ceiling/floor mới phân loại đúng 5 trạng thái. */
      ref: rq.ref != null ? Number(rq.ref) : null,
      ceiling: rq.ceiling != null ? Number(rq.ceiling) : null,
      floor: rq.floor != null ? Number(rq.floor) : null
    };
  }

  /** Tên mã từ membership bài (entities.stocks) — không lấy từ Mock. */
  function stockNameFromPost(post, ticker) {
    var t = String(ticker || '').toUpperCase();
    if (!t || !post) return null;
    var stocks = (post.entities && post.entities.stocks) || [];
    for (var i = 0; i < stocks.length; i++) {
      var s = stocks[i];
      var code = String((s && (s.code || s.ticker)) || '').toUpperCase();
      if (code !== t) continue;
      return (s.short_name || s.name || null);
    }
    return null;
  }

  function collectPostTickers(posts) {
    var set = Object.create(null);
    (posts || []).forEach(function (p) {
      (p && p.tickers ? p.tickers : []).forEach(function (tk) {
        var t = String(tk || '').toUpperCase();
        if (t) set[t] = true;
      });
    });
    return Object.keys(set);
  }

  function refreshTickerQuoteDom(elRoot, posts) {
    (posts || []).forEach(function (p) {
      if (!p || !p.slug) return;
      var slugSel = String(p.slug).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var card = elRoot.querySelector('[data-ifx-com-slug="' + slugSel + '"]');
      if (card) {
        var tags = card.querySelector('.ifx-com-post__tags');
        if (tags) tags.innerHTML = postTagsHtml(p);
      }
    });
    clampTagRows(elRoot);
    var articleTags = elRoot.querySelector('.ifx-com-article__tags');
    if (articleTags && posts && posts[0]) {
      articleTags.innerHTML = postTagsHtml(posts[0]);
    }
    var host = elRoot.querySelector('[data-ifx-com-ticker-rows]');
    if (host && posts && posts[0]) {
      host.innerHTML = sidebarTickerRowsInnerHtml(posts[0]);
    }
    var mobile = document.querySelector('[data-ifx-ix-article-entities]');
    if (mobile && posts && posts[0] && typeof postEntityChipsHtml === 'function') {
      var chips = postEntityChipsHtml(posts[0]);
      if (chips) {
        mobile.innerHTML = '<div class="ifx-com-pills ifx-com-pills--scroll">' + chips + '</div>';
        mobile.removeAttribute('hidden');
      }
    }
  }

  /** Fetch runtime quotes rồi refresh chip/sidebar/mobile strip. */
  function hydrateTickerQuotes(root, posts) {
    var mq = global.IfluxMarketQuotes;
    var tickers = collectPostTickers(posts);
    if (!mq || typeof mq.getQuotes !== 'function' || !tickers.length) {
      return Promise.resolve();
    }
    var elRoot = root && root.querySelector ? root : document;
    return mq.getQuotes(tickers).then(function () {
      refreshTickerQuoteDom(elRoot, posts);
    }).catch(function () { /* keep empty — không fallback Mock */ });
  }

  /** Prefetch quotes vào cache trước paint (tránh flash Mock / trống). */
  function prefetchTickerQuotes(posts) {
    var mq = global.IfluxMarketQuotes;
    var tickers = collectPostTickers(posts);
    if (!mq || typeof mq.getQuotes !== 'function' || !tickers.length) {
      return Promise.resolve();
    }
    return mq.getQuotes(tickers).catch(function () { /* ignore */ });
  }

  function getPrimaryStory(post) {
    var stories = (post.story_tags || []).filter(function (t) {
      return t.source === 'chu-de' || t.source === 'story' || !t.source;
    });
    return stories[0] || null;
  }

  function tickerArchiveUrl(ticker) {
    var c = global.IfluxSeoUrl
      ? IfluxSeoUrl.stockHref(ticker)
      : '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
    return idHref(c);
  }

  /* Chip mã: chỉ mã + % thay đổi; màu + dấu thể hiện đủ 5 trạng thái (Trần/Tăng/Tham chiếu/Giảm/
     Sàn) qua IfluxMarketQuotes.priceState() (SoT — đã đúng ở entity-list-page.js). Trước đây chỉ
     so dấu % (chỉ ra is-up/is-down hoặc rỗng) — Tham chiếu/Trần/Sàn không có class nào, rơi về
     màu mặc định của chip (xám), sai bản chất. */
  function tickerTagHtml(ticker) {
    var q = getStockQuote(ticker);
    var chg = quoteChangePct(q);
    var has = chg != null && !isNaN(chg);
    var mq = global.IfluxMarketQuotes;
    var state = (q && mq && typeof mq.priceState === 'function')
      ? mq.priceState(q.price, q.ref, q.ceiling, q.floor)
      : (has ? (chg > 0 ? 'up' : (chg < 0 ? 'down' : 'ref')) : null);
    var dir = state ? ' is-' + state : '';
    return (
      '<a class="ix-chip ix-chip-sm ix-chip-outline ifx-com-tick' + dir + '" href="' + tickerArchiveUrl(ticker) + '">' +
        ticker +
        (has ? ' <span class="ifx-com-tick__chg">' + fmtPct(chg) + '</span>' : '') +
      '</a>'
    );
  }

  /* Tag trên card tin: tối đa 2 hàng, phần dư thay bằng «…» — card không bị kéo cao. */
  var TAG_ROWS = 2;
  function clampTagRows(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.ifx-com-post__tags').forEach(function (box) {
      var more = box.querySelector(':scope > [data-ifx-tags-more]');
      if (more) more.remove();
      var items = Array.prototype.slice.call(box.children);
      items.forEach(function (el) { el.hidden = false; });
      if (!items.length || !box.offsetParent) return;
      var tops = [];
      var cut = -1;
      for (var i = 0; i < items.length; i++) {
        var t = items[i].offsetTop;
        if (tops.indexOf(t) < 0) tops.push(t);
        if (tops.length > TAG_ROWS) { cut = i; break; }
      }
      if (cut < 0) return;
      for (var j = cut; j < items.length; j++) items[j].hidden = true;
      more = document.createElement('span');
      more.className = 'ix-chip ix-chip-sm ix-chip-outline';
      more.setAttribute('data-ifx-tags-more', '');
      more.textContent = '…';
      box.appendChild(more);
      var lastRowTop = tops[TAG_ROWS - 1];
      while (more.offsetTop > lastRowTop && cut > 0) {
        cut -= 1;
        items[cut].hidden = true;
      }
    });
  }
  var clampTimer = null;
  global.addEventListener('resize', function () {
    clearTimeout(clampTimer);
    clampTimer = setTimeout(function () { clampTagRows(document); }, 150);
  });

  function postTagsHtml(post) {
    var html = '';
    var story = getPrimaryStory(post);
    if (story) {
      html += '<span class="ix-chip ix-chip-sm ix-chip-primary">' + story.name + '</span>';
    }
    html += (post.tickers || []).map(tickerTagHtml).join('');
    return html;
  }

  /**
   * Entity gắn bài — membership persist (tickers / ecosystems); Sector OUT auto-derive.
   * Atom UI: ix-chip* (Admin DS components.css).
   */
  function entityChipLinkHtml(href, chipClass, icon, label) {
    return (
      '<a class="ix-chip ix-chip-sm ' + chipClass + '" href="' + href + '">' +
        '<i class="ti ' + icon + '" aria-hidden="true"></i> ' +
        escHtml(label) +
      '</a>'
    );
  }

  function postEntityChipsHtml(post) {
    var parts = [];
    (post.story_tags || []).filter(function (t) {
      return t.source === 'chu-de' || t.source === 'story' || !t.source;
    }).forEach(function (story) {
      parts.push(entityChipLinkHtml(
        storyEntityLink(story.sourceId),
        'ix-chip-warning',
        'ti-book-2',
        story.name
      ));
    });
    (post.sectors || []).forEach(function (s) {
      var id = typeof s === 'object' ? (s.id || s.slug || s.code) : s;
      var name = typeof s === 'object' ? (s.name || s.slug || id) : s;
      if (!id) return;
      var href = idHref(seo() ? seo().sectorHref(id) : '/nganh/' + encodeURIComponent(id));
      parts.push(entityChipLinkHtml(href, 'ix-chip-info', 'ti-category', name));
    });
    (post.tickers || []).forEach(function (tk) {
      parts.push(tickerTagHtml(tk));
    });
    var ecos = (post.entities && post.entities.ecosystems) || [];
    if (!ecos.length && (post.ecosystems || []).length) {
      ecos = post.ecosystems.map(function (slug) {
        return { id: slug, name: slug };
      });
    }
    ecos.forEach(function (g) {
      var id = g.id || g.slug || g.code;
      if (!id) return;
      var href = idHref(seo() ? seo().ecosystemHref(id) : '/he-sinh-thai/' + encodeURIComponent(id));
      parts.push(entityChipLinkHtml(href, 'ix-chip-success', 'ti-users-group', g.name || id));
    });
    return parts.join('');
  }

  /**
   * Ảnh hiển thị card/feed — từ cover/image_url (Feed DTO) hoặc seo.og_image (detail).
   * `role` (tuỳ chọn): mã trường hợp regenerate ở cover.variants (cover_thumb/cover_card/
   * cover_hero/cover_detail) — ưu tiên dùng bản đã regenerate đúng kích thước vị trí đó;
   * bài cũ chưa có variants sẽ rơi về ảnh gốc như trước. Không ghi vào metadata.
   */
  function resolvePostDisplayImage(post, role) {
    post = post || {};
    var seo = post.seo || {};
    var cover = post.cover || {};
    var meta = post.metadata || {};
    var variants = cover.variants || {};
    var variantSrc = role && variants[role] ? String(variants[role]).trim() : '';
    var src =
      variantSrc ||
      (seo.og_image && String(seo.og_image).trim()) ||
      (cover.url && String(cover.url).trim()) ||
      (post.image_url && String(post.image_url).trim()) ||
      (meta.image && String(meta.image).trim()) ||
      '';
    var alt =
      (seo.og_image_alt && String(seo.og_image_alt).trim()) ||
      (cover.alt && String(cover.alt).trim()) ||
      (post.title && String(post.title).trim()) ||
      '';
    return { src: src, alt: alt };
  }

  function thumbHtml(post, role) {
    var img = resolvePostDisplayImage(post, role);
    if (img.src) {
      return '<img class="ifx-com-post__thumb-img" src="' + img.src + '" alt="' + (img.alt || '') + '" loading="lazy" decoding="async" onerror="this.remove()" />';
    }
    var story = (post.story_tags && post.story_tags[0]) ? post.story_tags[0].name : '';
    var icon = 'ti-article';
    if (story.indexOf('AI') >= 0) icon = 'ti-cpu';
    else if (story.indexOf('thép') >= 0 || story.indexOf('Thép') >= 0) icon = 'ti-building-factory';
    else if (story.indexOf('NH') >= 0 || story.indexOf('ngân') >= 0) icon = 'ti-building-bank';
    else if (story.indexOf('EV') >= 0 || story.indexOf('điện') >= 0) icon = 'ti-car';
    else if (story.indexOf('BĐS') >= 0 || story.indexOf('căn hộ') >= 0) icon = 'ti-building';
    return '<div class="ifx-com-post__thumb-fallback"><i class="ti ' + icon + '"></i></div>';
  }

  function postStoryHref(post, opts) {
    var c = global.IfluxSeoUrl
      ? IfluxSeoUrl.postHref(post)
      : '/tin-tuc/bai-viet/' + encodeURIComponent(post.slug || post.id);
    return idHref(c);
  }

  function postStats(post) {
    return post && post.stats ? post.stats : {};
  }

  function postCardInnerHtml(post, opts) {
    opts = opts || {};
    var href = postStoryHref(post, opts);
    var showExcerpt = !!opts.showExcerpt;
    var thumbCls = opts.thumbClass || '';
    var imageRole = opts.imageRole || '';
    var timeStr = fmtPostCardTime(post.published_at || post.created_at);
    var stats = postStats(post);
    /* Avatar / tên / nguồn RSS không render trên card tin — chỉ trên bài chi tiết */
    var statsHtml =
      '<span><i class="ti ti-heart"></i> ' + (stats.likes || 0) + '</span>' +
      '<span><i class="ti ti-message"></i> ' + (stats.comments || 0) + '</span>' +
      '<span><i class="ti ti-share"></i> ' + (stats.shares || 0) + '</span>';

    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPostBody({
        href: href,
        thumbHtml: thumbHtml(post, imageRole),
        thumbClass: thumbCls,
        title: post.title || 'Bài viết',
        time: timeStr,
        excerpt: post.excerpt || '',
        showExcerpt: showExcerpt,
        tagsHtml: postTagsHtml(post),
        statsHtml: statsHtml
      });
    }

    return (
      '<a class="ifx-com-post__thumb' + (thumbCls ? ' ' + thumbCls : '') + '" href="' + href + '">' + thumbHtml(post, imageRole) + '</a>' +
      '<div class="ifx-com-post__body">' +
        '<div class="ifx-com-post__title-row">' +
          '<a class="ifx-com-post__title-text" href="' + href + '">' + (post.title || 'Bài viết') + '</a>' +
        '</div>' +
        (showExcerpt
          ? '<p class="ifx-com-post__excerpt">' + (post.excerpt || '') + '</p>'
          : '') +
        '<div class="ifx-com-post__tags">' + postTagsHtml(post) + '</div>' +
        '<div class="ifx-com-post__footer">' +
          '<span class="ifx-com-post__time">' + timeStr + '</span>' +
          '<div class="ifx-com-post__stats">' + statsHtml + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* Card vừa (4/12, lưới 3 cột) — dùng bản regenerate cover_card */
  function postCardHtml(post) {
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPost({
        slug: post.slug,
        bodyHtml: postCardInnerHtml(post, { imageRole: 'cover_card' })
      });
    }
    return (
      '<article class="ifx-com-post" data-ifx-com-slug="' + post.slug + '">' +
        postCardInnerHtml(post, { imageRole: 'cover_card' }) +
      '</article>'
    );
  }

  /* Card lớn (6/12, nổi bật) — dùng bản regenerate cover_hero */
  function featuredPostHtml(post) {
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPost({
        slug: post.slug,
        variant: 'featured',
        bodyHtml: postCardInnerHtml(post, { showExcerpt: true, imageRole: 'cover_hero' })
      });
    }
    return (
      '<article class="ifx-com-post ifx-com-post--featured" data-ifx-com-slug="' + post.slug + '">' +
        postCardInnerHtml(post, { showExcerpt: true, imageRole: 'cover_hero' }) +
      '</article>'
    );
  }

  /* Card nhỏ (sidebar/compact, kể cả "Bài viết liên quan") — dùng bản regenerate cover_thumb */
  function compactPostHtml(post, opts) {
    var merged = Object.assign({ imageRole: 'cover_thumb' }, opts || {});
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPost({
        slug: post.slug,
        variant: 'compact',
        bodyHtml: postCardInnerHtml(post, merged)
      });
    }
    return (
      '<article class="ifx-com-post ifx-com-post--compact" data-ifx-com-slug="' + post.slug + '">' +
        postCardInnerHtml(post, merged) +
      '</article>'
    );
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

  function applySeoToDocument(post, basePath) {
    if (!post) return;
    basePath = basePath || '../news/';
    var seo = post.seo || {};
    var geo = post.geo || {};
    /* Pipeline B: chỉ consume article.metadata — không derive / không defensive default. */
    var meta = global.IfluxSeoUrl && IfluxSeoUrl.resolvePostShareMeta
      ? IfluxSeoUrl.resolvePostShareMeta(post)
      : (post.metadata || {});
    if (!meta || !Object.keys(meta).length) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[iFlux] article.metadata thiếu — bỏ qua applySeoToDocument');
      }
      return;
    }
    var canonical = meta.canonical || meta.url || null;
    var ogUrl = meta.url || meta.canonical || null;
    if (global.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
      IfluxPageDefinition.applyPatch({
        title: meta.title,
        intro: meta.description,
        documentTitle: meta.documentTitle || meta.title,
        seo: {
          description: meta.description,
          robots: seo.robots || 'index,follow',
          keywords: [seo.focus_keyword].concat(seo.secondary_keywords || []).concat(geo.geo_keywords || []).filter(Boolean).join(', '),
          canonical: canonical,
          'geo.region': geo.country === 'VN' ? 'VN' : geo.country,
          'geo.placename': geo.region || 'Việt Nam',
          language: geo.language || 'vi-VN',
          'og:site_name': meta.site_name || null,
          'og:title': meta.title,
          'og:description': meta.description,
          'og:type': 'article',
          'og:locale': geo.target_locale || 'vi_VN',
          'og:image': meta.image || null,
          'og:url': ogUrl,
          'twitter:card': meta.twitter_card || null,
          'twitter:title': meta.title,
          'twitter:description': meta.description,
          'twitter:image': meta.image || null,
          jsonLd: [{ id: 'ifx-com-jsonld', data: store().buildJsonLd(post, canonical) }]
        }
      });
      return;
    }
    /* Phase B: không fallback ghi title/meta — Page Definition là SoT. */
  }

  function currentUserId() {
    var u = auth() && auth().getUser();
    return u && u.id ? u.id : 'usr_local';
  }

  /* Link chủ đề: market story → /chu-de/:slug; nếu là chủ đề cộng đồng → trang topic */
  function storyEntityLink(sourceId) {
    var s = seo();
    var c = (s && s.chuDeHref)
      ? s.chuDeHref(sourceId)
      : ((s && s.storyHref)
        ? s.storyHref(sourceId)
        : '/chu-de/' + encodeURIComponent(String(sourceId || '')));
    return idHref(c);
  }

  function sideLinkRowHtml(href, icon, name, perf, extra) {
    var cls = 'ifx-com-side-row' + (dirClass(perf) ? ' ' + dirClass(perf) : '');
    return (
      '<a class="' + cls + '" href="' + href + '">' +
        '<span class="ifx-com-side-row__name"><i class="ti ' + icon + '"></i> ' + escHtml(name) + (extra || '') + '</span>' +
        '<span class="ifx-com-side-row__val">' + (perf != null ? fmtPct(perf) : '—') + '</span>' +
      '</a>'
    );
  }

  /* ── Chủ đề: liệt kê tất cả story_tags, bấm mở trang chủ đề ── */
  function sidebarStoryRowsHtml(post) {
    var stories = (post.story_tags || []).filter(function (t) {
      return t.source === 'chu-de' || t.source === 'story' || !t.source;
    });
    if (!stories.length) return '';
    return stories.map(function (story) {
      var perf = getGroupPerformance('story', story.sourceId);
      return sideLinkRowHtml(storyEntityLink(story.sourceId), 'ti-bookmark', story.name, perf);
    }).join('');
  }

  /* ── Ngành: BR-AD-12 OUT — chỉ membership persist (thường rỗng); không taxonomy-derive ── */
  function sidebarSectorRowsHtml(post) {
    var sectors = post.sectors || [];
    if (!sectors.length) return '';
    return sectors.map(function (s) {
      var id = typeof s === 'object' ? (s.id || s.slug || s.code) : s;
      var name = typeof s === 'object' ? (s.name || s.slug || id) : s;
      var href = idHref(seo() ? seo().sectorHref(id) : '/nganh/' + encodeURIComponent(id));
      return sideLinkRowHtml(href, 'ti-chart-dots-3', name, null);
    }).join('');
  }

  /* ── Hệ sinh thái: từ payload.ecosystems / entities.ecosystems (sau Eco ≥3) ── */
  function sidebarEcosystemRowsHtml(post) {
    var groups = (post.entities && post.entities.ecosystems) || [];
    if (!groups.length && (post.ecosystems || []).length) {
      groups = post.ecosystems.map(function (slug) {
        return { id: slug, slug: slug, name: slug };
      });
    }
    if (!groups.length) return '';
    return groups.map(function (g) {
      var id = g.id || g.slug || g.code;
      var perf = getGroupPerformance('family', id);
      var href = idHref(seo() ? seo().ecosystemHref(id) : '/he-sinh-thai/' + encodeURIComponent(id));
      return sideLinkRowHtml(href, 'ti-hierarchy-2', g.name || g.slug || id, perf);
    }).join('');
  }

  /* ── Cổ phiếu: membership persist ── */
  function sidebarTickerRowsInnerHtml(post) {
    var tickers = post.tickers || [];
    if (!tickers.length) return '';
    return tickers.map(function (tk) {
      var q = getStockQuote(tk);
      var chg = quoteChangePct(q);
      var price = quotePrice(q);
      var name = (q && q.name) || stockNameFromPost(post, tk);
      var cls = 'ifx-com-side-row' + (dirClass(chg) ? ' ' + dirClass(chg) : '');
      return (
        '<a class="' + cls + '" href="' + tickerArchiveUrl(tk) + '">' +
          '<span class="ifx-com-side-row__name"><strong>' + escHtml(tk) + '</strong>' +
            (name ? '<small>' + escHtml(name) + '</small>' : '') +
          '</span>' +
          '<span class="ifx-com-side-row__val">' +
            (price != null ? price + ' ' : '') +
            (chg != null ? fmtPct(chg) : (price != null ? '' : '—')) +
          '</span>' +
        '</a>'
      );
    }).join('');
  }

  function sidebarTickerRowsHtml(post) {
    var inner = sidebarTickerRowsInnerHtml(post);
    if (!inner) return '';
    return '<div data-ifx-com-ticker-rows="1">' + inner + '</div>';
  }

  function applyStorySeoExtras(post) {
    applySeoToDocument(post);
    var meta = post.metadata || {};
    var canonical = meta.canonical || meta.url ||
      (global.IfluxSeoUrl ? IfluxSeoUrl.postCanonical(post) : '');
    var communityUrl = global.IfluxSeoUrl
      ? IfluxSeoUrl.PROD_ORIGIN + '/tin-tuc'
      : location.href.split('#')[0].replace(/story\.html.*/, 'index.html');
    var breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Trang chủ',
          item: communityUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: post.title,
          item: canonical
        }
      ]
    };
    var scriptId = 'ifx-com-breadcrumb-ld';
    var old = document.getElementById(scriptId);
    if (old) old.remove();
    var script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(breadcrumb);
    document.head.appendChild(script);

    if (global.IfluxCommunityGeoAi) {
      var g = IfluxCommunityGeoAi.normalizeGeoAi(post);
      if (g.summary) setMeta('abstract', g.summary);
      var geoLdId = 'ifx-com-geo-ai-ld';
      var oldGeo = document.getElementById(geoLdId);
      if (oldGeo) oldGeo.remove();
      var geoScript = document.createElement('script');
      geoScript.id = geoLdId;
      geoScript.type = 'application/ld+json';
      geoScript.textContent = JSON.stringify(
        IfluxCommunityGeoAi.buildJsonLdBlocks(post, canonical),
        null,
        2
      );
      document.head.appendChild(geoScript);
    }
  }

  /**
   * Khối "Thông tin người viết" — Owner 2026-10: đứng sau Nội dung chi tiết, khung riêng tách
   * biệt nội dung bài. Mỗi dòng có icon. Field nào khuyết dữ liệu thì bỏ qua, không hiện placeholder
   * giả (vd Chứng nhận — chưa có nguồn dữ liệu, không in dòng này cho tới khi có).
   * Avatar/Tên: tác giả Admin/Sub-admin thật nếu có; RSS (không có author) → fallback "Đội ngũ
   * iFlux" tạm thời (CHƯA có Cài đặt "Tác giả mặc định" ở Admin — khi có, đổi fallback này sang
   * đọc đúng cấu hình đó, không sửa lại khung HTML).
   * Chuyên môn/Năm kinh nghiệm/Hỗ trợ biên soạn: hardcode tạm theo yêu cầu Owner.
   */
  function articleAuthorInfoHtml(post, publishedIso) {
    post = post || {};
    var author = post.author || null;
    var name = (author && author.display_name) ? author.display_name : 'Đội ngũ iFlux';
    var avatarUrl = (author && (author.avatar || author.avatar_url)) || '';
    var initials = name.trim().charAt(0).toUpperCase() || 'I';
    var avatarHtml = avatarUrl
      ? '<img class="ifx-avatar ifx-avatar-lg" src="' + escHtml(avatarUrl) + '" alt="' + escHtml(name) + '" />'
      : '<span class="ifx-avatar ifx-avatar-lg ifx-avatar-accent">' + escHtml(initials) + '</span>';

    var credRows =
      '<div class="ifx-icon-list-item"><i class="ti ti-briefcase"></i> Chuyên gia tài chính</div>' +
      '<div class="ifx-icon-list-item"><i class="ti ti-award"></i> 5+ năm kinh nghiệm</div>';
    /* Chứng nhận — chưa có field dữ liệu, bỏ qua đến khi có (không hiển thị placeholder). */

    var metaRows = [];
    if (publishedIso) {
      metaRows.push('<div class="ifx-icon-list-item"><i class="ti ti-calendar"></i> ' + escHtml(fmtDate(publishedIso)) + '</div>');
    }
    var sourceName = post.source_name || (post.source && post.source.name) || '';
    if (sourceName) {
      metaRows.push('<div class="ifx-icon-list-item"><i class="ti ti-link"></i> Nguồn tham khảo: ' + escHtml(sourceName) + '</div>');
    }
    metaRows.push('<div class="ifx-icon-list-item"><i class="ti ti-robot"></i> Hỗ trợ biên soạn: AI</div>');

    return (
      '<section class="ifx-card ifx-com-article__author">' +
        '<div class="ifx-com-article__author-head">' +
          avatarHtml +
          '<div class="ifx-com-article__author-who">' +
            '<div class="ifx-com-article__author-name">' + escHtml(name) + '</div>' +
            '<div class="ifx-icon-list">' + credRows + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ifx-icon-list ifx-com-article__author-meta">' + metaRows.join('') + '</div>' +
      '</section>'
    );
  }

  global.IfluxNewsUI = {
    fmtDate: fmtDate,
    fmtRelative: fmtRelative,
    fmtPct: fmtPct,
    postCardHtml: postCardHtml,
    featuredPostHtml: featuredPostHtml,
    compactPostHtml: compactPostHtml,
    postTagsHtml: postTagsHtml,
    clampTagRows: clampTagRows,
    postEntityChipsHtml: postEntityChipsHtml,
    getPrimaryStory: getPrimaryStory,
    tickerArchiveUrl: tickerArchiveUrl,
    getGroupPerformance: getGroupPerformance,
    sidebarStoryRowsHtml: sidebarStoryRowsHtml,
    sidebarSectorRowsHtml: sidebarSectorRowsHtml,
    sidebarEcosystemRowsHtml: sidebarEcosystemRowsHtml,
    sidebarTickerRowsHtml: sidebarTickerRowsHtml,
    hydrateTickerQuotes: hydrateTickerQuotes,
    prefetchTickerQuotes: prefetchTickerQuotes,
    applySeoToDocument: applySeoToDocument,
    applyStorySeoExtras: applyStorySeoExtras,
    articleAuthorInfoHtml: articleAuthorInfoHtml,
    currentUserId: currentUserId
  };
})(window);
