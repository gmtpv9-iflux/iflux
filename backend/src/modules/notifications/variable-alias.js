'use strict';

/**
 * Legacy Vietnamese merge tag → canonical key.
 * OD-C8 LOCKED: **compatibility ONLY** — cấm thêm business variable mới vào map này.
 * Variable mới → khai báo trong notification_types.variables[] (seed).
 */
const LEGACY_TAG_TO_CANONICAL = Object.freeze({
  'Tên người dùng': 'recipient_name',
  Email: 'recipient_email',
  'Tên khách hàng': 'customer_name',
  'Email khách': 'customer_email',
  'Tên gói': 'plan_name',
  'Số tiền': 'amount',
  'Mã đơn hàng': 'order_id',
  'Mã chuyển khoản': 'transfer_ref',
  'Phương thức thanh toán': 'payment_method',
  'Trạng thái đơn': 'order_status',
  'Lý do từ chối': 'rejection_reason',
  'Ngày hết hạn gói': 'expiry_date',
  'Số tiền hoa hồng': 'commission_amount',
  'Tầng affiliate': 'affiliate_tier',
  'Phần trăm hoa hồng': 'commission_percent',
  'Tên người mua': 'buyer_name',
  'Sản phẩm': 'product_name',
  'Tên thành viên mới': 'member',
  'Tên tác giả': 'actor',
  'Tiêu đề bài viết': 'post_title',
  'Tên người gửi': 'actor',
  'Nội dung tin nhắn': 'message_preview',
  'Mã cổ phiếu': 'stock_ticker',
  'Điều kiện cảnh báo': 'alert_condition',
  'Tiêu đề thông báo': 'broadcast_title',
  'Nội dung thông báo': 'broadcast_body',
  'Ngày bảo trì': 'maintenance_date',
  'Giờ bắt đầu': 'start_time',
  'Giờ kết thúc': 'end_time',
  'Phiên bản ứng dụng': 'app_version',
  'Tên chỉ số SLA': 'sla_metric_name',
  'Mức SLA': 'sla_threshold',
  'Tên thực thể': 'entity_name',
  'Loại thực thể': 'entity_type',
  'Tên người tương tác': 'actor',
  'Nội dung bình luận': 'comment_preview'
});

const CANONICAL_KEY_RE = /^[a-z][a-z0-9_]*$/;
const TYPE_CODE_RE = /^[A-Z][A-Z0-9_]+$/;
const ADMIN_CODE_RE = /^NOTIF-(USER|SYS|ADM|PLT)-[0-9]{3}$/;

/** Internal types — dispatcher must never deliver (OD-C10). */
const NON_DISPATCHABLE_TYPE_CODES = Object.freeze(['PLATFORM_SMOKE_TEST']);

function isDispatchableTypeCode(typeCode) {
  return typeCode && NON_DISPATCHABLE_TYPE_CODES.indexOf(typeCode) < 0;
}

module.exports = {
  LEGACY_TAG_TO_CANONICAL,
  CANONICAL_KEY_RE,
  TYPE_CODE_RE,
  ADMIN_CODE_RE,
  NON_DISPATCHABLE_TYPE_CODES,
  isDispatchableTypeCode
};
