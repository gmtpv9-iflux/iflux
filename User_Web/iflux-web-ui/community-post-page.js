/* Trang chi tiết bài viết — SEO/GEO + sidebar */
(function (global) {
  'use strict';

  var currentSlug = '';

  function st() { return global.IfluxCommunityStore; }
  function ui() { return global.IfluxCommunityUI; }

  function routeUrl(key) {
    var R = global.IfluxRoutes;
    if (R && R.to) return R.to(key);
    if (key === 'community') return '/cong-dong';
    return '/';
  }

  function consumerNavigate(canonical) {
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical);
      return;
    }
    global.location.href = canonical;
  }

  function userId() {
    return ui().currentUserId();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function schemaType(post) {
    var t = post.schema && post.schema.type ? post.schema.type : 'NewsArticle';
    return 'https://schema.org/' + t;
  }

  function slugifyHeading(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  }

  function prepareArticleBody(html) {
    var div = document.createElement('div');
    div.innerHTML = html || '';
    /* Ảnh RSS/editor thường có width/height cố định → tràn khung; bỏ attr + inline để CSS fit full width */
    div.querySelectorAll('img').forEach(function (img) {
      img.removeAttribute('width');
      img.removeAttribute('height');
      try {
        img.style.removeProperty('width');
        img.style.removeProperty('height');
        img.style.removeProperty('max-width');
        img.style.removeProperty('min-width');
      } catch (e) { /* ignore */ }
    });
    var headings = [];
    var used = {};
    div.querySelectorAll('h2').forEach(function (h2, i) {
      var text = (h2.textContent || '').trim();
      if (!text) return;
      var id = slugifyHeading(text) || ('section-' + (i + 1));
      var base = id;
      var n = 1;
      while (used[id]) {
        id = base + '-' + (++n);
      }
      used[id] = true;
      h2.id = id;
      headings.push({ id: id, text: text });
    });
    return { html: div.innerHTML, headings: headings };
  }

  function scrollOffsetTop() {
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ifx-topnav-h'), 10);
    return (isNaN(navH) ? 56 : navH) + 20;
  }

  function scrollToHeading(el) {
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - scrollOffsetTop();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function renderArticleMain(post, slug, uid, liked, favorited, bodyHtml) {
    var seo = post.seo || {};
    var geo = post.geo || {};
    var published = post.published_at || post.created_at;
    var modified = post.updated_at || published;
    var canonical = global.IfluxSeoUrl
      ? IfluxSeoUrl.postCanonical(post)
      : ((post.metadata && (post.metadata.canonical || post.metadata.url)) || '');

    return (
      '<article class="ifx-com-article" itemscope itemtype="' + schemaType(post) + '">' +
        '<link itemprop="mainEntityOfPage" href="' + esc(canonical) + '" />' +
        '<meta itemprop="inLanguage" content="' + esc(geo.language || 'vi-VN') + '" />' +
        (geo.region ? '<meta itemprop="contentLocation" content="' + esc(geo.region) + '" />' : '') +
        (seo.focus_keyword ? '<meta itemprop="keywords" content="' + esc(seo.focus_keyword) + '" />' : '') +

        '<header class="ifx-com-article__header">' +
          '<p class="ifx-com-article__kicker">Phân tích · ' + esc((post.story_tags && post.story_tags[0] && post.story_tags[0].name) || 'Cộng đồng iFlux') + '</p>' +
          '<h1 class="ifx-com-article__title" itemprop="headline">' + esc(post.title) + '</h1>' +
          '<p class="ifx-com-article__lead" itemprop="description">' + esc(post.excerpt || '') + '</p>' +

          ui().articleHeroImageHtml(post) +

          '<div class="ifx-com-article__byline">' +
            (post.author && post.author.display_name
              ? ('<div class="ifx-com-article__author" itemprop="author" itemscope itemtype="https://schema.org/Person">' +
                  (global.IfluxProfileLinks && post.author.id
                    ? IfluxProfileLinks.avatarLink(post.author.id, post.author.display_name.charAt(0), 'ifx-com-card__avatar ifx-profile-link-avatar', { base: '../account/' })
                    : '<span class="ifx-com-card__avatar" aria-hidden="true">' + esc(post.author.display_name.charAt(0)) + '</span>') +
                  '<div>' +
                    (global.IfluxProfileLinks && post.author.id
                      ? IfluxProfileLinks.nameLink(post.author.id, post.author.display_name, 'ifx-profile-link', { base: '../account/', itemprop: 'name' })
                      : '<span itemprop="name">' + esc(post.author.display_name) + '</span>') + ' ' +
                    ui().tierBadge(post.author) +
                  '</div>' +
                '</div>')
              : '') +
            '<div class="ifx-com-article__dates">' +
              (published
                ? '<time itemprop="datePublished" datetime="' + published + '">Đăng ' + ui().fmtDate(published) + '</time>'
                : '') +
              (modified
                ? '<time itemprop="dateModified" datetime="' + modified + '">' + (published ? ' · ' : '') + 'Cập nhật ' + ui().fmtDate(modified) + '</time>'
                : '') +
            '</div>' +
            (function () {
              var pubName =
                (post.publisher && (post.publisher.name || post.publisher.display_name)) ||
                (post.provider && (post.provider.name || post.provider.display_name)) ||
                (post.source && post.source.name) ||
                '';
              if (!pubName) return '';
              return (
                '<div class="ifx-com-article__publisher" itemprop="publisher" itemscope itemtype="https://schema.org/Organization">' +
                  '<meta itemprop="name" content="' + esc(pubName) + '" />' +
                  '<span class="ifx-com-article__publisher-label">' + esc(pubName) + '</span>' +
                '</div>'
              );
            })() +
          '</div>' +

          '<div class="ifx-com-article__tags" aria-label="Thẻ bài viết">' + ui().postTagsHtml(post) + '</div>' +
          /* Entity mobile = slot trên bottom IX (Shell); desktop = sidebar. CẤM strip trên thân bài. */
        '</header>' +

        '<div class="ifx-com-article__body" itemprop="articleBody">' + bodyHtml + '</div>' +

        (global.IfluxCommunityGeoAi ? IfluxCommunityGeoAi.renderArticleHtml(post) : '') +

        ui().articleGeoFooterHtml(post) +
      '</article>'
    );
  }

  function renderTocHtml(headings) {
    if (!headings || !headings.length) return '';
    return (
      '<section class="ifx-com-side-card ifx-com-side-card--toc">' +
        '<h2 class="ifx-com-side-card__title"><i class="ti ti-list"></i> Mục lục bài viết</h2>' +
        '<nav class="ifx-com-toc" aria-label="Mục lục bài viết">' +
          '<ol class="ifx-com-toc__list">' +
            headings.map(function (h) {
              return '<li><a class="ifx-com-toc__link" href="#' + esc(h.id) + '" data-ifx-com-toc="' + esc(h.id) + '">' + esc(h.text) + '</a></li>';
            }).join('') +
          '</ol>' +
        '</nav>' +
      '</section>'
    );
  }

  /**
   * Presentation từ Resolver (IO) — Page/Layout gọi; không matchMedia trong Component.
   * RC-IO-04 · RC-IU-02
   */
  function resolvePresentation() {
    if (global.IfluxInteractionPresentationResolver && IfluxInteractionPresentationResolver.resolve) {
      return IfluxInteractionPresentationResolver.resolve({
        pageDefinition: { pageKey: 'communityPost' },
        viewport: { width: typeof window !== 'undefined' ? window.innerWidth : 1200 }
      });
    }
    return 'sidebar';
  }

  /**
   * Sidebar comments slot — Host Interactive khi Presentation = sidebar.
   * Mobile: Presentation = bottom-bar → card ẩn (không mount Host thứ hai).
   */
  function renderCommentsSideCard(post) {
    var n = (post && post.stats && post.stats.comments) || 0;
    /* Slice 4 pattern: section giữ chrome; Host mount vào slot rỗng — không gắn root lên section */
    return (
      '<section class="ifx-com-side-card ifx-com-side-card--comments" data-ifx-article-comments-surface="host" data-ifx-com-comment-count="' + n + '">' +
        '<h2 class="ifx-com-side-card__title"><i class="ti ti-message"></i> Bình luận</h2>' +
        '<div data-ifx-ix-interactive-root></div>' +
      '</section>'
    );
  }

  function entitySideCard(title, icon, sub, rowsHtml) {
    if (!rowsHtml) return '';
    return (
      '<section class="ifx-com-side-card ifx-com-side-card--entities">' +
        '<h2 class="ifx-com-side-card__title"><i class="ti ' + icon + '"></i> ' + title + '</h2>' +
        '<p class="ifx-com-side-card__sub">' + sub + '</p>' +
        '<div class="ifx-com-side-list">' + rowsHtml + '</div>' +
      '</section>'
    );
  }

  function renderSidebar(post, tocHeadings, presentation) {
    var entityBlocks =
      entitySideCard('Chủ đề', 'ti-bookmark', 'Chủ đề được nhắc trong bài — bấm để mở', ui().sidebarStoryRowsHtml(post)) +
      entitySideCard('Ngành', 'ti-chart-dots-3', 'Ngành liên quan — bấm để mở trang ngành', ui().sidebarSectorRowsHtml(post)) +
      entitySideCard('Cổ phiếu', 'ti-chart-line', 'Bấm mã để mở trang cổ phiếu', ui().sidebarTickerRowsHtml(post)) +
      entitySideCard('Hệ sinh thái', 'ti-hierarchy-2', 'Hệ sinh thái liên quan — bấm để mở', ui().sidebarEcosystemRowsHtml(post));
    var toc = renderTocHtml(tocHeadings) || '';
    var comments = renderCommentsSideCard(post) || '';
    if (!entityBlocks && !toc && !comments) return '';
    return (
      '<aside class="ifx-com-story-aside" aria-label="Thông tin liên quan">' +
        entityBlocks + toc + comments +
      '</aside>'
    );
  }

  /* WP-8: Related = related_to only (+ exclude current). */
  function relatedFilterFor(post) {
    if (!post) return { relatedTo: post };
    return {
      relatedTo: post,
      excludeId: post.id || post.slug
    };
  }

  /* Khối "Bài viết liên quan" — cấu trúc section giống trang chủ Cộng đồng (DailyFeed). */
  function renderRelatedFeed(post) {
    var catLabel = (post && (post.category_name
      || (post.category && (post.category.name || post.category.label))
      || post.category_slug)) || '';
    return (
      '<section class="ifx-com-related-feed" aria-label="Bài viết liên quan">' +
        '<div class="ifx-com-list-head">' +
          '<h2 class="ifx-com-list-title"><i class="ti ti-news"></i> Bài viết liên quan</h2>' +
          '<span class="ifx-com-section-hint">' +
            (catLabel ? ('Cùng danh mục · ' + esc(catLabel)) : 'Cùng danh mục / thực thể được nhắc trong bài') +
          '</span>' +
        '</div>' +
        '<div data-ifx-com-related-feed></div>' +
      '</section>'
    );
  }

  function mountRelatedFeed(root, post) {
    var mount = root.querySelector('[data-ifx-com-related-feed]');
    if (!mount || !global.IfluxDailyFeed) return;
    /* Giống trang chủ: Tin tức + Chuyên gia nổi bật + Bài viết chuyên gia.
     * mergeStore: không replace toàn bộ CommunityStore (tránh xóa bài đang xem + không kích loop). */
    global.IfluxDailyFeed.mount(mount, {
      filter: relatedFilterFor(post),
      mergeStore: true,
      showNews: true,
      showExperts: true,
      showExpertPosts: true,
      expertTitle: 'Bài viết của chuyên gia'
    });
  }

  function bindTocLinks(root) {
    root.querySelectorAll('[data-ifx-com-toc]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var id = link.getAttribute('data-ifx-com-toc');
        var el = document.getElementById(id);
        if (!el) return;
        scrollToHeading(el);
        if (history.replaceState) {
          history.replaceState(null, '', '#' + id);
        } else {
          location.hash = id;
        }
      });
    });
  }

  function scrollToHashHeading(root) {
    var hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;
    var el = document.getElementById(hash);
    var body = root.querySelector('.ifx-com-article__body');
    if (!el || !body || !body.contains(el)) return;
    setTimeout(function () { scrollToHeading(el); }, 80);
  }

  function openInteractiveFallback() {
    var href = global.IfluxSeoUrl && IfluxSeoUrl.commentsHrefFromLocation
      ? IfluxSeoUrl.commentsHrefFromLocation()
      : null;
    if (href) {
      consumerNavigate(href);
      return;
    }
    if (global.ixToast) ixToast('Mở trang bình luận', 'info');
  }

  /**
   * UI Ownership — Article chỉ mount ĐÚNG MỘT Interaction Presentation.
   * Desktop/tablet (>1024 / bp-lg): surface = sidebar (interactive).
   * Mobile (≤1024 / mobile-shell): surface = bottom-bar (ActionBar → Store) — cùng đối tượng, khác chỗ hiển thị.
   * CẤM Body ActionBar · CẤM mount hai Host cùng lúc · CẤM Shell proxy-click.
   */
  var _ixRemountBound = false;
  var _ixLastSurface = '';
  var _ixRetryTimer = null;

  function useBottomIxSurface() {
    return typeof window !== 'undefined' && window.IfluxBreakpoint && window.IfluxBreakpoint.isMobileShell
      ? window.IfluxBreakpoint.isMobileShell()
      : false;
  }

  /** Mobile: đổ entity chips vào slot trên bottom IX — cùng postEntityChipsHtml (SoT). */
  function fillArticleEntityStrip(post) {
    var el = document.querySelector('[data-ifx-ix-article-entities]');
    if (!el || !ui().postEntityChipsHtml) return;
    var chips = ui().postEntityChipsHtml(post);
    if (!chips) {
      el.innerHTML = '';
      el.setAttribute('hidden', 'hidden');
      return;
    }
    el.innerHTML = '<div class="ifx-com-pills ifx-com-pills--scroll">' + chips + '</div>';
    el.removeAttribute('hidden');
  }

  function clearArticleEntityStrip() {
    var el = document.querySelector('[data-ifx-ix-article-entities]');
    if (!el) return;
    el.innerHTML = '';
    el.setAttribute('hidden', 'hidden');
  }

  function mountInteractionHosts(root, post) {
    if (!root || !post) return;
    /* Phase 5 RC-IR: Host chưa sẵn → Summary boot rồi retry */
    if (!global.IfluxInteractionHost || !IfluxInteractionHost.mountInteraction) {
      if (global.IfluxInteractionBoot && IfluxInteractionBoot.ensureForSummary) {
        IfluxInteractionBoot.ensureForSummary().then(function () {
          if (root.isConnected) mountInteractionHosts(root, post);
        });
      }
      return;
    }
    var target = { type: 'post', id: String(post.id || post.slug || '') };
    var Host = IfluxInteractionHost;
    var sideRoot = root.querySelector('[data-ifx-ix-interactive-root]');
    var useBottom = useBottomIxSurface();
    var surface = useBottom ? 'bottom-bar' : 'sidebar';
    var commentsCard = root.querySelector('.ifx-com-side-card--comments');
    var bottomRoot = null;

    if (useBottom) {
      if (global.IfluxWebUI && typeof IfluxWebUI.ensureArticleIxBottomSlot === 'function') {
        IfluxWebUI.ensureArticleIxBottomSlot();
      } else if (global.IfluxWebUI && typeof IfluxWebUI.syncMobileTabbar === 'function') {
        IfluxWebUI.syncMobileTabbar();
      }
      bottomRoot = document.querySelector('[data-ifx-ix-article-bottom-root]');
      if (!bottomRoot) {
        /* Chưa có slot (shell chưa sẵn) — gỡ Host sidebar để không giữ 2 surface. */
        if (sideRoot && Host.unmountRoot) Host.unmountRoot(sideRoot);
        if (commentsCard) commentsCard.setAttribute('hidden', 'hidden');
        clearTimeout(_ixRetryTimer);
        _ixRetryTimer = setTimeout(function () {
          if (root.isConnected) mountInteractionHosts(root, post);
        }, 100);
        return;
      }
    }

    if (sideRoot && Host.unmountRoot) Host.unmountRoot(sideRoot);
    bottomRoot = document.querySelector('[data-ifx-ix-article-bottom-root]');
    if (bottomRoot && Host.unmountRoot) Host.unmountRoot(bottomRoot);

    function doMountSummary() {
      bottomRoot = document.querySelector('[data-ifx-ix-article-bottom-root]');
      if (!bottomRoot) return;
      fillArticleEntityStrip(post);
      Host.mountInteraction({
        root: bottomRoot,
        target: target,
        mode: 'summary',
        presentation: 'bottom-bar',
        variant: 'bar',
        pageDefinition: { pageKey: 'communityPost' },
        onOpenInteractive: function () { openInteractiveFallback(); }
      });
      if (commentsCard) commentsCard.setAttribute('hidden', 'hidden');
    }

    function doMountInteractive() {
      clearArticleEntityStrip();
      if (commentsCard) commentsCard.removeAttribute('hidden');
      if (!sideRoot) return;
      Host.mountInteraction({
        root: sideRoot,
        target: target,
        mode: 'interactive',
        presentation: 'sidebar',
        pageDefinition: { pageKey: 'communityPost' },
        onOpenInteractive: function () {
          var composer = sideRoot.querySelector('[data-ifx-ix-body]');
          if (composer) {
            try { composer.focus(); } catch (e) { /* ignore */ }
          }
        }
      });
    }

    /* RC-IR-01/04: bottom = Summary only; sidebar = lazy Interactive */
    if (useBottom) {
      if (global.IfluxInteractionBoot && IfluxInteractionBoot.ensureForSummary) {
        IfluxInteractionBoot.ensureForSummary().then(doMountSummary).catch(doMountSummary);
      } else {
        doMountSummary();
      }
    } else if (global.IfluxInteractionBoot && IfluxInteractionBoot.ensureForInteractive) {
      IfluxInteractionBoot.ensureForInteractive().then(doMountInteractive).catch(doMountInteractive);
    } else {
      doMountInteractive();
    }
    _ixLastSurface = surface;

    if (!_ixRemountBound) {
      _ixRemountBound = true;
      var t = null;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          if (!root.isConnected) return;
          var next = useBottomIxSurface() ? 'bottom-bar' : 'sidebar';
          if (next === _ixLastSurface) return;
          var p = st() && currentSlug ? (st().getPostBySlug(currentSlug) || st().getPostById(currentSlug)) : post;
          if (p) mountInteractionHosts(root, p);
        }, 120);
      });
      document.addEventListener('iflux-ix-bottom-slot-ready', function () {
        if (!root.isConnected) return;
        if (!useBottomIxSurface()) return;
        var p = st() && currentSlug ? (st().getPostBySlug(currentSlug) || st().getPostById(currentSlug)) : post;
        if (p) mountInteractionHosts(root, p);
      });
      document.addEventListener('iflux-context-ready', function () {
        if (!root.isConnected) return;
        if (!useBottomIxSurface()) return;
        if (document.querySelector('[data-ifx-ix-article-bottom-root][data-ifx-ix-host]')) return;
        var p = st() && currentSlug ? (st().getPostBySlug(currentSlug) || st().getPostById(currentSlug)) : post;
        if (p) mountInteractionHosts(root, p);
      });
    }
  }

  function syncCommentCountAttr(root, counts) {
    if (!root || !counts) return;
    var n = counts.comments != null ? counts.comments : 0;
    root.querySelectorAll('[data-ifx-com-comment-count]').forEach(function (el) {
      el.setAttribute('data-ifx-com-comment-count', String(n));
    });
  }

  function bindEvents(root, post, slug) {
    /* Like / fav / share / comment → Interaction Host sidebar (không CommunityStore.stats++) */
    document.addEventListener('iflux-ix-projection', function onProj(ev) {
      if (!root.isConnected) {
        document.removeEventListener('iflux-ix-projection', onProj);
        return;
      }
      syncCommentCountAttr(root, ev.detail && ev.detail.counts);
    });
  }

  function resolvePost(ref) {
    if (!st() || !ref) return null;
    return st().getPostById(ref) || st().getPostBySlug(ref);
  }

  function paintPost(root, post) {
    var slug = post.slug;
    currentSlug = slug;

    if (global.IfluxSeoUrl && IfluxSeoUrl.applyPostSeoToDocument) {
      IfluxSeoUrl.applyPostSeoToDocument(post);
    }
    if (ui().applyStorySeoExtras) ui().applyStorySeoExtras(post);

    var uid = userId();
    var liked = (post.liked_by || []).indexOf(uid) >= 0;
    var favorited = (post.favorited_by || []).indexOf(uid) >= 0;
    var bodyPrep = prepareArticleBody(post.body_html);
    var presentation = resolvePresentation();

    if (global.IfluxInteractionHost && IfluxInteractionHost.unmountAll) {
      try { IfluxInteractionHost.unmountAll(); } catch (e) { /* ignore */ }
    }

    root.innerHTML =
      '<nav class="ifx-com-breadcrumb" aria-label="Breadcrumb">' +
        '<a href="' + esc(routeUrl('community')) + '"><i class="ti ti-arrow-left"></i> Cộng đồng</a>' +
        '<span class="ifx-com-breadcrumb__sep">/</span>' +
        '<span class="ifx-com-breadcrumb__current">' + esc(post.title) + '</span>' +
      '</nav>' +
      (function () {
        var asideHtml = renderSidebar(post, bodyPrep.headings, presentation);
        var layoutCls = 'ifx-com-story-layout' + (asideHtml ? '' : ' ifx-com-story-layout--no-aside');
        return (
          '<div class="' + layoutCls + '">' +
            '<div class="ifx-com-story-main">' + renderArticleMain(post, slug, uid, liked, favorited, bodyPrep.html) + '</div>' +
            asideHtml +
          '</div>'
        );
      })() +
      renderRelatedFeed(post);

    bindEvents(root, post, slug);
    bindTocLinks(root);
    mountRelatedFeed(root, post);
    mountInteractionHosts(root, post);
    if (ui() && typeof ui().hydrateTickerQuotes === 'function') {
      ui().hydrateTickerQuotes(root, [post]);
    }
    scrollToHashHeading(root);
    try {
      document.dispatchEvent(new CustomEvent('iflux-context-ready'));
    } catch (e) { /* ignore */ }
  }

  function render(root) {
    if (!root || !st()) return;

    var ref = global.IfluxSeoUrl
      ? IfluxSeoUrl.parsePostRef()
      : (new URLSearchParams(location.search).get('id') || new URLSearchParams(location.search).get('slug'));
    if (!ref) {
      root.innerHTML = '<div class="ifx-com-empty">Thiếu tham chiếu bài viết.</div>';
      return;
    }

    var post = resolvePost(ref);
    if (!post) {
      root.innerHTML = '<div class="ifx-com-empty">Không tìm thấy bài viết.</div>';
      return;
    }

    /* Prefetch runtime quotes trước paint — tránh hiện Mock seed / trống HDB·CMC */
    var ready = ui() && typeof ui().prefetchTickerQuotes === 'function'
      ? ui().prefetchTickerQuotes([post])
      : Promise.resolve();
    Promise.resolve(ready).then(function () {
      if (!root.isConnected) return;
      paintPost(root, post);
    });
  }

  function init() {
    var root = document.querySelector('[data-ifx-community-story]');
    var slug = global.IfluxSeoUrl
      ? (function () {
          var ref = IfluxSeoUrl.parsePostRef();
          var p = ref && st() ? (st().getPostById(ref) || st().getPostBySlug(ref)) : null;
          return p ? p.slug : ref;
        })()
      : new URLSearchParams(location.search).get('slug');
    if (slug && st()) st().bumpView(slug);

    function run() {
      render(root);
    }

    /* Phase 5 RC-IR-01: Article entry = Summary boot; Interactive lazy trong mountInteractionHosts */
    if (global.IfluxInteractionBoot && IfluxInteractionBoot.ensureForSummary) {
      IfluxInteractionBoot.ensureForSummary().then(run).catch(function (err) {
        if (global.console && console.warn) console.warn('[CommunityPost] IX Summary boot', err);
        run();
      });
    } else {
      run();
    }

    /*
     * CẤM full render trên mọi iflux-community-change:
     * Related DailyFeed → setFeed → change → render → remount IX → "Đang tải" ↔ "Chưa có" (vòng lặp).
     * Chỉ render lại khi chưa có bài / đổi bài.
     */
    document.addEventListener('iflux-community-change', function onCommunityChange() {
      if (!root || !root.isConnected) {
        document.removeEventListener('iflux-community-change', onCommunityChange);
        return;
      }
      var ref = global.IfluxSeoUrl
        ? IfluxSeoUrl.parsePostRef()
        : (new URLSearchParams(location.search).get('id') || new URLSearchParams(location.search).get('slug'));
      var post = resolvePost(ref);
      if (!post) return;
      if (currentSlug && root.querySelector('.ifx-com-article') &&
          (String(post.slug) === String(currentSlug) || String(post.id) === String(currentSlug))) {
        return;
      }
      render(root);
    });
  }

  global.IfluxCommunityPostPage = { init: init };
  global.IfluxCommunityStoryPage = global.IfluxCommunityPostPage;
})(window);
