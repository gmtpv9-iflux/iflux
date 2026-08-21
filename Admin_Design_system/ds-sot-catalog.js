/* iFlux DS SoT Catalog — data + render helpers (shared by design-sandbox & ds-sot) */
(function (global) {
  'use strict';
  if (global.IfluxDsCatalog) return;
  var STATUS = {
    ok: { label: 'Có', cls: 'ds-status--ok', icon: '✅' },
    partial: { label: 'Một phần', cls: 'ds-status--partial', icon: '⚠️' },
    miss: { label: 'Thiếu', cls: 'ds-status--miss', icon: '❌' }
  };

  var GAPS = [
    'Domain CSS vẫn có hex/rgba — phase 2: migrate market/flow/community',
    'Tooltip · Bottom Nav · Radio/DatePicker form suite',
    'Order Book · Signal Card · Candlestick/Volume chart',
    'Pulse layer CSS class GĐ1 §2',
    '~40+ widgets catalog §14 chưa có renderer (chỉ 11 WGT-* trong registry)',
    'Block wrapper theo trang (ifx-mkt-card, ifx-flow-card…) — chưa 1 shell global',
    'Tree view · Code block · Ticker strip'
  ];

  var DEFER_WIDGETS = [
    'Stock Overview Widget', 'Order Book Widget', 'Portfolio suite',
    'Story Filter Widget', 'Community Stats Widget', 'Admin DAU/MRR widgets',
    'Signal Alert Widget', 'Search Results Widget', 'Insider Activity Widget',
    'Market Heatmap Widget (full)', 'Earnings Calendar Widget'
  ];

  var SECTIONS = [
    {
      id: '01', title: '01 Foundations', spec: '§01 / §15.1',
      items: [
        { name: 'Design Principles', status: 'ok', surface: 'Shared', note: 'Quy ước team — Spec §1.1' },
        { name: 'Color 3 tầng (Primitive/Semantic/Component)', status: 'ok', surface: 'Shared', cls: '--color-* + --ix-*', file: 'primitives/color.css, semantic/theme.css' },
        { name: 'Brand Navy / Orange', status: 'ok', surface: 'Shared', cls: '--ifx-color-navy-*, --ifx-color-orange-*', file: 'primitives/color.css' },
        { name: 'Financial semantic up/down/flow', status: 'ok', surface: 'Shared', cls: '--color-market-*', file: 'semantic/theme.css' },
        { name: 'Typography scale', status: 'ok', surface: 'Shared', cls: '--ifx-text-*, --ifx-font-size-*', file: 'typography.css' },
        { name: 'Spacing / Radius / Shadow', status: 'ok', surface: 'Shared', cls: '--ifx-space-*, --radius-*, --shadow-*', file: 'spacing.css, primitives/' },
        { name: 'Elevation / z-index GĐ1', status: 'ok', surface: 'Shared', cls: '--ifx-z-*', file: 'primitives/z-index.css' },
        { name: 'Grid / Layout', status: 'ok', surface: 'Shared', cls: '.ix-grid-*, .ifx-dash-grid, .ifx-hub-grid', file: 'utilities.css, hub.css' },
        { name: 'Breakpoints', status: 'ok', surface: 'Shared', cls: '--ifx-bp-*', file: 'primitives/layout.css' },
        { name: 'Viewport Preview Registry', status: 'ok', surface: 'Shared', cls: 'IfluxViewportRegistry', file: 'ds-sot-viewport-registry.js', note: 'Preview/QA SoT độc lập CSS breakpoint' },
        { name: 'Iconography (Tabler)', status: 'ok', surface: 'Shared', cls: '.ti' },
        { name: 'Illustration / empty art', status: 'partial', surface: 'User', cls: '.ifx-dash-empty, .ifx-com-empty' },
        { name: 'Motion / Pulse GĐ1', status: 'ok', surface: 'Shared', cls: '--ifx-duration-*, --transition-*', file: 'primitives/motion.css' },
        { name: 'Theme Dark/Light', status: 'ok', surface: 'Shared', cls: '[data-theme]', file: 'semantic/theme.css, iflux-theme.js' }
      ]
    },
    {
      id: '02', title: '02 Design Tokens', spec: '§02 / §15.2',
      items: [
        { name: 'Color brand', status: 'ok', file: 'primitives/color.css', cls: '--ifx-color-navy-*' },
        { name: 'Color surface/text/border', status: 'ok', file: 'semantic/theme.css', cls: '--color-bg-*, --color-text-*' },
        { name: 'Semantic success/warning/danger', status: 'ok', cls: '--color-success, --ix-success' },
        { name: 'Typography tokens', status: 'ok', cls: '--ifx-text-*, --ifx-font-size-*', file: 'typography.css' },
        { name: 'Spacing scale GĐ1', status: 'ok', file: 'spacing.css', cls: '--ifx-space-*' },
        { name: 'Radius', status: 'ok', cls: '--ifx-radius-*, --radius-*', file: 'primitives/radius.css' },
        { name: 'Shadow tokens', status: 'ok', cls: '--shadow-*', file: 'primitives/shadow.css' },
        { name: 'Motion tokens', status: 'ok', cls: '--ifx-duration-*', file: 'primitives/motion.css' },
        { name: 'Z-index scale GĐ1', status: 'ok', cls: '--ifx-z-*', file: 'primitives/z-index.css' },
        { name: 'Theme light tokens', status: 'ok', file: 'semantic/theme.css [data-theme=light]' }
      ]
    },
    {
      id: '03', title: '03 Primitives', spec: '§03 / §15.3',
      items: [
        { name: 'Box', status: 'ok', cls: '.ix-card-body, layout wrappers' },
        { name: 'Text', status: 'ok', cls: 'typography via --ix-font' },
        { name: 'Icon', status: 'ok', cls: '.ti, .ix-menu-icon' },
        { name: 'Image / Avatar', status: 'ok', cls: '.ix-avatar, .ix-avatar-sm' },
        { name: 'Divider', status: 'ok', cls: '.ix-divider' },
        { name: 'Spacer', status: 'ok', cls: '.ix-mb-*, gap utilities' },
        { name: 'Badge (atom)', status: 'ok', cls: '.ix-badge' },
        { name: 'Dot', status: 'ok', cls: '.ix-nav-dot, .ix-avatar-online' },
        { name: 'Spinner / Skeleton', status: 'partial', cls: '.ix-skeleton' }
      ]
    },
    {
      id: '04', title: '04 Basic Components', spec: '§04 / §15.4',
      items: [
        { name: 'Button variants', status: 'ok', cls: '.ix-btn, .ix-btn-primary, .ix-btn-outline, .ix-btn-ghost, .ix-btn-sm', file: 'components.css', preview: 'buttons' },
        { name: 'Link', status: 'ok', cls: '.ix-breadcrumb a' },
        { name: 'Tag / Chip', status: 'ok', cls: '.ix-chip, .ix-chip-*', preview: 'chips' },
        { name: 'Badge', status: 'ok', cls: '.ix-badge, .ix-badge-*', preview: 'badges' },
        { name: 'Avatar', status: 'ok', cls: '.ix-avatar*', preview: 'avatars' },
        { name: 'Card', status: 'ok', cls: '.ix-card, .ix-card-header/body', preview: 'card' },
        { name: 'Panel', status: 'partial', cls: '.ifx-stock-panel' },
        { name: 'Tooltip', status: 'miss' },
        { name: 'Popover', status: 'partial', cls: '.ix-dropdown-menu' },
        { name: 'Modal / Dialog', status: 'ok', cls: '.ix-modal, .ix-modal-overlay', preview: 'modal' },
        { name: 'Drawer / Offcanvas', status: 'ok', cls: '.ix-offcanvas' },
        { name: 'Progress', status: 'ok', cls: '.ix-progress', preview: 'progress' },
        { name: 'Skeleton', status: 'partial', cls: '.ix-skeleton' },
        { name: 'Divider', status: 'ok', cls: '.ix-divider' }
      ]
    },
    {
      id: '05', title: '05 Form Controls', spec: '§05 / §15.5',
      items: [
        { name: 'Input / Textarea / Select', status: 'ok', cls: '.ix-input, .ix-textarea, .ix-select, .ix-label', preview: 'form' },
        { name: 'Checkbox', status: 'ok', cls: '.ix-checkbox' },
        { name: 'Switch', status: 'ok', cls: '.ix-switch' },
        { name: 'File Upload', status: 'ok', cls: '.ix-upload-zone' },
        { name: 'Radio', status: 'partial', note: 'Native radio — chưa class .ix-radio' },
        { name: 'Combobox / Search', status: 'partial', cls: '.ifx-hdr-search, .ix-search', file: 'app-shell.css' },
        { name: 'Date / Color / Slider / Rating / Tags', status: 'miss' }
      ]
    },
    {
      id: '06', title: '06 Navigation', spec: '§06 / §15.6',
      items: [
        { name: 'Sidebar (Admin)', status: 'ok', cls: '.ix-sidebar, .ix-menu', surface: 'Admin', preview: 'nav-admin' },
        { name: 'Top Navbar', status: 'ok', cls: '.ix-navbar, .ifx-topnav', surface: 'Shared', preview: 'nav-top' },
        { name: 'Tab Bar', status: 'ok', cls: '.ix-tabs, .ix-tab, .ix-profile-tab', preview: 'tabs' },
        { name: 'Bottom Nav', status: 'miss', surface: 'User App' },
        { name: 'Breadcrumb', status: 'ok', cls: '.ix-breadcrumb, .ifx-com-breadcrumb' },
        { name: 'Pagination', status: 'ok', cls: '.ix-pagination' },
        { name: 'Stepper / Wizard', status: 'ok', cls: '.ix-wizard, .ix-step', file: 'patterns/wizard.html' },
        { name: 'Dropdown Menu', status: 'ok', cls: '.ix-dropdown, .ix-dropdown-item', preview: 'dropdown' },
        { name: 'Command Palette', status: 'partial', cls: '.ifx-hdr-search', note: '⌘K pattern' }
      ]
    },
    {
      id: '07', title: '07 Feedback', spec: '§07 / §15.7',
      items: [
        { name: 'Toast / Alert', status: 'ok', cls: '.ix-toast, .ix-alert', preview: 'alerts' },
        { name: 'Banner', status: 'ok', cls: '.ifx-degraded-banner, .ifx-pricing-banner', preview: 'banner' },
        { name: 'Empty State', status: 'ok', cls: '.ifx-dash-empty, .ifx-com-empty', preview: 'empty' },
        { name: 'Error State', status: 'partial', cls: '.ifx-auth-hint' },
        { name: 'Loading', status: 'partial', note: 'Placeholder text trong renderers' },
        { name: 'Confirmation Dialog', status: 'ok', cls: '.ix-modal patterns' },
        { name: 'Notification Center', status: 'ok', cls: '.ifx-user-notif-*', file: 'inapp-notifications.js' },
        { name: 'Paywall / Premium Gate', status: 'ok', cls: '.ifx-widget-paywall, .ifx-flow-paywall', preview: 'paywall' }
      ]
    },
    {
      id: '08', title: '08 Data Display', spec: '§08 / §15.8',
      items: [
        { name: 'Table', status: 'ok', cls: '.ix-table', preview: 'table' },
        { name: 'List', status: 'ok', cls: '.ix-list, .ifx-alert-page-list' },
        { name: 'Tree View', status: 'miss' },
        { name: 'Data Grid', status: 'partial', note: 'Table only' },
        { name: 'Key-Value', status: 'partial', cls: '.ix-detail-list, .ifx-mine-grid' },
        { name: 'Stat Card', status: 'ok', cls: '.ix-stat-card', preview: 'stats' },
        { name: 'Accordion', status: 'ok', cls: '.ix-accordion', file: 'pricing.css' },
        { name: 'Timeline', status: 'ok', cls: '.ix-timeline, .ifx-profile-timeline' },
        { name: 'Code Block', status: 'miss' }
      ]
    },
    {
      id: '09', title: '09 Communication', spec: '§09 / §15.9',
      items: [
        { name: 'Comment / Thread', status: 'ok', cls: '.ifx-stock-cmt*', file: 'stock-comments-ui.js' },
        { name: 'Reaction Bar', status: 'partial', note: 'Inline community icons' },
        { name: 'Share / Insight Card', status: 'ok', cls: '.ifx-insight-*', file: 'foundation/share-action.js' },
        { name: 'Rich Text Editor', status: 'partial', file: 'news/write.html' },
        { name: 'Chat', status: 'ok', cls: '.ix-chat-*', file: 'patterns/chat.html' },
        { name: 'Mention / Tag', status: 'partial', file: 'stock-mentions.js' },
        { name: 'User Presence', status: 'partial', cls: '.ix-avatar-online' }
      ]
    },
    {
      id: '10', title: '10 Domain Components (GĐ1)', spec: '§10 / §15.10',
      items: [
        { name: 'MarketHeader', status: 'ok', cls: '.ifx-market-header', file: 'market-components.css', preview: 'market-header' },
        { name: 'IndexCell', status: 'ok', cls: '.ifx-market-header__metric', preview: 'market-header' },
        { name: 'StockRow', status: 'ok', cls: '.ifx-stock-row', file: 'market-components.css', preview: 'stock-row' },
        { name: 'WatchlistRow', status: 'ok', cls: '.ifx-stock-row-wrap', file: 'watchlist.css', preview: 'watchlist-row' },
        { name: 'StickerBadge', status: 'partial', cls: '.ix-chip in badges row', note: 'Chưa class StickerBadge riêng' },
        { name: 'PricePanel', status: 'ok', cls: '.ifx-stock-head, .ifx-stock-panel', file: 'stock.css', preview: 'price-panel' },
        { name: 'SectorCard', status: 'ok', cls: '.ifx-sector-card', file: 'market-components.css', preview: 'sector-card' },
        { name: 'FlowPanel', status: 'ok', cls: '.ifx-flow-panel, .ifx-flow-card', file: 'flow.css' },
        { name: 'FlowBar', status: 'ok', cls: '.ifx-flow-bar', file: 'market-components.css', preview: 'flow-bar' },
        { name: 'AlertRow', status: 'ok', cls: '.ifx-alert-page-item', file: 'alerts.css', preview: 'alert-row' },
        { name: 'DegradedBanner', status: 'ok', cls: '.ifx-degraded-banner', preview: 'banner' },
        { name: 'Order Book Row', status: 'miss' },
        { name: 'Signal Card', status: 'miss' },
        { name: 'Story Tag / Community Card', status: 'partial', cls: '.ifx-com-card', file: 'news.css' },
        { name: 'Onboarding Spotlight', status: 'ok', cls: '.ifx-onboard-center', file: 'onboarding.css', surface: 'User' }
      ]
    },
    {
      id: '11', title: '11 Data Visualization', spec: '§11 / §15.11',
      items: [
        { name: 'Breadth chart', status: 'ok', cls: '.ifx-breadth-*', file: 'breadth-block.js' },
        { name: 'Top 10 bar chart', status: 'ok', cls: '.ifx-top10-*', file: 'top10-market-block.js' },
        { name: 'Heatmap (sector/family/story)', status: 'ok', cls: '.ifx-mkt-card, treemap', file: 'market-heatmap.js', preview: 'mkt-card' },
        { name: 'Liquidity line KLGD/GTGD', status: 'ok', cls: '.ifx-mkt-liq-block', file: 'market-liquidity.js', preview: 'mkt-liq' },
        { name: 'Flow comparison (MCMP)', status: 'ok', cls: '.ifx-mcmp', file: 'flow.css' },
        { name: 'ApexCharts admin', status: 'ok', file: 'admin-charts.js' },
        { name: 'Candlestick chart', status: 'miss' },
        { name: 'Volume chart', status: 'miss' },
        { name: 'Sparkline', status: 'partial' }
      ]
    },
    {
      id: '12', title: '12 Composite Components', spec: '§12 / §15.12',
      items: [
        { name: 'User Profile Hero', status: 'ok', cls: '.ix-profile-hero', file: 'patterns/user-profile.html' },
        { name: 'Plan Card', status: 'ok', cls: '.ix-plan-card, .ifx-hub-plan-card', preview: 'plan-card' },
        { name: 'Widget Shell (dashboard)', status: 'ok', cls: '.ifx-widget', file: 'widget-shell.css', preview: 'widget' },
        { name: 'Page block wrappers', status: 'ok', cls: '.ifx-block, .ifx-mkt-card, .ifx-flow-card', file: 'block-templates.css', note: 'SoT shell → §15 Block Templates' },
        { name: 'Insight Share modal', status: 'ok', file: 'foundation/share-action.css' },
        { name: 'Dashboard toolbar', status: 'ok', cls: '.ifx-dash-toolbar', file: 'widget-shell.css' },
        { name: 'Auth card', status: 'ok', cls: '.ix-auth-card', file: 'auth/login.html' },
        { name: 'Checkout summary', status: 'ok', file: 'account/checkout.html' }
      ]
    },
    {
      id: '13', title: '13 Blocks (Wireframe + Page)', spec: '§13 / §15.13 · map runtime GĐ1',
      items: [
        { name: 'Block structure — Header / Body / Footer', status: 'ok', surface: 'Shared', cls: '.__head, .__body, .__foot', note: 'Pattern lặp trên mọi block; class prefix theo ngữ cảnh trang' },
        { name: 'Dashboard widget shell (layout slot)', status: 'ok', surface: 'User', cls: '.ifx-widget, .ifx-widget__header/body', file: 'widget-shell.css', preview: 'widget', note: 'Chỉ Nhà của tôi — khác wrapper trang Thị trường/Dòng tiền' },
        { name: 'Page section wrapper', status: 'ok', surface: 'User', cls: '.ifx-mkt-section, .ifx-mkt-section__title', file: 'market.css', note: 'Nhóm block theo vùng màn hình' },

        { name: 'BLK-MKT-OVERVIEW — Tổng quan thị trường', status: 'ok', surface: 'User', cls: '.ifx-com-overview, .ifx-mkt-sidebar-widget', file: 'news-market-overview.js', preview: 'com-overview', note: 'Sidebar Thị trường + Cộng đồng · WGT-MKT-001' },
        { name: 'BLK-MKT-BREADTH — Độ rộng thị trường', status: 'ok', surface: 'User', cls: '.ifx-mkt-sidebar-widget, .ifx-breadth-*', file: 'breadth-block.js', preview: 'mkt-sidebar', note: 'WGT-MKT-002' },
        { name: 'BLK-MKT-HEAT — Heatmap Ngành / Họ / Story', status: 'ok', surface: 'User', cls: '.ifx-mkt-card', file: 'market-heatmap.js', preview: 'mkt-card', note: 'WGT-MKT-004/005/006 · treemap squarified' },
        { name: 'BLK-MKT-LIQ — Thanh khoản KLGD / GTGD', status: 'ok', surface: 'User', cls: '.ifx-mkt-liq-block', file: 'market-liquidity.js', preview: 'mkt-liq', note: 'WGT-MKT-007/008 · Apex area 2 line · slot 5 phút cố định' },
        { name: 'BLK-MKT-RANKINGS — Top 10 hiệu suất', status: 'ok', surface: 'User', cls: '.ifx-mkt-card + .ifx-top10-*', file: 'top10-market-block.js', preview: 'mkt-card', note: 'WGT-TOP-001/002/003' },
        { name: 'BLK-MKT-MOVERS — Top biến động (legacy home)', status: 'ok', surface: 'User', cls: '.ifx-movers-tabs, .ifx-stock-row', file: 'market-rankings.js', note: 'Legacy Block B; WGT-MKT-003 hiện dùng TMP-RANK-PERF / TPL-RANK-BAR' },

        { name: 'BLK-FLW-CTX — Ngữ cảnh thị trường (sidebar)', status: 'ok', surface: 'User', cls: '.ifx-flow-sidebar, .ifx-flow-zone-*', file: 'flow-market-sidebar.js', note: 'WGT-FLW-CTX · VN-Index · S/R · vùng giá' },
        { name: 'BLK-FLW-NET-STOCK — Thống kê mua/bán ròng theo cổ phiếu', status: 'ok', surface: 'User', cls: '.ifx-flow-card, .ifx-flow-split-*', file: 'flow-net-top.js', preview: 'flow-card', note: 'WGT-FLW-SUBJ-STOCK · 4 tab chủ thể' },
        { name: 'BLK-FLW-NET-SECTOR — Thống kê mua/bán ròng theo ngành', status: 'ok', surface: 'User', cls: '.ifx-flow-card, .ifx-flow-split-*', file: 'flow-net-top.js', preview: 'flow-card', note: 'WGT-FLW-SUBJ-SECTOR' },
        { name: 'BLK-FLW-NET-HST — Thống kê mua/bán ròng theo hệ sinh thái', status: 'ok', surface: 'User', cls: '.ifx-flow-card, .ifx-flow-split-*', file: 'flow-net-top.js', preview: 'flow-card', note: 'WGT-FLW-SUBJ-HST' },
        { name: 'BLK-FLW-NET-CHUDE — Thống kê mua/bán ròng theo chủ đề', status: 'ok', surface: 'User', cls: '.ifx-flow-card, .ifx-flow-split-*', file: 'flow-net-top.js', preview: 'flow-card', note: 'WGT-FLW-SUBJ-STORY' },
        { name: 'BLK-FLW-SCORE — Top dòng tiền (radar MCMP)', status: 'ok', surface: 'User', cls: '.ifx-flow-card, .ifx-mcmp', file: 'flow-score-top.js', note: 'WGT-FLW-STAT_* / EX_TM_* · 10 block entity' },
        { name: 'BLK-FLW-SMART — Dòng tiền thông minh tóm tắt', status: 'partial', surface: 'User', cls: '.ifx-flow-panel, .ifx-flow-paywall', file: 'widget-renderers.js', note: 'WGT-FLW-001 · premium gate · spec Block D' },

        { name: 'BLK-COM-OVERVIEW — Sidebar tổng quan', status: 'ok', surface: 'User', cls: '.ifx-com-overview--sidebar', file: 'news-page.js', preview: 'com-overview' },
        { name: 'BLK-COM-BREADTH — Độ rộng sidebar', status: 'ok', surface: 'User', cls: '.ifx-com-breadth-sidebar', file: 'news-page.js', preview: 'mkt-sidebar' },
        { name: 'BLK-COM-TREND — Xu hướng cộng đồng', status: 'ok', surface: 'User', cls: '.ifx-com-trend-*', file: 'news-page.js', note: 'WGT-COM-001 · treemap + story chips' },
        { name: 'BLK-COM-ACTIVE — Thành viên tích cực', status: 'ok', surface: 'User', file: 'news-active-members.js', note: 'WGT-COM-002' },
        { name: 'BLK-COM-EXPERTS — Chuyên gia nổi bật', status: 'ok', surface: 'User', file: 'news-featured-experts.js', note: 'WGT-COM-003' },
        { name: 'BLK-COM-TOPWL — Top Watchlist mạnh nhất', status: 'ok', surface: 'User', file: 'news-top-watchlist.js', note: 'WGT-COM-004 · Elite' },
        { name: 'BLK-COM-FEED — Feed bài viết', status: 'ok', surface: 'User', cls: '.ifx-com-card, .ifx-com-feed', file: 'news.css', preview: 'com-card', note: 'Post Card · reaction · share bar' },

        { name: 'BLK-STK-HEAD — Giá & sticker CP', status: 'ok', surface: 'User', cls: '.ifx-stock-head, .ifx-stock-panel', file: 'stock.css', preview: 'price-panel' },
        { name: 'BLK-STK-FLOW — Dòng tiền chi tiết CP/Ngành/Họ/Story', status: 'partial', surface: 'User', file: 'stock-page.js, group-page.js', note: 'Net flow sections · entity pages' },
        { name: 'BLK-STK-CMT — Bình luận & mention', status: 'ok', surface: 'User', cls: '.ifx-stock-cmt*', file: 'stock-comments-ui.js' },

        { name: 'BLK-WAT — Watchlist block', status: 'ok', surface: 'User', cls: '[data-ifx-wl-block]', file: 'watchlist-block.js', preview: 'watchlist-row', note: 'WGT-WAT-001' },
        { name: 'BLK-ALT — Danh sách cảnh báo', status: 'ok', surface: 'User', cls: '.ifx-alert-page-item', file: 'alerts.css', preview: 'alert-row' },
        { name: 'BLK-PRF — Hồ sơ & gói cước sidebar', status: 'ok', surface: 'User', file: 'profile-sidebar-widgets.js', note: 'WGT-PRF-001/002 · hub + home sidebar' },
        { name: 'BLK-HUB — Hub profile card', status: 'ok', surface: 'User', cls: '.ifx-hub-profile-card', file: 'hub.css' },
        { name: 'BLK-PLN — So sánh gói / checkout', status: 'ok', surface: 'User', cls: '.ifx-hub-plan-card, checkout layout', file: 'pricing.css' },
        { name: 'BLK-SRH — Kết quả tìm kiếm header', status: 'partial', surface: 'User', cls: '.ifx-hdr-search-dropdown', file: 'iflux-header-search.js', note: 'Command palette ⌘K — chưa full Search Block spec' },

        { name: 'BLK-ADM-KPI — KPI strip Admin', status: 'ok', surface: 'Admin', cls: '.ix-stat-card, .ix-inline-stat-row', file: 'app/dashboard/' },
        { name: 'BLK-ADM-TABLE — Filter + bảng vận hành', status: 'ok', surface: 'Admin', cls: '.ix-filter-bar, .ix-table', file: 'patterns/table-list.html' },
        { name: 'BLK-ADM-FEED — Feed health / pipeline', status: 'partial', surface: 'Admin', file: 'app/market-ops/feed-health.html', note: 'Stat + chart admin — chưa component hóa riêng' }
      ]
    },
    {
      id: '14', title: '14 Widgets (WGT-*)', spec: '§14 / §15.14 · widget-registry.js',
      items: [
        { name: 'WGT-MKT-001 Tổng quan thị trường', status: 'ok', file: 'news-market-overview.js' },
        { name: 'WGT-MKT-002 Độ rộng thị trường', status: 'ok', file: 'breadth-block.js' },
        { name: 'WGT-MKT-003 Top biến động', status: 'ok', file: 'widget-renderers.js' },
        { name: 'WGT-MKT-004 Heatmap Ngành', status: 'ok', file: 'market-heatmap.js' },
        { name: 'WGT-MKT-005 Heatmap Họ CP', status: 'ok', file: 'market-heatmap.js' },
        { name: 'WGT-MKT-006 Heatmap Chủ đề', status: 'ok', file: 'market-heatmap.js' },
        { name: 'WGT-MKT-007 Thanh khoản KLGD', status: 'ok', file: 'market-liquidity.js', preview: 'mkt-liq' },
        { name: 'WGT-MKT-008 Thanh khoản GTGD', status: 'ok', file: 'market-liquidity.js', preview: 'mkt-liq' },
        { name: 'WGT-TOP-001 Top 10 Ngành', status: 'ok', file: 'top10-market-block.js' },
        { name: 'WGT-TOP-002 Top 10 Họ CP', status: 'ok', file: 'top10-market-block.js' },
        { name: 'WGT-TOP-003 Top 10 Chủ đề', status: 'ok', file: 'top10-market-block.js' },
        { name: 'WGT-SEC-001 Động lượng ngành', status: 'ok', file: 'widget-renderers.js', preview: 'sector-card' },
        { name: 'WGT-FLW-001 Dòng tiền thông minh', status: 'partial', file: 'widget-renderers.js', note: 'Premium gate' },
        { name: 'WGT-FLW-CTX Ngữ cảnh thị trường', status: 'ok', file: 'flow-market-sidebar.js' },
        { name: 'WGT-FLW-SUBJ-STOCK Thống kê mua/bán ròng theo cổ phiếu', status: 'ok', file: 'flow-net-top.js' },
        { name: 'WGT-FLW-SUBJ-SECTOR Thống kê mua/bán ròng theo ngành', status: 'ok', file: 'flow-net-top.js' },
        { name: 'WGT-FLW-SUBJ-HST Thống kê mua/bán ròng theo hệ sinh thái', status: 'ok', file: 'flow-net-top.js' },
        { name: 'WGT-FLW-SUBJ-STORY Thống kê mua/bán ròng theo chủ đề', status: 'ok', file: 'flow-net-top.js' },
        { name: 'WGT-FLW-STAT_* Top dòng tiền vào/ra (8 entity)', status: 'ok', file: 'flow-score-top.js', note: 'CP · Ngành · HST · Story × in/out' },
        { name: 'WGT-FLW-EX_TM_* Dòng tiền TM đột phá (2 live + 6 planned catalog)', status: 'partial', file: 'flow-score-top.js', note: 'Elite · CP in/out có renderer' },
        { name: 'WGT-COM-001 Xu hướng cộng đồng', status: 'ok', file: 'news-page.js' },
        { name: 'WGT-COM-002 Thành viên tích cực', status: 'ok', file: 'news-active-members.js' },
        { name: 'WGT-COM-003 Chuyên gia nổi bật', status: 'ok', file: 'news-featured-experts.js' },
        { name: 'WGT-COM-004 Top Watchlist mạnh nhất', status: 'ok', file: 'news-top-watchlist.js' },
        { name: 'WGT-PRF-001 Thông tin hồ sơ', status: 'ok', file: 'profile-sidebar-widgets.js' },
        { name: 'WGT-PRF-002 Gói cước & ưu đãi', status: 'ok', file: 'profile-sidebar-widgets.js' },
        { name: 'WGT-WAT-001 Watchlist', status: 'ok', file: 'watchlist-block.js', preview: 'watchlist-row' }
      ].concat(DEFER_WIDGETS.map(function (name) {
        return { name: name + ' (catalog defer)', status: 'miss', surface: 'Catalog §14 / Admin library' };
      }))
    },
    {
      id: '15', title: '15 Block Templates (SoT runtime)', spec: '§15.15 · block-templates.js + block-templates.css',
      items: [
        { name: 'TPL-SHELL-CARD — Card shell (ifx-block)', status: 'ok', cls: '.ifx-block, .ifx-block-head > h3', file: 'block-templates.js', preview: 'block-shell-card', note: 'BLK-MKT-HEAT, BLK-FLW-NET-*, BLK-FLW-SCORE' },
        { name: 'TPL-SHELL-SIDEBAR — Sidebar shell', status: 'ok', cls: '.ifx-block--sidebar, .ifx-mkt-sidebar-widget', file: 'block-templates.js', preview: 'block-shell-sidebar', note: 'BLK-MKT-OVERVIEW, BLK-MKT-BREADTH, BLK-COM-*' },
        { name: 'TPL-SHELL-WIDGET — Dashboard host (layout only)', status: 'ok', cls: '.ifx-widget + .ifx-widget__surface', file: 'dashboard-engine.js', preview: 'widget', note: 'UI-001: host chrome-free; surface = TPL-SHELL-CARD fallback, demote khi body có Feature shell' },
        { name: 'TPL-BREADTH — Stat grid + ratio', status: 'ok', cls: '.ifx-breadth-stat, .ifx-breadth-ratio', file: 'block-templates.js', preview: 'tpl-breadth', note: 'IfluxBlockTemplates.renderBreadth()' },
        { name: 'TPL-TREEMAP — Heat / cap tile', status: 'ok', cls: '.ifx-treemap-tile, .ifx-mkt-heat-tile', file: 'block-templates.css', preview: 'tpl-treemap', note: 'Token: --ifx-market-*' },
        { name: 'TPL-RANK-BAR — Top 10 / rank bars', status: 'ok', cls: '.ifx-rank-bar, .ix-top10-market', file: 'block-templates.js', preview: 'tpl-rank-bar', note: 'renderRankBarList() + chart series tokens' },
        { name: 'TPL-FLOW-SPLIT — Net-flow symmetric', status: 'ok', cls: '.ifx-flow-split', file: 'block-templates.js', preview: 'tpl-flow-split', note: 'renderFlowSplitBlock()' },
        { name: 'TPL-DIVERGING-BARS — Cột hai chiều quanh trục 0', status: 'ok', cls: '.ifx-stock-flow-chart', file: 'block-templates.js', preview: 'tpl-flow-split', note: 'renderDivergingBars() — BLK-STK-FLOW (Giao dịch theo chủ thể)' },
        { name: 'TPL-ZONE-POSITION — Vị trí Hỗ trợ | Kháng cự', status: 'ok', cls: '.ifx-zone-pos', file: 'block-templates.js', preview: 'tpl-rank-bar', note: 'renderZonePosition() — thanh vị trí + % theo giai đoạn' },
        { name: 'TPL-INDEX-GRID — Index mini cards', status: 'ok', cls: '.ifx-index-grid, .ifx-com-ex-card', file: 'block-templates.js', preview: 'tpl-index-grid', note: 'renderOverviewShell()' },
        { name: 'TPL-LIST-ROW — Stock row', status: 'ok', cls: '.ifx-list-row, .ifx-stock-row', file: 'block-templates.js', preview: 'stock-row', note: 'renderStockRow() / renderStockRowWrap()' },
        { name: 'TPL-FEED-CARD — Community post', status: 'ok', cls: '.ifx-feed-card, .ifx-com-post', file: 'block-templates.js', preview: 'com-card', note: 'renderFeedPost() / renderFeedPostBody()' }
      ]
    }
  ];

  var PREVIEWS = {
    buttons: '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
      '<button class="ix-btn ix-btn-primary">Primary</button>' +
      '<button class="ix-btn ix-btn-outline">Outline</button>' +
      '<button class="ix-btn ix-btn-ghost ix-btn-sm">Ghost</button>' +
      '<button class="ix-btn ix-btn-danger ix-btn-sm">Danger</button></div>',
    chips: '<span class="ix-chip ix-chip-primary">Premium</span> <span class="ix-chip ix-chip-success">Active</span> <span class="ix-chip ix-chip-warning">Pending</span>',
    badges: '<span class="ix-badge ix-badge-primary">5</span> <span class="ix-badge ix-badge-success">New</span> <span class="ix-badge ix-badge-danger">!</span>',
    avatars: '<span class="ix-avatar ix-avatar-accent">NM</span> <span class="ix-avatar-sm ix-avatar-success">AB</span>',
    card: '<div class="ix-card" style="max-width:320px"><div class="ix-card-header"><div class="ix-card-title">Card title</div></div><div class="ix-card-body" style="font-size:13px;color:var(--ix-text-muted)">Nội dung card mẫu.</div></div>',
    progress: '<div class="ix-progress" style="max-width:240px"><div class="ix-progress-bar" style="width:65%"></div></div>',
    form: '<div class="ix-form-group" style="max-width:280px"><label class="ix-label">Mã CP</label><input class="ix-input" placeholder="HPG" /></div>',
    alerts: '<div class="ix-alert ix-alert-warning" style="margin:0"><i class="ti ti-alert-triangle"></i><div><div class="ix-alert-title">Warning</div><div class="ix-alert-text">Dữ liệu trễ 30s.</div></div></div>',
    banner: '<div class="ifx-degraded-banner is-visible" style="position:relative;margin:0">Chế độ degraded — dữ liệu có thể không realtime.</div>',
    empty: '<div class="ifx-dash-empty" style="padding:20px;text-align:center"><i class="ti ti-layout-grid"></i><p>Chưa có tiện ích nào.</p></div>',
    paywall: '<div class="ifx-flow-paywall" style="position:relative;margin:0;display:flex"><p style="margin:0;font-size:13px"><i class="ti ti-lock"></i> Tính năng Premium.</p><button class="ix-btn ix-btn-primary ix-btn-sm">Nâng cấp</button></div>',
    tabs: '<div class="ix-tabs"><button class="ix-tab active">Tab 1</button><button class="ix-tab">Tab 2</button></div>',
    stats: '<div class="ix-stat-card" style="max-width:200px"><div class="ix-stat-icon accent"><i class="ti ti-chart-line"></i></div><div><div class="ix-stat-label">VN-Index</div><div class="ix-stat-value">1,284</div></div></div>',
    'stock-row': '<a class="ifx-stock-row is-up" href="#" style="max-width:420px">' +
      '<span class="ifx-stock-row__ticker">HPG</span><span class="ifx-stock-row__name">Hòa Phát</span>' +
      '<span class="ifx-stock-row__price">28.50</span><span class="ifx-stock-row__chg">+1.2%</span><span class="ifx-stock-row__vol">12.4M</span></a>',
    'watchlist-row': '<div class="ifx-stock-row-wrap" style="max-width:420px"><a class="ifx-stock-row is-down" href="#">' +
      '<span class="ifx-stock-row__ticker">VCB</span><span class="ifx-stock-row__name">Vietcombank</span>' +
      '<span class="ifx-stock-row__price">92.1</span><span class="ifx-stock-row__chg">-0.4%</span><span class="ifx-stock-row__vol">3.1M</span></a></div>',
    'flow-bar': '<div style="max-width:280px"><div class="ifx-flow-bar"><div class="ifx-flow-bar__buy" style="width:62%"></div><div class="ifx-flow-bar__sell" style="width:38%"></div></div></div>',
    'market-header': '<div class="ifx-market-header" style="max-width:360px;padding:12px;border:1px solid var(--ix-border);border-radius:12px">' +
      '<div class="ifx-market-header__metric"><span class="ifx-market-header__lbl">VN-Index</span>' +
      '<span class="ifx-market-header__val is-up">1,284.5</span><span class="ifx-market-header__chg is-up">+0.8%</span></div></div>',
    'sector-card': '<div class="ifx-sector-card" style="max-width:200px;padding:12px;border:1px solid var(--ix-border);border-radius:12px">' +
      '<div style="font-weight:600;font-size:13px">Ngân hàng</div><div class="is-up" style="font-size:18px;font-weight:700">+2.1%</div></div>',
    'alert-row': '<div class="ifx-alert-page-item" style="max-width:360px;padding:10px;border:1px solid var(--ix-border);border-radius:8px">' +
      '<strong style="font-size:13px">HPG vượt 28.0</strong><div style="font-size:12px;color:var(--ix-text-muted)">Giá ≥ 28.000 · Active</div></div>',
    widget: '<div class="ifx-widget" style="max-width:280px" data-widget-type="WGT-MKT-001">' +
      '<div class="ifx-widget__header"><span class="ifx-widget__title">Tổng quan thị trường</span></div>' +
      '<div class="ifx-widget__body" style="padding:12px;font-size:12px;color:var(--ix-text-muted)">Widget shell preview</div></div>',
    'mkt-card': '<div class="ifx-mkt-card" style="max-width:300px">' +
      '<div class="ifx-mkt-card__head"><div class="ifx-mkt-card__title">Top 10 Ngành</div></div>' +
      '<div class="ifx-mkt-card__body" style="padding:12px;font-size:12px;color:var(--ix-text-muted)">Block body · chart mount</div></div>',
    'mkt-sidebar': '<div class="ifx-mkt-sidebar-widget" style="max-width:280px">' +
      '<div class="ifx-mkt-sidebar-widget__head">Độ rộng thị trường</div>' +
      '<div class="ifx-mkt-sidebar-widget__body" style="padding:10px;font-size:12px;color:var(--ix-text-muted)">Sidebar block body</div></div>',
    'mkt-liq': '<div class="ifx-mkt-liq-block" style="max-width:360px">' +
      '<div class="ifx-mkt-liq-block__head"><div class="ifx-mkt-liq-block__title">Khối lượng giao dịch (KLGD)</div>' +
      '<span class="ix-chip ix-chip-success ifx-mkt-live-chip"><span class="ifx-mkt-live-dot"></span> Real-time</span></div>' +
      '<div class="ifx-mkt-liq-filters"><div class="ix-segmented"><button type="button" class="ix-segment is-active">1 phiên</button><button type="button" class="ix-segment">5 phiên</button></div>' +
      '<select class="ix-input ifx-mkt-liq-exchange"><option>VNINDEX</option></select></div>' +
      '<div class="ifx-mkt-liq-chart" style="height:80px;background:rgba(0,0,0,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ix-text-muted)">Chart mount</div></div>',
    'com-overview': '<div class="ifx-com-overview ifx-com-overview--sidebar" style="max-width:280px;padding:10px;border:1px solid var(--ix-border);border-radius:12px">' +
      '<div class="ifx-com-overview__head"><div class="ifx-com-overview__title">Tổng quan thị trường</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">' +
      '<div class="ifx-com-ex-card" style="padding:8px;border:1px solid var(--ix-border);border-radius:8px"><div style="font-size:10px;color:var(--ix-text-muted)">VN-Index</div><div class="ifx-com-ex-card__val is-up" style="font-weight:700">1,284</div></div>' +
      '<div class="ifx-com-ex-card" style="padding:8px;border:1px solid var(--ix-border);border-radius:8px"><div style="font-size:10px;color:var(--ix-text-muted)">HOSE</div><div class="ifx-com-ex-card__val is-up" style="font-weight:700">1,102</div></div></div></div>',
    'flow-card': '<div class="ifx-flow-card" style="max-width:320px">' +
      '<div class="ifx-flow-card__head"><div class="ifx-flow-card__title">Thống kê mua/bán ròng</div>' +
      '<div class="ifx-flow-card__sub">Biểu đồ đối xứng theo entity</div></div>' +
      '<div class="ifx-flow-card__body" style="padding:12px;font-size:12px;color:var(--ix-text-muted)">Flow block mount</div></div>',
    'com-card': '<article class="ifx-com-card" style="max-width:360px;padding:12px;border:1px solid var(--ix-border);border-radius:12px">' +
      '<p style="font-size:var(--ifx-com-feed-card-title-size,16px);font-weight:600;margin:0 0 8px;line-height:1.4;-webkit-line-clamp:3;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;color:var(--ix-text-primary)">Nhận định ngắn về dòng tiền HPG phiên sáng và thanh khoản ngành thép</p>' +
      '<div class="ifx-com-post__stats" style="font-size:var(--ifx-com-feed-card-stats-size,12px);color:var(--ix-text-muted)"><span><i class="ti ti-heart"></i> 12</span> <span><i class="ti ti-message"></i> 4</span> <span><i class="ti ti-share"></i> 1</span></div></article>',
    'price-panel': '<div class="ifx-stock-head" style="max-width:360px;padding:12px;border:1px solid var(--ix-border);border-radius:12px">' +
      '<div style="font-size:22px;font-weight:700" class="is-up">28.50</div>' +
      '<div style="font-size:12px;color:var(--ix-text-muted)">HPG · Hòa Phát · +1.2%</div></div>',
    'block-shell-card': '<div class="ifx-block ifx-block--card" style="max-width:320px">' +
      '<div class="ifx-block-head"><h3 class="ifx-block__title">Top 10 Ngành</h3></div>' +
      '<div class="ifx-block__body" style="font-size:12px;color:var(--ix-text-muted)">Chart mount · TPL-SHELL-CARD</div></div>',
    'block-shell-sidebar': '<div class="ifx-block ifx-block--sidebar ifx-mkt-sidebar-widget" style="max-width:280px">' +
      '<div class="ifx-block-head">Độ rộng thị trường</div>' +
      '<div class="ifx-block__body" style="font-size:12px;color:var(--ix-text-muted)">TPL-SHELL-SIDEBAR</div></div>',
    'tpl-breadth': '<div style="max-width:320px;padding:8px;border:1px solid var(--ix-border);border-radius:12px">' +
      '<div class="ifx-breadth-visual ifx-breadth-visual--6" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
      '<div class="ifx-breadth-stat is-up"><div class="ifx-breadth-stat__num">312</div><div class="ifx-breadth-stat__label">Mã tăng</div></div>' +
      '<div class="ifx-breadth-stat is-down"><div class="ifx-breadth-stat__num">198</div><div class="ifx-breadth-stat__label">Mã giảm</div></div>' +
      '<div class="ifx-breadth-stat is-ref"><div class="ifx-breadth-stat__num">45</div><div class="ifx-breadth-stat__label">Tham chiếu</div></div></div>' +
      '<div class="ifx-breadth-ratio" style="display:flex;height:6px;margin-top:12px;border-radius:3px;overflow:hidden">' +
      '<div class="ifx-breadth-ratio__up" style="width:61%"></div><div class="ifx-breadth-ratio__down" style="width:39%"></div></div></div>',
    'tpl-treemap': '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<a class="ifx-treemap-tile__link is-up" style="width:72px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700">+2.1%</a>' +
      '<a class="ifx-treemap-tile__link is-down" style="width:72px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700">-1.4%</a>' +
      '<a class="ifx-treemap-tile__link is-ref" style="width:72px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700">0.0%</a></div>',
    'tpl-rank-bar': '<div class="ifx-rank-bar" style="max-width:360px">' +
      '<div class="ifx-rank-bar__row ifx-mkt-rank-row">' +
      '<span class="ifx-rank-bar__idx ifx-mkt-rank-idx">1</span>' +
      '<span class="ifx-rank-bar__name ifx-mkt-rank-name">Ngân hàng</span>' +
      '<div class="ifx-rank-bar__track ifx-mkt-rank-bar-track"><div class="ifx-rank-bar__fill ifx-mkt-rank-bar is-up" style="width:72%"></div></div>' +
      '<span class="ifx-rank-bar__val ifx-mkt-rank-val is-up">+2.41%</span></div></div>',
    'tpl-flow-split': '<div class="ifx-flow-split" style="max-width:400px">' +
      '<div class="ifx-flow-split__row">' +
      '<div class="ifx-flow-split__buy"><div class="ifx-flow-split__bar ifx-flow-split__bar--buy" style="width:65%"><span class="ifx-flow-split__val">12.4M</span></div></div>' +
      '<a class="ifx-flow-split__ticker ifx-flow-split__ticker--buy" href="#">HPG</a>' +
      '<a class="ifx-flow-split__ticker ifx-flow-split__ticker--sell" href="#">VCB</a>' +
      '<div class="ifx-flow-split__sell"><div class="ifx-flow-split__bar ifx-flow-split__bar--sell" style="width:48%"><span class="ifx-flow-split__val">8.1M</span></div></div>' +
      '</div></div>',
    'tpl-index-grid': '<div class="ifx-index-grid ifx-com-ex-grid" style="max-width:280px">' +
      '<div class="ifx-index-card ifx-com-ex-card"><div class="ifx-index-card__name ifx-com-ex-card__name">VN-Index</div>' +
      '<div class="ifx-index-card__val ifx-com-ex-card__val">1,284.5</div>' +
      '<div class="ifx-index-card__chg ifx-com-ex-card__chg is-up">+0.82%</div></div>' +
      '<div class="ifx-index-card ifx-com-ex-card"><div class="ifx-index-card__name ifx-com-ex-card__name">HNX</div>' +
      '<div class="ifx-index-card__val ifx-com-ex-card__val">248.2</div>' +
      '<div class="ifx-index-card__chg ifx-com-ex-card__chg is-down">-0.15%</div></div></div>',
    tokens: null
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function countAll() {
    var c = { ok: 0, partial: 0, miss: 0, total: 0 };
    SECTIONS.forEach(function (sec) {
      sec.items.forEach(function (it) {
        c.total += 1;
        c[it.status] = (c[it.status] || 0) + 1;
      });
    });
    return c;
  }

  function statusBadge(st) {
    var m = STATUS[st] || STATUS.miss;
    return '<span class="ds-status ' + m.cls + '">' + m.icon + ' ' + m.label + '</span>';
  }

  function tokenPreviewHtml() {
    var tokens = [
      ['--ix-accent', 'var(--ix-accent)'], ['--ix-success', 'var(--ix-success)'],
      ['--ix-danger', 'var(--ix-danger)'], ['--ix-warning', 'var(--ix-warning)'],
      ['--iflux-navy', 'var(--iflux-navy, #1B3587)'], ['--iflux-orange', 'var(--iflux-orange, #F26522)'],
      ['--ix-bg-card', 'var(--ix-bg-card)'], ['--ix-border', 'var(--ix-border)']
    ];
    return '<div class="ds-token-grid">' + tokens.map(function (t) {
      return '<div class="ds-token-swatch"><div class="ds-token-swatch__color" style="background:' + t[1] + '"></div><div class="ds-token-swatch__label">' + esc(t[0]) + '</div></div>';
    }).join('') + '</div>';
  }

  function renderItem(it) {
    var prev = '';
    if (it.preview === 'tokens') prev = tokenPreviewHtml();
    else if (it.preview && PREVIEWS[it.preview]) prev = PREVIEWS[it.preview];

    return '<article class="ds-sandbox-item" data-status="' + it.status + '" data-name="' + esc(it.name.toLowerCase()) + '">' +
      '<div class="ds-sandbox-item__head">' +
        statusBadge(it.status) +
        '<div><div class="ds-sandbox-item__name">' + esc(it.name) + '</div>' +
        (it.cls ? '<div class="ds-sandbox-item__code">' + esc(it.cls) + '</div>' : '') +
        '</div>' +
        (it.surface ? '<span class="ds-surface">' + esc(it.surface) + '</span>' : '') +
      '</div>' +
      '<div class="ds-sandbox-item__body">' +
        (it.file ? '<div class="ds-sandbox-item__row"><strong>File:</strong>' + esc(it.file) + '</div>' : '') +
        (it.note ? '<div class="ds-sandbox-item__row"><strong>Ghi chú:</strong>' + esc(it.note) + '</div>' : '') +
        (prev ? '<div class="ds-sandbox-preview">' + prev + '</div>' : '') +
      '</div></article>';
  }

  function sectionCounts(sec) {
    var c = { ok: 0, partial: 0, miss: 0 };
    sec.items.forEach(function (it) { c[it.status] += 1; });
    return c;
  }

  global.IfluxDsCatalog = {
    STATUS: STATUS,
    GAPS: GAPS,
    DEFER_WIDGETS: DEFER_WIDGETS,
    SECTIONS: SECTIONS,
    PREVIEWS: PREVIEWS,
    esc: esc,
    countAll: countAll,
    statusBadge: statusBadge,
    tokenPreviewHtml: tokenPreviewHtml,
    renderItem: renderItem,
    sectionCounts: sectionCounts,
    previewHtml: function (it) {
      if (it.preview === 'tokens') return tokenPreviewHtml();
      if (it.preview && PREVIEWS[it.preview]) return PREVIEWS[it.preview];
      return '';
    }
  };
})(window);
