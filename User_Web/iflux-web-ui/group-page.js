/* Trang nhóm — Ngành / Họ CP / Chủ đề (layout giống cổ phiếu) */
(function (global) {
  'use strict';

  var currentSource = '';
  var currentId = '';
  var currentDetail = null;
  var MOBILE_SHELL_MAX = 1023.98;

  function isMobileShell() {
    return global.innerWidth <= MOBILE_SHELL_MAX;
  }

  function removeLeftColumn(root) {
    var left = root.querySelector('.ifx-stock-col--left');
    if (left) left.remove();
  }

  function remountLeftColumn(root, detail) {
    var layout = root.querySelector('.ifx-stock-layout');
    if (!layout || layout.querySelector('.ifx-stock-col--left') || !detail) return;
    layout.insertAdjacentHTML('afterbegin', renderLeft(detail));
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

  function mk() { return global.IfluxMockMarket; }
  function comStore() { return global.IfluxCommunityStore; }
  function comUi() { return global.IfluxCommunityUI; }
  function chatUi() { return global.IfluxStockCommentsUI; }
  function stockSt() { return global.IfluxStockStore; }
  function timelineFeed() { return global.IfluxEntityTimelineFeed; }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }

  function fmtChgAbs(n) {
    if (n == null || isNaN(n)) return '';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2);
  }

  function quoteStateClass(state) {
    if (state === 'ceiling' || state === 'floor' || state === 'up' || state === 'down') return 'is-' + state;
    return 'is-ref';
  }

  function chartColor(state) {
    if (global.IfluxBlockTemplates && IfluxBlockTemplates.marketDirColor) {
      return IfluxBlockTemplates.marketDirColor(state);
    }
    var map = { up: '#22c55e', down: '#ef4444', ref: '#f59e0b', ceiling: '#a855f7', floor: '#03c3ec' };
    return map[state] || map.ref;
  }

  function valueToY(v, yMin, yMax, plotH) {
    if (yMax === yMin) return plotH / 2;
    return plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  }

  function buildPath(prices, yMin, yMax, plotW, plotH) {
    var step = prices.length > 1 ? plotW / (prices.length - 1) : 0;
    return prices.map(function (v, i) {
      var x = i * step;
      var y = valueToY(v, yMin, yMax, plotH);
      return (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }).join(' ');
  }

  function chartSvgHtml(chart, state, title) {
    if (!chart || !chart.prices || !chart.prices.length) {
      return '<div class="ifx-stock-empty">Chưa có dữ liệu biểu đồ</div>';
    }
    var prices = chart.prices;
    var yMin = Math.min.apply(null, prices);
    var yMax = Math.max.apply(null, prices);
    var pad = (yMax - yMin) * 0.08 || 0.5;
    yMin -= pad;
    yMax += pad;
    var plotW = 320;
    var plotH = 200;
    var color = chartColor(state);
    var path = buildPath(prices, yMin, yMax, plotW, plotH);
    var refY = valueToY(prices[0], yMin, yMax, plotH);
    return (
      '<div class="ifx-stock-chart">' +
        '<svg viewBox="0 0 ' + plotW + ' ' + plotH + '" preserveAspectRatio="none" role="img" aria-label="Biểu đồ hiệu suất ' + esc(title) + '">' +
          '<line x1="0" y1="' + refY.toFixed(2) + '" x2="' + plotW + '" y2="' + refY.toFixed(2) + '" stroke="var(--ix-border)" stroke-width="1" stroke-dasharray="4 4"/>' +
          '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '</svg>' +
      '</div>'
    );
  }

  /* ==========================================================================
   * DETACHED (CG-1.0) — quarantine
   * Ownership removed under Single Render Rule.
   * Status: Detached from Production Runtime.
   * Allowed: read · audit · delete (Wave 5).
   * Forbidden: new callers · import · export · dependency · reuse ·
   *            feature · logic edits · move/refactor.
   * Pending: Wave 3 Orphan Register → Wave 4–5.
   * ==========================================================================
   */
  /* Giao dịch theo chủ thể (gộp) — UI dùng TMP-DIVERGING-BARS
     (IfluxBlockTemplates.renderDivergingBars*); trang chỉ chuẩn hóa dữ liệu. */
  function T() { return global.IfluxBlockTemplates; }

  function netFlowValue(pt) {
    if (!pt) return 0;
    if (pt.net_million != null) return pt.net_million;
    if (pt.net_billion != null) return pt.net_billion * 1000;
    return 0;
  }

  function fmtFlowAxis(v) {
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs >= 1000) {
      var b = abs / 1000;
      var bStr = b % 1 === 0 ? String(b) : b.toFixed(1).replace(/\.0$/, '');
      return (v < 0 ? '-' : '') + bStr + 'B';
    }
    return (v < 0 ? '-' : '') + abs + 'M';
  }

  function findFlowSubject(flow, key) {
    if (!flow || !flow.subjects) return null;
    for (var i = 0; i < flow.subjects.length; i++) {
      if (flow.subjects[i].key === key) return flow.subjects[i];
    }
    return flow.subjects[0] || null;
  }

  function flowPoints(subject) {
    return ((subject && subject.series) || []).map(function (pt) {
      return {
        value: netFlowValue(pt),
        label: pt.date_label,
        title: pt.date_label + ': ' + pt.net_label
      };
    });
  }

  function netFlowHtml(flow, activeKey) {
    if (!flow || !flow.subjects || !flow.subjects.length || !T()) {
      return '<div class="ifx-stock-empty">Chưa có dữ liệu</div>';
    }
    activeKey = activeKey || flow.subjects[0].key;
    var subject = findFlowSubject(flow, activeKey);
    return T().renderDivergingBars({
      tabs: flow.subjects.map(function (s) { return { key: s.key, label: s.label }; }),
      activeKey: activeKey,
      hint: 'Giao dịch ròng · ' + subject.label + ' · ' + flow.sessions + ' phiên',
      points: flowPoints(subject),
      formatAxis: fmtFlowAxis
    });
  }

  function bindFlowTabs(root, flow) {
    if (!flow) return;
    var chartRoot = root.querySelector('[data-ifx-stock-flow-chart]');
    if (!chartRoot) return;
    chartRoot.querySelectorAll('[data-ifx-flow-subject]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-ifx-flow-subject');
        chartRoot.querySelectorAll('[data-ifx-flow-subject]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        var subject = findFlowSubject(flow, key);
        var plot = chartRoot.querySelector('[data-ifx-stock-flow-plot]');
        var hint = chartRoot.querySelector('.ifx-stock-flow-hint');
        if (plot && subject && T()) plot.innerHTML = T().renderDivergingBarsPlot({ points: flowPoints(subject), formatAxis: fmtFlowAxis });
        if (hint && subject) hint.textContent = 'Giao dịch ròng · ' + subject.label + ' · ' + flow.sessions + ' phiên';
      });
    });
  }

  /* END DETACHED (CG-1.0) */

  function kindIcon(kind) {
    if (kind === 'sector') return 'ti-category';
    if (kind === 'family') return 'ti-users-group';
    if (kind === 'story' || kind === 'chu-de') return 'ti-book-2';
    return 'ti-chart-dots';
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
        '<div class="ifx-stock-head__quote ' + quoteStateClass(detail.price_state) + '">' +
          '<div class="ifx-stock-head__price">' + fmtPct(detail.change_pct) + '</div>' +
          '<div class="ifx-stock-head__chg">' +
            '<span class="ifx-stock-head__chg-abs">Chỉ số tổng hợp</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ==========================================================================
   * DETACHED (CG-1.0) — quarantine
   * Ownership removed under Single Render Rule.
   * Status: Detached from Production Runtime.
   * Allowed: read · audit · delete (Wave 5).
   * Forbidden: new callers · import · export · dependency · reuse ·
   *            feature · logic edits · move/refactor.
   * Pending: Wave 3 Orphan Register → Wave 4–5.
   * ==========================================================================
   */
  function renderMemberChips(tickers) {
    return '<div class="ifx-group-members">' + (tickers || []).map(function (tk) {
      var href = global.IfluxSeoUrl
        ? IfluxSeoUrl.stockHref(tk)
        : '/co-phieu/' + encodeURIComponent(tk);
      return '<a class="ix-chip ix-chip-sm" href="' + href + '">' + esc(tk) + '</a>';
    }).join('') + '</div>';
  }

  /* END DETACHED (CG-1.0) */

  function renderLeft(detail) {
    return (
      '<div class="ifx-stock-col ifx-stock-col--left">' +
        '<div data-ifx-section="sidebar" data-section="sidebar"></div>' +
        '<section class="ifx-stock-panel">' +
          renderHeader(detail) +
          chartSvgHtml(detail.chart, detail.price_state, detail.name) +
        '</section>' +
      '</div>'
    );
  }

  function postsFilter(detail) {
    if (detail.kind === 'story' || detail.kind === 'chu-de') return { chuDeId: detail.id, storyId: detail.id };
    return { taxSource: detail.kind, taxGroupId: detail.id };
  }

  function feedKeyForDetail(detail) {
    if (!detail) return '';
    return detail.kind + ':' + detail.id;
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

  function commentCount(feedKey) {
    return stockSt() ? stockSt().countActivity(feedKey) : 0;
  }

  function renderCenter(detail, newsState) {
    newsState = newsState || {};
    var feedKey = feedKeyForDetail(detail);
    var commentsSectionHtml = chatUi()
      ? chatUi().panelHtml(feedKey)
      : '<div class="ifx-stock-empty">Bình luận</div>';

    if (global.IfluxEntityDetailCenter) {
      return IfluxEntityDetailCenter.render({
        kind: detail.kind,
        detail: detail,
        feedFilter: newsState.postsFilter || postsFilter(detail),
        storyBase: newsState.storyBase,
        commentsSectionHtml: commentsSectionHtml,
        commentCount: commentCount(feedKey)
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
        '<a href="/chu-de" class="ix-btn ix-btn-outline">Danh sách chủ đề</a> ' +
        '<a href="../search/index.html" class="ix-btn ix-btn-outline">Tìm kiếm</a>' +
      '</div>'
    );
  }

  function bindEvents(root, detail, newsState) {
    if (chatUi()) chatUi().bind(root, feedKeyForDetail(detail));
    if (timelineFeed() && newsState) timelineFeed().bind(root, newsState);
    if (global.IfluxEntityDetailCenter) {
      var feedKey = feedKeyForDetail(detail);
      IfluxEntityDetailCenter.mount(root, {
        kind: detail.kind,
        detail: detail,
        feedFilter: (newsState && newsState.postsFilter) || postsFilter(detail),
        storyBase: newsState && newsState.storyBase,
        onTab: function (key) {
          syncMobileLeftColumn(root, key, detail);
          if (key === 'comments' && chatUi()) chatUi().refreshFeed(root, feedKey);
        }
      });
    }
  }

  function parseGroupId(source) {
    if (global.IfluxSeoUrl) {
      if (source === 'sector') return IfluxSeoUrl.parseSectorId() || '';
      if (source === 'family') return IfluxSeoUrl.parseEcosystemId() || '';
      if (source === 'story' || source === 'chu-de' || source === 'chu_de') {
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
    currentDetail = mk() ? mk().getGroupDetail(source, currentId) : null;
    var typeLabel = global.IfluxWatchlistTaxonomy ? IfluxWatchlistTaxonomy.sourceLabel(source) : source;

    if (!currentDetail) {
      root.innerHTML = renderNotFound(source, currentId);
      document.title = typeLabel + ' · iFlux';
      return;
    }

    document.title = currentDetail.name + ' · ' + typeLabel + ' · iFlux';

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
    if (source === 'story' || source === 'chu_de') source = 'chu-de';
    var root = document.querySelector('[data-ifx-group-page]');
    if (!root) return;
    function boot() {
      render(root, source);
      document.addEventListener('iflux-stock-comments-change', function () {
        if (currentDetail && chatUi()) chatUi().refreshFeed(root, feedKeyForDetail(currentDetail));
      });
    }
    var tax = global.IfluxWatchlistTaxonomy;
    if ((source === 'story' || source === 'chu-de' || source === 'chu_de') && tax && tax.hydrateChuDeFromApi) {
      root.innerHTML = '<div class="ifx-stock-not-found"><p style="color:var(--ix-text-muted)">Đang tải chủ đề…</p></div>';
      tax.hydrateChuDeFromApi().then(boot).catch(boot);
    } else {
      boot();
    }
  }

  global.IfluxGroupPage = { init: init };
})(window);
