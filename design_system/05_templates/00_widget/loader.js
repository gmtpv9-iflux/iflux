/**
 * IfxTemplateLoader — nạp file DS của một Template theo danh mục 05_templates/templates.json.
 * Trang chỉ nạp Template mình dùng; file đã có trên trang (vd Admin nạp sẵn) không nạp lại.
 *   IfxTemplateLoader.ensure('TMP-SUMMARY') → Promise<boolean> (false = Template không có trong danh mục)
 */
(function (global) {
  'use strict';
  var ROOT = '/design_system/';
  var catalog = null;
  var loaded = Object.create(null);

  function present(tag, attr, path) {
    var list = document.querySelectorAll(tag + '[' + attr + ']');
    for (var i = 0; i < list.length; i++) {
      if (list[i].getAttribute(attr).split('?')[0] === path) return true;
    }
    return false;
  }

  function load(file, ver) {
    var path = ROOT + file;
    if (loaded[path]) return loaded[path];
    var isCss = /\.css$/.test(file);
    if (present(isCss ? 'link' : 'script', isCss ? 'href' : 'src', path)) {
      loaded[path] = Promise.resolve();
      return loaded[path];
    }
    loaded[path] = new Promise(function (resolve, reject) {
      var el = document.createElement(isCss ? 'link' : 'script');
      if (isCss) { el.rel = 'stylesheet'; el.href = path + '?v=' + ver; }
      else { el.src = path + '?v=' + ver; el.async = false; }
      el.onload = function () { resolve(); };
      el.onerror = function () { delete loaded[path]; reject(new Error('Không nạp được ' + path)); };
      document.head.appendChild(el);
    });
    return loaded[path];
  }

  function getCatalog() {
    if (!catalog) {
      catalog = fetch(ROOT + '05_templates/templates.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('templates.json ' + r.status); return r.json(); })
        .catch(function (e) { catalog = null; throw e; });
    }
    return catalog;
  }

  /** CSS song song; JS tuần tự theo thứ tự danh mục (component trước Template). */
  function loadSet(set, ver) {
    var css = Promise.all((set.css || []).map(function (f) { return load(f, ver); }));
    var js = (set.js || []).reduce(function (p, f) {
      return p.then(function () { return load(f, ver); });
    }, Promise.resolve());
    return Promise.all([css, js]);
  }

  function ensure(templateId) {
    return getCatalog().then(function (cat) {
      var ver = cat.version || '';
      return loadSet(cat.base, ver).then(function () {
        var set = templateId && cat.templates[templateId];
        if (!set) return false;
        return loadSet(set, ver).then(function () { return true; });
      });
    });
  }

  global.IfxTemplateLoader = { ensure: ensure };
})(typeof window !== 'undefined' ? window : globalThis);
