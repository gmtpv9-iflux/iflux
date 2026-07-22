/* FAQ — nội dung Câu hỏi thường gặp iFlux */
(function (global) {
  'use strict';

  var CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: 'ti-apps' },
    { id: 'account', label: 'Tài khoản', icon: 'ti-user' },
    { id: 'billing', label: 'Gói & Thanh toán', icon: 'ti-credit-card' },
    { id: 'platform', label: 'Nền tảng', icon: 'ti-chart-candle' },
    { id: 'membership', label: 'Membership', icon: 'ti-gift' }
  ];

  var ITEMS = [
    {
      id: 'faq-001',
      category: 'account',
      q: 'Làm sao để đăng ký tài khoản iFlux?',
      a: 'Truy cập trang Đăng ký, nhập email và mật khẩu. Bạn có thể bắt đầu với gói Miễn phí ngay sau khi xác nhận email.'
    },
    {
      id: 'faq-002',
      category: 'account',
      q: 'Tôi quên mật khẩu, phải làm gì?',
      a: 'Tại trang Đăng nhập, chọn «Quên mật khẩu» và làm theo hướng dẫn qua email. Liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.'
    },
    {
      id: 'faq-003',
      category: 'account',
      q: 'Có thể đăng nhập trên nhiều thiết bị không?',
      a: 'Có. Một tài khoản có thể đăng nhập trên web và mobile. Gói trả phí áp dụng giới hạn thiết bị đồng thời theo điều khoản từng gói.'
    },
    {
      id: 'faq-004',
      category: 'billing',
      q: 'Tôi có thể đổi gói sau khi đăng ký không?',
      a: 'Có. Bạn có thể nâng cấp hoặc hạ cấp bất kỳ lúc nào. Khi nâng cấp, hệ thống tính phần chênh lệch theo số ngày còn lại trong chu kỳ hiện tại.'
    },
    {
      id: 'faq-005',
      category: 'billing',
      q: 'Phương thức thanh toán nào được hỗ trợ?',
      a: 'iFlux hỗ trợ thẻ Visa/Mastercard, chuyển khoản ngân hàng, MoMo và VNPay. Giao dịch chuyển khoản được Admin xác nhận trong giờ hành chính.'
    },
    {
      id: 'faq-006',
      category: 'billing',
      q: 'Chính sách hoàn tiền như thế nào?',
      a: 'Hoàn tiền 100% trong vòng 7 ngày nếu bạn chưa sử dụng quá 50% quota tháng. Gửi yêu cầu qua support@iflux.vn kèm mã đơn hàng.'
    },
    {
      id: 'faq-007',
      category: 'billing',
      q: 'Gói Elite có thể dùng thử không?',
      a: 'Tổ chức và quỹ đầu tư có thể liên hệ team iFlux để được dùng thử Elite 14 ngày miễn phí.'
    },
    {
      id: 'faq-008',
      category: 'platform',
      q: 'Dữ liệu thị trường cập nhật bao lâu một lần?',
      a: 'Dữ liệu giá và khối lượng cập nhật theo phiên giao dịch HOSE/HNX trong giờ mở cửa. Chỉ số tổng hợp và heatmap làm mới mỗi 1–5 phút tùy loại dữ liệu.'
    },
    {
      id: 'faq-009',
      category: 'platform',
      q: 'Tab Dòng tiền khác gì so với Thị trường?',
      a: 'Dòng tiền tập trung vào xếp hạng dòng tiền ròng, phiên giao dịch và các block điểm số chuyên sâu. Một số nội dung yêu cầu gói Elite.'
    },
    {
      id: 'faq-010',
      category: 'platform',
      q: 'Danh sách theo dõi có giới hạn số mã không?',
      a: 'Gói Miễn phí: 20 mã. Premium: 100 mã. Elite: không giới hạn. Bạn quản lý watchlist tại Nhà của tôi hoặc trang chi tiết mã.'
    },
    {
      id: 'faq-011',
      category: 'platform',
      q: 'Tôi có thể xuất dữ liệu không?',
      a: 'Premium trở lên được xuất bảng xếp hạng và báo cáo cơ bản. Elite hỗ trợ thêm export nâng cao theo từng module.'
    },
    {
      id: 'faq-012',
      category: 'membership',
      q: 'Membership và gói Premium khác nhau thế nào?',
      a: 'Gói Premium/Elite là quyền truy cập tính năng. Membership là chương trình tích điểm, ưu đãi và hỗ trợ ưu tiên dành cho thành viên trung thành.'
    },
    {
      id: 'faq-013',
      category: 'membership',
      q: 'Làm sao tích điểm Membership?',
      a: 'Mỗi giao dịch gói trả phí và hoạt động cộng đồng hợp lệ được cộng điểm. Xem chi tiết hạng và quyền lợi tại trang Membership.'
    },
    {
      id: 'faq-014',
      category: 'membership',
      q: 'Coupon giảm giá áp dụng thế nào?',
      a: 'Nhập mã tại bước Thanh toán trước khi xác nhận đơn. Mỗi mã có điều kiện gói, hạn dùng và số lần sử dụng riêng.'
    }
  ];

  global.IfluxFaqStore = {
    categories: CATEGORIES,
    items: ITEMS,
    list: function (opts) {
      opts = opts || {};
      var list = ITEMS.slice();
      if (opts.category && opts.category !== 'all') {
        list = list.filter(function (item) { return item.category === opts.category; });
      }
      if (opts.q) {
        var q = String(opts.q).toLowerCase();
        list = list.filter(function (item) {
          return item.q.toLowerCase().indexOf(q) >= 0 || item.a.toLowerCase().indexOf(q) >= 0;
        });
      }
      return list;
    },
    categoryLabel: function (id) {
      var cat = CATEGORIES.find(function (c) { return c.id === id; });
      return cat ? cat.label : id;
    }
  };
})(window);
