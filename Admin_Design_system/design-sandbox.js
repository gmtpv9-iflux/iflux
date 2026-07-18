/* iFlux Design Sandbox — audit UI (uses ds-sot-catalog.js) */
(function (global) {
  'use strict';

  var C = global.IfluxDsCatalog;
  if (!C) {
    console.error('[design-sandbox] Missing ds-sot-catalog.js');
    return;
  }

  function renderCatalog(filterStatus, query) {
    var nav = document.getElementById('ds-sandbox-nav');
    var main = document.getElementById('ds-sandbox-sections');
    if (!nav || !main) return;

    var q = (query || '').toLowerCase().trim();
    var navHtml = '';
    var mainHtml = '';

    C.SECTIONS.forEach(function (sec) {
      var items = sec.items.filter(function (it) {
        if (filterStatus && filterStatus !== 'all' && it.status !== filterStatus) return false;
        if (q && it.name.toLowerCase().indexOf(q) < 0 && (it.cls || '').toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      if (!items.length) return;

      var c = C.sectionCounts({ items: items });
      navHtml += '<a href="#ds-sec-' + sec.id + '">' + C.esc(sec.title) +
        '<span class="ds-sandbox-nav__counts">' + c.ok + '/' + c.partial + '/' + c.miss + '</span></a>';

      mainHtml += '<section class="ds-sandbox-section" id="ds-sec-' + sec.id + '">' +
        '<div class="ds-sandbox-section__head">' +
          '<div class="ds-sandbox-section__title">' + C.esc(sec.title) + '</div>' +
          '<div class="ds-sandbox-section__meta">' + C.esc(sec.spec) + ' · ' + items.length + ' mục</div>' +
        '</div>' +
        items.map(C.renderItem).join('') +
        '</section>';
    });

    nav.innerHTML = navHtml || '<p style="padding:10px;font-size:12px;color:var(--ix-text-muted)">Không có kết quả.</p>';
    main.innerHTML = mainHtml || '<p style="color:var(--ix-text-muted)">Không có mục phù hợp bộ lọc.</p>';

    main.querySelectorAll('.ds-sandbox-item__head').forEach(function (head) {
      head.addEventListener('click', function () {
        head.parentElement.classList.toggle('is-open');
      });
    });
  }

  function updateStats() {
    var c = C.countAll();
    var el;
    el = document.getElementById('ds-stat-total'); if (el) el.textContent = c.total;
    el = document.getElementById('ds-stat-ok'); if (el) el.textContent = c.ok;
    el = document.getElementById('ds-stat-partial'); if (el) el.textContent = c.partial;
    el = document.getElementById('ds-stat-miss'); if (el) el.textContent = c.miss;
  }

  function init() {
    updateStats();
    var filter = 'all';
    var searchInput = document.getElementById('ds-sandbox-search');

    function apply() {
      renderCatalog(filter, searchInput ? searchInput.value : '');
    }

    document.querySelectorAll('[data-ds-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        filter = btn.getAttribute('data-ds-filter');
        document.querySelectorAll('[data-ds-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        apply();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', apply);
    }

    apply();

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('#ds-sandbox-nav a');
      if (!a) return;
      document.querySelectorAll('#ds-sandbox-nav a').forEach(function (x) { x.classList.remove('is-active'); });
      a.classList.add('is-active');
    });
  }

  global.IfluxDesignSandbox = {
    init: init,
    SECTIONS: C.SECTIONS,
    GAPS: C.GAPS,
    countAll: C.countAll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
