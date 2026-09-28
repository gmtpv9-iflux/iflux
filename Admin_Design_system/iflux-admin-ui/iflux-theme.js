/* iFlux Theme — dark / light toggle + persistence */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux-theme';
  var MODES = { dark: 'dark', light: 'light' };

  function normalize(mode) {
    return mode === MODES.light ? MODES.light : MODES.dark;
  }

  function get() {
    try {
      return normalize(localStorage.getItem(STORAGE_KEY) || MODES.dark);
    } catch (e) {
      return MODES.dark;
    }
  }

  function apply(mode) {
    mode = normalize(mode);
    var root = document.documentElement;
    root.setAttribute('data-theme', mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) { /* ignore */ }

    document.querySelectorAll('.ifx-theme-toggle').forEach(function (btn) {
      var icon = btn.querySelector('[data-ifx-theme-icon]') || btn.querySelector('i');
      if (icon) {
        icon.className = mode === MODES.light ? 'ti ti-moon' : 'ti ti-sun';
      }
      btn.setAttribute('aria-pressed', mode === MODES.light ? 'true' : 'false');
      btn.title = mode === MODES.light ? 'Bật Dark mode' : 'Bật Light mode';
      btn.setAttribute('aria-label', btn.title);
    });

    global.dispatchEvent(new CustomEvent('iflux-theme-change', { detail: { theme: mode } }));
  }

  function set(mode) {
    apply(normalize(mode));
  }

  function toggle() {
    set(get() === MODES.dark ? MODES.light : MODES.dark);
  }

  function createToggleButton(className) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = (className || 'ix-nav-btn') + ' ifx-theme-toggle';
    btn.setAttribute('data-ifx-theme-toggle', '1');
    btn.innerHTML = '<i class="ti ti-sun" data-ifx-theme-icon></i>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      toggle();
    });
    return btn;
  }

  function mountToggle() {
    document.querySelectorAll('[data-ifx-theme-toggle]:not(.ifx-theme-mounted)').forEach(function (el) {
      el.classList.add('ifx-theme-mounted');
      if (!el.getAttribute('data-ifx-theme-bound')) {
        el.setAttribute('data-ifx-theme-bound', '1');
        el.addEventListener('click', function (e) {
          e.preventDefault();
          toggle();
        });
      }
    });

    document.querySelectorAll('.ix-nav-actions .ix-nav-btn').forEach(function (btn) {
      if (btn.getAttribute('data-ifx-theme-bound')) return;
      var icon = btn.querySelector('i.ti-sun, i.ti-moon');
      if (!icon) return;
      btn.setAttribute('data-ifx-theme-toggle', '1');
      btn.classList.add('ifx-theme-toggle', 'ifx-theme-mounted');
      btn.setAttribute('data-ifx-theme-bound', '1');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });

    document.querySelectorAll('.ifx-topnav-actions').forEach(function (actions) {
      if (actions.querySelector('[data-ifx-theme-toggle]')) return;
      var btn = createToggleButton('ix-nav-btn');
      var tier = actions.querySelector('[data-ifx-tier]');
      if (tier) actions.insertBefore(btn, tier);
      else actions.insertBefore(btn, actions.firstChild);
    });

    document.querySelectorAll('.ix-nav-actions').forEach(function (actions) {
      if (actions.querySelector('[data-ifx-theme-toggle]')) return;
      var btn = createToggleButton('ix-nav-btn');
      var chip = actions.querySelector('[data-ix-admin-env], .ifx-chip, .ix-chip');
      if (chip) actions.insertBefore(btn, chip);
      else actions.insertBefore(btn, actions.firstChild);
    });

    apply(get());
  }

  apply(get());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggle);
  } else {
    mountToggle();
  }

  global.IfluxTheme = {
    STORAGE_KEY: STORAGE_KEY,
    MODES: MODES,
    get: get,
    set: set,
    toggle: toggle,
    apply: apply,
    mountToggle: mountToggle
  };
})(window);
