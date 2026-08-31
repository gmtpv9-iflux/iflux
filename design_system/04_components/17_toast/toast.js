/**
 * IfxToast.show(message, type) — type: primary|success|warning|danger|info
 * Markup dùng .ifx-alert (primitive). Cần nạp alert.css.
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
  function show(message, type, duration) {
    type = type || 'primary';
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
