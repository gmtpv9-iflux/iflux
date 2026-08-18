/**
 * ADM-SYS-012 — Lưu dữ liệu demo + Đặc tả + Định danh Template (localStorage).
 * Cấu trúc: {
 *   items: {
 *     <templateId>: {
 *       demo: { <idx>: value },
 *       spec: string|null,
 *       name: string|null,
 *       description: string|null,
 *       headers: { left, right }|null
 *     }
 *   },
 *   updatedAt
 * }
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_templates_v1';
  var WIDGET_META_INPUT_COUNT = 2;

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { items: {}, updatedAt: null };
      var parsed = JSON.parse(raw);
      return { items: parsed.items || {}, updatedAt: parsed.updatedAt || null };
    } catch (e) {
      return { items: {}, updatedAt: null };
    }
  }

  function write(data) {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function read() { return readRaw(); }

  function item(id) {
    var data = readRaw();
    return data.items[id] || null;
  }

  /** Trả về mảng demo đã merge override lên default của catalog. */
  function getDemo(template) {
    var saved = item(template.id);
    var overrides = (saved && saved.demo) || {};
    return template.inputs.map(function (inp, idx) {
      if (idx < WIDGET_META_INPUT_COUNT) return inp.demo || '';
      return overrides[idx] != null ? String(overrides[idx]) : (inp.demo || '');
    });
  }

  function getSpec(template) {
    var saved = item(template.id);
    return saved && saved.spec != null ? String(saved.spec) : (template.spec || '');
  }

  function getName(template) {
    var saved = item(template.id);
    if (saved && saved.name != null && String(saved.name).trim() !== '') return String(saved.name);
    return template.name || '';
  }

  function getDescription(template) {
    var saved = item(template.id);
    if (saved && saved.description != null) return String(saved.description);
    return template.description || '';
  }

  function getHeaders(template) {
    var base = template.headers || {};
    var saved = item(template.id);
    var ov = (saved && saved.headers) || {};
    return {
      left: ov.left != null ? String(ov.left) : (base.left || ''),
      right: ov.right != null ? String(ov.right) : (base.right || '')
    };
  }

  function getCases(template) {
    var saved = item(template.id);
    if (saved && saved.cases != null) return saved.cases.map(String);
    return (template.displayCases || []).slice();
  }

  function ensure(data, id) {
    if (!data.items[id]) data.items[id] = { demo: {}, spec: null };
    if (!data.items[id].demo) data.items[id].demo = {};
    return data.items[id];
  }

  function saveDemo(id, idx, value) {
    idx = Number(idx);
    if (idx < WIDGET_META_INPUT_COUNT) return readRaw();
    var data = readRaw();
    ensure(data, id).demo[idx] = String(value);
    return write(data);
  }

  function saveSpec(id, text) {
    var data = readRaw();
    var it = ensure(data, id);
    if (String(text).trim() === '') it.spec = null;
    else it.spec = String(text);
    return write(data);
  }

  function saveIdentity(id, name, description) {
    var data = readRaw();
    var it = ensure(data, id);
    var n = String(name == null ? '' : name).trim();
    it.name = n === '' ? null : n;
    it.description = description == null ? null : String(description);
    return write(data);
  }

  function saveHeaders(id, left, right) {
    var data = readRaw();
    var it = ensure(data, id);
    it.headers = {
      left: String(left == null ? '' : left),
      right: String(right == null ? '' : right)
    };
    return write(data);
  }

  /**
   * Transaction: persist toàn bộ working copy MỘT LẦN khi bấm Lưu (không lưu từng ký tự).
   * patch = { name, description, demo:{idx:value}, headers:{left,right}|null, cases:[]|null, spec }
   */
  function saveEdit(id, patch) {
    var data = readRaw();
    var it = ensure(data, id);
    var n = String(patch.name == null ? '' : patch.name).trim();
    it.name = n === '' ? null : n;
    it.description = patch.description == null ? null : String(patch.description);
    if (patch.demo) {
      Object.keys(patch.demo).forEach(function (idx) {
        if (Number(idx) < WIDGET_META_INPUT_COUNT) return;
        it.demo[idx] = String(patch.demo[idx]);
      });
    }
    if (patch.headers) {
      it.headers = {
        left: String(patch.headers.left == null ? '' : patch.headers.left),
        right: String(patch.headers.right == null ? '' : patch.headers.right)
      };
    }
    if (patch.cases != null) it.cases = patch.cases.map(String);
    it.spec = String(patch.spec == null ? '' : patch.spec).trim() === '' ? null : String(patch.spec);
    return write(data);
  }

  function resetOne(id) {
    var data = readRaw();
    delete data.items[id];
    return write(data);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    return readRaw();
  }

  global.TemplatesStore = {
    read: read,
    getDemo: getDemo,
    getSpec: getSpec,
    getName: getName,
    getDescription: getDescription,
    getHeaders: getHeaders,
    getCases: getCases,
    saveDemo: saveDemo,
    saveSpec: saveSpec,
    saveIdentity: saveIdentity,
    saveHeaders: saveHeaders,
    saveEdit: saveEdit,
    resetOne: resetOne,
    resetAll: resetAll
  };
})(window);
