/* iFlux DS — Foundations (19 nhóm) · tham chiếu Primitive Tokens */
(function (global) {
  'use strict';
  if (global.IfluxDsFoundationsCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function prop(property, token, variable) {
    return { property: property, token: token || '', variable: variable || '' };
  }

  function bundle(id, name, previewType, properties, icon) {
    return {
      id: id,
      name: name,
      previewType: previewType || 'guideline',
      icon: icon || 'ti-circle-dotted',
      properties: properties || []
    };
  }

  function g(title, items) {
    return { title: title, items: items };
  }

  function typeStyle(id, name, size, weight, lineHeight, extra) {
    var props = [
      prop('font-size', size, '--ifx-type-' + id + '-size'),
      prop('font-weight', weight || 'font-weight-regular', '--ifx-type-' + id + '-weight'),
      prop('line-height', lineHeight || 'line-height-normal', '--ifx-type-' + id + '-line-height'),
      prop('font-family', 'font-family-primary', '--ifx-type-' + id + '-font')
    ];
    if (extra) props = props.concat(extra);
    return bundle('type-' + id, name, 'typography', props, 'ti-typography');
  }

  function buildGroups() {
    return [
      g('Color System', [
        bundle('color-primary', 'Primary', 'color', [prop('color', 'color-navy-600', '--ifx-color-primary')], 'ti-palette'),
        bundle('color-secondary', 'Secondary', 'color', [prop('color', 'color-slate-500', '--ifx-color-secondary')], 'ti-palette'),
        bundle('color-success', 'Success', 'color', [prop('color', 'color-green-500', '--ifx-color-success')], 'ti-palette'),
        bundle('color-warning', 'Warning', 'color', [prop('color', 'color-amber-550', '--ifx-color-warning')], 'ti-palette'),
        bundle('color-danger', 'Danger', 'color', [prop('color', 'color-red-500', '--ifx-color-danger')], 'ti-palette'),
        bundle('color-info', 'Info', 'color', [prop('color', 'color-cyan-500', '--ifx-color-info')], 'ti-palette'),
        bundle('color-neutral', 'Neutral', 'color', [prop('color', 'color-slate-400', '--ifx-color-neutral')], 'ti-palette')
      ]),
      g('Font Family', [
        bundle('font-emoji', 'Emoji', 'typography', [prop('font-family', 'font-family-emoji', '--ifx-font-emoji')], 'ti-mood-smile'),
        bundle('font-system', 'System', 'typography', [prop('font-family', 'font-family-system', '--ifx-font-system')], 'ti-device-desktop')
      ]),
      g('Typography', [
        typeStyle('hero', 'Hero', 'fs-900', 'font-weight-bold', 'line-height-tight'),
        typeStyle('display-xl', 'Display XL', 'fs-800', 'font-weight-bold', 'line-height-tight'),
        typeStyle('display-l', 'Display L', 'fs-700', 'font-weight-bold', 'line-height-tight'),
        typeStyle('h1', 'H1', 'fs-700', 'font-weight-bold', 'line-height-tight'),
        typeStyle('h2', 'H2', 'fs-600', 'font-weight-semibold', 'line-height-tight'),
        typeStyle('h3', 'H3', 'fs-500', 'font-weight-semibold', 'line-height-normal'),
        typeStyle('h4', 'H4', 'fs-400', 'font-weight-semibold', 'line-height-normal'),
        typeStyle('h5', 'H5', 'fs-300', 'font-weight-medium', 'line-height-normal'),
        typeStyle('h6', 'H6', 'fs-200', 'font-weight-medium', 'line-height-normal'),
        typeStyle('body-l', 'Body L', 'fs-400', 'font-weight-regular', 'line-height-relaxed'),
        typeStyle('body-m', 'Body M', 'fs-300', 'font-weight-regular', 'line-height-normal'),
        typeStyle('body-s', 'Body S', 'fs-200', 'font-weight-regular', 'line-height-normal'),
        typeStyle('caption', 'Caption', 'fs-200', 'font-weight-regular', 'line-height-normal'),
        typeStyle('label', 'Label', 'fs-200', 'font-weight-medium', 'line-height-normal', [
          prop('letter-spacing', 'letter-spacing-wide', '--ifx-type-label-tracking')
        ]),
        typeStyle('overline', 'Overline', 'fs-100', 'font-weight-semibold', 'line-height-normal', [
          prop('letter-spacing', 'letter-spacing-caps', '--ifx-type-overline-tracking')
        ]),
        bundle('type-code', 'Code', 'typography', [
          prop('font-size', 'fs-200', '--ifx-type-code-size'),
          prop('font-family', 'font-family-mono', '--ifx-type-code-font'),
          prop('line-height', 'line-height-normal', '--ifx-type-code-line-height')
        ], 'ti-code')
      ]),
      g('Iconography', [
        bundle('icon-stroke', 'Stroke', 'border', [prop('border-width', 'border-width-2', '--ifx-icon-stroke-width')], 'ti-line'),
        bundle('icon-filled', 'Filled', 'guideline', [], 'ti-square-filled'),
        bundle('icon-rounded', 'Rounded', 'radius', [prop('radius', 'radius-md', '--ifx-icon-radius')], 'ti-border-radius'),
        bundle('icon-sharp', 'Sharp', 'radius', [prop('radius', 'radius-none', '--ifx-icon-radius-sharp')], 'ti-square'),
        bundle('icon-optical', 'Optical Size', 'spacing', [prop('spacing', 'space-16', '--ifx-icon-optical-size')], 'ti-ruler-measure'),
        bundle('icon-safe', 'Safe Area', 'spacing', [prop('spacing', 'space-8', '--ifx-icon-safe-area')], 'ti-box-padding'),
        bundle('icon-grid', 'Grid', 'spacing', [prop('spacing', 'space-24', '--ifx-icon-grid')], 'ti-grid-dots'),
        bundle('icon-weight', 'Visual Weight', 'opacity', [prop('opacity', 'opacity-72', '--ifx-icon-visual-weight')], 'ti-weight')
      ]),
      g('Illustration', [
        bundle('illus-flat', 'Flat', 'guideline', [], 'ti-photo'),
        bundle('illus-3d', '3D', 'guideline', [], 'ti-cube'),
        bundle('illus-ai', 'AI Style', 'guideline', [], 'ti-robot'),
        bundle('illus-finance', 'Finance Style', 'guideline', [], 'ti-building-bank'),
        bundle('illus-gradient', 'Gradient Style', 'color', [prop('color', 'color-navy-500', '--ifx-illus-gradient-base')], 'ti-gradienter')
      ]),
      g('Imagery', [
        bundle('img-hero', 'Hero Image', 'guideline', [], 'ti-photo-scan'),
        bundle('img-cover', 'Cover', 'radius', [prop('radius', 'radius-lg', '--ifx-img-cover-radius')], 'ti-crop'),
        bundle('img-thumb', 'Thumbnail', 'radius', [prop('radius', 'radius-md', '--ifx-img-thumb-radius')], 'ti-photo'),
        bundle('img-avatar', 'Avatar', 'radius', [prop('radius', 'radius-full', '--ifx-img-avatar-radius')], 'ti-user-circle'),
        bundle('img-banner', 'Banner', 'spacing', [prop('spacing', 'space-48', '--ifx-img-banner-height')], 'ti-layout-navbar'),
        bundle('img-empty', 'Empty State', 'guideline', [], 'ti-mood-empty'),
        bundle('img-bg', 'Background', 'color', [prop('color', 'color-slate-900', '--ifx-img-bg')], 'ti-background')
      ]),
      g('Layout', [
        bundle('layout-max', 'Max Width', 'spacing', [prop('spacing', 'space-256', '--ifx-layout-max-width')], 'ti-arrows-maximize'),
        bundle('layout-content', 'Content Width', 'spacing', [prop('spacing', 'space-192', '--ifx-layout-content-width')], 'ti-layout'),
        bundle('layout-sidebar', 'Sidebar Width', 'spacing', [prop('spacing', 'space-64', '--ifx-layout-sidebar-width')], 'ti-layout-sidebar'),
        bundle('layout-header', 'Header Height', 'spacing', [prop('spacing', 'space-56', '--ifx-layout-header-height')], 'ti-layout-navbar'),
        bundle('layout-footer', 'Footer Height', 'spacing', [prop('spacing', 'space-48', '--ifx-layout-footer-height')], 'ti-layout-bottombar')
      ]),
      g('Grid System', [
        bundle('grid-columns', 'Columns', 'text', [prop('grid-columns', 'grid-columns-12', '--ifx-grid-columns')], 'ti-columns'),
        bundle('grid-container', 'Container', 'spacing', [prop('spacing', 'grid-container-margin', '--ifx-grid-container-margin')], 'ti-container'),
        bundle('grid-margin', 'Margin', 'spacing', [prop('spacing', 'space-24', '--ifx-grid-margin')], 'ti-box-margin'),
        bundle('grid-gutter', 'Gutter', 'grid-gap', [prop('grid-gap', 'grid-gutter', '--ifx-grid-gutter')], 'ti-gutter')
      ]),
      g('Responsive', [
        bundle('resp-xs', 'Small Mobile', 'breakpoint', [prop('breakpoint', 'bp-xs', '--ifx-bp-xs')], 'ti-device-mobile'),
        bundle('resp-mobile', 'Mobile', 'breakpoint', [prop('breakpoint', 'bp-sm', '--ifx-bp-sm')], 'ti-device-mobile'),
        bundle('resp-tablet', 'Tablet', 'breakpoint', [prop('breakpoint', 'bp-md', '--ifx-bp-md')], 'ti-device-tablet'),
        bundle('resp-desktop', 'Desktop', 'breakpoint', [prop('breakpoint', 'bp-lg', '--ifx-bp-lg')], 'ti-device-desktop'),
        bundle('resp-wide', 'Wide', 'breakpoint', [prop('breakpoint', 'bp-xl', '--ifx-bp-xl')], 'ti-arrows-horizontal'),
        bundle('resp-ultra', 'Ultra Wide', 'breakpoint', [prop('breakpoint', 'bp-2xl', '--ifx-bp-2xl')], 'ti-arrows-maximize'),
        bundle('resp-3xl', 'xUltra Wide', 'breakpoint', [prop('breakpoint', 'bp-3xl', '--ifx-bp-3xl')], 'ti-arrows-maximize')
      ]),
      g('Spacing Rules', [
        bundle('space-section', 'Section Gap', 'spacing', [prop('spacing', 'space-96', '--ifx-space-section-gap')], 'ti-spacing-vertical'),
        bundle('space-stack', 'Stack Gap', 'spacing', [prop('spacing', 'space-16', '--ifx-space-stack-gap')], 'ti-stack-2'),
        bundle('space-inline', 'Inline Gap', 'spacing', [prop('spacing', 'space-8', '--ifx-space-inline-gap')], 'ti-layout-distribute-horizontal'),
        bundle('space-card', 'Card Padding', 'spacing', [prop('spacing', 'space-24', '--ifx-space-card-padding')], 'ti-box-padding')
      ]),
      g('Radius Rules', [
        bundle('radius-button', 'Button Radius', 'radius', [prop('radius', 'radius-md', '--ifx-radius-button')], 'ti-rectangle-rounded'),
        bundle('radius-card', 'Card Radius', 'radius', [prop('radius', 'radius-lg', '--ifx-radius-card')], 'ti-cards'),
        bundle('radius-avatar', 'Avatar Radius', 'radius', [prop('radius', 'radius-full', '--ifx-radius-avatar')], 'ti-user-circle'),
        bundle('radius-modal', 'Modal Radius', 'radius', [prop('radius', 'radius-xl', '--ifx-radius-modal')], 'ti-app-window')
      ]),
      g('Border Rules', [
        bundle('border-divider', 'Divider', 'border', [prop('border-width', 'border-width-1', '--ifx-border-divider')], 'ti-separator'),
        bundle('border-card', 'Card Border', 'border', [prop('border-width', 'border-width-1', '--ifx-border-card')], 'ti-border-all'),
        bundle('border-table', 'Table Border', 'border', [prop('border-width', 'border-width-1', '--ifx-border-table')], 'ti-table'),
        bundle('border-input', 'Input Border', 'border', [prop('border-width', 'border-width-1', '--ifx-border-input')], 'ti-textbox')
      ]),
      g('Elevation', [
        bundle('elev-s1', 'Surface 1', 'shadow', [prop('shadow', 'shadow-xs', '--ifx-elev-surface-1')], 'ti-layers-subtract'),
        bundle('elev-s2', 'Surface 2', 'shadow', [prop('shadow', 'shadow-sm', '--ifx-elev-surface-2')], 'ti-layers-intersect'),
        bundle('elev-s3', 'Surface 3', 'shadow', [prop('shadow', 'shadow-md', '--ifx-elev-surface-3')], 'ti-stack'),
        bundle('elev-modal', 'Modal', 'shadow', [prop('shadow', 'shadow-lg', '--ifx-elev-modal')], 'ti-app-window'),
        bundle('elev-float', 'Floating Panel', 'shadow', [prop('shadow', 'shadow-xl', '--ifx-elev-floating')], 'ti-panel-top')
      ]),
      g('Motion', [
        bundle('motion-fade', 'Fade', 'motion', [
          prop('duration', 'duration-normal', '--ifx-motion-fade-duration'),
          prop('easing', 'ease-out', '--ifx-motion-fade-easing')
        ], 'ti-fade'),
        bundle('motion-slide', 'Slide', 'motion', [
          prop('duration', 'duration-normal', '--ifx-motion-slide-duration'),
          prop('easing', 'ease-in-out', '--ifx-motion-slide-easing')
        ], 'ti-arrow-right'),
        bundle('motion-zoom', 'Zoom', 'motion', [
          prop('duration', 'duration-fast', '--ifx-motion-zoom-duration'),
          prop('easing', 'ease-out', '--ifx-motion-zoom-easing')
        ], 'ti-zoom-in'),
        bundle('motion-scale', 'Scale', 'motion', [
          prop('duration', 'duration-fast', '--ifx-motion-scale-duration'),
          prop('easing', 'ease-out', '--ifx-motion-scale-easing')
        ], 'ti-resize'),
        bundle('motion-page', 'Page Transition', 'motion', [
          prop('duration', 'duration-slow', '--ifx-motion-page-duration'),
          prop('easing', 'ease-in-out', '--ifx-motion-page-easing')
        ], 'ti-transition-right')
      ]),
      g('Interaction', [
        bundle('ix-hover', 'Hover', 'motion', [prop('duration', 'duration-fast', '--ifx-ix-hover-duration')], 'ti-hand-click'),
        bundle('ix-active', 'Active', 'motion', [prop('duration', 'duration-instant', '--ifx-ix-active-duration')], 'ti-click'),
        bundle('ix-focus', 'Focus', 'color', [prop('color', 'color-violet-500', '--ifx-ix-focus-color')], 'ti-focus'),
        bundle('ix-disabled', 'Disabled', 'opacity', [prop('opacity', 'opacity-disabled', '--ifx-ix-disabled-opacity')], 'ti-ban'),
        bundle('ix-loading', 'Loading', 'motion', [prop('duration', 'duration-slow', '--ifx-ix-loading-duration')], 'ti-loader'),
        bundle('ix-drag', 'Drag', 'motion', [prop('duration', 'duration-normal', '--ifx-ix-drag-duration')], 'ti-hand-grab'),
        bundle('ix-drop', 'Drop', 'motion', [prop('duration', 'duration-normal', '--ifx-ix-drop-duration')], 'ti-hand-stop'),
        bundle('ix-keyboard', 'Keyboard', 'guideline', [], 'ti-keyboard'),
        bundle('ix-follow', 'Follow Action', 'guideline', [
          prop('color', 'color-violet-400', '--ifx-color-violet-400')
        ], 'ti-bookmark'),
        /* Alias đọc cũ — cùng Foundation Follow (không còn Heart cho Watchlist). */
        bundle('ix-heart', 'Follow Action (alias)', 'guideline', [
          prop('color', 'color-violet-400', '--ifx-color-violet-400')
        ], 'ti-bookmark'),
        bundle('ix-share', 'Share Action', 'guideline', [], 'ti-share-3')
      ]),
      g('Accessibility', [
        bundle('a11y-contrast', 'Contrast', 'guideline', [], 'ti-contrast'),
        bundle('a11y-focus-ring', 'Focus Ring', 'border', [
          prop('color', 'color-violet-500', '--ifx-a11y-focus-ring-color'),
          prop('border-width', 'border-width-2', '--ifx-a11y-focus-ring-width')
        ], 'ti-focus-2'),
        bundle('a11y-keyboard', 'Keyboard', 'guideline', [], 'ti-keyboard'),
        bundle('a11y-sr', 'Screen Reader', 'guideline', [], 'ti-ear'),
        bundle('a11y-touch', 'Touch Target', 'spacing', [prop('spacing', 'space-48', '--ifx-a11y-touch-min')], 'ti-hand-finger'),
        bundle('a11y-motion', 'Motion Reduce', 'duration', [prop('duration', 'duration-instant', '--ifx-a11y-motion-reduce')], 'ti-accessible')
      ]),
      g('Data Visualization', [
        bundle('viz-candle', 'Candlestick', 'color', [prop('color', 'color-chart-1', '--ifx-viz-candlestick')], 'ti-chart-candle'),
        bundle('viz-ohlc', 'OHLC', 'color', [prop('color', 'color-chart-2', '--ifx-viz-ohlc')], 'ti-chart-bar'),
        bundle('viz-area', 'Area', 'color', [prop('color', 'color-chart-3', '--ifx-viz-area')], 'ti-chart-area'),
        bundle('viz-line', 'Line', 'color', [prop('color', 'color-chart-4', '--ifx-viz-line')], 'ti-chart-line'),
        bundle('viz-bar', 'Bar', 'color', [prop('color', 'color-chart-5', '--ifx-viz-bar')], 'ti-chart-bar'),
        bundle('viz-pie', 'Pie', 'color', [prop('color', 'color-chart-6', '--ifx-viz-pie')], 'ti-chart-pie'),
        bundle('viz-heat', 'Heatmap', 'color', [prop('color', 'color-chart-7', '--ifx-viz-heatmap')], 'ti-grid-pattern'),
        bundle('viz-tree', 'Treemap', 'color', [prop('color', 'color-chart-8', '--ifx-viz-treemap')], 'ti-layout-grid'),
        bundle('viz-sankey', 'Sankey', 'color', [prop('color', 'color-chart-9', '--ifx-viz-sankey')], 'ti-git-branch'),
        bundle('viz-gauge', 'Gauge', 'color', [prop('color', 'color-chart-10', '--ifx-viz-gauge')], 'ti-gauge'),
        bundle('viz-spark', 'Sparkline', 'color', [prop('color', 'color-cyan-500', '--ifx-viz-sparkline')], 'ti-chart-arcs'),
        bundle('viz-flow', 'Money Flow', 'color', [prop('color', 'color-green-500', '--ifx-viz-money-flow')], 'ti-arrows-left-right')
      ]),
      g('Content Guidelines', [
        bundle('content-number', 'Number Format', 'guideline', [], 'ti-numbers'),
        bundle('content-currency', 'Currency Format', 'guideline', [], 'ti-currency-dollar'),
        bundle('content-percent', 'Percent Format', 'guideline', [], 'ti-percentage'),
        bundle('content-date', 'Date Format', 'guideline', [], 'ti-calendar'),
        bundle('content-empty', 'Empty State', 'guideline', [], 'ti-mood-empty'),
        bundle('content-error', 'Error Message', 'guideline', [], 'ti-alert-circle'),
        bundle('content-success', 'Success Message', 'guideline', [], 'ti-circle-check'),
        bundle('content-loading', 'Loading Text', 'guideline', [], 'ti-loader')
      ]),
      g('Theme', [
        bundle('theme-light', 'Light', 'color', [prop('color', 'color-slate-50', '--ifx-theme-light-bg')], 'ti-sun'),
        bundle('theme-dark', 'Dark', 'color', [prop('color', 'color-slate-900', '--ifx-theme-dark-bg')], 'ti-moon'),
        bundle('theme-amoled', 'AMOLED', 'color', [prop('color', 'color-slate-950', '--ifx-theme-amoled-bg')], 'ti-moon-stars'),
        bundle('theme-hc', 'High Contrast', 'color', [prop('color', 'color-slate-950', '--ifx-theme-hc-bg')], 'ti-contrast'),
        bundle('theme-surface', 'Surface Base', 'color', [prop('color', 'color-slate-800', '--ifx-theme-surface-base')], 'ti-layers-subtract')
      ])
    ];
  }

  var PAGE = {
    id: 'foundations',
    file: 'Foundations',
    layer: 'foundation',
    editMode: 'tokenRef',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'foundations::' + groupTitle + '::' + bundle.id + '::' + property.property;
  }

  function pageCounts() {
    var total = 0;
    PAGE.groups.forEach(function (g) { total += g.items.length; });
    return { total: total, bundles: total };
  }

  global.IfluxDsFoundationsCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts
  };
})(window);
