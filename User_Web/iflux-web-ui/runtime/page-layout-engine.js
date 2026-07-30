/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-009
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * Layout Engine — generic (Phase 4)
 * PagePublished.placements[] → Host Tree trong [data-ifx-section].
 * pageKey chỉ dùng để fetch PagePublished; hành vi render từ dữ liệu placements/sections.
 * Widget Runtime KHÔNG tạo host — chỉ mount vào host đã có.
 */
(function (global) {
  'use strict';

  var cache = {
    pagePromises: Object.create(null),
    hostTrees: Object.create(null)
  };

  function apiBase() {
    if (global.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
      var b = IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    var origin = global.location && location.origin;
    if (origin && String(origin).indexOf('http') === 0) return origin + '/api';
    return '/api';
  }

  /**
   * @param {string} pageKey — khóa PagePublished (vd community, market, flow, dashboard)
   */
  function fetchPagePublished(pageKey) {
    var key = String(pageKey || '').trim().toLowerCase();
    if (!key) return Promise.resolve(null);
    if (cache.pagePromises[key]) return cache.pagePromises[key];
    cache.pagePromises[key] = fetch(apiBase() + '/pages/' + encodeURIComponent(key), {
      credentials: 'omit'
    })
      .then(function (res) { return res && res.ok ? res.json() : null; })
      .catch(function () { return null; });
    return cache.pagePromises[key];
  }

  /** Seed cache từ fetch đã có (bootstrap) — tránh N+1 PagePublished. */
  function prime(pageKey, payload) {
    var key = String(pageKey || '').trim().toLowerCase();
    if (!key || !payload) return;
    cache.pagePromises[key] = Promise.resolve(payload);
  }

  function applySpan(el, span) {
    var n = Number(span);
    if (!(n >= 1 && n <= 12)) return;
    el.style.gridColumn = 'span ' + n;
    el.setAttribute('data-span', String(n));
  }

  function sectionMetaByKey(pageSections, sectionKey) {
    var list = pageSections || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].key === sectionKey) return list[i];
    }
    return null;
  }

  function sectionWantsGrid(sectionEl, sectionKey, pageSections) {
    var layoutAttr = sectionEl && sectionEl.getAttribute('data-layout');
    if (layoutAttr && String(layoutAttr).indexOf('grid') >= 0) return true;
    var meta = sectionMetaByKey(pageSections, sectionKey);
    if (meta && meta.layout && String(meta.layout).indexOf('grid') >= 0) return true;
    return false;
  }

  function findSection(root, sectionKey) {
    return root.querySelector('[data-ifx-section="' + sectionKey + '"]')
      || root.querySelector('[data-section="' + sectionKey + '"]');
  }

  function ensureSection(root, sectionKey, wantsGrid) {
    var el = findSection(root, sectionKey);
    if (el) return el;
    var wrap = document.createElement(sectionKey === 'sidebar' ? 'aside' : 'div');
    wrap.setAttribute('data-ifx-section', sectionKey);
    wrap.setAttribute('data-section', sectionKey);
    wrap.className = 'ifx-rt-section ifx-rt-section--' + sectionKey;
    if (wantsGrid) wrap.className += ' ifx-dash-grid';
    root.appendChild(wrap);
    return wrap;
  }

  /**
   * Dựng Host Tree từ PagePublished.
   * @param {Element} root
   * @param {string} pageKey
   * @param {{ sectionFilter?: string[] }=} opts — nếu có, chỉ clear/build các section này
   * @returns {Promise<Array<{widgetId, host, config, artifact, section}>>}
   */
  function buildHostTree(root, pageKey, opts) {
    if (!root) return Promise.resolve([]);
    opts = opts || {};
    var filter = opts.sectionFilter;
    var filterSet = null;
    if (filter && filter.length) {
      filterSet = Object.create(null);
      filter.forEach(function (s) { filterSet[s] = true; });
    }

    return fetchPagePublished(pageKey).then(function (payload) {
      var page = payload && payload.data;
      if (!page) return [];

      var byId = {};
      (page.widgets || []).forEach(function (w) {
        if (w && w.id) byId[w.id] = w;
      });

      var sections = root.querySelectorAll('[data-ifx-section], [data-section]');
      for (var si = 0; si < sections.length; si++) {
        var sec = sections[si];
        var sk = sec.getAttribute('data-ifx-section') || sec.getAttribute('data-section');
        if (filterSet && !filterSet[sk]) continue;
        sec.innerHTML = '';
      }

      var placements = (page.placements || [])
        .filter(function (p) {
          if (!p || !p.widgetId || p.enabled === false) return false;
          if (filterSet && !filterSet[p.section || 'main']) return false;
          return true;
        })
        .sort(function (a, b) {
          return (Number(a.position) || 0) - (Number(b.position) || 0);
        });

      var tree = [];
      placements.forEach(function (p) {
        var sectionKey = p.section || 'main';
        var sectionEl = findSection(root, sectionKey)
          || ensureSection(root, sectionKey, false);
        if (!sectionEl.getAttribute('data-ifx-section')) {
          sectionEl.setAttribute('data-ifx-section', sectionKey);
        }
        if (sectionWantsGrid(sectionEl, sectionKey, page.sections)) {
          if (sectionEl.className.indexOf('ifx-dash-grid') < 0) {
            sectionEl.className = (sectionEl.className + ' ifx-dash-grid').trim();
          }
          if (!sectionEl.getAttribute('data-layout')) {
            sectionEl.setAttribute('data-layout', 'grid-12');
          }
        }

        var art = byId[p.widgetId] || null;
        var host = document.createElement('div');
        host.className = 'ifx-rt-widget';
        host.setAttribute('data-widget-id', p.widgetId);
        applySpan(host, p.span);
        var blocks = art && art.permission && art.permission.blocks;
        if (blocks && blocks[0]) host.setAttribute('data-ifx-ent-block', blocks[0]);
        sectionEl.appendChild(host);

        tree.push({
          widgetId: p.widgetId,
          host: host,
          config: (p.config && typeof p.config === 'object') ? p.config : {},
          artifact: art,
          section: sectionKey
        });
      });

      cache.hostTrees[String(pageKey).toLowerCase()] = tree;
      return tree;
    });
  }

  /** Xóa cache fetch (vd sau Publish) — không fallback composition. */
  function clearCache(pageKey) {
    if (pageKey) {
      var key = String(pageKey).toLowerCase();
      delete cache.pagePromises[key];
      delete cache.hostTrees[key];
      return;
    }
    cache.pagePromises = Object.create(null);
    cache.hostTrees = Object.create(null);
  }

  global.IfluxPageLayoutEngine = {
    fetchPagePublished: fetchPagePublished,
    buildHostTree: buildHostTree,
    clearCache: clearCache,
    prime: prime
  };
})(window);
