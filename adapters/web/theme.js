/* Canonical iFlux Design System — Web Theme Adapter
 * Theme = Global concept (semantic theme tokens dark/light).
 * data-theme + localStorage + browser preference = Web implementation → adapter này.
 *
 * REUSE hành vi từ theme runtime đang chạy, canonical hoá:
 * - KHÔNG tự mount/inject nút toggle vào DOM (đó là việc của platform/page);
 * - storage key canonical: 'ifx-theme';
 * - chưa có lựa chọn lưu → theo prefers-color-scheme của trình duyệt.
 *
 * API: IfxTheme.get() / set(mode) / toggle() / apply() / event 'ifx-theme-change'.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'ifx-theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  function normalize(mode) {
    return mode === LIGHT ? LIGHT : DARK;
  }

  function stored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === DARK || v === LIGHT ? v : null;
    } catch (e) {
      return null;
    }
  }

  function preferred() {
    try {
      return global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches
        ? LIGHT
        : DARK;
    } catch (e) {
      return DARK;
    }
  }

  function get() {
    return stored() || preferred();
  }

  function apply(mode) {
    mode = normalize(mode);
    document.documentElement.setAttribute('data-theme', mode);
    global.dispatchEvent(new CustomEvent('ifx-theme-change', { detail: { theme: mode } }));
    return mode;
  }

  function set(mode) {
    mode = normalize(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) { /* ignore */ }
    return apply(mode);
  }

  function toggle() {
    return set(get() === DARK ? LIGHT : DARK);
  }

  /* Theo dõi đổi preference hệ thống — chỉ khi user chưa chọn tay */
  try {
    global.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
      if (!stored()) apply(preferred());
    });
  } catch (e) { /* matchMedia không hỗ trợ addEventListener → bỏ qua */ }

  apply(get());

  global.IfxTheme = {
    STORAGE_KEY: STORAGE_KEY,
    get: get,
    set: set,
    toggle: toggle,
    apply: apply
  };
})(window);
