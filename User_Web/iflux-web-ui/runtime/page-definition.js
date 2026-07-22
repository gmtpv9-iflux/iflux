const META_FIELDS = [
  ['description', 'name'],
  ['robots', 'name'],
  ['keywords', 'name'],
  ['geo.region', 'name'],
  ['geo.placename', 'name'],
  ['language', 'name'],
  ['og:title', 'property'],
  ['og:description', 'property'],
  ['og:type', 'property'],
  ['og:locale', 'property'],
  ['og:url', 'property'],
  ['og:image', 'property'],
  ['twitter:card', 'name'],
  ['twitter:title', 'name'],
  ['twitter:description', 'name'],
  ['twitter:image', 'name']
];

function clone(value) {
  if (!value || typeof value !== 'object') return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    return value;
  }
}

function ensureStore() {
  if (!window.__IFLUX_PAGE_DEFINITION__) {
    window.__IFLUX_PAGE_DEFINITION__ = {
      current: null,
      jsonLdIds: []
    };
  }
  return window.__IFLUX_PAGE_DEFINITION__;
}

function setMeta(name, content, attr) {
  if (!name) return;
  attr = attr || 'name';
  var sel = 'meta[' + attr + '="' + name + '"]';
  var el = document.querySelector(sel);
  if (!content) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  var link = document.querySelector('link[rel="canonical"]');
  if (!href) {
    if (link && link.parentNode) link.parentNode.removeChild(link);
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function clearJsonLd(ids) {
  (ids || []).forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
}

function setJsonLdEntries(entries) {
  var store = ensureStore();
  clearJsonLd(store.jsonLdIds);
  store.jsonLdIds = [];
  (entries || []).forEach(function (entry) {
    if (!entry || !entry.id || !entry.data) return;
    var script = document.createElement('script');
    script.id = entry.id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(entry.data, null, 2);
    document.head.appendChild(script);
    store.jsonLdIds.push(entry.id);
  });
}

function updatePageHead(definition) {
  var titleEl = document.querySelector('[data-ifx-page-def-title]');
  if (titleEl) titleEl.textContent = definition && definition.title ? definition.title : '';
  var introEl = document.querySelector('[data-ifx-page-def-intro]');
  if (introEl) {
    var intro = definition && definition.intro ? definition.intro : '';
    introEl.textContent = intro;
    introEl.hidden = !intro;
  }
}

function applySeo(definition) {
  var seo = definition && definition.seo ? definition.seo : null;
  if (!seo) {
    META_FIELDS.forEach(function (entry) { setMeta(entry[0], null, entry[1]); });
    setCanonical(null);
    setJsonLdEntries([]);
    return;
  }
  META_FIELDS.forEach(function (entry) {
    setMeta(entry[0], seo[entry[0]], entry[1]);
  });
  setCanonical(seo.canonical || null);
  setJsonLdEntries(seo.jsonLd || []);
}

export function setActiveDefinition(definition) {
  var store = ensureStore();
  store.current = clone(definition) || null;
  return store.current;
}

export function getActiveDefinition() {
  return ensureStore().current;
}

export function patchActiveDefinition(patch) {
  var store = ensureStore();
  var next = Object.assign({}, store.current || {}, clone(patch) || {});
  if (store.current && store.current.seo && patch && patch.seo) {
    next.seo = Object.assign({}, store.current.seo, clone(patch.seo));
  }
  store.current = next;
  return next;
}

export function applyDefinitionToDocument(definition) {
  if (!definition) return null;
  var next = setActiveDefinition(definition);
  if (next.documentTitle) {
    document.title = next.documentTitle;
  }
  updatePageHead(next);
  applySeo(next);
  return next;
}

export function applyDefinitionPatch(patch) {
  var next = patchActiveDefinition(patch);
  if (next.documentTitle) {
    document.title = next.documentTitle;
  }
  updatePageHead(next);
  applySeo(next);
  return next;
}

window.IfluxPageDefinition = {
  getCurrent: getActiveDefinition,
  setCurrent: setActiveDefinition,
  patchCurrent: patchActiveDefinition,
  applyCurrent: applyDefinitionToDocument,
  applyPatch: applyDefinitionPatch
};
