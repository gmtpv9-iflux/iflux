/* Cộng đồng — bài viết, tương tác, SEO/GEO (sandbox localStorage) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_community_v2';
  var LEGACY_STORAGE_KEYS = ['iflux_community_v1'];
  var WRITE_TIERS = { premium: 1, elite: 1, ctv: 1, partner: 1, admin: 1 };
  var EXPERT_WRITE_TIERS = { elite: 1, ctv: 1, partner: 1, admin: 1 };
  var CONTENT_TYPE_NEWS = 'news';
  var CONTENT_TYPE_EXPERT = 'expert';
  var ADMIN_AUTHOR = {
    id: 'admin_iflux',
    display_name: 'iFlux Editorial',
    tier: 'admin',
    tier_label: 'Admin'
  };

  function uid(prefix) {
    return (prefix || 'post') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  var FALLBACK_TICKERS = ['HPG', 'VCB', 'FPT', 'MWG', 'VHM', 'VIC', 'VND', 'STB', 'HCM', 'SSI'];

  function getKnownTickers() {
    var snap = global.IfluxMockMarket && global.IfluxMockMarket.getSnapshot();
    var stocks = snap && snap.entities && snap.entities.stocks ? snap.entities.stocks : {};
    var keys = Object.keys(stocks);
    return keys.length ? keys : FALLBACK_TICKERS.slice();
  }

  function extractTickersFromText(text) {
    if (!text) return [];
    var known = {};
    getKnownTickers().forEach(function (t) { known[String(t).toUpperCase()] = true; });
    var found = {};
    var plain = String(text).replace(/<[^>]+>/g, ' ');
    var re = /\b([A-Z]{2,5})\b/g;
    var m;
    while ((m = re.exec(plain))) {
      if (known[m[1]]) found[m[1]] = true;
    }
    return Object.keys(found);
  }

  function extractTickersFromPost(title, excerpt, bodyHtml) {
    var all = extractTickersFromText(title)
      .concat(extractTickersFromText(excerpt))
      .concat(extractTickersFromText(bodyHtml));
    var seen = {};
    return all.filter(function (t) {
      if (seen[t]) return false;
      seen[t] = true;
      return true;
    });
  }

  function stripTickerLinks(html) {
    return String(html || '').replace(
      /<a\s+[^>]*class="[^"]*ifx-ticker-link[^"]*"[^>]*>([A-Z]{2,5})<\/a>/gi,
      '$1'
    );
  }

  function linkifyTickersInHtml(html, tickers) {
    if (!html) return html;
    html = stripTickerLinks(html);
    var known = {};
    getKnownTickers().forEach(function (t) { known[String(t).toUpperCase()] = true; });
    var toLink = {};
    (tickers || []).forEach(function (t) { toLink[String(t).toUpperCase()] = true; });
    extractTickersFromText(html).forEach(function (t) { toLink[t] = true; });

    return html.replace(/>([^<]+)</g, function (match, text) {
      var linked = text.replace(/\b([A-Z]{2,5})\b/g, function (sym) {
        if (!known[sym]) return sym;
        if (!toLink[sym]) return sym;
        var symHref = global.IfluxSeoUrl
          ? IfluxSeoUrl.stockHref(sym)
          : '/co-phieu/' + encodeURIComponent(sym);
        return '<a class="ifx-ticker-link" href="' + symHref + '">' + sym + '</a>';
      });
      return '>' + linked + '<';
    });
  }

  function chuDeTagsOf(postOrTags) {
    if (Array.isArray(postOrTags)) return normalizePrimaryStory(postOrTags);
    if (!postOrTags) return [];
    return normalizePrimaryStory(postOrTags.chu_de_tags || postOrTags.story_tags || []);
  }

  function normalizePrimaryStory(storyTags) {
    var stories = (storyTags || []).filter(function (t) {
      return t.source === 'chu-de' || t.source === 'story' || !t.source;
    });
    if (!stories.length) return [];
    var tag = Object.assign({}, stories[0], { source: 'chu-de' });
    return [tag];
  }

  function normalizePostRecord(post) {
    if (!post.status) post.status = 'published';
    if (!post.content_type) {
      post.content_type = String(post.id || '').indexOf('post_expert_') === 0
        ? CONTENT_TYPE_EXPERT
        : CONTENT_TYPE_NEWS;
    }
    if (post.content_type === CONTENT_TYPE_NEWS && String(post.id || '').indexOf('post_seed_') === 0) {
      post.author = ADMIN_AUTHOR;
    }
    if (!post.author) post.author = { display_name: 'Thành viên', tier: 'premium', tier_label: 'Premium' };
    if (!post.stats) {
      post.stats = {
        likes: 0,
        comments: (post.comments || []).length,
        shares: 0,
        views: 0,
        favorites: 0
      };
    }
    if (!post.slug && post.title) post.slug = slugify(post.title);
    if (!post.title) post.title = 'Bài viết cộng đồng';
    post.chu_de_tags = normalizePrimaryStory(post.chu_de_tags || post.story_tags);
    post.story_tags = post.chu_de_tags;
    post.tickers = extractTickersFromPost(post.title, post.excerpt, post.body_html);
    post.body_html = linkifyTickersInHtml(post.body_html, post.tickers);
    if (global.IfluxCommunityGeoAi) {
      if (!post.geo_ai || !post.geo_ai.summary) {
        var seed = IfluxCommunityGeoAi.seedGeoAiById(post.id);
        if (seed) post.geo_ai = seed;
      }
      post.geo_ai = IfluxCommunityGeoAi.normalizeGeoAi(post);
      post.schema = post.schema || { type: 'NewsArticle', faq: [] };
      post.schema.faq = post.geo_ai.faq.slice();
    }
    return post;
  }

  function readAll() {
    try {
      LEGACY_STORAGE_KEYS.forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      });
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.posts)) {
          data.posts.forEach(function (p) {
            if (p && p.seo && p.seo.og_image && String(p.seo.og_image).indexOf('/og/community/') >= 0) {
              p.seo.og_image = '';
            }
          });
        }
        return data;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function writeAll(data, opts) {
    opts = opts || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (opts.silent) return;
    document.dispatchEvent(new CustomEvent('iflux-community-change'));
  }

  function seedPosts() {
    var ts = nowIso();
    return [
      {
        id: 'post_seed_hpg',
        slug: 'hpg-tri-vong-thep-dau-tu-cong-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'HPG và chu kỳ thép: Cơ hội khi đầu tư công tăng tốc',
        excerpt: 'Phân tích triển vọng HPG trong bối cảnh đầu tư công và xuất khẩu thép phục hồi — góc nhìn cho nhà đầu tư dài hạn tại Việt Nam.',
        body_html:
          '<p>HPG đang hưởng lợi từ hai làn sóng: đầu tư công hạ tầng và nhu cầu thép xây dựng nội địa.</p>' +
          '<h2>Điểm nhấn cơ bản</h2><p>Biên lợi nhuận thép xây dựng cải thiện khi chi phí đầu vào ổn định.</p>' +
          '<h2>Khuyến nghị</h2><p>Theo dõi vùng tích lũy, ưu tiên vị thế trung hạn khi dòng tiền ngành quay lại.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'dau-tu-cong', name: 'Đầu tư công' }],
        tickers: ['HPG'],
        seo: {
          meta_title: 'HPG 2026: Triển vọng thép & đầu tư công | iFlux',
          meta_description: 'Phân tích HPG trong chu kỳ đầu tư công 2026. Khuyến nghị đầu tư, thẻ chủ đề thép và xuất khẩu — nội dung Premium iFlux.',
          focus_keyword: 'cổ phiếu HPG',
          secondary_keywords: ['đầu tư công', 'ngành thép', 'HPG 2026'],
          canonical_url: '',
          og_title: 'HPG và chu kỳ thép 2026',
          og_description: 'Góc nhìn Premium về HPG, đầu tư công và xuất khẩu thép.',
          og_image: '',
          og_image_alt: 'Biểu đồ ngành thép Việt Nam',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Việt Nam',
          geo_keywords: ['đầu tư chứng khoán Việt Nam', 'cổ phiếu thép VN'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'AnalysisNewsArticle', faq: [{ q: 'HPG có phù hợp trung hạn?', a: 'Theo dõi khi dòng tiền ngành thép cải thiện và biên lợi nhuận ổn định.' }] },
        author: { id: 'usr_ctv_01', display_name: 'Trần Anh Khoa', tier: 'ctv', tier_label: 'CTV' },
        stats: { likes: 24, comments: 3, shares: 8, views: 412, favorites: 11 },
        liked_by: [],
        favorited_by: [],
        comments: [
          { id: 'c1', user_id: 'u2', user_name: 'Lan Phương', body: 'Hay, đợi HPG về vùng 27 xem thêm.', created_at: ts, likes: 12, shares: 3, replies: 4 },
          { id: 'c2', user_id: 'u3', user_name: 'Đức Minh', body: 'Theo dõi thêm HSG cùng nhóm.', created_at: ts, likes: 5, shares: 1, replies: 1 }
        ]
      },
      {
        id: 'post_seed_fpt',
        slug: 'fpt-ai-viet-nam-tang-truong-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'FPT trong làn sóng AI Việt Nam: Chủ đề tăng trưởng 2026',
        excerpt: 'Đánh giá vị thế FPT khi doanh nghiệp Việt tăng chi cho chuyển đổi số và AI — liên kết chủ đề AI Việt Nam.',
        body_html:
          '<p>FPT duy trì tốc độ tăng trưởng dịch vụ CNTT và đẩy mạnh hợp đồng AI.</p>' +
          '<h2>Catalyst</h2><p>Nhu cầu triển khai AI nội bộ tại doanh nghiệp lớn.</p>' +
          '<h2>Rủi ro</h2><p>Biến động tỷ giá và cạnh tranh nhân sự AI.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'ai-vn', name: 'AI Việt Nam' }],
        tickers: ['FPT'],
        seo: {
          meta_title: 'FPT & AI Việt Nam 2026 — Khuyến nghị Premium | iFlux',
          meta_description: 'Phân tích FPT trong chủ đề AI Việt Nam. SEO/GEO chuẩn, gắn mã FPT, bình luận cộng đồng Premium iFlux.',
          focus_keyword: 'cổ phiếu FPT',
          secondary_keywords: ['AI Việt Nam', 'FPT 2026'],
          canonical_url: '',
          og_title: 'FPT & AI Việt Nam 2026',
          og_description: 'Khuyến nghị đầu tư FPT — làn sóng AI doanh nghiệp.',
          og_image: '',
          og_image_alt: 'FPT AI Việt Nam',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hà Nội',
          geo_keywords: ['cổ phiếu công nghệ Việt Nam'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'NewsArticle', faq: [] },
        author: { id: 'usr_demo_001', display_name: 'Nguyễn Văn Minh', tier: 'premium', tier_label: 'Premium' },
        stats: { likes: 18, comments: 1, shares: 5, views: 286, favorites: 7 },
        liked_by: [],
        favorited_by: [],
        comments: [
          { id: 'c3', user_id: 'u4', user_name: 'Hùng Vũ', body: 'Theo dõi margin dịch vụ cloud quý tới.', created_at: ts, likes: 8, shares: 6, replies: 2 }
        ]
      },
      {
        id: 'post_seed_vcb',
        slug: 'vcb-tang-von-ngan-hang-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'VCB tăng vốn: Ai hưởng lợi nhất trong hệ sinh thái Vietcombank?',
        excerpt: 'Phân tích tăng vốn VCB và tác động NIM.',
        body_html: '<p>VCB triển khai kế hoạch tăng vốn lớn.</p><h2>Tác động</h2><p>ROE và room tín dụng.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'tang-von-nh', name: 'Tăng vốn NH' }],
        tickers: ['VCB', 'STB'],
        seo: { meta_title: 'VCB tăng vốn 2026 | iFlux', meta_description: 'Phân tích VCB', og_image: '', robots: 'index,follow' },
        geo: { language: 'vi-VN', country: 'VN', region: 'Việt Nam', target_locale: 'vi_VN' },
        schema: { type: 'NewsArticle', faq: [] },
        author: { id: 'u5', display_name: 'Lê Minh', tier: 'premium', tier_label: 'Premium' },
        stats: { likes: 89, comments: 24, shares: 15, views: 520, favorites: 20 },
        liked_by: [], favorited_by: [], comments: []
      },
      {
        id: 'post_seed_vhm',
        slug: 'vhm-nghi-quyet-bds-tphcm',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'Nghị quyết tháo gỡ pháp lý BĐS: VHM và chuỗi căn hộ TP.HCM',
        excerpt: 'BĐS sau Nghị quyết 18 — vùng mua VHM.',
        body_html: '<p>VHM hưởng lợi từ pháp lý được tháo gỡ.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'can-ho-hcm', name: 'Căn hộ TP.HCM' }],
        tickers: ['VHM', 'VIC'],
        seo: {
          meta_title: 'VHM: Nghị quyết tháo gỡ BĐS TP.HCM — Phân tích 2026 | iFlux',
          meta_description: 'Phân tích VHM sau Nghị quyết tháo gỡ pháp lý BĐS TP.HCM. Giá, dòng tiền, chủ đề căn hộ và khuyến nghị từ cộng đồng Premium iFlux.',
          focus_keyword: 'cổ phiếu VHM',
          secondary_keywords: ['Vinhomes', 'BĐS TP.HCM', 'Nghị quyết 18', 'VHM 2026'],
          canonical_url: 'https://iflux.vn/cong-dong/bai-viet/post_seed_vhm',
          og_title: 'VHM và chuỗi căn hộ TP.HCM sau Nghị quyết',
          og_description: 'Góc nhìn cộng đồng về VHM trong bối cảnh tháo gỡ pháp lý BĐS.',
          og_image: '',
          og_image_alt: 'Vinhomes TP.HCM',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'TP.HCM',
          geo_keywords: ['đầu tư bất động sản TP.HCM', 'cổ phiếu VHM Việt Nam'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'Article', faq: [] },
        author: { id: 'u6', display_name: 'Hoàng Nam', tier: 'ctv', tier_label: 'CTV' },
        stats: { likes: 178, comments: 52, shares: 33, views: 890, favorites: 45 },
        liked_by: [], favorited_by: [], comments: []
      },
      {
        id: 'post_seed_ssi',
        slug: 'ssi-dong-tien-chung-khoan-tuan',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'SSI và dòng tiền nhóm chứng khoán: Trade ngắn hạn tuần này',
        excerpt: 'Thanh khoản SSI, VND tăng — tín hiệu ngắn hạn.',
        body_html: '<p>Nhóm CK hưởng lợi khi VN-Index vượt vùng tích lũy.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'nghi-quyet', name: 'Nghị quyết NN' }],
        tickers: ['SSI', 'VND', 'HCM'],
        seo: { meta_title: 'SSI CK tuần | iFlux', meta_description: 'SSI phân tích', og_image: '', robots: 'index,follow' },
        geo: { language: 'vi-VN', country: 'VN', target_locale: 'vi_VN' },
        schema: { type: 'NewsArticle', faq: [] },
        author: { id: 'u7', display_name: 'Anh Nguyên', tier: 'premium', tier_label: 'Premium' },
        stats: { likes: 96, comments: 31, shares: 18, views: 410, favorites: 22 },
        liked_by: [], favorited_by: [], comments: []
      },
      {
        id: 'post_seed_mwg',
        slug: 'mwg-ban-le-phuc-hoi-fdi',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'MWG trong chủ đề FDI 2026: Bán lẻ phục hồi đến đâu?',
        excerpt: 'MWG và FDI — kỳ vọng doanh thu.',
        body_html: '<p>FDI tăng hỗ trợ sức mua bán lẻ.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'fdi', name: 'FDI 2026' }],
        tickers: ['MWG'],
        seo: { meta_title: 'MWG FDI | iFlux', meta_description: 'MWG', og_image: '', robots: 'index,follow' },
        geo: { language: 'vi-VN', country: 'VN', target_locale: 'vi_VN' },
        schema: { type: 'Article', faq: [] },
        author: { id: 'u8', display_name: 'Violet Long', tier: 'premium', tier_label: 'Premium' },
        stats: { likes: 134, comments: 45, shares: 29, views: 670, favorites: 38 },
        liked_by: [], favorited_by: [], comments: []
      },
      {
        id: 'post_seed_stb',
        slug: 'stb-lai-suat-giam-ngan-hang',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'Lãi suất giảm: STB và nhóm ngân hàng mid-cap có gì khác?',
        excerpt: 'Chu kỳ lãi suất giảm — STB vs VCB.',
        body_html: '<p>Margin cho vay phục hồi khi lãi suất hạ nhiệt.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'lai-suat', name: 'Lãi suất giảm' }],
        tickers: ['STB', 'VCB'],
        seo: { meta_title: 'STB lãi suất | iFlux', meta_description: 'STB', og_image: '', robots: 'index,follow' },
        geo: { language: 'vi-VN', country: 'VN', target_locale: 'vi_VN' },
        schema: { type: 'NewsArticle', faq: [] },
        author: { id: 'u9', display_name: 'Trần Nguyên', tier: 'ctv', tier_label: 'CTV' },
        stats: { likes: 142, comments: 38, shares: 21, views: 780, favorites: 40 },
        liked_by: [], favorited_by: [], comments: []
      },
      {
        id: 'post_seed_vic',
        slug: 'vic-ev-xe-dien-vinfast',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'VinFast và EV xe điện: VIC — cơ hội hay bẫy giá?',
        excerpt: 'EV story và VIC ecosystem.',
        body_html: '<p>EV là catalyst dài hạn cho họ VIN.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'ev', name: 'EV xe điện' }],
        tickers: ['VIC', 'VHM'],
        seo: { meta_title: 'VIC EV | iFlux', meta_description: 'VIC', og_image: '', robots: 'index,follow' },
        geo: { language: 'vi-VN', country: 'VN', target_locale: 'vi_VN' },
        schema: { type: 'AnalysisNewsArticle', faq: [] },
        author: { id: 'u10', display_name: 'Phạm Khoa', tier: 'premium', tier_label: 'Premium' },
        stats: { likes: 214, comments: 67, shares: 44, views: 1200, favorites: 88 },
        liked_by: [], favorited_by: [], comments: []
      }
    ];
  }

  function seedExpertPosts() {
    var ts = nowIso();
    var eliteA = {
      id: 'usr_elite_01',
      display_name: 'Lê Minh Quân',
      tier: 'elite',
      tier_label: 'Elite'
    };
    var eliteB = {
      id: 'usr_elite_02',
      display_name: 'Nguyễn Thảo Vy',
      tier: 'elite',
      tier_label: 'Elite'
    };

    return [
      {
        id: 'post_expert_hpg',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'hpg-phan-tich-chuyen-sau-thep-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'HPG — Góc nhìn chuyên gia: Chu kỳ thép và biên lợi nhuận Q2/2026',
        excerpt: 'Phân tích chuyên sâu HPG: cung cầu thép xây dựng, xuất khẩu và điểm vào vùng giá trị — bài viết Elite chuẩn SEO/GEO.',
        body_html:
          '<p>HPG đang ở giai đoạn tích lũy khi kỳ vọng đầu tư công được định giá một phần vào giá cổ phiếu.</p>' +
          '<h2>Khung phân tích</h2><p>Biên gộp thép xây dựng phục hồi khi giá quặng ổn định; theo dõi tỷ lệ nợ/ròng vốn chủ sở hữu.</p>' +
          '<h2>Kịch bản</h2><p>Cơ sở: sideway 2–3 quý. Tích cực: breakout khi volume ngành xác nhận.</p>' +
          '<h2>Rủi ro</h2><p>Thép Trung Quốc giá rẻ và biến động tỷ giá USD/VND.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'thep-xk', name: 'Xuất khẩu thép' }],
        tickers: ['HPG', 'HSG'],
        seo: {
          meta_title: 'HPG chuyên gia 2026: Chu kỳ thép & biên lợi nhuận | iFlux Elite',
          meta_description: 'Phân tích chuyên gia Elite về HPG — chu kỳ thép, xuất khẩu, đầu tư công. SEO/GEO đầy đủ, FAQ schema.',
          focus_keyword: 'phân tích HPG chuyên gia',
          secondary_keywords: ['cổ phiếu HPG 2026', 'ngành thép Việt Nam', 'HPG khuyến nghị'],
          canonical_url: '',
          og_title: 'HPG — Góc nhìn chuyên gia Elite',
          og_description: 'Chu kỳ thép và biên lợi nhuận HPG 2026.',
          og_image: '',
          og_image_alt: 'Phân tích HPG Elite',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hải Phòng',
          geo_keywords: ['đầu tư cổ phiếu thép Việt Nam', 'HPG phân tích chuyên gia'],
          target_locale: 'vi_VN'
        },
        schema: {
          type: 'AnalysisNewsArticle',
          faq: [
            { q: 'HPG có phù hợp tích lũy trung hạn?', a: 'Theo dõi khi biên gộp cải thiện và dòng tiền ngành thép quay lại.' },
            { q: 'Rủi ro chính với HPG?', a: 'Cạnh tranh thép nhập khẩu và chu kỳ BĐS chậm hơn kỳ vọng.' }
          ]
        },
        author: eliteA,
        stats: { likes: 56, comments: 14, shares: 22, views: 1840, favorites: 31 },
        liked_by: [],
        favorited_by: [],
        comments: [
          { id: 'ex_c1', user_id: 'u2', user_name: 'Lan Phương', body: 'Bài chuyên sâu, cảm ơn anh Quân.', created_at: ts, likes: 8, shares: 1, replies: 0 }
        ]
      },
      {
        id: 'post_expert_banking',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'nganh-ngan-hang-nim-roe-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'Ngành Ngân hàng: NIM, ROE và chu kỳ tăng vốn — Góc nhìn Elite',
        excerpt: 'Đánh giá chu kỳ NIM ngành ngân hàng Việt Nam 2026 — VCB, TCB, MBB và room tăng trưởng tín dụng.',
        body_html:
          '<p>Ngành ngân hàng chuyển từ kỳ vọng giảm lãi suất sang giai đoạn chọn lọc theo chất lượng tăng vốn.</p>' +
          '<h2>NIM và chi phí vốn</h2><p>Biên NIM có thể chạm đáy rồi bật nhẹ khi huy động ổn định.</p>' +
          '<h2>Phân hóa cổ phiếu</h2><p>Nhóm vốn chủ lớn (VCB, TCB) vs mid-cap (MBB, STB) — khác biệt về kế hoạch tăng vốn.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'tang-von-nh', name: 'Tăng vốn NH' }],
        tickers: ['VCB', 'TCB', 'MBB', 'STB'],
        seo: {
          meta_title: 'Ngân hàng VN 2026: NIM & ROE — Phân tích Elite | iFlux',
          meta_description: 'Bài chuyên gia Elite về ngành ngân hàng: NIM, ROE, tăng vốn VCB TCB MBB. Chuẩn SEO/GEO.',
          focus_keyword: 'phân tích ngành ngân hàng 2026',
          secondary_keywords: ['NIM ngân hàng', 'VCB TCB', 'ROE ngân hàng Việt Nam'],
          og_title: 'Ngành Ngân hàng — Góc nhìn Elite',
          og_description: 'NIM, ROE và chu kỳ tăng vốn 2026.',
          og_image: '',
          og_image_alt: 'Phân tích ngành ngân hàng',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Việt Nam',
          geo_keywords: ['cổ phiếu ngân hàng Việt Nam', 'đầu tư VCB TCB'],
          target_locale: 'vi_VN'
        },
        schema: {
          type: 'AnalysisNewsArticle',
          faq: [
            { q: 'Ngành ngân hàng 2026 thuận lợi không?', a: 'Thuận nếu tín dụng tăng ổn định và NIM không bị bóp thêm.' }
          ]
        },
        author: eliteB,
        stats: { likes: 72, comments: 19, shares: 28, views: 2100, favorites: 44 },
        liked_by: [],
        favorited_by: [],
        comments: []
      },
      {
        id: 'post_expert_vin',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'ho-vin-ecosystem-vic-vhm-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'Họ VIN: Định giá hệ sinh thái VIC–VHM sau chu kỳ EV',
        excerpt: 'Chuyên gia Elite phân tích họ VIN — VIC, VHM, VRE: catalyst EV, BĐS và điểm hội tụ dòng tiền.',
        body_html:
          '<p>Họ VIN cần được nhìn như một portfolio có tương quan dòng tiền, không chỉ từng mã riêng lẻ.</p>' +
          '<h2>VIC & VinFast</h2><p>EV là option dài hạn — discount NAV phản ánh kỳ vọng burn rate.</p>' +
          '<h2>VHM</h2><p>Tháo gỡ pháp lý BĐS hỗ trợ bán hàng căn hộ — sensitivity theo lãi suất.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'ev', name: 'EV xe điện' }],
        tickers: ['VIC', 'VHM', 'VRE'],
        seo: {
          meta_title: 'Họ VIN VIC VHM 2026 — Phân tích Elite | iFlux',
          meta_description: 'Phân tích chuyên gia Elite họ VIN: VIC, VHM, EV và BĐS. SEO/GEO schema FAQ.',
          focus_keyword: 'họ VIN cổ phiếu',
          secondary_keywords: ['VIC VHM', 'VinFast đầu tư', 'hệ sinh thái VIN'],
          og_title: 'Họ VIN — Góc nhìn Elite',
          og_description: 'Định giá ecosystem VIC–VHM 2026.',
          og_image: '',
          og_image_alt: 'Họ VIN phân tích',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hà Nội',
          geo_keywords: ['cổ phiếu Vingroup', 'đầu tư VIC VHM'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'AnalysisNewsArticle', faq: [] },
        author: eliteA,
        stats: { likes: 91, comments: 27, shares: 35, views: 2650, favorites: 58 },
        liked_by: [],
        favorited_by: [],
        comments: []
      },
      {
        id: 'post_expert_ai',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'fpt-ai-viet-nam-chuyen-gia-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'AI Việt Nam & FPT: Lộ trình doanh thu từ hợp đồng enterprise',
        excerpt: 'Elite đánh giá FPT trong chủ đề AI Việt Nam — margin dịch vụ, hợp đồng B2B và peer CMG.',
        body_html:
          '<p>FPT là proxy thanh khoản cao nhất cho chủ đề AI enterprise tại Việt Nam trong danh mục mid-large cap.</p>' +
          '<h2>Doanh thu AI</h2><p>Tăng trưởng % AI trong tổng doanh thu là KPI theo dõi hàng quý.</p>' +
          '<h2>Định giá</h2><p>So sánh P/E với nhóm IT regional — premium hợp lý nếu margin ổn định.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'ai-vn', name: 'AI Việt Nam' }],
        tickers: ['FPT', 'CMG'],
        seo: {
          meta_title: 'FPT AI Việt Nam 2026 — Bài chuyên gia Elite | iFlux',
          meta_description: 'Phân tích Elite FPT & AI Việt Nam: doanh thu enterprise, margin, SEO/GEO.',
          focus_keyword: 'FPT AI Việt Nam',
          secondary_keywords: ['cổ phiếu FPT', 'AI doanh nghiệp Việt Nam'],
          og_title: 'FPT & AI VN — Elite',
          og_description: 'Lộ trình doanh thu AI enterprise.',
          og_image: '',
          og_image_alt: 'FPT AI phân tích',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hà Nội',
          geo_keywords: ['đầu tư AI Việt Nam', 'cổ phiếu công nghệ FPT'],
          target_locale: 'vi_VN'
        },
        schema: {
          type: 'AnalysisNewsArticle',
          faq: [
            { q: 'FPT có phải cổ phiếu lõi cho chủ đề AI VN?', a: 'Là ứng viên thanh khoản tốt; cần theo dõi margin và tỷ trọng AI trong doanh thu.' }
          ]
        },
        author: eliteB,
        stats: { likes: 64, comments: 16, shares: 24, views: 1920, favorites: 37 },
        liked_by: [],
        favorited_by: [],
        comments: []
      },
      {
        id: 'post_expert_vhm',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'vhm-bds-chuyen-gia-can-ho-tphcm',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'VHM & BĐS TP.HCM: Mô hình dòng tiền sau tháo gỡ pháp lý',
        excerpt: 'Chuyên gia Elite phân tích VHM trong chủ đề căn hộ TP.HCM — presale, NAV và sensitivity lãi suất.',
        body_html:
          '<p>VHM là cổ phiếu nhạy với tốc độ hấp thụ căn hộ cao cấp tại TP.HCM sau giai đoạn pháp lý được cải thiện.</p>' +
          '<h2>Presale & dòng tiền</h2><p>Theo dõi tỷ lệ bán hàng theo dự án và tiến độ giải ngân.</p>' +
          '<h2>So sánh ngành</h2><p>Phân hóa với NVL, KDH về quỹ đất và leverage.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'can-ho-hcm', name: 'Căn hộ TP.HCM' }],
        tickers: ['VHM', 'NVL', 'KDH'],
        seo: {
          meta_title: 'VHM BĐS TP.HCM — Phân tích Elite 2026 | iFlux',
          meta_description: 'Bài chuyên gia Elite về VHM, căn hộ TP.HCM, dòng tiền BĐS. SEO/GEO đầy đủ.',
          focus_keyword: 'phân tích VHM BĐS',
          secondary_keywords: ['Vinhomes 2026', 'cổ phiếu bất động sản TP.HCM'],
          og_title: 'VHM BĐS — Góc nhìn Elite',
          og_description: 'Dòng tiền VHM sau tháo gỡ pháp lý.',
          og_image: '',
          og_image_alt: 'VHM phân tích BĐS',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'TP.HCM',
          geo_keywords: ['đầu tư bất động sản TP.HCM', 'cổ phiếu VHM'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'AnalysisNewsArticle', faq: [] },
        author: eliteA,
        stats: { likes: 48, comments: 11, shares: 17, views: 1560, favorites: 29 },
        liked_by: [],
        favorited_by: [],
        comments: []
      }
    ];
  }

  function seedExpertPosts() {
    var ts = nowIso();
    var eliteA = {
      id: 'usr_elite_01',
      display_name: 'Lê Minh Quân',
      tier: 'elite',
      tier_label: 'Elite'
    };
    var eliteB = {
      id: 'usr_elite_02',
      display_name: 'Nguyễn Thảo Vy',
      tier: 'elite',
      tier_label: 'Elite'
    };

    return [
      {
        id: 'post_expert_hpg',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'hpg-phan-tich-chuyen-sau-thep-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'HPG — Góc nhìn chuyên gia: Chu kỳ thép và biên lợi nhuận Q2/2026',
        excerpt: 'Phân tích chuyên sâu HPG: cung cầu thép xây dựng, xuất khẩu và điểm vào vùng giá trị — bài viết Elite chuẩn SEO/GEO.',
        body_html:
          '<p>HPG đang ở giai đoạn tích lũy khi kỳ vọng đầu tư công được định giá một phần vào giá cổ phiếu.</p>' +
          '<h2>Khung phân tích</h2><p>Biên gộp thép xây dựng phục hội khi giá quặng ổn định; theo dõi tỷ lệ nợ/ròng vốn chủ sở hữu.</p>' +
          '<h2>Kịch bản</h2><p>Cơ sở: sideway 2–3 quý. Tích cực: breakout khi volume ngành xác nhận.</p>' +
          '<h2>Rủi ro</h2><p>Thép Trung Quốc giá rẻ và biến động tỷ giá USD/VND.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'thep-xk', name: 'Xuất khẩu thép' }],
        tickers: ['HPG', 'HSG'],
        seo: {
          meta_title: 'HPG chuyên gia 2026: Chu kỳ thép & biên lợi nhuận | iFlux Elite',
          meta_description: 'Phân tích chuyên gia Elite về HPG — chu kỳ thép, xuất khẩu, đầu tư công. SEO/GEO đầy đủ, FAQ schema.',
          focus_keyword: 'phân tích HPG chuyên gia',
          secondary_keywords: ['cổ phiếu HPG 2026', 'ngành thép Việt Nam', 'HPG khuyến nghị'],
          canonical_url: '',
          og_title: 'HPG — Góc nhìn chuyên gia Elite',
          og_description: 'Chu kỳ thép và biên lợi nhuận HPG 2026.',
          og_image: '',
          og_image_alt: 'Phân tích HPG Elite',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hải Phòng',
          geo_keywords: ['đầu tư cổ phiếu thép Việt Nam', 'HPG phân tích chuyên gia'],
          target_locale: 'vi_VN'
        },
        schema: {
          type: 'AnalysisNewsArticle',
          faq: [
            { q: 'HPG có phù hợp tích lũy trung hạn?', a: 'Theo dõi khi biên gộp cải thiện và dòng tiền ngành thép quay lại.' },
            { q: 'Rủi ro chính với HPG?', a: 'Cạnh tranh thép nhập khẩu và chu kỳ BĐS chậm hơn kỳ vọng.' }
          ]
        },
        author: eliteA,
        stats: { likes: 56, comments: 14, shares: 22, views: 1840, favorites: 31 },
        liked_by: [],
        favorited_by: [],
        comments: [
          { id: 'ex_c1', user_id: 'u2', user_name: 'Lan Phương', body: 'Bài chuyên sâu, cảm ơn anh Quân.', created_at: ts, likes: 8, shares: 1, replies: 0 }
        ]
      },
      {
        id: 'post_expert_banking',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'nganh-ngan-hang-nim-roe-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'Ngành Ngân hàng: NIM, ROE và chu kỳ tăng vốn — Góc nhìn Elite',
        excerpt: 'Đánh giá chu kỳ NIM ngành ngân hàng Việt Nam 2026 — VCB, TCB, MBB và room tăng trưởng tín dụng.',
        body_html:
          '<p>Ngành ngân hàng chuyển từ kỳ vọng giảm lãi suất sang giai đoạn chọn lọc theo chất lượng tăng vốn.</p>' +
          '<h2>NIM và chi phí vốn</h2><p>Biên NIM có thể chạm đáy rồi bật nhẹ khi huy động ổn định.</p>' +
          '<h2>Phân hóa cổ phiếu</h2><p>Nhóm vốn chủ lớn (VCB, TCB) vs mid-cap (MBB, STB) — khác biệt về kế hoạch tăng vốn.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'tang-von-nh', name: 'Tăng vốn NH' }],
        tickers: ['VCB', 'TCB', 'MBB', 'STB'],
        seo: {
          meta_title: 'Ngân hàng VN 2026: NIM & ROE — Phân tích Elite | iFlux',
          meta_description: 'Bài chuyên gia Elite về ngành ngân hàng: NIM, ROE, tăng vốn VCB TCB MBB. Chuẩn SEO/GEO.',
          focus_keyword: 'phân tích ngành ngân hàng 2026',
          secondary_keywords: ['NIM ngân hàng', 'VCB TCB', 'ROE ngân hàng Việt Nam'],
          og_title: 'Ngành Ngân hàng — Góc nhìn Elite',
          og_description: 'NIM, ROE và chu kỳ tăng vốn 2026.',
          og_image: '',
          og_image_alt: 'Phân tích ngành ngân hàng',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Việt Nam',
          geo_keywords: ['cổ phiếu ngân hàng Việt Nam', 'đầu tư VCB TCB'],
          target_locale: 'vi_VN'
        },
        schema: {
          type: 'AnalysisNewsArticle',
          faq: [
            { q: 'Ngành ngân hàng 2026 thuận lợi không?', a: 'Thuận nếu tín dụng tăng ổn định và NIM không bị bóp thêm.' }
          ]
        },
        author: eliteB,
        stats: { likes: 72, comments: 19, shares: 28, views: 2100, favorites: 44 },
        liked_by: [],
        favorited_by: [],
        comments: []
      },
      {
        id: 'post_expert_vin',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'ho-vin-ecosystem-vic-vhm-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'Họ VIN: Định giá hệ sinh thái VIC–VHM sau chu kỳ EV',
        excerpt: 'Chuyên gia Elite phân tích họ VIN — VIC, VHM, VRE: catalyst EV, BĐS và điểm hội tụ dòng tiền.',
        body_html:
          '<p>Họ VIN cần được nhìn như một portfolio có tương quan dòng tiền, không chỉ từng mã riêng lẻ.</p>' +
          '<h2>VIC & VinFast</h2><p>EV là option dài hạn — discount NAV phản ánh kỳ vọng burn rate.</p>' +
          '<h2>VHM</h2><p>Tháo gờ pháp lý BĐS hỗ trợ bán hàng căn hộ — sensitivity theo lãi suất.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'ev', name: 'EV xe điện' }],
        tickers: ['VIC', 'VHM', 'VRE'],
        seo: {
          meta_title: 'Họ VIN VIC VHM 2026 — Phân tích Elite | iFlux',
          meta_description: 'Phân tích chuyên gia Elite họ VIN: VIC, VHM, EV và BĐS. SEO/GEO schema FAQ.',
          focus_keyword: 'họ VIN cổ phiếu',
          secondary_keywords: ['VIC VHM', 'VinFast đầu tư', 'hệ sinh thái VIN'],
          og_title: 'Họ VIN — Góc nhìn Elite',
          og_description: 'Định giá ecosystem VIC–VHM 2026.',
          og_image: '',
          og_image_alt: 'Họ VIN phân tích',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hà Nội',
          geo_keywords: ['cổ phiếu Vingroup', 'đầu tư VIC VHM'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'AnalysisNewsArticle', faq: [] },
        author: eliteA,
        stats: { likes: 91, comments: 27, shares: 35, views: 2650, favorites: 58 },
        liked_by: [],
        favorited_by: [],
        comments: []
      },
      {
        id: 'post_expert_ai',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'fpt-ai-viet-nam-chuyen-gia-2026',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'AI Việt Nam & FPT: Lộ trình doanh thu từ hợp đồng enterprise',
        excerpt: 'Elite đánh giá FPT trong chủ đề AI Việt Nam — margin dịch vụ, hợp đồng B2B và peer CMG.',
        body_html:
          '<p>FPT là proxy thanh khoản cao nhất cho chủ đề AI enterprise tại Việt Nam trong danh mục mid-large cap.</p>' +
          '<h2>Doanh thu AI</h2><p>Tăng trưởng % AI trong tổng doanh thu là KPI theo dõi hàng quý.</p>' +
          '<h2>Định giá</h2><p>So sánh P/E với nhóm IT regional — premium hợp lý nếu margin ổn định.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'ai-vn', name: 'AI Việt Nam' }],
        tickers: ['FPT', 'CMG'],
        seo: {
          meta_title: 'FPT AI Việt Nam 2026 — Bài chuyên gia Elite | iFlux',
          meta_description: 'Phân tích Elite FPT & AI Việt Nam: doanh thu enterprise, margin, SEO/GEO.',
          focus_keyword: 'FPT AI Việt Nam',
          secondary_keywords: ['cổ phiếu FPT', 'AI doanh nghiệp Việt Nam'],
          og_title: 'FPT & AI VN — Elite',
          og_description: 'Lộ trình doanh thu AI enterprise.',
          og_image: '',
          og_image_alt: 'FPT AI phân tích',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'Hà Nội',
          geo_keywords: ['đầu tư AI Việt Nam', 'cổ phiếu công nghệ FPT'],
          target_locale: 'vi_VN'
        },
        schema: {
          type: 'AnalysisNewsArticle',
          faq: [
            { q: 'FPT có phải cổ phiếu lõi cho chủ đề AI VN?', a: 'Là ứng viên thanh khoản tốt; cần theo dõi margin và tỷ trọng AI trong doanh thu.' }
          ]
        },
        author: eliteB,
        stats: { likes: 64, comments: 16, shares: 24, views: 1920, favorites: 37 },
        liked_by: [],
        favorited_by: [],
        comments: []
      },
      {
        id: 'post_expert_vhm',
        content_type: CONTENT_TYPE_EXPERT,
        slug: 'vhm-bds-chuyen-gia-can-ho-tphcm',
        status: 'published',
        created_at: ts,
        updated_at: ts,
        published_at: ts,
        title: 'VHM & BĐS TP.HCM: Mô hình dòng tiền sau tháo gỡ pháp lý',
        excerpt: 'Chuyên gia Elite phân tích VHM trong chủ đề căn hộ TP.HCM — presale, NAV và sensitivity lãi suất.',
        body_html:
          '<p>VHM là cổ phiếu nhạy với tốc độ hấp thụ căn hộ cao cấp tại TP.HCM sau giai đoạn pháp lý được cải thiện.</p>' +
          '<h2>Presale & dòng tiền</h2><p>Theo dõi tỷ lệ bán hàng theo dự án và tiến độ giải ngân.</p>' +
          '<h2>So sánh ngành</h2><p>Phân hóa với NVL, KDH về quỹ đất và leverage.</p>',
        chu_de_tags: [{ source: 'chu-de', sourceId: 'can-ho-hcm', name: 'Căn hộ TP.HCM' }],
        tickers: ['VHM', 'NVL', 'KDH'],
        seo: {
          meta_title: 'VHM BĐS TP.HCM — Phân tích Elite 2026 | iFlux',
          meta_description: 'Bài chuyên gia Elite về VHM, căn hộ TP.HCM, dòng tiền BĐS. SEO/GEO đầy đủ.',
          focus_keyword: 'phân tích VHM BĐS',
          secondary_keywords: ['Vinhomes 2026', 'cổ phiếu bất động sản TP.HCM'],
          og_title: 'VHM BĐS — Góc nhìn Elite',
          og_description: 'Dòng tiền VHM sau tháo gỡ pháp lý.',
          og_image: '',
          og_image_alt: 'VHM phân tích BĐS',
          robots: 'index,follow'
        },
        geo: {
          language: 'vi-VN',
          country: 'VN',
          region: 'TP.HCM',
          geo_keywords: ['đầu tư bất động sản TP.HCM', 'cổ phiếu VHM'],
          target_locale: 'vi_VN'
        },
        schema: { type: 'AnalysisNewsArticle', faq: [] },
        author: eliteA,
        stats: { likes: 48, comments: 11, shares: 17, views: 1560, favorites: 29 },
        liked_by: [],
        favorited_by: [],
        comments: []
      }
    ];
  }

  function countPublished(posts) {
    return (posts || []).filter(function (p) {
      return !p.status || p.status === 'published';
    }).length;
  }

  function mergeSeedPosts(data) {
    var seeds = seedPosts().map(normalizePostRecord);
    var ids = {};
    data.posts.forEach(function (p) { if (p && p.id) ids[p.id] = true; });
    seeds.forEach(function (p) {
      if (!ids[p.id]) data.posts.push(p);
    });
  }

  function mergeExpertPosts(data) {
    var seeds = seedExpertPosts().map(normalizePostRecord);
    var ids = {};
    data.posts.forEach(function (p) { if (p && p.id) ids[p.id] = true; });
    seeds.forEach(function (p) {
      if (!ids[p.id]) data.posts.push(p);
    });
  }

  function repairStore(data) {
    var changed = false;
    data.posts.forEach(function (p) {
      normalizePostRecord(p);
    });
    if (!countPublished(data.posts)) {
      mergeSeedPosts(data);
      data.posts.forEach(normalizePostRecord);
      changed = true;
    }
    return changed;
  }

  function ensureStore() {
    var data = readAll();
    var migrated = false;

    if (!data || !data.posts || !data.posts.length) {
      data = {
        posts: seedPosts().concat(seedExpertPosts()).map(normalizePostRecord),
        version: 5
      };
      writeAll(data, { silent: true });
      return data;
    }

    if (!data.version || data.version < 2) {
      var seeds = seedPosts();
      var ids = {};
      data.posts.forEach(function (p) { ids[p.id] = true; });
      seeds.forEach(function (p) {
        if (!ids[p.id]) data.posts.push(p);
      });
      data.version = 2;
      migrated = true;
    }
    if (!data.version || data.version < 3) {
      data.posts.forEach(normalizePostRecord);
      data.version = 3;
      migrated = true;
    }
    data.posts.forEach(function (p) {
      if (!p.status) {
        p.status = 'published';
        migrated = true;
      }
    });
    if (!data.version || data.version < 4) {
      data.posts.forEach(function (p) {
        if (global.IfluxCommunityGeoAi) {
          if (!p.geo_ai || !p.geo_ai.summary) {
            var seed = IfluxCommunityGeoAi.seedGeoAiById(p.id);
            p.geo_ai = seed || IfluxCommunityGeoAi.generateDraft(p);
          }
          p.geo_ai = IfluxCommunityGeoAi.normalizeGeoAi(p);
          p.schema = p.schema || { type: 'NewsArticle', faq: [] };
          p.schema.faq = p.geo_ai.faq.slice();
        }
      });
      data.version = 4;
      migrated = true;
    }
    if (!data.version || data.version < 5) {
      mergeExpertPosts(data);
      data.posts.forEach(function (p) {
        normalizePostRecord(p);
      });
      data.version = 5;
      migrated = true;
    }

    if (migrated) writeAll(data, { silent: true });
    if (repairStore(data)) {
      writeAll(data, { silent: true });
    }
    return data;
  }

  function canWrite(user) {
    if (!user) return false;
    return !!WRITE_TIERS[String(user.tier || '').toLowerCase()];
  }

  function canWriteExpert(user) {
    return false;
  }

  function postMatchesTaxonomy(post, source, groupId) {
    if (!source || !groupId) return true;
    var tax = global.IfluxWatchlistTaxonomy;
    var tags = post.story_tags || [];
    if (tags.some(function (t) {
      return t.source === source && String(t.sourceId) === String(groupId);
    })) return true;
    if (!tax) return false;
    var group = tax.getGroup(source, groupId);
    if (!group) return false;
    return (post.tickers || []).some(function (tk) {
      return group.tickers.indexOf(tk) >= 0;
    });
  }

  /* Gom các thực thể (chủ đề / ngành / cổ phiếu / hệ sinh thái) mà bài gốc nhắc tới */
  function relatedRefSets(refPost) {
    var sets = { storyIds: {}, tickers: {}, sectorIds: {}, familyIds: {} };
    (refPost.story_tags || []).forEach(function (t) {
      if (t.sourceId == null) return;
      var id = String(t.sourceId);
      if (t.source === 'sector') sets.sectorIds[id] = true;
      else if (t.source === 'family') sets.familyIds[id] = true;
      else sets.storyIds[id] = true;
    });
    (refPost.tickers || []).forEach(function (tk) {
      sets.tickers[String(tk).toUpperCase()] = true;
    });
    var tax = global.IfluxWatchlistTaxonomy;
    if (tax && tax.getTickerMemberships) {
      Object.keys(sets.tickers).forEach(function (tk) {
        var m = tax.getTickerMemberships(tk);
        if (!m) return;
        if (m.sector && m.sector.id != null) sets.sectorIds[String(m.sector.id)] = true;
        if (m.family && m.family.id != null) sets.familyIds[String(m.family.id)] = true;
      });
    }
    return sets;
  }

  function postIsRelatedTo(candidate, sets) {
    if ((candidate.tickers || []).some(function (tk) {
      return sets.tickers[String(tk).toUpperCase()];
    })) return true;
    var i;
    var storyIds = Object.keys(sets.storyIds);
    for (i = 0; i < storyIds.length; i++) {
      if (postMatchesTaxonomy(candidate, 'story', storyIds[i])) return true;
    }
    var sectorIds = Object.keys(sets.sectorIds);
    for (i = 0; i < sectorIds.length; i++) {
      if (postMatchesTaxonomy(candidate, 'sector', sectorIds[i])) return true;
    }
    var familyIds = Object.keys(sets.familyIds);
    for (i = 0; i < familyIds.length; i++) {
      if (postMatchesTaxonomy(candidate, 'family', familyIds[i])) return true;
    }
    return false;
  }

  function getPosts(filter) {
    filter = filter || {};
    var posts = ensureStore().posts.filter(function (p) {
      if (filter.includeDrafts) return true;
      return !p.status || p.status === 'published';
    });

    if (filter.relatedTo) {
      var refPost = typeof filter.relatedTo === 'object'
        ? filter.relatedTo
        : (getPostById(filter.relatedTo) || getPostBySlug(filter.relatedTo));
      if (refPost) {
        var refId = String(refPost.id || '');
        var refSlug = String(refPost.slug || '');
        var sets = relatedRefSets(refPost);
        posts = posts.filter(function (p) {
          if ((refId && String(p.id) === refId) || (refSlug && String(p.slug) === refSlug)) return false;
          return postIsRelatedTo(p, sets);
        });
      } else {
        posts = [];
      }
    }

    var domainId = filter.domainId || filter.sectorId;
    if (domainId) {
      posts = posts.filter(function (p) {
        return postMatchesTaxonomy(p, 'sector', domainId);
      });
    }
    if (filter.taxSource && filter.taxGroupId) {
      posts = posts.filter(function (p) {
        return postMatchesTaxonomy(p, filter.taxSource, filter.taxGroupId);
      });
    }
    if (filter.storyId) {
      posts = posts.filter(function (p) {
        return postMatchesTaxonomy(p, 'story', filter.storyId);
      });
    }
    if (filter.topic) {
      var topicKey = String(filter.topic).toLowerCase();
      posts = posts.filter(function (p) {
        return (p.story_tags || []).some(function (t) {
          var id = String(t.sourceId || '').toLowerCase();
          var name = slugify(t.name || '');
          return id === topicKey || name === topicKey;
        });
      });
    }
    if (filter.tag) {
      var tagKey = String(filter.tag).toLowerCase();
      posts = posts.filter(function (p) {
        var hay = [p.title, p.excerpt, p.seo && p.seo.focus_keyword]
          .concat((p.seo && p.seo.secondary_keywords) || [])
          .concat((p.tickers || []))
          .join(' ')
          .toLowerCase();
        return hay.indexOf(tagKey) >= 0 ||
          (p.story_tags || []).some(function (t) {
            return String(t.sourceId || '').toLowerCase() === tagKey ||
              slugify(t.name || '') === tagKey;
          });
      });
    }
    if (filter.ticker) {
      var tk = filter.ticker.toUpperCase();
      posts = posts.filter(function (p) {
        return (p.tickers || []).indexOf(tk) >= 0;
      });
    }
    if (filter.contentType) {
      posts = posts.filter(function (p) {
        return (p.content_type || CONTENT_TYPE_NEWS) === filter.contentType;
      });
    }
    if (filter.authorId) {
      var aid = String(filter.authorId);
      posts = posts.filter(function (p) {
        return p.author && String(p.author.id) === aid;
      });
    }
    if (filter.q) {
      var q = filter.q.toLowerCase();
      posts = posts.filter(function (p) {
        return p.title.toLowerCase().indexOf(q) >= 0 ||
          (p.excerpt || '').toLowerCase().indexOf(q) >= 0;
      });
    }

    posts.sort(function (a, b) {
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });

    var total = posts.length;
    if (filter.limit != null) {
      var offset = filter.offset || 0;
      posts = posts.slice(offset, offset + filter.limit);
    }

    if (filter.returnMeta) {
      return { items: posts, total: total, hasMore: (filter.offset || 0) + posts.length < total };
    }
    return posts;
  }

  function countPosts(filter) {
    filter = Object.assign({}, filter, { returnMeta: true, limit: null, offset: null });
    var r = getPosts(filter);
    return r.total;
  }

  function getPostsByAuthor(authorId, filter) {
    filter = Object.assign({}, filter || {}, { authorId: authorId });
    return getPosts(filter);
  }

  function postEngagement(post) {
    var commentCount = post.stats && post.stats.comments != null
      ? post.stats.comments
      : (post.comments || []).length;
    return {
      comments: commentCount,
      positive: (post.stats && post.stats.likes || 0) + (post.stats && post.stats.favorites || 0)
    };
  }

  /* Interest Score v1 — trọng số ChatGPT (versioned): View < Search < Like < Favorite ≈ Share < Comment */
  var INTEREST_WEIGHTS = {
    views: 1,
    searches: 3,
    likes: 5,
    favorites: 8,
    shares: 8,
    comments: 10
  };

  var STORY_PERIODS = {
    day: { label: 'Ngày', ms: 24 * 60 * 60 * 1000 },
    week: { label: 'Tuần', ms: 7 * 24 * 60 * 60 * 1000 },
    month: { label: 'Tháng', ms: 30 * 24 * 60 * 60 * 1000 }
  };

  function interestScore(parts) {
    parts = parts || {};
    return (
      (parts.views || 0) * INTEREST_WEIGHTS.views +
      (parts.searches || 0) * INTEREST_WEIGHTS.searches +
      (parts.likes || 0) * INTEREST_WEIGHTS.likes +
      (parts.favorites || 0) * INTEREST_WEIGHTS.favorites +
      (parts.shares || 0) * INTEREST_WEIGHTS.shares +
      (parts.comments || 0) * INTEREST_WEIGHTS.comments
    );
  }

  function postInPeriod(post, periodKey) {
    var def = STORY_PERIODS[periodKey] || STORY_PERIODS.week;
    var ts = Date.parse(post.published_at || post.created_at || '') || 0;
    if (!ts) return true;
    return (Date.now() - ts) <= def.ms;
  }

  function storyKeysFromPost(p) {
    var out = [];
    var seen = {};
    function push(id, name) {
      var key = String(id || name || '').trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push({ id: key, name: name || key });
    }
    var story = normalizePrimaryStory(p.story_tags || [])[0];
    if (story) push(story.sourceId || story.name, story.name);
    (p.topics || []).forEach(function (t) {
      push(t.slug || t.id || t.name, t.name || t.label || t.slug || t.id);
    });
    return out;
  }

  function getTrendingStoriesLocal(limit, periodKey) {
    limit = limit || 10;
    periodKey = periodKey || 'week';
    var map = {};
    getPosts().forEach(function (p) {
      if (!postInPeriod(p, periodKey)) return;
      var keys = storyKeysFromPost(p);
      if (!keys.length) return;
      var stats = p.stats || {};
      var views = stats.views || 0;
      var likes = stats.likes || 0;
      var favorites = stats.favorites || 0;
      var shares = stats.shares || 0;
      var comments = postEngagement(p).comments;
      /* Search chưa có event store — proxy nhẹ từ view (≈8%) để Interest có thành phần Search */
      var searches = Math.round(views * 0.08);
      keys.forEach(function (sk) {
        if (!map[sk.id]) {
          map[sk.id] = {
            id: sk.id,
            name: sk.name,
            views: 0,
            searches: 0,
            likes: 0,
            favorites: 0,
            shares: 0,
            comments: 0,
            positive: 0,
            score: 0
          };
        }
        var m = map[sk.id];
        m.views += views;
        m.searches += searches;
        m.likes += likes;
        m.favorites += favorites;
        m.shares += shares;
        m.comments += comments;
        m.positive += likes + favorites;
      });
    });
    var list = Object.keys(map).map(function (key) {
      var m = map[key];
      m.score = interestScore(m);
      m.period = periodKey;
      return m;
    });
    list.sort(function (a, b) {
      return b.score - a.score || b.comments - a.comments || b.views - a.views;
    });
    return list.slice(0, limit);
  }

  /** Cache Topic trending từ Content Engine P1 (/api/content/topics/trending). */
  var _topicTrendCache = {};

  function mapApiTopicRow(row, periodKey) {
    return {
      id: row.slug || row.topic_id || row.id,
      topic_id: row.topic_id || row.id,
      story_id: row.story_id || null,
      name: row.name || row.label,
      status: row.status,
      period: periodKey || row.period || 'week',
      score: Number(row.score) || 0,
      views: Number(row.views) || 0,
      searches: Number(row.searches) || 0,
      likes: Number(row.likes) || 0,
      comments: Number(row.comments) || 0,
      shares: Number(row.shares) || 0,
      favorites: Number(row.favorites) || 0,
      rank: row.rank,
      href: row.href || null,
      mappings: row.mappings || row.top_tickers || null,
      flow_net_value: row.flow_net_value != null ? Number(row.flow_net_value) : null,
      lifecycle: row.lifecycle || null,
      fromContentEngine: true
    };
  }

  function getTrendingStories(limit, periodKey) {
    limit = limit || 10;
    periodKey = periodKey || 'week';
    var cached = _topicTrendCache[periodKey];
    if (cached && cached.length) {
      return cached.slice(0, limit);
    }
    return getTrendingStoriesLocal(limit, periodKey);
  }

  function hydrateTrendingStoriesFromApi(periodKey, limit) {
    periodKey = periodKey || 'week';
    limit = limit || 10;
    var api = global.IfluxApiClient;
    if (!api || !api.listContentTopics) {
      return Promise.resolve(getTrendingStoriesLocal(limit, periodKey));
    }
    return api.listContentTopics({ trending: true, period: periodKey, limit: limit })
      .then(function (res) {
        var raw = (res && res.data && res.data.topics) || (res && res.topics) || [];
        if (!raw.length) {
          _topicTrendCache[periodKey] = [];
          return getTrendingStoriesLocal(limit, periodKey);
        }
        var mapped = raw.map(function (row) { return mapApiTopicRow(row, periodKey); });
        _topicTrendCache[periodKey] = mapped;
        return mapped.slice(0, limit);
      })
      .catch(function () {
        return getTrendingStoriesLocal(limit, periodKey);
      });
  }

  function getTrendingTickers(limit) {
    limit = limit || 8;
    var map = {};
    getPosts().forEach(function (p) {
      var eng = postEngagement(p);
      (p.tickers || []).forEach(function (tk) {
        tk = String(tk).toUpperCase();
        if (!map[tk]) map[tk] = { ticker: tk, comments: 0, positive: 0, score: 0 };
        map[tk].comments += eng.comments;
        map[tk].positive += eng.positive;
      });
    });
    var list = Object.keys(map).map(function (tk) {
      var m = map[tk];
      m.score = m.comments * 2 + m.positive;
      return m;
    });
    list.sort(function (a, b) {
      return b.score - a.score || b.comments - a.comments;
    });
    return list.slice(0, limit);
  }

  function getTopExpertsByLikes(limit) {
    limit = limit || 5;
    var map = {};
    getPosts({ contentType: CONTENT_TYPE_EXPERT }).forEach(function (p) {
      var author = p.author || {};
      var aid = author.id;
      if (!aid) return;
      if (!map[aid]) {
        map[aid] = {
          userId: aid,
          displayName: author.display_name || 'Chuyên gia',
          tier: author.tier || '',
          tierLabel: author.tier_label || 'Elite',
          totalLikes: 0,
          postCount: 0
        };
      }
      map[aid].totalLikes += (p.stats && p.stats.likes) || 0;
      map[aid].postCount += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return b.totalLikes - a.totalLikes || b.postCount - a.postCount;
    }).slice(0, limit);
  }

  function hashStr(s) {
    var h = 0;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  /* Số theo dõi thật (profile store) → fallback deterministic để luôn có số hiển thị */
  function expertFollowerCount(userId) {
    var pu = global.IfluxProfileUsersStore;
    if (pu && pu.getPublic) {
      var u = pu.getPublic(userId);
      if (u && u.stats && u.stats.followers) return u.stats.followers;
    }
    var pf = global.IfluxProfileFollowStore;
    if (pf && pf.listFollowers) {
      var arr = pf.listFollowers(userId);
      if (arr && arr.length) return arr.length;
    }
    return 120 + (hashStr(userId) % 3000);
  }

  /* Chưa có nguồn thật cho số thành viên affiliate & số sao đánh giá của chuyên gia
     → suy ra deterministic theo userId (ổn định giữa các lần render). */
  function expertDerivedStats(userId) {
    var h = hashStr('aff:' + userId);
    return {
      affiliateMembers: 5 + (h % 240),
      rating: Math.round((38 + (hashStr('rate:' + userId) % 12))) / 10
    };
  }

  /* Bảng xếp hạng chuyên gia (mở rộng): bài viết, lượt thích, theo dõi, thành viên, sao. */
  function getExpertLeaderboard(limit, filter) {
    limit = limit || 6;
    var base = filter || {};
    var map = {};
    getPosts(Object.assign({}, base, { contentType: CONTENT_TYPE_EXPERT })).forEach(function (p) {
      var author = p.author || {};
      var aid = author.id;
      if (!aid) return;
      if (!map[aid]) {
        map[aid] = {
          userId: aid,
          displayName: author.display_name || 'Chuyên gia',
          tier: author.tier || '',
          tierLabel: author.tier_label || 'Elite',
          totalLikes: 0,
          postCount: 0
        };
      }
      map[aid].totalLikes += (p.stats && p.stats.likes) || 0;
      map[aid].postCount += 1;
    });
    return Object.keys(map).map(function (k) {
      var row = map[k];
      var derived = expertDerivedStats(row.userId);
      row.totalFollows = expertFollowerCount(row.userId);
      row.affiliateMembers = derived.affiliateMembers;
      row.rating = derived.rating;
      return row;
    }).sort(function (a, b) {
      return b.totalLikes - a.totalLikes || b.postCount - a.postCount;
    }).slice(0, limit);
  }

  function getPostBySlug(slug) {
    return ensureStore().posts.find(function (p) { return p.slug === slug; }) || null;
  }

  function getPostById(id) {
    return ensureStore().posts.find(function (p) { return p.id === id; }) || null;
  }

  function uniqueSlug(base, excludeId) {
    var slug = slugify(base) || 'bai-viet';
    var posts = ensureStore().posts;
    var n = 0;
    var candidate = slug;
    while (posts.some(function (p) { return p.slug === candidate && p.id !== excludeId; })) {
      n += 1;
      candidate = slug + '-' + n;
    }
    return candidate;
  }

  function savePost(payload, user) {
    if (!canWrite(user)) throw new Error('Chỉ thành viên Premium trở lên mới được đăng bài.');
    var data = ensureStore();
    var ts = nowIso();
    var isNew = !payload.id;
    var post = isNew ? { id: uid('post'), stats: { likes: 0, comments: 0, shares: 0, views: 0, favorites: 0 }, liked_by: [], favorited_by: [], comments: [] } : getPostById(payload.id);
    if (!post) throw new Error('Không tìm thấy bài viết.');

    post.slug = uniqueSlug(payload.slug || payload.title, post.id);
    post.title = (payload.title || '').trim();
    post.excerpt = (payload.excerpt || '').trim();
    post.story_tags = normalizePrimaryStory(payload.chu_de_tags || payload.story_tags || []);
    post.chu_de_tags = post.story_tags;
    var rawBody = payload.body_html || '';
    post.tickers = extractTickersFromPost(post.title, post.excerpt, rawBody);
    post.body_html = linkifyTickersInHtml(rawBody, post.tickers);
    post.seo = Object.assign({}, post.seo || {}, payload.seo || {});
    post.geo = Object.assign({}, post.geo || {}, payload.geo || {});
    post.geo_ai = global.IfluxCommunityGeoAi
      ? IfluxCommunityGeoAi.normalizeGeoAi({ geo_ai: payload.geo_ai || {}, excerpt: post.excerpt, schema: payload.schema })
      : (payload.geo_ai || {});
    post.schema = Object.assign({ type: 'NewsArticle', faq: [] }, post.schema || {}, payload.schema || {});
    if (post.geo_ai && post.geo_ai.faq && post.geo_ai.faq.length) {
      post.schema.faq = post.geo_ai.faq.slice();
    }
    post.status = payload.status || 'draft';
    post.content_type = payload.content_type || CONTENT_TYPE_NEWS;
    post.updated_at = ts;
    if (!post.created_at) post.created_at = ts;
    if (post.status === 'published' && !post.published_at) post.published_at = ts;
    if (isNew) {
      post.author = {
        id: user.id || 'usr_local',
        display_name: user.display_name || 'Thành viên',
        tier: user.tier || 'premium',
        tier_label: user.tier_label || 'Premium'
      };
      data.posts.unshift(post);
    }
    writeAll(data);
    if (isNew && post.status === 'published' && global.IfluxApiClient && global.IfluxAuth) {
      var token = IfluxAuth.getToken && IfluxAuth.getToken();
      if (token && token.indexOf('mock_jwt_') !== 0 && IfluxApiClient.createCommunityPost) {
        IfluxApiClient.createCommunityPost(token, {
          title: post.title,
          excerpt: post.excerpt,
          body_html: post.body_html,
          content_type: post.content_type,
          tickers: post.tickers,
          slug: post.slug
        }).catch(function () { /* offline */ });
      }
    }
    if (isNew && post.status === 'published' && global.IfluxInAppNotifications && global.IfluxProfileFollowStore && global.IfluxAuth) {
      var session = IfluxAuth.getUser();
      var authorId = (post.author && post.author.id) || (user && user.id);
      if (session && authorId && session.id !== authorId && IfluxProfileFollowStore.isFollowing(session.id, authorId)) {
        IfluxInAppNotifications.pushCommunityPost(session.id, { author: post.author, post: post });
      }
    }
    return post;
  }

  function bumpView(slug) {
    var post = getPostBySlug(slug);
    if (!post) return;
    post.stats.views = (post.stats.views || 0) + 1;
    writeAll(ensureStore());
  }

  function toggleLike(slug, userId) {
    var post = getPostBySlug(slug);
    if (!post || !userId) return post;
    post.liked_by = post.liked_by || [];
    var idx = post.liked_by.indexOf(userId);
    if (idx >= 0) {
      post.liked_by.splice(idx, 1);
      post.stats.likes = Math.max(0, (post.stats.likes || 0) - 1);
    } else {
      post.liked_by.push(userId);
      post.stats.likes = (post.stats.likes || 0) + 1;
    }
    writeAll(ensureStore());
    return post;
  }

  function toggleFavorite(slug, userId) {
    var post = getPostBySlug(slug);
    if (!post || !userId) return post;
    post.favorited_by = post.favorited_by || [];
    var idx = post.favorited_by.indexOf(userId);
    if (idx >= 0) {
      post.favorited_by.splice(idx, 1);
      post.stats.favorites = Math.max(0, (post.stats.favorites || 0) - 1);
    } else {
      post.favorited_by.push(userId);
      post.stats.favorites = (post.stats.favorites || 0) + 1;
    }
    writeAll(ensureStore());
    return post;
  }

  function addComment(slug, user, body) {
    body = (body || '').trim();
    if (!body) throw new Error('Nhập nội dung bình luận.');
    var post = getPostBySlug(slug);
    if (!post) throw new Error('Bài viết không tồn tại.');
    post.comments = post.comments || [];
    post.comments.push({
      id: uid('cmt'),
      user_id: user.id || 'anon',
      user_name: user.display_name || 'Thành viên',
      body: body,
      created_at: nowIso(),
      likes: 0,
      shares: 0,
      replies: 0
    });
    post.stats.comments = post.comments.length;
    writeAll(ensureStore());
    return post;
  }

  function bumpShare(slug) {
    var post = getPostBySlug(slug);
    if (!post) return;
    post.stats.shares = (post.stats.shares || 0) + 1;
    writeAll(ensureStore());
  }

  function buildJsonLd(post, pageUrl) {
    var seo = post.seo || {};
    var geo = post.geo || {};
    var schema = post.schema || {};
    var ld = {
      '@context': 'https://schema.org',
      '@type': schema.type || 'NewsArticle',
      headline: post.title,
      description: post.excerpt || seo.meta_description,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      inLanguage: geo.language || 'vi-VN',
      author: {
        '@type': 'Person',
        name: post.author && post.author.display_name ? post.author.display_name : 'iFlux Member'
      },
      publisher: {
        '@type': 'Organization',
        name: 'iFlux',
        logo: { '@type': 'ImageObject', url: 'https://iflux.vn/logo.png' }
      },
      mainEntityOfPage: pageUrl,
      keywords: [seo.focus_keyword].concat(seo.secondary_keywords || []).filter(Boolean).join(', '),
      about: (post.tickers || []).map(function (t) {
        return { '@type': 'Corporation', name: t, tickerSymbol: t };
      })
    };
    if (seo.og_image) ld.image = seo.og_image;
    if (geo.country) {
      ld.contentLocation = { '@type': 'Country', name: geo.region || geo.country };
    }
    var faq = (post.geo_ai && post.geo_ai.faq && post.geo_ai.faq.length)
      ? post.geo_ai.faq
      : (schema.faq || []);
    if (faq.length) {
      return [
        ld,
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map(function (item) {
            return {
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a }
            };
          })
        }
      ];
    }
    return ld;
  }

  function exportSeoSeed(post, baseUrl) {
    baseUrl = baseUrl || (global.IfluxSeoUrl ? IfluxSeoUrl.PROD_ORIGIN : '');
    var url = global.IfluxSeoUrl
      ? IfluxSeoUrl.postCanonical(post)
      : baseUrl + '/cong-dong/bai-viet/' + encodeURIComponent(post.id || post.slug);
    return {
      url: url,
      slug: post.slug,
      path: global.IfluxSeoUrl ? IfluxSeoUrl.postSlugPath(post) : '/cong-dong/bai-viet/' + encodeURIComponent(post.id || post.slug),
      meta: {
        title: (post.seo && post.seo.meta_title) || post.title,
        description: (post.seo && post.seo.meta_description) || post.excerpt,
        canonical: (post.seo && post.seo.canonical_url) || url,
        robots: (post.seo && post.seo.robots) || 'index,follow',
        keywords: [post.seo && post.seo.focus_keyword].concat((post.seo && post.seo.secondary_keywords) || []).concat((post.geo && post.geo.geo_keywords) || []).filter(Boolean),
        og: {
          title: (post.seo && post.seo.og_title) || post.title,
          description: (post.seo && post.seo.og_description) || post.excerpt,
          image: post.seo && post.seo.og_image,
          image_alt: post.seo && post.seo.og_image_alt,
          locale: (post.geo && post.geo.target_locale) || 'vi_VN'
        }
      },
      geo: post.geo || {},
      geo_ai: global.IfluxCommunityGeoAi ? IfluxCommunityGeoAi.normalizeGeoAi(post) : (post.geo_ai || {}),
      keywords: {
        focus: post.seo && post.seo.focus_keyword,
        secondary: post.seo && post.seo.secondary_keywords
      },
      entities: {
        tickers: post.tickers || [],
        stories: (post.story_tags || []).map(function (t) { return t.name; })
      },
      json_ld: buildJsonLd(post, url)
    };
  }

  ensureStore();

  global.IfluxCommunityStore = {
    canWrite: canWrite,
    canWriteExpert: canWriteExpert,
    getPosts: getPosts,
    getPostsByAuthor: getPostsByAuthor,
    countPosts: countPosts,
    postMatchesTaxonomy: postMatchesTaxonomy,
    CONTENT_TYPE_NEWS: CONTENT_TYPE_NEWS,
    CONTENT_TYPE_EXPERT: CONTENT_TYPE_EXPERT,
    ADMIN_AUTHOR: ADMIN_AUTHOR,
    getPostBySlug: getPostBySlug,
    getPostById: getPostById,
    savePost: savePost,
    bumpView: bumpView,
    toggleLike: toggleLike,
    toggleFavorite: toggleFavorite,
    addComment: addComment,
    bumpShare: bumpShare,
    buildJsonLd: buildJsonLd,
    exportSeoSeed: exportSeoSeed,
    slugify: slugify,
    extractTickersFromPost: extractTickersFromPost,
    linkifyTickersInHtml: linkifyTickersInHtml,
    normalizePrimaryStory: normalizePrimaryStory,
    getTrendingTickers: getTrendingTickers,
    getTrendingStories: getTrendingStories,
    getTrendingStoriesLocal: getTrendingStoriesLocal,
    hydrateTrendingStoriesFromApi: hydrateTrendingStoriesFromApi,
    INTEREST_WEIGHTS: INTEREST_WEIGHTS,
    STORY_PERIODS: STORY_PERIODS,
    interestScore: interestScore,
    getTopExpertsByLikes: getTopExpertsByLikes,
    getExpertLeaderboard: getExpertLeaderboard,
    WRITE_TIERS: WRITE_TIERS,
    EXPERT_WRITE_TIERS: EXPERT_WRITE_TIERS
  };
})(window);
