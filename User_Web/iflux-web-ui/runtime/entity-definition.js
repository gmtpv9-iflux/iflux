/**
 * Phase B2 — Entity Definition Resolve (classic script, sync).
 * URL → params → documentTitle entity trước Feature mount (kiểu FireAnt).
 * Nguồn tên: map SoT frontend tạm — chưa DNSE/API hồ sơ.
 */
(function (global) {
  'use strict';

  var STOCK_DOC_TITLE_NAMES = {
    SHB: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    HPG: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    VCB: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    FPT: 'Công ty Cổ phần FPT',
    MWG: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
    VHM: 'Công ty Cổ phần Vinhomes',
    VIC: 'Tập đoàn Vingroup',
    TCB: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    MBB: 'Ngân hàng TMCP Quân Đội',
    ACB: 'Ngân hàng TMCP Á Châu',
    SSI: 'Công ty Cổ phần Chứng khoán SSI',
    STB: 'Ngân hàng TMCP Sài Gòn Thương Tín'
  };

  function parseStockTicker(loc) {
    loc = loc || global.location;
    if (!loc) return null;
    var q = new URLSearchParams(loc.search || '').get('ticker');
    if (q) return String(q).toUpperCase();
    var path = loc.pathname || '';
    var m = path.match(/\/(?:co-phieu|stocks)\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]).toUpperCase();
    m = path.match(/\/User_Web\/stock\/(?:index\.html)?$/i);
    if (m) {
      q = new URLSearchParams(loc.search || '').get('ticker');
      return q ? String(q).toUpperCase() : null;
    }
    return null;
  }

  function companyNameForTicker(ticker) {
    ticker = String(ticker || '').toUpperCase();
    return STOCK_DOC_TITLE_NAMES[ticker] || ticker;
  }

  function stockDocumentTitle(ticker) {
    ticker = String(ticker || '').toUpperCase();
    if (!ticker) return '';
    return ticker + ' - ' + companyNameForTicker(ticker);
  }

  function resolveRouteParams(pageKey, loc) {
    pageKey = pageKey || '';
    if (pageKey === 'stock' || pageKey === 'stockComment') {
      var ticker = parseStockTicker(loc);
      return ticker ? { symbol: ticker, ticker: ticker } : {};
    }
    return {};
  }

  function enrichDefinitionWithEntity(definition, pageKey, loc) {
    if (!definition) return definition;
    var key = pageKey || definition.pageKey || '';
    var params = resolveRouteParams(key, loc);
    if (key === 'stock' && params.symbol) {
      /* documentTitle: Thiết lập SEO stock-detail template via IfluxSeoTitle — không hardcode */
      definition.title = params.symbol;
      definition.routeParams = params;
    }
    return definition;
  }

  /** Early title disabled — Admin SEO / IfluxSeoTitle owns document.title after boot. */
  function applyEarlyDocumentTitle(loc) {
    return null;
  }

  var earlyTitle = applyEarlyDocumentTitle();

  global.IfluxEntityDefinition = {
    STOCK_DOC_TITLE_NAMES: STOCK_DOC_TITLE_NAMES,
    parseStockTicker: parseStockTicker,
    companyNameForTicker: companyNameForTicker,
    stockDocumentTitle: stockDocumentTitle,
    resolveRouteParams: resolveRouteParams,
    enrichDefinitionWithEntity: enrichDefinitionWithEntity,
    applyEarlyDocumentTitle: applyEarlyDocumentTitle,
    earlyTitle: earlyTitle
  };
})(typeof window !== 'undefined' ? window : this);
