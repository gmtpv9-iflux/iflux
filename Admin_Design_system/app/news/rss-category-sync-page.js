/* ADM-COM-RSS-002 — Đồng bộ danh mục */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    var cat = window.IfluxRssCatalog;
    if (!cat) return;
    var q = ((document.getElementById('rss-map-q') || {}).value || '').trim().toLowerCase();
    var provider = ((document.getElementById('rss-map-provider') || {}).value || '');
    var status = ((document.getElementById('rss-map-status') || {}).value || '');
    var rows = (cat.CATEGORY_MAPPINGS || []).filter(function (m) {
      if (provider && m.providerId !== provider) return false;
      if (status && m.status !== status) return false;
      if (!q) return true;
      return [
        m.ifluxCategory,
        m.providerName,
        m.sourceCategory,
        m.rssUrl,
        m.note || ''
      ].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    var tb = document.getElementById('rss-map-tbody');
    var count = document.getElementById('rss-map-count');
    if (count) count.textContent = String(rows.length);
    if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption" style="text-align:center">Không có mapping</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(function (m) {
      var hint = m.itemCountHint != null ? (' · ~' + m.itemCountHint + ' tin') : '';
      var note = m.note ? ('<div class="ix-caption">' + esc(m.note) + '</div>') : '';
      return (
        '<tr>' +
          '<td><strong>' + esc(m.ifluxCategory) + '</strong><div class="ix-caption">' + esc(m.ifluxCategorySlug || '') + '</div></td>' +
          '<td>' + esc(m.providerName) + '</td>' +
          '<td>' + esc(m.sourceCategory) + note + '</td>' +
          '<td><a href="' + esc(m.rssUrl) + '" target="_blank" rel="noopener" class="ix-caption">' + esc(m.rssUrl) + '</a></td>' +
          '<td><span class="' + esc(cat.statusChipClass(m.status)) + '">' + esc(cat.statusLabel(m.status)) + '</span>' +
            '<div class="ix-caption">' + esc(hint.replace(/^ · /, '')) + '</div></td>' +
        '</tr>'
      );
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    ['rss-map-q', 'rss-map-provider', 'rss-map-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(id === 'rss-map-q' ? 'input' : 'change', render);
    });
    render();
  });
})();
