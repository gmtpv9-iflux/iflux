/* Widget content renderers — map registry type → DOM.
 * WP-4: bỏ phụ thuộc module mock thị trường. Nhóm/breadth/movers/sector/flow không có runtime authority (D1) → UNAVAILABLE.
 */
(function (global) {
  'use strict';

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
    if (global.IfluxMarketMaster && IfluxMarketMaster.getMasterStocks) {
      var master = IfluxMarketMaster.getMasterStocks();
      var stocks = (master || []).map(function (s) { return s.ticker; }).filter(Boolean);
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
    var c = global.IfluxSeoUrl ? IfluxSeoUrl.stockHref(ticker) : '/co-phieu/' + encodeURIComponent(ticker);
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
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
      el.innerHTML = '<div class="ifx-wl-empty">Đang tải dữ liệu thị trường…</div>';
    },

    'WGT-WAT-001': function (el, config) {
      config = config || {};
      if (!global.IfluxWatchlistBlock) {
        el.innerHTML = '<div class="ifx-wl-empty">Danh sách theo dõi chưa sẵn sàng</div>';
        return;
      }
      if (config.withHead) {
        var title = config.title || 'Theo dõi';
        if (title === 'Watchlist') title = 'Theo dõi';
        var description = config.description || 'Danh sách mã do user chủ động theo dõi — không qua công thức hệ thống.';
        if (/Watchlist/i.test(description) && !/theo dõi/i.test(description)) {
          description = 'Danh sách mã do user chủ động theo dõi — không qua công thức hệ thống.';
        }
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
      if (global.IfluxHeartAction) IfluxHeartAction.bind(el);
      if (global.IfluxAlertUI) IfluxAlertUI.bindAlerts(el);
    },

    /*
     * TMP-RANK-PERF runtime producer.
     * WP-4: xếp hạng tăng/giảm mạnh nhất (movers) KHÔNG có runtime authority (D1) → UNAVAILABLE.
     */
    'WGT-MKT-RANK-PERF': function (el) {
      if (!global.IfluxBlockTemplates || !IfluxBlockTemplates.renderRankBarList) {
        el.innerHTML = '<div class="ifx-mkt-empty">Chưa có dữ liệu biến động</div>';
        return;
      }
      el.innerHTML = IfluxBlockTemplates.renderRankBarList({
        items: [],
        headLabel: 'Mã cổ phiếu',
        headValue: '% thay đổi',
        emptyMsg: 'Chưa có dữ liệu biến động'
      });
    },

    /* WP-4: PG (hiệu suất) ngành KHÔNG có runtime authority (D1) → UNAVAILABLE. */
    'WGT-SEC-001': function (el) {
      el.innerHTML = '<div class="ifx-mkt-empty">Chưa có dữ liệu động lượng ngành</div>';
    },

    /* WP-4: dòng tiền thông minh (NN/Tự doanh/Cá nhân) KHÔNG có runtime authority (D1) → UNAVAILABLE. */
    'WGT-FLW-001': function (el) {
      el.innerHTML = '<div class="ifx-wl-empty">Chưa có dữ liệu dòng tiền</div>';
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
        el.innerHTML = '<div class="ifx-wl-empty">Đang tải Top theo dõi…</div>';
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
    if (global.L4RuntimeReader && L4RuntimeReader.resolveWidgetCopy) {
      var copy = L4RuntimeReader.resolveWidgetCopy(type);
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
