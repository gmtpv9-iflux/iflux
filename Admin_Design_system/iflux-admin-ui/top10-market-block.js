/* Block Top 10 mạnh nhất thị trường — multi-line compare (Ngành / Họ CP / Chủ đề) */
(function (global) {
  'use strict';

  var COLORS = [
    '#696cff', '#71dd37', '#ffab00', '#ff3e1d', '#03c3ec',
    '#F26522', '#8592ff', '#00A67E', '#e91e8c', '#b4b7bd'
  ];

  var NAMES = {
    sector: ['Ngân hàng', 'Bất động sản', 'Thép', 'Chứng khoán', 'Dầu khí', 'Công nghệ', 'Bán lẻ', 'Điện', 'Vận tải', 'Dược phẩm'],
    ecosystem: ['Vingroup', 'Techcombank', 'Hòa Phát', 'FPT', 'Vinamilk', 'VPBank', 'Masan', 'PV Gas', 'MWG', 'DHG Pharma'],
    story: ['AI Việt Nam', 'Nghị quyết NN', 'Tăng vốn NH', 'Xuất khẩu thép', 'Giá dầu thế giới', 'EV xe điện', 'Căn hộ TP.HCM', 'Lãi suất giảm', 'FDI 2026', 'Vàng tăng giá']
  };

  var SUBTITLES = {
    sector: 'Ngành · cường độ hiệu suất theo phiên (%)',
    ecosystem: 'Hệ sinh thái · cường độ hiệu suất theo phiên (%)',
    story: 'Chủ đề · cường độ hiệu suất theo phiên (%)'
  };

  /* Tab key (data-days) → số phiên giao dịch thực tế */
  var RANGE_TO_SESSIONS = { 7: 5, 30: 22, 90: 66, 180: 126 };
  var MAX_SESSIONS = 126;

  function seededRandom(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function getTradingDates(sessionCount) {
    var dates = [];
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    while (dates.length < sessionCount) {
      var dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        dates.unshift(new Date(d.getTime()));
      }
      d.setDate(d.getDate() - 1);
    }
    return dates;
  }

  function generateSeriesValues(sessionCount, seed, trend) {
    var data = [];
    var v = trend * (seededRandom(seed) - 0.5) * 5;
    var i;
    for (i = 0; i < sessionCount; i++) {
      v += (seededRandom(seed + i * 7.31) - 0.47) * 2.4 + trend * 0.12;
      if (i > sessionCount * 0.55 && trend > 0.3) {
        v += trend * 0.15;
      }
      v = Math.max(-14, Math.min(16, v));
      data.push(Math.round(v * 10) / 10);
    }
    return data;
  }

  function buildMockEntities(type, rangeKey) {
    var sessions = RANGE_TO_SESSIONS[rangeKey] || RANGE_TO_SESSIONS[7];
    var names = NAMES[type] || NAMES.sector;
    var allDates = getTradingDates(MAX_SESSIONS);

    var series = names.map(function (name, i) {
      var trend = i < 3 ? 0.75 : (i < 6 ? 0.25 : (i < 8 ? -0.15 : -0.45));
      var seed = i * 17 + name.charCodeAt(0);
      var values = generateSeriesValues(MAX_SESSIONS, seed, trend);
      var slice = values.slice(-sessions);
      var dates = allDates.slice(-sessions);
      return { name: name, data: slice, dates: dates };
    });

    series.sort(function (a, b) {
      return b.data[b.data.length - 1] - a.data[a.data.length - 1];
    });
    return series.slice(0, 10);
  }

  function computeScale(series) {
    var all = [];
    var maxAmp = 0;
    series.forEach(function (s) {
      var min = Math.min.apply(null, s.data);
      var max = Math.max.apply(null, s.data);
      all.push(min, max);
      maxAmp = Math.max(maxAmp, max - min);
    });
    var globalMin = Math.min.apply(null, all);
    var globalMax = Math.max.apply(null, all);
    var center = (globalMin <= 0 && globalMax >= 0) ? 0 : (globalMin + globalMax) / 2;
    var half = maxAmp / 2;
    var yMin = Math.min(center - half, globalMin);
    var yMax = Math.max(center + half, globalMax);
    var pad = (yMax - yMin) * 0.06 || 0.5;
    return {
      yMin: yMin - pad,
      yMax: yMax + pad,
      showZero: (yMin - pad) <= 0 && (yMax + pad) >= 0
    };
  }

  function valueToY(v, yMin, yMax, plotH) {
    var t = (v - yMin) / (yMax - yMin);
    return plotH - t * plotH;
  }

  function niceTicks(yMin, yMax, count) {
    var range = yMax - yMin;
    var rough = range / (count - 1);
    var pow = Math.pow(10, Math.floor(Math.log10(rough)));
    var step = Math.ceil(rough / pow) * pow;
    var start = Math.floor(yMin / step) * step;
    var ticks = [];
    var v = start;
    while (v <= yMax + step * 0.01) {
      if (v >= yMin - step * 0.01) {
        ticks.push(Math.round(v * 100) / 100);
      }
      v += step;
    }
    if (ticks.indexOf(0) === -1 && yMin <= 0 && yMax >= 0) {
      ticks.push(0);
      ticks.sort(function (a, b) { return a - b; });
    }
    return ticks;
  }

  function formatVal(v) {
    var sign = v > 0 ? '+' : '';
    return sign + v.toFixed(1);
  }

  function valClass(v) {
    if (v > 0.05) return 'is-up';
    if (v < -0.05) return 'is-down';
    return 'is-flat';
  }

  function formatSessionDate(d) {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  function formatSessionLabels(dates) {
    var n = dates.length;
    var i;
    if (n <= 6) {
      return dates.map(formatSessionDate);
    }
    var slots = 7;
    var labels = [];
    for (i = 0; i < slots; i++) {
      var idx = slots === 1 ? 0 : Math.round((i / (slots - 1)) * (n - 1));
      labels.push(formatSessionDate(dates[idx]));
    }
    return labels;
  }

  function buildPath(data, yMin, yMax, plotW, plotH) {
    var step = data.length > 1 ? plotW / (data.length - 1) : 0;
    return data.map(function (v, i) {
      var x = i * step;
      var y = valueToY(v, yMin, yMax, plotH);
      return (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }).join(' ');
  }

  function renderBlock(container, entityType, rangeKey) {
    var sessions = RANGE_TO_SESSIONS[rangeKey] || RANGE_TO_SESSIONS[7];
    var series = buildMockEntities(entityType, rangeKey);
    var scale = computeScale(series);
    var plotW = 640;
    var plotH = 340;
    var ticks = niceTicks(scale.yMin, scale.yMax, 6);
    var sessionDates = series[0] ? series[0].dates : [];
    var dayLabels = formatSessionLabels(sessionDates);
    var svg = [];

    svg.push('<svg viewBox="0 0 ' + plotW + ' ' + plotH + '" preserveAspectRatio="none" aria-hidden="true">');

    ticks.forEach(function (tick) {
      var y = valueToY(tick, scale.yMin, scale.yMax, plotH);
      var isZero = Math.abs(tick) < 0.001;
      svg.push('<line class="' + (isZero ? 'ix-top10-market__zero-line' : 'ix-top10-market__grid-line') + '" x1="0" y1="' + y.toFixed(2) + '" x2="' + plotW + '" y2="' + y.toFixed(2) + '"/>');
    });

    series.forEach(function (s, idx) {
      svg.push('<path class="ix-top10-market__line" data-series-idx="' + idx + '" stroke="' + COLORS[idx % COLORS.length] + '" d="' + buildPath(s.data, scale.yMin, scale.yMax, plotW, plotH) + '"/>');
    });

    svg.push('</svg>');

    var yaxisHtml = ticks.map(function (tick) {
      var y = valueToY(tick, scale.yMin, scale.yMax, plotH);
      var pct = (y / plotH) * 100;
      return '<span class="ix-top10-market__ytick" style="top:' + pct.toFixed(2) + '%">' + formatVal(tick) + '</span>';
    }).join('');

    var legendHtml = series.map(function (s, idx) {
      var last = s.data[s.data.length - 1];
      var y = valueToY(last, scale.yMin, scale.yMax, plotH);
      var pct = (y / plotH) * 100;
      return '<div class="ix-top10-market__legend-item" data-legend-idx="' + idx + '" style="top:' + pct.toFixed(2) + '%">' +
        '<span class="ix-top10-market__legend-dot" style="background:' + COLORS[idx % COLORS.length] + '"></span>' +
        '<span class="ix-top10-market__legend-name" title="' + s.name + '">' + s.name + '</span>' +
        '<span class="ix-top10-market__legend-val ' + valClass(last) + '">' + formatVal(last) + '%</span>' +
        '</div>';
    }).join('');

    var xlabelsHtml = dayLabels.map(function (l) { return '<span>' + l + '</span>'; }).join('');

    container.innerHTML =
      '<div class="ix-top10-market__inner">' +
        '<div class="ix-top10-market__yaxis">' + yaxisHtml + '</div>' +
        '<div class="ix-top10-market__plot">' +
          svg.join('') +
          '<div class="ix-top10-market__xlabels" data-top10-xlabels>' + xlabelsHtml + '</div>' +
        '</div>' +
        '<div class="ix-top10-market__legend">' + legendHtml + '</div>' +
      '</div>';

    container.dataset.entityType = entityType;
    container.dataset.rangeKey = String(rangeKey);
    container.dataset.sessions = String(sessions);
  }

  function setActiveTab(tabs, activeBtn) {
    tabs.querySelectorAll('.ix-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn === activeBtn);
    });
  }

  function initCard(card) {
    var block = card.querySelector('[data-ix-top10-market]');
    var rangeTabs = card.querySelector('[data-ix-top10-range]');
    var entityTabs = card.querySelector('[data-ix-top10-entity]');
    var subtitle = card.querySelector('[data-ix-top10-subtitle]');
    if (!block) return;

    var entityType = 'sector';
    var rangeKey = 7;

    function refresh() {
      renderBlock(block, entityType, rangeKey);
      if (subtitle && SUBTITLES[entityType]) {
        subtitle.textContent = SUBTITLES[entityType];
      }
    }

    if (rangeTabs) {
      rangeTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-days]');
        if (!btn || !rangeTabs.contains(btn)) return;
        rangeKey = parseInt(btn.getAttribute('data-days'), 10) || 7;
        setActiveTab(rangeTabs, btn);
        refresh();
      });
    }

    if (entityTabs) {
      entityTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-type]');
        if (!btn || !entityTabs.contains(btn)) return;
        entityType = btn.getAttribute('data-type') || 'sector';
        setActiveTab(entityTabs, btn);
        refresh();
      });
    }

    refresh();
  }

  function initWidget(root, entityType) {
    var block = root.querySelector('[data-ix-top10-market]');
    var rangeTabs = root.querySelector('[data-ix-top10-range]');
    if (!block) return;

    var rangeKey = parseInt(root.getAttribute('data-days'), 10) || 7;

    function refresh() {
      renderBlock(block, entityType, rangeKey);
    }

    if (rangeTabs) {
      rangeTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-days]');
        if (!btn || !rangeTabs.contains(btn)) return;
        rangeKey = parseInt(btn.getAttribute('data-days'), 10) || 7;
        setActiveTab(rangeTabs, btn);
        refresh();
      });
    }

    refresh();
  }

  global.Top10MarketBlock = {
    COLORS: COLORS,
    SUBTITLES: SUBTITLES,
    RANGE_TO_SESSIONS: RANGE_TO_SESSIONS,
    buildMockEntities: buildMockEntities,
    render: renderBlock,
    initWidget: initWidget,
    init: function (root) {
      var scope = root || document;
      scope.querySelectorAll('[data-ix-top10-card]').forEach(initCard);
    }
  };
})(window);
