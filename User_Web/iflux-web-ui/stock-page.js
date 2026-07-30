/* Trang chi tiết cổ phiếu — 3 cột */
(function (global) {
  'use strict';

  var currentTicker = '';

  function isMobileShell() {
    return global.IfluxBreakpoint && global.IfluxBreakpoint.isMobileShell
      ? global.IfluxBreakpoint.isMobileShell()
      : false;
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
    enrichRealtime(root, ticker);
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
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
  function cta() { return global.IfluxCommentsCta; }
  function stockSt() { return global.IfluxStockStore; }
  function wlUi() { return global.IfluxWatchlistUI; }
  function auth() { return global.IfluxAuth; }
  function timelineFeed() { return global.IfluxEntityTimelineFeed; }
  function pageDef() { return global.IfluxPageDefinition; }

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

  function renderHeader(detail) {
    var heart = global.IfluxHeartAction ? IfluxHeartAction.heartButtonHtml(detail.ticker) : '';
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
        '<div data-ifx-section="sidebar" data-section="sidebar"></div>' +
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
    return 0;
  }

  function renderCenter(ticker, detail, newsState) {
    newsState = newsState || {};
    var target = { type: 'stock', id: String(ticker || '').toUpperCase() };
    var commentsSectionHtml = cta()
      ? cta().html({ target: target, count: null })
      : '<div class="ifx-com-empty"><a class="ix-btn ix-btn-outline" href="' +
          esc(global.IfluxHref
            ? IfluxHref.forCanonical(global.IfluxSeoUrl && IfluxSeoUrl.stockCommentsPath
              ? IfluxSeoUrl.stockCommentsPath(ticker)
              : '/co-phieu/' + encodeURIComponent(ticker) + '/binh-luan')
            : ((global.IfluxSeoUrl && IfluxSeoUrl.stockCommentsPath
              ? IfluxSeoUrl.stockCommentsPath(ticker)
              : '/co-phieu/' + encodeURIComponent(ticker) + '/binh-luan'))) +
          '">Bình luận</a></div>';

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

  function bindEvents(root, ticker, detail, newsState) {
    if (cta()) {
      cta().mount(root, { type: 'stock', id: String(ticker || '').toUpperCase() });
    }
    if (timelineFeed() && newsState) timelineFeed().bind(root, newsState);

    if (wlUi() && wlUi().bindRowActions) wlUi().bindRowActions(root);
    else {
      if (global.IfluxHeartAction) IfluxHeartAction.bind(root);
      if (global.IfluxAlertUI) IfluxAlertUI.bindAlerts(root);
    }
    if (global.IfluxEntityDetailCenter) {
      IfluxEntityDetailCenter.mount(root, {
        kind: 'stock',
        ticker: ticker,
        feedFilter: newsState && newsState.postsFilter,
        storyBase: newsState && newsState.storyBase,
        onTab: function (key) {
          syncMobileLeftColumn(root, key, ticker, detail);
          if (key === 'comments' && cta()) {
            cta().mount(root, { type: 'stock', id: String(ticker || '').toUpperCase() });
          }
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
    } else if (pageDef() && pageDef().applyPatch) {
      var company = detail.name || detail.short_name || currentTicker;
      var docTitle = currentTicker + ' - ' + company;
      pageDef().applyPatch({
        title: docTitle,
        documentTitle: docTitle
      });
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
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
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
    if (global.IfluxStockStore && IfluxStockStore.purgeLocalComments) {
      try { IfluxStockStore.purgeLocalComments(); } catch (e) { /* ignore */ }
    }
    render(root);
  }

  global.IfluxStockPage = { init: init };
})(window);
