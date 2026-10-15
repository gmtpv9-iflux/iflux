/* Trang feed Cộng đồng — shell · featured tabs (ALL|UUID) · DailyFeed A/B */
(function (global) {
  'use strict';

  var FILTER_ALL = 'ALL';

  /* Lớp danh mục cấp cao "Bạn quan tâm | Bản tin | Tin nóng" (Owner 2026-10) — "Bản tin" = cụm
     Tab nổi bật + DailyFeed CŨ y nguyên (không đổi nội dung/cách load/cấu trúc), chỉ lồng vào 1
     wrapper có thể ẩn/hiện. Chỉ hiện lớp này ở trang Tin tức "thường" (không group/không có URL
     filter ticker|story|family|sector|author|category — những view đó giữ nguyên hành vi cũ, xem
     showToplevel ở boot()). */
  var TOPLEVEL_DEFAULT = 'bulletin';
  var HOT_RANGE_DEFAULT = 'week';

  var state = {
    shellReady: false,
    featuredCats: [],
    /* '' = ALL (SOL-CAL-05) */
    featuredCategoryId: '',
    toplevelTab: '',
    hotRange: HOT_RANGE_DEFAULT,
    /* Bottom Nav Cấp 2 mobile (xem renderShell/ensureLevel2Bound) */
    lazyMode: false,
    frame: null
  };
  var followedCache = { html: null, at: 0 };
  var hotCache = {};
  var level2Bound = false;

  function st() { return global.IfluxNewsStore; }
  function ui() { return global.IfluxNewsUI; }
  function tax() { return global.IfluxWatchlistTaxonomy; }

  function routeUrl(key) {
    var R = global.IfluxRoutes;
    if (R && R.to) return R.to(key);
    var c = (key === 'news') ? '/tin-tuc' : '/';
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function idHref(canonical) {
    return global.IfluxHref ? IfluxHref.forCanonical(canonical) : canonical;
  }

  /* Task5 — Heart = Foundation; Store = Watchlist data. Không tải watchlist-ui. */
  var heartLoadPromise = null;
  var HEART_JS = '/design_system/04_components/29_follow/follow.js?v=r20261002a';
  var STORE_JS = '/User_Web/iflux-web-ui/watchlist-store.js?v=f604e76323';

  function ensureHeartLazy() {
    if (global.IfluxHeartAction && global.IfluxWatchlistStore) {
      return Promise.resolve();
    }
    if (heartLoadPromise) return heartLoadPromise;
    function loadScript(src) {
      return new Promise(function (resolve) {
        if (document.querySelector('script[src="' + src + '"]')) {
          resolve();
          return;
        }
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { resolve(); };
        document.head.appendChild(s);
      });
    }
    heartLoadPromise = loadScript(STORE_JS)
      .then(function () { return loadScript(HEART_JS); })
      .then(function () {
        if (global.IfluxHeartAction && IfluxHeartAction.bind) {
          IfluxHeartAction.bind(document);
        }
      });
    return heartLoadPromise;
  }

  function scheduleHeartClickLazy() {
    if (document.__ifxComHeartClickLazy) return;
    document.__ifxComHeartClickLazy = true;
    document.addEventListener('click', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('[data-ifx-heart], .ifx-heart, .ifx-cap-tile__heart, .ifx-com-story-rank__heart')) {
        ensureHeartLazy();
      }
    }, true);
  }

  /* Permission SoT = IfluxEntitlements. Composite chỉ HỎI engine, không tự quyết.
     Engine vắng mặt => fail-closed (không lộ block paywall). */
  function applyBlockGate(root) {
    if (!root || !global.IfluxBlockGate) return;
    IfluxBlockGate.apply('news');
  }

  function readCollectionIndex() {
    var path = String(location.pathname || '').replace(/\/+$/, '') || '/';
    if ((path === '/tin-tuc/chu-de' || path === '/cong-dong/chu-de')) return 'topic';
    if ((path === '/tin-tuc/tac-gia' || path === '/cong-dong/tac-gia')) return 'author';
    if ((path === '/tin-tuc/danh-muc' || path === '/cong-dong/danh-muc')) return 'category';
    return null;
  }

  function readPathCollection() {
    var path = String(location.pathname || '');
    if (readCollectionIndex()) return null;
    var m;
    m = path.match(/\/(?:tin-tuc|cong-dong)\/chu-de\/([^/]+)\/?$/);
    if (m) return { type: 'topic', id: decodeURIComponent(m[1]) };
    m = path.match(/\/(?:tin-tuc|cong-dong)\/tac-gia\/([^/]+)\/?$/);
    if (m) return { type: 'author', id: decodeURIComponent(m[1]) };
    m = path.match(/\/(?:tin-tuc|cong-dong)\/danh-muc\/([^/]+)\/?$/);
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

  /* Dùng cho /news/followed, /news/follow, /news/unfollow (auth bắt buộc) — cùng mẫu
     authHeaders()/token() đã có ở interaction/repost-modal.js. */
  function fetchJsonAuth(path, opts) {
    opts = opts || {};
    var headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    try {
      if (global.IfluxAuth && IfluxAuth.getToken) {
        var t = IfluxAuth.getToken();
        if (t) headers.Authorization = 'Bearer ' + t;
      }
    } catch (e) { /* ignore */ }
    return fetch(apiBase() + path, {
      method: opts.method || 'GET',
      headers: headers,
      credentials: 'same-origin',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) throw new Error((body.error && body.error.message) || body.error || ('HTTP ' + res.status));
        return (body && body.data) || body || {};
      });
    });
  }

  function isLoggedIn() {
    try { return !!(global.IfluxAuth && IfluxAuth.getToken && IfluxAuth.getToken()); }
    catch (e) { return false; }
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
    var c;
    if (kind === 'topic') {
      var slug = item.slug || item.id;
      c = (global.IfluxSeoUrl && IfluxSeoUrl.communityTopicHref)
        ? IfluxSeoUrl.communityTopicHref(slug)
        : '/tin-tuc/chu-de/' + encodeURIComponent(slug);
    } else if (kind === 'author') {
      var key = item.username || item.id || item.display_name;
      c = (global.IfluxSeoUrl && IfluxSeoUrl.communityAuthorHref)
        ? IfluxSeoUrl.communityAuthorHref(key)
        : '/tin-tuc/tac-gia/' + encodeURIComponent(key);
    } else {
      var cat = item.slug || item.id;
      c = (global.IfluxSeoUrl && IfluxSeoUrl.communityCategoryHref)
        ? IfluxSeoUrl.communityCategoryHref(cat)
        : '/tin-tuc/danh-muc/' + encodeURIComponent(cat);
    }
    return idHref(c);
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
      return fetchJson('/news/chu-de?limit=300').then(function (d) { return d.chu_de || []; });
    }
    if (kind === 'author') {
      return fetchJson('/news/authors?limit=300').then(function (d) { return d.authors || []; });
    }
    return fetchJson('/news/categories?limit=300').then(function (d) { return d.categories || []; });
  }

  function renderCollectionIndex(root, kind) {
    var meta = collectionMeta(kind);
    if (global.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
      IfluxPageDefinition.applyPatch({
        title: meta.title,
        intro: meta.intro
        /* documentTitle: chỉ từ Thiết lập SEO /seo/effective — cấm hardcode · iFlux */
      });
    }
    root.innerHTML =
      '<div class="ifx-com-feed-layout">' +
        '<div class="ifx-com-feed-main">' +
          '<div class="ifx-com-breadcrumb">' +
            '<a href="' + esc(routeUrl('news')) + '">Trang chủ</a>' +
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
    var params = new URLSearchParams(location.search);
    if (params.get('view') === 'group' && params.get('related_to') && ['entity', 'topic', 'stock', 'category'].indexOf(params.get('related_group')) >= 0) {
      return { relatedTo: { id: params.get('related_to') }, relatedGroup: params.get('related_group') };
    }
    var f = readListFilters();
    if (f.ticker) return { ticker: f.ticker };
    if (f.story) return { taxSource: 'chu-de', taxGroupId: f.story };
    if (f.family) return { taxSource: 'family', taxGroupId: f.family };
    if (f.sector) return { sectorId: f.sector };
    if (f.author) return { authorId: f.author, author: f.author };
    if (f.category) return { category: f.category, categoryId: f.category };
    /* Tab nổi bật: lọc theo UUID (FeedCard có category_id, không có slug). */
    if (state.featuredCategoryId) return { categoryId: state.featuredCategoryId };
    return {};
  }

  function fetchFeaturedCategories() {
    function unwrap(res) {
      var payload = (res && res.data) || res || {};
      return payload.categories || [];
    }
    if (global.IfluxApiClient && IfluxApiClient.listCommunityCategories) {
      return IfluxApiClient.listCommunityCategories({ featured: true })
        .then(unwrap)
        .catch(function () {
          return fetchJson('/news/categories?featured=1').then(unwrap).catch(function () { return []; });
        });
    }
    return fetchJson('/news/categories?featured=1').then(unwrap).catch(function () { return []; });
  }

  function tabIdFromState(activeId) {
    return activeId ? String(activeId) : FILTER_ALL;
  }

  function stateIdFromTab(tabId) {
    var id = String(tabId || '');
    if (!id || id === FILTER_ALL) return '';
    return id;
  }

  /** Tab Danh mục nổi bật + Tất cả — chuẩn Tab lớn (Owner 2026-10, điều chỉnh lại): có icon +
     text, không phải Block/Widget nhỏ nên dùng .ix-profile-tabs/.ix-profile-tab/.active — ĐÚNG
     mẫu entity-detail-center.js tabsBar(), không tự code mới. Icon category lấy từ c.icon (admin
     đặt, mặc định "ti ti-folder" — xem backend news-categories.service.js mapRow). */
  function featuredCatsTabsHtml(cats, activeId) {
    var activeTab = tabIdFromState(activeId);
    var allOn = activeTab === FILTER_ALL;
    var tabs =
      '<button type="button" class="ix-profile-tab' + (allOn ? ' active' : '') + '" role="tab"' +
        ' aria-selected="' + (allOn ? 'true' : 'false') + '"' +
        ' data-ifx-com-cat-id="' + FILTER_ALL + '"><i class="ti ti-apps"></i> Tất cả</button>';
    (cats || []).forEach(function (c) {
      var id = String(c.id || '');
      if (!id) return;
      var on = id === activeTab;
      tabs +=
        '<button type="button" class="ix-profile-tab' + (on ? ' active' : '') + '" role="tab"' +
          ' aria-selected="' + (on ? 'true' : 'false') + '"' +
          ' data-ifx-com-cat-id="' + esc(id) + '">' +
          '<i class="' + esc(c.icon || 'ti ti-folder') + '"></i> ' +
          esc(c.name || c.label || c.slug || '') +
        '</button>';
    });
    return (
      '<div class="ix-profile-tabs" role="tablist" aria-label="Danh mục chính" data-ifx-com-featured-cats>' +
        tabs +
      '</div>'
    );
  }

  function applyFeaturedTab(root, tabId) {
    if (!root) return;
    state.featuredCategoryId = stateIdFromTab(tabId);
    var activeTab = tabIdFromState(state.featuredCategoryId);
    root.querySelectorAll('[data-ifx-com-featured-cats] .ix-profile-tab').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-com-cat-id') === activeTab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    /* Acquisition = DailyFeed (WP-0) — không loadFeed ở page */
    mountDailyFeed(root);
  }

  function bindFeaturedTabs(root) {
    var rail = root && root.querySelector('[data-ifx-com-featured-cats]');
    if (!rail || rail._ifxFeaturedBound) return;
    rail._ifxFeaturedBound = true;
    rail.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-ifx-com-cat-id]') : null;
      if (!btn || !rail.contains(btn)) return;
      var id = btn.getAttribute('data-ifx-com-cat-id');
      if (id == null) return;
      if (stateIdFromTab(id) === state.featuredCategoryId) return;
      applyFeaturedTab(root, id);
    });
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
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('news')) + '">Xem tất cả</a>' +
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
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('news')) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.author) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-user"></i> Tác giả: <strong>' + f.author + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('news')) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.category) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-category"></i> Danh mục: <strong>' + f.category + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('news')) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    return '';
  }

  /**
   * Sidebar Page Feature hooks — hosts Published Widget do Layout Engine dựng.
   */
  /* Khung trang chung (buildPageFrame): host Sidebar/Main + nội dung đặc thù (bộ lọc, tab nổi bật, feed).
   * Host rỗng / Sidebar không có gì tự ẩn bằng CSS — không cần đồng bộ lại sau khi mount. */
  function renderShell(root, showToplevel) {
    if (!root) return;
    root.innerHTML = '';
    var group = listFilterParams().relatedGroup;
    var frame = global.IfluxRuntimeSections.buildPageFrame(root, { sidebarLabel: 'Tin tức', noSidebar: !!group });
    var groupTitles = { entity: 'Bài viết liên quan', topic: 'Bài viết cùng chủ đề', stock: 'Bài viết liên quan', category: 'Bài viết cùng danh mục' };
    /* Slot tab nổi bật + feed — "Bản tin" (nếu có lớp Toplevel) là CỤM NÀY Y NGUYÊN, chỉ bọc thêm
       1 wrapper có thể ẩn/hiện (showToplevel). Không có lớp Toplevel (group/URL filter đang hoạt
       động) → render y hệt bản gốc, không wrapper, không đổi hành vi. */
    var bulletinInner =
      '<div data-ifx-com-featured-cats-slot></div>' +
      '<div data-ifx-com-daily-feed></div>';
    var wantRegions = !!showToplevel && !group;
    /* Mobile (Bottom Nav Cấp 2) — nút tab trong trang KHÔNG render (Bottom Nav thay thế hẳn,
       cùng nguyên tắc đã áp dụng cho Dòng tiền: "mobile không tải/hiện thanh tab desktop"), còn
       3 vùng nội dung (bulletin/followed/hot) vẫn phải tồn tại trong DOM — Cấp 2 điều khiển qua
       applyViewFromUrl()/onLevel2Change() bên dưới, không qua click nút. */
    state.lazyMode = !!(global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell && global.IfluxBreakpoint.isMobileShell());
    if (wantRegions && !state.toplevelTab) state.toplevelTab = TOPLEVEL_DEFAULT;
    frame.mainContent.innerHTML =
      (group ? '<div class="ifx-com-list-head"><h1 class="ifx-com-list-title">' + groupTitles[group] + '</h1></div>' : filterBannerHtml()) +
      (wantRegions && !state.lazyMode ? toplevelTabsHtml(state.toplevelTab) : '') +
      (wantRegions
        ? '<div data-ifx-news-bulletin-region' + (state.toplevelTab !== 'bulletin' ? ' hidden' : '') + '>' + bulletinInner + '</div>' +
          '<div data-ifx-news-followed-region' + (state.toplevelTab !== 'followed' ? ' hidden' : '') + '></div>' +
          '<div data-ifx-news-hot-region' + (state.toplevelTab !== 'hot' ? ' hidden' : '') + '></div>'
        : bulletinInner);
    applyBlockGate(root);
    state.frame = frame;
    if (wantRegions) {
      if (state.lazyMode) {
        /* Bottom Nav Cấp 2 — y hệt pattern community-page.js (main/sidebar-left): 1 vùng DOM
           hiển thị tại 1 lúc, state sống trong URL (?view=), tự khớp cold-load/popstate. */
        frame.layout.setAttribute('data-ifx-region-mode', 'single');
        ensureLevel2Bound();
        if (!applyViewFromUrl()) activateRegion(root, state.toplevelTab);
      } else {
        bindToplevelTabs(root);
      }
    }
    state.shellReady = true;
  }

  /** Bơm tab vào slot Main — không đụng feed-layout / sidebar host. */
  function injectFeaturedTabs(root) {
    var slot = root && root.querySelector('[data-ifx-com-featured-cats-slot]');
    if (listFilterParams().relatedGroup) return;
    if (!slot) return;
    slot.innerHTML = featuredCatsTabsHtml(state.featuredCats, state.featuredCategoryId);
    bindFeaturedTabs(root);
  }

  /* ───────────────── Lớp danh mục cấp cao: Bạn quan tâm | Bản tin | Tin nóng ─────────────────
     Icon .ix-stat-icon (tầng nền chung Admin_Design_system/iflux-admin-ui — tái dùng ĐÚNG màu
     Owner chỉ định: success/accent/danger đã map sẵn), size-override 64×44/font-size-48 riêng
     cho Tin tức qua class ifx-news-toplevel-icon (quy ước ifx- cho phần mới, xem news.css). */
  var TOPLEVEL_TABS = [
    { key: 'followed', label: 'Bạn quan tâm', icon: 'ti-star',  cls: 'success' },
    { key: 'bulletin', label: 'Bản tin',       icon: 'ti-news', cls: 'accent' },
    { key: 'hot',       label: 'Tin nóng',      icon: 'ti-flame', cls: 'danger' }
  ];

  function toplevelTabsHtml(active) {
    var html = '<div class="ifx-news-toplevel-tabs" role="tablist" aria-label="Danh mục Tin tức" data-ifx-news-toplevel>';
    TOPLEVEL_TABS.forEach(function (t) {
      var on = t.key === active;
      html +=
        '<button type="button" class="ifx-news-toplevel-tab' + (on ? ' active' : '') + '" role="tab"' +
          ' aria-selected="' + (on ? 'true' : 'false') + '" data-ifx-news-toplevel-key="' + t.key + '">' +
          '<span class="ix-stat-icon ifx-news-toplevel-icon ' + t.cls + '"><i class="ti ' + t.icon + '"></i></span>' +
          '<span class="ifx-news-toplevel-label">' + esc(t.label) + '</span>' +
        '</button>';
    });
    html += '</div>';
    return html;
  }

  function followedEmptyStateHtml() {
    return (
      '<div class="ifx-news-empty-state">' +
        '<i class="ti ti-star" aria-hidden="true"></i>' +
        '<p>Bạn chưa theo dõi Cổ phiếu, Ngành, Hệ sinh thái hay Câu chuyện nào. Theo dõi để xem tin tức liên quan ở đây.</p>' +
        '<div class="ifx-news-empty-state__actions">' +
          '<a class="ix-btn ix-btn-outline" href="' + esc(idHref('/dong-tien')) + '">Khám phá Dòng tiền</a>' +
          '<a class="ix-btn ix-btn-outline" href="' + esc(idHref('/cong-dong')) + '">Khám phá Cộng đồng</a>' +
        '</div>' +
      '</div>'
    );
  }

  function followedLoginPromptHtml() {
    return (
      '<div class="ifx-news-empty-state">' +
        '<i class="ti ti-login" aria-hidden="true"></i>' +
        '<p>Đăng nhập để xem tin tức theo các thực thể bạn đang quan tâm.</p>' +
        '<div class="ifx-news-empty-state__actions">' +
          '<a class="ix-btn ix-btn-primary" href="' + esc(idHref('/dang-nhap')) + '">Đăng nhập</a>' +
        '</div>' +
      '</div>'
    );
  }

  function renderFollowedRegion(root) {
    var el = root && root.querySelector('[data-ifx-news-followed-region]');
    if (!el) return;
    if (!isLoggedIn()) { el.innerHTML = followedLoginPromptHtml(); return; }
    if (followedCache.html && Date.now() - followedCache.at < FEED_TTL_MS) {
      el.innerHTML = followedCache.html;
      return;
    }
    el.innerHTML = '<div class="ifx-news-region-loading"><i class="ti ti-loader-2"></i> Đang tải…</div>';
    fetchJsonAuth('/news/followed?limit=30').then(function (data) {
      var cards = data.cards || [];
      var html = cards.length
        ? '<div class="ifx-com-feed-grid">' + cards.map(function (c) { return global.IfluxNewsUI.postCardHtml(c); }).join('') + '</div>'
        : followedEmptyStateHtml();
      followedCache = { html: html, at: Date.now() };
      if (state.toplevelTab === 'followed') el.innerHTML = html;
    }).catch(function () {
      el.innerHTML = '<div class="ifx-news-region-error"><p>Không tải được. Vui lòng thử lại.</p></div>';
    });
  }

  function hotSubTabsHtml(activeRange) {
    var ranges = [['day', 'Hôm nay'], ['week', 'Tuần này'], ['month', 'Tháng này']];
    var html = '<div class="ix-profile-tabs ifx-news-hot-subtabs" role="tablist" data-ifx-news-hot-subtabs>';
    ranges.forEach(function (r) {
      var on = r[0] === activeRange;
      html += '<button type="button" class="ix-profile-tab' + (on ? ' active' : '') + '" role="tab"' +
        ' aria-selected="' + (on ? 'true' : 'false') + '" data-ifx-news-hot-range="' + r[0] + '">' + r[1] + '</button>';
    });
    html += '</div><div class="ifx-news-hot-list" data-ifx-news-hot-list></div>';
    return html;
  }

  function loadHotList(regionEl, range) {
    var listEl = regionEl.querySelector('[data-ifx-news-hot-list]');
    if (!listEl) return;
    var cached = hotCache[range];
    if (cached && Date.now() - cached.at < FEED_TTL_MS) { listEl.innerHTML = cached.html; return; }
    listEl.innerHTML = '<div class="ifx-news-region-loading"><i class="ti ti-loader-2"></i> Đang tải…</div>';
    fetchJson('/news/hot?range=' + range + '&limit=20').then(function (data) {
      var cards = data.cards || [];
      var html = cards.length
        ? '<div class="ifx-com-feed-grid">' + cards.map(function (c) { return global.IfluxNewsUI.postCardHtml(c); }).join('') + '</div>'
        : '<div class="ifx-news-empty-state"><p>Chưa có bài viết nổi bật trong khung giờ này.</p></div>';
      hotCache[range] = { html: html, at: Date.now() };
      if (state.hotRange === range && state.toplevelTab === 'hot') listEl.innerHTML = html;
    }).catch(function () {
      listEl.innerHTML = '<div class="ifx-news-region-error"><p>Không tải được. Vui lòng thử lại.</p></div>';
    });
  }

  function renderHotRegion(root) {
    var el = root && root.querySelector('[data-ifx-news-hot-region]');
    if (!el) return;
    if (!el._ifxHotBound) {
      el._ifxHotBound = true;
      el.innerHTML = hotSubTabsHtml(state.hotRange);
      el.querySelector('[data-ifx-news-hot-subtabs]').addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('[data-ifx-news-hot-range]') : null;
        if (!btn) return;
        var range = btn.getAttribute('data-ifx-news-hot-range');
        if (range === state.hotRange) return;
        state.hotRange = range;
        el.querySelectorAll('[data-ifx-news-hot-range]').forEach(function (b) {
          var on = b.getAttribute('data-ifx-news-hot-range') === range;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        loadHotList(el, range);
      });
    }
    loadHotList(el, state.hotRange);
  }

  function activateToplevelRegion(root, tab) {
    if (tab === 'followed') renderFollowedRegion(root);
    else if (tab === 'hot') renderHotRegion(root);
    else mountDailyFeed(root); /* bulletin — cụm cũ, tự TTL theo pane, hành vi KHÔNG đổi */
  }

  function applyToplevelTab(root, tab) {
    if (!root || tab === state.toplevelTab) return;
    state.toplevelTab = tab;
    root.querySelectorAll('[data-ifx-news-toplevel] [data-ifx-news-toplevel-key]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-news-toplevel-key') === tab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var bulletinEl = root.querySelector('[data-ifx-news-bulletin-region]');
    var followedEl = root.querySelector('[data-ifx-news-followed-region]');
    var hotEl = root.querySelector('[data-ifx-news-hot-region]');
    if (bulletinEl) bulletinEl.hidden = tab !== 'bulletin';
    if (followedEl) followedEl.hidden = tab !== 'followed';
    if (hotEl) hotEl.hidden = tab !== 'hot';
    activateToplevelRegion(root, tab);
  }

  function bindToplevelTabs(root) {
    var rail = root && root.querySelector('[data-ifx-news-toplevel]');
    if (!rail) return;
    if (!rail._ifxToplevelBound) {
      rail._ifxToplevelBound = true;
      rail.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('[data-ifx-news-toplevel-key]') : null;
        if (!btn) return;
        applyToplevelTab(root, btn.getAttribute('data-ifx-news-toplevel-key'));
      });
    }
    activateToplevelRegion(root, state.toplevelTab);
  }

  /* ───────────────── Bottom Nav Cấp 2 mobile (sidebar-left="Thịnh hành" = Widget Host Admin tự
     cấu hình, mount riêng ở widgets/news-page/index.js — xem đó) — Y HỆT pattern đã có ở
     community-page.js (main/sidebar-left): 1 vùng DOM hiển thị tại 1 lúc qua
     [data-ifx-region-mode="single"]/[data-ifx-region-visible] (app-shell.css, generic sẵn),
     state sống trong URL (?view=), applyViewFromUrl() tự khớp cold-load/popstate. */
  function toggleRegionVisibility(key) {
    if (!state.frame || !state.lazyMode) return;
    var layout = state.frame.layout;
    layout.querySelectorAll('[data-ifx-region-visible]').forEach(function (n) {
      n.removeAttribute('data-ifx-region-visible');
    });
    var target = layout.querySelector(key === 'sidebar-left' ? '.ifx-shell-sidebar' : '.ifx-shell-main');
    if (target) target.setAttribute('data-ifx-region-visible', '');
  }

  /* LUÔN activate thật (không qua applyToplevelTab() — hàm đó có guard "đã active thì bỏ qua",
     chỉ đúng cho click chuột; cold-load/popstate cần activate dù state.toplevelTab tình cờ đã
     trùng giá trị mặc định set sẵn ở renderShell()). */
  function activateRegion(root, key) {
    toggleRegionVisibility(key);
    if (key === 'sidebar-left') return;
    state.toplevelTab = key;
    activateToplevelRegion(root, key);
    root.querySelectorAll('[data-ifx-news-toplevel] [data-ifx-news-toplevel-key]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-news-toplevel-key') === key;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  /* Đọc lại ?view= hiện tại và áp dụng — dùng cho cold load thẳng vào URL có ?view= lẫn khi
     popstate "nhẹ". Tự phát 'iflux-level2-change' — đường cold load KHÔNG đi qua
     setActiveRegion()/openLevel2() (AppShell) nên phải tự phát ở đây để widgets/news-page/
     index.js (mount Widget Host sidebar) biết mà chạy. */
  function applyViewFromUrl() {
    var shell = global.IfluxAppShell;
    var root = document.querySelector('[data-ifx-community-feed]');
    if (!root || !state.frame || !shell || !shell.isLevel2Open || !shell.isLevel2Open()) return false;
    var region = shell.activeSectionKey() || TOPLEVEL_DEFAULT;
    activateRegion(root, region);
    try {
      document.dispatchEvent(new CustomEvent('iflux-level2-change', {
        detail: { itemKey: shell.currentLevel2Item ? shell.currentLevel2Item() : null, regionKey: region, open: true }
      }));
    } catch (e) { /* ignore */ }
    return true;
  }

  function onLevel2Change(e) {
    var root = document.querySelector('[data-ifx-community-feed]');
    if (!root || !state.frame) return;
    var d = (e && e.detail) || {};
    if (!d.open) { activateRegion(root, state.toplevelTab || TOPLEVEL_DEFAULT); return; }
    activateRegion(root, d.regionKey);
  }

  function ensureLevel2Bound() {
    if (level2Bound) return;
    level2Bound = true;
    global.__ifxPageRuntime = global.__ifxPageRuntime || {};
    global.__ifxPageRuntime.onSamePagePopState = applyViewFromUrl;
    document.addEventListener('iflux-level2-change', onLevel2Change);
  }

  function dispose() {
    if (level2Bound) {
      document.removeEventListener('iflux-level2-change', onLevel2Change);
      level2Bound = false;
    }
    state.frame = null;
    state.lazyMode = false;
  }

  /* Mỗi tab một khung feed riêng, giữ lại khi đổi tab: quay lại tab đã xem → hiện ngay, không tải lại.
   * Khung cũ hơn FEED_TTL_MS được dựng lại để tin mới vẫn xuất hiện. */
  var FEED_TTL_MS = 5 * 60 * 1000;

  function mountDailyFeed(root) {
    var mount = root.querySelector('[data-ifx-com-daily-feed]');
    if (!mount || !global.IfluxDailyFeed) return;
    var filter = listFilterParams();
    var key = JSON.stringify(filter);
    var pane = null;
    Array.prototype.forEach.call(mount.children, function (el) {
      var on = el.getAttribute('data-ifx-feed-key') === key;
      el.hidden = !on;
      if (on) pane = el;
    });
    if (pane && Date.now() - Number(pane.getAttribute('data-ifx-feed-at')) < FEED_TTL_MS) return;
    if (!pane) {
      pane = document.createElement('div');
      pane.setAttribute('data-ifx-feed-key', key);
      mount.appendChild(pane);
    }
    pane.setAttribute('data-ifx-feed-at', String(Date.now()));
    IfluxDailyFeed.mount(pane, {
      filter: filter,
      groupByDay: !!filter.relatedGroup,
      showExperts: !filter.relatedGroup,
      expertTitle: 'Bài viết của chuyên gia'
    });
  }

  function boot() {
    var root = document.querySelector('[data-ifx-community-feed]');
    if (!root) return;
    scheduleHeartClickLazy();
    var grouped = !!listFilterParams().relatedGroup;
    document.querySelectorAll('.ifx-app-header').forEach(function (header) {
      if (grouped) header.setAttribute('data-ifx-header-mode', 'news-group');
      else if (header.getAttribute('data-ifx-header-mode') === 'news-group') header.removeAttribute('data-ifx-header-mode');
      if (header._ifxSyncContextBack) header._ifxSyncContextBack();
    });

    var indexKind = readCollectionIndex();
    if (indexKind) {
      renderCollectionIndex(root, indexKind);
      return;
    }

    /* Lớp Toplevel (Bạn quan tâm/Bản tin/Tin nóng) chỉ hiện ở trang Tin tức "thường" — group hay
       bất kỳ URL/path filter nào (ticker/story/family/sector/author/category) đều giữ nguyên
       hành vi cũ (renderShell tự render bản KHÔNG wrapper khi showToplevel=false). Tính trước
       renderShell() nên gọi readListFilters()/readPathCollection() ở đây (rẻ, thuần đọc URL) —
       không tái cấu trúc phần dưới vốn gọi lại 2 hàm này cho các nhánh khác, tránh rủi ro. */
    var showToplevel = !grouped && !(function () {
      var uf = readListFilters();
      return !!(uf.ticker || uf.story || uf.family || uf.sector || uf.author || uf.category || readPathCollection());
    })();

    /* Shell đồng bộ trước — Layout Engine mount sidebar vào aside trong grid. */
    renderShell(root, showToplevel);
    if (grouped) { mountDailyFeed(root); return; }

    /* Default Filter State = ALL (SOL-CAL-05). URL/path filter → listFilterParams, không ép featured. */
    var urlFilters = readListFilters();
    var pathColl = readPathCollection();
    var hasUrlFilter = !!(urlFilters.ticker || urlFilters.story || urlFilters.family ||
      urlFilters.sector || urlFilters.author || urlFilters.category || pathColl);

    /* Author / category / topic detail — Admin SEO template (com-author / com-cat / com-topic). */
    if (pathColl && pathColl.type === 'author' && global.IfluxSeoTitle && IfluxSeoTitle.apply) {
      var authorId = pathColl.id;
      loadCollectionIndex('author').then(function (items) {
        var hit = null;
        (items || []).some(function (it) {
          var key = String(it.username || it.id || it.display_name || '');
          if (key === authorId || String(it.id) === authorId) {
            hit = it;
            return true;
          }
          return false;
        });
        var authorName = (hit && (hit.display_name || hit.name)) || authorId;
        IfluxSeoTitle.apply({
          vars: { authorName: authorName },
          fallbackTitle: 'iFlux | ' + authorName,
          patch: { title: authorName }
        });
      }).catch(function () {
        IfluxSeoTitle.apply({
          vars: { authorName: authorId },
          fallbackTitle: 'iFlux | ' + authorId
        });
      });
    } else if (pathColl && pathColl.type === 'category' && global.IfluxSeoTitle && IfluxSeoTitle.apply) {
      var catId = pathColl.id;
      loadCollectionIndex('category').then(function (items) {
        var hit = null;
        (items || []).some(function (it) {
          if (String(it.slug || '') === catId || String(it.id || '') === catId) {
            hit = it;
            return true;
          }
          return false;
        });
        var categoryName = (hit && (hit.name || hit.label)) || catId;
        IfluxSeoTitle.apply({
          vars: { categoryName: categoryName },
          fallbackTitle: 'iFlux | ' + categoryName,
          patch: { title: categoryName }
        });
      }).catch(function () {
        IfluxSeoTitle.apply({
          vars: { categoryName: catId },
          fallbackTitle: 'iFlux | ' + catId
        });
      });
    } else if (pathColl && pathColl.type === 'topic' && global.IfluxSeoTitle && IfluxSeoTitle.apply) {
      var topicId = pathColl.id;
      loadCollectionIndex('topic').then(function (items) {
        var hit = null;
        (items || []).some(function (it) {
          if (String(it.slug || '') === topicId || String(it.id || '') === topicId) {
            hit = it;
            return true;
          }
          return false;
        });
        var topicName = (hit && (hit.label || hit.name)) || topicId;
        IfluxSeoTitle.apply({
          vars: { storyName: topicName, name: topicName, title: topicName },
          fallbackTitle: 'iFlux | ' + topicName,
          patch: { title: topicName }
        });
      }).catch(function () {
        IfluxSeoTitle.apply({
          vars: { storyName: topicId, name: topicId },
          fallbackTitle: 'iFlux | ' + topicId
        });
      });
    }

    state.featuredCategoryId = '';

    fetchFeaturedCategories().then(function (cats) {
      state.featuredCats = cats || [];
      if (hasUrlFilter) state.featuredCategoryId = '';
      injectFeaturedTabs(root);
      mountDailyFeed(root);
    }).catch(function () {
      injectFeaturedTabs(root);
      mountDailyFeed(root);
    });

    document.addEventListener('iflux-watchlist-change', function () {
      ensureHeartLazy().then(function () {
        if (global.IfluxHeartAction) IfluxHeartAction.refresh();
      });
    });
    document.addEventListener('iflux-heart-change', function () {
      if (global.IfluxHeartAction) IfluxHeartAction.refresh();
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  global.IfluxNewsPage = {
    init: init,
    dispose: dispose
  };
})(window);
