/* Xếp hạng Top 10 — TPL-RANK-BAR (Design Sandbox SoT) */
(function (global) {
  'use strict';

  var TITLES = {
    stock: 'Top 10 Cổ phiếu có hiệu suất cao nhất hôm nay',
    sector: 'Top 10 Ngành có hiệu suất cao nhất hôm nay',
    family: 'Top 10 Hệ sinh thái hiệu suất cao nhất hôm nay',
    story: 'Top 10 Chủ đề có hiệu suất cao nhất hôm nay'
  };

  function tpl() { return global.IfluxBlockTemplates; }
  function mk() { return global.IfluxMockMarket; }

  function render(el, source) {
    if (!el || !mk()) return;
    var T = tpl();
    var items = mk().getTop10Today(source);
    if (T) {
      el.innerHTML = T.renderRankBarList({
        items: items,
        emptyMsg: 'Chưa có dữ liệu xếp hạng'
      });
      return;
    }
    el.innerHTML = '<div class="ifx-mkt-empty">Chưa có dữ liệu xếp hạng</div>';
  }

  function mount(el, source) {
    if (!el) return;
    render(el, source);
    el._ifxRankSource = source;
  }

  function refreshAll() {
    document.querySelectorAll('[data-ifx-mkt-rank]').forEach(function (el) {
      render(el, el.getAttribute('data-ifx-mkt-rank') || 'sector');
    });
  }

  global.IfluxMarketRankings = {
    TITLES: TITLES,
    mount: mount,
    render: render,
    refreshAll: refreshAll
  };
})(window);
