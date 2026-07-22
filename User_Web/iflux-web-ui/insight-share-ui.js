/* Insight Card UI — nút share trên mọi block + preview + PNG (FR-10.01, BR-SH-01) */
(function (global) {
  'use strict';

  var LOGO_SVG = '<svg width="16" height="16" viewBox="0 0 32 22" fill="white"><path fill-rule="evenodd" d="M0 0v6.85c0 0-.13 2.16 1.98 3.99L13.69 22l6.09-.08L18.8 9.88l-2.31-2.71L9.24 0H0z"/><path fill-rule="evenodd" d="M7.7 16.44L23.66 0H32v6.88c0 0-.17 2.29-1.34 3.52L19.78 22h-6.09L7.7 16.44z"/></svg>';
  var _modalEl = null;
  var _currentShare = null;
  var _html2canvasLoading = false;

  var CARD_HEADER_H = 44;
  var CARD_FOOTER_H = 76;
  var CARD_BODY_PAD = 12;
  var CARD_MIN_W = 240;
  var CARD_MAX_W = 1100;

  /* Nhóm block — kích thước chuẩn theo layout trang (1fr : 2fr grid) */
  var INSIGHT_BLOCK_GROUPS = {
    dash_col_narrow: {
      id: 'dash_col_narrow',
      label: 'Dashboard · cột trái',
      columnSel: '.ifx-dash-grid__stack',
      fallbackWidth: 300,
      minWidth: 240,
      maxWidth: 360,
      maxContentHeight: 640
    },
    dash_col_wide: {
      id: 'dash_col_wide',
      label: 'Dashboard · cột phải',
      columnSel: '.ifx-dash-grid__stack',
      fallbackWidth: 640,
      minWidth: 480,
      maxWidth: 720,
      maxContentHeight: 900
    },
    market_sidebar: {
      id: 'market_sidebar',
      label: 'Thị trường · sidebar',
      columnSel: '.ifx-mkt-sidebar',
      fallbackWidth: 300,
      minWidth: 240,
      maxWidth: 360,
      maxContentHeight: 480
    },
    market_main: {
      id: 'market_main',
      label: 'Thị trường · nội dung chính',
      columnSel: '.ifx-mkt-main',
      fallbackWidth: 640,
      minWidth: 480,
      maxWidth: 720,
      maxContentHeight: 800
    },
    market_card: {
      id: 'market_card',
      label: 'Thị trường · card lưới',
      widthMode: 'element',
      fallbackWidth: 320,
      minWidth: 260,
      maxWidth: 720,
      maxContentHeight: 520
    },
    flow_sidebar: {
      id: 'flow_sidebar',
      label: 'Dòng tiền · sidebar',
      columnSel: '.ifx-flow-sidebar, .ifx-flow-market-sidebar',
      fallbackWidth: 300,
      minWidth: 240,
      maxWidth: 360,
      maxContentHeight: 480
    },
    flow_main: {
      id: 'flow_main',
      label: 'Dòng tiền · nội dung chính',
      columnSel: '.ifx-flow-layout > :last-child, .ifx-flow-main',
      fallbackWidth: 640,
      minWidth: 480,
      maxWidth: 720,
      maxContentHeight: 720
    },
    flow_card: {
      id: 'flow_card',
      label: 'Dòng tiền · card',
      widthMode: 'element',
      fallbackWidth: 640,
      minWidth: 480,
      maxWidth: 720,
      maxContentHeight: 560
    },
    flow_mcmp: {
      id: 'flow_mcmp',
      label: 'Dòng tiền · Mobile Comparison',
      widthMode: 'element',
      fallbackWidth: 960,
      minWidth: 900,
      maxWidth: 1100,
      maxContentHeight: 560
    },
    watchlist: {
      id: 'watchlist',
      label: 'Theo dõi',
      widthMode: 'element',
      fallbackWidth: 640,
      minWidth: 480,
      maxWidth: 720,
      maxContentHeight: 720
    },
    community_overview: {
      id: 'community_overview',
      label: 'Cộng đồng · tổng quan',
      widthMode: 'element',
      fallbackWidth: 640,
      minWidth: 480,
      maxWidth: 720,
      maxContentHeight: 360
    }
  };

  function clampCardWidth(w, minW, maxW) {
    minW = minW || CARD_MIN_W;
    maxW = maxW || CARD_MAX_W;
    return Math.round(Math.min(Math.max(Number(w) || minW, minW), maxW));
  }

  function resolveGroupProfile(block, def) {
    var groupId = typeof def.group === 'function' ? def.group(block) : def.group;
    var base = INSIGHT_BLOCK_GROUPS[groupId] || INSIGHT_BLOCK_GROUPS.market_main;
    var measured = Math.round(block ? block.offsetWidth : 0);
    var width;

    if (base.widthMode === 'element') {
      width = measured || base.fallbackWidth;
    } else {
      var col = null;
      if (base.columnSel && block) col = block.closest(base.columnSel);
      var columnW = col ? col.offsetWidth : base.fallbackWidth;
      width = (measured > 0 && measured < columnW * 0.92) ? measured : columnW;
    }

    width = clampCardWidth(width, base.minWidth, base.maxWidth);
    return {
      id: base.id,
      label: base.label,
      width: width,
      maxContentHeight: base.maxContentHeight || 900
    };
  }

  function applyCaptureFrame(el, width, maxHeight) {
    var backup = {
      width: el.style.width,
      maxWidth: el.style.maxWidth,
      minWidth: el.style.minWidth,
      height: el.style.height,
      overflow: el.style.overflow,
      boxSizing: el.style.boxSizing
    };
    el.style.width = width + 'px';
    el.style.maxWidth = width + 'px';
    el.style.minWidth = width + 'px';
    el.style.boxSizing = 'border-box';
    el.setAttribute('data-ifx-insight-capture', '1');
    /* Giữ body MCMP / duo nằm ngang khi frame hẹp hơn breakpoint 900px */
    el.querySelectorAll('.ifx-mcmp__body').forEach(function (body) {
      body.style.gridTemplateColumns = 'minmax(0, 1.15fr) minmax(0, 1.85fr)';
      body.style.display = 'grid';
    });
    el.querySelectorAll('.ifx-mcmp__chart').forEach(function (chart) {
      chart.style.borderRight = '1px solid var(--ix-border)';
      chart.style.borderBottom = 'none';
      chart.style.maxWidth = 'none';
      chart.style.margin = '0';
    });
    var contentH = Math.max(el.scrollHeight, el.offsetHeight, 1);
    var hardMax = 1600;
    contentH = Math.min(contentH, hardMax);
    el.style.height = contentH + 'px';
    el.style.overflow = 'hidden';
    backup.appliedHeight = contentH;
    return backup;
  }

  function restoreCaptureFrame(el, backup) {
    if (!el || !backup) return;
    el.style.width = backup.width;
    el.style.maxWidth = backup.maxWidth;
    el.style.minWidth = backup.minWidth;
    el.style.height = backup.height;
    el.style.overflow = backup.overflow;
    el.style.boxSizing = backup.boxSizing;
    el.removeAttribute('data-ifx-insight-capture');
    el.querySelectorAll('.ifx-mcmp__body, .ifx-mcmp__chart').forEach(function (node) {
      node.style.gridTemplateColumns = '';
      node.style.display = '';
      node.style.borderRight = '';
      node.style.borderBottom = '';
      node.style.maxWidth = '';
      node.style.margin = '';
    });
  }

  function computeCardLayout(capture) {
    capture = capture || {};
    var cardW = clampCardWidth(capture.logicalWidth);
    var innerW = Math.max(48, cardW - CARD_BODY_PAD * 2);
    var innerH;
    if (capture.pixelWidth && capture.pixelHeight) {
      innerH = Math.round(innerW * (capture.pixelHeight / capture.pixelWidth));
    } else if (capture.logicalHeight) {
      innerH = Math.round(Number(capture.logicalHeight) - CARD_BODY_PAD * 2);
    } else {
      innerH = 160;
    }
    innerH = Math.max(48, innerH);
    var bodyH = innerH + CARD_BODY_PAD * 2;
    return {
      cardWidth: cardW,
      contentWidth: innerW,
      contentHeight: innerH,
      bodyHeight: bodyH,
      bodyPadding: CARD_BODY_PAD,
      cardHeight: CARD_HEADER_H + bodyH + CARD_FOOTER_H,
      groupId: capture.groupId || null
    };
  }

  function applyCardLayout(card, capture) {
    if (!card) return null;
    var layout = computeCardLayout(capture);
    card.style.width = layout.cardWidth + 'px';
    card.style.maxWidth = layout.cardWidth + 'px';
    card.style.height = layout.cardHeight + 'px';
    card.style.minHeight = layout.cardHeight + 'px';
    card.style.overflow = 'hidden';
    card.style.flexShrink = '0';
    card.dataset.ifxLayout = JSON.stringify(layout);
    if (layout.groupId) card.dataset.ifxGroup = layout.groupId;

    var body = card.querySelector('.ifx-insight-card__body');
    if (body) {
      body.style.padding = layout.bodyPadding + 'px';
      body.style.boxSizing = 'border-box';
      body.style.height = layout.bodyHeight + 'px';
      body.style.minHeight = layout.bodyHeight + 'px';
      body.style.overflow = 'hidden';
    }

    var img = card.querySelector('.ifx-insight-card__capture');
    if (img) {
      img.style.width = layout.contentWidth + 'px';
      img.style.height = layout.contentHeight + 'px';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.objectFit = 'fill';
      img.style.objectPosition = 'top left';
      img.style.display = 'block';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 2px 14px rgba(0, 0, 0, 0.28)';
      img.style.verticalAlign = 'top';
    }
    return layout;
  }

  function scaleCardForViewport(cardEl, containerEl, maxHeight) {
    if (!cardEl || !containerEl) return 1;
    cardEl.style.transform = 'none';
    cardEl.style.margin = '0 auto';
    var layout;
    try {
      layout = JSON.parse(cardEl.dataset.ifxLayout || '{}');
    } catch (e) {
      layout = {};
    }
    var cardW = layout.cardWidth || cardEl.offsetWidth || CARD_MIN_W;
    var cardH = layout.cardHeight || cardEl.offsetHeight || 200;
    var maxW = Math.max(120, containerEl.clientWidth - 16);
    var maxH = maxHeight || Math.max(120, containerEl.clientHeight - 16);
    var scale = Math.min(1, maxW / cardW, maxH / cardH);
    cardEl.style.transformOrigin = 'top center';
    if (scale < 0.999) {
      cardEl.style.transform = 'scale(' + scale + ')';
      containerEl.style.minHeight = Math.ceil(cardH * scale + 12) + 'px';
    } else {
      containerEl.style.minHeight = '';
    }
    cardEl.dataset.ifxPreviewScale = String(scale);
    return scale;
  }

  function exportCardToPng(cardEl, cb) {
    if (!cardEl) {
      cb(null);
      return;
    }
    var layout;
    try {
      layout = JSON.parse(cardEl.dataset.ifxLayout || '{}');
    } catch (e) {
      layout = {};
    }
    var clone = cardEl.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.position = 'fixed';
    clone.style.left = '-99999px';
    clone.style.top = '0';
    clone.style.zIndex = '-1';
    clone.style.margin = '0';
    if (layout.cardWidth) {
      clone.style.width = layout.cardWidth + 'px';
      clone.style.height = layout.cardHeight + 'px';
    }
    document.body.appendChild(clone);

    var imgs = clone.querySelectorAll('img');
    var pending = imgs.length;
    function runCapture() {
      flattenCardToPng(clone, function (url) {
        if (clone.parentNode) clone.parentNode.removeChild(clone);
        cb(url);
      });
    }
    if (!pending) {
      runCapture();
      return;
    }
    imgs.forEach(function (im) {
      function tick() {
        pending -= 1;
        if (pending <= 0) runCapture();
      }
      if (im.complete) tick();
      else {
        im.onload = tick;
        im.onerror = tick;
      }
    });
  }

  /* Dashboard widget — nhóm theo độ rộng block (⅓ / ½ / Full) */
  function dashboardWidgetGroup(el) {
    var node = el && el.closest ? el.closest('.ifx-widget') : el;
    if (!node) return 'dash_col_wide';
    var width = node.getAttribute('data-ifx-widget-width');
    return width === 'third' ? 'dash_col_narrow' : 'dash_col_wide';
  }

  var BLOCK_DEFS = [
    {
      root: '.ifx-widget',
      group: dashboardWidgetGroup,
      head: '.ifx-widget__header',
      actions: '.ifx-widget__actions',
      body: '.ifx-widget__body',
      title: '.ifx-widget__header > h3',
      meta: function (el) {
        var type = el.getAttribute('data-widget-type') || 'widget';
        var reg = global.IfluxWidgetRegistry && IfluxWidgetRegistry.byType(type);
        return {
          entityType: 'widget',
          entityId: type,
          title: reg ? reg.title : text(el, '.ifx-widget__header > h3') || 'Tiện ích',
          subtitle: reg ? reg.description : text(el, '.ifx-widget__subtitle'),
          sourcePage: 'dashboard'
        };
      }
    },
    {
      root: '.ifx-mkt-liq-block',
      group: 'market_card',
      head: '.ifx-widget__header',
      body: '.ifx-mkt-liq-block__body',
      meta: function (el) {
        var metric = el.getAttribute('data-ifx-liq-metric') || 'volume';
        return {
          entityType: 'market_liquidity',
          entityId: metric === 'value' ? 'WGT-MKT-008' : 'WGT-MKT-007',
          title: text(el, '.ifx-widget__header > h3') ||
            (metric === 'value' ? 'Giá trị giao dịch (GTGD)' : 'Khối lượng giao dịch (KLGD)'),
          subtitle: text(el, '.ifx-widget__subtitle'),
          sourcePage: location.pathname.indexOf('market') >= 0 ? 'market' : 'dashboard'
        };
      },
      bodyResolver: function (el) {
        return el.querySelector('.ifx-mkt-liq-block__body') || el;
      }
    },
    {
      root: '.ifx-mkt-card',
      group: 'market_card',
      head: '.ifx-widget__header',
      body: '.ifx-mkt-card__body',
      title: '.ifx-widget__header > h3',
      meta: function (el) {
        return {
          entityType: 'market_block',
          entityId: el.id || guessId(el, 'mkt'),
          title: text(el, '.ifx-widget__header > h3') || 'Thị trường',
          sourcePage: 'market'
        };
      }
    },
    {
      root: '.ifx-mkt-sidebar-widget',
      group: 'market_sidebar',
      head: '.ifx-widget__header',
      body: '.ifx-mkt-sidebar-widget__body',
      meta: function (el) {
        return {
          entityType: 'market_sidebar',
          entityId: el.id || guessId(el, 'sidebar'),
          title: text(el, '.ifx-widget__header > h3') || 'Tổng quan thị trường',
          sourcePage: 'market'
        };
      }
    },
    {
      root: '.ifx-mkt-section',
      group: 'market_main',
      head: '.ifx-mkt-section__title',
      body: null,
      meta: function (el) {
        return {
          entityType: 'market_section',
          entityId: guessId(el, 'section'),
          title: text(el, '.ifx-mkt-section__title') || 'Thị trường',
          sourcePage: 'market'
        };
      },
      bodyResolver: function (el) {
        var next = el.nextElementSibling;
        if (next) return next;
        return el.parentElement;
      }
    },
    {
      root: '.ifx-flow-card',
      group: 'flow_card',
      head: '.ifx-widget__header',
      body: '.ifx-flow-card__body',
      title: '.ifx-widget__header > h3',
      meta: function (el) {
        return {
          entityType: 'flow_block',
          entityId: el.id || guessId(el, 'flow'),
          title: text(el, '.ifx-widget__header > h3') || 'Dòng tiền',
          subtitle: text(el, '.ifx-widget__subtitle') || text(el, '.ifx-flow-card__sub'),
          sourcePage: 'flow'
        };
      }
    },
    {
      root: '.ifx-mcmp',
      group: 'flow_mcmp',
      head: '.ifx-mcmp__head',
      body: '.ifx-mcmp__body',
      title: '.ifx-mcmp__title',
      meta: function (el) {
        var blockId = el.getAttribute('data-ifx-mcmp-block') || el.id || guessId(el, 'mcmp');
        return {
          entityType: 'flow_score_block',
          entityId: blockId,
          title: text(el, '.ifx-mcmp__title') || 'Top 10 dòng tiền',
          subtitle: text(el, '.ifx-mcmp__meta'),
          sourcePage: 'flow'
        };
      }
    },
    {
      root: '.ifx-wl-block',
      group: 'watchlist',
      head: '.ifx-wl-block__bar',
      body: '.ifx-wl-block__list, .ifx-wl-block__body',
      meta: function (el) {
        return {
          entityType: 'watchlist',
          entityId: 'watchlist',
          title: 'Theo dõi',
          sourcePage: location.pathname.indexOf('watchlist') >= 0 ? 'watchlist' : 'dashboard'
        };
      },
      bodyResolver: function (el) {
        return el.querySelector('.ifx-wl-block__list') || el.querySelector('.ifx-wl-block__body') || el;
      }
    },
    {
      root: '.ifx-com-overview',
      group: 'community_overview',
      head: '.ifx-widget__header',
      body: '.ifx-com-overview__indices, .ifx-com-overview',
      meta: function (el) {
        return {
          entityType: 'community_overview',
          entityId: 'market_overview',
          title: text(el, '.ifx-widget__header > h3') || 'Tổng quan thị trường',
          sourcePage: 'community'
        };
      },
      bodyResolver: function (el) {
        return el.querySelector('.ifx-com-overview__indices') || el;
      }
    },
    {
      root: '.ifx-com-breadth-sidebar',
      group: 'community_breadth',
      head: '.ifx-widget__header',
      body: '[data-ifx-com-breadth-mount], [data-ifx-breadth-block]',
      meta: function (el) {
        return {
          entityType: 'community_breadth',
          entityId: 'market_breadth',
          title: text(el, '.ifx-widget__header > h3') || 'Độ rộng thị trường',
          sourcePage: 'community'
        };
      },
      bodyResolver: function (el) {
        return el.querySelector('[data-ifx-com-breadth-mount]') ||
          el.querySelector('[data-ifx-breadth-block]') || el;
      }
    },
    {
      root: '.ifx-com-trending-panel--stocks',
      group: 'community_trending_stocks',
      head: '.ifx-widget__header',
      body: '.ifx-cap-treemap, [data-ifx-cap-treemap]',
      meta: function (el) {
        return {
          entityType: 'community_trending',
          entityId: 'top_stocks',
          title: text(el, '.ifx-widget__header > h3') || 'Cổ phiếu được quan tâm hàng đầu',
          sourcePage: 'community'
        };
      },
      bodyResolver: function (el) {
        return el.querySelector('[data-ifx-cap-treemap]') || el.querySelector('.ifx-cap-treemap') || el;
      }
    },
    {
      root: '.ifx-com-trending-panel--stories',
      group: 'community_trending_stories',
      head: '.ifx-widget__header',
      body: '.ifx-com-story-rank-list',
      meta: function (el) {
        return {
          entityType: 'community_trending',
          entityId: 'positive_stories',
          title: text(el, '.ifx-widget__header > h3') || 'Chủ đề tích cực hàng đầu',
          sourcePage: 'community'
        };
      }
    }
  ];

  function text(root, sel) {
    if (!root) return '';
    var node = root.querySelector(sel);
    return node ? String(node.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function guessId(el, prefix) {
    var id = el && el.id;
    if (id) return id;
    return prefix + '_' + Math.random().toString(36).slice(2, 8);
  }

  function formatTs(d) {
    d = d || new Date();
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  function qrUrl(data) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=144x144&margin=0&data=' + encodeURIComponent(data);
  }

  function ensureModal() {
    if (_modalEl && !_modalEl.querySelector('.ifx-insight-modal__footer-panel')) {
      _modalEl.remove();
      _modalEl = null;
    }
    if (_modalEl) return _modalEl;
    _modalEl = document.createElement('div');
    _modalEl.className = 'ix-modal-overlay ifx-insight-modal';
    _modalEl.id = 'ifxInsightShareModal';
    _modalEl.setAttribute('role', 'dialog');
    _modalEl.setAttribute('aria-modal', 'true');
    _modalEl.innerHTML =
      '<div class="ix-modal-box ifx-insight-modal__box">' +
        '<div class="ifx-insight-modal__head">' +
          '<div class="ix-modal-title">Insight Card</div>' +
          '<div class="ix-modal-sub">Tải ảnh PNG đăng mạng xã hội · QR/link dẫn về trang chủ iFlux kèm mã giới thiệu</div>' +
        '</div>' +
        '<div class="ifx-insight-modal__preview-wrap" data-ifx-insight-preview>' +
          '<div class="ifx-insight-modal__loading"><i class="ti ti-loader" style="font-size:24px;animation:spin 1s linear infinite"></i><p style="margin:12px 0 0">Đang tạo Insight Card…</p></div>' +
        '</div>' +
        '<div class="ifx-insight-modal__footer-panel">' +
          '<div class="ifx-insight-modal__aff" data-ifx-insight-aff hidden></div>' +
          '<div class="ifx-insight-modal__url" data-ifx-insight-url-wrap hidden>' +
            '<input type="text" readonly data-ifx-insight-url />' +
            '<div class="ifx-insight-modal__url-actions">' +
              '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-insight-copy-link><i class="ti ti-link"></i> Sao chép link</button>' +
              '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-insight-download hidden><i class="ti ti-download"></i> Tải PNG</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(_modalEl);

    _modalEl.addEventListener('mousedown', function (e) {
      if (!e.target.closest('.ifx-insight-modal__box')) closeModal();
    });
    _modalEl.querySelector('[data-ifx-insight-copy-link]').addEventListener('click', copyLink);
    _modalEl.querySelector('[data-ifx-insight-download]').addEventListener('click', downloadPng);
    if (!_modalEl.dataset.ifxEscBound) {
      _modalEl.dataset.ifxEscBound = '1';
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && _modalEl && _modalEl.classList.contains('open')) closeModal();
      });
      window.addEventListener('resize', function () {
        if (!_modalEl || !_modalEl.classList.contains('open')) return;
        var card = _modalEl.querySelector('.ifx-insight-card');
        var wrap = _modalEl.querySelector('[data-ifx-insight-preview]');
        if (card && wrap) scaleCardForViewport(card, wrap, Math.round(window.innerHeight * 0.48));
      });
    }
    return _modalEl;
  }

  function openModal() {
    ensureModal().classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (_modalEl) _modalEl.classList.remove('open');
    document.body.style.overflow = '';
    if (global.IfluxInsightShareStore) IfluxInsightShareStore.clearShareStorage();
  }

  function setPreviewLoading() {
    var wrap = _modalEl.querySelector('[data-ifx-insight-preview]');
    wrap.innerHTML =
      '<div class="ifx-insight-modal__loading"><i class="ti ti-loader" style="font-size:24px"></i>' +
      '<p style="margin:12px 0 0">Đang tạo Insight Card…</p></div>';
    _modalEl.querySelector('[data-ifx-insight-aff]').hidden = true;
    _modalEl.querySelector('[data-ifx-insight-url-wrap]').hidden = true;
    _modalEl.querySelector('[data-ifx-insight-download]').hidden = true;
  }

  function unlockOverflowChain(el) {
    var stack = [];
    var node = el;
    while (node && node !== document.documentElement) {
      stack.push({
        node: node,
        overflow: node.style.overflow,
        maxHeight: node.style.maxHeight,
        height: node.style.height
      });
      node.style.overflow = 'visible';
      node.style.maxHeight = 'none';
      if (node === el) node.style.height = 'auto';
      node = node.parentElement;
    }
    return stack;
  }

  function restoreOverflowChain(stack) {
    stack.forEach(function (item) {
      item.node.style.overflow = item.overflow;
      item.node.style.maxHeight = item.maxHeight;
      item.node.style.height = item.height;
    });
  }

  function hideShareControls(root) {
    var hidden = [];
    var scope = root || document.body;
    scope.querySelectorAll('.ifx-insight-share-btn, .ifx-block-share-actions').forEach(function (el) {
      hidden.push({ el: el, display: el.style.display });
      el.style.display = 'none';
    });
    return hidden;
  }

  function restoreShareControls(hidden) {
    hidden.forEach(function (item) {
      item.el.style.display = item.display;
    });
  }

  function cleanupTempCapture(el) {
    if (el && el.dataset && el.dataset.ifxTempCapture === '1' && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function measureCaptureSize(el) {
    var w = Math.max(el.scrollWidth, el.offsetWidth, 1);
    var h = Math.max(el.scrollHeight, el.offsetHeight, 1);
    return { width: w, height: h };
  }

  function loadHtml2canvas(cb) {
    if (global.html2canvas) {
      cb(global.html2canvas);
      return;
    }
    if (_html2canvasLoading) {
      var wait = setInterval(function () {
        if (global.html2canvas) {
          clearInterval(wait);
          cb(global.html2canvas);
        }
      }, 80);
      return;
    }
    _html2canvasLoading = true;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.onload = function () {
      _html2canvasLoading = false;
      cb(global.html2canvas);
    };
    s.onerror = function () {
      _html2canvasLoading = false;
      cb(null);
    };
    document.head.appendChild(s);
  }

  function captureElement(el, profileOrCb, cb) {
    var profile = null;
    if (typeof profileOrCb === 'function') {
      cb = profileOrCb;
    } else {
      profile = profileOrCb;
      if (typeof cb !== 'function') cb = function () {};
    }
    if (!el) {
      cb(null);
      return;
    }
    loadHtml2canvas(function (h2c) {
      if (!h2c) {
        cleanupTempCapture(el);
        cb(null);
        return;
      }

      var capWidth = profile ? profile.width : measureCaptureSize(el).width;
      var frameBackup = profile ? applyCaptureFrame(el, capWidth, profile.maxContentHeight) : null;
      var capHeight = frameBackup ? frameBackup.appliedHeight : measureCaptureSize(el).height;

      var overflowStack = unlockOverflowChain(el);
      var hiddenControls = hideShareControls(el);
      var bg = getComputedStyle(el).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        bg = '#ffffff';
      }

      h2c(el, {
        backgroundColor: bg,
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: capWidth,
        height: capHeight,
        windowWidth: capWidth,
        windowHeight: capHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: function (doc, clone) {
          var target = clone.id && clone.querySelector ? clone : doc.body;
          if (clone.style) {
            clone.style.overflow = 'hidden';
            clone.style.width = capWidth + 'px';
            clone.style.height = capHeight + 'px';
          }
          /* html2canvas dùng windowWidth hẹp → media (max-width:900) xếp dọc; force ngang */
          if (doc.documentElement) {
            doc.documentElement.style.width = Math.max(capWidth, 1100) + 'px';
          }
          if (doc.body) {
            doc.body.style.width = Math.max(capWidth, 1100) + 'px';
          }
          var root = (clone.classList && clone) || target;
          if (root && root.setAttribute) root.setAttribute('data-ifx-insight-capture', '1');
          target.querySelectorAll('.ifx-insight-share-btn, .ifx-block-share-actions').forEach(function (n) {
            n.style.display = 'none';
          });
          target.querySelectorAll('.ifx-mcmp__body').forEach(function (body) {
            body.style.setProperty('grid-template-columns', 'minmax(0, 1.15fr) minmax(0, 1.85fr)', 'important');
            body.style.setProperty('display', 'grid', 'important');
          });
          target.querySelectorAll('.ifx-mcmp__chart').forEach(function (chart) {
            chart.style.setProperty('border-right', '1px solid var(--ix-border)', 'important');
            chart.style.setProperty('border-bottom', 'none', 'important');
            chart.style.setProperty('max-width', 'none', 'important');
            chart.style.setProperty('margin', '0', 'important');
          });
        }
      }).then(function (canvas) {
        restoreShareControls(hiddenControls);
        restoreOverflowChain(overflowStack);
        if (frameBackup) restoreCaptureFrame(el, frameBackup);
        cleanupTempCapture(el);
        cb({
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
          pixelWidth: canvas.width,
          pixelHeight: canvas.height,
          logicalWidth: capWidth,
          logicalHeight: capHeight,
          groupId: profile ? profile.id : null
        });
      }).catch(function () {
        restoreShareControls(hiddenControls);
        restoreOverflowChain(overflowStack);
        if (frameBackup) restoreCaptureFrame(el, frameBackup);
        cleanupTempCapture(el);
        cb(null);
      });
    });
  }

  function buildCardDom(title, capture, shareUrl, ref, ts, qrLink) {
    var captureDataUrl = capture && capture.dataUrl ? capture.dataUrl : capture;
    var card = document.createElement('div');
    card.className = 'ifx-insight-card';
    card.innerHTML =
      '<div class="ifx-insight-card__header">' +
        '<div class="ifx-insight-card__logo">' + LOGO_SVG + '</div>' +
        '<span class="ifx-insight-card__brand">iFlux</span>' +
        '<span class="ifx-insight-card__title">' + esc(title) + '</span>' +
      '</div>' +
      '<div class="ifx-insight-card__body">' +
        (captureDataUrl
          ? '<img class="ifx-insight-card__capture" alt="" crossorigin="anonymous" />'
          : '<div class="ifx-insight-card__summary">' + esc(title) + '</div>') +
      '</div>' +
      '<div class="ifx-insight-card__footer">' +
        '<img class="ifx-insight-card__qr" alt="QR" crossorigin="anonymous" />' +
        '<div class="ifx-insight-card__meta">' +
          '<strong class="ifx-insight-card__meta-head">Quét để vào iFlux</strong>' +
          (ref ? '<span class="ifx-insight-card__meta-ref">Mã giới thiệu: <strong>' + esc(ref) + '</strong></span>' : '') +
          '<span class="ifx-insight-card__ts">' + esc(ts) + '</span>' +
        '</div>' +
      '</div>';

    if (captureDataUrl) {
      card.querySelector('.ifx-insight-card__capture').src = captureDataUrl;
    }
    card.querySelector('.ifx-insight-card__qr').src = qrUrl(qrLink || shareUrl);
    return card;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCardToPreview(cardEl) {
    var wrap = _modalEl.querySelector('[data-ifx-insight-preview]');
    wrap.innerHTML = '';
    wrap.appendChild(cardEl);
    requestAnimationFrame(function () {
      scaleCardForViewport(cardEl, wrap, Math.round(window.innerHeight * 0.48));
    });
  }

  function flattenCardToPng(cardEl, cb) {
    loadHtml2canvas(function (h2c) {
      if (!h2c) {
        cb(null);
        return;
      }
      var w = Math.max(cardEl.scrollWidth, cardEl.offsetWidth);
      var h = Math.max(cardEl.scrollHeight, cardEl.offsetHeight);
      h2c(cardEl, {
        backgroundColor: '#12141c',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h
      }).then(function (canvas) {
        cb(canvas.toDataURL('image/png'));
      }).catch(function () {
        cb(null);
      });
    });
  }

  function showShareResult(cardEl, shareResult) {
    _currentShare = shareResult;
    renderCardToPreview(cardEl);

    var aff = _modalEl.querySelector('[data-ifx-insight-aff]');
    var ref = shareResult.ref;
    if (ref) {
      aff.hidden = false;
      aff.innerHTML = 'Link · QR dẫn về <strong>trang chủ iFlux</strong> kèm mã <strong>' + esc(ref) +
        '</strong> — người đăng ký qua link này được ghi nhận affiliate.';
    } else {
      aff.hidden = false;
      aff.innerHTML = 'Đăng nhập để gắn mã giới thiệu vào link trang chủ iFlux.';
    }

    var urlWrap = _modalEl.querySelector('[data-ifx-insight-url-wrap]');
    var urlInput = _modalEl.querySelector('[data-ifx-insight-url]');
    urlWrap.hidden = false;
    urlInput.value = shareResult.url;

    _modalEl.querySelector('[data-ifx-insight-download]').hidden = false;

    exportCardToPng(cardEl, function (png) {
      if (png && shareResult.record) shareResult.record.png_data_url = png;
    });
  }

  function finalizeCardAndShow(cardEl, capture, shareResult, ts) {
    var img = cardEl.querySelector('.ifx-insight-card__capture');
    if (img && img.naturalWidth > 0) {
      capture = Object.assign({}, capture, {
        pixelWidth: img.naturalWidth,
        pixelHeight: img.naturalHeight
      });
    }
    applyCardLayout(cardEl, capture);
    showShareResult(cardEl, shareResult);
  }

  function buildAndShowCard(meta, capture, shareResult, ts) {
    var cardEl = buildCardDom(meta.title, capture, shareResult.url, shareResult.ref, ts, shareResult.qrUrl);
    var img = cardEl.querySelector('.ifx-insight-card__capture');

    function done() {
      finalizeCardAndShow(cardEl, capture, shareResult, ts);
    }

    if (img && !img.complete) {
      img.onload = done;
      img.onerror = done;
      setTimeout(done, 400);
    } else {
      done();
    }
  }

  function copyLink() {
    if (!_currentShare) return;
    var url = _currentShare.url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        if (global.ixToast) ixToast('Đã sao chép link chia sẻ!', 'success');
      });
    } else if (global.ixToast) {
      ixToast(url, 'info');
    }
  }

  function downloadPng() {
    if (!_currentShare) return;
    var card = _modalEl.querySelector('.ifx-insight-card');
    if (!card) return;
    exportCardToPng(card, function (dataUrl) {
      if (!dataUrl) {
        if (global.ixToast) ixToast('Không tạo được ảnh PNG', 'danger');
        return;
      }
      if (_currentShare.record) _currentShare.record.png_data_url = dataUrl;
      triggerDownload(dataUrl);
    });
  }

  function triggerDownload(dataUrl) {
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'iflux-insight-' + Date.now() + '.png';
    a.click();
    if (global.ixToast) ixToast('Đã tải Insight Card PNG', 'success');
  }

  function resolveCaptureTarget(block, def) {
    if (def.captureResolver) return def.captureResolver(block);

    if (def.root === '.ifx-mkt-section') {
      var profile = resolveGroupProfile(block, def);
      var bundle = document.createElement('div');
      bundle.className = 'ifx-insight-capture-bundle';
      bundle.dataset.ifxTempCapture = '1';
      var title = block.querySelector('.ifx-mkt-section__title');
      var sub = block.querySelector('.ifx-mkt-section__sub');
      if (title) bundle.appendChild(title.cloneNode(true));
      if (sub) bundle.appendChild(sub.cloneNode(true));
      var next = block.nextElementSibling;
      if (next) bundle.appendChild(next.cloneNode(true));
      bundle.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + profile.width + 'px;z-index:-1';
      document.body.appendChild(bundle);
      return bundle;
    }

    if (def.root === '.ifx-wl-block') {
      return block;
    }

    return block;
  }

  function resolveBody(def, block) {
    if (def.bodyResolver) return def.bodyResolver(block);
    if (def.body) {
      var found = block.querySelector(def.body);
      if (found) return found;
    }
    return block;
  }

  function shareBlock(block, def) {
    if (!block || block.dataset.ifxShareBusy === '1') return;
    block.dataset.ifxShareBusy = '1';

    var meta = def.meta(block);
    var profile = resolveGroupProfile(block, def);
    var captureEl = resolveCaptureTarget(block, def);
    var ts = formatTs(new Date());

    openModal();
    setPreviewLoading();

    captureElement(captureEl, profile, function (capture) {
      if (!global.IfluxInsightShareStore) {
        block.dataset.ifxShareBusy = '0';
        if (global.ixToast) ixToast('Insight Card chưa tải xong — thử lại sau vài giây.', 'danger');
        return;
      }
      var shareResult = IfluxInsightShareStore.createShare({
        title: meta.title,
        subtitle: meta.subtitle,
        ref: IfluxInsightShareStore.getAffiliateRef()
      });

      buildAndShowCard(meta, capture, shareResult, ts);
      IfluxInsightShareStore.clearShareStorage();
      block.dataset.ifxShareBusy = '0';
      if (global.ixToast) ixToast('Insight Card đã sẵn sàng!', 'success');
    });
  }

  function createShareButton(block, def) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ifx-insight-share-btn';
    btn.title = 'Chia sẻ Insight Card';
    btn.setAttribute('aria-label', 'Chia sẻ Insight Card');
    btn.innerHTML = '<i class="ti ti-share-3"></i>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      shareBlock(block, def);
    });
    return btn;
  }

  var SOURCE_PAGE_LABELS = {
    dashboard: 'Nhà của tôi',
    market: 'Thị trường',
    flow: 'Dòng tiền',
    community: 'Cộng đồng',
    watchlist: 'Theo dõi'
  };

  function resolveSourcePageLabel(sourcePage) {
    if (SOURCE_PAGE_LABELS[sourcePage]) return SOURCE_PAGE_LABELS[sourcePage];
    var path = location.pathname || '';
    if (/\/home\//.test(path)) return 'Nhà của tôi';
    if (/\/market\//.test(path)) return 'Thị trường';
    if (/\/flow\//.test(path)) return 'Dòng tiền';
    if (/\/community\//.test(path)) return 'Cộng đồng';
    if (/\/watchlist\//.test(path)) return 'Theo dõi';
    return 'iFlux';
  }

  function ensureBlockActionButtons(actionsMount, block, def) {
    if (!actionsMount) return;
    stripBugButtons(actionsMount);
    var wrap = actionsMount.querySelector('.ifx-block-share-actions');
    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'ifx-block-share-actions';
      actionsMount.insertBefore(wrap, actionsMount.firstChild);
    }
    if (!wrap.querySelector('.ifx-insight-share-btn')) {
      wrap.appendChild(createShareButton(block, def));
    }
  }

  /** Gắn share cùng hàng với h3 (sau title, trước subtitle). */
  function ensureActionsOnHead(headEl) {
    if (!headEl) return null;
    stripBugButtons(headEl);
    var mountEl = headEl.querySelector('.ifx-mcmp__head-aside') || headEl;
    var actions = mountEl.querySelector(':scope > .ifx-block-share-actions') ||
      headEl.querySelector(':scope > .ifx-block-share-actions');
    if (!actions && mountEl !== headEl) {
      actions = headEl.querySelector('.ifx-block-share-actions');
      if (actions) mountEl.appendChild(actions);
    }
    if (!actions) {
      if (!headEl.classList.contains('ifx-widget__header')) {
        headEl.classList.add('ifx-block-head--with-share');
      }
      actions = document.createElement('div');
      actions.className = 'ifx-block-share-actions';
      var h3 = headEl.querySelector(':scope > h3');
      if (h3 && h3.nextSibling) {
        headEl.insertBefore(actions, h3.nextSibling);
      } else if (h3) {
        headEl.appendChild(actions);
      } else {
        mountEl.appendChild(actions);
      }
    } else {
      /* Đưa share lên ngay sau h3 nếu đang ở cuối (dưới subtitle) */
      var title = headEl.querySelector(':scope > h3');
      if (title && actions.parentNode === headEl && actions.previousElementSibling !== title) {
        headEl.insertBefore(actions, title.nextSibling);
      }
    }
    return actions;
  }

  function stripBugButtons(scope) {
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll('.ifx-widget-bug-btn').forEach(function (el) {
      el.remove();
    });
  }

  function patchBlock(block, def) {
    if (!block || block.dataset.ifxSharePatched === '1') return;
    if (def.root === '.ifx-wl-block' && block.closest('.ifx-widget')) return;
    var head = block.querySelector(def.head) || block;
    if (!head) return;

    if (head.matches && head.matches('.ifx-mkt-section__title') && !head.parentElement.classList.contains('ifx-section-head-row')) {
      var row = document.createElement('div');
      row.className = 'ifx-section-head-row ifx-block-head--with-share';
      head.parentElement.insertBefore(row, head);
      row.appendChild(head);
      head = row;
    }

    var actions = def.actions ? block.querySelector(def.actions) : null;
    if (actions) {
      ensureBlockActionButtons(actions, block, def);
    } else {
      actions = ensureActionsOnHead(head);
      if (!actions) {
        block.dataset.ifxSharePatched = '1';
        return;
      }
      if (!actions.querySelector('.ifx-insight-share-btn')) {
        actions.appendChild(createShareButton(block, def));
      }
    }
    block.dataset.ifxSharePatched = '1';
  }

  function patchAll(root) {
    root = root || document;
    BLOCK_DEFS.forEach(function (def) {
      root.querySelectorAll(def.root).forEach(function (block) {
        patchBlock(block, def);
      });
    });
  }

  function observeDynamicBlocks() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('.ifx-widget, .ifx-mkt-card, .ifx-mkt-liq-block, .ifx-flow-card, .ifx-mcmp, .ifx-wl-block, .ifx-mkt-section, .ifx-mkt-sidebar-widget, .ifx-com-overview, .ifx-com-breadth-sidebar, .ifx-com-trending-panel')) {
            patchAll(node.parentElement || document);
          } else if (node.querySelector) {
            patchAll(node);
          }
        });
      });
    });
    var canvas = document.querySelector('[data-ifx-dash-canvas]') || document.body;
    observer.observe(canvas, { childList: true, subtree: true });
  }

  function shareButtonHtml() {
    return '<button type="button" class="ifx-insight-share-btn" title="Chia sẻ Insight Card" aria-label="Chia sẻ Insight Card"><i class="ti ti-share-3"></i></button>';
  }

  function shareActionsHtml() {
    return '<span class="ifx-block-share-actions">' + shareButtonHtml() + '</span>';
  }

  function bindWidgetShare(node, widgetType) {
    if (!node) return;
    stripBugButtons(node);
    var btn = node.querySelector('.ifx-insight-share-btn');
    if (btn && btn.dataset.ifxBound) return;
    if (!btn) {
      var actions = node.querySelector('.ifx-widget__actions');
      if (!actions) return;
      var wrap = actions.querySelector('.ifx-block-share-actions');
      if (!wrap) {
        wrap = document.createElement('span');
        wrap.className = 'ifx-block-share-actions';
        actions.insertBefore(wrap, actions.firstChild);
      }
      if (!wrap.querySelector('.ifx-insight-share-btn')) {
        wrap.insertAdjacentHTML('beforeend', shareButtonHtml());
      }
      btn = wrap.querySelector('.ifx-insight-share-btn');
    }
    if (!btn) return;
    btn.dataset.ifxBound = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      shareBlock(node, {
        group: dashboardWidgetGroup,
        meta: function () {
          var reg = global.IfluxWidgetRegistry && widgetType ? IfluxWidgetRegistry.byType(widgetType) : null;
          return {
            entityType: 'widget',
            entityId: widgetType || 'widget',
            title: reg ? reg.title : text(node, '.ifx-widget__header > h3') || 'Tiện ích',
            subtitle: reg ? reg.description : '',
            sourcePage: 'dashboard'
          };
        },
        root: '.ifx-widget',
        captureResolver: function () {
          return node;
        }
      });
    });
  }

  function fitLandingCapture(record, imgEl, cardEl) {
    if (!imgEl || !cardEl) return;
    var snap = (record && record.snapshot) || {};
    var capture = {
      logicalWidth: (record && record.capture_logical_width) || snap.capture_logical_width,
      logicalHeight: (record && record.capture_logical_height) || snap.capture_logical_height,
      pixelWidth: (record && record.capture_pixel_width) || snap.capture_pixel_width,
      pixelHeight: (record && record.capture_pixel_height) || snap.capture_pixel_height,
      groupId: (record && record.card_group_id) || snap.card_group_id
    };
    if (imgEl.naturalWidth > 0) {
      capture.pixelWidth = imgEl.naturalWidth;
      capture.pixelHeight = imgEl.naturalHeight;
    } else if ((!capture.pixelWidth || !capture.pixelHeight) && imgEl.naturalWidth) {
      capture.pixelWidth = imgEl.naturalWidth;
      capture.pixelHeight = imgEl.naturalHeight;
    }
    applyCardLayout(cardEl, capture);
    var wrap = cardEl.closest('.ifx-shr-card-wrap') || cardEl.parentElement;
    if (wrap) {
      scaleCardForViewport(cardEl, wrap, Math.round(window.innerHeight * 0.62));
    }
  }

  function initLandingPage() {
    var card = document.getElementById('shr-card');
    var img = card && card.querySelector('.ifx-insight-card__capture');
    if (!card || !img) return;

    function apply() {
      fitLandingCapture(null, img, card);
    }
    if (img.complete) apply();
    else img.addEventListener('load', apply);
    window.addEventListener('resize', apply);
  }

  function init() {
    if (!document.querySelector('.ifx-app')) return;
    if (global.IfluxInsightShareStore) IfluxInsightShareStore.clearShareStorage();
    patchAll(document);
    observeDynamicBlocks();
    if (document.getElementById('shr-card')) initLandingPage();
  }

  global.IfluxInsightShare = {
    init: init,
    patchAll: patchAll,
    shareBlock: shareBlock,
    shareButtonHtml: shareButtonHtml,
    shareActionsHtml: shareActionsHtml,
    bindWidgetShare: bindWidgetShare,
    fitLandingCapture: fitLandingCapture,
    initLandingPage: initLandingPage,
    openFromPayload: function (payload, bodyEl) {
      openModal();
      setPreviewLoading();
      var profile = payload.cardGroupId && INSIGHT_BLOCK_GROUPS[payload.cardGroupId]
        ? Object.assign({}, INSIGHT_BLOCK_GROUPS[payload.cardGroupId], {
          id: payload.cardGroupId,
          width: payload.captureLogicalWidth || INSIGHT_BLOCK_GROUPS[payload.cardGroupId].fallbackWidth
        })
        : { id: 'market_main', width: bodyEl ? bodyEl.offsetWidth : 640, maxContentHeight: 800 };
      captureElement(bodyEl, profile, function (capture) {
        var shareResult = IfluxInsightShareStore.createShare({
          title: payload.title || 'Insight iFlux',
          ref: IfluxInsightShareStore.getAffiliateRef()
        });
        buildAndShowCard(
          { title: payload.title || 'Insight iFlux' },
          capture,
          shareResult,
          formatTs()
        );
        IfluxInsightShareStore.clearShareStorage();
      });
    },
    applyCardLayout: applyCardLayout,
    computeCardLayout: computeCardLayout,
    resolveGroupProfile: resolveGroupProfile,
    INSIGHT_BLOCK_GROUPS: INSIGHT_BLOCK_GROUPS
  };
})(window);
