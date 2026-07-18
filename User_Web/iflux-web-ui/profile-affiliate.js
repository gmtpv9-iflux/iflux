/* Profile — tab Affiliate (hoa hồng + danh sách thành viên mạng giới thiệu) */
(function (global) {
  'use strict';

  var memberFilters = { q: '', layer: '' };
  var memberPage = 1;
  var MEMBERS_PER_PAGE = 10;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function layerClass(layer) {
    if (layer === 'F1') return 'ix-layer-f1';
    if (layer === 'F2') return 'ix-layer-f2';
    return 'ix-layer-f0';
  }

  function statusChip(e) {
    if (e.paid || e.status === 'paid') {
      return '<span class="ix-chip ix-chip-success" style="font-size:11px">Đã thanh toán</span>';
    }
    return '<span class="ix-chip ix-chip-warning" style="font-size:11px">Chờ xử lý</span>';
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

  function renderMembersPager(total, page) {
    var pager = document.getElementById('ifx-aff-members-pager');
    if (!pager) return;

    var pages = Math.max(1, Math.ceil(total / MEMBERS_PER_PAGE));
    page = Math.max(1, Math.min(page, pages));
    memberPage = page;
    pager.innerHTML = '';

    if (!total) return;

    if (total <= MEMBERS_PER_PAGE) {
      var only = document.createElement('span');
      only.className = 'ix-page-info';
      only.textContent = total + ' thành viên';
      pager.appendChild(only);
      return;
    }

    var nav = document.createElement('div');
    nav.style.display = 'flex';
    nav.style.gap = '4px';

    function makeBtn(label, targetPage, disabled) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ix-page-btn' + (targetPage === page ? ' active' : '');
      b.textContent = label;
      b.disabled = !!disabled;
      b.addEventListener('click', function () {
        memberPage = targetPage;
        var user = global.IfluxAuth && IfluxAuth.getUser();
        if (user && global.IfluxLoyaltyAffiliateStore) {
          renderMembers(IfluxLoyaltyAffiliateStore, user.id);
        }
      });
      return b;
    }

    nav.appendChild(makeBtn('‹', page - 1, page === 1));
    for (var p = 1; p <= pages; p++) nav.appendChild(makeBtn(String(p), p, false));
    nav.appendChild(makeBtn('›', page + 1, page === pages));

    var info = document.createElement('span');
    info.className = 'ix-page-info';
    info.textContent = ((page - 1) * MEMBERS_PER_PAGE + 1) + '–' +
      Math.min(page * MEMBERS_PER_PAGE, total) + ' / ' + total + ' thành viên';

    pager.appendChild(nav);
    pager.appendChild(info);
  }

  function renderMembers(Store, userId) {
    var tbody = document.querySelector('#aff-members-table tbody');
    if (!tbody) return;

    var rows = Store.listNetworkMembers(userId, memberFilters);
    var total = rows.length;
    var pages = Math.max(1, Math.ceil(total / MEMBERS_PER_PAGE));
    if (memberPage > pages) memberPage = pages;

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:28px;color:var(--ix-text-muted)">Chưa có thành viên trong mạng giới thiệu của bạn.</td></tr>';
      renderMembersPager(0, 1);
      return;
    }

    var start = (memberPage - 1) * MEMBERS_PER_PAGE;
    var pageRows = rows.slice(start, start + MEMBERS_PER_PAGE);

    tbody.innerHTML = pageRows.map(function (m) {
      return '<tr>' +
        '<td><div class="ix-user-cell"><div class="ix-avatar-sm ' + esc(m.avatarCls) + '">' + esc(m.initials) + '</div>' +
          '<div><div class="ix-user-name">' + esc(m.display_name) + '</div>' +
          '<div style="font-size:11px;color:var(--ix-text-muted)">' + (m.referral_code ? esc(m.referral_code) : '—') + '</div></div></div></td>' +
        '<td><span class="' + layerClass(m.layer) + '">' + esc(m.layer) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(new Date(m.joinedAt).toLocaleDateString('vi-VN')) + '</td>' +
      '</tr>';
    }).join('');
    renderMembersPager(total, memberPage);
  }

  function render() {
    var Store = global.IfluxLoyaltyAffiliateStore;
    var tbody = document.querySelector('#aff-table tbody');
    if (!Store) return;

    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    function paint() {
      if (global.IfluxSubscriptionOrdersStore && IfluxSubscriptionOrdersStore.reconcileReferralCommissions) {
        IfluxSubscriptionOrdersStore.reconcileReferralCommissions();
      }

      var stats = Store.getStatsForUser(user.id);
      var cfg = Store.getConfig();

    var sumTotal = document.querySelector('#tab-affiliate .ix-aff-sum-val.ix-aff-sum-accent');
    var sumUnpaid = document.querySelector('#tab-affiliate .ix-aff-sum-item:nth-child(2) .ix-aff-sum-val');
    var sumCount = document.querySelector('#tab-affiliate .ix-aff-sum-item:nth-child(3) .ix-aff-sum-val');
    var sumConv = document.querySelector('#tab-affiliate .ix-aff-sum-item:nth-child(4) .ix-aff-sum-val');
    var balanceEl = document.querySelector('#tab-affiliate strong[style*="ix-success"]');

    if (sumTotal) sumTotal.textContent = Store.formatVnd(stats.totalEarn);
    if (sumUnpaid) sumUnpaid.textContent = Store.formatVnd(stats.unpaid);
    if (sumCount) sumCount.textContent = String(stats.signups);
    if (sumConv) sumConv.textContent = stats.convRate + '%';
    if (balanceEl) balanceEl.textContent = Store.formatVnd(stats.unpaid);

    document.querySelectorAll('#tab-affiliate .ix-layer-pill strong').forEach(function (el, i) {
      var rates = [cfg.f0_pct, cfg.f1_pct, cfg.f2_pct];
      if (rates[i] != null) el.textContent = rates[i] + '%';
    });

    renderNetworkOverview(Store, user.id, cfg);
    renderMembers(Store, user.id);

    if (!tbody) return;

    var rows = Store.listForUser(user.id);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--ix-text-muted)">Chưa có hoa hồng từ chuỗi giới thiệu.</td></tr>';
    } else {
      tbody.innerHTML = rows.map(function (e) {
        return '<tr>' +
          '<td><div class="ix-user-cell"><div class="ix-avatar-sm ' + esc(e.buyerAvatarCls) + '">' + esc(e.buyerInitials) + '</div>' +
          '<div><div class="ix-user-name">' + esc(e.buyerName) + '</div><div style="font-size:11px;color:var(--ix-text-muted)">' + esc(e.sourceNote) + '</div></div></div></td>' +
          '<td><span class="' + layerClass(e.layer) + '">' + esc(e.layer) + '</span></td>' +
          '<td style="font-size:13px">' + esc(e.productLabel) + '</td>' +
          '<td style="font-weight:600;color:var(--ix-text-primary)">' + Store.formatVnd(e.orderAmount) + '</td>' +
          '<td style="color:var(--ix-accent);font-weight:600">' + esc(e.commissionPct) + '%</td>' +
          '<td style="color:var(--ix-success);font-weight:700">+' + Store.formatVnd(e.commission) + '</td>' +
          '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(new Date(e.at).toLocaleDateString('vi-VN')) + '</td>' +
          '<td>' + statusChip(e) + '</td></tr>';
      }).join('');
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
    if (search && !search.dataset.ifxAffBound) {
      search.dataset.ifxAffBound = '1';
      search.addEventListener('input', function () {
        memberFilters.q = search.value.trim();
        memberPage = 1;
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
        memberPage = 1;
        var user = global.IfluxAuth && IfluxAuth.getUser();
        if (user && global.IfluxLoyaltyAffiliateStore) {
          renderMembers(IfluxLoyaltyAffiliateStore, user.id);
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
    bindMembersFilters();
    render();
    bindAffiliateTabRefresh();
  }

  global.IfluxProfileAffiliate = { init: init, render: render };
})(window);
