/* Trang chi tiết cổ phiếu — 3 cột */
(function (global) {
  'use strict';

  var currentTicker = '';
  var MOBILE_SHELL_MAX = 1023.98;

  function isMobileShell() {
    return global.innerWidth <= MOBILE_SHELL_MAX;
  }

  function destroyLeftCharts(left) {
    if (!left) return;
    var chartEl = left.querySelector('[data-ifx-ohlc-chart]');
    if (chartEl && chartEl._apex) {
      try { chartEl._apex.destroy(); } catch (e) { /* ignore */ }
      chartEl._apex = null;
    }
  }

  function removeLeftColumn(root) {
    var left = root.querySelector('.ifx-stock-col--left');
    if (!left) return;
    destroyLeftCharts(left);
    left.remove();
  }

  function remountLeftColumn(root, ticker, detail) {
    var layout = root.querySelector('.ifx-stock-layout');
    if (!layout || layout.querySelector('.ifx-stock-col--left') || !detail) return;
    layout.insertAdjacentHTML('afterbegin', renderLeft(detail));
    if (detail.net_flow) bindFlowTabs(root, detail.net_flow);
    enrichRealtime(root, ticker);
  }

  function syncMobileLeftColumn(root, tabKey, ticker, detail) {
    if (!isMobileShell()) return;
    var layout = root.querySelector('.ifx-stock-layout');
    if (!layout) return;
    layout.classList.toggle('ifx-stock-layout--mobile-screen', tabKey !== 'news');
    if (tabKey === 'news') remountLeftColumn(root, ticker, detail);
    else removeLeftColumn(root);
  }

  function mk() { return global.IfluxMockMarket; }
  function comStore() { return global.IfluxCommunityStore; }
  function comUi() { return global.IfluxCommunityUI; }
  function stockSt() { return global.IfluxStockStore; }
  function wlUi() { return global.IfluxWatchlistUI; }
  function auth() { return global.IfluxAuth; }
  function chatUi() { return global.IfluxStockCommentsUI; }
  function timelineFeed() { return global.IfluxEntityTimelineFeed; }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtPrice(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  function quotes() { return global.IfluxMarketQuotes; }

  function readToken(name, fb) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fb;
    } catch (e) { return fb; }
  }

  /* Vẽ nến OHLC (ApexCharts + dữ liệu thật). Không vẽ SVG mock trước — tránh flash đồ thị cũ. */
  function mountOhlcChart(container, rows) {
    if (!container) return;
    if (!global.ApexCharts || !rows || !rows.length) {
      container.innerHTML = '<div class="ifx-stock-empty">Chưa có dữ liệu biểu đồ</div>';
      return;
    }
    var up = readToken('--ix-success', '#22c55e');
    var down = readToken('--ix-danger', '#ef4444');
    var border = readToken('--ix-border', '#2a2a3a');
    var muted = readToken('--ix-text-muted', '#8a8aa0');
    var data = rows.map(function (r) {
      return { x: r.date, y: [r.open, r.high, r.low, r.close] };
    });
    container.innerHTML = '';
    var opts = {
      chart: { type: 'candlestick', height: 300, toolbar: { show: false }, animations: { enabled: false }, background: 'transparent', fontFamily: 'inherit' },
      series: [{ name: currentTicker, data: data }],
      xaxis: {
        type: 'category',
        labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: muted, fontSize: '10px' }, formatter: function (v) { return String(v).slice(5); } },
        tickAmount: 6, axisBorder: { color: border }, axisTicks: { color: border }
      },
      yaxis: { tooltip: { enabled: true }, labels: { style: { colors: muted, fontSize: '11px' }, formatter: function (v) { return Number(v).toFixed(1); } } },
      grid: { borderColor: border, strokeDashArray: 4 },
      plotOptions: { candlestick: { colors: { upward: up, downward: down }, wick: { useFillColor: true } } },
      tooltip: { theme: 'dark' }
    };
    try {
      if (container._apex) { container._apex.destroy(); container._apex = null; }
      var ch = new ApexCharts(container, opts);
      ch.render();
      container._apex = ch;
    } catch (e) {
      container.innerHTML = '<div class="ifx-stock-empty">Không tải được biểu đồ</div>';
    }
  }

  /* Cập nhật header (giá / tăng-giảm / trạng thái màu) từ quote thật. */
  function applyQuoteToHeader(root, q) {
    if (!root || !q) return;
    var quoteEl = root.querySelector('.ifx-stock-head__quote');
    if (quoteEl) quoteEl.className = 'ifx-stock-head__quote ' + quoteStateClass(q.state);
    var priceEl = root.querySelector('.ifx-stock-head__price');
    if (priceEl) priceEl.textContent = fmtPrice(q.price);
    var chgEl = root.querySelector('.ifx-stock-head__chg');
    if (chgEl) {
      chgEl.innerHTML = fmtPct(q.pctChange) +
        '<span class="ifx-stock-head__chg-abs">' + fmtChgAbs(q.change) + '</span>';
    }
  }

  function enrichRealtime(root, ticker) {
    if (!quotes()) return;
    var chartEl = root.querySelector('[data-ifx-ohlc-chart]');
    quotes().getQuote(ticker).then(function (q) {
      if (q) applyQuoteToHeader(root, q);
      quotes().getOHLC(ticker, 160).then(function (rows) {
        mountOhlcChart(chartEl, rows);
      });
    });
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
  /* Giao dịch theo chủ thể — UI dùng TMP-DIVERGING-BARS
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
    var i;
    for (i = 0; i < flow.subjects.length; i++) {
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

  /* END DETACHED (CG-1.0) */

  function renderHeader(detail) {
    var heart = wlUi() ? wlUi().heartButtonHtml(detail.ticker) : '';
    return (
      '<div class="ifx-stock-head">' +
        '<div class="ifx-stock-head__info">' +
          '<div class="ifx-stock-head__symbol">' +
            '<strong>' + esc(detail.ticker) + '</strong>' +
            '<span class="ifx-stock-head__ex">' + esc(detail.exchange) + '</span>' +
          '</div>' +
          '<div class="ifx-stock-head__co">' + esc(detail.short_name) + '</div>' +
        '</div>' +
        '<div class="ifx-stock-head__quote ' + quoteStateClass(detail.price_state) + '">' +
          '<div class="ifx-stock-head__price">' + fmtPrice(detail.price) + '</div>' +
          '<div class="ifx-stock-head__chg">' +
            fmtPct(detail.change_pct) +
            '<span class="ifx-stock-head__chg-abs">' + fmtChgAbs(detail.change_abs) + '</span>' +
          '</div>' +
          (heart ? '<div class="ifx-stock-head__actions">' + heart + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderLeft(detail) {
    return (
      '<div class="ifx-stock-col ifx-stock-col--left">' +
        '<section class="ifx-stock-panel">' +
          renderHeader(detail) +
          '<div class="ifx-stock-chart" data-ifx-ohlc-chart></div>' +
        '</section>' +
      '</div>'
    );
  }

  function buildFeedSections(entityName, newsState) {
    var tf = timelineFeed();
    var name = esc(entityName);

    var articlesBody, articlesCount, newsBody, newsCount;
    if (tf) {
      articlesBody = tf.articlesListHtml(newsState);
      articlesCount = tf.articlesCount(newsState);
      newsBody = tf.newsListHtml(newsState);
      newsCount = tf.newsCount(newsState);
    } else {
      var posts = comStore() ? comStore().getPosts(newsState.postsFilter) : [];
      var listHtml = posts.length && comUi() && comUi().compactPostHtml
        ? '<div class="ifx-stock-news-list">' + posts.map(function (p) {
            return comUi().compactPostHtml(p, { storyBase: '../community/' });
          }).join('') + '</div>'
        : '<div class="ifx-stock-empty">Chưa có bài viết liên quan.</div>';
      articlesBody = listHtml; articlesCount = posts.length;
      newsBody = listHtml; newsCount = posts.length;
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

  function commentCount(ticker) {
    return stockSt() ? stockSt().countActivity(ticker) : 0;
  }

  function renderCenter(ticker, detail, newsState) {
    newsState = newsState || {};
    var commentsSectionHtml = chatUi()
      ? chatUi().panelHtml(ticker)
      : '<div class="ifx-stock-empty">Bình luận</div>';

    if (global.IfluxEntityDetailCenter) {
      return IfluxEntityDetailCenter.render({
        kind: 'stock',
        ticker: ticker,
        feedFilter: newsState.postsFilter,
        storyBase: newsState.storyBase,
        commentsSectionHtml: commentsSectionHtml,
        commentCount: commentCount(ticker)
      });
    }

    var sections = buildFeedSections(detail.name || ticker, newsState);
    return (
      '<div class="ifx-stock-col ifx-stock-col--center">' +
        sections.articlesSectionHtml +
        sections.newsSectionHtml +
      '</div>'
    );
  }

  function renderNotFound(ticker) {
    return (
      '<div class="ifx-stock-not-found">' +
        '<h1 class="ix-page-title">Không tìm thấy mã ' + esc(ticker) + '</h1>' +
        '<p style="color:var(--ix-text-muted);margin-bottom:16px">Mã không có trong dữ liệu sandbox.</p>' +
        '<a href="../community/index.html" class="ix-btn ix-btn-outline">Về Cộng đồng</a>' +
      '</div>'
    );
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
        if (plot && subject && T()) {
          plot.innerHTML = T().renderDivergingBarsPlot({ points: flowPoints(subject), formatAxis: fmtFlowAxis });
        }
        if (hint && subject) {
          hint.textContent = 'Giao dịch ròng · ' + subject.label + ' · ' + flow.sessions + ' phiên';
        }
      });
    });
  }

  function bindEvents(root, ticker, detail, newsState) {
    if (chatUi()) chatUi().bind(root, ticker);
    if (timelineFeed() && newsState) timelineFeed().bind(root, newsState);

    if (wlUi()) wlUi().bindHearts(root);
    if (detail && detail.net_flow) bindFlowTabs(root, detail.net_flow);
    if (global.IfluxEntityDetailCenter) {
      IfluxEntityDetailCenter.mount(root, {
        kind: 'stock',
        ticker: ticker,
        feedFilter: newsState && newsState.postsFilter,
        storyBase: newsState && newsState.storyBase,
        onTab: function (key) {
          syncMobileLeftColumn(root, key, ticker, detail);
          if (key === 'comments' && chatUi()) chatUi().refreshFeed(root, ticker);
        }
      });
    }
  }

  function render(root) {
    currentTicker = (global.IfluxSeoUrl && IfluxSeoUrl.parseStockTicker
      ? IfluxSeoUrl.parseStockTicker()
      : new URLSearchParams(location.search).get('ticker')) || 'VHM';
    currentTicker = String(currentTicker).toUpperCase();
    var detail = mk() ? mk().getStockDetail(currentTicker) : null;
    document.title = currentTicker + ' · iFlux';

    if (!detail) {
      if (!quotes()) {
        root.innerHTML = renderNotFound(currentTicker);
        return;
      }
      detail = {
        ticker: currentTicker,
        exchange: '',
        short_name: '',
        name: currentTicker,
        price: null,
        change_pct: null,
        change_abs: null,
        price_state: 'ref',
        chart: null,
        net_flow: null
      };
    }

    var posts = comStore() ? comStore().getPosts({ ticker: currentTicker }) : [];
    if (global.IfluxSeoUrl) {
      IfluxSeoUrl.applyStockSeoToDocument(detail, { newsCount: posts.length });
    } else {
      document.title = currentTicker + ' · iFlux';
    }

    var newsState = {
      entityName: detail.name || currentTicker,
      postsFilter: { ticker: currentTicker },
      storyBase: '../community/'
    };

    root.innerHTML =
      '<div class="ifx-stock-layout">' +
        renderLeft(detail) +
        renderCenter(currentTicker, detail, newsState) +
      '</div>';

    bindEvents(root, currentTicker, detail, newsState);
    enrichRealtime(root, currentTicker);
    if (!global._ifxStockResizeBound) {
      global._ifxStockResizeBound = true;
      global.addEventListener('resize', function () {
        var tabsWrap = root.querySelector('[data-ec-tabs]');
        var active = tabsWrap && tabsWrap.querySelector('[data-ec-tab].active');
        var key = active ? active.getAttribute('data-ec-tab') : 'news';
        syncMobileLeftColumn(root, key, currentTicker, detail);
      });
    }
  }

  function init() {
    var root = document.querySelector('[data-ifx-stock-page]');
    if (!root) return;
    render(root);
    document.addEventListener('iflux-stock-comments-change', function () {
      if (chatUi()) chatUi().refreshFeed(root, currentTicker);
    });
  }

  global.IfluxStockPage = { init: init };
})(window);
