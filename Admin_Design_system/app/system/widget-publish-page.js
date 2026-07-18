/**
 * ADM — Publish Widget / Page Community (Phase 3)
 */
(function (global) {
  'use strict';

  var EXTRA_PLACEMENTS = [];
  var EXTRA_DRAFTS = {};

  function $(id) { return document.getElementById(id); }

  function toast(msg, kind) {
    if (global.ixToast) ixToast(msg, kind || 'success');
    else if (console && console.log) console.log('[Publish]', msg);
  }

  function fillTemplates() {
    var sel = $('wp-template');
    if (!sel || !global.IfluxWidgetPublishClient) return;
    sel.innerHTML = '';
    IfluxWidgetPublishClient.templates.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = t.label;
      sel.appendChild(o);
    });
  }

  function baseCommunityDraft() {
    return {
      page: 'community',
      path: '/cong-dong',
      title: 'Cộng đồng',
      intro: 'Widget đặc thù từ PagePublished.',
      documentTitle: 'Cộng đồng · iFlux',
      sections: [
        { key: 'main', label: 'Main — Widget grid', visible: true, layout: 'grid-12' },
        { key: 'sidebar-right', label: 'Sidebar phải', visible: true, layout: null }
      ],
      placements: [
        { widgetId: 'WGT-COM-001', section: 'main', position: 0, span: 6, enabled: true, locked: true, config: {} },
        { widgetId: 'WGT-COM-CHUDE-TOP', section: 'main', position: 1, span: 6, enabled: true, locked: true, config: {} },
        { widgetId: 'WGT-MKT-006', section: 'sidebar-right', position: 0, span: 12, enabled: true, locked: true, config: { source: 'story' } },
        { widgetId: 'WGT-COM-002', section: 'sidebar-right', position: 1, span: 12, enabled: true, locked: true, config: {} }
      ]
    };
  }

  function baseWidgetDrafts() {
    return {
      'WGT-COM-001': {
        id: 'WGT-COM-001',
        title: 'Heatmap cổ phiếu cộng đồng',
        template: 'TMP-COM-STOCK-HEAT',
        blocks: ['BLK-COM-TRENDING'],
        css: [
          '/User_Web/iflux-web-ui/community.css',
          '/User_Web/iflux-web-ui/block-templates.css',
          '/User_Web/iflux-web-ui/watchlist.css'
        ]
      },
      'WGT-COM-CHUDE-TOP': {
        id: 'WGT-COM-CHUDE-TOP',
        title: 'Chủ đề tích cực hàng đầu',
        template: 'TMP-COM-STORY-TOP',
        blocks: ['BLK-COM-CHUDE-TOP'],
        css: ['/User_Web/iflux-web-ui/community.css', '/User_Web/iflux-web-ui/block-templates.css']
      },
      'WGT-MKT-006': {
        id: 'WGT-MKT-006',
        title: 'Biểu đồ Câu chuyện',
        template: 'TMP-MARKET-HEATMAP',
        blocks: ['BLK-MKT-HEAT-CHUDE'],
        css: [
          '/User_Web/iflux-web-ui/block-templates.css',
          '/User_Web/iflux-web-ui/market.css',
          '/User_Web/iflux-web-ui/market-components.css'
        ]
      },
      'WGT-COM-002': {
        id: 'WGT-COM-002',
        title: 'Thành viên tích cực',
        template: 'TMP-COM-ACTIVE',
        blocks: ['BLK-COM-ACTIVE'],
        css: ['/User_Web/iflux-web-ui/community.css']
      }
    };
  }

  function onPubWidget() {
    var id = String(($('wp-id') && $('wp-id').value) || '').trim().toUpperCase();
    var title = String(($('wp-title') && $('wp-title').value) || '').trim();
    var desc = String(($('wp-desc') && $('wp-desc').value) || '').trim();
    var template = String(($('wp-template') && $('wp-template').value) || '');
    var section = String(($('wp-section') && $('wp-section').value) || 'main');
    var span = Number(($('wp-span') && $('wp-span').value) || 6);
    var pos = Number(($('wp-pos') && $('wp-pos').value) || 10);
    var st = $('wp-widget-status');

    if (!/^WGT-[A-Z0-9][A-Z0-9_-]{2,48}$/.test(id)) {
      if (st) st.textContent = 'Mã widget không hợp lệ (WGT-…)';
      return;
    }
    if (!title || !template) {
      if (st) st.textContent = 'Thiếu tiêu đề hoặc Template';
      return;
    }

    var draft = {
      id: id,
      title: title,
      description: desc,
      template: template,
      blocks: [],
      minTier: 'free',
      css: ['/User_Web/iflux-web-ui/block-templates.css', '/User_Web/iflux-web-ui/widget-shell.css']
    };
    var placement = {
      widgetId: id,
      section: section,
      position: pos,
      span: span,
      enabled: true,
      locked: false,
      config: {}
    };

    if (st) st.textContent = 'Đang publish…';
    IfluxWidgetPublishClient.publishWidget(draft, placement).then(function (res) {
      if (!res || !res.ok) {
        if (st) st.textContent = 'Lỗi: ' + ((res && res.error) || 'publish widget thất bại');
        toast('Publish Widget thất bại', 'danger');
        return;
      }
      EXTRA_DRAFTS[id] = draft;
      EXTRA_PLACEMENTS = EXTRA_PLACEMENTS.filter(function (p) { return p.widgetId !== id; });
      EXTRA_PLACEMENTS.push(placement);
      if (st) st.textContent = 'Đã publish ' + id + ' @v' + (res.widget && res.widget.version);
      toast('Đã publish Widget ' + id, 'success');
    }).catch(function (err) {
      if (st) st.textContent = String(err);
      toast('Publish Widget lỗi mạng', 'danger');
    });
  }

  function onPubPage() {
    var st = $('wp-page-status');
    var pageDraft = baseCommunityDraft();
    pageDraft.placements = pageDraft.placements.concat(EXTRA_PLACEMENTS);
    var widgetDrafts = Object.assign({}, baseWidgetDrafts(), EXTRA_DRAFTS);

    if (st) st.textContent = 'Đang publish page…';
    IfluxWidgetPublishClient.publishPage(pageDraft, widgetDrafts).then(function (res) {
      if (!res || !res.ok) {
        if (st) st.textContent = 'Lỗi: ' + ((res && (res.error || res.message)) || 'publish page thất bại');
        toast('Publish Page thất bại', 'danger');
        return;
      }
      if (st) st.textContent = 'Đã publish Community @v' + (res.page && res.page.version) +
        ' · widgets: ' + (res.widgets ? res.widgets.length : 0);
      toast('Đã publish Page Community', 'success');
    }).catch(function (err) {
      if (st) st.textContent = String(err);
      toast('Publish Page lỗi mạng', 'danger');
    });
  }

  function boot() {
    fillTemplates();
    var bw = $('wp-pub-widget');
    var bp = $('wp-pub-page');
    if (bw) bw.addEventListener('click', onPubWidget);
    if (bp) bp.addEventListener('click', onPubPage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
