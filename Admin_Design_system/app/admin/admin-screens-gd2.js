/* GĐ2 admin screens — mock data theo 10_ADMIN_ARCHITECTURE_SPEC */
(function (global) {
  'use strict';

  var K = global.AdminPageKit;
  var esc = K ? K.esc : function (s) { return String(s || ''); };

  function rowBtn(label, icon, action) {
    return '<button type="button" class="ix-btn ix-btn-icon" data-adm-row-action="' + esc(action || label) + '" title="' + esc(label) + '"><i class="' + esc(icon) + '" style="font-size:14px"></i></button>';
  }

  var STATUS = {
    pending: { text: 'Chờ duyệt', variant: 'warning' },
    approved: { text: 'Đã duyệt', variant: 'success' },
    rejected: { text: 'Từ chối', variant: 'danger' },
    hidden: { text: 'Đã ẩn', variant: 'primary' },
    open: { text: 'Mở', variant: 'warning' },
    resolved: { text: 'Đã xử lý', variant: 'success' },
    dismissed: { text: 'Bỏ qua', variant: 'primary' },
    active: { text: 'Hoạt động', variant: 'success' },
    inactive: { text: 'Ngưng', variant: 'danger' },
    draft: { text: 'Nháp', variant: 'primary' },
    sent: { text: 'Đã gửi', variant: 'success' },
    scheduled: { text: 'Hẹn giờ', variant: 'warning' },
    success: { text: 'Thành công', variant: 'success' },
    error: { text: 'Lỗi', variant: 'danger' },
    review: { text: 'Cần review', variant: 'warning' }
  };

  var SCREENS = {
    'ADM-COM-001': {
      code: 'ADM-COM-001', title: 'Kiểm duyệt story', tableTitle: 'Story chờ duyệt',
      intro: 'Duyệt / từ chối story do user đề xuất — flow §7.1.',
      stats: [
        { label: 'Chờ duyệt', value: '8', icon: 'ti ti-clock', iconCls: 'warning' },
        { label: 'Duyệt hôm nay', value: '14', icon: 'ti ti-check', iconCls: 'success' },
        { label: 'Từ chối hôm nay', value: '2', icon: 'ti ti-x', iconCls: 'danger' }
      ],
      filters: [
        { id: 'f-st', label: 'Trạng thái', options: [{ value: '', label: 'Tất cả' }, { value: 'pending', label: 'Chờ duyệt' }, { value: 'approved', label: 'Đã duyệt' }] },
        { id: 'f-q', type: 'search', label: 'Tìm kiếm', placeholder: 'Tên story, user...' }
      ],
      columns: [
        { key: 'title', label: 'Story' },
        { key: 'author', label: 'Người gửi' },
        { key: 'submitted', label: 'Gửi lúc', mono: true },
        { key: 'tickers', label: 'Mã liên quan', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { title: 'Điện khí VN sau giá bán điện mới', author: 'nguyen.a', submitted: '14:22', tickers: 'GEX, POW', status: 'pending' },
        { title: 'Họ thép tăng tốc Q3', author: 'tran.b', submitted: '13:05', tickers: 'HPG, NKG', status: 'pending' }
      ],
      rowActions: function () {
        return rowBtn('Duyệt', 'ti ti-check', 'Duyệt') + rowBtn('Từ chối', 'ti ti-x', 'Từ chối') + rowBtn('Xem', 'ti ti-eye', 'Xem');
      }
    },
    'ADM-COM-002': {
      code: 'ADM-COM-002', title: 'Kiểm duyệt bình luận', tableTitle: 'Comment vi phạm / báo cáo',
      intro: 'Ẩn hoặc xóa comment vi phạm chính sách.',
      columns: [
        { key: 'excerpt', label: 'Nội dung' },
        { key: 'story', label: 'Story' },
        { key: 'user', label: 'User', mono: true },
        { key: 'reason', label: 'Lý do' },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { excerpt: 'Spam link ngoài...', story: 'Họ thép Q3', user: 'user_xyz', reason: 'Spam', status: 'open' },
        { excerpt: 'Ngôn từ thiếu chuẩn mực', story: 'VN30 rebalance', user: 'user_abc', reason: 'Toxic', status: 'hidden' }
      ],
      rowActions: function () {
        return rowBtn('Ẩn', 'ti ti-eye-off', 'Ẩn') + rowBtn('Xóa', 'ti ti-trash', 'Xóa');
      }
    },
    'ADM-COM-003': {
      code: 'ADM-COM-003', title: 'Trung tâm báo cáo', tableTitle: 'Hàng đợi báo cáo',
      intro: 'Xử lý báo cáo vi phạm từ user — flow §7.5.',
      stats: [
        { label: 'Báo cáo mở', value: '5', icon: 'ti ti-flag', iconCls: 'warning' },
        { label: 'Đã xử lý tuần này', value: '31', icon: 'ti ti-check', iconCls: 'success' }
      ],
      columns: [
        { key: 'id', label: 'Mã', mono: true },
        { key: 'type', label: 'Loại' },
        { key: 'target', label: 'Đối tượng' },
        { key: 'reporter', label: 'Người báo', mono: true },
        { key: 'created', label: 'Thời gian', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { id: 'RPT-1042', type: 'Comment', target: 'cmt_8821', reporter: 'user_12', created: '14:10', status: 'open' },
        { id: 'RPT-1041', type: 'Story', target: 'story_441', reporter: 'user_88', created: '11:32', status: 'resolved' }
      ],
      rowActions: function () {
        return rowBtn('Xem', 'ti ti-eye', 'Xem') + rowBtn('Xử lý', 'ti ti-gavel', 'Xử lý');
      }
    },
    'ADM-COM-004': {
      code: 'ADM-COM-004', title: 'Quản lý chuyên gia', tableTitle: 'Badge chuyên gia',
      intro: 'Cấp / thu hồi badge chuyên gia cho user đủ điều kiện.',
      columns: [
        { key: 'user', label: 'User', mono: true },
        { key: 'display', label: 'Tên hiển thị' },
        { key: 'badge', label: 'Badge' },
        { key: 'since', label: 'Từ', mono: true },
        { key: 'stories', label: 'Story', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { user: 'expert_hpg', display: 'Nguyễn Văn A', badge: 'Chuyên gia Thép', since: '2025-11-01', stories: '12', status: 'active' },
        { user: 'analyst_vn30', display: 'Trần Thị B', badge: 'Chuyên gia VN30', since: '2026-01-15', stories: '8', status: 'active' }
      ],
      headActions: '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm"><i class="ti ti-plus"></i> Cấp badge</button>',
      rowActions: function () {
        return rowBtn('Thu hồi', 'ti ti-medal-off', 'Thu hồi') + rowBtn('Sửa', 'ti ti-edit', 'Sửa');
      }
    },
    'ADM-NOTIF-003': {
      code: 'ADM-NOTIF-003', title: 'Chiến dịch email', layout: 'form', formTitle: 'Tạo chiến dịch email',
      intro: 'Gửi email hàng loạt theo segment — tách biệt alert thông minh của user.',
      fields: [
        { label: 'Tên chiến dịch', placeholder: 'Premium renewal Q3' },
        { label: 'Segment', value: 'Premium · hết hạn trong 7 ngày' },
        { label: 'Tiêu đề email', placeholder: 'Gia hạn Premium — ưu đãi 15%' },
        { label: 'Nội dung', type: 'textarea', rows: 5, placeholder: 'Nội dung HTML/text...' },
        { label: 'Gửi theo lịch', type: 'toggle', hint: 'Bật để chọn ngày/giờ gửi thay vì gửi ngay.' }
      ],
      secondaryAction: '<button type="button" class="ix-btn ix-btn-outline"><i class="ti ti-send"></i> Gửi thử cho tôi</button>'
    },
    'ADM-META-001': {
      code: 'ADM-META-001', title: 'Kho giao diện (Theme)', tableTitle: 'Theme registry',
      intro: 'CRUD theme macro — không hardcode trong source code.',
      columns: [
        { key: 'slug', label: 'Slug', mono: true },
        { key: 'name', label: 'Tên hiển thị' },
        { key: 'stories', label: 'Số story', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { slug: 'ai-tech', name: 'AI & Công nghệ', stories: '42', status: 'active' },
        { slug: 'infra', name: 'Đầu tư công', stories: '28', status: 'active' },
        { slug: 'upgrade', name: 'Nâng hạng', stories: '15', status: 'inactive' }
      ],
      headActions: '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm"><i class="ti ti-plus"></i> Tạo theme</button>',
      rowActions: function () {
        return rowBtn('Sửa', 'ti ti-edit', 'Sửa') + rowBtn('Ngưng', 'ti ti-ban', 'Ngưng');
      }
    },
    'ADM-META-003': {
      code: 'ADM-META-003', title: 'Vòng đời story', tableTitle: 'Lifecycle stages (chỉ sửa label/mô tả)',
      intro: 'Label và mô tả cho từng stage — không thêm/xóa stage key.',
      columns: [
        { key: 'stage', label: 'Stage', mono: true },
        { key: 'label', label: 'Label (VI)' },
        { key: 'token', label: 'Color token', mono: true },
        { key: 'desc', label: 'Mô tả' }
      ],
      rows: [
        { stage: 'emerging', label: 'Đang nổi lên', token: '--yellow-400', desc: 'Mới xuất hiện, chưa rõ momentum' },
        { stage: 'growing', label: 'Đang tăng trưởng', token: '--green-500', desc: 'Có tín hiệu rõ, momentum tích cực' },
        { stage: 'trending', label: 'Đang trending', token: '--orange-500', desc: 'Hot, nhiều người theo dõi' },
        { stage: 'peak', label: 'Đỉnh', token: '--red-500', desc: 'Đạt cực đại, có thể sắp fade' },
        { stage: 'fading', label: 'Đang suy giảm', token: '--muted', desc: 'Momentum giảm' },
        { stage: 'archived', label: 'Đã lưu trữ', token: '--gray-200', desc: 'Không còn active' }
      ],
      rowActions: function () { return rowBtn('Sửa', 'ti ti-edit', 'Sửa'); }
    },
    'ADM-AI-001': {
      code: 'ADM-AI-001', title: 'Danh mục prompt', tableTitle: 'Prompt registry',
      intro: 'Danh sách prompt versions theo workflow AI Soul / Spine.',
      columns: [
        { key: 'id', label: 'Prompt ID', mono: true },
        { key: 'workflow', label: 'Workflow' },
        { key: 'version', label: 'Version', mono: true },
        { key: 'status', label: 'Status', chipMap: STATUS },
        { key: 'updatedBy', label: 'Cập nhật bởi', mono: true },
        { key: 'updatedAt', label: 'Cập nhật', mono: true }
      ],
      rows: [
        { id: 'soul-summary', workflow: 'Story Summary', version: 'v12', status: 'active', updatedBy: 'admin@iflux.vn', updatedAt: '2026-07-01' },
        { id: 'spine-rank', workflow: 'Ranking Explain', version: 'v5', status: 'draft', updatedBy: 'ops@iflux.vn', updatedAt: '2026-06-28' }
      ],
      rowActions: function () {
        return rowBtn('Xem', 'ti ti-eye', 'Xem') + rowBtn('Active', 'ti ti-check', 'Set Active') + rowBtn('Rollback', 'ti ti-history', 'Rollback');
      }
    },
    'ADM-AI-002': {
      code: 'ADM-AI-002', title: 'Chi tiết prompt', layout: 'sections',
      intro: 'Xem / sửa / rollback version prompt.',
      sections: [
        {
          title: 'Metadata',
          items: [
            { label: 'Prompt ID', value: 'soul-summary' },
            { label: 'Workflow', value: 'Story Summary' },
            { label: 'Version active', value: 'v12' },
            { label: 'Model', value: 'gpt-4o-mini' }
          ]
        },
        {
          title: 'Nội dung (v12)',
          items: [
            { label: 'System', value: 'Bạn là analyst iFlux, tóm tắt story...' },
            { label: 'User template', value: 'Story: {{title}} · Tickers: {{tickers}}' },
            { label: 'Temperature', value: '0.3' }
          ]
        }
      ]
    },
    'ADM-AI-003': {
      code: 'ADM-AI-003', title: 'Nhật ký AI', tableTitle: 'AI request logs',
      intro: 'Request / response / latency / cost theo từng call.',
      filters: [
        { id: 'f-wf', label: 'Workflow', options: [{ value: '', label: 'Tất cả' }, { value: 'summary', label: 'Summary' }, { value: 'rank', label: 'Ranking' }] },
        { id: 'f-st', label: 'Status', options: [{ value: '', label: 'Tất cả' }, { value: 'success', label: 'Success' }, { value: 'error', label: 'Error' }] }
      ],
      columns: [
        { key: 'at', label: 'Timestamp', mono: true },
        { key: 'workflow', label: 'Workflow' },
        { key: 'latency', label: 'Latency (ms)', mono: true },
        { key: 'tokens', label: 'Tokens', mono: true },
        { key: 'cost', label: 'Cost (USD)', mono: true },
        { key: 'status', label: 'Status', chipMap: STATUS },
        { key: 'user', label: 'User', mono: true }
      ],
      rows: [
        { at: '14:05:22', workflow: 'Story Summary', latency: '842', tokens: '1.2k', cost: '0.0021', status: 'success', user: 'u_441' },
        { at: '14:04:11', workflow: 'Ranking Explain', latency: '1204', tokens: '2.1k', cost: '0.0038', status: 'error', user: 'u_882' }
      ],
      rowActions: function () { return rowBtn('JSON', 'ti ti-code', 'Chi tiết'); }
    },
    'ADM-AI-004': {
      code: 'ADM-AI-004', title: 'Chi phí AI', layout: 'sections',
      intro: 'Tổng cost theo ngày/tuần/tháng, breakdown theo model.',
      stats: [
        { label: 'Hôm nay', value: '$42.18', sub: '+8% vs hôm qua', icon: 'ti ti-currency-dollar', iconCls: 'accent' },
        { label: 'Tuần này', value: '$284.50', icon: 'ti ti-calendar', iconCls: 'info' },
        { label: 'Tháng này', value: '$1,120.00', icon: 'ti ti-chart-line', iconCls: 'success' },
        { label: 'Budget cap', value: '$2,000', sub: '56% đã dùng', icon: 'ti ti-alert-circle', iconCls: 'warning' }
      ],
      sections: [
        { title: 'Theo model', items: [{ label: 'gpt-4o-mini', value: '$680 (61%)' }, { label: 'gpt-4o', value: '$320 (29%)' }, { label: 'embedding', value: '$120 (10%)' }] },
        { title: 'Theo workflow', items: [{ label: 'Story Summary', value: '$540' }, { label: 'Ranking Explain', value: '$310' }, { label: 'Moderation assist', value: '$270' }] }
      ]
    },
    'ADM-AI-005': {
      code: 'ADM-AI-005', title: 'Đánh giá chất lượng', tableTitle: 'Quality review queue',
      intro: 'Hallucination reports và bad responses cần review.',
      columns: [
        { key: 'id', label: 'ID', mono: true },
        { key: 'workflow', label: 'Workflow' },
        { key: 'reportedBy', label: 'Báo bởi', mono: true },
        { key: 'issue', label: 'Vấn đề' },
        { key: 'created', label: 'Thời gian', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { id: 'QR-881', workflow: 'Story Summary', reportedBy: 'mod_01', issue: 'Sai số liệu HPG', created: '13:40', status: 'review' },
        { id: 'QR-880', workflow: 'Ranking Explain', reportedBy: 'user_12', issue: 'Hallucination sector', created: '12:15', status: 'resolved' }
      ],
      rowActions: function () {
        return rowBtn('Review', 'ti ti-eye', 'Review') + rowBtn('Dismiss', 'ti ti-x', 'Dismiss');
      }
    },
    'ADM-ANL-001': {
      code: 'ADM-ANL-001', title: 'Phân tích người dùng', layout: 'sections',
      intro: 'DAU/WAU/MAU và retention D1/D7/D30.',
      stats: [
        { label: 'DAU', value: '12,840', sub: '+3.2%', icon: 'ti ti-users', iconCls: 'accent' },
        { label: 'WAU', value: '48,200', icon: 'ti ti-calendar-week', iconCls: 'info' },
        { label: 'MAU', value: '156,000', icon: 'ti ti-calendar-month', iconCls: 'success' },
        { label: 'New 7d', value: '2,410', icon: 'ti ti-user-plus', iconCls: 'warning' }
      ],
      sections: [
        { title: 'Retention', items: [{ label: 'D1', value: '42%' }, { label: 'D7', value: '28%' }, { label: 'D30', value: '16%' }] },
        { title: 'Segment active', items: [{ label: 'Free', value: '118k' }, { label: 'Premium', value: '32k' }, { label: 'Elite', value: '6k' }] }
      ]
    },
    'ADM-ANL-002': {
      code: 'ADM-ANL-002', title: 'Phân tích story', layout: 'sections',
      intro: 'Views, interactions, story growth rate.',
      stats: [
        { label: 'Views 7d', value: '1.2M', icon: 'ti ti-eye', iconCls: 'accent' },
        { label: 'Interactions', value: '84k', icon: 'ti ti-heart', iconCls: 'info' },
        { label: 'Story mới', value: '126', sub: 'tuần này', icon: 'ti ti-news', iconCls: 'success' },
        { label: 'Growth rate', value: '+12%', icon: 'ti ti-trending-up', iconCls: 'warning' }
      ],
      sections: [
        { title: 'Top story', items: [{ label: 'Điện khí VN', value: '42k views' }, { label: 'Họ thép Q3', value: '38k views' }] },
        { title: 'Lifecycle mix', items: [{ label: 'trending', value: '18%' }, { label: 'growing', value: '34%' }, { label: 'emerging', value: '28%' }] }
      ]
    },
    'ADM-ANL-003': {
      code: 'ADM-ANL-003', title: 'Phân tích doanh thu', layout: 'sections',
      intro: 'MRR, ARR, Churn, LTV.',
      stats: [
        { label: 'MRR', value: '₫420M', sub: '+5.1% MoM', icon: 'ti ti-currency-dong', iconCls: 'accent' },
        { label: 'ARR', value: '₫5.04B', icon: 'ti ti-chart-bar', iconCls: 'info' },
        { label: 'Churn', value: '2.8%', icon: 'ti ti-trending-down', iconCls: 'danger' },
        { label: 'LTV', value: '₫2.1M', icon: 'ti ti-coin', iconCls: 'success' }
      ],
      sections: [
        { title: 'Theo gói', items: [{ label: 'Premium', value: '₫280M MRR' }, { label: 'Elite', value: '₫140M MRR' }] },
        { title: 'Thanh toán', items: [{ label: 'Chuyển khoản', value: '62%' }, { label: 'Thẻ', value: '38%' }] }
      ]
    },
    'ADM-ANL-004': {
      code: 'ADM-ANL-004', title: 'Phễu chuyển đổi', layout: 'sections',
      intro: 'Free → Premium conversion tại từng touchpoint.',
      stats: [
        { label: 'Visit → Signup', value: '8.4%', icon: 'ti ti-login', iconCls: 'accent' },
        { label: 'Signup → Active', value: '62%', icon: 'ti ti-user-check', iconCls: 'info' },
        { label: 'Active → Premium', value: '4.2%', icon: 'ti ti-crown', iconCls: 'success' },
        { label: 'Trial → Paid', value: '38%', icon: 'ti ti-receipt', iconCls: 'warning' }
      ],
      sections: [
        { title: 'Touchpoint', items: [{ label: 'Pricing page', value: '2.1% convert' }, { label: 'Paywall block', value: '1.4% convert' }, { label: 'Email nurture', value: '0.7% convert' }] },
        { title: 'A/B test', items: [{ label: 'Pricing v2', value: '+0.3% uplift' }, { label: 'Trial 14d', value: 'đang chạy' }] }
      ]
    }
  };

  function boot() {
    var code = document.body.getAttribute('data-adm-screen');
    if (!code) {
      var stub = document.querySelector('.ix-page-stub__code');
      if (stub) code = stub.textContent.trim();
    }
    if (!code || !SCREENS[code] || !K) return;
    K.mount(SCREENS[code]);
  }

  global.AdminScreensGd2 = { SCREENS: SCREENS, boot: boot };
})(window);
