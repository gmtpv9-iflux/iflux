/**
 * iFlux Block Templates — registry + render API (Design Sandbox SoT §15).
 * Mỗi template = 1 nhóm block cùng hình thức; truyền data → HTML chuẩn.
 */
(function (global) {
  'use strict';

  /* Phase A: guard nạp trùng (Shell đã có → Feature CORE_TIERS không execute lại). */
  if (global.IfluxBlockTemplates) return;

  var ENTITY_KINDS = { stock: 1, sector: 1, family: 1, 'cau-chuyen': 1 };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Entity Renderer — marker semantic duy nhất (CP / Ngành / HST / Câu chuyện).
   * Widget chỉ gọi helper; Permission không gắn marker từng file.
   * opts: { className, title, tiny }
   */
  function entityName(label, kind, opts) {
    opts = opts || {};
    kind = ENTITY_KINDS[kind] ? kind : 'stock';
    var text = opts.tiny && label ? String(label).split(' ')[0] : String(label == null ? '' : label);
    var cls = 'ifx-entity-name' + (opts.className ? ' ' + opts.className : '');
    var title = opts.title != null ? opts.title : text;
    return (
      '<span class="' + esc(cls) + '" data-ifx-role="entity-name" data-ifx-entity-kind="' + esc(kind) + '"' +
        (title ? ' title="' + esc(title) + '"' : '') +
        ' data-ifx-entity-raw="' + esc(text) + '">' +
        esc(text) +
      '</span>'
    );
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  /**
   * TPL-LIST-ROW — opts: { href, hideVol, extraClass }
   */
  function renderStockRow(s, opts) {
    opts = opts || {};
    if (!s) return '';
    var href = opts.href || '#';
    var chg = s.change_pct;
    var cls = dirClass(chg);
    var extra = opts.extraClass ? ' ' + opts.extraClass : '';
    return (
      '<a class="ifx-list-row ifx-stock-row ' + cls + extra + '" href="' + esc(href) + '" data-ticker="' + esc(s.ticker) + '">' +
        entityName(s.ticker, 'stock', { className: 'ifx-stock-row__ticker' }) +
        entityName(s.name || '', 'stock', { className: 'ifx-stock-row__name' }) +
        '<span class="ifx-stock-row__price">' + (s.price != null ? esc(s.price) : '—') + '</span>' +
        '<span class="ifx-stock-row__chg">' + fmtPct(chg) + '</span>' +
        (opts.hideVol ? '' : '<span class="ifx-stock-row__vol">' + esc(s.volume || '—') + '</span>') +
      '</a>'
    );
  }

  /**
   * TPL-LIST-ROW wrap — opts: { href, actionsHtml, badgesHtml, folderId, ... }
   */
  function renderStockRowWrap(s, opts) {
    opts = opts || {};
    if (!s) return '';
    var chg = s.change_pct;
    var actions = opts.actionsHtml || '';
    var badges = opts.badgesHtml || '';
    return (
      '<div class="ifx-list-row-wrap ifx-stock-row-wrap ' + dirClass(chg) + '" data-ticker="' + esc(s.ticker) + '">' +
        renderStockRow(s, opts) +
        (actions ? '<div class="ifx-stock-row__actions">' + actions + '</div>' : '') +
        (badges ? '<div class="ifx-stock-row__badges-row" data-ifx-stock-badges>' + badges + '</div>' : '') +
      '</div>'
    );
  }

  /**
   * TPL-FEED-CARD shell — opts: { slug, variant: ''|'featured'|'compact', bodyHtml }
   */
  function renderFeedPost(opts) {
    opts = opts || {};
    var variant = opts.variant ? ' ifx-com-post--' + opts.variant : '';
    return (
      '<article class="ifx-feed-card ifx-com-post' + variant + '" data-ifx-com-slug="' + esc(opts.slug) + '">' +
        (opts.bodyHtml || '') +
      '</article>'
    );
  }

  /**
   * TPL-FEED-CARD body — opts: { href, thumbHtml, title, time, excerpt, tagsHtml, statsHtml, showExcerpt }
   * Không render avatar/tác giả/nguồn trên card tin (chỉ trên bài chi tiết).
   */
  function renderFeedPostBody(opts) {
    opts = opts || {};
    var href = opts.href || '#';
    var thumbCls = opts.thumbClass ? ' ' + opts.thumbClass : '';
    var footerHtml = '';
    if (opts.time || opts.statsHtml) {
      footerHtml =
        '<div class="ifx-com-post__footer">' +
          (opts.time
            ? '<span class="ifx-com-post__time">' + esc(opts.time) + '</span>'
            : '<span class="ifx-com-post__time" aria-hidden="true"></span>') +
          (opts.statsHtml
            ? '<div class="ifx-com-post__stats">' + opts.statsHtml + '</div>'
            : '') +
        '</div>';
    }
    return (
      '<a class="ifx-com-post__thumb' + thumbCls + '" href="' + esc(href) + '">' + (opts.thumbHtml || '') + '</a>' +
      '<div class="ifx-com-post__body">' +
        '<div class="ifx-com-post__title-row">' +
          '<a class="ifx-com-post__title-text" href="' + esc(href) + '">' + esc(opts.title || 'Bài viết') + '</a>' +
        '</div>' +
        (opts.showExcerpt && opts.excerpt
          ? '<p class="ifx-com-post__excerpt">' + esc(opts.excerpt) + '</p>'
          : '') +
        (opts.tagsHtml ? '<div class="ifx-com-post__tags">' + opts.tagsHtml + '</div>' : '') +
        footerHtml +
      '</div>'
    );
  }

  global.IfluxBlockTemplates = {
    esc: esc,
    entityName: entityName,
    fmtPct: fmtPct,
    dirClass: dirClass,
    renderStockRow: renderStockRow,
    renderStockRowWrap: renderStockRowWrap,
    renderFeedPost: renderFeedPost,
    renderFeedPostBody: renderFeedPostBody
  };
})(window);
