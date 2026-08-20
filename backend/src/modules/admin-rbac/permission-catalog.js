'use strict';

/**
 * Catalog quyền Admin — nguồn sự thật để seed bảng admin_permissions.
 * Mở rộng: thêm module/page/action ở đây rồi restart backend là tự seed thêm,
 * KHÔNG cần sửa logic kiểm quyền.
 *
 * Key permission: `${module}.${page}.${action}`
 * Nhãn Module/Menu/Submenu: KHÔNG lưu ở catalog — SoT duy nhất = Main menu (IfluxAdminNavRegistry).
 */

const ACTION_LABELS = {
  view: 'Xem',
  create: 'Tạo',
  edit: 'Sửa',
  delete: 'Xóa',
  import: 'Nhập',
  export: 'Xuất',
  approve: 'Duyệt',
  publish: 'Xuất bản',
  reject: 'Từ chối',
  execute: 'Thực thi',
    configure: 'Cấu hình',
    manage: 'Quản lý',
    regenerate: 'Tạo lại'
  };

const CRUD = ['view', 'create', 'edit', 'delete'];
const VIEW = ['view'];

// Mỗi module: { key, pages: [{ key, actions, business? }] }
// CẤM nhãn UI module/menu/submenu tại đây.
// SoT nhãn duy nhất: Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js (Main menu).
// Chỉ seed action đã khai — ma trận chỉ hiện checkbox khi có key tương ứng.
const MODULES = [
  {
    key: 'dashboard',
    pages: [{ key: 'overview', actions: VIEW }]
  },
  {
    key: 'users',
    pages: [
      { key: 'list', actions: ['view', 'create', 'edit', 'export'],
        business: [{ action: 'grant_premium', label: 'Cấp Premium' }, { action: 'reset_password', label: 'Reset mật khẩu KH' }] },
      { key: 'detail', actions: VIEW },
      { key: 'subscription', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'access',
    pages: [
      { key: 'admin_accounts', actions: CRUD,
        business: [
          { action: 'reset_password', label: 'Reset mật khẩu' },
          { action: 'lock', label: 'Khóa/Mở khóa' },
          { action: 'status_active', label: 'Hoạt động' },
          { action: 'status_locked', label: 'Đã khóa' }
        ] },
      { key: 'roles', actions: CRUD,
        business: [{ action: 'assign_permission', label: 'Gán quyền' }] },
      { key: 'permissions', actions: VIEW,
        business: [{ action: 'assign_permission', label: 'Gán quyền' }] },
      { key: 'audit', actions: VIEW }
    ]
  },
  {
    key: 'market',
    pages: [
      { key: 'stocks', actions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
        business: [
          { action: 'status_active', label: 'Hoạt động' },
          { action: 'status_halted', label: 'Tạm ngưng' },
          { action: 'status_delisted', label: 'Hủy niêm yết' }
        ] },
      { key: 'sectors', actions: CRUD },
      { key: 'ecosystems', actions: CRUD,
        business: [
          { action: 'status_active', label: 'Hoạt động' },
          { action: 'status_inactive', label: 'Tắt' }
        ] },
      { key: 'formulas', actions: ['view', 'edit'],
        business: [{ action: 'recalculate', label: 'Tính lại chỉ số' }] },
      { key: 'ranking', actions: ['view', 'edit'] },
      { key: 'lot_threshold', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'market_ops',
    pages: [
      { key: 'feed_health', actions: VIEW },
      { key: 'sessions', actions: ['view', 'edit'] },
      { key: 'missing_ticks', actions: VIEW },
      { key: 'corrections', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'data',
    pages: [
      { key: 'sources', actions: ['view', 'create', 'edit', 'delete', 'execute'] },
      { key: 'etl_jobs', actions: ['view', 'create', 'edit', 'delete', 'execute'] },
      { key: 'pipeline', actions: VIEW },
      { key: 'quality', actions: VIEW },
      { key: 'dictionary', actions: ['view', 'edit'] },
      { key: 'reconciliation', actions: ['view', 'execute'] }
    ]
  },
  {
    key: 'stories',
    pages: [
      { key: 'registry', actions: CRUD,
        business: [
          { action: 'status_new', label: 'Mới' },
          { action: 'status_mature', label: 'Trưởng thành' },
          { action: 'status_declining', label: 'Suy yếu' },
          { action: 'status_archived', label: 'Lưu trữ' }
        ] },
      { key: 'detail', actions: ['view', 'edit'],
        business: [{ action: 'publish', label: 'Xuất bản' }, { action: 'approve', label: 'Duyệt' }] },
      { key: 'cau_chuyen_detail', actions: ['view', 'edit'] },
      { key: 'mapping', actions: ['view', 'edit'] },
      { key: 'analytics', actions: VIEW }
    ]
  },
  /* Module content.* đã H2 (2026-07-26): không hiện trên matrix (không có dòng menu).
   * Route Content Engine map sang news.articles / stories.registry — xem content.routes.js */
  {
    key: 'news',
    pages: [
      { key: 'content_dashboard', actions: VIEW },
      { key: 'articles', actions: CRUD },
      { key: 'categories', actions: CRUD,
        business: [
          { action: 'status_visible', label: 'Hiện' },
          { action: 'status_hidden', label: 'Ẩn' }
        ] },
      { key: 'stories', actions: ['view', 'edit', 'delete'],
        business: [{ action: 'publish', label: 'Đăng bài' }, { action: 'feature_post', label: 'Đưa nổi bật' }, { action: 'pin_post', label: 'Ghim bài' }, { action: 'lock_post', label: 'Khóa bài' }] },
      { key: 'comments', actions: ['view', 'delete'] },
      { key: 'reports', actions: ['view', 'edit'] },
      { key: 'rss_providers', actions: CRUD },
      { key: 'rss_category_sync', actions: ['view', 'edit', 'execute'] },
      { key: 'rss_article_schema', actions: ['view', 'edit', 'execute'] },
      { key: 'experts', actions: ['view', 'edit'],
        business: [{ action: 'verify', label: 'Xác minh chuyên gia' }] }
    ]
  },
  {
    key: 'subscription',
    pages: [
      { key: 'plans', actions: CRUD },
      { key: 'entitlements', actions: ['view', 'edit'] },
      { key: 'subscribers', actions: ['view', 'export'] },
      { key: 'transactions', actions: ['view', 'create', 'edit', 'export'],
        business: [
          { action: 'approve_payment', label: 'Duyệt thanh toán' },
          { action: 'refund', label: 'Hoàn tiền' },
          { action: 'cancel', label: 'Hủy đơn' },
          { action: 'status_pending', label: 'Chờ duyệt' },
          { action: 'status_approved', label: 'Đã duyệt' },
          { action: 'status_paid', label: 'Đã thanh toán' },
          { action: 'status_rejected', label: 'Từ chối' },
          { action: 'status_refunded', label: 'Đã hoàn tiền' }
        ] },
      { key: 'loyalty', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'requests',
    pages: [
      { key: 'partnership', actions: VIEW,
        business: [
          { action: 'status_in_progress', label: 'Đang xử lý' },
          { action: 'status_done', label: 'Hoàn tất' },
          { action: 'status_rejected', label: 'Từ chối' }
        ] },
      { key: 'withdrawals', actions: VIEW,
        business: [
          { action: 'status_processing', label: 'Đang xử lý' },
          { action: 'status_paid', label: 'Đã chuyển khoản' },
          { action: 'status_rejected', label: 'Từ chối' }
        ] },
      { key: 'features', actions: VIEW,
        business: [
          { action: 'status_new', label: 'Tính năng mới' },
          { action: 'status_accepted', label: 'Chấp nhận' },
          { action: 'status_developing', label: 'Đang phát triển' },
          { action: 'status_released', label: 'Đã phát hành' }
        ] },
      { key: 'bugs', actions: VIEW,
        business: [
          { action: 'status_new', label: 'Báo lỗi mới' },
          { action: 'status_accepted', label: 'Chấp nhận' },
          { action: 'status_developing', label: 'Đang phát triển' },
          { action: 'status_released', label: 'Đã phát hành' }
        ] }
    ]
  },
  {
    key: 'notifications',
    pages: [
      { key: 'push', actions: ['view', 'create', 'edit', 'publish'] },
      { key: 'in_app', actions: ['view', 'create', 'edit', 'publish'] },
      { key: 'email', actions: ['view', 'create', 'edit', 'publish'] },
      { key: 'history', actions: VIEW },
      { key: 'templates', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'metadata',
    pages: [
      { key: 'sector_types', actions: CRUD },
      { key: 'themes', actions: ['view', 'edit'] },
      { key: 'enums', actions: CRUD },
      { key: 'story_lifecycle', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'ai',
    pages: [
      { key: 'prompts', actions: CRUD },
      { key: 'logs', actions: VIEW },
      { key: 'cost', actions: VIEW },
      { key: 'quality', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'marketing',
    pages: [
      { key: 'onboarding', actions: ['view', 'edit'] },
      { key: 'brand_identity', actions: ['view', 'edit'] },
      { key: 'seo_system', actions: ['view', 'edit'] },
      { key: 'seo_pages', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'interface',
    pages: [
      { key: 'page_settings', actions: ['view', 'edit'] },
      { key: 'widget_library', actions: ['view', 'edit'] },
      { key: 'design_system', actions: VIEW }
    ]
  },
  {
    key: 'system',
    pages: [
      { key: 'core_setup', actions: ['view', 'edit', 'configure'] },
      { key: 'platform_layers', actions: VIEW },
      { key: 'feature_flags', actions: ['view', 'edit'] },
      { key: 'maintenance', actions: ['view', 'configure'] },
      { key: 'sla', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'guides',
    pages: [
      { key: 'checklist', actions: VIEW },
      { key: 'ui_components', actions: VIEW },
      { key: 'patterns_table', actions: VIEW },
      { key: 'patterns_form', actions: VIEW },
      { key: 'patterns_charts', actions: VIEW }
    ]
  }
];

function actionLabel(action) {
  return ACTION_LABELS[action] || action;
}

/** Trả về mảng phẳng các permission để seed. */
function flattenPermissions() {
  const out = [];
  let sort = 0;
  MODULES.forEach((mod) => {
    (mod.pages || []).forEach((page) => {
      (page.actions || []).forEach((action) => {
        out.push({
          key: mod.key + '.' + page.key + '.' + action,
          module: mod.key,
          module_label: mod.key,
          page: page.key,
          page_label: page.key,
          action: action,
          label: actionLabel(action),
          is_business: false,
          sort: sort++
        });
      });
      (page.business || []).forEach((biz) => {
        out.push({
          key: biz.flatKey || (mod.key + '.' + page.key + '.' + biz.action),
          module: mod.key,
          module_label: mod.key,
          page: page.key,
          page_label: page.key,
          action: biz.action,
          label: biz.label,
          is_business: true,
          sort: sort++
        });
      });
    });
  });
  return out;
}

module.exports = { MODULES, ACTION_LABELS, actionLabel, flattenPermissions };
