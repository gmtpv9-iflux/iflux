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
    var layout = root.querySelector('.ifx-shell-sidebar-content');
    if (!layout || layout.querySelector('.ifx-stock-col--left') || !detail) return;
    layout.insertAdjacentHTML('afterbegin', renderLeft(detail));
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
  }

  function syncMobileLeftColumn(root, tabKey, detail) {
    if (!isMobileShell()) return;
    var layout = root.querySelector('.ifx-shell-layout');
    if (!layout) return;
    if (tabKey === 'articles') remountLeftColumn(root, detail);
    else removeLeftColumn(root);
  }

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
      price_state: 'ref',
      /* Owner 2026-10 (Phase 6) — chỉ Story có (hydrateChuDeFromApi), Sector/Family không. */
      stats: isChuDe ? group.stats : null
    };
  }

  /* Story "giống Topic" (Owner 2026-10, Phase 6) — hiển thị thẳng Like/Dislike/Comment/Share
     của Topic gốc, không còn "Đồng tình" riêng. */
  function statsRowHtml(stats) {
    if (!stats) return '';
    return (
      '<div class="ifx-stock-head__co" style="display:flex;gap:12px;margin-top:4px">' +
        '<span><i class="ti ti-heart" style="font-size:12px"></i> ' + (Number(stats.likes) || 0) + '</span>' +
        '<span><i class="ti ti-thumb-up ifx-icon-flip-v" style="font-size:12px"></i> ' + (Number(stats.dislikes) || 0) + '</span>' +
        '<span><i class="ti ti-message-circle" style="font-size:12px"></i> ' + (Number(stats.comments) || 0) + '</span>' +
        '<span><i class="ti ti-share" style="font-size:12px"></i> ' + (Number(stats.shares) || 0) + '</span>' +
      '</div>'
    );
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
          statsRowHtml(detail.stats) +
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

  function postsFilter(detail) {
    if (detail.kind === 'story' || detail.kind === 'chu-de' || detail.kind === 'cau-chuyen') return { chuDeId: detail.id, storyId: detail.id };
    return { taxSource: detail.kind, taxGroupId: detail.id };
  }

  function feedKeyForDetail(detail) {
    if (!detail) return '';
    return detail.kind + ':' + detail.id;
  }

  /* Owner 2026-10 (Phase 6, cuối ngày) — bỏ hẳn "Đồng tình" + Comment Thread riêng của Story
     (§7.3 cũ, đã gỡ route /stories/:id/agree ở backend) — Story giờ "giống Topic", Bình luận
     trên Story/Ngành/Hệ sinh thái đều qua Entity Posts Panel (Post Cộng đồng gắn thẻ Thực thể). */
  function entityPostsTarget(detail) {
    if (!detail) return null;
    var kind = String(detail.kind || '').toLowerCase();
    if (kind === 'sector') return { entityType: 'sector', entityId: String(detail.id || '') };
    if (kind === 'family' || kind === 'ecosystem') return { entityType: 'family', entityId: String(detail.id || '') };
    if (kind === 'cau-chuyen' || kind === 'chu-de' || kind === 'chu_de' || kind === 'story') {
      return { entityType: 'story', entityId: String(detail.id || '') };
    }
    return null;
  }

  function commentCount() {
    return 0;
  }

  function renderCenter(detail, newsState) {
    newsState = newsState || {};
    var epTarget = entityPostsTarget(detail);
    var commentsSectionHtml = epTarget ? '<div data-ifx-entity-posts-root></div>' : '<div class="ifx-com-empty">Bình luận</div>';

    return IfluxEntityDetailCenter.render({
      kind: detail.kind,
      detail: detail,
      feedFilter: newsState.postsFilter || postsFilter(detail),
      storyBase: newsState.storyBase,
      commentsSectionHtml: commentsSectionHtml,
      commentCount: commentCount()
    });
  }

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

  function mountEntityPostsPanel(root, epTarget) {
    var mountEl = root.querySelector('[data-ifx-entity-posts-root]');
    if (!mountEl || mountEl.__ifxMounted) return;
    mountEl.__ifxMounted = true;
    function doMount() { global.IfluxEntityPostsPanel.mount(mountEl, epTarget); }
    if (global.IfluxEntityPostsPanel) { doMount(); return; }
    loadScript('/User_Web/iflux-web-ui/community-store.js?v=r20261008a')
      .then(function () { return loadScript('/User_Web/iflux-web-ui/entity-posts-panel.js?v=r20261009i'); })
      .then(doMount)
      .catch(function () { mountEl.innerHTML = '<p class="ifx-com-empty" style="color:var(--ix-danger)">Không tải được Bình luận</p>'; });
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
    var epTarget = entityPostsTarget(detail);
    if (epTarget) mountEntityPostsPanel(root, epTarget);
    if (global.IfluxEntityDetailCenter) {
      IfluxEntityDetailCenter.mount(root, {
        kind: detail.kind,
        detail: detail,
        feedFilter: (newsState && newsState.postsFilter) || postsFilter(detail),
        storyBase: newsState && newsState.storyBase,
        onTab: function (key) {
          syncMobileLeftColumn(root, key, detail);
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
      storyBase: '../news/'
    };

    /* Khung trang chung: cột biểu đồ = nội dung đặc thù Sidebar, tab = nội dung đặc thù Main. */
    root.innerHTML = '';
    var frame = global.IfluxRuntimeSections.buildPageFrame(root, { sidebarLabel: 'Widget nhóm' });
    frame.sidebarContent.innerHTML = renderLeft(currentDetail);
    frame.mainContent.innerHTML = renderCenter(currentDetail, newsState);

    bindEvents(root, currentDetail, newsState);
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
    if (!global._ifxGroupResizeBound) {
      global._ifxGroupResizeBound = true;
      global.addEventListener('resize', function () {
        var tabsWrap = root.querySelector('[data-ec-tabs]');
        var active = tabsWrap && tabsWrap.querySelector('[data-ec-tab].active');
        var key = active ? active.getAttribute('data-ec-tab') : 'articles';
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
    } else if (tax && tax.ensureMasterGroups) {
      /* Ngành / HST: thành viên nhóm lấy từ Market Master — chờ danh mục trước khi dựng. */
      tax.ensureMasterGroups().then(boot, boot);
    } else {
      boot();
    }
  }

  global.IfluxGroupPage = { init: init };
})(window);
