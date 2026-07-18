/* Overview thị trường — TPL-INDEX-GRID + sidebar shell (Design Sandbox SoT) */
(function (global) {
  'use strict';

  function mk() { return global.IfluxMockMarket; }
  function tpl() { return global.IfluxBlockTemplates; }

  function libraryCopy(widgetId) {
    if (global.WidgetLibraryCatalog && WidgetLibraryCatalog.resolveWidgetCopy) {
      return WidgetLibraryCatalog.resolveWidgetCopy(widgetId);
    }
    return { title: 'Tổng quan thị trường', description: '' };
  }

  function mount(container, options) {
    if (!container) return;
    var T = tpl();
    if (!mk()) {
      container.innerHTML = '<div class="ifx-wl-empty">Thiếu mock market data</div>';
      return;
    }
    if (!T) {
      container.innerHTML = '<div class="ifx-wl-empty">Thiếu block-templates.js</div>';
      return;
    }

    options = options || {};
    var widgetId = options.widgetId || 'WGT-MKT-001';
    var copy = libraryCopy(widgetId);
    var title = options.title != null ? options.title : copy.title;
    var description = options.description != null ? options.description : copy.description;

    container.innerHTML = T.renderOverviewShell({
      title: title,
      description: description,
      status: 'Đang giao dịch',
      exchanges: mk().getExchanges(),
      includeBreadth: options.includeBreadth !== false,
      sidebar: options.sidebar !== false,
      marketSidebar: options.marketSidebar,
      hideHead: options.hideHead === true
    });

    if (options.includeBreadth !== false) {
      var breadthMount = container.querySelector('[data-ifx-com-breadth-mount]');
      if (breadthMount && global.IfluxBreadthBlock) {
        IfluxBreadthBlock.mountInner(breadthMount);
      }
    }
  }

  function mountBreadthSidebar(container, opts) {
    if (!container) return;
    var T = tpl();
    if (!T) return;
    opts = opts || {};
    var copy = libraryCopy('WGT-MKT-002');
    var attrs = opts.attrs || '';
    if (opts.entBlock) {
      attrs = (attrs ? attrs + ' ' : '') + 'data-ifx-ent-block="' + opts.entBlock + '"';
    }
    container.innerHTML = T.renderSidebarShell({
      title: opts.title != null ? opts.title : copy.title,
      icon: 'ti ti-chart-dots-3',
      desc: opts.description != null ? opts.description : copy.description,
      body: '<div data-ifx-com-breadth-mount></div>',
      shellClass: 'ifx-com-breadth-sidebar',
      attrs: attrs
    });
    var breadthMount = container.querySelector('[data-ifx-com-breadth-mount]');
    if (breadthMount && global.IfluxBreadthBlock) {
      IfluxBreadthBlock.mountInner(breadthMount);
    }
  }

  function refresh(container) {
    if (!container) return;
    var T = tpl();
    var grid = container.querySelector('.ifx-com-ex-grid');
    if (grid && T && mk()) {
      grid.outerHTML = T.renderIndexGrid(mk().getExchanges());
    }
    var status = container.querySelector('.ifx-com-overview__status');
    if (status) status.textContent = 'Đang giao dịch';
    var breadth = container.querySelector('[data-ifx-breadth-block]');
    if (breadth && global.IfluxBreadthBlock) IfluxBreadthBlock.render(breadth);
  }

  global.IfluxCommunityMarketOverview = {
    mount: mount,
    mountBreadthSidebar: mountBreadthSidebar,
    refresh: refresh
  };
})(window);
