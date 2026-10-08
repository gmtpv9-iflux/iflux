/* iFlux User Web — Cộng đồng (mạng xã hội nhà đầu tư).
 * SoT: docs/SoT — Community (Cộng đồng) Architecture V1.md
 *
 * Phase 4 (2026-10-03) — Composer + Feed đã nối vào API thật (community-store.js):
 *   - Feed (Mới nhất/Thịnh hành) đọc GET /api/community/feed, KHÔNG còn SEED_POSTS tĩnh.
 *   - "Chủ đề HOT" đọc GET /api/community/stories?sort=trending&range=..., KHÔNG còn SEED_HOT_TOPICS.
 *   - Composer "Viết bài"/"Gắn thẻ" → modal thật → POST /api/community/posts.
 *   - "Tạo chủ đề" → modal thật → POST /api/community/stories.
 *   - Like bài viết → POST/DELETE /api/interaction/v1/communitypost/:id/like (optimistic UI).
 *   - Tab "Nổi bật" TẠM dùng chung mode=trending với "Thịnh hành" (FeedScore thật là Phase 3 riêng
 *     — SoT §9 — chưa đủ dữ liệu traffic để tách 2 bảng xếp hạng khác nhau).
 *   CHƯA làm (còn seed/coming-soon — không thuộc scope tối thiểu của lượt wiring này):
 *   - "Chia sẻ tin" (cần UI chọn bài Tin tức nguồn → mở Composer pre-filled, SoT §9 Phase 4) và mọi
 *     bài có source_type='news' hiện tại chưa render lại preview bài gốc trong feed.
 *   - Bình luận (mở thread Interaction thật), Share-count, Follow tác giả ngay trong Feed.
 *   - Sidebar "Mã được thảo luận nhiều"/"Nhà đầu tư nên theo dõi" + toàn bộ Sidebar phải ngoài
 *     "Tạo chủ đề" — thuộc Phase 5 (Sidebar widgets, SoT §9), vẫn seed tĩnh.
 *   - Lazy-load cuộn-chạm-đáy (Phase 6) — tạm dùng nút "Xem thêm" với cursor thật.
 *
 * Bố cục main content (trên xuống dưới — theo yêu cầu 2026-10-02/03):
 *   1. Chủ đề HOT (card)
 *   2. Composer ("bạn đang nghĩ gì") — Viết bài / Chia sẻ tin / Gắn thẻ / Tạo chủ đề.
 *   3. Tabs lọc feed: Mới nhất (mặc định) · Thịnh hành · Nổi bật
 *   4. Danh sách bài đăng thật từ GET /api/community/feed.
 * Sidebar trái: Cộng đồng iFlux (giới thiệu) + Mã được thảo luận nhiều + Nhà đầu tư nên theo dõi.
 * Sidebar phải: Tạo chủ đề + Hoạt động bạn theo dõi + Lối tắt nhanh + Mời bạn bè.
 */
