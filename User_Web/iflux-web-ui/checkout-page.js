(function () {
  'use strict';

  var Cat = window.IfluxPlansCatalog;
  var currentStep = 0;
  var selectedPlan = 'premium';
  var selectedCycle = 'annual';
  var selectedPayMethod = 'card';
  var couponDiscount = 0;

  function planMap() {
    var map = {};
    if (!Cat) return map;
    Cat.purchasablePlans().forEach(function (p) {
      map[p.tier] = p;
    });
    return map;
  }

  function getSelected(tier) {
    tier = tier != null ? tier : selectedPlan;
    var map = planMap();
    var plan = map[tier] || Cat.getPlan(tier) || null;
    if (plan && String(plan.tier || plan.id).toLowerCase() !== String(tier).toLowerCase()) {
      return Cat.getPlan(tier) || plan;
    }
    return plan;
  }

  function resolvePurchasableTier(tier) {
    tier = String(tier || '').toLowerCase();
    var purchasable = Cat.purchasablePlans();
    if (purchasable.some(function (p) { return p.tier === tier; })) return tier;
    return purchasable.length ? purchasable[0].tier : tier;
  }

  function buildCheckoutSnapshot() {
    var tier = String(selectedPlan || '').toLowerCase();
    var purchasable = Cat.purchasablePlans();
    if (!purchasable.some(function (p) { return p.tier === tier; })) return null;
    var plan = getSelected(tier);
    if (!plan) return null;
    var transferRefEl = document.getElementById('transfer-ref');
    var amount = Cat.priceAmount(plan, selectedCycle) - couponDiscount;
    return {
      planTier: tier,
      planName: plan.name || tier,
      cycle: selectedCycle,
      amount: amount,
      couponDiscount: couponDiscount,
      payMethod: selectedPayMethod,
      transferRef: transferRefEl ? transferRefEl.textContent.trim() : ''
    };
  }

  function fmt(n) {
    return Cat ? Cat.fmt(n) : ('₫' + Math.round(n).toLocaleString('vi-VN'));
  }

  function baseAmount() {
    var p = getSelected();
    if (!p) return 0;
    return Cat.priceAmount(p, selectedCycle);
  }

  function originalAmount() {
    var p = getSelected();
    if (!p || !Cat.listPriceAmount) return 0;
    return Cat.listPriceAmount(p, selectedCycle);
  }

  function planDiscount() {
    var p = getSelected();
    if (!p || !Cat.cycleDiscount) return { amount: 0, label: '', badge: '' };
    return Cat.cycleDiscount(p, selectedCycle);
  }

  function discountAmount() {
    return planDiscount().amount || 0;
  }

  function vatAmount() {
    return Math.round((baseAmount() - couponDiscount) * 0.1 / 1.1);
  }

  function totalAmount() {
    return baseAmount() - couponDiscount;
  }

  function cycleLabel() {
    if (selectedCycle === 'lifetime') return 'Trọn đời';
    if (selectedCycle === 'annual') return 'Hàng năm';
    return 'Hàng tháng';
  }

  function renewDate() {
    if (selectedCycle === 'lifetime') return 'Không hết hạn';
    var d = new Date();
    if (selectedCycle === 'annual') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('vi-VN');
  }

  function renderPlanOptions() {
    var wrap = document.getElementById('ifx-checkout-plans');
    if (!wrap || !Cat) return;

    var plans = Cat.publishedPlans();
    wrap.innerHTML = plans.map(function (p) {
      var tier = p.tier;
      var isFree = tier === 'free';

      if (isFree) {
        return '<div class="ix-radio-card" data-plan-tier="free" aria-disabled="true">' +
          '<div class="ix-radio-card-icon" style="color:' + Cat.iconColor(p) + '"><i class="ti ' + Cat.esc(p.icon || 'ti-gift') + '"></i></div>' +
          '<div class="ix-radio-card-title">' + Cat.esc(Cat.displayName(p)) + '</div>' +
          '<div class="ix-radio-card-sub">' + Cat.esc(p.subtitle || p.desc || '') + '</div>' +
        '</div>';
      }

      var selected = tier === selectedPlan;
      var border = p.iconClass === 'warning' ? 'var(--iflux-orange)' : '';
      var badge = p.badge === 'popular' ? ' <span class="ix-badge ix-badge-primary" style="margin-left:8px;font-size:10px">Phổ biến</span>' : '';
      return '<div class="ix-radio-card' + (selected ? ' selected' : '') + '" data-plan-tier="' + Cat.esc(tier) + '" onclick="selectPlan(\'' + tier + '\',this)"' +
        (border && selected ? ' style="border-color:' + border + '"' : '') + '>' +
        '<div class="ix-radio-card-icon" style="color:' + Cat.iconColor(p) + '"><i class="ti ' + Cat.esc(p.icon || 'ti-package') + '"></i></div>' +
        '<div class="ix-radio-card-title">' + Cat.esc(Cat.displayName(p)) + badge + '</div>' +
        '<div class="ix-radio-card-sub">' + Cat.esc(p.subtitle || p.desc || '') + '</div>' +
      '</div>';
    }).join('');

  }

  function renderCycleOptions() {
    var wrap = document.getElementById('ifx-checkout-cycles');
    if (!wrap || !Cat) return;

    var p = getSelected();
    var pct = p && Cat.resolvePromoPct ? Cat.resolvePromoPct(p) : 0;
    var promoBadge = pct > 0 ? ('-' + pct + '%') : '';

    function cycleSub(cycle) {
      if (!p) return '—';
      var promo = Cat.promoDiscount(p, cycle);
      if (cycle === 'monthly') {
        return Cat.fmt(promo.active ? promo.salePrice : p.priceMonth) + '/tháng';
      }
      if (cycle === 'annual') {
        var yearPrice = promo.active ? promo.salePrice : p.priceYear;
        return Cat.fmt(Math.round(yearPrice / 12)) + '/tháng · ' + Cat.fmt(yearPrice) + '/năm';
      }
      if (cycle === 'lifetime') {
        return Cat.fmt(promo.active ? promo.salePrice : p.priceLifetime) + ' · dùng mãi mãi';
      }
      return '—';
    }

    var cycles = [
      {
        id: 'monthly',
        title: 'Hàng tháng',
        badge: promoBadge,
        sub: cycleSub('monthly')
      },
      {
        id: 'annual',
        title: 'Hàng năm',
        badge: promoBadge,
        sub: cycleSub('annual')
      }
    ];

    if (p && p.lifetimeEnabled && p.priceLifetime > 0) {
      cycles.push({
        id: 'lifetime',
        title: 'Trọn đời',
        badge: promoBadge || '1 lần',
        sub: cycleSub('lifetime')
      });
    }

    wrap.innerHTML = cycles.map(function (c) {
      return '<div class="ix-radio-card' + (selectedCycle === c.id ? ' selected' : '') + '" onclick="selectCycle(\'' + c.id + '\',this)">' +
        '<div class="ix-radio-card-title">' + c.title +
        (c.badge ? ' <span class="ix-badge ix-badge-success" style="font-size:10px">' + c.badge + '</span>' : '') +
        '</div>' +
        '<div class="ix-radio-card-sub ifx-cycle-sub">' + c.sub + '</div>' +
      '</div>';
    }).join('');

    wrap.style.gridTemplateColumns = cycles.length >= 3 ? 'repeat(3,1fr)' : 'repeat(' + cycles.length + ',1fr)';
  }

  function updateStepper() {
    var i;
    for (i = 0; i <= 3; i++) {
      var circle = document.getElementById('circle-' + i);
      if (!circle) continue;
      var step = circle.closest('.ix-checkout-step');
      step.classList.remove('active', 'done');
      if (i === currentStep) step.classList.add('active');
      else if (i < currentStep) {
        step.classList.add('done');
        circle.innerHTML = '<i class="ti ti-check" style="font-size:14px"></i>';
      } else {
        circle.textContent = (i + 1 === 4) ? '✓' : String(i + 1);
      }
      if (i < 3) {
        var conn = document.getElementById('conn-' + i);
        if (conn) conn.classList.toggle('done', i < currentStep);
      }
    }
    document.querySelectorAll('.ix-checkout-panel').forEach(function (panel, idx) {
      panel.classList.toggle('active', idx === currentStep);
    });
  }

  function updateSummary() {
    var p = getSelected();
    if (!p) return;

    var elPlan = document.getElementById('summary-plan');
    var elCycle = document.getElementById('summary-cycle');
    if (elPlan) elPlan.textContent = p.name;
    if (elCycle) elCycle.textContent = cycleLabel();

    var orig = document.getElementById('price-original');
    var disc = document.getElementById('price-discount');
    var vat = document.getElementById('price-vat');
    var total = document.getElementById('price-total');
    var origRow = orig && orig.closest('.ix-order-row');
    var discRow = disc && disc.closest('.ix-order-row');
    var discInfo = planDiscount();
    var discAmt = discInfo.amount || 0;
    var hasPromo = discAmt > 0;

    if (origRow) origRow.style.display = hasPromo ? 'flex' : 'none';
    if (orig) orig.textContent = fmt(originalAmount());
    if (disc) disc.textContent = hasPromo ? ('-' + fmt(discAmt)) : '-₫0';
    if (discRow) {
      discRow.style.display = hasPromo ? 'flex' : 'none';
      discRow.id = 'price-discount-row';
      var discLabel = document.getElementById('price-discount-label') || discRow.querySelector('span');
      if (discLabel && discInfo.label) discLabel.textContent = discInfo.label;
    }
    if (vat) vat.textContent = fmt(vatAmount());
    if (total) total.textContent = fmt(totalAmount());

    var renewEl = document.getElementById('summary-renew');
    if (renewEl) {
      renewEl.textContent = selectedCycle === 'lifetime'
        ? 'Trọn đời · không gia hạn'
        : (renewDate() + ' · ' + fmt(totalAmount()));
    }

    updateReviewPanel();
  }

  function updateReviewPanel() {
    var p = getSelected();
    if (!p) return;

    var title = document.getElementById('review-plan-title');
    var renew = document.getElementById('review-renew');
    var price = document.getElementById('review-price');
    var feats = document.getElementById('review_feats');
    var iconWrap = document.getElementById('review-icon');
    if (title) title.textContent = 'iFlux ' + p.name + ' — ' + cycleLabel();
    if (renew) {
      renew.textContent = selectedCycle === 'lifetime'
        ? 'Kích hoạt ngay · Trọn đời'
        : ('Kích hoạt ngay · Gia hạn ' + renewDate());
    }
    if (price) price.textContent = fmt(totalAmount());
    if (feats) feats.textContent = 'Bao gồm: ' + (p.desc || p.subtitle || '');
    if (iconWrap) {
      iconWrap.style.background = p.iconClass === 'warning' ? 'rgba(242,101,34,.12)' : 'var(--ix-accent-soft)';
      iconWrap.style.color = Cat.iconColor(p);
      iconWrap.innerHTML = '<i class="ti ' + Cat.esc(p.icon || 'ti-package') + '"></i>';
    }
    var emailEl = document.getElementById('review-email');
    var user = window.IfluxAuth && IfluxAuth.getUser();
    if (emailEl && user) emailEl.textContent = user.email || user.display_name;

    var payBtn = document.getElementById('btn-pay-confirm');
    if (payBtn) {
      if (selectedPayMethod === 'transfer') {
        payBtn.innerHTML = '<i class="ti ti-send" style="font-size:14px"></i> Gửi yêu cầu · ' + fmt(totalAmount());
      } else {
        payBtn.innerHTML = '<i class="ti ti-lock" style="font-size:14px"></i> Thanh toán ' + fmt(totalAmount()) + ' ngay';
      }
    }
  }

  window.goStep = function (n) {
    if (n <= currentStep) {
      currentStep = n;
      updateStepper();
    }
  };

  window.nextStep = function () {
    if (currentStep < 3) {
      currentStep++;
      updateStepper();
      window.scrollTo(0, 0);
    }
  };

  window.prevStep = function () {
    if (currentStep > 0) {
      currentStep--;
      updateStepper();
      window.scrollTo(0, 0);
    }
  };

  window.selectPlan = function (plan, el) {
    if (plan === 'free') return;
    if (!Cat.purchasablePlans().some(function (p) { return p.tier === plan; })) return;
    selectedPlan = plan;
    document.querySelectorAll('#ifx-checkout-plans .ix-radio-card').forEach(function (c) {
      c.classList.remove('selected');
      c.style.borderColor = '';
    });
    el.classList.add('selected');
    var p = getSelected();
    if (p && p.iconClass === 'warning') el.style.borderColor = 'var(--iflux-orange)';

    if (selectedCycle === 'lifetime') {
      var cur = getSelected();
      if (!cur || !cur.lifetimeEnabled) selectedCycle = 'annual';
    }
    renderCycleOptions();
    updateSummary();
  };

  window.selectCycle = function (cycle, el) {
    selectedCycle = cycle;
    var parent = el.parentElement;
    parent.querySelectorAll('.ix-radio-card').forEach(function (c) { c.classList.remove('selected'); });
    el.classList.add('selected');
    updateSummary();
  };

  window.selectPayMethod = function (method, el) {
    selectedPayMethod = method;
    document.querySelectorAll('.ix-pay-opt').forEach(function (o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    ['card', 'momo', 'vnpay', 'transfer'].forEach(function (m) {
      var f = document.getElementById('pay-' + m + '-form');
      if (f) f.style.display = (m === method) ? 'block' : 'none';
    });
    updateReviewPanel();
  };

  window.applyCoupon = function () {
    var code = document.getElementById('coupon-input').value.trim().toUpperCase();
    var msg = document.getElementById('coupon-msg');
    var store = global.IfluxLoyaltyCouponStore;
    var valid = store ? store.validateForCheckout(code) : null;

    if (valid && valid.ok && valid.coupon) {
      var c = valid.coupon;
      var base = baseAmount();
      if (c.type === 'voucher' || c.discount_fixed) {
        var fixed = Number(c.discount_fixed || c.value) || 0;
        couponDiscount = Math.min(base, fixed);
        if (c.type === 'voucher' && c.max_value > 0) {
          couponDiscount = Math.min(couponDiscount, Math.round(base * (Number(c.max_value) / 100)));
        }
      } else {
        var pct = Number(c.discount_pct || c.value) || 0;
        couponDiscount = Math.round(base * (pct / 100));
        if (c.max_value > 0) couponDiscount = Math.min(couponDiscount, Number(c.max_value));
      }
      msg.style.color = 'var(--ix-success)';
      msg.textContent = '✓ Mã ' + code + ' hợp lệ — đã áp dụng';
      document.getElementById('coupon-row').style.display = 'flex';
      document.getElementById('coupon-discount').textContent = '-' + fmt(couponDiscount);
      if (window.ixToast) ixToast('Áp dụng mã giảm giá thành công!', 'success');
    } else if (code === 'IFLUX20' || code === 'WELCOME') {
      couponDiscount = Math.round(baseAmount() * 0.1);
      msg.style.color = 'var(--ix-success)';
      msg.textContent = '✓ Mã hợp lệ! Giảm thêm 10% — đã áp dụng';
      document.getElementById('coupon-row').style.display = 'flex';
      document.getElementById('coupon-discount').textContent = '-' + fmt(couponDiscount);
      if (window.ixToast) ixToast('Áp dụng mã giảm giá thành công!', 'success');
    } else {
      couponDiscount = 0;
      msg.style.color = 'var(--ix-danger)';
      msg.textContent = '✗ Mã không hợp lệ hoặc đã hết hạn';
      document.getElementById('coupon-row').style.display = 'none';
    }
    updateSummary();
  };

  function showSuccessPanel(opts) {
    opts = opts || {};
    var wrap = document.querySelector('#panel-3 .ix-checkout-success');
    if (!wrap) return;

    var isPending = !!opts.pending;
    var icon = wrap.querySelector('.ix-success-icon');
    if (icon) {
      icon.innerHTML = isPending
        ? '<i class="ti ti-clock-hour-4"></i>'
        : '<i class="ti ti-check"></i>';
      icon.style.background = isPending ? 'rgba(255,171,0,.15)' : '';
      icon.style.color = isPending ? 'var(--ix-warning)' : '';
    }

    var titleEl = wrap.querySelector('h2');
    if (titleEl) {
      titleEl.textContent = isPending
        ? 'Đã gửi yêu cầu nâng cấp!'
        : 'Thanh toán thành công!';
    }

    var descEl = wrap.querySelector('p');
    if (descEl) {
      descEl.innerHTML = isPending
        ? 'Chúng tôi đã ghi nhận yêu cầu. Sau khi Admin xác nhận chuyển khoản, gói sẽ được kích hoạt. Email thông báo gửi đến <strong id="success-email">' + (opts.email || '—') + '</strong>'
        : 'Email xác nhận gửi đến <strong id="success-email">' + (opts.email || '—') + '</strong>';
    }

    var details = wrap.querySelector('[data-ifx-success-details]');
    if (details) {
      if (isPending) {
        details.innerHTML =
          '<div class="ix-section-label ix-mb-3">Chi tiết yêu cầu</div>' +
          '<div class="ix-order-row"><span>Mã đơn</span><span style="font-weight:600;color:var(--ix-text-primary)">' + (opts.orderId || '—') + '</span></div>' +
          '<div class="ix-order-row"><span>Gói đăng ký</span><span style="font-weight:600;color:var(--ix-text-primary)">' + (opts.plan || '—') + '</span></div>' +
          '<div class="ix-order-row"><span>Số tiền</span><span style="font-weight:600;color:var(--ix-warning)">' + (opts.amount || '—') + '</span></div>' +
          '<div class="ix-order-row"><span>Trạng thái</span><span class="ix-badge ix-badge-warning">Chờ Admin duyệt</span></div>' +
          (opts.transferRef
            ? '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--ix-border)">' +
              '<div class="ix-caption ix-mb-2">Nội dung chuyển khoản</div>' +
              '<div style="font-weight:700;font-size:15px;color:var(--ix-text-primary)">' + opts.transferRef + '</div>' +
              '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:6px">Vui lòng chuyển đúng số tiền và nội dung để Admin đối soát nhanh.</div></div>'
            : '');
      } else {
        details.innerHTML =
          '<div class="ix-section-label ix-mb-3">Chi tiết giao dịch</div>' +
          '<div class="ix-order-row"><span>Gói đã mua</span><span style="font-weight:600;color:var(--ix-text-primary)" id="success-plan">' + (opts.plan || '—') + '</span></div>' +
          '<div class="ix-order-row"><span>Ngày hết hạn</span><span id="success-expire">' + (opts.expire || '—') + '</span></div>' +
          '<div class="ix-order-row"><span>Số tiền</span><span style="font-weight:600;color:var(--ix-success)" id="success-amount">' + (opts.amount || '—') + '</span></div>';
      }
    }
  }

  window.completeCheckout = function () {
    var btn = document.getElementById('btn-pay-confirm');
    if (!btn) return;

    var snapshot = buildCheckoutSnapshot();
    if (!snapshot) {
      if (window.ixToast) ixToast('Không xác định được gói cước. Vui lòng chọn lại gói.', 'danger');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    var isTransfer = snapshot.payMethod === 'transfer';
    var cycleLbl = cycleLabel();
    setTimeout(function () {
      var user = window.IfluxAuth && IfluxAuth.getUser();
      var orderStore = window.IfluxSubscriptionOrdersStore;

      function afterOrder(order) {
        if (order && snapshot.couponDiscount > 0) {
          try {
            var codeEl = document.getElementById('coupon-input');
            var code = codeEl ? String(codeEl.value || '').trim().toUpperCase() : '';
            if (code) {
              var usageKey = 'iflux_loyalty_promo_usage_v1';
              var usage = [];
              try { usage = JSON.parse(localStorage.getItem(usageKey) || '[]'); } catch (e) { usage = []; }
              usage.push({
                id: 'uso_' + Date.now(),
                code: code,
                orderId: order.id || '',
                email: (user && user.email) || '',
                orderAmount: snapshot.amount + snapshot.couponDiscount,
                discount: snapshot.couponDiscount,
                at: new Date().toISOString()
              });
              localStorage.setItem(usageKey, JSON.stringify(usage));
            }
          } catch (e) { /* ignore */ }
        }
        if (!isTransfer && window.IfluxLoyaltyAffiliateStore && user && order && order.status !== 'pending') {
          var referrerUserId = (order && order.referrerUserId) ||
            (IfluxLoyaltyAffiliateStore.getReferrerId && IfluxLoyaltyAffiliateStore.getReferrerId(user.id)) ||
            user.referred_by ||
            null;
          var affResult = IfluxLoyaltyAffiliateStore.processPurchase(user, snapshot.amount, {
            productLabel: snapshot.planName + ' / ' + cycleLbl,
            orderId: order.id,
            referrerUserId: referrerUserId
          });
          if (affResult.ok && affResult.events.length && window.ixToast) {
            ixToast('Đã ghi nhận hoa hồng cho ' + affResult.events.length + ' thành viên upline', 'success');
          }
        }

        if (isTransfer) {
          showSuccessPanel({
            pending: true,
            email: user ? user.email : '',
            orderId: order ? order.id : '—',
            plan: snapshot.planName + ' · ' + cycleLbl,
            amount: fmt(snapshot.amount),
            transferRef: snapshot.transferRef
          });
          if (window.ixToast) ixToast('Đơn đang chờ Admin xác nhận chuyển khoản', 'info');
        } else {
          showSuccessPanel({
            pending: false,
            email: user ? user.email : '',
            plan: snapshot.planName + ' · ' + cycleLbl,
            amount: fmt(snapshot.amount),
            expire: renewDate()
          });
        }
        window.nextStep();
      }

      if (orderStore && user) {
        var created = orderStore.createOrder({
          userId: user.id,
          userName: user.display_name || user.username,
          email: user.email || '',
          planTier: snapshot.planTier,
          planName: snapshot.planName,
          cycle: snapshot.cycle,
          amount: snapshot.amount,
          couponDiscount: snapshot.couponDiscount,
          payMethod: snapshot.payMethod,
          transferRef: snapshot.transferRef
        });
        Promise.resolve(created).then(afterOrder).catch(function (err) {
          btn.disabled = false;
          updateReviewPanel();
          if (window.ixToast) ixToast(err.message || 'Không tạo được đơn', 'danger');
        });
        return;
      }

      if (!isTransfer && window.IfluxAuth && IfluxAuth.updateUser) {
        var days = snapshot.cycle === 'annual' ? 365 : (snapshot.cycle === 'lifetime' ? null : 30);
        IfluxAuth.updateUser({
          tier: snapshot.planTier,
          tier_label: snapshot.planName,
          subscription_phase: 'paid',
          trial_expiry_pending: false,
          plan: {
            name: snapshot.planName,
            tier: snapshot.planTier,
            cycle: snapshot.cycle,
            price: snapshot.amount,
            days_left: days,
            days_total: days,
            expires_at: snapshot.cycle === 'lifetime' ? null : undefined
          }
        });
      }
      afterOrder(null);
    }, isTransfer ? 800 : 1600);
  };

  function initFromQuery() {
    var params = new URLSearchParams(location.search);
    var plan = params.get('plan');
    var cycle = params.get('cycle');
    if (plan === 'free') plan = null;
    if (plan && (Cat.getPlan(plan) || planMap()[plan])) selectedPlan = plan;
    selectedPlan = resolvePurchasableTier(selectedPlan);
    if (cycle === 'monthly' || cycle === 'annual' || cycle === 'lifetime') selectedCycle = cycle;

    renderPlanOptions();
    renderCycleOptions();

    document.querySelectorAll('#ifx-checkout-plans .ix-radio-card').forEach(function (c) {
      var tier = c.getAttribute('data-plan-tier');
      if (tier === selectedPlan) {
        c.classList.add('selected');
        var p = Cat.getPlan(tier);
        if (p && p.iconClass === 'warning') c.style.borderColor = 'var(--iflux-orange)';
      } else c.classList.remove('selected');
    });

    var ref = document.getElementById('transfer-ref');
    var user = window.IfluxAuth && IfluxAuth.getUser();
    if (ref && user) {
      ref.textContent = 'IFLUX-' + (user.username || user.display_name || 'USER').replace(/@/g, '').slice(0, 8).toUpperCase();
    }

    if (selectedCycle === 'lifetime' && getSelected() && !getSelected().lifetimeEnabled) {
      selectedCycle = 'annual';
      renderCycleOptions();
    }

    updateSummary();
    updateStepper();

    var couponParam = params.get('coupon');
    if (couponParam) {
      var input = document.getElementById('coupon-input');
      if (input) input.value = couponParam;
      window.applyCoupon();
    }
  }

  function init() {
    if (!Cat) return;
    initFromQuery();
  }

  window.IfluxCheckoutPage = { init: init };
})();
