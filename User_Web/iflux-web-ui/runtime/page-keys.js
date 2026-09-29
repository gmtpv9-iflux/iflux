/**
 * Nhận diện trang User Web từ đường dẫn — nguồn duy nhất cho bootstrap (tải trang) và điều hướng mềm.
 */

/* Trang HTML tĩnh (nội dung nằm trong file HTML) — luôn tải đầy đủ, không điều hướng mềm. */
export var STATIC_PAGES = {
  account: 1,
  checkout: 1,
  comments: 1,
  stockComment: 1,
  newsWrite: 1,
  share: 1
};

/* Chỉ trang cá nhân cần đăng nhập — mọi trang khác khách xem tự do (quyền xem sâu hơn do widget quyết định).
 * Khách bấm vào trang này → hỏi xác nhận trước khi sang trang đăng nhập (IfluxAuth.promptLogin).
 * Trang chủ (home) KHÔNG còn ở đây — khách vào /trang-chu thấy landing phẳng (widgets/home-page). */
export var AUTH_PAGES = {
  account: 1, checkout: 1,
  watchlist: 1, messages: 1,
  newsWrite: 1, stockComment: 1
};

/* Không còn trang nào redirect-quiet-về-Tin-tức riêng cho khách — giữ export rỗng để khỏi vỡ import cũ. */
export var HOME_PAGES = {};

export function pageKeyFromPath(pathname) {
  var raw = pathname || '/';
  var path = raw;
  if (window.IfluxNormalizePath) {
    path = window.IfluxNormalizePath(raw);
  }
  path = String(path || '/').toLowerCase();

  /* Path cụ thể TRƯỚC nhánh rộng — học Phase A (viet-bai) + Ownership Proof (comment/checkout). */
  if (/\/binh-luan(\/|$)/.test(path) || /\/user_web\/comments(\/|$)/.test(path) || /\/comments\/index\.html/.test(path)) {
    return 'comments';
  }
  if (/\/user_web\/stock\/comment/.test(path) || /\/stock\/comment\.html/.test(path)) {
    return 'stockComment';
  }
  if (path.indexOf('/thanh-toan') >= 0 || /\/user_web\/account\/checkout/.test(path) || /\/account\/checkout/.test(path)) {
    return 'checkout';
  }
  /* Viết bài — TRƯỚC nhánh rộng /cong-dong (tránh nhận nhầm pageKey=community → mất AuthGate). */
  if (/\/(?:tin-tuc|cong-dong)\/(viet|write)/.test(path) || /\/user_web\/(?:news|community)\/write/.test(path) || /\/community\/write/.test(path)) {
    return 'newsWrite';
  }
  if (/\/(tin-tuc|cong-dong|community)\/(bai-viet|posts?|story)\b/.test(path) || /\/user_web\/(?:news|community)\/post/.test(path)) {
    return 'article';
  }
  if (/\/(?:tin-tuc|cong-dong)\/(chu-de|tac-gia|danh-muc)(\/|$)/.test(path)) return 'news';

  if (/\/(co-phieu|stocks?)\/[^/]+/.test(path) || /\/user_web\/stock(\/|$)/.test(path)) return 'stock';
  if (/\/(nganh|sectors?)\/[^/]+/.test(path) || /\/user_web\/sector(\/|$)/.test(path)) return 'sector';
  if (/\/(he-sinh-thai|ho-co-phieu|ecosystems?)\/[^/]+/.test(path) || /\/user_web\/family(\/|$)/.test(path)) return 'family';
  if (/\/(cau-chuyen|chu-de|stories)\/[^/]+/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/chi-tiet/.test(path)) return 'cauChuyenDetail';

  if (path.indexOf('/tin-tuc') >= 0 || path.indexOf('/cong-dong') >= 0 || path.indexOf('/community') >= 0) return 'news';
  if (path.indexOf('/dong-tien') >= 0 || path.indexOf('/flow') >= 0) return 'flow';
  if (path.indexOf('/goi-cuoc') >= 0 || path.indexOf('/pricing') >= 0) return 'pricing';
  if (path.indexOf('/trang-chu') >= 0 || path.indexOf('/nha-cua-toi') >= 0 || path.indexOf('/home') >= 0) return 'home';
  if (path.indexOf('/thi-truong') >= 0 || path.indexOf('/market') >= 0) return 'market';
  if (path.indexOf('/hoi-dap') >= 0 || path.indexOf('/faq') >= 0) return 'faq';
  if (path.indexOf('/thanh-vien') >= 0 || path.indexOf('/loyalty') >= 0 || path.indexOf('/membership') >= 0) return 'loyalty';
  if (path.indexOf('/theo-doi') >= 0 || path.indexOf('/watchlist') >= 0) return 'watchlist';
  if (path.indexOf('/tim-kiem') >= 0 || path.indexOf('/search') >= 0) return 'search';
  if (path.indexOf('/tin-nhan') >= 0 || path.indexOf('/messages') >= 0) return 'messages';
  if (path.indexOf('/chia-se') >= 0 || path.indexOf('/share') >= 0 || /\/user_web\/share/.test(path)) {
    return 'share';
  }
  if (path.indexOf('/tai-khoan') >= 0 || path.indexOf('/account') >= 0 || /\/user_web\/account\/profile/.test(path)) {
    return 'account';
  }

  if (/\/(co-phieu|stocks)\/?$/.test(path) || /\/user_web\/stocks(\/|$)/.test(path)) return 'stocks';
  if (/\/(nganh|sectors)\/?$/.test(path) || /\/user_web\/sectors(\/|$)/.test(path)) return 'sectors';
  if (/\/(he-sinh-thai|ho-co-phieu|ecosystems)\/?$/.test(path) || /\/user_web\/ecosystems(\/|$)/.test(path)) return 'ecosystems';
  if (/\/(cau-chuyen|chu-de|stories)\/?$/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/?$/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/index/.test(path)) return 'cauChuyen';

  if (path === '/' || path === '') return 'home';
  return null;
}

/** Trang dựng bằng runtime (App Shell giữ nguyên, chỉ thay nội dung) → điều hướng mềm được. */
export function isSoftPage(pageKey) {
  return !!pageKey && !STATIC_PAGES[pageKey];
}
