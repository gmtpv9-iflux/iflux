/* Thống kê mua/bán ròng theo entity — TPL-FLOW-SPLIT (Design Sandbox SoT) */
(function (global) {
  'use strict';

  var SUBJECT_TABS = [
    { key: 'retail', label: 'Cá nhân' },
    { key: 'institutional', label: 'Tổ chức' },
    { key: 'proprietary', label: 'Tự doanh' },
    { key: 'foreign', label: 'Khối ngoại' }
  ];

  var SCOPE_META = {
    stock: {
      title: 'Thống kê mua/bán ròng theo cổ phiếu',
      description: 'Biểu đồ đối xứng — so sánh quy mô dòng tiền mua ròng (trái) và bán ròng (phải)',
      tickBuy: 'Mã mua',
      tickSell: 'Mã bán'
    },
    sector: {
      title: 'Thống kê mua/bán ròng theo ngành',
      description: 'Biểu đồ đối xứng — so sánh quy mô dòng tiền mua ròng (trái) và bán ròng (phải)',
      tickBuy: 'Ngành mua',
      tickSell: 'Ngành bán'
    },
    family: {
      title: 'Thống kê mua/bán ròng theo hệ sinh thái',
      description: 'Biểu đồ đối xứng — so sánh quy mô dòng tiền mua ròng (trái) và bán ròng (phải)',
      tickBuy: 'HST mua',
      tickSell: 'HST bán'
    },
    story: {
      title: 'Thống kê mua/bán ròng theo chủ đề',
      description: 'Biểu đồ đối xứng — so sánh quy mô dòng tiền mua ròng (trái) và bán ròng (phải)',
      tickBuy: 'Chủ đề mua',
      tickSell: 'Chủ đề bán'
    },
    'chu-de': {
      title: 'Thống kê mua/bán ròng theo chủ đề',
      description: 'Biểu đồ đối xứng — so sánh quy mô dòng tiền mua ròng (trái) và bán ròng (phải)',
      tickBuy: 'Chủ đề mua',
      tickSell: 'Chủ đề bán'
    }
  };

  function tpl() { return global.IfluxBlockTemplates; }

  function bindSubjectTabs(root) {
    var tabs = root.querySelector('[data-ifx-flow-subject-tabs]');
    if (!tabs || tabs._ifxBound) return;
    tabs._ifxBound = true;
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-flow-subject]');
      if (!btn) return;
      tabs.querySelectorAll('[data-ifx-flow-subject]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      setFilters(root, { subject: btn.getAttribute('data-ifx-flow-subject') });
    });
  }

  function mount(root, opts) {
    if (!root) return;
    if (!global.IfluxMockMarket) {
      root.innerHTML = '<div class="ifx-wl-empty">Thiếu mock market data</div>';
      return;
    }
    var T = tpl();
    if (!T) {
      root.innerHTML = '<div class="ifx-wl-empty">Thiếu block-templates.js</div>';
      return;
    }

    opts = opts || {};
    var scope = opts.scope || 'stock';
    if (scope === 'story') scope = 'chu-de';
    var meta = SCOPE_META[scope] || SCOPE_META.stock;
    var subject = opts.subject || 'retail';

    root.innerHTML = T.renderFlowSplitBlock({
      withHead: !!opts.withHead,
      title: opts.title || meta.title,
      description: opts.description != null ? opts.description : meta.description,
      withSubjectTabs: opts.withSubjectTabs !== false,
      subject: subject,
      tickBuy: opts.tickBuy || meta.tickBuy,
      tickSell: opts.tickSell || meta.tickSell
    });

    root._flowOpts = { subject: subject, scope: scope };
    if (opts.withSubjectTabs !== false) bindSubjectTabs(root);
    refresh(root);
  }

  function refresh(root) {
    if (!root || !global.IfluxMockMarket) return;
    var T = tpl();
    var opts = root._flowOpts || { subject: 'retail', scope: 'stock' };
    var data = IfluxMockMarket.getFlowTopNetList({
      subject: opts.subject,
      scope: opts.scope,
      count: 10
    });
    var body = root.querySelector('[data-ifx-flow-split-body]');
    if (body && T) body.innerHTML = T.renderFlowSplitBody(data);
  }

  function setFilters(root, patch) {
    if (!root) return;
    root._flowOpts = Object.assign({}, root._flowOpts || {}, patch || {});
    refresh(root);
  }

  global.IfluxFlowNetTop = {
    SUBJECT_TABS: SUBJECT_TABS,
    SCOPE_META: SCOPE_META,
    mount: mount,
    refresh: refresh,
    setFilters: setFilters
  };
})(window);
