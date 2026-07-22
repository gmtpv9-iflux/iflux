/**
 * ADM-SYS-012 — Widget Templates (SoT)
 *
 * Widget Template CHỈ mô tả: nội dung hiển thị + hình thức hiển thị (giao diện).
 * Template KHÔNG xử lý (không mục đích, BQ, tầng dữ liệu, cách tính, engine,
 * algorithm, không gắn cứng Widget). Widget dùng template tự lo phần xử lý,
 * miễn trả về đủ các "Đầu vào" mà template cần để hiển thị.
 *
 * Mỗi template:
 *  - id            : Mã template
 *  - name          : Tên template
 *  - description   : Mô tả ngắn template dùng để làm gì
 *  - domain        : metadata tương thích cũ, không dùng để lọc/phân loại
 *  - preview       : { type, config } — TÁI DÙNG renderer thật của Design System
 *  - resources     : { component[], css[], js[], library[] } — metadata kỹ thuật khai báo (không auto-scan)
 *                    component = DS component render UI · css/js = tài nguyên hệ thống · library = thư viện bên thứ 3
 *                    KHÓA KIẾN TRÚC: resources CHỈ là metadata audit hiển thị ở Admin (templates-page.js).
 *                    CẤM Runtime/Widget/loader đọc resources để tự load css/js — tránh sinh owner thứ hai.
 *  - headers       : { left, right } — nhãn cột content (khi template có)
 *  - inputs[]      : { label, demo } — slot trình bày + dữ liệu demo (không type, không nghiệp vụ)
 *  - headTitle / headDesc và 2 input đầu: metadata Widget cũ, giữ inert để tương thích
 *  - displayCases[] / spec
 */
