/* ADM-DASH — thống kê từ dữ liệu sandbox (customers, orders, plans) */
(function (global) {
  'use strict';

  function getPlans() {
    if (global.PlansStore && PlansStore.listPlans) return PlansStore.listPlans();
    return [];
  }

  function planByTier(tier) {
    return getPlans().find(function (p) { return p.tier === tier; }) || null;
  }

  function normalizePkg(pkg) {
    var s = String(pkg || 'Free');
    if (s === 'Elite') return 'elite';
    if (s === 'Premium') return 'premium';
    return 'free';
  }

  function mrrFromOrder(order, plan) {
    if (!plan || !order) return 0;
    if (order.cycle === 'annual') return Math.round((plan.priceYear || 0) / 12);
    if (order.cycle === 'lifetime') return 0;
    return plan.priceMonth || 0;
  }

  function fmtMrr(n) {
    n = Number(n) || 0;
    if (n >= 1000000000) return '₫' + (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1000000) return '₫' + Math.round(n / 1000000) + 'M';
    if (n >= 1000) return '₫' + Math.round(n / 1000) + 'K';
    return '₫' + Math.round(n);
  }

  function dayLabel(d, isToday) {
    if (isToday) return 'Hôm nay';
    var days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[d.getDay()];
  }

  function monthLabel(d) {
    return 'T' + (d.getMonth() + 1);
  }

  function trendPct(cur, prev) {
    if (!prev) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 1000) / 10;
  }

  function compute() {
    var customers = global.IfluxCustomersStore ? IfluxCustomersStore.listCustomers() : [];
    var orders = global.IfluxSubscriptionOrdersStore ? IfluxSubscriptionOrdersStore.listOrders() : [];
    var paidOrders = orders.filter(function (o) {
      return o.status === 'approved' || o.status === 'paid';
    });

    var planCounts = { free: 0, premium: 0, elite: 0 };
    var paidSubs = 0;
    var mrr = 0;
    var userMrr = {};

    customers.forEach(function (c) {
      var tier = normalizePkg(c.package);
      planCounts[tier] += 1;
      if (tier !== 'free' && c.accountStatus !== 'suspended') paidSubs += 1;
    });

    paidOrders.forEach(function (o) {
      var tier = o.planTier || normalizePkg(o.planName);
      var plan = planByTier(tier);
      var part = mrrFromOrder(o, plan);
      if (!userMrr[o.userId] || part > userMrr[o.userId]) userMrr[o.userId] = part;
    });

    Object.keys(userMrr).forEach(function (uid) {
      mrr += userMrr[uid];
    });

    if (!mrr && paidSubs > 0) {
      customers.forEach(function (c) {
        var tier = normalizePkg(c.package);
        if (tier === 'free') return;
        var plan = planByTier(tier);
        if (plan) mrr += plan.priceMonth || 0;
      });
    }

    var dau = customers.filter(function (c) { return c.accountStatus === 'active'; }).length;
    if (!dau && customers.length) dau = customers.length;

    var now = new Date();
    var dauLabels = [];
    var dauData = [];
    var i;
    for (i = 11; i >= 0; i--) {
      var d = new Date(now);
      d.setHours(23, 59, 59, 999);
      d.setDate(d.getDate() - i);
      dauLabels.push(dayLabel(d, i === 0));

      var activeByDay = {};
      customers.forEach(function (c) {
        if (c.accountStatus === 'active') activeByDay[c.id || c.email] = true;
      });
      paidOrders.forEach(function (o) {
        if (new Date(o.createdAt) <= d) activeByDay[o.userId] = true;
      });
      dauData.push(Math.max(Object.keys(activeByDay).length, i === 0 ? dau : 0));
    }
    if (dauData[dauData.length - 1] < dau) dauData[dauData.length - 1] = dau;

    var mrrLabels = [];
    var mrrData = [];
    for (i = 6; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var end = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999);
      mrrLabels.push(monthLabel(m));
      var monthMrr = 0;
      var seen = {};
      paidOrders.forEach(function (o) {
        if (new Date(o.createdAt) > end) return;
        if (seen[o.userId]) return;
        var tier = o.planTier || normalizePkg(o.planName);
        var part = mrrFromOrder(o, planByTier(tier));
        if (part > 0) {
          seen[o.userId] = true;
          monthMrr += part;
        }
      });
      mrrData.push(Math.round(monthMrr / 1000000 * 10) / 10);
    }
    if (mrrData[mrrData.length - 1] === 0 && mrr > 0) {
      mrrData[mrrData.length - 1] = Math.round(mrr / 1000000 * 10) / 10;
    }

    var dauPrev = dauData.length >= 2 ? dauData[dauData.length - 2] : 0;
    var mrrPrev = mrrData.length >= 2 ? mrrData[mrrData.length - 2] : 0;
    var mrrCurM = mrrData[mrrData.length - 1] || 0;

    return {
      dau: dau,
      dauTrend: trendPct(dau, dauPrev),
      mrr: mrr,
      mrrFormatted: fmtMrr(mrr),
      mrrTrend: trendPct(mrrCurM, mrrPrev),
      paidSubs: paidSubs,
      planCounts: planCounts,
      totalCustomers: customers.length,
      pendingOrders: orders.filter(function (o) { return o.status === 'pending'; }).length,
      dauChart: { labels: dauLabels, data: dauData },
      mrrChart: { labels: mrrLabels, data: mrrData },
      donut: {
        series: [planCounts.free, planCounts.premium, planCounts.elite],
        total: planCounts.free + planCounts.premium + planCounts.elite
      }
    };
  }

  global.IfluxDashboardStats = {
    compute: compute,
    fmtMrr: fmtMrr
  };
})(window);
