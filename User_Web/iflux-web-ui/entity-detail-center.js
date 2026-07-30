/* Cột giữa trang chi tiết (CP / Ngành / Họ / Chủ đề)
   Tab: Bài viết (mặc định) · Thông tin · Thống kê · [Lịch sự kiện — chỉ CP]
   Chỉ dùng class/token có sẵn trong Design System. */
(function (global) {
  'use strict';

  function mk() { return global.IfluxMockMarket; }
  function seo() { return global.IfluxSeoUrl; }

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
    if (n == null || isNaN(n)) return '<td>—</td>';
    var cls = n > 0 ? 'ix-typo-status-positive' : (n < 0 ? 'ix-typo-status-negative' : '');
    return '<td class="' + cls + '">' + fmtPct(n) + '</td>';
  }

  /* ── Biểu đồ line nhỏ (P/E, P/B) — SVG, dùng token màu DS ── */
  function lineChartSvg(values, labels, strokeVar, ariaLabel) {
    if (!values || !values.length) {
      return '<div class="ifx-stock-empty">Chưa có dữ liệu</div>';
    }
    var yMin = Math.min.apply(null, values);
    var yMax = Math.max.apply(null, values);
    var pad = (yMax - yMin) * 0.12 || 0.5;
    yMin -= pad; yMax += pad;
    var plotW = 320, plotH = 160;
    var step = values.length > 1 ? plotW / (values.length - 1) : 0;
    var path = values.map(function (v, i) {
      var x = i * step;
      var y = (yMax === yMin) ? plotH / 2 : plotH - ((v - yMin) / (yMax - yMin)) * plotH;
      return (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }).join(' ');
    var first = labels && labels.length ? labels[0] : '';
    var last = labels && labels.length ? labels[labels.length - 1] : '';
    var cur = values[values.length - 1];
    return (
      '<div class="ifx-stock-chart">' +
        '<svg viewBox="0 0 ' + plotW + ' ' + plotH + '" preserveAspectRatio="none" role="img" aria-label="' + esc(ariaLabel) + '">' +
          '<path d="' + path + '" fill="none" stroke="' + strokeVar + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '</svg>' +
        '<div class="ifx-stock-flow-hint"><span>' + esc(first) + '</span> · hiện tại <strong>' + esc(cur) + '</strong> · <span>' + esc(last) + '</span></div>' +
      '</div>'
    );
  }

  /* ── Panel Thông tin ── */
  function infoRow(label, value) {
    return '<tr><th>' + esc(label) + '</th><td>' + value + '</td></tr>';
  }

  function stockInfoPanel(ticker) {
    var info = mk() ? mk().getStockInfo(ticker) : null;
    if (!info) return '<section class="ifx-stock-panel"><div class="ifx-stock-empty">Chưa có thông tin công ty.</div></section>';
    var rows =
      infoRow('Sàn niêm yết', esc(info.exchange)) +
      (info.sector_name ? infoRow('Ngành', esc(info.sector_name)) : '') +
      infoRow('Giá hiện tại', fmtPrice(info.price)) +
      infoRow('Vốn hóa', esc(info.market_cap_label)) +
      infoRow('KLGD', num(info.volume)) +
      infoRow('EPS', num(info.eps) + ' đ') +
      infoRow('Giá trị sổ sách (BVPS)', num(info.bvps) + ' đ') +
      infoRow('KLCP lưu hành', num(info.shares_outstanding)) +
      infoRow('P/E', info.pe != null ? info.pe : '—') +
      infoRow('P/B', info.pb != null ? info.pb : '—');

    var val = mk() ? mk().getStockValuationSeries(ticker, 22) : null;
    var charts = '';
    if (val) {
      charts =
        '<div class="ifx-stock-news-head" style="margin-top:var(--ifx-space-16)"><h2 class="ifx-stock-panel__title"><i class="ti ti-chart-line"></i> Biểu đồ P/E</h2></div>' +
        lineChartSvg(val.pe, val.labels, 'var(--ix-primary)', 'Biểu đồ P/E ' + ticker) +
        '<div class="ifx-stock-news-head" style="margin-top:var(--ifx-space-16)"><h2 class="ifx-stock-panel__title"><i class="ti ti-chart-line"></i> Biểu đồ P/B</h2></div>' +
        lineChartSvg(val.pb, val.labels, 'var(--ix-info)', 'Biểu đồ P/B ' + ticker);
    }

    return (
      '<section class="ifx-stock-panel">' +
        '<div class="ifx-stock-news-head"><h1>Thông tin công ty · ' + esc(info.name || ticker) + '</h1></div>' +
        '<table class="ix-table"><tbody>' + rows + '</tbody></table>' +
        charts +
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
    var sumPe = 0, nPe = 0, sumPb = 0, nPb = 0;
    tickers.forEach(function (tk) {
      var info = mk() ? mk().getStockInfo(tk) : null;
      var stock = mk() ? mk().getStock(tk) : null;
      var chg = stock ? stock.change_pct : null;
      var pe = info ? info.pe : null;
      var pb = info ? info.pb : null;
      if (pe != null) { sumPe += pe; nPe++; }
      if (pb != null) { sumPb += pb; nPb++; }
      rows +=
        '<tr>' +
          '<td><a class="ix-chip ix-chip-sm" href="' + memberHref(tk) + '">' + esc(tk) + '</a></td>' +
          '<td>' + esc(info ? info.name : (stock ? stock.name : '')) + '</td>' +
          pctCell(chg) +
          '<td>' + (pe != null ? pe : '—') + '</td>' +
          '<td>' + (pb != null ? pb : '—') + '</td>' +
        '</tr>';
    });
    var avgPe = nPe ? Math.round((sumPe / nPe) * 10) / 10 : null;
    var avgPb = nPb ? Math.round((sumPb / nPb) * 100) / 100 : null;

    return (
      '<section class="ifx-stock-panel">' +
        '<div class="ifx-stock-news-head">' +
          '<h1>Thông tin · ' + esc(detail.name) + '</h1>' +
          '<p>' + detail.member_count + ' mã · Hiệu suất nhóm ' + fmtPct(detail.change_pct) +
            (avgPe != null ? ' · P/E TB ' + avgPe : '') +
            (avgPb != null ? ' · P/B TB ' + avgPb : '') + '</p>' +
        '</div>' +
        '<table class="ix-table"><thead><tr>' +
          '<th>Mã</th><th>Tên</th><th>%±</th><th>P/E</th><th>P/B</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '</section>'
    );
  }

  /* ── Panel Lịch sự kiện (chỉ CP) ── */
  function eventsPanel(ticker) {
    var events = mk() ? mk().getStockEvents(ticker) : [];
    var body;
    if (!events.length) {
      body = '<div class="ifx-stock-empty">Chưa có lịch sự kiện cho <strong>' + esc(ticker) + '</strong>.</div>';
    } else {
      var rows = events.map(function (ev) {
        var chipCls = ev.upcoming ? 'ix-chip ix-chip-sm ix-chip-primary' : 'ix-chip ix-chip-sm';
        return '<tr>' +
          '<td>' + esc(ev.date_label) + '</td>' +
          '<td><span class="' + chipCls + '">' + esc(ev.type_label) + '</span></td>' +
          '<td>' + esc(ev.title) + (ev.detail ? ' <span style="color:var(--ix-text-muted)">· ' + esc(ev.detail) + '</span>' : '') + '</td>' +
        '</tr>';
      }).join('');
      body = '<table class="ix-table"><thead><tr><th>Ngày</th><th>Sự kiện</th><th>Nội dung</th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
    return (
      '<section class="ifx-stock-panel">' +
        '<div class="ifx-stock-news-head"><h1>Lịch sự kiện · ' + esc(ticker) + '</h1></div>' +
        body +
      '</section>'
    );
  }

  /* ── Render toàn bộ cột giữa ── */
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

  /**
   * ctx: {
   *   kind: 'stock'|'sector'|'family'|'story',
   *   ticker,               // khi kind==='stock'
   *   detail,               // group detail khi kind!=='stock'
   *   postsSectionHtml,     // Bài viết (chuyên gia) — dựng sẵn ở caller
   *   newsSectionHtml,      // Tin tức — dựng sẵn ở caller
   *   commentsSectionHtml,  // Bình luận (panel chat) — dựng sẵn ở caller
   *   commentCount          // số bình luận hiển thị trên tab
   * }
   */
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
    var mount = col.querySelector('[data-ec-daily-feed]');
    if (!mount || !global.IfluxDailyFeed || !ctx.feedFilter) return;
    global.IfluxDailyFeed.mount(mount, {
      filter: ctx.feedFilter,
      storyBase: ctx.storyBase || '../community/',
      expertTitle: 'Phân tích của chuyên gia'
    });
  }

  function mount(root, ctx) {
    ctx = ctx || {};
    var col = root.querySelector('.ifx-stock-col--center');
    if (!col) return;

    mountDailyFeed(col, ctx);

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
