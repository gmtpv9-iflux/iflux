/* Widget content renderers — map registry type → DOM */
(function (global) {
  'use strict';

  function snap() {
    return global.IfluxMockMarket ? IfluxMockMarket.getSnapshot() : null;
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  /** Seed local mock (community posts + stock comments) for Widget Library preview. */
  function ensureCommunityPreviewDemo(config) {
    if (!(config && config.previewDemo)) return;
    if (global.IfluxCommunityStore && IfluxCommunityStore.getPosts) {
      try { IfluxCommunityStore.getPosts(); } catch (e) { /* ignore */ }
    }
    if (!global.IfluxStockStore || !IfluxStockStore.getComments) return;
    var tickers = ['HPG', 'FPT', 'VCB', 'VHM', 'SSI', 'MWG', 'STB', 'VIC'];
    if (global.IfluxMockMarket && IfluxMockMarket.getSnapshot) {
      var snap = IfluxMockMarket.getSnapshot();
      var stocks = snap && snap.entities && snap.entities.stocks ? Object.keys(snap.entities.stocks) : [];
      if (stocks.length) tickers = stocks.slice(0, 8);
    }
    tickers.forEach(function (tk) {
      try { IfluxStockStore.getComments(tk); } catch (e) { /* ignore */ }
    });
  }

  function stockRow(s, href) {
    if (global.IfluxWatchlistUI) {
      return IfluxWatchlistUI.stockRowHtml(s, { href: href });
    }
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.renderStockRow(s, { href: href });
    }
    var chg = s.change_pct;
    return (
      '<a class="ifx-stock-row ' + dirClass(chg) + '" href="' + href + '" data-ticker="' + s.ticker + '">' +
        '<span class="ifx-stock-row__ticker">' + s.ticker + '</span>' +
        '<span class="ifx-stock-row__name">' + (s.name || '') + '</span>' +
        '<span class="ifx-stock-row__price">' + (s.price != null ? s.price : '—') + '</span>' +
        '<span class="ifx-stock-row__chg">' + fmtPct(chg) + '</span>' +
        '<span class="ifx-stock-row__vol">' + (s.volume || '—') + '</span>' +
      '</a>'
    );
  }

  function stockHref(ticker) {
    if (global.IfluxSeoUrl) return IfluxSeoUrl.stockHref(ticker);
    return '/co-phieu/' + encodeURIComponent(ticker);
  }

  function rangeTabsHtml(activeDays) {
    if (global.IfluxBlockTemplates) {
      return IfluxBlockTemplates.rangeTabsHtml(activeDays);
    }
    var ranges = [
      { days: 7, label: '1 tuần' },
      { days: 30, label: '1 tháng' },
      { days: 90, label: '3 tháng' },
      { days: 180, label: '6 tháng' }
    ];
    return ranges.map(function (r) {
      return '<button type="button" class="ix-tab' + (activeDays === r.days ? ' active' : '') +
        '" data-days="' + r.days + '">' + r.label + '</button>';
    }).join('');
  }

  function renderTop10Widget(el, entityType, config) {
    config = config || {};
    var rangeKey = (config && config.rangeKey) || 7;
    var title = config.title || 'Top 10 hiệu suất mạnh nhất';
    var description = config.withHead
      ? (config.description || '')
      : ((global.Top10MarketBlock && Top10MarketBlock.SUBTITLES)
        ? Top10MarketBlock.SUBTITLES[entityType] : '');
    var headHtml = config.withHead
      ? (global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead
        ? IfluxBlockTemplates.renderWgtHead(title, description)
        : ('<div class="ifx-widget__header"><h3>' + title + '</h3>' +
          (description ? '<p class="ifx-widget__subtitle">' + description + '</p>' : '') +
          '</div>'))
      : '';

    el.innerHTML =
      '<div class="ifx-top10-wgt" data-ifx-top10-wgt data-days="' + rangeKey + '">' +
        headHtml +
        '<div class="ix-tabs ifx-top10-wgt__range" data-ix-top10-range>' + rangeTabsHtml(7) + '</div>' +
        '<div class="ix-top10-market" data-ix-top10-market data-days="7"></div>' +
      '</div>';

    if (global.Top10MarketBlock) {
      Top10MarketBlock.initWidget(el.querySelector('[data-ifx-top10-wgt]'), entityType);
    }
  }

  var renderers = {
    'WGT-MKT-001': function (el, config) {
      if (global.IfluxCommunityMarketOverview) {
        IfluxCommunityMarketOverview.mount(el, Object.assign({
          sidebar: true,
          includeBreadth: false
        }, config || {}));
        return;
      }
      el.innerHTML = '<div class="ifx-wl-empty">Đang tải dữ liệu thị trường…</div>';
    },

    'WGT-MKT-002': function (el, config) {
      if (global.IfluxBreadthBlock) {
        IfluxBreadthBlock.mount(el, config || {});
        return;
      }
      var data = snap();
      if (!data) return;
      var m = data.entities.market;
      var up = m.breadth_up || 0;
      var down = m.breadth_down || 0;
      var total = up + down || 1;
      var upPct = Math.round((up / total) * 100);
      el.innerHTML =
        '<div class="ifx-breadth-visual">' +
          '<div class="ifx-breadth-stat is-up"><div class="ifx-breadth-stat__num">' + up + '</div><div class="ifx-breadth-stat__label">Mã tăng</div></div>' +
          '<div class="ifx-breadth-stat is-down"><div class="ifx-breadth-stat__num">' + down + '</div><div class="ifx-breadth-stat__label">Mã giảm</div></div>' +
        '</div>' +
        '<div class="ifx-breadth-ratio" title="Tỷ lệ tăng ' + upPct + '%">' +
          '<div class="ifx-breadth-ratio__up" style="width:' + upPct + '%"></div>' +
          '<div class="ifx-breadth-ratio__down" style="width:' + (100 - upPct) + '%"></div>' +
        '</div>';
    },

    'WGT-WAT-001': function (el, config) {
      config = config || {};
      if (!global.IfluxWatchlistBlock) {
        el.innerHTML = '<div class="ifx-wl-empty">Watchlist chưa sẵn sàng</div>';
        return;
      }
      if (config.withHead) {
        var title = config.title || 'Watchlist';
        var description = config.description || 'Danh sách mã do user chủ động theo dõi — không qua công thức hệ thống.';
        var headHtml = global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead
          ? IfluxBlockTemplates.renderWgtHead(title, description)
          : ('<div class="ifx-widget__header"><h3>' + title + '</h3>' +
            (description ? '<p class="ifx-widget__subtitle">' + description + '</p>' : '') +
            '</div>');
        el.innerHTML =
          '<div class="ifx-wgt-block ifx-wl-wgt">' +
            headHtml +
            '<div class="ifx-wl-block" data-ifx-wl-block></div>' +
          '</div>';
      } else {
        el.innerHTML = '<div class="ifx-wl-block" data-ifx-wl-block></div>';
      }
      IfluxWatchlistBlock.mount(el.querySelector('[data-ifx-wl-block]'));
      if (global.IfluxWatchlistUI) IfluxWatchlistUI.bindHearts(el);
    },

    /*
     * TMP-RANK-PERF runtime producer.
     * Widget quyết định dữ liệu/sắp xếp; Template chỉ render nhãn + chỉ số theo vị trí.
     */
    'WGT-MKT-RANK-PERF': function (el, config) {
      var data = snap();
      if (!data) return;
      var mode = (config && config.mode) || 'gainers';
      var ids = data.movers[mode] || [];
      var items = ids.map(function (id) {
        var stock = data.entities.stocks[id];
        return stock ? { name: stock.ticker, perf: Number(stock.change_pct) || 0 } : null;
      }).filter(Boolean);
      if (!global.IfluxBlockTemplates || !IfluxBlockTemplates.renderRankBarList) {
        el.innerHTML = '<div class="ifx-mkt-empty">Template xếp hạng chưa sẵn sàng</div>';
        return;
      }
      el.innerHTML = IfluxBlockTemplates.renderRankBarList({
        items: items,
        headLabel: 'Mã cổ phiếu',
        headValue: '% thay đổi',
        emptyMsg: 'Chưa có dữ liệu biến động'
      });
    },

    'WGT-SEC-001': function (el) {
      var data = snap();
      if (!data) return;
      var items = Object.keys(data.entities.sectors).map(function (k) { return data.entities.sectors[k]; });
      items.sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); });
      el.innerHTML = '<div class="ifx-sector-grid">' + items.slice(0, 4).map(function (sec) {
        return (
          '<a class="ifx-sector-card" href="' + (global.IfluxSeoUrl ? IfluxSeoUrl.sectorHref(sec.id) : '/nganh/' + encodeURIComponent(sec.id)) + '">' +
            '<div class="ifx-sector-card__head"><span class="ifx-sector-card__name">' + sec.name + '</span>' +
            '<span class="ifx-sector-card__rank">#' + sec.rank + '</span></div>' +
            '<div class="ifx-sector-card__metrics">' +
              '<div class="ifx-sector-card__metric"><span>PG</span><strong class="' + dirClass(sec.pg) + '">' + fmtPct(sec.pg) + '</strong></div>' +
            '</div></a>'
        );
      }).join('') + '</div>';
    },

    'WGT-FLW-001': function (el) {
      var data = snap();
      if (!data) return;
      var flowMap = data.entities.flow;
      var order = ['foreign', 'institutional', 'proprietary', 'retail'];
      el.innerHTML = order.filter(function (k) { return flowMap[k]; }).map(function (key) {
        var f = flowMap[key];
        var netUp = f.net_label && f.net_label.indexOf('+') === 0;
        return (
          '<div class="ifx-flow-panel">' +
            '<div class="ifx-flow-panel__head"><span class="ifx-flow-panel__label">' + f.label + '</span>' +
            '<span class="ifx-flow-panel__net ' + (netUp ? 'is-up' : 'is-down') + '">' + f.net_label + '</span></div>' +
            '<div class="ifx-flow-bar"><div class="ifx-flow-bar__buy" style="width:' + f.buy_pct + '%"></div>' +
            '<div class="ifx-flow-bar__sell" style="width:' + f.sell_pct + '%"></div></div></div>'
        );
      }).join('');
    },

    'WGT-FLW-MKT-SIDE': function (el, config) {
      if (global.IfluxFlowMarketSidebar) {
        IfluxFlowMarketSidebar.mount(el, config || {});
        return;
      }
      el.innerHTML = '<div class="ifx-wl-empty">Đang tải ngữ cảnh thị trường…</div>';
    },

    'WGT-FLW-NETTOP': function (el, config) {
      if (!global.IfluxFlowNetTop) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải thống kê mua/bán ròng…</div>';
        return;
      }
      IfluxFlowNetTop.mount(el, Object.assign({
        subject: 'retail',
        scope: 'stock',
        withHead: true,
        withSubjectTabs: true
      }, config || {}));
    },

    'WGT-FLW-SCORE': function (el, config) {
      if (!global.IfluxFlowScoreMock || !global.IfluxFlowScoreTop) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải block dòng tiền…</div>';
        return;
      }
      config = config || {};
      var blocks = [];
      var i;

      if (config.duo && Array.isArray(config.blockIds) && config.blockIds.length) {
        for (i = 0; i < config.blockIds.length; i++) {
          var duoBlock = IfluxFlowScoreMock.getBlock(config.blockIds[i]);
          if (duoBlock) blocks.push(duoBlock);
        }
      } else if (config.blockId) {
        var single = IfluxFlowScoreMock.getBlock(config.blockId);
        if (single) blocks.push(single);
      }

      if (!blocks.length) {
        el.innerHTML = '<div class="ifx-wl-empty">Không tìm thấy block</div>';
        return;
      }

      if (config.title || config.description) {
        blocks = blocks.map(function (b) {
          var next = Object.assign({}, b);
          if (config.title) next.title = config.title;
          if (config.description) next.description = config.description;
          return next;
        });
      }
      IfluxFlowScoreTop.mount(el, blocks, { mergePairs: config.duo !== false });
    },

    'WGT-MKT-HEAT': function (el, config) {
      config = config || {};
      var source = config.source || 'sector';
      if (!global.IfluxMarketHeatmap) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải heatmap…</div>';
        return;
      }
      IfluxMarketHeatmap.mount(el, source, config);
    },

    'WGT-MKT-LIQ': function (el, config) {
      config = config || {};
      var metric = config.metric || 'volume';
      if (!global.IfluxMarketLiquidity) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải thanh khoản…</div>';
        return;
      }
      IfluxMarketLiquidity.mountBlock(el, metric, config);
    },

    'WGT-COM-TREND': function (el, config) {
      if (!global.IfluxCommunityTrending) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải xu hướng…</div>';
        return;
      }
      ensureCommunityPreviewDemo(config);
      IfluxCommunityTrending.mountInto(el, config || {});
    },

    'WGT-COM-ACTIVE': function (el, config) {
      if (!global.IfluxCommunityActiveMembers) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải thành viên…</div>';
        return;
      }
      ensureCommunityPreviewDemo(config);
      IfluxCommunityActiveMembers.mount(el);
    },

    'WGT-COM-EXPERTS': function (el, config) {
      if (!global.IfluxCommunityFeaturedExperts) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải chuyên gia…</div>';
        return;
      }
      ensureCommunityPreviewDemo(config);
      IfluxCommunityFeaturedExperts.mount(el);
    },

    'WGT-COM-TOPWL': function (el, config) {
      if (!global.IfluxCommunityTopWatchlist) {
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải Top Watchlist…</div>';
        return;
      }
      IfluxCommunityTopWatchlist.mount(el, config || {});
    },

    'WGT-TOP-001': function (el, config) { renderTop10Widget(el, 'sector', config); },
    'WGT-TOP-002': function (el, config) { renderTop10Widget(el, 'ecosystem', config); },
    'WGT-TOP-003': function (el, config) { renderTop10Widget(el, 'chu-de', config); },

    'WGT-PRF-001': function (el) {
      if (global.IfluxProfileSidebarWidgets) {
        IfluxProfileSidebarWidgets.bindProfileWidget(el);
        return;
      }
      el.innerHTML = '<div class="ix-card"><div class="ix-card-body" style="padding:16px;font-size:13px;color:var(--ix-text-muted)">Đang tải thông tin hồ sơ…</div></div>';
    },
    'WGT-PRF-002': function (el) {
      if (global.IfluxProfileSidebarWidgets) {
        IfluxProfileSidebarWidgets.bindPlanWidget(el);
        return;
      }
      el.innerHTML = '<div class="ix-card"><div class="ix-card-body" style="padding:16px;font-size:13px;color:var(--ix-text-muted)">Đang tải gói cước…</div></div>';
    }
  };

  function render(type, el, config) {
    var meta = global.IfluxWidgetRegistry && IfluxWidgetRegistry.byType(type);
    var renderType = (meta && meta.renderAs) || type;
    var cfg = Object.assign({}, meta && meta.defaultConfig || {}, config || {});
    if (global.WidgetLibraryCatalog && WidgetLibraryCatalog.resolveWidgetCopy) {
      var copy = WidgetLibraryCatalog.resolveWidgetCopy(type);
      if (cfg.title == null) cfg.title = copy.title;
      if (cfg.description == null) cfg.description = copy.description;
    }
    if (renderType === 'WGT-MKT-LIQ') {
      cfg.widgetId = type;
      if (cfg.withHead == null) cfg.withHead = true;
    }
    var fn = renderers[renderType];
    if (fn && el) fn(el, cfg);
  }

  global.IfluxWidgetRenderers = { render: render };
})(window);
