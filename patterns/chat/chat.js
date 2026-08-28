/* P6a Chat Phase 2 isolate. AppShell JS removed. PatternChat kept. */
/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/pattern-chat.js ===== */
/* Chat pattern — patterns/chat.html */
(function (global) {
  'use strict';

  function initials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  }

  function initChat(root) {
    var layout = root || document.querySelector('[data-ix-chat]');
    if (!layout) return;

    var nameEl = document.getElementById('chat-active-name');
    var roleEl = document.getElementById('chat-active-role');
    var avatarEl = document.getElementById('chat-active-avatar');
    var rightName = document.getElementById('right-name');
    var rightRole = document.getElementById('right-role');
    var rightAvatar = document.getElementById('right-avatar');
    var msgs = document.getElementById('chat-messages');
    var input = document.getElementById('chat-input');

    layout.querySelectorAll('.ix-chat-item[data-chat-name]').forEach(function (item) {
      item.addEventListener('click', function () {
        var name = item.getAttribute('data-chat-name');
        var role = item.getAttribute('data-chat-role') || '';
        layout.querySelectorAll('.ix-chat-item').forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
        var ini = initials(name);
        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = role;
        if (avatarEl) avatarEl.textContent = ini;
        if (rightName) rightName.textContent = name;
        if (rightRole) rightRole.textContent = role;
        if (rightAvatar) rightAvatar.textContent = ini;
      });
    });

    function sendMsg() {
      if (!input || !msgs || !input.value.trim()) return;
      var text = input.value.trim();
      var now = new Date();
      var time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
      var div = document.createElement('div');
      div.className = 'ix-chat-msg sent';
      div.innerHTML =
        '<div class="ix-avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0">OP</div>' +
        '<div><div class="ix-chat-bubble"></div><div class="ix-chat-time" style="text-align:right">' + time + '</div></div>';
      div.querySelector('.ix-chat-bubble').textContent = text;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
      input.value = '';
    }

    layout.querySelectorAll('[data-ix-chat-send]').forEach(function (btn) {
      btn.addEventListener('click', sendMsg);
    });
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMsg();
      });
    }
  }

  global.PatternChat = { init: initChat };
})(window);
