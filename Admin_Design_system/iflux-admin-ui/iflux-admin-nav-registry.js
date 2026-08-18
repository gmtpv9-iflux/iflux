/* iFlux Admin — Navigation Registry (thuần dữ liệu). Không resolve href.
 * SoT NHÃN DUY NHẤT cho Module / Menu / Submenu trên toàn Admin.
 * CẤM tạo nhãn thứ 2 (catalog, hardcode, bản sao). Thêm menu mới → chỉ thêm nhãn tại đây. */
(function (global) {
  'use strict';
  if (global.IfluxAdminNavRegistry) return;
  var sidebar = [
    /* 1. Tổng quan */
    { type: 'item', key: "dashboard-index", routeKey: "dashboard-index", label: "Tổng quan", icon: "ti-smart-home", urlSegment: "overview" },

    /* 2. Quản lý cộng đồng — không group urlSegment (mixed community / topics) */
    { type: 'group', label: "Quản lý cộng đồng" },
    {
      type: 'parent',
      key: "community-overview",
      routeKey: "community-content-dashboard",
      label: "Quản lý nội dung",
      icon: "ti-layout-dashboard",
      urlSegment: "community",
      children: [
        { type: 'item', key: "community-content-dashboard", routeKey: "community-content-dashboard", label: "Tổng quan", icon: "ti-layout-dashboard", urlSegment: "overview" },
        { type: 'item', key: "community-content-index", routeKey: "community-content-index", label: "Danh sách Bài viết", icon: "ti-article", urlSegment: "articles" },
        { type: 'item', key: "community-categories", routeKey: "community-categories", label: "Danh sách Danh mục", icon: "ti-category", urlSegment: "categories" },
        { type: 'item', key: "community-chu-de-list", routeKey: "community-chu-de-list", label: "Danh sách Chủ đề", icon: "ti-book-2", urlSegment: "topics" }
      ]
    },
    {
      type: 'parent',
      key: "community-moderation",
      routeKey: "community-comments",
      label: "Kiểm duyệt nội dung",
      icon: "ti-shield-check",
      urlSegment: "community",
      children: [
        { type: 'item', key: "community-comments", routeKey: "community-comments", label: "Kiểm duyệt bình luận", icon: "ti-message", badge: "GĐ2", urlSegment: "comments" },
        { type: 'item', key: "community-chu-de-moderation", routeKey: "community-chu-de-moderation", label: "Kiểm duyệt chủ đề", icon: "ti-news", badge: "GĐ2", urlSegment: "topic-moderation" }
      ]
    },
    { type: 'item', key: "community-reports", routeKey: "community-reports", label: "Trung tâm báo cáo", icon: "ti-flag", badge: "GĐ2", urlSegment: "community/reports" },
    {
      type: 'parent',
      key: "community-stories",
      routeKey: "cau-chuyen-list",
      label: "Quản lý Câu chuyện",
      icon: "ti-books",
      urlSegment: "topics",
      children: [
        { type: 'item', key: "cau-chuyen-list", routeKey: "cau-chuyen-list", label: "Danh sách Câu chuyện", icon: "ti-list", urlSegment: "list" },
        { type: 'item', key: "cau-chuyen-detail", routeKey: "cau-chuyen-detail", label: "Chi tiết câu chuyện", icon: "ti-file-description", urlSegment: "detail" },
        { type: 'item', key: "chu-de-detail", routeKey: "chu-de-detail", label: "Chi tiết chủ đề", icon: "ti-book", urlSegment: "registry-detail", nav: false },
        { type: 'item', key: "chu-de-mapping", routeKey: "chu-de-mapping", label: "Ánh xạ chủ đề", icon: "ti-arrows-exchange", urlSegment: "mapping", nav: false },
        { type: 'item', key: "chu-de-analytics", routeKey: "chu-de-analytics", label: "Phân tích chủ đề", icon: "ti-chart-area", urlSegment: "analytics", nav: false }
      ]
    },
    {
      type: 'parent',
      key: "community-rss",
      routeKey: "community-rss-providers",
      label: "Quản lý RSS",
      icon: "ti-news",
      urlSegment: "community",
      children: [
        { type: 'item', key: "community-rss-providers", routeKey: "community-rss-providers", label: "Nguồn RSS", icon: "ti-building", urlSegment: "rss-sources" },
        { type: 'item', key: "community-rss-category-sync", routeKey: "community-rss-category-sync", label: "Đồng bộ danh mục", icon: "ti-arrows-exchange", urlSegment: "rss-category-sync" },
        { type: 'item', key: "community-rss-article-schema", routeKey: "community-rss-article-schema", label: "Đồng bộ cấu trúc bài viết", icon: "ti-table", urlSegment: "rss-article-schema" }
      ]
    },
    { type: 'item', key: "community-content-edit", routeKey: "community-content-edit", label: "Sửa bài viết", icon: "ti-pencil", urlSegment: "community/edit", nav: false },
    { type: 'item', key: "community-author-list", routeKey: "community-author-list", label: "Danh sách tác giả", icon: "ti-users", urlSegment: "community/authors", nav: false },
    { type: 'item', key: "community-experts", routeKey: "community-experts", label: "Chuyên gia", icon: "ti-award", urlSegment: "community/experts", nav: false },

    /* 3. Quản lý người dùng — không group urlSegment (mixed users / requests) */
    { type: 'group', label: "Quản lý người dùng" },
    {
      type: 'parent',
      key: "users-end-users",
      routeKey: "users-list",
      label: "Quản lý khách hàng",
      icon: "ti-users",
      urlSegment: "users",
      children: [
        { type: 'item', key: "users-list", routeKey: "users-list", label: "Danh sách người dùng", icon: "ti-list", urlSegment: "list" },
        { type: 'item', key: "subscription-entitlements", routeKey: "subscription-entitlements", label: "Vai trò & Quyền", icon: "ti-shield-lock", urlSegment: "entitlements" }
      ]
    },
    {
      type: 'parent',
      key: "users-requests",
      routeKey: "req-partnership",
      label: "Quản lý yêu cầu",
      icon: "ti-inbox",
      urlSegment: "requests",
      children: [
        { type: 'item', key: "req-partnership", routeKey: "req-partnership", label: "Yêu cầu hợp tác", icon: "ti-handshake", urlSegment: "partnership" },
        { type: 'item', key: "req-withdrawals", routeKey: "req-withdrawals", label: "Yêu cầu rút tiền", icon: "ti-cash", urlSegment: "withdrawals" },
        { type: 'item', key: "req-features", routeKey: "req-features", label: "Đề xuất tính năng", icon: "ti-bulb", urlSegment: "features" },
        { type: 'item', key: "req-bugs", routeKey: "req-bugs", label: "Báo lỗi", icon: "ti-bug", urlSegment: "bugs" }
      ]
    },
    { type: 'item', key: "users-export", routeKey: "users-export", label: "Xuất dữ liệu", icon: "ti-download", badge: "···", urlSegment: "users/export" },

    /* 4. Quản lý đơn hàng */
    { type: 'group', label: "Quản lý đơn hàng", urlSegment: "orders" },
    { type: 'item', key: "orders-list", routeKey: "orders-list", label: "Danh sách đơn hàng", icon: "ti-receipt", urlSegment: "list" },
    { type: 'item', key: "orders-add", routeKey: "orders-add", label: "Thêm mới đơn hàng", icon: "ti-plus", urlSegment: "add" },
    { type: 'item', key: "orders-edit", routeKey: "orders-edit", label: "Sửa đơn hàng", icon: "ti-pencil", urlSegment: "edit", nav: false },

    /* 5. Quản lý sản phẩm */
    { type: 'group', label: "Quản lý sản phẩm", urlSegment: "subscriptions" },
    {
      type: 'parent',
      key: "subscription-membership-plans",
      routeKey: "subscription-plans",
      label: "Gói Hội viên",
      icon: "ti-package",
      children: [
        { type: 'item', key: "subscription-plans", routeKey: "subscription-plans", label: "Danh sách Gói", icon: "ti-list", urlSegment: "plans" },
        { type: 'item', key: "subscription-plan-add", routeKey: "subscription-plan-add", label: "Thêm Gói", icon: "ti-plus", urlSegment: "plan-edit" }
      ]
    },
    { type: 'item', key: "subscription-subscribers", routeKey: "subscription-subscribers", label: "Người đăng ký", icon: "ti-users-group", badge: "···", urlSegment: "subscribers" },

    /* 6. Loyalty & Membership */
    { type: 'group', label: "Loyalty & Membership", urlSegment: "membership" },
    {
      type: 'parent',
      key: "loyalty-promo",
      routeKey: "loyalty-promo-list",
      label: "Mã khuyến mãi",
      icon: "ti-ticket",
      urlSegment: "promo",
      children: [
        { type: 'item', key: "loyalty-promo-list", routeKey: "loyalty-promo-list", label: "Danh sách mã", icon: "ti-list", urlSegment: "list" },
        { type: 'item', key: "loyalty-promo-add", routeKey: "loyalty-promo-add", label: "Thêm mã khuyến mãi", icon: "ti-plus", urlSegment: "add" },
        { type: 'item', key: "loyalty-promo-usage", routeKey: "loyalty-promo-usage", label: "Quản lý sử dụng", icon: "ti-chart-bar", urlSegment: "usage" }
      ]
    },
    {
      type: 'parent',
      key: "loyalty-membership",
      routeKey: "loyalty-membership-list",
      label: "Membership",
      icon: "ti-affiliate",
      children: [
        { type: 'item', key: "loyalty-membership-list", routeKey: "loyalty-membership-list", label: "Danh sách Membership", icon: "ti-hierarchy-2", urlSegment: "list" }
      ]
    },

    /* 7. Giao diện */
    { type: 'group', label: "Quản lý giao diện", urlSegment: "interface" },
    { type: 'item', key: "system-page-settings", routeKey: "system-page-settings", label: "Cài đặt Trang", icon: "ti-sitemap", urlSegment: "page-settings" },
    { type: 'item', key: "system-templates", routeKey: "system-templates", label: "Mẫu giao diện", icon: "ti-template", urlSegment: "templates" },
    { type: 'item', key: "system-ds-studio", routeKey: "system-ds-studio", label: "Token nguyên thủy", icon: "ti-palette", urlSegment: "ds-studio" },
    { type: 'item', key: "system-ds-studio-2", routeKey: "system-ds-studio-2", label: "Nền tảng", icon: "ti-layers-linked" },
    { type: 'item', key: "system-ds-studio-3", routeKey: "system-ds-studio-3", label: "Token thiết kế", icon: "ti-adjustments" },
    { type: 'item', key: "system-ds-studio-4", routeKey: "system-ds-studio-4", label: "Biểu tượng", icon: "ti-icons" },
    { type: 'item', key: "system-ds-studio-5", routeKey: "system-ds-studio-5", label: "Biểu đồ", icon: "ti-chart-bar" },
    { type: 'item', key: "system-ds-studio-6", routeKey: "system-ds-studio-6", label: "Nguyên tử", icon: "ti-box" },
    { type: 'item', key: "system-ds-studio-7", routeKey: "system-ds-studio-7", label: "Mục", icon: "ti-list" },
    { type: 'item', key: "system-ds-studio-8", routeKey: "system-ds-studio-8", label: "Khối", icon: "ti-layout-grid" },
    { type: 'item', key: "system-ds-studio-9", routeKey: "system-ds-studio-9", label: "Thẻ", icon: "ti-id" },
    { type: 'item', key: "system-ds-studio-10", routeKey: "system-ds-studio-10", label: "Tổ hợp", icon: "ti-components", badge: "soon" },
    { type: 'item', key: "system-ds-studio-11", routeKey: "system-ds-studio-11", label: "Phần bố cục", icon: "ti-layout-board", badge: "soon" },
    { type: 'item', key: "system-ds-studio-12", routeKey: "system-ds-studio-12", label: "Đối tượng nghiệp vụ", icon: "ti-building-bank", badge: "soon" },
    { type: 'item', key: "system-ds-studio-13", routeKey: "system-ds-studio-13", label: "Luồng người dùng", icon: "ti-route", badge: "soon" },

    /* 8. Hệ thống — không group urlSegment (Wave 1 administrators 2-level) */
    { type: 'group', label: "Cài đặt hệ thống" },
    { type: 'item', key: "system-sla", routeKey: "system-sla", label: "Bảng SLA", icon: "ti-activity", badge: "···", urlSegment: "system/sla" },
    { type: 'item', key: "system-platform-layers", routeKey: "system-platform-layers", label: "Kiến trúc 4 tầng", icon: "ti-layers-intersect", urlSegment: "system/platform-layers" },
    { type: 'item', key: "system-feature-flags", routeKey: "system-feature-flags", label: "Cờ tính năng", icon: "ti-toggle-left", badge: "···", urlSegment: "system/feature-flags" },
    { type: 'item', key: "system-maintenance", routeKey: "system-maintenance", label: "Chế độ bảo trì", icon: "ti-construction", badge: "···", urlSegment: "system/maintenance" },
    {
      type: 'parent',
      key: "system-admins",
      routeKey: "system-admin-list",
      label: "Quản trị viên",
      icon: "ti-user-shield",
      urlSegment: "administrators",
      children: [
        { type: 'item', key: "system-admin-list", routeKey: "system-admin-list", label: "Danh sách Quản trị viên", icon: "ti-users", urlSegment: "list" },
        { type: 'item', key: "system-admin-profile", routeKey: "system-admin-profile", label: "Hồ sơ", icon: "ti-id", urlSegment: "profile" },
        { type: 'item', key: "system-admin-roles", routeKey: "system-admin-roles", label: "Vai trò quản trị", icon: "ti-shield", urlSegment: "roles" },
        { type: 'item', key: "system-admin-permissions", routeKey: "system-admin-permissions", label: "Phân quyền quản trị", icon: "ti-lock", urlSegment: "permissions" }
      ]
    },
    { type: 'item', key: "system-audit", routeKey: "system-audit", label: "Nhật ký kiểm tra", icon: "ti-list-details", badge: "···", urlSegment: "system/audit" },

    /* 9. Quản lý thông báo */
    { type: 'group', label: "Quản lý thông báo", urlSegment: "notifications" },
    { type: 'item', key: "notifications-push", routeKey: "notifications-push", label: "Thông báo push", icon: "ti-bell-ringing", badge: "···", urlSegment: "push" },
    { type: 'item', key: "notifications-in-app", routeKey: "notifications-in-app", label: "Trong ứng dụng", icon: "ti-inbox", badge: "···", urlSegment: "in-app" },
    { type: 'item', key: "notifications-email", routeKey: "notifications-email", label: "Chiến dịch email", icon: "ti-mail", badge: "GĐ2", urlSegment: "email" },
    { type: 'item', key: "notifications-history", routeKey: "notifications-history", label: "Lịch sử phát sóng", icon: "ti-history", badge: "···", urlSegment: "history" },
    { type: 'item', key: "system-announcements", routeKey: "system-announcements", label: "Thiết lập mẫu thông báo", icon: "ti-template", urlSegment: "templates" },

    /* 10+. Các module còn lại (giữ thứ tự tương đối) */
    { type: 'group', label: "Thị trường", urlSegment: "market" },
    { type: 'item', key: "market-stocks", routeKey: "market-stocks", label: "Mã cổ phiếu", icon: "ti-building-bank", badge: "···", urlSegment: "stocks" },
    { type: 'item', key: "market-ecosystems-index", routeKey: "market-ecosystems-index", label: "Hệ sinh thái", icon: "ti-hierarchy-2", badge: "···", urlSegment: "ecosystems" },
    { type: 'item', key: "market-sectors-index", routeKey: "market-sectors-index", label: "Quản lý ngành", icon: "ti-chart-dots-3", badge: "···", urlSegment: "sectors" },
    { type: 'item', key: "market-lot-threshold", routeKey: "market-lot-threshold", label: "Ngưỡng lô", icon: "ti-coins", badge: "···", urlSegment: "lot-threshold" },
    { type: 'item', key: "market-cau-hinh-thoi-gian", routeKey: "market-cau-hinh-thoi-gian", label: "Cấu hình thời gian", icon: "ti-calendar-time", urlSegment: "time-config" },
    {
      type: 'parent',
      key: "market-data-mgmt",
      routeKey: "data-sources",
      label: "Quản lý Nguồn Dữ liệu",
      icon: "ti-database",
      children: [
        { type: 'item', key: "data-sources", routeKey: "data-sources", label: "Nguồn Market data", icon: "ti-plug", urlSegment: "data-sources" },
        { type: 'item', key: "market-stock-schema", routeKey: "market-stock-schema", label: "Đồng bộ cấu trúc cổ phiếu", icon: "ti-table", urlSegment: "stock-schema" },
        { type: 'item', key: "market-sync-history", routeKey: "market-sync-history", label: "Lịch sử đồng bộ", icon: "ti-history", urlSegment: "sync-history" }
      ]
    },
    { type: 'item', key: "market-ranking", routeKey: "market-ranking", label: "Cấu hình xếp hạng", icon: "ti-tournament", badge: "···", urlSegment: "ranking" },
    { type: 'item', key: "market-formulas", routeKey: "market-formulas", label: "Công thức", icon: "ti-math-function", badge: "···", urlSegment: "formulas" },
    { type: 'group', label: "Vận hành dữ liệu", urlSegment: "data-operations" },
    { type: 'item', key: "market-ops-feed-health", routeKey: "market-ops-feed-health", label: "Sức khỏe feed", icon: "ti-heartbeat", badge: "···", urlSegment: "feed-health" },
    { type: 'item', key: "market-ops-sessions", routeKey: "market-ops-sessions", label: "Phiên giao dịch", icon: "ti-clock", badge: "···", urlSegment: "sessions" },
    { type: 'item', key: "market-ops-missing-ticks", routeKey: "market-ops-missing-ticks", label: "Giám sát tick thiếu", icon: "ti-alert-triangle", badge: "···", urlSegment: "missing-ticks" },
    { type: 'item', key: "market-ops-corrections", routeKey: "market-ops-corrections", label: "Sửa thủ công", icon: "ti-tool", badge: "···", urlSegment: "corrections" },
    { type: 'group', label: "Quản trị dữ liệu", urlSegment: "data" },
    { type: 'item', key: "data-etl-jobs", routeKey: "data-etl-jobs", label: "Tác vụ ETL", icon: "ti-refresh", badge: "···", urlSegment: "etl-jobs" },
    { type: 'item', key: "data-pipeline", routeKey: "data-pipeline", label: "Giám sát pipeline", icon: "ti-git-branch", badge: "···", urlSegment: "pipeline" },
    { type: 'item', key: "data-quality", routeKey: "data-quality", label: "Chất lượng DL", icon: "ti-shield-check", badge: "···", urlSegment: "quality" },
    { type: 'item', key: "data-dictionary", routeKey: "data-dictionary", label: "Từ điển dữ liệu", icon: "ti-book", badge: "···", urlSegment: "dictionary" },
    { type: 'item', key: "data-reconciliation", routeKey: "data-reconciliation", label: "Đối soát", icon: "ti-arrows-exchange", badge: "···", urlSegment: "reconciliation" },
    { type: 'group', label: "Metadata", urlSegment: "metadata" },
    { type: 'item', key: "metadata-sector-types", routeKey: "metadata-sector-types", label: "Loại ngành", icon: "ti-tags", badge: "···", urlSegment: "sector-types" },
    { type: 'item', key: "metadata-enums", routeKey: "metadata-enums", label: "Quản lý enum", icon: "ti-list", badge: "···", urlSegment: "enums" },
    { type: 'item', key: "metadata-themes", routeKey: "metadata-themes", label: "Kho giao diện", icon: "ti-palette", badge: "GĐ2", urlSegment: "themes" },
    { type: 'item', key: "metadata-chu-de-lifecycle", routeKey: "metadata-chu-de-lifecycle", label: "Vòng đời chủ đề", icon: "ti-timeline", badge: "GĐ2", urlSegment: "topic-lifecycle" },
    { type: 'group', label: "Marketing", urlSegment: "marketing" },
    {
      type: 'parent',
      key: "marketing-seo",
      routeKey: "marketing-seo-system",
      label: "Thiết lập SEO",
      icon: "ti-world-www",
      urlSegment: "seo",
      children: [
        { type: 'item', key: "marketing-seo-system", routeKey: "marketing-seo-system", label: "Thiết lập SEO hệ thống", icon: "ti-settings", urlSegment: "system" },
        { type: 'item', key: "marketing-seo-pages", routeKey: "marketing-seo-pages", label: "Thiết lập SEO từng trang", icon: "ti-file-text", urlSegment: "pages" }
      ]
    },
    { type: 'item', key: "marketing-onboarding", routeKey: "marketing-onboarding", label: "Thiết lập nội dung Onboarding", icon: "ti-route", urlSegment: "onboarding" },
    { type: 'group', label: "Trung tâm AI", urlSegment: "ai" },
    { type: 'item', key: "ai-prompts", routeKey: "ai-prompts", label: "Danh mục prompt", icon: "ti-brain", badge: "GĐ2", urlSegment: "prompts" },
    { type: 'item', key: "ai-prompt-detail", routeKey: "ai-prompt-detail", label: "Chi tiết prompt", icon: "ti-file-code", badge: "GĐ2", urlSegment: "prompt-detail" },
    { type: 'item', key: "ai-logs", routeKey: "ai-logs", label: "Nhật ký AI", icon: "ti-list-search", badge: "GĐ2", urlSegment: "logs" },
    { type: 'item', key: "ai-cost", routeKey: "ai-cost", label: "Chi phí AI", icon: "ti-currency-dollar", badge: "GĐ2", urlSegment: "cost" },
    { type: 'item', key: "ai-quality", routeKey: "ai-quality", label: "Đánh giá chất lượng", icon: "ti-star", badge: "GĐ2", urlSegment: "quality" },
    { type: 'group', label: "Phân tích", urlSegment: "analytics" },
    { type: 'item', key: "analytics-users", routeKey: "analytics-users", label: "Phân tích người dùng", icon: "ti-chart-bar", badge: "GĐ2", urlSegment: "users" },
    { type: 'item', key: "analytics-chu-de", routeKey: "analytics-chu-de", label: "Phân tích chủ đề", icon: "ti-chart-area", badge: "GĐ2", urlSegment: "topics" },
    { type: 'item', key: "analytics-revenue", routeKey: "analytics-revenue", label: "Phân tích doanh thu", icon: "ti-chart-pie", badge: "GĐ2", urlSegment: "revenue" },
    { type: 'item', key: "analytics-funnel", routeKey: "analytics-funnel", label: "Phễu chuyển đổi", icon: "ti-filter", badge: "GĐ2", urlSegment: "funnel" },
    { type: 'group', label: "Hướng dẫn" },
    { type: 'item', key: "Admin-Design-system-hub", routeKey: "Admin-Design-system-hub", label: "Checklist", icon: "ti-checklist" },
    { type: 'item', key: "Admin-Design-system-design-system", routeKey: "Admin-Design-system-design-system", label: "Thành phần UI", icon: "ti-color-swatch" },
    { type: 'item', key: "Admin-Design-system-patterns-table-list", routeKey: "Admin-Design-system-patterns-table-list", label: "Mẫu: Bảng", icon: "ti-table" },
    { type: 'item', key: "Admin-Design-system-patterns-form-add", routeKey: "Admin-Design-system-patterns-form-add", label: "Mẫu: Form", icon: "ti-forms" },
    { type: 'item', key: "Admin-Design-system-patterns-charts", routeKey: "Admin-Design-system-patterns-charts", label: "Mẫu: Biểu đồ", icon: "ti-chart-pie" },
  ];

  function pathFor(routeKey) {
    var groupSeg = null;
    var i;
    for (i = 0; i < sidebar.length; i += 1) {
      var node = sidebar[i];
      if (node.type === 'group') {
        groupSeg = node.urlSegment || null;
        continue;
      }
      if (node.type === 'item' && node.routeKey === routeKey && node.urlSegment) {
        return '/admin/' + (groupSeg ? groupSeg + '/' : '') + node.urlSegment;
      }
      if (node.type === 'parent' && node.children) {
        var c;
        for (c = 0; c < node.children.length; c += 1) {
          var ch = node.children[c];
          if (ch.routeKey === routeKey && ch.urlSegment) {
            var segs = [];
            if (groupSeg) segs.push(groupSeg);
            if (node.urlSegment) segs.push(node.urlSegment);
            segs.push(ch.urlSegment);
            return '/admin/' + segs.join('/');
          }
        }
      }
    }
    return null;
  }

  function adminHomeHref() {
    var R = global.IfluxAdminRoutes;
    if (R && R.hrefFor) return R.hrefFor('dashboard-index');
    return '/admin/overview';
  }

  function trailFor(routeKey) {
    var groupLabel = null;
    var i;
    var home = { label: 'Admin', href: adminHomeHref() };
    for (i = 0; i < sidebar.length; i += 1) {
      var node = sidebar[i];
      if (node.type === 'group') {
        groupLabel = node.label;
        continue;
      }
      if (node.type === 'item' && node.routeKey === routeKey) {
        return [home]
          .concat(groupLabel ? [{ label: groupLabel }] : [])
          .concat([{ label: node.label }]);
      }
      if (node.type === 'parent' && node.children) {
        var hit = null;
        node.children.forEach(function (ch) {
          if (ch.routeKey === routeKey) hit = ch;
        });
        if (hit) {
          return [home]
            .concat(groupLabel ? [{ label: groupLabel }] : [])
            .concat([{ label: node.label }])
            .concat([{ label: hit.label }]);
        }
      }
    }
    return [home];
  }

  global.IfluxAdminNavRegistry = {
    sidebar: sidebar,
    pathFor: pathFor,
    trailFor: trailFor,
    itemCount: (function () {
      var n = 0;
      sidebar.forEach(function (x) {
        if (x.type === 'item' && x.nav !== false) n += 1;
        if (x.type === 'parent' && x.children) {
          x.children.forEach(function (c) { if (c.type === 'item' && c.nav !== false) n += 1; });
        }
      });
      return n;
    })()
  };
})(window);
