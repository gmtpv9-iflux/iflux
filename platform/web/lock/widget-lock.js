/**
 * User Web — lớp phủ khoá widget (Phân quyền sử dụng). Nạp theo nhu cầu bởi iflux-block-gate.js,
 * chỉ khi trên trang có vùng .uw-locked. Không quyết định quyền — chỉ vẽ theo trạng thái người xem:
 *   khách (chưa đăng nhập) → «Đăng nhập» · đã đăng nhập, chưa đủ gói → «Nâng cấp gói».
 * Vùng khoá lồng trong vùng khoá khác → chỉ vùng ngoài cùng có lớp phủ.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tier() {
    return global.IfluxEntitlements && IfluxEntitlements.resolveTier ? IfluxEntitlements.resolveTier() : 'guest';
  }

  /** Nội dung CTA theo trạng thái người xem. */
  function copyFor(t) {
    t = String(t || 'guest').toLowerCase();
    if (t === 'guest') {
      return {
        action: 'login',
        label: 'Đăng nhập',
        caption: 'Đăng nhập để xem rất nhiều nội dung hữu ích của hệ thống',
        href: '/dang-nhap?return=' + encodeURIComponent(location.pathname + location.search)
      };
    }
    if (t === 'free') return { action: 'pricing', reason: 'premium_feature', label: 'Đăng ký Premium', caption: '14 ngày dùng thử' };
    return { action: 'pricing', reason: 'elite_feature', label: 'Đăng ký trở thành Elite', caption: '14 ngày dùng thử' };
  }

  /* ── Che / hiện tên đối tượng ── */
  function mask(root) {
    root.querySelectorAll('[data-ifx-role="entity-name"]').forEach(function (el) {
      var raw = el.getAttribute('data-ifx-entity-raw');
      if (raw == null) {
        raw = el.textContent || '';
        el.setAttribute('data-ifx-entity-raw', raw);
      }
      el.textContent = new Array(Math.max(3, Math.min(12, String(raw).length || 6)) + 1).join('•');
      el.setAttribute('data-ifx-entity-masked', '1');
      el.removeAttribute('title');
    });
  }
  function unmask(root) {
    root.querySelectorAll('[data-ifx-role="entity-name"][data-ifx-entity-masked]').forEach(function (el) {
      var raw = el.getAttribute('data-ifx-entity-raw') || '';
      el.textContent = raw;
      el.removeAttribute('data-ifx-entity-masked');
      if (raw) el.setAttribute('title', raw);
    });
  }

  function overlayOf(host, create) {
    var ov = null;
    for (var i = 0; i < host.children.length; i++) {
      if (host.children[i].hasAttribute('data-uw-lock-overlay')) { ov = host.children[i]; break; }
    }
    if (!ov && create) {
      ov = document.createElement('div');
      ov.className = 'uw-lock-overlay';
      ov.setAttribute('data-uw-lock-overlay', '');
      host.appendChild(ov);
    }
    return ov;
  }

  function paint(host, show) {
    var ov = overlayOf(host, show);
    if (!ov) return;
    if (!show) { ov.hidden = true; ov.innerHTML = ''; return; }
    var c = copyFor(tier());
    var btn = c.action === 'login'
      ? '<a href="' + esc(c.href) + '" class="ifx-btn ifx-btn-primary ifx-btn-sm">' + esc(c.label) + '</a>'
      : '<button type="button" class="ifx-btn ifx-btn-primary ifx-btn-sm" data-uw-lock-cta="' +
          esc(JSON.stringify({ reason: c.reason, message: c.caption })) + '">' + esc(c.label) + '</button>';
    ov.innerHTML = '<div class="uw-lock-card">' + btn + '<p class="uw-lock-caption">' + esc(c.caption) + '</p></div>';
    ov.hidden = false;
  }

  /** Đồng bộ toàn trang theo trạng thái .uw-locked hiện tại. */
  function sync() {
    document.querySelectorAll('.uw-locked, [data-uw-lock-overlay]:not([hidden])').forEach(function (el) {
      var host = el.hasAttribute('data-uw-lock-overlay') ? el.parentElement : el;
      if (!host) return;
      var locked = host.classList.contains('uw-locked');
      var outer = host.parentElement && host.parentElement.closest('.uw-locked');
      paint(host, locked && !outer);
      if (locked) mask(host); else unmask(host);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-uw-lock-cta]');
    if (!btn || !global.IfluxWebUI || !IfluxWebUI.openPricing) return;
    e.preventDefault();
    try { IfluxWebUI.openPricing(JSON.parse(btn.getAttribute('data-uw-lock-cta') || '{}')); } catch (err) { IfluxWebUI.openPricing({}); }
  });

  global.IfluxWidgetLock = { sync: sync };
})(window);
