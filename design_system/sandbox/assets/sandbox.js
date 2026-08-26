/**
 * Sandbox Catalog shell — routing, theme, token render, playground iframe, icon catalog.
 * Không điều khiển layout responsive bằng JS.
 */
(function () {
  'use strict';

  var SECTIONS = ['tokens', 'foundation', 'primitives', 'components', 'patterns', 'baseline'];
  var VP_LABEL = {
    auto: 'AUTO (browser)',
    360: '360 — Mobile Base',
    480: '480 — sm',
    768: '768 — md',
    1024: '1024 — lg',
    1280: '1280 — xl',
    1440: '1440 — 2xl'
  };
  var PAGE_SIZE = 48;
  var COMPONENT_CSS = [
    '../components/card/card.css',
    '../components/stat/stat.css',
    '../components/stat/stat-strip.css',
    '../components/breadcrumb/breadcrumb.css',
    '../components/form/form.css',
    '../components/table/table.css',
    '../components/pagination/pagination.css',
    '../components/drawer/drawer.css',
    '../components/action-bar/action-bar.css',
    '../components/modal/modal.css',
    '../components/toast/toast.css',
    '../components/dropdown/dropdown.css',
    '../components/tabs/tabs.css',
    '../components/search/search.css',
    '../components/timeline/timeline.css',
    '../components/wizard/wizard.css',
    '../components/chat/chat.css',
    '../components/chart/chart.css'
  ];
  var COMPONENT_JS = [
    '../components/table/table.js',
    '../components/pagination/pagination.js',
    '../components/drawer/drawer.js',
    '../components/modal/modal.js',
    '../components/toast/toast.js',
    '../components/dropdown/dropdown.js',
    '../components/tabs/tabs.js',
    '../components/wizard/wizard.js',
    '../components/chat/chat.js',
    '../components/chart/chart-adapter.js'
  ];

  function ensureHref(href, kind) {
    var sel = (kind === 'script' ? 'script' : 'link') + '[data-ifx-comp="' + href + '"]';
    if (doc.querySelector(sel)) return Promise.resolve();
    return new Promise(function (resolve) {
      var node;
      if (kind === 'script') {
        node = doc.createElement('script');
        node.src = href;
        node.onload = resolve;
        doc.body.appendChild(node);
      } else {
        node = doc.createElement('link');
        node.rel = 'stylesheet';
        node.href = href;
        node.onload = resolve;
        doc.head.appendChild(node);
      }
      node.setAttribute('data-ifx-comp', href);
      if (kind !== 'script') resolve();
    });
  }

  function ensureComponentAssets() {
    COMPONENT_CSS.forEach(function (h) { ensureHref(h, 'css'); });
    var chain = Promise.resolve();
    COMPONENT_JS.forEach(function (h) { chain = chain.then(function () { return ensureHref(h, 'js'); }); });
    return chain;
  }

  var PATTERN_CSS = [
    '../patterns/page-header/page-header.css'
  ];
  var PATTERN_JS = [
    '../patterns/data-list/data-list.js'
  ];

  function ensurePatternCss() {
    PATTERN_CSS.forEach(function (href) {
      if (doc.querySelector('link[data-ifx-pat="' + href + '"]')) return;
      var link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-ifx-pat', href);
      doc.head.appendChild(link);
    });
  }

  function ensurePatternJs() {
    var chain = Promise.resolve();
    PATTERN_JS.forEach(function (h) { chain = chain.then(function () { return ensureHref(h, 'js'); }); });
    return chain;
  }

  function bindComponents() {
    if (window.IfxTable) window.IfxTable.init();
    if (window.IfxPagination) window.IfxPagination.init();
    if (window.IfxDataList) window.IfxDataList.initAll();
    if (window.IfxTabs) window.IfxTabs.init();
    if (window.IfxWizard) window.IfxWizard.init();
    if (window.IfxChat) window.IfxChat.init();
    if (window.IfxChart) window.IfxChart.init();
    doc.querySelectorAll('[data-ifx-toast]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.IfxToast) window.IfxToast.show('Toast ' + btn.getAttribute('data-ifx-toast'), btn.getAttribute('data-ifx-toast'));
      });
    });
  }
  var PRIMITIVE_CSS = [
    '../primitives/button/button.css',
    '../primitives/chip/chip.css',
    '../primitives/badge/badge.css',
    '../primitives/avatar/avatar.css',
    '../primitives/alert/alert.css',
    '../primitives/progress/progress.css',
    '../primitives/navigation/nav.css'
  ];

  function ensurePrimitiveCss() {
    PRIMITIVE_CSS.forEach(function (href) {
      if (doc.querySelector('link[data-ifx-prim="' + href + '"]')) return;
      var link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-ifx-prim', href);
      doc.head.appendChild(link);
    });
  }

  function bindPrimitives() {
    var list = doc.getElementById('navDemo');
    if (!list) return;
    list.addEventListener('click', function (e) {
      var item = e.target.closest('.ifx-nav-item');
      if (!item || item.disabled || item.classList.contains('is-disabled')) return;
      list.querySelectorAll('.ifx-nav-item').forEach(function (n) {
        n.classList.toggle('is-active', n === item);
      });
    });
  }

  var doc = document;
  var stage = doc.getElementById('sbStage');
  var selectedVp = 'auto';
  var selectedSpan = 6;
  var iconState = { all: [], filtered: [], page: 0, q: '' };

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function currentSection() {
    var q = params().get('section');
    if (SECTIONS.indexOf(q) !== -1) return q;
    var hash = (window.location.hash || '').replace('#', '');
    if (SECTIONS.indexOf(hash) !== -1) return hash;
    return 'foundation';
  }

  function setText(id, text) {
    var n = doc.getElementById(id);
    if (n) n.textContent = text;
  }

  /* ── Tokens catalog ── */
  function computedValue(varName) {
    return getComputedStyle(doc.documentElement).getPropertyValue(varName).trim();
  }
  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function swatchCard(varName, opts) {
    var card = el('div', 'sb-token');
    var swatch = el('div', 'sb-token-swatch' + ((opts && opts.checker) ? ' is-checker' : ''));
    var fill = el('div', 'sb-token-swatch-fill');
    fill.style.background = 'var(' + varName + ')';
    swatch.appendChild(fill);
    var meta = el('div', 'sb-token-meta');
    meta.appendChild(el('code', 'sb-token-name', varName));
    meta.appendChild(el('span', 'sb-token-value', computedValue(varName)));
    card.appendChild(swatch);
    card.appendChild(meta);
    return card;
  }
  function renderGrid(container, varNames, opts) {
    if (!container) return;
    container.textContent = '';
    varNames.forEach(function (name) { container.appendChild(swatchCard(name, opts)); });
  }
  function renderRows(container, varNames, build) {
    if (!container) return;
    container.textContent = '';
    varNames.forEach(function (name) {
      var row = el('div', 'sb-row');
      row.appendChild(el('code', 'sb-row-label', name + '  ·  ' + computedValue(name)));
      row.appendChild(build(name));
      container.appendChild(row);
    });
  }
  function renderTable(table, entries) {
    if (!table) return;
    table.textContent = '';
    entries.forEach(function (pair) {
      var tr = el('tr');
      tr.appendChild(el('td', null, pair[0]));
      tr.appendChild(el('td', null, pair[1]));
      table.appendChild(tr);
    });
  }
  var isNumericKey = function (name) { return /-\d+$/.test(name); };

  function renderTokens() {
    var index = window.IFX_TOKEN_INDEX;
    var bps = window.IFX_BREAKPOINTS;
    if (!index || !doc.querySelector('[data-render="theme-colors"]')) return;
    var themeColorNames = index.theme.dark.filter(function (n) { return n.indexOf('shadow') === -1; });
    renderGrid(doc.querySelector('[data-render="theme-colors"]'), themeColorNames, { checker: true });
    renderGrid(doc.querySelector('[data-render="primitive-colors"]'), index.primitive.color);
    renderGrid(doc.querySelector('[data-render="alpha"]'), index.primitive.alpha, { checker: true });
    renderGrid(doc.querySelector('[data-render="gradient"]'), index.primitive.gradient);
    renderRows(doc.querySelector('[data-render="spacing"]'), index.primitive.space.filter(isNumericKey), function (name) {
      var bar = el('div', 'sb-space-bar');
      bar.style.width = 'var(' + name + ')';
      return bar;
    });
    renderRows(doc.querySelector('[data-render="type-scale"]'), index.primitive.font.filter(function (n) {
      return n.indexOf('--ifx-font-size-') === 0 && !isNumericKey(n);
    }), function (name) {
      var sample = el('p', 'sb-type-sample', 'Thị trường chứng khoán Việt Nam 0123');
      sample.style.fontSize = 'var(' + name + ')';
      return sample;
    });
    var radiusGrid = doc.querySelector('[data-render="radius"]');
    if (radiusGrid) {
      radiusGrid.textContent = '';
      index.primitive.radius.forEach(function (name) {
        var card = el('div', 'sb-token');
        var demo = el('div', 'sb-radius-demo');
        demo.style.borderRadius = 'var(' + name + ')';
        var wrap = el('div', 'sb-token-meta');
        wrap.appendChild(demo);
        var meta = el('div', 'sb-token-meta');
        meta.appendChild(el('code', 'sb-token-name', name));
        meta.appendChild(el('span', 'sb-token-value', computedValue(name)));
        card.appendChild(wrap);
        card.appendChild(meta);
        radiusGrid.appendChild(card);
      });
    }
    var shadowGrid = doc.querySelector('[data-render="shadow"]');
    if (shadowGrid) {
      shadowGrid.textContent = '';
      index.primitive.shadow.forEach(function (name) {
        var card = el('div', 'sb-token');
        var demo = el('div', 'sb-shadow-demo');
        demo.style.boxShadow = 'var(' + name + ')';
        var wrap = el('div', 'sb-token-meta');
        wrap.appendChild(demo);
        var meta = el('div', 'sb-token-meta');
        meta.appendChild(el('code', 'sb-token-name', name));
        card.appendChild(wrap);
        card.appendChild(meta);
        shadowGrid.appendChild(card);
      });
    }
    renderTable(doc.querySelector('[data-render="motion"]'), index.primitive.duration.concat(index.primitive.ease).map(function (n) { return [n, computedValue(n)]; }));
    renderTable(doc.querySelector('[data-render="size"]'), index.primitive.size.map(function (n) { return [n, computedValue(n)]; }));
    renderTable(doc.querySelector('[data-render="zindex"]'), index.primitive.z.map(function (n) { return [n, computedValue(n)]; }));
    var bpRows = [['Base', '< ' + bps.sm + 'px (mặc định, không media query)']];
    Object.keys(bps).forEach(function (id) { bpRows.push(['bp:' + id, '≥ ' + bps[id] + 'px (min-width)']); });
    renderTable(doc.querySelector('[data-render="breakpoints"]'), bpRows);
  }

  /* ── Playground iframe ── */
  function applyFrameSize() {
    var host = doc.getElementById('pgHost');
    var scaleEl = doc.getElementById('pgScale');
    var frame = doc.getElementById('pgFrame');
    if (!host || !scaleEl || !frame) return;
    var hostW = host.clientWidth;
    var logical = selectedVp === 'auto' ? window.innerWidth : parseInt(selectedVp, 10);
    frame.style.width = logical + 'px';
    var scale = logical > hostW ? hostW / logical : 1;
    scaleEl.style.transform = scale === 1 ? 'none' : 'scale(' + scale + ')';
    scaleEl.style.width = logical + 'px';
    var h = parseInt(frame.getAttribute('data-content-height') || '1400', 10);
    frame.style.height = h + 'px';
    host.style.height = Math.ceil(h * scale) + 'px';
    setText('pgSelected', VP_LABEL[selectedVp] || selectedVp);
  }

  function postToFrame(payload) {
    var frame = doc.getElementById('pgFrame');
    if (frame && frame.contentWindow) frame.contentWindow.postMessage(payload, '*');
  }

  function bindPlayground() {
    var bar = doc.getElementById('pgVpBar');
    var spanBar = doc.getElementById('pgSpanBar');
    var frame = doc.getElementById('pgFrame');
    if (!bar || !frame) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-vp]');
      if (!btn) return;
      selectedVp = btn.getAttribute('data-vp');
      bar.querySelectorAll('.sb-vp-btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      applyFrameSize();
    });
    if (spanBar) {
      spanBar.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-span]');
        if (!btn) return;
        selectedSpan = parseInt(btn.getAttribute('data-span'), 10);
        spanBar.querySelectorAll('.sb-vp-btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        postToFrame({ type: 'ifx-pg-span', span: selectedSpan });
      });
    }
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'ifx-pg-metrics') return;
      if (e.data.height) {
        frame.setAttribute('data-content-height', String(e.data.height));
      }
      setText('pgActual', e.data.width + 'px');
      setText('pgActiveBp', e.data.label);
      setText('pgBoxVp', e.data.width + 'px');
      if (e.data.fluid) {
        setText('pgBoxGutter', e.data.fluid.gutterL + 'px × 2');
        setText('pgBoxContent', e.data.fluid.content + 'px');
        setText('pgBoxRatio', e.data.fluidRatio + '%');
      }
      if (e.data.max) {
        setText('pgBoxMaxOuter', e.data.max.outer + 'px');
        setText('pgBoxMaxMargin', e.data.maxOuterMargin + 'px × 2');
      }
      if (e.data.span) {
        setText('pgBoxSpan', e.data.span + '/12 = ' + e.data.spanNominal);
        setText('pgBoxSpanPx', e.data.spanPx + 'px · ' + e.data.spanOfGrid + '% grid');
      }
      doc.querySelectorAll('#pgMarkers .sb-pg-marker').forEach(function (m) {
        m.classList.toggle('is-active', m.getAttribute('data-bp') === e.data.breakpoint);
      });
      applyFrameSize();
    });
    frame.addEventListener('load', function () {
      if (window.IfxTheme) {
        frame.contentWindow.postMessage({ type: 'ifx-theme', theme: window.IfxTheme.get() }, '*');
      }
      postToFrame({ type: 'ifx-pg-span', span: selectedSpan });
      applyFrameSize();
    });
    applyFrameSize();
  }

  /* ── Icon catalog ── */
  function renderIconPage() {
    var grid = doc.getElementById('iconGrid');
    if (!grid) return;
    var start = iconState.page * PAGE_SIZE;
    var slice = iconState.filtered.slice(start, start + PAGE_SIZE);
    grid.textContent = '';
    slice.forEach(function (item) {
      var cell = el('button', 'sb-icon-cell');
      cell.type = 'button';
      cell.setAttribute('data-class', item.className);
      var ic = el('i', item.className + ' ifx-icon ifx-icon-lg');
      cell.appendChild(ic);
      cell.appendChild(el('code', null, item.name));
      grid.appendChild(cell);
    });
    var pages = Math.max(1, Math.ceil(iconState.filtered.length / PAGE_SIZE));
    setText('iconPageInfo', (iconState.page + 1) + '/' + pages + ' · ' + iconState.filtered.length + ' / ' + iconState.all.length);
    var prev = doc.getElementById('iconPrev');
    var next = doc.getElementById('iconNext');
    if (prev) prev.disabled = iconState.page <= 0;
    if (next) next.disabled = iconState.page >= pages - 1;
  }

  function bindIcons() {
    if (!doc.getElementById('iconGrid')) return;
    fetch('../foundation/icons/vendor/tabler/icon-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        iconState.all = data.icons || [];
        iconState.filtered = iconState.all;
        setText('iconSourceCount', String(data.count));
        setText('iconCanonCount', String(iconState.all.length));
        setText('iconMissing', data.count === iconState.all.length ? '0' : String(Math.abs(data.count - iconState.all.length)));
        renderIconPage();
      });
    doc.getElementById('iconSearch').addEventListener('input', function (e) {
      iconState.q = e.target.value.trim().toLowerCase();
      iconState.filtered = iconState.all.filter(function (i) { return i.name.indexOf(iconState.q) !== -1; });
      iconState.page = 0;
      renderIconPage();
    });
    doc.getElementById('iconPrev').addEventListener('click', function () {
      if (iconState.page > 0) { iconState.page -= 1; renderIconPage(); }
    });
    doc.getElementById('iconNext').addEventListener('click', function () {
      var pages = Math.ceil(iconState.filtered.length / PAGE_SIZE);
      if (iconState.page < pages - 1) { iconState.page += 1; renderIconPage(); }
    });
    doc.getElementById('iconGrid').addEventListener('click', function (e) {
      var cell = e.target.closest('.sb-icon-cell');
      if (!cell) return;
      setText('iconDetail', cell.getAttribute('data-class') + '  ·  <i class="' + cell.getAttribute('data-class') + '"></i>');
    });
  }

  /* ── Router ── */
  function syncNav(id) {
    doc.querySelectorAll('#sbNav .sb-nav-item').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-section') === id);
    });
  }

  function scrollPanel() {
    var hash = params().get('panel') || (window.location.hash || '').replace('#', '');
    if (!hash) return;
    var target = doc.getElementById(hash);
    if (target) target.scrollIntoView();
  }

  function loadSection(id, push) {
    if (SECTIONS.indexOf(id) === -1) id = 'foundation';
    syncNav(id);
    var url = '?section=' + id;
    if (push === false) window.history.replaceState({ section: id }, '', url);
    else window.history.pushState({ section: id }, '', url);
    return fetch('sections/' + id + '.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        stage.innerHTML = html;
        if (id === 'tokens') renderTokens();
        if (id === 'foundation') {
          bindPlayground();
          bindIcons();
        }
        if (id === 'primitives') {
          ensurePrimitiveCss();
          bindPrimitives();
        }
        if (id === 'components' || id === 'patterns') {
          ensurePrimitiveCss();
          if (id === 'patterns') ensurePatternCss();
          return ensureComponentAssets().then(function () {
            if (id === 'patterns') return ensurePatternJs();
          }).then(function () {
            bindComponents();
            scrollPanel();
          });
        }
        scrollPanel();
      });
  }

  doc.getElementById('sbNav').addEventListener('click', function (e) {
    var a = e.target.closest('[data-section]');
    if (!a) return;
    e.preventDefault();
    loadSection(a.getAttribute('data-section'));
  });
  window.addEventListener('popstate', function () { loadSection(currentSection(), false); });
  window.addEventListener('resize', function () {
    if (selectedVp === 'auto') applyFrameSize();
  });

  var toggle = doc.getElementById('sbThemeToggle');
  function syncTheme(theme) {
    toggle.textContent = 'Theme: ' + (theme === 'dark' ? 'Dark' : 'Light');
    var frame = doc.getElementById('pgFrame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'ifx-theme', theme: theme }, '*');
    }
    if (currentSection() === 'tokens') renderTokens();
    if (window.IfxChart) window.IfxChart.paint();
  }
  toggle.addEventListener('click', function () { window.IfxTheme.toggle(); });
  window.addEventListener('ifx-theme-change', function (e) { syncTheme(e.detail.theme); });
  syncTheme(window.IfxTheme.get());

  loadSection(currentSection(), false);
})();
