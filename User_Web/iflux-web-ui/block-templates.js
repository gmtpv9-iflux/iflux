/**
 * iFlux Block Templates — registry + render API (Design Sandbox SoT §15).
 * Mỗi template = 1 nhóm block cùng hình thức; truyền data → HTML chuẩn.
 */
(function (global) {
  'use strict';

  var BREADTH_STATS = [
    { key: 'total', label: 'Toàn bộ', cls: 'is-total' },
    { key: 'up', label: 'Mã tăng', cls: 'is-up' },
    { key: 'down', label: 'Mã giảm', cls: 'is-down' },
    { key: 'ref', label: 'Mã tham chiếu', cls: 'is-ref' },
    { key: 'ceiling_purple', label: 'Mã tím trần', cls: 'is-ceiling' },
    { key: 'floor_green', label: 'Mã sàn xanh', cls: 'is-floor' }
  ];

  var BREADTH_EXCHANGES = [
    { key: 'vnindex', label: 'VN-Index' },
    { key: 'hose', label: 'HOSE' },
    { key: 'hnx', label: 'HNX' },
    { key: 'upcom', label: 'UPCOM' }
  ];

  /** SoT: nhóm template ↔ block IDs (map §13 Design Sandbox) */
  var REGISTRY = [
    {
      id: 'TPL-SHELL-CARD',
      label: 'Card shell (head + body)',
      classes: 'ifx-block ifx-block--card',
      blocks: [
        'BLK-MKT-HEAT', 'BLK-MKT-LIQ', 'BLK-MKT-RANKINGS',
        'BLK-FLW-NET-STOCK', 'BLK-FLW-NET-SECTOR', 'BLK-FLW-NET-HST', 'BLK-FLW-NET-CHUDE',
        'BLK-FLW-SCORE', 'BLK-FLW-CTX', 'BLK-FLW-SMART'
      ]
    },
    {
      id: 'TPL-SHELL-SIDEBAR',
      label: 'Sidebar widget shell',
      classes: 'ifx-block ifx-block--sidebar',
      blocks: ['BLK-MKT-OVERVIEW', 'BLK-MKT-BREADTH', 'BLK-COM-OVERVIEW', 'BLK-COM-BREADTH']
    },
    {
      id: 'TPL-SHELL-WIDGET',
      label: 'Dashboard widget shell',
      classes: 'ifx-widget',
      blocks: ['WGT-*']
    },
    {
      id: 'TPL-BREADTH',
      label: 'Breadth stat grid + ratio bar',
      classes: 'ifx-breadth-block, ifx-breadth-stat, ifx-breadth-ratio',
      blocks: ['BLK-MKT-BREADTH', 'BLK-COM-BREADTH']
    },
    {
      id: 'TPL-TREEMAP',
      label: 'Treemap heat tile',
      classes: 'ifx-treemap-tile, ifx-mkt-heat-tile, ifx-cap-tile',
      blocks: ['BLK-MKT-HEAT-SECTOR', 'BLK-MKT-HEAT-FAMILY', 'BLK-MKT-HEAT-CHUDE', 'BLK-COM-TREND']
    },
    {
      id: 'TPL-DIVERGING-BARS',
      label: 'Cột hai chiều quanh trục 0 (dương / âm)',
      classes: 'ifx-stock-flow-chart',
      blocks: ['BLK-STK-FLOW']
    },
    {
      id: 'TPL-ZONE-POSITION',
      label: 'Vị trí giữa hai vùng (thanh + %)',
      classes: 'ifx-zone-pos',
      blocks: []
    },
    {
      id: 'TPL-RANK-BAR',
      label: 'Horizontal rank / Top 10 bars',
      classes: 'ifx-rank-bar, ix-top10-market',
      blocks: ['BLK-MKT-RANKINGS', 'WGT-TOP-001', 'WGT-TOP-002', 'WGT-TOP-003', 'WGT-MKT-003']
    },
    {
      id: 'TPL-FLOW-SPLIT',
      label: 'Symmetric net-flow chart',
      classes: 'ifx-flow-split, ifx-flow-split-block',
      blocks: ['BLK-FLW-NET-STOCK', 'BLK-FLW-NET-SECTOR', 'BLK-FLW-NET-HST', 'BLK-FLW-NET-CHUDE']
    },
    {
      id: 'TPL-INDEX-GRID',
      label: 'Exchange index mini cards',
      classes: 'ifx-com-ex-grid, ifx-com-ex-card',
      blocks: ['BLK-MKT-OVERVIEW', 'BLK-COM-OVERVIEW']
    },
    {
      id: 'TPL-LIST-ROW',
      label: 'Stock / entity list row',
      classes: 'ifx-stock-row',
      blocks: ['BLK-MKT-MOVERS', 'WGT-WAT-001']
    },
    {
      id: 'TPL-FEED-CARD',
      label: 'Community post card',
      classes: 'ifx-com-card',
      blocks: ['BLK-COM-FEED']
    }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function templateForBlock(blockId) {
    var i;
    for (i = 0; i < REGISTRY.length; i++) {
      var t = REGISTRY[i];
      var j;
      for (j = 0; j < t.blocks.length; j++) {
        var b = t.blocks[j];
        if (b === blockId) return t;
        if (b.indexOf('*') >= 0) {
          var prefix = b.replace('*', '');
          if (blockId.indexOf(prefix) === 0) return t;
        }
      }
    }
    return null;
  }

  /**
   * TPL-SHELL-CARD | TPL-SHELL-SIDEBAR
   * opts: { variant, title, icon, desc, sub, body, foot, attrs, tag }
   */
  function renderShell(opts) {
    opts = opts || {};
    var variant = opts.variant || 'card';
    var tag = opts.tag || 'div';
    var extra = opts.attrs ? ' ' + opts.attrs : '';
    var shellCls = 'ifx-block ifx-block--' + variant;
    if (opts.shellClass) shellCls += ' ' + opts.shellClass;

    /* Widget Header thuộc Widget Shell; Template chỉ cung cấp body/sub/foot. */
    var headHtml = opts.title
      ? renderWgtHead(opts.title, opts.desc || '', opts.icon)
      : '';
    var subHtml = opts.sub
      ? '<div class="ifx-block__sub">' + esc(opts.sub) + '</div>'
      : '';
    var bodyHtml = opts.body != null
      ? '<div class="ifx-block__body">' + opts.body + '</div>'
      : '';
    var footHtml = opts.foot
      ? '<div class="ifx-block__foot">' + opts.foot + '</div>'
      : '';

    return (
      '<' + tag + ' class="' + shellCls + '"' + extra + '>' +
        headHtml + subHtml + bodyHtml + footHtml +
      '</' + tag + '>'
    );
  }

  /**
   * WIDGET SHELL HEADER — One Producer.
   * API: renderWgtHead(title, description, iconKey)
   * Definition chỉ lưu key ngữ nghĩa ("chart-line"); Design System map sang
   * implementation icon hiện tại. Không lưu class/SVG/HTML/URL vào Definition.
   *
   * HTML Contract (immutable DOM order — SoT):
   *   Icon → Identity (title + subtitle) → Actions
   * CẤM đổi thứ tự khi mở rộng / migrate Runtime Phase B.
   *
   * Phase A compatibility: consumer Runtime cũ truyền undefined hoặc class "ti ..."
   * vẫn nhận nguyên HTML legacy. Compatibility nằm trong implementation, không
   * thay đổi API và không được persist ngược class legacy vào Definition.
   */
  function normalizeIconKey(iconKey) {
    if (iconKey == null) return null;
    var raw = String(iconKey).trim();
    if (!raw) return null;
    if (/^ti\s/.test(raw)) {
      var parts = raw.split(/\s+/);
      for (var i = 0; i < parts.length; i++) {
        if (/^ti-[a-z0-9-]+$/.test(parts[i])) return parts[i].slice(3);
      }
      return null;
    }
    if (/^ti-[a-z0-9-]+$/.test(raw)) return raw.slice(3);
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) ? raw : null;
  }

  function renderWgtHead(title, description, iconKey) {
    var legacyInput = typeof iconKey === 'undefined' ||
      (typeof iconKey === 'string' && (/^ti\s/.test(iconKey.trim()) || /^ti-/.test(iconKey.trim())));
    if (legacyInput) {
      var legacyIcon = iconKey ? '<i class="' + esc(iconKey) + '"></i> ' : '';
      var legacyHtml = '<div class="ifx-widget__header"><h3>' + legacyIcon + esc(title || '') + '</h3>';
      if (description) legacyHtml += '<p class="ifx-widget__subtitle">' + esc(description) + '</p>';
      return legacyHtml + '</div>';
    }

    var key = normalizeIconKey(iconKey);
    var iconHtml = key
      ? '<span class="ifx-widget__icon" aria-hidden="true"><i class="ti ti-' + esc(key) + '"></i></span>'
      : '<span class="ifx-widget__icon" aria-hidden="true" hidden></span>';
    var identityHtml =
      '<div class="ifx-widget__identity">' +
        '<h3 class="ifx-widget__title">' + esc(title || '') + '</h3>' +
        (description ? '<p class="ifx-widget__subtitle">' + esc(description) + '</p>' : '') +
      '</div>';
    var actionsHtml =
      '<div class="ifx-widget__actions">' +
        '<span class="ifx-block-share-actions">' +
          '<button type="button" class="ifx-insight-share-btn" title="Chia sẻ Insight Widget" aria-label="Chia sẻ Insight Widget">' +
            '<i class="ti ti-share-3"></i>' +
          '</button>' +
        '</span>' +
      '</div>';
    return '<div class="ifx-widget__header">' + iconHtml + identityHtml + actionsHtml + '</div>';
  }

  /** Legacy sidebar shell — alias ifx-mkt-sidebar-widget */
  function renderSidebarShell(opts) {
    opts = opts || {};
    var title = opts.title || '';
    var head = title ? renderWgtHead(title, opts.desc || '', opts.icon) : '';
    var body = opts.body != null
      ? '<div class="ifx-mkt-sidebar-widget__body ifx-block__body">' + opts.body + '</div>'
      : '';
    var extra = opts.attrs ? ' ' + opts.attrs : '';
    var shellCls = 'ifx-block ifx-block--sidebar ifx-mkt-sidebar-widget';
    if (opts.shellClass) shellCls += ' ' + opts.shellClass;
    return (
      '<div class="' + shellCls + '"' + extra + '>' +
        head + body +
      '</div>'
    );
  }

  function exchangeTabsHtml(active, attrName, exchanges) {
    attrName = attrName || 'data-ifx-breadth-exchange';
    exchanges = exchanges && exchanges.length ? exchanges : BREADTH_EXCHANGES;
    return exchanges.map(function (ex) {
      return (
        '<button type="button" class="ix-tab' + (ex.key === active ? ' active' : '') +
        '" ' + attrName + '="' + esc(ex.key) + '">' + esc(ex.label) + '</button>'
      );
    }).join('');
  }

  function statCard(stat, value) {
    return (
      '<div class="ifx-breadth-stat ' + esc(stat.cls || '') + '">' +
        '<div class="ifx-breadth-stat__num">' + (value != null && value !== '' ? esc(value) : '—') + '</div>' +
        '<div class="ifx-breadth-stat__label">' + esc(stat.label) + '</div>' +
      '</div>'
    );
  }

  /**
   * TMP-BREADTH / TPL-BREADTH inner content (tabs + 6-stat grid + ratio).
   * opts: { exchange, data, stats?, exchanges?, ratioUpKey?, ratioDownKey? }
   */
  function renderBreadthContent(opts) {
    opts = opts || {};
    var exchange = opts.exchange || 'vnindex';
    var data = opts.data || {};
    var stats = opts.stats && opts.stats.length ? opts.stats : BREADTH_STATS;
    var exchanges = opts.exchanges && opts.exchanges.length ? opts.exchanges : BREADTH_EXCHANGES;
    var upKey = opts.ratioUpKey || 'up';
    var downKey = opts.ratioDownKey || 'down';
    var up = Number(data[upKey]) || 0;
    var down = Number(data[downKey]) || 0;
    var ratioTotal = up + down || 1;
    var upPct = Math.round((up / ratioTotal) * 100);

    return (
      '<div class="ix-tabs ifx-breadth-exchange" data-ifx-breadth-exchange-tabs>' +
        exchangeTabsHtml(exchange, null, exchanges) +
      '</div>' +
      '<div class="ifx-breadth-visual ifx-breadth-visual--6">' +
        stats.map(function (stat) {
          return statCard(stat, data[stat.key]);
        }).join('') +
      '</div>' +
      '<div class="ifx-breadth-ratio" title="Tỷ lệ tăng ' + upPct + '%">' +
        '<div class="ifx-breadth-ratio__up" style="width:' + upPct + '%"></div>' +
        '<div class="ifx-breadth-ratio__down" style="width:' + (100 - upPct) + '%"></div>' +
      '</div>'
    );
  }

  /**
   * TMP-BREADTH / TPL-BREADTH — opts: { exchange, data, stats?, exchanges? }
   */
  function renderBreadth(opts) {
    opts = opts || {};
    var exchange = opts.exchange || 'vnindex';
    return (
      '<div class="ifx-breadth-block" data-ifx-breadth-block data-exchange="' + esc(exchange) + '">' +
        renderBreadthContent(opts) +
      '</div>'
    );
  }

  /**
   * TPL-TREEMAP tile link — opts: { name, perf, direction, href, tier }
   * direction: up | down | ref | ceiling | floor
   */
  function renderTreemapTile(opts) {
    opts = opts || {};
    var dir = opts.direction || 'ref';
    var cls = 'is-' + dir;
    var tier = opts.tier ? ' ifx-treemap-tile--' + opts.tier : '';
    var name = opts.name || '';
    var perf = opts.perf != null ? opts.perf : '';
    var href = opts.href || '#';
    var inner = opts.tiny
      ? '<span class="ifx-treemap-tile__name">' + esc(name.split(' ')[0]) + '</span>'
      : '<span class="ifx-treemap-tile__name">' + esc(name) + '</span>' +
        (perf !== '' ? '<span class="ifx-treemap-tile__perf">' + esc(perf) + '</span>' : '');

    return (
      '<div class="ifx-treemap-tile ifx-mkt-heat-tile' + tier + '">' +
        '<a class="ifx-treemap-tile__link ifx-mkt-heat-tile__link ' + cls + '" href="' + esc(href) + '">' +
          inner +
        '</a>' +
      '</div>'
    );
  }

  function perfDirection(p, thresholds) {
    thresholds = thresholds || { up: 0.08, down: -0.08 };
    if (p > thresholds.up) return 'up';
    if (p < thresholds.down) return 'down';
    return 'ref';
  }

  function perfValClass(p, thresholds) {
    thresholds = thresholds || { up: 0.05, down: -0.05 };
    if (p > thresholds.up) return 'is-up';
    if (p < thresholds.down) return 'is-down';
    return 'is-flat';
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }

  function fmtPct1(n) {
    var sign = n > 0 ? '+' : '';
    return sign + Number(n).toFixed(1);
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  var CHART_SERIES_COUNT = 10;

  function chartSeriesIndex(i) {
    return (i % CHART_SERIES_COUNT) + 1;
  }

  function readToken(name) {
    if (typeof document === 'undefined' || !document.documentElement) return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /** ApexCharts / SVG — đọc token runtime từ CSS */
  function chartColors() {
    return {
      accent: readToken('--ix-accent'),
      info: readToken('--ix-info'),
      success: readToken('--ix-success'),
      danger: readToken('--ix-danger'),
      warning: readToken('--ix-warning'),
      grid: readToken('--ifx-chart-grid'),
      label: readToken('--ifx-chart-label'),
      text: readToken('--ifx-chart-text'),
      textPrimary: readToken('--ix-text-primary'),
      flowIn: readToken('--ifx-flow-in'),
      flowOut: readToken('--ifx-flow-out'),
      markerStroke: readToken('--ifx-chart-marker-stroke'),
      annotationBg: readToken('--ifx-chart-annotation-bg'),
      border: readToken('--ix-border')
    };
  }

  function marketDirColor(state) {
    var map = {
      up: '--ifx-market-up',
      down: '--ifx-market-down',
      ref: '--ifx-market-ref',
      ceiling: '--ifx-market-ceiling',
      floor: '--ifx-market-floor'
    };
    return readToken(map[state] || map.ref);
  }

  var RANGE_TABS = [
    { days: 7, label: '1 tuần' },
    { days: 30, label: '1 tháng' },
    { days: 90, label: '3 tháng' },
    { days: 180, label: '6 tháng' }
  ];

  var FLOW_SUBJECT_TABS = [
    { key: 'retail', label: 'Cá nhân' },
    { key: 'institutional', label: 'Tổ chức' },
    { key: 'proprietary', label: 'Tự doanh' },
    { key: 'foreign', label: 'Khối ngoại' }
  ];

  function rangeTabsHtml(activeDays, attr) {
    attr = attr || 'data-days';
    return RANGE_TABS.map(function (r) {
      return (
        '<button type="button" class="ix-tab' + (activeDays === r.days ? ' active' : '') +
        '" ' + attr + '="' + r.days + '">' + esc(r.label) + '</button>'
      );
    }).join('');
  }

  /**
   * TPL-RANK-BAR — opts: { items: [{ name, perf }], emptyMsg }
   */
  function renderRankBarList(opts) {
    opts = opts || {};
    var items = opts.items || [];
    if (!items.length) {
      return '<div class="ifx-mkt-empty">' + esc(opts.emptyMsg || 'Chưa có dữ liệu') + '</div>';
    }

    var maxAbs = 0;
    items.forEach(function (it) {
      maxAbs = Math.max(maxAbs, Math.abs(it.perf || 0));
    });
    if (maxAbs < 0.01) maxAbs = 1;

    var rows = items.map(function (it, idx) {
      var pct = Math.min(100, Math.round((Math.abs(it.perf || 0) / maxAbs) * 100));
      var cls = perfValClass(it.perf, { up: 0.08, down: -0.08 });
      return (
        '<div class="ifx-rank-bar__row ifx-mkt-rank-row">' +
          '<span class="ifx-rank-bar__idx ifx-mkt-rank-idx">' + (idx + 1) + '</span>' +
          '<span class="ifx-rank-bar__name ifx-mkt-rank-name" title="' + esc(it.name) + '">' + esc(it.name) + '</span>' +
          '<div class="ifx-rank-bar__track ifx-mkt-rank-bar-track">' +
            '<div class="ifx-rank-bar__fill ifx-mkt-rank-bar ' + cls + '" style="width:' + pct + '%"></div>' +
          '</div>' +
          '<span class="ifx-rank-bar__val ifx-mkt-rank-val ' + cls + '">' + fmtPct(it.perf) + '</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="ifx-rank-bar">' +
        '<div class="ifx-rank-bar__head ifx-mkt-rank-head">' +
          '<span>#</span><span>' + esc(opts.headLabel || 'Đối tượng') + '</span><span>' + esc(opts.headValue || 'Hiệu suất (%)') + '</span>' +
        '</div>' +
        '<div class="ifx-rank-bar__list ifx-mkt-rank-list">' + rows + '</div>' +
      '</div>'
    );
  }

  /* ── TPL-DIVERGING-BARS / TMP-DIVERGING-BARS ─────────────────────────────
   * Cột hai chiều quanh trục 0 (dương lên / âm xuống) + tabs nhóm + chú thích.
   * HTML producer duy nhất — CSS owner: block-templates.css (.ifx-stock-flow-*).
   * Scale/ticks trục tung SUY RA từ dữ liệu (derived), không truyền vào.
   */
  function divergingNiceCeil(v) {
    v = Math.max(v, 1);
    if (v <= 10) return 10;
    if (v <= 20) return 20;
    if (v <= 25) return 25;
    if (v <= 50) return 50;
    if (v <= 75) return 75;
    if (v <= 100) return 100;
    if (v <= 150) return 150;
    if (v <= 200) return 200;
    var pow = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / pow;
    if (n <= 1) return pow;
    if (n <= 2) return 2 * pow;
    if (n <= 5) return 5 * pow;
    return 10 * pow;
  }

  function divergingScale(points) {
    var maxPos = 0;
    var maxNeg = 0;
    (points || []).forEach(function (pt) {
      var v = Number(pt && pt.value) || 0;
      if (v > 0) maxPos = Math.max(maxPos, v);
      if (v < 0) maxNeg = Math.max(maxNeg, Math.abs(v));
    });
    var half = divergingNiceCeil(Math.max(maxPos, maxNeg, 1) * 1.1);
    return { max: half, ticks: [half, half / 2, 0, -half / 2, -half] };
  }

  function defaultAxisFmt(v) {
    return v === 0 ? '0' : String(v);
  }

  /**
   * Plot (trục tung + cột + trục hoành) — dùng khi đổi tab chỉ vẽ lại phần plot.
   * opts: { points: [{ value, label, title? }], formatAxis? }
   */
  function renderDivergingBarsPlot(opts) {
    opts = opts || {};
    var points = opts.points || [];
    if (!points.length) {
      return '<div class="ifx-stock-empty">Chưa có dữ liệu</div>';
    }
    var fmtAxis = opts.formatAxis || defaultAxisFmt;
    var scale = divergingScale(points);
    var max = scale.max || 1;
    var bars = points.map(function (pt) {
      var val = Number(pt.value) || 0;
      var pct = Math.min(100, (Math.abs(val) / max) * 100);
      var pos = val >= 0;
      return (
        '<div class="ifx-stock-flow-chart__col" title="' + esc(pt.title || pt.label || '') + '">' +
          '<div class="ifx-stock-flow-chart__half is-top">' +
            (pos ? '<div class="ifx-stock-flow-chart__bar is-pos" style="height:' + pct.toFixed(1) + '%"></div>' : '') +
          '</div>' +
          '<div class="ifx-stock-flow-chart__half is-bottom">' +
            (!pos ? '<div class="ifx-stock-flow-chart__bar is-neg" style="height:' + pct.toFixed(1) + '%"></div>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');
    var labels = points.map(function (pt) {
      return '<span>' + esc(pt.label || '') + '</span>';
    }).join('');
    var yticks = scale.ticks.map(function (tick) {
      var pct = ((max - tick) / (max * 2)) * 100;
      return '<span class="ifx-stock-flow-chart__ytick" style="top:' + pct.toFixed(2) + '%">' + esc(fmtAxis(tick)) + '</span>';
    }).join('');
    return (
      '<div class="ifx-stock-flow-chart__inner">' +
        '<div class="ifx-stock-flow-chart__yaxis">' + yticks + '</div>' +
        '<div class="ifx-stock-flow-chart__plot">' +
          '<div class="ifx-stock-flow-chart__bars-wrap">' +
            '<div class="ifx-stock-flow-chart__zero" aria-hidden="true"></div>' +
            '<div class="ifx-stock-flow-chart__bars">' + bars + '</div>' +
          '</div>' +
          '<div class="ifx-stock-flow-chart__xlabels">' + labels + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /**
   * Block đầy đủ: tabs nhóm + dòng chú thích + plot.
   * opts: { tabs: [{ key, label }], activeKey, hint, points, formatAxis?, tabAttr? }
   */
  function renderDivergingBars(opts) {
    opts = opts || {};
    var tabs = opts.tabs || [];
    var tabAttr = opts.tabAttr || 'data-ifx-flow-subject';
    var tabsHtml = tabs.map(function (t) {
      var on = t.key === opts.activeKey;
      return '<button type="button" class="ix-tab' + (on ? ' active' : '') +
        '" role="tab" aria-selected="' + (on ? 'true' : 'false') + '" ' + tabAttr + '="' + esc(t.key) + '">' +
        esc(t.label) + '</button>';
    }).join('');
    return (
      '<div class="ifx-stock-flow-chart" data-ifx-stock-flow-chart>' +
        (tabsHtml ? '<div class="ix-tabs ifx-stock-flow-tabs" role="tablist">' + tabsHtml + '</div>' : '') +
        (opts.hint ? '<p class="ifx-stock-flow-hint">' + esc(opts.hint) + '</p>' : '') +
        '<div data-ifx-stock-flow-plot>' + renderDivergingBarsPlot(opts) + '</div>' +
      '</div>'
    );
  }

  /**
   * Format % có dấu cho thanh vị trí — giá trị đã tính sẵn từ Widget/Core.
   * Nhận "-16", "16", "+3", "3%" → chuỗi plain text có dấu + "%".
   */
  function fmtSignedPct(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '—';
    var cleaned = s.replace(/%\s*$/, '').trim();
    var n = parseFloat(cleaned.replace(/[^0-9.\-+]/g, ''));
    if (isNaN(n)) return s;
    var sign = n > 0 ? '+' : (n < 0 ? '−' : '');
    var abs = Math.abs(n);
    var body = abs % 1 === 0 ? String(abs) : abs.toFixed(1).replace(/\.0$/, '');
    return sign + body + '%';
  }

  /**
   * TPL-ZONE-POSITION / TMP-ZONE-POSITION — 1 dòng giai đoạn.
   * opts: { period, leftRange, rightRange, center, leftPct, rightPct,
   *         leftLabel?, rightLabel? }
   * Thanh trực quan: tỉ lệ trái/phải SUY RA từ |leftPct| : |rightPct|.
   * Không tính nghiệp vụ — chỉ trình bày.
   */
  function renderZonePositionRow(opts) {
    opts = opts || {};
    var leftAbs = Math.abs(parseFloat(String(opts.leftPct == null ? '' : opts.leftPct).replace(/[^0-9.\-]/g, '')) || 0);
    var rightAbs = Math.abs(parseFloat(String(opts.rightPct == null ? '' : opts.rightPct).replace(/[^0-9.\-]/g, '')) || 0);
    var total = leftAbs + rightAbs;
    var leftW = total > 0 ? (leftAbs / total) * 100 : 50;
    var rightW = 100 - leftW;
    var leftPctTxt = fmtSignedPct(opts.leftPct);
    var rightPctTxt = fmtSignedPct(opts.rightPct);
    var leftLabel = opts.leftLabel != null ? opts.leftLabel : 'Hỗ trợ';
    var rightLabel = opts.rightLabel != null ? opts.rightLabel : 'Kháng cự';

    return (
      '<div class="ifx-zone-pos__row">' +
        '<div class="ifx-zone-pos__period">' + esc(opts.period || '—') + '</div>' +
        '<div class="ifx-zone-pos__track-row">' +
          '<span class="ifx-zone-pos__side-label is-left">' + esc(leftLabel) + '</span>' +
          '<div class="ifx-zone-pos__bar" role="img" aria-label="' +
            esc(leftLabel + ' ' + leftPctTxt + ' · ' + (opts.center || '') + ' · ' + rightLabel + ' ' + rightPctTxt) +
          '">' +
            '<div class="ifx-zone-pos__seg is-left" style="width:' + leftW.toFixed(1) + '%">' +
              '<span class="ifx-zone-pos__pct">' + esc(leftPctTxt) + '</span>' +
            '</div>' +
            '<span class="ifx-zone-pos__marker" aria-hidden="true"></span>' +
            '<div class="ifx-zone-pos__seg is-right" style="width:' + rightW.toFixed(1) + '%">' +
              '<span class="ifx-zone-pos__pct">' + esc(rightPctTxt) + '</span>' +
            '</div>' +
          '</div>' +
          '<span class="ifx-zone-pos__side-label is-right">' + esc(rightLabel) + '</span>' +
        '</div>' +
        '<div class="ifx-zone-pos__values">' +
          '<span class="ifx-zone-pos__range is-left">' + esc(opts.leftRange || '—') + '</span>' +
          '<span class="ifx-zone-pos__center">' + esc(opts.center || '—') + '</span>' +
          '<span class="ifx-zone-pos__range is-right">' + esc(opts.rightRange || '—') + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  /**
   * TPL-ZONE-POSITION — danh sách dòng giai đoạn.
   * opts: { rows: [{ period, leftRange, rightRange, center, leftPct, rightPct }],
   *         leftLabel?, rightLabel?, emptyMsg? }
   */
  function renderZonePosition(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    if (!rows.length) {
      return '<div class="ifx-mkt-empty">' + esc(opts.emptyMsg || 'Chưa có dữ liệu') + '</div>';
    }
    return (
      '<div class="ifx-zone-pos">' +
        rows.map(function (row) {
          return renderZonePositionRow({
            period: row.period,
            leftRange: row.leftRange,
            rightRange: row.rightRange,
            center: row.center,
            leftPct: row.leftPct,
            rightPct: row.rightPct,
            leftLabel: opts.leftLabel,
            rightLabel: opts.rightLabel
          });
        }).join('') +
      '</div>'
    );
  }

  function renderFlowSplitTicker(item, side) {
    var cls = 'ifx-flow-split__ticker ifx-flow-split__ticker--' + side;
    if (!item) {
      return '<span class="' + cls + ' ifx-flow-split__ticker--empty">—</span>';
    }
    return (
      '<a class="' + cls + '" href="' + esc(item.href || '#') + '" title="' + esc(item.label) + '">' +
        esc(item.label) +
      '</a>'
    );
  }

  function renderFlowSplitRow(buy, sell) {
    var buyHtml = buy
      ? '<div class="ifx-flow-split__buy">' +
          '<div class="ifx-flow-split__bar ifx-flow-split__bar--buy" style="width:' + buy.pct + '%">' +
            '<span class="ifx-flow-split__val">' + esc(buy.value_label) + '</span>' +
          '</div></div>'
      : '<div class="ifx-flow-split__buy ifx-flow-split__buy--empty"></div>';

    var sellHtml = sell
      ? '<div class="ifx-flow-split__sell">' +
          '<div class="ifx-flow-split__bar ifx-flow-split__bar--sell" style="width:' + sell.pct + '%">' +
            '<span class="ifx-flow-split__val">' + esc(sell.value_label) + '</span>' +
          '</div></div>'
      : '<div class="ifx-flow-split__sell ifx-flow-split__sell--empty"></div>';

    return (
      '<div class="ifx-flow-split__row">' +
        buyHtml +
        renderFlowSplitTicker(buy, 'buy') +
        renderFlowSplitTicker(sell, 'sell') +
        sellHtml +
      '</div>'
    );
  }

  function renderFlowSplitBody(data) {
    var html = '';
    var i;
    var rows = (data && data.rows) || 0;
    for (i = 0; i < rows; i++) {
      html += renderFlowSplitRow(
        data.buyers ? data.buyers[i] : null,
        data.sellers ? data.sellers[i] : null
      );
    }
    return html;
  }

  function renderFlowSubjectTabs(active) {
    return (
      '<div class="ifx-flow-toolbar ifx-flow-toolbar--subjects">' +
        '<div class="ix-tabs" data-ifx-flow-subject-tabs">' +
          FLOW_SUBJECT_TABS.map(function (t) {
            return (
              '<button type="button" class="ix-tab' + (t.key === active ? ' active' : '') +
              '" data-ifx-flow-subject="' + t.key + '">' + esc(t.label) + '</button>'
            );
          }).join('') +
        '</div></div>'
    );
  }

  /**
   * TPL-FLOW-SPLIT — opts: { scope meta fields, withHead, withSubjectTabs, subject, tickBuy, tickSell, bodyHtml }
   */
  function renderFlowSplitBlock(opts) {
    opts = opts || {};
    var headHtml = opts.withHead ? renderWgtHead(opts.title || '', opts.description) : '';
    var tabsHtml = opts.withSubjectTabs !== false
      ? renderFlowSubjectTabs(opts.subject || 'retail')
      : '';

    return (
      '<div class="ifx-flow-split-block">' +
        headHtml +
        tabsHtml +
        '<div class="ifx-flow-split" data-ifx-flow-split>' +
          '<div class="ifx-flow-split__head">' +
            '<div class="ifx-flow-split__col-h ifx-flow-split__col-h--buy">' +
              '<span class="ifx-flow-split__dot is-buy"></span> ' + esc(opts.headerBuy || 'Top KL mua ròng') + '</div>' +
            '<div class="ifx-flow-split__col-h ifx-flow-split__col-h--tick-buy">' + esc(opts.tickBuy || 'Mã mua') + '</div>' +
            '<div class="ifx-flow-split__col-h ifx-flow-split__col-h--tick-sell">' + esc(opts.tickSell || 'Mã bán') + '</div>' +
            '<div class="ifx-flow-split__col-h ifx-flow-split__col-h--sell">' +
              '<span class="ifx-flow-split__dot is-sell"></span> ' + esc(opts.headerSell || 'Top KL bán ròng') + '</div>' +
          '</div>' +
          '<div class="ifx-flow-split__body" data-ifx-flow-split-body>' +
            (opts.bodyHtml != null ? opts.bodyHtml : '') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /**
   * TPL-INDEX-GRID — opts: { exchanges: [{ name, value, change_pct }] }
   */
  function renderIndexCard(ex) {
    return (
      '<div class="ifx-index-card ifx-com-ex-card">' +
        '<div class="ifx-index-card__name ifx-com-ex-card__name">' + esc(ex.name) + '</div>' +
        '<div class="ifx-index-card__val ifx-com-ex-card__val">' +
          (ex.value != null
            ? Number(ex.value).toLocaleString('vi-VN', { maximumFractionDigits: 2 })
            : '—') +
        '</div>' +
        '<div class="ifx-index-card__chg ifx-com-ex-card__chg ' + dirClass(ex.change_pct) + '">' +
          fmtPct(ex.change_pct) +
        '</div>' +
      '</div>'
    );
  }

  function renderIndexGrid(exchanges) {
    return (
      '<div class="ifx-index-grid ifx-com-ex-grid">' +
        (exchanges || []).map(renderIndexCard).join('') +
      '</div>'
    );
  }

  /**
   * TPL-INDEX-GRID + overview shell
   * opts: { title, icon, description, status, exchanges, includeBreadth, sidebar, marketSidebar, hideHead }
   */
  function renderOverviewShell(opts) {
    opts = opts || {};
    var cls = opts.sidebar !== false ? ' ifx-com-overview--sidebar' : '';
    if (opts.marketSidebar) cls += ' ifx-com-overview--market-sidebar';
    var showHead = opts.hideHead !== true;
    var iconClass = opts.icon || 'ti ti-chart-line';

    var overviewHead = '';
    if (showHead && opts.title) {
      overviewHead = renderWgtHead(opts.title, opts.description || '', iconClass);
      if (opts.status) {
        overviewHead = overviewHead.replace(
          '</div>',
          '<span class="ifx-com-overview__status">' + esc(opts.status) + '</span></div>'
        );
      }
    }

    return (
      '<section class="ifx-block ifx-com-overview' + cls + '">' +
        overviewHead +
        '<div class="ifx-com-overview__indices">' +
          renderIndexGrid(opts.exchanges) +
        '</div>' +
        (opts.includeBreadth !== false
          ? '<div class="ifx-com-overview__breadth">' +
              renderWgtHead('Độ rộng thị trường') +
              '<div data-ifx-com-breadth-mount></div>' +
            '</div>'
          : '') +
      '</section>'
    );
  }

  /**
   * TPL-LIST-ROW — opts: { href, hideVol, extraClass }
   */
  function renderStockRow(s, opts) {
    opts = opts || {};
    if (!s) return '';
    var href = opts.href || '#';
    var chg = s.change_pct;
    var cls = dirClass(chg);
    var extra = opts.extraClass ? ' ' + opts.extraClass : '';
    return (
      '<a class="ifx-list-row ifx-stock-row ' + cls + extra + '" href="' + esc(href) + '" data-ticker="' + esc(s.ticker) + '">' +
        '<span class="ifx-stock-row__ticker">' + esc(s.ticker) + '</span>' +
        '<span class="ifx-stock-row__name">' + esc(s.name || '') + '</span>' +
        '<span class="ifx-stock-row__price">' + (s.price != null ? esc(s.price) : '—') + '</span>' +
        '<span class="ifx-stock-row__chg">' + fmtPct(chg) + '</span>' +
        (opts.hideVol ? '' : '<span class="ifx-stock-row__vol">' + esc(s.volume || '—') + '</span>') +
      '</a>'
    );
  }

  /**
   * TPL-LIST-ROW wrap — opts: { href, actionsHtml, badgesHtml, folderId, ... }
   */
  function renderStockRowWrap(s, opts) {
    opts = opts || {};
    if (!s) return '';
    var chg = s.change_pct;
    var actions = opts.actionsHtml || '';
    var badges = opts.badgesHtml || '';
    return (
      '<div class="ifx-list-row-wrap ifx-stock-row-wrap ' + dirClass(chg) + '" data-ticker="' + esc(s.ticker) + '">' +
        renderStockRow(s, opts) +
        (actions ? '<div class="ifx-stock-row__actions">' + actions + '</div>' : '') +
        (badges ? '<div class="ifx-stock-row__badges-row" data-ifx-stock-badges>' + badges + '</div>' : '') +
      '</div>'
    );
  }

  /**
   * TPL-FEED-CARD shell — opts: { slug, variant: ''|'featured'|'compact', bodyHtml }
   */
  function renderFeedPost(opts) {
    opts = opts || {};
    var variant = opts.variant ? ' ifx-com-post--' + opts.variant : '';
    return (
      '<article class="ifx-feed-card ifx-com-post' + variant + '" data-ifx-com-slug="' + esc(opts.slug) + '">' +
        (opts.bodyHtml || '') +
      '</article>'
    );
  }

  /**
   * TPL-FEED-CARD body — opts: { href, thumbHtml, title, time, excerpt, tagsHtml, authorHtml, statsHtml, showExcerpt }
   */
  function renderFeedPostBody(opts) {
    opts = opts || {};
    var href = opts.href || '#';
    var thumbCls = opts.thumbClass ? ' ' + opts.thumbClass : '';
    return (
      '<a class="ifx-com-post__thumb' + thumbCls + '" href="' + esc(href) + '">' + (opts.thumbHtml || '') + '</a>' +
      '<div class="ifx-com-post__body">' +
        '<div class="ifx-com-post__title-row">' +
          '<a class="ifx-com-post__title-text" href="' + esc(href) + '">' + esc(opts.title || 'Bài viết') + '</a>' +
          (opts.time
            ? '<span class="ifx-com-post__title-sep"> · </span><span class="ifx-com-post__time">' + esc(opts.time) + '</span>'
            : '') +
        '</div>' +
        (opts.showExcerpt && opts.excerpt
          ? '<p class="ifx-com-post__excerpt">' + esc(opts.excerpt) + '</p>'
          : '') +
        (opts.tagsHtml ? '<div class="ifx-com-post__tags">' + opts.tagsHtml + '</div>' : '') +
        '<div class="ifx-com-post__footer">' +
          '<div class="ifx-com-post__author">' + (opts.authorHtml || '') + '</div>' +
          (opts.statsHtml ? '<div class="ifx-com-post__stats">' + opts.statsHtml + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  global.IfluxBlockTemplates = {
    REGISTRY: REGISTRY,
    BREADTH_STATS: BREADTH_STATS,
    BREADTH_EXCHANGES: BREADTH_EXCHANGES,
    RANGE_TABS: RANGE_TABS,
    FLOW_SUBJECT_TABS: FLOW_SUBJECT_TABS,
    CHART_SERIES_COUNT: CHART_SERIES_COUNT,
    templateForBlock: templateForBlock,
    esc: esc,
    fmtPct: fmtPct,
    fmtPct1: fmtPct1,
    dirClass: dirClass,
    chartSeriesIndex: chartSeriesIndex,
    readToken: readToken,
    chartColors: chartColors,
    marketDirColor: marketDirColor,
    renderShell: renderShell,
    renderSidebarShell: renderSidebarShell,
    renderWgtHead: renderWgtHead,
    renderBreadth: renderBreadth,
    renderBreadthContent: renderBreadthContent,
    renderTreemapTile: renderTreemapTile,
    renderRankBarList: renderRankBarList,
    renderDivergingBars: renderDivergingBars,
    renderDivergingBarsPlot: renderDivergingBarsPlot,
    renderZonePosition: renderZonePosition,
    renderZonePositionRow: renderZonePositionRow,
    renderFlowSplitBlock: renderFlowSplitBlock,
    renderFlowSplitBody: renderFlowSplitBody,
    renderFlowSplitRow: renderFlowSplitRow,
    renderFlowSubjectTabs: renderFlowSubjectTabs,
    renderIndexGrid: renderIndexGrid,
    renderIndexCard: renderIndexCard,
    renderOverviewShell: renderOverviewShell,
    renderStockRow: renderStockRow,
    renderStockRowWrap: renderStockRowWrap,
    renderFeedPost: renderFeedPost,
    renderFeedPostBody: renderFeedPostBody,
    perfDirection: perfDirection,
    perfValClass: perfValClass,
    rangeTabsHtml: rangeTabsHtml,
    exchangeTabsHtml: exchangeTabsHtml,
    statCard: statCard
  };
})(window);
