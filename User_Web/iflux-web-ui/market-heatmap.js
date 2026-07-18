/* Heatmap treemap — Ngành / Họ CP / Chủ đề */
(function (global) {
  'use strict';

  var GUTTER = 2;

  function mk() { return global.IfluxMockMarket; }
  function treemap() { return global.IfluxSquarifiedTreemap; }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function perfClass(p) {
    if (global.IfluxBlockTemplates) return IfluxBlockTemplates.perfDirection(p);
    if (p > 0.08) return 'up';
    if (p < -0.08) return 'down';
    return 'ref';
  }

  function tierFor(w, h) {
    var area = w * h;
    if (area < 900 || w < 32 || h < 24) return 'tiny';
    if (w < 48 || h < 32) return 'small';
    if (area >= 8000) return 'large';
    if (area >= 2500) return 'medium';
    return 'small';
  }

  function hrefFor(source, id) {
    if (global.IfluxSeoUrl) {
      if (source === 'stock') return IfluxSeoUrl.stockHref(id);
      if (source === 'sector') return IfluxSeoUrl.sectorHref(id);
      if (source === 'family') return IfluxSeoUrl.ecosystemHref(id);
      return IfluxSeoUrl.storyEntityHref(id);
    }
    if (source === 'stock') return '/co-phieu/' + encodeURIComponent(id);
    if (source === 'sector') return '/nganh/' + encodeURIComponent(id);
    if (source === 'family') return '/ho-co-phieu/' + encodeURIComponent(id);
    return '/chu-de/' + encodeURIComponent(id);
  }

  function isRemainder(item) {
    return treemap() && treemap().isHeatmapRemainder
      ? treemap().isHeatmapRemainder(item)
      : !!(item && item.isRemainder);
  }

  function paint(canvas, source) {
    if (!canvas || !treemap() || !mk()) return;
    var groups = mk().getHeatmapGroups(source);
    if (!groups.length) {
      canvas.innerHTML = '<div class="ifx-mkt-empty">Chưa có dữ liệu</div>';
      return;
    }

    /* getHeatmapGroups đã Top 10 theo GTGD — không gộp đuôi "..." */
    var items = groups.map(function (g) {
      return { id: g.id, name: g.name, perf: g.perf, weight: Math.max(g.weight, 1) };
    });

    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (w < 40 || h < 40) return;

    var layouts = treemap().layout(items, w, h).map(function (r) {
      return {
        x: r.x + GUTTER / 2,
        y: r.y + GUTTER / 2,
        width: Math.max(0, r.width - GUTTER),
        height: Math.max(0, r.height - GUTTER),
        item: r.item
      };
    });

    var byId = {};
    canvas.querySelectorAll('[data-ifx-heat-id]').forEach(function (el) {
      byId[el.getAttribute('data-ifx-heat-id')] = el;
    });

    layouts.forEach(function (rect) {
      var item = rect.item;
      var tier = tierFor(rect.width, rect.height);
      var remainder = isRemainder(item);
      var cls = remainder ? 'is-remainder' : 'is-' + perfClass(item.perf);
      var el = byId[item.id];
      if (!el) {
        el = document.createElement('div');
        el.className = 'ifx-mkt-heat-tile';
        el.setAttribute('data-ifx-heat-id', item.id);
        if (remainder) {
          el.innerHTML = '<span class="ifx-mkt-heat-tile__remainder ' + cls + '" aria-hidden="true">...</span>';
        } else {
          el.innerHTML = '<a class="ifx-mkt-heat-tile__link ' + cls + '" href="' + esc(hrefFor(source, item.id)) + '"></a>';
        }
        canvas.appendChild(el);
      } else {
        delete byId[item.id];
        if (remainder) {
          var rem = el.querySelector('.ifx-mkt-heat-tile__remainder');
          if (!rem) {
            el.innerHTML = '<span class="ifx-mkt-heat-tile__remainder ' + cls + '" aria-hidden="true">...</span>';
          } else {
            rem.className = 'ifx-mkt-heat-tile__remainder ' + cls;
          }
        } else {
          var link = el.querySelector('.ifx-mkt-heat-tile__link');
          if (!link) {
            el.innerHTML = '<a class="ifx-mkt-heat-tile__link ' + cls + '" href="' + esc(hrefFor(source, item.id)) + '"></a>';
            link = el.querySelector('.ifx-mkt-heat-tile__link');
          } else {
            link.className = 'ifx-mkt-heat-tile__link ' + cls;
          }
        }
      }

      el.className = 'ifx-mkt-heat-tile ifx-mkt-heat-tile--' + tier + (remainder ? ' ifx-mkt-heat-tile--remainder' : '');
      el.style.left = rect.x + 'px';
      el.style.top = rect.y + 'px';
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';

      if (remainder) return;

      var link = el.querySelector('.ifx-mkt-heat-tile__link');
      if (link) {
        link.href = hrefFor(source, item.id);
        link.title = item.name + ' · ' + fmtPct(item.perf);
        link.innerHTML = tier === 'tiny'
          ? '<span class="ifx-mkt-heat-tile__name">' + esc(item.name.split(' ')[0]) + '</span>'
          : '<span class="ifx-mkt-heat-tile__name">' + esc(item.name) + '</span>' +
            '<span class="ifx-mkt-heat-tile__perf">' + fmtPct(item.perf) + '</span>';
      }
    });

    Object.keys(byId).forEach(function (id) {
      var orphan = byId[id];
      if (orphan.parentNode) orphan.parentNode.removeChild(orphan);
    });
  }

  function resolveWidgetCopy(widgetId) {
    var cat = global.WidgetLibraryCatalog || global.PlatformLayersWidgets;
    if (widgetId && cat && typeof cat.resolveWidgetCopy === 'function') {
      var copy = cat.resolveWidgetCopy(widgetId);
      if (copy && copy.title) return copy;
    }
    var reg = global.IfluxWidgetRegistry;
    if (widgetId && reg && typeof reg.byType === 'function') {
      var w = reg.byType(widgetId);
      if (w && w.title) return { title: w.title, description: w.description || '' };
    }
    return null;
  }

  function mount(el, source, opts) {
    if (!el) return;
    opts = opts || {};
    if (source && typeof source === 'object') {
      opts = source;
      source = opts.source || 'sector';
    }
    if (source === 'story') source = 'chu-de';
    var fallbackTitles = {
      stock: 'Biểu đồ Cổ phiếu',
      sector: 'Biểu đồ Ngành',
      family: 'Biểu đồ Họ cổ phiếu',
      'chu-de': 'Biểu đồ Chủ đề',
      story: 'Biểu đồ Chủ đề'
    };
    var fallbackDescriptions = {
      stock: 'Top 10 mã có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      sector: 'Top 10 ngành có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      family: 'Top 10 họ cổ phiếu có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      'chu-de': 'Top 10 chủ đề có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.',
      story: 'Top 10 chủ đề có GTGD cao nhất · diện tích = GTGD · màu = hiệu suất phiên.'
    };
    /* SoT tiêu đề = Admin Widget (Tầng 4) / artifact — không lấy từ Template. */
    var widgetId = opts.widgetId || (opts.slot && opts.slot.id) || '';
    var artContent = opts.artifact && opts.artifact.content;
    var sot = resolveWidgetCopy(widgetId);
    var title = opts.title
      || (artContent && artContent.title)
      || (sot && sot.title)
      || fallbackTitles[source]
      || 'Heatmap';
    var description = opts.description
      || (artContent && artContent.description)
      || (sot && sot.description)
      || fallbackDescriptions[source]
      || '';
    var headHtml = opts.withHead
      ? (global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead
        ? IfluxBlockTemplates.renderWgtHead(title, description)
        : ('<div class="ifx-widget__header"><h3>' + esc(title) + '</h3>' +
          (description ? '<p class="ifx-widget__subtitle">' + esc(description) + '</p>' : '') +
          '</div>'))
      : '';

    el.innerHTML =
      '<div class="ifx-mkt-heatmap-wrap">' +
        headHtml +
        '<div class="ifx-mkt-heatmap" data-ifx-mkt-heatmap="' + source + '"></div>' +
      '</div>';
    var canvas = el.querySelector('[data-ifx-mkt-heatmap]');

    function refresh() {
      paint(canvas, source);
    }

    refresh();
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(refresh);
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', refresh);
    }
    if (!canvas.clientWidth || !canvas.clientHeight) {
      setTimeout(refresh, 60);
    }
  }

  global.IfluxMarketHeatmap = { mount: mount, paint: paint };
})(window);
