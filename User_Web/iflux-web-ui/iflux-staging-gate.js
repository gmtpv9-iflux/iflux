/* Staging gate — chỉ bật module có Admin Full/Sandbox (iflux-staging-allowlist.json) */
(function (global) {
  'use strict';

  function isStagingHost() {
    var port = global.location.port;
    if (port === '8888') return true;
    try {
      var p = new URLSearchParams(global.location.search);
      if (p.get('iflux_env') === 'staging') return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function pathModule(pathname, rules) {
    pathname = pathname || '';
    for (var i = 0; i < rules.length; i++) {
      if (pathname.indexOf(rules[i].match) >= 0) return rules[i].module;
    }
    return null;
  }

  function homeUrl() {
    var parts = global.location.pathname.split('/');
    var idx = parts.indexOf('User_Web');
    if (idx >= 0) {
      return parts.slice(0, idx + 1).join('/') + '/home/index.html';
    }
    return '/User_Web/home/index.html';
  }

  function applyGate(manifest) {
    if (!manifest) return;
    var disabled = manifest.disabled || {};
    var rules = manifest.pathRules || [];
    var navMap = manifest.navHrefMap || {};
    var mod = pathModule(global.location.pathname, rules);

    if (mod && disabled[mod]) {
      var target = homeUrl() + '?staging_notice=' + encodeURIComponent(disabled[mod].reason || mod);
      global.location.replace(target);
      return;
    }

    document.querySelectorAll('.ifx-topnav-link[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var key = href.split('?')[0];
      var navMod = navMap[key] || navMap[href];
      if (navMod && disabled[navMod]) {
        a.style.display = 'none';
        a.setAttribute('aria-hidden', 'true');
      }
    });

    var notice = new URLSearchParams(global.location.search).get('staging_notice');
    if (notice && document.querySelector('.ifx-main, .ifx-main--hub')) {
      var bar = document.createElement('div');
      bar.className = 'ifx-staging-notice';
      bar.style.cssText = 'margin:0 0 12px;padding:10px 14px;border-radius:8px;background:rgba(87,90,255,.15);border:1px solid rgba(87,90,255,.35);color:#c8c9ff;font-size:13px';
      bar.textContent = 'Staging: ' + notice;
      var main = document.querySelector('.ifx-main, .ifx-main--hub');
      if (main && main.firstChild) main.insertBefore(bar, main.firstChild);
      else if (main) main.appendChild(bar);
    }

    if (!document.getElementById('ifx-staging-badge')) {
      var badge = document.createElement('span');
      badge.id = 'ifx-staging-badge';
      badge.className = 'ix-chip ix-chip-warning';
      badge.textContent = 'Staging';
      badge.style.marginLeft = '8px';
      var actions = document.querySelector('.ifx-topnav-actions');
      if (actions) actions.insertBefore(badge, actions.firstChild);
    }
  }

  function boot() {
    if (!isStagingHost()) return;
    var parts = global.location.pathname.split('/');
    var idx = parts.indexOf('User_Web');
    var base = idx >= 0 ? parts.slice(0, idx + 1).join('/') + '/data/iflux-staging-allowlist.json' : '/User_Web/data/iflux-staging-allowlist.json';
    fetch(base, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(applyGate)
      .catch(function () { /* ignore */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.IfluxStagingGate = { isStagingHost: isStagingHost, boot: boot };
})(window);
