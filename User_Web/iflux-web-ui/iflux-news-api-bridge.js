/**
 * Community Data Provider (SoT PA V2).
 * Điểm duy nhất sinh IO feed/article phía User Web.
 * → API /news/feed | /news/articles/{id}
 * → IfluxNewsStore.setFeed / setArticle (Store không IO). Leftover IfluxNewsStore = cùng object.
 * SOL-CAL: FEED_PAGE_SIZE=50 · has_more · offset continuation.
 */
(function (global) {
  'use strict';

  var FEED_PAGE_SIZE = 50;
  var DEFAULT_FEED_LIMIT = FEED_PAGE_SIZE;
  var RELATED_LIMIT = 10;
  var ENTITY_LIMIT = 20;

  function apiBase() {
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

  function unwrap(res, data) {
    if (!res.ok) {
      var msg =
        (data && data.error && data.error.message) ||
        data.message ||
        ('HTTP ' + res.status);
      throw new Error(msg);
    }
    return data;
  }

  function getJson(url) {
    return fetch(url, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          return unwrap(res, data);
        });
    });
  }

  function qs(params) {
    var parts = [];
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v == null || v === '') return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    return parts.length ? '?' + parts.join('&') : '';
  }

  function fetchFeed(params) {
    var url = apiBase() + '/news/feed' + qs(params || {});
    return getJson(url).then(function (res) {
      var body = (res && res.data) || res || {};
      var cards = body.cards || body.posts || [];
      if (!Array.isArray(cards)) cards = [];
      var limit = body.limit != null ? Number(body.limit) : (params && params.limit) || DEFAULT_FEED_LIMIT;
      var hasMore = body.has_more === true;
      return {
        cards: cards,
        total: body.total != null ? body.total : cards.length,
        limit: limit,
        offset: body.offset != null ? Number(body.offset) : (params && params.offset) || 0,
        has_more: hasMore
      };
    });
  }

  function fetchArticle(idOrSlug) {
    var url = apiBase() + '/news/articles/' + encodeURIComponent(String(idOrSlug || ''));
    return getJson(url).then(function (res) {
      var body = (res && res.data) || res || {};
      var article = body.article || body.post || null;
      if (!article) throw new Error('Không tìm thấy bài viết');
      return article;
    });
  }

  function store() {
    return global.IfluxNewsStore;
  }

  /** Community list — FeedCard + has_more (SOL-CAL-01/02) */
  function loadFeed(opts) {
    opts = opts || {};
    var limit = opts.limit != null ? opts.limit : DEFAULT_FEED_LIMIT;
    var offset = opts.offset != null ? opts.offset : 0;
    return fetchFeed({
      limit: limit,
      offset: offset,
      type: opts.type || undefined,
      ticker: opts.ticker || undefined,
      category_id: opts.category_id || undefined,
      chu_de_id: opts.chu_de_id || undefined
    })
      .then(function (out) {
        var st = store();
        if (st && st.setFeed) {
          st.setFeed(out.cards, {
            replace: opts.replace === true,
            merge: opts.replace !== true
          });
        }
        return {
          ok: true,
          cards: out.cards,
          total: out.total,
          limit: out.limit,
          offset: out.offset,
          has_more: out.has_more === true
        };
      })
      .catch(function (err) {
        return {
          ok: false,
          reason: (err && err.message) || 'feed_fail',
          cards: [],
          has_more: false
        };
      });
  }

  function loadEntityFeed(opts) {
    opts = opts || {};
    return loadFeed({
      limit: opts.limit != null ? opts.limit : ENTITY_LIMIT,
      ticker: opts.ticker || undefined,
      chu_de_id: opts.chu_de_id || undefined,
      replace: opts.replace !== false
    });
  }

  function loadPostPage(opts) {
    opts = opts || {};
    var idOrSlug = opts.idOrSlug || opts.slug || opts.id;
    if (!idOrSlug) {
      return Promise.resolve({ ok: false, reason: 'missing_ref' });
    }
    return fetchArticle(idOrSlug)
      .then(function (article) {
        var st = store();
        if (st && st.setArticle) st.setArticle(article);
        var relatedKey = article.id || article.slug || idOrSlug;
        return fetchFeed({
          related_to: relatedKey,
          limit: opts.relatedLimit != null ? opts.relatedLimit : RELATED_LIMIT
        })
          .then(function (rel) {
            if (st && st.setFeed) st.setFeed(rel.cards, { replace: false, merge: true });
            return { ok: true, article: article, related: rel.cards || [] };
          })
          .catch(function () {
            return { ok: true, article: article, related: [] };
          });
      })
      .catch(function (err) {
        return { ok: false, reason: (err && err.message) || 'article_fail' };
      });
  }

  function hydrate(opts) {
    return loadFeed(opts || { limit: DEFAULT_FEED_LIMIT, replace: true });
  }

  global.IfluxNewsApiBridge = {
    loadFeed: loadFeed,
    loadEntityFeed: loadEntityFeed,
    loadPostPage: loadPostPage,
    hydrate: hydrate,
    FEED_PAGE_SIZE: FEED_PAGE_SIZE,
    DEFAULT_FEED_LIMIT: DEFAULT_FEED_LIMIT,
    RELATED_LIMIT: RELATED_LIMIT,
    ENTITY_LIMIT: ENTITY_LIMIT
  };
  global.IfluxCommunityProvider = global.IfluxNewsApiBridge;
})(window);
