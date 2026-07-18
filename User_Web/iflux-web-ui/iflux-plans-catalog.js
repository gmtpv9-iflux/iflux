/* User Web — đọc danh mục gói từ Admin PlansStore (localStorage iflux-admin-plans-v1) */
(function (global) {
  'use strict';

  var ENT_LABELS = [
    { key: 'flowRt', label: 'Dòng tiền real-time (WSS)' },
    { key: 'candles', label: 'Biểu đồ nến & dòng tiền chi tiết' },
    { key: 'alerts', label: 'Cảnh báo nâng cao' },
    { key: 'widgets', label: 'Dashboard widget không giới hạn' }
  ];

  var BADGE_TEXT = { popular: 'Phổ biến nhất', best: 'Tốt nhất' };

  var FALLBACK_GUEST = {
    id: 'guest',
    name: 'Vãng lai',
    tier: 'guest',
    sort: 0,
    desc: 'Quyền mặc định cho người chưa đăng nhập',
    subtitle: 'Website công khai',
    icon: 'ti-eye',
    iconClass: 'info',
    priceMonth: 0,
    priceYear: 0,
    priceLifetime: 0,
    lifetimeEnabled: false,
    purchasable: false,
    status: 'published',
    badge: '',
    ent: {},
    blocks: {},
    limits: { alerts: 0, maxWidgets: 0, watchlistTabs: 0, watchlistItems: 0, apiRate: 30, wssChannels: 0, searchResults: 5 }
  };

  var FALLBACK_FREE = {
    id: 'free',
    name: 'Miễn phí',
    tier: 'free',
    sort: 1,
    desc: 'Bảng giá cơ bản (delay 15 phút). Watchlist tối đa 5 mã. Top10 thị trường (1 loại).',
    subtitle: 'Bắt đầu khám phá thị trường',
    icon: 'ti-gift',
    iconClass: 'info',
    priceMonth: 0,
    priceYear: 0,
    priceLifetime: 0,
    lifetimeEnabled: false,
    purchasable: false,
    status: 'published',
    badge: '',
    ent: {},
    limits: { alerts: 3, maxWidgets: 3, watchlistTabs: 10, watchlistItems: 100, apiRate: 120, wssChannels: 10, searchResults: 20 }
  };

  function store() {
    if (!global.PlansStore) return null;
    return global.PlansStore;
  }

  function fmt(n) {
    if (store()) return store().formatVnd(n);
    if (!n) return '₫0';
    return '₫' + Number(n).toLocaleString('vi-VN');
  }

  function fmtNum(n) {
    if (!n) return '0';
    return Number(n).toLocaleString('vi-VN');
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function listPlans() {
    if (!store()) return [];
    return store().listPlans();
  }

  function getPlan(tier) {
    if (!store()) return null;
    return store().getPlan(tier);
  }

  function displayName(plan) {
    if (!plan) return '';
    if (plan.tier === 'free') return 'Miễn phí';
    return plan.name || plan.tier || '';
  }

  function guestPlan() {
    var fromStore = getPlan('guest');
    if (fromStore) return fromStore;
    if (global.EntitlementCatalog && EntitlementCatalog.normalizePlan) {
      return EntitlementCatalog.normalizePlan(FALLBACK_GUEST);
    }
    return FALLBACK_GUEST;
  }

  function freePlan() {
    var fromStore = getPlan('free');
    if (fromStore) return fromStore;
    var fromList = listPlans().find(function (p) { return p.tier === 'free'; });
    return fromList || FALLBACK_FREE;
  }

  function publishedPlans() {
    var free = freePlan();
    var rest = listPlans().filter(function (p) {
      if (p.tier === 'guest') return false;
      if (p.tier === 'free') return false;
      if (p.status === 'hidden') return false;
      return p.status === 'published' || p.status === 'scheduled';
    });
    var merged = [free].concat(rest);
    merged.sort(function (a, b) { return (a.sort || 99) - (b.sort || 99); });
    return merged;
  }

  function purchasablePlans() {
    return publishedPlans().filter(function (p) {
      return p.purchasable && p.tier !== 'free' && p.status === 'published';
    });
  }

  function tierRank(tier) {
    var plan = getPlan(tier);
    if (plan && plan.sort != null) return plan.sort;
    var order = { guest: 0, free: 1, premium: 2, elite: 3 };
    return order[String(tier || '').toLowerCase()] || 0;
  }

  function hasUpgradePath(currentTier) {
    var cur = tierRank(currentTier);
    return purchasablePlans().some(function (p) {
      return tierRank(p.tier) > cur;
    });
  }

  /** Gói mua được gần nhất cao hơn tier hiện tại (free→premium, premium→elite). */
  function nextUpgradeablePlan(currentTier) {
    var cur = tierRank(currentTier);
    var higher = purchasablePlans()
      .filter(function (p) { return tierRank(p.tier) > cur; })
      .sort(function (a, b) { return tierRank(a.tier) - tierRank(b.tier); });
    return higher.length ? higher[0] : null;
  }

  function anyLifetimeEnabled() {
    return purchasablePlans().some(function (p) {
      return p.lifetimeEnabled && p.priceLifetime > 0;
    });
  }

  function listPriceForCycle(plan, cycle) {
    if (!plan) return 0;
    if (cycle === 'lifetime') return plan.lifetimeEnabled ? (plan.priceLifetime || 0) : 0;
    if (cycle === 'annual') return plan.priceYear || 0;
    return plan.priceMonth || 0;
  }

  function resolvePromoPct(plan) {
    if (!plan) return 0;
    if (plan.promoPct != null && plan.promoPct !== '') {
      return Math.min(100, Math.max(0, Math.round(Number(plan.promoPct))));
    }
    /* Legacy: pricePromo — chỉ khi chưa có promoPct */
    var list = plan.priceMonth || 0;
    var legacy = plan.pricePromo || 0;
    if (legacy > 0 && legacy < list) {
      return Math.round((list - legacy) / list * 100);
    }
    return 0;
  }

  function cyclePromoLabel(cycle) {
    if (cycle === 'annual') return 'hàng năm';
    if (cycle === 'lifetime') return 'trọn đời';
    return 'hàng tháng';
  }

  function promoDiscount(plan, cycle) {
    var empty = { active: false, amount: 0, pct: 0, label: '', badge: '', listPrice: 0, salePrice: 0 };
    if (!plan || !cycle) return empty;
    var list = listPriceForCycle(plan, cycle);
    var pct = resolvePromoPct(plan);
    if (!(pct > 0) || !(list > 0)) {
      return Object.assign({}, empty, { listPrice: list, salePrice: list });
    }
    var salePrice = Math.round(list * (100 - pct) / 100);
    if (salePrice >= list) {
      return Object.assign({}, empty, { listPrice: list, salePrice: list });
    }
    var amount = list - salePrice;
    return {
      active: true,
      amount: amount,
      pct: pct,
      label: 'Khuyến mãi ' + pct + '% (' + cyclePromoLabel(cycle) + ')',
      badge: '-' + pct + '%',
      listPrice: list,
      salePrice: salePrice
    };
  }

  function annualPerMonth(plan) {
    if (!plan || !(plan.priceYear > 0)) return 0;
    return Math.round(plan.priceYear / 12);
  }

  function listPriceAmount(plan, cycle) {
    var promo = promoDiscount(plan, cycle);
    if (promo.active) return promo.listPrice;
    return priceAmount(plan, cycle);
  }

  function cycleDiscount(plan, cycle) {
    var promo = promoDiscount(plan, cycle);
    if (!promo.active) return { amount: 0, pct: 0, label: '', badge: '' };
    return {
      amount: promo.amount,
      pct: promo.pct,
      label: promo.label,
      badge: promo.badge
    };
  }

  function priceAmount(plan, cycle) {
    if (!plan) return 0;
    var promo = promoDiscount(plan, cycle);
    if (promo.active) return promo.salePrice;
    return listPriceForCycle(plan, cycle);
  }

  function displayPrice(plan, cycle) {
    if (!plan) return { main: '0', per: '', sub: '\u00a0' };
    if (plan.tier === 'free') {
      return { main: '0', per: 'mãi mãi', sub: '\u00a0' };
    }
    if (cycle === 'lifetime') {
      var lifePromo = promoDiscount(plan, 'lifetime');
      if (lifePromo.active) {
        return {
          main: fmtNum(lifePromo.salePrice),
          per: 'một lần',
          sub: 'Giá gốc ' + fmt(plan.priceLifetime) + ' · ' + lifePromo.badge
        };
      }
      return {
        main: fmtNum(plan.priceLifetime),
        per: 'một lần',
        sub: 'Trọn đời · không gia hạn'
      };
    }
    if (cycle === 'annual') {
      var annualPromo = promoDiscount(plan, 'annual');
      if (annualPromo.active) {
        return {
          main: fmtNum(Math.round(annualPromo.salePrice / 12)),
          per: '/tháng',
          sub: fmt(annualPromo.salePrice) + '/năm · ' + annualPromo.badge
        };
      }
      return {
        main: fmtNum(annualPerMonth(plan)),
        per: '/tháng',
        sub: plan.priceYear ? (fmt(plan.priceYear) + '/năm') : '\u00a0'
      };
    }
    var monthPromo = promoDiscount(plan, 'monthly');
    if (monthPromo.active) {
      return {
        main: fmtNum(monthPromo.salePrice),
        per: '/tháng',
        sub: 'Giá gốc ' + fmt(plan.priceMonth) + '/tháng · ' + monthPromo.badge
      };
    }
    return {
      main: fmtNum(plan.priceMonth),
      per: '/tháng',
      sub: plan.trial > 0 ? ('Dùng thử ' + plan.trial + ' ngày miễn phí') : '\u00a0'
    };
  }

  function iconColor(plan) {
    if (plan.iconClass === 'warning') return 'var(--iflux-orange)';
    if (plan.iconClass === 'success') return 'var(--ix-success)';
    if (plan.iconClass === 'info') return 'var(--ix-accent)';
    if (plan.tier === 'free') return 'var(--ix-accent)';
    return 'var(--ix-accent)';
  }

  function buildFeatures(plan) {
    var rows = [];
    if (plan.desc) {
      plan.desc.split(/[.·]\s+/).filter(function (s) { return s.trim(); }).forEach(function (part) {
        rows.push({ has: true, text: part.trim() });
      });
    }
    ENT_LABELS.forEach(function (item) {
      rows.push({ has: !!(plan.ent && plan.ent[item.key]), text: item.label });
    });
    if (plan.limits) {
      rows.push({
        has: (plan.limits.watchlistItems || 0) > 5,
        text: 'Watchlist tối đa ' + (plan.limits.watchlistItems || 0) + ' mã / tab'
      });
      rows.push({
        has: (plan.limits.apiRate || 0) > 200,
        text: 'API rate ' + (plan.limits.apiRate || 0) + ' req/phút'
      });
      if (plan.ent && plan.ent.alerts) {
        rows.push({
          has: true,
          text: 'Tối đa ' + (plan.limits.alerts || 0) + ' cảnh báo active'
        });
      }
    }
    if (plan.trial > 0 && plan.tier !== 'free') {
      rows.push({ has: true, text: 'Dùng thử ' + plan.trial + ' ngày (gói tháng/năm)' });
    }
    return rows;
  }

  function checkoutUrl(plan, cycle) {
    var tier = plan.tier || plan.id;
    return '../account/checkout.html?plan=' + encodeURIComponent(tier) + '&cycle=' + encodeURIComponent(cycle);
  }

  function compareRows() {
    return [
      { label: 'Dòng tiền real-time', type: 'ent', key: 'flowRt' },
      { label: 'Biểu đồ nến chi tiết', type: 'ent', key: 'candles' },
      { label: 'Cảnh báo nâng cao', type: 'ent', key: 'alerts' },
      { label: 'Widget Dashboard', type: 'ent', key: 'widgets' },
      { label: 'Max cảnh báo', type: 'limit', key: 'alerts' },
      { label: 'Watchlist / tab', type: 'limit', key: 'watchlistItems' },
      { label: 'API rate (req/phút)', type: 'limit', key: 'apiRate' }
    ];
  }

  function compareCell(plan, row) {
    if (row.type === 'ent') {
      var on = plan.ent && plan.ent[row.key];
      return on
        ? '<td class="check"><i class="ti ti-check"></i></td>'
        : '<td class="dash">—</td>';
    }
    var val = plan.limits ? plan.limits[row.key] : null;
    if (val == null) return '<td class="dash">—</td>';
    return '<td>' + esc(String(val)) + '</td>';
  }

  global.IfluxPlansCatalog = {
    listPlans: listPlans,
    getPlan: getPlan,
    guestPlan: guestPlan,
    publishedPlans: publishedPlans,
    purchasablePlans: purchasablePlans,
    tierRank: tierRank,
    hasUpgradePath: hasUpgradePath,
    nextUpgradeablePlan: nextUpgradeablePlan,
    anyLifetimeEnabled: anyLifetimeEnabled,
    promoDiscount: promoDiscount,
    resolvePromoPct: resolvePromoPct,
    listPriceForCycle: listPriceForCycle,
    annualPerMonth: annualPerMonth,
    listPriceAmount: listPriceAmount,
    cycleDiscount: cycleDiscount,
    priceAmount: priceAmount,
    displayPrice: displayPrice,
    buildFeatures: buildFeatures,
    checkoutUrl: checkoutUrl,
    compareRows: compareRows,
    compareCell: compareCell,
    fmt: fmt,
    fmtNum: fmtNum,
    esc: esc,
    badgeText: function (b) { return BADGE_TEXT[b] || ''; },
    iconColor: iconColor,
    displayName: displayName
  };
})(window);
