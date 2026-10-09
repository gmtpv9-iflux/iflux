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

  /* Dữ liệu RSS cũ (trước khi sửa rss-ingest.service.js decodeEntities) còn lưu nguyên
     entity thô trong title/excerpt (vd "&#039;" thay vì dấu nháy) — decode lại ở đây để
     bài cũ hiển thị đúng ngay, không cần sửa dữ liệu đã lưu trong DB. */
  function decodeHtmlEntities(s) {
    s = String(s == null ? '' : s);
    if (s.indexOf('&') === -1) return s;
    return s
      .replace(/&amp;/g, '&')
      .replace(/&#0*39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#0*8216;|&lsquo;/g, '‘')
      .replace(/&#0*8217;|&rsquo;/g, '’')
      .replace(/&#0*8220;|&ldquo;/g, '“')
      .replace(/&#0*8221;|&rdquo;/g, '”')
      .replace(/&#0*8211;|&ndash;/g, '–')
      .replace(/&#0*8212;|&mdash;/g, '—')
      .replace(/&#0*8230;|&hellip;/g, '…')
      .replace(/&nbsp;/g, ' ');
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
        tier_label: post.author.tier_label || null,
        /* Khối "Thông tin người viết" (Chi tiết bài viết) cần Avatar — API đã trả field này
           (xem backend news-feed.service.js) nhưng chuẩn hoá cũ bỏ qua, không giữ lại. */
        avatar: post.author.avatar || post.author.avatar_url || null
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
    post.title = decodeHtmlEntities(post.title);
    post.excerpt = decodeHtmlEntities(post.excerpt);
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
    document.dispatchEvent(new CustomEvent('iflux-news-change'));
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
   * CẤM IO — feed/article do IfluxNewsApiBridge (Data Provider) fetch.
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

  /* Số theo dõi thật (profile store); không có nguồn → null (không hiện). */
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
    return null;
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
      /* Chỉ số liệu có nguồn thật; chưa có nguồn (thành viên affiliate, sao đánh giá) thì không hiện. */
      row.totalFollows = expertFollowerCount(row.userId);
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

  function bumpView(slug) {
    var data = ensureStore();
    var post = data.posts.find(function (p) { return p.slug === slug || p.id === slug; });
    if (!post) return;
    post.stats = post.stats || {};
    post.stats.views = (post.stats.views || 0) + 1;
    /* silent: tránh iflux-news-change → remount trang chi tiết */
    writeAll(data, { silent: true });
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

  ensureStore();

  global.IfluxNewsStore = {
    getPosts: getPosts,
    setFeed: setFeed,
    setArticle: setArticle,
    postMatchesTaxonomy: postMatchesTaxonomy,
    CONTENT_TYPE_NEWS: CONTENT_TYPE_NEWS,
    CONTENT_TYPE_EXPERT: CONTENT_TYPE_EXPERT,
    ADMIN_AUTHOR: ADMIN_AUTHOR,
    getPostBySlug: getPostBySlug,
    getPostById: getPostById,
    upsertPostLocal: upsertPostLocal,
    bumpView: bumpView,
    buildJsonLd: buildJsonLd,
    slugify: slugify,
    extractTickersFromPost: extractTickersFromPost,
    linkifyTickersInHtml: linkifyTickersInHtml,
    normalizePrimaryStory: normalizePrimaryStory,
    getTopExpertsByLikes: getTopExpertsByLikes,
    getExpertLeaderboard: getExpertLeaderboard
  };
})(window);
