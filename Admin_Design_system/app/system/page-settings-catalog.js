/**
 * ADM-SYS-011 — Cài đặt Trang (Product Architecture admin)
 * SoT: Page → App Shell → Section → Widget
 */
(function (global) {
  'use strict';

  var WIDTH_SPAN = {
    full: 12,
    twothirds: 8,
    half: 6,
    third: 4
  };

  var SPAN_WIDTH = {
    12: 'full',
    8: 'twothirds',
    6: 'half',
    4: 'third',
    3: 'quarter'
  };

  var DEFAULT_SECTIONS = [
    { id: 'SEC-HEADER', key: 'header', label: 'Header', kind: 'shell', visible: true, locked: true },
    { id: 'SEC-NAV', key: 'nav', label: 'Navigation / Bottom nav', kind: 'shell', visible: true, locked: true },
    { id: 'SEC-SIDEBAR', key: 'sidebar', label: 'Sidebar trái / Vùng phụ', kind: 'region', visible: false, locked: false },
    { id: 'SEC-MAIN', key: 'main', label: 'Main — Widget grid', kind: 'content', visible: true, locked: true, layout: 'grid-12' },
    { id: 'SEC-SIDEBAR-RIGHT', key: 'sidebar-right', label: 'Sidebar phải', kind: 'region', visible: false, locked: false },
    { id: 'SEC-FOOTER', key: 'footer', label: 'Footer', kind: 'shell', visible: false, locked: false }
  ];

  /**
   * Vùng App Shell tùy chỉnh được (Widget) theo từng Page — rà soát cấu trúc
   * thực tế của User Web. Chỉ 3 vùng: sidebar (trái) · main · sidebar-right (phải).
   * Page nào không có vùng nào thì Admin không thêm widget vào vùng đó được.
   *   dashboard/home : .ifx-hub-sidebar (trái) + .ifx-hub-main
   *   market/flow    : <aside sidebar> trái + main (grid-12)
   *   account        : sidebar hồ sơ trái + main (tabs)
   *   messages       : .ix-chat-sidebar trái + main
   *   community      : .ifx-com-feed-main (trái) + .ifx-com-feed-sidebar PHẢI (300px)
   *   membership/faq : chỉ main
   */
  var CUSTOMIZABLE_REGIONS = [
    { key: 'sidebar', label: 'Sidebar trái', icon: 'ti-layout-sidebar' },
    { key: 'main', label: 'Main content', icon: 'ti-layout-distribute-horizontal' },
    { key: 'sidebar-right', label: 'Sidebar phải', icon: 'ti-layout-sidebar-right' }
  ];

  var PAGE_REGIONS = {
    dashboard: ['sidebar', 'main'],
    market: ['sidebar', 'main'],
    community: ['main', 'sidebar-right'],
    flow: ['sidebar', 'main'],
    membership: ['main'],
    faq: ['main'],
    account: ['sidebar', 'main'],
    messages: ['sidebar', 'main']
  };

  function pageRegions(pageKey) {
    return (PAGE_REGIONS[pageKey] || ['main']).slice();
  }

  function hasRegion(pageKey, regionKey) {
    return pageRegions(pageKey).indexOf(regionKey) >= 0;
  }

  function regionLabel(regionKey) {
    for (var i = 0; i < CUSTOMIZABLE_REGIONS.length; i++) {
      if (CUSTOMIZABLE_REGIONS[i].key === regionKey) return CUSTOMIZABLE_REGIONS[i].label;
    }
    return regionKey;
  }

  var PAGE_SIDEBAR_WIDGETS = ['WGT-PRF-001', 'WGT-PRF-002'];

  var DEFAULT_PAGES = [
    {
      id: 'PAGE-DASH',
      key: 'dashboard',
      title: 'Nhà của tôi',
      slug: 'home',
      path: '/home',
      order: 1,
      navVisible: true,
      status: 'active',
      userCustomizable: true,
      description: 'Sidebar: Thông tin hồ sơ, Gói Promotion · Main: Watchlist & bộ công cụ tùy chỉnh.',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Thông tin cá nhân' },
        { key: 'main', visible: true, layout: 'grid-12' }
      ])
    },
    {
      id: 'PAGE-MKT',
      key: 'market',
      title: 'Thị trường',
      slug: 'market',
      path: '/market',
      order: 2,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Widget đặc thù cố định — Sidebar: Tổng quan + Độ rộng · Main: Heatmap Ngành + Họ CP.',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Sidebar thị trường' },
        { key: 'main', visible: true, layout: 'grid-12' }
      ])
    },
    {
      id: 'PAGE-COM',
      key: 'community',
      title: 'Cộng đồng',
      slug: 'community',
      path: '/community',
      order: 3,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Widget đặc thù cố định — Main: Heatmap CP + Chủ đề tích cực (dưới là feed tin) · Sidebar phải: Heatmap Chủ đề + Thành viên tích cực.',
      sections: cloneSections([
        { key: 'main', visible: true, layout: 'grid-12' },
        { key: 'sidebar-right', visible: true, label: 'Sidebar phải' }
      ])
    },
    {
      id: 'PAGE-FLW',
      key: 'flow',
      title: 'Dòng tiền',
      slug: 'flow',
      path: '/flow',
      order: 4,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Widget đặc thù cố định — Sidebar: Top mua/bán ròng CP & Ngành · Main: Thống kê cơ bản, nâng cao, Độc quyền.',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Sidebar dòng tiền' },
        { key: 'main', visible: true, layout: 'grid-12' }
      ])
    },
    {
      id: 'PAGE-MEM',
      key: 'membership',
      title: 'Membership',
      slug: 'membership',
      path: '/membership',
      order: 5,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Affiliate, gói cước, ưu đãi thành viên.',
      sections: cloneSections([
        { key: 'main', visible: true, layout: 'single-column' }
      ])
    },
    {
      id: 'PAGE-FAQ',
      key: 'faq',
      title: 'FAQ',
      slug: 'faq',
      path: '/faq',
      order: 6,
      navVisible: false,
      status: 'active',
      userCustomizable: false,
      description: 'Câu hỏi thường gặp — không dùng widget dashboard.',
      sections: cloneSections([
        { key: 'main', visible: true, layout: 'single-column' }
      ])
    },
    {
      id: 'PAGE-ACCOUNT',
      key: 'account',
      title: 'Trang cá nhân',
      slug: 'account',
      path: '/account',
      order: 7,
      navVisible: false,
      status: 'active',
      userCustomizable: false,
      description: 'Hồ sơ cá nhân ở sidebar (nút Chỉnh sửa hồ sơ). Main content mặc định là Timeline; các tab: Affiliate, Tài khoản thanh toán, Quyền riêng tư, Bảo mật. Vào từ avatar ở header. (Tin nhắn & Theo dõi đã tách sang /messages; Hoạt động gần đây bỏ vì đã có trong Thông báo.)',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Hồ sơ cá nhân (Chỉnh sửa hồ sơ)' },
        { key: 'main', visible: true, layout: 'tabs' }
      ])
    },
    {
      id: 'PAGE-MESSAGES',
      key: 'messages',
      title: 'Tin nhắn',
      slug: 'messages',
      path: '/messages',
      order: 8,
      navVisible: false,
      status: 'active',
      userCustomizable: false,
      description: 'Trang riêng phục vụ Tin nhắn (mặc định) và Theo dõi. Vào từ nút tin nhắn trên hồ sơ hoặc biểu tượng tin nhắn ở header.',
      sections: cloneSections([
        { key: 'main', visible: true, layout: 'tabs' }
      ])
    }
  ];

  /**
   * Entity-centric Architecture — 3 tầng:
   *  - Experience Layer: các Page trải nghiệm (điểm truy cập / entry points)
   *  - Knowledge Layer: entities dùng chung (mỗi entity tồn tại 1 lần, URL top-level)
   *  - Platform Layer: hạ tầng tài khoản & tiện ích xuyên suốt
   * Page KHÔNG "sở hữu" entity — chỉ điều hướng tới entity (Knowledge Graph).
   */
  var LAYERS = [
    { id: 'experience', label: 'EXPERIENCE LAYER', desc: 'Trải nghiệm người dùng — các Page nghiệp vụ, là điểm truy cập (entry points) tới entity.' },
    { id: 'knowledge', label: 'KNOWLEDGE LAYER', desc: 'Entities dùng chung — mỗi entity tồn tại một lần, URL top-level. Mọi Page (Thị trường, Cộng đồng, Search, AI, Alert…) đều trỏ tới cùng entity.' },
    { id: 'platform', label: 'PLATFORM LAYER', desc: 'Hạ tầng: tài khoản, tin nhắn, tìm kiếm, watchlist, cảnh báo… dùng xuyên suốt mọi trải nghiệm.' }
  ];

  var PAGE_LAYER = {
    dashboard: 'experience', market: 'experience', community: 'experience',
    flow: 'experience', membership: 'experience', faq: 'experience',
    account: 'platform', messages: 'platform'
  };

  /**
   * Knowledge entities — URL top-level (không còn nằm dưới /community/*).
   * dynamic:true = trang template (URL có tham số :ticker/:slug/:id/:username).
   * status 'planned' = đã định nghĩa IA, UI chưa dựng.
   */
  var KNOWLEDGE_ENTITIES = [
    { group: 'Stocks', icon: 'ti-chart-candle', desc: 'Cổ phiếu — entity trung tâm của toàn hệ thống.', pages: [
      { id: 'PAGE-STOCKS', key: 'stocks', title: 'Danh sách cổ phiếu', path: '/stocks', status: 'planned' },
      { id: 'PAGE-STOCK', key: 'stock-detail', title: 'Chi tiết cổ phiếu', path: '/stocks/:ticker', dynamic: true, status: 'active' }
    ]},
    { group: 'Sectors', icon: 'ti-category', desc: 'Ngành — slug tên (vd /sectors/ngan-hang).', pages: [
      { id: 'PAGE-SECTORS', key: 'sectors', title: 'Danh sách ngành', path: '/sectors', status: 'planned' },
      { id: 'PAGE-SECTOR', key: 'sector-detail', title: 'Chi tiết ngành', path: '/sectors/:slug', dynamic: true, status: 'active' }
    ]},
    { group: 'Ecosystems', icon: 'ti-users-group', desc: 'Họ cổ phiếu — slug code (vd /ecosystems/vin).', pages: [
      { id: 'PAGE-ECOS', key: 'ecosystems', title: 'Danh sách họ cổ phiếu', path: '/ecosystems', status: 'planned' },
      { id: 'PAGE-ECO', key: 'eco-detail', title: 'Chi tiết họ cổ phiếu', path: '/ecosystems/:slug', dynamic: true, status: 'active' }
    ]},
    { group: 'Chủ đề', icon: 'ti-book-2', desc: 'Chủ đề / narrative thị trường (vd /chu-de/dau-tu-cong).', pages: [
      { id: 'PAGE-CHU-DE', key: 'chu-de', title: 'Danh sách chủ đề', path: '/chu-de', status: 'planned' },
      { id: 'PAGE-CHU-DE-DETAIL', key: 'chu-de-detail', title: 'Chi tiết chủ đề', path: '/chu-de/:slug', dynamic: true, status: 'active' }
    ]},
    { group: 'Community', icon: 'ti-users', desc: 'Bài viết, tác giả — thuộc Cộng đồng. Tag bài: cổ phiếu · chủ đề · ngành · hệ sinh thái.', pages: [
      { id: 'PAGE-COM-POSTS', key: 'com-posts', title: 'Bài viết cộng đồng', path: '/community/posts', status: 'planned' },
      { id: 'PAGE-COM-POST', key: 'com-post-detail', title: 'Chi tiết bài viết', path: '/community/posts/:id', dynamic: true, status: 'planned' },
      { id: 'PAGE-COM-AUTHOR', key: 'com-author', title: 'Trang tác giả', path: '/community/authors/:username', dynamic: true, status: 'planned' },
      { id: 'PAGE-COM-WRITE', key: 'com-write', title: 'Viết bài', path: '/community/write', status: 'active' }
    ]}
  ];

  /** Trang con (tab) của Page composable (account/messages). */
  var CHILD_PAGES = {
    account: [
      { id: 'PAGE-ACC-TIMELINE', key: 'account-timeline', title: 'Timeline (tab mặc định)', path: '/account', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-AFFILIATE', key: 'account-affiliate', title: 'Affiliate', path: '/account/affiliate', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-BILLING', key: 'account-billing', title: 'Tài khoản thanh toán', path: '/account/billing', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-PRIVACY', key: 'account-privacy', title: 'Quyền riêng tư', path: '/account/privacy', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-SECURITY', key: 'account-security', title: 'Bảo mật', path: '/account/security', navVisible: false, status: 'active' }
    ],
    messages: [
      { id: 'PAGE-MSG-INBOX', key: 'messages-inbox', title: 'Tin nhắn (tab mặc định)', path: '/messages', navVisible: false, status: 'active' },
      { id: 'PAGE-MSG-FOLLOWING', key: 'messages-following', title: 'Theo dõi', path: '/messages/following', navVisible: false, status: 'active' }
    ]
  };

  /** Platform utilities — tiện ích top-level dùng xuyên suốt. */
  var PLATFORM_PAGES = [
    { id: 'PAGE-SEARCH', key: 'search', title: 'Tìm kiếm', path: '/search', status: 'active', desc: 'Search mở tới bất kỳ entity nào.' },
    { id: 'PAGE-WATCHLIST', key: 'watchlist', title: 'Watchlist', path: '/watchlist', status: 'active' },
    { id: 'PAGE-ALERTS', key: 'alerts', title: 'Cảnh báo', path: '/alerts', status: 'active' },
    { id: 'PAGE-SHARE', key: 'share', title: 'Chia sẻ Insight', path: '/share', status: 'active' },
    { id: 'PAGE-PRICING', key: 'pricing', title: 'Gói cước', path: '/pricing', status: 'active' },
    { id: 'PAGE-AUTH', key: 'auth-login', title: 'Đăng nhập / Đăng ký', path: '/auth/login', status: 'active' },
    { id: 'PAGE-WEB-ROOT', key: 'web-root', title: 'Trang chủ web (redirect)', path: '/', status: 'active', desc: 'Điểm vào — điều hướng theo trạng thái đăng nhập → Thị trường (vãng lai) / Nhà (đã đăng nhập).' }
  ];

  /** giữ tên export cũ để tương thích. */
  var STANDALONE_PAGES = PLATFORM_PAGES;

  function cloneSections(overrides) {
    overrides = overrides || [];
    var byKey = {};
    overrides.forEach(function (o) { byKey[o.key] = o; });
    return DEFAULT_SECTIONS.map(function (sec) {
      var o = byKey[sec.key] || {};
      var out = {};
      Object.keys(sec).forEach(function (k) { out[k] = sec[k]; });
      Object.keys(o).forEach(function (k) { out[k] = o[k]; });
      return out;
    });
  }

  function widgetCatalog() {
    return global.WidgetLibraryCatalog;
  }

  function allWidgetIds() {
    var cat = widgetCatalog();
    if (cat && cat.allWidgetIdsInLibrary) return cat.allWidgetIdsInLibrary();
    return [];
  }

  function getPageDeploy(widgetId) {
    var cat = widgetCatalog();
    if (cat && cat.getPageDeploy) return cat.getPageDeploy(widgetId);
    return { pages: ['dashboard'], blocks: [] };
  }

  function widgetPages(widgetId) {
    return (getPageDeploy(widgetId).pages || []).slice();
  }

  function isDedicated(widgetId) {
    var pages = widgetPages(widgetId);
    return pages.length === 1;
  }

  function isShared(widgetId) {
    return widgetPages(widgetId).length > 1;
  }

  /**
   * Slot đặc thù cố định theo yêu cầu Product Composition (4 trang chính).
   * Tách khỏi defaultLayoutSlots để tránh đệ quy với dedicated/shared helpers.
   */
  function fixedDedicatedSlots(pageKey) {
    if (pageKey === 'dashboard') {
      return [
        { widgetId: 'WGT-PRF-001', scope: 'page', section: 'sidebar', position: 0, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-PRF-002', scope: 'page', section: 'sidebar', position: 1, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-WAT-001', scope: 'page', section: 'main', position: 0, span: 12, enabled: true, locked: true, userCanOverride: true }
      ];
    }
    if (pageKey === 'market') {
      return [
        { widgetId: 'WGT-MKT-001', scope: 'page', section: 'sidebar', position: 0, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-MKT-002', scope: 'page', section: 'sidebar', position: 1, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-MKT-004', scope: 'page', section: 'main', position: 0, span: 6, enabled: true, locked: true },
        { widgetId: 'WGT-MKT-005', scope: 'page', section: 'main', position: 1, span: 6, enabled: true, locked: true }
      ];
    }
    if (pageKey === 'flow') {
      return [
        { widgetId: 'WGT-FLW-SUBJ-STOCK', scope: 'page', section: 'sidebar', position: 0, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-SUBJ-SECTOR', scope: 'page', section: 'sidebar', position: 1, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-STAT_STOCK', scope: 'page', section: 'main', position: 0, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-STAT_SECTOR', scope: 'page', section: 'main', position: 1, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-STAT_HST', scope: 'page', section: 'main', position: 2, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-STAT_STORY', scope: 'page', section: 'main', position: 3, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-EX_TM_IN', scope: 'page', section: 'main', position: 4, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-EX_TM_SECTOR_IN', scope: 'page', section: 'main', position: 5, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-EX_TM_HST_IN', scope: 'page', section: 'main', position: 6, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-FLW-EX_TM_STORY_IN', scope: 'page', section: 'main', position: 7, span: 12, enabled: true, locked: true }
      ];
    }
    if (pageKey === 'community') {
      return [
        { widgetId: 'WGT-COM-001', scope: 'page', section: 'main', position: 0, span: 6, enabled: true, locked: true },
        { widgetId: 'WGT-COM-CHUDE-TOP', scope: 'page', section: 'main', position: 1, span: 6, enabled: true, locked: true },
        { widgetId: 'WGT-MKT-006', scope: 'page', section: 'sidebar-right', position: 0, span: 12, enabled: true, locked: true },
        { widgetId: 'WGT-COM-002', scope: 'page', section: 'sidebar-right', position: 1, span: 12, enabled: true, locked: true }
      ];
    }
    return null;
  }

  /**
   * Widget đặc thù = slot mặc định locked trên page (SoT Product Composition),
   * không suy từ pages.length===1 (vì nhiều WGT vẫn deploy được lên dashboard khi bật tùy chỉnh).
   */
  function dedicatedWidgetsForPage(pageKey) {
    var fixed = fixedDedicatedSlots(pageKey);
    var ids = [];
    (fixed || []).forEach(function (slot) {
      if (!slot || !slot.widgetId) return;
      if (ids.indexOf(slot.widgetId) < 0) ids.push(slot.widgetId);
    });
    if (pageKey === 'dashboard') {
      PAGE_SIDEBAR_WIDGETS.forEach(function (wid) {
        if (ids.indexOf(wid) < 0) ids.unshift(wid);
      });
    }
    return ids;
  }

  /**
   * Widget có thể được Admin đặt trên bất kỳ Page nào.
   * WGT_DEPLOY.pages chỉ còn là metadata tương thích cũ, không phải điều kiện placement.
   * Khái niệm dedicated/shared vẫn giữ tạm và sẽ được loại ở backlog riêng.
   */
  function sharedWidgetsForPage(pageKey) {
    var dedicated = dedicatedWidgetsForPage(pageKey);
    return allWidgetIds().filter(function (wid) {
      if (dedicated.indexOf(wid) >= 0) return false;
      return true;
    });
  }

  function resolveWidgetCopy(widgetId) {
    var cat = widgetCatalog();
    if (cat && cat.resolveWidgetCopy) return cat.resolveWidgetCopy(widgetId);
    return { title: widgetId, description: '' };
  }

  function widthToSpan(width) {
    return WIDTH_SPAN[width] || 12;
  }

  function spanToWidth(span) {
    return SPAN_WIDTH[span] || 'full';
  }

  function defaultLayoutSlots(pageKey) {
    var fixed = fixedDedicatedSlots(pageKey);
    if (fixed) return fixed.slice();

    var slots = [];
    var pos = 0;
    sharedWidgetsForPage(pageKey).forEach(function (wid) {
      slots.push({
        widgetId: wid,
        scope: 'page',
        section: 'main',
        position: pos++,
        span: 12,
        enabled: false,
        locked: false
      });
    });
    return slots;
  }

  function mergePage(base, saved) {
    saved = saved || {};
    var page = {};
    ['id', 'key', 'title', 'slug', 'path', 'order', 'navVisible', 'status', 'userCustomizable', 'description'].forEach(function (k) {
      page[k] = saved[k] != null ? saved[k] : base[k];
    });

    var secSaved = saved.sections || {};
    page.sections = (base.sections || []).map(function (sec) {
      var s = secSaved[sec.key] || secSaved[sec.id] || {};
      return {
        id: sec.id,
        key: sec.key,
        label: s.label != null ? s.label : sec.label,
        kind: sec.kind,
        visible: s.visible != null ? !!s.visible : !!sec.visible,
        locked: !!sec.locked,
        layout: s.layout != null ? s.layout : sec.layout
      };
    });

    var layoutSaved = saved.layoutSlots || {};
    var defaultSlots = defaultLayoutSlots(base.key);
    var seenWidget = {};
    var mergedSlots = [];
    defaultSlots.forEach(function (slot, idx) {
      var s = layoutSaved[slot.widgetId] || layoutSaved[idx] || {};
      seenWidget[slot.widgetId] = true;
      if (s.removed && !slot.locked) return;
      mergedSlots.push({
        widgetId: slot.widgetId,
        scope: slot.scope,
        section: s.section != null ? s.section : slot.section,
        position: s.position != null ? Number(s.position) : slot.position,
        span: s.span != null ? Number(s.span) : slot.span,
        enabled: s.enabled != null ? !!s.enabled : slot.enabled,
        locked: slot.locked || !!s.locked,
        added: false,
        userCanOverride: base.userCustomizable && !slot.locked && (s.userCanOverride != null ? !!s.userCanOverride : true)
      });
    });
    // Widget do Admin thêm mới (không có trong default) — key phải là WGT-*.
    // Shared/custom mặc định enabled:false (chỉ bật khi Admin tick).
    Object.keys(layoutSaved).forEach(function (key) {
      if (seenWidget[key]) return;
      if (String(key).indexOf('WGT-') !== 0) return;
      var s = layoutSaved[key];
      if (!s || s.removed) return;
      mergedSlots.push({
        widgetId: key,
        scope: 'page',
        section: s.section != null ? s.section : 'main',
        position: s.position != null ? Number(s.position) : 999,
        span: s.span != null ? Number(s.span) : 12,
        enabled: s.enabled != null ? !!s.enabled : false,
        locked: false,
        added: true,
        userCanOverride: base.userCustomizable && (s.userCanOverride != null ? !!s.userCanOverride : true)
      });
    });
    page.layoutSlots = mergedSlots;

    page.dedicatedWidgetIds = dedicatedWidgetsForPage(base.key);
    page.sharedWidgetIds = sharedWidgetsForPage(base.key);
    // Seed shared widgets vào layoutSlots với enabled:false nếu chưa có — để Admin UI + publish phản ánh đúng.
    (page.sharedWidgetIds || []).forEach(function (wid, idx) {
      if (seenWidget[wid]) return;
      var existing = null;
      mergedSlots.forEach(function (s) { if (s.widgetId === wid) existing = s; });
      if (existing) return;
      mergedSlots.push({
        widgetId: wid,
        scope: 'page',
        section: 'main',
        position: 1000 + idx,
        span: 12,
        enabled: false,
        locked: false,
        added: false,
        userCanOverride: !!base.userCustomizable
      });
      seenWidget[wid] = true;
    });
    page.layoutSlots = mergedSlots;
    page.layer = PAGE_LAYER[base.key] || 'experience';

    return page;
  }

  function buildModel(storeData) {
    storeData = storeData || {};
    var pagesStore = storeData.pages || {};
    return DEFAULT_PAGES.map(function (base) {
      return mergePage(base, pagesStore[base.key] || pagesStore[base.id]);
    }).sort(function (a, b) { return a.order - b.order; });
  }

  function mergeChild(parentKey, base, saved) {
    saved = saved || {};
    return {
      id: base.id,
      key: base.key,
      title: saved.title != null ? saved.title : base.title,
      slug: base.slug || base.key,
      path: base.path,
      parentKey: parentKey,
      dynamic: !!base.dynamic,
      navVisible: saved.navVisible != null ? !!saved.navVisible : !!base.navVisible,
      status: saved.status != null ? saved.status : base.status,
      isChild: true
    };
  }

  function pushWithChildren(rows, page, pagesStore) {
    var kids = (CHILD_PAGES[page.key] || []).map(function (c) {
      return mergeChild(page.key, c, pagesStore[c.key] || pagesStore[c.id]);
    });
    page.childCount = kids.length;
    page.level = 0;
    rows.push(page);
    kids.forEach(function (kid) {
      kid.level = 1;
      kid.layer = page.layer;
      rows.push(kid);
    });
  }

  function utilityRow(base, layer) {
    return {
      id: base.id,
      key: base.key,
      title: base.title,
      slug: base.slug || base.key,
      path: base.path,
      navVisible: false,
      status: base.status || 'active',
      userCustomizable: false,
      description: base.desc || '',
      dedicatedWidgetIds: [],
      sharedWidgetIds: [],
      childCount: 0,
      level: 0,
      dynamic: !!base.dynamic,
      layer: layer
    };
  }

  /**
   * Flat list cho tab Sitemap, nhóm theo 3 tầng.
   * Row markers: layerHeader (đầu tầng), groupHead (nhóm entity trong Knowledge).
   */
  function buildSitemap(storeData) {
    storeData = storeData || {};
    var pagesStore = storeData.pages || {};
    var model = buildModel(storeData);
    var rows = [];

    // ── EXPERIENCE ──
    rows.push({ layerHeader: true, layer: 'experience', label: LAYERS[0].label, desc: LAYERS[0].desc });
    model.filter(function (p) { return p.layer === 'experience'; }).forEach(function (page) {
      pushWithChildren(rows, page, pagesStore);
    });

    // ── KNOWLEDGE ──
    rows.push({ layerHeader: true, layer: 'knowledge', label: LAYERS[1].label, desc: LAYERS[1].desc });
    KNOWLEDGE_ENTITIES.forEach(function (ent) {
      rows.push({ groupHead: true, layer: 'knowledge', title: ent.group, icon: ent.icon, desc: ent.desc });
      ent.pages.forEach(function (pg) {
        var r = utilityRow(pg, 'knowledge');
        r.level = 1;
        r.group = ent.group;
        rows.push(r);
      });
    });

    // ── PLATFORM ──
    rows.push({ layerHeader: true, layer: 'platform', label: LAYERS[2].label, desc: LAYERS[2].desc });
    model.filter(function (p) { return p.layer === 'platform'; }).forEach(function (page) {
      pushWithChildren(rows, page, pagesStore);
    });
    PLATFORM_PAGES.forEach(function (base) {
      rows.push(utilityRow(base, 'platform'));
    });

    return rows;
  }

  function countEntityPages() {
    var n = 0;
    KNOWLEDGE_ENTITIES.forEach(function (e) { n += e.pages.length; });
    return n;
  }

  function stats(model) {
    var dedicated = 0;
    var shared = 0;
    allWidgetIds().forEach(function (wid) {
      if (isDedicated(wid)) dedicated += 1;
      else if (isShared(wid)) shared += 1;
    });
    var childTotal = 0;
    Object.keys(CHILD_PAGES).forEach(function (k) { childTotal += CHILD_PAGES[k].length; });
    var experienceCount = model.filter(function (p) { return p.layer === 'experience'; }).length;
    var platformComposable = model.filter(function (p) { return p.layer === 'platform'; }).length;
    var entityCount = countEntityPages();
    var total = model.length + childTotal + entityCount + PLATFORM_PAGES.length;
    return {
      pages: total,
      experience: experienceCount,
      knowledge: entityCount,
      platform: platformComposable + PLATFORM_PAGES.length + childTotal,
      main: model.length,
      children: childTotal + entityCount + PLATFORM_PAGES.length,
      active: total,
      dedicated: dedicated,
      shared: shared,
      customizable: model.filter(function (p) { return p.userCustomizable; }).length
    };
  }

  function getPageByKey(model, key) {
    for (var i = 0; i < model.length; i++) {
      if (model[i].key === key) return model[i];
    }
    return null;
  }

  function widgetRow(page, widgetId, kind) {
    var copy = resolveWidgetCopy(widgetId);
    var dep = getPageDeploy(widgetId);
    var slot = null;
    (page.layoutSlots || []).forEach(function (s) {
      if (s.widgetId === widgetId) slot = s;
    });
    // Shared / Widget tùy chỉnh: mặc định TẮT nếu chưa có slot hoặc chưa set enabled.
    var defaultEnabled = kind === 'dedicated';
    return {
      widgetId: widgetId,
      kind: kind,
      title: copy.title,
      description: copy.description,
      pages: widgetPages(widgetId),
      blocks: dep.blocks || [],
      slot: slot,
      enabled: slot && slot.enabled != null ? !!slot.enabled : defaultEnabled,
      span: slot ? slot.span : 12,
      position: slot ? slot.position : 0,
      userCanOverride: slot ? slot.userCanOverride : false,
      locked: slot ? slot.locked : kind === 'dedicated'
    };
  }

  global.PageSettingsCatalog = {
    DEFAULT_PAGES: DEFAULT_PAGES,
    WIDTH_SPAN: WIDTH_SPAN,
    SPAN_WIDTH: SPAN_WIDTH,
    CUSTOMIZABLE_REGIONS: CUSTOMIZABLE_REGIONS,
    PAGE_REGIONS: PAGE_REGIONS,
    pageRegions: pageRegions,
    hasRegion: hasRegion,
    regionLabel: regionLabel,
    widthToSpan: widthToSpan,
    spanToWidth: spanToWidth,
    buildModel: buildModel,
    buildSitemap: buildSitemap,
    LAYERS: LAYERS,
    KNOWLEDGE_ENTITIES: KNOWLEDGE_ENTITIES,
    PLATFORM_PAGES: PLATFORM_PAGES,
    CHILD_PAGES: CHILD_PAGES,
    STANDALONE_PAGES: STANDALONE_PAGES,
    stats: stats,
    getPageByKey: getPageByKey,
    dedicatedWidgetsForPage: dedicatedWidgetsForPage,
    sharedWidgetsForPage: sharedWidgetsForPage,
    widgetRow: widgetRow,
    isDedicated: isDedicated,
    isShared: isShared,
    defaultLayoutSlots: defaultLayoutSlots
  };
})(window);
