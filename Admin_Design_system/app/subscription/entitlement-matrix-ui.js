/**
 * Admin — Ma trận phân quyền theo gói: Truy cập · Thao tác · Giới hạn
 */
(function (global) {
  'use strict';

  var Cat = global.EntitlementCatalog;
  var TIERS = ['guest', 'free', 'premium', 'elite'];
  var ACTIVE = 'mx-access';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function styles() {
    return (
      '<style>' +
        '.ifx-mx-root{display:flex;flex-direction:column;gap:16px}' +
        '.ifx-mx-intro{font-size:12px;color:var(--ix-text-muted);line-height:1.55;padding:10px 14px;border-radius:8px;background:var(--ix-bg-subtle);border-left:3px solid var(--ix-accent)}' +
        '.ifx-mx-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--ix-border);padding-bottom:12px}' +
        '.ifx-mx-tab{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid var(--ix-border);border-radius:8px;background:var(--ix-bg-card);font-size:13px;font-weight:500;color:var(--ix-text-secondary);cursor:pointer}' +
        '.ifx-mx-tab.active{background:var(--ix-accent);border-color:var(--ix-accent);color:#fff}' +
        '.ifx-mx-panel{display:none}.ifx-mx-panel.active{display:block}' +
        '.ifx-mx-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}' +
        '.ifx-mx-scroll{overflow:auto;border:1px solid var(--ix-border);border-radius:10px;background:var(--ix-bg-card)}' +
        '.ifx-mx-table{width:100%;border-collapse:collapse;font-size:12px;min-width:720px}' +
        '.ifx-mx-table th,.ifx-mx-table td{border-bottom:1px solid var(--ix-border);padding:8px 10px;vertical-align:middle}' +
        '.ifx-mx-table th{background:var(--ix-bg-subtle);font-weight:600;color:var(--ix-text-secondary);text-align:center;position:sticky;top:0;z-index:2}' +
        '.ifx-mx-table th.ifx-mx-tree-col{text-align:left;min-width:280px;left:0;z-index:3}' +
        '.ifx-mx-table td.ifx-mx-tree-col{text-align:left;background:var(--ix-bg-card);position:sticky;left:0;z-index:1}' +
        '.ifx-mx-table td.ifx-mx-cell{text-align:center;width:120px}' +
        '.ifx-mx-tree-row--page .ifx-mx-tree-label{font-weight:600;color:var(--ix-text-primary)}' +
        '.ifx-mx-tree-label{display:inline-flex;align-items:center;gap:6px;line-height:1.35}' +
        '.ifx-mx-tree-meta{font-size:10px;color:var(--ix-text-muted);margin-left:6px}' +
        '.ifx-mx-tree-badge{font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;text-transform:uppercase}' +
        '.ifx-mx-tree-badge--page{background:rgba(40,199,111,.12);color:var(--ix-success)}' +
        '.ifx-mx-tree-badge--tab{background:rgba(105,108,255,.12);color:var(--ix-accent)}' +
        '.ifx-mx-tree-badge--block{background:rgba(255,159,67,.12);color:#ff9f43}' +
        '.ifx-mx-tree-badge--group{background:rgba(3,195,236,.12);color:#03c3ec}' +
        '.ifx-mx-locked{color:var(--ix-text-muted);font-size:11px}' +
        '.ifx-mx-op{display:flex;flex-wrap:wrap;gap:4px 6px;justify-content:center}' +
        '.ifx-mx-op label{display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--ix-text-muted);cursor:pointer;white-space:nowrap}' +
        '.ifx-mx-op input{margin:0}' +
        '.ifx-mx-limit-input{width:72px;text-align:center;padding:4px 6px;font-size:12px;font-weight:600}' +
        '.ifx-mx-summary{font-size:12px;color:var(--ix-text-muted);padding:8px 12px;background:var(--ix-bg-subtle);border-radius:8px}' +
      '</style>'
    );
  }

  function tierHeader() {
    return TIERS.map(function (t) {
      return '<th>' + esc(Cat.TIER_LABELS[t] || t) + '</th>';
    }).join('');
  }

  function nodeBadge(node) {
    if (node.type === 'page') return '<span class="ifx-mx-tree-badge ifx-mx-tree-badge--page">Trang</span>';
    if (node.type === 'tab') return '<span class="ifx-mx-tree-badge ifx-mx-tree-badge--tab">Tab</span>';
    if (node.type === 'group') return '<span class="ifx-mx-tree-badge ifx-mx-tree-badge--group">Nhóm WL</span>';
    return '<span class="ifx-mx-tree-badge ifx-mx-tree-badge--block">Widget</span>';
  }

  function treeCell(node) {
    var pad = 8 + (node.depth || 0) * 18;
    var deploy = node.deployNote
      ? '<span class="ifx-mx-tree-meta" title="Deploy">' + esc(node.deployNote) + '</span>'
      : '';
    return (
      '<td class="ifx-mx-tree-col">' +
        '<div class="ifx-mx-tree-row ifx-mx-tree-row--' + esc(node.type) + '" style="padding-left:' + pad + 'px">' +
          '<span class="ifx-mx-tree-label"><i class="ti ' + esc(node.icon || 'ti-file') + '"></i> ' + esc(node.label) + nodeBadge(node) + '</span>' +
          (node.blockId ? '<span class="ifx-mx-tree-meta">' + esc(node.blockId) + '</span>' : '') +
          deploy +
        '</div>' +
      '</td>'
    );
  }

  function accessCell(node, tier) {
    if (node.type === 'group') {
      return '<td class="ifx-mx-cell"><span class="ifx-mx-locked">—</span></td>';
    }
    var locked = tier === 'guest' && node.guestNever;
    if (locked) {
      return '<td class="ifx-mx-cell"><span class="ifx-mx-locked">—</span></td>';
    }
    return (
      '<td class="ifx-mx-cell">' +
        '<input type="checkbox" class="ix-checkbox" data-mx-access="1" data-mx-tier="' + esc(tier) + '" data-mx-node="' + esc(node.id) + '" />' +
      '</td>'
    );
  }

  function renderAccessPanel() {
    var rows = Cat.flattenAccessTree();
    var body = rows.map(function (node) {
      return '<tr data-mx-row="' + esc(node.id) + '">' + treeCell(node) +
        TIERS.map(function (t) { return accessCell(node, t); }).join('') + '</tr>';
    }).join('');

    return (
      '<div class="ifx-mx-toolbar">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-access="defaults">Mặc định theo gói</button>' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-access="all">Bật tất cả (cột đang chọn)</button>' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-access="none">Tắt tất cả (cột đang chọn)</button>' +
        '<select class="ix-input ix-input-sm" data-mx-tier-select style="max-width:140px">' +
          TIERS.map(function (t) { return '<option value="' + t + '">' + esc(Cat.TIER_LABELS[t]) + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div class="ifx-mx-scroll"><table class="ifx-mx-table">' +
        '<thead><tr><th class="ifx-mx-tree-col">Trang → Nhóm Tầng 4 → WGT-*</th>' + tierHeader() + '</tr></thead>' +
        '<tbody>' + body + '</tbody></table></div>'
    );
  }

  function actionCell(action, tier) {
    var ops = Cat.OPERATIONS.map(function (op) {
      return (
        '<label title="' + esc(op.label) + '">' +
          '<input type="checkbox" class="ix-checkbox" data-mx-action="1" data-mx-tier="' + esc(tier) + '" data-mx-key="' + esc(action.key) + '" data-mx-op="' + esc(op.key) + '" />' +
          esc(op.label.charAt(0)) +
        '</label>'
      );
    }).join('');
    return '<td class="ifx-mx-cell"><div class="ifx-mx-op">' + ops + '</div></td>';
  }

  function renderActionsPanel() {
    var groups = {};
    Cat.ACTIONS.forEach(function (a) {
      var g = a.group || 'Khác';
      if (!groups[g]) groups[g] = [];
      groups[g].push(a);
    });

    var body = Object.keys(groups).map(function (gName) {
      var header = '<tr><td colspan="' + (TIERS.length + 1) + '" style="background:var(--ix-bg-subtle);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--ix-text-muted)">' + esc(gName) + '</td></tr>';
      var rows = groups[gName].map(function (action) {
        return '<tr><td class="ifx-mx-tree-col"><span class="ifx-mx-tree-label">' + esc(action.label) + '</span></td>' +
          TIERS.map(function (t) { return actionCell(action, t); }).join('') + '</tr>';
      }).join('');
      return header + rows;
    }).join('');

    return (
      '<div class="ifx-mx-toolbar">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-actions="defaults">Mặc định thao tác</button>' +
      '</div>' +
      '<div class="ifx-mx-scroll"><table class="ifx-mx-table">' +
        '<thead><tr><th class="ifx-mx-tree-col">Tính năng / thao tác</th>' + tierHeader() + '</tr></thead>' +
        '<tbody>' + body + '</tbody></table></div>' +
      '<p style="font-size:11px;color:var(--ix-text-muted);margin-top:8px">X · T · S · X = Xem · Thêm · Sửa · Xóa</p>'
    );
  }

  function renderLimitsPanel() {
    var body = Cat.LIMITS.map(function (lim) {
      var cells = TIERS.map(function (tier) {
        return (
          '<td class="ifx-mx-cell">' +
            '<input type="number" class="ix-input ifx-mx-limit-input" data-mx-limit="1" data-mx-tier="' + esc(tier) + '" data-mx-key="' + esc(lim.key) + '" min="' + (lim.min || 0) + '" step="' + (lim.step || 1) + '" />' +
          '</td>'
        );
      }).join('');
      return (
        '<tr><td class="ifx-mx-tree-col">' +
          '<span class="ifx-mx-tree-label">' + esc(lim.label) + '</span>' +
          '<span class="ifx-mx-tree-meta">(' + esc(lim.unit) + ')</span>' +
        '</td>' + cells + '</tr>'
      );
    }).join('');

    return (
      '<div class="ifx-mx-toolbar">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-limits="defaults">Giới hạn mặc định</button>' +
      '</div>' +
      '<div class="ifx-mx-scroll"><table class="ifx-mx-table">' +
        '<thead><tr><th class="ifx-mx-tree-col">Hạng mục giới hạn</th>' + tierHeader() + '</tr></thead>' +
        '<tbody>' + body + '</tbody></table></div>'
    );
  }

  function switchTab(id) {
    ACTIVE = id;
    document.querySelectorAll('[data-mx-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mx-tab') === id);
    });
    document.querySelectorAll('.ifx-mx-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === id);
    });
  }

  function nodeById(id) {
    return Cat.flattenAccessTree().find(function (n) { return n.id === id; });
  }

  function childBlockNodes(pageKey) {
    return Cat.flattenAccessTree().filter(function (n) {
      return n.pageKey === pageKey && n.type !== 'page' && n.type !== 'group' && n.blockId;
    });
  }

  function cascadePageAccess(pageKey, tier, enabled, root) {
    childBlockNodes(pageKey).forEach(function (child) {
      var sel = '[data-mx-access][data-mx-tier="' + tier + '"][data-mx-node="' + child.id + '"]';
      root.querySelectorAll(sel).forEach(function (cb) {
        if (tier === 'guest' && child.guestNever) return;
        cb.checked = !!enabled;
      });
    });
  }

  function fillAccess(plans) {
    document.querySelectorAll('[data-mx-access]').forEach(function (cb) {
      var tier = cb.getAttribute('data-mx-tier');
      var node = nodeById(cb.getAttribute('data-mx-node'));
      if (!node || !plans[tier]) return;
      cb.checked = Cat.getAccessValue(plans[tier], node);
      if (tier === 'guest' && node.guestNever) cb.checked = false;
    });
  }

  function fillActions(plans) {
    document.querySelectorAll('[data-mx-action]').forEach(function (cb) {
      var tier = cb.getAttribute('data-mx-tier');
      var key = cb.getAttribute('data-mx-key');
      var op = cb.getAttribute('data-mx-op');
      var plan = Cat.normalizePlan(plans[tier] || { tier: tier });
      cb.checked = !!(plan.actions && plan.actions[key] && plan.actions[key][op]);
    });
  }

  function fillLimits(plans) {
    document.querySelectorAll('[data-mx-limit]').forEach(function (input) {
      var tier = input.getAttribute('data-mx-tier');
      var key = input.getAttribute('data-mx-key');
      var plan = Cat.normalizePlan(plans[tier] || { tier: tier });
      input.value = plan.limits[key] != null ? plan.limits[key] : 0;
    });
  }

  function collectTierOverrides() {
    var out = {};
    TIERS.forEach(function (tier) {
      out[tier] = { tier: tier, pages: {}, blocks: {}, actions: {}, limits: {} };
    });

    document.querySelectorAll('[data-mx-access]').forEach(function (cb) {
      var tier = cb.getAttribute('data-mx-tier');
      var node = nodeById(cb.getAttribute('data-mx-node'));
      if (!node || !out[tier]) return;
      Cat.setAccessValue(out[tier], node, cb.checked);
    });

    document.querySelectorAll('[data-mx-action]').forEach(function (cb) {
      var tier = cb.getAttribute('data-mx-tier');
      var key = cb.getAttribute('data-mx-key');
      var op = cb.getAttribute('data-mx-op');
      if (!out[tier]) return;
      if (!out[tier].actions[key]) out[tier].actions[key] = { view: false, add: false, edit: false, delete: false };
      out[tier].actions[key][op] = cb.checked;
    });

    document.querySelectorAll('[data-mx-limit]').forEach(function (input) {
      var tier = input.getAttribute('data-mx-tier');
      var key = input.getAttribute('data-mx-key');
      if (!out[tier]) return;
      out[tier].limits[key] = parseInt(input.value, 10) || 0;
    });

    TIERS.forEach(function (tier) {
      if (tier === 'guest' && out[tier].pages) out[tier].pages.dashboard = false;
      if (Cat.syncPageBlocksFromWidgets) Cat.syncPageBlocksFromWidgets(out[tier]);
    });

    return out;
  }

  function updateSummary() {
    var el = document.getElementById('ifx-mx-summary');
    if (!el) return;
    var overrides = collectTierOverrides();
    var parts = TIERS.map(function (t) {
      var p = Cat.normalizePlan(Object.assign({ tier: t }, overrides[t]));
      var pages = Object.keys(p.pages || {}).filter(function (k) { return p.pages[k]; }).length;
      var blocks = Object.keys(p.blocks || {}).filter(function (k) { return p.blocks[k]; }).length;
      return esc(Cat.TIER_LABELS[t]) + ': ' + pages + ' trang · ' + blocks + ' block';
    });
    el.innerHTML = parts.join(' &nbsp;|&nbsp; ');
  }

  function bindToolbar(root) {
    root.querySelectorAll('[data-mx-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-mx-tab')); });
    });

    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-mx-access]')) {
        var node = nodeById(e.target.getAttribute('data-mx-node'));
        if (node && node.type === 'page') {
          cascadePageAccess(node.pageKey, e.target.getAttribute('data-mx-tier'), e.target.checked, root);
        }
      }
      if (e.target.matches('[data-mx-access],[data-mx-action],[data-mx-limit]')) updateSummary();
    });

    var fillAccess = root.querySelector('[data-mx-fill-access="defaults"]');
    if (fillAccess) {
      fillAccess.addEventListener('click', function () {
        var plans = {};
        TIERS.forEach(function (t) { plans[t] = Cat.normalizePlan({ tier: t }); });
        fillAccessPanel(plans);
        updateSummary();
      });
    }

    root.querySelectorAll('[data-mx-fill-access]').forEach(function (btn) {
      if (btn.getAttribute('data-mx-fill-access') === 'defaults') return;
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-mx-fill-access');
        var tierSel = root.querySelector('[data-mx-tier-select]');
        var tier = tierSel ? tierSel.value : 'guest';
        root.querySelectorAll('[data-mx-access][data-mx-tier="' + tier + '"]').forEach(function (cb) {
          var node = nodeById(cb.getAttribute('data-mx-node'));
          if (node && node.guestNever && tier === 'guest') return;
          cb.checked = mode === 'all';
        });
        updateSummary();
      });
    });

    var fillActions = root.querySelector('[data-mx-fill-actions="defaults"]');
    if (fillActions) {
      fillActions.addEventListener('click', function () {
        var plans = {};
        TIERS.forEach(function (t) { plans[t] = Cat.normalizePlan({ tier: t }); });
        fillActionsPanel(plans);
        updateSummary();
      });
    }

    var fillLimits = root.querySelector('[data-mx-fill-limits="defaults"]');
    if (fillLimits) {
      fillLimits.addEventListener('click', function () {
        var plans = {};
        TIERS.forEach(function (t) { plans[t] = Cat.normalizePlan({ tier: t }); });
        fillLimitsPanel(plans);
        updateSummary();
      });
    }
  }

  function fillActionsPanel(plans) { fillActions(plans); }
  function fillLimitsPanel(plans) { fillLimits(plans); }
  function fillAccessPanel(plans) { fillAccess(plans); }

  function render(root) {
    if (!root || !Cat) return;
    root.innerHTML =
      styles() +
      '<div class="ifx-mx-root">' +
        '<div class="ifx-mx-intro">' +
          '<strong>3 nhóm phân quyền theo gói cước:</strong> ' +
          '<em>Quyền truy cập</em> = tick <strong>WGT-*</strong> theo <strong>Core 4 tầng · Tầng 4</strong> — block trên trang User (BLK-*) tự sync. ' +
          'Block ngoài thư viện (Tin tức, FAQ…) hiển thị riêng. · ' +
          '<em>Thao tác</em> = Xem · Thêm · Sửa · Xóa trên tính năng hệ thống (tìm kiếm, watchlist…) · ' +
          '<em>Giới hạn</em> = mức sử dụng tác động chi phí. ' +
          'Muốn thêm widget trên trang Thị trường / Dòng tiền: tick <strong>WGT-*</strong> trong tab <strong>Quyền truy cập</strong> — BLK-* trên User Web tự đồng bộ.' +
        '</div>' +
        '<div class="ifx-mx-tabs">' +
          '<button type="button" class="ifx-mx-tab active" data-mx-tab="mx-access"><i class="ti ti-door-enter"></i> Quyền truy cập</button>' +
          '<button type="button" class="ifx-mx-tab" data-mx-tab="mx-actions"><i class="ti ti-click"></i> Quyền thao tác</button>' +
          '<button type="button" class="ifx-mx-tab" data-mx-tab="mx-limits"><i class="ti ti-gauge"></i> Giới hạn sử dụng</button>' +
        '</div>' +
        '<div class="ifx-mx-summary" id="ifx-mx-summary"></div>' +
        '<div id="mx-access" class="ifx-mx-panel active">' + renderAccessPanel() + '</div>' +
        '<div id="mx-actions" class="ifx-mx-panel">' + renderActionsPanel() + '</div>' +
        '<div id="mx-limits" class="ifx-mx-panel">' + renderLimitsPanel() + '</div>' +
      '</div>';

    bindToolbar(root);
    switchTab(ACTIVE);
  }

  function fillAll(plans) {
    plans = plans || {};
    fillAccess(plans);
    fillActions(plans);
    fillLimits(plans);
    updateSummary();
  }

  global.EntitlementMatrixUI = {
    render: render,
    fill: fillAll,
    collect: collectTierOverrides,
    updateSummary: updateSummary
  };
})(window);
