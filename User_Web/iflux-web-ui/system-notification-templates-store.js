/* ADM-SYS-003 — Lưu & render mẫu thông báo (localStorage sandbox) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_sys_notif_templates_v1';

  function readOverrides() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeOverrides(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-sys-notif-templates-changed'));
    }
  }

  function catalog() {
    return global.IfluxSystemNotificationCatalog;
  }

  function getTemplate(caseId) {
    var c = catalog() && catalog().getCaseById(caseId);
    if (!c) return null;
    var ov = readOverrides()[caseId] || {};
    return {
      caseId: caseId,
      title: ov.title != null ? ov.title : c.defaultTitle,
      message: ov.message != null ? ov.message : c.defaultMessage,
      isCustom: !!(ov.title || ov.message),
      updatedAt: ov.updatedAt || null
    };
  }

  function saveTemplate(caseId, title, message) {
    var map = readOverrides();
    map[caseId] = {
      title: String(title || ''),
      message: String(message || ''),
      updatedAt: new Date().toISOString()
    };
    writeOverrides(map);
    return getTemplate(caseId);
  }

  function resetTemplate(caseId) {
    var map = readOverrides();
    delete map[caseId];
    writeOverrides(map);
    return getTemplate(caseId);
  }

  function resetAll() {
    writeOverrides({});
  }

  function applyTemplate(str, vars) {
    var out = String(str || '');
    if (!vars) return out;
    Object.keys(vars).forEach(function (key) {
      var val = vars[key];
      var token = '{' + key + '}';
      while (out.indexOf(token) >= 0) {
        out = out.replace(token, val != null ? String(val) : '');
      }
    });
    return out;
  }

  function render(caseId, vars) {
    var tpl = getTemplate(caseId);
    if (!tpl) return { title: '', message: '' };
    return {
      title: applyTemplate(tpl.title, vars),
      message: applyTemplate(tpl.message, vars)
    };
  }

  function listAll() {
    var cat = catalog();
    if (!cat) return [];
    return cat.CASES.map(function (c) {
      var tpl = getTemplate(c.id);
      return {
        case: c,
        template: tpl,
        preview: render(c.id, c.sampleVars || {})
      };
    });
  }

  global.IfluxSystemNotificationTemplates = {
    getTemplate: getTemplate,
    saveTemplate: saveTemplate,
    resetTemplate: resetTemplate,
    resetAll: resetAll,
    applyTemplate: applyTemplate,
    render: render,
    listAll: listAll
  };
})(window);
