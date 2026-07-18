/**
 * Admin — Quyền sử dụng: Trang & Menu · Widget/Block · Giới hạn
 */
(function (global) {
  'use strict';

  var Cat = global.EntitlementCatalog;
  var ACTIVE_TAB = 'ent-pages';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function groupItems(items, key) {
    var groups = {};
    items.forEach(function (item) {
      var g = item[key] || 'Khác';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return groups;
  }

  function currentTier() {
    var el = document.getElementById('field-tier');
    return (el && el.value) ? String(el.value).toLowerCase() : 'free';
  }

  function styles() {
    return (
      '<style>' +
        '.ifx-ent-root{display:flex;flex-direction:column;gap:16px}' +
        '.ifx-ent-intro{font-size:12px;color:var(--ix-text-muted);line-height:1.55;padding:10px 14px;border-radius:8px;background:var(--ix-bg-subtle);border-left:3px solid var(--ix-accent)}' +
        '.ifx-ent-tabs{display:flex;flex-direction:row;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--ix-border);padding-bottom:12px}' +
        '.ifx-ent-tab{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid var(--ix-border);border-radius:8px;background:var(--ix-bg-card);font-size:13px;font-weight:500;color:var(--ix-text-secondary);cursor:pointer;transition:all .15s}' +
        '.ifx-ent-tab:hover{border-color:var(--ix-accent);color:var(--ix-text-primary)}' +
        '.ifx-ent-tab.active{background:var(--ix-accent);border-color:var(--ix-accent);color:#fff}' +
        '.ifx-ent-tab.active i{color:#fff}' +
        '.ifx-ent-coverage{padding:10px 14px;border-radius:8px;background:var(--ix-bg-subtle);font-size:12px;color:var(--ix-text-muted);line-height:1.5}' +
        '.ifx-ent-coverage strong{color:var(--ix-text-primary)}' +
        '.ifx-ent-panel{display:none}' +
        '.ifx-ent-panel.active{display:block}' +
        '.ifx-ent-group{margin-bottom:20px}' +
        '.ifx-ent-group__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px}' +
        '.ifx-ent-group__title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--ix-text-muted)}' +
        '.ifx-ent-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}' +
        '.ifx-ent-tile{position:relative;display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--ix-border);border-radius:10px;background:var(--ix-bg-card);cursor:pointer;transition:border-color .15s,box-shadow .15s,background .15s;min-height:88px;user-select:none}' +
        '.ifx-ent-tile:hover{border-color:rgba(var(--ix-accent-rgb,105,108,255),.45)}' +
        '.ifx-ent-tile.is-on{border-color:var(--ix-accent);background:rgba(var(--ix-accent-rgb,105,108,255),.06);box-shadow:0 0 0 1px var(--ix-accent)}' +
        '.ifx-ent-tile.is-locked{opacity:.55;cursor:not-allowed;background:var(--ix-bg-subtle)}' +
        '.ifx-ent-tile.is-locked:hover{border-color:var(--ix-border)}' +
        '.ifx-ent-tile__label{font-size:13px;font-weight:600;color:var(--ix-text-primary);line-height:1.35;padding-right:22px}' +
        '.ifx-ent-tile__hint{font-size:11px;color:var(--ix-text-muted);line-height:1.4}' +
        '.ifx-ent-tile__meta{font-size:10px;color:var(--ix-text-muted);margin-top:auto}' +
        '.ifx-ent-tile__badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;margin-top:4px;width:fit-content}' +
        '.ifx-ent-tile__badge--widget{background:rgba(105,108,255,.12);color:var(--ix-accent)}' +
        '.ifx-ent-tile__badge--page{background:rgba(40,199,111,.12);color:var(--ix-success)}' +
        '.ifx-ent-tile__mark{position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:50%;border:1px solid var(--ix-border);display:flex;align-items:center;justify-content:center;font-size:12px;color:transparent;transition:all .15s}' +
        '.ifx-ent-tile.is-on .ifx-ent-tile__mark{background:var(--ix-accent);border-color:var(--ix-accent);color:#fff}' +
        '.ifx-ent-tile input[type=checkbox]{position:absolute;opacity:0;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}' +
        '.ifx-ent-toolbar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}' +
        '.ifx-ent-limits-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}' +
        '.ifx-ent-limit-tile{padding:12px 14px;border:1px solid var(--ix-border);border-radius:10px;background:var(--ix-bg-card)}' +
        '.ifx-ent-limit-tile .ix-label{margin-bottom:6px;font-size:12px}' +
        '.ifx-ent-limit-tile .ix-input{font-size:14px;font-weight:600}' +
      '</style>'
    );
  }

  function switchTab(tabId) {
    ACTIVE_TAB = tabId;
    document.querySelectorAll('[data-ifx-ent-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-ifx-ent-tab') === tabId);
    });
    document.querySelectorAll('.ifx-ent-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  function initTabs(root) {
    root.querySelectorAll('[data-ifx-ent-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-ifx-ent-tab'));
      });
    });
    switchTab(ACTIVE_TAB);
  }

  function syncTile(cb) {
    var tile = cb.closest('.ifx-ent-tile');
    if (!tile) return;
    tile.classList.toggle('is-on', cb.checked);
    tile.setAttribute('aria-checked', cb.checked ? 'true' : 'false');
  }

  function bindTileToggle(root, selector, onChange) {
    root.querySelectorAll(selector).forEach(function (tile) {
      if (tile.classList.contains('is-locked')) return;
      var cb = tile.querySelector('input[type=checkbox]');
      if (!cb || cb.disabled) return;
      function sync() { syncTile(cb); if (onChange) onChange(); }
      function toggle() { cb.checked = !cb.checked; sync(); }
      tile.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      cb.addEventListener('change', sync);
      sync();
    });
  }

  function pageTile(p) {
    var locked = currentTier() === 'guest' && p.guestNever;
    return (
      '<div class="ifx-ent-tile' + (locked ? ' is-locked' : '') + '" data-ifx-ent-tile role="checkbox" tabindex="' + (locked ? '-1' : '0') + '" aria-checked="false">' +
        '<input type="checkbox" tabindex="-1" aria-hidden="true" data-ent-page="' + esc(p.key) + '"' + (locked ? ' disabled' : '') + ' />' +
        '<span class="ifx-ent-tile__mark"><i class="ti ti-check"></i></span>' +
        '<span class="ifx-ent-tile__label"><i class="ti ' + esc(p.icon || 'ti-file') + '" style="margin-right:4px"></i>' + esc(p.label) + '</span>' +
        '<span class="ifx-ent-tile__hint">' + esc(p.hint || '') + '</span>' +
        (locked ? '<span class="ifx-ent-tile__meta" style="color:var(--ix-danger)">Vãng lai không có menu này</span>' : '') +
      '</div>'
    );
  }

  function blockTile(b) {
    var badge = b.kind === 'widget'
      ? '<span class="ifx-ent-tile__badge ifx-ent-tile__badge--widget">Widget · ' + esc(b.page) + '</span>'
      : '<span class="ifx-ent-tile__badge ifx-ent-tile__badge--page">Block trang · ' + esc(b.page) + '</span>';
    return (
      '<div class="ifx-ent-tile" data-ifx-ent-tile role="checkbox" tabindex="0" aria-checked="false">' +
        '<input type="checkbox" tabindex="-1" aria-hidden="true" data-ent-block="' + esc(b.id) + '" />' +
        '<span class="ifx-ent-tile__mark"><i class="ti ti-check"></i></span>' +
        '<span class="ifx-ent-tile__label">' + esc(b.label) + '</span>' +
        badge +
        '<span class="ifx-ent-tile__meta">' + esc(b.id) + '</span>' +
      '</div>'
    );
  }

  function renderMount(root) {
    if (!root || !Cat) return;
    root.innerHTML =
      styles() +
      '<div class="ifx-ent-root">' +
        '<div class="ifx-ent-intro">' +
          '<strong>Mô hình phân quyền (GĐ1):</strong> ' +
          '<em>Tab 1 — Trang &amp; Menu</em> = khung nội dung mặc định (không thuộc thư viện Widget). User vãng lai thấy các trang được bật ở đây. ' +
          '<em>Tab 2 — Widget &amp; Block</em> = thư viện hệ thống (WGT-* dashboard · BLK-* trên trang) — sườn chính cấp quyền tiện ích. Vãng lai chỉ thấy block được bật tường minh. ' +
          'Menu hiển thị khi trang được bật <strong>hoặc</strong> có ≥1 block thuộc trang đó. <strong>Nhà của tôi</strong> luôn ẩn với vãng lai.' +
        '</div>' +
        '<div class="ifx-ent-tabs">' +
          '<button type="button" class="ifx-ent-tab active" data-ifx-ent-tab="ent-pages"><i class="ti ti-layout-navbar"></i> Trang &amp; Menu</button>' +
          '<button type="button" class="ifx-ent-tab" data-ifx-ent-tab="ent-blocks"><i class="ti ti-layout-grid"></i> Widget &amp; Block</button>' +
          '<button type="button" class="ifx-ent-tab" data-ifx-ent-tab="ent-limits"><i class="ti ti-gauge"></i> Giới hạn</button>' +
        '</div>' +
        '<div class="ifx-ent-coverage" id="ent-coverage"></div>' +
        '<div class="ifx-ent-panels">' +
          '<div id="ent-pages" class="ifx-ent-panel active"></div>' +
          '<div id="ent-blocks" class="ifx-ent-panel"></div>' +
          '<div id="ent-limits" class="ifx-ent-panel"></div>' +
        '</div>' +
      '</div>';

    renderPages(document.getElementById('ent-pages'));
    renderBlocks(document.getElementById('ent-blocks'));
    renderLimits(document.getElementById('ent-limits'));
    initTabs(root);
    updateCoverage();
  }

  function renderPages(panel) {
    if (!panel || !Cat) return;
    var menuPages = Cat.PAGES.filter(function (p) { return p.menu; });
    panel.innerHTML =
      '<div class="ifx-ent-group">' +
        '<div class="ifx-ent-group__head"><span class="ifx-ent-group__title">Menu công khai / trang mặc định</span></div>' +
        '<div class="ifx-ent-tiles">' + menuPages.map(pageTile).join('') + '</div>' +
      '</div>';
    bindTileToggle(panel, '[data-ifx-ent-tile]', updateCoverage);
  }

  function renderBlocks(panel) {
    if (!panel || !Cat) return;
    var toolbar =
      '<div class="ifx-ent-toolbar">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ent-blocks-all="1">Bật tất cả</button>' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ent-blocks-none="1">Tắt tất cả</button>' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ent-blocks-default="1">Mặc định theo tier</button>' +
      '</div>';
    var groups = groupItems(Cat.BLOCKS, 'group');
    panel.innerHTML = toolbar + Object.keys(groups).map(function (gName) {
      return '<div class="ifx-ent-group" data-ent-group="blocks">' +
        '<div class="ifx-ent-group__head"><span class="ifx-ent-group__title">' + esc(gName) + '</span>' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ent-select-group="blocks">Chọn cả nhóm</button></div>' +
        '<div class="ifx-ent-tiles">' + groups[gName].map(blockTile).join('') + '</div></div>';
    }).join('');

    function setAllBlocks(checked) {
      panel.querySelectorAll('input[data-ent-block]').forEach(function (cb) {
        cb.checked = checked;
        syncTile(cb);
      });
      updateCoverage();
    }

    var allBtn = panel.querySelector('[data-ent-blocks-all]');
    if (allBtn) allBtn.addEventListener('click', function (e) { e.preventDefault(); setAllBlocks(true); });
    var noneBtn = panel.querySelector('[data-ent-blocks-none]');
    if (noneBtn) noneBtn.addEventListener('click', function (e) { e.preventDefault(); setAllBlocks(false); });
    var defBtn = panel.querySelector('[data-ent-blocks-default]');
    if (defBtn) {
      defBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var defaults = Cat.defaultBlocksForTier(currentTier());
        panel.querySelectorAll('input[data-ent-block]').forEach(function (cb) {
          cb.checked = !!defaults[cb.getAttribute('data-ent-block')];
          syncTile(cb);
        });
        updateCoverage();
      });
    }
    panel.querySelectorAll('[data-ent-select-group]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var group = btn.closest('.ifx-ent-group');
        if (!group) return;
        group.querySelectorAll('input[data-ent-block]').forEach(function (cb) {
          cb.checked = true;
          syncTile(cb);
        });
        updateCoverage();
      });
    });
    bindTileToggle(panel, '[data-ifx-ent-tile]', updateCoverage);
  }

  function renderLimits(panel) {
    if (!panel || !Cat) return;
    panel.innerHTML =
      '<div class="ifx-ent-limits-grid">' +
        Cat.LIMITS.map(function (lim) {
          return '<div class="ifx-ent-limit-tile">' +
            '<label class="ix-label">' + esc(lim.label) + ' <span style="font-weight:400;color:var(--ix-text-muted)">(' + esc(lim.unit) + ')</span></label>' +
            '<input type="number" class="ix-input" data-ent-limit="' + esc(lim.key) + '" min="' + (lim.min || 0) + '" step="' + (lim.step || 1) + '" />' +
          '</div>';
        }).join('') +
      '</div>';
  }

  function updateCoverage() {
    var el = document.getElementById('ent-coverage');
    if (!el || !Cat) return;
    var collected = collect();
    var plan = { tier: currentTier(), pages: collected.pages, blocks: collected.blocks, limits: collected.limits, ent: collected.ent };
    plan = Cat.normalizePlan(plan);
    var visibleMenus = Cat.PAGES.filter(function (p) {
      if (!p.menu) return false;
      if (p.guestNever && plan.tier === 'guest') return false;
      if (plan.pages[p.key]) return true;
      return Cat.BLOCKS.some(function (b) {
        return b.page === p.key && plan.blocks[b.id];
      });
    }).length;
    var menuTotal = Cat.PAGES.filter(function (p) { return p.menu && !(p.guestNever && plan.tier === 'guest'); }).length;
    var sum = Cat.coverageSummary(plan);
    el.innerHTML = 'Menu thực tế: <strong>' + visibleMenus + ' / ' + menuTotal + '</strong> · Block: <strong>' + esc(sum.blocks) + '</strong> · Giới hạn: <strong>' + esc(sum.limits) + '</strong>';
  }

  function collect() {
    var pages = {};
    document.querySelectorAll('[data-ent-page]').forEach(function (cb) {
      pages[cb.getAttribute('data-ent-page')] = cb.checked;
    });
    var blocks = {};
    document.querySelectorAll('[data-ent-block]').forEach(function (cb) {
      blocks[cb.getAttribute('data-ent-block')] = cb.checked;
    });
    var limits = {};
    document.querySelectorAll('[data-ent-limit]').forEach(function (input) {
      limits[input.getAttribute('data-ent-limit')] = parseInt(input.value, 10) || 0;
    });
    return { pages: pages, blocks: blocks, limits: limits, ent: {} };
  }

  function fill(plan) {
    if (!Cat) return;
    plan = Cat.normalizePlan(plan || {});
    document.querySelectorAll('[data-ent-page]').forEach(function (cb) {
      var key = cb.getAttribute('data-ent-page');
      cb.checked = !!plan.pages[key];
      syncTile(cb);
    });
    document.querySelectorAll('[data-ent-block]').forEach(function (cb) {
      var id = cb.getAttribute('data-ent-block');
      cb.checked = !!plan.blocks[id];
      syncTile(cb);
    });
    document.querySelectorAll('[data-ent-limit]').forEach(function (input) {
      var key = input.getAttribute('data-ent-limit');
      input.value = plan.limits[key] != null ? plan.limits[key] : 0;
    });
    updateCoverage();
  }

  global.PlanEntitlementsUI = {
    render: renderMount,
    collect: collect,
    fill: fill,
    updateCoverage: updateCoverage
  };
})(window);
