/* Trang Danh sách Entity — Cổ phiếu / Ngành / Họ CP / Câu chuyện
 * Bản chất: danh sách cổ phiếu nhóm theo tab (sàn / ngành / họ / câu chuyện).
 * Sidebar 1/4: Heatmap + Thống kê theo chủ thể + Top 10 hiệu suất (theo chủ thể của trang).
 * Main 3/4: tabs + danh sách cổ phiếu (heart = watchlist, bell = cảnh báo, có trạng thái).
 * Chỉ dùng class/component có sẵn trong Design System — không tự chế CSS.
 */
(function (global) {
  'use strict';

  /* Chủ thể (subject) của sidebar tương ứng từng trang danh sách */
  var SUBJECT = {
    stocks: 'stock',
    sectors: 'sector',
    ecosystems: 'family',
    stories: 'chu-de',
    'chu-de': 'chu-de',
    'cau-chuyen': 'chu-de'
  };

  var META = {
    stocks: {
      title: 'Danh sách cổ phiếu',
      intro: 'Toàn bộ cổ phiếu nhóm theo sàn giao dịch. Theo dõi (tim) và đặt cảnh báo (chuông) ngay trên từng mã.',
      heatIcon: 'ti ti-layout-grid',
      top10Icon: 'ti ti-trophy',
      top10Title: 'Top 10 cổ phiếu hiệu suất'
    },
    sectors: {
      title: 'Danh sách ngành',
      intro: 'Cổ phiếu nhóm theo ngành. Chọn tab ngành để xem danh sách mã và trạng thái theo dõi / cảnh báo.',
      heatIcon: 'ti ti-layout-grid',
      top10Icon: 'ti ti-trophy',
      top10Title: 'Top 10 ngành hiệu suất'
    },
    ecosystems: {
      title: 'Danh sách hệ sinh thái',
      intro: 'Cổ phiếu nhóm theo họ cổ phiếu (hệ sinh thái). Chọn tab để xem danh sách mã trong từng họ.',
      heatIcon: 'ti ti-layout-grid',
      top10Icon: 'ti ti-trophy',
      top10Title: 'Top 10 hệ sinh thái hiệu suất'
    },
    stories: {
      title: 'Danh sách câu chuyện',
      intro: 'Cổ phiếu nhóm theo câu chuyện thị trường. Chọn tab để xem danh sách mã theo từng câu chuyện.',
      heatIcon: 'ti ti-layout-grid',
      top10Icon: 'ti ti-trophy',
      top10Title: 'Top 10 câu chuyện hiệu suất'
    }
  };
  META['chu-de'] = META.stories;
  META['cau-chuyen'] = META.stories;

  var EXCHANGE_TABS = [
    { key: 'HSX', label: 'HOSE' },
    { key: 'HNX', label: 'HNX' },
    { key: 'UPCOM', label: 'UPCOM' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function mk() { return global.IfluxMockMarket; }
  function tax() { return global.IfluxWatchlistTaxonomy; }
  function mktq() { return global.IfluxMarketQuotes; }

  /* ── Làm giàu dòng danh sách bằng giá / tăng-giảm THẬT (VNDirect) ── */
  function fmtRealPrice(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtRealPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }
  function fmtVol(n) {
    if (n == null || isNaN(n)) return '—';
    n = Number(n);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }
  function stateClass(state) {
    if (state === 'up' || state === 'ceiling') return 'is-up';
    if (state === 'down' || state === 'floor') return 'is-down';
    return 'is-ref';
  }
  function applyQuoteToRow(wrap, q) {
    if (!wrap || !q) return;
    var cls = stateClass(q.state);
    var row = wrap.querySelector('.ifx-stock-row');
    [wrap, row].forEach(function (el) {
      if (!el) return;
      el.classList.remove('is-up', 'is-down', 'is-ref');
      el.classList.add(cls);
    });
    var p = wrap.querySelector('.ifx-stock-row__price');
    if (p) p.textContent = fmtRealPrice(q.price);
    var c = wrap.querySelector('.ifx-stock-row__chg');
    if (c) c.textContent = fmtRealPct(q.pctChange);
    var v = wrap.querySelector('.ifx-stock-row__vol');
    if (v) v.textContent = fmtVol(q.volume);
  }
  function enrichRealQuotes(scope) {
    if (!mktq()) return;
    scope = scope || document;
    var wraps = scope.querySelectorAll('.ifx-stock-row-wrap[data-ticker]');
    if (!wraps.length) return;
    var tickers = [];
    var map = {};
    wraps.forEach(function (w) {
      var t = w.getAttribute('data-ticker');
      if (!t) return;
      tickers.push(t);
      (map[t] = map[t] || []).push(w);
    });
    mktq().getQuotes(tickers).then(function (res) {
      Object.keys(map).forEach(function (t) {
        var q = res[t];
        if (!q) return;
        map[t].forEach(function (w) { applyQuoteToRow(w, q); });
      });
    });
  }

  function stocksMap() {
    var snap = mk() && mk().getSnapshot();
    return (snap && snap.entities && snap.entities.stocks) || {};
  }

  function capOf(s) {
    return (s && (s.market_cap != null ? s.market_cap : 0)) || 0;
  }

  function stockHref(t) {
    if (global.IfluxSeoUrl) return IfluxSeoUrl.stockHref(t);
    return '/co-phieu/' + encodeURIComponent(t);
  }

  /* ── Danh sách nhóm cho vùng main (mỗi nhóm = 1 tab) ── */
  function getMainGroups(kind) {
    if (kind === 'stocks') {
      var stocks = stocksMap();
      var all = Object.keys(stocks).sort(function (a, b) {
        return capOf(stocks[b]) - capOf(stocks[a]);
      });
      var groups = [{ id: 'all', name: 'Tất cả', tickers: all }];
      EXCHANGE_TABS.forEach(function (ex) {
        var list = all.filter(function (t) { return (stocks[t].exchange || 'HSX') === ex.key; });
        if (list.length) groups.push({ id: ex.key, name: ex.label, tickers: list });
      });
      return groups;
    }

    var subject = SUBJECT[kind];
    if (!tax()) return [];
    return tax().getGroups(subject).map(function (g) {
      return {
        id: g.id,
        name: g.name,
        tickers: tax().getGroupTickers(subject, g.id)
      };
    }).filter(function (g) {
      if (kind === 'stories' || kind === 'chu-de' || kind === 'cau-chuyen') {
        var story = tax().getGroup(subject, g.id) || {};
        if (story.normalizedStatus && story.normalizedStatus !== 'mature') return false;
        return true;
      }
      return g.tickers.length > 0;
    });
  }

  var LAZY_PAGE = 24;

  function rowHtmlFor(t, snap) {
    var s = snap[t];
    var ui = global.IfluxWatchlistUI;
    if (!s || !ui) return '';
    return ui.stockRowHtml(s, { href: stockHref(t) });
  }

  /* ── Render danh sách cổ phiếu (heart + bell + trạng thái) + lazy load ── */
  function renderList(container, tickers) {
    if (!container) return;
    var stocks = stocksMap();
    var list = (tickers || []).filter(function (t) { return !!stocks[t]; });
    container._elpTickers = list;
    container._elpStocks = stocks;

    if (global.IfluxStockScrollFeed && list.length > 0) {
      container._elpFeed = IfluxStockScrollFeed.mount(container, {
        pageSize: LAZY_PAGE,
        getItems: function () { return container._elpTickers || []; },
        renderItem: function (t) { return rowHtmlFor(t, container._elpStocks || stocksMap()); },
        emptyHtml: '<div class="ifx-mkt-empty">Chưa có cổ phiếu</div>',
        onRendered: function () {
          enrichRealQuotes(container);
          if (global.IfluxWatchlistUI && IfluxWatchlistUI.refreshHearts) IfluxWatchlistUI.refreshHearts();
          if (global.IfluxAlertUI && IfluxAlertUI.refreshAlertButtons) IfluxAlertUI.refreshAlertButtons();
        }
      });
      return;
    }

    container._elpFeed = null;
    var html = list.map(function (t) { return rowHtmlFor(t, stocks); }).join('');
    container.innerHTML = html || '<div class="ifx-mkt-empty">Chưa có cổ phiếu</div>';
  }

  function buildMain(main, kind) {
    if (!main) return;
    var groups = getMainGroups(kind);
    if (!groups.length) {
      main.innerHTML = '<div class="ifx-mkt-empty">Chưa có dữ liệu</div>';
      return;
    }

    var tabs = '<div class="ix-profile-tabs" data-elp-tabs role="tablist">' +
      groups.map(function (g, i) {
        return '<button type="button" class="ix-profile-tab' + (i === 0 ? ' active' : '') +
          '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" data-elp-tab="' + i + '">' +
          esc(g.name) + ' (' + g.tickers.length + ')</button>';
      }).join('') +
    '</div>';

    var panels = groups.map(function (g, i) {
      return '<div class="ix-tab-content' + (i === 0 ? ' active' : '') + '" data-elp-panel="' + i + '" role="tabpanel">' +
        '<div class="ifx-mkt-card"><div class="ifx-mkt-card__body" data-elp-list="' + i + '"></div></div>' +
      '</div>';
    }).join('');

    main.innerHTML = tabs + panels;

    groups.forEach(function (g, i) {
      renderList(main.querySelector('[data-elp-list="' + i + '"]'), g.tickers);
    });
    main._elpGroups = groups;
    enrichRealQuotes(main);
  }

  function bindTabs(main) {
    var tabsRoot = main.querySelector('[data-elp-tabs]');
    if (!tabsRoot) return;
    tabsRoot.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-elp-tab]');
      if (!btn) return;
      var idx = btn.getAttribute('data-elp-tab');
      tabsRoot.querySelectorAll('[data-elp-tab]').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      main.querySelectorAll('[data-elp-panel]').forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-elp-panel') === idx);
      });
      if (main._elpLazyHandler) main._elpLazyHandler();
    });
  }

  /* ── Lazy load: nạp thêm khi cuộn trang tới gần cuối danh sách active ── */
  function bindLazyScroll(main) {
    if (main._elpLazyHandler) return;
    var ticking = false;
    function fill() {
      var idx = activeIndex(main);
      var container = main.querySelector('[data-elp-list="' + idx + '"]');
      if (!container || !container._elpFeed) return;
      var guard = 0;
      while (guard < 60) {
        var sentinel = container.querySelector('[data-ifx-lazy-sentinel]');
        if (!sentinel || sentinel.hidden) break;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var r = sentinel.getBoundingClientRect();
        if (r.top > vh + 300) break;
        if (!container._elpFeed.loadMore()) break;
        guard += 1;
      }
    }
    function handler() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; fill(); });
    }
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });
    main._elpLazyHandler = handler;
    handler();
  }

  function activeIndex(main) {
    var active = main.querySelector('[data-elp-panel].active');
    return active ? active.getAttribute('data-elp-panel') : '0';
  }

  /* ── Realtime tick (giống trang Thị trường) ── */
  var _timer = null;

  function tickIntervalMs() {
    if (mk() && mk().getTickIntervalMs) return mk().getTickIntervalMs();
    return 12000;
  }

  function refreshOnTick(main, subject) {
    var groups = main._elpGroups || [];
    var idx = activeIndex(main);
    var g = groups[Number(idx)];
    var container = main.querySelector('[data-elp-list="' + idx + '"]');
    if (container && container._elpFeed) {
      container._elpStocks = stocksMap();
      container._elpFeed.refresh();
    } else if (g) {
      renderList(container, g.tickers);
    }
    enrichRealQuotes(main.querySelector('[data-elp-panel="' + idx + '"]') || main);
    if (global.IfluxWatchlistUI) IfluxWatchlistUI.refreshHearts();
    if (global.IfluxAlertUI) IfluxAlertUI.refreshAlertButtons();
  }

  function startRealtime(main, subject) {
    if (_timer) clearInterval(_timer);
    document.addEventListener('iflux-market-tick', function () {
      refreshOnTick(main, subject);
    });
    function onTick() {
      if (mk() && mk().isTradingActive && !mk().isTradingActive()) return;
      if (mk() && mk().tickRealtime) mk().tickRealtime();
    }
    _timer = setInterval(onTick, tickIntervalMs());
    onTick();
  }

  function hydrateBeforeRender(kind) {
    if (!(kind === 'stories' || kind === 'chu-de' || kind === 'cau-chuyen')) return Promise.resolve();
    if (!tax() || !tax().hydrateChuDeFromApi) return Promise.resolve();
    return tax().hydrateChuDeFromApi().then(function () {}).catch(function () {});
  }

  function init(kind) {
    kind = kind || 'stocks';
    if (!SUBJECT[kind]) kind = 'stocks';
    var meta = META[kind];

    var titleEl = document.querySelector('[data-elp-title]');
    if (titleEl) titleEl.textContent = meta.title;
    var introEl = document.querySelector('[data-elp-intro]');
    if (introEl) introEl.textContent = meta.intro;
    if (window.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
      IfluxPageDefinition.applyPatch({
        title: meta.title,
        intro: meta.intro,
        documentTitle: meta.title + ' · iFlux'
      });
    }

    var sidebar = document.querySelector('[data-elp-sidebar]');
    var main = document.querySelector('[data-elp-main]');
    if (!main) return;

    main.innerHTML = '<div class="ifx-mkt-card"><div class="ifx-mkt-card__body">Đang tải dữ liệu…</div></div>';
    hydrateBeforeRender(kind).then(function () {
      buildMain(main, kind);
      bindTabs(main);
      bindLazyScroll(main);

      if (global.IfluxWatchlistUI) IfluxWatchlistUI.bindHearts(main);

      document.addEventListener('iflux-watchlist-change', function () {
        if (global.IfluxWatchlistUI) IfluxWatchlistUI.refreshHearts();
      });
      document.addEventListener('iflux-alerts-change', function () {
        if (global.IfluxAlertUI) IfluxAlertUI.refreshAlertButtons();
      });

      startRealtime(main, SUBJECT[kind]);
      if (global.IfluxInsightShare) IfluxInsightShare.patchAll(document);
    });
  }

  global.IfluxEntityListPage = {
    init: init
  };
})(window);
