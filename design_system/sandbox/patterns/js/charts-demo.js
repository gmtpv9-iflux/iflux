/**
 * Sandbox charts — REWRITE admin-charts.js.
 * Màu từ IfxChart.colors() / semantic token. Data generic. 0 business market.
 */
(function (global) {
  'use strict';

  function palette() {
    var c = (global.IfxChart && global.IfxChart.colors()) || {};
    var cs = getComputedStyle(document.documentElement);
    return {
      primary: c.primary,
      success: c.success,
      warning: c.warning,
      danger: c.danger,
      info: c.info,
      secondary: c.secondary,
      text: cs.getPropertyValue('--ifx-text-muted').trim(),
      label: cs.getPropertyValue('--ifx-text-secondary').trim(),
      grid: cs.getPropertyValue('--ifx-border-subtle').trim(),
      theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    };
  }

  function base(p) {
    return {
      chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'Be Vietnam Pro, sans-serif' },
      grid: { borderColor: p.grid, strokeDashArray: 4 },
      theme: { mode: p.theme },
      tooltip: { theme: p.theme }
    };
  }

  function axis(p) {
    return {
      labels: { style: { colors: p.text } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    };
  }

  function mockCandle(days) {
    var data = [];
    var price = 100;
    var now = Date.now();
    for (var i = days; i >= 0; i -= 1) {
      var open = price;
      var close = Math.round(open + (Math.random() - 0.48) * 8);
      var high = Math.max(open, close) + Math.round(Math.random() * 4);
      var low = Math.min(open, close) - Math.round(Math.random() * 4);
      data.push({ x: new Date(now - i * 86400000), y: [open, high, low, close] });
      price = close;
    }
    return data;
  }

  function factories(p) {
    return {
      lineAreaChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'area', height: 220 }),
          series: [{ name: 'Series A', data: [12, 18, 15, 22, 19, 28, 24, 31, 26, 35, 29, 33] }],
          colors: [p.primary],
          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
          xaxis: Object.assign({ categories: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] }, axis(p)),
          yaxis: { labels: { style: { colors: p.text } } },
          stroke: { curve: 'smooth', width: 2 },
          dataLabels: { enabled: false }
        }));
      },
      barChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'bar', height: 220 }),
          series: [
            { name: 'Actual', data: [44, 55, 57, 56, 61, 58, 63, 60, 66] },
            { name: 'Target', data: [76, 85, 101, 98, 87, 105, 91, 114, 94] }
          ],
          colors: [p.primary, p.info],
          plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
          xaxis: Object.assign({ categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] }, axis(p)),
          yaxis: { labels: { style: { colors: p.text } } },
          dataLabels: { enabled: false },
          legend: { labels: { colors: p.label } }
        }));
      },
      donutChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'donut', height: 280 }),
          series: [42, 18, 15, 14, 11],
          labels: ['Nhóm A', 'Nhóm B', 'Nhóm C', 'Nhóm D', 'Nhóm E'],
          colors: [p.primary, p.success, p.warning, p.info, p.danger],
          legend: { position: 'bottom', labels: { colors: p.label } },
          dataLabels: { enabled: false },
          plotOptions: { pie: { donut: { size: '70%' } } }
        }));
      },
      radialChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'radialBar', height: 280 }),
          series: [86, 72, 64],
          labels: ['Chỉ số 1', 'Chỉ số 2', 'Chỉ số 3'],
          colors: [p.primary, p.success, p.warning],
          plotOptions: { radialBar: { dataLabels: { name: { show: true, color: p.label }, value: { color: p.label } } } },
          legend: { show: true, position: 'bottom', labels: { colors: p.label } }
        }));
      },
      scatterChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'scatter', height: 240 }),
          series: [
            { name: 'Tập A', data: [[16, 5], [22, 2], [25, 3], [19, 2], [11, 1], [14, 3], [11, 7]] },
            { name: 'Tập B', data: [[36, 13], [2, 11], [5, 8], [9, 17], [2, 4], [4, 12], [2, 14]] }
          ],
          colors: [p.primary, p.success],
          xaxis: { labels: { style: { colors: p.text } }, axisBorder: { show: false } },
          yaxis: { labels: { style: { colors: p.text } } },
          legend: { labels: { colors: p.label } }
        }));
      },
      heatmapChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'heatmap', height: 240 }),
          series: ['T2', 'T3', 'T4', 'T5', 'T6'].map(function (d) {
            return { name: d, data: [12, 22, 34, 18, 40, 28, 16, 30, 24, 36, 20, 14] };
          }),
          dataLabels: { enabled: false },
          xaxis: Object.assign({ categories: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] }, axis(p)),
          yaxis: { labels: { style: { colors: p.text } } },
          colors: [p.primary]
        }));
      },
      candlestickChart: function (el) {
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'candlestick', height: 280 }),
          series: [{ name: 'Series', data: mockCandle(24) }],
          plotOptions: { candlestick: { colors: { upward: p.success, downward: p.danger }, wick: { useFillColor: true } } },
          xaxis: { type: 'datetime', labels: { style: { colors: p.text } }, axisBorder: { show: false } },
          yaxis: { labels: { style: { colors: p.text } } }
        }));
      },
      volumeChart: function (el) {
        var candles = mockCandle(24);
        return new ApexCharts(el, Object.assign({}, base(p), {
          chart: Object.assign({}, base(p).chart, { type: 'bar', height: 120 }),
          series: [{ name: 'Volume', data: candles.map(function (c) { return { x: c.x, y: Math.floor(Math.random() * 80) + 20 }; }) }],
          colors: [p.info],
          plotOptions: { bar: { columnWidth: '80%' } },
          xaxis: { type: 'datetime', labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: p.text } } },
          dataLabels: { enabled: false }
        }));
      }
    };
  }

  var instances = [];

  function destroy() {
    instances.forEach(function (c) { try { c.destroy(); } catch (e) {} });
    instances = [];
  }

  function render() {
    if (typeof ApexCharts === 'undefined') return;
    destroy();
    var p = palette();
    var map = factories(p);
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var chart = map[id](el);
      chart.render();
      instances.push(chart);
    });
  }

  global.IfxSandboxCharts = { init: render };
  window.addEventListener('ifx-theme-change', render);
})(window);
