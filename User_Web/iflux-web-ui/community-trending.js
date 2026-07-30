/* Cộng đồng — CP treemap + chủ đề nổi bật */
(function (global) {
  'use strict';

  var GUTTER = 2;
  var activeStoryPeriod = 'week';

  function st() { return global.IfluxCommunityStore; }
  function mk() { return global.IfluxMockMarket; }
  function ui() { return global.IfluxCommunityUI; }
  function heart() { return global.IfluxHeartAction; }
  function treemap() { return global.IfluxSquarifiedTreemap; }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function fmtInt(n) {
    n = Number(n) || 0;
    return n.toLocaleString('vi-VN');
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scoreChipHtml(score) {
    return '<span class="ix-chip ix-chip-sm ix-chip-secondary">' + fmtInt(score) + '</span>';
  }

  function isRemainder(item) {
    return treemap() && treemap().isHeatmapRemainder
      ? treemap().isHeatmapRemainder(item)
      : !!(item && item.isRemainder);
  }

  var HEATMAP_LIMIT = 10;

  /* WGT-COM-001 — CHỈ cổ phiếu cộng đồng đang quan tâm (trending), KHÔNG phải toàn thị trường.
     Diện tích ô = mức độ quan tâm (score); màu = hiệu suất phiên của mã. Top 10. */
  function buildHeatmapItems() {
    var m = mk();
    var store = st();
    var items = [];

    var trending = (store && store.getTrendingTickers) ? (store.getTrendingTickers(HEATMAP_LIMIT) || []) : [];
    if (trending.length) {
      items = trending.map(function (t) {
        var tk = String(t.ticker).toUpperCase();
        var stock = m && m.getStock ? m.getStock(tk) : null;
        var interest = Math.max(t.score || t.comments || 1, 1);
        return {
          ticker: tk,
          marketCap: interest,
          weight: interest,
          stock: stock,
          perf: stock ? stock.change_pct : (t.perf != null ? t.perf : 0)
        };
      });
    } else if (m && m.getHeatmapGroups) {
      var groups = m.getHeatmapGroups('stock') || [];
      items = groups.map(function (g) {
        return {
          ticker: String(g.id).toUpperCase(),
          marketCap: Math.max(g.weight, 1),
          weight: Math.max(g.weight, 1),
          stock: m.getStock ? m.getStock(g.id) : null,
          perf: g.perf
        };
      });
    }

    return items.slice(0, HEATMAP_LIMIT);
  }

  function tierFor(w, h) {
    var area = w * h;
    if (area < 1200 || w < 36 || h < 28) return 'tiny';
    if (w < 56 || h < 40) return 'small';
    if (area >= 12000 && w >= 100 && h >= 72) return 'large';
    if (area >= 4000) return 'medium';
    return 'small';
  }

  function cellContent(item, tier) {
    var stock = item.stock;
    var chg = stock && stock.change_pct;
    var html = '<span class="ifx-cap-tile__tk">' + esc(item.ticker) + '</span>';
    if (tier !== 'tiny') {
      html += '<span class="ifx-cap-tile__chg">' + fmtPct(chg) + '</span>';
    }
    return html;
  }

  function insetRect(r, gutter) {
    var g = gutter || 0;
    return {
      x: r.x + g / 2,
      y: r.y + g / 2,
      width: Math.max(0, r.width - g),
      height: Math.max(0, r.height - g),
      item: r.item
    };
  }

  function paintTreemap(canvas, items) {
    if (!canvas || !treemap()) return;

    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (w < 40 || h < 40) return;

    var layouts = treemap().layout(items, w, h).map(function (r) {
      return insetRect(r, GUTTER);
    });

    var m = mk();
    var heartFn = heart() && heart().heartButtonHtml;
    var byTk = {};
    canvas.querySelectorAll('[data-ifx-cap-tile]').forEach(function (el) {
      byTk[el.getAttribute('data-ifx-cap-tile')] = el;
    });

    layouts.forEach(function (rect) {
      var item = rect.item;
      var remainder = isRemainder(item);
      var tileKey = remainder ? item.id : item.ticker;
      var tier = tierFor(rect.width, rect.height);
      var area = rect.width * rect.height;
      var fontSize = Math.max(9, Math.min(20, Math.sqrt(area) * 0.085));

      var el = byTk[tileKey];
      if (!el) {
        el = document.createElement('div');
        el.className = 'ifx-cap-tile';
        el.setAttribute('data-ifx-cap-tile', tileKey);
        if (remainder) {
          el.innerHTML = '<span class="ifx-cap-tile__remainder is-remainder" aria-hidden="true">...</span>';
        } else {
          var state = m && m.getStockPriceState ? m.getStockPriceState(tileKey) : 'ref';
          var heart = heartFn ? heartFn(tileKey) : '';
          el.innerHTML =
            '<a class="ifx-cap-tile__link is-' + state + '" href="' + (global.IfluxHref
              ? IfluxHref.forCanonical(global.IfluxSeoUrl ? IfluxSeoUrl.stockHref(tileKey) : '/co-phieu/' + encodeURIComponent(tileKey))
              : (global.IfluxSeoUrl ? IfluxSeoUrl.stockHref(tileKey) : '/co-phieu/' + encodeURIComponent(tileKey))) + '"></a>' +
            (heart ? '<div class="ifx-cap-tile__heart">' + heart + '</div>' : '');
        }
        canvas.appendChild(el);
      } else {
        delete byTk[tileKey];
      }

      el.className = 'ifx-cap-tile ifx-cap-tile--' + tier + (remainder ? ' ifx-cap-tile--remainder' : '');
      el.style.left = rect.x + 'px';
      el.style.top = rect.y + 'px';
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
      el.style.fontSize = fontSize + 'px';

      if (remainder) return;

      var state = m && m.getStockPriceState ? m.getStockPriceState(tileKey) : 'ref';
      var title = tileKey + ' · ' + fmtPct(item.stock && item.stock.change_pct);
      var link = el.querySelector('.ifx-cap-tile__link');
      if (link) {
        link.className = 'ifx-cap-tile__link is-' + state;
        link.title = title;
        link.innerHTML = cellContent(item, tier);
      }
    });

    Object.keys(byTk).forEach(function (tk) {
      var orphan = byTk[tk];
      if (orphan.parentNode) orphan.parentNode.removeChild(orphan);
    });

    if (heart() && heart().refresh) heart().refresh();
  }

  /**
   * Chiều cao canvas treemap khi layout đôi (stocks + stories cùng hàng).
   * Host Widget Published đơn lẻ: không ghi đè — để CSS / layout App Shell lo (giống Widget khác).
   */
  function syncCanvasHeight(row) {
    var storiesPanel = row.querySelector('[data-ifx-trending-stories]');
    var stocksPanel = row.querySelector('[data-ifx-trending-stocks]');
    var canvas = row.querySelector('[data-ifx-cap-treemap]');
    var storyList = row.querySelector('.ifx-com-story-rank-list');
    if (!canvas || !storiesPanel || !stocksPanel) return canvas ? canvas.clientHeight || 0 : 0;

    var title = stocksPanel.querySelector('.ifx-com-trending-panel__head h3') ||
      stocksPanel.querySelector('.ifx-widget__header h3');
    var hint = stocksPanel.querySelector('.ifx-com-ticker-heat__hint');
    var titleH = title ? title.offsetHeight + 14 : 14;
    var hintH = hint ? hint.offsetHeight + 10 : 0;
    var listH = storyList ? storyList.offsetHeight : 0;
    var target = Math.max(200, listH > 0 ? listH : storiesPanel.offsetHeight - titleH - hintH);

    canvas.style.height = target + 'px';
    canvas.style.minHeight = target + 'px';
    return target;
  }

  function mountCapTreemap(row) {
    if (!row || !treemap()) return;

    var canvas = row.querySelector('[data-ifx-cap-treemap]');
    if (!canvas) return;

    var items = buildHeatmapItems();
    if (!items.length) {
      canvas.outerHTML = '<div class="ifx-com-trending-empty">Chưa đủ dữ liệu CP.</div>';
      return;
    }

    /* Cùng pattern preview heatmap / Widget host: đợi container có bề rộng thật rồi mới layout. */
    function paint(tries) {
      tries = tries || 0;
      syncCanvasHeight(row);
      var el = row.querySelector('[data-ifx-cap-treemap]');
      if (!el || !el.isConnected) return;
      var w = el.clientWidth;
      var h = el.clientHeight;
      if ((w < 40 || h < 40) && tries < 40) {
        setTimeout(function () { paint(tries + 1); }, 80);
        return;
      }
      if (w < 40 || h < 40) return;
      paintTreemap(el, items);
    }

    paint(0);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { paint(0); });
    });

    if (typeof ResizeObserver !== 'undefined') {
      if (row.__ifxCapRo) row.__ifxCapRo.disconnect();
      var ro = new ResizeObserver(function () { paint(0); });
      ro.observe(row);
      var stories = row.querySelector('[data-ifx-trending-stories]');
      if (stories) ro.observe(stories);
      row.__ifxCapRo = ro;
    } else {
      global.addEventListener('resize', function () { paint(0); });
    }
  }

  function storyEntityHref(it) {
    if (it && it.href) return global.IfluxHref ? IfluxHref.forCanonical(it.href) : it.href;
    var id = it.id || it.name;
    var c = (global.IfluxSeoUrl && IfluxSeoUrl.storyEntityHref)
      ? IfluxSeoUrl.storyEntityHref(id)
      : '/chu-de/' + encodeURIComponent(id);
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function storyWidgetMeta() {
    var fallback = {
      title: 'Chủ đề tích cực hàng đầu',
      description: 'Top N Topic/Story theo điểm Interest trong cửa sổ Ngày|Tuần|Tháng.',
      limit: 10
    };
    var P = global.L4RuntimeReader;
    if (!P) return fallback;
    var copy = P.resolveWidgetCopy ? P.resolveWidgetCopy('WGT-COM-CHUDE-TOP') : null;
    var w = P.getWidget ? P.getWidget('WGT-COM-CHUDE-TOP') : null;
    var limit = fallback.limit;
    if (w && w.outputs) {
      for (var i = 0; i < w.outputs.length; i++) {
        if (w.outputs[i].sym === 'top_n' && w.outputs[i].demo) {
          var n = parseInt(String(w.outputs[i].demo).split('|')[0].trim(), 10);
          if (n > 0) limit = n;
          break;
        }
      }
    }
    return {
      title: (copy && copy.title) || (w && w.title) || fallback.title,
      description: (copy && copy.description) || (w && w.description) || fallback.description,
      limit: limit
    };
  }

  function stockWidgetMeta() {
    var fallback = {
      title: 'Cổ phiếu được quan tâm hàng đầu',
      description: 'Diện tích = mức độ quan tâm của cộng đồng · màu = hiệu suất phiên.'
    };
    var P = global.L4RuntimeReader;
    if (!P) return fallback;
    var copy = P.resolveWidgetCopy ? P.resolveWidgetCopy('WGT-COM-001') : null;
    var w = P.getWidget ? P.getWidget('WGT-COM-001') : null;
    return {
      title: (copy && copy.title) || (w && w.title) || fallback.title,
      description: (copy && copy.description) || (w && w.description) || fallback.description
    };
  }

  function storiesListHtml(items) {
    if (!items.length) {
      return '<div class="ifx-com-trending-empty">Chưa có chủ đề nổi bật.</div>';
    }
    var storyHeartFn = heart() && heart().storyHeartButtonHtml;
    return items.map(function (it, i) {
      var rank = i + 1;
      var heart = storyHeartFn ? storyHeartFn(it.id) : '';
      var href = storyEntityHref(it);
      return (
        '<a class="ix-list-item ifx-com-story-rank ifx-com-story-rank--link" href="' + esc(href) + '">' +
          '<div class="ifx-com-story-rank__num" aria-label="Top ' + rank + '">' + rank + '</div>' +
          '<div class="ifx-com-story-rank__body">' +
            '<div class="ifx-com-story-rank__title-row">' +
              '<span class="ifx-com-story-rank__title">' + esc(it.name) + '</span>' +
              scoreChipHtml(it.score) +
            '</div>' +
            '<div class="ifx-com-story-rank__sub">' +
              fmtInt(it.views) + ' xem · ' +
              fmtInt(it.comments) + ' bình luận · ' +
              fmtInt(it.shares) + ' chia sẻ · ' +
              fmtInt(it.favorites) + ' yêu thích' +
            '</div>' +
          '</div>' +
          (heart ? '<div class="ifx-com-story-rank__heart" data-ifx-stop-link>' + heart + '</div>' : '') +
        '</a>'
      );
    }).join('');
  }

  function periodTabsHtml(periodKey) {
    var periods = (st() && st().STORY_PERIODS) || {
      day: { label: 'Ngày' },
      week: { label: 'Tuần' },
      month: { label: 'Tháng' }
    };
    return Object.keys(periods).map(function (key) {
      var active = key === periodKey ? ' is-active' : '';
      return '<button type="button" class="ix-segment' + active + '" role="tab" aria-selected="' +
        (key === periodKey ? 'true' : 'false') + '" data-ifx-story-period="' + key + '">' +
        periods[key].label + '</button>';
    }).join('');
  }

  /** Head Widget — cùng TPL-WGT-HEAD (ifx-wgt-block) cho mọi panel Cộng đồng. */
  function wgtHeadHtml(meta) {
    var T = global.IfluxBlockTemplates;
    if (T && T.renderWgtHead) return T.renderWgtHead(meta.title || '', meta.description || '');
    var html = '<div class="ifx-widget__header"><h3>' + esc(meta.title || '') + '</h3>';
    if (meta.description) html += '<p class="ifx-widget__subtitle">' + esc(meta.description) + '</p>';
    html += '</div>';
    return html;
  }

  function stocksPanelHtml() {
    var meta = stockWidgetMeta();
    return (
      '<div class="ifx-wgt-block ifx-com-trending-panel ifx-com-trending-panel--stocks" data-ifx-trending-stocks data-ifx-wgt="WGT-COM-001">' +
        wgtHeadHtml(meta) +
        '<div class="ifx-cap-treemap" data-ifx-cap-treemap role="img" aria-label="Treemap cổ phiếu quan tâm"></div>' +
      '</div>'
    );
  }

  function storiesPanelHtml(stories, periodKey, meta) {
    meta = meta || storyWidgetMeta();
    return (
      '<div class="ifx-wgt-block ifx-com-trending-panel ifx-com-trending-panel--stories" data-ifx-trending-stories data-ifx-wgt="WGT-COM-CHUDE-TOP">' +
        wgtHeadHtml(meta) +
        '<div class="ix-segmented" role="tablist" aria-label="Khung thời gian">' + periodTabsHtml(periodKey) + '</div>' +
        '<div class="ifx-com-story-rank-list">' + storiesListHtml(stories) + '</div>' +
      '</div>'
    );
  }

  function renderHtml(opts) {
    opts = opts || {};
    if (!st()) {
      return '<div class="ifx-wl-empty">Thiếu community-store.js</div>';
    }
    var meta = storyWidgetMeta();
    var periodKey = opts.period || activeStoryPeriod || 'week';
    var limit = opts.limit != null ? opts.limit : meta.limit;
    var stories = st().getTrendingStories(limit, periodKey);
    /* stocksOnly / storyOnly: chỉ panel — parent (community-page) xếp 2 cột. */
    if (opts.storyOnly) return storiesPanelHtml(stories, periodKey, meta);
    if (opts.stocksOnly) return stocksPanelHtml();
    return (
      '<section class="ifx-com-trending-row" data-ifx-trending-row aria-label="Xu hướng cộng đồng">' +
        stocksPanelHtml() +
        storiesPanelHtml(stories, periodKey, meta) +
      '</section>'
    );
  }

  function bindStoryPeriod(container, opts) {
    container.querySelectorAll('[data-ifx-story-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeStoryPeriod = btn.getAttribute('data-ifx-story-period') || 'week';
        mountInto(container, Object.assign({}, opts || {}, { period: activeStoryPeriod }));
      });
    });
  }

  function mountInto(container, opts) {
    if (!container) return;
    opts = opts || {};
    if (opts.period) activeStoryPeriod = opts.period;
    container._ifxStoryTopOpts = opts;
    container.innerHTML = renderHtml(opts);
    var scope = container.querySelector('[data-ifx-trending-row]') || container;
    if (!opts.storyOnly) mountCapTreemap(scope);
    if (heart() && heart().bind) heart().bind(container);
    else if (heart() && heart().refresh) heart().refresh();
    container.querySelectorAll('[data-ifx-stop-link]').forEach(function (wrap) {
      wrap.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
    });
    if (opts.storyOnly || !opts.stocksOnly) bindStoryPeriod(container, opts);

    /* P1: hydrate Interest từ Content Engine API rồi vẽ lại Story Top */
    if ((opts.storyOnly || !opts.stocksOnly) && st() && st().hydrateTrendingStoriesFromApi && !opts._skipApiHydrate) {
      var meta = storyWidgetMeta();
      var periodKey = opts.period || activeStoryPeriod || 'week';
      var limit = opts.limit != null ? opts.limit : meta.limit;
      st().hydrateTrendingStoriesFromApi(periodKey, limit).then(function (rows) {
        if (!container.isConnected) return;
        if (!rows || !rows.length) return;
        mountInto(container, Object.assign({}, opts, { _skipApiHydrate: true, period: periodKey }));
      });
    }
  }

  function mount(root, opts) {
    if (!root) return;
    opts = opts || {};
    var el = root.matches('[data-ifx-com-trending-mount]')
      ? root
      : root.querySelector('[data-ifx-com-trending-mount]');
    if (!el) {
      el = root.matches('[data-ifx-com-story-top]')
        ? root
        : root.querySelector('[data-ifx-com-story-top]');
    }
    if (!el) return;
    mountInto(el, opts);
  }

  global.IfluxCommunityTrending = {
    renderHtml: renderHtml,
    mountInto: mountInto,
    mount: mount
  };
})(window);
