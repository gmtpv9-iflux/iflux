/* TMP-BREADTH / TPL-BREADTH — mount + tương tác tab sàn.
 * HTML producer: IfluxBlockTemplates.renderBreadth*
 * CSS owner: block-templates.css (TPL-BREADTH)
 */
(function (global) {
  'use strict';

  function tpl() { return global.IfluxBlockTemplates; }

  function render(root) {
    var m = global.IfluxMockMarket;
    var T = tpl();
    if (!root || !m || !T) return;

    var exchange = root.getAttribute('data-exchange') || 'vnindex';
    var data = m.getBreadth(exchange);
    if (!data) return;

    var inner = root.querySelector('[data-ifx-breadth-inner]');
    if (!inner) {
      root.innerHTML = '<div data-ifx-breadth-inner></div>';
      inner = root.querySelector('[data-ifx-breadth-inner]');
    }
    inner.innerHTML = T.renderBreadthContent({ exchange: exchange, data: data });
    root.setAttribute('data-exchange', exchange);
  }

  function bind(root) {
    if (!root || root._ifxBreadthBound) return;
    root._ifxBreadthBound = true;

    root.addEventListener('click', function (e) {
      var exBtn = e.target.closest('[data-ifx-breadth-exchange]');
      if (!exBtn) return;
      root.setAttribute('data-exchange', exBtn.getAttribute('data-ifx-breadth-exchange'));
      render(root);
    });
  }

  function mountInner(el) {
    if (!el) return;
    el.innerHTML = '<div class="ifx-breadth-block" data-ifx-breadth-block data-exchange="vnindex"><div data-ifx-breadth-inner></div></div>';
    var root = el.querySelector('[data-ifx-breadth-block]');
    bind(root);
    render(root);
  }

  function mount(el, opts) {
    if (!el) return;
    opts = opts || {};
    var T = tpl();
    if (!T) {
      el.innerHTML = '<div class="ifx-wl-empty">Thiếu block-templates.js</div>';
      return;
    }

    if (opts.withHead) {
      if (global.IfluxCommunityMarketOverview && IfluxCommunityMarketOverview.mountBreadthSidebar) {
        IfluxCommunityMarketOverview.mountBreadthSidebar(el, opts);
        return;
      }
      el.innerHTML = T.renderSidebarShell({
        title: opts.title || 'Độ rộng thị trường',
        icon: opts.icon || 'ti ti-chart-dots-3',
        desc: opts.description || 'Mã tăng / giảm / tham chiếu / trần / sàn theo từng sàn giao dịch.',
        body: '<div data-ifx-com-breadth-mount></div>',
        shellClass: 'ifx-com-breadth-sidebar',
        attrs: opts.entBlock ? 'data-ifx-ent-block="' + opts.entBlock + '"' : (opts.attrs || '')
      });
      mountInner(el.querySelector('[data-ifx-com-breadth-mount]'));
      return;
    }
    mountInner(el);
  }

  global.IfluxBreadthBlock = { mount: mount, mountInner: mountInner, render: render };
})(window);
