(function () {
  'use strict';

  var Cat = window.IfluxPlansCatalog;
  var currentCycle = 'annual';

  var REASON_MSG = {
    widget_limit: 'Gói Miễn phí chỉ thêm tối đa 3 tiện ích trên Dashboard. Nâng cấp để mở khóa không giới hạn.',
    premium_widget: 'Tiện ích này dành cho thành viên Premium trở lên. Chọn gói phù hợp bên dưới.',
    premium_feature: 'Tính năng này dành cho thành viên Premium trở lên. Chọn gói phù hợp bên dưới.',
    expired: 'Gói đăng ký của bạn đã hết hạn. Chọn gói để tiếp tục sử dụng đầy đủ tính năng.'
  };

  function renderPlanBox(plan, opts) {
    opts = opts || {};
    var price = Cat.displayPrice(plan, currentCycle);
    var feats = Cat.buildFeatures(plan);
    var featured = plan.badge === 'popular' || opts.featured;
    var color = Cat.iconColor(plan);
    var badge = Cat.badgeText(plan.badge);
    var tier = plan.tier || plan.id;
    var isFree = tier === 'free';
    var lifetimeBlocked = currentCycle === 'lifetime' && !plan.lifetimeEnabled;

    var featHtml = feats.map(function (f) {
      return '<li class="' + (f.has ? 'has' : 'no') + '"><i class="ti ti-' + (f.has ? 'check' : 'x') + '"></i> ' + Cat.esc(f.text) + '</li>';
    }).join('');

    var cta = '';
    if (isFree) {
      cta = '<button type="button" class="ix-btn ix-btn-primary ix-w-full" disabled data-free-cta>Gói hiện tại</button>';
    } else if (lifetimeBlocked) {
      cta = '<button type="button" class="ix-btn ix-btn-outline ix-w-full" disabled>Không bán trọn đời</button>';
    } else if (plan.purchasable) {
      var btnClass = plan.iconClass === 'warning' ? 'ix-btn ix-w-full' : 'ix-btn ix-btn-primary ix-w-full';
      var btnStyle = plan.iconClass === 'warning'
        ? 'background:var(--iflux-orange);color:#fff;border:none;display:flex;align-items:center;justify-content:center;gap:6px'
        : '';
      cta = '<a href="' + Cat.checkoutUrl(plan, currentCycle) + '" class="' + btnClass + '" style="' + btnStyle + '" data-cta-tier="' + Cat.esc(tier) + '">' +
        (plan.iconClass === 'warning' ? '<i class="ti ti-diamond" style="font-size:14px"></i> ' : '') +
        'Nâng cấp ' + Cat.esc(plan.name) + ' →</a>';
    } else {
      cta = '<button type="button" class="ix-btn ix-btn-outline ix-w-full" disabled>Chưa mở bán</button>';
    }

    return '<div class="ix-plan-box' + (featured ? ' featured' : '') + '" data-plan-tier="' + Cat.esc(tier) + '">' +
      (badge ? '<div class="ix-plan-popular">' + Cat.esc(badge) + '</div>' : '') +
      '<div class="ix-plan-img"><i class="ti ' + Cat.esc(plan.icon || 'ti-package') + '" style="color:' + color + '"></i></div>' +
      '<div class="ix-plan-name">' + Cat.esc(Cat.displayName(plan)) + '</div>' +
      '<div class="ix-plan-tagline">' + Cat.esc(plan.subtitle || plan.desc || '') + '</div>' +
      '<div class="ix-plan-price-block">' +
        '<div class="ix-plan-price-big" style="color:' + color + '"><span class="ix-plan-price-cur">₫</span><span class="ifx-plan-price-main">' + price.main + '</span></div>' +
        '<div class="ix-plan-price-per">' + Cat.esc(price.per) + '</div>' +
        '<div class="ix-plan-price-annual ifx-plan-price-sub">' + Cat.esc(price.sub) + '</div>' +
      '</div>' +
      '<ul class="ix-plan-feats">' + featHtml + '</ul>' +
      cta +
    '</div>';
  }

  function renderGrid() {
    var grid = document.getElementById('ifx-plan-grid');
    if (!grid || !Cat) return;

    var plans = Cat.publishedPlans();
    if (!plans.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--ix-text-muted)">Chưa có gói đăng ký.</p>';
      return;
    }

    var featuredSet = false;
    grid.innerHTML = plans.map(function (plan) {
      var featured = !featuredSet && plan.badge === 'popular';
      if (featured) featuredSet = true;
      return renderPlanBox(plan, { featured: featured });
    }).join('');

    initCurrentPlan();
  }

  function renderCompare() {
    var tbody = document.getElementById('ifx-compare-body');
    var head = document.getElementById('ifx-compare-head');
    if (!tbody || !head || !Cat) return;

    var plans = Cat.publishedPlans();
    head.innerHTML = '<tr><th style="width:34%">Tính năng</th>' +
      plans.map(function (p) {
        var color = p.iconClass === 'warning' ? 'var(--iflux-orange)' : (p.tier === 'free' ? '' : 'var(--ix-accent)');
        return '<th' + (color ? ' style="color:' + color + '"' : '') + '>' + Cat.esc(Cat.displayName(p)) + '</th>';
      }).join('') + '</tr>';

    tbody.innerHTML = Cat.compareRows().map(function (row) {
      return '<tr><td>' + Cat.esc(row.label) + '</td>' +
        plans.map(function (p) { return Cat.compareCell(p, row); }).join('') +
      '</tr>';
    }).join('');
  }

  function refreshPrices() {
    if (!Cat) return;
    Cat.publishedPlans().forEach(function (plan) {
      var box = document.querySelector('[data-plan-tier="' + plan.tier + '"]');
      if (!box) return;
      var price = Cat.displayPrice(plan, currentCycle);
      var main = box.querySelector('.ifx-plan-price-main');
      var per = box.querySelector('.ix-plan-price-per');
      var sub = box.querySelector('.ifx-plan-price-sub');
      if (main) main.textContent = price.main;
      if (per) per.textContent = price.per;
      if (sub) sub.textContent = price.sub;

      var cta = box.querySelector('[data-cta-tier]');
      if (cta) cta.href = Cat.checkoutUrl(plan, currentCycle);

      var lifetimeBlocked = currentCycle === 'lifetime' && !plan.lifetimeEnabled && plan.tier !== 'free';
      var btn = box.querySelector('.ix-btn');
      if (btn && plan.tier !== 'free') {
        if (lifetimeBlocked) {
          btn.outerHTML = '<button type="button" class="ix-btn ix-btn-outline ix-w-full" disabled>Không bán trọn đời</button>';
        }
      }
    });

    var bottom = document.getElementById('cta-bottom-premium');
    var prem = Cat.getPlan('premium');
    if (bottom && prem) bottom.href = Cat.checkoutUrl(prem, currentCycle);
  }

  var billingInited = false;
  var accordionInited = false;

  function initBillingSegments() {
    var wrap = document.getElementById('billing-segments');
    if (!wrap || billingInited) return;
    billingInited = true;

    var lifetimeBtn = wrap.querySelector('[data-cycle="lifetime"]');
    if (lifetimeBtn && Cat && !Cat.anyLifetimeEnabled()) {
      lifetimeBtn.classList.add('hidden');
    }

    wrap.querySelectorAll('.ix-billing-seg').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('hidden')) return;
        currentCycle = btn.getAttribute('data-cycle') || 'monthly';
        wrap.querySelectorAll('.ix-billing-seg').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGrid();
        refreshPrices();
      });
    });
  }

  function initAccordion() {
    if (accordionInited) return;
    accordionInited = true;
    document.querySelectorAll('.ix-accordion').forEach(function (acc) {
      var single = acc.hasAttribute('data-single');
      acc.querySelectorAll('.ix-accordion-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = btn.closest('.ix-accordion-item');
          if (!item) return;
          var open = item.classList.contains('open');
          if (single) {
            acc.querySelectorAll('.ix-accordion-item').forEach(function (i) { i.classList.remove('open'); });
          }
          if (!open) item.classList.add('open');
          else item.classList.remove('open');
        });
      });
    });
  }

  function initBanner() {
    var params = new URLSearchParams(location.search);
    var reason = params.get('reason') || params.get('mode') || '';
    var message = params.get('message') || REASON_MSG[reason] || '';
    var banner = document.getElementById('ifxPricingBanner');
    var text = document.getElementById('ifxPricingBannerText');
    if (!banner || !text || !message) return;
    text.textContent = message;
    banner.style.display = 'flex';
  }

  function initCurrentPlan() {
    document.querySelectorAll('[data-free-cta]').forEach(function (btn) {
      btn.disabled = true;
      btn.textContent = 'Gói hiện tại';
    });
  }

  function init() {
    if (!Cat) {
      var grid = document.getElementById('ifx-plan-grid');
      if (grid) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--ix-danger)">Không tải được danh mục gói từ Admin.</p>';
      }
      return;
    }

    if (!window.PlansRuntimeReader) {
      console.warn('[iFlux pricing] PlansRuntimeReader chưa load — dùng fallback Miễn phí + catalog tối thiểu.');
    }

    renderGrid();
    renderCompare();
    var bottom = document.getElementById('cta-bottom-premium');
    var prem = Cat.getPlan('premium');
    if (bottom && prem) bottom.href = Cat.checkoutUrl(prem, currentCycle);
    initBillingSegments();
    initAccordion();
    initBanner();
  }

  window.IfluxPricingPage = { init: init };
})();
