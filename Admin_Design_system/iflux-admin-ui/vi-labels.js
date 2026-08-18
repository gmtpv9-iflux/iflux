/* Nhãn hiển thị tiếng Việt — giá trị logic (value/id) giữ nguyên tiếng Anh */
(function (global) {
  var PACKAGE = {
    Free: 'Miễn phí',
    Premium: 'Premium',
    Elite: 'Elite'
  };

  var PACKAGE_TIER = {
    free: 'Miễn phí',
    premium: 'Premium',
    elite: 'Elite'
  };

  var PLAN = {
    freemium: 'Miễn phí',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
    lifetime: 'Trọn đời'
  };

  var ROLE = {
    'Standard': 'Tiêu chuẩn',
    'Creator': 'Sáng tạo',
    'Analyst': 'Phân tích',
    'API Partner': 'Đối tác API',
    'Community Expert': 'Chuyên gia cộng đồng'
  };

  var STATUS = {
    active: 'Hoạt động',
    expired: 'Hết hạn',
    suspended: 'Tạm khóa'
  };

  var ROLE_STATUS = {
    active: 'Hoạt động',
    gd2: 'GĐ2',
    hidden: 'Ẩn'
  };

  global.ViLabels = {
    PACKAGE: PACKAGE,
    PACKAGE_TIER: PACKAGE_TIER,
    PLAN: PLAN,
    ROLE: ROLE,
    STATUS: STATUS,
    ROLE_STATUS: ROLE_STATUS,

    pkg: function (key) { return PACKAGE[key] || PACKAGE_TIER[key] || key; },
    plan: function (key) { return PLAN[key] || key; },
    role: function (key) { return ROLE[key] || key; },
    status: function (key) { return STATUS[key] || key; },
    roleStatus: function (key) { return ROLE_STATUS[key] || key; }
  };
})(window);
