/* DS SoT — Items: anatomy + layout tokens · live preview */
(function (global) {
  'use strict';

  var IC = global.IfluxDsItemsCatalog;
  var PC = global.IfluxDsPrimitiveCatalog;
  var DC = global.IfluxDsDesignTokensCatalog;
  if (!IC || !PC) return;

  var LS_PREFIX = 'iflux-ds-item:';
  var DT_LS_PREFIX = 'iflux-ds-dt:';
  var store = { server: {}, dtPrim: {}, loaded: false };
  var saveTimers = {};
  var semanticIndex = null;

  function apiBase() {
    if (global.location.protocol === 'file:') return '';
    return global.location.protocol + '//' + global.location.host + '/api/ds-sot';
  }

  function buildSemanticIndex() {
    if (semanticIndex) return semanticIndex;
    semanticIndex = {};
    if (!DC || !DC.allEntries) return semanticIndex;
    DC.allEntries().forEach(function (e) {
      semanticIndex[e.logicalId] = e;
    });
    return semanticIndex;
  }

  function domPropId(bundle, property) {
    return bundle.id + '--' + property.key;
  }

  function readLocal(id) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + id) || 'null'); } catch (e) { return null; }
  }

  function writeLocal(id, data) {
    try { localStorage.setItem(LS_PREFIX + id, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function mergeDtOverridesFromStorage() {
    var map = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(DT_LS_PREFIX) !== 0) continue;
        var data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data && data.token && data.logicalId) map[data.logicalId] = data.token;
      }
    } catch (e) { /* ignore */ }
    return map;
  }

  function getOverride(groupTitle, bundle, property) {
    var id = IC.propKey(groupTitle, bundle, property);
    if (store.server[id]) return store.server[id];
    return readLocal(id);
  }

  function resolvePropRef(groupTitle, bundle, property) {
    var ov = getOverride(groupTitle, bundle, property);
    if (ov && ov.token) {
      return { refKind: ov.refKind || property.refKind, token: ov.token };
    }
    return { refKind: property.refKind, token: property.token };
  }

  function primitiveValue(tokenId) {
    if (!tokenId) return '';
    if (PC.resolveLiteralValue) return PC.resolveLiteralValue(tokenId);
    return PC.resolveToken(tokenId).value || '';
  }

  function semanticPrimitive(logicalId) {
    var idx = buildSemanticIndex();
    var entry = idx[logicalId];
    if (!entry) return '';
    if (store.dtPrim[logicalId]) return store.dtPrim[logicalId];
    return entry.token;
  }

  function resolveRefValue(refKind, token) {
    if (!token) return '';
    if (refKind === 'semantic') {
      var prim = semanticPrimitive(token);
      return prim ? primitiveValue(prim) : '';
    }
    return primitiveValue(token);
  }

  function cssPropFromKey(key, value) {
    if (!value) return {};
    if (key === 'background' || key.indexOf('bg') >= 0) return { bg: value };
    if (key === 'color' || (key.indexOf('color') >= 0 && key.indexOf('border') < 0)) return { color: value };
    if (key === 'border-color') return { borderColor: value };
    if (key === 'padding-y' || key === 'padding-bottom') return { py: value };
    if (key === 'padding-x') return { px: value };
    if (key === 'gap' || key === 'grid-gap-x') return { gap: value };
    if (key === 'min-height') return { minH: value };
    if (key === 'radius') return { radius: value };
    if (key === 'font-size') return { fontSize: value };
    if (key === 'height') return { height: value };
    return {};
  }

  function previewVarStyle(bundle, groupTitle) {
    var vars = [];
    var extras = [];
    bundle.properties.forEach(function (property) {
      var ref = resolvePropRef(groupTitle, bundle, property);
      var val = resolveRefValue(ref.refKind, ref.token);
      if (!val) return;
      var mapped = cssPropFromKey(property.key, val);
      if (mapped.gap) vars.push('--ds-preview-gap:' + mapped.gap);
      if (mapped.py) vars.push('--ds-preview-py:' + mapped.py);
      if (mapped.px) vars.push('--ds-preview-px:' + mapped.px);
      if (mapped.bg) vars.push('--ds-preview-bg:' + mapped.bg);
      if (mapped.color && property.key === 'color') vars.push('--ds-preview-color:' + mapped.color);
      if (mapped.borderColor) vars.push('--ds-preview-border:' + mapped.borderColor);
      if (mapped.radius) vars.push('--ds-preview-radius:' + mapped.radius);
      if (mapped.minH) vars.push('--ds-preview-min-h:' + mapped.minH);
      if (mapped.fontSize) extras.push('font-size:' + mapped.fontSize);
      if (mapped.height) extras.push('height:' + mapped.height);
    });
    return { vars: vars, extras: extras };
  }

  function applyPreviewStyles(bundleEl, groupTitle, bundle) {
    var host = bundleEl.querySelector('.ds-item-preview');
    if (!host) return;
    var el = host.querySelector('[data-ds-item-root]') || host.firstElementChild;
    if (!el) return;
    var built = previewVarStyle(bundle, groupTitle);
    var styleParts = built.vars.concat(built.extras);
    if (styleParts.length) el.setAttribute('style', styleParts.join(';'));
    else el.removeAttribute('style');
  }

  function flashRow(row) {
    if (!row) return;
    row.classList.add('is-saved');
    clearTimeout(row._saveFlash);
    row._saveFlash = setTimeout(function () { row.classList.remove('is-saved'); }, 1200);
  }

  function pushServer(id, payload, row) {
    var base = apiBase();
    if (!base) {
      writeLocal(id, payload);
      flashRow(row);
      return;
    }
    fetch(base + '/overrides/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: resolveRefValue(payload.refKind, payload.token),
        code: '',
        html: '',
        meta: {
          kind: 'item-ref',
          refKind: payload.refKind,
          token: payload.token,
          variable: payload.variable,
          property: payload.key,
          logicalId: payload.logicalId || '',
          className: payload.className || ''
        }
      })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok || !body.ok) throw new Error('fail');
        store.server[id] = payload;
        writeLocal(id, payload);
        flashRow(row);
      });
    }).catch(function () {
      writeLocal(id, payload);
      flashRow(row);
    });
  }

  function scheduleSave(id, payload, row) {
    writeLocal(id, payload);
    row.classList.add('is-pending');
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(function () {
      row.classList.remove('is-pending');
      pushServer(id, payload, row);
    }, 600);
  }

  function tokenOptions(property, selected) {
    var refKind = property.refKind;
    var propType = property.property;
    if (refKind === 'semantic' && DC && DC.allEntries) {
      var list = DC.allEntries().filter(function (e) {
        if (propType === 'color' || property.key.indexOf('color') >= 0 || property.key.indexOf('bg') >= 0) {
          return e.property === 'color';
        }
        return e.property === propType;
      });
      if (!list.length) list = DC.allEntries();
      return list.map(function (e) {
        var sel = e.logicalId === selected ? ' selected' : '';
        return '<option value="' + IC.esc(e.logicalId) + '"' + sel + '>' + IC.esc(e.logicalId) + '</option>';
      }).join('');
    }
    var primList = PC.getTokensByProperty(propType);
    if (!primList.length) return '<option value="">— không có token —</option>';
    return primList.map(function (it) {
      var sel = it.token === selected ? ' selected' : '';
      return '<option value="' + IC.esc(it.token) + '"' + sel + '>' + IC.esc(it.token) + ' · ' + IC.esc(it.name) + '</option>';
    }).join('');
  }

  function surfaceLabel(surface) {
    if (surface === 'user') return 'User';
    if (surface === 'admin') return 'Admin';
    return 'Shared';
  }

  function anatomyHtml(bundle) {
    var tree = IC.esc(bundle.anatomy || '').replace(/\n/g, '<br>');
    var slots = (bundle.slots || []).map(function (s) {
      var atom = s.atom ? ' → <code>' + IC.esc(s.atom) + '</code>' : '';
      return '<div class="ds-item-slot"><span class="ds-item-slot__id">' + IC.esc(s.id) + '</span>' +
        '<span class="ds-item-slot__atom">' + IC.esc(s.label) + atom + '</span></div>';
    }).join('');
    return '<div class="ds-item-anatomy">' +
      '<div class="ds-item-anatomy__label">Structure</div>' +
      '<pre class="ds-item-anatomy__tree">' + tree + '</pre>' +
      (slots ? '<div class="ds-item-anatomy__slots">' + slots + '</div>' : '') +
      (bundle.note ? '<div class="ds-ref-section__note" style="margin-top:6px">' + IC.esc(bundle.note) + '</div>' : '') +
    '</div>';
  }

  function previewHtml(bundle) {
    var pt = bundle.previewType;
    var e = IC.esc;

    if (pt === 'stock-row') {
      return '<a href="#" class="ifx-stock-row is-up ds-preview-stock-row" data-ds-item-root onclick="return false">' +
        '<span class="ifx-stock-row__ticker">VCB</span>' +
        '<span class="ifx-stock-row__name">Vietcombank</span>' +
        '<span class="ifx-stock-row__badges"><span class="ix-chip ix-chip-outline">Bank</span></span>' +
        '<span class="ifx-stock-row__price">112.5</span>' +
        '<span class="ifx-stock-row__chg">+1.8%</span>' +
        '<span class="ifx-stock-row__vol">2.1M</span></a>';
    }
    if (pt === 'stock-row-wrap') {
      return '<div class="ifx-stock-row-wrap ds-preview-stock-wrap is-up" data-ds-item-root>' +
        '<div class="ds-preview-stock-wrap__line1">' +
          '<span class="ifx-stock-row__name">Hòa Phát</span>' +
          '<span class="ifx-stock-row__chg is-up">+2.1%</span>' +
          '<span class="ifx-stock-row__vol">5.4M</span>' +
        '</div>' +
        '<div class="ds-preview-stock-wrap__line2">' +
          '<span class="ix-badge ix-badge-info">Top biến động</span>' +
          '<div class="ifx-stock-row__actions">' +
            '<button type="button" class="ifx-stock-row__alert" disabled aria-label="Cảnh báo"><i class="ti ti-bell"></i></button>' +
            '<button type="button" class="ifx-follow ifx-heart" disabled aria-label="Theo dõi"><i class="ti ti-bookmark"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    if (pt === 'market-metric') {
      return '<div class="ifx-market-header__metric ds-preview-metric" data-ds-item-root>' +
        '<span class="ifx-market-header__label">VN-INDEX</span>' +
        '<span class="ifx-market-header__val is-up">1,284.5</span></div>';
    }
    if (pt === 'sector-card') {
      return '<a href="#" class="ifx-sector-card" onclick="return false" style="min-width:160px">' +
        '<div class="ifx-sector-card__head"><span class="ifx-sector-card__name">Ngân hàng</span>' +
        '<span class="ifx-sector-card__rank">#1</span></div>' +
        '<div class="ifx-sector-card__metrics"><div class="ifx-sector-card__metric"><span>Biến động</span><strong class="is-up">+2.4%</strong></div></div></a>';
    }
    if (pt === 'sector-metric' || pt === 'kpi') {
      return '<div class="ifx-sector-card__metric"><span>PE</span><strong>12.4</strong></div>';
    }
    if (pt === 'price-cell') {
      return '<div style="display:flex;flex-direction:column;gap:2px;text-align:right">' +
        '<span class="ifx-typo-price-m">112.5</span><span class="ifx-typo-percent-up">+1.8%</span></div>';
    }
    if (pt === 'status-banner') {
      return '<div class="ifx-degraded-banner is-visible" style="margin:0"><i class="ti ti-alert-triangle"></i><span>Dữ liệu trễ · đang đồng bộ</span></div>';
    }
    if (pt === 'flow-panel') {
      return '<div class="ifx-flow-panel" style="padding:8px 0;border:0">' +
        '<div class="ifx-flow-panel__head"><span class="ifx-flow-panel__label">Khối ngoại</span>' +
        '<span class="ifx-flow-panel__net is-up">+₫450B</span></div>' +
        '<div class="ifx-flow-bar"><span class="ifx-flow-bar__buy" style="width:62%"></span><span class="ifx-flow-bar__sell" style="width:38%"></span></div></div>';
    }
    if (pt === 'flow-bar') {
      return '<div class="ifx-flow-bar" style="width:120px"><span class="ifx-flow-bar__buy" style="width:55%"></span><span class="ifx-flow-bar__sell" style="width:45%"></span></div>';
    }
    if (pt === 'flow-net') {
      return '<span class="ifx-flow-panel__net is-up">+₫120B</span>';
    }
    if (pt === 'com-author') {
      /* Item vẫn dùng trên bài chi tiết — không gắn feed card */
      return '<div class="ifx-com-article__author" style="display:flex;align-items:center;gap:8px"><span class="ifx-com-card__avatar ix-avatar ix-avatar-sm ix-avatar-accent">NA</span>' +
        '<span>Nguyễn Văn A</span><span class="ix-chip ix-chip-tier-premium">Premium</span></div>';
    }
    if (pt === 'com-title') {
      return '<div class="ifx-com-post__title-row"><span class="ifx-com-post__time">2h</span><span class="ifx-com-post__title-sep">·</span>' +
        '<span class="ifx-com-post__title-text">Thị trường hôm nay tăng mạnh</span></div>';
    }
    if (pt === 'com-stats') {
      return '<div class="ifx-com-post__stats"><span><i class="ti ti-heart"></i>128</span><span><i class="ti ti-message"></i>24</span><span><i class="ti ti-eye"></i>1.2k</span></div>';
    }
    if (pt === 'story-rank') {
      return '<div class="ix-list-item ifx-com-story-rank" style="padding:4px 0;border:0">' +
        '<div class="ifx-com-story-rank__num">1</div><div class="ifx-com-story-rank__body">' +
        '<div class="ifx-com-story-rank__title-row"><span class="ifx-com-story-rank__title">Chủ đề nổi bật</span></div>' +
        '<div class="ifx-com-story-rank__sub">42 bài · 2.1k tương tác</div></div></div>';
    }
    if (pt === 'topwl-row') {
      return '<div class="ifx-com-topwl-row"><div class="ifx-com-topwl-row__main">' +
        '<span class="ifx-com-topwl-rank">#1</span><span class="ifx-com-topwl-user">Trader A</span>' +
        '<span class="ifx-com-topwl-perf is-up">+18.2%</span></div></div>';
    }
    if (pt === 'follow-row') {
      return '<div style="display:flex;align-items:center;gap:10px"><span class="ix-avatar ix-avatar-sm ix-avatar-accent">B</span>' +
        '<span style="flex:1;font-size:14px">Bùi Thị B</span><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" disabled>Theo dõi</button></div>';
    }
    if (pt === 'timeline') {
      return '<div class="ifx-profile-timeline__item" style="padding-bottom:8px"><div class="ifx-profile-timeline__rail">' +
        '<span class="ifx-profile-timeline__dot"></span></div><div class="ifx-profile-timeline__body">' +
        '<div class="ifx-profile-timeline__meta"><span class="ifx-profile-timeline__ctx">Bình luận</span>' +
        '<span class="ifx-profile-timeline__time">3h trước</span></div></div></div>';
    }
    if (pt === 'empty') {
      return '<div class="ifx-wl-empty" style="padding:16px"><i class="ti ti-folder-off" style="display:block;margin-bottom:8px"></i><span>Chưa có dữ liệu</span></div>';
    }
    if (pt === 'membership') {
      return '<div style="display:flex;align-items:center;gap:10px"><span class="ix-avatar ix-avatar-sm ix-avatar-accent">A</span>' +
        '<span>Nguyễn Văn A</span><span class="ix-chip ix-chip-tier-elite">Elite</span></div>';
    }
    if (pt === 'notification') {
      return '<div class="ix-list-item" style="border:0;padding:8px 0"><i class="ti ti-bell" style="margin-right:8px"></i>' +
        '<span style="flex:1">Cảnh báo VCB đã kích hoạt</span><span style="font-size:10px;color:var(--ix-text-muted)">5p</span></div>';
    }
    if (pt === 'wallet') {
      return '<div style="display:flex;align-items:center;gap:12px;width:100%"><span style="font-size:10px;color:var(--ix-text-muted)">Số dư</span>' +
        '<strong class="ifx-typo-money" style="flex:1">₫2.5M</strong><button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" disabled>Nạp</button></div>';
    }
    if (pt === 'online') {
      return '<div style="display:flex;align-items:center;gap:8px"><span class="ix-status-dot" style="background:var(--ix-success)"></span><span style="font-size:12px;color:var(--ix-text-muted)">Đang hoạt động</span></div>';
    }
    if (pt === 'article-meta') {
      return '<div style="display:flex;gap:12px;font-size:10px;color:var(--ix-text-muted)"><span>CafeF</span><span>2h trước</span><span>3 phút đọc</span></div>';
    }
    if (pt === 'tag-list') {
      return '<div class="ifx-com-post__tags"><a href="#" class="ix-chip ix-chip-outline" onclick="return false">#VNINDEX</a>' +
        '<span class="ix-chip ix-chip-info">VCB</span></div>';
    }
    if (pt === 'breaking' || pt === 'hot') {
      var cls = pt === 'breaking' ? 'ix-badge-danger' : 'ix-badge-warning';
      var lbl = pt === 'breaking' ? 'TIN NÓNG' : 'HOT';
      return '<div style="display:flex;align-items:center;gap:8px"><span class="ix-badge ' + cls + '">' + lbl + '</span><span style="font-size:12px">Thị trường biến động</span></div>';
    }
    if (pt === 'category') {
      return '<span class="ix-chip ix-chip-outline">Thị trường</span>';
    }
    if (pt === 'insight-trend') {
      return '<div style="display:flex;align-items:center;gap:8px"><i class="ti ti-trending-up" style="color:var(--ix-success)"></i>' +
        '<span style="font-size:13px">Xu hướng tăng</span><span class="ix-chip ix-chip-info">Ngắn hạn</span></div>';
    }
    if (pt === 'confidence' || pt === 'progress') {
      return '<div style="width:140px"><div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px"><span>Độ tin cậy</span><strong>78%</strong></div>' +
        '<div class="ix-progress"><div class="ix-progress-bar" style="width:78%"></div></div></div>';
    }
    if (pt === 'scenario') {
      return '<div style="display:flex;align-items:center;gap:8px"><span class="ix-chip ix-chip-outline">Kịch bản A</span><span style="font-size:12px;color:var(--ix-text-muted)">Tích cực vừa phải</span></div>';
    }
    if (pt === 'risk') {
      return '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px">Mức rủi ro</span><span class="ix-badge ix-badge-warning">Trung bình</span></div>';
    }
    if (pt === 'framework') {
      return '<div style="display:flex;align-items:center;gap:8px"><i class="ti ti-chart-dots"></i><span style="font-size:13px">Phân tích kỹ thuật</span></div>';
    }
    if (pt === 'ref-price') {
      return '<div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:10px;color:var(--ix-text-muted)">Mức tham chiếu</span><span class="ifx-typo-price-m">108.0</span></div>';
    }
    if (pt === 'ai-summary') {
      return '<p class="ifx-insight-card__summary" style="margin:0;font-size:13px"><i class="ti ti-sparkles" style="margin-right:6px"></i>Thị trường duy trì xu hướng tích cực trong phiên.</p>';
    }
    if (pt === 'ai-score') {
      return '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:10px;color:var(--ix-text-muted)">AI Score</span><strong>8.2</strong><span class="ix-badge ix-badge-info">A</span></div>';
    }
    if (pt === 'ai-confidence') {
      return '<div style="display:flex;gap:8px;align-items:baseline"><span style="font-size:10px;color:var(--ix-text-muted)">Tin cậy</span><span class="ifx-typo-percent-up">85%</span></div>';
    }
    if (pt === 'ai-reason') {
      return '<div style="display:flex;gap:8px;font-size:12px;color:var(--ix-text-muted)"><span>•</span><span>KLGD tăng so với TB 20 phiên</span></div>';
    }
    if (pt === 'ai-warning') {
      return '<div class="ifx-item-ai-warning" data-ds-item-root>' +
        '<i class="ti ti-alert-circle"></i><span>Dữ liệu AI có thể chưa đầy đủ</span></div>';
    }
    if (pt === 'ai-highlight') {
      return '<div class="ifx-item-ai-highlight" data-ds-item-root>' +
        '<span class="ix-badge ix-badge-info">AI</span><span>Điểm nổi bật trong phiên</span></div>';
    }
    if (pt === 'stat-card') {
      return '<div class="ix-stat-card-h" style="min-width:160px"><div class="ix-stat-icon"><i class="ti ti-chart-line"></i></div>' +
        '<div class="ix-stat-info"><div class="ix-stat-label">Người dùng</div><div class="ix-stat-value">12.4k</div><div class="ix-stat-sub">+8% tuần</div></div></div>';
    }
    if (pt === 'list-row') {
      return '<div class="ix-list-item" style="border:0;padding:8px 0"><span class="ix-avatar ix-avatar-sm ix-avatar-accent">X</span>' +
        '<span style="flex:1">Mục danh sách</span><span style="font-size:12px;color:var(--ix-text-muted)">→</span></div>';
    }
    if (pt === 'loading') {
      return '<div style="display:flex;flex-direction:column;gap:8px;width:120px"><span class="ix-skeleton" style="height:12px;width:80%"></span><span class="ix-skeleton" style="height:12px;width:55%"></span></div>';
    }
    if (pt === 'error') {
      return '<div class="ifx-item-error" data-ds-item-root>' +
        '<i class="ti ti-alert-circle"></i>' +
        '<span class="ifx-item-error__msg">Không tải được</span>' +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" disabled>Thử lại</button></div>';
    }
    if (pt === 'filter') {
      return '<div class="ifx-wl-folder-pill"><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" disabled>Danh mục 1</button></div>';
    }
    if (pt === 'alert-item') {
      return '<div class="ifx-alert-item" style="margin:0"><div class="ifx-alert-item__main"><span class="ifx-alert-item__cond">VCB &gt; 115,000</span>' +
        '<span class="ifx-alert-item__state">Đang theo dõi</span></div></div>';
    }
    if (pt === 'status') {
      return '<div style="display:flex;align-items:center;gap:8px"><span class="ix-status-dot"></span><span style="font-size:13px">Hoạt động</span></div>';
    }

    return '<span class="' + e(bundle.className) + '">' + e(bundle.name) + '</span>';
  }

  function renderPropRow(groupTitle, bundle, property) {
    if (!property || !property.key) return '';
    var domId = domPropId(bundle, property);
    var ref = resolvePropRef(groupTitle, bundle, property);
    var value = resolveRefValue(ref.refKind, ref.token);

    return '<div class="ds-ref-prop-row" data-ds-item-prop="' + IC.esc(domId) + '">' +
      '<div class="ds-ref-prop-row__property">' +
        '<span>' + IC.esc(property.key) + '</span>' +
        '<span class="ds-ref-section__note">' + IC.esc(property.variable || '') + '</span>' +
      '</div>' +
      '<select class="ds-ref-prop-row__token" data-ds-token aria-label="Token ' + IC.esc(property.key) + '">' +
        tokenOptions(property, ref.token) +
      '</select>' +
      '<div class="ds-ref-prop-row__value" data-ds-value aria-label="Value">' + IC.esc(value) + '</div>' +
    '</div>';
  }

  function renderBundle(groupTitle, bundle) {
    var propsHtml = bundle.properties.length
      ? bundle.properties.map(function (p) { return renderPropRow(groupTitle, bundle, p); }).join('')
      : '';

    return '<div class="ds-ref-bundle ds-ref-bundle--item" data-ds-item-bundle="' + IC.esc(bundle.id) + '">' +
      '<div class="ds-ref-bundle__preview ds-item-preview">' + previewHtml(bundle) + '</div>' +
      '<div class="ds-ref-bundle__name">' +
        '<span class="ds-ref-bundle__name-title">' + IC.esc(bundle.name) + '</span>' +
        '<span class="ds-ref-bundle__name-meta">' + IC.esc(surfaceLabel(bundle.surface)) + '</span>' +
        '<span class="ds-ref-bundle__name-class">' + IC.esc(bundle.className) + '</span>' +
      '</div>' +
      '<div class="ds-ref-bundle__details">' +
        anatomyHtml(bundle) +
        (propsHtml ? '<div class="ds-item-props">' + propsHtml + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  function renderSection(group) {
    var note = group.note ? ' <span class="ds-ref-section__note">' + IC.esc(group.note) + '</span>' : '';
    return '<section class="ds-ref-section">' +
      '<h2 class="ds-ref-section__title">' + IC.esc(group.title) +
        ' <span class="ds-ref-section__count">' + group.items.length + '</span>' + note +
      '</h2>' +
      '<div class="ds-ref-table">' +
        '<div class="ds-ref-table__head">' +
          '<span class="ds-ref-table__head-preview">Preview</span>' +
          '<span class="ds-ref-table__head-name">Tên</span>' +
          '<div class="ds-ref-table__head-details">' +
            '<span>Structure · Layout</span><span>Token</span><span>Value</span>' +
          '</div>' +
        '</div>' +
        group.items.map(function (b) { return renderBundle(group.title, b); }).join('') +
      '</div>' +
    '</section>';
  }

  function renderPage(pageCopy) {
    var page = IC.PAGE;
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : page.groups;
    var counts = IC.pageCounts();
    return '<div class="ds-ref-page">' +
      '<div class="ds-ref-page__head">' +
        '<h1 class="ix-page-title">' + IC.esc(page.file) + '</h1>' +
        '<p class="ds-ref-page__meta">' + counts.total + ' items · ' + counts.shared + ' shared · ' + counts.user + ' user · ' +
          'Item = 2–6 atoms + <strong>structure cố định</strong> · Layout → Primitive · Màu → Design Token · không khuyến nghị lệnh</p>' +
      '</div>' +
      groups.map(renderSection).join('') +
    '</div>';
  }

  function updateBundlePreview(bundleEl, groupTitle, bundle) {
    var host = bundleEl.querySelector('.ds-ref-bundle__preview');
    if (host) host.innerHTML = previewHtml(bundle);
    applyPreviewStyles(bundleEl, groupTitle, bundle);
  }

  function bindPage(root, pageCopy) {
    var groups = (pageCopy && pageCopy.groups) ? pageCopy.groups : IC.PAGE.groups;
    groups.forEach(function (group) {
      group.items.forEach(function (bundle) {
        var bundleEl = root.querySelector('[data-ds-item-bundle="' + bundle.id + '"]');
        if (!bundleEl) return;
        applyPreviewStyles(bundleEl, group.title, bundle);
        bundle.properties.forEach(function (property) {
          var id = IC.propKey(group.title, bundle, property);
          var domId = domPropId(bundle, property);
          var row = bundleEl.querySelector('[data-ds-item-prop="' + domId + '"]');
          if (!row) return;
          var select = row.querySelector('[data-ds-token]');
          var valueEl = row.querySelector('[data-ds-value]');
          select.addEventListener('change', function () {
            var token = select.value;
            var payload = {
              refKind: property.refKind,
              token: token,
              key: property.key,
              variable: property.variable,
              logicalId: bundle.logicalId,
              className: bundle.className
            };
            store.server[id] = payload;
            valueEl.textContent = resolveRefValue(property.refKind, token);
            updateBundlePreview(bundleEl, group.title, bundle);
            scheduleSave(id, payload, row);
          });
        });
      });
    });
  }

  function mergePrimitiveOverridesFromStorage(map) {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('iflux-ds-pt:') !== 0) continue;
        var pid = key.slice('iflux-ds-pt:'.length);
        var data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data && (data.token || data.value != null)) map[pid] = data;
      }
    } catch (e) { /* ignore */ }
    return map;
  }

  function syncPrimitiveOverrides() {
    semanticIndex = null;
    store.dtPrim = mergeDtOverridesFromStorage();
    var map = {};
    var base = apiBase();
    var done = function () {
      mergePrimitiveOverridesFromStorage(map);
      PC.setPrimitiveOverrides(map);
      buildSemanticIndex();
    };
    if (!base) {
      done();
      return Promise.resolve();
    }
    return fetch(base + '/overrides')
      .then(function (r) { return r.json(); })
      .then(function (body) {
        if (body && body.items) {
          Object.keys(body.items).forEach(function (k) {
            if (k.indexOf('primitive-tokens::') === 0) {
              var entry = body.items[k];
              if (entry && entry.meta) {
                map[k] = {
                  token: entry.meta.token || '',
                  value: entry.value,
                  cssVar: entry.meta.cssVar || ''
                };
              }
            }
            if (k.indexOf('design-tokens::') === 0) {
              var dt = body.items[k];
              if (dt && dt.meta && dt.meta.logicalId && dt.meta.token) {
                store.dtPrim[dt.meta.logicalId] = dt.meta.token;
              }
            }
          });
        }
        done();
      })
      .catch(function () { done(); });
  }

  function loadServerOverrides() {
    var base = apiBase();
    var prim = syncPrimitiveOverrides();
    if (!base) {
      store.loaded = true;
      return prim.then(function () { store.loaded = true; });
    }
    return Promise.all([
      prim,
      fetch(base + '/overrides').then(function (r) { return r.json(); })
    ]).then(function (results) {
      var body = results[1];
      if (body && body.items) {
        Object.keys(body.items).forEach(function (k) {
          if (k.indexOf('items::') !== 0) return;
          var entry = body.items[k];
          if (entry && entry.meta && entry.meta.token) {
            store.server[k] = {
              refKind: entry.meta.refKind,
              token: entry.meta.token,
              key: entry.meta.property,
              variable: entry.meta.variable || '',
              logicalId: entry.meta.logicalId || ''
            };
          }
        });
      }
      store.loaded = true;
    }).catch(function () { store.loaded = true; });
  }

  global.IfluxDsItemsStudio = {
    renderPage: renderPage,
    bindPage: bindPage,
    loadServerOverrides: loadServerOverrides,
    syncPrimitiveOverrides: syncPrimitiveOverrides
  };
})(window);
