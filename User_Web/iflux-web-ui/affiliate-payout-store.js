/* Yêu cầu rút hoa hồng Affiliate — User ↔ Admin */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_affiliate_payout_requests_v1';
  var cache = null;

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
    cache = list.slice();
  }

  function useApi() {
    return global.IfluxData ? IfluxData.isApi() : false;
  }

  function formatVnd(n) {
    return '₫' + Number(n || 0).toLocaleString('vi-VN');
  }

  function statusMeta(status) {
    if (status === 'paid') return { label: 'Đã chuyển khoản', chip: 'ix-chip-success' };
    if (status === 'processing') return { label: 'Đang xử lý', chip: 'ix-chip-info' };
    if (status === 'rejected') return { label: 'Từ chối', chip: 'ix-chip-danger' };
    return { label: 'Chờ duyệt', chip: 'ix-chip-warning' };
  }

  function normalize(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: String(row.userId || row.user_id || ''),
      userName: row.userName || row.user_name || '',
      email: row.email || '',
      amount: Number(row.amount || 0),
      bankName: row.bankName || row.bank_name || '',
      bankBranch: row.bankBranch || row.bank_branch || '',
      bankAccount: row.bankAccount || row.bank_account || '',
      bankHolder: row.bankHolder || row.bank_holder || '',
      status: row.status || 'pending',
      rejectReason: row.rejectReason || row.reject_reason || '',
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      processedAt: row.processedAt || row.processed_at || null,
      processedBy: row.processedBy || row.processed_by || ''
    };
  }

  function refreshFromApi(isAdmin) {
    if (!useApi()) return Promise.resolve(readLocal());
    if (isAdmin && IfluxApiClient.listAffiliatePayoutRequestsAdmin) {
      return IfluxApiClient.listAffiliatePayoutRequestsAdmin({}).then(function (res) {
        cache = (res.requests || []).map(normalize);
        writeLocal(cache);
        return cache.slice();
      }).catch(function () {
        return readLocal();
      });
    }
    var token = global.IfluxAuth && IfluxAuth.getToken && IfluxAuth.getToken();
    if (!token || token.indexOf('mock_jwt_') === 0) return Promise.resolve(readLocal());
    return IfluxApiClient.listMyAffiliatePayoutRequests(token).then(function (res) {
      var mine = (res.requests || []).map(normalize);
      cache = mine.slice();
      writeLocal(cache);
      return cache.slice();
    }).catch(function () {
      return readLocal();
    });
  }

  function readAll() {
    if (cache) return cache.slice();
    return readLocal();
  }

  function getMinPayout() {
    if (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.getConfig) {
      return Number(IfluxLoyaltyAffiliateStore.getConfig().min_payout || 100000);
    }
    return 100000;
  }

  function getAvailableBalance(userId) {
    if (!global.IfluxLoyaltyAffiliateStore) return 0;
    var stats = IfluxLoyaltyAffiliateStore.getStatsForUser(userId);
    var unpaid = stats.unpaid || 0;
    var reserved = readAll().filter(function (r) {
      return r.userId === String(userId) && (r.status === 'pending' || r.status === 'processing');
    }).reduce(function (s, r) { return s + r.amount; }, 0);
    return Math.max(0, unpaid - reserved);
  }

  function isFilled(val) {
    return String(val || '').trim().length > 0;
  }

  function checkPrerequisites(user) {
    user = user || {};
    var profileFields = [
      { key: 'display_name', label: 'Họ tên' },
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'email', label: 'Email' },
      { key: 'country', label: 'Quốc gia' }
    ];
    var bankFields = [
      { key: 'bankName', label: 'Ngân hàng' },
      { key: 'bankAccount', label: 'Số tài khoản' },
      { key: 'bankHolder', label: 'Chủ tài khoản' }
    ];

    var profileMissing = profileFields.filter(function (f) {
      return !isFilled(user[f.key]);
    });

    var pay = global.IfluxProfilePaymentStore && user.id
      ? IfluxProfilePaymentStore.get(user.id)
      : {};
    var bankMissing = bankFields.filter(function (f) {
      return !isFilled(pay[f.key]);
    });

    var lines = [];
    if (profileMissing.length) {
      lines.push('Cập nhật đầy đủ thông tin hồ sơ: ' +
        profileMissing.map(function (f) { return f.label; }).join(', '));
    }
    if (bankMissing.length) {
      lines.push('Cập nhật thông tin tài khoản ngân hàng: ' +
        bankMissing.map(function (f) { return f.label; }).join(', '));
    }

    return {
      ok: !profileMissing.length && !bankMissing.length,
      profileMissing: profileMissing,
      bankMissing: bankMissing,
      message: lines.length
        ? 'Trước khi rút tiền, vui lòng:\n' + lines.map(function (l) { return '• ' + l; }).join('\n')
        : ''
    };
  }

  function navigateToFix(check) {
    if (!check || check.ok) return;
    var accountTab = document.querySelector('[data-ix-profile-tab="tab-account"]');
    if (accountTab) accountTab.click();
    if (!global.IfluxProfileMyPage) return;
    if (check.profileMissing.length) {
      IfluxProfileMyPage.switchSubtab('mine-personal');
      IfluxProfileMyPage.enterEditMode();
    } else if (check.bankMissing.length) {
      IfluxProfileMyPage.switchSubtab('mine-payment');
    }
  }

  function savePrerequisites(user, collected) {
    collected = collected || {};
    user = user || {};
    var profilePatch = collected.profilePatch || {};
    var bankPatch = collected.bankPatch || {};

    function afterSave(updatedUser) {
      var check = checkPrerequisites(updatedUser);
      return { ok: true, user: updatedUser, check: check };
    }

    if (Object.keys(bankPatch).length && global.IfluxProfilePaymentStore && user.id) {
      if (IfluxProfilePaymentStore.saveAsync) {
        return IfluxProfilePaymentStore.saveAsync(user.id, bankPatch).then(function () {
          if (!Object.keys(profilePatch).length) return afterSave(Object.assign({}, user, profilePatch));
          return saveProfilePart();
        });
      }
      IfluxProfilePaymentStore.save(user.id, bankPatch);
    }

    function saveProfilePart() {
      if (!Object.keys(profilePatch).length) {
        return Promise.resolve(afterSave(user));
      }
      if (global.IfluxAuth && IfluxAuth.updateUserProfile) {
        return IfluxAuth.updateUserProfile(profilePatch).then(function (u) {
          return afterSave(u || Object.assign({}, user, profilePatch));
        });
      }
      if (global.IfluxAuth && IfluxAuth.updateUser) {
        return Promise.resolve(afterSave(IfluxAuth.updateUser(profilePatch) || Object.assign({}, user, profilePatch)));
      }
      return Promise.resolve(afterSave(Object.assign({}, user, profilePatch)));
    }

    return saveProfilePart();
  }

  function createRequest(user, amount) {
    user = user || {};
    var prereq = checkPrerequisites(user);
    if (!prereq.ok) {
      return Promise.resolve({
        ok: false,
        error: prereq.message.replace(/\n• /g, ' · ').replace(/\n/g, ' '),
        prerequisites: prereq
      });
    }

    amount = Math.round(Number(amount || 0));
    var minPayout = getMinPayout();
    var available = getAvailableBalance(user.id);
    if (available < minPayout) {
      return Promise.resolve({
        ok: false,
        error: 'Số dư khả dụng (' + formatVnd(available) + ') chưa đủ ngưỡng rút tối thiểu (' + formatVnd(minPayout) + ')'
      });
    }
    if (amount > available) amount = available;
    if (amount < minPayout) {
      return Promise.resolve({ ok: false, error: 'Số tiền tối thiểu là ' + formatVnd(minPayout) });
    }

    var pay = global.IfluxProfilePaymentStore
      ? IfluxProfilePaymentStore.get(user.id)
      : {};

    var payload = {
      amount: amount,
      bank_name: pay.bankName,
      bank_branch: pay.bankBranch || '',
      bank_account: pay.bankAccount,
      bank_holder: pay.bankHolder,
      user_name: user.display_name || user.username || '',
      email: user.email || ''
    };

    if (useApi() && global.IfluxAuth && IfluxAuth.getToken) {
      var token = IfluxAuth.getToken();
      if (token && token.indexOf('mock_jwt_') !== 0) {
        return IfluxApiClient.createAffiliatePayoutRequest(token, payload).then(function (res) {
          var row = normalize(res.request);
          var list = readAll();
          list.unshift(row);
          writeLocal(list);
          return { ok: true, request: row };
        }).catch(function (err) {
          return { ok: false, error: (err && err.message) || 'Không gửi được yêu cầu' };
        });
      }
    }

    var available = getAvailableBalance(user.id);
    if (amount > available) amount = available;
    if (readAll().some(function (r) {
      return r.userId === String(user.id) && (r.status === 'pending' || r.status === 'processing');
    })) {
      return Promise.resolve({ ok: false, error: 'Bạn đã có yêu cầu rút tiền đang chờ xử lý' });
    }

    var row = normalize({
      id: 'payout_' + Date.now(),
      userId: user.id,
      userName: payload.user_name,
      email: payload.email,
      amount: amount,
      bankName: payload.bank_name,
      bankBranch: payload.bank_branch,
      bankAccount: payload.bank_account,
      bankHolder: payload.bank_holder,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    var list = readAll();
    list.unshift(row);
    writeLocal(list);
    return Promise.resolve({ ok: true, request: row });
  }

  function listForUser(userId) {
    return readAll().filter(function (r) { return r.userId === String(userId); });
  }

  function listAdmin(filters) {
    filters = filters || {};
    var q = (filters.q || '').toLowerCase();
    return readAll().filter(function (r) {
      if (filters.status && r.status !== filters.status) return false;
      if (q) {
        var hay = [r.userName, r.email, r.id, r.bankAccount, r.bankHolder].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function patchLocal(id, patch) {
    var list = readAll();
    var idx = list.findIndex(function (r) { return r.id === id; });
    if (idx < 0) return null;
    list[idx] = Object.assign({}, list[idx], patch, { processedAt: new Date().toISOString() });
    writeLocal(list);
    return list[idx];
  }

  function approveRequest(id) {
    if (useApi() && IfluxApiClient.approveAffiliatePayoutAdmin) {
      return IfluxApiClient.approveAffiliatePayoutAdmin(id).then(function (res) {
        patchLocal(id, normalize(res.request));
        return { ok: true };
      }).catch(function () {
        return approveRequestLocal(id);
      });
    }
    return Promise.resolve(approveRequestLocal(id));
  }

  function approveRequestLocal(id) {
    var row = readAll().find(function (r) { return r.id === id; });
    if (!row || row.status !== 'pending') return { ok: false, error: 'invalid_request' };
    patchLocal(id, { status: 'processing', processedBy: 'Admin' });
    return { ok: true };
  }

  function completeRequest(id) {
    if (useApi() && IfluxApiClient.completeAffiliatePayoutAdmin) {
      return IfluxApiClient.completeAffiliatePayoutAdmin(id).then(function (res) {
        var row = normalize(res.request);
        patchLocal(id, row);
        if (global.LoyaltyAffiliateStore && LoyaltyAffiliateStore.markPaidForUser) {
          LoyaltyAffiliateStore.markPaidForUser(row.userId, row.amount);
        }
        return { ok: true };
      }).catch(function () {
        return completeRequestLocal(id);
      });
    }
    return Promise.resolve(completeRequestLocal(id));
  }

  function completeRequestLocal(id) {
    var row = readAll().find(function (r) { return r.id === id; });
    if (!row || (row.status !== 'pending' && row.status !== 'processing')) {
      return { ok: false, error: 'invalid_request' };
    }
    patchLocal(id, { status: 'paid', processedBy: 'Admin' });
    if (global.LoyaltyAffiliateStore && LoyaltyAffiliateStore.markPaidForUser) {
      LoyaltyAffiliateStore.markPaidForUser(row.userId, row.amount);
    }
    return { ok: true };
  }

  function rejectRequest(id, reason) {
    if (useApi() && IfluxApiClient.rejectAffiliatePayoutAdmin) {
      return IfluxApiClient.rejectAffiliatePayoutAdmin(id, reason).then(function (res) {
        patchLocal(id, normalize(res.request));
        return { ok: true };
      }).catch(function () {
        return rejectRequestLocal(id, reason);
      });
    }
    return Promise.resolve(rejectRequestLocal(id, reason));
  }

  function rejectRequestLocal(id, reason) {
    var row = readAll().find(function (r) { return r.id === id; });
    if (!row || row.status === 'paid' || row.status === 'rejected') {
      return { ok: false, error: 'invalid_request' };
    }
    patchLocal(id, { status: 'rejected', rejectReason: reason || 'Không đủ điều kiện', processedBy: 'Admin' });
    return { ok: true };
  }

  function statsAdmin() {
    var list = readAll();
    return {
      pending: list.filter(function (r) { return r.status === 'pending'; }).length,
      processing: list.filter(function (r) { return r.status === 'processing'; }).length,
      paid: list.filter(function (r) { return r.status === 'paid'; }).length
    };
  }

  global.IfluxAffiliatePayoutStore = {
    formatVnd: formatVnd,
    statusMeta: statusMeta,
    getMinPayout: getMinPayout,
    getAvailableBalance: getAvailableBalance,
    checkPrerequisites: checkPrerequisites,
    savePrerequisites: savePrerequisites,
    navigateToFix: navigateToFix,
    refreshFromApi: refreshFromApi,
    createRequest: createRequest,
    listForUser: listForUser,
    listAdmin: listAdmin,
    approveRequest: approveRequest,
    completeRequest: completeRequest,
    rejectRequest: rejectRequest,
    statsAdmin: statsAdmin
  };
})(window);
