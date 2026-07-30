/* Loyalty — Membership tree (hybrid: cây trái + detail phải, lazy expand) */
(function (global) {
  'use strict';

  var USERS = [];
  var BY_ID = {};
  var CHILDREN = {};
  var SELECTED = null;
  var EXPANDED = {};
  var LOADED_CHILDREN = {};
  var COMMISSION = {};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) {
    return '₫' + Math.round(Number(n) || 0).toLocaleString('vi-VN');
  }
  function fmtDate(v) {
    if (!v) return '—';
    try { return new Date(v).toLocaleDateString('vi-VN'); } catch (e) { return '—'; }
  }
  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }

  function apiBase() {
    return (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
  }
  function adminToken() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function buildIndex(list) {
    USERS = list || [];
    BY_ID = {};
    CHILDREN = { __root__: [] };
    USERS.forEach(function (u) {
      BY_ID[u.id] = u;
    });
    USERS.forEach(function (u) {
      var parent = u.referredBy && BY_ID[u.referredBy] ? u.referredBy : '__root__';
      if (!CHILDREN[parent]) CHILDREN[parent] = [];
      CHILDREN[parent].push(u.id);
    });
    Object.keys(CHILDREN).forEach(function (k) {
      CHILDREN[k].sort(function (a, b) {
        return String((BY_ID[a] && BY_ID[a].name) || '').localeCompare(String((BY_ID[b] && BY_ID[b].name) || ''));
      });
    });
  }

  function buildCommission() {
    COMMISSION = {};
    var Store = global.LoyaltyAffiliateStore;
    if (!Store || !Store.listReferrals) return;
    var rows = Store.listReferrals({}) || [];
    rows.forEach(function (e) {
      var id = e.referrerId;
      if (!id) return;
      if (!COMMISSION[id]) COMMISSION[id] = { f0: 0, f1: 0, f2: 0, total: 0 };
      var layer = String(e.level || '').toUpperCase();
      var amt = Number(e.commission) || 0;
      if (layer === 'F0') COMMISSION[id].f0 += amt;
      else if (layer === 'F1') COMMISSION[id].f1 += amt;
      else if (layer === 'F2') COMMISSION[id].f2 += amt;
      COMMISSION[id].total += amt;
    });
  }

  function childCount(id) {
    return (CHILDREN[id] || []).length;
  }

  function loadUsers() {
    var token = adminToken();
    if (!token) return Promise.resolve(false);
    return fetch(apiBase() + '/admin/users', {
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
      cache: 'no-store'
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        buildIndex(data.customers || []);
        buildCommission();
        return true;
      })
      .catch(function () {
        buildIndex([]);
        buildCommission();
        return false;
      });
  }

  function nodeLabel(id) {
    if (id === '__root__') return 'Admin';
    var u = BY_ID[id];
    return u ? (u.name || u.email || id) : id;
  }

  function renderTreeNode(id, depth) {
    var kids = CHILDREN[id] || [];
    var count = kids.length;
    var open = !!EXPANDED[id];
    var selected = SELECTED === id;
    var hasKids = count > 0;
    var chevron = hasKids
      ? '<button type="button" class="ix-btn ix-btn-icon adm-ms-chevron" data-ms-expand="' + esc(id) + '" aria-label="Mở">' +
          '<i class="ti ' + (open ? 'ti-chevron-down' : 'ti-chevron-right') + '" style="font-size:14px"></i></button>'
      : '<span style="width:28px;display:inline-block"></span>';

    var html =
      '<div class="adm-ms-node' + (selected ? ' is-active' : '') + '" style="padding-left:' + (depth * 16) + 'px">' +
        chevron +
        '<button type="button" class="adm-ms-node-btn" data-ms-select="' + esc(id) + '">' +
          '<span class="adm-ms-node-name">' + esc(nodeLabel(id)) + '</span>' +
          (hasKids ? ' <span class="adm-ms-node-count">(' + count + ')</span>' : '') +
        '</button>' +
      '</div>';

    if (open && hasKids && LOADED_CHILDREN[id]) {
      kids.forEach(function (cid) {
        html += renderTreeNode(cid, depth + 1);
      });
    }
    return html;
  }

  function renderTree() {
    var host = document.getElementById('ms-tree');
    if (!host) return;
    EXPANDED.__root__ = true;
    LOADED_CHILDREN.__root__ = true;
    host.innerHTML = renderTreeNode('__root__', 0);
  }

  function detailRowsFor(parentId) {
    var ids;
    if (parentId === '__root__') {
      ids = CHILDREN.__root__ || [];
    } else {
      ids = CHILDREN[parentId] || [];
      /* khi chọn 1 node: hiện chính node + con trực tiếp */
      ids = [parentId].concat(ids);
    }
    return ids.map(function (id) {
      if (id === '__root__') return null;
      var u = BY_ID[id];
      if (!u) return null;
      var c = COMMISSION[id] || { f0: 0, f1: 0, f2: 0, total: 0 };
      return {
        id: id,
        name: u.name || '—',
        email: u.email || '',
        joinedAt: u.joinedAt || u.createdAt,
        f0: c.f0,
        f1: c.f1,
        f2: c.f2,
        total: c.total,
        children: childCount(id)
      };
    }).filter(Boolean);
  }

  function renderDetail() {
    var title = document.getElementById('ms-detail-title');
    if (title) title.textContent = nodeLabel(SELECTED || '__root__');
    var tbody = document.getElementById('ms-detail-tbody');
    if (!tbody) return;
    var rows = detailRowsFor(SELECTED || '__root__');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Không có thành viên.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return '<tr class="' + (r.id === SELECTED ? 'adm-ms-row-active' : '') + '">' +
        '<td><div style="font-weight:600">' + esc(r.name) + '</div>' +
          '<div style="font-size:12px;color:var(--ix-text-muted)">' + esc(r.email) +
          (r.children ? ' · ' + r.children + ' F0' : '') + '</div></td>' +
        '<td>' + fmtDate(r.joinedAt) + '</td>' +
        '<td>' + fmt(r.f0) + '</td>' +
        '<td>' + fmt(r.f1) + '</td>' +
        '<td>' + fmt(r.f2) + '</td>' +
        '<td style="font-weight:600">' + fmt(r.total) + '</td>' +
      '</tr>';
    }).join('');
  }

  function selectNode(id) {
    SELECTED = id;
    renderTree();
    renderDetail();
  }

  function expandNode(id) {
    EXPANDED[id] = !EXPANDED[id];
    if (EXPANDED[id]) {
      LOADED_CHILDREN[id] = true;
    }
    renderTree();
  }

  function bind() {
    var tree = document.getElementById('ms-tree');
    if (!tree) return;
    tree.addEventListener('click', function (e) {
      var exp = e.target.closest('[data-ms-expand]');
      if (exp) {
        e.preventDefault();
        e.stopPropagation();
        expandNode(exp.getAttribute('data-ms-expand'));
        return;
      }
      var sel = e.target.closest('[data-ms-select]');
      if (sel) {
        e.preventDefault();
        selectNode(sel.getAttribute('data-ms-select'));
      }
    });
  }

  function init() {
    bind();
    SELECTED = '__root__';
    var host = document.getElementById('ms-tree');
    if (host) host.innerHTML = '<div style="padding:16px;color:var(--ix-text-muted);font-size:13px">Đang tải…</div>';
    loadUsers().then(function (ok) {
      if (!ok) toast('Không tải được danh sách thành viên', 'danger');
      renderTree();
      renderDetail();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
