/* Chủ đề Registry — API-backed (content_chu_de), không còn localStorage Story */
(function (global) {
  'use strict';

  var LIFECYCLE_META = {
    emerging: { label: 'Hình thành', color: 'info' },
    growing: { label: 'Tăng trưởng', color: 'primary' },
    trending: { label: 'Lan tỏa', color: 'success' },
    peak: { label: 'Đỉnh', color: 'warning' },
    fading: { label: 'Suy yếu', color: 'secondary' },
    archived: { label: 'Lưu trữ', color: 'secondary' }
  };

  /* Trạng thái chủ đề (SoT Admin): Mới | Trưởng thành | Suy yếu | Lưu trữ */
  var STATUS_META = {
    new: { label: 'Mới', color: 'info' },
    mature: { label: 'Trưởng thành', color: 'success' },
    declining: { label: 'Suy yếu', color: 'warning' },
    archived: { label: 'Lưu trữ', color: 'secondary' }
  };

  var STATUS_ORDER = ['new', 'mature', 'declining', 'archived'];

  var LIFECYCLE_ORDER = ['emerging', 'growing', 'trending', 'peak', 'fading', 'archived'];

  function normalizeStatus(raw, lifecycle) {
    var s = String(raw || '').toLowerCase();
    if (STATUS_META[s]) return s;
    if (s === 'moi') return 'new';
    if (s === 'truong_thanh') return 'mature';
    if (s === 'suy_yeu') return 'declining';
    if (s === 'retired') return 'declining';
    if (s === 'merged') return 'archived';
    var lc = String(lifecycle || '').toLowerCase();
    if (lc === 'archived') return 'archived';
    if (lc === 'fading') return 'declining';
    if (lc === 'peak' || lc === 'trending') return 'mature';
    /* draft / active / emerging / growing → Mới */
    return 'new';
  }

  var cache = { stories: [], mappings: [], history: [], loaded: false, loading: null };

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
    /* Luôn gửi admin key kèm Bearer — khi JWT fail middleware còn fallback key */
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

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mapRow(row) {
    if (!row) return null;
    var meta = row.meta || {};
    return {
      id: row.id,
      name: row.name || row.label,
      slug: row.slug,
      description: row.description || meta.description || '',
      lifecycle: row.lifecycle || 'emerging',
      status: normalizeStatus(row.status, row.lifecycle),
      source: row.source || meta.source || null,
      createdBy: row.createdBy || row.promoted_by || meta.created_by || 'Admin',
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
      analytics: {
        views: 0,
        interactions: 0,
        commentsCount: 0,
        favoritesCount: 0,
        trendScore: Math.round(Number(row.interest_score) || 0),
        postsCount: Number((meta.post_count != null ? meta.post_count : 0)) || 0,
        watchlistAdds: 0
      },
      mapping_count: Number(row.mapping_count || row.stocksCount || 0)
    };
  }

  function loadFromApi() {
    if (cache.loading) return cache.loading;
    /* List đọc public endpoint (không phụ thuộc admin key) — luôn hiện DB.
       Mappings cũng public. */
    cache.loading = Promise.all([
      request('/content/chu-de?limit=200'),
      request('/content/mappings?limit=500').catch(function () { return { mappings: [] }; })
    ]).then(function (parts) {
      var list = parts[0]['chu-de'] || parts[0].stories || [];
      var maps = parts[1].mappings || [];
      cache.stories = list.map(mapRow).filter(Boolean);
      cache.mappings = maps.map(function (m) {
        return {
          id: String(m.id),
          storyId: m.chu_de_id || m.story_id,
          entityType: 'stock',
          entityId: m.ticker,
          entityLabel: m.entity_label || m.ticker,
          weight: Number(m.relevance_score) || 0.5,
          createdBy: m.method || 'system',
          createdAt: m.updated_at || m.created_at
        };
      });
      cache.history = [];
      cache.loaded = true;
      cache.loading = null;
      return cache;
    }).catch(function (err) {
      cache.loading = null;
      throw err;
    });
    return cache.loading;
  }

  function listStories(filters) {
    filters = filters || {};
    var statusSet = null;
    if (filters.statuses && filters.statuses.length) {
      statusSet = {};
      filters.statuses.forEach(function (st) { statusSet[st] = true; });
    }
    return cache.stories.filter(function (s) {
      if (statusSet) {
        if (!statusSet[s.status]) return false;
      } else if (filters.status && s.status !== filters.status) {
        return false;
      }
      if (filters.lifecycle && s.lifecycle !== filters.lifecycle) return false;
      if (filters.keyword) {
        var q = filters.keyword.toLowerCase();
        var hay = (s.name + ' ' + s.slug + ' ' + s.description).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) {
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  }

  function isStoryStatus(status) {
    return status === 'mature' || status === 'declining';
  }

  function promoteToStory(id) {
    var s = getStory(id);
    if (!s) return Promise.reject(new Error('Không tìm thấy chủ đề'));
    if (isStoryStatus(s.status)) {
      return Promise.resolve(s);
    }
    return upsertStory({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      lifecycle: s.lifecycle,
      status: 'mature'
    });
  }

  function getStory(id) {
    if (!id) return null;
    for (var i = 0; i < cache.stories.length; i++) {
      if (cache.stories[i].id === id || cache.stories[i].slug === id) return clone(cache.stories[i]);
    }
    return null;
  }

  function countStocks(storyId) {
    return listMappings(storyId, 'stock').length;
  }

  function upsertStory(payload) {
    payload = payload || {};
    var body = {
      id: payload.id,
      name: payload.name,
      label: payload.name,
      slug: payload.slug,
      description: payload.description || '',
      lifecycle: payload.lifecycle || 'emerging',
      status: normalizeStatus(payload.status || 'new', payload.lifecycle)
    };
    if (payload.tickers) body.tickers = payload.tickers;
    var req = payload.id
      ? request('/content/admin/chu-de/' + encodeURIComponent(payload.id), { method: 'PUT', body: body })
      : request('/content/admin/chu-de', { method: 'POST', body: body });
    return req.then(function (data) {
      var item = mapRow(data['chu-de'] || data.story || data);
      return loadFromApi().then(function () { return item; });
    });
  }

  function archiveStory(id) {
    return request('/content/admin/chu-de/' + encodeURIComponent(id) + '/archive', { method: 'POST' })
      .then(function () { return loadFromApi(); })
      .then(function () { return getStory(id); });
  }

  function mergeStories() {
    return Promise.reject(new Error('Gộp chủ đề trên DB sẽ bổ sung ở bước sau'));
  }

  function setLifecycle(id, lifecycle) {
    var s = getStory(id);
    if (!s || !LIFECYCLE_META[lifecycle]) return Promise.resolve(null);
    return upsertStory({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      lifecycle: lifecycle,
      status: s.status
    });
  }

  function listMappings(storyId, entityType) {
    return cache.mappings.filter(function (m) {
      if (m.storyId !== storyId) return false;
      if (entityType && m.entityType !== entityType) return false;
      return true;
    }).sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); });
  }

  function addMapping(payload) {
    payload = payload || {};
    if (!payload.storyId || !payload.entityId) return Promise.resolve(null);
    var s = getStory(payload.storyId);
    if (!s) return Promise.resolve(null);
    var tickers = listMappings(payload.storyId, 'stock').map(function (m) { return m.entityId; });
    var tk = String(payload.entityId).toUpperCase();
    if (tickers.indexOf(tk) < 0) tickers.push(tk);
    return upsertStory({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      lifecycle: s.lifecycle,
      status: s.status,
      tickers: tickers
    }).then(function () {
      return loadFromApi();
    }).then(function () {
      return listMappings(payload.storyId, 'stock').filter(function (m) { return m.entityId === tk; })[0] || null;
    });
  }

  function removeMapping(mappingId) {
    /* Soft: archive mapping not exposed yet — no-op with warning */
    return Promise.resolve(null);
  }

  function listHistory() {
    return cache.history.slice();
  }

  function listAnalytics(filters) {
    return listStories(filters).map(function (s) {
      return {
        storyId: s.id,
        name: s.name,
        lifecycle: s.lifecycle,
        status: s.status,
        stocksCount: countStocks(s.id) || s.mapping_count || 0,
        analytics: clone(s.analytics || {})
      };
    }).sort(function (a, b) {
      return (b.analytics.trendScore || 0) - (a.analytics.trendScore || 0);
    });
  }

  function resetSeed() {
    return request('/content/admin/chu-de/seed-foundation', { method: 'POST' })
      .then(function () { return loadFromApi(); });
  }

  global.IfluxChuDeRegistryStore = {
    LIFECYCLE_META: LIFECYCLE_META,
    STATUS_META: STATUS_META,
    STATUS_ORDER: STATUS_ORDER,
    LIFECYCLE_ORDER: LIFECYCLE_ORDER,
    normalizeStatus: normalizeStatus,
    isStoryStatus: isStoryStatus,
    loadFromApi: loadFromApi,
    listStories: listStories,
    getStory: getStory,
    upsertStory: upsertStory,
    promoteToStory: promoteToStory,
    archiveStory: archiveStory,
    mergeStories: mergeStories,
    setLifecycle: setLifecycle,
    countStocks: countStocks,
    listMappings: listMappings,
    addMapping: addMapping,
    removeMapping: removeMapping,
    listHistory: listHistory,
    listAnalytics: listAnalytics,
    resetSeed: resetSeed
  };
  global.IfluxStoryRegistryStore = global.IfluxChuDeRegistryStore;
})(window);
