/**
 * Staging 2 — Admin Shell
 *
 * App Shell tự dựng chrome (sidebar · overlay · header) quanh nội dung trang.
 * Trang chỉ khai .ifx-shell > .ifx-shell__content — không lặp lại markup chrome.
 *
 * Sidebar đổi hình thái tại XL: dưới XL là drawer, không nhớ trạng thái;
 * từ XL là rail thu gọn được, nhớ qua localStorage.
 *
 * Một nút menu duy nhất điều khiển cả hai hình thái: dưới XL mở/đóng drawer,
 * từ XL thu gọn/mở rail.
 */
(function (global) {
  'use strict';

  var COLLAPSE_KEY = global.IfluxAdminPlatform.KEYS.shellCollapsed;
  /* Phải khớp --ifx-breakpoint-xl. Custom property không dùng được trong
     matchMedia nên số viết tay ở đây; lệch với CSS = drawer và rail cùng bật. */
  var XL = '(min-width: 1280px)';
  var SPRITE = '/assets/icons.svg';
  var LOGIN = '/admin/login';

  function isDesktop() {
    return global.matchMedia(XL).matches;
  }

  function readCollapsed() {
    try {
      return global.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function writeCollapsed(on) {
    try {
      if (on) global.localStorage.setItem(COLLAPSE_KEY, '1');
      else global.localStorage.removeItem(COLLAPSE_KEY);
    } catch (e) { /* storage bị chặn — chỉ mất ghi nhớ, không chặn UI */ }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(name, className) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className || 'ifx-icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', SPRITE + '#ifx-icon-' + name);
    svg.appendChild(use);
    return svg;
  }

  function iconButton(name, label, className) {
    var btn = el('button', 'ifx-shell__icon-btn' + (className ? ' ' + className : ''));
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    if (name) btn.appendChild(icon(name));
    return btn;
  }

  function buildSidebar() {
    var aside = el('aside', 'ifx-shell__sidebar');
    var brand = el('div', 'ifx-shell__brand');
    var link = el('a', 'ifx-shell__brand-link');
    link.href = '/admin';
    /* Ô logo: chữ tạm cho tới khi Staging 2 có nguồn logo — khi đó thay span
       này bằng <img>, không đổi bố cục. Đây là phần duy nhất còn thấy khi
       sidebar thu gọn còn rail. */
    link.appendChild(el('span', 'ifx-shell__brand-mark', 'iF'));
    link.appendChild(el('span', 'ifx-shell__brand-text', 'iFlux Admin'));
    brand.appendChild(link);
    aside.appendChild(brand);

    var nav = el('nav', 'ifx-shell__nav');
    nav.setAttribute('aria-label', 'Điều hướng');
    nav.appendChild(el('div', 'ifx-nav'));
    aside.appendChild(nav);
    return aside;
  }

  function buildSearch() {
    var label = el('label', 'ifx-shell__search');
    label.appendChild(icon('search'));
    var input = el('input');
    input.type = 'search';
    input.placeholder = 'Tìm kiếm';
    input.setAttribute('aria-label', 'Tìm kiếm');
    label.appendChild(input);
    return label;
  }

  function buildHeader(refs) {
    var header = el('header', 'ifx-shell__header');
    refs.toggle = iconButton('menu', 'Menu');
    header.appendChild(refs.toggle);
    header.appendChild(buildSearch());

    var end = el('div', 'ifx-shell__header-end');
    refs.logout = iconButton('logout', 'Đăng xuất');
    refs.env = el('span', 'ifx-chip');
    refs.avatar = el('span', 'ifx-shell__avatar');
    end.appendChild(refs.logout);
    end.appendChild(refs.env);
    end.appendChild(refs.avatar);
    header.appendChild(end);
    return header;
  }

  function buildChrome(root, refs) {
    var content = root.querySelector('.ifx-shell__content');
    if (!content) {
      content = el('div', 'ifx-shell__content');
      root.appendChild(content);
    }
    content.remove();

    root.textContent = '';
    refs.sidebar = buildSidebar();
    refs.overlay = el('div', 'ifx-shell__overlay');
    var main = el('div', 'ifx-shell__main');
    main.appendChild(buildHeader(refs));
    main.appendChild(content);

    root.appendChild(refs.sidebar);
    root.appendChild(refs.overlay);
    root.appendChild(main);
    refs.nav = refs.sidebar.querySelector('.ifx-nav');
  }

  function applyEnv(chip) {
    var env = global.IfluxAdminPlatform.env();
    chip.className = 'ifx-chip ifx-chip--' + env.variant;
    chip.textContent = env.label;
  }

  /* Nút menu mang nghĩa khác nhau theo tier — aria phải nói đúng nghĩa đang có. */
  function syncToggle(root, toggle) {
    var shown = isDesktop()
      ? !root.classList.contains('is-sidebar-collapsed')
      : root.classList.contains('is-sidebar-open');
    toggle.setAttribute('aria-expanded', shown ? 'true' : 'false');
  }

  function setDrawer(root, toggle, open) {
    root.classList.toggle('is-sidebar-open', open);
    syncToggle(root, toggle);
  }

  function setCollapsed(root, toggle, on) {
    root.classList.toggle('is-sidebar-collapsed', on);
    syncToggle(root, toggle);
  }

  function buildItem(item, nested) {
    var a = el('a', 'ifx-nav__item');
    a.href = item.href;
    if (nested) {
      var bullet = el('span', 'ifx-nav__bullet');
      bullet.setAttribute('aria-hidden', 'true');
      a.appendChild(bullet);
    } else if (item.icon) {
      a.appendChild(icon(item.icon, 'ifx-icon ifx-nav__icon'));
    }
    a.appendChild(el('span', 'ifx-nav__label', item.label));
    return a;
  }

  function setOpen(head, on) {
    head.classList.toggle('is-open', on);
    head.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  /* siblings = các nhóm cùng module; mở một nhóm thì đóng các nhóm còn lại. */
  function buildParent(item, siblings) {
    var head = el('button', 'ifx-nav__item');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    if (item.icon) head.appendChild(icon(item.icon, 'ifx-icon ifx-nav__icon'));
    head.appendChild(el('span', 'ifx-nav__label', item.label));
    head.appendChild(icon('chevron-right', 'ifx-icon ifx-nav__arrow'));

    var sub = el('div', 'ifx-nav__sub');
    var i;
    for (i = 0; i < item.children.length; i++) {
      sub.appendChild(buildItem(item.children[i], true));
    }

    head.addEventListener('click', function () {
      var open = !head.classList.contains('is-open');
      var j;
      for (j = 0; j < siblings.length; j++) {
        if (siblings[j] !== head) setOpen(siblings[j], false);
      }
      setOpen(head, open);
    });

    return [head, sub];
  }

  function applyActive(navHost, path) {
    var Nav = global.IfluxAdminNavigation;
    var current = Nav.normalizePath(path || global.location.pathname);
    var links = navHost.querySelectorAll('a.ifx-nav__item');
    var i;
    for (i = 0; i < links.length; i++) {
      var on = Nav.isActive({ href: links[i].getAttribute('href') || '' }, current);
      links[i].classList.toggle('is-active', on);
      if (on) links[i].setAttribute('aria-current', 'page');
      else links[i].removeAttribute('aria-current');

      /* Mở sẵn nhóm cha đang chứa trang hiện tại */
      var sub = on ? links[i].closest('.ifx-nav__sub') : null;
      var head = sub && sub.previousElementSibling;
      if (head && head.classList.contains('ifx-nav__item')) setOpen(head, true);
    }
  }

  /* Module nào chưa có nhóm nào mở thì mở nhóm đầu — menu không bao giờ đóng hết. */
  function openFirstParent(groups) {
    var i, j, anyOpen;
    for (i = 0; i < groups.length; i++) {
      if (!groups[i].length) continue;
      anyOpen = false;
      for (j = 0; j < groups[i].length; j++) {
        if (groups[i][j].classList.contains('is-open')) anyOpen = true;
      }
      if (!anyOpen) setOpen(groups[i][0], true);
    }
  }

  function renderNav(navHost, root, toggle) {
    var modules = global.IfluxAdminNavigation.visibleModules();
    navHost.textContent = '';
    var groups = [];
    var i, j;
    for (i = 0; i < modules.length; i++) {
      navHost.appendChild(el('div', 'ifx-nav__group-label', modules[i].label));
      var heads = [];
      for (j = 0; j < modules[i].items.length; j++) {
        var item = modules[i].items[j];
        if (item.children) {
          var parts = buildParent(item, heads);
          heads.push(parts[0]);
          navHost.appendChild(parts[0]);
          navHost.appendChild(parts[1]);
          continue;
        }
        navHost.appendChild(buildItem(item, false));
      }
      groups.push(heads);
    }

    navHost.addEventListener('click', function (e) {
      if (e.target.closest('a.ifx-nav__item')) setDrawer(root, toggle, false);
    });

    applyActive(navHost, global.location.pathname);
    openFirstParent(groups);
  }

  /* Danh tính do protect.js xác thực rồi đẩy sang — shell không gọi /me lần hai. */
  var identity = null;
  var mounted = null;

  function initials(name) {
    var words = String(name || '').split(/\s+/);
    var out = '';
    var i;
    for (i = 0; i < words.length && out.length < 2; i++) out += words[i].charAt(0);
    return out.toUpperCase() || 'AD';
  }

  function paintIdentity() {
    if (!mounted) return;
    var admin = identity;
    mounted.avatar.textContent = initials(admin && (admin.name || admin.email));
    if (!admin || !admin.email) {
      mounted.avatar.removeAttribute('title');
      return;
    }
    mounted.avatar.title = admin.name
      ? admin.name + ' · ' + admin.email
      : admin.email;
  }

  function bindLogout(refs) {
    refs.logout.addEventListener('click', function () {
      if (global.IfluxAdminSession) global.IfluxAdminSession.clearSession();
      global.location.replace(LOGIN);
    });
  }

  function mount() {
    var root = document.getElementById('ifx-shell');
    if (!root || !global.IfluxAdminNavigation) return;

    var refs = {};
    buildChrome(root, refs);
    applyEnv(refs.env);
    setDrawer(root, refs.toggle, false);
    setCollapsed(root, refs.toggle, readCollapsed());
    renderNav(refs.nav, root, refs.toggle);
    bindLogout(refs);
    mounted = refs;
    paintIdentity();

    refs.toggle.addEventListener('click', function () {
      if (isDesktop()) {
        var on = !root.classList.contains('is-sidebar-collapsed');
        setCollapsed(root, refs.toggle, on);
        writeCollapsed(on);
        return;
      }
      setDrawer(root, refs.toggle, !root.classList.contains('is-sidebar-open'));
    });

    refs.overlay.addEventListener('click', function () {
      setDrawer(root, refs.toggle, false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrawer(root, refs.toggle, false);
    });

    global.addEventListener('resize', function () {
      if (isDesktop()) setDrawer(root, refs.toggle, false);
      else syncToggle(root, refs.toggle);
    });

    global.addEventListener('pageshow', function () {
      setDrawer(root, refs.toggle, false);
    });
  }

  global.IfluxAdminShell = {
    setAdmin: function (admin) {
      identity = admin;
      paintIdentity();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(typeof window !== 'undefined' ? window : globalThis);