(function (global) {
  'use strict';
  if (global.IfluxCommunityPage) return;

  function auth() { return global.IfluxAuth; }
  function currentUser() {
    var a = auth();
    return (a && a.getUser) ? a.getUser() : null;
  }

  function requireAuth() {
    if (currentUser()) return true;
    if (auth() && auth().promptLogin) auth().promptLogin();
    return false;
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

  function store() { return global.IfluxCommunityStore; }

  function timeAgo(iso) {
    if (!iso) return '';
    var d = new Date(iso).getTime();
    if (!d) return '';
    var diff = Math.max(0, Date.now() - d);
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return mins + ' phút trước';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' giờ trước';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + ' ngày trước';
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  /* ───────────────────────── Static seed (Phase 5 scope, chưa nối API) ───────────────────────── */

  var ENTITY_TYPES = {
    stock: { icon: 'chart-candle', hrefBase: '/co-phieu/' },
    sector: { icon: 'building-factory', hrefBase: '/nganh/' },
    family: { icon: 'stack-2', hrefBase: '/he-sinh-thai/' },
    story: { icon: 'bookmark', hrefBase: '/cau-chuyen/' }
  };

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
    { key: 'latest', label: 'Mới nhất', mode: 'latest' },
    { key: 'trending', label: 'Thịnh hành', mode: 'trending' },
    { key: 'top', label: 'Nổi bật', mode: 'trending' }
  ];

  var STORY_RANGES = [
    { key: 'day', label: 'Ngày' },
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' }
  ];

  /* ───────────────────────── State (dữ liệu thật) ───────────────────────── */

  var state = {
    filter: 'latest',
    posts: [],
    nextCursor: null,
    loadingFeed: false,
    trendingRange: 'day',
    trendingTopics: [],
    hotRange: 'week',
    hotTopics: []
  };

  /* ───────────────────────── Helpers UI ───────────────────────── */

  function icon(name, cls) {
    return '<i class="ti ti-' + name + (cls ? ' ' + cls : '') + '" aria-hidden="true"></i>';
  }

  function avatar(initials, size) {
    return '<span class="ifx-avatar ifx-avatar-' + (size || 'md') + ' ifx-avatar-accent">' + esc(initials) + '</span>';
  }

  /* Tiêu đề khối — ĐÚNG khung Widget title dùng chung toàn nền tảng (DS 03_primitives/08_title
     .ifx-widget-title, trong .ifx-card-header — xem design_system/05_templates/00_widget/widget.js
     headHtml()), không còn 1 kiểu "section head" cục bộ riêng cho trang Cộng đồng nữa. */
  function sectionHeaderHtml(iconName, title, opts) {
    opts = opts || {};
    var right = opts.noViewAll ? '' : '<a href="#" class="ifx-com2-link" data-ifx-com2-action="view-all">Xem tất cả ' + icon('chevron-right') + '</a>';
    return (
      '<header class="ifx-card-header">' +
        '<div class="ifx-widget-title"><h3>' + (iconName ? icon(iconName) + ' ' : '') + esc(title) + '</h3></div>' +
        (right ? '<div class="ifx-inline-sm">' + right + '</div>' : '') +
      '</header>'
    );
  }

  /* ───────────────────────── Sidebar trái ───────────────────────── */

  /* Owner 2026-10 (Phase 6, cuối ngày) — tách "Chủ đề HOT" cũ thành 2 khối: "Chủ đề đang thịnh
     hành" (Top 5, Engagement cao nhất — ổn định) và "Top chủ đề mới nổi" (Top 10, Hot Score —
     biến động ngắn hạn). Cả 2 hiển thị Topic (chưa chắc đã có Story/trang chi tiết) nên KHÔNG
     có link bấm — chỉ hiển thị thông tin đọc. */
  function repStocksChipsHtml(representativeStocks) {
    var rep = representativeStocks || {};
    var stocks = rep.stocks || [];
    if (!stocks.length) return '';
    return '<div class="ifx-com2-hotitem__stocks">' + stocks.slice(0, 3).map(function (s) {
      return '<span class="ifx-badge ifx-badge-soft">' + esc(s.ticker) + (s.ticker === rep.leader ? ' 👑' : '') + '</span>';
    }).join(' ') + '</div>';
  }

  function trendingTopicItemHtml(t, idx) {
    return (
      '<li class="ifx-com2-hotitem">' +
        '<span class="ifx-com2-hotitem__rank">' + (idx + 1) + '</span>' +
        '<div class="ifx-com2-hotitem__body">' +
          '<span class="ifx-com2-hotitem__title">' + esc(t.title) + '</span>' +
          repStocksChipsHtml(t.representativeStocks) +
        '</div>' +
        '<span class="ifx-com2-hotitem__count">' + icon('chart-bar') + ' ' + Math.round(t.stats.engagement) + '</span>' +
      '</li>'
    );
  }

  function trendingTopicsCardHtml() {
    var body = state.trendingTopics.length
      ? '<ol class="ifx-com2-hotlist">' + state.trendingTopics.map(trendingTopicItemHtml).join('') + '</ol>'
      : '<p class="ifx-com2-empty">Chưa có chủ đề nào trong khoảng thời gian này.</p>';
    return (
      '<div class="ifx-card" data-ifx-com2-trending>' +
        sectionHeaderHtml('trending-up', 'Chủ đề đang thịnh hành', { noViewAll: true }) +
        '<div class="ifx-card-body">' +
          '<div class="ifx-tabs ifx-tabs-segmented ifx-com2-period" data-ifx-com2-trending-range>' +
            STORY_RANGES.map(function (r) {
              return '<button type="button" class="ifx-tab' + (r.key === state.trendingRange ? ' is-active' : '') + '" data-range="' + r.key + '">' + esc(r.label) + '</button>';
            }).join('') +
          '</div>' +
          body +
        '</div>' +
      '</div>'
    );
  }

  function hotTopicCarouselItemHtml(t) {
    return (
      '<div class="ifx-com2-hotcarousel__item">' +
        '<div class="ifx-com2-hotcarousel__title">' + icon('flame') + ' ' + esc(t.title) + '</div>' +
        repStocksChipsHtml(t.representativeStocks) +
        '<div class="ifx-com2-hotcarousel__score">' + Math.round(t.stats.engagement) + ' điểm</div>' +
      '</div>'
    );
  }

  function hotTopicsCarouselHtml() {
    var body = state.hotTopics.length
      ? '<div class="ifx-com2-hotcarousel">' + state.hotTopics.map(hotTopicCarouselItemHtml).join('') + '</div>'
      : '<p class="ifx-com2-empty">Chưa có chủ đề mới nổi trong khoảng thời gian này.</p>';
    return (
      '<div class="ifx-card" data-ifx-com2-hot>' +
        sectionHeaderHtml('flame', 'Top chủ đề mới nổi', { noViewAll: true }) +
        '<div class="ifx-card-body">' +
          '<div class="ifx-tabs ifx-tabs-segmented ifx-com2-period" data-ifx-com2-hot-range>' +
            STORY_RANGES.map(function (r) {
              return '<button type="button" class="ifx-tab' + (r.key === state.hotRange ? ' is-active' : '') + '" data-range="' + r.key + '">' + esc(r.label) + '</button>';
            }).join('') +
          '</div>' +
          body +
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
        '<header class="ifx-card-header">' +
          '<div class="ifx-widget-title">' +
            '<h3>Cộng đồng iFlux</h3>' +
            '<p>Kết nối nhà đầu tư Việt Nam — chia sẻ tri thức, đồng hành đầu tư.</p>' +
          '</div>' +
          '<div class="ifx-inline-sm">' + icon('users', 'ifx-com2-brand__icon') + '</div>' +
        '</header>' +
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
            '<button type="button" class="ifx-btn ifx-btn-primary ifx-com2-composer__submit" data-ifx-com2-action="write">Đăng bài</button>' +
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

  function tagChipHtml(t) {
    var meta = ENTITY_TYPES[t.type] || ENTITY_TYPES.stock;
    var code = t.code || t.id;
    return (
      '<a href="' + meta.hrefBase + esc(code) + '" class="ifx-badge ifx-badge-soft ifx-com2-tagchip" data-ifx-href="soft">' +
        icon(meta.icon) + ' ' + esc(t.label || code) +
      '</a>'
    );
  }

  function hashtagChipHtml(tag) {
    return '<span class="ifx-badge ifx-badge-soft ifx-com2-tagchip">#' + esc(tag) + '</span>';
  }

  /* Preview bài gốc khi post là "Đăng lại" (post_type=share) — hiển thị THẬT từ source_preview
     (API hydrate), không còn mock data. Owner 2026-10 (VII.7): "Chia sẻ" trên Post Cộng đồng =
     Repost (source_type='post', preview = content + tên tác giả) — khác hẳn "Đăng lại" Tin tức
     (source_type='news', preview = title + ảnh). Không có source_preview (bài gốc đã xoá…) thì ẩn
     khối, không hiện placeholder giả. */
  function newsPreviewHtml(preview, sourceId, sourceType) {
    if (!preview) return '';
    if (sourceType === 'post') {
      if (!preview.content) return '';
      return (
        '<div class="ifx-com2-repost">' +
          '<div class="ifx-com2-repost__media" aria-hidden="true">' + icon('repeat') + '</div>' +
          '<div class="ifx-com2-repost__body">' +
            '<div class="ifx-com2-repost__meta">' + icon('user') + ' ' + esc(preview.author_name || 'Thành viên') + '</div>' +
            '<div class="ifx-com2-repost__title">' + esc(preview.content) + '</div>' +
          '</div>' +
        '</div>'
      );
    }
    if (!preview.title) return '';
    var href = preview.slug ? ('/tin-tuc/bai-viet/' + encodeURIComponent(preview.slug)) : '#';
    return (
      '<a href="' + esc(href) + '" class="ifx-com2-repost" data-ifx-href="soft">' +
        (preview.cover_url
          ? '<div class="ifx-com2-repost__media"><img src="' + esc(preview.cover_url) + '" alt="" loading="lazy" /></div>'
          : '<div class="ifx-com2-repost__media" aria-hidden="true">' + icon('news') + '</div>') +
        '<div class="ifx-com2-repost__body">' +
          '<div class="ifx-com2-repost__meta">' + icon('repeat') + ' Tin tức iFlux</div>' +
          '<div class="ifx-com2-repost__title">' + esc(preview.title) + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  /* Map 1 Post thật (GET /api/community/feed) → dữ liệu hiển thị postCardHtml cần. */
  function mapPost(p) {
    var name = p.author && p.author.display_name ? p.author.display_name : 'Thành viên';
    var tags = (p.stock_tags || []).map(function (code) { return { type: 'stock', code: code }; })
      .concat((p.entity_refs || []).map(function (r) { return { type: r.type, code: r.id, label: r.label }; }));
    return {
      id: p.id,
      initials: name.trim().charAt(0).toUpperCase() || 'U',
      name: name,
      badge: p.author && p.author.tier && p.author.tier !== 'free' ? p.author.tier.toUpperCase() : '',
      time: timeAgo(p.created_at),
      text: p.content || '',
      tags: tags,
      hashtags: p.hashtags || [],
      sourcePreview: (p.source_type === 'news' || p.source_type === 'post') ? p.source_preview : null,
      sourceType: p.source_type,
      sourceId: p.source_id,
      likes: p.stats.likes, dislikes: p.stats.dislikes || 0, comments: p.stats.comments, shares: p.stats.shares,
      liked: !!p.viewer_liked,
      disliked: !!p.viewer_disliked,
      authorId: p.author && p.author.id
    };
  }

  function postCardHtml(p) {
    var badge = p.badge ? ' <span class="ifx-badge ifx-badge-soft">' + esc(p.badge) + '</span>' : '';
    var tags = (p.tags && p.tags.length) || (p.hashtags && p.hashtags.length)
      ? '<div class="ifx-com2-post__tags">' + (p.tags || []).map(tagChipHtml).join('') + (p.hashtags || []).map(hashtagChipHtml).join('') + '</div>'
      : '';
    var body = p.text ? '<p class="ifx-com2-post__text">' + esc(p.text) + '</p>' : '';
    body += newsPreviewHtml(p.sourcePreview, p.sourceId, p.sourceType);
    var stats =
      '<footer class="ifx-com2-post__stats">' +
        '<button type="button" class="' + (p.liked ? 'is-active' : '') + '" data-ifx-com2-action="like" data-post-id="' + esc(p.id) + '">' + icon('heart') + ' <span data-ifx-com2-like-count>' + p.likes + '</span></button>' +
        '<button type="button" class="' + (p.disliked ? 'is-active' : '') + '" data-ifx-com2-action="dislike" data-post-id="' + esc(p.id) + '">' + icon('thumb-down') + ' <span data-ifx-com2-dislike-count>' + p.dislikes + '</span></button>' +
        '<button type="button" data-ifx-com2-action="comment" data-post-id="' + esc(p.id) + '">' + icon('message-circle') + ' ' + p.comments + '</button>' +
        '<button type="button" data-ifx-com2-action="share" data-post-id="' + esc(p.id) + '">' + icon('share') + ' ' + p.shares + '</button>' +
      '</footer>';
    return (
      '<article class="ifx-card ifx-com2-post" data-post-id="' + esc(p.id) + '">' +
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

  function feedHtml() {
    if (state.loadingFeed && !state.posts.length) {
      return '<p class="ifx-com2-empty">Đang tải bài viết…</p>';
    }
    if (!state.posts.length) {
      return '<p class="ifx-com2-empty">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ góc nhìn!</p>';
    }
    var html = state.posts.map(mapPost).map(postCardHtml).join('');
    if (state.nextCursor) {
      html += '<button type="button" class="ifx-btn ifx-btn-secondary ifx-com2-loadmore" data-ifx-com2-action="loadmore">Xem thêm</button>';
    }
    return html;
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
      '<div class="ifx-card">' +
        sectionHeaderHtml('bell', 'Hoạt động từ người bạn theo dõi') +
        '<div class="ifx-card-body"><ul class="ifx-com2-activitylist">' + SEED_ACTIVITIES.map(activityItemHtml).join('') + '</ul></div>' +
      '</div>' +

      '<div class="ifx-card">' +
        sectionHeaderHtml(null, 'Lối tắt nhanh', { noViewAll: true }) +
        '<div class="ifx-card-body"><ul class="ifx-com2-shortcutlist">' + SEED_SHORTCUTS.map(shortcutItemHtml).join('') + '</ul></div>' +
      '</div>' +

      '<div class="ifx-card ifx-com2-invite">' +
        '<div class="ifx-card-body">' +
          '<div class="ifx-cta-title">' +
            '<h4>Tham gia cộng đồng iFlux</h4>' +
            '<p>Chia sẻ góc nhìn, học hỏi kinh nghiệm và cùng nhau đầu tư hiệu quả hơn.</p>' +
          '</div>' +
          '<button type="button" class="ifx-btn ifx-btn-primary" data-ifx-com2-action="invite">Mời bạn bè tham gia</button>' +
        '</div>' +
      '</div>'
    );
  }

  /* ───────────────────────── Modal: Viết bài / Tạo chủ đề (dùng ix-modal-* có sẵn trong DS) ───────────────────────── */

  var modalEl = null;

  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'ix-modal-overlay';
    modalEl.id = 'ifxComposerModal';
    /* .ix-modal-overlay (web.css) không có biến thể ẩn/hiện riêng — tự quản lý display để chắc
       chắn modal ẩn khi chưa mở, bất kể CSS nào đang tải trên trang. */
    modalEl.style.display = 'none';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl || e.target.closest('[data-ifx-modal-close]')) closeModal();
    });
    return modalEl;
  }

  function closeModal() {
    if (modalEl) modalEl.style.display = 'none';
  }

  /* Bình luận/Chia sẻ (Owner 2026-10) — nạp lazy hệ Interaction thật (interaction/boot.js) chỉ khi
     user bấm, không tải sẵn khi vào trang Cộng đồng (nhẹ tải, cùng nguyên tắc hashtag suggest). */
  var interactionReady = null;
  function ensureInteractionReady() {
    if (interactionReady) return interactionReady;
    function loadScript(src) {
      return new Promise(function (resolve, reject) {
        if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error('Không tải được script ' + src)); };
        document.head.appendChild(s);
      });
    }
    var ASSET = '/User_Web/iflux-web-ui/';
    var V = '?v=r20261008c';
    interactionReady = loadScript(ASSET + 'comment-composer.js' + V)
      .then(function () { return loadScript(ASSET + 'interaction/boot.js' + V); })
      .then(function () { return global.IfluxInteractionBoot.ensureForInteractive(); })
      .then(function () { return loadScript(ASSET + 'interaction/comment-modal.js' + V); });
    return interactionReady;
  }

  var ENTITY_TYPE_LABEL = { stock: 'Cổ phiếu', sector: 'Ngành', family: 'Hệ sinh thái', story: 'Câu chuyện' };
  var composerHashtags = [];
  var composerEntityRefs = [];

  function renderComposerChips(form) {
    var htBox = form.querySelector('[data-ifx-com2-hashtag-chips]');
    if (htBox) {
      htBox.innerHTML = composerHashtags.map(function (t, i) {
        return '<span class="ix-chip ix-chip-primary" style="margin:0 6px 6px 0;display:inline-flex;align-items:center;gap:4px">#' + esc(t) +
          '<button type="button" data-remove-hashtag="' + i + '" style="background:none;border:0;cursor:pointer;color:inherit;padding:0;line-height:1"><i class="ti ti-x" style="font-size:12px"></i></button></span>';
      }).join('');
      htBox.querySelectorAll('[data-remove-hashtag]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          composerHashtags.splice(Number(btn.getAttribute('data-remove-hashtag')), 1);
          renderComposerChips(form);
        });
      });
    }
    var enBox = form.querySelector('[data-ifx-com2-entity-chips]');
    if (enBox) {
      enBox.innerHTML = composerEntityRefs.map(function (r, i) {
        return '<span class="ix-chip ix-chip-secondary" style="margin:0 6px 6px 0;display:inline-flex;align-items:center;gap:4px">' +
          esc(ENTITY_TYPE_LABEL[r.type] || r.type) + ': ' + esc(r.label) +
          '<button type="button" data-remove-entity="' + i + '" style="background:none;border:0;cursor:pointer;color:inherit;padding:0;line-height:1"><i class="ti ti-x" style="font-size:12px"></i></button></span>';
      }).join('');
      enBox.querySelectorAll('[data-remove-entity]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          composerEntityRefs.splice(Number(btn.getAttribute('data-remove-entity')), 1);
          renderComposerChips(form);
        });
      });
    }
  }

  function addHashtag(form, raw) {
    var t = String(raw || '').trim().replace(/^#+/, '').toLowerCase();
    if (!t) return;
    if (composerHashtags.length >= 5) { toast('Tối đa 5 hashtag/bài', 'warning'); return; }
    if (composerHashtags.indexOf(t) >= 0) return;
    composerHashtags.push(t);
    renderComposerChips(form);
  }

  /* Gợi ý hashtag/chủ đề — CHỈ gọi khi user bấm vào ô (lazy, không tải sẵn khi mở modal — owner
     yêu cầu nhẹ tải). Debounce 300ms khi gõ tiếp. */
  var hashtagSuggestTimer = null;
  function bindHashtagInput(form) {
    var input = form.querySelector('[data-ifx-com2-hashtag-input]');
    var suggestBox = form.querySelector('[data-ifx-com2-hashtag-suggest]');
    if (!input || !suggestBox) return;
    var loaded = false;
    function runSuggest(q) {
      store().suggestHashtags(q).then(function (data) {
        var items = (data && data.items) || [];
        if (!items.length) { suggestBox.innerHTML = ''; suggestBox.hidden = true; return; }
        suggestBox.innerHTML = items.map(function (it) {
          return '<button type="button" class="ifx-com2-suggest-item" data-suggest-value="' + esc(it.type === 'hashtag' ? it.value : it.label) + '">' +
            esc(it.label) + (it.count ? ' <span style="opacity:.6">(' + it.count + ')</span>' : '') +
          '</button>';
        }).join('');
        suggestBox.hidden = false;
        suggestBox.querySelectorAll('[data-suggest-value]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            addHashtag(form, btn.getAttribute('data-suggest-value'));
            input.value = '';
            suggestBox.hidden = true;
          });
        });
      }).catch(function () { /* im lặng — gợi ý là phụ, không chặn đăng bài */ });
    }
    function onInteract() {
      if (loaded) return;
      loaded = true;
    }
    input.addEventListener('focus', onInteract);
    input.addEventListener('input', function () {
      onInteract();
      clearTimeout(hashtagSuggestTimer);
      var q = input.value.trim();
      if (!q) { suggestBox.hidden = true; return; }
      hashtagSuggestTimer = setTimeout(function () { runSuggest(q); }, 300);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addHashtag(form, input.value);
        input.value = '';
        suggestBox.hidden = true;
      }
    });
    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) return;
      if (e.target === input || suggestBox.contains(e.target)) return;
      suggestBox.hidden = true;
    });
  }

  function bindEntityPicker(form) {
    var typeSel = form.querySelector('[data-ifx-com2-entity-type]');
    var input = form.querySelector('[data-ifx-com2-entity-input]');
    var addBtn = form.querySelector('[data-ifx-com2-entity-add]');
    if (!typeSel || !input || !addBtn) return;
    addBtn.addEventListener('click', function () {
      var type = typeSel.value;
      var raw = String(input.value || '').trim();
      if (!raw) return;
      var id = type === 'stock' ? raw.toUpperCase() : raw;
      if (composerEntityRefs.length >= 10) { toast('Tối đa 10 thẻ thực thể', 'warning'); return; }
      if (composerEntityRefs.some(function (r) { return r.type === type && r.id === id; })) { input.value = ''; return; }
      composerEntityRefs.push({ type: type, id: id, label: id });
      input.value = '';
      renderComposerChips(form);
    });
  }

  /* Composer đủ 4 khả năng (Owner chốt 2026-10): Status (≤1000 từ) / Tin tức đính kèm (qua "Đăng
     lại" trên trang Tin tức — composer này tự viết thì không đính tin) / Thực thể iFlux / Hashtag
     (≤5, gợi ý lazy-load). */
  function openWritePostModal() {
    if (!requireAuth()) return;
    composerHashtags = [];
    composerEntityRefs = [];
    buildModal();
    modalEl.innerHTML =
      '<div class="ix-modal-box">' +
        '<button type="button" class="ix-modal-close" data-ifx-modal-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Viết bài</div>' +
        '<div class="ix-modal-sub">Chia sẻ góc nhìn thị trường, phân tích cổ phiếu hoặc nhận định của bạn.</div>' +
        '<form data-ifx-com2-post-form>' +
          '<div class="ix-form-group">' +
            '<textarea class="ix-input" name="content" rows="4" maxlength="6000" placeholder="Bạn đang nghĩ gì về thị trường? (tối đa ~1000 từ)" required></textarea>' +
          '</div>' +
          '<div class="ix-form-group">' +
            '<label class="ix-label">Quan điểm của bạn (không bắt buộc)</label>' +
            '<div class="ifx-tabs ifx-tabs-segmented" data-ifx-com2-post-sentiment>' +
              '<button type="button" class="ifx-tab" data-value="positive">Tích cực</button>' +
              '<button type="button" class="ifx-tab" data-value="negative">Tiêu cực</button>' +
              '<button type="button" class="ifx-tab" data-value="neutral">Trung lập</button>' +
            '</div>' +
            '<input type="hidden" name="sentiment" value="" />' +
          '</div>' +
          '<div class="ix-form-group">' +
            '<label class="ix-label">Gắn mã cổ phiếu (không bắt buộc)</label>' +
            '<input type="text" class="ix-input" name="stock_tags" placeholder="VD: HPG, VIX (cách nhau bằng dấu phẩy)" />' +
          '</div>' +
          '<div class="ix-form-group">' +
            '<label class="ix-label">Gắn thẻ thực thể iFlux (không bắt buộc)</label>' +
            '<div style="display:flex;gap:8px">' +
              '<select class="ix-input" data-ifx-com2-entity-type style="flex:0 0 140px">' +
                '<option value="stock">Cổ phiếu</option>' +
                '<option value="sector">Ngành</option>' +
                '<option value="family">Hệ sinh thái</option>' +
                '<option value="story">Câu chuyện</option>' +
                '<option value="market_index">Sàn/Chỉ số</option>' +
              '</select>' +
              '<input type="text" class="ix-input" data-ifx-com2-entity-input placeholder="VD: HPG" />' +
              '<button type="button" class="ix-btn ix-btn-outline" data-ifx-com2-entity-add>Thêm</button>' +
            '</div>' +
            '<div data-ifx-com2-entity-chips style="margin-top:8px"></div>' +
          '</div>' +
          '<div class="ix-form-group" style="position:relative">' +
            '<label class="ix-label">Hashtag (tối đa 5 — là cơ sở xác định Chủ đề thịnh hành)</label>' +
            '<input type="text" class="ix-input" data-ifx-com2-hashtag-input placeholder="Gõ rồi Enter, hoặc chọn gợi ý…" />' +
            '<div class="ifx-com2-hashtag-suggest" data-ifx-com2-hashtag-suggest hidden></div>' +
            '<div data-ifx-com2-hashtag-chips style="margin-top:8px"></div>' +
          '</div>' +
          '<div data-ifx-com2-form-error class="ix-alert ix-alert-danger" style="margin-bottom:var(--ifx-space-12);display:none"></div>' +
          '<button type="submit" class="ix-btn ix-btn-primary"><i class="ti ti-send"></i> Đăng bài</button>' +
        '</form>' +
      '</div>';
    modalEl.style.display = 'flex';
    var form = modalEl.querySelector('[data-ifx-com2-post-form]');
    bindHashtagInput(form);
    bindEntityPicker(form);
    /* Sentiment tác giả (II.1) — mặc định KHÔNG chọn, bấm lại nút đang active để bỏ chọn
       (Unspecified). Khác hẳn Like/Dislike cộng đồng — không đồng nhất 2 tín hiệu (II.3). */
    form.querySelectorAll('[data-ifx-com2-post-sentiment] .ifx-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = form.querySelector('input[name=sentiment]');
        var already = btn.classList.contains('is-active');
        form.querySelectorAll('[data-ifx-com2-post-sentiment] .ifx-tab').forEach(function (b) { b.classList.remove('is-active'); });
        if (already) { input.value = ''; return; }
        btn.classList.add('is-active');
        input.value = btn.getAttribute('data-value');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var content = String(fd.get('content') || '').trim();
      var tags = String(fd.get('stock_tags') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!content) return;
      var submitBtn = form.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      store().createPost({
        content: content,
        post_type: tags.length ? 'stock_view' : 'status',
        stock_tags: tags,
        hashtags: composerHashtags,
        entity_refs: composerEntityRefs,
        sentiment: String(fd.get('sentiment') || '').trim() || null
      }).then(function (data) {
        closeModal();
        toast('Đăng bài thành công', 'success');
        state.posts.unshift(data.post);
        renderFeedOnly();
      }).catch(function (err) {
        submitBtn.disabled = false;
        var errEl = modalEl.querySelector('[data-ifx-com2-form-error]');
        if (errEl) { errEl.textContent = err.message || 'Có lỗi xảy ra'; errEl.style.display = ''; }
      });
    });
  }

  /* ───────────────────────── Data loading ───────────────────────── */

  function loadFeed(mode, append) {
    state.loadingFeed = true;
    if (!append) { state.posts = []; state.nextCursor = null; }
    renderFeedOnly();
    return store().getFeed({ mode: mode, cursor: append ? state.nextCursor : null, limit: 10 }).then(function (data) {
      state.loadingFeed = false;
      state.posts = append ? state.posts.concat(data.items) : data.items;
      state.nextCursor = data.next_cursor;
      renderFeedOnly();
    }).catch(function (err) {
      state.loadingFeed = false;
      renderFeedOnly();
      toast(err.message || 'Không tải được bảng tin', 'danger');
    });
  }

  function loadTrendingTopics() {
    return store().getTrendingTopics(state.trendingRange, 5).then(function (data) {
      state.trendingTopics = data.items || [];
      var card = document.querySelector('[data-ifx-com2-trending]');
      if (card) card.outerHTML = trendingTopicsCardHtml();
      bindHotTopics();
    }).catch(function () { /* sidebar phụ — im lặng nếu lỗi, không chặn trang */ });
  }

  function loadHotTopics() {
    return store().getHotTopics(state.hotRange, 10).then(function (data) {
      state.hotTopics = data.items || [];
      var card = document.querySelector('[data-ifx-com2-hot]');
      if (card) card.outerHTML = hotTopicsCarouselHtml();
      bindHotTopics();
    }).catch(function () { /* sidebar phụ — im lặng nếu lỗi, không chặn trang */ });
  }

  var mainEl = null;

  function renderFeedOnly() {
    if (!mainEl) return;
    var list = mainEl.querySelector('[data-ifx-com2-feedlist]');
    if (list) list.innerHTML = feedHtml();
    bindFeedActions();
  }

  /* ───────────────────────── Bind + mount ───────────────────────── */

  function toggleLike(postId, btn) {
    if (!requireAuth()) return;
    var post = state.posts.find(function (p) { return String(p.id) === String(postId); });
    if (!post) return;
    var wasLiked = !!post.viewer_liked;
    var wasDisliked = !!post.viewer_disliked;
    post.viewer_liked = !wasLiked;
    post.viewer_disliked = false;
    post.stats.likes += wasLiked ? -1 : 1;
    if (wasDisliked) post.stats.dislikes = Math.max(0, (post.stats.dislikes || 0) - 1);
    renderFeedOnly();
    var call = wasLiked ? store().unlikePost(postId) : store().likePost(postId);
    call.catch(function (err) {
      post.viewer_liked = wasLiked;
      post.viewer_disliked = wasDisliked;
      post.stats.likes += wasLiked ? 1 : -1;
      if (wasDisliked) post.stats.dislikes = (post.stats.dislikes || 0) + 1;
      renderFeedOnly();
      toast(err.message || 'Không thực hiện được', 'danger');
    });
  }

  /* Dislike (II.2) — loại trừ Like qua cùng 1 row interaction_likes (value=-1/1). */
  function toggleDislike(postId) {
    if (!requireAuth()) return;
    var post = state.posts.find(function (p) { return String(p.id) === String(postId); });
    if (!post) return;
    var wasDisliked = !!post.viewer_disliked;
    var wasLiked = !!post.viewer_liked;
    post.viewer_disliked = !wasDisliked;
    post.viewer_liked = false;
    post.stats.dislikes = (post.stats.dislikes || 0) + (wasDisliked ? -1 : 1);
    if (wasLiked) post.stats.likes = Math.max(0, post.stats.likes - 1);
    renderFeedOnly();
    var call = wasDisliked ? store().unlikePost(postId) : store().dislikePost(postId);
    call.catch(function (err) {
      post.viewer_disliked = wasDisliked;
      post.viewer_liked = wasLiked;
      post.stats.dislikes = (post.stats.dislikes || 0) + (wasDisliked ? 1 : -1);
      if (wasLiked) post.stats.likes += 1;
      renderFeedOnly();
      toast(err.message || 'Không thực hiện được', 'danger');
    });
  }

  /* Bình luận thật (Owner 2026-10) — IfluxCommentModal (interaction/comment-modal.js) dùng CHUNG
     với Tab Bình luận Thực thể (entity-posts-panel.js), tránh viết UI mở Comment 2 nơi. */
  function openCommentModal(postId) {
    if (!requireAuth()) return;
    ensureInteractionReady().then(function () {
      global.IfluxCommentModal.open(postId);
    }).catch(function () {
      toast('Không tải được tính năng Bình luận', 'danger');
    });
  }

  /* Chia sẻ = Repost (Owner 2026-10, VII.7) — tái dùng 100% IfluxRepostModal đã xây cho bài Tin
     tức, chỉ đổi sourceType='post' (Social Post khác — SOURCE_TYPES backend, community-posts
     .service.js) thay vì 'news'. */
  function openShareModal(postId) {
    if (!requireAuth()) return;
    var post = state.posts.find(function (p) { return String(p.id) === String(postId); });
    var previewTitle = post ? String(post.content || '').slice(0, 140) : '';
    function doOpen() {
      IfluxRepostModal.open({ postId: postId, title: previewTitle, sourceType: 'post' });
    }
    if (global.IfluxRepostModal) { doOpen(); return; }
    ensureInteractionReady().then(doOpen).catch(function (err) {
      toast(err.message || 'Không tải được tính năng Chia sẻ', 'danger');
    });
  }

  function bindFeedActions() {
    if (!mainEl) return;
    mainEl.querySelectorAll('[data-ifx-com2-action="like"]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleLike(btn.getAttribute('data-post-id'), btn); });
    });
    mainEl.querySelectorAll('[data-ifx-com2-action="dislike"]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleDislike(btn.getAttribute('data-post-id')); });
    });
    mainEl.querySelectorAll('[data-ifx-com2-action="loadmore"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = FILTERS.find(function (f) { return f.key === state.filter; }).mode;
        loadFeed(mode, true);
      });
    });
    mainEl.querySelectorAll('[data-ifx-com2-action="comment"]').forEach(function (btn) {
      if (btn.__bound) return;
      btn.__bound = true;
      btn.addEventListener('click', function () { openCommentModal(btn.getAttribute('data-post-id')); });
    });
    mainEl.querySelectorAll('[data-ifx-com2-action="share"]').forEach(function (btn) {
      if (btn.__bound) return;
      btn.__bound = true;
      btn.addEventListener('click', function () { openShareModal(btn.getAttribute('data-post-id')); });
    });
    mainEl.querySelectorAll('[data-ifx-com2-action="follow"], [data-ifx-com2-action="more"]').forEach(function (btn) {
      if (btn.__bound) return;
      btn.__bound = true;
      btn.addEventListener('click', function () {
        var labels = { follow: 'Theo dõi', more: 'Tuỳ chọn' };
        comingSoon(labels[btn.getAttribute('data-ifx-com2-action')] || '');
      });
    });
  }

  function bindHotTopics() {
    var trendingBar = document.querySelector('[data-ifx-com2-trending-range]');
    if (trendingBar) {
      trendingBar.querySelectorAll('.ifx-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.trendingRange = btn.getAttribute('data-range');
          loadTrendingTopics();
        });
      });
    }
    var hotBar = document.querySelector('[data-ifx-com2-hot-range]');
    if (hotBar) {
      hotBar.querySelectorAll('.ifx-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.hotRange = btn.getAttribute('data-range');
          loadHotTopics();
        });
      });
    }
  }

  function bindActions(root) {
    root.querySelectorAll('[data-ifx-com2-action]').forEach(function (btn) {
      var action = btn.getAttribute('data-ifx-com2-action');
      if (['write', 'like', 'comment', 'share', 'loadmore'].indexOf(action) >= 0) return;
      btn.addEventListener('click', function () {
        var labels = {
          share: 'Chia sẻ tin', tag: 'Gắn thẻ',
          follow: 'Theo dõi', more: 'Tuỳ chọn',
          'view-all': 'Xem tất cả', shortcut: 'Lối tắt', invite: 'Mời bạn bè'
        };
        if (action === 'tag') { openWritePostModal(); return; }
        comingSoon(labels[action] || '');
      });
    });
    root.querySelectorAll('[data-ifx-com2-action="write"]').forEach(function (btn) {
      btn.addEventListener('click', openWritePostModal);
    });
    var openEl = root.querySelector('[data-ifx-com2-open-composer]');
    if (openEl) openEl.addEventListener('click', openWritePostModal);
  }

  function bindFilters(root) {
    var bar = root.querySelector('[data-ifx-com2-filters]');
    if (!bar) return;
    bar.querySelectorAll('.ifx-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        bar.querySelectorAll('.ifx-tab').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var key = btn.getAttribute('data-filter');
        state.filter = key;
        var mode = FILTERS.find(function (f) { return f.key === key; }).mode;
        loadFeed(mode, false);
      });
    });
  }

  function render(frame) {
    mainEl = frame.mainContent;
    mainEl.innerHTML =
      trendingTopicsCardHtml() + hotTopicsCarouselHtml() + composerHtml() + filterTabsHtml(state.filter) +
      '<div data-ifx-com2-feedlist>' + feedHtml() + '</div>';
    if (frame.sidebarContent) frame.sidebarContent.innerHTML = leftSidebarHtml();
    if (frame.rightSidebarContent) frame.rightSidebarContent.innerHTML = rightSidebarHtml();
    bindActions(mainEl);
    bindFilters(mainEl);
    bindFeedActions();
    bindHotTopics();
    if (frame.sidebarContent) bindActions(frame.sidebarContent);
    if (frame.rightSidebarContent) bindActions(frame.rightSidebarContent);
  }

  function init(frame) {
    if (!frame || !frame.mainContent) return;
    render(frame);
    loadFeed('latest', false);
    loadTrendingTopics();
    loadHotTopics();
  }

  function dispose() {
    mainEl = null;
    closeModal();
  }

  global.IfluxCommunityPage = { init: init, dispose: dispose };
})(window);
