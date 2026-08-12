/* Affiliate — chuỗi giới thiệu F0/F1/F2 + hoa hồng khi mua gói (localStorage sandbox) */
(function (global) {
  'use strict';

  var CONFIG_KEY = 'iflux_loyalty_affiliate_config_v1';
  var EVENTS_KEY = 'iflux_loyalty_affiliate_events_v2';
  var EVENTS_LEGACY_KEY = 'iflux_loyalty_affiliate_events_v1';
  var PARENTS_KEY = 'iflux_referral_parents_v1';
  var MEMBERS_META_KEY = 'iflux_referral_members_meta_v1';
  var REF_COOKIE = 'iflux_ref_code';
  var REF_STORAGE = 'iflux_ref_code';
  var REF_FROM_LINK_KEY = 'iflux_ref_from_link';
  var REFERRER_DIR_KEY = 'iflux_referral_directory_v1';
  var USERS_CACHE_KEY = 'iflux_referral_users_cache_v1';

  var DEFAULT_CONFIG = {
    enabled: true,
    f0_pct: 10,
    f1_pct: 5,
    f2_pct: 2.5,
    min_payout: 100000,
    cookie_days: 30
  };

  var LAYERS = ['F0', 'F1', 'F2'];

  function userWebPathPrefix() {
    var path = (global.location && global.location.pathname) || '';
    var idx = path.indexOf('/User_Web/');
    if (idx >= 0) return path.slice(0, idx + '/User_Web/'.length);
    return '/User_Web/';
  }

  function appOrigin() {
    var origin = global.location && global.location.origin;
    if (origin && origin !== 'null') return origin;
    return '';
  }

  /* Incoming publicId — delegate Affiliate Context sole owner (OD-AFF-02). */
  function parsePublicIdFromPath(loc) {
    loc = loc || global.location;
    if (!loc) return '';
    var AR = global.IfluxAffiliateResolver;
    if (AR && typeof AR.parseAffiliatePath === 'function') {
      var hit = AR.parseAffiliatePath(loc.pathname || '');
      return hit && hit.publicId ? hit.publicId : '';
    }
    return '';
  }

  function hasPublicIdInPath(loc) {
    return !!parsePublicIdFromPath(loc);
  }

  function buildReferralLink(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return '';
    if (!/^IFL[A-Z0-9]{5,17}$/.test(code)) return '';
    /* AC-NAV-ROOT — affiliate root = /{publicId} only; không /nha-cua-toi */
    var origin = (appOrigin() || 'https://iflux.vn').replace(/\/$/, '');
    var canonical = origin + '/';
    var SF = global.IfluxShareFoundation || global.IfluxInsightShareStore;
    if (SF && SF.decorateAffiliateRef) {
      return SF.decorateAffiliateRef(canonical, code);
    }
    return origin + '/' + code;
  }

  function getReferralLinkForUser(user) {
    if (!user || !user.referral_code) return '';
    return buildReferralLink(user.referral_code);
  }

  function isRefFromAffiliateLink() {
    var AR = global.IfluxAffiliateResolver;
    if (AR && AR.readActive && AR.readActive()) return true;
    return false;
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function getConfig() {
    return Object.assign({}, DEFAULT_CONFIG, readJson(CONFIG_KEY, {}));
  }

  function readMembersMeta() {
    return readJson(MEMBERS_META_KEY, {});
  }

  function writeMembersMeta(map) {
    writeJson(MEMBERS_META_KEY, map);
  }

  function getMemberMeta(userId) {
    var meta = readMembersMeta()[userId] || {};
    return {
      joinedAt: meta.joinedAt || new Date().toISOString().slice(0, 10),
      tier: meta.tier || 'free',
      status: meta.status || 'active',
      accountStatus: meta.accountStatus || 'active',
      purchases: meta.purchases != null ? meta.purchases : 0
    };
  }

  function readParents() {
    return readJson(PARENTS_KEY, {});
  }

  function writeParents(map) {
    writeJson(PARENTS_KEY, map);
  }

  function readEventsMap() {
    var map = readJson(EVENTS_KEY, null);
    if (map && typeof map === 'object' && !Array.isArray(map)) return map;
    migrateEventsFromLegacy();
    return readJson(EVENTS_KEY, {});
  }

  function migrateEventsFromLegacy() {
    var legacy = readJson(EVENTS_LEGACY_KEY, []);
    if (!Array.isArray(legacy) || !legacy.length) {
      if (!readJson(EVENTS_KEY, null)) writeJson(EVENTS_KEY, {});
      try { localStorage.removeItem(EVENTS_LEGACY_KEY); } catch (e) { /* ignore */ }
      return;
    }
    var map = {};
    legacy.forEach(function (e) {
      if (!e || !e.beneficiaryId || isLegacyDemoAffiliateEvent(e)) return;
      var bid = String(e.beneficiaryId);
      if (!map[bid]) map[bid] = [];
      map[bid].push(e);
    });
    writeJson(EVENTS_KEY, map);
    try { localStorage.removeItem(EVENTS_LEGACY_KEY); } catch (e2) { /* ignore */ }
  }

  function readEventsForUser(beneficiaryId) {
    if (!beneficiaryId) return [];
    var map = readEventsMap();
    return (map[String(beneficiaryId)] || []).slice();
  }

  function writeEventsForUser(beneficiaryId, list) {
    if (!beneficiaryId) return;
    var map = readEventsMap();
    map[String(beneficiaryId)] = list || [];
    writeJson(EVENTS_KEY, map);
  }

  function readEvents() {
    var map = readEventsMap();
    var out = [];
    Object.keys(map).forEach(function (uid) {
      (map[uid] || []).forEach(function (e) { out.push(e); });
    });
    return out;
  }

  function writeEvents(list) {
    var map = {};
    (list || []).forEach(function (e) {
      if (!e || !e.beneficiaryId) return;
      var bid = String(e.beneficiaryId);
      if (!map[bid]) map[bid] = [];
      map[bid].push(e);
    });
    writeJson(EVENTS_KEY, map);
  }

  var LEGACY_DEMO_IDS = ['usr_demo_001', 'usr_ref_b', 'usr_ref_c', 'usr_ref_d'];

  function useApiAffiliate() {
    if (global.IfluxData && IfluxData.isApi && IfluxData.isApi()) return true;
    var token = global.IfluxAuth && IfluxAuth.getToken && IfluxAuth.getToken();
    return !!(token && token.indexOf('mock_jwt_') !== 0 &&
      global.IfluxApiClient && IfluxApiClient.getAffiliateSync);
  }

  function isLegacyDemoAffiliateId(id) {
    return LEGACY_DEMO_IDS.indexOf(String(id || '')) >= 0;
  }

  function isLegacyDemoAffiliateEvent(evt) {
    if (!evt) return false;
    if (String(evt.id || '').indexOf('evt_seed_') === 0) return true;
    if (isLegacyDemoAffiliateId(evt.beneficiaryId)) return true;
    if (isLegacyDemoAffiliateId(evt.buyerId)) return true;
    return false;
  }

  function purgeLegacyDemoAffiliateData() {
    var parents = readParents();
    var parentsChanged = false;
    LEGACY_DEMO_IDS.forEach(function (id) {
      if (parents[id]) {
        delete parents[id];
        parentsChanged = true;
      }
    });
    Object.keys(parents).forEach(function (childId) {
      if (isLegacyDemoAffiliateId(parents[childId])) {
        delete parents[childId];
        parentsChanged = true;
      }
    });
    if (parentsChanged) writeParents(parents);

    var meta = readMembersMeta();
    var metaChanged = false;
    LEGACY_DEMO_IDS.forEach(function (id) {
      if (meta[id]) {
        delete meta[id];
        metaChanged = true;
      }
    });
    if (metaChanged) writeMembersMeta(meta);

    var events = readEvents();
    var cleanEvents = events.filter(function (e) { return !isLegacyDemoAffiliateEvent(e); });
    if (cleanEvents.length !== events.length) writeEvents(cleanEvents);
  }

  function avatarClassFromName(name) {
    var classes = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];
    var sum = 0;
    var i;
    for (i = 0; i < (name || '').length; i++) sum += name.charCodeAt(i);
    return classes[sum % classes.length];
  }

  function initialsFromName(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function cacheUserRecord(user) {
    if (!user || !user.id) return;
    var map = readJson(USERS_CACHE_KEY, {});
    map[String(user.id)] = {
      id: String(user.id),
      display_name: user.display_name || 'Thành viên',
      referral_code: user.referral_code || ''
    };
    writeJson(USERS_CACHE_KEY, map);
    if (user.referral_code) cacheReferrer(user.referral_code, map[String(user.id)]);
  }

  function getCachedUserRecord(userId) {
    if (!userId) return null;
    return readJson(USERS_CACHE_KEY, {})[String(userId)] || null;
  }

  function mergeServerSync(payload, beneficiaryId) {
    if (!payload || !beneficiaryId) return false;
    beneficiaryId = String(beneficiaryId);

    purgeLegacyDemoAffiliateData();

    var parents = readParents();
    Object.keys(payload.parentsMap || {}).forEach(function (childId) {
      if (payload.parentsMap[childId]) {
        parents[String(childId)] = String(payload.parentsMap[childId]);
      }
    });
    writeParents(parents);

    var meta = readMembersMeta();
    (payload.members || []).forEach(function (m) {
      if (!m || !m.id) return;
      meta[String(m.id)] = {
        joinedAt: String(m.joined_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        tier: m.tier || 'free',
        status: m.status || 'active',
        accountStatus: m.account_status || 'active',
        purchases: m.purchases || 0
      };
    });
    writeMembersMeta(meta);

    (payload.users || []).forEach(cacheUserRecord);

    var serverEvents = (payload.events || []).filter(function (srvEvt) {
      return srvEvt && String(srvEvt.beneficiaryId) === beneficiaryId;
    });
    writeEventsForUser(beneficiaryId, serverEvents);

    return true;
  }

  var syncPromise = null;
  function syncFromServerAsync(userId) {
    userId = userId ? String(userId) : '';
    if (!userId) return Promise.resolve(false);
    if (!global.IfluxApiClient || !IfluxApiClient.getAffiliateSync) return Promise.resolve(false);
    var token = global.IfluxAuth && IfluxAuth.getToken && IfluxAuth.getToken();
    if (!token || token.indexOf('mock_jwt_') === 0) return Promise.resolve(false);

    if (syncPromise) return syncPromise;
    syncPromise = IfluxApiClient.getAffiliateSync(token).then(function (payload) {
      mergeServerSync(payload, userId);
      return true;
    }).catch(function () {
      return false;
    }).finally(function () {
      syncPromise = null;
    });
    return syncPromise;
  }

  function cacheReferrer(code, referrer) {
    code = String(code || '').trim().toUpperCase();
    if (!code || !referrer || !referrer.id) return;
    var map = readJson(REFERRER_DIR_KEY, {});
    map[code] = {
      id: String(referrer.id),
      display_name: referrer.display_name || 'Thành viên',
      referral_code: referrer.referral_code || code
    };
    writeJson(REFERRER_DIR_KEY, map);
  }

  function getCachedReferrer(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return null;
    var hit = readJson(REFERRER_DIR_KEY, {})[code];
    return hit || null;
  }

  function getProfileUser(userId) {
    if (!userId) return null;
    try {
      var raw = localStorage.getItem('iflux_user_profiles_v1');
      if (!raw) return null;
      var data = JSON.parse(raw);
      var u = data.byId && data.byId[userId];
      if (!u) return null;
      return {
        id: String(u.id),
        display_name: u.display_name || 'Thành viên',
        referral_code: u.referral_code || ''
      };
    } catch (e) {
      return null;
    }
  }

  function formatVnd(n) {
    return '₫' + Number(n || 0).toLocaleString('vi-VN');
  }

  function findProfileByReferralCode(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return null;
    try {
      var raw = localStorage.getItem('iflux_user_profiles_v1');
      if (!raw) return null;
      var data = JSON.parse(raw);
      var seen = {};
      var buckets = [data.byId, data.byEmail, data.byPhone];
      var i;
      var b;
      var key;
      var u;
      for (i = 0; i < buckets.length; i++) {
        b = buckets[i];
        if (!b) continue;
        for (key in b) {
          if (!Object.prototype.hasOwnProperty.call(b, key)) continue;
          u = b[key];
          if (!u || !u.id || seen[u.id]) continue;
          seen[u.id] = true;
          if (String(u.referral_code || '').toUpperCase() === code) {
            return {
              id: u.id,
              display_name: u.display_name || 'Thành viên',
              referral_code: u.referral_code
            };
          }
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function findUserByReferralCode(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return null;

    var fromProfile = findProfileByReferralCode(code);
    if (fromProfile) return fromProfile;

    var cached = getCachedReferrer(code);
    if (cached) return cached;

    var session = readJson('iflux_user_session', null);
    if (session && session.user && String(session.user.referral_code || '').toUpperCase() === code) {
      return session.user;
    }

    if (global.IfluxCustomersStore) {
      var list = IfluxCustomersStore.listCustomers();
      var i;
      for (i = 0; i < list.length; i++) {
        if (String(list[i].affiliate || '').toUpperCase() === code) {
          return {
            id: list[i].id,
            display_name: list[i].name,
            referral_code: list[i].affiliate
          };
        }
      }
    }

    return null;
  }

  function resolveUser(userId) {
    if (!userId) return null;
    var fromProfile = getProfileUser(userId);
    if (fromProfile) return fromProfile;
    var fromCache = getCachedUserRecord(userId);
    if (fromCache) return fromCache;
    var session = readJson('iflux_user_session', null);
    if (session && session.user && session.user.id === userId) return session.user;
    if (global.IfluxCustomersStore) {
      var c = IfluxCustomersStore.getCustomerById(userId);
      if (c) return { id: c.id, display_name: c.name, referral_code: c.affiliate };
    }
    return { id: userId, display_name: 'Thành viên', referral_code: '' };
  }

  function getUplineChain(buyerId, maxDepth) {
    maxDepth = maxDepth || 3;
    var parents = readParents();
    var chain = [];
    var current = buyerId;
    var depth = 0;
    var visited = {};

    while (depth < maxDepth) {
      var parentId = parents[current];
      if (!parentId || visited[parentId]) break;
      chain.push(parentId);
      visited[parentId] = true;
      current = parentId;
      depth++;
    }
    return chain;
  }

  function buildSourceNote(layer, uplineIndex, uplineChain, buyer) {
    if (layer === 'F0') return 'Giới thiệu trực tiếp mua hàng';
    if (layer === 'F1' && uplineIndex >= 1) {
      var mid = resolveUser(uplineChain[uplineIndex - 1]);
      return mid ? ('F0 của ' + mid.display_name) : 'Giới thiệu cấp 2';
    }
    if (layer === 'F2') return 'Chuỗi F1 → F2';
    return 'Giới thiệu gián tiếp';
  }

  function getStoredRefCode() {
    var AR = global.IfluxAffiliateResolver;
    if (AR && AR.getCodeForIdentityCreation) {
      return AR.getCodeForIdentityCreation() || '';
    }
    return '';
  }

  function clearStoredRefCode() {
    var AR = global.IfluxAffiliateResolver;
    if (AR && AR.clearContext) {
      AR.clearContext();
    }
  }

  function getReferredByFromProfile(userId) {
    if (!userId) return null;
    try {
      var raw = localStorage.getItem('iflux_user_profiles_v1');
      if (!raw) return null;
      var data = JSON.parse(raw);
      var u = data.byId && data.byId[userId];
      return u && u.referred_by ? String(u.referred_by) : null;
    } catch (e) {
      return null;
    }
  }

  function ensureBuyerReferralLink(buyer, referrerUserId) {
    if (!buyer || !buyer.id) return;
    var parents = readParents();
    var buyerId = String(buyer.id);
    if (referrerUserId) {
      setReferrer(buyerId, String(referrerUserId));
      return;
    }
    if (parents[buyerId]) return;
    var referredBy = buyer.referred_by || getReferredByFromProfile(buyerId);
    if (referredBy) setReferrer(buyerId, String(referredBy));
  }

  function resolveUplines(buyer, meta) {
    meta = meta || {};
    if (!buyer || !buyer.id) return [];
    ensureBuyerReferralLink(buyer, meta.referrerUserId);
    var chain = getUplineChain(String(buyer.id), 3);
    if (chain.length) return chain;

    var result = [];
    var visited = {};
    var current = String(buyer.id);
    var depth = 0;
    while (depth < 3) {
      var ref = readParents()[current] || getReferredByFromProfile(current);
      if (!ref && depth === 0 && buyer.referred_by) ref = String(buyer.referred_by);
      if (!ref || visited[ref]) break;
      ref = String(ref);
      result.push(ref);
      visited[ref] = true;
      if (!readParents()[current]) setReferrer(current, ref);
      current = ref;
      depth++;
    }
    return result;
  }

  function validateReferralCodeAsync(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return Promise.resolve({ valid: false, code: '', referrer: null });

    var local = validateReferralCode(code);
    if (local.valid) return Promise.resolve(local);

    if (global.IfluxApiClient && IfluxApiClient.validateReferralCode) {
      return IfluxApiClient.validateReferralCode(code).then(function (res) {
        if (!res || !res.valid || !res.referrerId) {
          return { valid: false, code: code, referrer: null };
        }
        var referrer = {
          id: String(res.referrerId),
          display_name: res.displayName || 'Thành viên',
          referral_code: res.code || code
        };
        cacheReferrer(code, referrer);
        return {
          valid: true,
          code: code,
          referrer: referrer
        };
      }).catch(function () {
        return local;
      });
    }
    return Promise.resolve(local);
  }

  function applyReferralFromServer(userId, referrerId, refCode) {
    if (!userId || !referrerId || userId === referrerId) return null;
    userId = String(userId);
    referrerId = String(referrerId);
    var parents = readParents();
    var isNew = parents[userId] !== referrerId;
    setReferrer(userId, referrerId);
    if (refCode) cacheReferrer(refCode, resolveUser(referrerId) || { id: referrerId, referral_code: refCode });

    var meta = readMembersMeta();
    if (!meta[userId]) {
      meta[userId] = {
        joinedAt: new Date().toISOString().slice(0, 10),
        tier: 'free',
        status: 'active',
        accountStatus: 'active',
        purchases: 0
      };
      writeMembersMeta(meta);
    }

    return referrerId;
  }

  function syncReferralParentFromUser(user) {
    if (!user || !user.id || !user.referred_by) return;
    if (!readParents()[user.id]) setReferrer(user.id, user.referred_by);
  }

  function getReferrerId(userId) {
    if (!userId) return null;
    return readParents()[userId] || null;
  }

  function validateReferralCode(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return { valid: false, code: '', referrer: null };
    var referrer = findUserByReferralCode(code);
    if (!referrer) return { valid: false, code: code, referrer: null };
    cacheReferrer(code, referrer);
    return { valid: true, code: code, referrer: referrer };
  }

  function applyReferralAtSignup(userId, code, opts) {
    opts = opts || {};
    if (!userId || !code) return null;
    code = String(code).trim().toUpperCase();
    userId = String(userId);

    var parents = readParents();
    if (parents[userId] && !opts.force) return parents[userId];

    var check = validateReferralCode(code);
    if (!check.valid || !check.referrer) {
      if (!opts.silent) throw new Error('Mã giới thiệu không hợp lệ.');
      return null;
    }
    if (String(check.referrer.id) === userId) {
      if (!opts.silent) throw new Error('Không thể dùng mã giới thiệu của chính bạn.');
      return null;
    }

    return applyReferralFromServer(userId, check.referrer.id, code);
  }

  function applyReferralAtSignupAsync(userId, code, opts) {
    opts = opts || {};
    if (!userId || !code) return Promise.resolve(null);
    userId = String(userId);
    code = String(code).trim().toUpperCase();
    if (readParents()[userId] && !opts.force) {
      return Promise.resolve(readParents()[userId]);
    }
    return validateReferralCodeAsync(code).then(function (check) {
      if (!check.valid || !check.referrer) {
        if (!opts.silent) throw new Error('Mã giới thiệu không hợp lệ.');
        return null;
      }
      if (String(check.referrer.id) === userId) {
        if (!opts.silent) throw new Error('Không thể dùng mã giới thiệu của chính bạn.');
        return null;
      }
      var referrerId = applyReferralFromServer(userId, check.referrer.id, code);
      if (opts.clearStored !== false) clearStoredRefCode();
      return referrerId;
    });
  }

  function setReferrer(userId, referrerId) {
    if (!userId || !referrerId || userId === referrerId) return;
    var parents = readParents();
    parents[String(userId)] = String(referrerId);
    writeParents(parents);
  }

  function processPurchase(buyer, orderAmount, meta) {
    meta = meta || {};
    if (useApiAffiliate()) return { ok: false, events: [], skipped: 'api_sot' };
    var cfg = getConfig();
    if (!cfg.enabled || !buyer || !buyer.id || !orderAmount) return { ok: false, events: [] };

    var uplines = resolveUplines(buyer, meta);
    var rates = [cfg.f0_pct, cfg.f1_pct, cfg.f2_pct];
    var events = readEvents();
    var created = [];
    var orderId = meta.orderId || ('ord_' + Date.now());
    var at = new Date().toISOString().slice(0, 10);

    uplines.forEach(function (referrerId, idx) {
      if (idx >= 3) return;
      var pct = rates[idx];
      var commission = Math.round(orderAmount * pct / 100);
      if (commission <= 0) return;

      if (events.some(function (e) {
        return e.orderId === orderId && e.beneficiaryId === referrerId && e.layer === LAYERS[idx];
      })) return;

      var referrer = resolveUser(referrerId);
      var layer = LAYERS[idx];
      var evt = {
        id: 'evt_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 6),
        beneficiaryId: referrerId,
        beneficiaryName: referrer.display_name,
        buyerId: buyer.id,
        buyerName: buyer.display_name || 'Thành viên',
        buyerInitials: initialsFromName(buyer.display_name),
        buyerAvatarCls: avatarClassFromName(buyer.display_name),
        layer: layer,
        orderId: orderId,
        orderAmount: orderAmount,
        commissionPct: pct,
        commission: commission,
        productLabel: meta.productLabel || 'Gói cước',
        sourceNote: buildSourceNote(layer, idx, uplines, buyer),
        status: 'pending',
        paid: false,
        at: at
      };
      events.unshift(evt);
      created.push(evt);

      if (global.IfluxInAppNotifications) {
        IfluxInAppNotifications.pushAffiliateCommission(referrerId, evt);
      }
    });

    if (created.length) writeEvents(events);

    var membersMeta = readMembersMeta();
    if (!membersMeta[buyer.id]) {
      membersMeta[buyer.id] = {
        joinedAt: at,
        tier: String(buyer.tier || 'free').toLowerCase(),
        status: 'active',
        purchases: 0
      };
    }
    membersMeta[buyer.id].status = 'purchased';
    membersMeta[buyer.id].purchases = (membersMeta[buyer.id].purchases || 0) + 1;
    membersMeta[buyer.id].tier = String(buyer.tier || membersMeta[buyer.id].tier || 'premium').toLowerCase();
    writeMembersMeta(membersMeta);

    return { ok: true, events: created, orderId: orderId };
  }

  function sumCommissionFromBuyer(beneficiaryId, buyerId) {
    return readEvents().filter(function (e) {
      return e.beneficiaryId === beneficiaryId && e.buyerId === buyerId;
    }).reduce(function (sum, e) { return sum + (e.commission || 0); }, 0);
  }

  function listNetworkMembers(userId, filters) {
    filters = filters || {};
    var q = (filters.q || '').toLowerCase();
    var layerFilter = filters.layer || '';
    var parents = readParents();
    var list = [];

    Object.keys(parents).forEach(function (childId) {
      var chain = getUplineChain(childId, 3);
      var idx = chain.indexOf(userId);
      if (idx < 0 || idx > 2) return;
      var layer = LAYERS[idx];
      if (layerFilter && layer !== layerFilter) return;

      var child = resolveUser(childId);
      var meta = getMemberMeta(childId);
      var viaUser = idx === 0 ? null : resolveUser(chain[idx - 1]);

      if (q) {
        var hay = [
          child.display_name,
          layer,
          viaUser && viaUser.display_name,
          meta.tier,
          child.referral_code,
          meta.accountStatus === 'suspended' ? 'tạm khóa' : 'hoạt động'
        ].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return;
      }

      list.push({
        id: childId,
        display_name: child.display_name,
        referral_code: child.referral_code || '',
        initials: initialsFromName(child.display_name),
        avatarCls: avatarClassFromName(child.display_name),
        layer: layer,
        joinedAt: meta.joinedAt,
        tier: meta.tier,
        status: meta.status,
        accountStatus: meta.accountStatus || 'active',
        purchases: meta.purchases,
        viaName: viaUser ? viaUser.display_name : 'Trực tiếp',
        commissionEarned: sumCommissionFromBuyer(userId, childId)
      });
    });

    list.sort(function (a, b) {
      return String(b.joinedAt).localeCompare(String(a.joinedAt));
    });
    return list;
  }

  function getNetworkStats(userId) {
    var members = listNetworkMembers(userId);
    var events = listForUser(userId);
    var layers = {
      F0: { count: 0, earn: 0 },
      F1: { count: 0, earn: 0 },
      F2: { count: 0, earn: 0 }
    };

    members.forEach(function (m) {
      if (layers[m.layer]) layers[m.layer].count++;
    });
    events.forEach(function (e) {
      if (layers[e.layer]) layers[e.layer].earn += e.commission || 0;
    });

    return {
      totalMembers: members.length,
      layers: layers
    };
  }

  function listForUser(userId, filters) {
    filters = filters || {};
    var q = (filters.q || '').toLowerCase();
    var source = readEventsForUser(userId);
    return source.filter(function (e) {
      if (String(e.beneficiaryId) !== String(userId)) return false;
      if (filters.layer && e.layer !== filters.layer) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (q) {
        var hay = [e.buyerName, e.productLabel, e.sourceNote, e.layer].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function getStatsForUser(userId) {
    var list = listForUser(userId);
    var network = getNetworkStats(userId);
    var totalEarn = 0;
    var unpaid = 0;
    var converted = 0;
    list.forEach(function (e) {
      totalEarn += e.commission || 0;
      if (!e.paid && e.status === 'pending') unpaid += e.commission || 0;
      if (e.orderAmount > 0) converted++;
    });
    var convRate = network.totalMembers
      ? Math.round((listNetworkMembers(userId).filter(function (m) { return m.purchases > 0; }).length / network.totalMembers) * 100)
      : 0;
    return {
      totalEarn: totalEarn,
      unpaid: unpaid,
      signups: network.totalMembers,
      convRate: convRate,
      network: network
    };
  }

  function listAllEvents() {
    return readEvents().filter(function (e) { return !isLegacyDemoAffiliateEvent(e); });
  }

  global.IfluxLoyaltyAffiliateStore = {
    CONFIG_KEY: CONFIG_KEY,
    EVENTS_KEY: EVENTS_KEY,
    PARENTS_KEY: PARENTS_KEY,
    MEMBERS_META_KEY: MEMBERS_META_KEY,
    REF_COOKIE: REF_COOKIE,
    REF_STORAGE: REF_STORAGE,
    getConfig: getConfig,
    parsePublicIdFromPath: parsePublicIdFromPath,
    hasPublicIdInPath: hasPublicIdInPath,
    getStoredRefCode: getStoredRefCode,
    clearStoredRefCode: clearStoredRefCode,
    isRefFromAffiliateLink: isRefFromAffiliateLink,
    validateReferralCode: validateReferralCode,
    validateReferralCodeAsync: validateReferralCodeAsync,
    applyReferralFromServer: applyReferralFromServer,
    applyReferralAtSignupAsync: applyReferralAtSignupAsync,
    applyReferralAtSignup: applyReferralAtSignup,
    getReferrerId: getReferrerId,
    buildReferralLink: buildReferralLink,
    getReferralLinkForUser: getReferralLinkForUser,
    findUserByReferralCode: findUserByReferralCode,
    setReferrer: setReferrer,
    ensureBuyerReferralLink: ensureBuyerReferralLink,
    syncReferralParentFromUser: syncReferralParentFromUser,
    getUplineChain: getUplineChain,
    processPurchase: processPurchase,
    listForUser: listForUser,
    listNetworkMembers: listNetworkMembers,
    getNetworkStats: getNetworkStats,
    getMemberMeta: getMemberMeta,
    listAllEvents: listAllEvents,
    getStatsForUser: getStatsForUser,
    formatVnd: formatVnd,
    resolveUser: resolveUser,
    mergeServerSync: mergeServerSync,
    syncFromServerAsync: syncFromServerAsync,
    initialsFromName: initialsFromName,
    avatarClassFromName: avatarClassFromName
  };
})(window);
