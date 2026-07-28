/* Owner: tab-affiliate (#tab-affiliate) — một entry bind DOM · Store · API · payout UI */
(function (global) {
  'use strict';

  var memberFilters = { q: '', layer: '' };
  var commissionFilters = { q: '' };
  var memberVisibleCount = 10;
  var commissionVisibleCount = 10;
  var PAGE_SIZE = 10;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function layerClass(layer) {
    if (layer === 'F1') return 'ix-layer-f1';
    if (layer === 'F2') return 'ix-layer-f2';
    return 'ix-layer-f0';
  }

  function commissionStatusChip(e) {
    if (e.paid || e.status === 'paid') {
      return '<span class="ix-chip ix-chip-success" style="font-size:11px">Đã thanh toán</span>';
    }
    return '<span class="ix-chip ix-chip-warning" style="font-size:11px">Chờ xử lý</span>';
  }

  function accountStatusChip(status) {
    if (status === 'suspended') {
      return '<span class="ix-chip ix-chip-danger" style="font-size:11px">Tạm khóa</span>';
    }
    return '<span class="ix-chip ix-chip-success" style="font-size:11px">Hoạt động</span>';
  }

  function formatJoinDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('vi-VN');
    } catch (e) {
      return '—';
    }
  }

  function renderLoadMore(containerId, shown, total, onLoad) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (!total) return;
    if (shown >= total) {
      var info = document.createElement('span');
      info.className = 'ix-page-info';
      info.textContent = total + ' mục';
      el.appendChild(info);
      return;
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ix-btn ix-btn-text ix-btn-sm';
    btn.textContent = 'Xem thêm (' + (total - shown) + ' còn lại)';
    btn.addEventListener('click', onLoad);
    el.appendChild(btn);
  }

  function renderNetworkOverview(Store, userId, cfg) {
    var grid = document.getElementById('ifx-aff-network-grid');
    if (!grid) return;
    var stats = Store.getNetworkStats(userId);
    var layers = [
      { key: 'F0', short: 'F0', label: 'Trực tiếp', pct: cfg.f0_pct, layerCls: 'ix-layer-f0', bg: 'rgba(105,108,255,.07)', border: 'rgba(105,108,255,.2)' },
      { key: 'F1', short: 'F1', label: 'Cấp 2', pct: cfg.f1_pct, layerCls: 'ix-layer-f1', bg: 'rgba(40,199,111,.07)', border: 'rgba(40,199,111,.2)' },
      { key: 'F2', short: 'F2', label: 'Cấp 3', pct: cfg.f2_pct, layerCls: 'ix-layer-f2', bg: 'rgba(255,159,67,.07)', border: 'rgba(255,159,67,.2)' }
    ];

    grid.innerHTML = layers.map(function (L) {
      var data = stats.layers[L.key] || { count: 0, earn: 0 };
      return '<div class="ifx-aff-layer-stat" style="background:' + L.bg + ';border:1px solid ' + L.border + '">' +
        '<div class="ifx-aff-layer-stat__meta">' +
          '<div class="ifx-aff-layer-stat__badge ' + L.layerCls + '">' + esc(L.short) + '</div>' +
          '<div class="ifx-aff-layer-stat__label">' + esc(L.label) + ' · ' + L.pct + '%</div>' +
        '</div>' +
        '<div class="ifx-aff-layer-stat__nums">' +
          '<div class="ifx-aff-layer-stat__count">' + data.count + '</div>' +
          '<div class="ifx-aff-layer-stat__earn">' + Store.formatVnd(data.earn) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderMembers(Store, userId) {
    var tbody = document.querySelector('#aff-members-table tbody');
    if (!tbody) return;

    var rows = Store.listNetworkMembers(userId, memberFilters);
    var total = rows.length;
    var visible = Math.min(memberVisibleCount, total);
    var pageRows = rows.slice(0, visible);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="4" data-label="" style="text-align:center;padding:28px;color:var(--ix-text-muted)">Chưa có thành viên trong mạng giới thiệu của bạn.</td></tr>';
      renderLoadMore('ifx-aff-members-pager', 0, 0);
      return;
    }

    tbody.innerHTML = pageRows.map(function (m) {
      return '<tr>' +
        '<td data-label="Ngày tham gia" style="font-size:12px;color:var(--ix-text-muted)">' + esc(formatJoinDate(m.joinedAt)) + '</td>' +
        '<td data-label="Thành viên"><div class="ix-user-cell"><div class="ix-avatar-sm ' + esc(m.avatarCls) + '">' + esc(m.initials) + '</div>' +
          '<div><div class="ix-user-name">' + esc(m.display_name) + '</div>' +
          '<div style="font-size:11px;color:var(--ix-text-muted)">' + (m.referral_code ? esc(m.referral_code) : '—') + '</div></div></div></td>' +
        '<td data-label="Lớp"><span class="' + layerClass(m.layer) + '">' + esc(m.layer) + '</span></td>' +
        '<td data-label="Trạng thái">' + accountStatusChip(m.accountStatus) + '</td>' +
      '</tr>';
    }).join('');

    renderLoadMore('ifx-aff-members-pager', visible, total, function () {
      memberVisibleCount += PAGE_SIZE;
      renderMembers(Store, userId);
    });
  }

  function renderCommissionTable(Store, userId) {
    var tbody = document.querySelector('#aff-table tbody');
    if (!tbody) return;

    var rows = Store.listForUser(userId, commissionFilters);
    var total = rows.length;
    var visible = Math.min(commissionVisibleCount, total);
    var pageRows = rows.slice(0, visible);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="7" data-label="" style="text-align:center;padding:28px;color:var(--ix-text-muted)">Chưa có hoa hồng từ chuỗi giới thiệu.</td></tr>';
      renderLoadMore('ifx-aff-commission-pager', 0, 0);
      return;
    }

    tbody.innerHTML = pageRows.map(function (e) {
      return '<tr>' +
        '<td data-label="Ngày" style="font-size:12px;color:var(--ix-text-muted)">' + esc(formatJoinDate(e.at)) + '</td>' +
        '<td data-label="Người được giới thiệu"><div class="ix-user-cell"><div class="ix-avatar-sm ' + esc(e.buyerAvatarCls) + '">' + esc(e.buyerInitials) + '</div>' +
          '<div><div class="ix-user-name">' + esc(e.buyerName) + '</div><div style="font-size:11px;color:var(--ix-text-muted)">' + esc(e.sourceNote) + '</div></div></div></td>' +
        '<td data-label="Lớp"><span class="' + layerClass(e.layer) + '">' + esc(e.layer) + '</span></td>' +
        '<td data-label="Sản phẩm" style="font-size:13px">' + esc(e.productLabel) + '</td>' +
        '<td data-label="Giá trị đơn" style="font-weight:600;color:var(--ix-text-primary)">' + Store.formatVnd(e.orderAmount) + '</td>' +
        '<td data-label="Hoa hồng" style="color:var(--ix-success);font-weight:700">+' + Store.formatVnd(e.commission) + '</td>' +
        '<td data-label="Trạng thái">' + commissionStatusChip(e) + '</td></tr>';
    }).join('');

    renderLoadMore('ifx-aff-commission-pager', visible, total, function () {
      commissionVisibleCount += PAGE_SIZE;
      renderCommissionTable(Store, userId);
    });
  }

  function setAffiliateLoading(loading) {
    var root = document.getElementById('tab-affiliate');
    if (!root) return;
    root.setAttribute('data-ifx-aff-state', loading ? 'loading' : 'ready');
    var loadEl = root.querySelector('[data-ifx-aff-loading]');
    var pane = root.querySelector('[data-ifx-aff-data-pane]');
    if (loadEl) loadEl.hidden = !loading;
    if (pane) pane.hidden = !!loading;
  }

  function paintRates(cfg, root) {
    root = root || document.getElementById('tab-affiliate');
    if (!root || !cfg) return;
    var map = { f0: cfg.f0_pct, f1: cfg.f1_pct, f2: cfg.f2_pct };
    root.querySelectorAll('[data-ifx-aff-rate]').forEach(function (el) {
      var key = el.getAttribute('data-ifx-aff-rate');
      if (map[key] != null) el.textContent = map[key] + '%';
    });
    var minEl = root.querySelector('[data-ifx-aff-min-payout]');
    if (minEl && global.IfluxLoyaltyAffiliateStore) {
      minEl.textContent = IfluxLoyaltyAffiliateStore.formatVnd(cfg.min_payout || 0);
    }
  }

  function paintSummary(Store, stats, cfg) {
    var root = document.getElementById('tab-affiliate');
    if (!root) return;
    var sums = {
      total: Store.formatVnd(stats.totalEarn),
      unpaid: Store.formatVnd(stats.unpaid),
      signups: String(stats.signups),
      conv: stats.convRate + '%'
    };
    root.querySelectorAll('[data-ifx-aff-sum]').forEach(function (el) {
      var key = el.getAttribute('data-ifx-aff-sum');
      if (sums[key] != null) el.textContent = sums[key];
    });
    paintRates(cfg, root);
  }

  function paintPayoutBar(user) {
    var Payout = global.IfluxAffiliatePayoutStore;
    var root = document.getElementById('tab-affiliate');
    if (!root || !Payout || !user) return;
    var min = Payout.getMinPayout();
    var available = Payout.getAvailableBalance(user.id);
    var balanceEl = root.querySelector('[data-ifx-aff-balance]');
    if (balanceEl) balanceEl.textContent = Payout.formatVnd(available);
    var btn = root.querySelector('[data-ifx-aff-payout]');
    if (!btn) return;
    var canPayout = available >= min;
    btn.disabled = !canPayout;
    btn.setAttribute('aria-disabled', canPayout ? 'false' : 'true');
    btn.title = canPayout
      ? 'Gửi yêu cầu rút hoa hồng'
      : ('Cần tối thiểu ' + Payout.formatVnd(min));
  }

  function bindPayoutButton() {
    var btn = document.querySelector('[data-ifx-aff-payout]');
    if (!btn || btn.dataset.ifxPayoutBound) return;
    btn.dataset.ifxPayoutBound = '1';
    btn.addEventListener('click', function () {
      var user = global.IfluxAuth && IfluxAuth.getUser();
      var UI = global.IfluxAffiliatePayoutUI;
      if (!user || !UI || btn.disabled) return;
      UI.open(user, {
        onSuccess: function () {
          render();
        }
      });
    });
  }

  function referralLinkForUser(user) {
    if (!user || !user.referral_code) return '';
    var Store = global.IfluxLoyaltyAffiliateStore;
    if (Store && Store.buildReferralLink) return Store.buildReferralLink(user.referral_code);
    if (Store && Store.getReferralLinkForUser) return Store.getReferralLinkForUser(user);
    return '';
  }

  function refreshRefLinkFields() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user || !user.referral_code) return;
    var link = referralLinkForUser(user);
    var refLink = document.getElementById('ref-link');
    var refCode = document.getElementById('ref-code');
    if (refLink && link) refLink.value = link;
    if (refCode) refCode.value = user.referral_code;
  }

  function copyRefValue(inputId) {
    var el = document.getElementById(inputId);
    if (!el) return;
    var text = String(el.value || el.textContent || '').trim();
    if (!text) {
      if (global.ixToast) ixToast('Không có nội dung để sao chép', 'warning');
      return;
    }
    function notify(ok) {
      if (global.ixToast) ixToast(ok ? 'Đã sao chép!' : 'Không sao chép được', ok ? 'success' : 'warning');
    }
    if (global.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { notify(true); }).catch(function () { notify(false); });
      return;
    }
    try {
      el.focus();
      el.select();
      notify(document.execCommand('copy'));
    } catch (e) {
      notify(false);
    }
  }

  function bindCopyRef() {
    var root = document.getElementById('tab-affiliate');
    if (!root) return;
    root.querySelectorAll('[data-ix-copy-ref]').forEach(function (btn) {
      if (btn.dataset.ifxAffCopyBound) return;
      btn.dataset.ifxAffCopyBound = '1';
      btn.addEventListener('click', function () {
        copyRefValue(btn.getAttribute('data-ix-copy-ref'));
      });
    });
  }

  function hardenAffiliateSearchInput(input) {
    if (!input || input.dataset.ifxAffSearchHardened === '1') return;
    var wrap = input.closest('.ix-table-search');
    var HS = global.IfluxHeaderSearch;
    if (HS && HS.hardenInput) {
      HS.hardenInput(input, wrap);
    } else {
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('data-lpignore', 'true');
      input.setAttribute('data-1p-ignore', 'true');
    }
    input.dataset.ifxAffSearchHardened = '1';
    input.addEventListener('focus', function () {
      input.removeAttribute('readonly');
      if (HS && HS.sanitizeAutofillLeak) HS.sanitizeAutofillLeak(input);
    });
  }

  function render() {
    var Store = global.IfluxLoyaltyAffiliateStore;
    if (!Store) return;

    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    setAffiliateLoading(true);
    paintRates(Store.getConfig());

    function paint() {
      var stats = Store.getStatsForUser(user.id);
      var cfg = Store.getConfig();

      paintSummary(Store, stats, cfg);

      renderNetworkOverview(Store, user.id, cfg);
      renderMembers(Store, user.id);
      renderCommissionTable(Store, user.id);
      refreshRefLinkFields();

      var Payout = global.IfluxAffiliatePayoutStore;
      if (Payout && Payout.refreshFromApi) {
        Payout.refreshFromApi(false).finally(function () {
          paintPayoutBar(user);
          setAffiliateLoading(false);
        });
      } else {
        paintPayoutBar(user);
        setAffiliateLoading(false);
      }
    }

    if (Store.syncFromServerAsync) {
      Store.syncFromServerAsync(user.id).finally(paint);
    } else {
      paint();
    }
  }

  function bindMembersFilters() {
    var search = document.querySelector('[data-ifx-aff-members-search]');
    if (search) hardenAffiliateSearchInput(search);
    if (search && !search.dataset.ifxAffBound) {
      search.dataset.ifxAffBound = '1';
      search.addEventListener('input', function () {
        memberFilters.q = search.value.trim();
        memberVisibleCount = PAGE_SIZE;
        var user = global.IfluxAuth && IfluxAuth.getUser();
        if (user && global.IfluxLoyaltyAffiliateStore) {
          renderMembers(IfluxLoyaltyAffiliateStore, user.id);
        }
      });
    }

    var layerSel = document.getElementById('aff-members-layer');
    if (layerSel && !layerSel.dataset.ifxAffBound) {
      layerSel.dataset.ifxAffBound = '1';
      layerSel.addEventListener('change', function () {
        memberFilters.layer = layerSel.value;
        memberVisibleCount = PAGE_SIZE;
        var user = global.IfluxAuth && IfluxAuth.getUser();
        if (user && global.IfluxLoyaltyAffiliateStore) {
          renderMembers(IfluxLoyaltyAffiliateStore, user.id);
        }
      });
    }
  }

  function bindCommissionFilters() {
    var search = document.querySelector('[data-ifx-aff-commission-search]');
    if (search) hardenAffiliateSearchInput(search);
    if (search && !search.dataset.ifxAffBound) {
      search.dataset.ifxAffBound = '1';
      search.addEventListener('input', function () {
        commissionFilters.q = search.value.trim();
        commissionVisibleCount = PAGE_SIZE;
        var user = global.IfluxAuth && IfluxAuth.getUser();
        if (user && global.IfluxLoyaltyAffiliateStore) {
          renderCommissionTable(IfluxLoyaltyAffiliateStore, user.id);
        }
      });
    }
  }

  function bindAffiliateTabRefresh() {
    document.querySelectorAll('[data-ix-profile-tab="tab-affiliate"]').forEach(function (btn) {
      if (btn.dataset.ifxAffNotifBound) return;
      btn.dataset.ifxAffNotifBound = '1';
      btn.addEventListener('click', function () {
        setTimeout(render, 0);
      });
    });
  }

  function init() {
    if (!document.getElementById('tab-affiliate')) return;
    bindMembersFilters();
    bindCommissionFilters();
    bindCopyRef();
    bindPayoutButton();
    render();
    bindAffiliateTabRefresh();
  }

  global.IfluxProfileAffiliate = { init: init, render: render };
  global.IfluxProfileAffiliatePage = global.IfluxProfileAffiliate;
})(window);
