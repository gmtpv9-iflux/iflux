/* DS SoT — Icons: Preview 4/12 | Tên 2/12 | icon-class · Token · SVG 6/12 */
(function (global) {
  'use strict';

  var IC = global.IfluxDsIconsCatalog;
  if (!IC) return;

  function previewCell(item) {
    return '<img class="ds-ref-preview__icon-img" src="' + IC.esc(item.svgPath) + '" alt="" width="28" height="28" loading="lazy" />';
  }

  function renderRow(item) {
    return '<div class="ds-ref-bundle ds-ref-bundle--icon" data-ds-icon-id="' + IC.esc(item.id) + '">' +
      '<div class="ds-ref-bundle__preview">' + previewCell(item) + '</div>' +
      '<div class="ds-ref-bundle__name">' + IC.esc(item.name) + '</div>' +
      '<div class="ds-ref-bundle__details">' +
        '<div class="ds-ref-prop-row">' +
          '<div class="ds-ref-prop-row__property">' + IC.esc(item.property) + '</div>' +
          '<div class="ds-ref-prop-row__token ds-ref-prop-row__token--readonly">' + IC.esc(item.token) + '</div>' +
          '<div class="ds-ref-prop-row__value">' + IC.esc(item.value) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSection(group) {
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + IC.esc(group.title) + ' <span class="ds-ref-section__count">' + group.items.length + '</span></h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Property</span><span>Token</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(renderRow).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = IC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var total = 0;
    groups.forEach(function (g) { total += g.items.length; });
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + IC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + total + ' icon · ' + groups.length + ' nhóm · Tabler <strong>3.44 outline</strong> · sandbox <code>iflux-icons/outline/</code></p>' +
      '</div>' +
      groups.map(renderSection).join('') +
    '</div>';
  }

  function bindPage() { /* readonly */ }

  global.IfluxDsIconsStudio = {
    renderPage: renderPage,
    bindPage: bindPage
  };
})(window);
