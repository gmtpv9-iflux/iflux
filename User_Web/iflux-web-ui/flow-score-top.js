/* Top 10 score — Mobile Comparison (ApexCharts radar + score bar) */
(function (global) {
  'use strict';

  function theme() {
    if (global.IfluxBlockTemplates && IfluxBlockTemplates.chartColors) {
      var c = IfluxBlockTemplates.chartColors();
      return {
        grid: c.grid,
        label: c.label,
        text: c.text,
        pos: c.flowIn,
        neg: c.flowOut,
        markerStroke: c.markerStroke
      };
    }
    return {
      grid: 'rgba(67, 89, 113, 0.14)',
      label: '#697a8d',
      text: '#8592a3',
      pos: '#00A67E',
      neg: '#e8304a',
      markerStroke: '#fff'
    };
  }

  function THEME() { return theme(); }

  function esc(s) {
    if (global.IfluxWebUi && IfluxWebUi.escapeHtml) return IfluxWebUi.escapeHtml(s);
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function recClass(rec, kind) {
    if (kind === 'insight') {
      if (rec === 'Cơ hội') return 'is-opportunity';
      if (rec === 'Rủi ro') return 'is-risk';
      return 'is-neutral';
    }
    if (rec === 'Mua') return 'is-buy';
    if (rec === 'Bán') return 'is-sell';
    return 'is-hold';
  }

  function recColumnLabel(block) {
    if (block && block.recommendationKind === 'insight') return 'Tín hiệu';
    return 'KN';
  }

  function renderRecommendationFoot(block) {
    if (!block.showRecommendation) return '';
    if (block.hideCompliance) return '';
    if (block.recommendationKind === 'insight') {
      return (
        '<footer class="ifx-mcmp__foot ifx-mcmp__foot--compliance">' +
          '<i class="ti ti-info-circle"></i> ' +
          'Tín hiệu <strong>Cơ hội / Rủi ro</strong> phản ánh dòng tiền thông minh và bối cảnh thị trường — ' +
          '<strong>không phải khuyến nghị mua, bán hay nắm giữ</strong>. ' +
          'iFlux không phải công ty giao dịch chứng khoán.' +
        '</footer>'
      );
    }
    return (
      '<footer class="ifx-mcmp__foot">' +
        '<i class="ti ti-info-circle"></i> Khuyến nghị (KN) kết hợp dòng tiền TM · ngành · HST · FOMO · vị thế tổ chức — dữ liệu mẫu.' +
      '</footer>'
    );
  }

  function shortLabel(label, max) {
    max = max || 10;
    if (!label || label.length <= max) return label;
    return label.slice(0, max - 1) + '…';
  }

  function entityLink(block, item) {
    var c;
    if (block.entityType === 'stock') {
      c = global.IfluxSeoUrl
        ? IfluxSeoUrl.stockHref(item.label)
        : '/stocks/' + encodeURIComponent(String(item.label || '').toUpperCase());
    } else if (block.entityType === 'sector') {
      c = global.IfluxSeoUrl
        ? IfluxSeoUrl.sectorHref(item.label)
        : '/sectors/' + encodeURIComponent(item.label);
    } else if (block.entityType === 'story') {
      c = global.IfluxSeoUrl
        ? IfluxSeoUrl.storyEntityHref(item.label)
        : '/chu-de/' + encodeURIComponent(item.label);
    } else {
      c = global.IfluxSeoUrl
        ? IfluxSeoUrl.ecosystemHref(item.label)
        : '/he-sinh-thai/' + encodeURIComponent(item.label);
    }
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function radarOptions(block) {
    var items = block.items || [];
    var pol = block.polarity;
    var color = pol === 'positive' ? THEME().pos : THEME().neg;
    var categories = items.map(function (it) { return shortLabel(it.label, 12); });
    var scores = items.map(function (it) { return it.score; });
    var n = categories.length;

    return {
      chart: {
        type: 'radar',
        height: 240,
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: "'Be Vietnam Pro', sans-serif",
        animations: { enabled: true, speed: 450 }
      },
      series: [{ name: 'Score', data: scores }],
      colors: [color],
      fill: { opacity: 0.2 },
      stroke: { width: 2, colors: [color] },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: Array(Math.max(n, 1)).fill(THEME().label),
            fontSize: '11px',
            fontFamily: "'Be Vietnam Pro', sans-serif"
          }
        }
      },
      yaxis: {
        show: true,
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          style: { colors: THEME().text, fontSize: '10px' },
          formatter: function (v) { return Math.round(v); }
        }
      },
      plotOptions: {
        radar: {
          size: 92,
          polygons: {
            strokeColors: THEME().grid,
            connectorColors: THEME().grid,
            fill: { colors: ['transparent', 'transparent'] }
          }
        }
      },
      markers: {
        size: 4,
        strokeWidth: 2,
        strokeColors: THEME().markerStroke,
        hover: { size: 7 }
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (v) { return v + ' điểm'; },
          title: { formatter: function () { return 'Score'; } }
        },
        x: { show: true }
      },
      grid: { show: false }
    };
  }

  /**
   * Radar 20 điểm (Apex clockwise từ 12h):
   * Phải xanh: Top1 (12h) → Top10 (6h)
   * Trái đỏ: Top1 (6h) → Top10 (12h) — tương đương CCW từ 12h càng xuống càng tiêu cực
   */
  function radarOptionsDuo(negBlock, posBlock) {
    var negItems = (negBlock && negBlock.items) || [];
    var posItems = (posBlock && posBlock.items) || [];
    var n = Math.max(negItems.length, posItems.length, 1);
    var i;
    var categories = [];
    var posData = [];
    var negData = [];
    var labelColors = [];

    /* Apex clockwise từ 12h: phải xanh Top1→Top10 (12→6), trái đỏ Top1→Top10 (6→12) */
    for (i = 0; i < n; i++) {
      var posItem = posItems[i];
      categories.push(posItem ? shortLabel(posItem.label, 10) : '—');
      posData.push(posItem ? posItem.score : 0);
      negData.push(0);
      labelColors.push(THEME().pos);
    }
    for (i = 0; i < n; i++) {
      var negItem = negItems[i];
      categories.push(negItem ? shortLabel(negItem.label, 10) : '—');
      posData.push(0);
      negData.push(negItem ? negItem.score : 0);
      labelColors.push(THEME().neg);
    }

    return {
      chart: {
        type: 'radar',
        height: 300,
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: "'Be Vietnam Pro', sans-serif",
        animations: { enabled: true, speed: 450 }
      },
      series: [
        { name: 'Tiêu cực', data: negData },
        { name: 'Tích cực', data: posData }
      ],
      colors: [THEME().neg, THEME().pos],
      fill: { opacity: 0.18 },
      stroke: { width: 2 },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: labelColors,
            fontSize: '10px',
            fontFamily: "'Be Vietnam Pro', sans-serif"
          }
        }
      },
      yaxis: {
        show: true,
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          style: { colors: THEME().text, fontSize: '10px' },
          formatter: function (v) { return Math.round(v); }
        }
      },
      plotOptions: {
        radar: {
          size: 108,
          polygons: {
            strokeColors: THEME().grid,
            connectorColors: THEME().grid,
            fill: { colors: ['transparent', 'transparent'] }
          }
        }
      },
      markers: {
        size: 3,
        strokeWidth: 2,
        strokeColors: THEME().markerStroke,
        hover: { size: 6 }
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (v) {
            if (!v) return '';
            return v + ' điểm';
          }
        }
      },
      grid: { show: false }
    };
  }

  function renderChartMount(block) {
    return '<div class="ifx-mcmp__chart-mount" id="ifx-mcmp-chart-' + esc(block.id) + '" role="img" aria-label="' + esc(block.title) + '"></div>';
  }

  function renderEnergyTree(score) {
    var segments = 5;
    var filled = Math.max(0, Math.min(segments, Math.round(score / 20)));
    var html = '<div class="ifx-mcmp__energy" title="Rủi ro FOMO: ' + score + ' điểm">';
    var i;
    for (i = segments; i >= 1; i--) {
      html += '<span class="ifx-mcmp__energy-seg' + (i <= filled ? ' is-on' : '') + '" style="--h:' + (20 + i * 14) + '%"></span>';
    }
    html += '</div>';
    return html;
  }

  function renderList(block) {
    var pol = block.polarity;
    var barClass = pol === 'positive' ? 'is-positive' : 'is-negative';
    var rows = (block.items || []).map(function (item, i) {
      var risk = block.showRisk && item.riskScore != null
        ? '<div class="ifx-mcmp__col-risk">' + renderEnergyTree(item.riskScore) + '<span class="ifx-mcmp__risk-val">' + item.riskScore + '</span></div>'
        : '';
      var rec = block.showRecommendation && item.recommendation
        ? '<span class="ifx-mcmp__rec ' + recClass(item.recommendation, block.recommendationKind) + '">' + esc(item.recommendation) + '</span>'
        : '';
      var href = entityLink(block, item);
      var kind = block.entityType === 'sector' ? 'sector'
        : (block.entityType === 'family' || block.entityType === 'hst' ? 'family'
          : ((block.entityType === 'story' || block.entityType === 'chu-de' || block.entityType === 'cau-chuyen')
            ? 'cau-chuyen' : 'stock'));
      var nameHtml = global.IfluxBlockTemplates && IfluxBlockTemplates.entityName
        ? IfluxBlockTemplates.entityName(item.label, kind, { className: 'ifx-mcmp__name' })
        : ('<span class="ifx-mcmp__name" title="' + esc(item.label) + '">' + esc(item.label) + '</span>');

      return (
        '<a class="ifx-mcmp__row" href="' + href + '" data-ifx-mcmp-row="' + i + '">' +
          '<span class="ifx-mcmp__rank">' + (i + 1) + '</span>' +
          nameHtml +
          '<span class="ifx-mcmp__bar-wrap">' +
            '<span class="ifx-mcmp__bar ' + barClass + '" style="width:' + item.score + '%"></span>' +
          '</span>' +
          '<span class="ifx-mcmp__score-val">' + item.score + '</span>' +
          risk +
          rec +
        '</a>'
      );
    }).join('');

    var headExtra = '';
    if (block.showRisk) headExtra += '<span class="ifx-mcmp__col-h">' + esc(block.riskLabel || 'Rủi ro FOMO') + '</span>';
    if (block.showRecommendation) headExtra += '<span class="ifx-mcmp__col-h">' + recColumnLabel(block) + '</span>';

    return (
      '<div class="ifx-mcmp__list">' +
        '<div class="ifx-mcmp__list-head">' +
          '<span>#</span><span>Đối tượng</span><span>Score</span><span></span>' +
          headExtra +
        '</div>' +
        rows +
      '</div>'
    );
  }

  /** Hàng đối xứng: trái = tiêu cực (nội dung sát trục giữa), phải = tích cực */
  function renderDuoSideRow(block, item, i, side) {
    if (!item) {
      return '<div class="ifx-mcmp__duo-cell ifx-mcmp__duo-cell--' + side + ' is-empty"></div>';
    }
    var barClass = side === 'pos' ? 'is-positive' : 'is-negative';
    var href = entityLink(block, item);
    var kind = block.entityType === 'sector' ? 'sector'
      : (block.entityType === 'family' || block.entityType === 'hst' ? 'family'
        : ((block.entityType === 'story' || block.entityType === 'chu-de' || block.entityType === 'cau-chuyen')
          ? 'cau-chuyen' : 'stock'));
    var nameHtml = global.IfluxBlockTemplates && IfluxBlockTemplates.entityName
      ? IfluxBlockTemplates.entityName(item.label, kind, { className: 'ifx-mcmp__name' })
      : ('<span class="ifx-mcmp__name" title="' + esc(item.label) + '">' + esc(item.label) + '</span>');
    var inner =
      '<span class="ifx-mcmp__rank">' + (i + 1) + '</span>' +
      nameHtml +
      '<span class="ifx-mcmp__bar-wrap">' +
        '<span class="ifx-mcmp__bar ' + barClass + '" style="width:' + item.score + '%"></span>' +
      '</span>' +
      '<span class="ifx-mcmp__score-val">' + item.score + '</span>';

    return (
      '<a class="ifx-mcmp__duo-cell ifx-mcmp__duo-cell--' + side + ' ifx-mcmp__row" href="' + href + '" data-ifx-mcmp-row="' + side + '-' + i + '">' +
        inner +
      '</a>'
    );
  }

  function renderDuoList(negBlock, posBlock) {
    var negItems = (negBlock && negBlock.items) || [];
    var posItems = (posBlock && posBlock.items) || [];
    var n = Math.max(negItems.length, posItems.length);
    var rows = '';
    var i;
    for (i = 0; i < n; i++) {
      rows +=
        '<div class="ifx-mcmp__duo-row">' +
          renderDuoSideRow(negBlock, negItems[i], i, 'neg') +
          '<span class="ifx-mcmp__duo-axis" aria-hidden="true"></span>' +
          renderDuoSideRow(posBlock, posItems[i], i, 'pos') +
        '</div>';
    }

    return (
      '<div class="ifx-mcmp__list ifx-mcmp__list--duo">' +
        '<div class="ifx-mcmp__duo-head">' +
          '<div class="ifx-mcmp__duo-head-side ifx-mcmp__duo-head-side--neg">' +
            '<span>#</span><span>Đối tượng</span><span>Score</span><span></span>' +
          '</div>' +
          '<span class="ifx-mcmp__duo-axis ifx-mcmp__duo-axis--head" aria-hidden="true"></span>' +
          '<div class="ifx-mcmp__duo-head-side ifx-mcmp__duo-head-side--pos">' +
            '<span>#</span><span>Đối tượng</span><span>Score</span><span></span>' +
          '</div>' +
        '</div>' +
        rows +
      '</div>'
    );
  }

  function blockIdToWidgetId(blockId) {
    if (!blockId) return null;
    if (String(blockId).indexOf('duo-') === 0) {
      var duoStock = /stat-stock/.test(blockId);
      var duoSector = /stat-sector/.test(blockId);
      var duoHst = /stat-hst/.test(blockId);
      var duoStory = /stat-story/.test(blockId);
      if (duoStock) return 'WGT-FLW-STAT_STOCK';
      if (duoSector) return 'WGT-FLW-STAT_SECTOR';
      if (duoHst) return 'WGT-FLW-STAT_HST';
      if (duoStory) return 'WGT-FLW-STAT_STORY';
    }
    var duo = blockId.match(/^stat-(stock|sector|hst|story)$/);
    if (duo) return 'WGT-FLW-STAT_' + duo[1].toUpperCase();
    var stat = blockId.match(/^stat-(stock|sector|hst|story)-(in|out)$/);
    if (stat) {
      return 'WGT-FLW-STAT_' + stat[1].toUpperCase();
    }
    if (blockId === 'ex-tm-in') return 'WGT-FLW-EX_TM_IN';
    if (blockId === 'ex-tm-out') return 'WGT-FLW-EX_TM_OUT';
    var ex = blockId.match(/^ex-tm-(sector|hst|story)-(in|out)$/);
    if (ex) return 'WGT-FLW-EX_TM_' + ex[1].toUpperCase() + '_' + ex[2].toUpperCase();
    return null;
  }

  function enrichBlock(block) {
    var L4 = global.L4RuntimeReader;
    if (!L4 || !L4.entitlementMeta) return block;
    var wid = blockIdToWidgetId(block.id);
    if (!wid) return block;
    var meta = L4.entitlementMeta(wid);
    if (!meta) return block;
    return Object.assign({}, block, {
      title: meta.title || block.title,
      description: meta.description || block.description
    });
  }

  function renderBlock(block) {
    var pol = block.polarity;
    var count = (block.items || []).length;
    var meta = block.description || ('Mobile Comparison · ' + count + '/10 · Radar 0→100 điểm');
    var badge = pol === 'positive'
      ? '<span class="ifx-mcmp__pol is-positive"><i class="ti ti-trending-up"></i> Tích cực</span>'
      : '<span class="ifx-mcmp__pol is-negative"><i class="ti ti-trending-down"></i> Tiêu cực</span>';
    var extClass = (block.showRisk || block.showRecommendation) ? ' ifx-mcmp--extended' : '';

    return (
      '<article class="ifx-mcmp ifx-mcmp--' + pol + extClass + '" id="ifx-mcmp-' + esc(block.id) + '" data-ifx-mcmp-block="' + esc(block.id) + '">' +
        '<header class="ifx-mcmp__head">' +
          '<div class="ifx-mcmp__head-text">' +
            '<h3 class="ifx-mcmp__title">' + esc(block.title) + '</h3>' +
            '<p class="ifx-mcmp__meta">' + esc(meta) + '</p>' +
          '</div>' +
          '<div class="ifx-mcmp__head-aside">' + badge + '</div>' +
        '</header>' +
        '<div class="ifx-mcmp__body">' +
          '<div class="ifx-mcmp__chart">' + renderChartMount(block) + '</div>' +
          '<div class="ifx-mcmp__panel">' + renderList(block) + '</div>' +
        '</div>' +
        renderRecommendationFoot(block) +
      '</article>'
    );
  }

  /** Tiêu đề duo = SoT Thư viện Widget (WGT-FLW-STAT_*), không hardcode chung.
   *  Block có thể truyền duoTitle/duoDescription (content override — ví dụ preview Admin). */
  function duoCopy(posBlock, negBlock) {
    var ovTitle = (posBlock && posBlock.duoTitle) || (negBlock && negBlock.duoTitle);
    var ovDesc = (posBlock && posBlock.duoDescription) || (negBlock && negBlock.duoDescription);
    var entity = (posBlock && posBlock.entityType) || (negBlock && negBlock.entityType) || 'stock';
    var wid = 'WGT-FLW-STAT_' + String(entity).toUpperCase();
    if (entity === 'hst') wid = 'WGT-FLW-STAT_HST';
    var fallbacks = {
      stock: 'TOP 10 CỔ PHIẾU — DÒNG TIỀN VÀO / RA MẠNH NHẤT',
      sector: 'TOP 10 NGÀNH — DÒNG TIỀN VÀO / RA MẠNH NHẤT',
      hst: 'TOP 10 HỆ SINH THÁI — DÒNG TIỀN VÀO / RA MẠNH NHẤT',
      story: 'TOP 10 CHỦ ĐỀ — DÒNG TIỀN VÀO / RA MẠNH NHẤT'
    };
    var title = fallbacks[entity] || fallbacks.stock;
    var description = 'Đối chiếu Top 10 vào / ra · radar 20 điểm · list 2 cột';
    var cat = global.L4RuntimeReader;
    if (cat) {
      if (cat.resolveWidgetCopy) {
        var copy = cat.resolveWidgetCopy(wid);
        if (copy && copy.title) title = copy.title;
        if (copy && copy.description) description = copy.description;
      } else if (cat.entitlementMeta) {
        var defs = cat.entitlementMeta(wid);
        if (defs && defs.title) title = defs.title;
        if (defs && defs.description) description = defs.description;
      }
    }
    if (ovTitle) { title = ovTitle; description = ovDesc || ''; }
    return { title: title, description: description, widgetId: wid };
  }

  function renderDuoBlock(negBlock, posBlock) {
    var nNeg = ((negBlock && negBlock.items) || []).length;
    var nPos = ((posBlock && posBlock.items) || []).length;
    var copy = duoCopy(posBlock, negBlock);
    var id = 'duo-' + (negBlock && negBlock.id ? negBlock.id : 'neg') + '-' + (posBlock && posBlock.id ? posBlock.id : 'pos');
    var meta = copy.description || ('Đối chiếu vào / ra · Radar 20 điểm · ' + nNeg + ' tiêu cực + ' + nPos + ' tích cực');
    var badges =
      '<span class="ifx-mcmp__pol is-negative"><i class="ti ti-trending-down"></i> Tiêu cực</span>' +
      '<span class="ifx-mcmp__pol is-positive"><i class="ti ti-trending-up"></i> Tích cực</span>';

    return (
      '<article class="ifx-mcmp ifx-mcmp--duo" id="ifx-mcmp-' + esc(id) + '" data-ifx-mcmp-block="' + esc(id) + '" data-ifx-mcmp-duo="1" data-ifx-mcmp-widget="' + esc(copy.widgetId) + '" data-ifx-mcmp-neg="' + esc(negBlock && negBlock.id) + '" data-ifx-mcmp-pos="' + esc(posBlock && posBlock.id) + '">' +
        '<header class="ifx-mcmp__head">' +
          '<div class="ifx-mcmp__head-text">' +
            '<h3 class="ifx-mcmp__title">' + esc(copy.title) + '</h3>' +
            '<p class="ifx-mcmp__meta">' + esc(meta) + '</p>' +
          '</div>' +
          '<div class="ifx-mcmp__head-aside">' + badges + '</div>' +
        '</header>' +
        '<div class="ifx-mcmp__body">' +
          '<div class="ifx-mcmp__chart">' +
            '<div class="ifx-mcmp__chart-mount" id="ifx-mcmp-chart-' + esc(id) + '" role="img" aria-label="' + esc(copy.title) + '"></div>' +
          '</div>' +
          '<div class="ifx-mcmp__panel">' + renderDuoList(negBlock, posBlock) + '</div>' +
        '</div>' +
      '</article>'
    );
  }

  /** Gộp cặp in/out cùng entity (stock, sector, …) thành 1 block dual */
  function pairBlocks(blocks) {
    var list = blocks || [];
    var used = {};
    var out = [];
    var i;

    function isExtended(block) {
      return !!(block && (block.showRisk || block.showRecommendation));
    }

    function findMate(block) {
      var m = String(block.id || '').match(/^(.*)-(in|out)$/);
      if (!m) return null;
      var mateId = m[1] + (m[2] === 'in' ? '-out' : '-in');
      for (var j = 0; j < list.length; j++) {
        if (list[j].id === mateId) return list[j];
      }
      return null;
    }

    for (i = 0; i < list.length; i++) {
      var b = list[i];
      if (used[b.id]) continue;
      var mate = findMate(b);
      if (mate && !used[mate.id] && !isExtended(b) && !isExtended(mate)) {
        used[b.id] = true;
        used[mate.id] = true;
        var neg = b.polarity === 'negative' ? b : mate;
        var pos = b.polarity === 'positive' ? b : mate;
        if (neg.polarity !== 'negative' || pos.polarity !== 'positive') {
          out.push({ type: 'single', block: b });
          used[mate.id] = false;
          continue;
        }
        out.push({ type: 'duo', neg: neg, pos: pos });
      } else {
        used[b.id] = true;
        out.push({ type: 'single', block: b });
      }
    }
    return out;
  }

  function destroyCharts(container) {
    if (!container) return;
    container.querySelectorAll('.ifx-mcmp__chart-mount').forEach(function (el) {
      if (el._ifxRadar) {
        el._ifxRadar.destroy();
        el._ifxRadar = null;
      }
    });
  }

  function findBlockById(blocks, id) {
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].id === id) return blocks[i];
    }
    return null;
  }

  function renderCharts(container, blocks) {
    if (!container || typeof ApexCharts === 'undefined') return;
    container.querySelectorAll('[data-ifx-mcmp-block]').forEach(function (article) {
      var id = article.getAttribute('data-ifx-mcmp-block');
      var el = document.getElementById('ifx-mcmp-chart-' + id);
      if (!el) return;
      var chart;
      if (article.getAttribute('data-ifx-mcmp-duo') === '1') {
        var neg = findBlockById(blocks, article.getAttribute('data-ifx-mcmp-neg'));
        var pos = findBlockById(blocks, article.getAttribute('data-ifx-mcmp-pos'));
        chart = new ApexCharts(el, radarOptionsDuo(neg, pos));
      } else {
        var block = findBlockById(blocks, id);
        if (!block) return;
        chart = new ApexCharts(el, radarOptions(block));
      }
      el._ifxRadar = chart;
      renderRadarWhenVisible(el, chart);
    });
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 80);
  }

  /* Chỉ render khi container có bề rộng thực → tránh ApexCharts "width NaN"
     khi biểu đồ nằm trong tab ẩn / chưa layout xong. */
  function renderRadarWhenVisible(el, chart, tries) {
    tries = tries || 0;
    if (el._ifxRadar !== chart) return;
    var w = el.offsetWidth || (el.getBoundingClientRect && el.getBoundingClientRect().width) || 0;
    if (w > 0) {
      try { chart.render(); } catch (e) { /* ignore */ }
      return;
    }
    if (tries >= 40) return;
    (window.requestAnimationFrame || function (fn) { setTimeout(fn, 32); })(function () {
      renderRadarWhenVisible(el, chart, tries + 1);
    });
  }

  function bindHover(blockEl) {
    var rows = blockEl.querySelectorAll('[data-ifx-mcmp-row]');
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        row.classList.add('is-highlight');
      });
      row.addEventListener('mouseleave', function () {
        row.classList.remove('is-highlight');
      });
    });
  }

  /* Permission SoT = IfluxEntitlements (engine duy nhất). Widget KHÔNG tự đọc
     IfluxAuth.tier — chỉ hỏi engine. Engine vắng mặt => fail-closed (không lộ Elite). */
  function isElite() {
    return !!(global.IfluxEntitlements && global.IfluxEntitlements.isElite && global.IfluxEntitlements.isElite());
  }

  function eliteLockHtml() {
    return (
      '<div class="ifx-flow-elite-lock">' +
        '<div class="ifx-flow-elite-lock__inner">' +
          '<i class="ti ti-diamond"></i>' +
          '<strong>Chỉ dành cho Elite</strong>' +
          '<p>Xem Top dòng tiền thông minh (TM) — radar, rủi ro FOMO và tín hiệu Cơ hội / Rủi ro.</p>' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-flow-elite-upgrade>' +
            '<i class="ti ti-crown"></i> Nâng cấp Elite</button>' +
        '</div>' +
      '</div>'
    );
  }

  function bindEliteUpgrade(container) {
    var btn = container.querySelector('[data-ifx-flow-elite-upgrade]');
    if (!btn || btn._ifxBound) return;
    btn._ifxBound = true;
    btn.addEventListener('click', function () {
      if (global.IfluxWebUI && global.IfluxWebUI.openPricing) {
        global.IfluxWebUI.openPricing({
          reason: 'elite_feature',
          message: 'Dòng tiền Đột phá — Elite'
        });
      }
    });
  }

  function applyEliteGate(container, eliteGate) {
    if (!container) return;
    var lock = container.querySelector('.ifx-flow-elite-lock');
    if (lock) lock.remove();
    var locked = eliteGate && !isElite();
    container.classList.toggle('ifx-flow-elite-gate--locked', locked);
    if (locked) {
      container.insertAdjacentHTML('beforeend', eliteLockHtml());
      bindEliteUpgrade(container);
    }
  }

  function mount(container, blocks, opts) {
    if (!container) return;
    opts = opts || {};
    destroyCharts(container);
    blocks = (blocks || []).map(enrichBlock);
    var mergePairs = opts.mergePairs !== false;
    var html = '';
    if (mergePairs) {
      pairBlocks(blocks).forEach(function (entry) {
        if (entry.type === 'duo') html += renderDuoBlock(entry.neg, entry.pos);
        else html += renderBlock(entry.block);
      });
    } else {
      html = blocks.map(renderBlock).join('');
    }
    container.innerHTML = html;
    container.querySelectorAll('[data-ifx-mcmp-block]').forEach(bindHover);
    renderCharts(container, blocks);
    applyEliteGate(container, !!opts.eliteGate);
    /* Share: Foundation lazy (click .ifx-insight-share-btn) — không preload widget. */
  }

  function resizeChartsInPanel(panel) {
    if (!panel) return;
    panel.querySelectorAll('.ifx-mcmp__chart-mount').forEach(function (el) {
      if (el._ifxRadar) {
        try { el._ifxRadar.resize(); } catch (e) { /* ignore */ }
      }
    });
  }

  function blocksForTab(tabKey) {
    if (!global.IfluxFlowScoreMock) return [];
    if (tabKey === 'basic') return IfluxFlowScoreMock.getBasic();
    if (tabKey === 'advanced') return IfluxFlowScoreMock.getAdvanced();
    if (tabKey === 'exclusive') return IfluxFlowScoreMock.getExclusive();
    return [];
  }

  function panelGrid(tabKey) {
    if (tabKey === 'basic') return document.getElementById('ifx-flow-score-basic');
    if (tabKey === 'advanced') return document.getElementById('ifx-flow-score-advanced');
    if (tabKey === 'exclusive') return document.getElementById('ifx-flow-score-exclusive');
    return null;
  }

  function ensureTabMounted(tabKey, mountedMap) {
    var grid = panelGrid(tabKey);
    if (!grid || mountedMap[tabKey]) return grid;
    mount(grid, blocksForTab(tabKey), { eliteGate: tabKey === 'exclusive' });
    mountedMap[tabKey] = true;
    return grid;
  }

  function activateTab(tabKey, mountedMap) {
    var tabsRoot = document.querySelector('[data-ifx-flow-score-tabs]');
    if (!tabsRoot) return;

    tabsRoot.querySelectorAll('[data-ifx-flow-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-flow-tab') === tabKey;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    document.querySelectorAll('[data-ifx-flow-panel]').forEach(function (panel) {
      var on = panel.getAttribute('data-ifx-flow-panel') === tabKey;
      panel.classList.toggle('active', on);
      panel.hidden = !on;
    });

    var grid = ensureTabMounted(tabKey, mountedMap);
    setTimeout(function () {
      resizeChartsInPanel(grid && grid.closest('[data-ifx-flow-panel]'));
      window.dispatchEvent(new Event('resize'));
    }, 60);
  }

  function bindTabs(mountedMap) {
    var tabsRoot = document.querySelector('[data-ifx-flow-score-tabs]');
    if (!tabsRoot) return;
    tabsRoot.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-flow-tab]');
      if (!btn || !tabsRoot.contains(btn)) return;
      activateTab(btn.getAttribute('data-ifx-flow-tab'), mountedMap);
    });
  }

  function init() {
    if (!global.IfluxFlowScoreMock) return;
    var mounted = {};
    bindTabs(mounted);
    activateTab('basic', mounted);
  }

  global.IfluxFlowScoreTop = {
    renderBlock: renderBlock,
    mount: mount,
    init: init,
    isElite: isElite
  };
})(window);
