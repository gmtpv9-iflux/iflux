/**
 * Admin — Ma trận phân quyền theo gói: Truy cập · Thao tác · Giới hạn
 * Quyền truy cập: danh sách Widget (Tất cả / Chỉ đang Bật ở Placement).
 */
(function (global) {
  'use strict';

  var Cat = global.EntitlementCatalog;
  var TIERS = ['guest', 'free', 'premium', 'elite'];
  var ACTIVE = 'mx-access';
  var ACCESS_FILTER = 'all';
  var _accessNodes = [];
  var _lastPlans = {};
  var _root = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function styles() {
    return (
      '<style>' +
        '.ifx-mx-root{display:flex;flex-direction:column;gap:16px}' +
        '.ifx-mx-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--ix-border);padding-bottom:12px}' +
        '.ifx-mx-tab{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid var(--ix-border);border-radius:8px;background:var(--ix-bg-card);font-size:13px;font-weight:500;color:var(--ix-text-secondary);cursor:pointer}' +
        '.ifx-mx-tab.active{background:var(--ix-accent);border-color:var(--ix-accent);color:#fff}' +
        '.ifx-mx-panel{display:none}.ifx-mx-panel.active{display:block}' +
        '.ifx-mx-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}' +
        '.ifx-mx-toolbar .ix-label{margin:0;font-size:13px;color:var(--ix-text-secondary)}' +
        '.ifx-mx-scroll{overflow:auto;border:1px solid var(--ix-border);border-radius:10px;background:var(--ix-bg-card)}' +
        '.ifx-mx-table{width:100%;border-collapse:collapse;font-size:var(--ifx-font-size-12);min-width:720px}' +
        '.ifx-mx-table th,.ifx-mx-table td{border-bottom:1px solid var(--ix-border);padding:8px 10px;vertical-align:middle}' +
        '.ifx-mx-table th{background:var(--ix-bg-subtle);font-weight:600;color:var(--ix-text-secondary);text-align:center;position:sticky;top:0;z-index:2}' +
        '.ifx-mx-table th.ifx-mx-id-col{text-align:left;min-width:160px}' +
        '.ifx-mx-table th.ifx-mx-name-col{text-align:left;min-width:220px}' +
        '.ifx-mx-table td.ifx-mx-id-col{text-align:left;font-family:var(--ix-font-mono,ui-monospace,monospace);font-size:11px;color:var(--ix-accent)}' +
        '.ifx-mx-table td.ifx-mx-name-col{text-align:left;font-weight:600;font-size:var(--ifx-font-size-14);color:var(--ix-text-primary)}' +
        '.ifx-mx-table td.ifx-mx-name-col .ifx-mx-tree-meta{display:block;font-weight:400;font-size:var(--ifx-font-size-12);margin-top:2px;margin-left:0;line-height:1.4}' +
        '.ifx-mx-table td.ifx-mx-cell{text-align:center;width:120px}' +
        '.ifx-mx-op{display:flex;flex-wrap:wrap;gap:4px 6px;justify-content:center}' +
        '.ifx-mx-op label{display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--ix-text-muted);cursor:pointer;white-space:nowrap}' +
        '.ifx-mx-op input{margin:0}' +
        '.ifx-mx-limit-input{width:72px;text-align:center;padding:4px 6px;font-size:12px;font-weight:600}' +
        '.ifx-mx-tree-meta{font-size:var(--ifx-font-size-12);color:var(--ix-text-muted);margin-left:6px}' +
      '</style>'
    );
  }

  function tierHeader() {
    return TIERS.map(function (t) {
      return '<th>' + esc(Cat.TIER_LABELS[t] || t) + '</th>';
    }).join('');
  }

  function widgetListForFilter() {
    var P = global.PlatformLayersWidgets;
    var cat = global.PageSettingsCatalog;
    /* SoT «Tất cả» = Widget Definition Tầng 4 — không Sitemap. */
    if (ACCESS_FILTER !== 'enabled' && P && typeof P.entitlementList === 'function') {
      return P.entitlementList().map(function (m) {
        return {
          id: m.id,
          title: m.title || m.id,
          description: m.description || ''
        };
      }).sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      });
    }
    if (!cat) return [];
    if (ACCESS_FILTER === 'enabled' && typeof cat.listEnabledPlacementWidgets === 'function') {
      return cat.listEnabledPlacementWidgets();
    }
    if (typeof cat.listAllWidgets === 'function') return cat.listAllWidgets();
    return [];
  }

  function buildAccessNodes() {
    _accessNodes = widgetListForFilter().map(function (w) {
      return {
        id: 'widget:' + w.id,
        type: 'block',
        kind: 'widget',
        blockId: w.id,
        widgetId: w.id,
        label: w.title || w.id,
        description: w.description || ''
      };
    });
    return _accessNodes;
  }

  function accessCell(node, tier) {
    return (
      '<td class="ifx-mx-cell">' +
        '<input type="checkbox" class="ix-checkbox" data-mx-access="1" data-mx-tier="' + esc(tier) + '" data-mx-node="' + esc(node.id) + '" />' +
      '</td>'
    );
  }

  function snapshotAccessIntoLastPlans() {
    if (!_lastPlans) _lastPlans = {};
    TIERS.forEach(function (tier) {
      if (!_lastPlans[tier]) _lastPlans[tier] = { tier: tier, pages: {}, blocks: {}, actions: {}, limits: {} };
      if (!_lastPlans[tier].blocks) _lastPlans[tier].blocks = {};
    });
    document.querySelectorAll('[data-mx-access]').forEach(function (cb) {
      var tier = cb.getAttribute('data-mx-tier');
      var node = nodeById(cb.getAttribute('data-mx-node'));
      if (!node || !_lastPlans[tier]) return;
      Cat.setAccessValue(_lastPlans[tier], node, cb.checked);
    });
  }

  function renderAccessPanel() {
    var nodes = buildAccessNodes();
    var body = nodes.map(function (node) {
      var desc = node.description
        ? '<div class="ifx-mx-tree-meta">' + esc(node.description) + '</div>'
        : '';
      return (
        '<tr data-mx-row="' + esc(node.id) + '">' +
          '<td class="ifx-mx-id-col">' + esc(node.widgetId) + '</td>' +
          '<td class="ifx-mx-name-col">' + esc(node.label) + desc + '</td>' +
          TIERS.map(function (t) { return accessCell(node, t); }).join('') +
        '</tr>'
      );
    }).join('');

    return (
      '<div class="ifx-mx-toolbar">' +
        '<label class="ix-label" for="mx-access-filter">Hiển thị</label>' +
        '<select class="ix-input ix-input-sm" id="mx-access-filter" data-mx-access-filter style="width:auto;min-width:220px">' +
          '<option value="all"' + (ACCESS_FILTER === 'all' ? ' selected' : '') + '>Tất cả Widget</option>' +
          '<option value="enabled"' + (ACCESS_FILTER === 'enabled' ? ' selected' : '') + '>Chỉ Widget đang Bật</option>' +
        '</select>' +
      '</div>' +
      '<div class="ifx-mx-scroll"><table class="ifx-mx-table">' +
        '<thead><tr>' +
          '<th class="ifx-mx-id-col">Mã Widget</th>' +
          '<th class="ifx-mx-name-col">Tên Widget</th>' +
          tierHeader() +
        '</tr></thead>' +
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
        return '<tr><td class="ifx-mx-name-col">' + esc(action.label) + '</td>' +
          TIERS.map(function (t) { return actionCell(action, t); }).join('') + '</tr>';
      }).join('');
      return header + rows;
    }).join('');

    return (
      '<div class="ifx-mx-toolbar">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-actions="defaults">Mặc định thao tác</button>' +
      '</div>' +
      '<div class="ifx-mx-scroll"><table class="ifx-mx-table">' +
        '<thead><tr><th class="ifx-mx-name-col">Tính năng / thao tác</th>' + tierHeader() + '</tr></thead>' +
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
        '<tr><td class="ifx-mx-name-col">' +
          esc(lim.label) +
          '<span class="ifx-mx-tree-meta">(' + esc(lim.unit) + ')</span>' +
        '</td>' + cells + '</tr>'
      );
    }).join('');

    return (
      '<div class="ifx-mx-toolbar">' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-mx-fill-limits="defaults">Giới hạn mặc định</button>' +
      '</div>' +
      '<div class="ifx-mx-scroll"><table class="ifx-mx-table">' +
        '<thead><tr><th class="ifx-mx-name-col">Hạng mục giới hạn</th>' + tierHeader() + '</tr></thead>' +
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
    return _accessNodes.find(function (n) { return n.id === id; });
  }

  function fillAccess(plans) {
    document.querySelectorAll('[data-mx-access]').forEach(function (cb) {
      var tier = cb.getAttribute('data-mx-tier');
      var node = nodeById(cb.getAttribute('data-mx-node'));
      if (!node || !plans[tier]) return;
      cb.checked = Cat.getAccessValue(plans[tier], node);
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
      if (_lastPlans[tier] && _lastPlans[tier].blocks) {
        out[tier].blocks = Object.assign({}, _lastPlans[tier].blocks);
      }
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

    _lastPlans = out;
    return out;
  }

  function rebindAccessFilter(root) {
    var sel = root.querySelector('[data-mx-access-filter]');
    if (!sel) return;
    sel.addEventListener('change', function () {
      snapshotAccessIntoLastPlans();
      ACCESS_FILTER = sel.value === 'enabled' ? 'enabled' : 'all';
      var panel = root.querySelector('#mx-access');
      if (!panel) return;
      panel.innerHTML = renderAccessPanel();
      fillAccess(_lastPlans);
      rebindAccessFilter(root);
    });
  }

  function bindToolbar(root) {
    root.querySelectorAll('[data-mx-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-mx-tab')); });
    });

    rebindAccessFilter(root);

    var fillActions = root.querySelector('[data-mx-fill-actions="defaults"]');
    if (fillActions) {
      fillActions.addEventListener('click', function () {
        var plans = {};
        TIERS.forEach(function (t) { plans[t] = Cat.normalizePlan({ tier: t }); });
        fillActions(plans);
      });
    }

    var fillLimits = root.querySelector('[data-mx-fill-limits="defaults"]');
    if (fillLimits) {
      fillLimits.addEventListener('click', function () {
        var plans = {};
        TIERS.forEach(function (t) { plans[t] = Cat.normalizePlan({ tier: t }); });
        fillLimits(plans);
      });
    }
  }

  function render(root) {
    if (!root || !Cat) return;
    _root = root;
    root.innerHTML =
      styles() +
      '<div class="ifx-mx-root">' +
        '<div class="ifx-mx-tabs">' +
          '<button type="button" class="ifx-mx-tab active" data-mx-tab="mx-access"><i class="ti ti-door-enter"></i> Quyền truy cập</button>' +
          '<button type="button" class="ifx-mx-tab" data-mx-tab="mx-actions"><i class="ti ti-click"></i> Quyền thao tác</button>' +
          '<button type="button" class="ifx-mx-tab" data-mx-tab="mx-limits"><i class="ti ti-gauge"></i> Giới hạn sử dụng</button>' +
        '</div>' +
        '<div id="mx-access" class="ifx-mx-panel active">' + renderAccessPanel() + '</div>' +
        '<div id="mx-actions" class="ifx-mx-panel">' + renderActionsPanel() + '</div>' +
        '<div id="mx-limits" class="ifx-mx-panel">' + renderLimitsPanel() + '</div>' +
      '</div>';

    bindToolbar(root);
    switchTab(ACTIVE);
  }

  function fillAll(plans) {
    plans = plans || {};
    _lastPlans = plans;
    fillAccess(plans);
    fillActions(plans);
    fillLimits(plans);
  }

  global.EntitlementMatrixUI = {
    render: render,
    fill: fillAll,
    collect: collectTierOverrides
  };
})(window);
