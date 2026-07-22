/* Cộng đồng — UI components, SEO head, thẻ CP/chủ đề */
(function (global) {
  'use strict';

  function store() { return global.IfluxCommunityStore; }
  function auth() { return global.IfluxAuth; }
  function tax() { return global.IfluxWatchlistTaxonomy; }
  function mk() { return global.IfluxMockMarket; }
  function seo() { return global.IfluxSeoUrl; }

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

  function tierBadge(author) {
    if (!author || !author.tier_label) return '';
    var tier = String(author.tier || '').toLowerCase();
    var cls = 'ix-chip-primary';
    if (tier === 'ctv') cls = 'ix-chip-warning';
    else if (tier === 'elite') cls = 'ix-chip-warning ifx-com-badge--elite';
    else if (tier === 'admin') cls = 'ix-chip-secondary';
    return '<span class="ix-chip ' + cls + ' ix-chip-sm">' + author.tier_label + '</span>';
  }

  function getGroupPerformance(source, sourceId) {
    var m = mk();
    var t = tax();
    if (source === 'sector' && m) {
      var sp = m.getSectorPerf(sourceId);
      if (sp && sp.pg != null) return sp.pg;
    }
    if (!t) return null;
    var tickers = t.getGroupTickers(source, sourceId);
    if (!tickers.length) return null;
    var snap = m && m.getSnapshot();
    var stocks = snap && snap.entities && snap.entities.stocks ? snap.entities.stocks : {};
    var sum = 0;
    var n = 0;
    tickers.forEach(function (tk) {
      var s = stocks[tk];
      if (s && s.change_pct != null) {
        sum += s.change_pct;
        n += 1;
      }
    });
    return n ? Math.round((sum / n) * 100) / 100 : null;
  }

  function getStockQuote(ticker) {
    var snap = mk && mk() ? mk().getSnapshot() : null;
    var stocks = snap && snap.entities && snap.entities.stocks ? snap.entities.stocks : {};
    return stocks[(ticker || '').toUpperCase()] || null;
  }

  function getPrimaryStory(post) {
    var stories = (post.story_tags || []).filter(function (t) {
      return t.source === 'chu-de' || t.source === 'story' || !t.source;
    });
    return stories[0] || null;
  }

  function tickerArchiveUrl(ticker) {
    if (global.IfluxSeoUrl) return IfluxSeoUrl.stockHref(ticker);
    return '/co-phieu/' + encodeURIComponent(String(ticker || '').toUpperCase());
  }

  function trendStatHtml(chg) {
    if (chg == null || isNaN(chg)) return '';
    if (chg > 0) {
      return '<span class="ix-stat-trend up"><i class="ti ti-trending-up" style="font-size:11px"></i> ' + fmtPct(chg) + '</span>';
    }
    if (chg < 0) {
      return '<span class="ix-stat-trend down"><i class="ti ti-trending-down" style="font-size:11px"></i> ' + fmtPct(chg) + '</span>';
    }
    return '<span class="ix-stat-trend">' + fmtPct(chg) + '</span>';
  }

  function tickerTagHtml(ticker) {
    var q = getStockQuote(ticker);
    var chg = q && q.change_pct;
    return (
      '<a class="ix-chip ix-chip-sm ix-chip-outline" href="' + tickerArchiveUrl(ticker) + '">' +
        ticker +
        trendStatHtml(chg) +
      '</a>'
    );
  }

  function postTagsHtml(post) {
    var html = '';
    var story = getPrimaryStory(post);
    if (story) {
      html += '<span class="ix-chip ix-chip-sm ix-chip-primary">' + story.name + '</span>';
    }
    html += (post.tickers || []).map(tickerTagHtml).join('');
    return html;
  }

  function thumbHtml(post) {
    var seo = post.seo || {};
    if (seo.og_image) {
      return '<img class="ifx-com-post__thumb-img" src="' + seo.og_image + '" alt="' + (seo.og_image_alt || post.title) + '" loading="lazy" onerror="this.remove()" />';
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
    if (global.IfluxSeoUrl) {
      return IfluxSeoUrl.postHref(post);
    }
    return '/cong-dong/bai-viet/' + encodeURIComponent(post.slug || post.id);
  }

  function postStats(post) {
    return post && post.stats ? post.stats : {};
  }

  function postCardInnerHtml(post, opts) {
    opts = opts || {};
    var href = postStoryHref(post, opts);
    var showExcerpt = !!opts.showExcerpt;
    var thumbCls = opts.thumbClass || '';
    var timeStr = fmtPostCardTime(post.published_at || post.created_at);
    var stats = postStats(post);
    var authorHtml =
      (global.IfluxProfileLinks && post.author && post.author.id
        ? IfluxProfileLinks.avatarLink(post.author.id, (post.author.display_name || 'M').charAt(0), 'ifx-com-card__avatar ifx-profile-link-avatar', { base: '../account/' })
        : '<span class="ifx-com-card__avatar">' + ((post.author && post.author.display_name) || 'M').charAt(0) + '</span>') +
      (global.IfluxProfileLinks && post.author && post.author.id
        ? IfluxProfileLinks.nameLink(post.author.id, post.author.display_name || 'Thành viên', 'ifx-com-post__author-name', { base: '../account/' })
        : '<span class="ifx-com-post__author-name">' + ((post.author && post.author.display_name) || 'Thành viên') + '</span>') +
      tierBadge(post.author);
    var statsHtml =
      '<span><i class="ti ti-heart"></i> ' + (stats.likes || 0) + '</span>' +
      '<span><i class="ti ti-message"></i> ' + (stats.comments || 0) + '</span>' +
      '<span><i class="ti ti-share"></i> ' + (stats.shares || 0) + '</span>';

    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPostBody({
        href: href,
        thumbHtml: thumbHtml(post),
        thumbClass: thumbCls,
        title: post.title || 'Bài viết',
        time: timeStr,
        excerpt: post.excerpt || '',
        showExcerpt: showExcerpt,
        tagsHtml: postTagsHtml(post),
        authorHtml: authorHtml,
        statsHtml: statsHtml
      });
    }

    return (
      '<a class="ifx-com-post__thumb' + (thumbCls ? ' ' + thumbCls : '') + '" href="' + href + '">' + thumbHtml(post) + '</a>' +
      '<div class="ifx-com-post__body">' +
        '<div class="ifx-com-post__title-row">' +
          '<a class="ifx-com-post__title-text" href="' + href + '">' + (post.title || 'Bài viết') + '</a>' +
          '<span class="ifx-com-post__title-sep"> · </span>' +
          '<span class="ifx-com-post__time">' + timeStr + '</span>' +
        '</div>' +
        (showExcerpt
          ? '<p class="ifx-com-post__excerpt">' + (post.excerpt || '') + '</p>'
          : '') +
        '<div class="ifx-com-post__tags">' + postTagsHtml(post) + '</div>' +
        '<div class="ifx-com-post__footer">' +
          '<div class="ifx-com-post__author">' + authorHtml + '</div>' +
          '<div class="ifx-com-post__stats">' + statsHtml + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function postCardHtml(post) {
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPost({
        slug: post.slug,
        bodyHtml: postCardInnerHtml(post)
      });
    }
    return (
      '<article class="ifx-com-post" data-ifx-com-slug="' + post.slug + '">' +
        postCardInnerHtml(post) +
      '</article>'
    );
  }

  function featuredPostHtml(post) {
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPost({
        slug: post.slug,
        variant: 'featured',
        bodyHtml: postCardInnerHtml(post, { showExcerpt: true })
      });
    }
    return (
      '<article class="ifx-com-post ifx-com-post--featured" data-ifx-com-slug="' + post.slug + '">' +
        postCardInnerHtml(post, { showExcerpt: true }) +
      '</article>'
    );
  }

  function compactPostHtml(post, opts) {
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderFeedPost({
        slug: post.slug,
        variant: 'compact',
        bodyHtml: postCardInnerHtml(post, opts || {})
      });
    }
    return (
      '<article class="ifx-com-post ifx-com-post--compact" data-ifx-com-slug="' + post.slug + '">' +
        postCardInnerHtml(post, opts || {}) +
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
    basePath = basePath || '../community/';
    var seo = post.seo || {};
    var geo = post.geo || {};
    var pageUrl = location.href.split('#')[0];
    var canonical = seo.canonical_url ||
      (global.IfluxSeoUrl ? IfluxSeoUrl.postCanonical(post) : pageUrl);
    if (global.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
      IfluxPageDefinition.applyPatch({
        title: post.title,
        intro: post.excerpt || '',
        documentTitle: seo.meta_title || post.title,
        seo: {
          description: seo.meta_description || post.excerpt,
          robots: seo.robots || 'index,follow',
          keywords: [seo.focus_keyword].concat(seo.secondary_keywords || []).concat(geo.geo_keywords || []).filter(Boolean).join(', '),
          canonical: canonical,
          'geo.region': geo.country === 'VN' ? 'VN' : geo.country,
          'geo.placename': geo.region || 'Việt Nam',
          language: geo.language || 'vi-VN',
          'og:title': seo.og_title || post.title,
          'og:description': seo.og_description || post.excerpt,
          'og:type': 'article',
          'og:locale': geo.target_locale || 'vi_VN',
          'og:image': seo.og_image || null,
          'og:url': canonical,
          'twitter:card': 'summary_large_image',
          'twitter:title': seo.og_title || post.title,
          'twitter:description': seo.og_description || post.excerpt,
          'twitter:image': seo.og_image || null,
          jsonLd: [{ id: 'ifx-com-jsonld', data: store().buildJsonLd(post, canonical) }]
        }
      });
      return;
    }
    /* Phase B: không fallback ghi title/meta — Page Definition là SoT. */
  }

  function storyOptionsHtml() {
    var t = tax();
    if (!t) return '';
    var groups = t.getGroups('story');
    return groups.map(function (g) {
      return '<option value="' + g.id + '">' + g.name + '</option>';
    }).join('');
  }

  function seoHint(len, min, max) {
    var cls = 'ifx-com-hint';
    if (len < min || len > max) cls += ' is-warn';
    else cls += ' is-ok';
    return cls;
  }

  function currentUserId() {
    var u = auth() && auth().getUser();
    return u && u.id ? u.id : 'usr_local';
  }

  function shareUrl(slug) {
    var post = store().getPostBySlug(slug);
    if (global.IfluxSeoUrl) {
      if (post) return (location.origin || IfluxSeoUrl.PROD_ORIGIN) + IfluxSeoUrl.postSlugPath(post);
      return (location.origin || IfluxSeoUrl.PROD_ORIGIN) + '/cong-dong/bai-viet/' + encodeURIComponent(slug);
    }
    return (location.origin || '') + '/cong-dong/bai-viet/' + encodeURIComponent(slug);
  }

  function getPostStories(post) {
    var story = getPrimaryStory(post);
    return story ? [story] : [];
  }

  /* Link chủ đề: market story → /chu-de/:slug; nếu là chủ đề cộng đồng → trang topic */
  function storyEntityLink(sourceId) {
    var s = seo();
    if (s && s.chuDeHref) return s.chuDeHref(sourceId);
    if (s && s.storyHref) return s.storyHref(sourceId);
    return '/chu-de/' + encodeURIComponent(String(sourceId || ''));
  }

  /* Gom ngành / hệ sinh thái duy nhất mà các mã CP trong bài thuộc về */
  function aggregateMemberships(post, source) {
    var t = tax();
    if (!t || !t.getTickerMemberships) return [];
    var seen = {};
    var out = [];
    (post.tickers || []).forEach(function (tk) {
      var m = t.getTickerMemberships(tk);
      var g = m && m[source];
      if (g && g.id != null && !seen[g.id]) {
        seen[g.id] = true;
        out.push(g);
      }
    });
    return out;
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
    if (!stories.length) {
      return '<div class="ifx-com-side-empty">Bài chưa gắn chủ đề</div>';
    }
    return stories.map(function (story) {
      var perf = getGroupPerformance('story', story.sourceId);
      return sideLinkRowHtml(storyEntityLink(story.sourceId), 'ti-bookmark', story.name, perf);
    }).join('');
  }

  /* ── Ngành: suy ra từ các mã CP, bấm mở trang ngành ── */
  function sidebarSectorRowsHtml(post) {
    var groups = aggregateMemberships(post, 'sector');
    if (!groups.length) {
      return '<div class="ifx-com-side-empty">Bài chưa gắn ngành</div>';
    }
    return groups.map(function (g) {
      var perf = getGroupPerformance('sector', g.id);
      var href = seo() ? seo().sectorHref(g.id) : '/nganh/' + encodeURIComponent(g.id);
      return sideLinkRowHtml(href, 'ti-chart-dots-3', g.name, perf);
    }).join('');
  }

  /* ── Hệ sinh thái (họ CP): suy ra từ các mã CP, bấm mở trang hệ sinh thái ── */
  function sidebarEcosystemRowsHtml(post) {
    var groups = aggregateMemberships(post, 'family');
    if (!groups.length) {
      return '<div class="ifx-com-side-empty">Bài chưa gắn hệ sinh thái</div>';
    }
    return groups.map(function (g) {
      var perf = getGroupPerformance('family', g.id);
      var href = seo() ? seo().ecosystemHref(g.id) : '/he-sinh-thai/' + encodeURIComponent(g.id);
      return sideLinkRowHtml(href, 'ti-hierarchy-2', g.name, perf);
    }).join('');
  }

  /* ── Cổ phiếu: bấm mở trang cổ phiếu tương ứng ── */
  function sidebarTickerRowsHtml(post) {
    var tickers = post.tickers || [];
    if (!tickers.length) {
      return '<div class="ifx-com-side-empty">Chưa nhắc mã CP trong bài</div>';
    }
    return tickers.map(function (tk) {
      var q = getStockQuote(tk);
      var chg = q && q.change_pct;
      var cls = 'ifx-com-side-row' + (dirClass(chg) ? ' ' + dirClass(chg) : '');
      return (
        '<a class="' + cls + '" href="' + tickerArchiveUrl(tk) + '">' +
          '<span class="ifx-com-side-row__name"><strong>' + escHtml(tk) + '</strong>' +
            (q && q.name ? '<small>' + escHtml(q.name) + '</small>' : '') +
          '</span>' +
          '<span class="ifx-com-side-row__val">' +
            (q && q.price != null ? q.price + ' ' : '') +
            (chg != null ? fmtPct(chg) : '') +
          '</span>' +
        '</a>'
      );
    }).join('');
  }

  function sortComments(comments, mode) {
    var list = (comments || []).slice();
    if (mode === 'liked') {
      list.sort(function (a, b) {
        return (b.likes || 0) - (a.likes || 0) || new Date(b.created_at) - new Date(a.created_at);
      });
    } else if (mode === 'debate') {
      list.sort(function (a, b) {
        var sa = (a.replies || 0) * 3 + (a.likes || 0);
        var sb = (b.replies || 0) * 3 + (b.likes || 0);
        return sb - sa || new Date(b.created_at) - new Date(a.created_at);
      });
    } else if (mode === 'shared') {
      list.sort(function (a, b) {
        return (b.shares || 0) - (a.shares || 0) || new Date(b.created_at) - new Date(a.created_at);
      });
    } else {
      list.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    return list;
  }

  function commentItemHtml(c) {
    var nameHtml = global.IfluxProfileLinks && c.user_id
      ? IfluxProfileLinks.nameLink(c.user_id, c.user_name, 'ifx-com-comment__author', { base: '../account/' })
      : '<strong>' + String(c.user_name).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</strong>';
    return (
      '<div class="ifx-com-comment" data-ifx-com-comment-id="' + c.id + '">' +
        '<div class="ifx-com-comment__head">' +
          nameHtml +
          '<span>' + fmtRelative(c.created_at) + '</span>' +
        '</div>' +
        '<p>' + String(c.body).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
        '<div class="ifx-com-comment__stats">' +
          '<span><i class="ti ti-heart"></i> ' + (c.likes || 0) + '</span>' +
          '<span><i class="ti ti-message"></i> ' + (c.replies || 0) + '</span>' +
          '<span><i class="ti ti-share"></i> ' + (c.shares || 0) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function applyStorySeoExtras(post) {
    applySeoToDocument(post);
    var canonical = (post.seo && post.seo.canonical_url) ||
      (global.IfluxSeoUrl ? IfluxSeoUrl.storyCanonical(post) : location.href.split('#')[0]);
    var communityUrl = global.IfluxSeoUrl
      ? IfluxSeoUrl.PROD_ORIGIN + '/cong-dong'
      : location.href.split('#')[0].replace(/story\.html.*/, 'index.html');
    var breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Cộng đồng', item: communityUrl },
        { '@type': 'ListItem', position: 2, name: (post.tickers && post.tickers[0]) || 'Thị trường',
          item: global.IfluxSeoUrl ? IfluxSeoUrl.stockCanonical((post.tickers && post.tickers[0]) || '') : '' },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical }
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

  function articleHeroImageHtml(post) {
    var seo = post.seo || {};
    if (!seo.og_image) return '';
    return (
      '<figure class="ifx-com-article__figure" itemprop="image" itemscope itemtype="https://schema.org/ImageObject">' +
        '<img src="' + seo.og_image + '" alt="' + (seo.og_image_alt || post.title) + '" itemprop="url" loading="eager" />' +
        (seo.og_image_alt ? '<figcaption itemprop="caption">' + seo.og_image_alt + '</figcaption>' : '') +
      '</figure>'
    );
  }

  function articleGeoFooterHtml(post) {
    var geo = post.geo || {};
    var seo = post.seo || {};
    var parts = [];
    if (geo.language) parts.push('Ngôn ngữ: ' + geo.language);
    if (geo.region || geo.country) parts.push('Khu vực: ' + (geo.region || geo.country));
    if (seo.focus_keyword) parts.push('Từ khóa: ' + seo.focus_keyword);
    if (!parts.length) return '';
    return (
      '<footer class="ifx-com-article__geo">' +
        '<span class="ifx-com-article__geo-label"><i class="ti ti-map-pin"></i> GEO / SEO</span>' +
        '<p>' + parts.join(' · ') + '</p>' +
      '</footer>'
    );
  }

  global.IfluxCommunityUI = {
    fmtDate: fmtDate,
    fmtRelative: fmtRelative,
    fmtPct: fmtPct,
    postCardHtml: postCardHtml,
    featuredPostHtml: featuredPostHtml,
    compactPostHtml: compactPostHtml,
    postTagsHtml: postTagsHtml,
    getPrimaryStory: getPrimaryStory,
    tickerArchiveUrl: tickerArchiveUrl,
    getGroupPerformance: getGroupPerformance,
    getPostStories: getPostStories,
    sidebarStoryRowsHtml: sidebarStoryRowsHtml,
    sidebarSectorRowsHtml: sidebarSectorRowsHtml,
    sidebarEcosystemRowsHtml: sidebarEcosystemRowsHtml,
    sidebarTickerRowsHtml: sidebarTickerRowsHtml,
    sortComments: sortComments,
    commentItemHtml: commentItemHtml,
    applySeoToDocument: applySeoToDocument,
    applyStorySeoExtras: applyStorySeoExtras,
    articleHeroImageHtml: articleHeroImageHtml,
    articleGeoFooterHtml: articleGeoFooterHtml,
    storyOptionsHtml: storyOptionsHtml,
    seoHint: seoHint,
    currentUserId: currentUserId,
    shareUrl: shareUrl,
    tierBadge: tierBadge
  };
})(window);
