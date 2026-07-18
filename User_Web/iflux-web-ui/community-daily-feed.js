/* Daily Feed — khối tin theo ngày (Tin tức + Chuyên gia nổi bật + Bài viết chuyên gia)
   Dùng chung cho trang Cộng đồng và trang chi tiết (CP / Ngành / Hệ sinh thái / Chủ đề).
   Chỉ dùng class/token có sẵn trong Design System User Web (ifx-com-*, --ifx-*, --ix-*). */
(function (global) {
  'use strict';

  function st() { return global.IfluxCommunityStore; }
  function ui() { return global.IfluxCommunityUI; }
  function profiles() { return global.IfluxProfileUsersStore; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function num(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('vi-VN');
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'E').trim().slice(0, 2).toUpperCase();
  }

  function profileHref(userId) {
    if (global.IfluxProfileLinks && IfluxProfileLinks.profileHref) {
      return IfluxProfileLinks.profileHref(userId, { base: '../account/' });
    }
    return '../account/profile.html?user=' + encodeURIComponent(userId);
  }

  function resolveUser(row) {
    /* Dữ liệu tác giả bài viết (row) là nguồn chuẩn cho tên + cấp thành viên;
       thư mục hồ sơ công khai chỉ dùng để bổ khuyết khi row thiếu. */
    var name = row.displayName;
    var tierLabel = row.tierLabel;
    if ((!name || String(name).trim().length < 2) && profiles() && profiles().getPublic) {
      var u = profiles().getPublic(row.userId);
      if (u && u.display_name) name = u.display_name;
      if (!tierLabel && u && u.tier_label) tierLabel = u.tier_label;
    }
    return { displayName: name || 'Chuyên gia', tierLabel: tierLabel || 'Elite' };
  }

  /* ── Nhóm bài theo ngày (đăng) ────────────────────────── */
  function startOfDay(iso) {
    var d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function dayKey(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function dayLabel(iso) {
    var start = startOfDay(iso);
    var today = startOfDay(Date.now());
    var oneDay = 86400000;
    if (start === today) return 'Hôm nay';
    if (start === today - oneDay) return 'Hôm qua';
    try {
      return new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dayKey(iso);
    }
  }

  function sortDesc(a, b) {
    return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
  }

  function buildDays(filter) {
    if (!st()) return [];
    var out = [];
    var map = {};
    function add(list, type) {
      list.forEach(function (p) {
        var iso = p.published_at || p.created_at;
        var k = dayKey(iso);
        if (!map[k]) {
          map[k] = { key: k, label: dayLabel(iso), ts: startOfDay(iso), news: [], expert: [] };
          out.push(map[k]);
        }
        map[k][type].push(p);
      });
    }
    add(st().getPosts(Object.assign({}, filter, { contentType: st().CONTENT_TYPE_NEWS })), 'news');
    add(st().getPosts(Object.assign({}, filter, { contentType: st().CONTENT_TYPE_EXPERT })), 'expert');
    out.sort(function (a, b) { return b.ts - a.ts; });
    out.forEach(function (d) { d.news.sort(sortDesc); d.expert.sort(sortDesc); });
    return out;
  }

  /* ── Tin/bài nổi bật trong ngày ───────────────────────── */
  function likeCount(p) { return (p.stats && p.stats.likes) || 0; }

  function pickFeatured(list, preferAdminFlag) {
    if (!list || !list.length) return null;
    var pool = list;
    if (preferAdminFlag) {
      var flagged = list.filter(function (p) { return p.is_featured || p.featured; });
      if (flagged.length) pool = flagged;
    }
    var best = pool[0];
    var bestLikes = likeCount(best);
    pool.forEach(function (p) {
      var l = likeCount(p);
      if (l > bestLikes) { best = p; bestLikes = l; }
    });
    return best;
  }

  /* ── Section: nổi bật (trái) + còn lại (phải) + lưới 3/row (dưới) ── */
  function heroGridSection(opts) {
    var list = opts.list || [];
    if (!list.length) return '';
    if (!ui() || !ui().featuredPostHtml) return '';
    var featured = opts.featured || list[0];
    var rest = list.filter(function (p) { return p !== featured; });
    var side = rest.slice(0, 4);
    var grid = rest.slice(4);

    var sideHtml = side.length
      ? side.map(function (p) { return ui().compactPostHtml(p); }).join('')
      : '<div class="ifx-com-side-empty">Chưa có tin khác trong ngày.</div>';

    var heroHtml =
      '<div class="ifx-com-hero">' +
        '<div class="ifx-com-hero__featured">' + ui().featuredPostHtml(featured) + '</div>' +
        '<div class="ifx-com-hero__side">' + sideHtml + '</div>' +
      '</div>';

    var gridHtml = grid.length
      ? '<div class="ifx-com-feed-grid">' + grid.map(function (p) { return ui().postCardHtml(p); }).join('') + '</div>'
      : '';

    return (
      '<section class="ifx-com-list-section ' + (opts.sectionMod || '') + '">' +
        '<div class="ifx-com-list-head">' +
          '<h2 class="ifx-com-list-title"><i class="ti ' + opts.icon + '"></i> ' + esc(opts.title) + '</h2>' +
          '<span class="ifx-com-section-hint">' + list.length + ' bài</span>' +
        '</div>' +
        heroHtml + gridHtml +
      '</section>'
    );
  }

  /* ── Chuyên gia nổi bật: spotlight (1/3) + list (2/3) ──── */
  function starsHtml(rating) {
    var full = Math.floor(rating);
    var half = (rating - full) >= 0.5;
    var html = '';
    for (var i = 1; i <= 5; i++) {
      if (i <= full) html += '<i class="ti ti-star-filled"></i>';
      else if (i === full + 1 && half) html += '<i class="ti ti-star-half-filled"></i>';
      else html += '<i class="ti ti-star"></i>';
    }
    return '<span class="ifx-com-expert-stars">' + html + '</span>';
  }

  function spotStat(label, value) {
    return (
      '<div class="ifx-com-expert-spotlight__stat">' +
        '<strong>' + value + '</strong>' +
        '<small>' + esc(label) + '</small>' +
      '</div>'
    );
  }

  function spotlightHtml(row) {
    if (!row) return '';
    var u = resolveUser(row);
    return (
      '<a class="ifx-com-expert-spotlight" href="' + esc(profileHref(row.userId)) + '">' +
        '<span class="ifx-com-expert-spotlight__avatar">' + esc(initials(u.displayName)) + '</span>' +
        '<span class="ix-chip ix-chip-warning ix-chip-sm ifx-com-expert-spotlight__tier">' + esc(u.tierLabel) + '</span>' +
        '<strong class="ifx-com-expert-spotlight__name">' + esc(u.displayName) + '</strong>' +
        '<span class="ifx-com-expert-spotlight__rating">' + starsHtml(row.rating) + ' <b>' + row.rating.toFixed(1) + '</b></span>' +
        '<div class="ifx-com-expert-spotlight__stats">' +
          spotStat('Bài viết', num(row.postCount)) +
          spotStat('Yêu thích', num(row.totalLikes)) +
          spotStat('Theo dõi', num(row.totalFollows)) +
          spotStat('Thành viên', num(row.affiliateMembers)) +
        '</div>' +
      '</a>'
    );
  }

  function richRowHtml(row, idx) {
    var u = resolveUser(row);
    return (
      '<a class="ifx-com-expert-row ifx-com-expert-row--rich" href="' + esc(profileHref(row.userId)) + '">' +
        '<span class="ifx-com-expert-row__rank">#' + (idx + 1) + '</span>' +
        '<span class="ix-avatar-sm ifx-com-expert-row__avatar">' + esc(initials(u.displayName)) + '</span>' +
        '<span class="ifx-com-expert-row__body">' +
          '<span class="ifx-com-expert-row__line1">' +
            '<strong>' + esc(u.displayName) + '</strong>' +
            '<span class="ifx-com-expert-row__members"><i class="ti ti-users"></i> ' + num(row.affiliateMembers) + ' thành viên</span>' +
          '</span>' +
          '<span class="ifx-com-expert-row__line2">' +
            '<span title="Bài viết"><i class="ti ti-article"></i> ' + num(row.postCount) + '</span>' +
            '<span title="Yêu thích"><i class="ti ti-heart"></i> ' + num(row.totalLikes) + '</span>' +
            '<span title="Theo dõi"><i class="ti ti-user-plus"></i> ' + num(row.totalFollows) + '</span>' +
            starsHtml(row.rating) +
          '</span>' +
        '</span>' +
      '</a>'
    );
  }

  function expertsSection(filter) {
    if (!st() || !st().getExpertLeaderboard) return '';
    var rows = st().getExpertLeaderboard(6, filter);
    if (!rows.length) return '';
    var spotlight = rows[0];
    var rest = rows.slice(1);
    var listHtml = rest.length
      ? rest.map(function (r, i) { return richRowHtml(r, i + 1); }).join('')
      : '<div class="ifx-com-side-empty">Chưa có chuyên gia khác.</div>';
    return (
      '<section class="ifx-com-experts-leaders">' +
        '<div class="ifx-com-list-head">' +
          '<h2 class="ifx-com-list-title"><i class="ti ti-award"></i> Chuyên gia nổi bật</h2>' +
          '<span class="ifx-com-section-hint">Xếp theo tổng lượt thích bài viết</span>' +
        '</div>' +
        '<div class="ifx-com-experts-layout">' +
          '<div class="ifx-com-experts-layout__spot">' + spotlightHtml(spotlight) + '</div>' +
          '<div class="ifx-com-expert-list ifx-com-experts-layout__list">' + listHtml + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function dayHeadHtml(day) {
    return (
      '<div class="ifx-com-day-head">' +
        '<span class="ifx-com-day-head__label"><i class="ti ti-calendar-event"></i> ' + esc(day.label) + '</span>' +
        '<span class="ifx-com-day-head__line"></span>' +
      '</div>'
    );
  }

  function dayBlockHtml(day, opts, isFirst) {
    var parts = '';
    if (!isFirst) parts += dayHeadHtml(day);

    if (opts.showNews !== false) {
      parts += heroGridSection({
        title: 'Tin tức',
        icon: 'ti-news',
        sectionMod: 'ifx-com-list-section--news',
        list: day.news,
        featured: pickFeatured(day.news, true)
      });
    }

    /* Chuyên gia nổi bật là bảng xếp hạng luỹ kế → chỉ hiển thị 1 lần ở ngày mới nhất */
    if (isFirst && opts.showExperts !== false) {
      parts += expertsSection(opts.filter);
    }

    if (opts.showExpertPosts !== false) {
      parts += heroGridSection({
        title: opts.expertTitle || 'Bài viết của chuyên gia',
        icon: 'ti-certificate',
        sectionMod: 'ifx-com-list-section--expert',
        list: day.expert,
        featured: pickFeatured(day.expert, false)
      });
    }

    if (!parts) return '';
    return '<div class="ifx-com-day-block">' + parts + '</div>';
  }

  /* ── Controller: render + lazy-load theo ngày ─────────── */
  function toggleEnd(container, ended) {
    var end = container.querySelector('[data-ifx-daily-end]');
    var more = container.querySelector('[data-ifx-daily-more]');
    var s = container._ifxDaily;
    var hasContent = !!(s && s.rendered > 0);
    if (more) more.hidden = ended || !hasContent;
    if (end) end.hidden = !ended || !hasContent;
  }

  function renderNextDay(container) {
    var s = container._ifxDaily;
    if (!s) return;
    if (s.rendered >= s.days.length) { toggleEnd(container, true); return; }
    var mount = container.querySelector('[data-ifx-daily]');
    if (!mount) return;
    var day = s.days[s.rendered];
    var isFirst = s.rendered === 0;
    mount.insertAdjacentHTML('beforeend', dayBlockHtml(day, s.opts, isFirst));
    s.rendered += 1;
    toggleEnd(container, s.rendered >= s.days.length);
    if (global.IfluxWatchlistUI) IfluxWatchlistUI.bindHearts(container);
    if (global.IfluxInsightShare && IfluxInsightShare.patchAll) IfluxInsightShare.patchAll(container);
  }

  function renderReset(container) {
    var s = container._ifxDaily;
    if (!s) return;
    s.days = buildDays(s.opts.filter);
    s.rendered = 0;
    var mount = container.querySelector('[data-ifx-daily]');
    if (mount) mount.innerHTML = '';
    if (!s.days.length) {
      if (mount) mount.innerHTML = '<div class="ifx-com-empty">Chưa có tin tức hoặc bài viết chuyên gia.</div>';
      toggleEnd(container, true);
      return;
    }
    renderNextDay(container);
  }

  function bindScroll(container) {
    if (container._ifxDailyScroll) return;
    container._ifxDailyScroll = true;
    function onScroll() {
      var s = container._ifxDaily;
      if (!s || s.rendered >= s.days.length) return;
      var more = container.querySelector('[data-ifx-daily-more]');
      if (!more) return;
      if (more.getBoundingClientRect().top < window.innerHeight + 200) {
        renderNextDay(container);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    container._ifxDailyOnScroll = onScroll;
    onScroll();
  }

  function bindChange(container) {
    if (container._ifxDailyChange) return;
    container._ifxDailyChange = true;
    var timer = null;
    document.addEventListener('iflux-community-change', function () {
      if (!document.body.contains(container)) return;
      clearTimeout(timer);
      timer = setTimeout(function () { renderReset(container); }, 120);
    });
  }

  function mount(container, opts) {
    if (!container || !st() || !ui()) return;
    opts = opts || {};
    opts.filter = opts.filter || {};
    container._ifxDaily = { days: [], rendered: 0, opts: opts };
    container.innerHTML =
      '<div class="ifx-com-daily" data-ifx-daily></div>' +
      '<div class="ifx-com-load-more" data-ifx-daily-more hidden><span class="ifx-com-spinner"></span> Cuộn để xem ngày trước</div>' +
      '<div class="ifx-com-end" data-ifx-daily-end hidden>Đã xem hết tin tức &amp; bài viết chuyên gia</div>';
    renderReset(container);
    bindScroll(container);
    bindChange(container);
  }

  global.IfluxDailyFeed = {
    mount: mount,
    buildDays: buildDays,
    expertsSectionHtml: expertsSection
  };
})(window);
