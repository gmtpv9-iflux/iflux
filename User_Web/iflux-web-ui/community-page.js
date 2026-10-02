/* iFlux User Web — Cộng đồng (mạng xã hội nhà đầu tư).
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * ⚠️ PHASE 0 — SEED DATA (được chủ sản phẩm cho phép hardcode để dàn trang đúng bố cục
 * demo wireframe-cong-dong.png, KHÔNG phải dữ liệu thật). Toàn bộ nội dung trong SEED_*
 * bên dưới là mẫu tĩnh — không gọi API, không ghi DB. Khi Phase 1 (Post API) + Phase 2
 * (Story API) + Phase 3 (Feed ranking) xong, xoá SEED_* và thay loadInitialTimeline() /
 * renderLeftSidebar() / renderRightSidebar() bằng gọi API thật (xem SoT §6 §7 §10) —
 * cấu trúc DOM/CSS (.ifx-com2-*) giữ nguyên, không cần dựng lại layout.
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

  var SEED_POSTS = [
    {
      section: 'following', sectionLabel: 'Từ người bạn theo dõi', sectionIcon: 'users',
      initials: 'NH', name: 'Nguyễn Hoàng', badge: 'Top Contributor', time: '2 giờ trước',
      text: 'Dòng tiền có dấu hiệu quay lại nhóm chứng khoán. Thanh khoản cải thiện rõ rệt trong 2 phiên gần đây, kỳ vọng nhịp hồi ngắn hạn. Anh em theo dõi thêm vùng 1.250 - 1.280 của VN-Index.',
      tags: ['VIX', 'SSI'], likes: 68, comments: 24, shares: 5
    },
    {
      section: 'featured', sectionLabel: 'Bài viết nổi bật', sectionIcon: 'star',
      initials: 'MP', name: 'Mai Phương', badge: '', time: '4 giờ trước',
      text: 'MWG: Lợi nhuận Q1 tăng ấn tượng, mở rộng chuỗi Bách Hóa Xanh. KQKD quý 1 cho thấy tín hiệu phục hồi rõ nét, đặc biệt mảng Bách Hóa Xanh với doanh thu từng cửa hàng tăng trở lại.',
      tags: ['MWG', 'FRT'], likes: 52, comments: 18, shares: 4
    },
    {
      section: 'news', sectionLabel: 'Chia sẻ từ Tin tức', sectionIcon: 'news',
      initials: 'TH', name: 'Trần Thu Hà', badge: '', time: '3 giờ trước',
      text: 'NHNN giữ nguyên lãi suất điều hành, định hướng hỗ trợ tăng trưởng. Theo thông tin từ SBV, mặt bằng lãi suất sẽ tiếp tục được duy trì ở mức hợp lý nhằm hỗ trợ tăng trưởng kinh tế năm nay.',
      tags: ['VCB', 'TCB', 'MBB'], likes: 41, comments: 12, shares: 3
    },
    {
      section: 'ticker', sectionLabel: 'Thảo luận theo mã', sectionIcon: 'chart-candle',
      initials: 'LI', name: 'Long Invest', badge: 'Nhà đầu tư nổi bật', time: '4 giờ trước',
      text: 'HPG đang tích luỹ rất chặt, vùng 27-28 là hỗ trợ mạnh. Kỳ vọng break trong thời gian tới nếu thị trường thuận lợi. Anh em theo dõi thêm tín hiệu từ thanh khoản.',
      tags: ['HPG'], likes: 92, comments: 36, shares: 12
    },
    {
      section: 'story', sectionLabel: 'Chủ đề cộng đồng', sectionIcon: 'tag',
      initials: 'MA', name: 'Minh Anh', badge: 'Chủ đề cộng đồng', time: '3 giờ trước',
      text: 'VN-Index có vượt 1.300 điểm trong tháng này? Theo bạn, VN-Index sẽ vượt mốc 1.300 điểm trong tháng này không? Cùng thảo luận và chia sẻ quan điểm!',
      tags: [], likes: 0, comments: 236, shares: 0, isPoll: true, agree: 412
    }
  ];

  /* ───────────────────────── Helpers UI ───────────────────────── */

  function icon(name, cls) {
    return '<i class="ti ti-' + name + (cls ? ' ' + cls : '') + '" aria-hidden="true"></i>';
  }

  function avatar(initials, size) {
    return '<span class="ifx-avatar ifx-avatar-' + (size || 'md') + ' ifx-avatar-accent">' + esc(initials) + '</span>';
  }

  function sectionHeaderHtml(iconName, title) {
    return (
      '<div class="ifx-com2-sectionhead">' +
        '<span class="ifx-com2-sectionhead__title">' + icon(iconName) + ' ' + esc(title) + '</span>' +
        '<a href="#" class="ifx-com2-link" data-ifx-com2-action="view-all">Xem tất cả ' + icon('chevron-right') + '</a>' +
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
      '<div class="ifx-com2-side">' +
        '<div class="ifx-card ifx-com2-brand">' +
          '<div class="ifx-card-body">' +
            '<div class="ifx-com2-brand__head">' +
              '<div>' +
                '<h3>Cộng đồng iFlux</h3>' +
                '<p>Kết nối nhà đầu tư Việt Nam — chia sẻ tri thức, đồng hành đầu tư.</p>' +
              '</div>' +
              icon('users', 'ifx-com2-brand__icon') +
            '</div>' +
            '<div class="ifx-com2-filtergrid" data-ifx-com2-filters>' +
              '<button type="button" class="ifx-btn ifx-btn-primary is-active" data-filter="for-you">Dành cho iFlux</button>' +
              '<button type="button" class="ifx-btn ifx-btn-secondary" data-filter="following">Đang theo dõi</button>' +
              '<button type="button" class="ifx-btn ifx-btn-secondary" data-filter="trending">Thịnh hành</button>' +
              '<button type="button" class="ifx-btn ifx-btn-secondary" data-filter="latest">Mới nhất</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

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
        '</div>' +
      '</div>'
    );
  }

  /* ───────────────────────── Main — Composer + Feed ───────────────────────── */

  function composerHtml() {
    var user = currentUser();
    var initials = (user && user.display_name ? user.display_name.trim().charAt(0) : 'U').toUpperCase();
    return (
      '<div class="ifx-com2-composer">' +
        '<div class="ifx-com2-composer__row">' +
          avatar(initials) +
          '<input type="text" class="ifx-com2-composer__input" data-ifx-com2-open-composer readonly ' +
            'placeholder="Bạn đang nghĩ gì về thị trường?" aria-label="Tạo bài viết" />' +
        '</div>' +
        '<div class="ifx-com2-composer__actions">' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="write">' + icon('edit') + ' Viết bài</button>' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="share">' + icon('share') + ' Chia sẻ tin</button>' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="tag">' + icon('chart-candle') + ' Gắn mã</button>' +
          '<button type="button" class="ifx-com2-action" data-ifx-com2-action="story">' + icon('tag') + ' Tạo chủ đề</button>' +
          '<button type="button" class="ifx-btn ifx-btn-primary ifx-com2-composer__submit" data-ifx-com2-action="submit">Đăng bài</button>' +
        '</div>' +
      '</div>'
    );
  }

  function postCardHtml(p) {
    var badge = p.badge ? ' <span class="ifx-badge ifx-badge-soft">' + esc(p.badge) + '</span>' : '';
    var tags = p.tags && p.tags.length
      ? '<div class="ifx-com2-post__tags">' + p.tags.map(function (t) { return '<span class="ifx-badge ifx-badge-soft">' + esc(t) + '</span>'; }).join('') + '</div>'
      : '';
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
          '<p class="ifx-com2-post__text">' + esc(p.text) + '</p>' +
          tags +
          stats +
        '</div>' +
      '</article>'
    );
  }

  function feedHtml() {
    var bySection = {};
    var order = [];
    SEED_POSTS.forEach(function (p) {
      if (!bySection[p.section]) { bySection[p.section] = []; order.push(p.section); }
      bySection[p.section].push(p);
    });
    return order.map(function (key) {
      var posts = bySection[key];
      return (
        '<section class="ifx-com2-feedsection">' +
          sectionHeaderHtml(posts[0].sectionIcon, posts[0].sectionLabel) +
          posts.map(postCardHtml).join('') +
        '</section>'
      );
    }).join('');
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
      '<div class="ifx-com2-side">' +
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
          write: 'Viết bài', share: 'Chia sẻ tin', tag: 'Gắn mã', story: 'Tạo chủ đề', submit: 'Đăng bài',
          follow: 'Theo dõi', like: 'Thích', comment: 'Bình luận', agree: 'Đồng tình', more: 'Tuỳ chọn',
          'view-all': 'Xem tất cả', shortcut: 'Lối tắt', invite: 'Mời bạn bè'
        };
        comingSoon(labels[action] || '');
      });
    });
    var openEl = root.querySelector('[data-ifx-com2-open-composer]');
    if (openEl) openEl.addEventListener('click', function () { comingSoon('Viết bài'); });
    var filters = root.querySelector('[data-ifx-com2-filters]');
    if (filters) {
      filters.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          filters.querySelectorAll('button').forEach(function (b) {
            b.classList.remove('is-active', 'ifx-btn-primary');
            b.classList.add('ifx-btn-secondary');
          });
          btn.classList.add('is-active', 'ifx-btn-primary');
          btn.classList.remove('ifx-btn-secondary');
        });
      });
    }
  }

  function render(frame) {
    frame.mainContent.innerHTML = '<div class="ifx-com2-feed">' + composerHtml() + feedHtml() + '</div>';
    if (frame.sidebarContent) frame.sidebarContent.innerHTML = leftSidebarHtml();
    if (frame.rightSidebarContent) frame.rightSidebarContent.innerHTML = rightSidebarHtml();
    bindActions(frame.mainContent);
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
