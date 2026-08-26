/**
 * IfxTable — search / sort / select-all / client page.
 * REWRITE hành vi generic từ iflux-admin-ui.js §9/11/12/13.
 * Ẩn/chọn = class (is-hidden / is-selected). Không element.style.
 */
(function (global) {
  'use strict';

  function init(root) {
    var scope = root || document.querySelector('[data-ifx-table]');
    if (!scope) return;
    var table = scope.querySelector('.ifx-table');
    if (!table || !table.tBodies[0]) return;
    var tbody = table.tBodies[0];
    var search = scope.querySelector('[data-ifx-table-search]');
    var pager = scope.querySelector('[data-ifx-pagination]');
    var pageSize = parseInt(scope.getAttribute('data-ifx-page-size') || '0', 10);
    var page = 1;
    var sortCol = -1;
    var sortDir = 1;
    var selectAll = table.querySelector('thead .ifx-checkbox');

    function rows() {
      return Array.from(tbody.querySelectorAll('tr'));
    }

    function paintPager(pages, total) {
      if (!pager) return;
      pager.textContent = '';
      function btn(label, target, disabled, active) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ifx-page-btn' + (active ? ' is-active' : '');
        b.textContent = label;
        b.disabled = !!disabled;
        b.addEventListener('click', function () {
          page = target;
          apply();
        });
        return b;
      }
      pager.appendChild(btn('‹', page - 1, page <= 1, false));
      for (var p = 1; p <= pages; p += 1) {
        pager.appendChild(btn(String(p), p, false, p === page));
      }
      pager.appendChild(btn('›', page + 1, page >= pages, false));
      var info = document.createElement('span');
      info.className = 'ifx-page-info';
      info.textContent = total ? ('Trang ' + page + ' / ' + pages) : '0';
      pager.appendChild(info);
    }

    function apply() {
      var list = rows();
      if (sortCol >= 0) {
        list.sort(function (a, b) {
          var aText = (a.cells[sortCol] && a.cells[sortCol].textContent) || '';
          var bText = (b.cells[sortCol] && b.cells[sortCol].textContent) || '';
          return aText.localeCompare(bText, undefined, { numeric: true }) * sortDir;
        });
        list.forEach(function (r) { tbody.appendChild(r); });
        list = rows();
      }
      var q = search ? search.value.toLowerCase().trim() : '';
      var matched = list.filter(function (r) {
        return !q || r.textContent.toLowerCase().indexOf(q) !== -1;
      });
      var pages = pageSize > 0 ? Math.max(1, Math.ceil(matched.length / pageSize) || 1) : 1;
      if (page > pages) page = pages;
      list.forEach(function (r) { r.classList.add('is-hidden'); });
      matched.forEach(function (r, i) {
        var show = pageSize <= 0 || (i >= (page - 1) * pageSize && i < page * pageSize);
        r.classList.toggle('is-hidden', !show);
      });
      paintPager(pages, matched.length);
    }

    table.addEventListener('click', function (e) {
      var th = e.target.closest('th[data-ifx-sort]');
      if (!th) return;
      var col = parseInt(th.getAttribute('data-ifx-sort'), 10);
      if (sortCol === col) sortDir *= -1;
      else { sortCol = col; sortDir = 1; }
      apply();
    });

    if (search) search.addEventListener('input', function () { page = 1; apply(); });

    if (selectAll) {
      selectAll.addEventListener('change', function () {
        rows().forEach(function (r) {
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
        var visible = rows().filter(function (r) { return !r.classList.contains('is-hidden'); });
        var boxes = visible.map(function (r) { return r.querySelector('.ifx-checkbox'); }).filter(Boolean);
        var checked = boxes.filter(function (cb) { return cb.checked; });
        selectAll.indeterminate = checked.length > 0 && checked.length < boxes.length;
        selectAll.checked = boxes.length > 0 && checked.length === boxes.length;
      });
    }

    apply();
  }

  global.IfxTable = { init: init };
})(window);
