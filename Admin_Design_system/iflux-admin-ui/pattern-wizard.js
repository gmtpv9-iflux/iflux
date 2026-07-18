/* Wizard pattern — patterns/wizard.html */
(function (global) {
  'use strict';

  function initWizard(root) {
    var wrap = root || document.querySelector('[data-ix-wizard]');
    if (!wrap) return;

    var currentStep = 0;
    var items = wrap.querySelectorAll('.ix-wizard-step-item');
    var panels = wrap.querySelectorAll('.ix-wizard-panel');
    var totalSteps = items.length;

    function updateSteps() {
      items.forEach(function (item, i) {
        item.classList.remove('active', 'done');
        if (i === currentStep) item.classList.add('active');
        else if (i < currentStep) item.classList.add('done');
      });
      panels.forEach(function (p, i) {
        p.classList.toggle('active', i === currentStep);
      });
    }

    wrap.querySelectorAll('[data-ix-wizard-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentStep < totalSteps - 1) {
          currentStep++;
          updateSteps();
        }
      });
    });

    wrap.querySelectorAll('[data-ix-wizard-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentStep > 0) {
          currentStep--;
          updateSteps();
        }
      });
    });

    wrap.querySelectorAll('[data-ix-wizard-submit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (global.ixToast) global.ixToast('Đã lưu thành công!', 'success');
      });
    });

    items.forEach(function (item, i) {
      item.addEventListener('click', function () {
        if (i <= currentStep) {
          currentStep = i;
          updateSteps();
        }
      });
    });

    wrap.querySelectorAll('.ix-radio-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var group = card.closest('.ix-radio-cards');
        if (!group) return;
        group.querySelectorAll('.ix-radio-card').forEach(function (c) {
          c.classList.remove('selected');
        });
        card.classList.add('selected');
      });
    });

    updateSteps();
  }

  global.PatternWizard = { init: initWizard };
})(window);
