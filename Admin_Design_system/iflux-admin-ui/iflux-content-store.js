/* Quản lý nội dung — kho localStorage GĐ1 (Admin Cộng đồng) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_content_posts_v1';
  var VERSION = 1;

  var STATUS = {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    reviewing: 'Đang duyệt',
    approved: 'Đã duyệt',
    scheduled: 'Lên lịch xuất bản',
    published: 'Đã xuất bản',
    hidden: 'Đã ẩn',
    archived: 'Lưu trữ',
    deleted: 'Đã xóa'
  };

  var STATUS_CHIP = {
    draft: 'ix-chip-muted',
    pending: 'ix-chip-warning',
    reviewing: 'ix-chip-info',
    approved: 'ix-chip-success',
    scheduled: 'ix-chip-info',
    published: 'ix-chip-success',
    hidden: 'ix-chip-muted',
    archived: 'ix-chip-muted',
    deleted: 'ix-chip-danger'
  };

  var CONTENT_TYPES = {
    news: 'Tin tức',
    flash: 'Tin nhanh',
    analysis: 'Báo cáo phân tích',
    expert: 'Góc nhìn chuyên gia',
    notice: 'Thông báo',
    knowledge: 'Kiến thức đầu tư',
    story: 'Story',
    ai: 'Nội dung AI',
    newsletter: 'Bản tin tự động'
  };

  var SOURCES = {
    original: 'Tự viết',
    media: 'Báo điện tử',
    press: 'Thông cáo báo chí',
    exchange: 'Sở giao dịch',
    company: 'Doanh nghiệp',
    other: 'Khác'
  };

  var CATEGORIES = [
    { id: 'tin-tuc', name: 'Tin tức', children: [
      { id: 'tin-doanh-nghiep', name: 'Doanh nghiệp' },
      { id: 'tin-ngan-hang', name: 'Ngân hàng' },
      { id: 'tin-vi-mo', name: 'Vĩ mô' }
    ]},
    { id: 'thi-truong', name: 'Thị trường', children: [
      { id: 'chi-so', name: 'Chỉ số' },
      { id: 'dong-tien', name: 'Dòng tiền' }
    ]},
    { id: 'phan-tich', name: 'Phân tích', children: [] },
    { id: 'chuyen-gia', name: 'Góc nhìn chuyên gia', children: [] },
    { id: 'kien-thuc', name: 'Kiến thức đầu tư', children: [] },
    { id: 'thong-bao', name: 'Thông báo', children: [] }
  ];

  var TAGS = ['Chia cổ tức', 'Phát hành riêng lẻ', 'Room ngoại', 'Đầu tư công', 'Nâng hạng', 'Bán dẫn'];

  function nowIso() { return new Date().toISOString(); }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '—'; }
  }

  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeRaw(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function seedPosts() {
    var base = new Date('2026-07-10T08:00:00');
    function daysAgo(n, h) {
      var d = new Date(base);
      d.setDate(d.getDate() - n);
      if (h != null) d.setHours(h, 30, 0, 0);
      return d.toISOString();
    }
    return [
      {
        id: 'CNT-20260712-001',
        title: 'FPT công bố kết quả kinh doanh quý II/2026',
        subtitle: 'Lợi nhuận sau thuế tăng 18% so với cùng kỳ',
        slug: 'fpt-ket-qua-kinh-doanh-q2-2026',
        excerpt: 'FPT ghi nhận doanh thu hợp nhất vượt kế hoạch nửa đầu năm nhờ tăng trưởng mảng công nghệ.',
        body: '<p>FPT tiếp tục dẫn đầu nhóm công nghệ Việt Nam với đà tăng trưởng ổn định...</p>',
        thumbnail: '',
        thumbnailAlt: 'Logo FPT',
        contentType: 'news',
        categories: ['news', 'news-corp'],
        tags: ['Chia cổ tức'],
        source: 'press',
        sourceName: '', sourceUrl: '', sourceAuthor: '', sourceFetchedAt: '',
        author: 'Nguyễn Văn A',
        reviewer: 'Trần Văn B',
        status: 'published',
        stocks: ['FPT'],
        sectors: ['Công nghệ thông tin'],
        families: ['Họ FPT'],
        stories: ['AI', 'Bán dẫn'],
        markets: ['VN-Index'],
        companies: [],
        ai: { summary: 'FPT tăng trưởng mạnh nhờ AI và chuyển đổi số.', keywords: ['FPT', 'lợi nhuận'], topics: ['Công nghệ'], sentiment: 'Tích cực', stocksDetected: ['FPT'], storiesDetected: ['AI'] },
        display: { home: true, app: true, web: true, api: true, sticky: false, featured: true, breaking: false, allowComments: true, allowShare: true, pushNotify: false },
        schedule: { publishAt: daysAgo(1, 9), expireAt: '' },
        seo: { title: 'FPT Q2/2026 — Kết quả kinh doanh', description: 'Phân tích kết quả FPT quý II', canonical: '', ogImage: '', indexable: true },
        related: [],
        relatedMode: 'auto',
        hasImage: true, hasVideo: false, hasAttachment: false, hasAiSummary: true,
        stats: { views: 12450, avgReadSec: 142, likes: 320, shares: 89, saves: 156, comments: 42, readThrough: 0.68 },
        versions: [{ v: 1, at: daysAgo(2, 10), by: 'Nguyễn Văn A', note: 'Tạo bản nháp' }, { v: 2, at: daysAgo(1, 9), by: 'Trần Văn B', note: 'Xuất bản' }],
        audit: [
          { at: daysAgo(2, 10), who: 'Nguyễn Văn A', action: 'Tạo bản nháp' },
          { at: daysAgo(1, 8), who: 'Nguyễn Văn A', action: 'Chỉnh sửa tiêu đề' },
          { at: daysAgo(1, 9), who: 'Trần Văn B', action: 'Duyệt và xuất bản' }
        ],
        createdAt: daysAgo(2, 10),
        updatedAt: daysAgo(1, 9),
        publishedAt: daysAgo(1, 9)
      },
      {
        id: 'CNT-20260712-002',
        title: 'HPG: Room ngoại còn dư khoảng 2.100 tỷ đồng',
        subtitle: '',
        slug: 'hpg-room-ngoai-con-du',
        excerpt: 'Khối ngoại tiếp tục mua ròng cổ phiếu HPG trong phiên gần nhất.',
        body: '<p>Hòa Phát duy trì sức hút với nhà đầu tư nước ngoài...</p>',
        thumbnail: '',
        thumbnailAlt: '',
        contentType: 'flash',
        categories: ['market', 'market-flow'],
        tags: ['Room ngoại'],
        source: 'media',
        sourceName: 'CafeF', sourceUrl: 'https://example.com/hpg', sourceAuthor: 'Ban biên tập', sourceFetchedAt: daysAgo(0, 7),
        author: 'Lê Thị C',
        reviewer: '',
        status: 'pending',
        stocks: ['HPG'],
        sectors: ['Thép'],
        families: ['Họ Hòa Phát'],
        stories: ['Đầu tư công'],
        markets: ['VN30', 'HOSE'],
        companies: [],
        ai: { summary: '', keywords: [], topics: [], sentiment: '', stocksDetected: ['HPG'], storiesDetected: [] },
        display: { home: true, app: true, web: true, api: false, sticky: true, featured: false, breaking: true, allowComments: true, allowShare: true, pushNotify: true },
        schedule: { publishAt: '', expireAt: daysAgo(-1, 7) },
        seo: { title: '', description: '', canonical: '', ogImage: '', indexable: true },
        related: [],
        relatedMode: 'auto',
        hasImage: false, hasVideo: false, hasAttachment: false, hasAiSummary: false,
        stats: { views: 0, avgReadSec: 0, likes: 0, shares: 0, saves: 0, comments: 0, readThrough: 0 },
        versions: [{ v: 1, at: daysAgo(0, 7), by: 'Lê Thị C', note: 'Gửi chờ duyệt' }],
        audit: [{ at: daysAgo(0, 7), who: 'Lê Thị C', action: 'Gửi chờ duyệt' }],
        createdAt: daysAgo(0, 7),
        updatedAt: daysAgo(0, 7),
        publishedAt: ''
      },
      {
        id: 'CNT-20260712-003',
        title: 'Ngân hàng: Triển vọng tín dụng nửa cuối năm',
        subtitle: 'Góc nhìn chuyên gia iFlux',
        slug: 'ngan-hang-trien-vong-tin-dung',
        excerpt: 'Tăng trưởng tín dụng có thể phục hồi khi lãi suất ổn định.',
        body: '<p>Các ngân hàng niêm yết được kỳ vọng cải thiện biên lãi ròng...</p>',
        thumbnail: '',
        thumbnailAlt: '',
        contentType: 'expert',
        categories: ['news', 'news-bank'],
        tags: ['Đầu tư công'],
        source: 'original',
        sourceName: '', sourceUrl: '', sourceAuthor: '', sourceFetchedAt: '',
        author: 'Phạm Minh D',
        reviewer: 'Trần Văn B',
        status: 'draft',
        stocks: ['VCB', 'TCB', 'MBB'],
        sectors: ['Ngân hàng'],
        families: [],
        stories: ['Nâng hạng thị trường'],
        markets: ['VN-Index'],
        companies: [],
        ai: { summary: 'Ngành ngân hàng hưởng lợi từ ổn định lãi suất.', keywords: ['ngân hàng', 'tín dụng'], topics: ['Ngân hàng'], sentiment: 'Trung lập', stocksDetected: ['VCB'], storiesDetected: ['Nâng hạng thị trường'] },
        display: { home: false, app: true, web: true, api: true, sticky: false, featured: false, breaking: false, allowComments: true, allowShare: true, pushNotify: false },
        schedule: { publishAt: daysAgo(-2, 10), expireAt: '' },
        seo: { title: 'Triển vọng ngân hàng 2026', description: '', canonical: '', ogImage: '', indexable: true },
        related: ['CNT-20260712-001'],
        relatedMode: 'manual',
        hasImage: true, hasVideo: false, hasAttachment: true, hasAiSummary: true,
        stats: { views: 0, avgReadSec: 0, likes: 0, shares: 0, saves: 0, comments: 0, readThrough: 0 },
        versions: [{ v: 1, at: daysAgo(0, 14), by: 'Phạm Minh D', note: 'Tạo bản nháp' }],
        audit: [{ at: daysAgo(0, 14), who: 'Phạm Minh D', action: 'Tạo bản nháp' }],
        createdAt: daysAgo(0, 14),
        updatedAt: daysAgo(0, 14),
        publishedAt: ''
      },
      {
        id: 'CNT-20260712-004',
        title: 'VNM: Thông báo họp ĐHCĐ thường niên 2026',
        subtitle: '',
        slug: 'vnm-dai-hoi-co-dong-2026',
        excerpt: 'Vinamilk công bố lịch họp và chương trình cổ tức dự kiến.',
        body: '<p>Cổ đông Vinamilk chú ý mốc họp quan trọng cuối tháng 8...</p>',
        thumbnail: '',
        thumbnailAlt: '',
        contentType: 'notice',
        categories: ['news', 'news-corp'],
        tags: ['Chia cổ tức'],
        source: 'company',
        sourceName: 'Vinamilk', sourceUrl: '', sourceAuthor: '', sourceFetchedAt: '',
        author: 'Ban biên tập iFlux',
        reviewer: 'Trần Văn B',
        status: 'scheduled',
        stocks: ['VNM'],
        sectors: ['Thực phẩm & đồ uống'],
        families: ['Họ Masan'],
        stories: [],
        markets: ['UPCoM'],
        companies: ['Vinamilk'],
        ai: { summary: 'VNM sắp họp ĐHCĐ, thị trường theo dõi cổ tức.', keywords: ['VNM', 'cổ tức'], topics: ['Doanh nghiệp'], sentiment: 'Trung lập', stocksDetected: ['VNM'], storiesDetected: [] },
        display: { home: false, app: true, web: true, api: true, sticky: false, featured: false, breaking: false, allowComments: false, allowShare: true, pushNotify: false },
        schedule: { publishAt: daysAgo(-1, 8), expireAt: '' },
        seo: { title: '', description: '', canonical: '', ogImage: '', indexable: true },
        related: [],
        relatedMode: 'auto',
        hasImage: false, hasVideo: false, hasAttachment: true, hasAiSummary: true,
        stats: { views: 0, avgReadSec: 0, likes: 0, shares: 0, saves: 0, comments: 0, readThrough: 0 },
        versions: [{ v: 1, at: daysAgo(0, 5), by: 'Ban biên tập iFlux', note: 'Lên lịch xuất bản' }],
        audit: [{ at: daysAgo(0, 5), who: 'Ban biên tập iFlux', action: 'Lên lịch xuất bản' }],
        createdAt: daysAgo(0, 5),
        updatedAt: daysAgo(0, 5),
        publishedAt: ''
      },
      {
        id: 'CNT-20260712-005',
        title: 'Tổng hợp thị trường tuần 28/2026',
        subtitle: 'VN-Index giữ trên vùng 1.280 điểm',
        slug: 'tong-hop-thi-truong-tuan-28',
        excerpt: 'Dòng tiền xoay vòng mạnh giữa ngân hàng và bán dẫn.',
        body: '<p>Tuần qua thị trường ghi nhận thanh khoản cải thiện...</p>',
        thumbnail: '',
        thumbnailAlt: '',
        contentType: 'newsletter',
        categories: ['market', 'market-index'],
        tags: ['Bán dẫn', 'Room ngoại'],
        source: 'original',
        sourceName: '', sourceUrl: '', sourceAuthor: '', sourceFetchedAt: '',
        author: 'Nguyễn Văn A',
        reviewer: 'Trần Văn B',
        status: 'archived',
        stocks: ['FPT', 'HPG', 'VNM'],
        sectors: ['Ngân hàng', 'Bán dẫn'],
        families: ['Họ Vin', 'Họ FPT'],
        stories: ['Bán dẫn', 'Thuế đối ứng'],
        markets: ['VN-Index', 'VN30', 'HNX'],
        companies: [],
        ai: { summary: 'Thị trường sideway, ngành bán dẫn nổi bật.', keywords: [], topics: ['Thị trường'], sentiment: 'Tích cực', stocksDetected: [], storiesDetected: ['Bán dẫn'] },
        display: { home: false, app: false, web: true, api: false, sticky: false, featured: false, breaking: false, allowComments: true, allowShare: true, pushNotify: false },
        schedule: { publishAt: daysAgo(7, 17), expireAt: daysAgo(1, 0) },
        seo: { title: '', description: '', canonical: '', ogImage: '', indexable: false },
        related: [],
        relatedMode: 'auto',
        hasImage: true, hasVideo: true, hasAttachment: false, hasAiSummary: true,
        stats: { views: 8920, avgReadSec: 198, likes: 210, shares: 55, saves: 98, comments: 31, readThrough: 0.54 },
        versions: [{ v: 1, at: daysAgo(8, 10), by: 'Nguyễn Văn A', note: 'Xuất bản' }],
        audit: [{ at: daysAgo(8, 10), who: 'Nguyễn Văn A', action: 'Xuất bản' }, { at: daysAgo(1, 0), who: 'Hệ thống', action: 'Tự động lưu trữ' }],
        createdAt: daysAgo(8, 10),
        updatedAt: daysAgo(1, 0),
        publishedAt: daysAgo(7, 17)
      }
    ];
  }

  function ensureStore() {
    var data = readRaw();
    if (!data || data.version !== VERSION) {
      data = { version: VERSION, posts: seedPosts() };
      writeRaw(data);
    }
    return data;
  }

  function getAll() {
    return ensureStore().posts.slice().sort(function (a, b) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  function getById(id) {
    return getAll().find(function (p) { return p.id === id; }) || null;
  }

  function nextId() {
    var d = new Date();
    var ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var n = getAll().length + 1;
    return 'CNT-' + ymd + '-' + String(n).padStart(3, '0');
  }

  function emptyPost() {
    return {
      id: '',
      title: '', subtitle: '', slug: '', excerpt: '', body: '',
      thumbnail: '', thumbnailAlt: '',
      contentType: 'news',
      categories: [], tags: [],
      source: 'original',
      sourceName: '', sourceUrl: '', sourceAuthor: '', sourceFetchedAt: '',
      author: 'Quản trị viên', reviewer: '',
      status: 'draft',
      stocks: [], sectors: [], families: [], stories: [], markets: [], companies: [],
      ai: { summary: '', keywords: [], topics: [], sentiment: '', stocksDetected: [], storiesDetected: [] },
      display: { home: false, app: true, web: true, api: false, sticky: false, featured: false, breaking: false, allowComments: true, allowShare: true, pushNotify: false },
      schedule: { publishAt: '', expireAt: '' },
      seo: { title: '', description: '', canonical: '', ogImage: '', indexable: true },
      related: [], relatedMode: 'auto',
      hasImage: false, hasVideo: false, hasAttachment: false, hasAiSummary: false,
      stats: { views: 0, avgReadSec: 0, likes: 0, shares: 0, saves: 0, comments: 0, readThrough: 0 },
      versions: [], audit: [],
      createdAt: '', updatedAt: '', publishedAt: ''
    };
  }

  function save(post) {
    var data = ensureStore();
    var idx = data.posts.findIndex(function (p) { return p.id === post.id; });
    var ts = nowIso();
    if (idx < 0) {
      post.id = post.id || nextId();
      post.createdAt = ts;
      post.versions = [{ v: 1, at: ts, by: post.author || 'Quản trị viên', note: 'Tạo mới' }];
      post.audit = [{ at: ts, who: post.author || 'Quản trị viên', action: 'Tạo bài viết' }];
      data.posts.push(post);
    } else {
      var prev = data.posts[idx];
      var verNum = (prev.versions && prev.versions.length) ? prev.versions[prev.versions.length - 1].v + 1 : 1;
      post.versions = (prev.versions || []).concat([{ v: verNum, at: ts, by: post.author || 'Quản trị viên', note: 'Cập nhật' }]);
      post.audit = (prev.audit || []).concat([{ at: ts, who: post.author || 'Quản trị viên', action: 'Chỉnh sửa bài viết' }]);
      post.createdAt = prev.createdAt;
      if (post.status === 'published' && !post.publishedAt) post.publishedAt = ts;
      data.posts[idx] = post;
    }
    post.updatedAt = ts;
    if (!post.slug && post.title) post.slug = slugify(post.title);
    writeRaw(data);
    return post;
  }

  function remove(id) {
    var data = ensureStore();
    var p = data.posts.find(function (x) { return x.id === id; });
    if (p) {
      p.status = 'deleted';
      p.updatedAt = nowIso();
      p.audit = (p.audit || []).concat([{ at: nowIso(), who: 'Quản trị viên', action: 'Đã xóa' }]);
    }
    writeRaw(data);
  }

  function categoryLabel(ids) {
    if (!ids || !ids.length) return '—';
    var names = [];
    CATEGORIES.forEach(function (c) {
      if (ids.indexOf(c.id) >= 0) names.push(c.name);
      (c.children || []).forEach(function (ch) {
        if (ids.indexOf(ch.id) >= 0) names.push(c.name + ' → ' + ch.name);
      });
    });
    return names.length ? names.join(', ') : ids.join(', ');
  }

  function filterPosts(posts, opts) {
    opts = opts || {};
    var q = (opts.q || '').toLowerCase().trim();
    return posts.filter(function (p) {
      if (p.status === 'deleted' && !opts.includeDeleted) return false;
      if (opts.status && p.status !== opts.status) return false;
      if (opts.contentType && p.contentType !== opts.contentType) return false;
      if (opts.source && p.source !== opts.source) return false;
      if (opts.category && p.categories.indexOf(opts.category) < 0) return false;
      if (opts.tag && p.tags.indexOf(opts.tag) < 0) return false;
      if (opts.author && p.author !== opts.author) return false;
      if (opts.reviewer && p.reviewer !== opts.reviewer) return false;
      if (opts.hasImage === 'yes' && !p.hasImage) return false;
      if (opts.hasImage === 'no' && p.hasImage) return false;
      if (opts.hasVideo === 'yes' && !p.hasVideo) return false;
      if (opts.hasVideo === 'no' && p.hasVideo) return false;
      if (opts.hasAttachment === 'yes' && !p.hasAttachment) return false;
      if (opts.hasAiSummary === 'yes' && !p.hasAiSummary) return false;
      if (opts.hasStock === 'yes' && !(p.stocks && p.stocks.length)) return false;
      if (opts.hasStory === 'yes' && !(p.stories && p.stories.length)) return false;
      if (opts.dateFrom) {
        var from = new Date(opts.dateFrom);
        if (new Date(p.createdAt) < from) return false;
      }
      if (opts.dateTo) {
        var to = new Date(opts.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(p.createdAt) > to) return false;
      }
      if (q) {
        var hay = [p.id, p.title, p.body, p.excerpt, p.author].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function getDashboardStats() {
    var posts = getAll().filter(function (p) { return p.status !== 'deleted'; });
    function countStatus(s) { return posts.filter(function (p) { return p.status === s; }).length; }
    function topBy(arrKey, limit) {
      var map = {};
      posts.forEach(function (p) {
        (p[arrKey] || []).forEach(function (v) {
          map[v] = (map[v] || 0) + 1;
        });
      });
      return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, limit || 5);
    }
    var authors = {};
    posts.forEach(function (p) {
      if (p.author) authors[p.author] = (authors[p.author] || 0) + 1;
    });
    var topAuthors = Object.keys(authors).map(function (k) { return { name: k, count: authors[k] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
    var topViews = posts.slice().sort(function (a, b) { return (b.stats.views || 0) - (a.stats.views || 0); }).slice(0, 5);
    var withAi = posts.filter(function (p) { return p.hasAiSummary; }).length;
    var linkedFull = posts.filter(function (p) {
      return p.stocks.length && p.sectors.length && p.families.length && p.stories.length;
    }).length;
    return {
      total: posts.length,
      published: countStatus('published'),
      draft: countStatus('draft'),
      pending: countStatus('pending') + countStatus('reviewing'),
      scheduled: countStatus('scheduled'),
      hidden: countStatus('hidden'),
      topViews: topViews,
      topAuthors: topAuthors,
      topStories: topBy('stories'),
      topSectors: topBy('sectors'),
      topFamilies: topBy('families'),
      topStocks: topBy('stocks'),
      aiRate: posts.length ? Math.round((withAi / posts.length) * 100) : 0,
      linkRate: posts.length ? Math.round((linkedFull / posts.length) * 100) : 0
    };
  }

  function optionHtml(map, selected) {
    return Object.keys(map).map(function (k) {
      return '<option value="' + k + '"' + (k === selected ? ' selected' : '') + '>' + map[k] + '</option>';
    }).join('');
  }

  global.IfluxContentStore = {
    STATUS: STATUS,
    STATUS_CHIP: STATUS_CHIP,
    CONTENT_TYPES: CONTENT_TYPES,
    SOURCES: SOURCES,
    CATEGORIES: CATEGORIES,
    TAGS: TAGS,
    fmtDate: fmtDate,
    slugify: slugify,
    getAll: getAll,
    getById: getById,
    save: save,
    remove: remove,
    emptyPost: emptyPost,
    filterPosts: filterPosts,
    getDashboardStats: getDashboardStats,
    categoryLabel: categoryLabel,
    optionHtml: optionHtml
  };
})(typeof window !== 'undefined' ? window : global);
