/* iFlux Admin — Navigation Registry (thuần dữ liệu). Không resolve href.
 * SoT NHÃN DUY NHẤT cho Module / Menu / Submenu trên toàn Admin.
 * CẤM tạo nhãn thứ 2 (catalog, hardcode, bản sao). Thêm menu mới → chỉ thêm nhãn tại đây.
 * CỔNG URL: Admin chỉ English urlSegment. Nhãn menu được tiếng Việt. pathFor() là writer — cấm slug Việt, cấm href cứng App Shell. Mọi menu mới bắt buộc tuân (SoT URL §2.2). */
(function (global) {
  'use strict';
  if (global.IfluxAdminNavRegistry) return;
  var sidebar = [
    /* 1. Tổng quan — không thuộc module */
    { type: 'item', key: "dashboard-index", routeKey: "dashboard-index", label: "Tổng quan", icon: "ti-smart-home", urlSegment: "overview" },

    /* 2. Quản lý Người dùng */
    { type: 'group', label: "Quản lý Người dùng" },
    {
      type: 'parent',
      key: "users-end-users",
      routeKey: "users-list",
      label: "Khách hàng",
      icon: "ti-users",
      urlSegment: "users",
      children: [
        { type: 'item', key: "users-list", routeKey: "users-list", label: "Quản lý khách hàng", icon: "ti-list", urlSegment: "list" },
        { type: 'item', key: "subscription-entitlements", routeKey: "subscription-entitlements", label: "Phân quyền sử dụng", icon: "ti-shield-lock", urlSegment: "entitlements" },
        { type: 'item', key: "users-export", routeKey: "users-export", label: "Xuất dữ liệu", icon: "ti-download", badge: "···", urlSegment: "export" }
      ]
    },

    /* 3. Quản lý Đơn hàng */
    { type: 'group', label: "Quản lý Đơn hàng", urlSegment: "orders" },
    { type: 'item', key: "orders-list", routeKey: "orders-list", label: "Danh sách đơn hàng", icon: "ti-receipt", urlSegment: "list" },
    { type: 'item', key: "orders-add", routeKey: "orders-add", label: "Thêm mới đơn hàng", icon: "ti-plus", urlSegment: "add" },
    { type: 'item', key: "orders-edit", routeKey: "orders-edit", label: "Sửa đơn hàng", icon: "ti-pencil", urlSegment: "edit", nav: false },

    /* 4. Quản lý Yêu cầu */
    { type: 'group', label: "Quản lý Yêu cầu", urlSegment: "requests" },
    { type: 'item', key: "req-partnership", routeKey: "req-partnership", label: "Yêu cầu hợp tác", icon: "ti-handshake", urlSegment: "partnership" },
    { type: 'item', key: "req-withdrawals", routeKey: "req-withdrawals", label: "Yêu cầu rút tiền", icon: "ti-cash", urlSegment: "withdrawals" },
    { type: 'item', key: "req-features", routeKey: "req-features", label: "Đề xuất tính năng", icon: "ti-bulb", urlSegment: "features" },
    { type: 'item', key: "req-bugs", routeKey: "req-bugs", label: "Báo lỗi", icon: "ti-bug", urlSegment: "bugs" },

    /* 5. Quản lý Tin tức */
    { type: 'group', label: "Quản lý Tin tức" },
    {
      type: 'parent',
      key: "news-overview",
      routeKey: "news-content-index",
      label: "Quản lý Tin tức",
      icon: "ti-article",
      urlSegment: "news",
      children: [
        { type: 'item', key: "news-content-dashboard", routeKey: "news-content-dashboard", label: "Tổng quan", icon: "ti-layout-dashboard", urlSegment: "overview", nav: false },
        { type: 'item', key: "news-content-index", routeKey: "news-content-index", label: "Danh sách Bài viết", icon: "ti-article", urlSegment: "articles" },
        { type: 'item', key: "news-categories", routeKey: "news-categories", label: "Danh sách Danh mục", icon: "ti-category", urlSegment: "categories" },
        { type: 'item', key: "news-chu-de-list", routeKey: "news-chu-de-list", label: "Danh sách Chủ đề", icon: "ti-book-2", urlSegment: "topics" }
      ]
    },
    { type: 'item', key: "news-content-edit", routeKey: "news-content-edit", label: "Sửa bài viết", icon: "ti-pencil", urlSegment: "news/edit", nav: false },
    { type: 'item', key: "news-author-list", routeKey: "news-author-list", label: "Danh sách tác giả", icon: "ti-users", urlSegment: "news/authors", nav: false },
    { type: 'item', key: "news-experts", routeKey: "news-experts", label: "Chuyên gia", icon: "ti-award", urlSegment: "news/experts", nav: false },

    /* 6. Kiểm duyệt Tin tức */
    { type: 'group', label: "Kiểm duyệt Tin tức" },
    {
      type: 'parent',
      key: "news-moderation",
      routeKey: "news-comments",
      label: "Kiểm duyệt nội dung",
      icon: "ti-shield-check",
      urlSegment: "news",
      children: [
        { type: 'item', key: "news-comments", routeKey: "news-comments", label: "Kiểm duyệt bình luận", icon: "ti-message", badge: "GĐ2", urlSegment: "comments" },
        { type: 'item', key: "news-chu-de-moderation", routeKey: "news-chu-de-moderation", label: "Kiểm duyệt chủ đề", icon: "ti-news", badge: "GĐ2", urlSegment: "topic-moderation" }
      ]
    },
    { type: 'item', key: "news-reports", routeKey: "news-reports", label: "Trung tâm báo cáo", icon: "ti-flag", badge: "GĐ2", urlSegment: "news/reports" },

    /* 7. Quản lý Thị trường — group không urlSegment (mixed market + topics) */
    { type: 'group', label: "Quản lý Thị trường" },
    {
      type: 'parent',
      key: "market-entities",
      routeKey: "market-stocks",
      label: "Quản lý Thực thể",
      icon: "ti-building-bank",
      children: [
        { type: 'item', key: "market-stocks", routeKey: "market-stocks", label: "Danh sách Cổ phiếu", icon: "ti-building-bank", badge: "···", urlSegment: "market/stocks" },
        { type: 'item', key: "market-ecosystems-index", routeKey: "market-ecosystems-index", label: "Danh sách Hệ sinh thái", icon: "ti-hierarchy-2", badge: "···", urlSegment: "market/ecosystems" },
        { type: 'item', key: "market-sectors-index", routeKey: "market-sectors-index", label: "Danh sách Ngành", icon: "ti-chart-dots-3", badge: "···", urlSegment: "market/sectors" },
        { type: 'item', key: "cau-chuyen-list", routeKey: "cau-chuyen-list", label: "Danh sách Câu chuyện", icon: "ti-list", urlSegment: "topics/list" },
        { type: 'item', key: "cau-chuyen-detail", routeKey: "cau-chuyen-detail", label: "Chi tiết câu chuyện", icon: "ti-file-description", urlSegment: "topics/detail", nav: false },
        { type: 'item', key: "chu-de-detail", routeKey: "chu-de-detail", label: "Chi tiết chủ đề", icon: "ti-book", urlSegment: "topics/registry-detail", nav: false },
        { type: 'item', key: "chu-de-mapping", routeKey: "chu-de-mapping", label: "Ánh xạ chủ đề", icon: "ti-arrows-exchange", urlSegment: "topics/mapping", nav: false },
        { type: 'item', key: "chu-de-analytics", routeKey: "chu-de-analytics", label: "Phân tích chủ đề", icon: "ti-chart-area", urlSegment: "topics/analytics", nav: false }
      ]
    },
    {
      type: 'parent',
      key: "market-config",
      routeKey: "market-cau-hinh-thoi-gian",
      label: "Cấu hình thị trường",
      icon: "ti-settings",
      children: [
        { type: 'item', key: "market-cau-hinh-thoi-gian", routeKey: "market-cau-hinh-thoi-gian", label: "Thời gian", icon: "ti-calendar-time", urlSegment: "market/time-config" },
        { type: 'item', key: "market-lot-threshold", routeKey: "market-lot-threshold", label: "Ngưỡng lô", icon: "ti-coins", badge: "···", urlSegment: "market/lot-threshold" },
        { type: 'item', key: "market-formulas", routeKey: "market-formulas", label: "Công thức", icon: "ti-math-function", badge: "···", urlSegment: "market/formulas" },
        { type: 'item', key: "market-ranking", routeKey: "market-ranking", label: "Xếp hạng", icon: "ti-tournament", badge: "···", urlSegment: "market/ranking" }
      ]
    },

    /* 8. Quản lý Sản phẩm */
    { type: 'group', label: "Quản lý Sản phẩm", urlSegment: "subscriptions" },
    {
      type: 'parent',
      key: "subscription-membership-plans",
      routeKey: "subscription-plans",
      label: "Sản phẩm B2C",
      icon: "ti-package",
      children: [
        { type: 'item', key: "subscription-plans", routeKey: "subscription-plans", label: "Danh sách Gói", icon: "ti-list", urlSegment: "plans" },
        { type: 'item', key: "subscription-plan-add", routeKey: "subscription-plan-add", label: "Thêm Gói", icon: "ti-plus", urlSegment: "plan-edit" }
      ]
    },

    /* 9. Loyalty & Membership */
    { type: 'group', label: "Loyalty & Membership", urlSegment: "membership" },
    {
      type: 'parent',
      key: "loyalty-promo",
      routeKey: "loyalty-promo-list",
      label: "Quản lý Loyalty",
      icon: "ti-ticket",
      urlSegment: "promo",
      children: [
        { type: 'item', key: "loyalty-promo-list", routeKey: "loyalty-promo-list", label: "Danh sách Mã Khuyến mãi", icon: "ti-list", urlSegment: "list" },
        { type: 'item', key: "loyalty-promo-add", routeKey: "loyalty-promo-add", label: "Thêm mã khuyến mãi", icon: "ti-plus", urlSegment: "add" },
        { type: 'item', key: "loyalty-promo-usage", routeKey: "loyalty-promo-usage", label: "Quản lý sử dụng", icon: "ti-chart-bar", urlSegment: "usage" }
      ]
    },
    {
      type: 'parent',
      key: "loyalty-membership",
      routeKey: "loyalty-membership-list",
      label: "Quản lý Membership",
      icon: "ti-affiliate",
      children: [
        { type: 'item', key: "loyalty-membership-list", routeKey: "loyalty-membership-list", label: "Danh sách Membership", icon: "ti-hierarchy-2", urlSegment: "list" }
      ]
    },

    /* 10. Quản lý Thông báo */
    { type: 'group', label: "Quản lý Thông báo", urlSegment: "notifications" },
    { type: 'item', key: "notifications-push", routeKey: "notifications-push", label: "Thông báo đẩy", icon: "ti-bell-ringing", badge: "···", urlSegment: "push" },
    { type: 'item', key: "notifications-in-app", routeKey: "notifications-in-app", label: "Trong ứng dụng", icon: "ti-inbox", badge: "···", urlSegment: "in-app" },
    { type: 'item', key: "notifications-email", routeKey: "notifications-email", label: "Chiến dịch email", icon: "ti-mail", badge: "GĐ2", urlSegment: "email" },
    { type: 'item', key: "notifications-history", routeKey: "notifications-history", label: "Lịch sử phát sóng", icon: "ti-history", badge: "···", urlSegment: "history" },
    { type: 'item', key: "system-announcements", routeKey: "system-announcements", label: "Thiết lập mẫu thông báo", icon: "ti-template", urlSegment: "templates" },

    /* 11. Quản lý giao diện — giữ nguyên toàn bộ */
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

    /* 12. Quản lý Data Sources — group không urlSegment (mixed market + community) */
    { type: 'group', label: "Quản lý Data Sources" },
    {
      type: 'parent',
      key: "market-data-mgmt",
      routeKey: "data-sources",
      label: "Quản lý Market Data",
      icon: "ti-database",
      urlSegment: "market",
      children: [
        { type: 'item', key: "data-sources", routeKey: "data-sources", label: "Danh sách Market data", icon: "ti-plug", urlSegment: "data-sources" },
        { type: 'item', key: "market-stock-schema", routeKey: "market-stock-schema", label: "Đồng bộ cấu trúc cổ phiếu", icon: "ti-table", urlSegment: "stock-schema" },
        { type: 'item', key: "market-sync-history", routeKey: "market-sync-history", label: "Lịch sử đồng bộ", icon: "ti-history", urlSegment: "sync-history" }
      ]
    },
    {
      type: 'parent',
      key: "news-rss",
      routeKey: "news-rss-providers",
      label: "Quản lý RSS",
      icon: "ti-news",
      urlSegment: "news",
      children: [
        { type: 'item', key: "news-rss-providers", routeKey: "news-rss-providers", label: "Danh sách RSS data", icon: "ti-building", urlSegment: "rss-sources" },
        { type: 'item', key: "news-rss-category-sync", routeKey: "news-rss-category-sync", label: "Đồng bộ danh mục bài viết", icon: "ti-arrows-exchange", urlSegment: "rss-category-sync" },
        { type: 'item', key: "news-rss-article-schema", routeKey: "news-rss-article-schema", label: "Đồng bộ cấu trúc bài viết", icon: "ti-table", urlSegment: "rss-article-schema" }
      ]
    },

    /* 13. Quản lý nội dung tĩnh */
    { type: 'group', label: "Quản lý nội dung tĩnh" },
    { type: 'item', key: "marketing-onboarding", routeKey: "marketing-onboarding", label: "Onboarding", icon: "ti-route", urlSegment: "marketing/onboarding" },

    /* 14. Cài đặt hệ thống */
    { type: 'group', label: "Cài đặt hệ thống" },
    { type: 'item', key: "system-sla", routeKey: "system-sla", label: "Bảng SLA", icon: "ti-activity", badge: "···", urlSegment: "system/sla" },
    { type: 'item', key: "system-platform-layers", routeKey: "system-platform-layers", label: "Kiến trúc 4 tầng", icon: "ti-layers-intersect", urlSegment: "system/platform-layers" },
    { type: 'item', key: "system-feature-flags", routeKey: "system-feature-flags", label: "Cờ tính năng", icon: "ti-toggle-left", badge: "···", urlSegment: "system/feature-flags" },
    { type: 'item', key: "system-maintenance", routeKey: "system-maintenance", label: "Chế độ bảo trì", icon: "ti-construction", badge: "···", urlSegment: "system/maintenance" },
    { type: 'item', key: "system-audit", routeKey: "system-audit", label: "Nhật ký kiểm tra", icon: "ti-list-details", badge: "···", urlSegment: "system/audit" },

    /* 15. Quản lý Quản trị viên — Wave 1 canonical giữ */
    { type: 'group', label: "Quản lý Quản trị viên" },
    { type: 'item', key: "system-admin-list", routeKey: "system-admin-list", label: "Danh sách Quản trị viên", icon: "ti-users", urlSegment: "administrators/list" },
    { type: 'item', key: "system-admin-roles", routeKey: "system-admin-roles", label: "Vai trò quản trị", icon: "ti-shield", urlSegment: "administrators/roles" },
    { type: 'item', key: "system-admin-permissions", routeKey: "system-admin-permissions", label: "Phân quyền quản trị", icon: "ti-lock", urlSegment: "administrators/permissions" },
    { type: 'item', key: "system-admin-profile", routeKey: "system-admin-profile", label: "Hồ sơ của tôi", icon: "ti-id", urlSegment: "administrators/profile" },

    /* 16+. Module chưa sắp xếp — giữ hiện trạng, thứ tự sau 15 */
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
