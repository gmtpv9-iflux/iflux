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

  var doc = document;
  var stage = doc.getElementById('sbStage');
  var selectedVp = 'auto';
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
    var h = parseInt(frame.getAttribute('data-content-height') || '1100', 10);
    frame.style.height = h + 'px';
    host.style.height = Math.ceil(h * scale) + 'px';
    setText('pgSelected', VP_LABEL[selectedVp] || selectedVp);
  }

  function bindPlayground() {
    var bar = doc.getElementById('pgVpBar');
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
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'ifx-pg-metrics') return;
      if (e.data.height) {
        frame.setAttribute('data-content-height', String(e.data.height));
      }
      setText('pgActual', e.data.width + 'px');
      setText('pgActiveBp', e.data.label);
      doc.querySelectorAll('#pgMarkers .sb-pg-marker').forEach(function (m) {
        m.classList.toggle('is-active', m.getAttribute('data-bp') === e.data.breakpoint);
      });
      applyFrameSize();
    });
    frame.addEventListener('load', function () {
      if (window.IfxTheme) {
        frame.contentWindow.postMessage({ type: 'ifx-theme', theme: window.IfxTheme.get() }, '*');
      }
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
        var hash = params().get('panel') || (window.location.hash || '').replace('#', '');
        if (hash) {
          var target = doc.getElementById(hash);
          if (target) target.scrollIntoView();
        }
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
  }
  toggle.addEventListener('click', function () { window.IfxTheme.toggle(); });
  window.addEventListener('ifx-theme-change', function (e) { syncTheme(e.detail.theme); });
  syncTheme(window.IfxTheme.get());

  loadSection(currentSection(), false);
})();
