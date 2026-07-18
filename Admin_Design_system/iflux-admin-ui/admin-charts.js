/* Shared ApexCharts init — patterns/charts.html + ADM-MDO-001 Feed Health */
(function (global) {
  var C = {
    bg: '#2b2c40',
    grid: 'rgba(207,211,236,0.08)',
    accent: '#696cff',
    success: '#71dd37',
    warning: '#ffab00',
    danger: '#ff3e1d',
    info: '#03c3ec',
    text: '#8592a3',
    label: '#cfd3ec'
  };

  function baseOpts() {
    return {
      chart: { background: 'transparent', toolbar: { show: false }, fontFamily: "'Be Vietnam Pro', sans-serif" },
      grid: { borderColor: C.grid, strokeDashArray: 4 },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };
  }

  function axisStyle() {
    return {
      labels: { style: { colors: C.text } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    };
  }

  function mockCandleData(days) {
    var data = [];
    var price = 86500;
    var now = Date.now();
    for (var i = days; i >= 0; i--) {
      var open = price;
      var delta = (Math.random() - 0.48) * 1800;
      var close = Math.round(open + delta);
      var high = Math.max(open, close) + Math.round(Math.random() * 900);
      var low = Math.min(open, close) - Math.round(Math.random() * 900);
      data.push({
        x: new Date(now - i * 86400000),
        y: [open, high, low, close]
      });
      price = close;
    }
    return data;
  }

  function mockVolumeData(candles) {
    return candles.map(function (c) {
      return { x: c.x, y: Math.floor(Math.random() * 4200000) + 800000 };
    });
  }

  var CHARTS = {
    lineAreaChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'area', height: 220 }),
        series: [{ name: 'Latency (ms)', data: [12, 18, 15, 22, 19, 28, 24, 31, 26, 35, 29, 33] }],
        colors: [C.accent],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
        xaxis: Object.assign({ categories: ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '13:00', '14:00'] }, axisStyle()),
        yaxis: { labels: { style: { colors: C.text } } },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false }
      }));
    },
    barChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'bar', height: 220 }),
        series: [
          { name: 'Ticks/min', data: [44, 55, 57, 56, 61, 58, 63, 60, 66] },
          { name: 'Expected', data: [76, 85, 101, 98, 87, 105, 91, 114, 94] }
        ],
        colors: [C.accent, C.info],
        plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
        xaxis: Object.assign({ categories: ['HOSE', 'HNX', 'UPCoM', 'WSS-A', 'WSS-B', 'Derived', 'Index', 'Flow', 'Alert'] }, axisStyle()),
        yaxis: { labels: { style: { colors: C.text } } },
        dataLabels: { enabled: false },
        legend: { labels: { colors: C.label } }
      }));
    },
    donutChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'donut', height: 280 }),
        series: [42, 18, 15, 14, 11],
        labels: ['HOSE WSS', 'HNX', 'UPCoM', 'Derived', 'Backup'],
        colors: [C.accent, C.success, C.warning, C.info, C.danger],
        legend: { position: 'bottom', labels: { colors: C.label } },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '70%' } } }
      }));
    },
    radialChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'radialBar', height: 280 }),
        series: [99.2, 97.8, 94.5],
        labels: ['Uptime', 'Tick coverage', 'SLA'],
        colors: [C.accent, C.success, C.warning],
        plotOptions: { radialBar: { dataLabels: { name: { show: true, color: C.label }, value: { color: C.label } } } },
        legend: { show: true, position: 'bottom', labels: { colors: C.label } }
      }));
    },
    scatterChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'scatter', height: 240 }),
        series: [
          { name: 'HOSE', data: [[16.4, 5.4], [21.7, 2], [25.4, 3], [19, 2], [10.9, 1], [13.6, 3.2], [10.9, 7.4], [10.9, 0], [13.6, 6.2]] },
          { name: 'HNX', data: [[36.4, 13.4], [1.7, 11], [5.4, 8], [9, 17], [1.9, 4], [3.6, 12.2], [1.9, 14.4], [1.9, 9], [3.6, 3.2]] }
        ],
        colors: [C.accent, C.success],
        xaxis: { title: { text: 'Lag (ms)', style: { color: C.text } }, labels: { style: { colors: C.text } }, axisBorder: { show: false } },
        yaxis: { title: { text: 'Gap (s)', style: { color: C.text } }, labels: { style: { colors: C.text } } },
        legend: { labels: { colors: C.label } }
      }));
    },
    heatmapChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'heatmap', height: 240 }),
        series: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(function (d) {
          return { name: d, data: Array.from({ length: 12 }, function () { return Math.floor(Math.random() * 80) + 10; }) };
        }),
        dataLabels: { enabled: false },
        xaxis: Object.assign({ categories: ['09', '09:15', '09:30', '09:45', '10', '10:15', '10:30', '10:45', '11', '13', '14', '14:30'] }, axisStyle()),
        yaxis: { labels: { style: { colors: C.text } } },
        colors: [C.accent]
      }));
    },
    candlestickChart: function (el) {
      var candles = mockCandleData(24);
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'candlestick', height: 280 }),
        series: [{ name: 'VNM', data: candles }],
        colors: [C.success],
        plotOptions: {
          candlestick: {
            colors: { upward: C.success, downward: C.danger },
            wick: { useFillColor: true }
          }
        },
        xaxis: { type: 'datetime', labels: { style: { colors: C.text } }, axisBorder: { show: false } },
        yaxis: {
          tooltip: { enabled: true },
          labels: {
            style: { colors: C.text },
            formatter: function (v) { return Math.round(v).toLocaleString('vi-VN'); }
          }
        }
      }));
    },
    stockVolumeChart: function (el) {
      var candles = mockCandleData(24);
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'bar', height: 120 }),
        series: [{ name: 'Volume', data: mockVolumeData(candles) }],
        colors: [C.info],
        plotOptions: { bar: { columnWidth: '80%', borderRadius: 2 } },
        xaxis: { type: 'datetime', labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: C.text }, formatter: function (v) { return (v / 1000000).toFixed(1) + 'M'; } } },
        dataLabels: { enabled: false },
        grid: { padding: { top: 0, bottom: 0 } }
      }));
    },
    dashDauChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'area', height: 260 }),
        series: [{ name: 'DAU', data: [18200, 19400, 18800, 20100, 21200, 20800, 22400, 23100, 22800, 24200, 23800, 25120] }],
        colors: [C.accent],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
        xaxis: Object.assign({ categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4', 'T5', 'Hôm nay'] }, axisStyle()),
        yaxis: { labels: { style: { colors: C.text }, formatter: function (v) { return (v / 1000).toFixed(1) + 'K'; } } },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false }
      }));
    },
    dashMrrChart: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'bar', height: 260 }),
        series: [{ name: 'MRR (₫M)', data: [368, 372, 385, 391, 402, 415, 428] }],
        colors: [C.success],
        plotOptions: { bar: { columnWidth: '50%', borderRadius: 6 } },
        xaxis: Object.assign({ categories: ['T10', 'T11', 'T12', 'T1', 'T2', 'T3', 'T4'] }, axisStyle()),
        yaxis: { labels: { style: { colors: C.text }, formatter: function (v) { return '₫' + v + 'M'; } } },
        dataLabels: { enabled: false }
      }));
    },
    dashPlanDonut: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'donut', height: 280 }),
        series: [248120, 11240, 1600],
        labels: ['Miễn phí', 'Premium', 'Elite'],
        colors: [C.info, C.accent, C.warning],
        legend: { position: 'bottom', labels: { colors: C.label } },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: 'Tổng', color: C.label, formatter: function () { return '260K'; } } } } } }
      }));
    },
    dashFeedArea: function (el) {
      return new ApexCharts(el, Object.assign({}, baseOpts(), {
        chart: Object.assign({}, baseOpts().chart, { type: 'line', height: 200 }),
        series: [{ name: 'Latency (ms)', data: [18, 22, 19, 24, 21, 28, 24, 20, 23, 19, 22, 18] }],
        colors: [C.info],
        stroke: { curve: 'smooth', width: 2 },
        xaxis: Object.assign({ categories: ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '13:00', '14:00'] }, axisStyle()),
        yaxis: { labels: { style: { colors: C.text } } },
        dataLabels: { enabled: false }
      }));
    }
  };

  var DASHBOARD_IDS = ['dashDauChart', 'dashMrrChart', 'dashPlanDonut', 'dashFeedArea'];

  global.AdminCharts = {
    COLORS: C,
    CHART_IDS: Object.keys(CHARTS),
    DASHBOARD_IDS: DASHBOARD_IDS,

    init: function (ids) {
      if (typeof ApexCharts === 'undefined') return [];
      var list = ids || Object.keys(CHARTS);
      var instances = [];
      list.forEach(function (id) {
        var el = document.getElementById(id);
        var factory = CHARTS[id];
        if (el && factory) {
          instances.push(factory(el).render());
        }
      });
      return instances;
    },

    initDashboard: function () {
      return this.init(DASHBOARD_IDS);
    }
  };
})(window);
