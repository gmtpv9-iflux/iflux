/* iFlux DS — Charts / Data Visualization (10 nhóm) */
(function (global) {
  'use strict';
  if (global.IfluxDsChartsCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function prop(property, token, variable) {
    return { property: property, token: token || '', variable: variable || '' };
  }

  function chartType(id, name, typeId, foundationVar, icon) {
    return {
      id: id,
      name: name,
      readonly: true,
      previewType: 'chart-type',
      icon: icon || 'ti-chart-line',
      typeId: typeId,
      foundationVar: foundationVar || '',
      properties: [
        { property: 'chart-type', token: typeId, value: typeId, readonly: true },
        { property: 'foundation-ref', token: foundationVar || '—', value: foundationVar || '—', readonly: true }
      ]
    };
  }

  function rule(id, name, previewType, properties, icon) {
    return {
      id: id,
      name: name,
      readonly: false,
      previewType: previewType || 'chart-rule',
      icon: icon || 'ti-chart-bar',
      properties: properties || []
    };
  }

  function buildGroups() {
    return [
      {
        title: 'Chart Types',
        kind: 'catalog',
        items: [
          chartType('ct-line', 'Line Chart', 'chart.line', '--ifx-viz-line', 'ti-chart-line'),
          chartType('ct-area', 'Area Chart', 'chart.area', '--ifx-viz-area', 'ti-chart-area'),
          chartType('ct-bar', 'Bar Chart', 'chart.bar', '--ifx-viz-bar', 'ti-chart-bar'),
          chartType('ct-stacked-bar', 'Stacked Bar', 'chart.stacked-bar', '--ifx-viz-bar', 'ti-chart-bar'),
          chartType('ct-h-bar', 'Horizontal Bar', 'chart.horizontal-bar', '--ifx-viz-bar', 'ti-chart-bar'),
          chartType('ct-pie', 'Pie Chart', 'chart.pie', '--ifx-viz-pie', 'ti-chart-pie'),
          chartType('ct-donut', 'Donut Chart', 'chart.donut', '--ifx-viz-pie', 'ti-chart-pie'),
          chartType('ct-scatter', 'Scatter', 'chart.scatter', '--ifx-viz-line', 'ti-chart-arrows-vertical'),
          chartType('ct-spark', 'Sparkline', 'chart.sparkline', '--ifx-viz-sparkline', 'ti-chart-arcs'),
          chartType('ct-gauge', 'Gauge', 'chart.gauge', '--ifx-viz-gauge', 'ti-gauge'),
          chartType('ct-treemap', 'Treemap', 'chart.treemap', '--ifx-viz-treemap', 'ti-layout-grid'),
          chartType('ct-heatmap', 'Heatmap', 'chart.heatmap', '--ifx-viz-heatmap', 'ti-grid-pattern'),
          chartType('ct-sankey', 'Sankey', 'chart.sankey', '--ifx-viz-sankey', 'ti-git-branch'),
          chartType('ct-radar', 'Radar', 'chart.radar', '--ifx-viz-line', 'ti-chart-dots'),
          chartType('ct-bubble', 'Bubble', 'chart.bubble', '--ifx-viz-line', 'ti-chart-dots'),
          chartType('ct-candle', 'Candlestick', 'chart.candlestick', '--ifx-viz-candlestick', 'ti-chart-candle'),
          chartType('ct-ohlc', 'OHLC', 'chart.ohlc', '--ifx-viz-ohlc', 'ti-chart-candle'),
          chartType('ct-volume', 'Volume', 'chart.volume', '--ifx-viz-bar', 'ti-chart-bar'),
          chartType('ct-flow', 'Money Flow', 'chart.money-flow', '--ifx-viz-money-flow', 'ti-arrows-left-right'),
          chartType('ct-sector-heat', 'Sector Heatmap', 'chart.sector-heatmap', '--ifx-viz-heatmap', 'ti-grid-pattern')
        ]
      },
      {
        title: 'Chart Foundation',
        items: [
          rule('cf-height', 'Default Height', 'spacing', [
            prop('spacing', 'space-320', '--ifx-chart-height-default')
          ], 'ti-arrows-vertical'),
          rule('cf-min-height', 'Min Height', 'spacing', [
            prop('spacing', 'space-160', '--ifx-chart-height-min')
          ], 'ti-ruler-measure'),
          rule('cf-radius', 'Container Radius', 'radius', [
            prop('radius', 'radius-lg', '--ifx-chart-container-radius')
          ], 'ti-border-radius'),
          rule('cf-padding', 'Container Padding', 'spacing', [
            prop('spacing', 'space-16', '--ifx-chart-container-padding')
          ], 'ti-box-padding'),
          rule('cf-bg', 'Background', 'color', [
            prop('color', 'color-slate-850', '--ifx-chart-bg')
          ], 'ti-background'),
          rule('cf-plot-bg', 'Plot Background', 'color', [
            prop('color', 'color-slate-900', '--ifx-chart-plot-bg')
          ], 'ti-background')
        ]
      },
      {
        title: 'Axes',
        items: [
          rule('ax-label-color', 'Axis Label Color', 'color', [
            prop('color', 'color-slate-400', '--ifx-chart-axis-label-color')
          ], 'ti-letter-case'),
          rule('ax-tick-color', 'Axis Tick Color', 'color', [
            prop('color', 'color-slate-500', '--ifx-chart-axis-tick-color')
          ], 'ti-letter-case'),
          rule('ax-label-size', 'Axis Label Size', 'font-size', [
            prop('font-size', 'fs-200', '--ifx-chart-axis-label-size')
          ], 'ti-typography'),
          rule('ax-width', 'Axis Line Width', 'border-width', [
            prop('border-width', 'border-width-1', '--ifx-chart-axis-width')
          ], 'ti-line'),
          rule('ax-title-size', 'Axis Title Size', 'font-size', [
            prop('font-size', 'fs-300', '--ifx-chart-axis-title-size')
          ], 'ti-typography')
        ]
      },
      {
        title: 'Series',
        items: [
          rule('ser-line-width', 'Line Width', 'border-width', [
            prop('border-width', 'border-width-2', '--ifx-chart-line-width')
          ], 'ti-chart-line'),
          rule('ser-bar-radius', 'Bar Radius', 'radius', [
            prop('radius', 'radius-sm', '--ifx-chart-bar-radius')
          ], 'ti-chart-bar'),
          rule('ser-bar-width', 'Bar Column Gap', 'spacing', [
            prop('spacing', 'space-8', '--ifx-chart-bar-gap')
          ], 'ti-spacing-vertical'),
          rule('ser-area-opacity', 'Area Fill Opacity', 'opacity', [
            prop('opacity', 'opacity-25', '--ifx-chart-area-opacity')
          ], 'ti-chart-area'),
          rule('ser-stroke', 'Series Stroke Width', 'border-width', [
            prop('border-width', 'border-width-2', '--ifx-chart-series-stroke')
          ], 'ti-line')
        ]
      },
      {
        title: 'Data Points',
        items: [
          rule('pt-size', 'Point Size', 'spacing', [
            prop('spacing', 'space-8', '--ifx-chart-point-size')
          ], 'ti-circle-dotted'),
          rule('pt-hover', 'Hover Size', 'spacing', [
            prop('spacing', 'space-12', '--ifx-chart-point-hover-size')
          ], 'ti-circle-dotted'),
          rule('pt-stroke', 'Point Stroke', 'border-width', [
            prop('border-width', 'border-width-2', '--ifx-chart-point-stroke')
          ], 'ti-line')
        ]
      },
      {
        title: 'Legend',
        items: [
          rule('leg-font', 'Legend Font Size', 'font-size', [
            prop('font-size', 'fs-200', '--ifx-chart-legend-font-size')
          ], 'ti-list'),
          rule('leg-icon', 'Legend Icon Size', 'spacing', [
            prop('spacing', 'space-12', '--ifx-chart-legend-icon-size')
          ], 'ti-icons'),
          rule('leg-color', 'Legend Text Color', 'color', [
            prop('color', 'color-slate-400', '--ifx-chart-legend-color')
          ], 'ti-palette')
        ]
      },
      {
        title: 'Tooltip',
        items: [
          rule('tip-bg', 'Tooltip Background', 'color', [
            prop('color', 'color-slate-850', '--ifx-chart-tooltip-bg')
          ], 'ti-message'),
          rule('tip-radius', 'Tooltip Radius', 'radius', [
            prop('radius', 'radius-md', '--ifx-chart-tooltip-radius')
          ], 'ti-border-radius'),
          rule('tip-shadow', 'Tooltip Shadow', 'shadow', [
            prop('shadow', 'shadow-lg', '--ifx-chart-tooltip-shadow')
          ], 'ti-shadow'),
          rule('tip-font', 'Tooltip Font Size', 'font-size', [
            prop('font-size', 'fs-200', '--ifx-chart-tooltip-font-size')
          ], 'ti-typography'),
          rule('tip-color', 'Tooltip Text Color', 'color', [
            prop('color', 'color-slate-100', '--ifx-chart-tooltip-color')
          ], 'ti-palette')
        ]
      },
      {
        title: 'Grid & Reference',
        items: [
          rule('grid-color', 'Grid Line Color', 'color', [
            prop('color', 'alpha-white-8', '--ifx-chart-grid-color')
          ], 'ti-grid-dots'),
          rule('grid-width', 'Grid Line Width', 'border-width', [
            prop('border-width', 'border-width-1', '--ifx-chart-grid-width')
          ], 'ti-line'),
          rule('ref-color', 'Reference Line Color', 'color', [
            prop('color', 'color-slate-500', '--ifx-chart-reference-color')
          ], 'ti-separator'),
          rule('ref-width', 'Reference Line Width', 'border-width', [
            prop('border-width', 'border-width-1', '--ifx-chart-reference-width')
          ], 'ti-line')
        ]
      },
      {
        title: 'Interaction',
        items: [
          rule('ix-crosshair-color', 'Crosshair Color', 'color', [
            prop('color', 'color-violet-500', '--ifx-chart-crosshair-color')
          ], 'ti-focus'),
          rule('ix-crosshair-width', 'Crosshair Width', 'border-width', [
            prop('border-width', 'border-width-1', '--ifx-chart-crosshair-width')
          ], 'ti-line'),
          rule('ix-hover', 'Hover Opacity', 'opacity', [
            prop('opacity', 'opacity-72', '--ifx-chart-hover-opacity')
          ], 'ti-hand-click'),
          rule('ix-duration', 'Transition Duration', 'duration', [
            prop('duration', 'duration-fast', '--ifx-chart-transition-duration')
          ], 'ti-transition-right')
        ]
      },
      {
        title: 'Financial Charts',
        items: [
          rule('fin-bull', 'Bull Candle', 'color', [
            prop('color', 'color-green-500', '--ifx-chart-bull')
          ], 'ti-chart-candle'),
          rule('fin-bear', 'Bear Candle', 'color', [
            prop('color', 'color-red-500', '--ifx-chart-bear')
          ], 'ti-chart-candle'),
          rule('fin-vol-up', 'Volume Up', 'color', [
            prop('color', 'color-green-500', '--ifx-chart-volume-up')
          ], 'ti-chart-bar'),
          rule('fin-vol-down', 'Volume Down', 'color', [
            prop('color', 'color-red-500', '--ifx-chart-volume-down')
          ], 'ti-chart-bar'),
          rule('fin-ma20', 'MA20', 'color', [
            prop('color', 'color-orange-500', '--ifx-chart-ma-20')
          ], 'ti-chart-line'),
          rule('fin-ma50', 'MA50', 'color', [
            prop('color', 'color-navy-500', '--ifx-chart-ma-50')
          ], 'ti-chart-line'),
          rule('fin-ma200', 'MA200', 'color', [
            prop('color', 'color-purple-500', '--ifx-chart-ma-200')
          ], 'ti-chart-line'),
          rule('fin-flow-in', 'Money Flow In', 'color', [
            prop('color', 'color-green-500', '--ifx-chart-flow-in')
          ], 'ti-arrows-left-right'),
          rule('fin-flow-out', 'Money Flow Out', 'color', [
            prop('color', 'color-red-450', '--ifx-chart-flow-out')
          ], 'ti-arrows-left-right')
        ]
      }
    ];
  }

  var PAGE = {
    id: 'charts',
    file: 'Charts',
    subtitle: 'Data Visualization',
    layer: 'charts',
    editMode: 'tokenRef',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'charts::' + groupTitle + '::' + bundle.id + '::' + property.property;
  }

  function pageCounts() {
    var total = 0;
    PAGE.groups.forEach(function (g) { total += g.items.length; });
    return { total: total };
  }

  global.IfluxDsChartsCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts
  };
})(window);
