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
   * Region Catalog cho Widget Placement. Key nội bộ phải consumption đúng Host
   * Runtime đang có; Admin chỉ hiển thị nhãn tiếng Việt, không phát minh/remap key.
   * Page nào không có region thì Admin không được đặt Widget vào region đó.
   *   dashboard/home : .ifx-hub-sidebar (trái) + .ifx-hub-main
   *   market/flow    : <aside sidebar> trái + main (grid-12)
   *   account        : sidebar hồ sơ trái + main (tabs)
   *   messages       : .ix-chat-sidebar trái + main
   *   community      : .ifx-com-feed-main (trái) + .ifx-com-feed-sidebar PHẢI (300px)
   *   membership/faq : chỉ main
   */
  /* Tên Host = tên vùng App Shell (vị trí), không dùng nhãn nội dung theo trang. */
  var CUSTOMIZABLE_REGIONS = [
    { key: 'sidebar', label: 'Sidebar trái', icon: 'ti-layout-sidebar' },
    { key: 'main', label: 'Main — Widget grid', icon: 'ti-layout-distribute-horizontal' },
    { key: 'sidebar-right', label: 'Sidebar phải', icon: 'ti-layout-sidebar-right' },
    { key: 'basic', label: 'Tab Thống kê cơ bản', icon: 'ti-chart-bar' },
    { key: 'advanced', label: 'Tab Thống kê nâng cao', icon: 'ti-chart-dots' },
    { key: 'exclusive', label: 'Tab Độc quyền', icon: 'ti-crown' },
    { key: 'trading', label: 'Tab Thống kê', icon: 'ti-chart-bar' }
  ];

  var PAGE_REGIONS = {
    dashboard: ['sidebar', 'main'],
    market: ['sidebar', 'main'],
    community: ['main', 'sidebar-right'],
    // Community collection — cùng App Shell feed: Main (tin lọc) + Sidebar phải (Widget Host riêng)
    'com-topic': ['main', 'sidebar-right'],
    'com-cat': ['main', 'sidebar-right'],
    'com-author': ['main', 'sidebar-right'],
    // Runtime Flow đã có đúng 4 host này. Main là Page Feature, không phải Widget Area.
    flow: ['sidebar', 'basic', 'advanced', 'exclusive'],
    membership: ['main'],
    faq: ['main'],
    account: ['sidebar', 'main'],
    messages: ['sidebar', 'main'],
    // Knowledge Layer — mọi trang Danh sách/Chi tiết đều có Widget Area ở Sidebar trái
    stocks: ['sidebar', 'main'],
    'stock-detail': ['sidebar', 'trading'],
    sectors: ['sidebar', 'main'],
    'sector-detail': ['sidebar', 'trading'],
    ecosystems: ['sidebar', 'main'],
    'eco-detail': ['sidebar', 'trading'],
    'cau-chuyen': ['sidebar', 'main'],
    'cau-chuyen-detail': ['sidebar', 'trading']
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

  var DEFAULT_PAGES = [
    {
      id: 'PAGE-DASH',
      key: 'dashboard',
      title: 'Nhà của tôi',
      slug: 'nha-cua-toi',
      path: '/nha-cua-toi',
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
      slug: 'thi-truong',
      path: '/thi-truong',
      order: 2,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Cấu hình Widget hiển thị tại Sidebar và Main content.',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Sidebar thị trường' },
        { key: 'main', visible: true, layout: 'grid-12' }
      ])
    },
    {
      id: 'PAGE-COM',
      key: 'community',
      title: 'Cộng đồng',
      slug: 'cong-dong',
      path: '/cong-dong',
      order: 3,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Feed bài viết cộng đồng (entry) — Main + Sidebar phải. Không dùng list /community/posts riêng.',
      sections: cloneSections([
        { key: 'main', visible: true, layout: 'grid-12' },
        { key: 'sidebar-right', visible: true, label: 'Sidebar phải' }
      ])
    },
    {
      id: 'PAGE-FLW',
      key: 'flow',
      title: 'Dòng tiền',
      slug: 'dong-tien',
      path: '/dong-tien',
      order: 4,
      navVisible: true,
      status: 'active',
      userCustomizable: false,
      description: 'Cấu hình Widget hiển thị tại Sidebar và Main content.',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Sidebar dòng tiền' },
        { key: 'main', visible: true, layout: 'grid-12' },
        { key: 'basic', visible: true, label: 'Tab Thống kê cơ bản', layout: 'grid-12' },
        { key: 'advanced', visible: true, label: 'Tab Thống kê nâng cao', layout: 'grid-12' },
        { key: 'exclusive', visible: true, label: 'Tab Độc quyền', layout: 'grid-12' }
      ])
    },
    {
      id: 'PAGE-MEM',
      key: 'membership',
      title: 'Membership',
      slug: 'thanh-vien',
      path: '/thanh-vien',
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
      slug: 'hoi-dap',
      path: '/hoi-dap',
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
      slug: 'tai-khoan',
      path: '/tai-khoan',
      order: 7,
      navVisible: false,
      status: 'active',
      userCustomizable: false,
      description: 'Hồ sơ cá nhân ở sidebar (nút Chỉnh sửa hồ sơ). Main content mặc định là Timeline; các tab: Affiliate, Tài khoản thanh toán, Quyền riêng tư, Bảo mật. Vào từ avatar ở header. (Tin nhắn & Theo dõi đã tách sang /tin-nhan; Hoạt động gần đây bỏ vì đã có trong Thông báo.)',
      sections: cloneSections([
        { key: 'sidebar', visible: true, label: 'Hồ sơ cá nhân (Chỉnh sửa hồ sơ)' },
        { key: 'main', visible: true, layout: 'tabs' }
      ])
    },
    {
      id: 'PAGE-MESSAGES',
      key: 'messages',
      title: 'Tin nhắn',
      slug: 'tin-nhan',
      path: '/tin-nhan',
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
   * Entity-centric Architecture — 4 tầng:
   *  - Experience Layer: các Page trải nghiệm (điểm truy cập / entry points)
   *  - Knowledge Layer: entities dùng chung (mỗi entity tồn tại 1 lần, URL top-level)
   *  - Community Layer: feed / bài viết / metadata cộng đồng
   *  - Platform Layer: hạ tầng tài khoản & tiện ích xuyên suốt
   * Page KHÔNG "sở hữu" entity — chỉ điều hướng tới entity (Knowledge Graph).
   */
  var LAYERS = [
    { id: 'experience', label: 'EXPERIENCE LAYER', desc: 'Trải nghiệm người dùng — các Page nghiệp vụ, là điểm truy cập (entry points) tới entity.' },
    { id: 'knowledge', label: 'KNOWLEDGE LAYER', desc: 'Entities dùng chung — mỗi entity tồn tại một lần, URL top-level. Mọi Page (Thị trường, Cộng đồng, Search, AI, Alert…) đều trỏ tới cùng entity.' },
    { id: 'community', label: 'COMMUNITY LAYER', desc: 'Feed, bài viết và metadata cộng đồng — chủ đề, danh mục, tác giả. Không sở hữu Entity Knowledge.' },
    { id: 'platform', label: 'PLATFORM LAYER', desc: 'Hạ tầng: tài khoản, tin nhắn, tìm kiếm, watchlist, cảnh báo… dùng xuyên suốt mọi trải nghiệm.' }
  ];

  var PAGE_LAYER = {
    dashboard: 'experience', market: 'experience', community: 'experience',
    flow: 'experience', membership: 'experience', faq: 'experience',
    account: 'platform', messages: 'platform',
    stocks: 'knowledge', 'stock-detail': 'knowledge',
    sectors: 'knowledge', 'sector-detail': 'knowledge',
    ecosystems: 'knowledge', 'eco-detail': 'knowledge',
    'cau-chuyen': 'knowledge', 'cau-chuyen-detail': 'knowledge',
    'com-topic': 'community', 'com-cat': 'community', 'com-author': 'community'
  };

  /**
   * Knowledge Groups — metadata nhóm entity (header cho tab Sitemap).
   * Các trang Danh sách/Chi tiết của 4 nhóm này là Page composable (KNOWLEDGE_PAGES):
   * đều có Widget Area ở Sidebar trái → xuất hiện trong picker Cài đặt trang.
   */
  var KNOWLEDGE_GROUPS = [
    { group: 'Stocks', icon: 'ti-chart-candle', desc: 'Cổ phiếu — entity trung tâm của toàn hệ thống.' },
    { group: 'Sectors', icon: 'ti-category', desc: 'Ngành — slug tên (vd /nganh/ngan-hang).' },
    { group: 'Ecosystems', icon: 'ti-users-group', desc: 'Hệ sinh thái — slug code (vd /he-sinh-thai/vin).' },
    { group: 'Câu chuyện', icon: 'ti-book-2', desc: 'Câu chuyện thị trường — entity cốt lõi (vd /cau-chuyen/dau-tu-cong).' }
  ];

  function knowledgePage(id, key, title, slug, path, group, dynamic, sidebarLabel, description) {
    var sections = [
      { key: 'sidebar', visible: true, label: sidebarLabel || 'Sidebar tiện ích' },
      { key: 'main', visible: true, layout: 'grid-12' }
    ];
    if (dynamic) {
      sections.push({ key: 'trading', visible: true, label: 'Tab Thống kê', layout: 'grid-12' });
    }
    return {
      id: id, key: key, title: title, slug: slug, path: path,
      order: 20 + KNOWLEDGE_PAGE_ORDER++,
      navVisible: false, status: 'active', userCustomizable: false,
      group: group, dynamic: !!dynamic, description: description || '',
      sections: cloneSections(sections)
    };
  }
  var KNOWLEDGE_PAGE_ORDER = 0;

  /**
   * Knowledge Pages — Page composable Tầng Knowledge. Mỗi trang có Widget Area
   * ở Sidebar trái; Admin đặt Widget (Tầng 4) vào Sidebar hoặc Main như mọi Page khác.
   */
  var KNOWLEDGE_PAGES = [
    knowledgePage('PAGE-STOCKS', 'stocks', 'Danh sách cổ phiếu', 'co-phieu', '/co-phieu', 'Stocks', false, 'Sidebar cổ phiếu', 'Danh sách cổ phiếu — Sidebar: bộ lọc/heatmap tiện ích · Main: bảng cổ phiếu.'),
    knowledgePage('PAGE-STOCK', 'stock-detail', 'Chi tiết cổ phiếu', 'co-phieu', '/co-phieu/:ma', 'Stocks', true, 'Sidebar cổ phiếu', 'Chi tiết cổ phiếu (template) — Sidebar: tiện ích liên quan · Main: chart & tab.'),
    knowledgePage('PAGE-SECTORS', 'sectors', 'Danh sách ngành', 'nganh', '/nganh', 'Sectors', false, 'Sidebar ngành', 'Danh sách ngành — Sidebar: tiện ích · Main: danh sách ngành.'),
    knowledgePage('PAGE-SECTOR', 'sector-detail', 'Chi tiết ngành', 'nganh', '/nganh/:slug', 'Sectors', true, 'Sidebar ngành', 'Chi tiết ngành (template) — Sidebar: tiện ích liên quan · Main: nội dung ngành.'),
    knowledgePage('PAGE-ECOS', 'ecosystems', 'Danh sách hệ sinh thái', 'he-sinh-thai', '/he-sinh-thai', 'Ecosystems', false, 'Sidebar hệ sinh thái', 'Danh sách hệ sinh thái — Sidebar: tiện ích · Main: danh sách.'),
    knowledgePage('PAGE-ECO', 'eco-detail', 'Chi tiết hệ sinh thái', 'he-sinh-thai', '/he-sinh-thai/:slug', 'Ecosystems', true, 'Sidebar hệ sinh thái', 'Chi tiết hệ sinh thái (template) — Sidebar: tiện ích liên quan · Main: nội dung.'),
    knowledgePage('PAGE-CAU-CHUYEN', 'cau-chuyen', 'Danh sách câu chuyện', 'cau-chuyen', '/cau-chuyen', 'Câu chuyện', false, 'Sidebar câu chuyện', 'Danh sách câu chuyện trưởng thành (Knowledge) — Sidebar: widget host · Main: tab câu chuyện + danh sách cổ phiếu liên quan.'),
    knowledgePage('PAGE-CAU-CHUYEN-DETAIL', 'cau-chuyen-detail', 'Chi tiết câu chuyện', 'cau-chuyen', '/cau-chuyen/:slug', 'Câu chuyện', true, 'Sidebar câu chuyện', 'Chi tiết câu chuyện (template) — Sidebar: tiện ích · Main: nội dung entity.')
  ];

  /**
   * Community collection pages — KHÔNG có index /cong-dong/chu-de|danh-muc|tac-gia.
   * Bản thân /:slug đã là trang danh sách: Main = feed tin lọc · Sidebar-right = Widget Host riêng
   * (Admin tự thiết kế danh sách đưa lên sidebar). Khác Câu chuyện Knowledge (/cau-chuyen).
   */
  var COMMUNITY_PAGE_ORDER = 0;
  function communityPage(id, key, title, slug, path, description) {
    return {
      id: id, key: key, title: title, slug: slug, path: path,
      order: 40 + COMMUNITY_PAGE_ORDER++,
      navVisible: false, status: 'active', userCustomizable: false,
      group: 'Community', dynamic: true, description: description || '',
      sections: cloneSections([
        { key: 'main', visible: true, layout: 'grid-12', label: 'Main — Feed tin (lọc theo collection)' },
        { key: 'sidebar-right', visible: true, label: 'Sidebar phải — Widget Host' }
      ])
    };
  }

  var COMMUNITY_PAGES = [
    communityPage(
      'PAGE-COM-TOPIC', 'com-topic', 'Chủ đề Cộng đồng', 'chu-de', '/cong-dong/chu-de/:slug',
      'Trang danh sách theo chủ đề (vd /cong-dong/chu-de/dau-tu-cong). Main: feed tin gắn chủ đề đó · Sidebar phải: Widget Host riêng (danh sách do Admin thiết kế).'
    ),
    communityPage(
      'PAGE-COM-CAT', 'com-cat', 'Danh mục Cộng đồng', 'danh-muc', '/cong-dong/danh-muc/:slug',
      'Trang danh sách theo danh mục. Main: feed tin thuộc danh mục · Sidebar phải: Widget Host riêng.'
    ),
    communityPage(
      'PAGE-COM-AUTHOR', 'com-author', 'Tác giả Cộng đồng', 'tac-gia', '/cong-dong/tac-gia/:username',
      'Trang danh sách theo tác giả. Main: feed tin của tác giả · Sidebar phải: Widget Host riêng.'
    )
  ];

  /** Community utilities — không composable Bố cục (chưa Widget Host riêng). */
  var COMMUNITY_UTILITY_PAGES = [
    { id: 'PAGE-COM-POST', key: 'com-post-detail', title: 'Chi tiết bài viết', path: '/cong-dong/bai-viet/:id', dynamic: true, status: 'active' },
    { id: 'PAGE-COM-WRITE', key: 'com-write', title: 'Viết bài', path: '/cong-dong/viet-bai', status: 'active' }
  ];

  /** Alias tương thích: shape cũ [{group,icon,desc,pages}] cho consumer ngoài. */
  var COMMUNITY_ENTITY_PAGES = COMMUNITY_PAGES.concat(COMMUNITY_UTILITY_PAGES);
  var KNOWLEDGE_ENTITIES = KNOWLEDGE_GROUPS.map(function (g) {
    return {
      group: g.group, icon: g.icon, desc: g.desc,
      pages: KNOWLEDGE_PAGES.filter(function (p) { return p.group === g.group; })
    };
  }).concat([{ group: 'Community', icon: 'ti-users', desc: 'Feed /cong-dong · collection :slug · bài viết · viết bài.', pages: COMMUNITY_ENTITY_PAGES }]);

  /** Trang con (tab) của Page composable (account/messages). */
  var CHILD_PAGES = {
    account: [
      { id: 'PAGE-ACC-TIMELINE', key: 'account-timeline', title: 'Timeline (tab mặc định)', path: '/tai-khoan', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-AFFILIATE', key: 'account-affiliate', title: 'Affiliate', path: '/tai-khoan/affiliate', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-BILLING', key: 'account-billing', title: 'Tài khoản thanh toán', path: '/tai-khoan/billing', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-PRIVACY', key: 'account-privacy', title: 'Quyền riêng tư', path: '/tai-khoan/privacy', navVisible: false, status: 'active' },
      { id: 'PAGE-ACC-SECURITY', key: 'account-security', title: 'Bảo mật', path: '/tai-khoan/security', navVisible: false, status: 'active' }
    ],
    messages: [
      { id: 'PAGE-MSG-INBOX', key: 'messages-inbox', title: 'Tin nhắn (tab mặc định)', path: '/tin-nhan', navVisible: false, status: 'active' },
      { id: 'PAGE-MSG-FOLLOWING', key: 'messages-following', title: 'Theo dõi', path: '/tin-nhan/following', navVisible: false, status: 'active' }
    ]
  };

  /** Platform utilities — tiện ích top-level dùng xuyên suốt. */
  var PLATFORM_PAGES = [
    { id: 'PAGE-SEARCH', key: 'search', title: 'Tìm kiếm', path: '/tim-kiem', status: 'active', desc: 'Search mở tới bất kỳ entity nào.' },
    { id: 'PAGE-WATCHLIST', key: 'watchlist', title: 'Watchlist', path: '/theo-doi', status: 'active' },
    { id: 'PAGE-ALERTS', key: 'alerts', title: 'Cảnh báo', path: '/canh-bao', status: 'active' },
    { id: 'PAGE-SHARE', key: 'share', title: 'Chia sẻ Insight', path: '/chia-se', status: 'active' },
    { id: 'PAGE-PRICING', key: 'pricing', title: 'Gói cước', path: '/goi-cuoc', status: 'active' },
    { id: 'PAGE-AUTH', key: 'auth-login', title: 'Đăng nhập', path: '/dang-nhap', status: 'active' },
    { id: 'PAGE-AUTH-REGISTER', key: 'auth-register', title: 'Đăng ký', path: '/dang-ky', status: 'active' },
    { id: 'PAGE-AUTH-FORGOT', key: 'auth-forgot', title: 'Quên mật khẩu', path: '/quen-mat-khau', status: 'active' },
    { id: 'PAGE-AUTH-OTP', key: 'auth-verify-otp', title: 'Xác minh OTP', path: '/xac-minh-otp', status: 'active' },
    { id: 'PAGE-WEB-ROOT', key: 'web-root', title: 'Trang chủ web (redirect)', path: '/', status: 'active', desc: 'Điểm vào — điều hướng tới Cộng đồng (/cong-dong).' }
  ];

  /** giữ tên export cũ để tương thích. */
  var STANDALONE_PAGES = PLATFORM_PAGES;

  function cloneObject(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function cloneSections(overrides) {
    overrides = overrides || [];
    var byKey = {};
    overrides.forEach(function (o) { byKey[o.key] = o; });
    var seen = {};
    var result = DEFAULT_SECTIONS.map(function (sec) {
      var o = byKey[sec.key] || {};
      var out = {};
      seen[sec.key] = true;
      Object.keys(sec).forEach(function (k) { out[k] = sec[k]; });
      Object.keys(o).forEach(function (k) { out[k] = o[k]; });
      return out;
    });
    /* Runtime có thể có section ngoài App Shell mặc định (vd tab Flow/trading).
       Giữ đúng key Runtime; Region Catalog không được remap hay làm mất section. */
    overrides.forEach(function (o) {
      if (seen[o.key]) return;
      result.push({
        id: 'SEC-' + String(o.key || '').toUpperCase(),
        key: o.key,
        label: o.label || regionLabel(o.key),
        kind: o.kind || 'content',
        visible: o.visible !== false,
        locked: !!o.locked,
        layout: o.layout || null
      });
    });
    return result;
  }

  function widgetCatalog() {
    return global.WidgetLibraryCatalog;
  }

  function allWidgetIds() {
    var l4 = global.PlatformLayersWidgets;
    if (l4 && l4.widgetIds) return l4.widgetIds();
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

  /**
   * Cài đặt trang tiêu thụ trực tiếp Widget Catalog của Tầng 4.
   * Widget không thuộc Page; mọi Widget canonical đều có thể được Admin đặt trên
   * mọi Page, mặc định tắt cho tới khi Admin cấu hình placement.
   */
  function widgetsForPage() {
    return allWidgetIds();
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
    return widgetsForPage(pageKey).map(function (wid, idx) {
      return {
        widgetId: wid,
        scope: 'page',
        section: 'main',
        position: idx,
        span: 12,
        enabled: false,
        locked: false
      };
    });
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
        locked: false,
        hasPlacement: !!layoutSaved[slot.widgetId] && !s.removed,
        added: false,
        config: cloneObject(s.config || slot.config || {}),
        userCanOverride: base.userCustomizable && !slot.locked && (s.userCanOverride != null ? !!s.userCanOverride : true)
      });
    });
    var canonicalWidget = {};
    widgetsForPage(base.key).forEach(function (wid) { canonicalWidget[wid] = true; });
    // Chỉ nhận placement của Widget canonical Tầng 4; Page Component không giả làm Widget.
    Object.keys(layoutSaved).forEach(function (key) {
      if (seenWidget[key]) return;
      if (!canonicalWidget[key]) return;
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
        hasPlacement: true,
        added: true,
        config: cloneObject(s.config || {}),
        userCanOverride: base.userCustomizable && (s.userCanOverride != null ? !!s.userCanOverride : true)
      });
    });
    page.layoutSlots = mergedSlots;

    page.widgetIds = widgetsForPage(base.key);
    // Alias tương thích cho consumer cũ; UI Cài đặt trang chỉ dùng widgetIds.
    page.dedicatedWidgetIds = [];
    page.sharedWidgetIds = page.widgetIds.slice();
    page.layoutSlots = mergedSlots;
    page.layer = PAGE_LAYER[base.key] || 'experience';
    page.group = base.group || null;
    page.dynamic = !!base.dynamic;

    return page;
  }

  function buildModel(storeData) {
    storeData = storeData || {};
    var pagesStore = storeData.pages || {};
    return DEFAULT_PAGES.concat(KNOWLEDGE_PAGES).concat(COMMUNITY_PAGES).map(function (base) {
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
      widgetIds: [],
      dedicatedWidgetIds: [],
      sharedWidgetIds: [],
      childCount: 0,
      level: 0,
      dynamic: !!base.dynamic,
      layer: layer
    };
  }

  /**
   * Flat list cho tab Sitemap, nhóm theo 4 tầng.
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
    KNOWLEDGE_GROUPS.forEach(function (g) {
      rows.push({ groupHead: true, layer: 'knowledge', title: g.group, icon: g.icon, desc: g.desc });
      model.filter(function (p) { return p.layer === 'knowledge' && p.group === g.group; }).forEach(function (page) {
        page.level = 0;
        page.childCount = 0;
        rows.push(page);
      });
    });
    // ── COMMUNITY ──
    rows.push({ layerHeader: true, layer: 'community', label: LAYERS[2].label, desc: LAYERS[2].desc });
    model.filter(function (p) { return p.layer === 'community'; }).forEach(function (page) {
      page.level = 0;
      page.childCount = 0;
      rows.push(page);
    });
    COMMUNITY_UTILITY_PAGES.forEach(function (pg) {
      var r = utilityRow(pg, 'community');
      r.level = 0;
      r.group = 'Community';
      rows.push(r);
    });

    // ── PLATFORM ──
    rows.push({ layerHeader: true, layer: 'platform', label: LAYERS[3].label, desc: LAYERS[3].desc });
    model.filter(function (p) { return p.layer === 'platform'; }).forEach(function (page) {
      pushWithChildren(rows, page, pagesStore);
    });
    PLATFORM_PAGES.forEach(function (base) {
      rows.push(utilityRow(base, 'platform'));
    });

    return rows;
  }

  function countEntityPages() {
    return COMMUNITY_PAGES.length + COMMUNITY_UTILITY_PAGES.length;
  }

  function stats(model) {
    var childTotal = 0;
    Object.keys(CHILD_PAGES).forEach(function (k) { childTotal += CHILD_PAGES[k].length; });
    var experienceCount = model.filter(function (p) { return p.layer === 'experience'; }).length;
    var knowledgeCount = model.filter(function (p) { return p.layer === 'knowledge'; }).length;
    var communityComposable = model.filter(function (p) { return p.layer === 'community'; }).length;
    var communityUtility = COMMUNITY_UTILITY_PAGES.length;
    var communityCount = communityComposable + communityUtility;
    var platformComposable = model.filter(function (p) { return p.layer === 'platform'; }).length;
    var total = model.length + childTotal + communityUtility + PLATFORM_PAGES.length;
    return {
      pages: total,
      experience: experienceCount,
      knowledge: knowledgeCount,
      community: communityCount,
      platform: platformComposable + PLATFORM_PAGES.length + childTotal,
      main: model.length,
      children: childTotal + communityUtility + PLATFORM_PAGES.length,
      active: total,
      widgets: allWidgetIds().length,
      customizable: model.filter(function (p) { return p.userCustomizable; }).length
    };
  }

  function getPageByKey(model, key) {
    for (var i = 0; i < model.length; i++) {
      if (model[i].key === key) return model[i];
    }
    return null;
  }

  function widgetRow(page, widgetId) {
    var copy = resolveWidgetCopy(widgetId);
    var dep = getPageDeploy(widgetId);
    var slot = null;
    (page.layoutSlots || []).forEach(function (s) {
      if (s.widgetId === widgetId) slot = s;
    });
    return {
      widgetId: widgetId,
      kind: 'widget',
      title: copy.title,
      description: copy.description,
      pages: widgetPages(widgetId),
      blocks: dep.blocks || [],
      slot: slot,
      hasPlacement: !!(slot && slot.hasPlacement),
      enabled: slot && slot.enabled != null ? !!slot.enabled : false,
      span: slot ? slot.span : 12,
      position: slot ? slot.position : 0,
      userCanOverride: slot ? slot.userCanOverride : false,
      locked: false
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
    KNOWLEDGE_GROUPS: KNOWLEDGE_GROUPS,
    KNOWLEDGE_PAGES: KNOWLEDGE_PAGES,
    COMMUNITY_PAGES: COMMUNITY_PAGES,
    COMMUNITY_UTILITY_PAGES: COMMUNITY_UTILITY_PAGES,
    COMMUNITY_ENTITY_PAGES: COMMUNITY_ENTITY_PAGES,
    PLATFORM_PAGES: PLATFORM_PAGES,
    CHILD_PAGES: CHILD_PAGES,
    STANDALONE_PAGES: STANDALONE_PAGES,
    stats: stats,
    getPageByKey: getPageByKey,
    allWidgetIds: allWidgetIds,
    widgetsForPage: widgetsForPage,
    widgetRow: widgetRow,
    defaultLayoutSlots: defaultLayoutSlots
  };
})(window);
