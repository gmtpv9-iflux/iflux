/* Trang nhóm — Ngành / Họ CP / Chủ đề (layout giống cổ phiếu) */
(function (global) {
  'use strict';

  var currentSource = '';
  var currentId = '';
  var currentDetail = null;

  function isMobileShell() {
    return global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell
      ? global.IfluxBreakpoint.isMobileShell()
      : false;
  }

  function removeLeftColumn(root) {
    var left = root.querySelector('.ifx-stock-col--left');
    if (left) left.remove();
  }

  function remountLeftColumn(root, detail) {
    var layout = root.querySelector('.ifx-stock-layout');
    if (!layout || layout.querySelector('.ifx-stock-col--left') || !detail) return;
    layout.insertAdjacentHTML('afterbegin', renderLeft(detail));
    mountSidebarHost(layout.querySelector('.ifx-stock-col--left'));
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
  }

  function syncMobileLeftColumn(root, tabKey, detail) {
    if (!isMobileShell()) return;
    var layout = root.querySelector('.ifx-stock-layout');
    if (!layout) return;
    layout.classList.toggle('ifx-stock-layout--mobile-screen', tabKey !== 'news');
    if (tabKey === 'news') remountLeftColumn(root, detail);
    else removeLeftColumn(root);
  }

  function comStore() { return global.IfluxCommunityStore; }
  function comUi() { return global.IfluxCommunityUI; }
  function cta() { return global.IfluxCommentsCta; }
  function timelineFeed() { return global.IfluxEntityTimelineFeed; }
  function pageDef() { return global.IfluxPageDefinition; }
  function taxApi() { return global.IfluxWatchlistTaxonomy; }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }

  function quoteStateClass(state) {
    if (state === 'ceiling' || state === 'floor' || state === 'up' || state === 'down') return 'is-' + state;
    return 'is-ref';
  }

  function kindIcon(kind) {
    if (kind === 'sector') return 'ti-category';
    if (kind === 'family') return 'ti-users-group';
    if (kind === 'story' || kind === 'chu-de' || kind === 'cau-chuyen') return 'ti-book-2';
    return 'ti-chart-dots';
  }

  /** Identity = taxonomy/Master. Group perf/chart = UNAVAILABLE (D1). */
  function buildGroupDetail(source, id) {
    var tax = taxApi();
    if (!tax || !id) return null;
    var group = tax.getGroup(source, id);
    if (!group) return null;
    var tickers = tax.getGroupTickers(source, id) || [];
    var isChuDe = source === 'story' || source === 'chu-de' || source === 'chu_de' || source === 'cau-chuyen';
    if (!tickers.length && isChuDe) {
      tickers = (group.tickers || []).slice();
    }
    if (!tickers.length && !isChuDe) return null;
    return {
      kind: isChuDe ? 'chu-de' : source,
      id: group.id,
      name: group.name,
      type_label: tax.sourceLabel(source),
      tickers: tickers,
      ticker: tickers[0] || '',
      member_count: tickers.length,
      change_pct: null,
      price_state: 'ref'
    };
  }

  function renderHeader(detail) {
    return (
      '<div class="ifx-stock-head">' +
        '<div class="ifx-stock-head__info">' +
          '<div class="ifx-stock-head__symbol">' +
            '<strong>' + esc(detail.name) + '</strong>' +
            '<span class="ifx-stock-head__ex"><i class="ti ' + kindIcon(detail.kind) + '" style="font-size:12px"></i> ' + esc(detail.type_label) + '</span>' +
          '</div>' +
          '<div class="ifx-stock-head__co">' + detail.member_count + ' mã · hiệu suất nhóm</div>' +
        '</div>' +
        '<div class="ifx-stock-head__quote ' + quoteStateClass('ref') + '">' +
          '<div class="ifx-stock-head__price">' + fmtPct(null) + '</div>' +
          '<div class="ifx-stock-head__chg">' +
            '<span class="ifx-stock-head__chg-abs">Chỉ số tổng hợp</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderLeft(detail) {
    return (
      '<div class="ifx-stock-col ifx-stock-col--left">' +
        '<section class="ifx-stock-panel">' +
          renderHeader(detail) +
          '<div class="ifx-stock-chart"><div class="ifx-stock-empty">Chưa có dữ liệu biểu đồ</div></div>' +
        '</section>' +
      '</div>'
    );
  }

  /* AppShell Foundation VR-04 (100826): Left Sidebar Widget Host phải qua ensureSections()
   * canonical (giống Home/Market/Flow/Community/ELP/Stock Detail) — không tự dựng
   * <div data-ifx-section> bằng HTML cứng. Host phải nằm TRƯỚC panel (page-specific data,
   * giữ nguyên trong Main) → dùng insertBefore thay vì ensureSections append. */
  function mountSidebarHost(leftEl) {
    if (!leftEl) return;
    var sectionApi = global.IfluxRuntimeSections;
    if (!sectionApi || !sectionApi.ensureSections) return;
    var sections = sectionApi.ensureSections(leftEl, {
      sections: [{ key: 'sidebar', label: 'Widget đặc thù nhóm' }]
    });
    if (sections && sections.sidebar && leftEl.firstChild !== sections.sidebar) {
      leftEl.insertBefore(sections.sidebar, leftEl.firstChild);
    }
  }

  function postsFilter(detail) {
    if (detail.kind === 'story' || detail.kind === 'chu-de' || detail.kind === 'cau-chuyen') return { chuDeId: detail.id, storyId: detail.id };
    return { taxSource: detail.kind, taxGroupId: detail.id };
  }

  function feedKeyForDetail(detail) {
    if (!detail) return '';
    return detail.kind + ':' + detail.id;
  }

  function interactionTarget(detail) {
    if (!detail) return null;
    var kind = String(detail.kind || '').toLowerCase();
    if (kind === 'cau-chuyen' || kind === 'chu-de' || kind === 'chu_de' || kind === 'story') {
      return { type: 'story', id: String(detail.id || detail.slug || '') };
    }
    if (kind === 'sector') return { type: 'sector', id: String(detail.id || '') };
    if (kind === 'family' || kind === 'ecosystem') return { type: 'family', id: String(detail.id || '') };
    return { type: kind, id: String(detail.id || '') };
  }

  function buildFeedSections(detail, newsState) {
    var tf = timelineFeed();
    var name = esc(detail.name);

    var articlesBody, articlesCount, newsBody, newsCount;
    if (tf) {
      articlesBody = tf.articlesListHtml(newsState);
      articlesCount = tf.articlesCount(newsState);
      newsBody = tf.newsListHtml(newsState);
      newsCount = tf.newsCount(newsState);
    } else {
      var posts = comStore() ? comStore().getPosts(newsState.postsFilter || postsFilter(detail)) : [];
      var list = posts.length && comUi() && comUi().compactPostHtml
        ? '<div class="ifx-stock-news-list">' + posts.map(function (p) {
            return comUi().compactPostHtml(p, { storyBase: '../community/' });
          }).join('') + '</div>'
        : '<div class="ifx-stock-empty">Chưa có bài viết liên quan đến <strong>' + name + '</strong>.</div>';
      articlesBody = list; articlesCount = posts.length;
      newsBody = list; newsCount = posts.length;
    }

    var articlesSectionHtml =
      '<section class="ifx-stock-panel" data-ifx-stock-articles>' +
        '<div class="ifx-stock-news-head">' +
          '<h1>Bài viết · ' + name + '</h1>' +
          '<p data-ifx-stock-articles-sub>' + articlesCount + ' bài viết chuyên gia</p>' +
        '</div>' +
        '<div data-ifx-stock-articles-body>' + articlesBody + '</div>' +
      '</section>';

    var newsSectionHtml =
      '<section class="ifx-stock-panel" data-ifx-stock-news>' +
        '<div class="ifx-stock-news-head">' +
          '<h1>Tin tức · ' + name + '</h1>' +
          '<p data-ifx-stock-news-sub>' + newsCount + ' tin tức</p>' +
        '</div>' +
        '<div data-ifx-stock-news-body>' + newsBody + '</div>' +
      '</section>';

    return { articlesSectionHtml: articlesSectionHtml, newsSectionHtml: newsSectionHtml };
  }

  function commentCount() {
    return 0;
  }

  function renderCenter(detail, newsState) {
    newsState = newsState || {};
    var target = interactionTarget(detail);
    var commentsSectionHtml = cta() && target
      ? cta().html({ target: target, count: null })
      : '<div class="ifx-com-empty">Bình luận</div>';

    if (global.IfluxEntityDetailCenter) {
      return IfluxEntityDetailCenter.render({
        kind: detail.kind,
        detail: detail,
        feedFilter: newsState.postsFilter || postsFilter(detail),
        storyBase: newsState.storyBase,
        commentsSectionHtml: commentsSectionHtml,
        commentCount: commentCount()
      });
    }

    var sections = buildFeedSections(detail, newsState);
    return (
      '<div class="ifx-stock-col ifx-stock-col--center">' +
        sections.articlesSectionHtml +
        sections.newsSectionHtml +
      '</div>'
    );
  }

  function renderNotFound(source, id) {
    var tax = global.IfluxWatchlistTaxonomy;
    var label = tax ? tax.sourceLabel(source) : source;
    return (
      '<div class="ifx-stock-not-found">' +
        '<h1 class="ix-page-title">Không tìm thấy ' + esc(label) + '</h1>' +
        '<p style="color:var(--ix-text-muted);margin-bottom:16px">#' + esc(id) + ' chưa có trong danh mục chủ đề (API/DB).</p>' +
        '<a href="/cau-chuyen" class="ix-btn ix-btn-outline">Danh sách câu chuyện</a> ' +
        '<a href="../search/index.html" class="ix-btn ix-btn-outline">Tìm kiếm</a>' +
      '</div>'
    );
  }

  function bindEvents(root, detail, newsState) {
    var target = interactionTarget(detail);
    if (cta() && target) cta().mount(root, target);
    if (timelineFeed() && newsState) timelineFeed().bind(root, newsState);
    if (global.IfluxEntityDetailCenter) {
      IfluxEntityDetailCenter.mount(root, {
        kind: detail.kind,
        detail: detail,
        feedFilter: (newsState && newsState.postsFilter) || postsFilter(detail),
        storyBase: newsState && newsState.storyBase,
        onTab: function (key) {
          syncMobileLeftColumn(root, key, detail);
          if (key === 'comments' && cta() && target) cta().mount(root, target);
        }
      });
    }
  }

  function parseGroupId(source) {
    if (global.IfluxSeoUrl) {
      if (source === 'sector') return IfluxSeoUrl.parseSectorId() || '';
      if (source === 'family') return IfluxSeoUrl.parseEcosystemId() || '';
      if (source === 'story' || source === 'chu-de' || source === 'chu_de' || source === 'cau-chuyen') {
        var parse =
          (IfluxSeoUrl.parseChuDeSlug && IfluxSeoUrl.parseChuDeSlug()) ||
          (IfluxSeoUrl.parseChuDeEntitySlug && IfluxSeoUrl.parseChuDeEntitySlug()) ||
          (IfluxSeoUrl.parseStoryEntitySlug && IfluxSeoUrl.parseStoryEntitySlug()) ||
          '';
        return parse || '';
      }
    }
    return (new URLSearchParams(location.search).get('id') || '').trim();
  }

  function render(root, source) {
    currentSource = source;
    currentId = parseGroupId(source);
    currentDetail = buildGroupDetail(source, currentId);
    var typeLabel = global.IfluxWatchlistTaxonomy ? IfluxWatchlistTaxonomy.sourceLabel(source) : source;

    if (!currentDetail) {
      root.innerHTML = renderNotFound(source, currentId);
      if (global.IfluxSeoTitle && IfluxSeoTitle.apply) {
        IfluxSeoTitle.apply({ fallbackTitle: typeLabel });
      } else if (pageDef() && pageDef().applyPatch) {
        pageDef().applyPatch({ documentTitle: typeLabel });
      }
      return;
    }

    var seoVars = {};
    var src = String(source || '').toLowerCase();
    if (src === 'sector') seoVars.sectorName = currentDetail.name;
    else if (src === 'family' || src === 'ecosystem') seoVars.ecoName = currentDetail.name;
    else seoVars.storyName = currentDetail.name;

    if (global.IfluxSeoTitle && IfluxSeoTitle.apply) {
      IfluxSeoTitle.apply({
        vars: seoVars,
        fallbackTitle: currentDetail.name,
        patch: { title: currentDetail.name }
      });
    } else if (pageDef() && pageDef().applyPatch) {
      pageDef().applyPatch({
        title: currentDetail.name,
        documentTitle: currentDetail.name
      });
    }

    var newsState = {
      entityName: currentDetail.name,
      postsFilter: postsFilter(currentDetail),
      storyBase: '../community/'
    };

    root.innerHTML =
      '<div class="ifx-stock-layout">' +
        renderLeft(currentDetail) +
        renderCenter(currentDetail, newsState) +
      '</div>';
    mountSidebarHost(root.querySelector('.ifx-stock-col--left'));

    bindEvents(root, currentDetail, newsState);
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
    if (!global._ifxGroupResizeBound) {
      global._ifxGroupResizeBound = true;
      global.addEventListener('resize', function () {
        var tabsWrap = root.querySelector('[data-ec-tabs]');
        var active = tabsWrap && tabsWrap.querySelector('[data-ec-tab].active');
        var key = active ? active.getAttribute('data-ec-tab') : 'news';
        syncMobileLeftColumn(root, key, currentDetail);
      });
    }
  }

  function init(source) {
    if (source === 'story' || source === 'chu_de' || source === 'cau-chuyen') source = 'chu-de';
    var root = document.querySelector('[data-ifx-group-page]');
    if (!root) return;
    if (global.IfluxStockStore && IfluxStockStore.purgeLocalComments) {
      try { IfluxStockStore.purgeLocalComments(); } catch (e) { /* ignore */ }
    }
    function boot() {
      render(root, source);
    }
    var tax = global.IfluxWatchlistTaxonomy;
    if ((source === 'story' || source === 'chu-de' || source === 'chu_de' || source === 'cau-chuyen') && tax && tax.hydrateChuDeFromApi) {
      root.innerHTML = '<div class="ifx-stock-not-found"><p style="color:var(--ix-text-muted)">Đang tải chủ đề…</p></div>';
      tax.hydrateChuDeFromApi().then(boot).catch(boot);
    } else {
      boot();
    }
  }

  global.IfluxGroupPage = { init: init };
})(window);
