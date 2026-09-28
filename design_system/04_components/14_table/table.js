/**
 * IfxTable — table-specific state only.
 * Sở hữu: sort cột, row selection, visibility slice (class is-hidden / is-selected).
 * Không sở hữu: Search input, Pagination UI, filter form, page-size policy.
 * Composer: components/data-list (IfxDataList).
 */
(function (global) {
  'use strict';

  function resolveTable(root) {
    if (root && root.matches && root.matches('table.ifx-table')) return root;
    var scope = root || document;
    return scope.querySelector('table.ifx-table[data-ifx-table]') ||
      scope.querySelector('[data-ifx-table] table.ifx-table') ||
      scope.querySelector('table.ifx-table');
  }

  function rowsOf(table) {
    if (!table || !table.tBodies[0]) return [];
    return Array.from(table.tBodies[0].querySelectorAll('tr'));
  }

  function init(root) {
    var table = resolveTable(root);
    if (!table || table.getAttribute('data-ifx-bound') === '1') return table;
    if (!table.tBodies[0]) return table;
    table.setAttribute('data-ifx-bound', '1');
    var tbody = table.tBodies[0];
    var sortCol = -1;
    var sortDir = 1;
    var selectAll = table.querySelector('thead .ifx-checkbox');

    table.addEventListener('click', function (e) {
      var th = e.target.closest('th[data-ifx-sort]');
      if (!th) return;
      var col = parseInt(th.getAttribute('data-ifx-sort'), 10);
      if (sortCol === col) sortDir *= -1;
      else { sortCol = col; sortDir = 1; }
      var list = rowsOf(table);
      list.sort(function (a, b) {
        var aText = (a.cells[col] && a.cells[col].textContent) || '';
        var bText = (b.cells[col] && b.cells[col].textContent) || '';
        return aText.localeCompare(bText, undefined, { numeric: true }) * sortDir;
      });
      list.forEach(function (r) { tbody.appendChild(r); });
      table.dispatchEvent(new CustomEvent('ifx-table-sort', {
        bubbles: true,
        detail: { col: col, dir: sortDir }
      }));
    });

    if (selectAll) {
      selectAll.addEventListener('change', function () {
        rowsOf(table).forEach(function (r) {
          if (r.classList.contains('is-hidden')) return;
          var cb = r.querySelector('.ifx-checkbox');
          if (cb) cb.checked = selectAll.checked;
          r.classList.toggle('is-selected', selectAll.checked);
        });
      });
      tbody.addEventListener('change', function (e) {
        if (!e.target.classList.contains('ifx-checkbox')) return;
        var row = e.target.closest('tr');
        if (row) row.classList.toggle('is-selected', e.target.checked);
        var visible = rowsOf(table).filter(function (r) { return !r.classList.contains('is-hidden'); });
        var boxes = visible.map(function (r) { return r.querySelector('.ifx-checkbox'); }).filter(Boolean);
        var checked = boxes.filter(function (cb) { return cb.checked; });
        selectAll.indeterminate = checked.length > 0 && checked.length < boxes.length;
        selectAll.checked = boxes.length > 0 && checked.length === boxes.length;
      });
    }
    return table;
  }

  function setVisible(table, shown) {
    var show = shown || [];
    rowsOf(table).forEach(function (r) {
      r.classList.toggle('is-hidden', show.indexOf(r) === -1);
    });
  }

  global.IfxTable = {
    init: init,
    rows: rowsOf,
    setVisible: setVisible
  };
})(window);
