/**
 * IfxChat — chọn thread, đồng bộ identity, gửi tin generic.
 * Không chứa API / persist / nghiệp vụ.
 */
(function (global) {
  'use strict';

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function padTime(d) {
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function init(root) {
    var wrap = root || document.querySelector('[data-ifx-chat]');
    if (!wrap) return;

    var title = wrap.querySelector('[data-ifx-chat-title]');
    var role = wrap.querySelector('[data-ifx-chat-role]');
    var avatar = wrap.querySelector('[data-ifx-chat-avatar]');
    var dName = wrap.querySelector('[data-ifx-chat-details-name]');
    var dRole = wrap.querySelector('[data-ifx-chat-details-role]');
    var dAvatar = wrap.querySelector('[data-ifx-chat-details-avatar]');
    var body = wrap.querySelector('[data-ifx-chat-body]');
    var form = wrap.querySelector('[data-ifx-chat-form]');
    var input = wrap.querySelector('[data-ifx-chat-input]') || wrap.querySelector('.ifx-chat-input');
    var self = wrap.getAttribute('data-ifx-chat-self') || 'OP';

    function sync(item) {
      var name = item.getAttribute('data-ifx-chat-name') || '';
      var r = item.getAttribute('data-ifx-chat-role') || '';
      var ini = initials(name);
      wrap.querySelectorAll('.ifx-chat-item').forEach(function (n) {
        n.classList.toggle('is-active', n === item);
      });
      setText(title, name || 'Hội thoại');
      setText(role, r);
      setText(avatar, ini);
      setText(dName, name);
      setText(dRole, r);
      setText(dAvatar, ini);
    }

    wrap.addEventListener('click', function (e) {
      var item = e.target.closest('.ifx-chat-item');
      if (!item || !wrap.contains(item)) return;
      sync(item);
    });

    function send() {
      if (!input || !body) return;
      var text = input.value.trim();
      if (!text) return;
      var row = document.createElement('div');
      row.className = 'ifx-chat-message is-sent';
      var av = document.createElement('div');
      av.className = 'ifx-avatar ifx-avatar-sm';
      av.textContent = self;
      var stack = document.createElement('div');
      stack.className = 'ifx-chat-stack';
      var bubble = document.createElement('div');
      bubble.className = 'ifx-chat-bubble';
      bubble.textContent = text;
      var meta = document.createElement('div');
      meta.className = 'ifx-chat-meta';
      meta.textContent = padTime(new Date());
      stack.appendChild(bubble);
      stack.appendChild(meta);
      row.appendChild(av);
      row.appendChild(stack);
      body.appendChild(row);
      input.value = '';
      body.scrollTop = body.scrollHeight;
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        send();
      });
    }
    wrap.querySelectorAll('[data-ifx-chat-send]').forEach(function (btn) {
      if (form && form.contains(btn) && btn.type === 'submit') return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        send();
      });
    });
    if (input && !form) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          send();
        }
      });
    }
  }

  global.IfxChat = { init: init };
})(window);
