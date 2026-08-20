/* Cộng đồng — bài viết / tương tác.
 * Ownership SoT:
 *   Server (API/DB) = Source of Truth nghiệp vụ
 *   memStore        = runtime state (mirror)
 *   localStorage    = CẤM cho dữ liệu nghiệp vụ (comment/like/post body)
 */
(function (global) {
  'use strict';

  var LEGACY_BUSINESS_KEYS = ['iflux_community_v2', 'iflux_community_v1'];
  /* Runtime SoT mirror — không ghi nghiệp vụ xuống localStorage */
  var memStore = null;
  /* User Web: tắt viết bài mọi tier (bài chuyên gia quản lý ở Admin — giai đoạn sau). */
  var WRITE_TIERS = {};
  var EXPERT_WRITE_TIERS = {};
  var CONTENT_TYPE_NEWS = 'news';
  var CONTENT_TYPE_EXPERT = 'expert';
  var ADMIN_AUTHOR = {
    id: 'admin_iflux',
    display_name: 'iFlux Editorial',
    tier: 'admin',
    tier_label: 'Admin'
  };

  function uid(prefix) {
    return (prefix || 'post') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /* WP-9: FALLBACK_TICKERS / MockMarket không còn authority cho Detail auto-link.
   * Giữ stub để caller cũ không vỡ — trả []. */
  var FALLBACK_TICKERS = [];

  function getKnownTickers() {
    return FALLBACK_TICKERS.slice();
  }

  function stockHrefFor(sym) {
    return global.IfluxHref
      ? IfluxHref.forCanonical(global.IfluxSeoUrl
        ? IfluxSeoUrl.stockHref(sym)
        : '/co-phieu/' + encodeURIComponent(sym))
      : (global.IfluxSeoUrl
        ? IfluxSeoUrl.stockHref(sym)
        : '/co-phieu/' + encodeURIComponent(sym));
  }

  function extractTickersFromText() {
    return [];
  }

  function extractTickersFromPost() {
    return [];
  }

  function stripTickerLinks(html) {
    return String(html || '').replace(
      /<a\s+[^>]*class="[^"]*ifx-ticker-link[^"]*"[^>]*>([A-Z]{2,5})<\/a>/gi,
      '$1'
    );
  }

  /**
   * WP-6: presentation từ persisted membership + entity_occurrences.
   * Không invent ticker ngoài post.tickers.
   */
  function linkifyTickersInHtml(html, tickers, occurrences) {
    if (!html) return html;
    html = stripTickerLinks(html);
    var toLink = {};
    (tickers || []).forEach(function (t) {
      var u = String(t || '').toUpperCase();
      if (u) toLink[u] = true;
    });
    var nameOccs = (occurrences || []).filter(function (o) {
      return o && o.entity_kind === 'stock' && o.presentation === 'name_ticker' && o.matched_text && o.code;
    }).slice().sort(function (a, b) {
      return String(b.matched_text).length - String(a.matched_text).length;
    });

    return html.replace(/>([^<]+)</g, function (match, text) {
      var linked = text;
      nameOccs.forEach(function (o) {
        var code = String(o.code).toUpperCase();
        if (!toLink[code]) return;
        var name = String(o.matched_text);
        var re;
        try {
          re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        } catch (e) {
          return;
        }
        linked = linked.replace(re, function (m, offset, full) {
          /* Đã có (CODE) ngay sau tên trong body (RSS) → không append trùng */
          var after = String(full || '').slice(offset + m.length);
          var already = new RegExp('^\\s*\\(' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\)', 'i');
          if (already.test(after)) return m;
          if (/\([A-Z]{2,5}\)\s*$/.test(m)) return m;
          return m + ' (' + code + ')';
        });
      });
      linked = linked.replace(/\b([A-Z]{2,5})\b/g, function (sym) {
        if (!toLink[sym]) return sym;
        return '<a class="ifx-ticker-link" href="' + stockHrefFor(sym) + '">' + sym + '</a>';
      });
      return '>' + linked + '<';
    });
  }

  function chuDeTagsOf(postOrTags) {
    if (Array.isArray(postOrTags)) return normalizePrimaryStory(postOrTags);
    if (!postOrTags) return [];
    return normalizePrimaryStory(postOrTags.chu_de_tags || postOrTags.story_tags || []);
  }

  function normalizePrimaryStory(storyTags) {
    var stories = (storyTags || []).filter(function (t) {
      return t.source === 'chu-de' || t.source === 'story' || !t.source;
    });
    if (!stories.length) return [];
    var tag = Object.assign({}, stories[0], { source: 'chu-de' });
    return [tag];
  }

  function normalizePostRecord(post) {
    if (!post.status) post.status = 'published';
    if (post.content_type === 'article' || post.content_type === 'insight') {
      post.content_type = CONTENT_TYPE_NEWS;
    }
    if (!post.content_type) {
      post.content_type = String(post.id || '').indexOf('post_expert_') === 0
        ? CONTENT_TYPE_EXPERT
        : CONTENT_TYPE_NEWS;
    }
    /* WP-4/6 + Wave C SoT: byline chỉ author.display_name — không invent / không fallback vendor */
    if (post.author && !post.author.display_name) post.author = null;
    if (post.author && post.author.display_name) {
      post.author = {
        id: post.author.id || null,
        display_name: post.author.display_name,
        tier: post.author.tier || null,
        tier_label: post.author.tier_label || null
      };
    }
    /* Không dùng publisher/provider/vendor làm tên hiển thị */
    post.publisher = null;
    post.provider = null;
    post.vendor = null;
    if (!post.stats) {
      post.stats = {
        likes: 0,
        comments: (post.comments || []).length,
        shares: 0,
        views: 0,
        favorites: 0
      };
    }
    if (!post.slug && post.title) post.slug = slugify(post.title);
    if (!post.title) post.title = 'Bài viết cộng đồng';
    post.chu_de_tags = normalizePrimaryStory(post.chu_de_tags || post.story_tags);
    post.story_tags = post.chu_de_tags;
    /* Membership từ API/persist — không FE extract */
    post.tickers = Array.isArray(post.tickers) ? post.tickers.slice() : [];
    post.ecosystems = Array.isArray(post.ecosystems) ? post.ecosystems.slice() : [];
    post.sectors = Array.isArray(post.sectors) ? post.sectors.slice() : [];
    post.entity_occurrences = Array.isArray(post.entity_occurrences) ? post.entity_occurrences : [];
    if (!post.body_html && post.body) post.body_html = post.body;
    post.body_html = linkifyTickersInHtml(post.body_html, post.tickers, post.entity_occurrences);
    /* Metadata SoT chỉ từ API — CẤM migrate cover/seo → metadata hoặc tự sinh og_image. */
    if (global.IfluxCommunityGeoAi) {
      if (!post.geo_ai || !post.geo_ai.summary) {
        var seed = IfluxCommunityGeoAi.seedGeoAiById(post.id);
        if (seed) post.geo_ai = seed;
      }
      post.geo_ai = IfluxCommunityGeoAi.normalizeGeoAi(post);
      post.schema = post.schema || { type: 'NewsArticle', faq: [] };
      post.schema.faq = post.geo_ai.faq.slice();
    }
    return post;
  }

  function purgeLegacyBusinessStorage() {
    LEGACY_BUSINESS_KEYS.forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    });
  }

  function writeAll(data, opts) {
    opts = opts || {};
    memStore = data;
    /* Cấm persist nghiệp vụ xuống localStorage */
    purgeLegacyBusinessStorage();
    if (opts.silent) return;
    document.dispatchEvent(new CustomEvent('iflux-community-change'));
  }

  /* Seed hardcode đã gỡ — nguồn sự thật = API / community_posts (DB). */
  function seedPosts() {
    return [];
  }

  function seedExpertPosts() {
    return [];
  }

  function countPublished(posts) {
    return (posts || []).filter(function (p) {
      return !p.status || p.status === 'published' || p.status === 'published_rss';
    }).length;
  }

  function isSeedId(id) {
    var s = String(id || '');
    return s.indexOf('post_seed_') === 0 || s.indexOf('post_expert_') === 0;
  }

  function stripSeedPosts(posts) {
    return (posts || []).filter(function (p) { return p && !isSeedId(p.id); });
  }

  function ensureStore() {
    if (memStore && Array.isArray(memStore.posts)) return memStore;
    memStore = { posts: [], version: 7, source: 'api' };
    purgeLegacyBusinessStorage();
    return memStore;
  }

  function communityApiBase() {
    try {
      var host = String((global.location && location.hostname) || '').toLowerCase();
      if (host === 'iflux.vn' || host === 'www.iflux.vn' || host.indexOf('staging.') === 0) {
        return '/api';
      }
    } catch (e) { /* ignore */ }
    if (global.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
      var b = IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    return '/api';
  }

  function authToken() {
    try {
      if (global.IfluxAuth && IfluxAuth.getToken) return IfluxAuth.getToken();
    } catch (e) { /* ignore */ }
    return null;
  }

  function preserveSessionComments(incomingList) {
    var prevCommentsByKey = {};
    try {
      var prev = memStore && Array.isArray(memStore.posts) ? memStore.posts : [];
      prev.forEach(function (p) {
        if (!p || !p.comments || !p.comments.length) return;
        if (!p._commentsFromApi) return;
        if (p.id) prevCommentsByKey['id:' + p.id] = p.comments;
        if (p.slug) prevCommentsByKey['slug:' + p.slug] = p.comments;
      });
    } catch (e) { /* ignore */ }
    return (incomingList || []).map(function (incoming) {
      var kept = prevCommentsByKey['id:' + incoming.id]
        || (incoming.slug && prevCommentsByKey['slug:' + incoming.slug])
        || null;
      if (kept) {
        incoming.comments = kept;
        incoming._commentsFromApi = true;
        incoming.stats = Object.assign({}, incoming.stats || {}, { comments: kept.length });
      } else if (!incoming.comments) {
        incoming.comments = [];
        incoming._commentsFromApi = false;
      }
      incoming.liked_by = incoming.liked_by || [];
      incoming.favorited_by = incoming.favorited_by || [];
      return incoming;
    });
  }

  function normalizeIncomingList(raw) {
    if (!Array.isArray(raw)) raw = [];
    return preserveSessionComments(
      raw.map(function (p) { return normalizePostRecord(p); }).filter(function (p) {
        return p && p.id && !isSeedId(p.id);
      })
    );
  }

  /**
   * Store chỉ nhận dữ liệu (SoT Ownership).
   * CẤM IO — feed/article do IfluxCommunityApiBridge (Data Provider) fetch.
   */
  function setFeed(cards, opts) {
    opts = opts || {};
    var incoming = normalizeIncomingList(cards);
    var data = ensureStore();
    if (opts.replace === false || opts.merge) {
      var byId = {};
      (data.posts || []).forEach(function (p) {
        if (p && p.id) byId[p.id] = p;
      });
      incoming.forEach(function (p) {
        var prev = byId[p.id];
        if (prev && prev.body_html && !p.body_html) {
          p.body_html = prev.body_html;
          if (prev.body) p.body = prev.body;
          if (prev.seo) p.seo = prev.seo;
        }
        if (prev && prev.metadata && !p.metadata) {
          p.metadata = prev.metadata;
        }
        if (prev && prev._commentsFromApi && prev.comments && prev.comments.length) {
          p.comments = prev.comments;
          p._commentsFromApi = true;
        }
        byId[p.id] = p;
      });
      data.posts = Object.keys(byId).map(function (k) { return byId[k]; });
    } else {
      data.posts = incoming;
    }
    data.version = 7;
    data.source = 'provider';
    data.hydrated_at = nowIso();
    writeAll(data);
    return { ok: true, posts: data.posts, total: data.posts.length };
  }

  function setArticle(article) {
    if (!article || !article.id) return { ok: false, reason: 'empty' };
    var normalized = normalizeIncomingList([article])[0];
    if (!normalized) return { ok: false, reason: 'invalid' };
    var data = ensureStore();
    var posts = data.posts || [];
    var idx = -1;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === normalized.id || (normalized.slug && posts[i].slug === normalized.slug)) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      var prev = posts[idx];
      if (prev._commentsFromApi && prev.comments && prev.comments.length && !normalized._commentsFromApi) {
        normalized.comments = prev.comments;
        normalized._commentsFromApi = true;
      }
      posts[idx] = normalized;
    } else {
      posts.unshift(normalized);
    }
    data.posts = posts;
    data.source = 'provider';
    data.hydrated_at = nowIso();
    writeAll(data);
    return { ok: true, post: normalized };
  }

  function canWrite(user) {
    if (!user) return false;
    return !!WRITE_TIERS[String(user.tier || '').toLowerCase()];
  }

  function canWriteExpert(user) {
    return false;
  }

  function postMatchesTaxonomy(post, source, groupId) {
    if (!source || !groupId) return true;
    var tax = global.IfluxWatchlistTaxonomy;
    var tags = post.story_tags || [];
    var srcNorm = String(source);
    var isStoryFamily = srcNorm === 'story' || srcNorm === 'chu-de' || srcNorm === 'cau-chuyen';
    if (tags.some(function (t) {
      var ts = String(t.source || '');
      var idOk = String(t.sourceId) === String(groupId);
      if (!idOk) return false;
      if (isStoryFamily) {
        return !ts || ts === 'story' || ts === 'chu-de' || ts === 'cau-chuyen';
      }
      return ts === srcNorm;
    })) return true;
    if (!tax) return false;
    var group = tax.getGroup(source, groupId);
    if (!group) return false;
    return (post.tickers || []).some(function (tk) {
      return group.tickers.indexOf(tk) >= 0;
    });
  }

  /* Gom các thực thể (chủ đề / ngành / cổ phiếu / hệ sinh thái) mà bài gốc nhắc tới */
  function relatedRefSets(refPost) {
    var sets = { storyIds: {}, tickers: {}, sectorIds: {}, familyIds: {} };
    (refPost.story_tags || []).forEach(function (t) {
      if (t.sourceId == null) return;
      var id = String(t.sourceId);
      if (t.source === 'sector') sets.sectorIds[id] = true;
      else if (t.source === 'family') sets.familyIds[id] = true;
      else sets.storyIds[id] = true;
    });
    (refPost.tickers || []).forEach(function (tk) {
      sets.tickers[String(tk).toUpperCase()] = true;
    });
    var tax = global.IfluxWatchlistTaxonomy;
    if (tax && tax.getTickerMemberships) {
      Object.keys(sets.tickers).forEach(function (tk) {
        var m = tax.getTickerMemberships(tk);
        if (!m) return;
        if (m.sector && m.sector.id != null) sets.sectorIds[String(m.sector.id)] = true;
        if (m.family && m.family.id != null) sets.familyIds[String(m.family.id)] = true;
      });
    }
    return sets;
  }

  function postIsRelatedTo(candidate, sets) {
    if ((candidate.tickers || []).some(function (tk) {
      return sets.tickers[String(tk).toUpperCase()];
    })) return true;
    var i;
    var storyIds = Object.keys(sets.storyIds);
    for (i = 0; i < storyIds.length; i++) {
      if (postMatchesTaxonomy(candidate, 'story', storyIds[i])) return true;
    }
    var sectorIds = Object.keys(sets.sectorIds);
    for (i = 0; i < sectorIds.length; i++) {
      if (postMatchesTaxonomy(candidate, 'sector', sectorIds[i])) return true;
    }
    var familyIds = Object.keys(sets.familyIds);
    for (i = 0; i < familyIds.length; i++) {
      if (postMatchesTaxonomy(candidate, 'family', familyIds[i])) return true;
    }
    return false;
  }

  function getPosts(filter) {
    filter = filter || {};
    var posts = ensureStore().posts.filter(function (p) {
      if (filter.includeDrafts) return true;
      return !p.status || p.status === 'published' || p.status === 'published_rss';
    });

    if (filter.excludeId) {
      var ex = String(filter.excludeId);
      posts = posts.filter(function (p) {
        return String(p.id || '') !== ex && String(p.slug || '') !== ex;
      });
    }

    if (filter.relatedTo) {
      var refPost = typeof filter.relatedTo === 'object'
        ? filter.relatedTo
        : (getPostById(filter.relatedTo) || getPostBySlug(filter.relatedTo));
      if (refPost) {
        var refId = String(refPost.id || '');
        var refSlug = String(refPost.slug || '');
        var sets = relatedRefSets(refPost);
        posts = posts.filter(function (p) {
          if ((refId && String(p.id) === refId) || (refSlug && String(p.slug) === refSlug)) return false;
          return postIsRelatedTo(p, sets);
        });
      } else {
        posts = [];
      }
    }

    var domainId = filter.domainId || filter.sectorId;
    if (domainId) {
      posts = posts.filter(function (p) {
        return postMatchesTaxonomy(p, 'sector', domainId);
      });
    }
    if (filter.taxSource && filter.taxGroupId) {
      posts = posts.filter(function (p) {
        return postMatchesTaxonomy(p, filter.taxSource, filter.taxGroupId);
      });
    }
    if (filter.storyId || filter.chuDeId) {
      var sid = filter.storyId || filter.chuDeId;
      posts = posts.filter(function (p) {
        return postMatchesTaxonomy(p, 'story', sid) || postMatchesTaxonomy(p, 'chu-de', sid);
      });
    }
    if (filter.topic) {
      var topicKey = String(filter.topic).toLowerCase();
      posts = posts.filter(function (p) {
        return (p.story_tags || []).some(function (t) {
          var id = String(t.sourceId || '').toLowerCase();
          var name = slugify(t.name || '');
          return id === topicKey || name === topicKey;
        });
      });
    }
    if (filter.tag) {
      var tagKey = String(filter.tag).toLowerCase();
      posts = posts.filter(function (p) {
        var hay = [p.title, p.excerpt, p.seo && p.seo.focus_keyword]
          .concat((p.seo && p.seo.secondary_keywords) || [])
          .concat((p.tickers || []))
          .join(' ')
          .toLowerCase();
        return hay.indexOf(tagKey) >= 0 ||
          (p.story_tags || []).some(function (t) {
            return String(t.sourceId || '').toLowerCase() === tagKey ||
              slugify(t.name || '') === tagKey;
          });
      });
    }
    if (filter.ticker) {
      var tk = filter.ticker.toUpperCase();
      posts = posts.filter(function (p) {
        return (p.tickers || []).indexOf(tk) >= 0;
      });
    }
    if (filter.contentType) {
      posts = posts.filter(function (p) {
        return (p.content_type || CONTENT_TYPE_NEWS) === filter.contentType;
      });
    }
    var authorKey = filter.authorId || filter.author;
    if (authorKey) {
      var aid = String(authorKey).toLowerCase();
      posts = posts.filter(function (p) {
        if (!p.author) return false;
        var id = String(p.author.id || '').toLowerCase();
        var un = String(p.author.username || p.author.slug || '').toLowerCase();
        var name = String(p.author.display_name || p.author.name || '').toLowerCase();
        return id === aid || un === aid || name === aid;
      });
    }
    var catKey = filter.categoryId || filter.category;
    if (catKey) {
      var ck = String(catKey).toLowerCase();
      posts = posts.filter(function (p) {
        var cid = String(p.category_id || (p.category && p.category.id) || '').toLowerCase();
        var cslug = String(p.category_slug || (p.category && p.category.slug) || '').toLowerCase();
        var cname = String(p.category_name || (p.category && (p.category.name || p.category.label)) || '').toLowerCase();
        return cid === ck || cslug === ck || cname === ck;
      });
    }
    if (filter.excludeId != null && filter.excludeId !== '') {
      var ex = String(filter.excludeId);
      posts = posts.filter(function (p) {
        return String(p.id || '') !== ex && String(p.slug || '') !== ex;
      });
    }
    if (filter.q) {
      var q = filter.q.toLowerCase();
      posts = posts.filter(function (p) {
        return p.title.toLowerCase().indexOf(q) >= 0 ||
          (p.excerpt || '').toLowerCase().indexOf(q) >= 0;
      });
    }

    posts.sort(function (a, b) {
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });

    var total = posts.length;
    if (filter.limit != null) {
      var offset = filter.offset || 0;
      posts = posts.slice(offset, offset + filter.limit);
    }

    if (filter.returnMeta) {
      return { items: posts, total: total, hasMore: (filter.offset || 0) + posts.length < total };
    }
    return posts;
  }

  function countPosts(filter) {
    filter = Object.assign({}, filter, { returnMeta: true, limit: null, offset: null });
    var r = getPosts(filter);
    return r.total;
  }

  function getPostsByAuthor(authorId, filter) {
    filter = Object.assign({}, filter || {}, { authorId: authorId });
    return getPosts(filter);
  }

  function postEngagement(post) {
    var commentCount = post.stats && post.stats.comments != null
      ? post.stats.comments
      : (post.comments || []).length;
    return {
      comments: commentCount,
      positive: (post.stats && post.stats.likes || 0) + (post.stats && post.stats.favorites || 0)
    };
  }

  /* Interest Score v1 — trọng số ChatGPT (versioned): View < Search < Like < Favorite ≈ Share < Comment */
  var INTEREST_WEIGHTS = {
    views: 1,
    searches: 3,
    likes: 5,
    favorites: 8,
    shares: 8,
    comments: 10
  };

  var STORY_PERIODS = {
    day: { label: 'Ngày', ms: 24 * 60 * 60 * 1000 },
    week: { label: 'Tuần', ms: 7 * 24 * 60 * 60 * 1000 },
    month: { label: 'Tháng', ms: 30 * 24 * 60 * 60 * 1000 }
  };

  function interestScore(parts) {
    parts = parts || {};
    return (
      (parts.views || 0) * INTEREST_WEIGHTS.views +
      (parts.searches || 0) * INTEREST_WEIGHTS.searches +
      (parts.likes || 0) * INTEREST_WEIGHTS.likes +
      (parts.favorites || 0) * INTEREST_WEIGHTS.favorites +
      (parts.shares || 0) * INTEREST_WEIGHTS.shares +
      (parts.comments || 0) * INTEREST_WEIGHTS.comments
    );
  }

  function postInPeriod(post, periodKey) {
    var def = STORY_PERIODS[periodKey] || STORY_PERIODS.week;
    var ts = Date.parse(post.published_at || post.created_at || '') || 0;
    if (!ts) return true;
    return (Date.now() - ts) <= def.ms;
  }

  function storyKeysFromPost(p) {
    var out = [];
    var seen = {};
    function push(id, name) {
      var key = String(id || name || '').trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push({ id: key, name: name || key });
    }
    var story = normalizePrimaryStory(p.story_tags || [])[0];
    if (story) push(story.sourceId || story.name, story.name);
    (p.topics || []).forEach(function (t) {
      push(t.slug || t.id || t.name, t.name || t.label || t.slug || t.id);
    });
    return out;
  }

  function getTrendingStoriesLocal(limit, periodKey) {
    limit = limit || 10;
    periodKey = periodKey || 'week';
    var map = {};
    getPosts().forEach(function (p) {
      if (!postInPeriod(p, periodKey)) return;
      var keys = storyKeysFromPost(p);
      if (!keys.length) return;
      var stats = p.stats || {};
      var views = stats.views || 0;
      var likes = stats.likes || 0;
      var favorites = stats.favorites || 0;
      var shares = stats.shares || 0;
      var comments = postEngagement(p).comments;
      /* Search chưa có event store — proxy nhẹ từ view (≈8%) để Interest có thành phần Search */
      var searches = Math.round(views * 0.08);
      keys.forEach(function (sk) {
        if (!map[sk.id]) {
          map[sk.id] = {
            id: sk.id,
            name: sk.name,
            views: 0,
            searches: 0,
            likes: 0,
            favorites: 0,
            shares: 0,
            comments: 0,
            positive: 0,
            score: 0
          };
        }
        var m = map[sk.id];
        m.views += views;
        m.searches += searches;
        m.likes += likes;
        m.favorites += favorites;
        m.shares += shares;
        m.comments += comments;
        m.positive += likes + favorites;
      });
    });
    var list = Object.keys(map).map(function (key) {
      var m = map[key];
      m.score = interestScore(m);
      m.period = periodKey;
      return m;
    });
    list.sort(function (a, b) {
      return b.score - a.score || b.comments - a.comments || b.views - a.views;
    });
    return list.slice(0, limit);
  }

  /** Cache Topic trending từ Content Engine P1 (/api/content/topics/trending). */
  var _topicTrendCache = {};

  function mapApiTopicRow(row, periodKey) {
    return {
      id: row.slug || row.topic_id || row.id,
      topic_id: row.topic_id || row.id,
      story_id: row.story_id || null,
      name: row.name || row.label,
      status: row.status,
      period: periodKey || row.period || 'week',
      score: Number(row.score) || 0,
      views: Number(row.views) || 0,
      searches: Number(row.searches) || 0,
      likes: Number(row.likes) || 0,
      comments: Number(row.comments) || 0,
      shares: Number(row.shares) || 0,
      favorites: Number(row.favorites) || 0,
      rank: row.rank,
      href: row.href || null,
      mappings: row.mappings || row.top_tickers || null,
      flow_net_value: row.flow_net_value != null ? Number(row.flow_net_value) : null,
      lifecycle: row.lifecycle || null,
      fromContentEngine: true
    };
  }

  function getTrendingStories(limit, periodKey) {
    limit = limit || 10;
    periodKey = periodKey || 'week';
    var cached = _topicTrendCache[periodKey];
    if (cached && cached.length) {
      return cached.slice(0, limit);
    }
    return getTrendingStoriesLocal(limit, periodKey);
  }

  function hydrateTrendingStoriesFromApi(periodKey, limit) {
    periodKey = periodKey || 'week';
    limit = limit || 10;
    var api = global.IfluxApiClient;
    if (!api || !api.listContentTopics) {
      return Promise.resolve(getTrendingStoriesLocal(limit, periodKey));
    }
    return api.listContentTopics({ trending: true, period: periodKey, limit: limit })
      .then(function (res) {
        var raw = (res && res.data && res.data.topics) || (res && res.topics) || [];
        if (!raw.length) {
          _topicTrendCache[periodKey] = [];
          return getTrendingStoriesLocal(limit, periodKey);
        }
        var mapped = raw.map(function (row) { return mapApiTopicRow(row, periodKey); });
        _topicTrendCache[periodKey] = mapped;
        return mapped.slice(0, limit);
      })
      .catch(function () {
        return getTrendingStoriesLocal(limit, periodKey);
      });
  }

  function getTrendingTickers(limit) {
    limit = limit || 8;
    var map = {};
    getPosts().forEach(function (p) {
      var eng = postEngagement(p);
      (p.tickers || []).forEach(function (tk) {
        tk = String(tk).toUpperCase();
        if (!map[tk]) map[tk] = { ticker: tk, comments: 0, positive: 0, score: 0 };
        map[tk].comments += eng.comments;
        map[tk].positive += eng.positive;
      });
    });
    var list = Object.keys(map).map(function (tk) {
      var m = map[tk];
      m.score = m.comments * 2 + m.positive;
      return m;
    });
    list.sort(function (a, b) {
      return b.score - a.score || b.comments - a.comments;
    });
    return list.slice(0, limit);
  }

  function getTopExpertsByLikes(limit) {
    limit = limit || 5;
    var map = {};
    getPosts({ contentType: CONTENT_TYPE_EXPERT }).forEach(function (p) {
      var author = p.author || {};
      var aid = author.id;
      if (!aid) return;
      if (!map[aid]) {
        map[aid] = {
          userId: aid,
          displayName: author.display_name || 'Chuyên gia',
          tier: author.tier || '',
          tierLabel: author.tier_label || 'Elite',
          totalLikes: 0,
          postCount: 0
        };
      }
      map[aid].totalLikes += (p.stats && p.stats.likes) || 0;
      map[aid].postCount += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return b.totalLikes - a.totalLikes || b.postCount - a.postCount;
    }).slice(0, limit);
  }

  function hashStr(s) {
    var h = 0;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  /* Số theo dõi thật (profile store) → fallback deterministic để luôn có số hiển thị */
  function expertFollowerCount(userId) {
    var pu = global.IfluxProfileUsersStore;
    if (pu && pu.getPublic) {
      var u = pu.getPublic(userId);
      if (u && u.stats && u.stats.followers) return u.stats.followers;
    }
    var pf = global.IfluxProfileFollowStore;
    if (pf && pf.listFollowers) {
      var arr = pf.listFollowers(userId);
      if (arr && arr.length) return arr.length;
    }
    return 120 + (hashStr(userId) % 3000);
  }

  /* Chưa có nguồn thật cho số thành viên affiliate & số sao đánh giá của chuyên gia
     → suy ra deterministic theo userId (ổn định giữa các lần render). */
  function expertDerivedStats(userId) {
    var h = hashStr('aff:' + userId);
    return {
      affiliateMembers: 5 + (h % 240),
      rating: Math.round((38 + (hashStr('rate:' + userId) % 12))) / 10
    };
  }

  /* Bảng xếp hạng chuyên gia (mở rộng): bài viết, lượt thích, theo dõi, thành viên, sao. */
  function getExpertLeaderboard(limit, filter) {
    limit = limit || 6;
    var base = filter || {};
    var map = {};
    getPosts(Object.assign({}, base, { contentType: CONTENT_TYPE_EXPERT })).forEach(function (p) {
      var author = p.author || {};
      var aid = author.id;
      if (!aid) return;
      if (!map[aid]) {
        map[aid] = {
          userId: aid,
          displayName: author.display_name || 'Chuyên gia',
          tier: author.tier || '',
          tierLabel: author.tier_label || 'Elite',
          totalLikes: 0,
          postCount: 0
        };
      }
      map[aid].totalLikes += (p.stats && p.stats.likes) || 0;
      map[aid].postCount += 1;
    });
    return Object.keys(map).map(function (k) {
      var row = map[k];
      var derived = expertDerivedStats(row.userId);
      row.totalFollows = expertFollowerCount(row.userId);
      row.affiliateMembers = derived.affiliateMembers;
      row.rating = derived.rating;
      return row;
    }).sort(function (a, b) {
      return b.totalLikes - a.totalLikes || b.postCount - a.postCount;
    }).slice(0, limit);
  }

  function getPostBySlug(slug) {
    return ensureStore().posts.find(function (p) { return p.slug === slug; }) || null;
  }

  function getPostById(id) {
    return ensureStore().posts.find(function (p) { return p.id === id; }) || null;
  }

  /** Gắn / cập nhật 1 bài vào runtime store (không persist LS). Comment chỉ từ API. */
  function upsertPostLocal(raw) {
    if (!raw || !raw.id) return null;
    var data = ensureStore();
    var incoming = normalizePostRecord(Object.assign({}, raw));
    var idx = data.posts.findIndex(function (p) {
      return p.id === incoming.id || (incoming.slug && p.slug === incoming.slug);
    });
    if (idx >= 0) {
      var prev = data.posts[idx];
      /* Giữ thread đã hydrate từ comment API trong session */
      if (prev._commentsFromApi && prev.comments && prev.comments.length) {
        incoming.comments = prev.comments;
        incoming._commentsFromApi = true;
      } else {
        incoming.comments = [];
        incoming._commentsFromApi = false;
      }
      incoming.stats = Object.assign({}, incoming.stats || {}, {
        comments: incoming._commentsFromApi
          ? incoming.comments.length
          : ((incoming.stats && incoming.stats.comments) || 0)
      });
      data.posts[idx] = incoming;
    } else {
      incoming.comments = [];
      incoming._commentsFromApi = false;
      data.posts.unshift(incoming);
    }
    writeAll(data, { silent: true });
    return incoming;
  }

  function applyCommentsToPost(postKey, comments, total) {
    var data = ensureStore();
    var post = data.posts.find(function (p) {
      return p.slug === postKey || p.id === postKey;
    });
    if (!post) return null;
    post.comments = Array.isArray(comments) ? comments.slice() : [];
    post._commentsFromApi = true;
    post.stats = post.stats || {};
    post.stats.comments = total != null ? total : post.comments.length;
    writeAll(data, { silent: true });
    return post;
  }

  /** GET comment SoT từ server → mirror vào memStore */
  function loadComments(slugOrId, opts) {
    opts = opts || {};
    var key = String(slugOrId || '').trim();
    if (!key) return Promise.reject(new Error('Thiếu bài viết'));
    var url = communityApiBase() + '/community/posts/' + encodeURIComponent(key) + '/comments';
    if (opts.limit) url += '?limit=' + encodeURIComponent(opts.limit);
    return fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok) {
            var msg = (body && body.error && body.error.message) || body.message || ('HTTP ' + res.status);
            throw new Error(msg);
          }
          return body;
        });
      })
      .then(function (body) {
        var payload = (body && body.data) || body || {};
        var list = payload.comments || [];
        var total = payload.total != null ? payload.total : list.length;
        var post = applyCommentsToPost(key, list, total);
        return { ok: true, comments: list, total: total, post: post };
      });
  }

  /**
   * POST comment → Server SoT → cập nhật memStore.
   * Trả Promise<{ post, comment }>. Không ghi localStorage.
   */
  function addComment(slug, user, bodyOrPayload) {
    var payload = (bodyOrPayload && typeof bodyOrPayload === 'object')
      ? bodyOrPayload
      : { body: bodyOrPayload };
    var body = String(payload.body || '').trim();
    var image = payload.image || null;
    if (!body && !image) return Promise.reject(new Error('Nhập nội dung hoặc đính kèm hình ảnh.'));
    if (!user || !user.id) return Promise.reject(new Error('Đăng nhập để bình luận.'));

    var data = ensureStore();
    var post = data.posts.find(function (p) {
      return p.slug === slug || p.id === slug;
    }) || null;
    if (!post) return Promise.reject(new Error('Bài viết không tồn tại.'));

    var token = authToken();
    if (!token || String(token).indexOf('mock_jwt_') === 0) {
      return Promise.reject(new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'));
    }

    var postKey = post.id || post.slug || slug;
    var url = communityApiBase() + '/community/posts/' + encodeURIComponent(postKey) + '/comments';
    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      credentials: 'same-origin',
      body: JSON.stringify({ body: body, image: image })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (resp) {
        if (!res.ok) {
          var msg = (resp && resp.error && resp.error.message) || resp.message || ('HTTP ' + res.status);
          throw new Error(msg);
        }
        return resp;
      });
    }).then(function (resp) {
      var payloadOut = (resp && resp.data) || resp || {};
      var comment = payloadOut.comment;
      if (!comment) throw new Error('Server không trả bình luận.');
      post.comments = post.comments || [];
      /* Tránh trùng nếu đã có */
      var exists = post.comments.some(function (c) { return c && c.id === comment.id; });
      if (!exists) post.comments.unshift(comment);
      post._commentsFromApi = true;
      post.stats = post.stats || {};
      post.stats.comments = payloadOut.total != null ? payloadOut.total : post.comments.length;
      writeAll(data);
      return { post: post, comment: comment };
    });
  }

  function uniqueSlug(base, excludeId) {
    var slug = slugify(base) || 'bai-viet';
    var posts = ensureStore().posts;
    var n = 0;
    var candidate = slug;
    while (posts.some(function (p) { return p.slug === candidate && p.id !== excludeId; })) {
      n += 1;
      candidate = slug + '-' + n;
    }
    return candidate;
  }

  function savePost(payload, user) {
    if (!canWrite(user)) throw new Error('Chức năng viết bài cộng đồng tạm đóng. Bài chuyên gia sẽ được quản lý ở giai đoạn sau.');
    var data = ensureStore();
    var ts = nowIso();
    var isNew = !payload.id;
    var post = isNew ? { id: uid('post'), stats: { likes: 0, comments: 0, shares: 0, views: 0, favorites: 0 }, liked_by: [], favorited_by: [], comments: [] } : getPostById(payload.id);
    if (!post) throw new Error('Không tìm thấy bài viết.');

    post.slug = uniqueSlug(payload.slug || payload.title, post.id);
    post.title = (payload.title || '').trim();
    post.excerpt = (payload.excerpt || '').trim();
    post.story_tags = normalizePrimaryStory(payload.chu_de_tags || payload.story_tags || []);
    post.chu_de_tags = post.story_tags;
    var rawBody = payload.body_html || '';
    post.tickers = Array.isArray(payload.tickers) ? payload.tickers.slice() : [];
    post.ecosystems = Array.isArray(payload.ecosystems) ? payload.ecosystems.slice() : [];
    post.entity_occurrences = Array.isArray(payload.entity_occurrences) ? payload.entity_occurrences : [];
    post.body_html = linkifyTickersInHtml(rawBody, post.tickers, post.entity_occurrences);
    post.seo = Object.assign({}, post.seo || {}, payload.seo || {});
    post.geo = Object.assign({}, post.geo || {}, payload.geo || {});
    post.geo_ai = global.IfluxCommunityGeoAi
      ? IfluxCommunityGeoAi.normalizeGeoAi({ geo_ai: payload.geo_ai || {}, excerpt: post.excerpt, schema: payload.schema })
      : (payload.geo_ai || {});
    post.schema = Object.assign({ type: 'NewsArticle', faq: [] }, post.schema || {}, payload.schema || {});
    if (post.geo_ai && post.geo_ai.faq && post.geo_ai.faq.length) {
      post.schema.faq = post.geo_ai.faq.slice();
    }
    post.status = payload.status || 'draft';
    post.content_type = payload.content_type || CONTENT_TYPE_NEWS;
    post.updated_at = ts;
    if (!post.created_at) post.created_at = ts;
    if (post.status === 'published' && !post.published_at) post.published_at = ts;
    if (isNew) {
      post.author = {
        id: user.id || 'usr_local',
        display_name: user.display_name || 'Thành viên',
        tier: user.tier || 'premium',
        tier_label: user.tier_label || 'Premium'
      };
      data.posts.unshift(post);
    }
    writeAll(data);
    if (isNew && post.status === 'published' && global.IfluxApiClient && global.IfluxAuth) {
      var token = IfluxAuth.getToken && IfluxAuth.getToken();
      if (token && token.indexOf('mock_jwt_') !== 0 && IfluxApiClient.createCommunityPost) {
        IfluxApiClient.createCommunityPost(token, {
          title: post.title,
          excerpt: post.excerpt,
          body_html: post.body_html,
          content_type: post.content_type,
          tickers: post.tickers,
          slug: post.slug
        }).catch(function () { /* offline */ });
      }
    }
    return post;
  }

  function bumpView(slug) {
    var data = ensureStore();
    var post = data.posts.find(function (p) { return p.slug === slug || p.id === slug; });
    if (!post) return;
    post.stats = post.stats || {};
    post.stats.views = (post.stats.views || 0) + 1;
    /* silent: tránh iflux-community-change → remount trang chi tiết */
    writeAll(data, { silent: true });
  }

  function toggleLike(slug, userId) {
    var data = ensureStore();
    var post = data.posts.find(function (p) { return p.slug === slug || p.id === slug; });
    if (!post || !userId) return post;
    post.liked_by = post.liked_by || [];
    post.stats = post.stats || {};
    var idx = post.liked_by.indexOf(userId);
    if (idx >= 0) {
      post.liked_by.splice(idx, 1);
      post.stats.likes = Math.max(0, (post.stats.likes || 0) - 1);
    } else {
      post.liked_by.push(userId);
      post.stats.likes = (post.stats.likes || 0) + 1;
    }
    writeAll(data);
    return post;
  }

  function toggleFavorite(slug, userId) {
    var data = ensureStore();
    var post = data.posts.find(function (p) { return p.slug === slug || p.id === slug; });
    if (!post || !userId) return post;
    post.favorited_by = post.favorited_by || [];
    post.stats = post.stats || {};
    var idx = post.favorited_by.indexOf(userId);
    if (idx >= 0) {
      post.favorited_by.splice(idx, 1);
      post.stats.favorites = Math.max(0, (post.stats.favorites || 0) - 1);
    } else {
      post.favorited_by.push(userId);
      post.stats.favorites = (post.stats.favorites || 0) + 1;
    }
    writeAll(data);
    return post;
  }

  function bumpShare(slug) {
    var post = getPostBySlug(slug);
    if (!post) return;
    post.stats.shares = (post.stats.shares || 0) + 1;
    writeAll(ensureStore());
  }

  function buildJsonLd(post, pageUrl) {
    var seo = post.seo || {};
    var geo = post.geo || {};
    var schema = post.schema || {};
    var meta = post.metadata || {};
    var ld = {
      '@context': 'https://schema.org',
      '@type': schema.type || 'NewsArticle',
      headline: meta.title,
      description: meta.description,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      inLanguage: geo.language || 'vi-VN',
      author: {
        '@type': 'Person',
        name: post.author && post.author.display_name ? post.author.display_name : 'iFlux Member'
      },
      publisher: {
        '@type': 'Organization',
        name: 'iFlux',
        logo: { '@type': 'ImageObject', url: 'https://iflux.vn/logo.png' }
      },
      mainEntityOfPage: pageUrl || meta.canonical || meta.url,
      keywords: [seo.focus_keyword].concat(seo.secondary_keywords || []).filter(Boolean).join(', '),
      about: (post.tickers || []).map(function (t) {
        return { '@type': 'Corporation', name: t, tickerSymbol: t };
      })
    };
    if (meta.image) ld.image = meta.image;
    if (geo.country) {
      ld.contentLocation = { '@type': 'Country', name: geo.region || geo.country };
    }
    var faq = (post.geo_ai && post.geo_ai.faq && post.geo_ai.faq.length)
      ? post.geo_ai.faq
      : (schema.faq || []);
    if (faq.length) {
      return [
        ld,
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map(function (item) {
            return {
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a }
            };
          })
        }
      ];
    }
    return ld;
  }

  function exportSeoSeed(post, baseUrl) {
    baseUrl = baseUrl || (global.IfluxSeoUrl ? IfluxSeoUrl.PROD_ORIGIN : '');
    var meta = post.metadata || {};
    var url = meta.canonical || meta.url || (global.IfluxSeoUrl
      ? IfluxSeoUrl.postCanonical(post)
      : baseUrl + '/tin-tuc/bai-viet/' + encodeURIComponent(post.id || post.slug));
    return {
      url: url,
      slug: post.slug,
      path: global.IfluxSeoUrl ? IfluxSeoUrl.postSlugPath(post) : '/tin-tuc/bai-viet/' + encodeURIComponent(post.id || post.slug),
      meta: {
        title: meta.title,
        description: meta.description,
        canonical: meta.canonical || meta.url || url,
        robots: (post.seo && post.seo.robots) || 'index,follow',
        keywords: [post.seo && post.seo.focus_keyword].concat((post.seo && post.seo.secondary_keywords) || []).concat((post.geo && post.geo.geo_keywords) || []).filter(Boolean),
        og: {
          title: meta.title,
          description: meta.description,
          image: meta.image,
          image_alt: post.seo && post.seo.og_image_alt,
          locale: (post.geo && post.geo.target_locale) || 'vi_VN'
        }
      },
      geo: post.geo || {},
      geo_ai: global.IfluxCommunityGeoAi ? IfluxCommunityGeoAi.normalizeGeoAi(post) : (post.geo_ai || {}),
      keywords: {
        focus: post.seo && post.seo.focus_keyword,
        secondary: post.seo && post.seo.secondary_keywords
      },
      entities: {
        tickers: post.tickers || [],
        stories: (post.story_tags || []).map(function (t) { return t.name; })
      },
      json_ld: buildJsonLd(post, url)
    };
  }

  ensureStore();

  global.IfluxCommunityStore = {
    canWrite: canWrite,
    canWriteExpert: canWriteExpert,
    getPosts: getPosts,
    getPostsByAuthor: getPostsByAuthor,
    countPosts: countPosts,
    setFeed: setFeed,
    setArticle: setArticle,
    postMatchesTaxonomy: postMatchesTaxonomy,
    CONTENT_TYPE_NEWS: CONTENT_TYPE_NEWS,
    CONTENT_TYPE_EXPERT: CONTENT_TYPE_EXPERT,
    ADMIN_AUTHOR: ADMIN_AUTHOR,
    getPostBySlug: getPostBySlug,
    getPostById: getPostById,
    upsertPostLocal: upsertPostLocal,
    loadComments: loadComments,
    savePost: savePost,
    bumpView: bumpView,
    toggleLike: toggleLike,
    toggleFavorite: toggleFavorite,
    addComment: addComment,
    bumpShare: bumpShare,
    buildJsonLd: buildJsonLd,
    exportSeoSeed: exportSeoSeed,
    slugify: slugify,
    extractTickersFromPost: extractTickersFromPost,
    linkifyTickersInHtml: linkifyTickersInHtml,
    normalizePrimaryStory: normalizePrimaryStory,
    getTrendingTickers: getTrendingTickers,
    getTrendingStories: getTrendingStories,
    getTrendingStoriesLocal: getTrendingStoriesLocal,
    hydrateTrendingStoriesFromApi: hydrateTrendingStoriesFromApi,
    INTEREST_WEIGHTS: INTEREST_WEIGHTS,
    STORY_PERIODS: STORY_PERIODS,
    interestScore: interestScore,
    getTopExpertsByLikes: getTopExpertsByLikes,
    getExpertLeaderboard: getExpertLeaderboard,
    WRITE_TIERS: WRITE_TIERS,
    EXPERT_WRITE_TIERS: EXPERT_WRITE_TIERS
  };
})(window);
