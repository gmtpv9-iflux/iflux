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

  function readCollectionIndex() {
    var path = String(location.pathname || '').replace(/\/+$/, '') || '/';
    if (path === '/cong-dong/chu-de') return 'topic';
    if (path === '/cong-dong/tac-gia') return 'author';
    if (path === '/cong-dong/danh-muc') return 'category';
    return null;
  }

  function readPathCollection() {
    var path = String(location.pathname || '');
    if (readCollectionIndex()) return null;
    var m;
    m = path.match(/\/cong-dong\/chu-de\/([^/]+)\/?$/);
    if (m) return { type: 'topic', id: decodeURIComponent(m[1]) };
    m = path.match(/\/cong-dong\/tac-gia\/([^/]+)\/?$/);
    if (m) return { type: 'author', id: decodeURIComponent(m[1]) };
    m = path.match(/\/cong-dong\/danh-muc\/([^/]+)\/?$/);
    if (m) return { type: 'category', id: decodeURIComponent(m[1]) };
    return null;
  }

  function apiBase() {
    if (global.IfluxApi && IfluxApi.apiBase) return IfluxApi.apiBase();
    return '/api';
  }

  function fetchJson(path) {
    return fetch(apiBase() + path, { headers: { Accept: 'application/json' } })
      .then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error((body.error && body.error.message) || body.error || ('HTTP ' + res.status));
          return (body && body.data) || body || {};
        });
      });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function collectionMeta(kind) {
    if (kind === 'topic') {
      return {
        title: 'Danh sách chủ đề',
        intro: 'Các chủ đề gắn với bài viết Cộng đồng. Chọn một chủ đề để xem feed bài viết liên quan.',
        icon: 'ti-book-2'
      };
    }
    if (kind === 'author') {
      return {
        title: 'Danh sách tác giả',
        intro: 'Tác giả đã có bài viết trên Cộng đồng. Chọn một tác giả để xem các bài của họ.',
        icon: 'ti-users'
      };
    }
    return {
      title: 'Danh sách danh mục',
      intro: 'Danh mục phân loại bài viết Cộng đồng. Chọn một danh mục để xem feed tương ứng.',
      icon: 'ti-category'
    };
  }

  function collectionItemHref(kind, item) {
    if (kind === 'topic') {
      var slug = item.slug || item.id;
      if (global.IfluxSeoUrl && IfluxSeoUrl.communityTopicHref) return IfluxSeoUrl.communityTopicHref(slug);
      return '/cong-dong/chu-de/' + encodeURIComponent(slug);
    }
    if (kind === 'author') {
      var key = item.username || item.id || item.display_name;
      if (global.IfluxSeoUrl && IfluxSeoUrl.communityAuthorHref) return IfluxSeoUrl.communityAuthorHref(key);
      return '/cong-dong/tac-gia/' + encodeURIComponent(key);
    }
    var cat = item.slug || item.id;
    if (global.IfluxSeoUrl && IfluxSeoUrl.communityCategoryHref) return IfluxSeoUrl.communityCategoryHref(cat);
    return '/cong-dong/danh-muc/' + encodeURIComponent(cat);
  }

  function collectionRowHtml(kind, item, idx) {
    var href = collectionItemHref(kind, item);
    var name = item.name || item.label || item.display_name || item.slug || '—';
    var sub = '';
    if (kind === 'topic') sub = (item.post_count != null ? item.post_count + ' bài · ' : '') + (item.slug || '');
    if (kind === 'author') sub = (item.post_count != null ? item.post_count + ' bài' : '') + (item.tier_label ? ' · ' + item.tier_label : '');
    if (kind === 'category') sub = item.slug || item.description || '';
    return (
      '<a class="ix-list-item ifx-com-story-rank ifx-com-story-rank--link" href="' + esc(href) + '">' +
        '<div class="ifx-com-story-rank__num" aria-hidden="true">' + (idx + 1) + '</div>' +
        '<div class="ifx-com-story-rank__body">' +
          '<div class="ifx-com-story-rank__title-row">' +
            '<span class="ifx-com-story-rank__title">' + esc(name) + '</span>' +
          '</div>' +
          (sub ? '<div class="ifx-com-story-rank__sub">' + esc(sub) + '</div>' : '') +
        '</div>' +
        '<i class="ti ti-chevron-right" aria-hidden="true"></i>' +
      '</a>'
    );
  }

  function loadCollectionIndex(kind) {
    if (kind === 'topic') {
      return fetchJson('/community/chu-de?limit=300').then(function (d) { return d.chu_de || []; });
    }
    if (kind === 'author') {
      return fetchJson('/community/authors?limit=300').then(function (d) { return d.authors || []; });
    }
    return fetchJson('/community/categories?limit=300').then(function (d) { return d.categories || []; });
  }

  function renderCollectionIndex(root, kind) {
    var meta = collectionMeta(kind);
    if (global.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
      IfluxPageDefinition.applyPatch({
        title: meta.title,
        intro: meta.intro,
        documentTitle: meta.title + ' · iFlux'
      });
    }
    /* Gỡ tiêu đề Page Shell (manifest Cộng đồng) — tránh 2 h1 */
    document.querySelectorAll('.ifx-rt-page-head').forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    root.innerHTML =
      '<div class="ifx-com-feed-layout">' +
        '<div class="ifx-com-feed-main">' +
          '<div class="ifx-com-breadcrumb">' +
            '<a href="/cong-dong">Cộng đồng</a>' +
            '<span class="ifx-com-breadcrumb__sep">/</span>' +
            '<span class="ifx-com-breadcrumb__current">' + esc(meta.title) + '</span>' +
          '</div>' +
          '<h1 class="ix-page-title"><i class="ti ' + meta.icon + '"></i> ' + esc(meta.title) + '</h1>' +
          '<p class="ifx-com-intro">' + esc(meta.intro) + '</p>' +
          '<div class="ifx-mkt-card"><div class="ifx-mkt-card__body">' +
            '<div class="ifx-com-story-rank-list" data-ifx-com-collection-list>' +
              '<div class="ifx-com-empty">Đang tải…</div>' +
            '</div>' +
          '</div></div>' +
        '</div>' +
      '</div>';

    var listEl = root.querySelector('[data-ifx-com-collection-list]');
    loadCollectionIndex(kind).then(function (items) {
      if (!listEl) return;
      if (!items.length) {
        listEl.innerHTML = '<div class="ifx-com-empty">Chưa có dữ liệu.</div>';
        return;
      }
      listEl.innerHTML = items.map(function (it, i) { return collectionRowHtml(kind, it, i); }).join('');
    }).catch(function (err) {
      if (listEl) {
        listEl.innerHTML = '<div class="ifx-com-empty" style="color:var(--ix-danger)">' + esc(err.message) + '</div>';
      }
    });
  }

  function readListFilters() {
    var params = new URLSearchParams(location.search);
    var coll = readPathCollection();
    var out = {
      ticker: (params.get('ticker') || '').toUpperCase(),
      story: params.get('story') || '',
      family: params.get('family') || '',
      sector: params.get('sector') || '',
      author: params.get('author') || '',
      category: params.get('category') || ''
    };
    if (coll) {
      if (coll.type === 'topic') out.story = coll.id;
      if (coll.type === 'author') out.author = coll.id;
      if (coll.type === 'category') out.category = coll.id;
    }
    return out;
  }

  function listFilterParams() {
    var f = readListFilters();
    if (f.ticker) return { ticker: f.ticker };
    if (f.story) return { taxSource: 'chu-de', taxGroupId: f.story };
    if (f.family) return { taxSource: 'family', taxGroupId: f.family };
    if (f.sector) return { sectorId: f.sector };
    if (f.author) return { authorId: f.author, author: f.author };
    if (f.category) return { category: f.category, categoryId: f.category };
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
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="/cong-dong">Xem tất cả</a>' +
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
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="/cong-dong">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.author) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-user"></i> Tác giả: <strong>' + f.author + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="/cong-dong">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.category) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-category"></i> Danh mục: <strong>' + f.category + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="/cong-dong">Xem tất cả</a>' +
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

  function hostHasWidgets(host) {
    if (!host) return false;
    if (host.querySelector('[data-widget-id], .ifx-rt-widget')) return true;
    return !!(host.children && host.children.length);
  }

  /**
   * Host trống → không hiện tiêu đề/mô tả Section (vd «Tổng quan»).
   * Sidebar phải trống → ẩn cột phụ.
   * Gọi sau Layout Engine mount placements.
   */
  function syncEmptyHostChrome(root) {
    root = root || document.querySelector('[data-ifx-community-feed]');
    if (!root) return;

    var section = root.querySelector('.ifx-com-list-section--community');
    if (section) {
      var mainHost = section.querySelector('[data-ifx-section="main"]');
      var hasMain = hostHasWidgets(mainHost);
      var head = section.querySelector('.ifx-com-list-head');
      if (head) head.hidden = !hasMain;
      var banner = section.querySelector('.ifx-com-ticker-banner');
      var hasBanner = !!(banner && String(banner.textContent || '').trim());
      section.hidden = !hasMain && !hasBanner;
    }

    var side = root.querySelector('[data-ifx-section="sidebar-right"]');
    var hasSide = hostHasWidgets(side);
    if (side) side.hidden = !hasSide;
    var layout = root.querySelector('.ifx-com-feed-layout');
    if (layout) {
      layout.style.gridTemplateColumns = hasSide ? '' : 'minmax(0, 1fr)';
    }
  }

  function renderShell(root) {
    if (!root) return;
    var banner = filterBannerHtml();

    root.innerHTML =
      '<div class="ifx-com-feed-layout">' +
        '<div class="ifx-com-feed-main">' +
          '<section class="ifx-com-list-section ifx-com-list-section--community" hidden>' +
            '<div class="ifx-com-list-head" hidden>' +
              '<h2 class="ifx-com-list-title"><i class="ti ti-layout-grid"></i> Tổng quan</h2>' +
            '</div>' +
            banner +
            '<div class="ifx-dash-grid ifx-com-dedicated-grid" data-ifx-section="main"></div>' +
          '</section>' +

          /* Tin tức = nội dung đặc thù trang — không gắn data-ifx-ent-block / không thuộc ma trận Widget. */
          '<div data-ifx-com-daily-feed></div>' +
        '</div>' +
        '<aside class="ifx-com-feed-sidebar" aria-label="Cộng đồng" data-ifx-section="sidebar-right" hidden>' +
        '</aside>' +
      '</div>';

    applyBlockGate(root);
    mountSidebar(root);
    mountTrending(root);
    /* Chưa mount Placement → tạm 1 cột; syncEmptyHostChrome chỉnh lại sau. */
    var layout = root.querySelector('.ifx-com-feed-layout');
    if (layout) layout.style.gridTemplateColumns = 'minmax(0, 1fr)';
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

    var indexKind = readCollectionIndex();
    if (indexKind) {
      renderCollectionIndex(root, indexKind);
      return;
    }

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
    syncEmptyHostChrome: syncEmptyHostChrome,
    NEWS_PAGE_SIZE: NEWS_PAGE_SIZE,
    NEWS_HERO_COUNT: NEWS_HERO_COUNT
  };
})(window);
