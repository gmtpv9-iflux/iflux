/* Block teaser — CTA nâng cấp theo quyền xem từng block (Admin Phân quyền sử dụng) */
(function (global) {
  'use strict';

  var TIER_ORDER = { guest: 0, free: 1, premium: 2, elite: 3 };
  var TIER_LABELS = { guest: 'Vãng lai', free: 'Miễn phí', premium: 'Premium', elite: 'Elite' };
  var _ctaBound = false;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function widgetIdForBlock(blockId) {
    if (!global.WidgetLibraryCatalog || !WidgetLibraryCatalog.allWidgetIdsInLibrary) return null;
    var ids = WidgetLibraryCatalog.allWidgetIdsInLibrary();
    var i;
    for (i = 0; i < ids.length; i++) {
      var dep = WidgetLibraryCatalog.getPageDeploy(ids[i]);
      if (dep && dep.blocks && dep.blocks.indexOf(blockId) >= 0) return ids[i];
    }
    return null;
  }

  function blockCopy(blockId) {
    var wid = widgetIdForBlock(blockId);
    if (wid && global.WidgetLibraryCatalog && WidgetLibraryCatalog.resolveWidgetCopy) {
      return WidgetLibraryCatalog.resolveWidgetCopy(wid);
    }
    if (global.EntitlementCatalog && EntitlementCatalog.getBlockLabel) {
      return { title: EntitlementCatalog.getBlockLabel(blockId), description: '' };
    }
    return { title: blockId, description: '' };
  }

  function lowestTierEnablingBlock(blockId) {
    var order = ['guest', 'free', 'premium', 'elite'];
    var i;
    for (i = 0; i < order.length; i++) {
      var plan = global.IfluxEntitlements && IfluxEntitlements.getPlan
        ? IfluxEntitlements.getPlan(order[i])
        : null;
      if (plan && global.EntitlementCatalog && EntitlementCatalog.resolveBlockEnabled) {
        if (EntitlementCatalog.resolveBlockEnabled(plan, blockId)) return order[i];
      }
    }
    var meta = global.EntitlementCatalog && EntitlementCatalog.getBlockById
      ? EntitlementCatalog.getBlockById(blockId)
      : null;
    return meta && meta.minTier ? meta.minTier : 'premium';
  }

  function resolveCta(blockId) {
    var ent = global.IfluxEntitlements;
    if (!ent || ent.hasBlock(blockId)) return null;

    var userTier = ent.resolveTier ? ent.resolveTier() : 'guest';
    var needTier = lowestTierEnablingBlock(blockId);
    var needLabel = TIER_LABELS[needTier] || needTier;
    var copy = blockCopy(blockId);
    var title = copy.title || blockId;

    if (userTier === 'guest') {
      if (needTier === 'free') {
        return {
          action: 'signup',
          label: 'Đăng ký miễn phí',
          href: '/dang-nhap?return=' + encodeURIComponent(location.pathname + location.search),
          message: title + ' có trong gói Miễn phí. Đăng ký để xem nội dung đầy đủ.'
        };
      }
      return {
        action: 'login',
        label: 'Đăng nhập để xem',
        href: '/dang-nhap?return=' + encodeURIComponent(location.pathname + location.search),
        message: title + ' dành cho thành viên gói ' + needLabel + '. Đăng nhập hoặc nâng cấp để mở khóa.'
      };
    }

    if (needTier === 'elite') {
      return {
        action: 'pricing',
        reason: 'elite_feature',
        label: 'Nâng cấp Elite',
        message: title + ' là nội dung Elite. Nâng cấp để xem dữ liệu đầy đủ.'
      };
    }

    if (needTier === 'premium' || TIER_ORDER[needTier] >= TIER_ORDER.premium) {
      return {
        action: 'pricing',
        reason: needTier === 'elite' ? 'elite_feature' : 'premium_feature',
        label: 'Nâng cấp lên ' + needLabel,
        message: title + ' cần gói ' + needLabel + '. Nâng cấp để xem nội dung.'
      };
    }

    return {
      action: 'pricing',
      reason: 'premium_feature',
      label: 'Nâng cấp lên ' + needLabel,
      message: title + ' chưa có trong gói hiện tại. Nâng cấp lên ' + needLabel + ' để xem.'
    };
  }

  function paywallHtml(blockId, cta) {
    if (!cta) return '';
    var btn;
    if (cta.action === 'signup' || cta.action === 'login') {
      btn = '<a href="' + esc(cta.href) + '" class="ix-btn ix-btn-primary ix-btn-sm">' + esc(cta.label) + '</a>';
    } else {
      var payload = esc(JSON.stringify({ reason: cta.reason || 'premium_feature', message: cta.message || '' }));
      btn = '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-pricing-open="' + payload + '">' + esc(cta.label) + '</button>';
    }
    return (
      '<div class="ifx-block-paywall" data-ifx-block-paywall="' + esc(blockId) + '">' +
        '<div class="ifx-block-paywall__icon"><i class="ti ti-lock"></i></div>' +
        '<p class="ifx-block-paywall__msg">' + esc(cta.message) + '</p>' +
        btn +
      '</div>'
    );
  }

  function contentRoots(blockEl) {
    var marked = blockEl.querySelectorAll('[data-ifx-ent-content]');
    if (marked.length) return Array.prototype.slice.call(marked);

    var roots = [];
    ['.ifx-mkt-card__body', '.ifx-mkt-sidebar-widget__body', '.ifx-flow-card__body', '.ifx-com-list-section__body'].forEach(function (sel) {
      blockEl.querySelectorAll(sel).forEach(function (n) { roots.push(n); });
    });

    if (!roots.length && blockEl.classList.contains('ifx-com-list-section')) {
      var afterHead = [];
      var passedHead = false;
      Array.prototype.forEach.call(blockEl.children, function (child) {
        if (child.classList.contains('ifx-com-list-head')) {
          passedHead = true;
          return;
        }
        if (passedHead) afterHead.push(child);
      });
      if (afterHead.length) return afterHead;
    }

    if (!roots.length && blockEl.classList.contains('ifx-mkt-section')) {
      var grid = blockEl.querySelector('.ifx-mkt-grid-2, .ifx-mkt-grid-3');
      if (grid) roots.push(grid);
    }

    if (!roots.length) {
      [
        '[data-ifx-com-trending-mount]',
        '[data-ifx-com-overview-mount]',
        '[data-ifx-com-breadth-sidebar-mount]',
        '[data-ifx-com-active-mount]',
        '[data-ifx-com-experts-mount]',
        '[data-ifx-faq-list]'
      ].forEach(function (sel) {
        blockEl.querySelectorAll(sel).forEach(function (n) { roots.push(n); });
      });
    }

    if (!roots.length && blockEl.id && !blockEl.querySelector('.ifx-widget__header, .ifx-mkt-section__title, .ifx-com-list-head')) {
      roots.push(blockEl);
    }

    return roots;
  }

  function hasStaticHead(blockEl) {
    return !!blockEl.querySelector(
      '.ifx-widget__header, .ifx-mkt-section__title, .ifx-com-list-head, [data-ifx-ent-head]'
    );
  }

  function ensureTeaserHead(blockEl, blockId) {
    if (hasStaticHead(blockEl)) return;
    if (blockEl.querySelector('[data-ifx-ent-head]')) return;
    var copy = blockCopy(blockId);
    var head = document.createElement('div');
    head.className = 'ifx-block-teaser-head';
    head.setAttribute('data-ifx-ent-head', '1');
    head.innerHTML =
      '<div class="ifx-block-teaser-head__title">' + esc(copy.title) + '</div>' +
      (copy.description ? '<p class="ifx-block-teaser-head__desc">' + esc(copy.description) + '</p>' : '');
    blockEl.insertBefore(head, blockEl.firstChild);
  }

  function lockBlock(blockEl, blockId) {
    var cta = resolveCta(blockId);
    if (!cta) return;
    ensureTeaserHead(blockEl, blockId);
    var roots = contentRoots(blockEl);
    if (!roots.length) roots.push(blockEl);

    roots.forEach(function (root) {
      root.classList.add('ifx-ent-content--locked');
      Array.prototype.forEach.call(root.children, function (child) {
        if (child.hasAttribute('data-ifx-block-paywall')) return;
        child.setAttribute('data-ifx-ent-hidden', '1');
        child.hidden = true;
      });
      if (!root.querySelector('[data-ifx-block-paywall]')) {
        root.insertAdjacentHTML('beforeend', paywallHtml(blockId, cta));
      }
    });

    blockEl.setAttribute('data-ifx-ent-access', 'teaser');
  }

  function unlockBlock(blockEl) {
    blockEl.setAttribute('data-ifx-ent-access', 'full');
    blockEl.querySelectorAll('[data-ifx-block-paywall]').forEach(function (node) { node.remove(); });
    blockEl.querySelectorAll('.ifx-ent-content--locked').forEach(function (root) {
      root.classList.remove('ifx-ent-content--locked');
    });
    blockEl.querySelectorAll('[data-ifx-ent-hidden]').forEach(function (node) {
      node.removeAttribute('data-ifx-ent-hidden');
      node.hidden = false;
    });
  }

  function bindCtaDelegation() {
    if (_ctaBound) return;
    _ctaBound = true;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-pricing-open]');
      if (!btn || !global.IfluxWebUI || !IfluxWebUI.openPricing) return;
      e.preventDefault();
      try {
        IfluxWebUI.openPricing(JSON.parse(btn.getAttribute('data-ifx-pricing-open') || '{}'));
      } catch (err) {
        IfluxWebUI.openPricing({});
      }
    });
  }

  bindCtaDelegation();

  global.IfluxBlockPaywall = {
    resolveCta: resolveCta,
    blockCopy: blockCopy,
    lockBlock: lockBlock,
    unlockBlock: unlockBlock,
    contentRoots: contentRoots
  };
})(window);
