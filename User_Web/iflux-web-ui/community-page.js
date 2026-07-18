/* Trang feed Cộng đồng — Cộng đồng · Tin tức · Chuyên gia · sidebar */
(function (global) {
  'use strict';

  var NEWS_HERO_COUNT = 5;
  var NEWS_PAGE_SIZE = 6;
  var EXPERT_PAGE_SIZE = 12;

  var state = {
    newsOffset: 0,
    newsLoading: false,
    newsHasMore: true,
    newsTotal: 0,
    newsLoadSeq: 0,
    expertLoaded: false,
    shellReady: false
  };

  function st() { return global.IfluxCommunityStore; }
  function ui() { return global.IfluxCommunityUI; }
  function tax() { return global.IfluxWatchlistTaxonomy; }

  /* Permission SoT = IfluxEntitlements. Composite chỉ HỎI engine, không tự quyết.
     Engine vắng mặt => fail-closed (không lộ block paywall). */
  function blockVisible(blockId) {
    return !!(global.IfluxEntitlements && IfluxEntitlements.canShowBlock(blockId));
  }

  function applyBlockGate(root) {
    if (!root || !global.IfluxBlockGate) return;
    IfluxBlockGate.apply('community');
  }

  function readListFilters() {
    var params = new URLSearchParams(location.search);
    return {
      ticker: (params.get('ticker') || '').toUpperCase(),
      story: params.get('story') || '',
      family: params.get('family') || '',
      sector: params.get('sector') || ''
    };
  }

  function listFilterParams() {
    var f = readListFilters();
    if (f.ticker) return { ticker: f.ticker };
    if (f.story) return { taxSource: 'chu-de', taxGroupId: f.story };
    if (f.family) return { taxSource: 'family', taxGroupId: f.family };
    if (f.sector) return { sectorId: f.sector };
    return {};
  }

  function filterBannerHtml() {
    var f = readListFilters();
    var taxModule = tax();
    if (f.ticker) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-chart-line"></i> Bài viết liên quan đến <strong>' + f.ticker + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="index.html">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.story && taxModule) {
      var story = taxModule.getGroup('chu-de', f.story) || taxModule.getGroup('story', f.story);
      var name = story ? story.name : f.story;
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-book-2"></i> Chủ đề: <strong>' + name + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="index.html">Xem tất cả</a>' +
        '</div>'
      );
    }
    return '';
  }

  /**
   * Sidebar Page Feature hooks — hosts Published Widget do Layout Engine dựng.
   */
  function mountSidebar(root) {
    /* Entitlement: BlockGate.apply sau khi Layout Engine tạo host. */
    void root;
  }

  function mountTrending(root) {
    /* Phase 3: hosts main section = Layout Engine từ placements — không hardcode widgetId. */
    void root;
  }

  function mountFeaturedExperts(root) {
    if (!blockVisible('BLK-COM-EXPERTS')) return;
    var mount = root.querySelector('[data-ifx-com-experts-mount]');
    if (mount && global.IfluxCommunityFeaturedExperts) {
      IfluxCommunityFeaturedExperts.mount(mount);
    }
  }

  function renderShell(root) {
    if (!root) return;
    var banner = filterBannerHtml();

    root.innerHTML =
      '<div class="ifx-com-feed-layout">' +
        '<div class="ifx-com-feed-main">' +
          '<section class="ifx-com-list-section ifx-com-list-section--community">' +
            '<div class="ifx-com-list-head">' +
              '<h2 class="ifx-com-list-title"><i class="ti ti-layout-grid"></i> Tổng quan</h2>' +
            '</div>' +
            banner +
            '<div class="ifx-dash-grid ifx-com-dedicated-grid" data-ifx-section="main"></div>' +
          '</section>' +

          '<div data-ifx-com-daily-feed data-ifx-ent-block="BLK-COM-NEWS"></div>' +
        '</div>' +
        '<aside class="ifx-com-feed-sidebar" aria-label="Cộng đồng" data-ifx-section="sidebar-right">' +
        '</aside>' +
      '</div>';

    applyBlockGate(root);
    mountSidebar(root);
    mountTrending(root);
    state.shellReady = true;
  }

  function ensureMounts(root) {
    return !!(root && root.querySelector('[data-ifx-com-news-grid]'));
  }

  function renderNewsHero(root, posts) {
    var mount = root.querySelector('[data-ifx-com-news-hero-mount]');
    if (!mount || !ui()) return;
    if (!posts.length) {
      mount.innerHTML = '';
      return;
    }
    var featured = posts[0];
    var side = posts.slice(1, NEWS_HERO_COUNT);
    mount.innerHTML =
      '<div class="ifx-com-hero">' +
        '<div class="ifx-com-hero__featured">' + ui().featuredPostHtml(featured) + '</div>' +
        '<div class="ifx-com-hero__side">' + side.map(function (p) { return ui().compactPostHtml(p); }).join('') + '</div>' +
      '</div>';
  }

  function appendNewsGrid(root, posts, reset) {
    var grid = root.querySelector('[data-ifx-com-news-grid]');
    if (!grid || !ui()) return;
    if (!posts.length && reset) {
      var heroMount = root.querySelector('[data-ifx-com-news-hero-mount]');
      var hasHero = heroMount && heroMount.innerHTML.trim();
      if (!hasHero) {
        grid.innerHTML = '<div class="ifx-com-empty">Chưa có tin tức.</div>';
      } else {
        grid.innerHTML = '';
      }
      return;
    }
    if (!posts.length) return;
    var html = posts.map(function (p) { return ui().postCardHtml(p); }).join('');
    if (reset) grid.innerHTML = html;
    else grid.insertAdjacentHTML('beforeend', html);
  }

  function renderExpertGrid(root) {
    var grid = root.querySelector('[data-ifx-com-expert-grid]');
    var endEl = root.querySelector('[data-ifx-com-expert-end]');
    if (!grid || !st() || !ui()) return;

    var base = listFilterParams();
    var result = st().getPosts(Object.assign({}, base, {
      contentType: st().CONTENT_TYPE_EXPERT,
      offset: 0,
      limit: EXPERT_PAGE_SIZE,
      returnMeta: true
    }));

    var countEl = root.querySelector('[data-ifx-com-expert-count]');
    if (countEl) countEl.textContent = result.total + ' bài';

    if (!result.items.length) {
      grid.innerHTML = '';
      if (endEl) endEl.hidden = false;
      return;
    }
    if (endEl) endEl.hidden = true;
    grid.innerHTML = result.items.map(function (p) { return ui().postCardHtml(p); }).join('');
    state.expertLoaded = true;
  }

  function updateNewsCount(root, total) {
    var el = root.querySelector('[data-ifx-com-news-count]');
    if (el) el.textContent = total + ' bài';
  }

  function finishNewsLoad(root, seq) {
    if (seq !== state.newsLoadSeq) return;
    state.newsLoading = false;
    var loadEl = root.querySelector('[data-ifx-com-load-more]');
    var endEl = root.querySelector('[data-ifx-com-end]');
    if (loadEl) loadEl.hidden = true;
    if (endEl) endEl.hidden = state.newsHasMore || state.newsTotal === 0;
  }

  function applyNewsLoad(root, reset, seq) {
    if (!ensureMounts(root) || !st() || !ui()) {
      finishNewsLoad(root, seq);
      return;
    }

    var base = listFilterParams();
    var loadEl = root.querySelector('[data-ifx-com-load-more]');
    var endEl = root.querySelector('[data-ifx-com-end]');
    if (loadEl) loadEl.hidden = false;
    if (endEl) endEl.hidden = true;

    try {
      if (reset) {
        if (blockVisible('BLK-COM-TRENDING') || blockVisible('BLK-COM-CHUDE-TOP')) mountTrending(root);
        if (blockVisible('BLK-COM-EXPERTS')) mountFeaturedExperts(root);
        try {
          document.dispatchEvent(new CustomEvent('iflux-community-remount-widgets'));
        } catch (e) { /* ignore */ }

        if (blockVisible('BLK-COM-NEWS')) {
          var heroResult = st().getPosts(Object.assign({}, base, {
            contentType: st().CONTENT_TYPE_NEWS,
            offset: 0,
            limit: NEWS_HERO_COUNT,
            returnMeta: true
          }));
          state.newsTotal = heroResult.total;
          updateNewsCount(root, heroResult.total);
          renderNewsHero(root, heroResult.items);
          state.newsHasMore = heroResult.total > NEWS_HERO_COUNT;
          state.newsOffset = NEWS_HERO_COUNT;
        } else {
          state.newsTotal = 0;
          state.newsHasMore = false;
          state.newsOffset = 0;
        }
        state.expertLoaded = false;
        if (blockVisible('BLK-COM-EXPERTS')) renderExpertGrid(root);
      }

      if (!blockVisible('BLK-COM-NEWS') || !state.newsHasMore) {
        var emptyGrid = root.querySelector('[data-ifx-com-news-grid]');
        if (emptyGrid) emptyGrid.innerHTML = '';
      } else {
        var result = st().getPosts(Object.assign({}, base, {
          contentType: st().CONTENT_TYPE_NEWS,
          offset: state.newsOffset,
          limit: NEWS_PAGE_SIZE,
          returnMeta: true
        }));
        appendNewsGrid(root, result.items, reset && state.newsOffset === NEWS_HERO_COUNT);
        state.newsTotal = result.total;
        updateNewsCount(root, result.total);
        state.newsOffset += result.items.length;
        state.newsHasMore = result.hasMore;
      }
    } catch (err) {
      console.error('Community feed load failed', err);
      var grid = root.querySelector('[data-ifx-com-news-grid]');
      if (grid && reset) {
        grid.innerHTML = '<div class="ifx-com-empty">Không tải được bài viết. Vui lòng tải lại trang.</div>';
      }
    }

    finishNewsLoad(root, seq);
  }

  function loadNewsPage(root, reset) {
    if (!root) return;

    var seq = ++state.newsLoadSeq;

    if (reset) {
      state.newsOffset = NEWS_HERO_COUNT;
      state.newsHasMore = true;
      state.newsTotal = 0;
    } else if (state.newsLoading || !state.newsHasMore) {
      return;
    }

    state.newsLoading = true;

    if (reset) {
      applyNewsLoad(root, true, seq);
      return;
    }

    setTimeout(function () {
      applyNewsLoad(root, false, seq);
    }, 280);
  }

  function refreshFeed(root) {
    if (!root) return;
    loadNewsPage(root, true);
  }

  function bindInfiniteScroll(root) {
    if (root._ifxComScrollBound) return;
    root._ifxComScrollBound = true;

    function onScroll() {
      if (state.newsLoading || !state.newsHasMore) return;
      var rect = root.querySelector('[data-ifx-com-load-more]');
      if (!rect) return;
      var trigger = rect.getBoundingClientRect().top;
      if (trigger < window.innerHeight + 120) loadNewsPage(root, false);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function mountDailyFeed(root) {
    var mount = root.querySelector('[data-ifx-com-daily-feed]');
    if (!mount || !global.IfluxDailyFeed) return;
    IfluxDailyFeed.mount(mount, {
      filter: listFilterParams(),
      showNews: blockVisible('BLK-COM-NEWS'),
      showExperts: blockVisible('BLK-COM-EXPERTS'),
      showExpertPosts: blockVisible('BLK-COM-EXPERTS'),
      expertTitle: 'Bài viết của chuyên gia'
    });
  }

  function boot() {
    var root = document.querySelector('[data-ifx-community-feed]');
    if (!root) return;
    if (global.IfluxWatchlistUI) IfluxWatchlistUI.bindHearts(document);

    renderShell(root);
    mountDailyFeed(root);
    setTimeout(function () {
      if (global.IfluxInsightShare) IfluxInsightShare.patchAll(root);
    }, 120);

    document.addEventListener('iflux-watchlist-change', function () {
      if (global.IfluxWatchlistUI) IfluxWatchlistUI.refreshHearts();
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  global.IfluxCommunityPage = {
    init: init,
    NEWS_PAGE_SIZE: NEWS_PAGE_SIZE,
    NEWS_HERO_COUNT: NEWS_HERO_COUNT
  };
})(window);
