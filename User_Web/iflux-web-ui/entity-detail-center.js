/* Cột giữa trang chi tiết (CP / Ngành / Họ / Chủ đề)
   Tab: Bài viết (mặc định) · Thông tin · Thống kê · [Lịch sự kiện — chỉ CP]
   Chỉ dùng class/token có sẵn trong Design System. */
(function (global) {
  'use strict';

  function seo() { return global.IfluxSeoUrl; }
  function master() { return global.IfluxMarketMaster; }
  function quotes() { return global.IfluxMarketQuotes; }
  function tax() { return global.IfluxWatchlistTaxonomy; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function num(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN');
  }

  function fmtPrice(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }

  function pctCell(n) {
    if (n == null || isNaN(n)) return '<td data-ec-chg>—</td>';
    var cls = n > 0 ? 'ix-typo-status-positive' : (n < 0 ? 'ix-typo-status-negative' : '');
    return '<td class="' + cls + '" data-ec-chg>' + fmtPct(n) + '</td>';
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

  function masterStock(ticker) {
    var t = String(ticker || '').toUpperCase();
    var list = master() && typeof master().getMasterStocks === 'function' ? master().getMasterStocks() : null;
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      if (String((list[i] && list[i].ticker) || '').toUpperCase() === t) return list[i];
    }
    return null;
  }

  function stockIdentity(ticker) {
    var t = String(ticker || '').toUpperCase();
    var s = masterStock(t);
    var sectorName = '';
    var tx = tax();
    if (tx && typeof tx.getTickerMemberships === 'function') {
      var mem = tx.getTickerMemberships(t) || {};
      if (mem.sector && mem.sector.name) sectorName = mem.sector.name;
    }
    return {
      ticker: t,
      name: (s && (s.name || s.short_name)) || t,
      exchange: (s && s.exchange) || '',
      sector_name: sectorName
    };
  }

  /* ── Panel Thông tin ── */
  function infoRow(label, value) {
    return '<tr><th>' + esc(label) + '</th><td>' + value + '</td></tr>';
  }

  function stockInfoPanel(ticker) {
    var info = stockIdentity(ticker);
    var q = quotes() && typeof quotes().peekQuote === 'function' ? quotes().peekQuote(ticker) : null;
    var rows =
      infoRow('Sàn niêm yết', esc(info.exchange || '—')) +
      (info.sector_name ? infoRow('Ngành', esc(info.sector_name)) : '') +
      infoRow('Giá hiện tại', '<span data-ec-price>' + fmtPrice(quotePrice(q)) + '</span>') +
      infoRow('Vốn hóa', '—') +
      infoRow('KLGD', '<span data-ec-vol>' + (q && q.volume != null ? num(q.volume) : '—') + '</span>') +
      infoRow('EPS', '—') +
      infoRow('Giá trị sổ sách (BVPS)', '—') +
      infoRow('KLCP lưu hành', '—') +
      infoRow('P/E', '—') +
      infoRow('P/B', '—');

    return (
      '<section class="ifx-stock-panel" data-ec-stock-info="' + esc(info.ticker) + '">' +
        '<div class="ifx-stock-news-head"><h1>Thông tin công ty · ' + esc(info.name || ticker) + '</h1></div>' +
        '<table class="ix-table"><tbody>' + rows + '</tbody></table>' +
      '</section>'
    );
  }

  function memberHref(tk) {
    var c = seo() ? seo().stockHref(tk) : '/co-phieu/' + encodeURIComponent(tk);
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function groupInfoPanel(detail) {
    if (!detail) return '<section class="ifx-stock-panel"><div class="ifx-stock-empty">Chưa có thông tin.</div></section>';
    var tickers = detail.tickers || [];
    var rows = '';
    tickers.forEach(function (tk) {
      var s = masterStock(tk);
      var name = (s && (s.name || s.short_name)) || '';
      var q = quotes() && typeof quotes().peekQuote === 'function' ? quotes().peekQuote(tk) : null;
      rows +=
        '<tr data-ec-mem-ticker="' + esc(tk) + '">' +
          '<td><a class="ix-chip ix-chip-sm" href="' + memberHref(tk) + '">' + esc(tk) + '</a></td>' +
          '<td>' + esc(name) + '</td>' +
          pctCell(quoteChangePct(q)) +
          '<td>—</td>' +
          '<td>—</td>' +
        '</tr>';
    });

    return (
      '<section class="ifx-stock-panel" data-ec-group-info>' +
        '<div class="ifx-stock-news-head">' +
          '<h1>Thông tin · ' + esc(detail.name) + '</h1>' +
          '<p>' + detail.member_count + ' mã · Hiệu suất nhóm —</p>' +
        '</div>' +
        '<table class="ix-table"><thead><tr>' +
          '<th>Mã</th><th>Tên</th><th>%±</th><th>P/E</th><th>P/B</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '</section>'
    );
  }

  /* ── Panel Lịch sự kiện (chỉ CP) — không mock sandbox ── */
  function eventsPanel(ticker) {
    return (
      '<section class="ifx-stock-panel">' +
        '<div class="ifx-stock-news-head"><h1>Lịch sự kiện · ' + esc(ticker) + '</h1></div>' +
        '<div class="ifx-stock-empty">Chưa có lịch sự kiện cho <strong>' + esc(ticker) + '</strong>.</div>' +
      '</section>'
    );
  }

  /* Consumer thuần: tab context lấy từ IfluxAppShell.getContextTabs(entityType)
   * (SoT = IfluxNavRegistry.context). Renderer KHÔNG tự khai báo danh sách tab. */
  function tabsBar(opts) {
    opts = opts || {};
    var entityType = opts.entityType || (opts.hasEvents ? 'stock' : '_default');
    var shell = global.IfluxAppShell;
    var ctx = (shell && shell.getContextTabs) ? shell.getContextTabs(entityType) : null;
    var tabs = (ctx && ctx.tabs) ? ctx.tabs : [];
    var btns = tabs.map(function (t, i) {
      var countHtml = (t.key === 'comments')
        ? ' <span class="ifx-com-side-count" data-ec-comment-count>' + (opts.commentCount || 0) + '</span>'
        : '';
      return '<button type="button" class="ix-tab' + (i === 0 ? ' active' : '') +
        '" role="tab" aria-selected="' + (i === 0) + '" data-ec-tab="' + t.key + '">' +
        '<i class="ti ' + t.icon + '"></i> ' + esc(t.label) + countHtml + '</button>';
    }).join('');
    return '<div class="ix-tabs" role="tablist" data-ec-tabs style="margin-bottom:var(--ifx-space-16)">' + btns + '</div>';
  }

  function panel(key, active, html) {
    return '<div class="ix-tab-content' + (active ? ' active' : '') + '" data-ec-panel="' + key + '">' + html + '</div>';
  }

  function render(ctx) {
    ctx = ctx || {};
    var isStock = ctx.kind === 'stock';
    var infoHtml = isStock ? stockInfoPanel(ctx.ticker) : groupInfoPanel(ctx.detail);
    var feedHtml = '<div class="ifx-ec-daily-feed" data-ec-daily-feed></div>';
    var html =
      tabsBar({ entityType: isStock ? 'stock' : (ctx.kind || '_default'), commentCount: ctx.commentCount }) +
      panel('news', true, feedHtml) +
      panel('info', false, infoHtml) +
      panel('trading', false, '<div data-ifx-section="trading" data-section="trading" data-layout="grid-12"></div>') +
      (isStock ? panel('events', false, eventsPanel(ctx.ticker)) : '') +
      panel('comments', false, ctx.commentsSectionHtml || '');
    return '<div class="ifx-stock-col ifx-stock-col--center ifx-stock-col--wide">' + html + '</div>';
  }

  function mountDailyFeed(col, ctx) {
    var mountEl = col.querySelector('[data-ec-daily-feed]');
    if (!mountEl || !global.IfluxDailyFeed || !ctx.feedFilter) return;
    global.IfluxDailyFeed.mount(mountEl, {
      filter: ctx.feedFilter,
      storyBase: ctx.storyBase || '../community/',
      expertTitle: 'Phân tích của chuyên gia'
    });
  }

  function hydrateStockInfo(col, ticker) {
    var mq = quotes();
    if (!mq || !ticker) return;
    var panelEl = col.querySelector('[data-ec-stock-info]');
    if (!panelEl) return;
    mq.getQuote(ticker).then(function (q) {
      if (!q) return;
      var p = panelEl.querySelector('[data-ec-price]');
      if (p) p.textContent = fmtPrice(quotePrice(q));
      var v = panelEl.querySelector('[data-ec-vol]');
      if (v) v.textContent = q.volume != null ? num(q.volume) : '—';
    });
  }

  function hydrateGroupMemberQuotes(col, detail) {
    var mq = quotes();
    if (!mq || !detail || !detail.tickers || !detail.tickers.length) return;
    mq.getQuotes(detail.tickers).then(function (res) {
      col.querySelectorAll('[data-ec-mem-ticker]').forEach(function (tr) {
        var tk = tr.getAttribute('data-ec-mem-ticker');
        var q = res && res[tk];
        var cell = tr.querySelector('[data-ec-chg]');
        if (!cell) return;
        var pct = quoteChangePct(q);
        if (pct == null || isNaN(pct)) {
          cell.className = '';
          cell.textContent = '—';
          return;
        }
        cell.className = pct > 0 ? 'ix-typo-status-positive' : (pct < 0 ? 'ix-typo-status-negative' : '');
        cell.textContent = fmtPct(pct);
      });
    });
  }

  function mount(root, ctx) {
    ctx = ctx || {};
    var col = root.querySelector('.ifx-stock-col--center');
    if (!col) return;

    mountDailyFeed(col, ctx);
    if (ctx.kind === 'stock') hydrateStockInfo(col, ctx.ticker);
    else hydrateGroupMemberQuotes(col, ctx.detail);

    var tabsWrap = col.querySelector('[data-ec-tabs]');
    if (!tabsWrap) return;

    tabsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ec-tab]');
      if (!btn) return;
      var key = btn.getAttribute('data-ec-tab');
      tabsWrap.querySelectorAll('[data-ec-tab]').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      col.querySelectorAll('[data-ec-panel]').forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-ec-panel') === key);
      });
      if (typeof ctx.onTab === 'function') ctx.onTab(key, col);
      if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) IfluxWebUI.syncMobileTabbar();
    });

    if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) IfluxWebUI.syncMobileTabbar();
    document.dispatchEvent(new CustomEvent('iflux-context-ready'));

    if (!col._ecTickBound) {
      col._ecTickBound = true;
      document.addEventListener('iflux-stock-comments-change', function () {
        if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) IfluxWebUI.syncMobileTabbar();
      });
    }
  }

  global.IfluxEntityDetailCenter = { render: render, mount: mount };
})(window);
