/* ADM-COM-RSS-003 — Đồng bộ cấu trúc bài viết */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cell(val) {
    if (!val) return '<span class="ix-caption">—</span>';
    return '<code class="ix-caption">' + esc(val) + '</code>';
  }

  function render() {
    var cat = window.IfluxRssCatalog;
    if (!cat) return;
    var q = ((document.getElementById('rss-schema-q') || {}).value || '').trim().toLowerCase();
    var rows = (cat.ARTICLE_FIELD_MAP || []).filter(function (r) {
      if (!q) return true;
      return [
        r.ifluxField,
        r.ifluxKey,
        r.cafef,
        r.vietstock,
        r.baodautu,
        r.note
      ].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    var tb = document.getElementById('rss-schema-tbody');
    var count = document.getElementById('rss-schema-count');
    if (count) count.textContent = String(rows.length);
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption" style="text-align:center">Không có trường</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(function (r) {
      return (
        '<tr>' +
          '<td><strong>' + esc(r.ifluxField) + '</strong><div class="ix-caption">' + esc(r.ifluxKey || '') + '</div></td>' +
          '<td>' + cell(r.cafef) + '</td>' +
          '<td>' + cell(r.vietstock) + '</td>' +
          '<td>' + cell(r.baodautu) + '</td>' +
          '<td class="ix-caption">' + esc(r.note || '') + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('rss-schema-q');
    if (input) input.addEventListener('input', render);
    render();
  });
})();
