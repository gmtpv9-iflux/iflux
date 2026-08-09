/* Heatmap treemap — Ngành / Họ CP / Chủ đề / Cổ phiếu.
   WP-4: xếp hạng Top N theo GTGD KHÔNG có runtime authority (BR-03/04/13, D1) → UNAVAILABLE.
   Không còn phụ thuộc module mock thị trường. */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function emptyHtml() {
    return '<div class="ifx-mkt-empty">Chưa có dữ liệu</div>';
  }

  function paint(canvas) {
    if (!canvas) return;
    canvas.innerHTML = emptyHtml();
  }

  function resolveWidgetCopy(widgetId) {
    var cat = global.L4RuntimeReader;
    if (widgetId && cat && typeof cat.resolveWidgetCopy === 'function') {
      var copy = cat.resolveWidgetCopy(widgetId);
      if (copy && copy.title) return copy;
    }
    var reg = global.IfluxWidgetRegistry;
    if (widgetId && reg && typeof reg.byType === 'function') {
      var w = reg.byType(widgetId);
      if (w && w.title) return { title: w.title, description: w.description || '' };
    }
    return null;
  }

  function mount(el, source, opts) {
    if (!el) return;
    opts = opts || {};
    if (source && typeof source === 'object') {
      opts = source;
      source = opts.source || 'sector';
    }
    if (source === 'story') source = 'chu-de';
    var fallbackTitles = {
      stock: 'Biểu đồ Cổ phiếu',
      sector: 'Biểu đồ Ngành',
      family: 'Biểu đồ Hệ sinh thái',
      'chu-de': 'Biểu đồ Chủ đề',
      story: 'Biểu đồ Chủ đề'
    };
    var fallbackDescriptions = {
      stock: 'Top 10 mã có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      sector: 'Top 10 ngành có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      family: 'Top 10 họ cổ phiếu có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      'chu-de': 'Top 10 chủ đề có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      story: 'Top 10 chủ đề có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.'
    };
    /* SoT tiêu đề = Admin Widget (Tầng 4) / artifact — không lấy từ Template. */
    var widgetId = opts.widgetId || (opts.slot && opts.slot.id) || '';
    var artContent = opts.artifact && opts.artifact.content;
    var sot = resolveWidgetCopy(widgetId);
    var title = opts.title
      || (artContent && artContent.title)
      || (sot && sot.title)
      || fallbackTitles[source]
      || 'Heatmap';
    var description = opts.description
      || (artContent && artContent.description)
      || (sot && sot.description)
      || fallbackDescriptions[source]
      || '';
    var nestedInDashSurface = !!(el.closest && el.closest('.ifx-widget__surface'));
    var showHead = nestedInDashSurface ? false : !!opts.withHead;
    var headHtml = showHead
      ? (global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead
        ? IfluxBlockTemplates.renderWgtHead(title, description)
        : ('<div class="ifx-widget__header"><h3>' + esc(title) + '</h3>' +
          (description ? '<p class="ifx-widget__subtitle">' + esc(description) + '</p>' : '') +
          '</div>'))
      : '';

    el.innerHTML =
      '<div class="ifx-mkt-heatmap-wrap">' +
        headHtml +
        '<div class="ifx-mkt-heatmap" data-ifx-mkt-heatmap="' + source + '"></div>' +
      '</div>';
    var canvas = el.querySelector('[data-ifx-mkt-heatmap]');
    paint(canvas);
  }

  global.IfluxMarketHeatmap = { mount: mount, paint: paint };
})(window);
