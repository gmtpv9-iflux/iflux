/* Overview thị trường — WP-1: index/breadth không có runtime authority → UNAVAILABLE. */
(function (global) {
  'use strict';

  function tpl() { return global.IfluxBlockTemplates; }

  function libraryCopy(widgetId) {
    if (global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy) {
      return L4RuntimeReader.resolveWidgetCopy(widgetId);
    }
    return { title: 'Tổng quan thị trường', description: '' };
  }

  function unavailBody() {
    return '<div class="ifx-wl-empty">Chưa có dữ liệu thị trường</div>';
  }

  function mount(container, options) {
    if (!container) return;
    var T = tpl();
    if (!T || typeof T.renderOverviewShell !== 'function') {
      container.innerHTML = unavailBody();
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
      status: '—',
      exchanges: [],
      includeBreadth: false,
      sidebar: options.sidebar !== false,
      marketSidebar: options.marketSidebar,
      hideHead: options.hideHead === true
    });
    var indices = container.querySelector('.ifx-com-overview__indices');
    if (indices) indices.innerHTML = unavailBody();
  }

  function mountBreadthSidebar(container, opts) {
    if (!container) return;
    var T = tpl();
    opts = opts || {};
    var copy = libraryCopy('WGT-MKT-002');
    var title = opts.title != null ? opts.title : copy.title;
    var desc = opts.description != null ? opts.description : copy.description;
    if (T && T.renderSidebarShell) {
      container.innerHTML = T.renderSidebarShell({
        title: title,
        icon: 'ti ti-chart-dots-3',
        desc: desc,
        body: unavailBody(),
        shellClass: 'ifx-com-breadth-sidebar',
        attrs: opts.attrs || ''
      });
      return;
    }
    container.innerHTML = unavailBody();
  }

  function refresh(container) {
    if (!container) return;
    var indices = container.querySelector('.ifx-com-overview__indices');
    if (indices) indices.innerHTML = unavailBody();
    var status = container.querySelector('.ifx-com-overview__status');
    if (status) status.textContent = '—';
  }

  global.IfluxCommunityMarketOverview = {
    mount: mount,
    mountBreadthSidebar: mountBreadthSidebar,
    refresh: refresh
  };
})(window);
