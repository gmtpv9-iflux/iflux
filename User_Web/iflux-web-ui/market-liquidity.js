/* Thanh khoản thị trường — KLGD / GTGD lũy kế (Apex area, 2 line) */
(function (global) {
  'use strict';

  function colors() {
    if (global.IfluxBlockTemplates && IfluxBlockTemplates.chartColors) {
      var c = IfluxBlockTemplates.chartColors();
      return {
        accent: c.accent,
        info: c.info,
        grid: c.grid,
        text: c.text,
        label: c.label,
        annotationBg: c.annotationBg
      };
    }
    return {
      accent: '#696cff',
      info: '#03c3ec',
      grid: 'rgba(207,211,236,0.08)',
      text: '#8592a3',
      label: '#cfd3ec',
      annotationBg: 'rgba(105,108,255,.2)'
    };
  }

  var EXCHANGES = [
    { key: 'vnindex', label: 'VNINDEX' },
    { key: 'hose', label: 'HOSE' },
    { key: 'hnx', label: 'HNX' },
    { key: 'upcom', label: 'UPCOM' }
  ];

  var SESSION_OPTS = [
    { key: 1, label: '1 phiên' },
    { key: 5, label: '5 phiên' },
    { key: 10, label: '10 phiên' },
    { key: 22, label: '1 tháng' }
  ];

  function mk() { return global.IfluxMockMarket; }

  function fmtVal(metric, v) {
    if (v == null || isNaN(v)) return '—';
    if (metric === 'volume') {
      if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
      if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
      return String(Math.round(v));
    }
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K tỷ';
    return v.toFixed(0) + ' tỷ';
  }

  function buildAxisLabelSet(slotLabels) {
    var set = {};
    if (!slotLabels || !slotLabels.length) return set;
    if (global.IfluxCoreConfig && IfluxCoreConfig.get) {
      var cfg = IfluxCoreConfig.get();
      [cfg.session_morning_start, cfg.session_morning_end, cfg.session_afternoon_start, cfg.session_afternoon_end]
        .forEach(function (t) {
          if (slotLabels.indexOf(t) >= 0) set[t] = true;
        });
    }
    slotLabels.forEach(function (t) {
      var p = String(t).split(':');
      if (p.length === 2 && parseInt(p[1], 10) % 30 === 0) set[t] = true;
    });
    return set;
  }

  function filtersHtml(metric, state) {
    var sessBtns = SESSION_OPTS.map(function (o) {
      return '<button type="button" class="ix-segment' + (state.sessions === o.key ? ' is-active' : '') +
        '" data-ifx-liq-sessions="' + o.key + '">' + o.label + '</button>';
    }).join('');

    var exOpts = EXCHANGES.map(function (ex) {
      return '<option value="' + ex.key + '"' + (state.exchange === ex.key ? ' selected' : '') + '>' + ex.label + '</option>';
    }).join('');

    return '<div class="ifx-mkt-liq-filters">' +
      '<div class="ix-segmented" data-ifx-liq-sessions-wrap>' + sessBtns + '</div>' +
      '<select class="ix-input ifx-mkt-liq-exchange" data-ifx-liq-exchange aria-label="Sàn">' + exOpts + '</select>' +
    '</div>';
  }

  function renderChart(el, metric, state, previewDemo) {
    if (!el || !mk() || typeof ApexCharts === 'undefined') return null;

    var data = mk().getLiquiditySeries(state.exchange, metric, state.sessions, previewDemo);
    var slotLabels = data.slotLabels || (mk().getLiqSlots ? mk().getLiqSlots() : []);
    var axisLabelSet = buildAxisLabelSet(slotLabels);
    var curLabel = metric === 'volume' ? 'KLGD hiện tại' : 'GTGD hiện tại';
    var avgLabel = metric === 'volume'
      ? ('KLGD TB ' + state.sessions + ' phiên cùng giờ')
      : ('GTGD TB ' + state.sessions + ' phiên cùng giờ');

    if (el._ifxChart) {
      el._ifxChart.destroy();
      el._ifxChart = null;
    }

    var C = colors();

    var chart = new ApexCharts(el, {
      chart: {
        type: 'area',
        height: 240,
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: "'Be Vietnam Pro', sans-serif",
        animations: { enabled: false },
        zoom: { enabled: false },
        selection: { enabled: false },
        events: {
          mouseMove: function () { return false; },
          mouseLeave: function () { return false; }
        }
      },
      series: [
        { name: curLabel, data: data.current || [] },
        { name: avgLabel, data: data.average || [] }
      ],
      colors: [C.accent, C.info],
      stroke: { curve: 'straight', width: 2 },
      markers: { size: 0, hover: { size: 0 } },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] }
      },
      dataLabels: { enabled: false },
      grid: { borderColor: C.grid, strokeDashArray: 4 },
      theme: { mode: 'dark' },
      tooltip: { enabled: false },
      legend: { labels: { colors: C.label }, fontSize: '12px' },
      xaxis: {
        type: 'category',
        categories: slotLabels,
        tickPlacement: 'on',
        crosshairs: { show: false },
        labels: {
          style: { colors: C.text, fontSize: '10px' },
          rotate: 0,
          hideOverlappingLabels: true,
          formatter: function (val) { return axisLabelSet[val] ? val : ''; }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false }
      },
      yaxis: {
        min: 0,
        crosshairs: { show: false },
        labels: {
          style: { colors: C.text, fontSize: '11px' },
          formatter: function (v) { return fmtVal(metric, v); }
        }
      },
      annotations: data.clock && data.clock.cutoffTime ? {
        xaxis: [{
          x: data.clock.cutoffTime,
          borderColor: C.accent,
          strokeDashArray: 4,
          label: {
            text: data.clock.cutoffTime,
            style: { background: C.annotationBg, color: C.label, fontSize: '10px' }
          }
        }]
      } : {}
    });

    el._ifxChart = chart;
    renderWhenVisible(el, chart);
    return chart;
  }

  /* Chỉ render khi container đã có bề rộng thực → tránh ApexCharts báo "width NaN"
     khi widget đang ở tab ẩn hoặc chưa layout xong. */
  function renderWhenVisible(el, chart, tries) {
    tries = tries || 0;
    if (!el._ifxChart || el._ifxChart !== chart) return;
    var w = el.offsetWidth || (el.getBoundingClientRect && el.getBoundingClientRect().width) || 0;
    if (w > 0) {
      try { chart.render(); } catch (e) { /* ignore */ }
      return;
    }
    if (tries >= 40) return;
    (global.requestAnimationFrame || function (fn) { setTimeout(fn, 32); })(function () {
      renderWhenVisible(el, chart, tries + 1);
    });
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function libraryCopy(widgetId) {
    if (global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy) {
      return L4RuntimeReader.resolveWidgetCopy(widgetId);
    }
    return {
      title: widgetId === 'WGT-MKT-008' ? 'Giá trị giao dịch (GTGD)' : 'Khối lượng giao dịch (KLGD)',
      description: widgetId === 'WGT-MKT-008'
        ? 'GTGD hiện tại so với trung bình n phiên cùng thời điểm.'
        : 'KLGD hiện tại so với trung bình n phiên cùng thời điểm.'
    };
  }

  function mountBlock(root, metric, opts) {
    if (!root) return;
    opts = opts || {};
    var widgetId = opts.widgetId || (metric === 'value' ? 'WGT-MKT-008' : 'WGT-MKT-007');
    var copy = libraryCopy(widgetId);
    var state = { exchange: 'vnindex', sessions: 1, previewDemo: !!opts.previewDemo };
    var showHead = opts.withHead !== false;
    var title = opts.title != null ? opts.title : copy.title;
    var description = opts.description != null ? opts.description : copy.description;
    var headHtml = '';
    if (showHead) {
      headHtml = global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead
        ? IfluxBlockTemplates.renderWgtHead(title, description)
        : ('<div class="ifx-widget__header"><h3>' + esc(title) + '</h3>' +
          (description ? '<p class="ifx-widget__subtitle">' + esc(description) + '</p>' : '') +
          '</div>');
    }

    root.innerHTML =
      '<div class="ifx-mkt-liq-block" data-ifx-liq-metric="' + metric + '">' +
        headHtml +
        '<div class="ifx-mkt-liq-block__body">' +
          filtersHtml(metric, state) +
          '<div class="ifx-mkt-liq-chart" data-ifx-liq-chart></div>' +
        '</div>' +
      '</div>';

    var chartEl = root.querySelector('[data-ifx-liq-chart]');

    function refresh() {
      renderChart(chartEl, metric, state, state.previewDemo);
    }

    root.querySelector('[data-ifx-liq-sessions-wrap]').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-liq-sessions]');
      if (!btn) return;
      state.sessions = parseInt(btn.getAttribute('data-ifx-liq-sessions'), 10) || 1;
      root.querySelectorAll('[data-ifx-liq-sessions]').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      refresh();
    });

    root.querySelector('[data-ifx-liq-exchange]').addEventListener('change', function (e) {
      state.exchange = e.target.value || 'vnindex';
      refresh();
    });

    refresh();
    root._ifxLiqRefresh = refresh;

    /* Share: Foundation lazy khi click — không preload liquidity widget. */
  }

  function tickAll() {
    document.querySelectorAll('[data-ifx-liq-metric]').forEach(function (block) {
      var root = block.parentElement;
      if (root && root._ifxLiqRefresh) root._ifxLiqRefresh();
    });
  }

  global.IfluxMarketLiquidity = { mountBlock: mountBlock, tickAll: tickAll };
})(window);
