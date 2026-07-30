/* iFlux DS — Cards (Information Container · head/body/footer · CRD-*) · GĐ1 */
(function (global) {
  'use strict';
  if (global.IfluxDsCardsCatalog) return;

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

  function shellProps(extra) {
    var base = [
      prim('padding-head', 'space-16', '--ifx-inset-widget', 'spacing'),
      prim('padding-body', 'space-16', '--ifx-inset-widget', 'spacing'),
      prim('gap', 'space-12', '--ifx-block-gap', 'spacing'),
      prim('radius', 'radius-lg', '--ix-radius-lg', 'radius'),
      sem('background', 'surface.card', '--ix-bg-card'),
      sem('border-color', 'border.default', '--ix-border')
    ];
    return extra ? base.concat(extra) : base;
  }

  function card(id, name, logicalId, opts) {
    opts = opts || {};
    return {
      id: id,
      name: name,
      logicalId: logicalId,
      cardId: opts.cardId || id.toUpperCase().replace(/-/g, '-'),
      surface: opts.surface || 'user',
      className: opts.className || '',
      previewType: opts.previewType || 'generic',
      regions: opts.regions || 'head · body',
      anatomy: opts.anatomy || '',
      structure: opts.structure || '',
      blockRefs: opts.blockRefs || [],
      productRefs: opts.productRefs || opts.widgetRefs || [],
      status: opts.status || 'ok',
      file: opts.file || 'block-templates.css',
      note: opts.note || '',
      properties: opts.properties || shellProps()
    };
  }

  function buildGroups() {
    return [
      {
        title: 'Shared Shells',
        note: 'CRD-SHELL-* · canonical container · map BLK-* mount',
        items: [
          card('crd-shell-generic', 'Generic Block Card', 'card.shell.generic', {
            cardId: 'CRD-SHELL-GENERIC',
            className: 'ifx-block ifx-block--card',
            previewType: 'shell-generic',
            regions: 'head · body · foot?',
            anatomy: 'head (title · actions?)\n└── body (block mount)',
            structure: 'head\n└── body\n    └── BLK mount (TPL-*)',
            blockRefs: ['BLK-MKT-LIQ', 'BLK-FLW-CTX'],
            file: 'block-templates.js'
          }),
          card('crd-shell-admin', 'Admin Card', 'card.shell.admin', {
            cardId: 'CRD-SHELL-ADMIN',
            surface: 'admin',
            className: 'ix-card',
            previewType: 'shell-admin',
            regions: 'header · body · footer?',
            anatomy: 'ix-card-header\n└── ix-card-body',
            structure: 'header (title · actions?)\n└── body\n    ├── BLK-ADM-KPI\n    ├── BLK-ADM-TABLE\n    └── BLK-ADM-FEED',
            blockRefs: ['BLK-ADM-KPI', 'BLK-ADM-TABLE', 'BLK-ADM-FEED'],
            file: 'iflux-admin-ui/components.css'
          })
        ]
      },
      {
        title: 'Market',
        note: 'Thị trường · heatmap · liquidity · rankings',
        items: [
          card('crd-shell-market', 'Market Card', 'card.market.standard', {
            cardId: 'CRD-SHELL-MARKET',
            className: 'ifx-mkt-card',
            previewType: 'shell-market',
            regions: 'head · body · foot?',
            anatomy: 'ifx-mkt-card__head\n└── ifx-mkt-card__body',
            structure: 'head (title)\n└── body\n    ├── BLK-MKT-HEAT-SECTOR\n    ├── BLK-MKT-HEAT-FAMILY\n    ├── BLK-MKT-HEAT-CHUDE\n    └── BLK-MKT-RANKINGS',
            blockRefs: ['BLK-MKT-HEAT-SECTOR', 'BLK-MKT-HEAT-FAMILY', 'BLK-MKT-HEAT-CHUDE', 'BLK-MKT-RANKINGS'],
            productRefs: ['WGT-MKT-004', 'WGT-MKT-005', 'WGT-MKT-006', 'WGT-TOP-001', 'WGT-TOP-002', 'WGT-TOP-003'],
            file: 'market.css'
          }),
          card('crd-shell-liquidity', 'Liquidity Card', 'card.market.liquidity', {
            cardId: 'CRD-SHELL-LIQUIDITY',
            className: 'ifx-mkt-liq-block',
            previewType: 'shell-liquidity',
            regions: 'head · desc · filters · body',
            anatomy: 'head · session tabs · exchange\n└── area chart',
            structure: 'head (KLGD/GTGD)\n├── filters (session · exchange)\n└── body\n    └── BLK-MKT-LIQ (chart)',
            blockRefs: ['BLK-MKT-LIQ'],
            productRefs: ['WGT-MKT-007', 'WGT-MKT-008'],
            file: 'market-liquidity.js'
          }),
          card('crd-shell-sidebar', 'Market Sidebar Card', 'card.market.sidebar', {
            cardId: 'CRD-SHELL-SIDEBAR',
            className: 'ifx-mkt-sidebar-widget',
            previewType: 'shell-sidebar',
            regions: 'head · body',
            anatomy: 'ifx-block-head\n└── sidebar body mount',
            structure: 'head\n└── body\n    ├── BLK-MKT-OVERVIEW\n    ├── BLK-MKT-BREADTH\n    └── BLK-FLW-CTX',
            blockRefs: ['BLK-MKT-OVERVIEW', 'BLK-MKT-BREADTH', 'BLK-FLW-CTX'],
            productRefs: ['WGT-MKT-001', 'WGT-MKT-002', 'WGT-FLW-CTX'],
            file: 'block-templates.css'
          })
        ]
      },
      {
        title: 'Money Flow',
        note: 'Dòng tiền · net flow · score',
        items: [
          card('crd-shell-flow', 'Flow Card', 'card.flow.standard', {
            cardId: 'CRD-SHELL-FLOW',
            className: 'ifx-flow-card',
            previewType: 'shell-flow',
            regions: 'head · body · foot?',
            anatomy: 'ifx-flow-card__head (title · sub)\n└── ifx-flow-card__body',
            structure: 'head\n└── body\n    ├── BLK-FLW-NET-STOCK\n    ├── BLK-FLW-NET-SECTOR\n    ├── BLK-FLW-NET-HST\n    ├── BLK-FLW-NET-CHUDE\n    └── BLK-FLW-SCORE',
            blockRefs: ['BLK-FLW-NET-STOCK', 'BLK-FLW-NET-SECTOR', 'BLK-FLW-NET-HST', 'BLK-FLW-NET-CHUDE', 'BLK-FLW-SCORE'],
            productRefs: ['WGT-FLW-SUBJ-STOCK', 'WGT-FLW-SUBJ-SECTOR', 'WGT-FLW-SUBJ-HST', 'WGT-FLW-SUBJ-STORY', 'WGT-FLW-STAT_STOCK'],
            file: 'flow.css'
          })
        ]
      },
      {
        title: 'Community',
        note: 'Cộng đồng · overview · feed',
        items: [
          card('crd-shell-com-overview', 'Community Overview Card', 'card.community.overview', {
            cardId: 'CRD-SHELL-COM-OVERVIEW',
            className: 'ifx-com-overview',
            previewType: 'shell-com-overview',
            regions: 'head · body',
            anatomy: 'overview head\n└── index mini cards grid',
            structure: 'head\n└── body\n    ├── BLK-MKT-OVERVIEW\n    └── BLK-COM-OVERVIEW',
            blockRefs: ['BLK-MKT-OVERVIEW', 'BLK-COM-OVERVIEW'],
            productRefs: ['WGT-MKT-001', 'WGT-COM-001'],
            file: 'community.css'
          }),
          card('crd-shell-com-breadth', 'Community Breadth Sidebar', 'card.community.breadth', {
            cardId: 'CRD-SHELL-COM-BREADTH',
            className: 'ifx-com-breadth-sidebar',
            previewType: 'shell-com-breadth',
            regions: 'head · body',
            anatomy: 'ifx-block-head\n└── breadth mount',
            structure: 'head\n└── body\n    ├── BLK-MKT-BREADTH\n    └── BLK-COM-BREADTH',
            blockRefs: ['BLK-MKT-BREADTH', 'BLK-COM-BREADTH'],
            productRefs: ['WGT-MKT-002'],
            file: 'community.css'
          }),
          card('crd-shell-com-post', 'Community Post Card', 'card.community.post', {
            cardId: 'CRD-SHELL-COM-POST',
            className: 'ifx-com-card',
            previewType: 'shell-com-post',
            regions: 'thumb · body · stats',
            anatomy: 'thumb\n├── title · tags\n└── engagement stats',
            structure: 'thumb\n├── title-row (item.community.title-row)\n├── tags\n└── stats (item.community.stats)\n    └── BLK-COM-FEED\n(author / nguồn chỉ trên bài chi tiết)',
            blockRefs: ['BLK-COM-FEED'],
            productRefs: ['WGT-COM-FEED'],
            file: 'community.css'
          })
        ]
      },
      {
        title: 'Dashboard',
        note: 'Dashboard chrome shell · Product instance → Admin Widget Library',
        items: [
          card('crd-shell-widget', 'Dashboard Widget Shell', 'card.dashboard.widget', {
            cardId: 'CRD-SHELL-WIDGET',
            className: 'ifx-widget',
            previewType: 'shell-widget',
            regions: 'header · body · footer',
            anatomy: 'ifx-widget__header (title · actions)\n├── ifx-widget__body\n└── ifx-widget__footer',
            structure: 'header (drag · title · width · share)\n└── body\n    └── Card mount (CRD-*)\n        └── Block (BLK-*)\nfooter (timestamp · link)',
            blockRefs: [],
            productRefs: ['WGT-*'],
            file: 'widget-shell.css',
            note: 'Dashboard Engine chrome · không phải DS Widget layer · map WGT-* trong Admin Library'
          }),
          card('crd-shell-hub', 'Hub Profile Card', 'card.entity.hub', {
            cardId: 'CRD-SHELL-HUB',
            className: 'ifx-hub-profile-card',
            previewType: 'shell-hub',
            regions: 'head · body',
            anatomy: 'profile summary\n└── hub actions',
            structure: 'head\n└── body\n    └── BLK-HUB',
            blockRefs: ['BLK-HUB'],
            file: 'hub.css'
          })
        ]
      }
    ];
  }

  var PAGE = {
    id: 'cards',
    file: 'Cards',
    subtitle: 'Information Container',
    layer: 'cards',
    editMode: 'cardChrome',
    groups: buildGroups()
  };

  function propKey(groupTitle, bundle, property) {
    return 'cards::' + groupTitle + '::' + bundle.id + '::' + property.key;
  }

  function pageCounts() {
    var total = 0;
    var shared = 0;
    var user = 0;
    var admin = 0;
    PAGE.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        total += 1;
        if (it.surface === 'admin') admin += 1;
        else if (it.surface === 'user') user += 1;
        else shared += 1;
      });
    });
    return { total: total, shared: shared, user: user, admin: admin };
  }

  global.IfluxDsCardsCatalog = {
    esc: esc,
    PAGE: PAGE,
    propKey: propKey,
    pageCounts: pageCounts
  };
})(window);
