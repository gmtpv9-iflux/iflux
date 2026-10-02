/* iFlux User Web — Cộng đồng (mạng xã hội nhà đầu tư).
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * ⚠️ PHASE 0 — SEED DATA (được chủ sản phẩm cho phép hardcode để dàn trang đúng bố cục
 * demo wireframe-cong-dong.png + mô tả nghiệp vụ, KHÔNG phải dữ liệu thật). Toàn bộ nội
 * dung trong SEED_* bên dưới là mẫu tĩnh — không gọi API, không ghi DB. Khi Phase 1
 * (Post API) + Phase 2 (Story API) + Phase 3 (Feed ranking) xong, xoá SEED_* và thay
 * loadInitialTimeline() bằng gọi API thật (xem SoT §6 §7 §10) — cấu trúc DOM/CSS
 * (.ifx-com2-*) giữ nguyên, không cần dựng lại layout.
 *
 * Bố cục main content (trên xuống dưới — theo yêu cầu 2026-10-02/03):
 *   1. Chủ đề HOT (card)
 *   2. Composer ("bạn đang nghĩ gì") — có thể Viết bài / Chia sẻ tin (đăng lại, kèm hoặc
 *      không kèm bình luận) / Gắn thẻ thực thể (Cổ phiếu, Ngành, Hệ sinh thái, Câu chuyện)
 *      / Tạo chủ đề.
 *   3. Tabs lọc feed: Mới nhất (mặc định) · Thịnh hành · Nổi bật
 *   4. Danh sách bài đăng — Phase 1: bài từ người user đang theo dõi + bài có gắn MÃ
 *      CHÍNH là 1 mã user đang quan tâm (watchlist).
 * (Bỏ biểu đồ nến đính kèm theo yêu cầu 2026-10-03 — gắn thẻ thực thể là đủ.)
 * Sidebar trái: Cộng đồng iFlux (giới thiệu) + Mã được thảo luận nhiều + Nhà đầu tư nên
 * theo dõi. Sidebar phải: Tạo chủ đề + Hoạt động bạn theo dõi + Lối tắt nhanh + Mời bạn bè.
 */
