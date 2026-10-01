/**
 * ADM — Publish Widget / Page Community (Phase 3)
 */
(function (global) {
  'use strict';

  var EXTRA_PLACEMENTS = [];
  var EXTRA_DRAFTS = {};
  var SELECTED_DEFINITION = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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

  /* Widget = nền tảng dùng chung (data + giao diện + vị trí + quyền lưu sẵn cùng widget) —
     Publish KHÔNG được nhập tay lại Tiêu đề/Template/Dữ liệu mẫu; phải lấy nguyên trạng
     Định nghĩa đã audit ở Kiến trúc 4 tầng (data-l4), nếu không outputs/demo không bao giờ
     tới được widget live (chỉ còn placeholder chung của Template). */
  function fillDefinitions() {
    var sel = $('wp-def');
    if (!sel || !global.PlatformLayersWidgets || !PlatformLayersWidgets.getDefinitions) return;
    var defs = PlatformLayersWidgets.getDefinitions();
    sel.innerHTML = '<option value="">— Chọn widget đã định nghĩa —</option>' +
      defs.map(function (d) {
        return '<option value="' + esc(d.id) + '">' + esc(d.id) + ' — ' + esc(d.title || '') + '</option>';
      }).join('');
  }

  function ensureTemplateOption(sel, templateId) {
    if (!sel || !templateId) return;
    var has = Array.prototype.some.call(sel.options, function (o) { return o.value === templateId; });
    if (has) return;
    var o = document.createElement('option');
    o.value = templateId;
    o.textContent = templateId;
    sel.appendChild(o);
  }

  function onDefChange() {
    var sel = $('wp-def');
    var id = sel ? sel.value : '';
    var idEl = $('wp-id'), titleEl = $('wp-title'), descEl = $('wp-desc'), tplEl = $('wp-template'), outEl = $('wp-def-outputs');
    if (!id || !global.PlatformLayersWidgets) {
      SELECTED_DEFINITION = null;
      if (idEl) idEl.value = '';
      if (titleEl) titleEl.value = '';
      if (descEl) descEl.value = '';
      if (outEl) outEl.textContent = '';
      return;
    }
    var def = PlatformLayersWidgets.getDefinition(id);
    SELECTED_DEFINITION = def;
    if (!def) return;
    if (idEl) idEl.value = def.id;
    if (titleEl) titleEl.value = def.title || '';
    if (descEl) descEl.value = def.description || '';
    if (tplEl) {
      ensureTemplateOption(tplEl, def.templateRef);
      tplEl.value = def.templateRef || '';
    }
    if (outEl) {
      var outputs = def.outputs || [];
      outEl.textContent = outputs.length
        ? 'Dữ liệu mẫu (' + outputs.length + ' output): ' + outputs.map(function (o) { return (o.symbol || o.name || '?') + '=' + (o.demo || '—'); }).join(' · ')
        : 'Widget này chưa khai báo output nào ở Kiến trúc 4 tầng.';
    }
  }

  function baseCommunityDraft() {
    return {
      page: 'news',
      path: '/tin-tuc',
      title: 'Tin tức',
      intro: 'Widget đặc thù từ PagePublished.',
      documentTitle: 'Tin tức · iFlux',
      sections: [
        { key: 'main', label: 'Main — Widget grid', visible: true, layout: 'grid-12' },
        { key: 'sidebar-right', label: 'Sidebar phải', visible: true, layout: null }
      ],
      placements: [
        { widgetId: 'WGT-NEWS-001', section: 'main', position: 0, span: 6, enabled: true, locked: true, config: {} },
        { widgetId: 'WGT-NEWS-TOPIC-TOP', section: 'main', position: 1, span: 6, enabled: true, locked: true, config: {} },
        { widgetId: 'WGT-MKT-006', section: 'sidebar-right', position: 0, span: 12, enabled: true, locked: true, config: { source: 'story' } },
        { widgetId: 'WGT-NEWS-002', section: 'sidebar-right', position: 1, span: 12, enabled: true, locked: true, config: {} }
      ]
    };
  }

  function baseWidgetDrafts() {
    return {
      'WGT-NEWS-001': {
        id: 'WGT-NEWS-001',
        title: 'Heatmap cổ phiếu cộng đồng',
        template: 'TMP-COM-STOCK-HEAT',
        css: [
          '/User_Web/iflux-web-ui/news.css?v=appShell20260928',
          '/User_Web/iflux-web-ui/block-templates.css',
          '/User_Web/iflux-web-ui/watchlist.css'
        ]
      },
      'WGT-NEWS-TOPIC-TOP': {
        id: 'WGT-NEWS-TOPIC-TOP',
        title: 'Chủ đề tích cực hàng đầu',
        template: 'TMP-COM-STORY-TOP',
        css: ['/User_Web/iflux-web-ui/news.css?v=appShell20260928', '/User_Web/iflux-web-ui/block-templates.css']
      },
      'WGT-MKT-006': {
        id: 'WGT-MKT-006',
        title: 'Biểu đồ Câu chuyện',
        template: 'TMP-MARKET-HEATMAP',
        css: [
          '/User_Web/iflux-web-ui/block-templates.css',
          '/User_Web/iflux-web-ui/market.css?v=appShell20260928',
          '/User_Web/iflux-web-ui/market-components.css'
        ]
      },
      'WGT-NEWS-002': {
        id: 'WGT-NEWS-002',
        title: 'Thành viên tích cực',
        template: 'TMP-COM-ACTIVE',
        css: ['/User_Web/iflux-web-ui/news.css?v=appShell20260928']
      }
    };
  }

  function onPubWidget() {
    var st = $('wp-widget-status');
    if (!SELECTED_DEFINITION) {
      if (st) st.textContent = 'Chọn một Widget đã định nghĩa ở Kiến trúc 4 tầng trước khi publish.';
      return;
    }
    var def = SELECTED_DEFINITION;
    var id = String(def.id || '').trim().toUpperCase();
    var title = String(def.title || '').trim();
    var desc = String(def.description || '').trim();
    var template = String(def.templateRef || '');
    var section = String(($('wp-section') && $('wp-section').value) || 'main');
    var span = Number(($('wp-span') && $('wp-span').value) || 6);
    var pos = Number(($('wp-pos') && $('wp-pos').value) || 10);

    if (!/^WGT-[A-Z0-9][A-Z0-9_-]{2,48}$/.test(id)) {
      if (st) st.textContent = 'Mã widget không hợp lệ (WGT-…)';
      return;
    }
    if (!title || !template) {
      if (st) st.textContent = 'Định nghĩa thiếu tiêu đề hoặc Template — sửa ở Kiến trúc 4 tầng trước.';
      return;
    }

    var draft = {
      id: id,
      title: title,
      description: desc,
      template: template,
      dataDefinition: def.outputs || [],
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
    fillDefinitions();
    var bd = $('wp-def');
    var bw = $('wp-pub-widget');
    var bp = $('wp-pub-page');
    if (bd) bd.addEventListener('change', onDefChange);
    if (bw) bw.addEventListener('click', onPubWidget);
    if (bp) bp.addEventListener('click', onPubPage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
