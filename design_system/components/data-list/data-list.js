/**
 * IfxDataList — P5 composition: Search + Table + Pagination.
 * Sở hữu: query, page, page-size, khớp hàng → bảo Table.setVisible + Pagination.render.
 * Không sở hữu visual Search / Table / Pagination.
 * Existing owner: sandbox components data-list markup (compose only).
 * Why new file: wiring search↔table↔pager từng nằm sai chỗ trong table.js.
 */
(function (global) {
  'use strict';

  function init(root) {
    var scope = root || document.querySelector('[data-ifx-data-list]');
    if (!scope || scope.getAttribute('data-ifx-bound') === '1') return;
    if (!global.IfxTable || !global.IfxPagination) return;
    scope.setAttribute('data-ifx-bound', '1');

    var table = global.IfxTable.init(scope);
    var searchInput = scope.querySelector('[data-ifx-search]');
    var pager = global.IfxPagination.init(scope.querySelector('[data-ifx-pagination]'));
    var pageSize = parseInt(scope.getAttribute('data-ifx-page-size') || '0', 10);
    var page = 1;

    function apply() {
      if (!table) return;
      var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      var matched = global.IfxTable.rows(table).filter(function (r) {
        return !q || r.textContent.toLowerCase().indexOf(q) !== -1;
      });
      var pages = pageSize > 0 ? Math.max(1, Math.ceil(matched.length / pageSize) || 1) : 1;
      if (page > pages) page = pages;
      var shown = pageSize <= 0
        ? matched
        : matched.slice((page - 1) * pageSize, page * pageSize);
      global.IfxTable.setVisible(table, shown);
      if (pager) global.IfxPagination.render(pager, { page: page, pages: pages, total: matched.length });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () { page = 1; apply(); });
    }
    if (pager) {
      pager.addEventListener('ifx-page-change', function (e) {
        page = e.detail.page;
        apply();
      });
    }
    if (table) table.addEventListener('ifx-table-sort', apply);
    apply();
  }

  function initAll() {
    document.querySelectorAll('[data-ifx-data-list]').forEach(function (el) { init(el); });
  }

  global.IfxDataList = { init: init, initAll: initAll };
})(window);
