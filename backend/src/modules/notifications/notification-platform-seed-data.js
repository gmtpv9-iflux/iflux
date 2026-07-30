'use strict';

const { LEGACY_TAG_TO_CANONICAL } = require('./variable-alias');

function varsFromTags(tags, sampleVars) {
  return (tags || []).map(function (legacyTag) {
    var key = LEGACY_TAG_TO_CANONICAL[legacyTag] || legacyTag;
    return {
      key: key,
      label: legacyTag,
      legacy_tag: legacyTag,
      required: true,
      example: sampleVars && sampleVars[legacyTag] != null ? String(sampleVars[legacyTag]) : ''
    };
  });
}

function sampleCanonical(sampleVars) {
  var out = {};
  Object.keys(sampleVars || {}).forEach(function (legacyTag) {
    var key = LEGACY_TAG_TO_CANONICAL[legacyTag] || legacyTag;
    out[key] = sampleVars[legacyTag];
  });
  return out;
}

function resolveCategory(c) {
  if (c.category) return c.category;
  if (!c.group) {
    if (c.code && (c.code.indexOf('ORDER_') === 0 || c.code.indexOf('SUBSCRIPTION_') === 0)) return 'orders';
    if (c.admin && c.admin.indexOf('NOTIF-ADM') === 0) return 'admin_ops';
    return 'system';
  }
  var map = {
    'Affiliate': 'affiliate',
    'Cộng đồng': 'community',
    'Theo dõi': 'follow',
    'Cảnh báo thông minh': 'alert',
    'Hệ thống': 'system'
  };
  return map[c.group] || 'system';
}