(function (global) {
  'use strict';

  var DOMAIN_LABELS = {
    market: 'Thị trường',
    flow: 'Dòng tiền',
    community: 'Cộng đồng',
    personal: 'Cá nhân'
  };

  var HEAD_INPUT_COUNT = 2;

  function headInputs(t) {
    return [
      { key: 'title', label: 'Tiêu đề', demo: t.headTitle || t.name || '' },
      { key: 'description', label: 'Mô tả tiêu đề', demo: t.headDesc != null ? t.headDesc : '' }
    ];
  }

  function ensureHeadInputs(t) {
    if (!t.inputs) t.inputs = [];
    if (t.inputs[0] && t.inputs[0].key === 'title') return t;
    t.inputs = headInputs(t).concat(t.inputs);
    return t;
  }

  /*
   * SoT kiến trúc — Template CHỈ quyết định cách hiển thị.
   * Template KHÔNG biết nghiệp vụ (risk/breadth/flow…), KHÔNG biết kiểu dữ liệu
   * (số/chữ/%/tiền/enum), KHÔNG sinh output. Template chỉ mô tả các SLOT trình bày
   * và dữ liệu DEMO cho từng slot. Widget (Tầng 4) mới sinh output và tự quyết
   * output nào rơi vào slot nào (bind theo VỊ TRÍ). Số phần tử của một slot suy ra
   * trực tiếp từ dữ liệu (đếm phần tử ngăn bởi "|"), KHÔNG lưu slotCount.
   *
   * Data DEMO: bản chất chỉ trả lời "trông nó thế nào / hiển thị thế nào" —
   * là dữ liệu trình diễn, KHÔNG mang nghĩa sử dụng. Nút "Đồng bộ Template" chép
   * demo này về Widget chỉ để admin có khung nhìn khi thiết kế Widget mới, sau đó
   * admin thay bằng dữ liệu thật của Widget.
   *
   * Trạng thái UI KHÔNG phải slot (không khai trong inputs): tab/bộ lọc đang chọn
   * luôn mặc định phần tử đầu tiên; Top N = số phần tử có trong dữ liệu.
   */

  var TEMPLATES = [
    {
      id: 'TMP-SUMMARY',
      name: 'Cụm tổng quan / KPI',
      description: 'Cụm nhiều ô tóm tắt, mỗi ô hiển thị nhãn, giá trị và trạng thái.',
      headTitle: 'Tổng quan thị trường',
      headDesc: 'Chỉ số sàn · trạng thái phiên',
      domain: 'market',
      render: 'kpi',
      preview: { type: 'WGT-MKT-001', config: { sidebar: false, includeBreadth: false } },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css', 'market.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Nhãn', demo: 'Mục A | Mục B | Mục C' },
        { label: 'Giá trị', demo: '128.5 | 86.2 | 42.4' },
        { label: 'Mức thay đổi / trạng thái', demo: '0.68 | -0.42 | 0.21' }
      ],
      displayCases: ['Cụm KPI nhiều ô', 'Có trạng thái', 'Có dải tín hiệu / cảnh báo'],
      spec: 'Mỗi mục là một ô gồm nhãn, giá trị và trạng thái. Trạng thái dương, âm hoặc trung tính dùng biến thể màu tương ứng của Design System. Nếu có tín hiệu hoặc cảnh báo thì hiển thị một dải thông tin bên dưới cụm.'
    },
    {
      id: 'TMP-HEATMAP',
      name: 'Bản đồ nhiệt',
      description: 'Treemap các phần tử: diện tích ô theo trọng số, màu ô theo giá trị.',
      headTitle: 'Heatmap ngành',
      headDesc: 'Top 10 theo GTGD · màu = hiệu suất',
      domain: 'market',
      render: 'heatmap',
      preview: { type: 'WGT-MKT-004', config: { source: 'sector' } },
      resources: {
        component: ['squarified-treemap.js', 'block-templates.js'],
        css: ['block-templates.css', 'market-components.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Danh sách phần tử (nhãn)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D | Nhóm E | Nhóm F | Nhóm G | Nhóm H | Nhóm I | Nhóm K | Nhóm L | Nhóm M' },
        { label: 'Trọng số (kích thước ô)', demo: '320 | 280 | 210 | 180 | 150 | 120 | 95 | 80 | 65 | 50 | 30 | 20' },
        { label: 'Giá trị màu (%)', demo: '1.8 | -0.9 | 2.4 | 0.3 | -1.5 | 0.7 | 1.2 | -0.4 | 0.5 | -1.1 | 0.2 | -0.6' }
      ],
      displayCases: ['Treemap Top 10 theo trọng số', 'Ô gồm nhãn + giá trị màu'],
      spec: 'Chỉ hiển thị Top 10 phần tử có trọng số cao nhất (sắp theo cột kích thước giảm dần, lấy 10). Treemap: diện tích ∝ trọng số, màu theo giá trị (dương = xanh, âm = đỏ). Trong ô: nhãn + giá trị.'
    },
    {
      id: 'TMP-COM-STOCK-HEAT',
      name: 'Bản đồ nhiệt cổ phiếu cộng đồng',
      description: 'Treemap mã CP theo mức độ quan tâm cộng đồng; diện tích = quan tâm, màu = hiệu suất phiên.',
      headTitle: 'Cổ phiếu được quan tâm hàng đầu',
      headDesc: 'Diện tích = mức độ quan tâm · màu = hiệu suất phiên',
      domain: 'community',
      render: 'com-stock-heat',
      preview: { type: 'WGT-COM-001', config: { stocksOnly: true } },
      resources: {
        component: ['squarified-treemap.js', 'community-trending.js'],
        css: ['community.css', 'block-templates.css', 'watchlist.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Mã cổ phiếu', demo: 'VIN | VIC | VHM | VCB | HPG | SSI' },
        { label: 'Lượt quan tâm (kích thước)', demo: '639 | 629 | 569 | 426 | 156 | 180' },
        { label: 'Hiệu suất hôm nay (%)', demo: '1.2 | -0.8 | 2.1 | 0.4 | 3.1 | -0.5' }
      ],
      displayCases: ['Treemap Top 10 theo quan tâm cộng đồng'],
      spec: 'Top 10 mã theo mức độ quan tâm cộng đồng (giảm dần). Treemap: diện tích ∝ quan tâm, màu theo hiệu suất phiên.'
    },
    {
      id: 'TMP-TREND-LINE',
      name: 'Biểu đồ vùng nhiều chuỗi',
      description: 'Biểu đồ vùng dùng để so sánh nhiều chuỗi dữ liệu theo các mốc trên trục hoành.',
      headTitle: 'Thanh khoản lũy kế',
      headDesc: 'So sánh phiên hiện tại với trung bình quá khứ',
      domain: 'market',
      render: 'trend',
      preview: { type: 'WGT-MKT-007', config: { metric: 'volume' } },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css', 'market-components.css'],
        js: ['templates-preview.js'],
        library: ['ApexCharts']
      },
      inputs: [
        { label: 'Mốc trên trục hoành', demo: 'Mốc 1 | Mốc 2 | Mốc 3 | Mốc 4 | Mốc 5 | Mốc 6 | Mốc 7 | Mốc 8 | Mốc 9' },
        { label: 'Chuỗi dữ liệu A', demo: '1.2 | 2.8 | 4.1 | 5.6 | 7.0 | 8.4 | 10.1 | 12.0 | 13.5' },
        { label: 'Chuỗi dữ liệu B', demo: '1.0 | 2.4 | 3.6 | 5.0 | 6.2 | 7.5 | 9.0 | 10.6 | 12.1' },
        { label: 'Các tab so sánh', demo: 'Khoảng 1 | Khoảng 2 | Khoảng 3 | Khoảng 4' },
        { label: 'Danh sách bộ lọc', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' }
      ],
      displayCases: [
        'Có các tab so sánh',
        'Có bộ lọc lựa chọn',
        'Hai chuỗi dữ liệu trên cùng biểu đồ'
      ],
      spec: 'Hàng điều khiển gồm các tab so sánh và một bộ lọc lựa chọn. Bên dưới là biểu đồ vùng hiển thị hai chuỗi dữ liệu trên cùng trục.'
    },
    {
      id: 'TMP-NET-SUBJECT',
      name: 'Biểu đồ đối xứng hai phía',
      description: 'Hai danh sách đối xứng trái / phải theo nhóm chọn bằng tab; mỗi dòng gồm nhãn và giá trị.',
      headTitle: 'Mua / bán ròng theo mã',
      headDesc: 'Đối xứng — mua ròng (trái) vs bán ròng (phải)',
      domain: 'flow',
      render: 'net-subject',
      preview: { type: 'WGT-FLW-SUBJ-STOCK', config: { scope: 'stock', subject: 'retail', withHead: true, withSubjectTabs: true } },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css', 'flow.css'],
        js: ['templates-preview.js'],
        library: []
      },
      headers: {
        left: 'Top bên trái',
        right: 'Top bên phải'
      },
      inputs: [
        { label: 'Nhóm (tabs)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' },
        { label: 'Nhãn bên trái', demo: 'Mục T1 | Mục T2 | Mục T3 | Mục T4 | Mục T5' },
        { label: 'Giá trị bên trái', demo: '320 | 240 | 180 | 120 | 80' },
        { label: 'Nhãn bên phải', demo: 'Mục P1 | Mục P2 | Mục P3 | Mục P4 | Mục P5' },
        { label: 'Giá trị bên phải', demo: '300 | 210 | 160 | 110 | 70' }
      ],
      displayCases: ['Tabs chọn nhóm', 'Hai danh sách đối xứng: trái vs phải'],
      spec: 'Hàng tab chọn nhóm ở trên. Bên dưới là hai danh sách đối xứng hai phía; mỗi dòng gồm nhãn, thanh tỷ lệ và giá trị.'
    },
    {
      id: 'TMP-RANK-PERF',
      name: 'Bảng xếp hạng theo chỉ số',
      description: 'Danh sách Top N theo một chỉ số số học; thứ hạng lấy theo thứ tự dữ liệu mẫu.',
      headTitle: 'Top 10 ngành',
      headDesc: 'Xếp theo % hiệu suất phiên',
      domain: 'market',
      render: 'rank-perf',
      preview: { type: 'WGT-TOP-001', config: {} },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css', 'market-components.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Đối tượng (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5' },
        { label: 'Chỉ số (tự xếp theo thứ tự)', demo: '6.8 | 5.2 | 4.1 | 3.3 | 2.0' }
      ],
      displayCases: ['Danh sách Top N (1 cột)'],
      spec: 'Danh sách Top N một cột: thứ hạng, nhãn đối tượng và chỉ số căn phải.'
    },
    {
      id: 'TMP-FLOW-RANK-DUO',
      name: 'Đối chiếu xếp hạng hai chiều (Duo)',
      description: 'Đối chiếu Top N theo hai chiều vào / ra — radar hai cực và danh sách 2 cột.',
      headTitle: 'Dòng tiền vào / ra',
      headDesc: 'Đối chiếu Top mua ròng và bán ròng',
      domain: 'flow',
      render: 'rank-duo',
      preview: { type: 'WGT-FLW-SCORE', config: { duo: true, blockIds: ['stat-stock-out', 'stat-stock-in'] } },
      resources: {
        component: ['flow-score-top.js'],
        css: ['flow.css'],
        js: ['templates-preview.js'],
        library: ['ApexCharts']
      },
      inputs: [
        { label: 'Đối tượng chiều vào (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3' },
        { label: 'Score chiều vào (0–100)', demo: '92 | 85 | 78' },
        { label: 'Đối tượng chiều ra (nhãn)', demo: 'Mục 4 | Mục 5 | Mục 6' },
        { label: 'Score chiều ra (0–100)', demo: '74 | 68 | 55' }
      ],
      displayCases: ['Radar hai cực (vào / ra)', 'Danh sách 2 cột: một bên vào, một bên ra'],
      spec: 'Hai cột đối chiếu vào / ra; có thể kèm radar hai cực.'
    },
    {
      id: 'TMP-FLOW-RANK-SIGNAL',
      name: 'Xếp hạng kèm tín hiệu & chỉ báo rủi ro',
      description: 'Danh sách Top N kèm tín hiệu Cơ hội / Rủi ro và một chỉ báo rủi ro phụ; radar một hướng phía trên.',
      headTitle: 'Dòng tiền thông minh vào',
      headDesc: 'Tín hiệu Cơ hội / Rủi ro · cảnh báo FOMO',
      domain: 'flow',
      render: 'rank-signal',
      preview: { type: 'WGT-FLW-SCORE', config: { blockId: 'ex-tm-in' } },
      resources: {
        component: ['flow-score-top.js'],
        css: ['flow.css'],
        js: ['templates-preview.js'],
        library: ['ApexCharts']
      },
      inputs: [
        { label: 'Đối tượng (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5' },
        { label: 'Tín hiệu (Tích cực → Cơ hội / Tiêu cực → Rủi ro)', demo: 'Tích cực | Tích cực | Tiêu cực | Tích cực | Tiêu cực' },
        { label: 'Điểm (Score) 0–100', demo: '92 | 85 | 78 | 64 | 51' },
        { label: 'Chỉ báo rủi ro (0–100)', demo: '35 | 62 | 48 | 20 | 55' }
      ],
      displayCases: [
        'Radar một hướng + danh sách một cột',
        'Tín hiệu Cơ hội / Rủi ro theo cột',
        'Kèm chỉ báo rủi ro phụ (0–100)'
      ],
      spec: 'Danh sách một cột có tín hiệu Cơ hội / Rủi ro và chỉ báo rủi ro phụ; radar một hướng phía trên.'
    },
    {
      id: 'TMP-FLOW-SUMMARY',
      name: 'Thanh tỉ lệ hai phần kèm giá trị ròng',
      description: 'Mỗi nhóm một dòng: thanh tỉ lệ chia hai phần theo phần trăm và giá trị ròng có dấu.',
      headTitle: 'Tóm tắt dòng tiền phiên',
      headDesc: 'Tỉ lệ mua và net theo chủ thể',
      domain: 'flow',
      render: 'flow-summary',
      preview: { type: 'WGT-FLW-001', config: {} },
      resources: {
        component: [],
        css: ['flow.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Nhóm (nhãn)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' },
        { label: 'Tỉ lệ phần trái (%)', demo: '58 | 52 | 47 | 44' },
        { label: 'Giá trị ròng (± có dấu)', demo: '+320 | +80 | -40 | -360' }
      ],
      displayCases: ['Mỗi nhóm một thanh tỉ lệ hai phần', 'Giá trị ròng đổi màu theo dấu (+ / −)'],
      spec: 'Mỗi nhóm 1 dòng: thanh tỉ lệ hai phần theo phần trăm + giá trị ròng có dấu.'
    },
    {
      id: 'TMP-COMMUNITY-LIST',
      name: 'Danh sách xếp hạng',
      description: 'Danh sách xếp hạng tổng quát: mỗi dòng gồm thứ hạng, avatar (ảnh hoặc chữ cái), tên, chú thích phụ và dãy chỉ số tương tác 0..N (icon + giá trị).',
      headTitle: 'Chuyên gia nổi bật',
      headDesc: 'Xếp theo tổng lượt thích bài viết',
      domain: 'community',
      render: 'community-list',
      preview: { type: 'WGT-COM-003', config: {} },
      resources: {
        component: [],
        css: ['community.css'],
        js: ['templates-preview.js'],
        library: ['tabler-icons-3.44.0 (SVG outline)']
      },
      inputs: [
        { label: 'Đối tượng (tên)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5' },
        { label: 'Chú thích phụ', demo: 'Ghi chú 1 | Ghi chú 2 | Ghi chú 3 | Ghi chú 4 | Ghi chú 5' },
        { label: 'Avatar (URL ảnh — trống = chữ cái)', demo: ' |  |  |  | ' },
        { label: 'Chỉ số (type:value, phẩy = nhiều — type: like share comment post view follower score rank)', demo: 'like:1240, comment:320 | view:24000 | like:530, share:210, view:8200 | post:42, follower:1900 | score:92, rank:3' }
      ],
      displayCases: [
        'Mỗi dòng: thứ hạng · avatar · tên · chú thích phụ · dãy chỉ số',
        'Avatar: ảnh tròn nếu có URL, chữ cái đầu tên nếu trống',
        'Chỉ số 0..N — icon tra theo registry loại chỉ số (không if/else nghiệp vụ)',
        'Giá trị rút gọn K/M (1240 → 1.2K)'
      ],
      spec: 'Row: thứ hạng, avatar (ảnh/chữ cái), tên + chú thích phụ; dãy chỉ số 0..N — mỗi chỉ số gồm icon (registry theo type) + giá trị rút gọn.'
    },
    {
      id: 'TMP-COMMUNITY-STORY-TOP',
      name: 'Top N kèm tab thời gian',
      description: 'Danh sách Top N theo điểm xếp hạng, có tab chọn khung thời gian; mỗi dòng kèm dãy chỉ số phụ (icon + giá trị).',
      headTitle: 'Chủ đề tích cực hàng đầu',
      headDesc: 'Top N Topic/Story theo điểm Interest trong cửa sổ Ngày|Tuần|Tháng.',
      domain: 'community',
      render: 'community-story-top',
      preview: { type: 'WGT-COM-CHUDE-TOP', config: { storyOnly: true, period: 'week' } },
      resources: {
        component: [],
        css: ['community.css'],
        js: ['templates-preview.js'],
        library: ['tabler-icons-3.44.0 (SVG outline)']
      },
      inputs: [
        { label: 'Đối tượng (nhãn)', demo: 'Mục 1 | Mục 2 | Mục 3 | Mục 4 | Mục 5 | Mục 6 | Mục 7 | Mục 8 | Mục 9 | Mục 10' },
        { label: 'Điểm xếp hạng', demo: '9039 | 5790 | 5341 | 3901 | 3120 | 2880 | 2440 | 2100 | 1860 | 1540' },
        { label: 'Lượt xem', demo: '3850 | 2450 | 2620 | 2206 | 1840 | 1600 | 1420 | 1280 | 1100 | 980' },
        { label: 'Bình luận', demo: '94 | 63 | 43 | 17 | 14 | 31 | 22 | 18 | 12 | 9' },
        { label: 'Yêu thích', demo: '146 | 74 | 64 | 44 | 31 | 60 | 40 | 32 | 24 | 18' },
        { label: 'Khung thời gian (tab)', demo: 'Ngày | Tuần | Tháng' }
      ],
      displayCases: [
        'Tabs khung thời gian (ix-tabs — đồng bộ Design System)',
        'Danh sách Top N (hạng · tên · điểm xếp hạng căn phải, đủ chữ số)',
        'Dòng phụ: chỉ số view · comment · like (icon registry)',
        'Cắt danh sách theo Top N'
      ],
      spec: 'ix-tabs khung thời gian. Mỗi row: hạng · tên · điểm xếp hạng căn phải (cùng cỡ chữ tiêu đề, không rút gọn) · dãy chỉ số phụ (icon + giá trị).'
    },
    {
      id: 'TMP-COLLECTION',
      name: 'Danh sách theo dõi',
      description: 'Danh sách các đối tượng người dùng đang theo dõi; mỗi dòng gồm mã ngắn, tên đầy đủ, giá trị và % thay đổi.',
      headTitle: 'Watchlist',
      headDesc: 'Danh sách mã bạn đang theo dõi',
      domain: 'personal',
      render: 'collection',
      preview: { type: 'WGT-WAT-001', config: { withHead: true } },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css', 'watchlist.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Mã (nhãn ngắn)', demo: 'Mã A | Mã B | Mã C | Mã D' },
        { label: 'Tên đầy đủ', demo: 'Đối tượng 1 | Đối tượng 2 | Đối tượng 3 | Đối tượng 4' },
        { label: 'Giá trị', demo: '92.5 | 27.8 | 38.4 | 45.1' },
        { label: '% thay đổi', demo: '1.2 | -0.8 | 2.1 | 0.4' }
      ],
      displayCases: [
        'Danh sách đối tượng theo dõi (mỗi dòng một item)',
        'Row: mã ngắn · tên · giá trị · % thay đổi (màu theo dấu)'
      ],
      spec: 'Row: mã (nhãn ngắn), tên đầy đủ, giá trị, % thay đổi — màu tăng/giảm theo dấu %.'
    },
    {
      id: 'TMP-BREADTH',
      name: 'Độ rộng thị trường',
      description: 'Tab sàn + lưới 6 ô thống kê (toàn bộ / tăng / giảm / tham chiếu / trần / sàn) + thanh tỷ lệ tăng–giảm.',
      headTitle: 'Độ rộng thị trường',
      headDesc: 'Mã tăng / giảm / tham chiếu / trần / sàn theo từng sàn giao dịch.',
      domain: 'market',
      render: 'breadth',
      preview: { type: 'WGT-MKT-002', config: { withHead: false } },
      resources: {
        component: ['block-templates.js', 'breadth-block.js'],
        css: ['block-templates.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Tab sàn', demo: 'VN-Index | HOSE | HNX | UPCOM' },
        { label: 'Nhãn ô thống kê', demo: 'Toàn bộ | Mã tăng | Mã giảm | Mã tham chiếu | Mã tím trần | Mã sàn xanh' },
        { label: 'Giá trị ô', demo: '385 | 142 | 98 | 120 | 15 | 10' }
      ],
      displayCases: [
        'Tab sàn giao dịch (ix-tabs)',
        'Lưới 6 ô màu theo trạng thái (3 cột × 2 hàng)',
        'Thanh tỷ lệ tăng / giảm bên dưới'
      ],
      spec: 'Body: tab chọn sàn → lưới 6 ô (nhãn + số, màu theo biến thể Design System) → thanh tỷ lệ tăng/giảm. Không gồm Header Widget (Header thuộc Widget Definition).'
    },
    {
      id: 'TMP-DIVERGING-BARS',
      name: 'Biểu đồ cột hai chiều quanh trục 0',
      description: 'Cột dương (lên) / âm (xuống) quanh trục 0 theo các mốc trục hoành; tab chọn nhóm phía trên và một dòng chú thích.',
      headTitle: 'Giao dịch theo chủ thể',
      headDesc: 'Giá trị ròng theo phiên — dương phía trên, âm phía dưới trục 0.',
      domain: 'flow',
      render: 'diverging-bars',
      preview: { type: 'BLK-STK-FLOW', config: {} },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css'],
        js: ['templates-preview.js'],
        library: []
      },
      inputs: [
        { label: 'Nhóm (tabs)', demo: 'Nhóm A | Nhóm B | Nhóm C | Nhóm D' },
        { label: 'Dòng chú thích', demo: 'Giá trị ròng · Nhóm A · 10 mốc' },
        { label: 'Mốc trục hoành', demo: 'Mốc 1 | Mốc 2 | Mốc 3 | Mốc 4 | Mốc 5 | Mốc 6 | Mốc 7 | Mốc 8 | Mốc 9 | Mốc 10' },
        { label: 'Giá trị (+ / −)', demo: '320 | -120 | 210 | -80 | 150 | 90 | -60 | 240 | -180 | 70' }
      ],
      displayCases: [
        'Tabs chọn nhóm (ix-tabs)',
        'Cột dương lên trên / âm xuống dưới quanh trục 0',
        'Trục tung tự chia vạch theo dữ liệu; nhãn mốc bên dưới'
      ],
      spec: 'Body: tab chọn nhóm → dòng chú thích → biểu đồ cột hai chiều quanh trục 0 (trục tung suy ra từ dữ liệu, mỗi cột 1 mốc). Cột dương màu tăng, cột âm màu giảm (token Design System). Không gồm Header Widget (Header thuộc Widget Definition).'
    },
    {
      id: 'TMP-ZONE-POSITION',
      name: 'Vị trí hiện tại so với Hỗ trợ | Kháng cự',
      description: 'Thống kê vị trí giá hiện tại của Chủ thể so với vùng hỗ trợ và kháng cự trong từng giai đoạn lịch sử.',
      headTitle: 'Vị trí hiện tại so với Hỗ trợ | Kháng cự',
      headDesc: 'Vùng hỗ trợ / kháng cự gần nhất theo từng giai đoạn — thanh vị trí trực quan.',
      domain: 'market',
      render: 'zone-position',
      preview: { type: 'TMP-ZONE-POSITION', config: {} },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css'],
        js: ['templates-preview.js'],
        library: []
      },
      headers: {
        left: 'Hỗ trợ',
        right: 'Kháng cự'
      },
      inputs: [
        { label: 'Nhãn giai đoạn', demo: '3 tháng | 6 tháng | 1 năm | Lịch sử' },
        { label: 'Vùng bên trái (text)', demo: '18.20 - 18.80 | 17.50 - 18.40 | 16.80 - 18.05 | 16.05 - 18.05' },
        { label: 'Vùng bên phải (text)', demo: '22.40 - 23.00 | 22.10 - 23.50 | 21.90 - 24.00 | 22.05 - 23.10' },
        { label: 'Giá trị giữa', demo: '21.55 | 21.55 | 21.55 | 21.55' },
        { label: '% bên trái (±)', demo: '-16 | -18 | -22 | -16' },
        { label: '% bên phải (±)', demo: '3 | 5 | 8 | 3' }
      ],
      displayCases: [
        'Mỗi giai đoạn một dòng độc lập',
        'Thanh vị trí: trái / phải quanh vạch giá hiện tại; tỉ lệ suy ra từ |%|',
        'Dòng phụ: vùng trái · giá giữa · vùng phải',
        'Chỉ nhận các giai đoạn đã có đủ dữ liệu (Widget lọc trước)'
      ],
      spec: 'Body: danh sách dòng giai đoạn. Mỗi dòng = nhãn giai đoạn → nhãn trái/phải (chrome) + thanh vị trí (đoạn trái/phải màu token DS, % trên thanh, vạch giữa = giá hiện tại) → vùng trái · giá giữa · vùng phải. Tỉ lệ thanh suy ra từ |% trái| : |% phải|. Không tính nghiệp vụ; không gồm Header Widget.'
    },
    {
      id: 'TMP-SR-HISTORY',
      name: 'Lịch sử Hỗ trợ - Kháng cự',
      description: 'Một khung thời gian (tab) — vị trí giá hiện tại giữa vùng hỗ trợ và kháng cự, kèm khoảng giá và khoảng % còn lại.',
      headTitle: 'Lịch sử Hỗ trợ - Kháng cự',
      headDesc: 'Hỗ trợ · Hiện tại · Kháng cự theo khung thời gian.',
      domain: 'market',
      render: 'sr-history',
      preview: { type: 'TMP-SR-HISTORY', config: {} },
      resources: {
        component: ['block-templates.js'],
        css: ['block-templates.css'],
        js: ['templates-preview.js'],
        library: []
      },
      headers: {
        left: 'Hỗ trợ',
        center: 'Hiện tại',
        right: 'Kháng cự'
      },
      inputs: [
        { label: 'Tab khung thời gian', demo: '1 tháng | 3 tháng | 1 năm | Lịch sử' },
        { label: 'Vùng hỗ trợ (text)', demo: '18.20–18.60 | 17.80–18.40 | 16.50–18.00 | 15.20–17.80' },
        { label: 'Giá hiện tại', demo: '20.85 | 20.85 | 20.85 | 20.85' },
        { label: 'Vùng kháng cự (text)', demo: '21.20–21.60 | 22.00–22.80 | 23.10–24.00 | 22.50–24.20' },
        { label: '% còn tới hỗ trợ (±)', demo: '-15 | -18 | -22 | -25' },
        { label: '% còn tới kháng cự (±)', demo: '3 | 6 | 10 | 12' }
      ],
      displayCases: [
        'Tab ix-segmented: 1 tháng · 3 tháng · 1 năm · Lịch sử',
        'Hàng nhãn: Hỗ trợ | Hiện tại | Kháng cự',
        'Thanh: đoạn hỗ trợ · chấm hiện tại · đoạn kháng cự (tỉ lệ từ |%|)',
        'Khoảng giá dưới thanh; hint «Còn ±% nữa» hai bên'
      ],
      spec: 'Body: tab khung thời gian (ix-segmented) → panel một khung: nhãn 3 cột → thanh trái/phải + chấm giữa → vùng giá 3 cột → hint % hai bên. Tỉ lệ thanh suy ra từ |% hỗ trợ| : |% kháng cự|. Không tính nghiệp vụ; không gồm Header Widget.'
    }
  ];

  TEMPLATES.forEach(function (template) {
    ensureHeadInputs(template);
  });

  function domainLabel(key) { return DOMAIN_LABELS[key] || key; }
  function all() { return TEMPLATES.slice(); }
  function byId(id) {
    for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i];
    return null;
  }
  function stats() {
    return { templates: TEMPLATES.length, domains: Object.keys(DOMAIN_LABELS).length };
  }

  global.TemplatesCatalog = {
    DOMAIN_LABELS: DOMAIN_LABELS,
    TEMPLATES: TEMPLATES,
    HEAD_INPUT_COUNT: HEAD_INPUT_COUNT,
    all: all,
    byId: byId,
    domainLabel: domainLabel,
    stats: stats
  };
})(window);