(function (global) {
  'use strict';
  if (global.IfluxCommunityPage) return;

  function auth() { return global.IfluxAuth; }
  function currentUser() {
    var a = auth();
    return (a && a.getUser) ? a.getUser() : null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (global.IfxToast && IfxToast.show) IfxToast.show(msg, type || 'info');
  }

  function comingSoon(label) {
    toast((label ? label + ' — ' : '') + 'Tính năng đang hoàn thiện, sẽ sớm ra mắt.', 'info');
  }

  /* ───────────────────────── SEED DATA (Phase 0 — xem ghi chú đầu file) ───────────────────────── */

  /* Loại thực thể có thể gắn thẻ vào bài viết — icon + đường dẫn trang chi tiết. */
  var ENTITY_TYPES = {
    stock: { icon: 'chart-candle', hrefBase: '/co-phieu/' },
    sector: { icon: 'building-factory', hrefBase: '/nganh/' },
    family: { icon: 'stack-2', hrefBase: '/he-sinh-thai/' },
    story: { icon: 'bookmark', hrefBase: '/cau-chuyen/' }
  };

  var SEED_HOT_TOPICS = [
    { title: 'Dòng tiền quay lại nhóm chứng khoán?', tone: 'up', count: 256 },
    { title: 'Bất động sản đã tạo đáy chưa?', tone: 'down', count: 198 },
    { title: 'VN-Index có vượt 1.300 điểm trong tháng này?', tone: 'up', count: 412 },
    { title: 'Cổ phiếu công nghệ sẽ dẫn sóng Q2?', tone: 'up', count: 172 },
    { title: 'Fed có giảm lãi suất trong năm nay?', tone: 'down', count: 145 }
  ];

  var SEED_TICKERS = [
    { code: 'VIX', count: '1.2K thảo luận', pct: '+3.45%', up: true },
    { code: 'FPT', count: '980 thảo luận', pct: '+1.82%', up: true },
    { code: 'HPG', count: '760 thảo luận', pct: '+2.11%', up: true },
    { code: 'VHM', count: '620 thảo luận', pct: '-0.35%', up: false }
  ];

  var SEED_INVESTORS = [
    { initials: 'LI', name: 'Long Invest', badge: 'Nhà đầu tư nổi bật', desc: 'Phân tích vĩ mô & dòng tiền' },
    { initials: 'MP', name: 'Mai Phương', badge: '', desc: 'Đầu tư giá trị' },
    { initials: 'NH', name: 'Nguyễn Hoàng', badge: 'Top Contributor', desc: 'Phân tích kỹ thuật' }
  ];

  var SEED_ACTIVITIES = [
    { name: 'Mai Phương', action: 'đã bình luận bài viết "MWG: Lợi nhuận Q1 tăng ấn tượng..."', time: '7 phút trước' },
    { name: 'Long Invest', action: 'đã đăng bài viết mới "Dòng tiền đang quay lại nhóm..."', time: '1 giờ trước' },
    { name: 'Nguyễn Hoàng', action: 'đã chia sẻ tin tức "NHNN giữ nguyên lãi suất điều hành..."', time: '3 giờ trước' },
    { name: 'Trần Thu Hà', action: 'đã tạo chủ đề mới "Cơ hội nào cho nhóm ngân hàng Q2?"', time: '5 giờ trước' }
  ];

  var SEED_SHORTCUTS = [
    { icon: 'bookmark', label: 'Bài viết đã lưu' },
    { icon: 'tag', label: 'Chủ đề của tôi' },
    { icon: 'heart', label: 'Bài viết đã thích' },
    { icon: 'users', label: 'Thành viên đang theo dõi' },
    { icon: 'bell', label: 'Cài đặt thông báo' }
  ];

  var FILTERS = [
    { key: 'latest', label: 'Mới nhất' },
    { key: 'trending', label: 'Thịnh hành' },
    { key: 'top', label: 'Nổi bật' }
  ];

  /* Post seed — đủ các dạng để demo: (1) bài thường gắn thẻ Cổ phiếu, (2) chia sẻ lại
   * Tin tức KÈM bình luận, (3) chia sẻ lại Tin tức KHÔNG kèm bình luận ("đăng lại") + gắn
   * thẻ Hệ sinh thái, (4) gắn thẻ Cổ phiếu + Ngành cùng lúc, (5) bài dạng chủ đề cộng đồng
   * (poll) gắn thẻ Câu chuyện. */
  var SEED_POSTS = [
    {
      initials: 'NH', name: 'Nguyễn Hoàng', badge: 'Top Contributor', time: '2 giờ trước',
      text: 'Dòng tiền có dấu hiệu quay lại nhóm chứng khoán. Thanh khoản cải thiện rõ rệt trong 2 phiên gần đây, kỳ vọng nhịp hồi ngắn hạn. Anh em theo dõi thêm vùng 1.250 - 1.280 của VN-Index.',
      tags: [{ type: 'stock', code: 'VIX' }, { type: 'stock', code: 'SSI' }],
      likes: 68, comments: 24, shares: 5
    },
    {
      initials: 'TH', name: 'Trần Thu Hà', time: '3 giờ trước',
      text: 'Theo mình đây là tín hiệu khá tích cực cho nhóm ngân hàng trong ngắn hạn.',
      repost: {
        source: 'CafeF', time: '5 giờ trước',
        title: 'NHNN giữ nguyên lãi suất điều hành, định hướng hỗ trợ tăng trưởng',
        excerpt: 'Theo thông tin từ SBV, mặt bằng lãi suất sẽ tiếp tục được duy trì ở mức hợp lý nhằm hỗ trợ tăng trưởng kinh tế năm nay.',
        href: '/tin-tuc/bai-viet/nhnn-giu-nguyen-lai-suat-dieu-hanh'
      },
      tags: [{ type: 'stock', code: 'VCB' }, { type: 'stock', code: 'TCB' }, { type: 'stock', code: 'MBB' }],
      likes: 41, comments: 12, shares: 3
    },
    {
      initials: 'LI', name: 'Long Invest', badge: 'Nhà đầu tư nổi bật', time: '4 giờ trước',
      text: '',
      repost: {
        source: 'Tin tức iFlux', time: '1 giờ trước',
        title: 'Dòng tiền khối ngoại trở lại nhóm chứng khoán trong tuần qua',
        excerpt: 'Thống kê giao dịch tuần cho thấy khối ngoại mua ròng trở lại ở nhiều mã đầu ngành sau 3 tuần bán ròng liên tiếp.',
        href: '/tin-tuc/bai-viet/dong-tien-khoi-ngoai-tro-lai'
      },
      tags: [{ type: 'family', code: 'ho-ngan-hang', label: 'Họ Ngân hàng' }],
      likes: 30, comments: 9, shares: 2
    },
    {
      initials: 'LI', name: 'Long Invest', badge: 'Nhà đầu tư nổi bật', time: '4 giờ trước',
      text: 'HPG đang tích luỹ rất chặt, vùng 27-28 là hỗ trợ mạnh. Kỳ vọng break trong thời gian tới nếu thị trường thuận lợi. Anh em theo dõi thêm tín hiệu từ ngành thép nói chung.',
      tags: [{ type: 'stock', code: 'HPG' }, { type: 'sector', code: 'thep', label: 'Ngành Thép' }],
      likes: 92, comments: 36, shares: 12
    },
    {
      initials: 'MA', name: 'Minh Anh', badge: 'Chủ đề cộng đồng', time: '3 giờ trước',
      text: 'VN-Index có vượt 1.300 điểm trong tháng này? Theo bạn, VN-Index sẽ vượt mốc 1.300 điểm trong tháng này không? Cùng thảo luận và chia sẻ quan điểm!',
      tags: [{ type: 'story', code: 'vn-index-1300', label: 'VN-Index 1.300' }],
      isPoll: true, agree: 412, comments: 236
    }
  ];

  /* ───────────────────────── Helpers UI ───────────────────────── */

  function icon(name, cls) {
    return '<i class="ti ti-' + name + (cls ? ' ' + cls : '') + '" aria-hidden="true"></i>';
  }

  function avatar(initials, size) {
    return '<span class="ifx-avatar ifx-avatar-' + (size || 'md') + ' ifx-avatar-accent">' + esc(initials) + '</span>';
  }

  function sectionHeaderHtml(iconName, title, opts) {
    opts = opts || {};
    var right = opts.noViewAll ? '' : '<a href="#" class="ifx-com2-link" data-ifx-com2-action="view-all">Xem tất cả ' + icon('chevron-right') + '</a>';
    return (
      '<div class="ifx-com2-sectionhead">' +
        '<span class="ifx-com2-sectionhead__title">' + icon(iconName) + ' ' + esc(title) + '</span>' +
        right +
      '</div>'
    );
  }

  /* ───────────────────────── Sidebar trái ───────────────────────── */

  function hotTopicItemHtml(t, idx) {
    var toneBadge = t.tone === 'up'
      ? '<span class="ifx-badge ifx-badge-soft ifx-com2-tone-up">Tích cực</span>'
      : '<span class="ifx-badge ifx-badge-soft ifx-com2-tone-down">Tiêu cực</span>';
    return (
      '<li class="ifx-com2-hotitem">' +
        '<span class="ifx-com2-hotitem__rank">' + (idx + 1) + '</span>' +
        '<span class="ifx-com2-hotitem__title">' + esc(t.title) + '</span>' +
        toneBadge +
        '<span class="ifx-com2-hotitem__count">' + icon('flame') + ' ' + t.count + '</span>' +
      '</li>'
    );
  }

  /* Chủ đề HOT — đặt ở MAIN, phía trên Composer (yêu cầu 2026-10-02). */
  function hotTopicsCardHtml() {
    return (
      '<div class="ifx-card">' +
        sectionHeaderHtml('flame', 'Chủ đề HOT') +
        '<div class="ifx-card-body">' +
          '<div class="ifx-tabs ifx-tabs-segmented ifx-com2-period">' +
            '<button type="button" class="ifx-tab is-active">Ngày</button>' +
            '<button type="button" class="ifx-tab">Tuần</button>' +
            '<button type="button" class="ifx-tab">Tháng</button>' +
          '</div>' +
          '<ol class="ifx-com2-hotlist">' + SEED_HOT_TOPICS.map(hotTopicItemHtml).join('') + '</ol>' +
        '</div>' +
      '</div>'
    );
  }

  function tickerChipHtml(t) {
    return (
      '<div class="ifx-com2-ticker">' +
        '<div class="ifx-com2-ticker__code">' + esc(t.code) + '</div>' +
        '<div class="ifx-com2-ticker__count">' + esc(t.count) + '</div>' +
        '<div class="ifx-com2-ticker__pct ' + (t.up ? 'is-up' : 'is-down') + '">' +
          icon(t.up ? 'trending-up' : 'trending-down') + ' ' + esc(t.pct) +
        '</div>' +
      '</div>'
    );
  }

  function investorItemHtml(u) {
    return (
      '<li class="ifx-com2-investor">' +
        avatar(u.initials, 'sm') +
        '<div class="ifx-com2-investor__who">' +
          '<div class="name">' + esc(u.name) + (u.badge ? ' <span class="ifx-badge ifx-badge-soft">' + esc(u.badge) + '</span>' : '') + '</div>' +
          '<div class="desc">' + esc(u.desc) + '</div>' +
        '</div>' +
        '<button type="button" class="ifx-btn ifx-btn-secondary ifx-btn-sm" data-ifx-com2-action="follow">' + icon('user-plus') + ' Theo dõi</button>' +
      '</li>'
    );
  }

  function leftSidebarHtml() {
    return (
      '<div class="ifx-card ifx-com2-brand">' +
        '<div class="ifx-card-body">' +
          '<div class="ifx-com2-brand__head">' +
            '<div>' +
              '<h3>Cộng đồng iFlux</h3>' +
              '<p>Kết nối nhà đầu tư Việt Nam — chia sẻ tri thức, đồng hành đầu tư.</p>' +
            '</div>' +
            icon('users', 'ifx-com2-brand__icon') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ifx-card">' +
        sectionHeaderHtml('flame', 'Mã được thảo luận nhiều') +
        '<div class="ifx-card-body ifx-com2-tickergrid">' + SEED_TICKERS.map(tickerChipHtml).join('') + '</div>' +
      '</div>' +

      '<div class="ifx-card">' +
        sectionHeaderHtml('users', 'Nhà đầu tư nên theo dõi') +
        '<div class="ifx-card-body">' +
          '<ul class="ifx-com2-investorlist">' + SEED_INVESTORS.map(investorItemHtml).join('') + '</ul>' +
        '</div>' +
      '</div>'
    );
  }

  /* ───────────────────────── Main — Composer + Filter + Feed ───────────────────────── */

  function composerHtml() {
    var user = currentUser();
    var initials = (user && user.display_name ? user.display_name.trim().charAt(0) : 'U').toUpperCase();
    return (
      '<div class="ifx-card ifx-com2-composer">' +
        '<div class="ifx-card-body">' +
          '<div class="ifx-com2-composer__row">' +
            avatar(initials) +
            '<input type="text" class="ifx-com2-composer__input" data-ifx-com2-open-composer readonly ' +
              'placeholder="Bạn đang nghĩ gì về thị trường?" aria-label="Tạo bài viết" />' +
          '</div>' +
          '<div class="ifx-com2-composer__actions">' +
            '<button type="button" class="ifx-com2-action" data-ifx-com2-action="write">' + icon('edit') + ' Viết bài</button>' +
            '<button type="button" class="ifx-com2-action" data-ifx-com2-action="share">' + icon('repeat') + ' Chia sẻ tin</button>' +
            '<button type="button" class="ifx-com2-action" data-ifx-com2-action="tag">' + icon('tags') + ' Gắn thẻ</button>' +
            '<button type="button" class="ifx-com2-action" data-ifx-com2-action="story">' + icon('tag') + ' Tạo chủ đề</button>' +
            '<button type="button" class="ifx-btn ifx-btn-primary ifx-com2-composer__submit" data-ifx-com2-action="submit">Đăng bài</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function filterTabsHtml(active) {
    return (
      '<div class="ifx-tabs ifx-com2-feedfilter" data-ifx-com2-filters>' +
        FILTERS.map(function (f) {
          return '<button type="button" class="ifx-tab' + (f.key === active ? ' is-active' : '') + '" data-filter="' + f.key + '">' + esc(f.label) + '</button>';
        }).join('') +
      '</div>'
    );
  }

  /* Thẻ thực thể đính kèm bài viết — Cổ phiếu / Ngành / Hệ sinh thái / Câu chuyện, bấm
     vào đi thẳng tới trang chi tiết thực thể đó (Phase 0: href thật, điều hướng mềm). */
  function tagChipHtml(t) {
    var meta = ENTITY_TYPES[t.type] || ENTITY_TYPES.stock;
    return (
      '<a href="' + meta.hrefBase + esc(t.code) + '" class="ifx-badge ifx-badge-soft ifx-com2-tagchip" data-ifx-href="soft">' +
        icon(meta.icon) + ' ' + esc(t.label || t.code) +
      '</a>'
    );
  }

  /* Chia sẻ lại bài Tin tức (giống "đăng lại") — có ảnh đại diện bài gốc, responsive:
     ảnh bên trái trên màn rộng, xếp lên trên khi màn hẹp (xem community.css). */
  function repostHtml(r) {
    return (
      '<a href="' + esc(r.href || '#') + '" class="ifx-com2-repost" data-ifx-href="soft">' +
        '<div class="ifx-com2-repost__media" aria-hidden="true">' + icon('news') + '</div>' +
        '<div class="ifx-com2-repost__body">' +
          '<div class="ifx-com2-repost__meta">' + esc(r.source) + ' · ' + esc(r.time) + '</div>' +
          '<div class="ifx-com2-repost__title">' + esc(r.title) + '</div>' +
          '<p class="ifx-com2-repost__excerpt">' + esc(r.excerpt) + '</p>' +
        '</div>' +
      '</a>'
    );
  }

  function postCardHtml(p) {
    var badge = p.badge ? ' <span class="ifx-badge ifx-badge-soft">' + esc(p.badge) + '</span>' : '';
    var tags = p.tags && p.tags.length
      ? '<div class="ifx-com2-post__tags">' + p.tags.map(tagChipHtml).join('') + '</div>'
      : '';
    var body = '';
    if (p.repost && !p.text) {
      body += '<div class="ifx-com2-repost-label">' + icon('repeat') + ' đã chia sẻ 1 bài viết</div>';
    } else if (p.text) {
      body += '<p class="ifx-com2-post__text">' + esc(p.text) + '</p>';
    }
    if (p.repost) body += repostHtml(p.repost);
    var stats = p.isPoll
      ? '<footer class="ifx-com2-post__stats"><button type="button" class="ifx-btn ifx-btn-secondary ifx-btn-sm" data-ifx-com2-action="agree">' + icon('thumb-up') + ' ' + p.agree + ' đồng tình</button>' +
        '<button type="button" data-ifx-com2-action="comment">' + icon('message-circle') + ' ' + p.comments + ' thảo luận</button></footer>'
      : '<footer class="ifx-com2-post__stats">' +
        '<button type="button" data-ifx-com2-action="like">' + icon('heart') + ' ' + p.likes + '</button>' +
        '<button type="button" data-ifx-com2-action="comment">' + icon('message-circle') + ' ' + p.comments + '</button>' +
        '<button type="button" data-ifx-com2-action="share">' + icon('share') + ' ' + p.shares + '</button>' +
        '</footer>';
    return (
      '<article class="ifx-card ifx-com2-post">' +
        '<div class="ifx-card-body">' +
          '<header class="ifx-com2-post__head">' +
            avatar(p.initials) +
            '<div class="ifx-com2-post__who"><div class="name">' + esc(p.name) + badge + '</div><div class="time">' + esc(p.time) + '</div></div>' +
            '<button type="button" class="ifx-btn ifx-btn-secondary ifx-btn-sm" data-ifx-com2-action="follow">+ Theo dõi</button>' +
            '<button type="button" class="ifx-com2-post__more" data-ifx-com2-action="more">' + icon('dots-vertical') + '</button>' +
          '</header>' +
          body +
          tags +
          stats +
        '</div>' +
      '</article>'
    );
  }

  function feedHtml(active) {
    /* Phase 0: cùng 1 danh sách seed cho cả 3 tab lọc (chưa có ranking thật — xem SoT §6). */
    return SEED_POSTS.map(postCardHtml).join('');
  }

  /* ───────────────────────── Sidebar phải ───────────────────────── */

  function activityItemHtml(a) {
    return (
      '<li class="ifx-com2-activity">' +
        '<span class="ifx-com2-activity__dot"></span>' +
        '<div><strong>' + esc(a.name)+ '</strong> ' + esc(a.action) + '<div class="ifx-com2-activity__time">' + esc(a.time) + '</div></div>' +
      '</li>'
    );
  }

  function shortcutItemHtml(s) {
    return (
      '<li class="ifx-com2-shortcut" data-ifx-com2-action="shortcut">' +
        icon(s.icon) + '<span>' + esc(s.label) + '</span>' + icon('chevron-right', 'ifx-com2-shortcut__chevron') +
      '</li>'
    );
  }

  function rightSidebarHtml() {
    return (
      '<div class="ifx-card ifx-com2-cta">' +
        '<div class="ifx-card-body">' +
          icon('plus', 'ifx-com2-cta__icon') +
          '<h4>Tạo chủ đề</h4>' +
          '<p>Tạo chủ đề thị trường để cộng đồng bình chọn và thảo luận.</p>' +
          '<button type="button" class="ifx-btn ifx-btn-primary" data-ifx-com2-action="story">Tạo chủ đề ngay ' + icon('arrow-right') + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="ifx-card">' +
        sectionHeaderHtml('bell', 'Hoạt động từ người bạn theo dõi') +
        '<div class="ifx-card-body"><ul class="ifx-com2-activitylist">' + SEED_ACTIVITIES.map(activityItemHtml).join('') + '</ul></div>' +
      '</div>' +

      '<div class="ifx-card">' +
        '<div class="ifx-card-header"><span class="ifx-com2-sectionhead__title">Lối tắt nhanh</span></div>' +
        '<div class="ifx-card-body"><ul class="ifx-com2-shortcutlist">' + SEED_SHORTCUTS.map(shortcutItemHtml).join('') + '</ul></div>' +
      '</div>' +

      '<div class="ifx-card ifx-com2-invite">' +
        '<div class="ifx-card-body">' +
          '<h4>Tham gia cộng đồng iFlux</h4>' +
          '<p>Chia sẻ góc nhìn, học hỏi kinh nghiệm và cùng nhau đầu tư hiệu quả hơn.</p>' +
          '<button type="button" class="ifx-btn ifx-btn-primary" data-ifx-com2-action="invite">Mời bạn bè tham gia</button>' +
        '</div>' +
      '</div>'
    );
  }

  /* ───────────────────────── Bind + mount ───────────────────────── */

  function bindActions(root) {
    root.querySelectorAll('[data-ifx-com2-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-ifx-com2-action');
        var labels = {
          write: 'Viết bài', share: 'Chia sẻ tin', tag: 'Gắn thẻ', story: 'Tạo chủ đề', submit: 'Đăng bài',
          follow: 'Theo dõi', like: 'Thích', comment: 'Bình luận', agree: 'Đồng tình', more: 'Tuỳ chọn',
          'view-all': 'Xem tất cả', shortcut: 'Lối tắt', invite: 'Mời bạn bè'
        };
        comingSoon(labels[action] || '');
      });
    });
    var openEl = root.querySelector('[data-ifx-com2-open-composer]');
    if (openEl) openEl.addEventListener('click', function () { comingSoon('Viết bài'); });
  }

  function bindFilters(root) {
    var bar = root.querySelector('[data-ifx-com2-filters]');
    if (!bar) return;
    bar.querySelectorAll('.ifx-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        bar.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        /* Phase 0: chưa có ranking thật — đổi tab chỉ đổi trạng thái UI, danh sách seed giữ nguyên. */
      });
    });
  }

  function render(frame) {
    frame.mainContent.innerHTML = hotTopicsCardHtml() + composerHtml() + filterTabsHtml('latest') + feedHtml('latest');
    if (frame.sidebarContent) frame.sidebarContent.innerHTML = leftSidebarHtml();
    if (frame.rightSidebarContent) frame.rightSidebarContent.innerHTML = rightSidebarHtml();
    bindActions(frame.mainContent);
    bindFilters(frame.mainContent);
    if (frame.sidebarContent) bindActions(frame.sidebarContent);
    if (frame.rightSidebarContent) bindActions(frame.rightSidebarContent);
  }

  function init(frame) {
    if (!frame || !frame.mainContent) return;
    render(frame);
  }

  function dispose() { /* không có listener toàn cục cần gỡ ở Phase 0 */ }

  global.IfluxCommunityPage = { init: init, dispose: dispose };
})(window);