/** 23 catalog CASES → Platform types (seed source). */
const CATALOG_CASES = [
  { legacy: 'USER_ORD_PENDING', code: 'ORDER_UPGRADE_PENDING', admin: 'NOTIF-USER-001', group: null, channel: 'In-app user', icon: 'ti-receipt', name: 'Đơn nâng cấp — chờ duyệt', trigger: 'User gửi yêu cầu nâng cấp gói, chờ Admin xác nhận chuyển khoản', tags: ['Tên người dùng', 'Tên gói', 'Số tiền', 'Mã chuyển khoản', 'Mã đơn hàng'], defaultTitle: 'Đã gửi yêu cầu nâng cấp', defaultMessage: 'Đơn {Tên gói} ({Số tiền}) đang chờ Admin xác nhận chuyển khoản. Nội dung CK: {Mã chuyển khoản}.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Số tiền': '₫830.000', 'Mã chuyển khoản': 'IFLUX ORD001', 'Mã đơn hàng': 'ORD-20250613-001' } },
  { legacy: 'USER_ORD_APPROVED', code: 'ORDER_UPGRADE_APPROVED', admin: 'NOTIF-USER-002', group: null, channel: 'In-app user', icon: 'ti-circle-check', name: 'Đơn nâng cấp — đã kích hoạt', trigger: 'Admin duyệt đơn, gói được áp dụng cho tài khoản', tags: ['Tên người dùng', 'Tên gói', 'Mã đơn hàng'], defaultTitle: 'Gói đã được kích hoạt', defaultMessage: 'Admin đã duyệt — {Tên gói} đã được áp dụng cho tài khoản của bạn.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Mã đơn hàng': 'ORD-20250613-001' } },
  { legacy: 'USER_ORD_REJECTED', code: 'ORDER_UPGRADE_REJECTED', admin: 'NOTIF-USER-003', group: null, channel: 'In-app user', icon: 'ti-circle-x', name: 'Đơn nâng cấp — bị từ chối', trigger: 'Admin từ chối đơn nâng cấp', tags: ['Tên người dùng', 'Tên gói', 'Lý do từ chối', 'Mã đơn hàng'], defaultTitle: 'Đơn nâng cấp bị từ chối', defaultMessage: 'Đơn {Tên gói} không được duyệt. Lý do: {Lý do từ chối}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Lý do từ chối': 'Sai nội dung chuyển khoản', 'Mã đơn hàng': 'ORD-20250613-001' } },
  { legacy: 'USER_SUB_EXPIRING', code: 'SUBSCRIPTION_EXPIRING', admin: 'NOTIF-USER-004', group: null, channel: 'In-app + Push', icon: 'ti-clock-exclamation', name: 'Gói sắp hết hạn', trigger: 'Subscription còn ≤ 7 ngày trước khi hết hạn', tags: ['Tên người dùng', 'Tên gói', 'Ngày hết hạn gói'], defaultTitle: 'Gói {Tên gói} sắp hết hạn', defaultMessage: 'Xin chào {Tên người dùng}, gói {Tên gói} của bạn hết hạn vào {Ngày hết hạn gói}. Gia hạn để không gián đoạn quyền lợi.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Ngày hết hạn gói': '20/06/2026' } },
  { legacy: 'USER_SUB_EXPIRED', code: 'SUBSCRIPTION_EXPIRED', admin: 'NOTIF-USER-005', group: null, channel: 'In-app + Push', icon: 'ti-lock', name: 'Gói đã hết hạn', trigger: 'Subscription hết hạn, tier chuyển về Free', tags: ['Tên người dùng', 'Tên gói'], defaultTitle: 'Gói {Tên gói} đã hết hạn', defaultMessage: '{Tên người dùng}, gói {Tên gói} đã hết hạn. Nâng cấp lại để tiếp tục sử dụng tính năng Premium.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng' } },
  { legacy: 'USER_AFF_COMMISSION', code: 'AFFILIATE_COMMISSION_EARNED', admin: 'NOTIF-USER-006', group: 'Affiliate', channel: 'In-app user', icon: 'ti-coin', name: 'Hoa hồng Affiliate', trigger: 'Thành viên trong mạng mua gói — referrer nhận hoa hồng', tags: ['Tên người dùng', 'Số tiền hoa hồng', 'Tầng affiliate', 'Phần trăm hoa hồng', 'Tên người mua', 'Sản phẩm'], defaultTitle: 'Hoa hồng Affiliate', defaultMessage: 'Bạn vừa nhận {Số tiền hoa hồng} ({Tầng affiliate} · {Phần trăm hoa hồng}%) từ {Tên người mua} mua {Sản phẩm}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Số tiền hoa hồng': '₫83.000', 'Tầng affiliate': 'F0', 'Phần trăm hoa hồng': '10', 'Tên người mua': 'Trần Thị B', 'Sản phẩm': 'Premium / 1 tháng' } },
  { legacy: 'USER_AFF_REFERRAL', code: 'AFFILIATE_REFERRAL_SUCCESS', admin: 'NOTIF-USER-007', group: 'Affiliate', channel: 'In-app user', icon: 'ti-user-plus', name: 'Referral mới đăng ký', trigger: 'Thành viên mới đăng ký qua mã giới thiệu', tags: ['Tên người dùng', 'Tên thành viên mới', 'Tầng affiliate'], defaultTitle: 'Bạn có thành viên {Tầng affiliate} mới!', defaultMessage: '{Tên thành viên mới} đã đăng ký thành công thông qua nhánh giới thiệu của bạn!', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên thành viên mới': 'Phạm Minh Tuấn', 'Tầng affiliate': 'F0' } },
  { legacy: 'USER_COMM_POST', code: 'COMMUNITY_POST_FROM_FOLLOWING', admin: 'NOTIF-USER-008', group: 'Cộng đồng', channel: 'In-app user', icon: 'ti-news', name: 'Bài viết mới từ người theo dõi', trigger: 'Người user đang theo dõi đăng bài viết cộng đồng mới', tags: ['Tên người dùng', 'Tên tác giả', 'Tiêu đề bài viết'], defaultTitle: 'Bài viết mới', defaultMessage: '{Tên tác giả} vừa đăng: «{Tiêu đề bài viết}»', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên tác giả': 'Quốc Bảo', 'Tiêu đề bài viết': 'VIC EV — VinFast và chu kỳ xe điện' } },
  { legacy: 'USER_COMM_MESSAGE', code: 'COMMUNITY_DIRECT_MESSAGE', admin: 'NOTIF-USER-009', group: 'Cộng đồng', channel: 'In-app user', icon: 'ti-message', name: 'Tin nhắn mới', trigger: 'Thành viên khác gửi tin nhắn trực tiếp', tags: ['Tên người dùng', 'Tên người gửi', 'Nội dung tin nhắn'], defaultTitle: 'Tin nhắn mới', defaultMessage: '{Tên người gửi}: {Nội dung tin nhắn}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên người gửi': 'Lan Hương', 'Nội dung tin nhắn': 'Cảm ơn bạn! Mình sẽ đăng thêm trên Timeline tuần này.' } },
  { legacy: 'USER_ALERT_TRIGGERED', code: 'ALERT_TRIGGERED', admin: 'NOTIF-USER-010', group: 'Cảnh báo thông minh', channel: 'In-app + Push', icon: 'ti-bell-ringing', name: 'Cảnh báo thông minh kích hoạt', trigger: 'Điều kiện Alert user đặt được thỏa mãn', tags: ['Tên người dùng', 'Mã cổ phiếu', 'Điều kiện cảnh báo'], defaultTitle: 'Cảnh báo kích hoạt · {Mã cổ phiếu}', defaultMessage: '{Điều kiện cảnh báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Mã cổ phiếu': 'HPG', 'Điều kiện cảnh báo': 'Top 5 ngành Thép' } },
  { legacy: 'SYS_ANNOUNCE_INFO', code: 'SYSTEM_ANNOUNCE_INFO', admin: 'NOTIF-SYS-001', group: 'Hệ thống', channel: 'Alert Hệ thống (SCR-002)', icon: 'ti-info-circle', name: 'Thông báo hệ thống — Thông tin', trigger: 'Admin gửi broadcast mức info', tags: ['Tên người dùng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: '{Tiêu đề thông báo}', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tiêu đề thông báo': 'Tính năng mới: Heatmap ngành', 'Nội dung thông báo': 'iFlux vừa bổ sung heatmap ngành realtime trên Dashboard.' } },
  { legacy: 'SYS_ANNOUNCE_WARNING', code: 'SYSTEM_ANNOUNCE_WARNING', admin: 'NOTIF-SYS-002', group: 'Hệ thống', channel: 'Alert Hệ thống (SCR-002)', icon: 'ti-alert-triangle', name: 'Thông báo hệ thống — Cảnh báo', trigger: 'Admin gửi broadcast mức warning', tags: ['Tên người dùng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: '⚠ {Tiêu đề thông báo}', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tiêu đề thông báo': 'Feed dữ liệu chậm', 'Nội dung thông báo': 'Dữ liệu realtime có thể trễ 1–2 phút trong phiên chiều nay.' } },
  { legacy: 'SYS_ANNOUNCE_CRITICAL', code: 'SYSTEM_ANNOUNCE_CRITICAL', admin: 'NOTIF-SYS-003', group: 'Hệ thống', channel: 'Alert Hệ thống (SCR-002)', icon: 'ti-alert-circle', name: 'Thông báo hệ thống — Khẩn cấp', trigger: 'Admin gửi broadcast mức critical', tags: ['Tên người dùng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: '🚨 {Tiêu đề thông báo}', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tiêu đề thông báo': 'Gián đoạn dịch vụ', 'Nội dung thông báo': 'Hệ thống đang gặp sự cố. Đội kỹ thuật đang xử lý.' } },
  { legacy: 'SYS_MAINTENANCE_PLANNED', code: 'SYSTEM_MAINTENANCE_PLANNED', admin: 'NOTIF-SYS-004', group: 'Hệ thống', channel: 'Alert Hệ thống + Banner', icon: 'ti-calendar-event', name: 'Lịch bảo trì đã lên kế hoạch', trigger: 'Admin lên lịch chế độ bảo trì', tags: ['Tên người dùng', 'Ngày bảo trì', 'Giờ bắt đầu', 'Giờ kết thúc', 'Nội dung thông báo'], defaultTitle: 'Bảo trì hệ thống {Ngày bảo trì}', defaultMessage: 'iFlux sẽ bảo trì từ {Giờ bắt đầu} đến {Giờ kết thúc} ngày {Ngày bảo trì}. {Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Ngày bảo trì': '15/06/2026', 'Giờ bắt đầu': '22:00', 'Giờ kết thúc': '23:30', 'Nội dung thông báo': 'Một số tính năng có thể tạm ngưng.' } },
  { legacy: 'SYS_MAINTENANCE_ACTIVE', code: 'SYSTEM_MAINTENANCE_ACTIVE', admin: 'NOTIF-SYS-005', group: 'Hệ thống', channel: 'Banner + Alert Hệ thống', icon: 'ti-construction', name: 'Đang bảo trì', trigger: 'Chế độ bảo trì được bật', tags: ['Tên người dùng', 'Giờ kết thúc', 'Nội dung thông báo'], defaultTitle: 'Hệ thống đang bảo trì', defaultMessage: 'Dự kiến hoàn tất lúc {Giờ kết thúc}. {Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Giờ kết thúc': '23:30', 'Nội dung thông báo': 'Cảm ơn bạn đã kiên nhẫn.' } },
  { legacy: 'SYS_PRODUCT_UPDATE', code: 'SYSTEM_PRODUCT_UPDATE', admin: 'NOTIF-SYS-006', group: 'Hệ thống', channel: 'Alert Hệ thống + Push', icon: 'ti-sparkles', name: 'Cập nhật phiên bản', trigger: 'Phát hành phiên bản app/web mới', tags: ['Tên người dùng', 'Phiên bản ứng dụng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: 'iFlux {Phiên bản ứng dụng} đã sẵn sàng', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Phiên bản ứng dụng': '1.4.0', 'Tiêu đề thông báo': 'Cập nhật 1.4.0', 'Nội dung thông báo': 'Cải thiện hiệu năng heatmap và sửa lỗi alert.' } },
  { legacy: 'SYS_WELCOME', code: 'SYSTEM_WELCOME', admin: 'NOTIF-SYS-007', group: 'Hệ thống', channel: 'In-app user', icon: 'ti-hand-stop', name: 'Chào mừng thành viên mới', trigger: 'User hoàn tất đăng ký tài khoản lần đầu', tags: ['Tên người dùng', 'Email'], defaultTitle: 'Chào mừng {Tên người dùng}!', defaultMessage: 'Tài khoản {Email} đã sẵn sàng. Khám phá Dashboard và thiết lập watchlist đầu tiên của bạn.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', Email: 'user@iflux.vn' } },
  { legacy: 'USER_WL_TAGGED_POST', code: 'FOLLOW_ENTITY_TAGGED_POST', admin: 'NOTIF-USER-011', group: 'Theo dõi', channel: 'In-app user', icon: 'ti-bookmark', name: 'Bài mới gắn thẻ thực thể đang theo dõi', trigger: 'Có bài viết cộng đồng mới được gắn thẻ đúng thực thể user đang theo dõi', tags: ['Tên người dùng', 'Tên thực thể', 'Loại thực thể', 'Tên tác giả', 'Tiêu đề bài viết'], defaultTitle: 'Bài mới về {Tên thực thể}', defaultMessage: '{Tên tác giả} vừa đăng «{Tiêu đề bài viết}» gắn thẻ {Loại thực thể} {Tên thực thể}.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên thực thể': 'HPG', 'Loại thực thể': 'Cổ phiếu', 'Tên tác giả': 'Quốc Bảo', 'Tiêu đề bài viết': 'HPG — dòng tiền nội địa tăng tốc' } },
  { legacy: 'USER_FOLLOW_SHARE', code: 'FOLLOW_USER_SHARE', admin: 'NOTIF-USER-012', group: 'Theo dõi', channel: 'In-app user', icon: 'ti-share-3', name: 'Người đang theo dõi chia sẻ bài viết', trigger: 'Người user đang theo dõi thực hiện chia sẻ bài viết cộng đồng', tags: ['Tên người dùng', 'Tên người tương tác', 'Tiêu đề bài viết'], defaultTitle: '{Tên người tương tác} đã chia sẻ bài', defaultMessage: '{Tên người tương tác} vừa chia sẻ «{Tiêu đề bài viết}».', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên người tương tác': 'Lan Hương', 'Tiêu đề bài viết': 'VIC EV — VinFast và chu kỳ xe điện' } },
  { legacy: 'USER_FOLLOW_ENTITY_COMMENT', code: 'FOLLOW_ENTITY_COMMENT', admin: 'NOTIF-USER-013', group: 'Theo dõi', channel: 'In-app user', icon: 'ti-message-plus', name: 'Người đang theo dõi bình luận gốc trên thực thể', trigger: 'Người đang theo dõi đăng bình luận gốc trên trang chi tiết Entity', tags: ['Tên người dùng', 'Tên người tương tác', 'Tên thực thể', 'Loại thực thể', 'Nội dung bình luận'], defaultTitle: '{Tên người tương tác} bình luận về {Tên thực thể}', defaultMessage: '{Tên người tương tác} trên {Loại thực thể} {Tên thực thể}: «{Nội dung bình luận}»', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên người tương tác': 'Đức Anh', 'Tên thực thể': 'HPG', 'Loại thực thể': 'Cổ phiếu', 'Nội dung bình luận': 'Dòng tiền HPG đang mạnh…' } },
  { legacy: 'USER_IX_COMMENT_LIKED', code: 'INTERACTION_COMMENT_LIKED', admin: 'NOTIF-USER-014', group: 'Cộng đồng', channel: 'In-app user', icon: 'ti-heart', name: 'Ai đó thích bình luận của bạn', trigger: 'Người khác thích bình luận mà bạn đã đăng', tags: ['Tên người dùng', 'Tên người tương tác', 'Nội dung bình luận'], defaultTitle: '{Tên người tương tác} đã thích bình luận của bạn', defaultMessage: '«{Nội dung bình luận}»', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên người tương tác': 'Thu Hà', 'Nội dung bình luận': 'Mình cũng đang theo dõi vùng hỗ trợ này.' } },
  { legacy: 'USER_IX_COMMENT_REPLY', code: 'INTERACTION_COMMENT_REPLY', admin: 'NOTIF-USER-015', group: 'Cộng đồng', channel: 'In-app user', icon: 'ti-message-reply', name: 'Ai đó trả lời bình luận của bạn', trigger: 'Người khác trả lời trực tiếp bình luận của bạn', tags: ['Tên người dùng', 'Tên người tương tác', 'Nội dung bình luận'], defaultTitle: '{Tên người tương tác} đã trả lời bạn', defaultMessage: '{Tên người tương tác}: «{Nội dung bình luận}»', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên người tương tác': 'Hoàng Nam', 'Nội dung bình luận': 'Đồng ý — chờ xác nhận volume.' } },
  { legacy: 'ADMIN_NEW_ORDER', code: 'ADMIN_ORDER_NEW', admin: 'NOTIF-ADM-001', group: null, channel: 'Admin bell + toast', icon: 'ti-shopping-cart', name: 'Đơn hàng mới', trigger: 'User tạo đơn nâng cấp gói — thông báo cho Admin', tags: ['Tên khách hàng', 'Email khách', 'Tên gói', 'Số tiền', 'Phương thức thanh toán', 'Trạng thái đơn', 'Mã đơn hàng'], defaultTitle: 'Đơn hàng mới · {Tên gói}', defaultMessage: '{Tên khách hàng} · {Số tiền} · {Phương thức thanh toán} · {Trạng thái đơn}', sampleVars: { 'Tên khách hàng': 'Trần Thị B', 'Email khách': 'tranb@mail.vn', 'Tên gói': 'Premium / 1 tháng', 'Số tiền': '₫830.000', 'Phương thức thanh toán': 'Chuyển khoản', 'Trạng thái đơn': 'Chờ duyệt', 'Mã đơn hàng': 'ORD-20250613-001' } },
  { legacy: 'ADMIN_SLA_BREACH', code: 'ADMIN_SLA_BREACH', admin: 'NOTIF-ADM-002', group: null, channel: 'Admin email + Slack (GĐ2)', icon: 'ti-activity', name: 'Vi phạm SLA', trigger: 'Chỉ số SLA vượt ngưỡng deploy gate', tags: ['Tên chỉ số SLA', 'Mức SLA', 'Nội dung thông báo'], defaultTitle: '⚠ Vi phạm SLA · {Tên chỉ số SLA}', defaultMessage: 'Chỉ số {Tên chỉ số SLA} vượt ngưỡng cam kết {Mức SLA}. {Nội dung thông báo}', sampleVars: { 'Tên chỉ số SLA': 'Real-time latency', 'Mức SLA': '≤ 3s', 'Nội dung thông báo': 'p95 hiện tại 4.2s — cần kiểm tra feed pipeline.' } },
  {
    legacy: 'PLATFORM_SMOKE_TEST',
    code: 'PLATFORM_SMOKE_TEST',
    admin: 'NOTIF-PLT-000',
    group: null,
    channel: 'In-app (health only)',
    icon: 'ti-test-pipe',
    name: 'Platform smoke (nội bộ)',
    trigger: 'Health check — không dispatch user (OD-C10)',
    enabled: false,
    tags: ['Tên người dùng'],
    defaultTitle: 'Smoke test',
    defaultMessage: 'Xin chào {Tên người dùng} — kiểm tra renderer.',
    sampleVars: { 'Tên người dùng': 'Kiểm tra Platform' }
  }
];

function buildTypeSeeds() {
  return CATALOG_CASES.map(function (c) {
    var variables = varsFromTags(c.tags, c.sampleVars);
    return {
      code: c.code,
      legacy_case_id: c.legacy,
      admin_code: c.admin,
      name: c.name,
      description: c.trigger,
      category: resolveCategory(c),
      group_label: c.group,
      channel_label: c.channel,
      variables: variables,
      sample_variables: sampleCanonical(c.sampleVars),
      supported_channels: ['in_app'],
      enabled: c.enabled !== false,
      icon: c.icon,
      template: {
        channel: 'in_app',
        title: c.defaultTitle,
        body: c.defaultMessage,
        seed_title: c.defaultTitle,
        seed_body: c.defaultMessage
      }
    };
  });
}

module.exports = {
  CATALOG_CASES,
  buildTypeSeeds
};
