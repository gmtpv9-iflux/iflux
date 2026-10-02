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
    var layout = root.querySelector('.ifx-shell-sidebar-content');
    if (!layout || layout.querySelector('.ifx-stock-col--left') || !detail) return;
    layout.insertAdjacentHTML('afterbegin', renderLeft(detail));
    enrichRealtime(root, ticker);
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
  }

  function syncMobileLeftColumn(root, tabKey, ticker, detail) {
    if (!isMobileShell()) return;
    var layout = root.querySelector('.ifx-shell-layout');
    if (!layout) return;
    if (tabKey === 'articles') remountLeftColumn(root, ticker, detail);
    else removeLeftColumn(root);
  }

  function cta() { return global.IfluxCommentsCta; }
  function stockSt() { return global.IfluxStockStore; }
  function wlUi() { return global.IfluxWatchlistUI; }
  function auth() { return global.IfluxAuth; }
  function pageDef() { return global.IfluxPageDefinition; }
  function master() { return global.IfluxMarketMaster; }

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
    /* Soft-navigate: container có thể vào DOM trước khi layout (flex/grid cha) ổn định
       xong 1 nhịp — ApexCharts đo offsetWidth=0 lúc đó ra NaN cho mọi thuộc tính SVG.
       Đợi tới khi container có bề ngang thật (tối đa vài khung hình) rồi mới render. */
    function renderWhenSized(attemptsLeft) {
      if (!container.isConnected) return;
      if (container.offsetWidth > 0 || attemptsLeft <= 0) {
        try {
          if (container._apex) { container._apex.destroy(); container._apex = null; }
          var ch = new ApexCharts(container, opts);
          ch.render();
          container._apex = ch;
        } catch (e) {
          container.innerHTML = '<div class="ifx-stock-empty">Không tải được biểu đồ</div>';
        }
        return;
      }
      global.requestAnimationFrame(function () { renderWhenSized(attemptsLeft - 1); });
    }
    renderWhenSized(10);
  }

  function quoteChangePct(q) {
    if (!q) return null;
    if (q.change_pct != null && !isNaN(Number(q.change_pct))) return Number(q.change_pct);
    if (q.pctChange != null && !isNaN(Number(q.pctChange))) return Number(q.pctChange);
    return null;
  }

  function quotePrice(q) {
    if (!q) return null;
    if (q.price != null && !isNaN(Number(q.price))) return Number(q.price);
    if (q.close != null && !isNaN(Number(q.close))) return Number(q.close);
    return null;
  }

  function quoteState(q) {
    if (!q) return 'ref';
    var mq = quotes();
    if (mq && typeof mq.priceState === 'function') {
      return mq.priceState(quotePrice(q), q.ref, q.ceiling, q.floor);
    }
    return q.state || 'ref';
  }

  /* Cập nhật header (giá / tăng-giảm / trạng thái màu) từ quote thật. */
  function applyQuoteToHeader(root, q) {
    if (!root || !q) return;
    var quoteEl = root.querySelector('.ifx-stock-head__quote');
    if (quoteEl) quoteEl.className = 'ifx-stock-head__quote ' + quoteStateClass(quoteState(q));
    var priceEl = root.querySelector('.ifx-stock-head__price');
    if (priceEl) priceEl.textContent = fmtPrice(quotePrice(q));
    var chgEl = root.querySelector('.ifx-stock-head__chg');
    if (chgEl) {
      chgEl.innerHTML = fmtPct(quoteChangePct(q)) +
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

  function normalizeExchange(ex) {
    ex = String(ex || '').toUpperCase();
    if (ex === 'HOSE') return 'HSX';
    return ex || '';
  }

  /** Identity = Master; VALUE = runtime quote (peek) hoặc UNAVAILABLE. Cấm getStockDetail mock. */
  function resolveStockDetail(ticker) {
    var t = String(ticker || '').toUpperCase();
    var detail = {
      ticker: t,
      exchange: '',
      short_name: t,
      name: t,
      price: null,
      change_pct: null,
      change_abs: null,
      price_state: 'ref'
    };
    var mm = master();
    var s = mm && typeof mm.peekStock === 'function' ? mm.peekStock(t) : null;
    if (s) {
      detail.name = s.name || t;
      detail.short_name = s.short_name || s.name || t;
      detail.exchange = normalizeExchange(s.exchange);
    }
    var mq = quotes();
    var q = mq && typeof mq.peekQuote === 'function' ? mq.peekQuote(t) : null;
    if (q) {
      detail.price = quotePrice(q);
      detail.change_pct = quoteChangePct(q);
      detail.change_abs = q.change != null ? Number(q.change) : null;
      detail.price_state = quoteState(q);
    }
    return detail;
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
        '<section class="ifx-stock-panel">' +
          renderHeader(detail) +
          '<div class="ifx-stock-chart" data-ifx-ohlc-chart></div>' +
        '</section>' +
      '</div>'
    );
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

    return IfluxEntityDetailCenter.render({
      kind: 'stock',
      ticker: ticker,
      feedFilter: newsState.postsFilter,
      storyBase: newsState.storyBase,
      commentsSectionHtml: commentsSectionHtml,
      commentCount: commentCount(ticker)
    });
  }

  function renderNotFound(ticker) {
    return (
      '<div class="ifx-stock-not-found">' +
        '<h1 class="ix-page-title">Không tìm thấy mã ' + esc(ticker) + '</h1>' +
        '<p style="color:var(--ix-text-muted);margin-bottom:16px">Mã không có trong dữ liệu sandbox.</p>' +
        '<a href="../news/index.html" class="ix-btn ix-btn-outline">Về Tin tức</a>' +
      '</div>'
    );
  }

  function bindEvents(root, ticker, detail, newsState) {
    if (cta()) {
      cta().mount(root, { type: 'stock', id: String(ticker || '').toUpperCase() });
    }

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

  function parseTicker() {
    var t = (global.IfluxSeoUrl && IfluxSeoUrl.parseStockTicker
      ? IfluxSeoUrl.parseStockTicker()
      : new URLSearchParams(location.search).get('ticker')) || 'VHM';
    return String(t).toUpperCase();
  }

  function render(root) {
    currentTicker = parseTicker();
    var detail = resolveStockDetail(currentTicker);

    if (global.IfluxSeoUrl) {
      IfluxSeoUrl.applyStockSeoToDocument(detail);
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
      storyBase: '../news/'
    };

    /* Khung trang chung: cột biểu đồ = nội dung đặc thù Sidebar, tab = nội dung đặc thù Main. */
    root.innerHTML = '';
    var frame = global.IfluxRuntimeSections.buildPageFrame(root, { sidebarLabel: 'Widget cổ phiếu' });
    frame.sidebarContent.innerHTML = renderLeft(detail);
    frame.mainContent.innerHTML = renderCenter(currentTicker, detail, newsState);

    bindEvents(root, currentTicker, detail, newsState);
    enrichRealtime(root, currentTicker);
    document.dispatchEvent(new CustomEvent('iflux-knowledge-remount-widgets'));
    if (!global._ifxStockResizeBound) {
      global._ifxStockResizeBound = true;
      global.addEventListener('resize', function () {
        var tabsWrap = root.querySelector('[data-ec-tabs]');
        var active = tabsWrap && tabsWrap.querySelector('[data-ec-tab].active');
        var key = active ? active.getAttribute('data-ec-tab') : 'articles';
        syncMobileLeftColumn(root, key, currentTicker, detail);
      });
    }
  }

  function hydrateThenRender(root) {
    var ticker = parseTicker();
    var tasks = [];
    var mm = master();
    /* Chỉ thông tin của mã đang xem — không tải cả danh mục. */
    if (mm && typeof mm.getStock === 'function') {
      tasks.push(mm.getStock(ticker).catch(function () { return null; }));
    }
    if (quotes() && typeof quotes().getQuote === 'function') {
      tasks.push(quotes().getQuote(ticker).catch(function () { return null; }));
    }
    if (!tasks.length) {
      render(root);
      return;
    }
    Promise.all(tasks).then(function () { render(root); });
  }

  function init() {
    var root = document.querySelector('[data-ifx-stock-page]');
    if (!root) return;
    if (global.IfluxStockStore && IfluxStockStore.purgeLocalComments) {
      try { IfluxStockStore.purgeLocalComments(); } catch (e) { /* ignore */ }
    }
    hydrateThenRender(root);
  }

  global.IfluxStockPage = { init: init };
})(window);
