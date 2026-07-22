/* Widget Registry — thư viện chung: Thị trường · Dòng tiền · Cộng đồng · Cá nhân */
(function (global) {
  'use strict';

  /* Alias cũ STORY → CHUDE (layout/entitlement cũ vẫn resolve) — COM pair retired */
  var WGT_TYPE_ALIASES = {
    'WGT-FLW-SUBJ-STORY': 'WGT-FLW-SUBJ-CHUDE',
    'WGT-FLW-STAT_STORY': 'WGT-FLW-STAT_CHUDE',
    'WGT-FLW-STAT_STORY_IN': 'WGT-FLW-STAT_CHUDE_IN',
    'WGT-FLW-STAT_STORY_OUT': 'WGT-FLW-STAT_CHUDE_OUT',
    'WGT-FLW-EX_TM_STORY_IN': 'WGT-FLW-EX_TM_CHUDE_IN',
    'WGT-FLW-EX_TM_STORY_OUT': 'WGT-FLW-EX_TM_CHUDE_OUT'
  };
  var WGT_TYPE_REVERSE = {};
  Object.keys(WGT_TYPE_ALIASES).forEach(function (k) { WGT_TYPE_REVERSE[WGT_TYPE_ALIASES[k]] = k; });

  function flowScoreCatalog(blockId, title, tier, popularity, width) {
    return {
      type: 'WGT-FLW-' + blockId.toUpperCase().replace(/-/g, '_'),
      renderAs: 'WGT-FLW-SCORE',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: title,
      description: 'Top 10 Mobile Comparison · radar score 0→100',
      tier: tier || 'free',
      kind: 'chart',
      popularity: popularity || 55,
      defaultConfig: { blockId: blockId, width: width || 'full' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    };
  }

  /** Cặp vào/ra gộp 1 widget (radar 20 + list đối chiếu) — SoT cho Thư viện & Nhà của tôi */
  function flowScoreDuoCatalog(entity, title, tier, popularity, width) {
    var entityKey = String(entity || 'stock').toLowerCase();
    return {
      type: 'WGT-FLW-STAT_' + entityKey.toUpperCase(),
      renderAs: 'WGT-FLW-SCORE',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: title,
      description: 'Đối chiếu Top 10 vào / ra · radar 20 điểm · list 2 cột',
      tier: tier || 'free',
      kind: 'chart',
      popularity: popularity || 55,
      defaultConfig: {
        duo: true,
        blockIds: ['stat-' + entityKey + '-out', 'stat-' + entityKey + '-in'],
        width: width || 'full'
      },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    };
  }

  var CATALOG = [
    /* ── Thị trường ── */
    {
      type: 'WGT-MKT-001',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Tổng quan thị trường',
      description: 'VN-Index và chỉ số các sàn HOSE/HNX/UPCOM',
      tier: 'free',
      kind: 'chart',
      popularity: 98,
      defaultConfig: { width: 'half' },
      footerHref: '/thi-truong',
      footerLabel: 'Mở Thị trường',
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-overview/index.js',
      assets: {
        css: [
          '/User_Web/iflux-web-ui/block-templates.css',
          '/User_Web/iflux-web-ui/market.css'
        ]
      }
    },
    {
      type: 'WGT-MKT-002',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Độ rộng thị trường',
      description: 'Mã tăng / giảm / tham chiếu / trần / sàn theo sàn giao dịch',
      tier: 'free',
      kind: 'chart',
      popularity: 92,
      defaultConfig: { width: 'half' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-MKT-RISK',
      renderAs: 'WGT-FLW-MKT-SIDE',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Rủi ro & Tín hiệu',
      description: 'Cảnh báo tự động từ độ rộng · dòng tiền · vùng giá thị trường',
      tier: 'free',
      kind: 'chart',
      popularity: 81,
      defaultConfig: { mode: 'risk', width: 'half' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    {
      type: 'WGT-MKT-003',
      renderAs: 'WGT-MKT-RANK-PERF',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Top biến động',
      description: 'Danh sách mã tăng / giảm mạnh nhất',
      tier: 'free',
      kind: 'list',
      popularity: 88,
      defaultConfig: { width: 'half' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-MKT-004',
      renderAs: 'WGT-MKT-HEAT',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Biểu đồ Ngành',
      description: 'Top 10 ngành có GTGD cao nhất — diện tích = GTGD, màu = hiệu suất phiên.',
      tier: 'free',
      kind: 'chart',
      popularity: 84,
      defaultConfig: { source: 'sector', width: 'third' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-MKT-005',
      renderAs: 'WGT-MKT-HEAT',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Biểu đồ Hệ sinh thái',
      description: 'Top 10 họ cổ phiếu có GTGD cao nhất — diện tích = GTGD, màu = hiệu suất phiên.',
      tier: 'free',
      kind: 'chart',
      popularity: 80,
      defaultConfig: { source: 'family', width: 'third' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-MKT-006',
      renderAs: 'WGT-MKT-HEAT',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Biểu đồ Chủ đề',
      description: 'Top 10 chủ đề có GTGD cao nhất — diện tích = GTGD, màu = hiệu suất phiên.',
      tier: 'free',
      kind: 'chart',
      popularity: 74,
      defaultConfig: { source: 'chu-de', width: 'third' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-MKT-007',
      renderAs: 'WGT-MKT-LIQ',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Khối lượng giao dịch (KLGD)',
      description: 'KLGD hiện tại so với trung bình n phiên cùng thời điểm.',
      tier: 'free',
      kind: 'chart',
      popularity: 78,
      defaultConfig: { metric: 'volume', width: 'half' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-MKT-008',
      renderAs: 'WGT-MKT-LIQ',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Giá trị giao dịch (GTGD)',
      description: 'GTGD hiện tại so với trung bình n phiên cùng thời điểm.',
      tier: 'free',
      kind: 'chart',
      popularity: 76,
      defaultConfig: { metric: 'value', width: 'half' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-TOP-001',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Top 10 Ngành hiệu suất mạnh nhất',
      description: 'Cường độ hiệu suất theo phiên (%)',
      tier: 'free',
      kind: 'chart',
      popularity: 72,
      defaultConfig: { width: 'third' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-TOP-002',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Top 10 Họ CP hiệu suất mạnh nhất',
      description: 'Cường độ hiệu suất theo phiên (%)',
      tier: 'free',
      kind: 'chart',
      popularity: 68,
      defaultConfig: { width: 'third' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-TOP-003',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Top 10 Chủ đề hiệu suất mạnh nhất',
      description: 'Cường độ hiệu suất theo phiên (%)',
      tier: 'free',
      kind: 'chart',
      popularity: 61,
      defaultConfig: { width: 'third' },
      footerHref: '../market/index.html',
      footerLabel: 'Mở Thị trường'
    },
    {
      type: 'WGT-SEC-001',
      group: 'market',
      groupLabel: 'Thị trường',
      title: 'Động lượng ngành',
      description: 'Xếp hạng ngành theo PG',
      tier: 'free',
      kind: 'chart',
      popularity: 70,
      defaultConfig: { width: 'half' },
      footerHref: '../sector/index.html',
      footerLabel: 'Chi tiết ngành'
    },

    /* ── Dòng tiền ── */
    {
      type: 'WGT-FLW-001',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: 'Dòng tiền thông minh (tóm tắt)',
      description: 'Dòng tiền NN · Tự doanh · Cá nhân · Tổng hợp',
      tier: 'premium',
      kind: 'chart',
      popularity: 65,
      defaultConfig: { width: 'half' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    {
      type: 'WGT-FLW-CTX',
      renderAs: 'WGT-FLW-MKT-SIDE',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: 'Ngữ cảnh thị trường',
      description: 'VN-Index · Hỗ trợ / Kháng cự · vùng giá',
      tier: 'free',
      kind: 'chart',
      popularity: 82,
      defaultConfig: { width: 'half' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    {
      type: 'WGT-FLW-SUBJ-STOCK',
      renderAs: 'WGT-FLW-NETTOP',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: 'Thống kê mua/bán ròng theo cổ phiếu',
      description: 'Biểu đồ đối xứng — tab Cá nhân · Tổ chức · Tự doanh · Khối ngoại',
      tier: 'premium',
      kind: 'chart',
      popularity: 73,
      defaultConfig: { width: 'half', scope: 'stock', subject: 'retail' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    {
      type: 'WGT-FLW-SUBJ-SECTOR',
      renderAs: 'WGT-FLW-NETTOP',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: 'Thống kê mua/bán ròng theo ngành',
      description: 'Biểu đồ đối xứng — tab Cá nhân · Tổ chức · Tự doanh · Khối ngoại',
      tier: 'premium',
      kind: 'chart',
      popularity: 71,
      defaultConfig: { width: 'half', scope: 'sector', subject: 'retail' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    {
      type: 'WGT-FLW-SUBJ-HST',
      renderAs: 'WGT-FLW-NETTOP',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: 'Thống kê mua/bán ròng theo hệ sinh thái',
      description: 'Biểu đồ đối xứng — tab Cá nhân · Tổ chức · Tự doanh · Khối ngoại',
      tier: 'premium',
      kind: 'chart',
      popularity: 69,
      defaultConfig: { width: 'half', scope: 'family', subject: 'retail' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    {
      type: 'WGT-FLW-SUBJ-CHUDE',
      renderAs: 'WGT-FLW-NETTOP',
      group: 'flow',
      groupLabel: 'Dòng tiền',
      title: 'Thống kê mua/bán ròng theo chủ đề',
      description: 'Biểu đồ đối xứng — tab Cá nhân · Tổ chức · Tự doanh · Khối ngoại',
      tier: 'premium',
      kind: 'chart',
      popularity: 67,
      defaultConfig: { width: 'half', scope: 'chu-de', subject: 'retail' },
      footerHref: '/dong-tien',
      footerLabel: 'Mở Dòng tiền'
    },
    flowScoreDuoCatalog('stock', 'TOP 10 CỔ PHIẾU — DÒNG TIỀN VÀO / RA MẠNH NHẤT', 'free', 71, 'full'),
    flowScoreDuoCatalog('sector', 'TOP 10 NGÀNH — DÒNG TIỀN VÀO / RA MẠNH NHẤT', 'free', 64, 'full'),
    flowScoreDuoCatalog('hst', 'TOP 10 HỆ SINH THÁI — DÒNG TIỀN VÀO / RA MẠNH NHẤT', 'free', 58, 'full'),
    flowScoreDuoCatalog('chude', 'TOP 10 CHỦ ĐỀ — DÒNG TIỀN VÀO / RA MẠNH NHẤT', 'free', 54, 'full'),
    flowScoreCatalog('ex-tm-in', 'TOP 10 CP dòng tiền TM vào mạnh nhất', 'elite', 48, 'full'),
    flowScoreCatalog('ex-tm-out', 'TOP 10 CP dòng tiền TM ra mạnh nhất', 'elite', 46, 'full'),
    flowScoreCatalog('ex-tm-sector-in', 'TOP 10 Ngành dòng tiền TM vào mạnh nhất', 'elite', 45, 'full'),
    flowScoreCatalog('ex-tm-sector-out', 'TOP 10 Ngành dòng tiền TM ra mạnh nhất', 'elite', 44, 'full'),
    flowScoreCatalog('ex-tm-hst-in', 'TOP 10 HST dòng tiền TM vào mạnh nhất', 'elite', 43, 'full'),
    flowScoreCatalog('ex-tm-hst-out', 'TOP 10 HST dòng tiền TM ra mạnh nhất', 'elite', 42, 'full'),
    flowScoreCatalog('ex-tm-chude-in', 'TOP 10 Chủ đề dòng tiền TM vào mạnh nhất', 'elite', 41, 'full'),
    flowScoreCatalog('ex-tm-chude-out', 'TOP 10 Chủ đề dòng tiền TM ra mạnh nhất', 'elite', 40, 'full'),

    /* ── Cộng đồng ── */
    {
      type: 'WGT-COM-001',
      renderAs: 'WGT-COM-TREND',
      group: 'community',
      groupLabel: 'Cộng đồng',
      title: 'Cổ phiếu được quan tâm hàng đầu',
      description: 'Diện tích = mức độ quan tâm của cộng đồng · màu = hiệu suất phiên.',
      tier: 'free',
      kind: 'chart',
      popularity: 86,
      defaultConfig: { width: 'full' },
      footerHref: '/cong-dong',
      footerLabel: 'Mở Cộng đồng'
    },
    {
      type: 'WGT-COM-CHUDE-TOP',
      renderAs: 'WGT-COM-TREND',
      group: 'community',
      groupLabel: 'Cộng đồng',
      title: 'Chủ đề tích cực hàng đầu',
      description: 'Top Topic/Story theo Interest Score — tabs Ngày|Tuần|Tháng',
      tier: 'free',
      kind: 'list',
      popularity: 84,
      defaultConfig: { width: 'full', storyOnly: true, limit: 5, period: 'week' },
      footerHref: '/cong-dong',
      footerLabel: 'Mở Cộng đồng'
    },
    {
      type: 'WGT-COM-002',
      renderAs: 'WGT-COM-ACTIVE',
      group: 'community',
      groupLabel: 'Cộng đồng',
      title: 'Thành viên tích cực',
      description: 'Xếp hạng Tích cực − Tiêu cực trên bình luận CP',
      tier: 'free',
      kind: 'list',
      popularity: 75,
      defaultConfig: { width: 'half' },
      footerHref: '/cong-dong',
      footerLabel: 'Mở Cộng đồng'
    },
    {
      type: 'WGT-COM-003',
      renderAs: 'WGT-COM-EXPERTS',
      group: 'community',
      groupLabel: 'Cộng đồng',
      title: 'Chuyên gia nổi bật',
      description: 'Top chuyên gia theo tổng lượt thích bài viết',
      tier: 'free',
      kind: 'list',
      popularity: 77,
      defaultConfig: { width: 'half' },
      footerHref: '/cong-dong',
      footerLabel: 'Mở Cộng đồng'
    },
    {
      type: 'WGT-COM-004',
      renderAs: 'WGT-COM-TOPWL',
      group: 'community',
      groupLabel: 'Cộng đồng',
      title: 'Top theo dõi mạnh nhất',
      description: 'Hiệu suất TB watchlist · chép danh mục Elite',
      tier: 'elite',
      kind: 'list',
      popularity: 83,
      defaultConfig: { width: 'half' },
      footerHref: '/cong-dong',
      footerLabel: 'Mở Cộng đồng'
    },

    /* ── Cá nhân ──
       WGT-PRF-001/002 = thành phần trang (sidebar Nhà của tôi), KHÔNG thuộc danh mục widget.
       Giữ META_PAGE để dashboard-engine render sidebar cố định. */
    {
      type: 'WGT-WAT-001',
      group: 'personal',
      groupLabel: 'Cá nhân',
      title: 'Theo dõi',
      description: 'Danh sách mã đang theo dõi',
      tier: 'free',
      kind: 'list',
      popularity: 100,
      defaultConfig: { width: 'full' },
      footerHref: '../watchlist/index.html',
      footerLabel: 'Mở danh sách theo dõi đầy đủ'
    }
  ];

  /** Thành phần trang cố định — không nằm trong CATALOG / Thư viện / picker. */
  var PAGE_SIDEBAR_COMPONENTS = [
    {
      type: 'WGT-PRF-001',
      group: 'personal',
      groupLabel: 'Cá nhân',
      title: 'Thông tin hồ sơ',
      description: 'Avatar, tên, thống kê và chi tiết tài khoản',
      tier: 'free',
      kind: 'profile',
      locked: true,
      scope: 'sidebar',
      pageComponent: true
    },
    {
      type: 'WGT-PRF-002',
      group: 'personal',
      groupLabel: 'Cá nhân',
      title: 'Gói cước & ưu đãi',
      description: 'Gói hiện tại, chu kỳ và nâng cấp',
      tier: 'free',
      kind: 'profile',
      locked: true,
      scope: 'sidebar',
      pageComponent: true
    }
  ];

  /* PRF-001 (Hồ sơ) — Owner: không đặc thù trên Nhà; không còn default inject.
     PRF-002 (Gói cước) — Owner: đặc thù, giữ. PAGE_SIDEBAR_COMPONENTS vẫn có PRF-001 cho Profile. */
  var SIDEBAR_DEFAULT = [
    { widget_type: 'WGT-PRF-002', scope: 'sidebar', column: 'main', position: 0, config: {} }
  ];

  var DASHBOARD_DEFAULT = [
    { widget_type: 'WGT-WAT-001', scope: 'dashboard', column: 'grid', position: 0, config: { width: 'full' } }
  ];

  var DEFAULT_LAYOUT = SIDEBAR_DEFAULT.concat(DASHBOARD_DEFAULT);

  var POPULAR_LAYOUT = SIDEBAR_DEFAULT.concat([
    { widget_type: 'WGT-WAT-001', scope: 'dashboard', column: 'grid', position: 0, config: { width: 'third' } },
    { widget_type: 'WGT-MKT-001', scope: 'dashboard', column: 'grid', position: 1, config: { width: 'twothirds' } },
    { widget_type: 'WGT-MKT-003', scope: 'dashboard', column: 'grid', position: 2, config: { width: 'half' } }
  ]);

  function byType(type) {
    if (WGT_TYPE_ALIASES[type]) type = WGT_TYPE_ALIASES[type];
    else if (WGT_TYPE_REVERSE[type]) { /* canonical CHUDE */ }

    if (!type) return null;
    for (var i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].type === type) return CATALOG[i];
    }
    for (var p = 0; p < PAGE_SIDEBAR_COMPONENTS.length; p++) {
      if (PAGE_SIDEBAR_COMPONENTS[p].type === type) return PAGE_SIDEBAR_COMPONENTS[p];
    }
    /* Fallback membership từ Tầng 4 (qua facade WidgetLibraryCatalog) */
    var cat = global.WidgetLibraryCatalog || global.PlatformLayersWidgets;
    if (!cat) return null;
    var can = (cat.canonicalWidgetId ? cat.canonicalWidgetId(type) : type);
    var libs = cat.allWidgetIdsInLibrary
      ? cat.allWidgetIdsInLibrary()
      : (cat.widgetIds ? cat.widgetIds() : []);
    if (libs.indexOf(can) < 0 && libs.indexOf(type) < 0) return null;
    var specs = cat.WIDGET_SPECS || {};
    var spec = specs[can] || specs[type] || {};
    var meta = global.PlatformLayersWidgets && PlatformLayersWidgets.entitlementMeta
      ? PlatformLayersWidgets.entitlementMeta(can)
      : null;
    if (meta) {
      spec = { title: meta.title, description: meta.description, tier: meta.tier };
    }
    var dep = cat.getPageDeploy
      ? cat.getPageDeploy(can)
      : (cat.widgetDeploy ? cat.widgetDeploy(can) : { pages: ['dashboard'] });
    var pages = dep.pages || ['dashboard'];
    var group = 'market';
    var groupLabel = 'Thị trường';
    if (pages.indexOf('flow') >= 0) { group = 'flow'; groupLabel = 'Dòng tiền'; }
    else if (pages.indexOf('community') >= 0) { group = 'community'; groupLabel = 'Cộng đồng'; }
    else if (/^WGT-WAT/.test(can)) { group = 'personal'; groupLabel = 'Cá nhân'; }
    return {
      type: can,
      group: group,
      groupLabel: groupLabel,
      title: spec.title || can,
      description: spec.description || '',
      tier: spec.tier || 'free',
      kind: 'chart',
      popularity: 50,
      defaultConfig: { width: 'half' },
      fromLayer4: true
    };
  }

  /**
   * Nhóm tiện ích cho picker Nhà của tôi.
   * SoT membership = Core 4 tầng · Tầng 4; registry = render/tier bổ sung.
   * Bỏ qua pageComponent (WGT-PRF-*) — thành phần trang, không chọn trong Tùy chỉnh.
   */
  function grouped() {
    var cat = global.WidgetLibraryCatalog;
    var P = global.PlatformLayersWidgets;
    var order = ['market', 'flow', 'community', 'personal'];
    var map = {};

    function pushItem(w) {
      if (!w || !w.type || w.pageComponent) return;
      if (!map[w.group]) map[w.group] = { label: w.groupLabel || w.group, items: [] };
      if (map[w.group].items.some(function (x) { return x.type === w.type; })) return;
      map[w.group].items.push(w);
    }

    var ids = null;
    if (P && P.widgetIds) ids = P.widgetIds();
    else if (cat && cat.allWidgetIdsInLibrary) ids = cat.allWidgetIdsInLibrary();

    if (ids && ids.length) {
      ids.forEach(function (wid) {
        var meta = byType(wid);
        if (meta) pushItem(meta);
      });
    } else {
      CATALOG.forEach(pushItem);
    }

    var out = {};
    order.forEach(function (key) {
      if (map[key]) out[key] = map[key];
    });
    Object.keys(map).forEach(function (key) {
      if (!out[key]) out[key] = map[key];
    });
    return out;
  }

  function sortedByPopularity() {
    return CATALOG.slice().sort(function (a, b) {
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }

  function dashboardCatalog() {
    return CATALOG.filter(function (w) {
      return w.scope !== 'sidebar' && !w.pageComponent;
    });
  }

  global.IfluxWidgetRegistry = {
    CATALOG: CATALOG,
    PAGE_SIDEBAR_COMPONENTS: PAGE_SIDEBAR_COMPONENTS,
    SIDEBAR_DEFAULT: SIDEBAR_DEFAULT,
    DASHBOARD_DEFAULT: DASHBOARD_DEFAULT,
    DEFAULT_LAYOUT: DEFAULT_LAYOUT,
    POPULAR_LAYOUT: POPULAR_LAYOUT,
    byType: byType,
    resolveType: function (t) { return WGT_TYPE_ALIASES[t] || t; },
    legacyType: function (t) { return WGT_TYPE_REVERSE[t] || t; },
    grouped: grouped,
    sortedByPopularity: sortedByPopularity,
    dashboardCatalog: dashboardCatalog,
    FREE_MAX_WIDGETS: 3
  };
})(window);
