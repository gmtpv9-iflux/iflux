/* GĐ1 admin screens — mock data theo 10_ADMIN_ARCHITECTURE_SPEC */
(function (global) {
  'use strict';

  var K = global.AdminPageKit;
  var esc = K ? K.esc : function (s) { return String(s || ''); };

  function rowBtn(label, icon) {
    return '<button type="button" class="ix-btn ix-btn-icon" data-adm-row-action title="' + esc(label) + '"><i class="' + esc(icon) + '" style="font-size:14px"></i></button>';
  }

  var STATUS = {
    ok: { text: 'Thành công', variant: 'success' },
    success: { text: 'Thành công', variant: 'success' },
    running: { text: 'Đang chạy', variant: 'info' },
    failed: { text: 'Lỗi', variant: 'danger' },
    draft: { text: 'Nháp', variant: 'primary' },
    sent: { text: 'Đã gửi', variant: 'success' },
    scheduled: { text: 'Hẹn giờ', variant: 'warning' },
    active: { text: 'Hoạt động', variant: 'success' },
    suspended: { text: 'Tạm khóa', variant: 'danger' },
    invited: { text: 'Đã mời', variant: 'warning' },
    open: { text: 'Mở', variant: 'warning' },
    resolved: { text: 'Đã xử lý', variant: 'success' },
    connected: { text: 'Kết nối', variant: 'success' },
    degraded: { text: 'Suy giảm', variant: 'warning' }
  };

  var SCREENS = {
    'ADM-USR-004': {
      code: 'ADM-USR-004', title: 'Xuất dữ liệu khách hàng', layout: 'form', formTitle: 'Yêu cầu xuất GDPR',
      intro: 'Xuất dữ liệu cá nhân theo yêu cầu — BR-ADM-03.',
      fields: [
        { label: 'Email khách hàng', inputType: 'email', placeholder: 'user@iflux.vn' },
        { label: 'Phạm vi', type: 'textarea', rows: 2, value: 'Hồ sơ · Watchlist · Lịch sử đơn hàng' },
        { label: 'Lý do bắt buộc', type: 'textarea', rows: 3, placeholder: 'Yêu cầu từ khách hàng / pháp lý...' }
      ],
      secondaryAction: '<button type="button" class="ix-btn ix-btn-outline"><i class="ti ti-download"></i> Tải mẫu CSV</button>'
    },
    'ADM-MDO-002': {
      code: 'ADM-MDO-002', title: 'Phiên giao dịch', tableTitle: 'Lịch phiên HOSE/HNX/UPCOM',
      intro: 'Cấu hình khung giờ phiên sáng/chiều và ngày nghỉ.',
      filters: [
        { id: 'f-ex', label: 'Sàn', options: [{ value: '', label: 'Tất cả' }, { value: 'HOSE', label: 'HOSE' }, { value: 'HNX', label: 'HNX' }] }
      ],
      columns: [
        { key: 'exchange', label: 'Sàn' },
        { key: 'session', label: 'Phiên' },
        { key: 'open', label: 'Mở cửa', mono: true },
        { key: 'close', label: 'Đóng cửa', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { exchange: 'HOSE', session: 'Sáng', open: '09:00', close: '11:30', status: 'active' },
        { exchange: 'HOSE', session: 'Chiều', open: '13:00', close: '14:45', status: 'active' },
        { exchange: 'HNX', session: 'Sáng', open: '09:00', close: '11:30', status: 'active' }
      ],
      rowActions: function () { return rowBtn('Sửa', 'ti ti-edit'); }
    },
    'ADM-MDO-003': {
      code: 'ADM-MDO-003', title: 'Giám sát tick thiếu', tableTitle: 'Tick thiếu trong phiên',
      intro: 'Theo dõi mã không có tick theo kỳ vọng.',
      stats: [
        { label: 'Mã thiếu tick', value: '12', icon: 'ti ti-alert-triangle', iconCls: 'warning' },
        { label: 'Phiên hôm nay', value: '3', sub: 'Sàn HOSE', icon: 'ti ti-clock', iconCls: 'info' }
      ],
      columns: [
        { key: 'ticker', label: 'Mã', mono: true },
        { key: 'exchange', label: 'Sàn' },
        { key: 'missingSince', label: 'Thiếu từ', mono: true },
        { key: 'expected', label: 'Kỳ vọng', mono: true },
        { key: 'status', label: 'Mức độ', chipMap: { high: { text: 'Cao', variant: 'danger' }, medium: { text: 'Trung bình', variant: 'warning' } } }
      ],
      rows: [
        { ticker: 'HPG', exchange: 'HOSE', missingSince: '10:15', expected: 'Mỗi 3s', status: 'high' },
        { ticker: 'VNM', exchange: 'HOSE', missingSince: '13:42', expected: 'Mỗi 3s', status: 'medium' }
      ]
    },
    'ADM-MDO-004': {
      code: 'ADM-MDO-004', title: 'Sửa thủ công', layout: 'form', formTitle: 'Điều chỉnh giá/khối lượng',
      intro: 'Ghi nhận chỉnh sửa thủ công — yêu cầu xác nhận 2 bước.',
      fields: [
        { label: 'Mã cổ phiếu', placeholder: 'HPG' },
        { label: 'Trường', value: 'Giá khớp' },
        { label: 'Giá trị cũ', inputType: 'number', value: '28500' },
        { label: 'Giá trị mới', inputType: 'number', placeholder: '28550' },
        { label: 'Lý do', type: 'textarea', rows: 3, placeholder: 'Tick lỗi từ nhà cung cấp...' }
      ],
      secondaryAction: '<button type="button" class="ix-btn ix-btn-outline ix-btn-danger"><i class="ti ti-alert-circle"></i> Xác nhận sửa</button>'
    },
    'ADM-DATA-001': {
      code: 'ADM-DATA-001', title: 'Nguồn dữ liệu', tableTitle: 'Data providers',
      columns: [
        { key: 'name', label: 'Nguồn' },
        { key: 'type', label: 'Loại' },
        { key: 'latency', label: 'Độ trễ', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS },
        { key: 'updated', label: 'Cập nhật', mono: true }
      ],
      rows: [
        { name: 'SSI Market Feed', type: 'WebSocket', latency: '42ms', status: 'connected', updated: '14:02:11' },
        { name: 'FiinPro EOD', type: 'REST', latency: '—', status: 'success', updated: '07:00:00' }
      ]
    },
    'ADM-DATA-002': {
      code: 'ADM-DATA-002', title: 'Tác vụ ETL', tableTitle: 'ETL Jobs',
      columns: [
        { key: 'job', label: 'Job' },
        { key: 'schedule', label: 'Lịch', mono: true },
        { key: 'lastRun', label: 'Lần chạy cuối', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS },
        { key: 'duration', label: 'Thời lượng', mono: true },
        { key: 'records', label: 'Bản ghi', mono: true }
      ],
      rows: [
        { job: 'ingest_ticks_hose', schedule: '*/1 * * * *', lastRun: '14:05', status: 'success', duration: '12s', records: '1.2M' },
        { job: 'breadth_aggregate', schedule: '*/5 * * * *', lastRun: '14:00', status: 'running', duration: '—', records: '—' }
      ],
      rowActions: function () { return rowBtn('Log', 'ti ti-file-text') + rowBtn('Chạy', 'ti ti-player-play'); }
    },
    'ADM-DATA-003': {
      code: 'ADM-DATA-003', title: 'Giám sát pipeline', tableTitle: 'Pipeline stages',
      columns: [
        { key: 'stage', label: 'Giai đoạn' },
        { key: 'throughput', label: 'Throughput', mono: true },
        { key: 'lag', label: 'Lag', mono: true },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { stage: 'Kafka ingest', throughput: '18k/s', lag: '120ms', status: 'success' },
        { stage: 'Redis hot store', throughput: '16k/s', lag: '45ms', status: 'success' },
        { stage: 'Postgres EOD', throughput: '2k/min', lag: '890ms', status: 'degraded' }
      ]
    },
    'ADM-DATA-004': {
      code: 'ADM-DATA-004', title: 'Chất lượng dữ liệu', layout: 'sections',
      intro: 'Missing data · Outliers · Reconciliation · Provider health.',
      sections: [
        { title: 'Missing Data', items: [{ label: 'Tick thiếu', value: '12 mã' }, { label: 'Phiên', value: 'HOSE chiều' }] },
        { title: 'Outlier Alerts', items: [{ label: 'Giá lệch > 5%', value: '3 mã' }, { label: 'Khối lượng bất thường', value: '1 mã' }] },
        { title: 'Failed Reconciliation', items: [{ label: 'Redis vs DB', value: '0 lệch' }, { label: 'Lần kiểm tra', value: '14:00' }] },
        { title: 'Provider Health', items: [{ label: 'Uptime 24h', value: '99.8%' }, { label: 'Latency TB', value: '48ms' }] }
      ]
    },
    'ADM-DATA-005': {
      code: 'ADM-DATA-005', title: 'Từ điển dữ liệu', tableTitle: 'Metrics & fields',
      columns: [
        { key: 'key', label: 'Key', mono: true },
        { key: 'name', label: 'Tên hiển thị' },
        { key: 'type', label: 'Kiểu' },
        { key: 'source', label: 'Nguồn' },
        { key: 'owner', label: 'Owner' }
      ],
      rows: [
        { key: 'money_flow_score', name: 'Money Flow Score', type: 'FLOAT', source: 'ALG-MKT-FLOW', owner: 'Data' },
        { key: 'breadth_up', name: 'Mã tăng', type: 'INT', source: 'NORM-BREADTH', owner: 'Market' }
      ]
    },
    'ADM-DATA-006': {
      code: 'ADM-DATA-006', title: 'Đối soát', tableTitle: 'Reconciliation runs',
      columns: [
        { key: 'runAt', label: 'Thời điểm', mono: true },
        { key: 'pair', label: 'Cặp đối soát' },
        { key: 'diff', label: 'Lệch', mono: true },
        { key: 'status', label: 'Kết quả', chipMap: STATUS }
      ],
      rows: [
        { runAt: '2026-07-07 14:00', pair: 'Redis ↔ Postgres EOD', diff: '0', status: 'success' },
        { runAt: '2026-07-07 13:00', pair: 'Feed ↔ Internal', diff: '2 tick', status: 'failed' }
      ]
    },
    'ADM-SUB-002': {
      code: 'ADM-SUB-002', title: 'Người đăng ký gói', tableTitle: 'Active subscribers',
      filters: [
        { id: 'f-tier', label: 'Gói', options: [{ value: '', label: 'Tất cả' }, { value: 'premium', label: 'Premium' }, { value: 'elite', label: 'Elite' }] },
        { type: 'search', id: 'f-q', label: 'Tìm', placeholder: 'Email / tên...' }
      ],
      columns: [
        { key: 'email', label: 'Email' },
        { key: 'plan', label: 'Gói' },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS },
        { key: 'renew', label: 'Gia hạn', mono: true }
      ],
      rows: [
        { email: 'minh@iflux.vn', plan: 'Premium', status: 'active', renew: '2026-08-01' },
        { email: 'lan@example.com', plan: 'Elite', status: 'active', renew: '2026-07-15' }
      ]
    },
    'ADM-SYS-002': {
      code: 'ADM-SYS-002', title: 'Cờ tính năng', tableTitle: 'Feature flags',
      columns: [
        { key: 'key', label: 'Key', mono: true },
        { key: 'description', label: 'Mô tả' },
        { key: 'env', label: 'Môi trường' },
        { key: 'enabled', label: 'Bật', chipMap: { yes: { text: 'Bật', variant: 'success' }, no: { text: 'Tắt', variant: 'danger' } } }
      ],
      rows: [
        { key: 'flow_elite_blocks', description: 'Khối dòng tiền Elite', env: 'staging', enabled: 'yes' },
        { key: 'community_geo_ai', description: 'GEO AI summary', env: 'production', enabled: 'no' }
      ],
      rowActions: function () { return rowBtn('Bật/tắt', 'ti ti-toggle-left'); }
    },
    'ADM-SYS-004': {
      code: 'ADM-SYS-004', title: 'Chế độ bảo trì', layout: 'form', formTitle: 'Maintenance mode',
      fields: [
        { label: 'Bật bảo trì', type: 'toggle' },
        { label: 'Thông báo hiển thị', type: 'textarea', rows: 3, value: 'Hệ thống đang bảo trì. Vui lòng quay lại sau 22:00.' },
        { label: 'Bắt đầu', inputType: 'datetime-local' },
        { label: 'Kết thúc dự kiến', inputType: 'datetime-local' }
      ]
    },
    'ADM-SYS-006': {
      code: 'ADM-SYS-006', title: 'Nhật ký kiểm tra', tableTitle: 'Audit log',
      intro: 'Read-only · Export CSV.',
      filters: [
        { id: 'f-actor', label: 'Actor', options: [{ value: '', label: 'Tất cả' }, { value: 'admin', label: 'Admin' }] },
        { id: 'f-from', label: 'Từ ngày', type: 'date' },
        { id: 'f-to', label: 'Đến ngày', type: 'date' }
      ],
      headActions: '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm"><i class="ti ti-download"></i> CSV</button>',
      columns: [
        { key: 'at', label: 'Thời gian', mono: true },
        { key: 'actor', label: 'Actor' },
        { key: 'action', label: 'Hành động' },
        { key: 'entity', label: 'Entity' },
        { key: 'change', label: 'Before → After' },
        { key: 'ip', label: 'IP', mono: true }
      ],
      rows: [
        { at: '2026-07-07 13:58', actor: 'admin@iflux.vn', action: 'plan.update', entity: 'premium', change: 'price 790k → 830k', ip: '103.154.x.x' },
        { at: '2026-07-07 12:10', actor: 'ops@iflux.vn', action: 'flag.toggle', entity: 'flow_elite', change: 'off → on', ip: '10.0.0.8' }
      ]
    },
    'ADM-SYS-007': {
      code: 'ADM-SYS-007', title: 'Tài khoản admin', tableTitle: 'Admin users',
      headActions: '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm"><i class="ti ti-user-plus"></i> Mời</button>',
      columns: [
        { key: 'email', label: 'Email' },
        { key: 'name', label: 'Tên' },
        { key: 'role', label: 'Vai trò' },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS },
        { key: 'twofa', label: '2FA' },
        { key: 'lastLogin', label: 'Đăng nhập', mono: true }
      ],
      rows: [
        { email: 'super@iflux.vn', name: 'Super Admin', role: 'Super Admin', status: 'active', twofa: 'Bật', lastLogin: 'Hôm nay 09:12' },
        { email: 'ops@iflux.vn', name: 'Ops', role: 'Operator', status: 'invited', twofa: 'Chưa', lastLogin: '—' }
      ],
      rowActions: function () { return rowBtn('Sửa', 'ti ti-edit') + rowBtn('Khóa', 'ti ti-ban'); }
    },
    'ADM-NOTIF-001': {
      code: 'ADM-NOTIF-001', title: 'Thông báo push', tableTitle: 'Push campaigns',
      headActions: '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm"><i class="ti ti-plus"></i> Tạo</button>',
      columns: [
        { key: 'title', label: 'Tiêu đề' },
        { key: 'segment', label: 'Phân khúc' },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS },
        { key: 'sentAt', label: 'Gửi lúc', mono: true },
        { key: 'delivered', label: 'Delivered', mono: true },
        { key: 'opened', label: 'Opened', mono: true }
      ],
      rows: [
        { title: 'Phiên ATC mở cửa', segment: 'Premium', status: 'sent', sentAt: '09:00', delivered: '12.4k', opened: '3.1k' },
        { title: 'Nâng cấp Elite', segment: 'Free', status: 'draft', sentAt: '—', delivered: '—', opened: '—' }
      ]
    },
    'ADM-NOTIF-002': {
      code: 'ADM-NOTIF-002', title: 'Thông báo in-app', tableTitle: 'In-app templates',
      columns: [
        { key: 'code', label: 'Mã', mono: true },
        { key: 'title', label: 'Tiêu đề' },
        { key: 'channel', label: 'Kênh' },
        { key: 'status', label: 'Trạng thái', chipMap: STATUS }
      ],
      rows: [
        { code: 'NOTIF-USER-001', title: 'Đơn chờ duyệt', channel: 'In-app', status: 'active' },
        { code: 'NOTIF-USER-002', title: 'Gói sắp hết hạn', channel: 'In-app', status: 'active' }
      ]
    },
    'ADM-NOTIF-004': {
      code: 'ADM-NOTIF-004', title: 'Lịch sử phát sóng', tableTitle: 'Broadcast history',
      columns: [
        { key: 'at', label: 'Thời gian', mono: true },
        { key: 'channel', label: 'Kênh' },
        { key: 'title', label: 'Tiêu đề' },
        { key: 'audience', label: 'Đối tượng', mono: true },
        { key: 'status', label: 'Kết quả', chipMap: STATUS }
      ],
      rows: [
        { at: '2026-07-06 18:00', channel: 'Push', title: 'Tóm tắt phiên', audience: 'All', status: 'success' }
      ]
    },
    'ADM-META-002': {
      code: 'ADM-META-002', title: 'Loại ngành', tableTitle: 'Sector types',
      columns: [
        { key: 'code', label: 'Mã', mono: true },
        { key: 'name', label: 'Tên' },
        { key: 'count', label: 'Số ngành', mono: true }
      ],
      rows: [
        { code: 'GICS', name: 'GICS Level 1', count: '11' },
        { code: 'IFLUX', name: 'iFlux custom', count: '24' }
      ],
      rowActions: function () { return rowBtn('Sửa', 'ti ti-edit'); }
    },
    'ADM-META-004': {
      code: 'ADM-META-004', title: 'Quản lý enum', tableTitle: 'Enum registry',
      columns: [
        { key: 'group', label: 'Nhóm', mono: true },
        { key: 'key', label: 'Key', mono: true },
        { key: 'values', label: 'Giá trị' },
        { key: 'updated', label: 'Cập nhật', mono: true }
      ],
      rows: [
        { group: 'market', key: 'quote_state', values: 'up, down, ref, ceiling, floor', updated: '2026-06-01' },
        { group: 'subscription', key: 'tier', values: 'free, premium, elite', updated: '2026-05-12' }
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

  global.AdminScreensGd1 = { SCREENS: SCREENS, boot: boot };
})(window);
