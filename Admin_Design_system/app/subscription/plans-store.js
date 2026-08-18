/* ADM-SUB-001 — mock plan store (localStorage + runtime sync) */
(function (global) {
  var STORAGE_KEY = 'iflux-admin-plans-v1';
  var MIRROR_KEY = 'iflux-plans-v1';
  var _hydratePromise = null;
  /** Phase C: cache sau hydrate thành công — tránh shell-boot + guest-shell gọi 2 lần → /api/plans/runtime ×2. */
  var _hydratedCache = null;

  function normalizePlanData(p) {
    if (!p) return p;
    if (global.EntitlementCatalog && EntitlementCatalog.normalizePlan) {
      return EntitlementCatalog.normalizePlan(p);
    }
    return p;
  }

  var BASE = {
    guest: {
      id: 'guest', name: 'Vãng lai', tier: 'guest', sort: 0,
      desc: 'Quyền mặc định cho người chưa đăng nhập · website công khai',
      subtitle: 'Chưa đăng ký tài khoản',
      icon: 'ti-eye', iconClass: 'info',
      apple: '', google: '', web: '', trial: 0,
      appleYearly: '', googleYearly: '', webYearly: '',
      appleLifetime: '', googleLifetime: '', webLifetime: '',
      priceMonth: 0, priceYear: 0, priceLifetime: 0, promoPct: 0,
      lifetimeEnabled: false,
      purchasable: false, status: 'published', badge: '', tags: 'guest, public',
      subs: 0, mrr: 0,
      ent: {}, blocks: {}, limits: {},
      guestPlan: true, builtin: true
    },
    free: {
      id: 'free', name: 'Miễn phí', tier: 'free', sort: 1,
      desc: 'Gói mặc định · không thu phí',
      subtitle: 'Gói mặc định · không thu phí',
      icon: 'ti-gift', iconClass: 'info',
      apple: '', google: '', web: '', trial: 0,
      appleYearly: '', googleYearly: '', webYearly: '',
      appleLifetime: '', googleLifetime: '', webLifetime: '',
      priceMonth: 0, priceYear: 0, priceLifetime: 0, promoPct: 0,
      lifetimeEnabled: false,
      purchasable: false, status: 'published', badge: '', tags: 'default, free',
      subs: 248120, mrr: 0,
      ent: {}, blocks: {}, limits: {},
      builtin: true
    },
    premium: {
      id: 'premium', name: 'Premium', tier: 'premium', sort: 2,
      desc: 'Dòng tiền real-time, biểu đồ nến ngành, alert nâng cao, widget không giới hạn.',
      subtitle: 'Dòng tiền RT · Alert · Widget',
      icon: 'ti-crown', iconClass: 'accent',
      apple: 'com.iflux.premium.monthly', google: 'com.iflux.premium.monthly',
      web: 'price_premium_monthly_vnd', trial: 7,
      appleYearly: 'com.iflux.premium.yearly', google: 'com.iflux.premium.yearly',
      webYearly: 'price_premium_yearly_vnd',
      appleLifetime: 'com.iflux.premium.lifetime', google: 'com.iflux.premium.lifetime',
      webLifetime: 'price_premium_lifetime_vnd',
      priceMonth: 199000, priceYear: 1990000, priceLifetime: 4990000, promoPct: 0,
      lifetimeEnabled: true,
      purchasable: true, status: 'published', badge: 'popular', tags: 'subscription, gd1',
      subs: 11240, mrr: 358000000,
      ent: {}, blocks: {}, limits: {},
      builtin: true
    },
    elite: {
      id: 'elite', name: 'Elite', tier: 'elite', sort: 3,
      desc: 'Toàn bộ Premium + ưu tiên hỗ trợ. Giới hạn API cao hơn (GĐ2 mở rộng).',
      subtitle: 'Premium + ưu tiên hỗ trợ · API cao',
      icon: 'ti-diamond', iconClass: 'warning',
      apple: 'com.iflux.elite.monthly', google: 'com.iflux.elite.monthly',
      web: 'price_elite_monthly_vnd', trial: 14,
      appleYearly: 'com.iflux.elite.yearly', google: 'com.iflux.elite.yearly',
      webYearly: 'price_elite_yearly_vnd',
      appleLifetime: 'com.iflux.elite.lifetime', google: 'com.iflux.elite.lifetime',
      webLifetime: 'price_elite_lifetime_vnd',
      priceMonth: 399000, priceYear: 3990000, priceLifetime: 9990000, promoPct: 0,
      lifetimeEnabled: true,
      purchasable: true, status: 'published', badge: 'best', tags: 'subscription, gd1, elite',
      subs: 1600, mrr: 70000000,
      ent: {}, blocks: {}, limits: {},
      builtin: true
    }
  };

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(MIRROR_KEY);
      if (!raw) return { version: 1, updatedAt: 0, overrides: {}, custom: [] };
      var data = JSON.parse(raw);
      return {
        version: data.version || 1,
        updatedAt: data.updatedAt || 0,
        overrides: data.overrides || {},
        custom: data.custom || []
      };
    } catch (e) {
      return { version: 1, updatedAt: 0, overrides: {}, custom: [] };
    }
  }

  function apiBaseUrl() {
    if (global.IfluxAdminAuth && global.IfluxAdminAuth.apiBase) {
      return global.IfluxAdminAuth.apiBase();
    }
    if (global.IfluxApiConfig) {
      if (global.IfluxApiConfig.isEnabled && !IfluxApiConfig.isEnabled()) return '';
      if (global.IfluxApiConfig.getBaseUrl) {
        var base = IfluxApiConfig.getBaseUrl();
        if (base) return base.replace(/\/$/, '');
      }
    }
    var host = (global.location && global.location.hostname) || '';
    var port = (global.location && global.location.port) || '';
    if (port === '8888' || host === '103.154.177.157') return '';
    if (host && host !== 'localhost' && host !== '127.0.0.1' && (global.location.protocol || '') !== 'file:') {
      return (global.location.origin || '') + '/api';
    }
    return 'http://localhost:3001/api';
  }

  function adminAuthHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) h.Authorization = 'Bearer ' + s.token;
    }
    return h;
  }

  function hasAdminToken() {
    return !!(adminAuthHeaders().Authorization);
  }

  function fetchAdminEntitlementsStore() {
    if (!hasAdminToken()) return Promise.resolve(null);
    return fetch(apiBaseUrl() + '/admin/subscription/entitlements', {
      method: 'GET',
      headers: adminAuthHeaders(),
      cache: 'no-store'
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (body) {
      var item = body.data && body.data.item;
      var payload = item && item.payload;
      if (!payload || !payload.overrides) return null;
      var ts = payload.updatedAt || 0;
      if (!ts && item.updated_at) {
        var parsed = Date.parse(item.updated_at);
        if (!isNaN(parsed)) ts = parsed;
      }
      return {
        version: payload.version || 1,
        updatedAt: ts || Date.now(),
        overrides: payload.overrides || {},
        custom: payload.custom || []
      };
    }).catch(function () {
      return null;
    });
  }

  function patchAdminEntitlementsStore(storeData) {
    if (!hasAdminToken()) {
      return Promise.resolve({ ok: false, error: 'Chưa đăng nhập Admin — không thể lưu lên server' });
    }
    return fetch(apiBaseUrl() + '/admin/subscription/entitlements', {
      method: 'PATCH',
      headers: adminAuthHeaders(),
      body: JSON.stringify({ payload: storeData })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var err = body.error;
          var msg = (err && (err.message || err.code)) || ('HTTP ' + res.status);
          return { ok: false, error: msg };
        }
        return { ok: true };
      });
    }).catch(function (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    });
  }

  function storeHasPlanData(data) {
    if (!data) return false;
    if ((data.updatedAt || 0) > 0) return true;
    var ovs = data.overrides || {};
    return Object.keys(ovs).some(function (tierKey) {
      var o = ovs[tierKey];
      if (!o || typeof o !== 'object') return false;
      if (o.blocks && Object.keys(o.blocks).some(function (id) { return !!o.blocks[id]; })) return true;
      if (o.pages && Object.keys(o.pages).some(function (id) { return !!o.pages[id]; })) return true;
      return false;
    });
  }

  function runtimeFetchUrls() {
    // '/api/plans/runtime' (tương đối) ĐÃ trỏ đúng origin của trang → KHÔNG thêm
    // origin + '/api/plans/runtime' nữa (cùng endpoint, chỉ khác chuỗi) để tránh
    // gọi trùng /api/plans/runtime 2 lần khi tryNext fallback.
    var urls = ['/api/plans/runtime'];
    urls.push(apiBaseUrl() + '/plans/runtime');
    if (global.location && global.location.protocol === 'file:') {
      urls.push('http://127.0.0.1:8777/api/plans/runtime');
    }
    urls.push('/User_Web/data/iflux-plans-v1.json');
    urls.push('../data/iflux-plans-v1.json');
    urls.push('../../User_Web/data/iflux-plans-v1.json');
    if (global.location && global.location.origin && global.location.protocol !== 'file:') {
      urls.push(global.location.origin + '/User_Web/data/iflux-plans-v1.json');
    }
    return urls.filter(function (u, i, arr) { return arr.indexOf(u) === i; });
  }

  function fetchJson(url) {
    var bust = (url.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
    return fetch(url + bust, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function notifyPlansUpdated(updatedAt) {
    if (typeof document === 'undefined') return;
    try {
      document.dispatchEvent(new CustomEvent('iflux-plans-updated', { detail: { updatedAt: updatedAt || 0 } }));
    } catch (e) { /* ignore */ }
  }

  function fetchRuntimePlans() {
    var urls = runtimeFetchUrls();
    function tryNext(idx) {
      if (idx >= urls.length) return Promise.resolve(null);
      return fetchJson(urls[idx]).then(function (data) {
        if (storeHasPlanData(data)) return data;
        throw new Error('empty plans payload');
      }).catch(function () {
        return tryNext(idx + 1);
      });
    }
    return tryNext(0);
  }

  function mergeTierOverride(localTier, remoteTier) {
    localTier = localTier || {};
    remoteTier = remoteTier || {};
    var merged = Object.assign({}, localTier, remoteTier);
    ['pages', 'blocks', 'actions', 'limits', 'ent'].forEach(function (k) {
      merged[k] = Object.assign({}, localTier[k] || {}, remoteTier[k] || {});
    });
    return merged;
  }

  function mergeStoreData(local, remote) {
    local = local || { version: 1, updatedAt: 0, overrides: {}, custom: [] };
    if (!remote) return local;
    var localTs = local.updatedAt || 0;
    var remoteTs = remote.updatedAt || 0;
    if (remoteTs > localTs) return remote;
    if (remoteTs < localTs) return local;
    var tiers = {};
    ['guest', 'free', 'premium', 'elite'].forEach(function (t) {
      tiers[t] = mergeTierOverride(local.overrides && local.overrides[t], remote.overrides && remote.overrides[t]);
    });
    return {
      version: Math.max(local.version || 1, remote.version || 1),
      updatedAt: localTs,
      overrides: tiers,
      custom: (remote.custom && remote.custom.length) ? remote.custom : (local.custom || [])
    };
  }

  function saveStore(data, opts) {
    opts = opts || {};
    data.version = data.version || 1;
    data.updatedAt = Date.now();
    data.overrides = data.overrides || {};
    data.custom = data.custom || [];
    var json = JSON.stringify(data);
    try {
      localStorage.setItem(STORAGE_KEY, json);
      localStorage.setItem(MIRROR_KEY, json);
    } catch (e) { /* ignore */ }
    if (!opts.skipPublish) publishRuntime(data);
    if (!opts.skipNotify) notifyPlansUpdated(data.updatedAt);
  }

  function publishRuntime(data) {
    var payload = JSON.stringify(data);
    var headers = adminAuthHeaders();
    if (!headers.Authorization) return;
    var urls = ['/api/plans/runtime'];
    if (global.location && global.location.origin && global.location.protocol !== 'file:') {
      urls.push(global.location.origin + '/api/plans/runtime');
    }
    urls.push(apiBaseUrl() + '/plans/runtime');
    urls.filter(function (u, i, arr) { return arr.indexOf(u) === i; }).forEach(function (url) {
      fetch(url, { method: 'PUT', headers: headers, body: payload }).catch(function () {});
    });
  }

  function hydrate(opts) {
    opts = opts || {};
    if (opts.force) {
      _hydratedCache = null;
      _hydratePromise = null;
    }
    if (_hydratePromise) return _hydratePromise;
    if (_hydratedCache && !opts.force) return Promise.resolve(_hydratedCache);
    var local = loadStore();
    _hydratePromise = Promise.all([
      fetchRuntimePlans(),
      fetchAdminEntitlementsStore()
    ]).then(function (results) {
      var remote = results[0];
      var adminRemote = results[1];
      if (adminRemote && storeHasPlanData(adminRemote)) {
        var adminTs = adminRemote.updatedAt || 0;
        var fileTs = (remote && remote.updatedAt) || 0;
        if (!remote || !storeHasPlanData(remote) || adminTs >= fileTs) {
          remote = adminRemote;
        }
      }
      var merged = mergeStoreData(local, remote);
      var localTs = local.updatedAt || 0;
      var mergedTs = merged.updatedAt || 0;
      var localEmpty = !storeHasPlanData(local);
      var changed = mergedTs > localTs || localEmpty ||
        JSON.stringify(merged.overrides || {}) !== JSON.stringify(local.overrides || {}) ||
        JSON.stringify(merged.custom || []) !== JSON.stringify(local.custom || []);
      if (storeHasPlanData(merged) && changed) {
        saveStore(merged, { skipPublish: true, skipNotify: true });
      }
      return { merged: merged, changed: changed };
    }).catch(function () {
      return { merged: local, changed: false };
    }).then(function (out) {
      _hydratedCache = out.merged;
      _hydratePromise = null;
      return out.merged;
    });
    return _hydratePromise;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY || e.key === MIRROR_KEY) {
        _hydratePromise = null;
        _hydratedCache = null;
        notifyPlansUpdated();
      }
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        _hydratePromise = null;
        _hydratedCache = null;
        hydrate({ force: true }).then(function () {
          notifyPlansUpdated();
        });
      }
    });
  }

  function mergePlan(base, override) {
    if (!override) return JSON.parse(JSON.stringify(base));
    var p = JSON.parse(JSON.stringify(base));
    Object.keys(override).forEach(function (k) {
      if (k === 'blocks' || k === 'pages' || k === 'limits' || k === 'ent' || k === 'actions') {
        p[k] = Object.assign({}, p[k] || {}, override[k] || {});
      } else {
        p[k] = override[k];
      }
    });
    return p;
  }

  function formatVnd(n) {
    if (!n) return '₫0';
    return '₫' + Number(n).toLocaleString('vi-VN');
  }

  function formatSubs(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  var ICON_PRESETS = [
    { icon: 'ti-gift', label: 'Gift' },
    { icon: 'ti-crown', label: 'Crown' },
    { icon: 'ti-diamond', label: 'Diamond' },
    { icon: 'ti-package', label: 'Package' },
    { icon: 'ti-star', label: 'Star' },
    { icon: 'ti-rocket', label: 'Rocket' },
    { icon: 'ti-bolt', label: 'Bolt' },
    { icon: 'ti-flame', label: 'Flame' },
    { icon: 'ti-medal', label: 'Medal' },
    { icon: 'ti-shield', label: 'Shield' }
  ];

  var ICON_CLASSES = ['info', 'accent', 'warning', 'success', 'danger'];

  function matchesFilters(p, filters) {
    if (!filters) return true;
    if (filters.status) {
      var statusMap = { 'Đang bán': 'published', 'Ẩn': 'hidden', 'Lên lịch': 'scheduled' };
      if (p.status !== statusMap[filters.status]) return false;
    }
    if (filters.cycle) {
      if (filters.cycle === 'Tháng' && !(p.priceMonth > 0 || p.tier === 'free' || p.tier === 'guest')) return false;
      if (filters.cycle === 'Năm' && !(p.priceYear > 0)) return false;
      if (filters.cycle === 'Trọn đời' && !(p.lifetimeEnabled && p.priceLifetime > 0)) return false;
    }
    if (filters.channel) {
      if (filters.channel === 'IAP iOS' && !p.apple && !p.appleYearly && !p.appleLifetime) return false;
      if (filters.channel === 'IAP Android' && !p.google && !p.googleYearly && !p.googleLifetime) return false;
      if (filters.channel === 'Web' && !p.web && !p.webYearly && !p.webLifetime) return false;
    }
    return true;
  }

  function matchesSearch(p, q) {
    if (!q) return true;
    q = q.toLowerCase();
    var hay = [p.name, p.tier, p.subtitle, p.desc, p.tags, p.apple, p.google].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function statusLabel(status) {
    if (status === 'hidden') return { text: 'Ẩn', chip: 'ix-chip-warning' };
    if (status === 'scheduled') return { text: 'Lên lịch', chip: 'ix-chip-primary' };
    return { text: 'Đang bán', chip: 'ix-chip-success' };
  }

  global.PlansStore = {
    BASE: BASE,
    STORAGE_KEY: STORAGE_KEY,
    hydrate: hydrate,
    publishRuntime: publishRuntime,
    reload: function () {
      _hydratePromise = null;
      _hydratedCache = null;
      return hydrate({ force: true });
    },

    getPlan: function (key) {
      if (key === 'new') {
        return {
          id: '', name: '', tier: '', sort: 4,
          desc: '', subtitle: '',
          icon: 'ti-package', iconClass: 'accent',
          apple: '', google: '', web: '', trial: 0,
          appleYearly: '', googleYearly: '', webYearly: '',
          appleLifetime: '', googleLifetime: '', webLifetime: '',
          priceMonth: 0, priceYear: 0, priceLifetime: 0, promoPct: 0,
          lifetimeEnabled: false,
          purchasable: true, status: 'published', badge: '', tags: '',
          subs: 0, mrr: 0,
          ent: {}, blocks: {}, limits: {},
          builtin: false, isNew: true
        };
      }
      var store = loadStore();
      var custom = store.custom.find(function (p) { return p.id === key || p.tier === key; });
      if (custom) return normalizePlanData(JSON.parse(JSON.stringify(custom)));
      if (BASE[key]) return normalizePlanData(mergePlan(BASE[key], store.overrides[key]));
      return null;
    },

    listPlans: function () {
      var store = loadStore();
      var list = ['guest', 'free', 'premium', 'elite'].map(function (k) {
        return normalizePlanData(mergePlan(BASE[k], store.overrides[k]));
      });
      store.custom.forEach(function (p) { list.push(normalizePlanData(p)); });
      return list.sort(function (a, b) { return (a.sort || 99) - (b.sort || 99); });
    },

    getMatrixPlans: function () {
      var self = this;
      var out = {};
      ['guest', 'free', 'premium', 'elite'].forEach(function (t) {
        out[t] = self.getPlan(t);
      });
      return out;
    },

    saveMatrixOverrides: function (tierOverrides) {
      if (!tierOverrides) return Promise.resolve({ ok: false, error: 'Không có dữ liệu ma trận' });
      var store = loadStore();
      Object.keys(tierOverrides).forEach(function (tier) {
        if (BASE[tier] === undefined) return;
        var data = tierOverrides[tier] || {};
        var prev = store.overrides[tier] || {};
        var merged = Object.assign({}, prev, data);
        ['pages', 'blocks', 'actions', 'limits', 'ent'].forEach(function (k) {
          if (data[k]) merged[k] = Object.assign({}, prev[k] || {}, data[k]);
        });
        merged.tier = tier;
        merged.id = tier;
        if (tier === 'guest' && merged.pages) merged.pages.dashboard = false;
        store.overrides[tier] = merged;
      });
      store.updatedAt = Date.now();
      try {
        var json = JSON.stringify(store);
        localStorage.setItem(STORAGE_KEY, json);
        localStorage.setItem(MIRROR_KEY, json);
      } catch (e) { /* ignore */ }

      return patchAdminEntitlementsStore(store).then(function (apiResult) {
        if (!apiResult.ok) return apiResult;
        _hydratedCache = store;
        notifyPlansUpdated(store.updatedAt);
        return { ok: true };
      });
    },

    savePlan: function (planKey, data) {
      var store = loadStore();
      var tier = (data.tier || '').trim().toLowerCase().replace(/\s+/g, '_');
      if (!tier) return { ok: false, error: 'Tier code là bắt buộc' };
      if (!data.name || !data.name.trim()) return { ok: false, error: 'Tên plan là bắt buộc' };

      data.tier = tier;
      data.subtitle = data.subtitle || (data.desc || '').slice(0, 48);
      data.promoPct = Math.min(100, Math.max(0, parseInt(data.promoPct, 10) || 0));
      data.pricePromo = 0;

      if (planKey === 'new' || !planKey) {
        var exists = BASE[tier] || store.custom.some(function (p) { return p.tier === tier; });
        if (exists) return { ok: false, error: 'Tier "' + tier + '" đã tồn tại' };
        data.id = 'custom-' + tier;
        data.builtin = false;
        data.subs = data.subs || 0;
        data.mrr = data.mrr || 0;
        store.custom.push(data);
        saveStore(store);
        return { ok: true, id: data.id };
      }

      if (BASE[planKey]) {
        if (data.ent && !Object.keys(data.ent).length) delete data.ent;
        var prev = store.overrides[planKey] || {};
        var merged = Object.assign({}, prev, data);
        ['pages', 'blocks', 'actions', 'limits', 'ent'].forEach(function (k) {
          if (data[k]) merged[k] = Object.assign({}, prev[k] || {}, data[k]);
        });
        merged.tier = planKey;
        merged.id = planKey;
        store.overrides[planKey] = merged;
        saveStore(store);
        return { ok: true, id: planKey };
      }

      var idx = store.custom.findIndex(function (p) { return p.id === planKey || p.tier === planKey; });
      if (idx >= 0) {
        data.id = store.custom[idx].id;
        data.builtin = false;
        store.custom[idx] = Object.assign({}, store.custom[idx], data);
        saveStore(store);
        return { ok: true, id: data.id };
      }

      return { ok: false, error: 'Không tìm thấy plan' };
    },

    collectForm: function () {
      var data = {
        name: document.getElementById('field-name').value.trim(),
        tier: document.getElementById('field-tier').value.trim(),
        sort: parseInt(document.getElementById('field-sort').value, 10) || 4,
        desc: document.getElementById('field-desc').value.trim(),
        apple: document.getElementById('field-apple').value.trim(),
        google: document.getElementById('field-google').value.trim(),
        web: document.getElementById('field-web').value.trim(),
        appleYearly: document.getElementById('field-apple-yearly').value.trim(),
        googleYearly: document.getElementById('field-google-yearly').value.trim(),
        webYearly: document.getElementById('field-web-yearly').value.trim(),
        appleLifetime: document.getElementById('field-apple-lifetime').value.trim(),
        googleLifetime: document.getElementById('field-google-lifetime').value.trim(),
        webLifetime: document.getElementById('field-web-lifetime').value.trim(),
        trial: parseInt(document.getElementById('field-trial').value, 10) || 0,
        priceMonth: parseInt(document.getElementById('field-price-month').value, 10) || 0,
        priceYear: parseInt(document.getElementById('field-price-year').value, 10) || 0,
        priceLifetime: parseInt(document.getElementById('field-price-lifetime').value, 10) || 0,
        promoPct: Math.min(100, Math.max(0, parseInt(document.getElementById('field-promo-pct').value, 10) || 0)),
        pricePromo: 0,
        lifetimeEnabled: document.getElementById('field-lifetime-enabled').checked,
        icon: document.getElementById('field-icon').value,
        iconClass: document.getElementById('field-icon-class').value,
        purchasable: document.getElementById('field-purchasable').checked,
        status: document.getElementById('field-status').value,
        badge: document.getElementById('field-badge').value,
        tags: document.getElementById('field-tags').value.trim(),
        ent: {}, blocks: {}, limits: {}, pages: {}, actions: {}
      };
      return data;
    },

    fillForm: function (p) {
      document.getElementById('field-name').value = p.name || '';
      document.getElementById('field-tier').value = p.tier || '';
      document.getElementById('field-sort').value = p.sort || '';
      document.getElementById('field-desc').value = p.desc || '';
      document.getElementById('field-apple').value = p.apple || '';
      document.getElementById('field-google').value = p.google || '';
      document.getElementById('field-web').value = p.web || '';
      document.getElementById('field-apple-yearly').value = p.appleYearly || '';
      document.getElementById('field-google-yearly').value = p.googleYearly || '';
      document.getElementById('field-web-yearly').value = p.webYearly || '';
      document.getElementById('field-apple-lifetime').value = p.appleLifetime || '';
      document.getElementById('field-google-lifetime').value = p.googleLifetime || '';
      document.getElementById('field-web-lifetime').value = p.webLifetime || '';
      document.getElementById('field-trial').value = p.trial || 0;
      document.getElementById('field-price-month').value = p.priceMonth || 0;
      document.getElementById('field-price-year').value = p.priceYear || 0;
      document.getElementById('field-price-lifetime').value = p.priceLifetime || 0;
      var promoPct = (p.promoPct != null && p.promoPct !== '') ? Number(p.promoPct) : null;
      if (promoPct == null && p.pricePromo > 0 && p.priceMonth > 0 && p.pricePromo < p.priceMonth) {
        promoPct = Math.round((p.priceMonth - p.pricePromo) / p.priceMonth * 100);
      }
      document.getElementById('field-promo-pct').value = promoPct != null ? promoPct : 0;
      document.getElementById('field-lifetime-enabled').checked = !!p.lifetimeEnabled;
      document.getElementById('field-icon').value = p.icon || 'ti-package';
      document.getElementById('field-icon-class').value = p.iconClass || 'accent';
      if (typeof global.updatePlanIconPreview === 'function') global.updatePlanIconPreview();
      document.getElementById('field-purchasable').checked = !!p.purchasable;
      document.getElementById('field-tags').value = p.tags || '';
      document.getElementById('field-badge').value = p.badge || '';
      document.getElementById('field-status').value = p.status || 'published';
      if (document.getElementById('stat-subs')) {
        document.getElementById('stat-subs').textContent = formatSubs(p.subs);
      }
      if (document.getElementById('stat-mrr')) {
        document.getElementById('stat-mrr').textContent = p.mrr ? formatVnd(p.mrr) : '₫0';
      }
    },

    renderTableRows: function (tbody, options) {
      options = options || {};
      var filters = options.filters || null;
      var search = options.search || '';
      var plans = this.listPlans().filter(function (p) {
        return matchesFilters(p, filters) && matchesSearch(p, search);
      });

      if (!plans.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có plan phù hợp bộ lọc.</td></tr>';
        return;
      }

      tbody.innerHTML = plans.map(function (p) {
        var st = statusLabel(p.status);
        var isGuest = p.tier === 'guest';
        var monthPrice = isGuest ? '—' : formatVnd(p.priceMonth);
        var yearPrice = isGuest ? '—' : (p.priceYear ? formatVnd(p.priceYear) : '—');
        var lifetimePrice = isGuest ? '—' : (p.lifetimeEnabled && p.priceLifetime ? formatVnd(p.priceLifetime) : '—');
        var sku = isGuest ? 'Website công khai' : (p.apple || p.google || p.web || '—');
        var editKey = p.builtin ? p.tier : (p.id || p.tier);
        var canDelete = !p.builtin;
        return '<tr data-plan-id="' + escapeHtml(p.id || p.tier) + '">' +
          '<td><input type="checkbox" class="ix-checkbox" /></td>' +
          '<td><div style="display:flex;align-items:center;gap:10px">' +
            '<div class="ix-stat-icon ' + escapeHtml(p.iconClass || 'accent') + '" style="width:36px;height:36px;font-size:16px;border-radius:6px"><i class="ti ' + escapeHtml(p.icon || 'ti-package') + '"></i></div>' +
            '<div><div style="font-size:13px;font-weight:500;color:var(--ix-text-primary)">' + escapeHtml(p.name) + '</div>' +
            '<div style="font-size:11px;color:var(--ix-text-muted)">' + escapeHtml(p.subtitle || '') + '</div></div></div></td>' +
          '<td style="color:var(--ix-text-primary);font-weight:500">' + monthPrice + '</td>' +
          '<td>' + yearPrice + '</td>' +
          '<td>' + lifetimePrice + '</td>' +
          '<td style="font-size:12px">' + escapeHtml(sku) + '</td>' +
          '<td>' + formatSubs(p.subs) + '</td>' +
          '<td><span class="ix-chip ' + st.chip + '">' + st.text + '</span></td>' +
          '<td><div style="display:flex;gap:4px">' +
            '<a href="plan-edit.html?plan=' + encodeURIComponent(editKey) + '" class="ix-btn ix-btn-icon" title="Xem / Sửa"><i class="ti ti-edit" style="font-size:14px"></i></a>' +
            (canDelete ? '<button type="button" class="ix-btn ix-btn-icon" data-delete-plan="' + escapeHtml(p.id || p.tier) + '" title="Xoá"><i class="ti ti-trash" style="font-size:14px"></i></button>' : '') +
          '</div></td></tr>';
      }).join('');
    },

    deletePlan: function (id) {
      if (!id) return { ok: false, error: 'Không xác định được plan' };
      if (BASE[id]) return { ok: false, error: 'Không thể xoá gói hệ thống (Vãng lai/Free/Premium/Elite). Chọn trạng thái Ẩn nếu muốn ngừng bán.' };
      var store = loadStore();
      var before = store.custom.length;
      store.custom = store.custom.filter(function (p) { return p.id !== id && p.tier !== id; });
      if (store.custom.length === before) return { ok: false, error: 'Không tìm thấy plan để xoá' };
      saveStore(store);
      return { ok: true };
    },

    deleteCustom: function (id) {
      return this.deletePlan(id);
    },

    getFiltersFromDom: function () {
      var statusEl = document.getElementById('filter-status');
      var cycleEl = document.getElementById('filter-cycle');
      var channelEl = document.getElementById('filter-channel');
      return {
        status: statusEl && statusEl.value ? statusEl.value : '',
        cycle: cycleEl && cycleEl.value ? cycleEl.value : '',
        channel: channelEl && channelEl.value ? channelEl.value : ''
      };
    },

    refreshListPage: function () {
      var tbody = document.getElementById('plans-tbody');
      if (!tbody) return;
      var searchEl = document.getElementById('plans-search');
      var search = searchEl ? searchEl.value.trim() : '';
      this.renderTableRows(tbody, { filters: this.getFiltersFromDom(), search: search });
    },

    initIconPicker: function () {
      var iconSel = document.getElementById('field-icon');
      var classSel = document.getElementById('field-icon-class');
      if (!iconSel || iconSel.options.length) return;

      ICON_PRESETS.forEach(function (item) {
        var opt = document.createElement('option');
        opt.value = item.icon;
        opt.textContent = item.label;
        iconSel.appendChild(opt);
      });
      ICON_CLASSES.forEach(function (cls) {
        var opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls.charAt(0).toUpperCase() + cls.slice(1);
        classSel.appendChild(opt);
      });

      function updatePreview() {
        var preview = document.getElementById('icon-preview');
        if (!preview) return;
        preview.className = 'ix-stat-icon ' + (classSel.value || 'accent');
        preview.style.cssText = 'width:44px;height:44px;font-size:20px;border-radius:8px';
        preview.innerHTML = '<i class="ti ' + (iconSel.value || 'ti-package') + '"></i>';
      }
      global.updatePlanIconPreview = updatePreview;
      iconSel.addEventListener('change', updatePreview);
      classSel.addEventListener('change', updatePreview);
      updatePreview();
    }
  };

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  global.PlansStore.formatVnd = formatVnd;
  global.PlansStore.ICON_PRESETS = ICON_PRESETS;
  global.PlansStore.ICON_CLASSES = ICON_CLASSES;
})(window);
