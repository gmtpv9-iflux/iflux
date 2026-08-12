/* Trang feed Cộng đồng — shell · featured tabs (ALL|UUID) · DailyFeed A/B */
(function (global) {
  'use strict';

  var FILTER_ALL = 'ALL';

  var state = {
    shellReady: false,
    featuredCats: [],
    /* '' = ALL (SOL-CAL-05) */
    featuredCategoryId: ''
  };

  function st() { return global.IfluxCommunityStore; }
  function ui() { return global.IfluxCommunityUI; }
  function tax() { return global.IfluxWatchlistTaxonomy; }

  function routeUrl(key) {
    var R = global.IfluxRoutes;
    if (R && R.to) return R.to(key);
    var c = key === 'community' ? '/cong-dong' : '/';
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function idHref(canonical) {
    return global.IfluxHref ? IfluxHref.forCanonical(canonical) : canonical;
  }

  /* Task5 — Heart = Foundation; Store = Watchlist data. Không tải watchlist-ui. */
  var heartLoadPromise = null;
  var HEART_JS = '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724';
  var STORE_JS = '/User_Web/iflux-web-ui/watchlist-store.js?v=followFound20260724';

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
    var c;
    if (kind === 'topic') {
      var slug = item.slug || item.id;
      c = (global.IfluxSeoUrl && IfluxSeoUrl.communityTopicHref)
        ? IfluxSeoUrl.communityTopicHref(slug)
        : '/cong-dong/chu-de/' + encodeURIComponent(slug);
    } else if (kind === 'author') {
      var key = item.username || item.id || item.display_name;
      c = (global.IfluxSeoUrl && IfluxSeoUrl.communityAuthorHref)
        ? IfluxSeoUrl.communityAuthorHref(key)
        : '/cong-dong/tac-gia/' + encodeURIComponent(key);
    } else {
      var cat = item.slug || item.id;
      c = (global.IfluxSeoUrl && IfluxSeoUrl.communityCategoryHref)
        ? IfluxSeoUrl.communityCategoryHref(cat)
        : '/cong-dong/danh-muc/' + encodeURIComponent(cat);
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
        intro: meta.intro
        /* documentTitle: chỉ từ Thiết lập SEO /seo/effective — cấm hardcode · iFlux */
      });
    }
    root.innerHTML =
      '<div class="ifx-com-feed-layout">' +
        '<div class="ifx-com-feed-main">' +
          '<div class="ifx-com-breadcrumb">' +
            '<a href="' + esc(routeUrl('community')) + '">Trang chủ</a>' +
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
    /* Tab nổi bật: lọc theo UUID (FeedCard có category_id, không có slug). */
    if (state.featuredCategoryId) return { categoryId: state.featuredCategoryId };
    return {};
  }

  function categoryIconClass(icon) {
    var s = String(icon || '').trim();
    if (!s) return 'ti ti-category';
    if (/^ti\s+ti-/.test(s)) return s;
    if (s.indexOf('ti-') === 0) return 'ti ' + s;
    return 'ti ti-category';
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
          return fetchJson('/community/categories?featured=1').then(unwrap).catch(function () { return []; });
        });
    }
    return fetchJson('/community/categories?featured=1').then(unwrap).catch(function () { return []; });
  }

  function tabIdFromState(activeId) {
    return activeId ? String(activeId) : FILTER_ALL;
  }

  function stateIdFromTab(tabId) {
    var id = String(tabId || '');
    if (!id || id === FILTER_ALL) return '';
    return id;
  }

  /** Tab Danh mục nổi bật + Tất cả — DS: .ix-tabs / .ix-tab / .active */
  function featuredCatsTabsHtml(cats, activeId) {
    var activeTab = tabIdFromState(activeId);
    var allOn = activeTab === FILTER_ALL;
    var tabs =
      '<button type="button" class="ix-tab' + (allOn ? ' active' : '') + '" role="tab"' +
        ' aria-selected="' + (allOn ? 'true' : 'false') + '"' +
        ' data-ifx-com-cat-id="' + FILTER_ALL + '">' +
        '<i class="ti ti-layout-grid" aria-hidden="true"></i> Tất cả' +
      '</button>';
    (cats || []).forEach(function (c) {
      var id = String(c.id || '');
      if (!id) return;
      var on = id === activeTab;
      tabs +=
        '<button type="button" class="ix-tab' + (on ? ' active' : '') + '" role="tab"' +
          ' aria-selected="' + (on ? 'true' : 'false') + '"' +
          ' data-ifx-com-cat-id="' + esc(id) + '">' +
          '<i class="' + esc(categoryIconClass(c.icon)) + '" aria-hidden="true"></i> ' +
          esc(c.name || c.label || c.slug || '') +
        '</button>';
    });
    return (
      '<div class="ix-tabs" role="tablist" aria-label="Danh mục chính" data-ifx-com-featured-cats>' +
        tabs +
      '</div>'
    );
  }

  function applyFeaturedTab(root, tabId) {
    if (!root) return;
    state.featuredCategoryId = stateIdFromTab(tabId);
    var activeTab = tabIdFromState(state.featuredCategoryId);
    root.querySelectorAll('[data-ifx-com-featured-cats] .ix-tab').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-com-cat-id') === activeTab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    /* Acquisition = DailyFeed (WP-0) — không loadFeed ở page */
    mountDailyFeed(root);
    syncEmptyHostChrome(root);
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
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('community')) + '">Xem tất cả</a>' +
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
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('community')) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.author) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-user"></i> Tác giả: <strong>' + f.author + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('community')) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    if (f.category) {
      return (
        '<div class="ifx-com-ticker-banner">' +
          '<div class="ifx-com-ticker-banner__text">' +
            '<i class="ti ti-category"></i> Danh mục: <strong>' + f.category + '</strong>' +
          '</div>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(routeUrl('community')) + '">Xem tất cả</a>' +
        '</div>'
      );
    }
    return '';
  }

  /**
   * Sidebar Page Feature hooks — hosts Published Widget do Layout Engine dựng.
   */
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

  /* AppShell Foundation VR-02 (100826): Right Sidebar host phải qua ensureSections()
   * canonical (giống Home/Market/Flow) — không tự dựng <aside> bằng HTML cứng. */
  function renderShell(root) {
    if (!root) return;
    var banner = filterBannerHtml();

    root.innerHTML = '<div class="ifx-com-feed-layout"></div>';
    var layout = root.querySelector('.ifx-com-feed-layout');
    layout.insertAdjacentHTML('beforeend',
      '<div class="ifx-com-feed-main">' +
        '<section class="ifx-com-list-section ifx-com-list-section--community" hidden>' +
          '<div class="ifx-com-list-head" hidden>' +
            '<h2 class="ifx-com-list-title"><i class="ti ti-layout-grid"></i> Tổng quan</h2>' +
          '</div>' +
          banner +
          '<div class="ifx-dash-grid ifx-com-dedicated-grid" data-ifx-section="main"></div>' +
        '</section>' +
        /* Slot tab nổi bật — chỉ bơm nội dung, không renderShell lại (tránh phá host sidebar). */
        '<div data-ifx-com-featured-cats-slot></div>' +
        /* Tin tức = nội dung đặc thù trang — không gắn data-ifx-ent-block / không thuộc ma trận Widget. */
        '<div data-ifx-com-daily-feed></div>' +
      '</div>'
    );

    var sectionApi = global.IfluxRuntimeSections;
    var sections = sectionApi && sectionApi.ensureSections
      ? sectionApi.ensureSections(layout, { sections: [{ key: 'sidebar-right', label: 'Cộng đồng' }] })
      : null;
    if (sections && sections['sidebar-right']) {
      sections['sidebar-right'].classList.add('ifx-com-feed-sidebar');
      sections['sidebar-right'].hidden = true;
    }

    applyBlockGate(root);
    /* Chưa mount Placement → tạm 1 cột; syncEmptyHostChrome chỉnh lại sau. */
    layout.style.gridTemplateColumns = 'minmax(0, 1fr)';
    state.shellReady = true;
  }

  /** Bơm tab vào slot Main — không đụng feed-layout / sidebar host. */
  function injectFeaturedTabs(root) {
    var slot = root && root.querySelector('[data-ifx-com-featured-cats-slot]');
    if (!slot) return;
    slot.innerHTML = featuredCatsTabsHtml(state.featuredCats, state.featuredCategoryId);
    bindFeaturedTabs(root);
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
    scheduleHeartClickLazy();

    var indexKind = readCollectionIndex();
    if (indexKind) {
      renderCollectionIndex(root, indexKind);
      return;
    }

    /* Shell đồng bộ trước — Layout Engine mount sidebar vào aside trong grid. */
    renderShell(root);

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
      syncEmptyHostChrome(root);
    }).catch(function () {
      injectFeaturedTabs(root);
      mountDailyFeed(root);
      syncEmptyHostChrome(root);
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

  global.IfluxCommunityPage = {
    init: init,
    syncEmptyHostChrome: syncEmptyHostChrome
  };
})(window);
