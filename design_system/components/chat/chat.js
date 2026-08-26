/**
 * IfxChat — chọn thread + gửi tin generic. 0 business.
 */
(function (global) {
  'use strict';
  function init(root) {
    var wrap = root || document.querySelector('[data-ifx-chat]');
    if (!wrap) return;
    var title = wrap.querySelector('[data-ifx-chat-title]');
    var body = wrap.querySelector('[data-ifx-chat-body]');
    var form = wrap.querySelector('[data-ifx-chat-form]');
    var input = wrap.querySelector('.ifx-chat-input');
    wrap.addEventListener('click', function (e) {
      var item = e.target.closest('.ifx-chat-item');
      if (!item || !wrap.contains(item)) return;
      wrap.querySelectorAll('.ifx-chat-item').forEach(function (n) {
        n.classList.toggle('is-active', n === item);
      });
      if (title) title.textContent = item.getAttribute('data-ifx-chat-name') || 'Hội thoại';
    });
    if (form && input && body) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        var row = document.createElement('div');
        row.className = 'ifx-chat-message is-sent';
        var bubble = document.createElement('div');
        bubble.className = 'ifx-chat-bubble';
        bubble.textContent = text;
        row.appendChild(bubble);
        body.appendChild(row);
        input.value = '';
        body.scrollTop = body.scrollHeight;
      });
    }
  }
  global.IfxChat = { init: init };
})(window);
