/**
 * iFlux — Deep link mở app Mail (Gmail / Outlook / mặc định)
 */
(function (global) {
  'use strict';

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function resolveMailDeepLink(email) {
    var norm = normalizeEmail(email);
    if (!norm || norm.indexOf('@') < 0) return null;

    if (norm.endsWith('@gmail.com') || norm.endsWith('@googlemail.com')) {
      return {
        provider: 'gmail',
        label: 'Mở ứng dụng Gmail',
        url: 'googlegmail://',
        fallbackUrl: 'https://mail.google.com/mail/u/0/#inbox'
      };
    }

    if (
      norm.endsWith('@outlook.com') ||
      norm.endsWith('@hotmail.com') ||
      norm.endsWith('@live.com')
    ) {
      return {
        provider: 'outlook',
        label: 'Mở ứng dụng Outlook',
        url: 'ms-outlook://',
        fallbackUrl: 'https://outlook.live.com/mail/'
      };
    }

    return {
      provider: 'mail',
      label: 'Mở ứng dụng Mail',
      url: 'mailto:',
      fallbackUrl: null
    };
  }

  function openMailApp(email) {
    var link = resolveMailDeepLink(email);
    if (!link) return false;

    var opened = false;
    var timer = global.setTimeout(function () {
      if (!opened && link.fallbackUrl) {
        global.location.href = link.fallbackUrl;
      }
    }, 1200);

    try {
      global.location.href = link.url;
      opened = true;
    } catch (e) {
      if (link.fallbackUrl) global.location.href = link.fallbackUrl;
    }

    global.setTimeout(function () { global.clearTimeout(timer); }, 1500);
    return true;
  }

  function bindMailButton(button, email) {
    if (!button) return;
    var link = resolveMailDeepLink(email);
    if (!link || link.provider === 'mail') {
      button.hidden = true;
      return;
    }
    button.hidden = false;
    button.textContent = link.label;
    button.addEventListener('click', function (e) {
      e.preventDefault();
      openMailApp(email);
    });
  }

  global.IfluxMailDeepLink = {
    resolve: resolveMailDeepLink,
    open: openMailApp,
    bindButton: bindMailButton
  };
})(window);
