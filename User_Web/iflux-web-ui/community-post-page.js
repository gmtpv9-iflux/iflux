/* Trang chi tiết bài viết — SEO/GEO + sidebar */
(function (global) {
  'use strict';

  var commentSort = 'newest';
  var currentSlug = '';

  function st() { return global.IfluxCommunityStore; }
  function ui() { return global.IfluxCommunityUI; }
  function auth() { return global.IfluxAuth; }

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

  function commentFilterTabsHtml(active) {
    var tabs = [
      { key: 'newest', label: 'Mới nhất' },
      { key: 'liked', label: 'Yêu thích' },
      { key: 'debate', label: 'Tranh luận' },
      { key: 'shared', label: 'Chia sẻ' }
    ];
    return tabs.map(function (t) {
      return '<button type="button" class="ifx-com-cmt-tab' + (active === t.key ? ' is-active' : '') +
        '" data-ifx-com-cmt-sort="' + t.key + '">' + t.label + '</button>';
    }).join('');
  }

  function renderCommentList(post) {
    var sorted = ui().sortComments(post.comments || [], commentSort);
    if (!sorted.length) {
      return '<div class="ifx-com-comments__empty">Chưa có bình luận. Hãy làm người đầu tiên.</div>';
    }
    return sorted.map(ui().commentItemHtml).join('');
  }

  function renderArticleMain(post, slug, uid, liked, favorited, bodyHtml) {
    var seo = post.seo || {};
    var geo = post.geo || {};
    var published = post.published_at || post.created_at;
    var modified = post.updated_at || published;
    var canonical = seo.canonical_url || location.href.split('#')[0];

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
            '<div class="ifx-com-article__author" itemprop="author" itemscope itemtype="https://schema.org/Person">' +
              (global.IfluxProfileLinks && post.author && post.author.id
                ? IfluxProfileLinks.avatarLink(post.author.id, (post.author.display_name || 'M').charAt(0), 'ifx-com-card__avatar ifx-profile-link-avatar', { base: '../account/' })
                : '<span class="ifx-com-card__avatar" aria-hidden="true">' + (post.author.display_name || 'M').charAt(0) + '</span>') +
              '<div>' +
                (global.IfluxProfileLinks && post.author && post.author.id
                  ? IfluxProfileLinks.nameLink(post.author.id, post.author.display_name || 'Thành viên', 'ifx-profile-link', { base: '../account/', itemprop: 'name' })
                  : '<span itemprop="name">' + esc(post.author.display_name || 'Thành viên') + '</span>') + ' ' +
                ui().tierBadge(post.author) +
                '<div class="ifx-com-article__dates">' +
                  '<time itemprop="datePublished" datetime="' + published + '">Đăng ' + ui().fmtDate(published) + '</time>' +
                  '<time itemprop="dateModified" datetime="' + modified + '"> · Cập nhật ' + ui().fmtDate(modified) + '</time>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="ifx-com-article__publisher" itemprop="publisher" itemscope itemtype="https://schema.org/Organization">' +
              '<meta itemprop="name" content="iFlux" />' +
            '</div>' +
          '</div>' +

          '<div class="ifx-com-article__tags" aria-label="Thẻ bài viết">' + ui().postTagsHtml(post) + '</div>' +

          '<div class="ifx-com-article__actions" role="toolbar" aria-label="Tương tác bài viết">' +
            '<button type="button" class="ifx-com-action' + (liked ? ' is-active' : '') + '" data-ifx-com-like aria-pressed="' + liked + '">' +
              '<i class="ti ti-heart"></i> <span>' + (post.stats.likes || 0) + '</span></button>' +
            '<button type="button" class="ifx-com-action' + (favorited ? ' is-active' : '') + '" data-ifx-com-fav aria-pressed="' + favorited + '">' +
              '<i class="ti ti-star"></i> <span>' + (post.stats.favorites || 0) + '</span></button>' +
            '<button type="button" class="ifx-com-action" data-ifx-com-share><i class="ti ti-share"></i> Chia sẻ</button>' +
            '<button type="button" class="ifx-com-action" data-ifx-com-seo><i class="ti ti-code"></i> SEO seed</button>' +
          '</div>' +
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

  function renderSidebar(post, tocHeadings) {
    return (
      '<aside class="ifx-com-story-aside" aria-label="Thông tin liên quan">' +
        '<section class="ifx-com-side-card">' +
          '<h2 class="ifx-com-side-card__title"><i class="ti ti-bookmark"></i> Chủ đề</h2>' +
          '<p class="ifx-com-side-card__sub">Chủ đề được nhắc trong bài — bấm để mở</p>' +
          '<div class="ifx-com-side-list">' + ui().sidebarStoryRowsHtml(post) + '</div>' +
        '</section>' +

        '<section class="ifx-com-side-card">' +
          '<h2 class="ifx-com-side-card__title"><i class="ti ti-chart-dots-3"></i> Ngành</h2>' +
          '<p class="ifx-com-side-card__sub">Ngành liên quan — bấm để mở trang ngành</p>' +
          '<div class="ifx-com-side-list">' + ui().sidebarSectorRowsHtml(post) + '</div>' +
        '</section>' +

        '<section class="ifx-com-side-card">' +
          '<h2 class="ifx-com-side-card__title"><i class="ti ti-chart-line"></i> Cổ phiếu</h2>' +
          '<p class="ifx-com-side-card__sub">Bấm mã để mở trang cổ phiếu</p>' +
          '<div class="ifx-com-side-list">' + ui().sidebarTickerRowsHtml(post) + '</div>' +
        '</section>' +

        '<section class="ifx-com-side-card">' +
          '<h2 class="ifx-com-side-card__title"><i class="ti ti-hierarchy-2"></i> Hệ sinh thái</h2>' +
          '<p class="ifx-com-side-card__sub">Hệ sinh thái liên quan — bấm để mở</p>' +
          '<div class="ifx-com-side-list">' + ui().sidebarEcosystemRowsHtml(post) + '</div>' +
        '</section>' +

        renderTocHtml(tocHeadings) +

        '<section class="ifx-com-side-card ifx-com-side-card--comments">' +
          '<h2 class="ifx-com-side-card__title"><i class="ti ti-message"></i> Bình luận <span class="ifx-com-side-count">' + (post.stats.comments || 0) + '</span></h2>' +
          '<div class="ifx-com-cmt-tabs" role="tablist">' + commentFilterTabsHtml(commentSort) + '</div>' +
          '<form class="ifx-com-comment-form ifx-com-comment-form--side" data-ifx-com-comment-form>' +
            '<textarea class="ix-input" rows="3" placeholder="Viết bình luận..." data-ifx-com-comment-body required></textarea>' +
            '<button type="submit" class="ix-btn ix-btn-primary ix-btn-sm">Gửi</button>' +
          '</form>' +
          '<div class="ifx-com-comments__list ifx-com-comments__list--side" data-ifx-com-comments>' +
            renderCommentList(post) +
          '</div>' +
        '</section>' +
      '</aside>'
    );
  }

  /* Khối "Bài viết liên quan" — lazy load, hiển thị như trang Cộng đồng (Tin tức / chuyên gia) */
  function renderRelatedFeed(post) {
    return (
      '<section class="ifx-com-list-section ifx-com-related-feed" aria-label="Bài viết liên quan">' +
        '<div class="ifx-com-list-head">' +
          '<h2 class="ifx-com-list-title"><i class="ti ti-news"></i> Bài viết liên quan</h2>' +
          '<span class="ifx-com-section-hint">Chủ đề · ngành · cổ phiếu · hệ sinh thái được nhắc trong bài</span>' +
        '</div>' +
        '<div data-ifx-com-related-feed></div>' +
      '</section>'
    );
  }

  function mountRelatedFeed(root, post) {
    var mount = root.querySelector('[data-ifx-com-related-feed]');
    if (!mount || !global.IfluxDailyFeed) return;
    global.IfluxDailyFeed.mount(mount, {
      filter: { relatedTo: post },
      showExperts: false,
      expertTitle: 'Bài viết chuyên gia liên quan'
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

  function bindEvents(root, post, slug) {
    var uid = userId();

    root.querySelector('[data-ifx-com-like]').addEventListener('click', function () {
      st().toggleLike(slug, uid);
      render(root);
    });

    root.querySelector('[data-ifx-com-fav]').addEventListener('click', function () {
      st().toggleFavorite(slug, uid);
      render(root);
    });

    root.querySelector('[data-ifx-com-share]').addEventListener('click', function () {
      var url = ui().shareUrl(slug);
      st().bumpShare(slug);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          if (global.ixToast) ixToast('Đã sao chép link chia sẻ', 'success');
        });
      } else {
        prompt('Sao chép link:', url);
      }
    });

    var seoModal = root.querySelector('[data-ifx-com-seo-modal]');
    var seed = st().exportSeoSeed(post, location.origin + location.pathname.replace(/\/[^/]+$/, ''));
    root.querySelector('[data-ifx-com-seo]').addEventListener('click', function () {
      root.querySelector('[data-ifx-com-seo-json]').textContent = JSON.stringify(seed, null, 2);
      seoModal.classList.add('open');
    });
    root.querySelector('[data-ifx-com-seo-close]').addEventListener('click', function () {
      seoModal.classList.remove('open');
    });
    seoModal.addEventListener('click', function (e) {
      if (e.target === seoModal) seoModal.classList.remove('open');
    });
    root.querySelector('[data-ifx-com-seo-copy]').addEventListener('click', function () {
      var text = root.querySelector('[data-ifx-com-seo-json]').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          if (global.ixToast) ixToast('Đã sao chép SEO seed', 'success');
        });
      }
    });

    root.querySelector('[data-ifx-com-comment-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var body = root.querySelector('[data-ifx-com-comment-body]').value;
      var user = auth() && auth().getUser();
      if (!user) return;
      try {
        st().addComment(slug, user, body);
        commentSort = 'newest';
        render(root);
        if (global.ixToast) ixToast('Đã gửi bình luận', 'success');
      } catch (err) {
        if (global.ixToast) ixToast(err.message, 'warning');
      }
    });

    root.querySelectorAll('[data-ifx-com-cmt-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        commentSort = btn.getAttribute('data-ifx-com-cmt-sort');
        var list = root.querySelector('[data-ifx-com-comments]');
        var fresh = st().getPostBySlug(slug);
        if (list && fresh) list.innerHTML = renderCommentList(fresh);
        root.querySelectorAll('[data-ifx-com-cmt-sort]').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-ifx-com-cmt-sort') === commentSort);
        });
      });
    });
  }

  function resolvePost(ref) {
    if (!st() || !ref) return null;
    return st().getPostById(ref) || st().getPostBySlug(ref);
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

    root.innerHTML =
      '<nav class="ifx-com-breadcrumb" aria-label="Breadcrumb">' +
        '<a href="' + (global.IfluxSeoUrl ? IfluxSeoUrl.communityPath() : 'index.html') + '"><i class="ti ti-arrow-left"></i> Cộng đồng</a>' +
        '<span class="ifx-com-breadcrumb__sep">/</span>' +
        '<span class="ifx-com-breadcrumb__current">' + esc(post.title) + '</span>' +
      '</nav>' +
      '<div class="ifx-com-story-layout">' +
        '<div class="ifx-com-story-main">' + renderArticleMain(post, slug, uid, liked, favorited, bodyPrep.html) + '</div>' +
        renderSidebar(post, bodyPrep.headings) +
      '</div>' +
      renderRelatedFeed(post) +
      '<div class="ix-modal-overlay" id="ifxComSeoModal" data-ifx-com-seo-modal>' +
        '<div class="ix-modal-box ifx-com-seo-modal" style="max-width:640px;max-height:85vh;overflow:auto">' +
          '<button type="button" class="ix-modal-close" data-ifx-com-seo-close><i class="ti ti-x"></i></button>' +
          '<div class="ix-modal-title">SEO / GEO seed</div>' +
          '<div class="ix-modal-sub">JSON xuất từ bài viết — dùng cho sitemap, meta, schema</div>' +
          '<pre class="ifx-com-seo-json" data-ifx-com-seo-json></pre>' +
          '<div style="margin-top:12px;text-align:right">' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-com-seo-copy><i class="ti ti-copy"></i> Sao chép</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    bindEvents(root, post, slug);
    bindTocLinks(root);
    mountRelatedFeed(root, post);
    scrollToHashHeading(root);
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
    render(root);
    document.addEventListener('iflux-community-change', function () { render(root); });
  }

  global.IfluxCommunityPostPage = { init: init };
  global.IfluxCommunityStoryPage = global.IfluxCommunityPostPage;
})(window);
