/* Community Article List — Section A/B Composer + buffered progressive acquisition
   SOL-CAL-03/04/08 · Plan WP-3/4/5. DS: ifx-com-*, --ifx-*, --ix-*. */
(function (global) {
  'use strict';

  var FEED_PAGE_SIZE = 50;
  var BATCH_A = 5;
  var BATCH_B = 6;

  function st() { return global.IfluxCommunityStore; }
  function ui() { return global.IfluxCommunityUI; }
  function profiles() { return global.IfluxProfileUsersStore; }
  function bridge() {
    return global.IfluxCommunityApiBridge || global.IfluxCommunityProvider;
  }

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
    var name = row.displayName;
    var tierLabel = row.tierLabel;
    if ((!name || String(name).trim().length < 2) && profiles() && profiles().getPublic) {
      var u = profiles().getPublic(row.userId);
      if (u && u.display_name) name = u.display_name;
      if (!tierLabel && u && u.tier_label) tierLabel = u.tier_label;
    }
    return { displayName: name || 'Chuyên gia', tierLabel: tierLabel || 'Elite' };
  }

  /* ── Section A: ≤5 · featured + compact side (no empty placeholder) ── */
  function sectionAHtml(items) {
    if (!items || !items.length || !ui() || !ui().featuredPostHtml) return '';
    var featured = items[0];
    var side = items.slice(1, BATCH_A);
    var sideHtml = side.length
      ? side.map(function (p) { return ui().compactPostHtml(p); }).join('')
      : '';
    return (
      '<section class="ifx-com-list-section ifx-com-list-section--news" data-ifx-com-section="A">' +
        '<div class="ifx-com-hero">' +
          '<div class="ifx-com-hero__featured">' + ui().featuredPostHtml(featured) + '</div>' +
          (sideHtml ? '<div class="ifx-com-hero__side">' + sideHtml + '</div>' : '') +
        '</div>' +
      '</section>'
    );
  }

  /* ── Section B: ≤6 · 3×2 grid ── */
  function sectionBHtml(items) {
    if (!items || !items.length || !ui() || !ui().postCardHtml) return '';
    var list = items.slice(0, BATCH_B);
    return (
      '<section class="ifx-com-list-section ifx-com-list-section--grid" data-ifx-com-section="B">' +
        '<div class="ifx-com-feed-grid">' +
          list.map(function (p) { return ui().postCardHtml(p); }).join('') +
        '</div>' +
      '</section>'
    );
  }

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
      : '';
    return (
      '<section class="ifx-com-experts-leaders" data-ifx-com-experts-sibling>' +
        '<div class="ifx-com-list-head">' +
          '<h2 class="ifx-com-list-title"><i class="ti ti-award"></i> Chuyên gia nổi bật</h2>' +
          '<span class="ifx-com-section-hint">Xếp theo tổng lượt thích bài viết</span>' +
        '</div>' +
        '<div class="ifx-com-experts-layout">' +
          '<div class="ifx-com-experts-layout__spot">' + spotlightHtml(spotlight) + '</div>' +
          (listHtml
            ? '<div class="ifx-com-expert-list ifx-com-experts-layout__list">' + listHtml + '</div>'
            : '') +
        '</div>' +
      '</section>'
    );
  }

  function feedQueryFromFilter(filter) {
    filter = filter || {};
    var q = {};
    if (filter.categoryId) q.category_id = filter.categoryId;
    if (filter.ticker) q.ticker = filter.ticker;
    if (filter.taxSource === 'chu-de' && filter.taxGroupId) q.chu_de_id = filter.taxGroupId;
    return q;
  }

  function newSession(opts) {
    return {
      opts: opts || {},
      filter: (opts && opts.filter) || {},
      generation: 0,
      buffer: [],
      bufferIds: {},
      composed: 0,
      offset: 0,
      hasMore: true,
      acquiring: false,
      batchLoading: false,
      emptyAcquireStreak: 0,
      loadError: false,
      expertsDone: false,
      ended: false,
      initialDone: false
    };
  }

  function updateSentinel(container) {
    var s = container._ifxFeed;
    var more = container.querySelector('[data-ifx-daily-more]');
    var end = container.querySelector('[data-ifx-daily-end]');
    var err = container.querySelector('[data-ifx-daily-error]');
    if (!s) return;
    var hasContent = s.composed > 0 || !!(container.querySelector('[data-ifx-com-section]'));
    var canMore = s.initialDone && !s.loadError && !s.ended &&
      (s.hasMore || s.composed < s.buffer.length);
    if (err) {
      err.hidden = !s.loadError;
    }
    if (more) {
      more.hidden = !canMore;
      if (!more.hidden) {
        if (s.acquiring || s.batchLoading) {
          more.innerHTML = '<span class="ifx-com-spinner"></span> Đang tải thêm…';
        } else {
          more.innerHTML = 'Cuộn để xem thêm';
        }
      }
    }
    if (end) {
      end.hidden = !s.ended || !hasContent;
    }
  }

  function appendBatchHtml(container, html) {
    var mount = container.querySelector('[data-ifx-daily]');
    if (!mount || !html) return;
    mount.insertAdjacentHTML('beforeend', html);
    if (global.IfluxHeartAction) IfluxHeartAction.bind(container);
  }

  function composeOneBatch(container) {
    var s = container._ifxFeed;
    if (!s || s.opts.showNews === false) return false;
    var remain = s.buffer.length - s.composed;
    if (remain <= 0) return false;
    var start = s.composed;
    var aItems = s.buffer.slice(start, start + BATCH_A);
    var bStart = start + aItems.length;
    var bItems = s.buffer.slice(bStart, bStart + BATCH_B);
    if (!ui() || !ui().featuredPostHtml) {
      s.loadError = true;
      updateSentinel(container);
      return false;
    }
    var html = sectionAHtml(aItems) + (bItems.length ? sectionBHtml(bItems) : '');
    if (!html) return false;
    /* Chỉ tăng composed khi đã append HTML — tránh “nuốt” buffer khi render rỗng */
    s.composed = start + aItems.length + bItems.length;
    appendBatchHtml(container, html);
    var batchPosts = aItems.concat(bItems);
    /* Runtime quotes only — hydrate ghi thị giá/% lên chip (không Mock) */
    if (ui() && typeof ui().hydrateTickerQuotes === 'function') {
      ui().hydrateTickerQuotes(container, batchPosts);
    }
    if (!s.hasMore && s.composed >= s.buffer.length) {
      s.ended = true;
    }
    updateSentinel(container);
    return true;
  }

  function ensureExpertsSibling(container) {
    var s = container._ifxFeed;
    if (!s || s.expertsDone || s.opts.showExperts === false) return;
    var mount = container.querySelector('[data-ifx-daily]');
    if (!mount) return;
    var html = expertsSection(s.filter);
    if (html) {
      /* Experts sibling trước article stream — chỉ khi mount còn trống batches */
      if (!mount.querySelector('[data-ifx-com-section]')) {
        mount.insertAdjacentHTML('afterbegin', html);
      }
    }
    s.expertsDone = true;
  }

  function acquirePage(container) {
    var s = container._ifxFeed;
    var b = bridge();
    if (!s || !b || !b.loadFeed) return Promise.resolve({ ok: false });
    if (s.acquiring) return Promise.resolve({ ok: true, skipped: true });
    if (!s.hasMore) return Promise.resolve({ ok: true, skipped: true, noMore: true });
    var gen = s.generation;
    s.acquiring = true;
    updateSentinel(container);
    var q = feedQueryFromFilter(s.filter);
    var reqOffset = s.offset;
    /* mergeStore (related trên bài viết): luôn merge — CẤM replace wipe bài đang xem */
    var doReplace = !s.opts.mergeStore && reqOffset === 0;
    return b.loadFeed({
      limit: FEED_PAGE_SIZE,
      offset: reqOffset,
      category_id: q.category_id,
      ticker: q.ticker,
      chu_de_id: q.chu_de_id,
      replace: doReplace
    }).then(function (out) {
      if (!container._ifxFeed || container._ifxFeed.generation !== gen) {
        return { ok: false, stale: true };
      }
      s.acquiring = false;
      if (!out || !out.ok) {
        s.loadError = true;
        updateSentinel(container);
        return { ok: false };
      }
      var cards = out.cards || [];
      var before = s.buffer.length;
      cards.forEach(function (c) {
        if (!c || !c.id || s.bufferIds[c.id]) return;
        s.bufferIds[c.id] = true;
        s.buffer.push(c);
      });
      var netNew = s.buffer.length - before;
      /* Luôn tiến offset theo số card API trả — tránh kẹt cùng offset */
      s.offset = reqOffset + cards.length;
      s.hasMore = out.has_more === true;
      if (cards.length === 0) {
        s.hasMore = false;
      }
      if (netNew === 0) {
        s.emptyAcquireStreak += 1;
        if (s.emptyAcquireStreak >= 2 || !s.hasMore) {
          s.hasMore = false;
          if (s.composed >= s.buffer.length) s.ended = true;
        }
      } else {
        s.emptyAcquireStreak = 0;
      }
      if (!s.hasMore && s.composed >= s.buffer.length) s.ended = true;
      updateSentinel(container);
      return { ok: true, cards: cards, netNew: netNew };
    }).catch(function () {
      if (container._ifxFeed && container._ifxFeed.generation === gen) {
        container._ifxFeed.acquiring = false;
        container._ifxFeed.loadError = true;
        updateSentinel(container);
      }
      return { ok: false };
    });
  }

  /** Acquire tối thiểu cho 1 Batch (≤11) — không preload hết has_more */
  function ensureBufferForBatch(container) {
    var s = container._ifxFeed;
    if (!s) return Promise.resolve();
    var want = BATCH_A + BATCH_B;
    function need() {
      return (s.buffer.length - s.composed) < want && s.hasMore && !s.loadError;
    }
    function step() {
      if (!need()) return Promise.resolve();
      return acquirePage(container).then(function (r) {
        if (!r || r.stale) return;
        if (r.skipped) return; /* đang acquire bởi call khác — không recurse */
        if (!r.ok) return;
        if (need()) return step();
      });
    }
    return step();
  }

  function loadNextBatch(container) {
    var s = container._ifxFeed;
    if (!s || s.batchLoading || s.acquiring || s.loadError || s.ended) return;
    if (!s.initialDone) return;
    if (s.opts.showNews === false) {
      s.ended = true;
      updateSentinel(container);
      return;
    }
    var gen = s.generation;
    s.batchLoading = true;
    updateSentinel(container);
    ensureBufferForBatch(container).then(function () {
      if (!container._ifxFeed || container._ifxFeed.generation !== gen) return;
      s.batchLoading = false;
      if (s.loadError) {
        updateSentinel(container);
        return;
      }
      var did = composeOneBatch(container);
      if (!did) {
        if (!s.hasMore || s.composed >= s.buffer.length) {
          s.ended = true;
        }
      }
      updateSentinel(container);
    }).catch(function () {
      if (container._ifxFeed && container._ifxFeed.generation === gen) {
        container._ifxFeed.batchLoading = false;
        container._ifxFeed.loadError = true;
        updateSentinel(container);
      }
    });
  }

  function bindSentinel(container) {
    if (container._ifxFeedIo) return;
    var more = container.querySelector('[data-ifx-daily-more]');
    if (!more || typeof IntersectionObserver === 'undefined') {
      container._ifxFeedIo = true;
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var s = container._ifxFeed;
        if (!s || !s.initialDone || s.loadError || s.ended || s.acquiring || s.batchLoading) return;
        loadNextBatch(container);
      });
    }, { root: null, rootMargin: '240px', threshold: 0 });
    io.observe(more);
    container._ifxFeedIo = io;
  }

  function bindErrorRetry(container) {
    if (container._ifxFeedErrBound) return;
    container._ifxFeedErrBound = true;
    container.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-ifx-daily-retry]') : null;
      if (!t || !container.contains(t)) return;
      var s = container._ifxFeed;
      if (!s) return;
      s.loadError = false;
      updateSentinel(container);
      loadNextBatch(container);
    });
  }

  function resetAndInitial(container) {
    var s = container._ifxFeed;
    if (!s) return;
    s.generation += 1;
    var gen = s.generation;
    s.buffer = [];
    s.bufferIds = {};
    s.composed = 0;
    s.offset = 0;
    s.hasMore = true;
    s.acquiring = false;
    s.batchLoading = false;
    s.emptyAcquireStreak = 0;
    s.loadError = false;
    s.expertsDone = false;
    s.ended = false;
    s.initialDone = false;
    var mount = container.querySelector('[data-ifx-daily]');
    if (mount) mount.innerHTML = '';
    updateSentinel(container);
    if (s.opts.showNews === false) {
      ensureExpertsSibling(container);
      if (mount && !mount.querySelector('[data-ifx-com-experts-sibling]')) {
        mount.innerHTML = '<div class="ifx-com-empty">Chưa có tin tức hoặc bài viết.</div>';
      }
      s.ended = true;
      s.initialDone = true;
      updateSentinel(container);
      return;
    }
    s.batchLoading = true;
    ensureBufferForBatch(container).then(function () {
      if (!container._ifxFeed || container._ifxFeed.generation !== gen) return;
      s.batchLoading = false;
      /* Experts sibling trước article batches */
      ensureExpertsSibling(container);
      if (s.loadError && !s.buffer.length) {
        s.initialDone = true;
        updateSentinel(container);
        return;
      }
      if (!s.buffer.length) {
        var m = container.querySelector('[data-ifx-daily]');
        if (m && !m.querySelector('[data-ifx-com-section],[data-ifx-com-experts-sibling]')) {
          m.insertAdjacentHTML('beforeend', '<div class="ifx-com-empty">Chưa có tin tức hoặc bài viết.</div>');
        }
        s.ended = true;
        s.initialDone = true;
        updateSentinel(container);
        return;
      }
      composeOneBatch(container);
      s.initialDone = true;
      updateSentinel(container);
      /* Nếu sentinel đã trong viewport — lấy batch 2 một lần (không loop) */
      var more = container.querySelector('[data-ifx-daily-more]');
      if (more && !more.hidden && !s.ended) {
        loadNextBatch(container);
      }
    }).catch(function () {
      if (container._ifxFeed && container._ifxFeed.generation === gen) {
        container._ifxFeed.batchLoading = false;
        container._ifxFeed.loadError = true;
        container._ifxFeed.initialDone = true;
        updateSentinel(container);
      }
    });
  }

  function mount(container, opts) {
    if (!container || !ui()) return;
    opts = opts || {};
    opts.filter = opts.filter || {};
    container._ifxFeed = newSession(opts);
    container.innerHTML =
      '<div class="ifx-com-daily" data-ifx-daily></div>' +
      '<div class="ifx-com-load-more" data-ifx-daily-more hidden>' +
        '<span class="ifx-com-spinner"></span> Cuộn để xem thêm' +
      '</div>' +
      '<div class="ifx-com-load-more ifx-com-load-more--error" data-ifx-daily-error hidden>' +
        'Không tải thêm được. ' +
        '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-daily-retry>Thử lại</button>' +
      '</div>' +
      '<div class="ifx-com-end" data-ifx-daily-end hidden>Đã xem hết bài viết</div>';
    bindSentinel(container);
    bindErrorRetry(container);
    resetAndInitial(container);
  }

  global.IfluxDailyFeed = {
    mount: mount,
    expertsSectionHtml: expertsSection,
    FEED_PAGE_SIZE: FEED_PAGE_SIZE
  };
})(window);
