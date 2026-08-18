(function (global) {
  'use strict';

  var Store = global.IfluxFaqStore;
  var state = { category: 'all', q: '' };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initAccordion(root) {
    root.querySelectorAll('.ix-accordion').forEach(function (acc) {
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

  function renderCategories(root) {
    var wrap = root.querySelector('[data-ifx-faq-cats]');
    if (!wrap || !Store) return;
    wrap.innerHTML = Store.categories.map(function (cat) {
      var active = state.category === cat.id ? ' active' : '';
      return '<button type="button" class="ifx-faq-cat' + active + '" data-ifx-faq-cat="' + esc(cat.id) + '">' +
        '<i class="ti ' + esc(cat.icon) + '"></i> ' + esc(cat.label) +
      '</button>';
    }).join('');
  }

  function renderList(root) {
    var listEl = root.querySelector('[data-ifx-faq-list]');
    if (!listEl || !Store) return;
    var items = Store.list({ category: state.category, q: state.q });
    if (!items.length) {
      listEl.innerHTML = '<div class="ifx-faq-empty">Không tìm thấy câu hỏi phù hợp. Thử từ khóa khác hoặc <a class="ix-link" href="mailto:support@iflux.vn">liên hệ hỗ trợ</a>.</div>';
      return;
    }
    listEl.innerHTML =
      '<div class="ix-accordion ifx-faq-list" data-single>' +
      items.map(function (item, idx) {
        var open = idx === 0 && !state.q ? ' open' : '';
        return '<div class="ix-accordion-item' + open + '">' +
          '<button type="button" class="ix-accordion-trigger">' + esc(item.q) +
            ' <i class="ti ti-chevron-down ix-accordion-arrow"></i></button>' +
          '<div class="ix-accordion-body">' + esc(item.a) + '</div>' +
        '</div>';
      }).join('') +
      '</div>';
    initAccordion(listEl);
  }

  function render(root) {
    renderCategories(root);
    renderList(root);
  }

  function bind(root) {
    var search = root.querySelector('[data-ifx-faq-search]');
    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value.trim();
        renderList(root);
      });
    }

    root.addEventListener('click', function (e) {
      var catBtn = e.target.closest('[data-ifx-faq-cat]');
      if (!catBtn) return;
      state.category = catBtn.getAttribute('data-ifx-faq-cat') || 'all';
      render(root);
    });
  }

  function init() {
    var root = document.querySelector('[data-ifx-faq-page]');
    if (!root || !Store) return;
    bind(root);
    render(root);
  }

  global.IfluxFaqPage = { init: init };
})(window);
