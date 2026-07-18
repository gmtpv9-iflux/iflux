/**
 * iFlux — Onboarding slides (App channel)
 * Dùng chung nội dung từ API channel=app — mobile app consume module này.
 */
(function (global) {
  'use strict';

  var LOCAL_DONE_KEY = 'iflux_onboarding_app_done';
  var running = false;

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function fetchSteps() {
    if (global.IfluxApiClient) {
      return IfluxApiClient.listOnboardingSteps('app').then(function (res) {
        return (res && res.steps) || [];
      }).catch(function () { return []; });
    }
    return Promise.resolve([]);
  }

  function isDoneLocal() {
    try { return localStorage.getItem(LOCAL_DONE_KEY) === '1'; } catch (e) { return false; }
  }

  function markDoneLocal() {
    try { localStorage.setItem(LOCAL_DONE_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function saveCompletionState() {
    markDoneLocal();
    if (!global.IfluxAuth || !IfluxAuth.useApi || !IfluxAuth.useApi()) return Promise.resolve();
    var token = IfluxAuth.getToken && IfluxAuth.getToken();
    if (!token || !global.IfluxApiClient) return Promise.resolve();
    return IfluxApiClient.saveOnboardingState(token, {
      app_completed_at: new Date().toISOString()
    }).catch(function () { return null; });
  }

  function startSlides(steps) {
    if (running || !steps.length) return;
    running = true;
    var index = 0;

    var root = document.createElement('div');
    root.className = 'ifx-onboard-slides-root';
    root.innerHTML =
      '<div class="ifx-onboard-slides-panel ix-card">' +
        '<button type="button" class="ifx-onboard-slides-skip ix-btn ix-btn-ghost ix-btn-sm">Bỏ qua</button>' +
        '<div class="ifx-onboard-slides-media"></div>' +
        '<div class="ifx-onboard-slides-step"></div>' +
        '<h2 class="ifx-onboard-slides-title"></h2>' +
        '<p class="ifx-onboard-slides-body"></p>' +
        '<div class="ifx-onboard-slides-dots"></div>' +
        '<div class="ifx-onboard-slides-actions">' +
          '<button type="button" class="ix-btn ix-btn-ghost" data-slide-prev>Quay lại</button>' +
          '<button type="button" class="ix-btn ix-btn-primary" data-slide-next>Tiếp</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    document.body.classList.add('ifx-onboard-slides-active');

    var media = root.querySelector('.ifx-onboard-slides-media');
    var stepEl = root.querySelector('.ifx-onboard-slides-step');
    var titleEl = root.querySelector('.ifx-onboard-slides-title');
    var bodyEl = root.querySelector('.ifx-onboard-slides-body');
    var dotsEl = root.querySelector('.ifx-onboard-slides-dots');
    var btnPrev = root.querySelector('[data-slide-prev]');
    var btnNext = root.querySelector('[data-slide-next]');
    var btnSkip = root.querySelector('.ifx-onboard-slides-skip');

    dotsEl.innerHTML = steps.map(function (_, i) {
      return '<span class="ifx-onboard-slides-dot' + (i === 0 ? ' is-active' : '') + '"></span>';
    }).join('');

    function finish() {
      running = false;
      document.body.classList.remove('ifx-onboard-slides-active');
      if (root.parentNode) root.parentNode.removeChild(root);
      saveCompletionState();
    }

    function render() {
      var step = steps[index];
      stepEl.textContent = 'Bước ' + (index + 1) + ' / ' + steps.length;
      titleEl.textContent = step.title || '';
      bodyEl.textContent = step.body_text || '';
      btnPrev.disabled = index === 0;
      btnNext.textContent = index === steps.length - 1 ? 'Bắt đầu' : 'Tiếp';
      if (step.image_url) {
        media.innerHTML = '<img alt="" />';
        media.querySelector('img').src = step.image_url;
      } else {
        media.innerHTML = '<div class="ifx-onboard-slides-placeholder"><i class="ti ti-photo"></i></div>';
      }
      dotsEl.querySelectorAll('.ifx-onboard-slides-dot').forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
    }

    btnSkip.addEventListener('click', finish);
    btnPrev.addEventListener('click', function () {
      if (index > 0) { index -= 1; render(); }
    });
    btnNext.addEventListener('click', function () {
      if (index < steps.length - 1) { index += 1; render(); }
      else finish();
    });

    render();
  }

  function tryStart(opts) {
    opts = opts || {};
    if (running) return Promise.resolve(false);
    if (opts.force !== true && isDoneLocal()) return Promise.resolve(false);
    return fetchSteps().then(function (steps) {
      if (!steps.length) return false;
      startSlides(steps);
      return true;
    });
  }

  global.IfluxOnboardingSlides = {
    tryStart: tryStart,
    startSlides: startSlides,
    resetLocal: function () {
      try { localStorage.removeItem(LOCAL_DONE_KEY); } catch (e) { /* ignore */ }
    }
  };
})(window);
