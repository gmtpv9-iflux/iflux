/**
 * IfxToast.show(message, type) — type: primary|success|warning|danger|info
 * Markup dùng .ifx-alert (primitive). Tự nạp alert.css + toast.css ở lần hiện đầu tiên. 'error' = 'danger'.
 */
(function (global) {
  'use strict';
  var ICONS = {
    success: 'ti-circle-check',
    danger: 'ti-alert-circle',
    warning: 'ti-alert-triangle',
    info: 'ti-info-circle',
    primary: 'ti-bell'
  };
  function host() {
    var el = document.getElementById('ifx-toast-host');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'ifx-toast-host';
    el.className = 'ifx-toast-host';
    document.body.appendChild(el);
    return el;
  }
  /* CSS của Toast (+ primitive Alert) chỉ nạp ở lần hiện đầu tiên — dùng chung cho Admin và User Web. */
  var CSS = ['/design_system/03_primitives/01_alert/alert.css?v=toast20260928', '/design_system/04_components/17_toast/toast.css?v=toast20260928'];
  function ensureCss() {
    CSS.forEach(function (href) {
      if (document.querySelector('link[href^="' + href.split('?')[0] + '"]')) return;
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    });
  }
  function show(message, type, duration) {
    ensureCss();
    type = type === 'error' ? 'danger' : (type || 'primary');
    duration = duration || 3500;
    var toast = document.createElement('div');
    toast.className = 'ifx-alert ifx-alert-' + type + ' ifx-toast';
    toast.setAttribute('role', 'status');
    var icon = document.createElement('i');
    icon.className = 'ti ' + (ICONS[type] || ICONS.primary);
    var span = document.createElement('span');
    span.className = 'ifx-alert-text';
    span.textContent = message;
    toast.appendChild(icon);
    toast.appendChild(span);
    host().appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-in'); });
    setTimeout(function () {
      toast.classList.remove('is-in');
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  }
  global.IfxToast = { show: show };
})(window);
