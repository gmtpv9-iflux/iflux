/* Loyalty — Mã giảm giá */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtDiscount(c) {
    if (c.discount_fixed) return '-' + Number(c.discount_fixed).toLocaleString('vi-VN') + '₫';
    if (c.discount_pct) return '-' + c.discount_pct + '%';
    return '—';
  }

  function fmtExpiry(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('vi-VN');
    } catch (e) {
      return iso;
    }
  }

  function copyCode(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () {
        if (global.ixToast) ixToast('Đã sao chép mã ' + code, 'success');
      });
    }
  }

  function renderList() {
    var wrap = document.getElementById('ifx-coupon-list');
    if (!wrap || !global.IfluxLoyaltyCouponStore) return;

    var list = IfluxLoyaltyCouponStore.listMine();
    if (!list.length) {
      wrap.innerHTML = '<div class="ifx-loyalty-empty"><i class="ti ti-ticket-off"></i><p>Bạn chưa có mã giảm giá. Nhập mã bên dưới để nhận.</p></div>';
      return;
    }

    wrap.innerHTML = list.map(function (c) {
      var expired = c.status === 'expired';
      var checkoutHref = '../account/checkout.html?coupon=' + encodeURIComponent(c.code);
      return '<div class="ifx-coupon-card' + (expired ? ' is-expired' : '') + '">' +
        '<div class="ifx-coupon-card__left">' +
          '<div class="ifx-coupon-card__code">' + esc(c.code) + '</div>' +
          '<div class="ifx-coupon-card__label">' + esc(c.label) + '</div>' +
          '<div class="ifx-coupon-card__meta">' +
            '<span><i class="ti ti-tag"></i> ' + esc(c.scope || 'Gói cước') + '</span>' +
            '<span><i class="ti ti-calendar"></i> HSD: ' + fmtExpiry(c.expires_at) + '</span>' +
            (c.min_order ? '<span><i class="ti ti-receipt"></i> ĐH tối thiểu ' + Number(c.min_order).toLocaleString('vi-VN') + '₫</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="ifx-coupon-card__right">' +
          '<div class="ifx-coupon-card__discount">' + fmtDiscount(c) + '</div>' +
          (expired
            ? '<span class="ix-chip ix-chip-secondary">Hết hạn</span>'
            : '<div class="ifx-coupon-card__actions">' +
                '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-copy-coupon="' + esc(c.code) + '"><i class="ti ti-copy"></i> Sao chép</button>' +
                '<a href="' + checkoutHref + '" class="ix-btn ix-btn-primary ix-btn-sm"><i class="ti ti-shopping-cart"></i> Dùng ngay</a>' +
              '</div>') +
        '</div></div>';
    }).join('');

    wrap.querySelectorAll('[data-ifx-copy-coupon]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyCode(btn.getAttribute('data-ifx-copy-coupon'));
      });
    });
  }

  function bindRedeem() {
    var input = document.getElementById('ifx-coupon-redeem-input');
    var btn = document.getElementById('ifx-coupon-redeem-btn');
    var msg = document.getElementById('ifx-coupon-redeem-msg');
    if (!btn || !global.IfluxLoyaltyCouponStore) return;

    btn.addEventListener('click', function () {
      var code = input ? input.value.trim() : '';
      if (!code) {
        if (msg) { msg.style.color = 'var(--ix-warning)'; msg.textContent = 'Vui lòng nhập mã'; }
        return;
      }
      var res = IfluxLoyaltyCouponStore.redeem(code);
      if (res.ok) {
        if (msg) { msg.style.color = 'var(--ix-success)'; msg.textContent = '✓ Đã thêm mã ' + res.coupon.code + ' vào ví của bạn'; }
        if (input) input.value = '';
        if (global.ixToast) ixToast('Nhận mã thành công!', 'success');
        renderList();
      } else {
        if (msg) { msg.style.color = 'var(--ix-danger)'; msg.textContent = '✗ ' + (res.error || 'Không thể nhận mã'); }
      }
    });
  }

  function init() {
    renderList();
    bindRedeem();
  }

  global.IfluxLoyaltyCoupons = { init: init, renderList: renderList };
})(window);
