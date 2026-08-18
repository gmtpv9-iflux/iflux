/* @mention — gợi ý & gắn thẻ CP / Họ / Chủ đề / Ngành */
(function (global) {
  'use strict';

  var TYPE_LABELS = {
    ticker: 'Cổ phiếu',
    sector: 'Ngành',
    family: 'Họ CP',
    story: 'Chủ đề',
    'chu-de': 'Chủ đề'
  };

  function tax() { return global.IfluxWatchlistTaxonomy; }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function typeLabel(type) {
    if (tax() && tax().sourceLabel && type !== 'ticker') {
      var mapped = tax().sourceLabel(type);
      if (mapped) return mapped;
    }
    return TYPE_LABELS[type] || type;
  }

  function attrEsc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  /* Identity = IfluxMarketMaster (SOL-IDENTITY / WP-0) — không qua mock producer cũ. */
  function buildIndex() {
    var list = [];
    var mm = global.IfluxMarketMaster;
    var stocks = (mm && typeof mm.getMasterStocks === 'function' && mm.getMasterStocks()) || [];
    stocks.forEach(function (s) {
      var tk = String((s && s.ticker) || '').toUpperCase();
      if (!tk) return;
      list.push({
        type: 'ticker',
        id: tk,
        name: tk,
        label: tk + (s.name ? ' · ' + s.name : ''),
        tokens: [tk, s.name, s.short_name].filter(Boolean)
      });
    });
    if (!tax()) return list;
    ['sector', 'family', 'chu-de'].forEach(function (source) {
      tax().getGroups(source).forEach(function (g) {
        list.push({
          type: source === 'chu-de' ? 'chu-de' : source,
          id: String(g.id),
          name: g.name,
          label: g.name,
          tokens: [g.name, g.id]
        });
      });
    });
    return list;
  }

  function findHit(index, text) {
    var q = norm(String(text || '').trim());
    if (!q) return null;
    var exact = index.find(function (e) {
      return norm(e.id) === q || norm(e.name) === q;
    });
    if (exact) return exact;
    return index.find(function (e) {
      return e.tokens.some(function (t) {
        t = norm(t);
        return t === q || t.indexOf(q) === 0 || q.indexOf(t) === 0;
      });
    }) || null;
  }

  function matchEntity(query) {
    query = norm(query);
    if (!query) return [];
    var index = buildIndex();
    return index.filter(function (e) {
      return e.tokens.some(function (t) {
        t = norm(t);
        return t.indexOf(query) === 0 || t.indexOf(query) >= 0;
      });
    }).slice(0, 8);
  }

  function mentionToken(entity) {
    if (!entity) return '';
    if (entity.type === 'ticker') return '@' + entity.id;
    return '@[' + entity.name + ']';
  }

  function extractMentions(body) {
    var tags = { tickers: [], sector: null, family: null, story: null };
    var index = buildIndex();
    var used = {};

    function applyHit(hit) {
      if (!hit) return;
      var key = hit.type + ':' + hit.id;
      if (used[key]) return;
      used[key] = true;
      if (hit.type === 'ticker' && tags.tickers.indexOf(hit.id) < 0) {
        tags.tickers.push(hit.id);
      } else if (hit.type === 'sector' && !tags.sector) {
        tags.sector = { id: hit.id, name: hit.name };
      } else if (hit.type === 'family' && !tags.family) {
        tags.family = { id: hit.id, name: hit.name };
      } else if ((hit.type === 'story' || hit.type === 'chu-de') && !tags.story) {
        tags.story = { id: hit.id, name: hit.name };
        tags.chuDe = tags.story;
      }
    }

    var reBracket = /@\[([^\]]+)\]/g;
    var m;
    while ((m = reBracket.exec(body))) {
      applyHit(findHit(index, m[1]));
    }

    var reTicker = /@([A-Z][A-Z0-9]{1,5})\b/g;
    while ((m = reTicker.exec(body))) {
      applyHit(index.find(function (e) {
        return e.type === 'ticker' && e.id === m[1].toUpperCase();
      }));
    }

    var reWord = /@([^\s@.,!?;:\[\]\n]+)/g;
    while ((m = reWord.exec(body))) {
      applyHit(findHit(index, m[1]));
    }

    return tags;
  }

  function applyEntityToTags(tags, entity) {
    tags = tags || {};
    var out = {
      tickers: (tags.tickers || []).slice(),
      sector: tags.sector || null,
      family: tags.family || null,
      story: tags.story || null
    };
    if (!entity || !entity.type) return out;
    if (entity.type === 'ticker') {
      var tk = String(entity.id).toUpperCase();
      if (out.tickers.indexOf(tk) < 0) out.tickers.push(tk);
    } else if (entity.type === 'sector' && !out.sector) {
      out.sector = { id: entity.id, name: entity.name };
    } else if (entity.type === 'family' && !out.family) {
      out.family = { id: entity.id, name: entity.name };
    } else if ((entity.type === 'story' || entity.type === 'chu-de') && !out.story) {
      out.story = { id: entity.id, name: entity.name };
      out.chuDe = out.story;
    }
    return out;
  }

  function mergeTags(pageTags, bodyTags) {
    pageTags = pageTags || {};
    bodyTags = bodyTags || {};
    var tickers = (pageTags.tickers || []).slice();
    (bodyTags.tickers || []).forEach(function (t) {
      t = String(t).toUpperCase();
      if (tickers.indexOf(t) < 0) tickers.push(t);
    });
    return {
      tickers: tickers.slice(0, 3),
      sector: bodyTags.sector || null,
      family: bodyTags.family || null,
      story: bodyTags.story || null
    };
  }

  function stripMentions(body) {
    if (!body) return '';
    var text = String(body);
    var index = buildIndex();

    function isEntityMention(raw) {
      return !!findHit(index, raw);
    }

    text = text.replace(/@\[(.+?)\]/g, function (_, rawName) {
      return isEntityMention(rawName) ? '' : '@[' + rawName + ']';
    });
    text = text.replace(/@([A-Z][A-Z0-9]{1,5})\b/g, function (_, tk) {
      var hit = index.find(function (e) {
        return e.type === 'ticker' && e.id === tk.toUpperCase();
      });
      return hit ? '' : '@' + tk;
    });
    text = text.replace(/@([^\s@.,!?;:\[\]\n]+)/g, function (_, raw) {
      return isEntityMention(raw) ? '' : '@' + raw;
    });
    return text.replace(/\s{2,}/g, ' ').trim();
  }

  function entityHref(entity, opts) {
    if (!entity || !entity.type) return '';
    opts = opts || {};
    var id = entity.id;
    var c = '';
    if (global.IfluxSeoUrl) {
      if (entity.type === 'ticker') c = IfluxSeoUrl.stockHref(id);
      else if (entity.type === 'sector') c = IfluxSeoUrl.sectorHref(id);
      else if (entity.type === 'family') c = IfluxSeoUrl.ecosystemHref(id);
      else if (entity.type === 'story' || entity.type === 'chu-de') c = IfluxSeoUrl.storyEntityHref(id);
    } else if (entity.type === 'ticker') {
      c = '/co-phieu/' + encodeURIComponent(String(id).toUpperCase());
    } else if (entity.type === 'sector') {
      c = '/nganh/' + encodeURIComponent(id);
    } else if (entity.type === 'family') {
      c = '/he-sinh-thai/' + encodeURIComponent(id);
    } else if (entity.type === 'story' || entity.type === 'chu-de') {
      c = '/chu-de/' + encodeURIComponent(id);
    }
    if (!c) return '';
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function tagRefHref(type, ref, opts) {
    if (!ref || ref.id == null) return '';
    return entityHref({ type: type, id: ref.id, name: ref.name }, opts);
  }

  function bodyWithMentionHighlight(body, opts) {
    if (!body) return '';
    opts = opts || {};
    var escHtml = function (s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var index = buildIndex();
    var html = escHtml(body);

    html = html.replace(/@\[(.+?)\]/g, function (_, rawName) {
      var name = rawName;
      var hit = findHit(index, name);
      var label = '@[' + escHtml(name) + ']';
      var href = hit ? entityHref(hit, opts) : '';
      if (href) {
        return '<a href="' + attrEsc(href) + '" class="ifx-mention ifx-mention--tag">' + label + '</a>';
      }
      return '<span class="ifx-mention ifx-mention--tag">' + label + '</span>';
    });

    html = html.replace(/@([A-Z][A-Z0-9]{1,5})\b/g, function (_, tk) {
      var upper = tk.toUpperCase();
      var href = entityHref({ type: 'ticker', id: upper }, opts);
      var label = '@' + upper;
      if (href) {
        return '<a href="' + attrEsc(href) + '" class="ifx-mention ifx-mention--ticker">' + label + '</a>';
      }
      return '<span class="ifx-mention">' + label + '</span>';
    });

    return html;
  }

  function bindAutocomplete(textarea, dropdown, onChange, onTagAdded) {
    if (!textarea || !dropdown) return;

    function hide() {
      dropdown.hidden = true;
      dropdown.innerHTML = '';
    }

    function notifyChange() {
      if (typeof onChange === 'function') onChange(textarea.value);
      textarea.dispatchEvent(new CustomEvent('iflux-mention-input', { bubbles: true }));
    }

    function insertMention(entity) {
      if (!entity || !entity.type) return;
      var val = textarea.value;
      var pos = textarea.selectionStart;
      var before = val.slice(0, pos);
      var after = val.slice(pos);
      var at = before.lastIndexOf('@');
      if (at < 0) return;
      var prefix = before.slice(0, at);
      var next = prefix;
      if (next && !/\s$/.test(next)) next += ' ';
      textarea.value = next + after;
      var c = next.length;
      textarea.setSelectionRange(c, c);
      textarea.focus();
      hide();
      if (typeof onTagAdded === 'function') onTagAdded(entity);
      notifyChange();
    }

    textarea.addEventListener('input', function () {
      notifyChange();
      var val = textarea.value;
      var pos = textarea.selectionStart;
      var before = val.slice(0, pos);
      var at = before.lastIndexOf('@');
      if (at < 0 || (at > 0 && !/\s/.test(before.charAt(at - 1)))) {
        hide();
        return;
      }
      var q = before.slice(at + 1);
      if (q.indexOf(' ') >= 0 || q.indexOf('\n') >= 0 || q.indexOf('[') >= 0) {
        hide();
        return;
      }
      var hits = matchEntity(q);
      if (!hits.length) {
        hide();
        return;
      }
      dropdown.hidden = false;
      dropdown.innerHTML = hits.map(function (h, i) {
        return '<button type="button" class="ifx-mention-opt' + (i === 0 ? ' is-active' : '') + '"' +
          ' data-ifx-mention-type="' + attrEsc(h.type) + '"' +
          ' data-ifx-mention-id="' + attrEsc(h.id) + '"' +
          ' data-ifx-mention-name="' + attrEsc(h.name) + '">' +
          '<span class="ifx-mention-opt__type">' + typeLabel(h.type) + '</span> ' +
          attrEsc(h.label) + '</button>';
      }).join('');
    });

    dropdown.addEventListener('mousedown', function (e) {
      var btn = e.target.closest('[data-ifx-mention-type]');
      if (!btn) return;
      e.preventDefault();
      insertMention({
        type: btn.getAttribute('data-ifx-mention-type'),
        id: btn.getAttribute('data-ifx-mention-id'),
        name: btn.getAttribute('data-ifx-mention-name')
      });
    });

    textarea.addEventListener('blur', function () {
      setTimeout(hide, 150);
    });
  }

  global.IfluxStockMentions = {
    TYPE_LABELS: TYPE_LABELS,
    typeLabel: typeLabel,
    buildIndex: buildIndex,
    matchEntity: matchEntity,
    mentionToken: mentionToken,
    entityHref: entityHref,
    tagRefHref: tagRefHref,
    extractMentions: extractMentions,
    applyEntityToTags: applyEntityToTags,
    mergeTags: mergeTags,
    stripMentions: stripMentions,
    bodyWithMentionHighlight: bodyWithMentionHighlight,
    bindAutocomplete: bindAutocomplete
  };
})(window);
