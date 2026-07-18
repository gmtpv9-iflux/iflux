/* Sidebar Dòng tiền — vùng Hỗ trợ/Kháng cự + rủi ro thị trường (cố định khi đổi tab) */
(function (global) {
  'use strict';

  function mk() { return global.IfluxMockMarket; }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function zoneMeterHtml(ctx) {
    var pos = Math.round((ctx.position || 0.5) * 100);
    return (
      '<div class="ifx-flow-zone-meter" data-ifx-zone-tone="' + esc(ctx.zoneTone) + '">' +
        '<div class="ifx-flow-zone-meter__labels">' +
          '<span class="ifx-flow-zone-meter__lbl ifx-flow-zone-meter__lbl--sup"><i class="ti ti-arrow-bar-to-down"></i> Hỗ trợ</span>' +
          '<span class="ifx-flow-zone-meter__lbl ifx-flow-zone-meter__lbl--res">Kháng cự <i class="ti ti-arrow-bar-to-up"></i></span>' +
        '</div>' +
        '<div class="ifx-flow-zone-meter__track">' +
          '<span class="ifx-flow-zone-meter__fill" style="width:' + pos + '%"></span>' +
          '<span class="ifx-flow-zone-meter__dot" style="left:' + pos + '%" title="' + esc(ctx.zoneLabel) + '"></span>' +
        '</div>' +
        '<div class="ifx-flow-zone-meter__vals">' +
          '<span>' + fmtNum(ctx.support) + '</span>' +
          '<span>' + fmtNum(ctx.resistance) + '</span>' +
        '</div>' +
        '<div class="ifx-flow-zone-meter__meta">' +
          '<span class="ifx-flow-zone-badge is-' + esc(ctx.zoneTone) + '">' + esc(ctx.zoneLabel) + '</span>' +
          '<span class="ifx-flow-zone-meter__dist">KC +' + ctx.distResPct + '% · HT -' + ctx.distSupPct + '%</span>' +
        '</div>' +
        '<p class="ifx-flow-zone-meter__hint">' + esc(ctx.zoneHint) + '</p>' +
      '</div>'
    );
  }

  function riskListHtml(risks) {
    return (risks || []).map(function (r) {
      return (
        '<div class="ifx-flow-risk ifx-flow-risk--' + esc(r.level) + '">' +
          '<span class="ifx-flow-risk__icon"><i class="ti ' + esc(r.icon) + '"></i></span>' +
          '<div class="ifx-flow-risk__body">' +
            '<strong class="ifx-flow-risk__title">' + esc(r.title) + '</strong>' +
            '<p class="ifx-flow-risk__detail">' + esc(r.detail) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function render(container, opts) {
    if (!container) return;
    opts = opts || {};
    var m = mk();
    if (!m) return;
    var ctx = m.getMarketZoneContext();
    if (!ctx) {
      container.innerHTML = '<p class="ifx-flow-sidebar-empty">Không có dữ liệu thị trường.</p>';
      return;
    }

    var ctxTitle = opts.title || 'Ngữ cảnh thị trường';
    var ctxDesc = opts.withHead ? (opts.description || 'VN-Index · Hỗ trợ / Kháng cự · vị trí giá trong biên phiên.') : '';
    var riskTitle = opts.title || 'Rủi ro & Tín hiệu';
    var riskDesc = opts.withHead ? (opts.description || 'Cảnh báo tự động từ độ rộng · dòng tiền · vùng giá thị trường.') : '';
    var showMetaSub = !opts.withHead;
    var chgClass = ctx.index.change_pct > 0 ? 'is-up' : (ctx.index.change_pct < 0 ? 'is-down' : '');

    function flowHead(iconCls, title, desc) {
      if (global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead) {
        return IfluxBlockTemplates.renderWgtHead(title, desc || '', iconCls);
      }
      return (
        '<div class="ifx-widget__header"><h3><i class="' + esc(iconCls) + '"></i> ' + esc(title) + '</h3>' +
        (desc ? '<p class="ifx-widget__subtitle">' + esc(desc) + '</p>' : '') +
        '</div>'
      );
    }

    container.innerHTML =
      '<div class="ifx-flow-card ifx-flow-card--zone" id="ifx-flow-market-zone">' +
        flowHead('ti ti-chart-candle', ctxTitle, ctxDesc) +
        (showMetaSub ? '<div class="ifx-flow-card__sub">VN-Index · Hỗ trợ / Kháng cự ' + ctx.sessions + ' phiên · ' + esc(ctx.updatedAt) + '</div>' : '') +
        '<div class="ifx-flow-card__body">' +
          '<div class="ifx-flow-index-spot">' +
            '<span class="ifx-flow-index-spot__name">' + esc(ctx.index.name) + '</span>' +
            '<span class="ifx-flow-index-spot__val">' + fmtNum(ctx.index.value) + '</span>' +
            '<span class="ifx-flow-index-spot__chg ' + chgClass + '">' + fmtPct(ctx.index.change_pct) + '</span>' +
          '</div>' +
          zoneMeterHtml(ctx) +
        '</div>' +
      '</div>' +
      '<div class="ifx-flow-card ifx-flow-card--risk" id="ifx-flow-market-risk">' +
        flowHead('ti ti-alert-triangle', riskTitle, riskDesc) +
        (showMetaSub ? '<div class="ifx-flow-card__sub">Cảnh báo tự động từ độ rộng · dòng tiền · vùng giá</div>' : '') +
        '<div class="ifx-flow-card__body ifx-flow-risk-list">' + riskListHtml(ctx.risks) + '</div>' +
      '</div>';

    if (opts.mode === 'context') {
      var riskEl = container.querySelector('#ifx-flow-market-risk');
      if (riskEl) riskEl.style.display = 'none';
    }
    if (opts.mode === 'risk') {
      var zoneEl = container.querySelector('#ifx-flow-market-zone');
      if (zoneEl) zoneEl.style.display = 'none';
    }
  }

  function mount(el, opts) {
    if (!el) return;
    render(el, opts || {});
  }

  function refresh(el) {
    render(el || document.getElementById('ifx-flow-market-sidebar'));
  }

  global.IfluxFlowMarketSidebar = { mount: mount, refresh: refresh, render: render };
})(window);
