/**
 * L4RuntimeReader — AB-07 read adapter (User Web Runtime).
 * Lazy GET /api/widgets/:widgetId — memory cache only. No compatibility facade (ABH E6).
 */
(function (global) {
  'use strict';

  var _meta = {};
  var _ids = [];
  var _missing = {};
  var _pending = {};
  var _ready = false;

  function pageForWidget(id) {
    if (/^WGT-FLW|^WGT-FLOW/.test(id)) return ['flow'];
    if (/^WGT-COM/.test(id)) return ['news'];
    if (/^WGT-WAT/.test(id)) return ['dashboard'];
    return ['market', 'dashboard'];
  }

  function stubMeta(id) {
    return { id: id, title: id, description: '', tier: 'free', pages: pageForWidget(id), template: '' };
  }

  function widgetTier(id) {
    var m = _meta[id];
    return (m && m.tier) || 'free';
  }

  function widgetDeploy(id) {
    var m = _meta[id];
    return { pages: (m && m.pages) ? m.pages.slice() : pageForWidget(id), blocks: [] };
  }

  function collectIdsFromPlans(plansData) {
    var set = {};
    if (!plansData) return set;
    var plans = plansData.plans || [];
    plans.forEach(function (plan) {
      Object.keys(plan.blocks || {}).forEach(function (k) {
        if (k.indexOf('WGT-') === 0) set[k] = true;
      });
    });
    if (!plans.length && plansData.overrides) {
      Object.keys(plansData.overrides).forEach(function (tier) {
        var blocks = plansData.overrides[tier] && plansData.overrides[tier].blocks;
        if (!blocks) return;
        Object.keys(blocks).forEach(function (k) {
          if (k.indexOf('WGT-') === 0) set[k] = true;
        });
      });
    }
    return set;
  }

  function parseWidgetArtifact(id, body) {
    var art = (body && body.data) ? body.data : (body && body.widget) ? body.widget : body;
    if (!art || !art.id) return null;
    var content = art.content || {};
    var perm = art.permission || {};
    return {
      id: id,
      title: content.title || id,
      description: content.description || content.subtitle || '',
      tier: perm.minTier || perm.tier || 'free',
      pages: perm.pages || pageForWidget(id),
      template: art.templateRef || art.template || ''
    };
  }

  function fetchWidgetOnce(id) {
    id = String(id || '');
    if (!id || _missing[id] || _meta[id]) {
      return Promise.resolve(_meta[id] || null);
    }
    if (_pending[id]) return _pending[id];
    _pending[id] = fetch('/api/widgets/' + encodeURIComponent(id), {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) {
        _missing[id] = true;
        return null;
      }
      return res.json();
    }).then(function (body) {
      var parsed = parseWidgetArtifact(id, body);
      if (parsed) _meta[id] = parsed;
      else _missing[id] = true;
      delete _pending[id];
      return _meta[id] || null;
    }).catch(function () {
      _missing[id] = true;
      delete _pending[id];
      return null;
    });
    return _pending[id];
  }

  function ensureStub(id) {
    id = String(id || '');
    if (!_meta[id] && !_missing[id]) _meta[id] = stubMeta(id);
    if (_ids.indexOf(id) < 0) _ids.push(id);
  }

  global.L4RuntimeReader = {
    load: function (opts) {
      opts = opts || {};
      if (opts.force) {
        _meta = {};
        _ids = [];
        _missing = {};
        _pending = {};
        _ready = false;
      }
      if (_ready && !opts.force) return Promise.resolve(_ids);

      return (global.PlansRuntimeReader && PlansRuntimeReader.load
        ? PlansRuntimeReader.load()
        : Promise.resolve(null)
      ).then(function (plansData) {
        var idSet = collectIdsFromPlans(plansData);
        _ids = Object.keys(idSet).sort();
        _ids.forEach(function (id) { _meta[id] = stubMeta(id); });
        _ready = true;
        return _ids;
      }).catch(function () {
        _ids = [];
        _ready = true;
        return _ids;
      });
    },

    isReady: function () { return _ready; },

    widgetIds: function () { return _ids.slice(); },

    /** Entitlement domain filter (not Placement) — ABH-TD-E4-003 rename. */
    widgetIdsForEntitlementDomain: function (pageKey) {
      pageKey = String(pageKey || '');
      return _ids.filter(function (id) {
        return widgetDeploy(id).pages.indexOf(pageKey) >= 0;
      });
    },

    entitlementMeta: function (id) {
      id = String(id || '');
      ensureStub(id);
      var m = _meta[id];
      if (!m) return null;
      var dep = widgetDeploy(id);
      return {
        id: id, title: m.title, description: m.description,
        tier: m.tier, pages: dep.pages, blocks: dep.blocks,
        template: m.template, active: true
      };
    },

    resolveWidgetCopy: function (id) {
      id = String(id || '');
      ensureStub(id);
      var m = _meta[id];
      if (m && m.title !== id) {
        return { title: m.title, description: m.description };
      }
      fetchWidgetOnce(id);
      m = _meta[id];
      return { title: (m && m.title) || id, description: (m && m.description) || '' };
    },

    fetchWidget: fetchWidgetOnce,

    entitlementList: function () {
      return _ids.map(function (id) { return global.L4RuntimeReader.entitlementMeta(id); }).filter(Boolean);
    }
  };
})(window);
