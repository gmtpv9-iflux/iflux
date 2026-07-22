/* Watchlist — thư mục + membership (localStorage sandbox) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_watchlist_v1';
  var DEFAULT_FOLDER_ID = 'watchlist';

  function us() { return global.IfluxUserStorage; }

  function read() {
    var store = us();
    var state = null;
    if (store) {
      try {
        state = store.readJson(STORAGE_KEY, null);
      } catch (e) { /* ignore */ }
    } else {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) state = JSON.parse(raw);
      } catch (e2) { /* ignore */ }
    }
    if (!state) return defaultState();
    var before = JSON.stringify(state);
    state = normalize(state);
    /* Persist R6 rename Watchlist → Theo dõi */
    if (JSON.stringify(state) !== before) {
      try {
        if (store) store.writeJson(STORAGE_KEY, state);
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e3) { /* ignore */ }
    }
    return state;
  }

  function write(state) {
    var store = us();
    if (store) store.writeJson(STORAGE_KEY, normalize(state));
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(state)));
    if (global.IfluxUserDataSync) {
      IfluxUserDataSync.scheduleWatchlistSync(normalize(state));
    }
  }

  function migrateFromLegacyForUser() {
    var store = us();
    if (!store || store.currentUserId() === 'anon') return;
    var state = read();
    if (state.memberships && Object.keys(state.memberships).length) return;
    if (state.folders && state.folders.length > 1) return;
    if (localStorage.getItem(store.scopedKey(STORAGE_KEY))) return;

    var tickers = [];
    if (global.IfluxMockMarket) {
      var snap = IfluxMockMarket.getSnapshot();
      if (snap && snap.watchlist) tickers = snap.watchlist.slice();
    }
    if (!tickers.length) return;
    tickers.forEach(function (t) {
      state.memberships[t] = [DEFAULT_FOLDER_ID];
    });
    write(state);
  }

  function uid() {
    return 'fld_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function defaultState() {
    return {
      folders: [
        { id: DEFAULT_FOLDER_ID, name: 'Theo dõi', locked: true, position: 0 }
      ],
      memberships: {}
    };
  }

  function normalize(state) {
    if (!state.folders || !state.folders.length) {
      state.folders = defaultState().folders;
    }
    var hasDefault = state.folders.some(function (f) { return f.id === DEFAULT_FOLDER_ID; });
    if (!hasDefault) {
      state.folders.unshift({ id: DEFAULT_FOLDER_ID, name: 'Theo dõi', locked: true, position: 0 });
    }
    /* R6: thư mục mặc định cũ tên English → Việt */
    state.folders.forEach(function (f) {
      if (f && f.id === DEFAULT_FOLDER_ID && (f.name === 'Watchlist' || !f.name)) {
        f.name = 'Theo dõi';
      }
    });
    state.folders.sort(function (a, b) { return a.position - b.position; });
    state.folders.forEach(function (f, i) { f.position = i; });
    if (!state.memberships) state.memberships = {};
    return state;
  }

  function getFolders() {
    return read().folders.slice().sort(function (a, b) { return a.position - b.position; });
  }

  function getFolder(id) {
    var found = null;
    getFolders().forEach(function (f) {
      if (f.id === id) found = f;
    });
    return found;
  }

  function createFolder(name) {
    var trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Nhập tên thư mục');
    var state = read();
    var dup = state.folders.some(function (f) {
      return !f.source && f.name.toLowerCase() === trimmed.toLowerCase();
    });
    if (dup) throw new Error('Đã có thư mục tên này');
    var folder = { id: uid(), name: trimmed, locked: false, position: state.folders.length };
    state.folders.push(folder);
    write(state);
    return folder;
  }

  function createSmartFolder(source, sourceId) {
    var tax = global.IfluxWatchlistTaxonomy;
    if (!tax) throw new Error('Không tải được phân loại');
    var group = tax.getGroup(source, sourceId);
    if (!group) throw new Error('Không tìm thấy nhóm');
    var state = read();
    var dup = state.folders.some(function (f) {
      return f.source === source && String(f.sourceId) === String(sourceId);
    });
    if (dup) throw new Error('Đã có thư mục «' + group.name + '»');
    var folder = {
      id: uid(),
      name: group.name,
      locked: false,
      position: state.folders.length,
      source: source,
      sourceId: String(sourceId)
    };
    state.folders.push(folder);
    write(state);
    return folder;
  }

  function deleteFolder(id) {
    if (id === DEFAULT_FOLDER_ID) throw new Error('Không thể xóa thư mục Theo dõi');
    var state = read();
    state.folders = state.folders.filter(function (f) { return f.id !== id; });
    Object.keys(state.memberships).forEach(function (ticker) {
      state.memberships[ticker] = state.memberships[ticker].filter(function (fid) { return fid !== id; });
      if (!state.memberships[ticker].length) delete state.memberships[ticker];
    });
    write(state);
  }

  function findSmartFolder(source, sourceId) {
    var sid = String(sourceId);
    var found = null;
    getFolders().forEach(function (f) {
      if (f.source === source && String(f.sourceId) === sid) found = f;
    });
    return found;
  }

  function isGroupFollowed(source, sourceId) {
    return !!findSmartFolder(source, sourceId);
  }

  function followGroup(source, sourceId) {
    var existing = findSmartFolder(source, sourceId);
    if (existing) return existing;
    return createSmartFolder(source, sourceId);
  }

  function unfollowGroup(source, sourceId) {
    var folder = findSmartFolder(source, sourceId);
    if (folder) deleteFolder(folder.id);
  }

  function toggleGroupFollow(source, sourceId) {
    if (isGroupFollowed(source, sourceId)) {
      unfollowGroup(source, sourceId);
      return false;
    }
    followGroup(source, sourceId);
    return true;
  }

  function reorderFolders(orderedIds) {
    var state = read();
    orderedIds.forEach(function (id, i) {
      state.folders.forEach(function (f) {
        if (f.id === id) f.position = i;
      });
    });
    write(state);
  }

  function isInWatchlist(ticker) {
    var m = read().memberships[ticker];
    return !!(m && m.indexOf(DEFAULT_FOLDER_ID) >= 0);
  }

  function getMembership(ticker) {
    return (read().memberships[ticker] || []).slice();
  }

  function getFolderTickers(folderId) {
    var folder = getFolder(folderId);
    if (folder && folder.source && folder.sourceId && global.IfluxWatchlistTaxonomy) {
      return IfluxWatchlistTaxonomy.getGroupTickers(folder.source, folder.sourceId);
    }
    var state = read();
    var list = [];
    Object.keys(state.memberships).forEach(function (ticker) {
      if (state.memberships[ticker].indexOf(folderId) >= 0) list.push(ticker);
    });
    return list;
  }

  function getAllWatchlistTickers() {
    return getFolderTickers(DEFAULT_FOLDER_ID);
  }

  function setMembership(ticker, folderIds) {
    var state = read();
    var ids = folderIds.slice();
    if (ids.indexOf(DEFAULT_FOLDER_ID) < 0) {
      ids.unshift(DEFAULT_FOLDER_ID);
    }
    ids = ids.filter(function (id, i, arr) { return arr.indexOf(id) === i; });
    state.memberships[ticker] = ids;
    write(state);
    return ids;
  }

  function addToFolders(ticker, folderIds) {
    var current = getMembership(ticker);
    if (current.indexOf(DEFAULT_FOLDER_ID) < 0) current.push(DEFAULT_FOLDER_ID);
    folderIds.forEach(function (id) {
      if (current.indexOf(id) < 0) current.push(id);
    });
    return setMembership(ticker, current);
  }

  function isSystemFolder(folder) {
    return !!(folder && folder.source);
  }

  function isInFolder(ticker, folderId) {
    var folder = getFolder(folderId);
    if (!folder) return false;
    if (isSystemFolder(folder)) {
      return getFolderTickers(folderId).indexOf(ticker) >= 0;
    }
    var m = read().memberships[ticker];
    return !!(m && m.indexOf(folderId) >= 0);
  }

  function removeFromFolder(ticker, folderId) {
    var folder = getFolder(folderId);
    if (folder && isSystemFolder(folder)) {
      throw new Error('Không thể chỉnh sửa thư mục hệ thống');
    }
    if (folderId === DEFAULT_FOLDER_ID) {
      removeFromWatchlist(ticker);
      return;
    }
    var state = read();
    if (!state.memberships[ticker]) return;
    state.memberships[ticker] = state.memberships[ticker].filter(function (id) {
      return id !== folderId;
    });
    if (!state.memberships[ticker].length) delete state.memberships[ticker];
    write(state);
  }

  function addToFolder(ticker, folderId) {
    var folder = getFolder(folderId);
    if (folder && isSystemFolder(folder)) {
      throw new Error('Không thể chỉnh sửa thư mục hệ thống');
    }
    if (folderId === DEFAULT_FOLDER_ID) {
      var current = getMembership(ticker);
      if (current.indexOf(DEFAULT_FOLDER_ID) < 0) {
        setMembership(ticker, current.length ? current.concat([DEFAULT_FOLDER_ID]) : [DEFAULT_FOLDER_ID]);
      }
      return;
    }
    addToFolders(ticker, [folderId]);
  }

  function removeFromWatchlist(ticker) {
    var state = read();
    delete state.memberships[ticker];
    write(state);
  }

  function uniqueFolderName(baseName) {
    var name = (baseName || '').trim();
    if (!name) throw new Error('Tên thư mục không hợp lệ');
    var folders = getFolders();
    if (!folders.some(function (f) { return f.name.toLowerCase() === name.toLowerCase(); })) {
      return name;
    }
    var i = 2;
    while (folders.some(function (f) { return f.name.toLowerCase() === (name + ' (' + i + ')').toLowerCase(); })) {
      i += 1;
    }
    return name + ' (' + i + ')';
  }

  function copyPublicPortfolio(ownerName, tickers) {
    var list = (tickers || []).filter(Boolean);
    if (!list.length) throw new Error('Danh mục trống');
    var folderName = uniqueFolderName('Danh sách theo dõi của ' + String(ownerName || 'Thành viên').trim());
    var folder = createFolder(folderName);
    var state = read();
    list.forEach(function (ticker) {
      ticker = String(ticker).toUpperCase();
      var cur = state.memberships[ticker] || [];
      if (cur.indexOf(folder.id) < 0) cur.push(folder.id);
      state.memberships[ticker] = cur;
    });
    write(state);
    return { folderId: folder.id, folderName: folder.name, count: list.length };
  }

  function ensureSeedFromDemo() {
    migrateFromLegacyForUser();
    var state = read();
    if (Object.keys(state.memberships || {}).length) return;
    var tickers = ['HPG', 'FPT', 'VCB', 'MWG', 'SSI'];
    if (global.IfluxMockMarket) {
      var snap = IfluxMockMarket.getSnapshot();
      if (snap && snap.watchlist && snap.watchlist.length) tickers = snap.watchlist.slice();
    }
    tickers.forEach(function (t) {
      state.memberships[String(t).toUpperCase()] = [DEFAULT_FOLDER_ID];
    });
    write(state);
  }

  global.IfluxWatchlistStore = {
    DEFAULT_FOLDER_ID: DEFAULT_FOLDER_ID,
    ensureSeedFromDemo: ensureSeedFromDemo,
    getFolders: getFolders,
    getFolder: getFolder,
    createFolder: createFolder,
    createSmartFolder: createSmartFolder,
    deleteFolder: deleteFolder,
    reorderFolders: reorderFolders,
    isInWatchlist: isInWatchlist,
    isSystemFolder: isSystemFolder,
    isInFolder: isInFolder,
    getMembership: getMembership,
    getFolderTickers: getFolderTickers,
    getAllWatchlistTickers: getAllWatchlistTickers,
    setMembership: setMembership,
    addToFolders: addToFolders,
    addToFolder: addToFolder,
    removeFromFolder: removeFromFolder,
    removeFromWatchlist: removeFromWatchlist,
    findSmartFolder: findSmartFolder,
    isGroupFollowed: isGroupFollowed,
    followGroup: followGroup,
    unfollowGroup: unfollowGroup,
    toggleGroupFollow: toggleGroupFollow,
    copyPublicPortfolio: copyPublicPortfolio
  };
})(window);
