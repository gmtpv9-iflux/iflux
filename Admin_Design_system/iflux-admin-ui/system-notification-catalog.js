/* ADM-SYS-003 — Danh mục trường hợp thông báo hệ thống + thẻ merge */
(function (global) {
  'use strict';

  var MERGE_TAGS = [
    { key: 'Tên người dùng', label: 'Tên hiển thị người nhận', example: 'Nguyễn Văn A', group: 'Người dùng' },
    { key: 'Email', label: 'Email người nhận', example: 'user@iflux.vn', group: 'Người dùng' },
    { key: 'Tên khách hàng', label: 'Tên trên đơn hàng (Admin)', example: 'Trần Thị B', group: 'Người dùng' },
    { key: 'Email khách', label: 'Email trên đơn hàng (Admin)', example: 'tranb@mail.vn', group: 'Người dùng' },
    { key: 'Tên gói', label: 'Tên gói đăng ký', example: 'Premium / 1 tháng', group: 'Gói đăng ký' },
    { key: 'Số tiền', label: 'Giá trị đơn (đã format)', example: '₫830.000', group: 'Gói đăng ký' },
    { key: 'Mã đơn hàng', label: 'ID đơn hàng', example: 'ORD-20250613-001', group: 'Gói đăng ký' },
    { key: 'Mã chuyển khoản', label: 'Nội dung chuyển khoản', example: 'IFLUX ORD001', group: 'Gói đăng ký' },
    { key: 'Phương thức thanh toán', label: 'Chuyển khoản / MoMo…', example: 'Chuyển khoản', group: 'Gói đăng ký' },
    { key: 'Trạng thái đơn', label: 'Chờ duyệt / Đã thanh toán…', example: 'Chờ duyệt', group: 'Gói đăng ký' },
    { key: 'Lý do từ chối', label: 'Lý do Admin từ chối đơn', example: 'Sai nội dung chuyển khoản', group: 'Gói đăng ký' },
    { key: 'Ngày hết hạn gói', label: 'Ngày subscription hết hạn', example: '15/07/2026', group: 'Gói đăng ký' },
    { key: 'Số tiền hoa hồng', label: 'Hoa hồng affiliate', example: '₫83.000', group: 'Membership' },
    { key: 'Tầng affiliate', label: 'F0 / F1 / F2', example: 'F0', group: 'Membership' },
    { key: 'Phần trăm hoa hồng', label: 'Tỷ lệ % hoa hồng', example: '10', group: 'Membership' },
    { key: 'Tên người mua', label: 'Người mua qua link affiliate', example: 'Trần Thị B', group: 'Membership' },
    { key: 'Sản phẩm', label: 'Gói người mua chọn', example: 'Premium / 1 tháng', group: 'Membership' },
    { key: 'Tên thành viên mới', label: 'Referral vừa đăng ký', example: 'Phạm Minh Tuấn', group: 'Membership' },
    { key: 'Tên tác giả', label: 'Người đăng bài cộng đồng', example: 'Quốc Bảo', group: 'Cộng đồng' },
    { key: 'Tiêu đề bài viết', label: 'Tiêu đề story / post', example: 'VIC EV — VinFast và chu kỳ xe điện', group: 'Cộng đồng' },
    { key: 'Tên người gửi', label: 'Người gửi tin nhắn', example: 'Lan Hương', group: 'Cộng đồng' },
    { key: 'Nội dung tin nhắn', label: 'Preview tin nhắn', example: 'Cảm ơn bạn! Mình sẽ đăng thêm…', group: 'Cộng đồng' },
    { key: 'Mã cổ phiếu', label: 'Ticker cảnh báo', example: 'HPG', group: 'Cảnh báo' },
    { key: 'Điều kiện cảnh báo', label: 'Mô tả điều kiện đã kích hoạt', example: 'Top 5 ngành Thép', group: 'Cảnh báo' },
    { key: 'Tiêu đề thông báo', label: 'Tiêu đề broadcast Admin', example: 'Bảo trì hệ thống tối nay', group: 'Hệ thống' },
    { key: 'Nội dung thông báo', label: 'Nội dung chi tiết broadcast', example: 'iFlux sẽ bảo trì từ 22:00–23:00.', group: 'Hệ thống' },
    { key: 'Ngày bảo trì', label: 'Ngày lịch bảo trì', example: '13/06/2026', group: 'Hệ thống' },
    { key: 'Giờ bắt đầu', label: 'Giờ bắt đầu bảo trì', example: '22:00', group: 'Hệ thống' },
    { key: 'Giờ kết thúc', label: 'Giờ kết thúc bảo trì', example: '23:00', group: 'Hệ thống' },
    { key: 'Phiên bản ứng dụng', label: 'Version app/web', example: '1.4.0', group: 'Hệ thống' },
    { key: 'Tên chỉ số SLA', label: 'Tên metric vi phạm', example: 'Real-time latency', group: 'Vận hành Admin' },
    { key: 'Mức SLA', label: 'Ngưỡng cam kết', example: '≤ 3s', group: 'Vận hành Admin' }
  ];

  var CASES = [
    { id: 'USER_ORD_PENDING', code: 'NOTIF-USER-001', group: 'Gói đăng ký · User', channel: 'In-app user', icon: 'ti-receipt', name: 'Đơn nâng cấp — chờ duyệt', trigger: 'User gửi yêu cầu nâng cấp gói, chờ Admin xác nhận chuyển khoản', tags: ['Tên người dùng', 'Tên gói', 'Số tiền', 'Mã chuyển khoản', 'Mã đơn hàng'], defaultTitle: 'Đã gửi yêu cầu nâng cấp', defaultMessage: 'Đơn {Tên gói} ({Số tiền}) đang chờ Admin xác nhận chuyển khoản. Nội dung CK: {Mã chuyển khoản}.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Số tiền': '₫830.000', 'Mã chuyển khoản': 'IFLUX ORD001', 'Mã đơn hàng': 'ORD-20250613-001' } },
    { id: 'USER_ORD_APPROVED', code: 'NOTIF-USER-002', group: 'Gói đăng ký · User', channel: 'In-app user', icon: 'ti-circle-check', name: 'Đơn nâng cấp — đã kích hoạt', trigger: 'Admin duyệt đơn, gói được áp dụng cho tài khoản', tags: ['Tên người dùng', 'Tên gói', 'Mã đơn hàng'], defaultTitle: 'Gói đã được kích hoạt', defaultMessage: 'Admin đã duyệt — {Tên gói} đã được áp dụng cho tài khoản của bạn.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Mã đơn hàng': 'ORD-20250613-001' } },
    { id: 'USER_ORD_REJECTED', code: 'NOTIF-USER-003', group: 'Gói đăng ký · User', channel: 'In-app user', icon: 'ti-circle-x', name: 'Đơn nâng cấp — bị từ chối', trigger: 'Admin từ chối đơn nâng cấp', tags: ['Tên người dùng', 'Tên gói', 'Lý do từ chối', 'Mã đơn hàng'], defaultTitle: 'Đơn nâng cấp bị từ chối', defaultMessage: 'Đơn {Tên gói} không được duyệt. Lý do: {Lý do từ chối}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Lý do từ chối': 'Sai nội dung chuyển khoản', 'Mã đơn hàng': 'ORD-20250613-001' } },
    { id: 'USER_SUB_EXPIRING', code: 'NOTIF-USER-004', group: 'Gói đăng ký · User', channel: 'In-app + Push', icon: 'ti-clock-exclamation', name: 'Gói sắp hết hạn', trigger: 'Subscription còn ≤ 7 ngày trước khi hết hạn', tags: ['Tên người dùng', 'Tên gói', 'Ngày hết hạn gói'], defaultTitle: 'Gói {Tên gói} sắp hết hạn', defaultMessage: 'Xin chào {Tên người dùng}, gói {Tên gói} của bạn hết hạn vào {Ngày hết hạn gói}. Gia hạn để không gián đoạn quyền lợi.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng', 'Ngày hết hạn gói': '20/06/2026' } },
    { id: 'USER_SUB_EXPIRED', code: 'NOTIF-USER-005', group: 'Gói đăng ký · User', channel: 'In-app + Push', icon: 'ti-lock', name: 'Gói đã hết hạn', trigger: 'Subscription hết hạn, tier chuyển về Free', tags: ['Tên người dùng', 'Tên gói'], defaultTitle: 'Gói {Tên gói} đã hết hạn', defaultMessage: '{Tên người dùng}, gói {Tên gói} đã hết hạn. Nâng cấp lại để tiếp tục sử dụng tính năng Premium.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên gói': 'Premium / 1 tháng' } },
    { id: 'USER_AFF_COMMISSION', code: 'NOTIF-USER-006', group: 'Membership · User', channel: 'In-app user', icon: 'ti-coin', name: 'Hoa hồng Affiliate', trigger: 'Thành viên trong mạng mua gói — referrer nhận hoa hồng', tags: ['Tên người dùng', 'Số tiền hoa hồng', 'Tầng affiliate', 'Phần trăm hoa hồng', 'Tên người mua', 'Sản phẩm'], defaultTitle: 'Hoa hồng Affiliate', defaultMessage: 'Bạn vừa nhận {Số tiền hoa hồng} ({Tầng affiliate} · {Phần trăm hoa hồng}%) từ {Tên người mua} mua {Sản phẩm}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Số tiền hoa hồng': '₫83.000', 'Tầng affiliate': 'F0', 'Phần trăm hoa hồng': '10', 'Tên người mua': 'Trần Thị B', 'Sản phẩm': 'Premium / 1 tháng' } },
    { id: 'USER_AFF_REFERRAL', code: 'NOTIF-USER-007', group: 'Membership · User', channel: 'In-app user', icon: 'ti-user-plus', name: 'Referral mới đăng ký', trigger: 'Thành viên mới đăng ký qua mã giới thiệu', tags: ['Tên người dùng', 'Tên thành viên mới'], defaultTitle: 'Referral mới', defaultMessage: '{Tên thành viên mới} đã đăng ký qua mã giới thiệu của bạn.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên thành viên mới': 'Phạm Minh Tuấn' } },
    { id: 'USER_COMM_POST', code: 'NOTIF-USER-008', group: 'Cộng đồng · User', channel: 'In-app user', icon: 'ti-news', name: 'Bài viết mới từ người theo dõi', trigger: 'Người user theo dõi đăng story / bài viết mới', tags: ['Tên người dùng', 'Tên tác giả', 'Tiêu đề bài viết'], defaultTitle: 'Bài viết mới', defaultMessage: '{Tên tác giả} vừa đăng: «{Tiêu đề bài viết}»', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên tác giả': 'Quốc Bảo', 'Tiêu đề bài viết': 'VIC EV — VinFast và chu kỳ xe điện' } },
    { id: 'USER_COMM_MESSAGE', code: 'NOTIF-USER-009', group: 'Cộng đồng · User', channel: 'In-app user', icon: 'ti-message', name: 'Tin nhắn mới', trigger: 'Thành viên khác gửi tin nhắn trực tiếp', tags: ['Tên người dùng', 'Tên người gửi', 'Nội dung tin nhắn'], defaultTitle: 'Tin nhắn mới', defaultMessage: '{Tên người gửi}: {Nội dung tin nhắn}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tên người gửi': 'Lan Hương', 'Nội dung tin nhắn': 'Cảm ơn bạn! Mình sẽ đăng thêm trên Timeline tuần này.' } },
    { id: 'USER_ALERT_TRIGGERED', code: 'NOTIF-USER-010', group: 'Cảnh báo thông minh · User', channel: 'In-app + Push', icon: 'ti-bell-ringing', name: 'Cảnh báo thông minh kích hoạt', trigger: 'Điều kiện Alert user đặt được thỏa mãn (BR-AL-01)', tags: ['Tên người dùng', 'Mã cổ phiếu', 'Điều kiện cảnh báo'], defaultTitle: 'Cảnh báo kích hoạt · {Mã cổ phiếu}', defaultMessage: '{Điều kiện cảnh báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Mã cổ phiếu': 'HPG', 'Điều kiện cảnh báo': 'Top 5 ngành Thép' } },
    { id: 'SYS_ANNOUNCE_INFO', code: 'NOTIF-SYS-001', group: 'Alert Hệ thống · Broadcast', channel: 'Alert Hệ thống (SCR-002)', icon: 'ti-info-circle', name: 'Thông báo hệ thống — Thông tin', trigger: 'Admin gửi broadcast mức info', tags: ['Tên người dùng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: '{Tiêu đề thông báo}', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tiêu đề thông báo': 'Tính năng mới: Heatmap ngành', 'Nội dung thông báo': 'iFlux vừa bổ sung heatmap ngành realtime trên Dashboard.' } },
    { id: 'SYS_ANNOUNCE_WARNING', code: 'NOTIF-SYS-002', group: 'Alert Hệ thống · Broadcast', channel: 'Alert Hệ thống (SCR-002)', icon: 'ti-alert-triangle', name: 'Thông báo hệ thống — Cảnh báo', trigger: 'Admin gửi broadcast mức warning', tags: ['Tên người dùng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: '⚠ {Tiêu đề thông báo}', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tiêu đề thông báo': 'Feed dữ liệu chậm', 'Nội dung thông báo': 'Dữ liệu realtime có thể trễ 1–2 phút trong phiên chiều nay.' } },
    { id: 'SYS_ANNOUNCE_CRITICAL', code: 'NOTIF-SYS-003', group: 'Alert Hệ thống · Broadcast', channel: 'Alert Hệ thống (SCR-002)', icon: 'ti-alert-circle', name: 'Thông báo hệ thống — Khẩn cấp', trigger: 'Admin gửi broadcast mức critical', tags: ['Tên người dùng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: '🚨 {Tiêu đề thông báo}', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Tiêu đề thông báo': 'Gián đoạn dịch vụ', 'Nội dung thông báo': 'Hệ thống đang gặp sự cố. Đội kỹ thuật đang xử lý.' } },
    { id: 'SYS_MAINTENANCE_PLANNED', code: 'NOTIF-SYS-004', group: 'Alert Hệ thống · Broadcast', channel: 'Alert Hệ thống + Banner', icon: 'ti-calendar-event', name: 'Lịch bảo trì đã lên kế hoạch', trigger: 'Admin lên lịch chế độ bảo trì', tags: ['Tên người dùng', 'Ngày bảo trì', 'Giờ bắt đầu', 'Giờ kết thúc', 'Nội dung thông báo'], defaultTitle: 'Bảo trì hệ thống {Ngày bảo trì}', defaultMessage: 'iFlux sẽ bảo trì từ {Giờ bắt đầu} đến {Giờ kết thúc} ngày {Ngày bảo trì}. {Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Ngày bảo trì': '15/06/2026', 'Giờ bắt đầu': '22:00', 'Giờ kết thúc': '23:30', 'Nội dung thông báo': 'Một số tính năng có thể tạm ngưng.' } },
    { id: 'SYS_MAINTENANCE_ACTIVE', code: 'NOTIF-SYS-005', group: 'Alert Hệ thống · Broadcast', channel: 'Banner + Alert Hệ thống', icon: 'ti-construction', name: 'Đang bảo trì', trigger: 'Chế độ bảo trì được bật', tags: ['Tên người dùng', 'Giờ kết thúc', 'Nội dung thông báo'], defaultTitle: 'Hệ thống đang bảo trì', defaultMessage: 'Dự kiến hoàn tất lúc {Giờ kết thúc}. {Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Giờ kết thúc': '23:30', 'Nội dung thông báo': 'Cảm ơn bạn đã kiên nhẫn.' } },
    { id: 'SYS_PRODUCT_UPDATE', code: 'NOTIF-SYS-006', group: 'Alert Hệ thống · Broadcast', channel: 'Alert Hệ thống + Push', icon: 'ti-sparkles', name: 'Cập nhật phiên bản', trigger: 'Phát hành phiên bản app/web mới', tags: ['Tên người dùng', 'Phiên bản ứng dụng', 'Tiêu đề thông báo', 'Nội dung thông báo'], defaultTitle: 'iFlux {Phiên bản ứng dụng} đã sẵn sàng', defaultMessage: '{Nội dung thông báo}', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Phiên bản ứng dụng': '1.4.0', 'Tiêu đề thông báo': 'Cập nhật 1.4.0', 'Nội dung thông báo': 'Cải thiện hiệu năng heatmap và sửa lỗi alert.' } },
    { id: 'SYS_WELCOME', code: 'NOTIF-SYS-007', group: 'Alert Hệ thống · Broadcast', channel: 'In-app user', icon: 'ti-hand-stop', name: 'Chào mừng thành viên mới', trigger: 'User hoàn tất đăng ký tài khoản lần đầu', tags: ['Tên người dùng', 'Email'], defaultTitle: 'Chào mừng {Tên người dùng}!', defaultMessage: 'Tài khoản {Email} đã sẵn sàng. Khám phá Dashboard và thiết lập watchlist đầu tiên của bạn.', sampleVars: { 'Tên người dùng': 'Nguyễn Văn A', 'Email': 'user@iflux.vn' } },
    { id: 'ADMIN_NEW_ORDER', code: 'NOTIF-ADM-001', group: 'Vận hành · Admin', channel: 'Admin bell + toast', icon: 'ti-shopping-cart', name: 'Đơn hàng mới', trigger: 'User tạo đơn nâng cấp gói — thông báo cho Admin', tags: ['Tên khách hàng', 'Email khách', 'Tên gói', 'Số tiền', 'Phương thức thanh toán', 'Trạng thái đơn', 'Mã đơn hàng'], defaultTitle: 'Đơn hàng mới · {Tên gói}', defaultMessage: '{Tên khách hàng} · {Số tiền} · {Phương thức thanh toán} · {Trạng thái đơn}', sampleVars: { 'Tên khách hàng': 'Trần Thị B', 'Email khách': 'tranb@mail.vn', 'Tên gói': 'Premium / 1 tháng', 'Số tiền': '₫830.000', 'Phương thức thanh toán': 'Chuyển khoản', 'Trạng thái đơn': 'Chờ duyệt', 'Mã đơn hàng': 'ORD-20250613-001' } },
    { id: 'ADMIN_SLA_BREACH', code: 'NOTIF-ADM-002', group: 'Vận hành · Admin', channel: 'Admin email + Slack (GĐ2)', icon: 'ti-activity', name: 'Vi phạm SLA', trigger: 'Chỉ số SLA vượt ngưỡng deploy gate', tags: ['Tên chỉ số SLA', 'Mức SLA', 'Nội dung thông báo'], defaultTitle: '⚠ Vi phạm SLA · {Tên chỉ số SLA}', defaultMessage: 'Chỉ số {Tên chỉ số SLA} vượt ngưỡng cam kết {Mức SLA}. {Nội dung thông báo}', sampleVars: { 'Tên chỉ số SLA': 'Real-time latency', 'Mức SLA': '≤ 3s', 'Nội dung thông báo': 'p95 hiện tại 4.2s — cần kiểm tra feed pipeline.' } }
  ];

  function getCaseById(id) {
    return CASES.find(function (c) { return c.id === id; });
  }

  function listGroups() {
    var seen = {};
    var groups = [];
    CASES.forEach(function (c) {
      if (!seen[c.group]) { seen[c.group] = true; groups.push(c.group); }
    });
    return groups;
  }

  global.IfluxSystemNotificationCatalog = {
    MERGE_TAGS: MERGE_TAGS,
    CASES: CASES,
    getCaseById: getCaseById,
    listGroups: listGroups,
    mergeTagCount: MERGE_TAGS.length,
    caseCount: CASES.length
  };
})(window);
