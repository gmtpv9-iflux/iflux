/* Đề xuất tính năng — User Web ↔ Admin (localStorage sandbox) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_feature_suggestions_v1';

  var STATUS_META = {
    new: { label: 'Đề xuất mới', color: 'info' },
    reviewing: { label: 'Đang xem xét', color: 'warning' },
    backlog: { label: 'Đã đưa vào Backlog', color: 'secondary' },
    developing: { label: 'Đang phát triển', color: 'primary' },
    released: { label: 'Đã phát hành', color: 'success' }
  };

  var STATUS_ORDER = ['new', 'reviewing', 'backlog', 'developing', 'released'];

  function isoNow() {
    return new Date().toISOString();
  }

  function uid() {
    return 'feat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function currentUserId() {
    if (global.IfluxAuth && IfluxAuth.currentUserId) return IfluxAuth.currentUserId();
    if (global.IfluxUserStorage && IfluxUserStorage.currentUserId) return IfluxUserStorage.currentUserId();
    return 'guest';
  }

  function currentUserName() {
    var u = global.IfluxAuth && IfluxAuth.getUser ? IfluxAuth.getUser() : null;
    return (u && (u.display_name || u.name || u.username)) || 'Thành viên iFlux';
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function writeRaw(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-feature-suggestions-changed'));
    }
  }

  function normalize(item) {
    if (!item.votes) item.votes = [];
    if (typeof item.voteCount !== 'number') item.voteCount = item.votes.length;
    return item;
  }

  function buildSeed() {
    var seeds = [
      { title: 'Cảnh báo giá & khối lượng theo mã CP', description: 'Thiết lập alert khi giá chạm ngưỡng hoặc KLGD đột biến so với trung bình 20 phiên.', voteCount: 186, status: 'developing' },
      { title: 'Xuất bảng watchlist ra Excel/CSV', description: 'Tải danh sách theo dõi kèm giá, % thay đổi và ghi chú cá nhân để phân tích ngoài iFlux.', voteCount: 172, status: 'backlog' },
      { title: 'So sánh nhiều mã CP trên cùng biểu đồ', description: 'Overlay giá hoặc % thay đổi của 3–5 mã để so sánh tương quan trong một khung nhìn.', voteCount: 158, status: 'reviewing' },
      { title: 'Lịch sự kiện doanh nghiệp (AGM, cổ tức)', description: 'Tích hợp lịch đại hội cổ đông, ngày chốt quyền, ex-dividend ngay trên trang CP.', voteCount: 149, status: 'backlog' },
      { title: 'Dark mode cho toàn bộ User Web', description: 'Giao diện tối giảm mỏi mắt khi theo dõi thị trường buổi tối hoặc nhiều giờ liên tục.', voteCount: 141, status: 'released' },
      { title: 'Widget P/E & ROE trên Dashboard', description: 'Thêm block chỉ số cơ bản cho danh sách theo dõi, cập nhật theo báo cáo tài chính mới nhất.', voteCount: 133, status: 'reviewing' },
      { title: 'Thông báo push khi story đổi lifecycle', description: 'Nhận push/in-app khi story đang theo dõi chuyển sang trending hoặc peak.', voteCount: 127, status: 'new' },
      { title: 'Bộ lọc dòng tiền theo ngưỡng GTGD tối thiểu', description: 'Ẩn mã có thanh khoản thấp khi xem top dòng tiền vào/ra trong tab Dòng tiền.', voteCount: 119, status: 'backlog' },
      { title: 'Ghi chú cá nhân trên từng mã CP', description: 'Sticky note riêng tư gắn với VIC, HPG… hiển thị khi mở trang CP hoặc watchlist.', voteCount: 112, status: 'developing' },
      { title: 'Heatmap theo ngành tùy chỉnh khung thời gian', description: 'Chọn 1D / 1W / 1M / YTD cho bản đồ nhiệt thay vì chỉ phiên hiện tại.', voteCount: 104, status: 'reviewing' },
      { title: 'Tóm tắt AI bài viết cộng đồng dài', description: 'Nút tóm tắt 3–5 ý chính cho bài chuyên gia hoặc phân tích dài trên timeline.', voteCount: 98, status: 'new' },
      { title: 'Đồng bộ watchlist giữa thiết bị', description: 'Đăng nhập trên điện thoại và máy tính với cùng danh sách theo dõi realtime.', voteCount: 91, status: 'released' },
      { title: 'Backtest rule cảnh báo đơn giản', description: 'Thử nghiệm rule alert trên dữ liệu lịch sử 30/90 ngày trước khi bật thật.', voteCount: 86, status: 'new' },
      { title: 'Chia sẻ layout Dashboard qua link', description: 'Xuất hoặc nhân bản bố cục tiện ích từ thành viên khác (chỉ widget, không dữ liệu riêng tư).', voteCount: 79, status: 'reviewing' },
      { title: 'Biểu đồ foreign net mua/bán theo tuần', description: 'Khối ngoại tích lũy theo tuần/tháng trên trang Thị trường hoặc sidebar Dòng tiền.', voteCount: 74, status: 'backlog' },
      { title: 'Phím tắt ⌘K mở rộng lệnh nhanh', description: 'Gõ lệnh: thêm watchlist, tạo alert, chuyển tab… ngay từ palette tìm kiếm.', voteCount: 68, status: 'new' },
      { title: 'Lọc bình luận theo tier (Premium/Elite)', description: 'Tuỳ chọn chỉ xem bình luận từ thành viên Premium trở lên trên trang CP.', voteCount: 61, status: 'new' },
      { title: 'Widget tin tức RSS theo mã đang xem', description: 'Tự động lọc headline liên quan ticker hiện tại trên trang cổ phiếu.', voteCount: 55, status: 'developing' },
      { title: 'Xem lại snapshot Dashboard cuối phiên', description: 'Lưu ảnh chụp số liệu KLGD/GTGD và top biến động lúc 14:45 mỗi ngày.', voteCount: 47, status: 'new' },
      { title: 'Tích hợp lịch kinh tế vĩ mô Việt Nam', description: 'Nhắc lịch CPI, tín dụng, họp NHNN… trên tab Thị trường và Dashboard.', voteCount: 42, status: 'new' }
    ];

    var now = isoNow();
    return {
      suggestions: seeds.map(function (s, i) {
        return normalize({
          id: 'feat-seed-' + (i + 1),
          title: s.title,
          description: s.description,
          status: s.status,
          votes: [],
          voteCount: s.voteCount,
          createdBy: { id: 'system', name: 'iFlux' },
          createdAt: now,
          updatedAt: now,
          adminNote: ''
        });
      })
    };
  }

  function ensureData() {
    var data = readRaw();
    if (!data || !Array.isArray(data.suggestions)) {
      data = buildSeed();
      writeRaw(data);
    }
    return data;
  }

  function sortByVotes(list) {
    return list.slice().sort(function (a, b) {
      var d = (b.voteCount || 0) - (a.voteCount || 0);
      if (d !== 0) return d;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  }

  function listSuggestions(opts) {
    opts = opts || {};
    var list = ensureData().suggestions.map(normalize);
    if (opts.status) list = list.filter(function (s) { return s.status === opts.status; });
    if (opts.keyword) {
      var q = String(opts.keyword).toLowerCase();
      list = list.filter(function (s) {
        return (s.title || '').toLowerCase().indexOf(q) >= 0
          || (s.description || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    list = sortByVotes(list);
    if (opts.limit) list = list.slice(0, opts.limit);
    return clone(list);
  }

  function getSuggestion(id) {
    var found = ensureData().suggestions.find(function (s) { return s.id === id; });
    return found ? clone(normalize(found)) : null;
  }

  function createSuggestion(payload) {
    payload = payload || {};
    var title = String(payload.title || '').trim();
    var description = String(payload.description || '').trim();
    if (!title) throw new Error('Tên đề xuất là bắt buộc');
    if (!description) throw new Error('Mô tả & kỳ vọng là bắt buộc');

    var data = ensureData();
    var item = normalize({
      id: uid(),
      title: title,
      description: description,
      status: 'new',
      votes: [],
      voteCount: 0,
      createdBy: {
        id: payload.userId || currentUserId(),
        name: payload.userName || currentUserName()
      },
      createdAt: isoNow(),
      updatedAt: isoNow(),
      adminNote: ''
    });
    data.suggestions.unshift(item);
    writeRaw(data);
    return clone(item);
  }

  function setStatus(id, status, adminNote) {
    if (!STATUS_META[status]) throw new Error('Trạng thái không hợp lệ');
    var data = ensureData();
    var item = data.suggestions.find(function (s) { return s.id === id; });
    if (!item) return null;
    item.status = status;
    item.updatedAt = isoNow();
    if (typeof adminNote === 'string') item.adminNote = adminNote;
    writeRaw(data);
    return clone(normalize(item));
  }

  function hasVoted(id, userId) {
    userId = userId || currentUserId();
    var item = ensureData().suggestions.find(function (s) { return s.id === id; });
    if (!item) return false;
    normalize(item);
    return item.votes.indexOf(userId) >= 0;
  }

  function toggleVote(id, userId) {
    userId = userId || currentUserId();
    if (!userId || userId === 'guest') throw new Error('Vui lòng đăng nhập để ủng hộ');

    var data = ensureData();
    var item = data.suggestions.find(function (s) { return s.id === id; });
    if (!item) return null;
    normalize(item);

    var idx = item.votes.indexOf(userId);
    if (idx >= 0) {
      item.votes.splice(idx, 1);
      item.voteCount = Math.max(0, (item.voteCount || 0) - 1);
    } else {
      item.votes.push(userId);
      item.voteCount = (item.voteCount || 0) + 1;
    }
    item.updatedAt = isoNow();
    writeRaw(data);
    return clone(normalize(item));
  }

  function stats() {
    var list = ensureData().suggestions;
    var byStatus = {};
    STATUS_ORDER.forEach(function (k) { byStatus[k] = 0; });
    list.forEach(function (s) {
      if (byStatus[s.status] !== undefined) byStatus[s.status]++;
    });
    return {
      total: list.length,
      totalVotes: list.reduce(function (sum, s) { return sum + (s.voteCount || 0); }, 0),
      byStatus: byStatus
    };
  }

  global.IfluxFeatureSuggestionsStore = {
    STATUS_META: STATUS_META,
    STATUS_ORDER: STATUS_ORDER,
    list: listSuggestions,
    get: getSuggestion,
    create: createSuggestion,
    setStatus: setStatus,
    toggleVote: toggleVote,
    hasVoted: hasVoted,
    stats: stats,
    currentUserId: currentUserId
  };
})(window);
