/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-P1-007
Priority: P1
STATUS: Used|dep-dong
OWNER (hiện tại): Shell/Search
Owner đích (map): Shell/Search
Usage audit: ✓
Dep động: Có
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: FAIL
Refs: docs/runtime-opt/task5/PhaseA-P1-Gate.json
Note: Chạy khi mở search — không P1 PASS
===== IFX-AUDIT-END ===== */
/* Header search — CP / Ngành / Họ CP / Chủ đề (giống Admin ix-search) */
(function (global) {
  'use strict';

  var RECENT_KEY = 'iflux_search_recent_v1';
  var QUERY_KEY = 'iflux_search_query_v1';
  var MAX_RECENT = 20;
  var MAX_QUERY = 10;

  function storageUserId() {
    var u = global.IfluxAuth && IfluxAuth.getUser && IfluxAuth.getUser();
    return (u && u.id) ? u.id : 'anon';
  }

  function readRecent() {
    try {
      var raw = localStorage.getItem(RECENT_KEY + '_' + storageUserId());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeRecent(list) {
    localStorage.setItem(RECENT_KEY + '_' + storageUserId(), JSON.stringify(list.slice(0, MAX_RECENT)));
  }

  function entityKey(entity) {
    return String(entity.type || '') + ':' + String(entity.id || '');
  }

  function pushRecent(entity) {
    if (!entity || !entity.type || entity.id == null) return;
    var item = {
      type: entity.type,
      id: String(entity.id),
      label: entity.label || entity.name || String(entity.id),
      at: new Date().toISOString()
    };
    var list = readRecent().filter(function (r) {
      return entityKey(r) !== entityKey(item);
    });
    list.unshift(item);
    writeRecent(list);
  }

  function clearRecent() {
    writeRecent([]);
    clearQueryRecent();
  }

  function readQueryRecent() {
    try {
      var raw = localStorage.getItem(QUERY_KEY + '_' + storageUserId());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeQueryRecent(list) {
    localStorage.setItem(QUERY_KEY + '_' + storageUserId(), JSON.stringify(list.slice(0, MAX_QUERY)));
  }

  function pushQuery(q) {
    q = String(q || '').trim();
    if (!q) return;
    var item = { q: q, at: new Date().toISOString() };
    var list = readQueryRecent().filter(function (r) {
      return norm(r.q) !== norm(q);
    });
    list.unshift(item);
    writeQueryRecent(list);
  }

  function clearQueryRecent() {
    writeQueryRecent([]);
  }

  function looksLikeEmailAutofill(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());
  }

  function sanitizeAutofillLeak(input) {
    if (!input) return;
    if (looksLikeEmailAutofill(input.value)) {
      input.value = '';
    }
  }

  function installAutofillDecoys(wrap) {
    if (!wrap || wrap.querySelector('[data-ifx-autofill-decoy]')) return;
    var decoy = document.createElement('div');
    decoy.className = 'ifx-hdr-search-decoy';
    decoy.setAttribute('data-ifx-autofill-decoy', '1');
    decoy.setAttribute('aria-hidden', 'true');
    decoy.innerHTML =
      '<input type="text" tabindex="-1" autocomplete="username" aria-hidden="true">' +
      '<input type="password" tabindex="-1" autocomplete="current-password" aria-hidden="true">';
    wrap.insertBefore(decoy, wrap.firstChild);
  }

  function hardenSearchInput(input, wrap) {
    if (!input || input.dataset.ifxSearchHardened === '1') return;
    input.dataset.ifxSearchHardened = '1';
    installAutofillDecoys(wrap);
    input.setAttribute('type', 'text');
    input.setAttribute('inputmode', 'search');
    input.setAttribute('enterkeyhint', 'search');
    input.setAttribute('autocomplete', 'one-time-code');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('name', 'ifx_market_search_q');
    input.removeAttribute('id');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    input.setAttribute('data-form-type', 'other');
    input.setAttribute('role', 'searchbox');
    input.setAttribute('readonly', 'readonly');
    sanitizeAutofillLeak(input);
  }

  function fmtRecentTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var now = new Date();
      var diff = now.getTime() - d.getTime();
      if (diff < 60000) return 'Vừa xong';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
      return d.toLocaleDateString('vi-VN');
    } catch (e) {
      return '';
    }
  }

  function renderRecentPanel() {
    var list = readQueryRecent().slice(0, MAX_QUERY);
    if (!list.length) {
      return '<div class="ifx-hdr-search-empty">Chưa có tìm kiếm gần đây</div>';
    }
    return '<div class="ifx-hdr-search-recent-head">' +
        '<span><i class="ti ti-history"></i> Tìm kiếm gần đây</span>' +
        '<button type="button" class="ifx-hdr-search-recent-clear" data-ifx-clear-recent>Xóa</button>' +
      '</div>' +
      list.map(function (stored, i) {
        return '<button type="button" class="ifx-hdr-search-item ifx-hdr-search-item--recent ifx-hdr-search-item--query' + (i === 0 ? ' is-active' : '') + '" data-ifx-recent-query="' + esc(stored.q) + '">' +
          '<span class="ix-chip ix-chip-sm ix-chip-secondary"><i class="ti ti-search"></i></span>' +
          '<span class="ifx-hdr-search-item__label">' + esc(stored.q) + '</span>' +
          '<span class="ifx-hdr-search-item__time">' + esc(fmtRecentTime(stored.at)) + '</span>' +
        '</button>';
      }).join('');
  }

  var TYPE_META = {
    ticker: { label: 'Cổ phiếu', icon: 'ti-chart-line', chip: 'ix-chip-primary' },
    sector: { label: 'Ngành', icon: 'ti-category', chip: 'ix-chip-info' },
    family: { label: 'Họ CP', icon: 'ti-users-group', chip: 'ix-chip-success' },
    story: { label: 'Chủ đề', icon: 'ti-book-2', chip: 'ix-chip-warning' }
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function webUiBase() {
    var scripts = document.getElementsByTagName('script');
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('iflux-web-ui/') >= 0) {
        return src.replace(/iflux-web-ui\/[^/]*$/, 'iflux-web-ui/');
      }
    }
    return '../iflux-web-ui/';
  }

  function userWebRoot() {
    var p = location.pathname;
    var i = p.indexOf('/User_Web/');
    if (i >= 0) return p.slice(0, i + '/User_Web/'.length);
    return '../';
  }

  function entityUrl(entity) {
    if (global.IfluxStockMentions && IfluxStockMentions.entityHref) {
      var from = location.pathname.indexOf('/stock/') >= 0 ? 'stock' : 'other';
      return IfluxStockMentions.entityHref(entity, { from: from });
    }
    var c;
    if (global.IfluxSeoUrl) {
      if (entity.type === 'ticker') c = IfluxSeoUrl.stockHref(entity.id);
      else if (entity.type === 'sector') c = IfluxSeoUrl.sectorHref(entity.id);
      else if (entity.type === 'family') c = IfluxSeoUrl.ecosystemHref(entity.id);
      else if (entity.type === 'story') c = IfluxSeoUrl.storyEntityHref(entity.id);
    }
    if (!c) {
      var root = userWebRoot();
      if (entity.type === 'ticker') c = '/co-phieu/' + encodeURIComponent(String(entity.id).toUpperCase());
      else if (entity.type === 'sector') c = '/nganh/' + encodeURIComponent(entity.id);
      else if (entity.type === 'family') c = '/he-sinh-thai/' + encodeURIComponent(entity.id);
      else if (entity.type === 'story') c = '/chu-de/' + encodeURIComponent(entity.id);
      else c = root + 'search';
    }
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function buildIndex() {
    if (global.IfluxStockMentions && IfluxStockMentions.buildIndex) {
      return IfluxStockMentions.buildIndex();
    }
    var list = [];
    var tax = global.IfluxWatchlistTaxonomy;
    if (tax) {
      ['sector', 'family', 'story'].forEach(function (source) {
        tax.getGroups(source).forEach(function (g) {
          list.push({
            type: source,
            id: String(g.id),
            name: g.name,
            label: g.name,
            tokens: [g.name, g.id]
          });
        });
      });
    }
    return list;
  }

  function search(q, limit) {
    limit = limit || 20;
    q = norm(String(q || '').trim());
    if (!q) return [];
    var index = buildIndex();
    return index.filter(function (e) {
      return e.tokens.some(function (t) {
        t = norm(t);
        return t.indexOf(q) >= 0 || t.indexOf(q) === 0;
      });
    }).slice(0, limit);
  }

  function groupByType(items) {
    var order = ['ticker', 'sector', 'family', 'story'];
    var map = { ticker: [], sector: [], family: [], story: [] };
    items.forEach(function (e) {
      if (map[e.type]) map[e.type].push(e);
    });
    return order.filter(function (t) { return map[t].length; }).map(function (t) {
      return { type: t, items: map[t] };
    });
  }

  function renderResults(items) {
    if (!items.length) {
      return '<div class="ifx-hdr-search-empty">Không có kết quả</div>';
    }
    return groupByType(items).map(function (grp) {
      var meta = TYPE_META[grp.type] || { label: grp.type, icon: 'ti-search' };
      return '<div class="ifx-hdr-search-group">' +
        '<div class="ifx-hdr-search-group-title">' + esc(meta.label) + '</div>' +
        grp.items.map(function (e, i) {
          return '<a class="ifx-hdr-search-item' + (i === 0 && grp.type === groupByType(items)[0].type ? ' is-active' : '') + '" href="' + esc(entityUrl(e)) + '" data-ifx-search-item data-ifx-entity-type="' + esc(e.type) + '" data-ifx-entity-id="' + esc(e.id) + '" data-ifx-entity-label="' + esc(e.label || e.name) + '">' +
            '<span class="ix-chip ix-chip-sm ' + meta.chip + '"><i class="ti ' + meta.icon + '"></i></span>' +
            '<span class="ifx-hdr-search-item__label">' + esc(e.label) + '</span>' +
          '</a>';
        }).join('') +
      '</div>';
    }).join('');
  }

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = cb;
    s.onerror = cb;
    document.body.appendChild(s);
  }

  function adminBase() {
    /* Lấy base thật từ <script> admin đang tải trên trang (mọi trang đều có
       iflux-admin-ui.js) — không suy đoán path qua string-replace. */
    var scripts = document.getElementsByTagName('script');
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      var idx = src.indexOf('Admin_Design_system/iflux-admin-ui/');
      if (idx >= 0) {
        return src.slice(0, idx) + 'Admin_Design_system/iflux-admin-ui/';
      }
    }
    return webUiBase() + '../../Admin_Design_system/iflux-admin-ui/';
  }

  /* Data requirement của Header Search = App Shell feature TỰ sở hữu, nạp LAZY
   * khi user mở search lần đầu. KHÔNG eager ở tầng Page (landing như Gói cước
   * không tải market data lúc load). Trang đã eager-load sẵn → chain skip toàn bộ. */
  function marketDataReady() {
    return !!(global.IfluxMockMarket && global.IfluxStockMentions && global.IfluxWatchlistTaxonomy);
  }

  var depsState = 'idle'; // idle | loading | ready
  var depsWaiters = [];

  function ensureDeps(cb) {
    if (depsState === 'ready' || marketDataReady()) {
      depsState = 'ready';
      if (cb) cb();
      return;
    }
    if (cb) depsWaiters.push(cb);
    if (depsState === 'loading') return;
    depsState = 'loading';

    var web = webUiBase();
    var adm = adminBase();
    /* Giữ đúng thứ tự phụ thuộc như boot cũ:
       seed → ecosystem → registry-store → mock-market → taxonomy → stock-mentions */
    var chain = [
      { g: 'IfluxMarketSeedData', src: adm + 'iflux-market-seed-data.js' },
      { g: 'IfluxMarketEcosystemSeeds', src: adm + 'iflux-market-ecosystem-seeds.js' },
      { g: 'IfluxMarketRegistryStore', src: adm + 'iflux-market-registry-store.js' },
      { g: 'IfluxMockMarket', src: web + 'mock-market.js' },
      { g: 'IfluxWatchlistTaxonomy', src: web + 'watchlist-taxonomy.js' },
      { g: 'IfluxStockMentions', src: web + 'stock-mentions.js' }
    ];

    function next(i) {
      if (i >= chain.length) {
        depsState = 'ready';
        var ws = depsWaiters.slice();
        depsWaiters = [];
        ws.forEach(function (fn) { try { fn(); } catch (e) {} });
        return;
      }
      var step = chain[i];
      if (global[step.g]) { next(i + 1); return; }
      loadScript(step.src, function () { next(i + 1); });
    }
    next(0);
  }

  function mountShells() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-ifx-header-search]'));
  }

  function bindSearch(wrap) {
    var input = wrap.querySelector('input');
    var dropdown = wrap.querySelector('.ifx-hdr-search-dropdown');
    var box = wrap.querySelector('.ifx-hdr-search');
    if (!input || !dropdown) return;

    hardenSearchInput(input, wrap);

    function lockAutofill() {
      if (document.activeElement !== input) {
        input.setAttribute('readonly', 'readonly');
      }
    }

    function prepareInput() {
      input.removeAttribute('readonly');
      sanitizeAutofillLeak(input);
    }

    function close() {
      dropdown.hidden = true;
      if (box) box.setAttribute('aria-expanded', 'false');
    }

    function open() {
      dropdown.hidden = false;
      if (box) box.setAttribute('aria-expanded', 'true');
    }

    function entityFromItem(el) {
      if (!el) return null;
      return {
        type: el.getAttribute('data-ifx-entity-type'),
        id: el.getAttribute('data-ifx-entity-id'),
        label: el.getAttribute('data-ifx-entity-label')
      };
    }

    function refresh() {
      var q = String(input.value || '').trim();
      if (!q) {
        dropdown.innerHTML = renderRecentPanel();
      } else {
        var hits = search(q, 20);
        dropdown.innerHTML = renderResults(hits);
      }
      if (document.activeElement === input) open();
    }

    function showRecent() {
      prepareInput();
      refresh();
      open();
      ensureDeps(function () {
        if (document.activeElement === input) refresh();
      });
    }

    dropdown.addEventListener('click', function (e) {
      if (e.target.closest('[data-ifx-clear-recent]')) {
        e.preventDefault();
        clearRecent();
        refresh();
        return;
      }
      var qBtn = e.target.closest('[data-ifx-recent-query]');
      if (qBtn) {
        e.preventDefault();
        input.value = qBtn.getAttribute('data-ifx-recent-query') || '';
        pushQuery(input.value);
        refresh();
        input.focus();
        return;
      }
      var item = e.target.closest('[data-ifx-search-item]');
      if (item) {
        var q = String(input.value || '').trim() || item.getAttribute('data-ifx-entity-label') || '';
        if (q) pushQuery(q);
        pushRecent(entityFromItem(item));
      }
    });

    input.addEventListener('mousedown', prepareInput);
    input.addEventListener('touchstart', prepareInput, { passive: true });
    input.addEventListener('focus', showRecent);
    input.addEventListener('blur', function () {
      window.setTimeout(lockAutofill, 180);
    });

    if (box) {
      box.addEventListener('mousedown', function () {
        window.setTimeout(function () {
          if (document.activeElement !== input) input.focus();
          else showRecent();
        }, 0);
      });
    }

    input.addEventListener('input', refresh);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        close();
        input.blur();
        if (wrap.closest('.ifx-topnav--search-open') && global.IfluxWebUI && global.IfluxWebUI.closeMobileSearch) {
          global.IfluxWebUI.closeMobileSearch();
        }
        return;
      }
      if (e.key === 'Enter') {
        var q = String(input.value || '').trim();
        if (q) pushQuery(q);
        var active = dropdown.querySelector('.ifx-hdr-search-item.is-active') || dropdown.querySelector('[data-ifx-recent-query]') || dropdown.querySelector('.ifx-hdr-search-item');
        if (active) {
          if (active.hasAttribute('data-ifx-recent-query')) {
            e.preventDefault();
            input.value = active.getAttribute('data-ifx-recent-query') || '';
            refresh();
            return;
          }
          e.preventDefault();
          pushRecent(entityFromItem(active));
          if (global.IfluxHref && global.IfluxHref.followHref) {
            global.IfluxHref.followHref(active.getAttribute('href'));
          } else {
            location.href = active.getAttribute('href');
          }
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var items = Array.prototype.slice.call(dropdown.querySelectorAll('.ifx-hdr-search-item, [data-ifx-recent-query]'));
        if (!items.length) return;
        e.preventDefault();
        var idx = items.findIndex(function (el) { return el.classList.contains('is-active'); });
        if (e.key === 'ArrowDown') idx = idx < items.length - 1 ? idx + 1 : 0;
        else idx = idx > 0 ? idx - 1 : items.length - 1;
        items.forEach(function (el, i) { el.classList.toggle('is-active', i === idx); });
      }
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        prepareInput();
        input.focus();
        input.select();
        showRecent();
      }
    });
  }

  function init() {
    if (!document.querySelector('.ifx-topnav')) return;
    var wraps = mountShells();
    if (!wraps.length) return;
    /* Bind listeners NGAY (không cần data) → search UI phản hồi tức thì.
       Data market nạp LAZY ở lần focus đầu (showRecent → ensureDeps). */
    wraps.forEach(function (wrap) {
      if (wrap.dataset.ifxSearchBound === '1') return;
      bindSearch(wrap);
      wrap.dataset.ifxSearchBound = '1';
    });
  }

  global.IfluxHeaderSearch = {
    init: init,
    search: search,
    entityUrl: entityUrl,
    pushRecent: pushRecent,
    readRecent: readRecent,
    clearRecent: clearRecent,
    pushQuery: pushQuery,
    readQueryRecent: readQueryRecent,
    clearQueryRecent: clearQueryRecent,
    hardenInput: hardenSearchInput,
    sanitizeAutofillLeak: sanitizeAutofillLeak
  };
})(window);
