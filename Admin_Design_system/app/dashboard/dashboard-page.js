/* ADM-DASH — Đơn hàng mới nhất + KPI + biểu đồ thực tế */
(function (global) {
  'use strict';

  var Store = global.IfluxSubscriptionOrdersStore;
  var chartInstances = [];

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function statusBadge(status) {
    if (status === 'pending') return '<span class="ix-badge ix-badge-warning">Chờ duyệt</span>';
    if (status === 'approved' || status === 'paid') return '<span class="ix-badge ix-badge-success">' + (status === 'paid' ? 'Đã TT' : 'Đã duyệt') + '</span>';
    if (status === 'rejected') return '<span class="ix-badge ix-badge-danger">Từ chối</span>';
    return '<span class="ix-badge">' + esc(Store.statusLabel(status)) + '</span>';
  }

  function orderActions(o) {
    if (o.status !== 'pending') {
      return '<span style="font-size:12px;color:var(--ix-text-muted)">' +
        (o.approvedAt ? fmtDate(o.approvedAt) : (o.rejectedAt ? fmtDate(o.rejectedAt) : '—')) +
      '</span>';
    }
    return (
      '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-dash-txn-approve="' + esc(o.id) + '"><i class="ti ti-check"></i> Duyệt</button> ' +
      '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-dash-txn-reject="' + esc(o.id) + '"><i class="ti ti-x"></i> Từ chối</button>'
    );
  }

  function setTrend(el, pct, suffix) {
    if (!el) return;
    var up = pct >= 0;
    el.className = 'ix-stat-trend ' + (up ? 'up' : 'down');
    el.innerHTML = '<i class="ti ti-trending-' + (up ? 'up' : 'down') + '" style="font-size:11px"></i> ' +
      (up ? '+' : '') + pct + '% ' + (suffix || '');
  }

  function renderKpis(stats) {
    var el;
    el = document.getElementById('dash-kpi-dau');
    if (el) el.textContent = String(stats.dau);
    setTrend(document.getElementById('dash-kpi-dau-trend'), stats.dauTrend, 'vs hôm qua');

    el = document.getElementById('dash-kpi-mrr');
    if (el) el.textContent = stats.mrrFormatted;
    setTrend(document.getElementById('dash-kpi-mrr-trend'), stats.mrrTrend, 'tháng này');

    el = document.getElementById('dash-kpi-paid');
    if (el) el.textContent = String(stats.paidSubs);
    el = document.getElementById('dash-kpi-paid-trend');
    if (el) {
      el.className = 'ix-stat-trend up';
      el.innerHTML = '<i class="ti ti-receipt" style="font-size:11px"></i> ' +
        stats.pendingOrders + ' đơn chờ duyệt';
    }

    el = document.getElementById('dash-kpi-total');
    if (el) el.textContent = String(stats.totalCustomers);
  }

  function destroyCharts() {
    chartInstances.forEach(function (c) {
      try { c.destroy(); } catch (e) { /* ignore */ }
    });
    chartInstances = [];
  }

  function renderCharts(stats) {
    if (typeof ApexCharts === 'undefined' || !global.AdminCharts) return;
    destroyCharts();
    var C = AdminCharts.COLORS;
    var base = {
      chart: { background: 'transparent', toolbar: { show: false }, fontFamily: "'Be Vietnam Pro', sans-serif" },
      grid: { borderColor: C.grid, strokeDashArray: 4 },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };
    var axis = {
      labels: { style: { colors: C.text } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    };

    var dauEl = document.getElementById('dashDauChart');
    if (dauEl) {
      var dauChart = new ApexCharts(dauEl, Object.assign({}, base, {
        chart: Object.assign({}, base.chart, { type: 'area', height: 220 }),
        series: [{ name: 'Người dùng active', data: stats.dauChart.data }],
        colors: [C.accent],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
        xaxis: Object.assign({ categories: stats.dauChart.labels }, axis),
        yaxis: {
          min: 0,
          forceNiceScale: true,
          labels: { style: { colors: C.text }, formatter: function (v) { return Math.round(v); } }
        },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false }
      }));
      dauChart.render();
      chartInstances.push(dauChart);
    }

    var donutEl = document.getElementById('dashPlanDonut');
    if (donutEl) {
      var total = stats.donut.total || 0;
      var series = stats.donut.series.slice();
      var labels = ['Miễn phí', 'Premium', 'Elite'];
      if (!total) {
        series = [1];
        labels = ['Chưa có KH'];
      }
      var donutChart = new ApexCharts(donutEl, Object.assign({}, base, {
        chart: Object.assign({}, base.chart, { type: 'donut', height: 240 }),
        series: series,
        labels: labels,
        colors: [C.info, C.accent, C.warning],
        legend: { position: 'bottom', labels: { colors: C.label } },
        dataLabels: { enabled: true, formatter: function (v) { return Math.round(v) + '%'; } },
        plotOptions: {
          pie: {
            donut: {
              size: '72%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Tổng KH',
                  color: C.label,
                  formatter: function () { return String(total); }
                }
              }
            }
          }
        }
      }));
      donutChart.render();
      chartInstances.push(donutChart);
    }

    var mrrEl = document.getElementById('dashMrrChart');
    if (mrrEl) {
      var mrrChart = new ApexCharts(mrrEl, Object.assign({}, base, {
        chart: Object.assign({}, base.chart, { type: 'bar', height: 220 }),
        series: [{ name: 'MRR (triệu ₫)', data: stats.mrrChart.data }],
        colors: [C.success],
        plotOptions: { bar: { columnWidth: '50%', borderRadius: 6 } },
        xaxis: Object.assign({ categories: stats.mrrChart.labels }, axis),
        yaxis: {
          min: 0,
          labels: { style: { colors: C.text }, formatter: function (v) { return '₫' + v + 'M'; } }
        },
        dataLabels: { enabled: false }
      }));
      mrrChart.render();
      chartInstances.push(mrrChart);
    }

    var feedEl = document.getElementById('dashFeedArea');
    if (feedEl && AdminCharts.init && !feedEl._ifxDashFeed) {
      feedEl._ifxDashFeed = true;
      AdminCharts.init(['dashFeedArea']);
    }
  }

  function renderOrdersTable() {
    if (!Store) return;
    var tbody = document.getElementById('dash-orders-tbody');
    var pendingEl = document.getElementById('dash-orders-pending-count');
    if (!tbody) return;

    var stats = Store.stats();
    if (pendingEl) pendingEl.textContent = String(stats.pendingTransfer || stats.pending || 0);

    var orders = Store.listOrders({ limit: 20 });
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Chưa có đơn hàng. Đơn từ User Web (chuyển khoản / thẻ) sẽ hiện tại đây.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(function (o) {
      return '<tr>' +
        '<td style="font-size:12px;white-space:nowrap">' + fmtDate(o.createdAt) + '</td>' +
        '<td><code style="font-size:11px">' + esc(o.id) + '</code></td>' +
        '<td><div style="font-weight:600">' + esc(o.userName || '—') + '</div><div style="font-size:12px;color:var(--ix-text-muted)">' + esc(o.email) + '</div></td>' +
        '<td>' + esc(o.planName) + '<div style="font-size:11px;color:var(--ix-text-muted)">' +
          esc(o.planTier || '') + ' · ' + esc(Store.cycleLabel(o.cycle)) + '</div></td>' +
        '<td style="font-weight:600">' + esc(Store.fmt(o.amount)) + '</td>' +
        '<td>' + esc(Store.payMethodLabel(o.payMethod)) + '</td>' +
        '<td>' + statusBadge(o.status) + '</td>' +
        '<td style="white-space:nowrap">' + orderActions(o) + '</td>' +
      '</tr>';
    }).join('');
  }

  function refreshOrdersAndUi() {
    if (!Store) return Promise.resolve();
    if (Store.invalidateCache) Store.invalidateCache();
    var refresh = Store.refreshFromApi ? Store.refreshFromApi() : Promise.resolve();
    return Promise.resolve(refresh).then(function () {
      refreshAll();
    }).catch(function () {
      refreshAll();
    });
  }

  function refreshAfterOrderAction() {
    refreshOrdersAndUi().then(function () {
      if (global.IfluxAdminNotifications && IfluxAdminNotifications.syncOrdersFromStore) {
        IfluxAdminNotifications.syncOrdersFromStore();
      }
    });
  }

  function bindOrderActions() {
    document.addEventListener('click', function (e) {
      if (!Store) return;
      var approveBtn = e.target.closest('[data-dash-txn-approve]');
      var rejectBtn = e.target.closest('[data-dash-txn-reject]');

      if (approveBtn) {
        var id = approveBtn.getAttribute('data-dash-txn-approve');
        if (!confirm('Xác nhận duyệt đơn ' + id + ' và kích hoạt gói cho khách?')) return;
        Promise.resolve(Store.approveOrder(id, { adminName: 'Admin' })).then(function (res) {
          if (res.ok) {
            if (global.ixToast) ixToast('Đã duyệt và kích hoạt gói cho khách hàng', 'success');
            refreshAfterOrderAction();
          } else if (global.ixToast) ixToast('Không thể duyệt đơn này', 'danger');
        });
        return;
      }

      if (rejectBtn) {
        var rid = rejectBtn.getAttribute('data-dash-txn-reject');
        var reason = prompt('Lý do từ chối (tuỳ chọn):', 'Không tìm thấy giao dịch chuyển khoản');
        if (reason === null) return;
        Promise.resolve(Store.rejectOrder(rid, reason, { adminName: 'Admin' })).then(function (rej) {
          if (rej.ok) {
            if (global.ixToast) ixToast('Đã từ chối đơn', 'info');
            refreshAfterOrderAction();
          }
        });
      }
    });
  }

  function refreshAll() {
    if (!global.IfluxDashboardStats) return;
    var stats = IfluxDashboardStats.compute();
    renderKpis(stats);
    renderCharts(stats);
    renderOrdersTable();
  }

  function init() {
    if (global.IfluxAdminNotifications && Store) {
      IfluxAdminNotifications.syncOrdersFromStore();
    }
    bindOrderActions();
    refreshOrdersAndUi();
    document.addEventListener('iflux-orders-changed', refreshAll);
    document.addEventListener('iflux-admin-notif-changed', refreshAll);
    window.addEventListener('storage', function (e) {
      if (e.key === 'iflux_checkout_orders_v1') {
        refreshOrdersAndUi();
      } else if (e.key === 'iflux_admin_notifications_v1' || e.key === 'iflux_customers_v1') {
        if (global.IfluxAdminNotifications) {
          IfluxAdminNotifications.syncOrdersFromStore();
          IfluxAdminNotifications.showUnreadToasts();
        }
        refreshAll();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
