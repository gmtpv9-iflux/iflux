/**
 * Widget Shell — sở hữu overlay badge khi host locked.
 * Permission Engine chỉ set class; Shell render UI; Entity Renderer mask tên.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function resolveTier() {
    if (global.IfluxEntitlements && IfluxEntitlements.resolveTier) {
      return IfluxEntitlements.resolveTier();
    }
    return 'guest';
  }

  /** Copy UI theo tier user — không quyết định locked. */
  function badgeCopyForTier(tier) {
    tier = String(tier || 'guest').toLowerCase();
    if (tier === 'guest') {
      return {
        action: 'login',
        label: 'Đăng nhập',
        caption: 'Đăng nhập để xem rất nhiều nội dung hữu ích của hệ thống',
        href: '/dang-nhap?return=' + encodeURIComponent(location.pathname + location.search)
      };
    }
    if (tier === 'free') {
      return {
        action: 'pricing',
        reason: 'premium_feature',
        label: 'Đăng ký Premium',
        caption: '14 ngày dùng thử'
      };
    }
    return {
      action: 'pricing',
      reason: 'elite_feature',
      label: 'Đăng ký trở thành Elite',
      caption: '14 ngày dùng thử'
    };
  }

  function ensureOverlay(host) {
    if (!host) return null;
    var ov = host.querySelector('[data-ifx-widget-overlay]');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'ifx-widget-overlay';
    ov.setAttribute('data-ifx-widget-overlay', '1');
    ov.hidden = true;
    host.appendChild(ov);
    return ov;
  }

  function renderOverlay(host, locked) {
    var ov = ensureOverlay(host);
    if (!ov) return;
    if (!locked) {
      ov.hidden = true;
      ov.innerHTML = '';
      return;
    }
    var cta = badgeCopyForTier(resolveTier());
    var btn;
    if (cta.action === 'login') {
      btn = '<a href="' + esc(cta.href) + '" class="ix-btn ix-btn-primary">' + esc(cta.label) + '</a>';
    } else {
      var payload = esc(JSON.stringify({ reason: cta.reason || 'premium_feature', message: cta.caption || '' }));
      btn = '<button type="button" class="ix-btn ix-btn-primary" data-ifx-pricing-open="' + payload + '">' +
        esc(cta.label) + '</button>';
    }
    ov.innerHTML =
      '<div class="ifx-widget-overlay__card">' +
        btn +
        '<p class="ifx-widget-overlay__caption">' + esc(cta.caption) + '</p>' +
      '</div>';
    ov.hidden = false;
  }

  function setLocked(host, locked) {
    if (!host) return;
    if (getComputedStyle(host).position === 'static') {
      host.classList.add('ifx-widget-shell');
    } else {
      host.classList.add('ifx-widget-shell');
    }
    host.classList.toggle('ifx-widget-locked', !!locked);
    host.setAttribute('data-ifx-ent-access', locked ? 'teaser' : 'full');
    renderOverlay(host, !!locked);
    var tpl = global.IfluxBlockTemplates;
    if (tpl) {
      if (locked && tpl.maskEntityNames) tpl.maskEntityNames(host);
      if (!locked && tpl.unmaskEntityNames) tpl.unmaskEntityNames(host);
    }
  }

  var _ctaBound = false;
  function bindCta() {
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

  bindCta();

  global.IfluxWidgetShell = {
    setLocked: setLocked,
    ensureOverlay: ensureOverlay,
    badgeCopyForTier: badgeCopyForTier
  };
})(window);
