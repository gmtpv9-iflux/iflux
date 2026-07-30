/**
 * ADM-SYS-011 — Page Runtime Manifest (Product Composition → User Web)
 * Chuyển Page Settings (layoutSlots) thành manifest Lazy Runtime.
 * Metadata-only: lazyModule/css lấy từ RUNTIME_WIDGET_MODULES, không import widget.
 */
(function (global) {
  'use strict';

  var RUNTIME_WIDGET_MODULES = {
    'WGT-MKT-001': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-overview/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css'
      ]
    },
    'WGT-MKT-002': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-breadth/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css'
      ]
    },
    'WGT-MKT-004': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css',
        '/User_Web/iflux-web-ui/market-components.css'
      ]
    },
    'WGT-MKT-005': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css',
        '/User_Web/iflux-web-ui/market-components.css'
      ]
    },
    'WGT-MKT-006': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css',
        '/User_Web/iflux-web-ui/market-components.css'
      ]
    },
    'WGT-COM-001': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-stock-heat/index.js',
      css: [
        '/User_Web/iflux-web-ui/community.css',
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/watchlist.css'
      ]
    },
    'WGT-COM-CHUDE-TOP': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js',
      css: [
        '/User_Web/iflux-web-ui/community.css',
        '/User_Web/iflux-web-ui/block-templates.css'
      ]
    },
    'WGT-COM-002': {
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-active/index.js',
      css: ['/User_Web/iflux-web-ui/community.css']
    }
  };

  function resolveRuntime(widgetId) {
    var reg = global.IfluxWidgetRegistry;
    if (reg && reg.byType) {
      var w = reg.byType(widgetId);
      if (w && w.lazyModule) {
        return {
          lazyModule: w.lazyModule,
          css: (w.assets && w.assets.css) || []
        };
      }
    }
    return RUNTIME_WIDGET_MODULES[widgetId] || null;
  }

  function resolveWidgetCopy(widgetId) {
    var cat = global.WidgetLibraryCatalog;
    if (cat && cat.resolveWidgetCopy) {
      return cat.resolveWidgetCopy(widgetId);
    }
    return { title: widgetId, description: '' };
  }

  /**
   * Binding Widget→Template từ SoT #4 (Tầng 4).
   * Placement không sở hữu Template — chỉ preserve tham chiếu để Publish resolve SoT #3.
   */
  function resolveTemplateRef(widgetId) {
    var L4 = global.PlatformLayersWidgets;
    if (L4) {
      if (typeof L4.getDefinition === 'function') {
        var def = L4.getDefinition(widgetId);
        if (def && def.templateRef) return String(def.templateRef);
      }
      if (typeof L4.getWidget === 'function') {
        var w = L4.getWidget(widgetId);
        if (w && (w.templateRef || w.template)) return String(w.templateRef || w.template);
      }
    }
    return null;
  }

  /**
   * @param {object} page — từ PageSettingsCatalog.buildModel()
   * @returns {object} manifest JSON (không chứa implementation)
   */
  function toRuntimeManifest(page) {
    if (!page) return null;
    var widgets = (page.layoutSlots || [])
      /* Slot mặc định tắt chỉ phục vụ Catalog UI, chưa phải Placement.
         Placement thật vẫn phải Publish dù enabled=false. */
      .filter(function (s) { return !!s.hasPlacement || s.enabled !== false; })
      .sort(function (a, b) { return a.position - b.position; })
      .map(function (slot) {
        var rt = resolveRuntime(slot.widgetId);
        var copy = resolveWidgetCopy(slot.widgetId);
        var templateRef = resolveTemplateRef(slot.widgetId);
        var config = slot.config ? Object.assign({}, slot.config) : {};
        if (slot.widgetId === 'WGT-MKT-004' && !config.source) config.source = 'sector';
        if (slot.widgetId === 'WGT-MKT-005' && !config.source) config.source = 'family';
        if (slot.widgetId === 'WGT-MKT-006' && !config.source) config.source = 'chu-de';
        return {
          id: slot.widgetId,
          title: copy.title || slot.widgetId,
          section: slot.section || 'main',
          position: slot.position,
          span: slot.span,
          enabled: slot.enabled !== false,
          locked: !!slot.locked,
          userCanOverride: !!slot.userCanOverride,
          config: config,
          /* Preserve SoT #4 binding — Publish resolve SoT #3 từ id này */
          template: templateRef,
          templateRef: templateRef,
          lazyModule: rt ? rt.lazyModule : null,
          css: rt ? rt.css : []
        };
      });

    return {
      pageKey: page.key,
      path: page.path,
      title: page.title,
      intro: page.description || '',
      documentTitle: (page.title || page.key) + ' · iFlux',
      sections: (page.sections || [])
        // Bỏ vùng chrome App Shell (header/nav/footer) — đã có trong HTML tĩnh;
        // page-runtime chỉ dựng vùng nội dung (sidebar/main/sidebar-right).
        .filter(function (s) { return s.visible !== false && s.kind !== 'shell'; })
        .map(function (s) {
          return {
            key: s.key,
            label: s.label,
            visible: s.visible !== false,
            layout: s.layout || null
          };
        }),
      widgets: widgets
    };
  }

  global.PageRuntimeManifest = {
    RUNTIME_WIDGET_MODULES: RUNTIME_WIDGET_MODULES,
    resolveRuntime: resolveRuntime,
    resolveTemplateRef: resolveTemplateRef,
    toRuntimeManifest: toRuntimeManifest
  };
})(window);
