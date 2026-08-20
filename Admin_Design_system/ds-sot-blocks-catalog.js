/* iFlux DS — Blocks (UI composition · Items + chart slots · BLK-* + TPL-*) · GĐ1 */
(function (global) {
  'use strict';
  if (global.IfluxDsBlocksCatalog) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pr(key, refKind, token, variable, propType) {
    return { key: key, refKind: refKind || 'primitive', token: token, variable: variable || '', property: propType || key };
  }

  function sem(key, logicalId, variable) {
    return pr(key, 'semantic', logicalId, variable, key === 'color' || key === 'background' || key === 'border-color' ? 'color' : key);
  }

  function prim(key, token, variable, propType) {
    return pr(key, 'primitive', token, variable, propType || key);
  }

  function comp(slot, label, ref, refKind) {
    return { slot: slot, label: label, ref: ref || '', refKind: refKind || 'item' };
  }

  function resolveCardRef(opts) {
    if (opts.cardRef) return opts.cardRef;
    var cn = opts.className || '';
    if (cn.indexOf('ifx-mkt-liq-block') >= 0) return 'CRD-SHELL-LIQUIDITY';
    if (cn.indexOf('ifx-mkt-card') >= 0) return 'CRD-SHELL-MARKET';
    if (cn.indexOf('ifx-flow-card') >= 0 || cn.indexOf('ifx-mcmp') >= 0) return 'CRD-SHELL-FLOW';
    if (cn.indexOf('ifx-com-breadth-sidebar') >= 0) return 'CRD-SHELL-COM-BREADTH';
    if (cn.indexOf('ifx-com-overview') >= 0) return 'CRD-SHELL-COM-OVERVIEW';
    if (cn.indexOf('ifx-mkt-sidebar-widget') >= 0 || cn.indexOf('ifx-breadth-block') >= 0) return 'CRD-SHELL-SIDEBAR';
    if (cn.indexOf('ifx-hub-profile-card') >= 0) return 'CRD-SHELL-HUB';
    if (cn.indexOf('ifx-com-feed') >= 0 || cn.indexOf('ifx-com-post') >= 0) return 'CRD-SHELL-COM-POST';
    if (cn.indexOf('ix-card') >= 0) return 'CRD-SHELL-ADMIN';
    if (opts.shell === 'card') return 'CRD-SHELL-GENERIC';
    if (opts.shell === 'sidebar') return 'CRD-SHELL-SIDEBAR';
    return '';
  }

  function block(id, name, logicalId, opts) {
    opts = opts || {};
    return {
      id: id,
      name: name,
      logicalId: logicalId,
      blockId: opts.blockId || id.toUpperCase().replace(/-/g, '-'),
      kind: opts.kind || 'instance',
      templateId: opts.templateId || '',
      cardRef: resolveCardRef(opts),
      surface: opts.surface || 'user',
      className: opts.className || '',
      previewType: opts.previewType || 'generic',
      regions: opts.regions || 'body',
      anatomy: opts.anatomy || '',
      composition: opts.composition || [],
      productRefs: opts.productRefs || opts.widgetRefs || [],
      status: opts.status || 'ok',
      file: opts.file || 'block-templates.js',
      properties: opts.properties || []
    };
  }

  function layoutProps(extra) {
    var base = [
      prim('gap', 'space-12', '--ifx-block-gap', 'spacing'),
      prim('padding-body', 'space-16', '--ifx-inset-widget', 'spacing'),
      prim('padding-head', 'space-16', '--ifx-inset-widget', 'spacing')
    ];
    return extra ? base.concat(extra) : base;
  }

  function tpl(id, name, logicalId, classes, previewType, composition, opts) {
    opts = opts || {};
    return block(id, name, logicalId, {
      kind: 'template',
      blockId: id,
      templateId: id,
      cardRef: opts.cardRef || resolveCardRef({ shell: opts.shell, className: classes }),
      surface: opts.surface || 'shared',
      className: classes,
      previewType: previewType,
      regions: opts.regions || 'body',
      anatomy: opts.anatomy || '',
      composition: composition,
      productRefs: opts.productRefs || opts.widgetRefs || [],
      file: 'block-templates.js',
      properties: layoutProps(opts.extraProps)
    });
  }

  function buildGroups() {
    return [
      {
        title: 'Block Templates',
        note: 'TPL-* · composition pattern · mount trong Card (CRD-*)',
        items: [
          tpl('tpl-shell-card', 'Shell Card', 'block.template.shell-card', 'ifx-block ifx-block--card', 'block-shell-card', [
            comp('head', 'Block head', 'atom.label', 'atom'),
            comp('body', 'Block body mount', '', 'slot')
          ], { cardRef: 'CRD-SHELL-GENERIC', regions: 'head · body', anatomy: 'head (title · actions?)\n└── body (block mount)' }),
          tpl('tpl-shell-sidebar', 'Shell Sidebar', 'block.template.shell-sidebar', 'ifx-block ifx-block--sidebar', 'block-shell-sidebar', [
            comp('head', 'Sidebar head', 'atom.label', 'atom'),
            comp('body', 'Sidebar body', '', 'slot')
          ], { cardRef: 'CRD-SHELL-SIDEBAR', regions: 'head · body' }),
          tpl('tpl-breadth', 'Breadth Grid', 'block.template.breadth', 'ifx-breadth-block', 'tpl-breadth', [
            comp('stats', 'Stat cells', 'item.general.kpi', 'item'),
            comp('ratio', 'Ratio bar', 'item.market.price-cell', 'item')
          ], { anatomy: 'stat grid\n└── ratio bar' }),
          tpl('tpl-treemap', 'Treemap Heat', 'block.template.treemap', 'ifx-treemap-tile', 'tpl-treemap', [
            comp('tiles', 'Heat tiles', '', 'chart'),
            comp('legend', 'Legend', 'atom.chip', 'atom')
          ], { anatomy: 'treemap tiles*' }),
          tpl('tpl-rank-bar', 'Rank Bar List', 'block.template.rank-bar', 'ifx-rank-bar', 'tpl-rank-bar', [
            comp('rows', 'Rank rows', 'item.market.stock-row', 'item')
          ], { anatomy: 'rank rows*' }),
          tpl('tpl-flow-split', 'Flow Split Chart', 'block.template.flow-split', 'ifx-flow-split', 'tpl-flow-split', [
            comp('chart', 'Symmetric bars', '', 'chart'),
            comp('tickers', 'Entity labels', 'item.market.stock-row', 'item')
          ], { anatomy: 'buy bar · ticker · sell bar' }),
          tpl('tpl-zone-position', 'Zone Position', 'block.template.zone-position', 'ifx-zone-pos', 'tpl-rank-bar', [
            comp('rows', 'Period rows', 'item.market.price-cell', 'item')
          ], { anatomy: 'period\n└── bar (left % · marker · right %)\n└── ranges · center' }),
          tpl('tpl-index-grid', 'Index Grid', 'block.template.index-grid', 'ifx-com-ex-grid', 'tpl-index-grid', [
            comp('cards', 'Index mini cards', 'item.market.index-metric', 'item')
          ], { anatomy: 'index cards*' }),
          tpl('tpl-list-row', 'List Rows', 'block.template.list-row', 'ifx-stock-row', 'stock-row-list', [
            comp('rows', 'Entity rows', 'item.market.stock-row-wrap', 'item')
          ], { anatomy: 'list rows*' }),
          tpl('tpl-feed-card', 'Feed Post Body', 'block.template.feed-card', 'ifx-com-post', 'com-card', [
            comp('title', 'Title row', 'item.news.title-row', 'item'),
            comp('stats', 'Engagement', 'item.news.stats', 'item')
          ], { anatomy: 'thumb · title · tags · stats (author chỉ bài chi tiết)' })
        ]
      },
      {
        title: 'Market Intelligence',
        items: [
          block('blk-mkt-overview', 'Market Overview', 'block.market.overview', {
            blockId: 'BLK-MKT-OVERVIEW',
            templateId: 'TPL-INDEX-GRID',
            shell: 'sidebar',
            className: 'ifx-com-overview ifx-mkt-sidebar-widget',
            previewType: 'com-overview',
            regions: 'head · body',
            anatomy: 'head\n└── index grid',
            composition: [comp('grid', 'Index grid', 'block.template.index-grid', 'template')],
            productRefs: ['WGT-MKT-001'],
            file: 'news-market-overview.js'
          }),
          block('blk-mkt-breadth', 'Market Breadth', 'block.market.breadth', {
            blockId: 'BLK-MKT-BREADTH',
            templateId: 'TPL-BREADTH',
            shell: 'sidebar',
            className: 'ifx-mkt-sidebar-widget ifx-breadth-block',
            previewType: 'tpl-breadth',
            regions: 'head · body',
            anatomy: 'head\n└── breadth stats + ratio',
            composition: [comp('breadth', 'Breadth pattern', 'block.template.breadth', 'template')],
            productRefs: ['WGT-MKT-002'],
            file: 'breadth-block.js'
          }),
          block('blk-mkt-heat-sector', 'Heatmap Sector', 'block.market.heat-sector', {
            blockId: 'BLK-MKT-HEAT-SECTOR',
            templateId: 'TPL-TREEMAP',
            shell: 'card',
            className: 'ifx-mkt-card',
            previewType: 'mkt-card-treemap',
            regions: 'head · body',
            anatomy: 'head\n└── treemap mount',
            composition: [comp('heatmap', 'Treemap', 'block.template.treemap', 'template')],
            productRefs: ['WGT-MKT-004'],
            file: 'market-heatmap.js'
          }),
          block('blk-mkt-heat-family', 'Heatmap Family', 'block.market.heat-family', {
            blockId: 'BLK-MKT-HEAT-FAMILY',
            templateId: 'TPL-TREEMAP',
            shell: 'card',
            className: 'ifx-mkt-card',
            previewType: 'mkt-card-treemap',
            productRefs: ['WGT-MKT-005'],
            file: 'market-heatmap.js',
            composition: [comp('heatmap', 'Treemap', 'block.template.treemap', 'template')]
          }),
          block('blk-mkt-heat-story', 'Heatmap Story', 'block.market.heat-story', {
            blockId: 'BLK-MKT-HEAT-CHUDE',
            templateId: 'TPL-TREEMAP',
            shell: 'card',
            className: 'ifx-mkt-card',
            previewType: 'mkt-card-treemap',
            productRefs: ['WGT-MKT-006'],
            file: 'market-heatmap.js',
            composition: [comp('heatmap', 'Treemap', 'block.template.treemap', 'template')]
          }),
          block('blk-mkt-liq', 'Liquidity Chart', 'block.market.liquidity', {
            blockId: 'BLK-MKT-LIQ',
            templateId: 'TPL-SHELL-CARD',
            shell: 'card',
            className: 'ifx-mkt-liq-block',
            previewType: 'mkt-liq',
            regions: 'head · filters · body',
            anatomy: 'head · session tabs · exchange\n└── area chart',
            composition: [
              comp('filters', 'Session tabs', 'atom.segmented', 'atom'),
              comp('chart', 'KLGD/GTGD chart', '', 'chart')
            ],
            productRefs: ['WGT-MKT-007', 'WGT-MKT-008'],
            file: 'market-liquidity.js'
          }),
          block('blk-mkt-rankings', 'Top 10 Rankings', 'block.market.rankings', {
            blockId: 'BLK-MKT-RANKINGS',
            templateId: 'TPL-RANK-BAR',
            shell: 'card',
            className: 'ifx-mkt-card',
            previewType: 'tpl-rank-bar',
            regions: 'head · body',
            composition: [comp('ranks', 'Rank bars', 'block.template.rank-bar', 'template')],
            productRefs: ['WGT-TOP-001', 'WGT-TOP-002', 'WGT-TOP-003'],
            file: 'top10-market-block.js'
          }),
          block('blk-mkt-movers', 'Top Movers List', 'block.market.movers', {
            blockId: 'BLK-MKT-MOVERS',
            templateId: 'TPL-LIST-ROW',
            shell: 'none',
            className: 'ifx-movers-tabs',
            previewType: 'movers-list',
            regions: 'tabs · list',
            anatomy: 'tabs (1D · 1W · 1M)\n└── stock rows*',
            composition: [
              comp('tabs', 'Period tabs', 'atom.segmented', 'atom'),
              comp('rows', 'Stock rows', 'item.market.stock-row', 'item')
            ],
            productRefs: [],
            file: 'market-rankings.js'
          })
        ]
      },
      {
        title: 'Money Flow',
        items: [
          block('blk-flw-ctx', 'Market Context', 'block.flow.context', {
            blockId: 'BLK-FLW-CTX',
            shell: 'sidebar',
            className: 'ifx-flow-sidebar',
            previewType: 'flow-context',
            regions: 'zones',
            anatomy: 'VN-Index · S/R zones · price bands',
            productRefs: ['WGT-FLW-CTX'],
            file: 'flow-market-sidebar.js'
          }),
          block('blk-flw-net-stock', 'Net Flow Stock', 'block.flow.net-stock', {
            blockId: 'BLK-FLW-NET-STOCK',
            templateId: 'TPL-FLOW-SPLIT',
            shell: 'card',
            className: 'ifx-flow-card',
            previewType: 'flow-card-split',
            regions: 'head · body',
            composition: [comp('split', 'Flow split', 'block.template.flow-split', 'template')],
            productRefs: ['WGT-FLW-SUBJ-STOCK'],
            file: 'flow-net-top.js'
          }),
          block('blk-flw-net-sector', 'Net Flow Sector', 'block.flow.net-sector', {
            blockId: 'BLK-FLW-NET-SECTOR',
            templateId: 'TPL-FLOW-SPLIT',
            shell: 'card',
            className: 'ifx-flow-card',
            previewType: 'flow-card-split',
            productRefs: ['WGT-FLW-SUBJ-SECTOR'],
            file: 'flow-net-top.js',
            composition: [comp('split', 'Flow split', 'block.template.flow-split', 'template')]
          }),
          block('blk-flw-net-hst', 'Net Flow Ecosystem', 'block.flow.net-hst', {
            blockId: 'BLK-FLW-NET-HST',
            templateId: 'TPL-FLOW-SPLIT',
            shell: 'card',
            className: 'ifx-flow-card',
            previewType: 'flow-card-split',
            productRefs: ['WGT-FLW-SUBJ-HST'],
            file: 'flow-net-top.js',
            composition: [comp('split', 'Flow split', 'block.template.flow-split', 'template')]
          }),
          block('blk-flw-net-story', 'Net Flow Story', 'block.flow.net-story', {
            blockId: 'BLK-FLW-NET-CHUDE',
            templateId: 'TPL-FLOW-SPLIT',
            shell: 'card',
            className: 'ifx-flow-card',
            previewType: 'flow-card-split',
            productRefs: ['WGT-FLW-SUBJ-STORY'],
            file: 'flow-net-top.js',
            composition: [comp('split', 'Flow split', 'block.template.flow-split', 'template')]
          }),
          block('blk-flw-score', 'MCMP Score Top', 'block.flow.score', {
            blockId: 'BLK-FLW-SCORE',
            shell: 'card',
            className: 'ifx-flow-card ifx-mcmp',
            previewType: 'flow-card',
            regions: 'head · body',
            anatomy: 'head\n└── radar / entity list',
            composition: [comp('chart', 'MCMP radar', '', 'chart')],
            productRefs: ['WGT-FLW-STAT_STOCK', 'WGT-FLW-EX_TM_IN'],
            file: 'flow-score-top.js'
          }),
          block('blk-flw-smart', 'Smart Flow Summary', 'block.flow.smart', {
            blockId: 'BLK-FLW-SMART',
            shell: 'none',
            className: 'ifx-flow-panel',
            previewType: 'flow-smart',
            status: 'partial',
            regions: 'panels · paywall?',
            anatomy: 'flow panels*\n└── premium gate',
            composition: [
              comp('panels', 'Flow panels', 'item.flow.panel', 'item'),
              comp('gate', 'Paywall', 'user.paywall-lock', 'atom')
            ],
            productRefs: ['WGT-FLW-001'],
            file: 'widget-renderers.js'
          })
        ]
      },
      {
        title: 'Community',
        items: [
          block('blk-com-overview', 'Community Overview', 'block.news.overview', {
            blockId: 'BLK-COM-OVERVIEW',
            templateId: 'TPL-INDEX-GRID',
            shell: 'sidebar',
            className: 'ifx-com-overview--sidebar',
            previewType: 'com-overview',
            productRefs: ['WGT-MKT-001'],
            file: 'news-page.js',
            composition: [comp('grid', 'Index grid', 'block.template.index-grid', 'template')]
          }),
          block('blk-com-breadth', 'Community Breadth', 'block.news.breadth', {
            blockId: 'BLK-COM-BREADTH',
            templateId: 'TPL-BREADTH',
            shell: 'sidebar',
            className: 'ifx-com-breadth-sidebar',
            previewType: 'mkt-sidebar',
            productRefs: ['WGT-MKT-002'],
            file: 'news-page.js',
            composition: [comp('breadth', 'Breadth', 'block.template.breadth', 'template')]
          }),
          block('blk-com-trend', 'Community Trending', 'block.news.trend', {
            blockId: 'BLK-COM-TREND',
            templateId: 'TPL-TREEMAP',
            shell: 'none',
            className: 'ifx-com-trending-row',
            previewType: 'com-trend',
            productRefs: ['WGT-COM-001'],
            file: 'news-trending.js',
            composition: [comp('heatmap', 'Story heat', 'block.template.treemap', 'template')]
          }),
          block('blk-com-active', 'Active Members', 'block.news.active', {
            blockId: 'BLK-COM-ACTIVE',
            shell: 'none',
            className: 'ifx-com-active',
            previewType: 'com-active',
            productRefs: ['WGT-COM-002'],
            file: 'news-active-members.js',
            composition: [comp('rows', 'Member rows', 'item.news.author', 'item')]
          }),
          block('blk-com-experts', 'Featured Experts', 'block.news.experts', {
            blockId: 'BLK-COM-EXPERTS',
            shell: 'none',
            className: 'ifx-com-experts',
            previewType: 'com-active',
            productRefs: ['WGT-COM-003'],
            file: 'news-featured-experts.js',
            composition: [comp('rows', 'Expert rows', 'item.news.author', 'item')]
          }),
          block('blk-com-topwl', 'Top Watchlist', 'block.news.topwl', {
            blockId: 'BLK-COM-TOPWL',
            shell: 'none',
            className: 'ifx-com-topwl',
            previewType: 'com-topwl',
            productRefs: ['WGT-COM-004'],
            file: 'news-top-watchlist.js',
            composition: [comp('tabs', 'Period tabs', 'atom.segmented', 'atom'), comp('rows', 'WL rows', 'item.news.topwl-row', 'item')]
          }),
          block('blk-com-feed', 'Community Feed', 'block.news.feed', {
            blockId: 'BLK-COM-FEED',
            templateId: 'TPL-FEED-CARD',
            shell: 'none',
            className: 'ifx-com-feed',
            previewType: 'com-card',
            regions: 'posts*',
            composition: [comp('posts', 'Post cards', 'block.template.feed-card', 'template')],
            file: 'news.css'
          })
        ]
      },
      {
        title: 'Entity & Profile',
        items: [
          block('blk-stk-head', 'Stock Head Panel', 'block.entity.stock-head', {
            blockId: 'BLK-STK-HEAD',
            shell: 'none',
            className: 'ifx-stock-head',
            previewType: 'price-panel',
            regions: 'price · meta · stickers',
            composition: [
              comp('price', 'Price cell', 'item.market.price-cell', 'item'),
              comp('tier', 'Tier chips', 'financial.tier.premium', 'atom')
            ],
            file: 'stock.css'
          }),
          block('blk-stk-flow', 'Entity Flow Detail', 'block.entity.stock-flow', {
            blockId: 'BLK-STK-FLOW',
            shell: 'none',
            className: 'ifx-stock-flow-chart',
            previewType: 'flow-card-split',
            status: 'partial',
            file: 'block-templates.js',
            anatomy: 'tabs nhóm\n└── diverging bars quanh trục 0 (TMP-DIVERGING-BARS · renderDivergingBars)',
            composition: [comp('sections', 'Diverging bars quanh trục 0', 'block.template.diverging-bars', 'template')]
          }),
          block('blk-stk-cmt', 'Stock Comments', 'block.entity.comments', {
            blockId: 'BLK-STK-CMT',
            shell: 'none',
            className: 'ifx-stock-cmt',
            previewType: 'comments',
            composition: [comp('rows', 'Comment rows', 'item.news.author', 'item')],
            file: 'stock-comments-ui.js'
          }),
          block('blk-wat', 'Watchlist Block', 'block.entity.watchlist', {
            blockId: 'BLK-WAT',
            templateId: 'TPL-LIST-ROW',
            shell: 'none',
            className: 'ifx-wl-block',
            previewType: 'watchlist-block',
            regions: 'bar · list',
            anatomy: 'folder bar\n└── stock row wraps*',
            composition: [
              comp('bar', 'Folder pills', 'item.general.filter', 'item'),
              comp('rows', 'Stock rows', 'item.market.stock-row-wrap', 'item')
            ],
            productRefs: ['WGT-WAT-001'],
            file: 'watchlist-block.js'
          }),
          block('blk-alt', 'Alerts List', 'block.entity.alerts', {
            blockId: 'BLK-ALT',
            shell: 'none',
            className: 'ifx-alert-page-list',
            previewType: 'alert-list',
            composition: [comp('items', 'Alert items', 'item.general.alert', 'item')],
            file: 'alerts.css'
          }),
          block('blk-prf', 'Profile Sidebar', 'block.entity.profile', {
            blockId: 'BLK-PRF',
            shell: 'sidebar',
            className: 'ifx-profile-sidebar',
            previewType: 'profile-sidebar',
            productRefs: ['WGT-PRF-001', 'WGT-PRF-002'],
            file: 'profile-sidebar-widgets.js'
          }),
          block('blk-hub', 'Hub Profile Card', 'block.entity.hub', {
            blockId: 'BLK-HUB',
            shell: 'card',
            className: 'ifx-hub-profile-card',
            previewType: 'hub-profile',
            file: 'hub.css'
          }),
          block('blk-pln', 'Plan Compare', 'block.entity.plans', {
            blockId: 'BLK-PLN',
            shell: 'none',
            className: 'ifx-hub-plan-card',
            previewType: 'plan-compare',
            file: 'pricing.css'
          }),
          block('blk-srh', 'Header Search', 'block.chrome.search', {
            blockId: 'BLK-SRH',
            shell: 'none',
            className: 'ifx-hdr-search-dropdown',
            previewType: 'search-dropdown',
            status: 'partial',
            regions: 'input · results',
            file: 'iflux-header-search.js'
          })
        ]
      },
      {
        title: 'Admin Ops',
        items: [
          block('blk-adm-kpi', 'Admin KPI Strip', 'block.admin.kpi', {
            blockId: 'BLK-ADM-KPI',
            shell: 'none',
            surface: 'admin',
            className: 'ix-inline-stat-row',
            previewType: 'admin-kpi',
            composition: [comp('stats', 'Stat cards', 'item.general.stat', 'item')],
            file: 'iflux-admin-ui/components.css'
          }),
          block('blk-adm-table', 'Admin Filter Table', 'block.admin.table', {
            blockId: 'BLK-ADM-TABLE',
            shell: 'none',
            surface: 'admin',
            className: 'ix-filter-bar',
            previewType: 'admin-table',
            regions: 'filter · table',
            anatomy: 'filter bar\n└── data table',
            file: 'patterns/table-list.html'
          }),
          block('blk-adm-feed', 'Admin Feed Health', 'block.admin.feed', {
            blockId: 'BLK-ADM-FEED',
            shell: 'card',
            surface: 'admin',
            className: 'ix-card',
            previewType: 'admin-feed',
            status: 'partial',
            file: 'app/market-ops/feed-health.html'
          })
        ]
      }
    ].map(function (g) {
      g.items = g.items.map(function (b) {
        if (!b.properties || !b.properties.length) b.properties = layoutProps();
        return b;
      });
      return g;
    });
  }

  var PAGE = {
    id: 'blocks',
    file: 'Blocks',
    subtitle: 'UI Composition',
    layer: 'blocks',
    editMode: 'blockLayout',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'blocks::' + groupTitle + '::' + bundle.id + '::' + property.key;
  }

  function pageCounts() {
    var total = 0;
    var templates = 0;
    var instances = 0;
    var shared = 0;
    var user = 0;
    var admin = 0;
    PAGE.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        total += 1;
        if (it.kind === 'template') templates += 1;
        else instances += 1;
        if (it.surface === 'admin') admin += 1;
        else if (it.surface === 'user') user += 1;
        else shared += 1;
      });
    });
    return { total: total, templates: templates, instances: instances, shared: shared, user: user, admin: admin };
  }

  global.IfluxDsBlocksCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts
  };
})(window);
