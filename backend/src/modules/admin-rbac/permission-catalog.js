'use strict';

/**
 * Catalog quyền Admin — nguồn sự thật để seed bảng admin_permissions.
 * Mở rộng: thêm module/page/action ở đây rồi restart backend là tự seed thêm,
 * KHÔNG cần sửa logic kiểm quyền.
 *
 * Key permission: `${module}.${page}.${action}`
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
  configure: 'Cấu hình'
};

const CRUD = ['view', 'create', 'edit', 'delete'];
const VIEW = ['view'];

// Mỗi module: { key, label, pages: [{ key, label, actions:[...], business:[{action,label}] }] }
const MODULES = [
  {
    key: 'dashboard', label: 'Tổng quan',
    pages: [{ key: 'overview', label: 'Tổng quan', actions: VIEW }]
  },
  {
    key: 'users', label: 'Khách hàng',
    pages: [
      { key: 'list', label: 'Danh sách khách hàng', actions: ['view', 'create', 'edit', 'export'],
        business: [{ action: 'grant_premium', label: 'Cấp Premium' }, { action: 'reset_password', label: 'Reset mật khẩu KH' }] },
      { key: 'detail', label: 'Chi tiết khách hàng', actions: VIEW },
      { key: 'subscription', label: 'Gói của khách hàng', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'access', label: 'Phân quyền quản trị',
    pages: [
      { key: 'admin_accounts', label: 'Tài khoản admin', actions: CRUD,
        business: [{ action: 'reset_password', label: 'Reset mật khẩu' }, { action: 'lock', label: 'Khóa/Mở khóa' }] },
      { key: 'roles', label: 'Vai trò', actions: CRUD,
        business: [{ action: 'assign_permission', label: 'Gán quyền' }] },
      { key: 'permissions', label: 'Quyền', actions: VIEW },
      { key: 'audit', label: 'Nhật ký kiểm tra', actions: VIEW }
    ]
  },
  {
    key: 'market', label: 'Thị trường',
    pages: [
      { key: 'stocks', label: 'Mã cổ phiếu', actions: ['view', 'create', 'edit', 'delete', 'import', 'export'] },
      { key: 'sectors', label: 'Quản lý ngành', actions: CRUD },
      { key: 'ecosystems', label: 'Họ cổ phiếu', actions: CRUD },
      { key: 'formulas', label: 'Công thức', actions: ['view', 'edit'],
        business: [{ action: 'recalculate', label: 'Tính lại chỉ số' }] },
      { key: 'ranking', label: 'Cấu hình xếp hạng', actions: ['view', 'edit'] },
      { key: 'lot_threshold', label: 'Ngưỡng lô', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'market_ops', label: 'Vận hành dữ liệu',
    pages: [
      { key: 'feed_health', label: 'Sức khỏe feed', actions: VIEW },
      { key: 'sessions', label: 'Phiên giao dịch', actions: ['view', 'edit'] },
      { key: 'missing_ticks', label: 'Giám sát tick thiếu', actions: VIEW },
      { key: 'corrections', label: 'Sửa thủ công', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'data', label: 'Quản trị dữ liệu',
    pages: [
      { key: 'sources', label: 'Nguồn dữ liệu', actions: ['view', 'create', 'edit', 'delete', 'execute'] },
      { key: 'etl_jobs', label: 'Tác vụ ETL', actions: ['view', 'create', 'edit', 'delete', 'execute'] },
      { key: 'pipeline', label: 'Giám sát pipeline', actions: VIEW },
      { key: 'quality', label: 'Chất lượng dữ liệu', actions: VIEW },
      { key: 'dictionary', label: 'Từ điển dữ liệu', actions: ['view', 'edit'] },
      { key: 'reconciliation', label: 'Đối soát', actions: ['view', 'execute'] }
    ]
  },
  {
    key: 'stories', label: 'Chủ đề',
    pages: [
      { key: 'registry', label: 'Danh mục chủ đề', actions: CRUD },
      { key: 'detail', label: 'Chi tiết chủ đề', actions: ['view', 'edit'],
        business: [{ action: 'publish', label: 'Xuất bản' }, { action: 'approve', label: 'Duyệt' }] },
      { key: 'mapping', label: 'Ánh xạ chủ đề', actions: ['view', 'edit'] },
      { key: 'analytics', label: 'Phân tích chủ đề', actions: VIEW }
    ]
  },
  {
    key: 'community', label: 'Cộng đồng',
    pages: [
      { key: 'stories', label: 'Kiểm duyệt chủ đề', actions: ['view', 'edit', 'delete'],
        business: [{ action: 'publish', label: 'Đăng bài' }, { action: 'feature_post', label: 'Đưa nổi bật' }, { action: 'pin_post', label: 'Ghim bài' }, { action: 'lock_post', label: 'Khóa bài' }] },
      { key: 'comments', label: 'Kiểm duyệt bình luận', actions: ['view', 'delete'] },
      { key: 'reports', label: 'Trung tâm báo cáo', actions: ['view', 'edit'] },
      { key: 'experts', label: 'Quản lý chuyên gia', actions: ['view', 'edit'],
        business: [{ action: 'verify', label: 'Xác minh chuyên gia' }] }
    ]
  },
  {
    key: 'subscription', label: 'Gói & Doanh thu',
    pages: [
      { key: 'plans', label: 'Danh mục gói', actions: CRUD },
      { key: 'entitlements', label: 'Phân quyền sử dụng', actions: ['view', 'edit'] },
      { key: 'subscribers', label: 'Người đăng ký', actions: ['view', 'export'] },
      { key: 'transactions', label: 'Đơn hàng', actions: ['view', 'export'],
        business: [{ action: 'approve_payment', label: 'Duyệt thanh toán' }, { action: 'refund', label: 'Hoàn tiền' }, { action: 'cancel', label: 'Hủy đơn' }] },
      { key: 'loyalty', label: 'Giới thiệu / Affiliate', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'notifications', label: 'Thông báo',
    pages: [
      { key: 'push', label: 'Thông báo push', actions: ['view', 'create', 'edit', 'publish'] },
      { key: 'in_app', label: 'Trong ứng dụng', actions: ['view', 'create', 'edit', 'publish'] },
      { key: 'email', label: 'Chiến dịch email', actions: ['view', 'create', 'edit', 'publish'] },
      { key: 'history', label: 'Lịch sử phát sóng', actions: VIEW },
      { key: 'templates', label: 'Mẫu thông báo', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'metadata', label: 'Metadata',
    pages: [
      { key: 'sector_types', label: 'Loại ngành', actions: CRUD },
      { key: 'themes', label: 'Nhận diện thương hiệu', actions: ['view', 'edit'] },
      { key: 'enums', label: 'Quản lý enum', actions: CRUD },
      { key: 'story_lifecycle', label: 'Vòng đời chủ đề', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'ai', label: 'AI',
    pages: [
      { key: 'prompts', label: 'Danh mục prompt', actions: CRUD },
      { key: 'logs', label: 'Nhật ký AI', actions: VIEW },
      { key: 'cost', label: 'Chi phí AI', actions: VIEW },
      { key: 'quality', label: 'Đánh giá chất lượng', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'marketing', label: 'Marketing',
    pages: [
      { key: 'onboarding', label: 'Thiết lập Onboarding', actions: ['view', 'edit'] },
      { key: 'brand_identity', label: 'Nhận diện thương hiệu', actions: ['view', 'edit'] }
    ]
  },
  {
    key: 'interface', label: 'Giao diện',
    pages: [
      { key: 'page_settings', label: 'Cài đặt Trang', actions: ['view', 'edit'] },
      { key: 'widget_library', label: 'Thư viện Widget', actions: ['view', 'edit'] },
      { key: 'design_system', label: 'Design System', actions: VIEW }
    ]
  },
  {
    key: 'system', label: 'Hệ thống',
    pages: [
      { key: 'core_setup', label: 'Thiết lập core', actions: ['view', 'edit', 'configure'] },
      { key: 'platform_layers', label: 'Kiến trúc 4 tầng', actions: VIEW },
      { key: 'feature_flags', label: 'Cờ tính năng', actions: ['view', 'edit'] },
      { key: 'maintenance', label: 'Chế độ bảo trì', actions: ['view', 'configure'] },
      { key: 'sla', label: 'Bảng SLA', actions: ['view', 'edit'] }
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
          module_label: mod.label,
          page: page.key,
          page_label: page.label,
          action: action,
          label: actionLabel(action) + ' · ' + page.label,
          is_business: false,
          sort: sort++
        });
      });
      (page.business || []).forEach((biz) => {
        out.push({
          key: mod.key + '.' + page.key + '.' + biz.action,
          module: mod.key,
          module_label: mod.label,
          page: page.key,
          page_label: page.label,
          action: biz.action,
          label: biz.label + ' · ' + page.label,
          is_business: true,
          sort: sort++
        });
      });
    });
  });
  return out;
}

module.exports = { MODULES, ACTION_LABELS, actionLabel, flattenPermissions };
