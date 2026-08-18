/* Thanh khoản thị trường — KLGD / GTGD.
   WP-4: chuỗi thời gian thanh khoản KHÔNG có runtime authority (D1) → UNAVAILABLE. */
(function (global) {
  'use strict';

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
          '<div class="ifx-mkt-empty">Chưa có dữ liệu thanh khoản</div>' +
        '</div>' +
      '</div>';

    /* Không có runtime authority thanh khoản — không mount chart, không refresh. */
    root._ifxLiqRefresh = function () {};
  }

  function tickAll() {
    document.querySelectorAll('[data-ifx-liq-metric]').forEach(function (block) {
      var root = block.parentElement;
      if (root && root._ifxLiqRefresh) root._ifxLiqRefresh();
    });
  }

  global.IfluxMarketLiquidity = { mountBlock: mountBlock, tickAll: tickAll };
})(window);
