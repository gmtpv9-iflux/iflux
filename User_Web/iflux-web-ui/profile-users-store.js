/* Thư mục hồ sơ công khai — sandbox localStorage */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_public_users_v1';

  var SEED = [
    { id: 'usr_demo_001', display_name: 'Nguyễn Văn Minh', username: '@minh.ndt', role: 'Thành viên', tier_label: 'Premium', bio: 'Nhà đầu tư cá nhân — theo dõi dòng tiền và ngành.', joined_at: '15/01/2024', country: 'Việt Nam', stats: { posts: 42, followers: 128, following: 87 } },
    { id: 'usr_ctv_01', display_name: 'Trần Anh Khoa', username: '@khoa.ctv', role: 'CTV', tier_label: 'CTV', bio: 'Phân tích ngành & chủ đề.', joined_at: '02/03/2024', stats: { posts: 86, followers: 920, following: 41 } },
    { id: 'u2', display_name: 'Lan Hương', username: '@lan.huong', role: 'Phân tích', tier_label: 'Premium', bio: '', joined_at: '10/05/2024', stats: { posts: 56, followers: 1280, following: 34 } },
    { id: 'u3', display_name: 'Đức Anh', username: '@duc.anh', role: 'Sáng tạo', tier_label: 'Premium', bio: '', joined_at: '18/06/2024', stats: { posts: 31, followers: 890, following: 52 } },
    { id: 'u4', display_name: 'Thu Hà', username: '@thu.ha', role: 'Thành viên', tier_label: 'Miễn phí', bio: '', joined_at: '22/07/2024', stats: { posts: 18, followers: 456, following: 28 } },
    { id: 'u5', display_name: 'Quốc Bảo', username: '@qb.trader', role: 'Chuyên gia cộng đồng', tier_label: 'Elite', bio: '', joined_at: '01/04/2024', stats: { posts: 120, followers: 2100, following: 65 } },
    { id: 'u6', display_name: 'Hoàng Nam', username: '@hoang.nam', role: 'Phân tích', tier_label: 'Miễn phí', bio: '', joined_at: '08/08/2024', stats: { posts: 12, followers: 670, following: 45 } },
    { id: 'u7', display_name: 'Anh Nguyên', username: '@anh.nguyen', role: 'Thành viên', tier_label: 'Premium', bio: '', joined_at: '14/09/2024', stats: { posts: 24, followers: 340, following: 19 } },
    { id: 'u8', display_name: 'Violet Long', username: '@violet.l', role: 'Thành viên', tier_label: 'Premium', bio: '', joined_at: '20/10/2024', stats: { posts: 9, followers: 210, following: 11 } }
  ];

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function readDir() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeDir(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function fromAuthUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      display_name: user.display_name,
      username: user.username || '',
      role: user.role || 'Thành viên',
      tier_label: user.tier_label || user.tier || 'Miễn phí',
      bio: user.bio || '',
      joined_at: user.joined_at || '—',
      country: user.country || '',
      avatar_url: user.avatar_url || '',
      stats: user.stats || { posts: 0, followers: 0, following: 0 }
    };
  }

  function isPlaceholderId(id) {
    return !id || id === 'usr' || id === 'usr_local' || id === 'anon' || id === 'anonymous';
  }

  function repairDirectory() {
    var dir = readDir();
    var changed = false;
    SEED.forEach(function (s) {
      if (dir[s.id]) {
        delete dir[s.id];
        changed = true;
      }
    });
    if (changed) writeDir(dir);
  }

  repairDirectory();

  function findSeed(id) {
    return SEED.find(function (u) { return u.id === id; }) || null;
  }

  function findCustomer(id) {
    if (!global.IfluxCustomersStore) return null;
    var c = IfluxCustomersStore.getCustomerById(id);
    if (!c) return null;
    return {
      id: c.id,
      display_name: c.name,
      username: c.affiliate ? ('@' + String(c.affiliate).toLowerCase().replace(/[^a-z0-9._-]/g, '')) : '',
      role: c.role || 'Thành viên',
      tier_label: c.package || 'Miễn phí',
      bio: '',
      joined_at: '—',
      stats: { posts: 0, followers: 0, following: 0 }
    };
  }

  function getPublic(userId) {
    if (!userId || isPlaceholderId(userId)) return null;

    var seed = findSeed(userId);
    if (seed) return JSON.parse(JSON.stringify(seed));

    var session = global.IfluxAuth && IfluxAuth.getUser();
    if (session && session.id === userId) return fromAuthUser(session);

    var dir = readDir();
    if (dir[userId]) return dir[userId];

    var customer = findCustomer(userId);
    if (customer) return customer;

    return null;
  }

  function savePublic(profile) {
    if (!profile || !profile.id) return profile;
    var dir = readDir();
    dir[profile.id] = Object.assign({}, dir[profile.id] || {}, profile);
    writeDir(dir);
    return dir[profile.id];
  }

  function ensureMinimal(userId, userName) {
    if (!userId || isPlaceholderId(userId)) return null;
    var seed = findSeed(userId);
    if (seed) return JSON.parse(JSON.stringify(seed));

    var existing = getPublic(userId);
    if (existing) return existing;

    return savePublic({
      id: userId,
      display_name: userName || 'Thành viên',
      username: '',
      role: 'Thành viên',
      tier_label: 'Miễn phí',
      bio: '',
      joined_at: '—',
      stats: { posts: 0, followers: 0, following: 0 }
    });
  }

  global.IfluxProfileUsersStore = {
    getPublic: getPublic,
    ensureMinimal: ensureMinimal,
    savePublic: savePublic,
    initials: initials
  };
})(window);
