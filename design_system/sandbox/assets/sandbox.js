/**
 * Sandbox Catalog — JS CỤC BỘ sandbox (không phải Design System artifact).
 * Render token từ IFX_TOKEN_INDEX (generated) — không hardcode giá trị token.
 * Theme: dùng adapter canonical IfxTheme (adapters/web/theme.js).
 * Playground: JS CHỈ hiển thị viewport/breakpoint/giá trị token —
 * layout responsive do CSS mobile-first điều khiển.
 */
(function () {
  'use strict';

  var doc = document;
  var rootEl = doc.documentElement;
  var index = window.IFX_TOKEN_INDEX;
  var bps = window.IFX_BREAKPOINTS;

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

  function activeBpId() {
    var w = window.innerWidth;
    var active = 'base';
    Object.keys(bps).forEach(function (id) { if (w >= bps[id]) active = id; });
    return active;
  }

  function setText(id, text) {
    var node = doc.getElementById(id);
    if (node) node.textContent = text;
  }

  /* Hiển thị số liệu — KHÔNG đổi layout bằng JS */
  function updateViewport() {
    var w = window.innerWidth;
    var active = activeBpId();
    var label = active === 'base' ? 'BASE (< ' + bps.sm + 'px)' : active + ' (≥ ' + bps[active] + 'px)';

    setText('sbViewportNow', w + 'px → ' + label);
    setText('pgViewport', w + 'px');
    setText('pgActiveBp', label);

    doc.querySelectorAll('.sb-pg-marker').forEach(function (m) {
      m.classList.toggle('is-active', m.getAttribute('data-bp') === active);
    });

    var demo = doc.querySelector('.sb-pg-container-demo');
    if (demo) setText('pgContainerPad', getComputedStyle(demo).paddingLeft);
    setText('pgTokContainer', computedValue('--ifx-space-container'));
    setText('pgTokGutter', computedValue('--ifx-grid-gutter'));
    setText('pgTokSection', computedValue('--ifx-space-section'));
  }

  /* Theme — qua adapter canonical IfxTheme */
  var toggle = doc.getElementById('sbThemeToggle');
  function syncTheme(theme) {
    toggle.textContent = 'Theme: ' + (theme === 'dark' ? 'Dark' : 'Light');
    renderAll();
  }
  toggle.addEventListener('click', function () { window.IfxTheme.toggle(); });
  window.addEventListener('ifx-theme-change', function (e) { syncTheme(e.detail.theme); });
  syncTheme(window.IfxTheme.get());

  window.addEventListener('resize', updateViewport);
  updateViewport();
})();
