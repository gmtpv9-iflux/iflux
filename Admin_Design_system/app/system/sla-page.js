/* ADM-SYS-001 — Bảng SLA (L2 Product SLA) */
(function (global) {
  'use strict';

  var charts = [];
  var refreshTimer = null;

  var C = {
    accent: '#696cff',
    success: '#71dd37',
    warning: '#ffab00',
    danger: '#ff3e1d',
    info: '#03c3ec',
    text: '#8592a3',
    label: '#cfd3ec',
    grid: 'rgba(207,211,236,0.08)'
  };

  var SLA_ITEMS = [
    {
      id: 'nfr-p01',
      code: 'NFR-P01',
      name: 'Real-time latency',
      metric: 'p95 tick matched → app display',
      target: '≤ 3s',
      unit: 's',
      compare: 'lte',
      threshold: 3,
      warnAt: 2.4,
      current: 1.82,
      status: 'green',
      lastBreach: '—',
      source: 'WSS client timestamp'
    },
    {
      id: 'nfr-p02',
      code: 'NFR-P02',
      name: 'Screen load',
      metric: 'p95 API response time',
      target: '≤ 2s',
      unit: 's',
      compare: 'lte',
      threshold: 2,
      warnAt: 1.6,
      current: 0.94,
      status: 'green',
      lastBreach: '12/06 14:22',
      source: 'API Gateway histogram'
    },
    {
      id: 'nfr-p03',
      code: 'NFR-P03',
      name: 'Push alert delivery',
      metric: 'p95 trigger → notification',
      target: '≤ 5s',
      unit: 's',
      compare: 'lte',
      threshold: 5,
      warnAt: 4,
      current: 3.1,
      status: 'green',
      lastBreach: '—',
      source: 'FCM / APNs receipt'
    },
    {
      id: 'nfr-p04',
      code: 'NFR-P04',
      name: 'Synthetic index update',
      metric: 'p95 Kafka consumer → Redis',
      target: '≤ 5s',
      unit: 's',
      compare: 'lte',
      threshold: 5,
      warnAt: 4,
      current: 4.6,
      status: 'yellow',
      lastBreach: '—',
      source: 'Kafka consumer lag'
    },
    {
      id: 'nfr-a01',
      code: 'NFR-A01',
      name: 'System uptime',
      metric: '% API available (giờ giao dịch)',
      target: '≥ 99.5%',
      unit: '%',
      compare: 'gte',
      threshold: 99.5,
      warnAt: 99.7,
      current: 99.82,
      status: 'green',
      lastBreach: '08/06 09:12',
      source: 'Synthetic monitoring'
    },
    {
      id: 'provider',
      code: 'PROV-01',
      name: 'Data provider connection',
      metric: 'Feed HOSE / HNX / UPCoM',
      target: 'Connected',
      unit: '',
      compare: 'enum',
      enumOk: ['Connected'],
      enumWarn: ['Degraded'],
      currentLabel: 'Connected',
      status: 'green',
      lastBreach: '05/06 10:41',
      source: 'Heartbeat 10s'
    },
    {
      id: 'ws-users',
      code: 'OPS-01',
      name: 'Concurrent users',
      metric: 'WebSocket connections',
      target: '—',
      unit: '',
      compare: 'info',
      currentLabel: '2,847',
      status: 'green',
      lastBreach: '—',
      source: 'WS Gateway'
    }
  ];

  var VIOLATIONS = [
    { at: '13/06 09:18', sla: 'NFR-P04', severity: 'P2', detail: 'Kafka lag p95 = 5.8s · consumer group index-writer', resolved: '09:24' },
    { at: '12/06 14:22', sla: 'NFR-P02', severity: 'P2', detail: 'API p95 = 2.4s · GET /market/heatmap', resolved: '14:35' },
    { at: '08/06 09:12', sla: 'NFR-A01', severity: 'P1', detail: 'Uptime 98.2% trong 5 phút · gateway-02', resolved: '09:27' },
    { at: '05/06 10:41', sla: 'PROV-01', severity: 'P1', detail: 'HOSE feed Degraded 47s · chuyển backup WSS', resolved: '10:43' }
  ];

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtNow() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function statusChip(status) {
    if (status === 'green') return '<span class="ix-chip ix-chip-success"><i class="ti ti-circle-filled" style="font-size:8px;margin-right:4px"></i> Pass</span>';
    if (status === 'yellow') return '<span class="ix-chip ix-chip-warning"><i class="ti ti-circle-filled" style="font-size:8px;margin-right:4px"></i> Cảnh báo</span>';
    if (status === 'red') return '<span class="ix-chip ix-chip-danger"><i class="ti ti-circle-filled" style="font-size:8px;margin-right:4px"></i> Vi phạm</span>';
    return '<span class="ix-chip">—</span>';
  }

  function severityChip(sev) {
    if (sev === 'P1') return '<span class="ix-chip ix-chip-danger">' + sev + '</span>';
    if (sev === 'P2') return '<span class="ix-chip ix-chip-warning">' + sev + '</span>';
    return '<span class="ix-chip ix-chip-info">' + sev + '</span>';
  }

  function computeStatus(item) {
    if (item.compare === 'info' || item.compare === 'enum') return item.status;
    var v = item.current;
    if (item.compare === 'lte') {
      if (v > item.threshold) return 'red';
      if (v > item.warnAt) return 'yellow';
      return 'green';
    }
    if (item.compare === 'gte') {
      if (v < item.threshold) return 'red';
      if (v < item.warnAt) return 'yellow';
      return 'green';
    }
    return 'green';
  }

  function currentDisplay(item) {
    if (item.currentLabel) return item.currentLabel;
    if (item.unit === '%') return item.current.toFixed(2) + '%';
    if (item.unit === 's') return item.current.toFixed(2) + 's';
    return String(item.current);
  }

  function overallStatus() {
    var hasRed = SLA_ITEMS.some(function (i) { return computeStatus(i) === 'red'; });
    if (hasRed) return 'red';
    var hasYellow = SLA_ITEMS.some(function (i) { return computeStatus(i) === 'yellow'; });
    if (hasYellow) return 'yellow';
    return 'green';
  }

  function mockTick() {
    SLA_ITEMS.forEach(function (item) {
      if (item.compare === 'info' || item.compare === 'enum') return;
      var delta = (Math.random() - 0.5) * (item.unit === '%' ? 0.08 : 0.35);
      item.current = Math.max(0, +(item.current + delta).toFixed(2));
      item.status = computeStatus(item);
    });
  }

  function renderBanner() {
    var el = document.getElementById('sla-overall-banner');
    if (!el) return;
    var st = overallStatus();
    var map = {
      green: {
        cls: 'sla-banner sla-banner--green',
        icon: 'ti-circle-check',
        title: 'Tất cả SLA đang đạt',
        sub: 'Deploy gate mở — không có vi phạm đang diễn ra (BR-OBS-05).'
      },
      yellow: {
        cls: 'sla-banner sla-banner--yellow',
        icon: 'ti-alert-triangle',
        title: 'Có chỉ số sắp chạm ngưỡng',
        sub: 'Theo dõi sát · chưa chặn deploy nhưng cần điều tra trước phiên chiều.'
      },
      red: {
        cls: 'sla-banner sla-banner--red',
        icon: 'ti-alert-circle',
        title: 'Đang vi phạm SLA',
        sub: 'Deploy gate đóng — không deploy tính năng mới cho đến khi hết vi phạm.'
      }
    };
    var m = map[st];
    el.className = m.cls;
    el.innerHTML =
      '<div class="sla-banner__icon"><i class="ti ' + m.icon + '"></i></div>' +
      '<div><div class="sla-banner__title">' + m.title + '</div>' +
      '<div class="sla-banner__sub">' + m.sub + '</div></div>' +
      '<div class="sla-banner__meta"><span class="ix-chip ix-chip-outline">L2 · Product SLA</span>' +
      '<span style="font-size:12px;color:var(--ix-text-muted)">Cập nhật: <span data-sla-updated>' + fmtNow() + '</span></span></div>';
  }

  function renderSummary() {
    var pass = SLA_ITEMS.filter(function (i) {
      var s = computeStatus(i);
      return s === 'green' || i.compare === 'info';
    }).length;
    var warn = SLA_ITEMS.filter(function (i) { return computeStatus(i) === 'yellow'; }).length;
    var fail = SLA_ITEMS.filter(function (i) { return computeStatus(i) === 'red'; }).length;
    var uptime = SLA_ITEMS.find(function (i) { return i.id === 'nfr-a01'; });
    var ws = SLA_ITEMS.find(function (i) { return i.id === 'ws-users'; });

    var set = function (id, html) {
      var n = document.getElementById(id);
      if (n) n.innerHTML = html;
    };

    set('sla-sum-pass', String(pass) + '<span style="font-size:14px;color:var(--ix-text-muted)">/' + SLA_ITEMS.length + '</span>');
    set('sla-sum-warn', String(warn));
    set('sla-sum-fail', String(fail));
    set('sla-sum-uptime', uptime ? uptime.current.toFixed(2) + '%' : '—');
    set('sla-sum-ws', ws ? ws.currentLabel : '—');
  }

  function renderTable() {
    var tbody = document.getElementById('sla-table-body');
    if (!tbody) return;
    tbody.innerHTML = SLA_ITEMS.map(function (item) {
      var st = computeStatus(item);
      return '<tr data-sla-row="' + esc(item.id) + '">' +
        '<td><strong>' + esc(item.code) + '</strong><div style="font-size:12px;color:var(--ix-text-muted);margin-top:2px">' + esc(item.name) + '</div></td>' +
        '<td style="font-size:13px;color:var(--ix-text-secondary)">' + esc(item.metric) + '</td>' +
        '<td><code style="font-size:12px">' + esc(item.target) + '</code></td>' +
        '<td style="font-weight:600;font-size:15px">' + esc(currentDisplay(item)) + '</td>' +
        '<td>' + statusChip(st) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(item.lastBreach) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(item.source) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderViolations() {
    var tbody = document.getElementById('sla-violations-body');
    if (!tbody) return;
    tbody.innerHTML = VIOLATIONS.map(function (v) {
      return '<tr>' +
        '<td>' + esc(v.at) + '</td>' +
        '<td><strong>' + esc(v.sla) + '</strong></td>' +
        '<td>' + severityChip(v.severity) + '</td>' +
        '<td style="font-size:13px">' + esc(v.detail) + '</td>' +
        '<td>' + esc(v.resolved) + '</td>' +
      '</tr>';
    }).join('');
  }

  function baseChartOpts() {
    return {
      chart: { background: 'transparent', toolbar: { show: false }, fontFamily: "'Be Vietnam Pro', sans-serif" },
      grid: { borderColor: C.grid, strokeDashArray: 4 },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };
  }

  function destroyCharts() {
    charts.forEach(function (c) {
      try { c.destroy(); } catch (e) {}
    });
    charts = [];
  }

  function initCharts() {
    if (!global.ApexCharts) return;
    destroyCharts();

    var latencyEl = document.getElementById('sla-chart-latency');
    if (latencyEl) {
      var latency = new ApexCharts(latencyEl, Object.assign({}, baseChartOpts(), {
        chart: Object.assign({}, baseChartOpts().chart, { type: 'area', height: 240 }),
        series: [
          { name: 'p95 latency (s)', data: [1.2, 1.4, 1.8, 2.1, 1.9, 1.7, 1.5, 1.6, 1.82, 1.9, 2.0, 1.75, 1.6, 1.55, 1.7, 1.65, 1.8, 1.72, 1.68, 1.82, 1.79, 1.85, 1.81, 1.77] }
        ],
        colors: [C.accent],
        annotations: {
          yaxis: [{
            y: 3,
            borderColor: C.danger,
            label: { text: 'Target 3s', style: { color: '#fff', background: C.danger } }
          }, {
            y: 2.4,
            borderColor: C.warning,
            strokeDashArray: 4,
            label: { text: 'Warn 2.4s', style: { color: '#fff', background: C.warning } }
          }]
        },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
        xaxis: {
          categories: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
          title: { text: '24h qua (giờ)', style: { color: C.text } },
          labels: { style: { colors: C.text } }
        },
        yaxis: { min: 0, max: 4, labels: { style: { colors: C.text }, formatter: function (v) { return v + 's'; } } },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false }
      }));
      latency.render();
      charts.push(latency);
    }

    var uptimeEl = document.getElementById('sla-chart-uptime');
    if (uptimeEl) {
      var uptime = new ApexCharts(uptimeEl, Object.assign({}, baseChartOpts(), {
        chart: Object.assign({}, baseChartOpts().chart, { type: 'line', height: 240 }),
        series: [
          { name: 'Uptime %', data: [99.91, 99.88, 99.95, 99.92, 99.89, 99.94, 99.82] }
        ],
        colors: [C.success],
        annotations: {
          yaxis: [{
            y: 99.5,
            borderColor: C.danger,
            label: { text: 'SLA 99.5%', style: { color: '#fff', background: C.danger } }
          }]
        },
        xaxis: {
          categories: ['T7', 'CN', 'T2', 'T3', 'T4', 'T5', 'H.nay'],
          labels: { style: { colors: C.text } }
        },
        yaxis: { min: 99, max: 100, labels: { style: { colors: C.text }, formatter: function (v) { return v.toFixed(2) + '%'; } } },
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4 },
        dataLabels: { enabled: false }
      }));
      uptime.render();
      charts.push(uptime);
    }
  }

  function refresh() {
    mockTick();
    renderBanner();
    renderSummary();
    renderTable();
    renderViolations();
    var upd = document.querySelector('[data-sla-updated]');
    if (upd) upd.textContent = fmtNow();
  }

  function bind() {
    var btn = document.getElementById('sla-btn-refresh');
    if (btn) btn.addEventListener('click', refresh);
    refreshTimer = setInterval(refresh, 30000);
  }

  function init() {
    renderBanner();
    renderSummary();
    renderTable();
    renderViolations();
    initCharts();
    bind();
  }

  global.SlaPage = { init: init, refresh: refresh };
})(window);
