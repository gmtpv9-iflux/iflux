/* GEO Metadata — AI Search (Summary, Takeaways, FAQ, Claims, Evidence, Sources, Related) */
(function (global) {
  'use strict';

  var SECTIONS = [
    { key: 'summary', label: 'Summary', icon: 'ti-file-description' },
    { key: 'key_takeaways', label: 'Key Takeaways', icon: 'ti-list-check' },
    { key: 'faq', label: 'FAQ', icon: 'ti-help' },
    { key: 'claims', label: 'Claims', icon: 'ti-quote' },
    { key: 'evidence', label: 'Evidence', icon: 'ti-microscope' },
    { key: 'sources', label: 'Sources', icon: 'ti-link' },
    { key: 'related_topics', label: 'Related Topics', icon: 'ti-tags' }
  ];

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function emptyGeoAi() {
    return {
      summary: '',
      key_takeaways: [],
      faq: [],
      claims: [],
      evidence: [],
      sources: [],
      related_topics: []
    };
  }

  function normalizeList(arr) {
    if (!arr) return [];
    if (typeof arr === 'string') {
      return arr.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return arr.filter(Boolean);
  }

  function normalizeGeoAi(post) {
    var raw = post && post.geo_ai ? post.geo_ai : {};
    var legacyFaq = (post && post.schema && post.schema.faq) || [];
    var faq = (raw.faq && raw.faq.length) ? raw.faq : legacyFaq;
    return {
      summary: raw.summary || (post && post.excerpt) || '',
      key_takeaways: normalizeList(raw.key_takeaways),
      faq: faq.map(function (f) {
        return { q: f.q || f.question || '', a: f.a || f.answer || '' };
      }).filter(function (f) { return f.q && f.a; }),
      claims: (raw.claims || []).map(function (c, i) {
        if (typeof c === 'string') return { id: 'c' + (i + 1), text: c };
        return { id: c.id || ('c' + (i + 1)), text: c.text || '' };
      }).filter(function (c) { return c.text; }),
      evidence: (raw.evidence || []).map(function (e) {
        if (typeof e === 'string') return { text: e, claim_id: '' };
        return { text: e.text || '', claim_id: e.claim_id || '' };
      }).filter(function (e) { return e.text; }),
      sources: (raw.sources || []).map(function (s) {
        if (typeof s === 'string') return { title: s, url: '' };
        return { title: s.title || '', url: s.url || '', publisher: s.publisher || '' };
      }).filter(function (s) { return s.title; }),
      related_topics: normalizeList(raw.related_topics)
    };
  }

  function extractH2(body) {
    var list = [];
    if (!body) return list;
    var re = /<h2[^>]*>([^<]+)<\/h2>/gi;
    var m;
    while ((m = re.exec(body))) {
      var t = m[1].replace(/&[^;]+;/g, '').trim();
      if (t) list.push(t);
    }
    return list;
  }

  function plainText(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function generateDraft(input) {
    input = input || {};
    var title = input.title || '';
    var excerpt = input.excerpt || '';
    var body = input.body_html || '';
    var tickers = input.tickers || [];
    var storyTags = input.story_tags || [];
    var geo = input.geo || {};
    var plain = plainText(body);
    var h2s = extractH2(body);
    var tickerStr = tickers.length ? tickers.join(', ') : 'thị trường';
    var storyName = storyTags[0] && storyTags[0].name ? storyTags[0].name : '';

    var takeaways = h2s.length
      ? h2s.map(function (h) { return h.charAt(0).toUpperCase() + h.slice(1); })
      : [
          'Theo dõi ' + tickerStr + ' trong bối cảnh ' + (storyName || 'vĩ mô Việt Nam'),
          'Ưu tiên quản trị rủi ro và xác nhận dòng tiền trước khi tăng tỷ trọng'
        ];

    var claims = [
      { id: 'c1', text: title || 'Luận điểm chính của bài phân tích' },
      { id: 'c2', text: excerpt || 'Nhận định tóm tắt từ nội dung bài viết' }
    ];

    var evidence = [];
    if (plain.length > 40) {
      evidence.push({ text: plain.slice(0, 180) + (plain.length > 180 ? '…' : ''), claim_id: 'c1' });
    }
    if (h2s[0]) {
      evidence.push({ text: 'Mục phân tích: ' + h2s[0], claim_id: 'c2' });
    }

    var related = [];
    tickers.forEach(function (t) { related.push('Cổ phiếu ' + t); });
    if (storyName) related.push(storyName);
    (geo.geo_keywords || []).forEach(function (k) { related.push(k); });

    var faq = [
      {
        q: tickerStr !== 'thị trường' ? ('Có nên quan tâm ' + tickers[0] + ' ngay bây giờ?') : 'Bài viết này phù hợp với ai?',
        a: excerpt || 'Đọc phần Key Takeaways và Claims để có góc nhìn tổng quan trước khi quyết định.'
      },
      {
        q: 'Rủi ro chính cần lưu ý là gì?',
        a: 'Biến động thị trường, thay đổi chính sách và thanh khoản — cần theo dõi thêm tin tức liên quan.'
      }
    ];

    return {
      summary: excerpt || plain.slice(0, 240),
      key_takeaways: takeaways.slice(0, 5),
      faq: faq,
      claims: claims,
      evidence: evidence,
      sources: [{ title: 'iFlux Community — ' + (title || 'Phân tích'), url: '', publisher: 'iFlux' }],
      related_topics: related.slice(0, 8)
    };
  }

  function renderArticleHtml(post) {
    var g = normalizeGeoAi(post);
    var hasContent = g.summary || g.key_takeaways.length || g.faq.length ||
      g.claims.length || g.evidence.length || g.sources.length || g.related_topics.length;
    if (!hasContent) return '';

    var blocks = [];

    if (g.summary) {
      blocks.push(
        '<section class="ifx-geo-ai__section" id="geo-ai-summary" data-geo-ai="summary">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-file-description"></i> Summary</h3>' +
          '<p class="ifx-geo-ai__summary">' + esc(g.summary) + '</p>' +
        '</section>'
      );
    }

    if (g.key_takeaways.length) {
      blocks.push(
        '<section class="ifx-geo-ai__section" id="geo-ai-takeaways" data-geo-ai="key_takeaways">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-list-check"></i> Key Takeaways</h3>' +
          '<ul class="ifx-geo-ai__list">' +
            g.key_takeaways.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
          '</ul>' +
        '</section>'
      );
    }

    if (g.faq.length) {
      blocks.push(
        '<section class="ifx-geo-ai__section ifx-geo-ai__section--faq" id="geo-ai-faq" data-geo-ai="faq" itemscope itemtype="https://schema.org/FAQPage">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-help"></i> FAQ</h3>' +
          g.faq.map(function (f) {
            return (
              '<details class="ifx-geo-ai__faq" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">' +
                '<summary itemprop="name">' + esc(f.q) + '</summary>' +
                '<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">' +
                  '<p itemprop="text">' + esc(f.a) + '</p>' +
                '</div>' +
              '</details>'
            );
          }).join('') +
        '</section>'
      );
    }

    if (g.claims.length) {
      blocks.push(
        '<section class="ifx-geo-ai__section" id="geo-ai-claims" data-geo-ai="claims">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-quote"></i> Claims</h3>' +
          '<ol class="ifx-geo-ai__claims">' +
            g.claims.map(function (c) {
              return '<li id="claim-' + esc(c.id) + '"><span class="ifx-geo-ai__claim-id">' + esc(c.id) + '</span> ' + esc(c.text) + '</li>';
            }).join('') +
          '</ol>' +
        '</section>'
      );
    }

    if (g.evidence.length) {
      blocks.push(
        '<section class="ifx-geo-ai__section" id="geo-ai-evidence" data-geo-ai="evidence">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-microscope"></i> Evidence</h3>' +
          '<ul class="ifx-geo-ai__evidence">' +
            g.evidence.map(function (e) {
              var ref = e.claim_id
                ? ' <span class="ifx-geo-ai__ref">→ ' + esc(e.claim_id) + '</span>'
                : '';
              return '<li>' + esc(e.text) + ref + '</li>';
            }).join('') +
          '</ul>' +
        '</section>'
      );
    }

    if (g.sources.length) {
      blocks.push(
        '<section class="ifx-geo-ai__section" id="geo-ai-sources" data-geo-ai="sources">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-link"></i> Sources</h3>' +
          '<ul class="ifx-geo-ai__sources">' +
            g.sources.map(function (s) {
              var inner = s.url
                ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + esc(s.title) + '</a>'
                : esc(s.title);
              var pub = s.publisher ? ' <span class="ifx-geo-ai__pub">(' + esc(s.publisher) + ')</span>' : '';
              return '<li>' + inner + pub + '</li>';
            }).join('') +
          '</ul>' +
        '</section>'
      );
    }

    if (g.related_topics.length) {
      blocks.push(
        '<section class="ifx-geo-ai__section" id="geo-ai-related" data-geo-ai="related_topics">' +
          '<h3 class="ifx-geo-ai__title"><i class="ti ti-tags"></i> Related Topics</h3>' +
          '<div class="ifx-geo-ai__topics">' +
            g.related_topics.map(function (t) {
              return '<span class="ifx-geo-ai__topic">' + esc(t) + '</span>';
            }).join('') +
          '</div>' +
        '</section>'
      );
    }

    return (
      '<aside class="ifx-geo-ai" aria-label="GEO Metadata — AI Search">' +
        '<header class="ifx-geo-ai__head">' +
          '<span class="ifx-geo-ai__kicker"><i class="ti ti-brain"></i> GEO · AI Search</span>' +
          '<p class="ifx-geo-ai__hint">Cấu trúc metadata giúp công cụ AI và tìm kiếm hiểu bài viết</p>' +
        '</header>' +
        blocks.join('') +
      '</aside>'
    );
  }

  function linesFromTextarea(val) {
    return String(val || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function collectFromForm(root) {
    if (!root) return emptyGeoAi();
    var faq = [];
    root.querySelectorAll('[data-ifx-geo-ai-faq]').forEach(function (row) {
      var q = row.querySelector('[data-ifx-geo-ai-faq-q]');
      var a = row.querySelector('[data-ifx-geo-ai-faq-a]');
      if (q && a && q.value.trim() && a.value.trim()) {
        faq.push({ q: q.value.trim(), a: a.value.trim() });
      }
    });
    var claims = linesFromTextarea(root.querySelector('[data-ifx-geo-ai-claims]') && root.querySelector('[data-ifx-geo-ai-claims]').value)
      .map(function (t, i) { return { id: 'c' + (i + 1), text: t }; });
    var evidence = [];
    root.querySelectorAll('[data-ifx-geo-ai-evidence]').forEach(function (row) {
      var t = row.querySelector('[data-ifx-geo-ai-evidence-text]');
      var c = row.querySelector('[data-ifx-geo-ai-evidence-claim]');
      if (t && t.value.trim()) {
        evidence.push({ text: t.value.trim(), claim_id: c ? c.value.trim() : '' });
      }
    });
    var sources = [];
    root.querySelectorAll('[data-ifx-geo-ai-source]').forEach(function (row) {
      var title = row.querySelector('[data-ifx-geo-ai-source-title]');
      var url = row.querySelector('[data-ifx-geo-ai-source-url]');
      var pub = row.querySelector('[data-ifx-geo-ai-source-pub]');
      if (title && title.value.trim()) {
        sources.push({
          title: title.value.trim(),
          url: url ? url.value.trim() : '',
          publisher: pub ? pub.value.trim() : ''
        });
      }
    });
    return {
      summary: root.querySelector('[data-ifx-geo-ai-summary]') ? root.querySelector('[data-ifx-geo-ai-summary]').value.trim() : '',
      key_takeaways: linesFromTextarea(root.querySelector('[data-ifx-geo-ai-takeaways]') && root.querySelector('[data-ifx-geo-ai-takeaways]').value),
      faq: faq,
      claims: claims,
      evidence: evidence,
      sources: sources,
      related_topics: linesFromTextarea(root.querySelector('[data-ifx-geo-ai-related]') && root.querySelector('[data-ifx-geo-ai-related]').value)
    };
  }

  function fillForm(root, geoAi) {
    if (!root) return;
    geoAi = normalizeGeoAi({ geo_ai: geoAi });
    var el;
    el = root.querySelector('[data-ifx-geo-ai-summary]');
    if (el) el.value = geoAi.summary || '';
    el = root.querySelector('[data-ifx-geo-ai-takeaways]');
    if (el) el.value = (geoAi.key_takeaways || []).join('\n');
    el = root.querySelector('[data-ifx-geo-ai-related]');
    if (el) el.value = (geoAi.related_topics || []).join('\n');
    el = root.querySelector('[data-ifx-geo-ai-claims]');
    if (el) el.value = (geoAi.claims || []).map(function (c) { return c.text; }).join('\n');

    var faqList = root.querySelector('[data-ifx-geo-ai-faq-list]');
    if (faqList) {
      faqList.innerHTML = '';
      (geoAi.faq || []).forEach(function (f) { addFaqRow(root, f.q, f.a); });
      if (!geoAi.faq.length) addFaqRow(root, '', '');
    }
    var evList = root.querySelector('[data-ifx-geo-ai-evidence-list]');
    if (evList) {
      evList.innerHTML = '';
      (geoAi.evidence || []).forEach(function (e) { addEvidenceRow(root, e.text, e.claim_id); });
      if (!geoAi.evidence.length) addEvidenceRow(root, '', '');
    }
    var srcList = root.querySelector('[data-ifx-geo-ai-sources-list]');
    if (srcList) {
      srcList.innerHTML = '';
      (geoAi.sources || []).forEach(function (s) { addSourceRow(root, s.title, s.url, s.publisher); });
      if (!geoAi.sources.length) addSourceRow(root, '', '', '');
    }
  }

  function addFaqRow(root, q, a) {
    var list = root.querySelector('[data-ifx-geo-ai-faq-list]');
    if (!list) return;
    var row = document.createElement('div');
    row.className = 'ifx-geo-ai-form__row';
    row.setAttribute('data-ifx-geo-ai-faq', '1');
    row.innerHTML =
      '<input type="text" class="ix-input" placeholder="Câu hỏi" data-ifx-geo-ai-faq-q value="' + esc(q) + '" />' +
      '<textarea class="ix-input" rows="2" placeholder="Trả lời" data-ifx-geo-ai-faq-a>' + esc(a || '') + '</textarea>' +
      '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-faq-del><i class="ti ti-trash"></i></button>';
    list.appendChild(row);
    row.querySelector('[data-ifx-geo-ai-faq-del]').addEventListener('click', function () { row.remove(); });
  }

  function addEvidenceRow(root, text, claimId) {
    var list = root.querySelector('[data-ifx-geo-ai-evidence-list]');
    if (!list) return;
    var row = document.createElement('div');
    row.className = 'ifx-geo-ai-form__row ifx-geo-ai-form__row--evidence';
    row.setAttribute('data-ifx-geo-ai-evidence', '1');
    row.innerHTML =
      '<textarea class="ix-input" rows="2" placeholder="Bằng chứng / dữ kiện" data-ifx-geo-ai-evidence-text>' + esc(text || '') + '</textarea>' +
      '<input type="text" class="ix-input" placeholder="Claim ID (c1)" data-ifx-geo-ai-evidence-claim value="' + esc(claimId || '') + '" />' +
      '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-ev-del><i class="ti ti-trash"></i></button>';
    list.appendChild(row);
    row.querySelector('[data-ifx-geo-ai-ev-del]').addEventListener('click', function () { row.remove(); });
  }

  function addSourceRow(root, title, url, publisher) {
    var list = root.querySelector('[data-ifx-geo-ai-sources-list]');
    if (!list) return;
    var row = document.createElement('div');
    row.className = 'ifx-geo-ai-form__row ifx-geo-ai-form__row--source';
    row.setAttribute('data-ifx-geo-ai-source', '1');
    row.innerHTML =
      '<input type="text" class="ix-input" placeholder="Tên nguồn" data-ifx-geo-ai-source-title value="' + esc(title) + '" />' +
      '<input type="url" class="ix-input" placeholder="URL" data-ifx-geo-ai-source-url value="' + esc(url) + '" />' +
      '<input type="text" class="ix-input" placeholder="Nhà xuất bản" data-ifx-geo-ai-source-pub value="' + esc(publisher) + '" />' +
      '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-src-del><i class="ti ti-trash"></i></button>';
    list.appendChild(row);
    row.querySelector('[data-ifx-geo-ai-src-del]').addEventListener('click', function () { row.remove(); });
  }

  function writeFormSectionHtml() {
    return (
      '<section class="ifx-com-write__section ifx-com-write__section--geo-ai">' +
        '<div class="ifx-geo-ai-form__head">' +
          '<h2><i class="ti ti-brain"></i> GEO Metadata (AI Search)</h2>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-generate>' +
            '<i class="ti ti-wand"></i> Sinh tự động</button>' +
        '</div>' +
        '<p class="ifx-com-hint">Sườn chuẩn cho AI Search: Summary · Key Takeaways · FAQ · Claims · Evidence · Sources · Related Topics</p>' +
        '<div class="ifx-geo-ai-form__nav">' +
          SECTIONS.map(function (s) {
            return '<span class="ifx-geo-ai-form__chip"><i class="ti ' + s.icon + '"></i> ' + s.label + '</span>';
          }).join('') +
        '</div>' +
        '<div class="ix-form-group"><label class="ix-label">Summary</label>' +
          '<textarea class="ix-input" rows="3" data-ifx-geo-ai-summary placeholder="Tóm tắt ngắn tối ưu cho AI (1–3 câu)"></textarea></div>' +
        '<div class="ix-form-group"><label class="ix-label">Key Takeaways <small>(mỗi dòng 1 ý)</small></label>' +
          '<textarea class="ix-input" rows="4" data-ifx-geo-ai-takeaways placeholder="Điểm then chốt 1\nĐiểm then chốt 2"></textarea></div>' +
        '<div class="ifx-geo-ai-form__block"><label class="ix-label">FAQ</label>' +
          '<div data-ifx-geo-ai-faq-list></div>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-faq-add><i class="ti ti-plus"></i> Thêm FAQ</button></div>' +
        '<div class="ix-form-group"><label class="ix-label">Claims <small>(mỗi dòng 1 luận điểm — tự gán c1, c2…)</small></label>' +
          '<textarea class="ix-input" rows="3" data-ifx-geo-ai-claims placeholder="Luận điểm chính 1\nLuận điểm 2"></textarea></div>' +
        '<div class="ifx-geo-ai-form__block"><label class="ix-label">Evidence</label>' +
          '<div data-ifx-geo-ai-evidence-list></div>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-ev-add><i class="ti ti-plus"></i> Thêm Evidence</button></div>' +
        '<div class="ifx-geo-ai-form__block"><label class="ix-label">Sources</label>' +
          '<div data-ifx-geo-ai-sources-list></div>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-geo-ai-src-add><i class="ti ti-plus"></i> Thêm nguồn</button></div>' +
        '<div class="ix-form-group"><label class="ix-label">Related Topics <small>(mỗi dòng 1 chủ đề)</small></label>' +
          '<textarea class="ix-input" rows="3" data-ifx-geo-ai-related placeholder="Cổ phiếu HPG\nĐầu tư công"></textarea></div>' +
      '</section>'
    );
  }

  function bindWriteForm(root) {
    if (!root) return;
    addFaqRow(root, '', '');
    addEvidenceRow(root, '', '');
    addSourceRow(root, '', '', '');
    root.querySelector('[data-ifx-geo-ai-faq-add]').addEventListener('click', function () { addFaqRow(root, '', ''); });
    root.querySelector('[data-ifx-geo-ai-ev-add]').addEventListener('click', function () { addEvidenceRow(root, '', ''); });
    root.querySelector('[data-ifx-geo-ai-src-add]').addEventListener('click', function () { addSourceRow(root, '', '', ''); });
    root.querySelector('[data-ifx-geo-ai-generate]').addEventListener('click', function () {
      var tickers = global.IfluxNewsStore
        ? global.IfluxNewsStore.extractTickersFromPost(
            root.querySelector('[data-ifx-com-title]').value,
            root.querySelector('[data-ifx-com-excerpt]').value,
            root.querySelector('[data-ifx-com-body]').value
          )
        : [];
      var storySel = root.querySelector('[data-ifx-com-story]');
      var storyTags = [];
      if (storySel && storySel.value && global.IfluxWatchlistTaxonomy) {
        var g = IfluxWatchlistTaxonomy.getGroup('story', storySel.value);
        if (g) storyTags.push({ source: 'chu-de', sourceId: g.id, name: g.name });
      }
      var draft = generateDraft({
        title: root.querySelector('[data-ifx-com-title]').value.trim(),
        excerpt: root.querySelector('[data-ifx-com-excerpt]').value.trim(),
        body_html: root.querySelector('[data-ifx-com-body]').value.trim(),
        tickers: tickers,
        story_tags: storyTags,
        geo: {
          geo_keywords: (root.querySelector('[data-ifx-com-geo-kw]') || {}).value
            ? root.querySelector('[data-ifx-com-geo-kw]').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
            : []
        }
      });
      fillForm(root, draft);
      if (global.ixToast) ixToast('Đã sinh GEO AI metadata', 'success');
    });
  }

  function buildJsonLdBlocks(post, canonical) {
    var g = normalizeGeoAi(post);
    var blocks = [];
    if (g.faq.length) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: g.faq.map(function (f) {
          return {
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          };
        })
      });
    }
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': canonical + '#geo-ai',
      headline: post.title,
      abstract: g.summary,
      description: g.summary || post.excerpt,
      url: canonical,
      keywords: g.related_topics.join(', '),
      citation: g.sources.filter(function (s) { return s.url; }).map(function (s) {
        return { '@type': 'CreativeWork', name: s.title, url: s.url };
      })
    });
    return blocks;
  }

  function seedGeoAiById(id) {
    var map = {
      post_seed_hpg: {
        summary: 'HPG hưởng lợi từ đầu tư công và nhu cầu thép nội địa; biên lợi nhuận cải thiện khi chi phí đầu vào ổn định.',
        key_takeaways: [
          'HPG là cổ phiếu thép hàng đầu, nhạy với chu kỳ đầu tư công',
          'Xuất khẩu thép phục hồi hỗ trợ doanh thu quý tới',
          'Theo dõi vùng tích lũy trước khi tăng tỷ trọng trung hạn'
        ],
        faq: [
          { q: 'HPG có phù hợp trung hạn?', a: 'Theo dõi khi dòng tiền ngành thép cải thiện và biên lợi nhuận ổn định.' },
          { q: 'Rủi ro chính với HPG?', a: 'Giá quặng biến động và tốc độ giải ngân đầu tư công chậm hơn kỳ vọng.' }
        ],
        claims: [
          { id: 'c1', text: 'HPG là người hưởng lợi trực tiếp từ làn sóng đầu tư công 2026' },
          { id: 'c2', text: 'Biên lợi nhuận thép xây dựng đang cải thiện so với đáy chu kỳ' }
        ],
        evidence: [
          { text: 'Nhu cầu thép xây dựng nội địa tăng khi các dự án hạ tầng được thúc đẩy', claim_id: 'c1' },
          { text: 'Chi phí đầu vào ổn định hỗ trợ margin trong mục Điểm nhấn cơ bản', claim_id: 'c2' }
        ],
        sources: [
          { title: 'Báo cáo ngành thép — iFlux Research', url: 'https://iflux.vn', publisher: 'iFlux' }
        ],
        related_topics: ['Cổ phiếu HPG', 'Đầu tư công', 'Ngành thép Việt Nam', 'Xuất khẩu thép']
      },
      post_seed_vhm: {
        summary: 'VHM được hưởng lợi khi pháp lý BĐS TP.HCM được tháo gỡ; chuỗi căn hộ Vinhomes là catalyst chính.',
        key_takeaways: [
          'Nghị quyết tháo gờ pháp lý là catalyst ngắn hạn cho nhóm BĐS',
          'VHM dẫn dắt thanh khoản ngành bất động sản',
          'Theo dõi tốc độ bàn giao và dòng tiền bán hàng'
        ],
        faq: [
          { q: 'VHM có phản ứng bền với Nghị quyết 18?', a: 'Cần xác nhận qua số liệu bán hàng và giải ngân dự án 2–3 quý tới.' },
          { q: 'Mã nào cùng nhóm với VHM?', a: 'VIC và các developer TP.HCM trong cùng chủ đề căn hộ.' }
        ],
        claims: [
          { id: 'c1', text: 'Tháo gỡ pháp lý BĐS TP.HCM hỗ trợ khẩu vọng giá VHM' },
          { id: 'c2', text: 'Thanh khoản căn hộ cao cấp phục hồi khi tín dụng nới lỏng' }
        ],
        evidence: [
          { text: 'VHM hưởng lợi trực tiếp từ pipeline căn hộ tại TP.HCM', claim_id: 'c1' },
          { text: 'Nhóm BĐS tăng mạnh trong phiên sau tin Nghị quyết', claim_id: 'c2' }
        ],
        sources: [
          { title: 'Nghị quyết 18 — Tóm lược iFlux', url: 'https://iflux.vn', publisher: 'iFlux' }
        ],
        related_topics: ['Cổ phiếu VHM', 'BĐS TP.HCM', 'Vinhomes', 'Nghị quyết 18', 'Cổ phiếu VIC']
      },
      post_seed_fpt: {
        summary: 'FPT duy trì tăng trưởng dịch vụ CNTT và hưởng lợi từ làn sóng triển khai AI tại doanh nghiệp Việt.',
        key_takeaways: [
          'AI nội bộ doanh nghiệp là driver doanh thu dịch vụ',
          'Hợp đồng cloud và outsourcing ổn định',
          'Theo dõi biến động tỷ giá và chi phí nhân sự AI'
        ],
        faq: [
          { q: 'FPT có phải cổ phiếu AI Việt Nam?', a: 'FPT là một trong nhóm dẫn dắt nhờ quy mô triển khai và hợp đồng doanh nghiệp.' }
        ],
        claims: [{ id: 'c1', text: 'Nhu cầu triển khai AI nội bộ tại doanh nghiệp lớn đang tăng nhanh' }],
        evidence: [{ text: 'FPT đẩy mạnh hợp đồng AI và cloud trong nước', claim_id: 'c1' }],
        sources: [{ title: 'iFlux — AI Việt Nam', url: 'https://iflux.vn', publisher: 'iFlux' }],
        related_topics: ['Cổ phiếu FPT', 'AI Việt Nam', 'Chuyển đổi số']
      }
    };
    return map[id] || null;
  }

  global.IfluxCommunityGeoAi = {
    SECTIONS: SECTIONS,
    emptyGeoAi: emptyGeoAi,
    normalizeGeoAi: normalizeGeoAi,
    generateDraft: generateDraft,
    renderArticleHtml: renderArticleHtml,
    collectFromForm: collectFromForm,
    fillForm: fillForm,
    writeFormSectionHtml: writeFormSectionHtml,
    bindWriteForm: bindWriteForm,
    buildJsonLdBlocks: buildJsonLdBlocks,
    seedGeoAiById: seedGeoAiById,
    addFaqRow: addFaqRow
  };
})(window);
