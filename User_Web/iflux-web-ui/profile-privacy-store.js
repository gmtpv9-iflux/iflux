/* Quyền riêng tư hồ sơ công khai — sandbox localStorage */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_privacy_v1';

  /** Mặc định: tất cả false = ẩn với người khác */
  var DEFAULTS = {
    show_username: false,
    show_bio: false,
    show_role: false,
    show_tier: false,
    show_joined_at: false,
    show_country: false,
    show_stats: false,
    show_status: false,
    show_timeline: false,
    show_following_list: false,
    /** Cho phép người lạ (không kết bạn / không follow lẫn / không affiliate) gửi tin nhắn */
    allow_stranger_messages: false
  };

  /** User có thể bật/tắt — mặc định ẩn hết */
  var TOGGLE_FIELDS = [
    { key: 'show_username', label: 'Tên đăng nhập', hint: 'Username @handle hiển thị trên hồ sơ công khai' },
    { key: 'show_bio', label: 'Giới thiệu', hint: 'Dòng mô tả ngắn về bạn' },
    { key: 'show_role', label: 'Vai trò', hint: 'Thành viên, Phân tích, CTV…' },
    { key: 'show_tier', label: 'Gói thành viên', hint: 'Badge Premium / Elite / Miễn phí' },
    { key: 'show_joined_at', label: 'Ngày tham gia', hint: 'Thời điểm tạo tài khoản' },
    { key: 'show_country', label: 'Quốc gia', hint: 'Quốc gia trên hồ sơ (không hiện địa chỉ)' },
    { key: 'show_stats', label: 'Thống kê cộng đồng', hint: 'Bài viết · Người theo dõi · Đang theo dõi' },
    { key: 'show_status', label: 'Trạng thái tài khoản', hint: 'Hoạt động / Tạm khóa' },
    { key: 'show_timeline', label: 'Timeline bình luận', hint: 'Bình luận gốc trên Họ CP / Ngành / CP / Story' },
    { key: 'show_following_list', label: 'Danh sách Theo dõi', hint: 'Ai bạn đang follow (chỉ xem, không thao tác)' },
    {
      key: 'allow_stranger_messages',
      label: 'Nhận tin nhắn từ người lạ',
      hint: 'Cho phép người chưa kết bạn / chưa theo dõi lẫn / không liên hệ affiliate gửi tin nhắn cho bạn',
      group: 'messaging'
    }
  ];

  /** Không bao giờ hiển thị công khai — không có toggle */
  var ALWAYS_PRIVATE = [
    'Email',
    'Số điện thoại',
    'Thông tin thanh toán & gói cước chi tiết',
    'Affiliate & hoa hồng',
    'Mật khẩu & bảo mật đăng nhập',
    'Thông tin tài khoản nội bộ (ID, billing…)'
  ];

  /** Luôn hiển thị khi xem hồ sơ người khác */
  var ALWAYS_PUBLIC = [
    'Ảnh đại diện',
    'Tên hiển thị'
  ];

  var DOM_MAP = {
    username: 'show_username',
    bio: 'show_bio',
    role: 'show_role',
    tier: 'show_tier',
    joined_at: 'show_joined_at',
    country: 'show_country',
    stats: 'show_stats',
    status: 'show_status'
  };

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function get(userId) {
    if (!userId) return Object.assign({}, DEFAULTS);
    var map = readAll();
    return Object.assign({}, DEFAULTS, map[userId] || {});
  }

  function save(userId, patch) {
    if (!userId) return null;
    var map = readAll();
    map[userId] = Object.assign({}, DEFAULTS, map[userId] || {}, patch || {});
    writeAll(map);
    return map[userId];
  }

  function isPublic(userId, fieldKey) {
    var s = get(userId);
    return !!s[fieldKey];
  }

  global.IfluxProfilePrivacyStore = {
    DEFAULTS: DEFAULTS,
    TOGGLE_FIELDS: TOGGLE_FIELDS,
    ALWAYS_PRIVATE: ALWAYS_PRIVATE,
    ALWAYS_PUBLIC: ALWAYS_PUBLIC,
    DOM_MAP: DOM_MAP,
    get: get,
    save: save,
    isPublic: isPublic
  };
})(window);
