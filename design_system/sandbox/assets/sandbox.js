/**
 * Sandbox Catalog — JS CỤC BỘ sandbox (không phải Design System artifact).
 * Render token từ IFX_TOKEN_INDEX (generated) — không hardcode giá trị token.
 * Theme toggle chỉ là demo sandbox; adapter chính thức = adapters/web/theme.js (P2).
 */
(function () {
  'use strict';

  var doc = document;
  var rootEl = doc.documentElement;
  var index = window.IFX_TOKEN_INDEX;
  var bps = window.IFX_BREAKPOINTS;
  var THEME_KEY = 'ifx-sandbox-theme';

  function computedValue(varName) {
    return getComputedStyle(rootEl).getPropertyValue(varName).trim();
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
    container.textContent = '';
    varNames.forEach(function (name) { container.appendChild(swatchCard(name, opts)); });
  }

  function renderRows(container, varNames, build) {
    container.textContent = '';
    varNames.forEach(function (name) {
      var row = el('div', 'sb-row');
      row.appendChild(el('code', 'sb-row-label', name + '  ·  ' + computedValue(name)));
      row.appendChild(build(name));
      container.appendChild(row);
    });
  }

  function renderTable(table, entries) {
    table.textContent = '';
    entries.forEach(function (pair) {
      var tr = el('tr');
      tr.appendChild(el('td', null, pair[0]));
      tr.appendChild(el('td', null, pair[1]));
      table.appendChild(tr);
    });
  }

  var isNumericKey = function (name) { return /-\d+$/.test(name); };

  function renderAll() {
    var themeColorNames = index.theme.dark.filter(function (n) { return n.indexOf('shadow') === -1; });
    renderGrid(doc.querySelector('[data-render="theme-colors"]'), themeColorNames, { checker: true });
    renderGrid(doc.querySelector('[data-render="primitive-colors"]'), index.primitive.color);
    renderGrid(doc.querySelector('[data-render="alpha"]'), index.primitive.alpha, { checker: true });
    renderGrid(doc.querySelector('[data-render="gradient"]'), index.primitive.gradient);

    var spaceScale = index.primitive.space.filter(isNumericKey);
    renderRows(doc.querySelector('[data-render="spacing"]'), spaceScale, function (name) {
      var bar = el('div', 'sb-space-bar');
      bar.style.width = 'var(' + name + ')';
      return bar;
    });

    var namedSizes = index.primitive.font.filter(function (n) {
      return n.indexOf('--ifx-font-size-') === 0 && !isNumericKey(n);
    });
    renderRows(doc.querySelector('[data-render="type-scale"]'), namedSizes, function (name) {
      var sample = el('p', 'sb-type-sample', 'Thị trường chứng khoán Việt Nam 0123');
      sample.style.fontSize = 'var(' + name + ')';
      return sample;
    });

    var radiusGrid = doc.querySelector('[data-render="radius"]');
    radiusGrid.textContent = '';
    index.primitive.radius.forEach(function (name) {
      var card = el('div', 'sb-token');
      var demoWrap = el('div', 'sb-token-meta');
      var demo = el('div', 'sb-radius-demo');
      demo.style.borderRadius = 'var(' + name + ')';
      demoWrap.appendChild(demo);
      var meta = el('div', 'sb-token-meta');
      meta.appendChild(el('code', 'sb-token-name', name));
      meta.appendChild(el('span', 'sb-token-value', computedValue(name)));
      card.appendChild(demoWrap);
      card.appendChild(meta);
      radiusGrid.appendChild(card);
    });

    var shadowGrid = doc.querySelector('[data-render="shadow"]');
    shadowGrid.textContent = '';
    index.primitive.shadow.forEach(function (name) {
      var card = el('div', 'sb-token');
      var demoWrap = el('div', 'sb-token-meta');
      var demo = el('div', 'sb-shadow-demo');
      demo.style.boxShadow = 'var(' + name + ')';
      demoWrap.appendChild(demo);
      var meta = el('div', 'sb-token-meta');
      meta.appendChild(el('code', 'sb-token-name', name));
      card.appendChild(demoWrap);
      card.appendChild(meta);
      shadowGrid.appendChild(card);
    });

    renderTable(
      doc.querySelector('[data-render="motion"]'),
      index.primitive.duration.concat(index.primitive.ease).map(function (n) { return [n, computedValue(n)]; })
    );
    renderTable(
      doc.querySelector('[data-render="size"]'),
      index.primitive.size.map(function (n) { return [n, computedValue(n)]; })
    );
    renderTable(
      doc.querySelector('[data-render="zindex"]'),
      index.primitive.z.map(function (n) { return [n, computedValue(n)]; })
    );

    var bpRows = [['Base', '< ' + bps.sm + 'px (mặc định, không media query)']];
    Object.keys(bps).forEach(function (id) { bpRows.push(['bp:' + id, '≥ ' + bps[id] + 'px (min-width)']); });
    renderTable(doc.querySelector('[data-render="breakpoints"]'), bpRows);
  }

  function currentBp() {
    var w = window.innerWidth;
    var active = 'base (< ' + bps.sm + 'px)';
    Object.keys(bps).forEach(function (id) { if (w >= bps[id]) active = id + ' (≥ ' + bps[id] + 'px)'; });
    return w + 'px → ' + active;
  }

  function updateViewport() {
    doc.getElementById('sbViewportNow').textContent = currentBp();
  }

  var toggle = doc.getElementById('sbThemeToggle');
  function applyTheme(theme) {
    rootEl.setAttribute('data-theme', theme);
    toggle.textContent = 'Theme: ' + (theme === 'dark' ? 'Dark' : 'Light');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* sandbox-local, bỏ qua */ }
    renderAll();
  }
  toggle.addEventListener('click', function () {
    applyTheme(rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* noop */ }
  applyTheme(saved === 'light' ? 'light' : 'dark');

  window.addEventListener('resize', updateViewport);
  updateViewport();
})();
