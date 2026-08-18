/* iFlux DS Studio — danh sách TRANG (không chia MODULE) */
(function (global) {
  'use strict';

  var C = global.IfluxDsCatalog;
  var Studio = global.IfluxDsStudio;
  var PC = global.IfluxDsPrimitiveCatalog;
  var PtStudio = global.IfluxDsPrimitiveStudio;
  var Fdn = global.IfluxDsFoundationsCatalog;
  var FdnStudio = global.IfluxDsFoundationsStudio;
  var Ico = global.IfluxDsIconsCatalog;
  var IcoStudio = global.IfluxDsIconsStudio;
  var Cht = global.IfluxDsChartsCatalog;
  var ChtStudio = global.IfluxDsChartsStudio;
  var Dt = global.IfluxDsDesignTokensCatalog;
  var DtStudio = global.IfluxDsDesignTokensStudio;
  var At = global.IfluxDsAtomsCatalog;
  var AtStudio = global.IfluxDsAtomsStudio;
  var It = global.IfluxDsItemsCatalog;
  var ItStudio = global.IfluxDsItemsStudio;
  var Blk = global.IfluxDsBlocksCatalog;
  var BlkStudio = global.IfluxDsBlocksStudio;
  var Crd = global.IfluxDsCardsCatalog;
  var CrdStudio = global.IfluxDsCardsStudio;
  var Roadmap = global.IfluxDsRoadmap;

  if (!C || !Studio) {
    console.error('[ds-sot] Missing ds-sot-catalog.js or ds-sot-studio.js');
    return;
  }

  var PAGE_ICONS = {
    'primitive-tokens': 'ti-palette',
    foundations: 'ti-layers-linked',
    'design-tokens': 'ti-adjustments',
    icons: 'ti-icons',
    charts: 'ti-chart-bar',
    atoms: 'ti-box',
    items: 'ti-list',
    blocks: 'ti-layout-grid',
    cards: 'ti-id',
    organisms: 'ti-components',
    sections: 'ti-layout-board',
    widgets: 'ti-app-window',
    'business-objects': 'ti-building-bank',
    'user-flows': 'ti-route'
  };

  var state = { page: '', filter: 'all', query: '' };

  function getPageMeta(id) {
    if (!Roadmap || !Roadmap.PAGES) return null;
    return Roadmap.PAGES.find(function (p) { return p.id === id; }) || null;
  }

  function isActivePage(id) {
    var meta = getPageMeta(id);
    return meta && meta.status === 'active';
  }

  function filterPrimitiveGroups() {
    var q = state.query;
    if (!PC || !q) return PC.PAGE.groups;
    return PC.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (it) {
        var hay = (it.name + ' ' + it.property + ' ' + it.token + ' ' + it.value + ' ' + g.title).toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterFoundationGroups() {
    var q = state.query;
    if (!Fdn || !q) return Fdn.PAGE.groups;
    return Fdn.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id).toLowerCase();
        b.properties.forEach(function (p) {
          hay += ' ' + p.property + ' ' + p.token;
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterIconGroups() {
    var q = state.query;
    if (!Ico || !q) return Ico.PAGE.groups;
    return Ico.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (it) {
        var hay = (it.name + ' ' + it.token + ' ' + it.value + ' ' + it.slug + ' ' + g.title).toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterChartGroups() {
    var q = state.query;
    if (!Cht || !q) return Cht.PAGE.groups;
    return Cht.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id + (b.typeId || '')).toLowerCase();
        b.properties.forEach(function (p) {
          hay += ' ' + p.property + ' ' + p.token;
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, kind: g.kind, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterDesignTokenGroups() {
    var q = state.query;
    if (!Dt || !q) return Dt.PAGE.groups;
    return Dt.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id + ' ' + (b.tier || '')).toLowerCase();
        b.properties.forEach(function (p) {
          hay += ' ' + (p.logicalId || '') + ' ' + p.property + ' ' + p.token + ' ' + (p.variable || '');
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, tier: g.tier, note: g.note, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterAtomGroups() {
    var q = state.query;
    if (!At || !q) return At.PAGE.groups;
    return At.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id + ' ' + b.className + ' ' + b.logicalId + ' ' + (b.surface || '')).toLowerCase();
        b.properties.forEach(function (p) {
          hay += ' ' + p.key + ' ' + p.token + ' ' + (p.variable || '');
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, note: g.note, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterItemGroups() {
    var q = state.query;
    if (!It || !q) return It.PAGE.groups;
    return It.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id + ' ' + b.className + ' ' + b.logicalId + ' ' + (b.surface || '') + ' ' + (b.anatomy || '')).toLowerCase();
        (b.slots || []).forEach(function (s) {
          hay += ' ' + s.id + ' ' + s.label + ' ' + (s.atom || '');
        });
        b.properties.forEach(function (p) {
          hay += ' ' + p.key + ' ' + p.token + ' ' + (p.variable || '');
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, note: g.note, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterBlockGroups() {
    var q = state.query;
    if (!Blk || !q) return Blk.PAGE.groups;
    return Blk.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id + ' ' + (b.blockId || '') + ' ' + (b.templateId || '') +
          ' ' + b.logicalId + ' ' + (b.className || '') + ' ' + (b.cardRef || '') + ' ' + (b.anatomy || '') + ' ' + (b.regions || '')).toLowerCase();
        (b.composition || []).forEach(function (c) {
          hay += ' ' + c.slot + ' ' + c.label + ' ' + (c.ref || '');
        });
        (b.productRefs || b.widgetRefs || []).forEach(function (w) { hay += ' ' + w; });
        b.properties.forEach(function (p) {
          hay += ' ' + p.key + ' ' + p.token + ' ' + (p.variable || '');
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, note: g.note, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function filterCardGroups() {
    var q = state.query;
    if (!Crd || !q) return Crd.PAGE.groups;
    return Crd.PAGE.groups.map(function (g) {
      var items = g.items.filter(function (b) {
        var hay = (b.name + ' ' + g.title + ' ' + b.id + ' ' + (b.cardId || '') +
          ' ' + b.logicalId + ' ' + (b.className || '') + ' ' + (b.anatomy || '') +
          ' ' + (b.structure || '') + ' ' + (b.regions || '') + ' ' + (b.note || '')).toLowerCase();
        (b.blockRefs || []).forEach(function (br) { hay += ' ' + br; });
        (b.productRefs || b.widgetRefs || []).forEach(function (w) { hay += ' ' + w; });
        b.properties.forEach(function (p) {
          hay += ' ' + p.key + ' ' + p.token + ' ' + (p.variable || '');
        });
        return hay.indexOf(q) >= 0;
      });
      return { title: g.title, note: g.note, items: items };
    }).filter(function (g) { return g.items.length > 0; });
  }

  function setActiveMenu(pageId) {
    document.querySelectorAll('[data-ds-module]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-ds-module') === pageId);
    });
  }

  function buildSidebar() {
    var navPages = document.getElementById('ds-sot-pages-nav');
    var navLegacy = document.getElementById('ds-sot-modules');
    if (!navPages || !Roadmap) return;

    navPages.innerHTML = Roadmap.PAGES.map(function (pg) {
      var icon = PAGE_ICONS[pg.id] || 'ti-file';
      var cls = 'ix-menu-item' + (pg.status === 'planned' ? ' ds-roadmap-item--planned' : '');
      var badge = pg.status === 'planned'
        ? 'soon'
        : (pg.id === 'primitive-tokens' && PC ? String(PC.pageCounts().total)
          : pg.id === 'foundations' && Fdn ? String(Fdn.pageCounts().total)
          : pg.id === 'design-tokens' && Dt ? String(Dt.pageCounts().total)
          : pg.id === 'atoms' && At ? String(At.pageCounts().total)
          : pg.id === 'items' && It ? String(It.pageCounts().total)
          : pg.id === 'blocks' && Blk ? String(Blk.pageCounts().total)
          : pg.id === 'cards' && Crd ? String(Crd.pageCounts().total)
          : pg.id === 'icons' && Ico ? String(Ico.pageCounts().total)
          : pg.id === 'charts' && Cht ? String(Cht.pageCounts().total) : '·');
      var label = pg.title;
      if (pg.subtitle) label += ' (' + pg.subtitle + ')';
      return '<a href="#page-' + pg.id + '" class="' + cls + '" data-ds-module="' + pg.id + '">' +
        '<i class="ti ' + icon + ' ix-menu-icon"></i>' +
        '<span class="ix-menu-label">' + Roadmap.esc(label) + '</span>' +
        '<span class="ix-menu-badge' + (pg.status === 'planned' ? ' ds-roadmap-badge--soon' : '') + '">' + badge + '</span>' +
      '</a>';
    }).join('');

    if (navLegacy) {
      navLegacy.innerHTML = C.SECTIONS.map(function (sec) {
        return '<a href="#mod-' + sec.id + '" class="ix-menu-item" data-ds-module="tax-' + sec.id + '">' +
          '<i class="ti ti-box ix-menu-icon"></i><span class="ix-menu-label">' + C.esc(sec.title.replace(/^\d+\s/, '')) + '</span>' +
          '<span class="ix-menu-badge">' + sec.items.length + '</span></a>';
      }).join('');
    }
  }

  function renderOverview() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel) return;

    var cards = Roadmap ? Roadmap.PAGES.map(function (pg) {
      var meta = pg.status === 'active' ? 'Đang có trong Studio' : 'Roadmap — sắp có';
      var count = pg.id === 'primitive-tokens' && PC ? (' · ' + PC.pageCounts().total + ' token')
        : pg.id === 'foundations' && Fdn ? (' · ' + Fdn.pageCounts().total + ' mục')
        : pg.id === 'design-tokens' && Dt ? (' · ' + Dt.pageCounts().total + ' token')
        : pg.id === 'atoms' && At ? (' · ' + At.pageCounts().total + ' atom')
        : pg.id === 'items' && It ? (' · ' + It.pageCounts().total + ' item')
        : pg.id === 'blocks' && Blk ? (' · ' + Blk.pageCounts().total + ' block')
        : pg.id === 'cards' && Crd ? (' · ' + Crd.pageCounts().total + ' card')
        : pg.id === 'icons' && Ico ? (' · ' + Ico.pageCounts().total + ' icon')
        : pg.id === 'charts' && Cht ? (' · ' + Cht.pageCounts().total + ' quy tắc') : '';
      return '<a href="#page-' + pg.id + '" class="ds-sot-mod-card' + (pg.status === 'planned' ? ' ds-roadmap-card--planned' : '') + '" data-ds-goto="' + pg.id + '">' +
        '<div class="ds-sot-mod-card__id">' + pg.num + '</div>' +
        '<div class="ds-sot-mod-card__title">' + Roadmap.esc(pg.title) + '</div>' +
        '<div class="ds-sot-mod-card__meta">' + meta + count + '</div></a>';
    }).join('') : '';

    panel.innerHTML =
      '<h1 class="ix-page-title">Tổng quan Design System</h1>' +
      '<p class="ds-sot-lead">Mỗi mục = một <strong>TRANG</strong> · Component UI thuần (không gồm Widget — xem Product bên dưới)</p>' +
      '<div class="ds-sot-overview-grid">' + cards + '</div>' +
      (Roadmap.PRODUCT_LINKS && Roadmap.PRODUCT_LINKS.length
        ? '<div class="ds-sot-product-links"><h2 class="ds-ref-section__title">Product Architecture <span class="ds-ref-section__count">' +
          Roadmap.PRODUCT_LINKS.length + '</span></h2><div class="ds-sot-product-links__grid">' +
          Roadmap.PRODUCT_LINKS.map(function (link) {
            return '<a href="' + Roadmap.esc(link.href) + '" class="ds-sot-mod-card ds-sot-mod-card--product">' +
              '<div class="ds-sot-mod-card__title">' + Roadmap.esc(link.title) + '</div>' +
              '<div class="ds-sot-mod-card__meta">' + Roadmap.esc(link.note) + '</div></a>';
          }).join('') + '</div></div>'
        : '');

    panel.querySelectorAll('[data-ds-goto]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(card.getAttribute('data-ds-goto'));
      });
    });
  }

  function renderPlannedPage(id) {
    var panel = document.getElementById('ds-sot-panel');
    var meta = getPageMeta(id);
    if (!panel || !meta) return;
    document.title = meta.title + ' · iFlux DS Studio';
    panel.innerHTML =
      '<div class="ds-pt-page">' +
        '<h1 class="ix-page-title">' + Roadmap.esc(meta.num + ' · ' + meta.title) + '</h1>' +
        '<div class="ix-alert ix-alert-warning">' +
          '<i class="ti ti-clock"></i>' +
          '<div><div class="ix-alert-title">Trang đang roadmap</div>' +
          '<p>Chưa migrate vào Studio. Ưu tiên hoàn thiện <strong>01 Primitive Tokens</strong> trước.</p></div>' +
        '</div></div>';
  }

  function renderPrimitivePage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !PC || !PtStudio) return;

    document.title = 'Primitive Tokens · iFlux DS Studio';

    var groups = filterPrimitiveGroups();
    var pageCopy = {
      id: PC.PAGE.id,
      file: PC.PAGE.file,
      groups: groups
    };

    panel.innerHTML = PtStudio.renderPage(pageCopy);
    PtStudio.bindPage(panel, pageCopy);
  }

  function renderFoundationsPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !Fdn || !FdnStudio) return;

    document.title = 'Foundations · iFlux DS Studio';

    var sync = FdnStudio.syncPrimitiveOverrides ? FdnStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterFoundationGroups();
      var pageCopy = { id: Fdn.PAGE.id, file: Fdn.PAGE.file, groups: groups };
      panel.innerHTML = FdnStudio.renderPage(pageCopy);
      FdnStudio.bindPage(panel, pageCopy);
    });
  }

  function renderIconsPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !Ico || !IcoStudio) return;

    document.title = 'Icons · iFlux DS Studio';

    var groups = filterIconGroups();
    var pageCopy = { id: Ico.PAGE.id, file: Ico.PAGE.file, groups: groups };
    panel.innerHTML = IcoStudio.renderPage(pageCopy);
    IcoStudio.bindPage(panel, pageCopy);
  }

  function renderAtomsPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !At || !AtStudio) return;

    document.title = 'Atoms · iFlux DS Studio';

    var sync = AtStudio.syncPrimitiveOverrides ? AtStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterAtomGroups();
      var pageCopy = { id: At.PAGE.id, file: At.PAGE.file, groups: groups };
      panel.innerHTML = AtStudio.renderPage(pageCopy);
      AtStudio.bindPage(panel, pageCopy);
    });
  }

  function renderItemsPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !It || !ItStudio) return;

    document.title = 'Items · iFlux DS Studio';

    var sync = ItStudio.syncPrimitiveOverrides ? ItStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterItemGroups();
      var pageCopy = { id: It.PAGE.id, file: It.PAGE.file, groups: groups };
      panel.innerHTML = ItStudio.renderPage(pageCopy);
      ItStudio.bindPage(panel, pageCopy);
    });
  }

  function renderBlocksPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !Blk || !BlkStudio) return;

    document.title = 'Blocks · iFlux DS Studio';

    var sync = BlkStudio.syncPrimitiveOverrides ? BlkStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterBlockGroups();
      var pageCopy = { id: Blk.PAGE.id, file: Blk.PAGE.file, groups: groups };
      panel.innerHTML = BlkStudio.renderPage(pageCopy);
      BlkStudio.bindPage(panel, pageCopy);
    });
  }

  function renderCardsPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !Crd || !CrdStudio) return;

    document.title = 'Cards · iFlux DS Studio';

    var sync = CrdStudio.syncPrimitiveOverrides ? CrdStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterCardGroups();
      var pageCopy = { id: Crd.PAGE.id, file: Crd.PAGE.file, groups: groups };
      panel.innerHTML = CrdStudio.renderPage(pageCopy);
      CrdStudio.bindPage(panel, pageCopy);
    });
  }

  function renderDesignTokensPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !Dt || !DtStudio) return;

    document.title = 'Design Tokens · iFlux DS Studio';

    var sync = DtStudio.syncPrimitiveOverrides ? DtStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterDesignTokenGroups();
      var pageCopy = { id: Dt.PAGE.id, file: Dt.PAGE.file, groups: groups };
      panel.innerHTML = DtStudio.renderPage(pageCopy);
      DtStudio.bindPage(panel, pageCopy);
    });
  }

  function renderChartsPage() {
    var panel = document.getElementById('ds-sot-panel');
    if (!panel || !Cht || !ChtStudio) return;

    document.title = 'Charts · iFlux DS Studio';

    var sync = ChtStudio.syncPrimitiveOverrides ? ChtStudio.syncPrimitiveOverrides() : Promise.resolve();
    sync.then(function () {
      var groups = filterChartGroups();
      var pageCopy = { id: Cht.PAGE.id, file: Cht.PAGE.file, groups: groups };
      panel.innerHTML = ChtStudio.renderPage(pageCopy);
      ChtStudio.bindPage(panel, pageCopy);
    });
  }

  function renderTaxModule(id) {
    var panel = document.getElementById('ds-sot-panel');
    var sec = C.SECTIONS.find(function (s) { return s.id === id; });
    if (!panel || !sec) { renderOverview(); return; }

    document.title = sec.title + ' · iFlux DS Studio';
    var items = sec.items.filter(function (it) {
      if (!state.query) return true;
      var hay = (it.name + ' ' + (it.cls || '')).toLowerCase();
      return hay.indexOf(state.query) >= 0;
    });

    panel.innerHTML =
      '<div class="ds-sot-module__head">' +
        '<div class="ds-sot-module__title">' + C.esc(sec.title) + '</div>' +
        '<div class="ds-sot-module__meta">Legacy taxonomy · ' + items.length + ' mục</div>' +
      '</div>' +
      (items.length
        ? items.map(function (it) { return Studio.renderStudio(sec.id, it); }).join('')
        : '<div class="ds-sot-empty">Không có mục phù hợp.</div>');

    Studio.bindAll(panel, sec.id, items);
  }

  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (h === 'overview' || h === '') return { type: 'overview' };
    var pm = h.match(/^page-(.+)$/);
    if (pm) return { type: 'page', id: pm[1] };
    var tm = h.match(/^mod-(\d{2})$/);
    if (tm) return { type: 'tax', id: tm[1] };
    return { type: 'overview' };
  }

  function navigate(pageId, push) {
    state.page = pageId || '';
    if (push !== false && pageId) {
      var hash = pageId.indexOf('tax-') === 0 ? '#mod-' + pageId.replace('tax-', '') : '#page-' + pageId;
      if (location.hash !== hash) location.hash = hash;
    }
    if (!pageId) {
      if (push !== false) location.hash = '#overview';
      setActiveMenu('overview');
      renderOverview();
      return;
    }

    if (pageId.indexOf('tax-') === 0) {
      setActiveMenu(pageId);
      renderTaxModule(pageId.replace('tax-', ''));
      return;
    }

    setActiveMenu(pageId);
    if (pageId === 'primitive-tokens') {
      renderPrimitivePage();
    } else if (pageId === 'foundations') {
      renderFoundationsPage();
    } else if (pageId === 'design-tokens') {
      renderDesignTokensPage();
    } else if (pageId === 'atoms') {
      renderAtomsPage();
    } else if (pageId === 'items') {
      renderItemsPage();
    } else if (pageId === 'blocks') {
      renderBlocksPage();
    } else if (pageId === 'cards') {
      renderCardsPage();
    } else if (pageId === 'icons') {
      renderIconsPage();
    } else if (pageId === 'charts') {
      renderChartsPage();
    } else {
      renderPlannedPage(pageId);
    }
  }

  function init() {
    var loaders = [Studio.loadServerOverrides()];
    if (PtStudio) loaders.push(PtStudio.loadServerOverrides());
    if (FdnStudio) loaders.push(FdnStudio.loadServerOverrides());
    if (DtStudio) loaders.push(DtStudio.loadServerOverrides());
    if (AtStudio) loaders.push(AtStudio.loadServerOverrides());
    if (ItStudio) loaders.push(ItStudio.loadServerOverrides());
    if (BlkStudio) loaders.push(BlkStudio.loadServerOverrides());
    if (CrdStudio) loaders.push(CrdStudio.loadServerOverrides());
    if (ChtStudio) loaders.push(ChtStudio.loadServerOverrides());

    Promise.all(loaders).then(function () {
      buildSidebar();

      var searchInput = document.getElementById('ds-sot-search');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          state.query = searchInput.value.toLowerCase().trim();
          var parsed = parseHash();
          if (parsed.type === 'page' && parsed.id === 'primitive-tokens') renderPrimitivePage();
          else if (parsed.type === 'page' && parsed.id === 'foundations') renderFoundationsPage();
          else if (parsed.type === 'page' && parsed.id === 'design-tokens') renderDesignTokensPage();
          else if (parsed.type === 'page' && parsed.id === 'atoms') renderAtomsPage();
          else if (parsed.type === 'page' && parsed.id === 'items') renderItemsPage();
          else if (parsed.type === 'page' && parsed.id === 'blocks') renderBlocksPage();
          else if (parsed.type === 'page' && parsed.id === 'cards') renderCardsPage();
          else if (parsed.type === 'page' && parsed.id === 'icons') renderIconsPage();
          else if (parsed.type === 'page' && parsed.id === 'charts') renderChartsPage();
          else if (parsed.type === 'tax') renderTaxModule(parsed.id);
          else if (parsed.type === 'overview') renderOverview();
        });
      }

      document.querySelectorAll('[data-ds-module]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          var mid = link.getAttribute('data-ds-module');
          if (mid === 'overview') navigate('');
          else navigate(mid);
        });
      });

      window.addEventListener('hashchange', function () {
        var parsed = parseHash();
        if (parsed.type === 'overview') navigate('');
        else if (parsed.type === 'page') navigate(parsed.id, false);
        else if (parsed.type === 'tax') navigate('tax-' + parsed.id, false);
      });

      var parsed = parseHash();
      if (parsed.type === 'page') navigate(parsed.id, false);
      else if (parsed.type === 'tax') navigate('tax-' + parsed.id, false);
      else navigate('primitive-tokens', false);
    });
  }

  global.IfluxDsSot = { navigate: navigate, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
