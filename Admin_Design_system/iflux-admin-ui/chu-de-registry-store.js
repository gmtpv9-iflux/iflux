/* Chủ đề (Topic) Registry — API-backed (community/topics), Owner 2026-10: Topic hình thành từ
 * Hashtag Cộng đồng, KHÔNG còn tạo/sửa tay — chỉ xem thống kê + Admin ánh xạ sang Câu chuyện
 * (Story) hoặc đổi trạng thái (override). Thay thế hoàn toàn content_chu_de cũ (đã dọn). */
(function (global) {
  'use strict';

  /* 5 trạng thái lifecycle Topic (Owner 2026-10, hồi sinh percentile+window Topic_Engine V2,
     áp riêng cho Topic — không còn gắn Story). */
  var STATUS_META = {
    new: { label: 'Mới', color: 'info' },
    rising: { label: 'Đang nổi', color: 'primary' },
    trending: { label: 'Đang thịnh hành', color: 'success' },
    declining: { label: 'Đang hạ nhiệt', color: 'warning' },
    archived: { label: 'Lưu trữ', color: 'secondary' }
  };
  var STATUS_ORDER = ['new', 'rising', 'trending', 'declining', 'archived'];
  var RANGE_META = { day: 'Ngày', week: 'Tuần', month: 'Tháng' };

  var cache = { topics: [], range: 'week', loaded: false, loading: null };

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (!token) {
      try {
        var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
        if (raw) {
          var obj = JSON.parse(raw);
          if (obj && obj.token) token = obj.token;
        }
      } catch (e) { /* ignore */ }
    }
    if (token) h.Authorization = 'Bearer ' + token;
    var key = 'iflux-admin-local-dev';
    try {
      var stored = localStorage.getItem('iflux_admin_api_key');
      if (stored) key = stored;
    } catch (e2) { /* ignore */ }
    h['X-Admin-Key'] = key;
    return h;
  }

  function unwrap(data) {
    if (data && data.data != null) return data.data;
    return data || {};
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = data.error;
          var msg = (err && err.message) || data.message || data.error || ('HTTP ' + res.status);
          throw new Error(typeof msg === 'string' ? msg : 'Request failed');
        }
        return unwrap(data);
      });
    });
  }

  function mapRow(row) {
    if (!row) return null;
    var stats = row.stats || {};
    var reaction = row.reactionSentiment || {};
    var author = row.authorSentiment || {};
    return {
      id: row.id,
      name: row.displayName || row.slug,
      slug: row.slug,
      status: row.statusOverride || row.status,
      statusIsOverride: !!row.statusOverride,
      rawStatus: row.status,
      firstSeenAt: row.firstSeenAt,
      updatedAt: row.lastActivityAt,
      mappedStoryId: row.mappedStoryId || null,
      hotEligible: !!row.hotEligible,
      stats: {
        posts: Number(stats.posts) || 0,
        likes: Number(stats.likes) || 0,
        dislikes: Number(stats.dislikes) || 0,
        comments: Number(stats.comments) || 0,
        shares: Number(stats.shares) || 0,
        engagement: Number(stats.engagement) || 0,
        sentimentPos: Number(stats.sentimentPos) || 0,
        sentimentNeg: Number(stats.sentimentNeg) || 0,
        sentimentUnspecified: Number(stats.sentimentUnspecified) || 0
      },
      reactionLabel: reaction.label || 'undetermined',
      authorSentimentLabel: author.label || 'undetermined',
      authorSentimentSample: author.sample || 0
    };
  }

  function loadFromApi(range) {
    var r = (range && RANGE_META[range]) ? range : cache.range;
    cache.range = r;
    cache.loading = request('/community/topics?range=' + encodeURIComponent(r) + '&limit=200')
      .then(function (data) {
        cache.topics = (data.items || []).map(mapRow).filter(Boolean);
        cache.loaded = true;
        cache.loading = null;
        return cache;
      }).catch(function (err) {
        cache.loading = null;
        throw err;
      });
    return cache.loading;
  }

  function listTopics(filters) {
    filters = filters || {};
    return cache.topics.filter(function (t) {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.keyword) {
        var q = filters.keyword.toLowerCase();
        if ((t.name + ' ' + t.slug).toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    /* Đã sort theo Engagement giảm dần từ API (ORDER BY engagement DESC) — không sort lại ở FE. */
  }

  function getTopic(id) {
    for (var i = 0; i < cache.topics.length; i++) {
      if (cache.topics[i].id === id) return cache.topics[i];
    }
    return null;
  }

  function setStatusOverride(id, status) {
    return request('/community/topics/' + encodeURIComponent(id) + '/status-override', {
      method: 'POST',
      body: { status: status || null }
    }).then(function () { return loadFromApi(cache.range); });
  }

  function getRepresentativeStocks(id) {
    return request('/community/topics/' + encodeURIComponent(id) + '/representative-stocks');
  }

  /** story_id = gắn vào Story có sẵn; thiếu story_id = tạo Story mới (cần title). */
  function mapToStory(topicId, payload) {
    return request('/community/topics/' + encodeURIComponent(topicId) + '/map-to-story', {
      method: 'POST',
      body: payload || {}
    }).then(function (data) {
      return loadFromApi(cache.range).then(function () { return data.story; });
    });
  }

  global.IfluxChuDeRegistryStore = {
    STATUS_META: STATUS_META,
    STATUS_ORDER: STATUS_ORDER,
    RANGE_META: RANGE_META,
    loadFromApi: loadFromApi,
    listTopics: listTopics,
    listStories: listTopics,
    getTopic: getTopic,
    getStory: getTopic,
    setStatusOverride: setStatusOverride,
    getRepresentativeStocks: getRepresentativeStocks,
    mapToStory: mapToStory,
    getRange: function () { return cache.range; }
  };
  global.IfluxStoryRegistryStore = global.IfluxChuDeRegistryStore;
})(window);
