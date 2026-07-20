/**
 * ADM-SYS-007 · Tầng 4 (Widget) — SoT thay thế Thư viện Widget.
 *
 * Với việc có Template, Widget KHÔNG còn quan tâm giao diện. Widget chỉ khai báo:
 *  - Có DỮ LIỆU ĐẦU RA gì (ký hiệu · tên · kiểu) — kết hợp Template là đủ để hiển thị.
 *  - Chọn TEMPLATE hiển thị.
 *  - Cần DỮ LIỆU ĐẦU VÀO gì, lấy từ NGUỒN nào (Tầng 3 | Tầng 2 | Tầng 1) — không bắt buộc
 *    phải qua Tầng 3, có thể lấy trực tiếp Tầng 1 (vd dữ liệu thị trường từ DNSE).
 *  - ĐẶC TẢ THUẬT TOÁN: mô tả cách xử lý đầu vào → đầu ra (dùng ký hiệu + phép toán).
 *
 * Tự chứa — KHÔNG phụ thuộc Thư viện Widget (widget-library-*). Template lấy tên từ
 * TemplatesCatalog nếu có, nếu không dùng tên dự phòng bên dưới.
 */
(function (global) {
  'use strict';

  /* Tên hiển thị dự phòng của Template (khi chưa nạp TemplatesCatalog).
   * KHÔNG chứa "req" nghiệp vụ/kiểu dữ liệu: Template không ràng buộc Widget theo
   * nghiệp vụ hay kiểu dữ liệu. Việc một Widget có dùng được một Template hay không
   * do khả năng biểu diễn của Template với CẤU TRÚC dữ liệu của Widget quyết định
   * (Chart ≠ List ≠ Grid), không phải tên Widget hay loại dữ liệu. */
  var TEMPLATE_ROLES = {
    'TMP-SUMMARY': { name: 'Summary / Overview' },
    'TMP-HEATMAP': { name: 'Heatmap' },
    'TMP-TREND-LINE': { name: 'Trend / Multi-series Area Line' },
    'TMP-NET-SUBJECT': { name: 'Net-flow theo chủ thể' },
    'TMP-RANK-PERF': { name: 'Ranking · Hiệu suất' },
    'TMP-FLOW-RANK-DUO': { name: 'Ranking · Dòng tiền đối chiếu (Duo)' },
    'TMP-FLOW-RANK-SIGNAL': { name: 'Ranking · Dòng tiền thông minh (Signal)' },
    'TMP-FLOW-SUMMARY': { name: 'Flow Summary' },
    'TMP-COMMUNITY-LIST': { name: 'Community List / Ranking' },
    'TMP-COMMUNITY-CHUDE-TOP': { name: 'Chủ đề tích cực hàng đầu' },
    'TMP-COMMUNITY-STORY-TOP': { name: 'Chủ đề tích cực hàng đầu (alias)' },
    'TMP-COLLECTION': { name: 'Collection' },
    'TMP-BREADTH': { name: 'Độ rộng thị trường' },
    'TMP-DIVERGING-BARS': { name: 'Biểu đồ cột hai chiều quanh trục 0' }
  };

  var SOURCE_LABELS = {
    L1: '① Dữ liệu thô',
    L2: '② Chuẩn hóa',
    L3: '③ Giải thuật'
  };

  /* Nhãn NGUỒN của từng đầu ra: giá trị hiển thị lấy từ tầng nào, hay do widget tự tính. */
  var SRC_OUT_LABELS = {
    L1: 'Tầng 1',
    L2: 'Tầng 2',
    L3: 'Tầng 3',
    L4: 'Tầng 4',
    calc: 'Tính toán cục bộ'
  };
  var SRC_OUT_KEYS = ['L1', 'L2', 'L3', 'L4', 'calc'];
  var OUTPUT_TYPES = ['text', 'số', '%', 'enum', 'tiền', 'datetime'];

  /* Rút gọn khai báo đầu ra: sym · name · type · role · demo (giá trị mẫu, ngăn bởi "|") ·
     src = nguồn dữ liệu đầu ra (L1/L2/L3/L4/calc). calc = kết quả mô tả trong Đặc tả thuật toán. */
  function o(sym, name, type, role, demo, src) { return { sym: sym, name: name, type: type, role: role, demo: demo != null ? demo : '', src: src || 'L2' }; }
  /* Rút gọn khai báo đầu vào = TRƯỜNG DỮ LIỆU cụ thể: ký hiệu (sym) · tên (name) ·
     kiểu dữ liệu (type) · nguồn cấp (source: L1/L2/L3) · ref chuẩn hóa (ref).
     Đầu vào là con số/dữ liệu, KHÔNG phải tên nguồn — nguồn chỉ là metadata "lấy từ đâu". */
  function i(sym, name, type, source, ref) {
    return { sym: sym, name: name, type: type, source: source || 'L2', ref: ref || '' };
  }

  /* Net theo chủ thể — Definition V2, outputs map theo 5 slot của TMP-NET-SUBJECT:
     tab chủ thể · nhãn trái · giá trị trái · nhãn phải · giá trị phải. */
  function netSubjectV2(id, entityName, scope) {
    var entityDemo = {
      stock: { buy: 'VCB | HPG | SSI | MWG | FPT', sell: 'VIC | NVL | PDR | DXG | HSG' },
      sector: { buy: 'Ngân hàng | Thép | Chứng khoán | Bán lẻ | CNTT', sell: 'BĐS | Xây dựng | Dầu khí | Điện | Dược' },
      family: { buy: 'Họ ngân hàng | Họ thép | Họ bán lẻ | Họ chứng khoán | Họ CNTT', sell: 'Họ BĐS | Họ xây dựng | Họ dầu khí | Họ điện | Họ dược' },
      'chu-de': { buy: 'AI | Xuất khẩu | Digi bank | Năng lượng | Đầu tư công', sell: 'Bất động sản | Thép | Logistics | Dược | Xây dựng' }
    };
    var demo = entityDemo[scope] || entityDemo.stock;
    var netInputs = [
      { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'buy_value' },
      { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'sell_value' }
    ];
    return {
      schemaVersion: 2,
      id: id,
      iconKey: 'arrows-left-right',
      title: 'Thống kê mua/bán ròng theo ' + entityName,
      description: 'Đối chiếu ' + entityName + ' được MUA RÒNG nhiều nhất (cột trái) và BÁN RÒNG nhiều nhất (cột phải) theo từng chủ thể (Cá nhân · Tổ chức · Tự doanh · Khối ngoại).',
      templateRef: 'TMP-NET-SUBJECT',
      outputs: [
        {
          symbol: 'subject', name: 'Chủ thể (tab)', type: 'enum',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Cá nhân | Tổ chức | Tự doanh | Khối ngoại'
        },
        {
          symbol: 'buy_entity', name: 'Mua ròng — ' + entityName, type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: demo.buy
        },
        {
          symbol: 'buy_net', name: 'Giá trị mua ròng', type: 'tiền',
          source: { kind: 'calculated' },
          demo: '320 | 240 | 180 | 120 | 80',
          formulaSpec: 'Giá trị mua ròng = Giá trị mua − Giá trị bán của chủ thể theo ' + entityName + ' (lấy phần dương, xếp giảm dần Top N)'
        },
        {
          symbol: 'sell_entity', name: 'Bán ròng — ' + entityName, type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: demo.sell
        },
        {
          symbol: 'sell_net', name: 'Giá trị bán ròng', type: 'tiền',
          source: { kind: 'calculated' },
          demo: '300 | 210 | 160 | 110 | 70',
          formulaSpec: 'Giá trị bán ròng = Giá trị bán − Giá trị mua của chủ thể theo ' + entityName + ' (lấy phần dương, xếp giảm dần Top N)'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            subject: { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'subject' },
            buy_entity: { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'entity_code' },
            sell_entity: { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'entity_code' }
          },
          calculatedInputs: {
            buy_net: netInputs,
            sell_net: netInputs
          }
        }
      }
    };
  }

  /* Duo vào/ra — Definition V2, outputs map đúng 4 slot của TMP-FLOW-RANK-DUO. */
  function flowDuoV2(id, entityName, entityType) {
    var entityDemo = {
      stock: {
        incoming: 'FPT | VCB | HPG | MWG | SSI',
        outgoing: 'VIC | NVL | PDR | DXG | HSG'
      },
      sector: {
        incoming: 'Ngân hàng | Thép | Chứng khoán | Bán lẻ | CNTT',
        outgoing: 'Bất động sản | Xây dựng | Dầu khí | Điện | Dược'
      },
      family: {
        incoming: 'Họ ngân hàng | Họ thép | Họ bán lẻ | Họ chứng khoán | Họ CNTT',
        outgoing: 'Họ BĐS | Họ xây dựng | Họ dầu khí | Họ điện | Họ dược'
      },
      'chu-de': {
        incoming: 'AI | Xuất khẩu | Digi bank | Năng lượng | Đầu tư công',
        outgoing: 'Bất động sản | Thép | Logistics | Dược | Xây dựng'
      }
    };
    var demo = entityDemo[entityType] || entityDemo.stock;
    var incomingInputs = [
      { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'active_buy_value' }
    ];
    var outgoingInputs = [
      { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'active_sell_value' }
    ];
    return {
      schemaVersion: 2,
      id: id,
      iconKey: 'arrows-exchange',
      title: 'TOP 10 ' + entityName + ' — dòng tiền vào / ra mạnh nhất',
      description: 'Đối chiếu Top 10 ' + entityName + ' có dòng tiền chủ động VÀO mạnh nhất và RA mạnh nhất trong phiên — radar 20 điểm + list 2 cột.',
      templateRef: 'TMP-FLOW-RANK-DUO',
      outputs: [
        {
          symbol: 'entity_in', name: entityName + ' — chiều vào', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: demo.incoming
        },
        {
          symbol: 'score_in', name: 'Điểm vào 0–100', type: 'số',
          source: { kind: 'calculated' },
          demo: '92 | 85 | 78 | 64 | 51',
          formulaSpec: 'Điểm vào = Chuẩn hóa Giá trị mua chủ động của ' + entityName.toLowerCase() + ' về thang 0–100, xếp giảm dần Top 10'
        },
        {
          symbol: 'entity_out', name: entityName + ' — chiều ra', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: demo.outgoing
        },
        {
          symbol: 'score_out', name: 'Điểm ra 0–100', type: 'số',
          source: { kind: 'calculated' },
          demo: '90 | 82 | 74 | 63 | 55',
          formulaSpec: 'Điểm ra = Chuẩn hóa Giá trị bán chủ động của ' + entityName.toLowerCase() + ' về thang 0–100, xếp giảm dần Top 10'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            entity_in: { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'entity_code' },
            entity_out: { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'entity_code' }
          },
          calculatedInputs: {
            score_in: incomingInputs,
            score_out: outgoingInputs
          }
        }
      }
    };
  }

  /* Dòng tiền thông minh — Definition V2, map đúng 4 slot của TMP-FLOW-RANK-SIGNAL:
     đối tượng · tín hiệu · điểm · chỉ báo rủi ro. */
  function flowSignalV2(id, entityName, entityType, dir) {
    var into = dir === 'in';
    var entityDemo = {
      stock: 'VCB | HPG | SSI | MWG | FPT',
      sector: 'Ngân hàng | Thép | Chứng khoán | Bán lẻ | CNTT',
      family: 'Họ ngân hàng | Họ thép | Họ bán lẻ | Họ chứng khoán | Họ CNTT',
      'chu-de': 'AI | Xuất khẩu | Digi bank | Năng lượng | Đầu tư công'
    };
    var smartMoneyField = into ? 'active_buy_value' : 'active_sell_value';
    var smartMoneyInput = [
      { layer: 'L2', ref: 'NORM-FLOW-NET', field: smartMoneyField }
    ];
    return {
      schemaVersion: 2,
      id: id,
      iconKey: 'activity',
      title: 'TOP 10 ' + entityName + ' có dòng tiền thông minh ' + (into ? 'vào' : 'ra') + ' mạnh nhất',
      description: 'Xếp hạng ' + entityName + ' theo dòng tiền thông minh (lệnh lô lớn chủ động) ' + (into ? 'vào — Tích cực' : 'ra — Tiêu cực') + ', kèm cảnh báo rủi ro FOMO. Tín hiệu Cơ hội / Rủi ro — KHÔNG phải khuyến nghị mua/bán.',
      templateRef: 'TMP-FLOW-RANK-SIGNAL',
      outputs: [
        {
          symbol: 'entity', name: entityName, type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: entityDemo[entityType] || entityDemo.stock
        },
        {
          symbol: 'sentiment', name: 'Tích cực / Tiêu cực', type: 'enum',
          source: { kind: 'calculated' },
          demo: into
            ? 'Tích cực | Tích cực | Tích cực | Tích cực | Tích cực'
            : 'Tiêu cực | Tiêu cực | Tiêu cực | Tiêu cực | Tiêu cực',
          formulaSpec: 'Tín hiệu = ' + (into ? 'Tích cực khi dòng tiền thông minh chủ động vào' : 'Tiêu cực khi dòng tiền thông minh chủ động ra')
        },
        {
          symbol: 'score', name: 'Điểm dòng tiền thông minh 0–100', type: 'số',
          source: { kind: 'calculated' },
          demo: '92 | 85 | 78 | 64 | 51',
          formulaSpec: 'Điểm dòng tiền thông minh = Chuẩn hóa cường độ dòng tiền lô lớn chủ động ' + (into ? 'mua' : 'bán') + ' về thang 0–100, xếp giảm dần Top 10'
        },
        {
          symbol: 'fomo_risk', name: 'Chỉ báo rủi ro 0–100', type: 'số',
          source: { kind: 'system', layer: 'L3' },
          demo: '35 | 62 | 48 | 20 | 55'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            entity: { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'entity_code' },
            fomo_risk: { layer: 'L3', ref: 'ALG-FLW-STATS', field: 'fomo_risk' }
          },
          calculatedInputs: {
            sentiment: smartMoneyInput,
            score: smartMoneyInput
          }
        }
      }
    };
  }

  /* Dòng tiền thông minh vào/ra — legacy cho các widget chưa audit V2. */
  function flowSignal(id, entityName, dir) {
    var into = dir === 'in';
    return {
      id: id, domain: 'Dòng tiền',
      title: 'TOP 10 ' + entityName + ' có dòng tiền thông minh ' + (into ? 'vào' : 'ra') + ' mạnh nhất',
      description: 'Xếp hạng ' + entityName + ' theo dòng tiền thông minh (lệnh lô lớn chủ động) ' + (into ? 'vào — Tích cực' : 'ra — Tiêu cực') + ', kèm cảnh báo rủi ro FOMO. Tín hiệu Cơ hội / Rủi ro — KHÔNG phải khuyến nghị mua/bán.',
      outputs: [
        o('entity', entityName, 'text', 'entity', 'VCB | HPG | SSI | MWG | FPT', 'L2'),
        o('sentiment', 'Tích cực / Tiêu cực', 'enum', 'sentiment', into ? 'Tích cực | Tích cực | Tích cực | Tích cực | Tích cực' : 'Tiêu cực | Tiêu cực | Tiêu cực | Tiêu cực | Tiêu cực', 'calc'),
        o('score', 'Điểm dòng tiền thông minh 0–100', 'số', 'score', '92 | 85 | 78 | 64 | 51', 'calc'),
        o('fomo_risk', 'Rủi ro FOMO 0–100', 'số', 'risk', '35 | 62 | 48 | 20 | 55', 'L3'),
        o('rank', 'Xếp hạng', 'số', 'rank', '1 | 2 | 3 | 4 | 5', 'calc'),
        o('signal', 'Tín hiệu Cơ hội / Rủi ro', 'enum', 'signal', into ? 'Cơ hội | Cơ hội | Cơ hội | Cơ hội | Cơ hội' : 'Rủi ro | Rủi ro | Rủi ro | Rủi ro | Rủi ro', 'calc')
      ],
      template: 'TMP-FLOW-RANK-SIGNAL',
      inputs: [
        i('entity_code', 'Mã ' + entityName, 'text', 'L2', 'NORM-FLOW-NET'),
        i('smart_money_value', 'Giá trị dòng tiền lô lớn chủ động (' + (into ? 'mua' : 'bán') + ')', 'tiền', 'L2', 'NORM-FLOW-NET'),
        i('price_change_pct', '% biến động giá trong phiên', '%', 'L2', 'NORM-STOCK-SNAP'),
        i('fomo_risk', 'Điểm rủi ro FOMO (0–100)', 'số', 'L3', 'ALG-FLW-STATS')
      ],
      algorithmSpec: 'Điểm dòng tiền thông minh = Chuẩn hóa cường độ dòng tiền lô lớn về thang 0–100\n' +
        (into ? 'Tích cực / Tiêu cực = Tích cực (dòng tiền vào)\n' : 'Tích cực / Tiêu cực = Tiêu cực (dòng tiền ra)\n') +
        'Tín hiệu Cơ hội / Rủi ro = Suy từ Điểm dòng tiền thông minh và % biến động giá\n' +
        'Xếp hạng = Vị trí trong Top 10 theo Điểm dòng tiền thông minh'
    };
  }

  function heatmapGroup(id, entityName, groupKey) {
    var nameDemo = {
      sector: 'Ngân hàng | BĐS | Chứng khoán | Thép | Bán lẻ | Dầu khí | CNTT | Xây dựng | Điện | Dược',
      family: 'Họ ngân hàng | Họ thép | Họ bán lẻ | Họ chứng khoán | Họ BĐS | Họ dầu khí | Họ CNTT | Họ xây dựng | Họ điện | Họ dược',
      'chu-de': 'AI | Xuất khẩu | Digi bank | Năng lượng | Bất động sản | Thép | Bán lẻ | Logistics | Dược | Xây dựng'
    };
    return {
      schemaVersion: 2,
      id: id,
      iconKey: 'layout-grid',
      title: 'Biểu đồ ' + entityName,
      description: 'Top 10 ' + entityName.toLowerCase() + ' có GTGD cao nhất — diện tích = GTGD, màu = hiệu suất phiên.',
      templateRef: 'TMP-HEATMAP',
      outputs: [
        {
          symbol: 'name',
          name: 'Tên ' + entityName.toLowerCase(),
          type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: nameDemo[groupKey] || nameDemo.sector
        },
        {
          symbol: 'weight',
          name: 'GTGD (kích thước ô)',
          type: 'tiền',
          source: { kind: 'calculated' },
          demo: '320 | 280 | 210 | 180 | 150 | 120 | 95 | 80 | 65 | 50',
          formulaSpec: 'GTGD nhóm = Tổng GTGD (giá × KL) các mã thành viên trong nhóm'
        },
        {
          symbol: 'perf',
          name: 'Hiệu suất hôm nay',
          type: '%',
          source: { kind: 'calculated' },
          demo: '1.8 | -0.9 | 2.4 | 0.3 | -1.5 | 0.7 | 1.2 | -0.4 | 0.5 | -1.1',
          formulaSpec: 'Hiệu suất hôm nay = Bình quân gia quyền % thay đổi giá theo GTGD của các mã thành viên trong nhóm'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            name: { layer: 'L2', ref: 'NORM-HEATMAP', field: 'group_name' }
          },
          calculatedInputs: {
            weight: [
              { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'trade_value' },
              { layer: 'L2', ref: 'NORM-HEATMAP', field: 'group_key' }
            ],
            perf: [
              { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'change_pct' },
              { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'trade_value' },
              { layer: 'L2', ref: 'NORM-HEATMAP', field: 'group_key' }
            ]
          }
        }
      }
    };
  }

  function rankPerf(id, entityName) {
    var entityLabel = entityName.toLowerCase();
    var formulaSpec = 'Xếp hạng = Vị trí sau khi sắp ' + entityLabel + ' theo Hiệu suất giảm dần (Top 10)';
    return {
      schemaVersion: 2,
      id: id,
      iconKey: 'chart-bar',
      title: 'Top 10 ' + entityName + ' có hiệu suất cao nhất',
      description: 'Bảng xếp hạng Top 10 ' + entityName + ' theo hiệu suất (bình quân gia quyền vốn hóa) trong phiên.',
      templateRef: 'TMP-RANK-PERF',
      outputs: [
        {
          symbol: 'name', name: 'Tên ' + entityLabel, type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Ngân hàng | Thép | Chứng khoán | Bán lẻ | Dầu khí'
        },
        {
          symbol: 'perf', name: 'Hiệu suất', type: '%',
          source: { kind: 'system', layer: 'L2' },
          demo: '3.2 | 2.8 | 2.1 | 1.6 | 0.9'
        },
        {
          symbol: 'rank', name: 'Xếp hạng', type: 'số',
          source: { kind: 'calculated' },
          demo: '1 | 2 | 3 | 4 | 5',
          formulaSpec: formulaSpec
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            name: { layer: 'L2', ref: 'NORM-HEATMAP', field: 'name' },
            perf: { layer: 'L2', ref: 'NORM-HEATMAP', field: 'perf' }
          },
          calculatedInputs: {
            rank: [
              { layer: 'L2', ref: 'NORM-HEATMAP', field: 'name' },
              { layer: 'L2', ref: 'NORM-HEATMAP', field: 'perf' }
            ]
          }
        }
      }
    };
  }

  var WIDGETS = [
    /* ===================== THỊ TRƯỜNG ===================== */
    {
      schemaVersion: 2,
      id: 'WGT-MKT-001',
      iconKey: 'chart-line',
      title: 'Tổng quan thị trường',
      description: 'Bảng chỉ số các sàn (VN-Index · HNX-Index · UPCOM) kèm giá trị, % thay đổi và trạng thái; bổ sung chỉ số tăng trưởng IG/PG toàn thị trường.',
      templateRef: 'TMP-SUMMARY',
      outputs: [
        {
          symbol: 'index_name', name: 'Tên chỉ số / sàn', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'VN-Index | HNX-Index | UPCOM'
        },
        {
          symbol: 'index_value', name: 'Giá trị chỉ số', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '1284.5 | 231.8 | 92.4'
        },
        {
          symbol: 'change_pct', name: '% thay đổi', type: '%',
          source: { kind: 'system', layer: 'L2' },
          demo: '0.68 | -0.42 | 0.21'
        },
        {
          symbol: 'status', name: 'Trạng thái (tăng/giảm/tham chiếu)', type: 'enum',
          source: { kind: 'system', layer: 'L2' },
          demo: 'tăng | giảm | tăng'
        },
        {
          symbol: 'ig_pg', name: 'IG / PG', type: 'số',
          source: { kind: 'calculated' },
          demo: '1.24 | 0.86',
          formulaSpec: 'IG / PG = Chỉ số tăng trưởng IG kết hợp Chỉ số tăng trưởng PG'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            index_name: { layer: 'L2', ref: 'NORM-INDEX-SNAPSHOT', field: 'index_name' },
            index_value: { layer: 'L2', ref: 'NORM-INDEX-SNAPSHOT', field: 'index_value' },
            change_pct: { layer: 'L2', ref: 'NORM-INDEX-SNAPSHOT', field: 'index_change_pct' },
            status: { layer: 'L2', ref: 'NORM-INDEX-SNAPSHOT', field: 'index_status' }
          },
          calculatedInputs: {
            ig_pg: [
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'ig' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'pg' }
            ]
          }
        }
      }
    },
    {
      schemaVersion: 2,
      id: 'WGT-MKT-002',
      iconKey: 'layout-grid',
      title: 'Độ rộng thị trường',
      description: 'Số mã tăng / giảm / tham chiếu / trần / sàn theo từng sàn giao dịch.',
      templateRef: 'TMP-BREADTH',
      outputs: [
        {
          symbol: 'exchange', name: 'Tab sàn', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'HOSE | HNX | UPCOM'
        },
        {
          symbol: 'stat_labels', name: 'Nhãn ô thống kê', type: 'text',
          source: { kind: 'calculated' },
          demo: 'Toàn bộ | Mã tăng | Mã giảm | Mã tham chiếu | Mã tím trần | Mã sàn xanh',
          formulaSpec: 'Nhãn ô thống kê = Toàn bộ | Mã tăng | Mã giảm | Mã tham chiếu | Mã tím trần | Mã sàn xanh'
        },
        {
          symbol: 'stat_values', name: 'Giá trị ô', type: 'số',
          source: { kind: 'calculated' },
          demo: '385 | 142 | 98 | 120 | 15 | 10',
          formulaSpec: 'Giá trị ô = Toàn bộ | Số mã tăng | Số mã giảm | Số mã tham chiếu | Số mã trần | Số mã sàn'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            exchange: { layer: 'L2', ref: 'NORM-BREADTH', field: 'exchange' }
          },
          calculatedInputs: {
            stat_labels: [],
            stat_values: [
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'adv_count' },
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'dec_count' },
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'unch_count' },
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'ceiling_count' },
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'floor_count' }
            ]
          }
        }
      },
      algorithmSpec: 'Trạng thái độ rộng = Tích cực khi Số mã tăng > Số mã giảm; Tiêu cực khi Số mã tăng < Số mã giảm; Trung tính khi bằng nhau'
    },
    /* Definition V2 — outputs map 3 slot của TMP-SUMMARY (Nhãn · Giá trị · Trạng thái);
       signal_text = dải tín hiệu / cảnh báo bên dưới cụm (theo spec Template). */
    {
      schemaVersion: 2,
      id: 'WGT-MKT-RISK',
      iconKey: 'alert-triangle',
      title: 'Rủi ro & Tín hiệu',
      description: 'Cảnh báo tự động từ độ rộng · dòng tiền · vùng giá thị trường.',
      templateRef: 'TMP-SUMMARY',
      outputs: [
        {
          symbol: 'signal_label', name: 'Tên tín hiệu', type: 'text',
          source: { kind: 'calculated' },
          demo: 'Độ rộng yếu | Bán ròng mạnh',
          formulaSpec: 'Tên tín hiệu = Tên điều kiện rủi ro được kích hoạt'
        },
        {
          symbol: 'score', name: 'Điểm rủi ro', type: 'số',
          source: { kind: 'calculated' },
          demo: '2',
          formulaSpec: 'Điểm rủi ro = Tổng trọng số các điều kiện: độ rộng yếu · bán ròng mạnh · chỉ số giảm · giá gần biên'
        },
        {
          symbol: 'severity', name: 'Mức độ (thấp/cao)', type: 'enum',
          source: { kind: 'calculated' },
          demo: 'cao',
          formulaSpec: 'Mức độ = Cao khi có từ 2 điều kiện trở lên; ngược lại Thấp'
        },
        {
          symbol: 'signal_text', name: 'Nội dung cảnh báo', type: 'text',
          source: { kind: 'calculated' },
          demo: 'Dòng tiền rút khỏi nhóm vốn hóa lớn — thận trọng',
          formulaSpec: 'Nội dung cảnh báo = Mô tả điều kiện rủi ro đang kích hoạt'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {},
          calculatedInputs: {
            signal_label: [
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'adv_dec_ratio' },
              { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'market_net_value' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_change_pct' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_range_pos' }
            ],
            score: [
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'adv_dec_ratio' },
              { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'market_net_value' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_change_pct' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_range_pos' }
            ],
            severity: [
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'adv_dec_ratio' },
              { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'market_net_value' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_change_pct' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_range_pos' }
            ],
            signal_text: [
              { layer: 'L2', ref: 'NORM-BREADTH', field: 'adv_dec_ratio' },
              { layer: 'L2', ref: 'NORM-FLOW-NET', field: 'market_net_value' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_change_pct' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'index_range_pos' }
            ]
          }
        }
      }
    },
    {
      schemaVersion: 2,
      id: 'WGT-MKT-003',
      iconKey: 'trending-up',
      title: 'Top biến động',
      description: 'Danh sách mã tăng / giảm mạnh nhất phiên.',
      templateRef: 'TMP-RANK-PERF',
      outputs: [
        {
          symbol: 'ticker', name: 'Mã cổ phiếu', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'HPG | SSI | MWG | VCB | FPT'
        },
        {
          symbol: 'change_pct', name: '% thay đổi', type: '%',
          source: { kind: 'system', layer: 'L2' },
          demo: '6.8 | 5.2 | 4.1 | 3.3 | 2.0'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            ticker: { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'ticker' },
            change_pct: { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'change_pct' }
          },
          calculatedInputs: {}
        }
      },
      algorithmSpec: 'Sắp theo % thay đổi giảm dần cho Top tăng mạnh hoặc tăng dần cho Top giảm mạnh.\n' +
        'Thứ hạng hiển thị được suy ra từ vị trí phần tử sau khi sắp xếp, không lưu thành output.'
    },
    heatmapGroup('WGT-MKT-004', 'Ngành', 'sector'),
    heatmapGroup('WGT-MKT-005', 'Hệ sinh thái', 'family'),
    heatmapGroup('WGT-MKT-006', 'Chủ đề', 'chu-de'),
    {
      schemaVersion: 2,
      id: 'WGT-MKT-007',
      iconKey: 'chart-area-line',
      title: 'Khối lượng giao dịch (KLGD)',
      description: 'KLGD lũy kế hiện tại so với trung bình n phiên cùng thời điểm.',
      templateRef: 'TMP-TREND-LINE',
      outputs: [
        {
          symbol: 'slot', name: 'Mốc thời gian trong phiên', type: 'datetime',
          source: { kind: 'system', layer: 'L2' },
          demo: '9:15 | 10:00 | 11:00 | 13:30 | 14:30'
        },
        {
          symbol: 'cum_today', name: 'KLGD lũy kế hôm nay', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '120 | 340 | 560 | 720 | 910'
        },
        {
          symbol: 'avg_1', name: 'TB 1 phiên cùng giờ', type: 'số',
          source: { kind: 'calculated' },
          demo: '110 | 320 | 540 | 700 | 880',
          formulaSpec: 'TB 1 phiên cùng giờ = Trung bình KLGD lũy kế cùng mốc thời gian của 1 phiên gần nhất'
        },
        {
          symbol: 'avg_5', name: 'TB 5 phiên cùng giờ', type: 'số',
          source: { kind: 'calculated' },
          demo: '100 | 300 | 520 | 680 | 860',
          formulaSpec: 'TB 5 phiên cùng giờ = Trung bình KLGD lũy kế cùng mốc thời gian của 5 phiên gần nhất'
        },
        {
          symbol: 'avg_10', name: 'TB 10 phiên cùng giờ', type: 'số',
          source: { kind: 'calculated' },
          demo: '95 | 290 | 500 | 660 | 840',
          formulaSpec: 'TB 10 phiên cùng giờ = Trung bình KLGD lũy kế cùng mốc thời gian của 10 phiên gần nhất'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            slot: { layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'slot' },
            cum_today: { layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_volume_today' }
          },
          calculatedInputs: {
            avg_1: [{ layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_volume_prev' }],
            avg_5: [{ layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_volume_prev' }],
            avg_10: [{ layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_volume_prev' }]
          }
        }
      }
    },
    {
      schemaVersion: 2,
      id: 'WGT-MKT-008',
      iconKey: 'chart-area',
      title: 'Giá trị giao dịch (GTGD)',
      description: 'GTGD lũy kế hiện tại so với trung bình n phiên cùng thời điểm.',
      templateRef: 'TMP-TREND-LINE',
      outputs: [
        {
          symbol: 'slot', name: 'Mốc thời gian trong phiên', type: 'datetime',
          source: { kind: 'system', layer: 'L2' },
          demo: '9:15 | 10:00 | 11:00 | 13:30 | 14:30'
        },
        {
          symbol: 'cum_today', name: 'GTGD lũy kế hôm nay', type: 'tiền',
          source: { kind: 'system', layer: 'L2' },
          demo: '1.2 | 3.4 | 5.6 | 7.2 | 9.1'
        },
        {
          symbol: 'avg_1', name: 'TB 1 phiên cùng giờ', type: 'tiền',
          source: { kind: 'calculated' },
          demo: '1.1 | 3.2 | 5.4 | 7.0 | 8.8',
          formulaSpec: 'TB 1 phiên cùng giờ = Trung bình GTGD lũy kế cùng mốc thời gian của 1 phiên gần nhất'
        },
        {
          symbol: 'avg_5', name: 'TB 5 phiên cùng giờ', type: 'tiền',
          source: { kind: 'calculated' },
          demo: '1.0 | 3.0 | 5.2 | 6.8 | 8.6',
          formulaSpec: 'TB 5 phiên cùng giờ = Trung bình GTGD lũy kế cùng mốc thời gian của 5 phiên gần nhất'
        },
        {
          symbol: 'avg_10', name: 'TB 10 phiên cùng giờ', type: 'tiền',
          source: { kind: 'calculated' },
          demo: '0.9 | 2.9 | 5.0 | 6.6 | 8.4',
          formulaSpec: 'TB 10 phiên cùng giờ = Trung bình GTGD lũy kế cùng mốc thời gian của 10 phiên gần nhất'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            slot: { layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'slot' },
            cum_today: { layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_value_today' }
          },
          calculatedInputs: {
            avg_1: [{ layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_value_prev' }],
            avg_5: [{ layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_value_prev' }],
            avg_10: [{ layer: 'L2', ref: 'NORM-LIQUIDITY', field: 'cum_value_prev' }]
          }
        }
      }
    },
    rankPerf('WGT-TOP-001', 'Ngành'),
    rankPerf('WGT-TOP-002', 'Hệ sinh thái'),
    rankPerf('WGT-TOP-003', 'Chủ đề'),
    {
      schemaVersion: 2,
      id: 'WGT-SEC-001',
      iconKey: 'trending-up',
      title: 'Động lượng ngành',
      description: 'Xếp hạng ngành theo PG (price growth).',
      templateRef: 'TMP-RANK-PERF',
      outputs: [
        {
          symbol: 'name', name: 'Tên ngành', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Ngân hàng | Thép | Chứng khoán | Bất động sản | Bán lẻ'
        },
        {
          symbol: 'pg', name: 'PG (động lượng)', type: '%',
          source: { kind: 'system', layer: 'L2' },
          demo: '2.4 | 2.1 | 1.8 | 1.2 | 0.7'
        },
        {
          symbol: 'rank', name: 'Xếp hạng', type: 'số',
          source: { kind: 'calculated' },
          demo: '1 | 2 | 3 | 4 | 5',
          formulaSpec: 'Xếp hạng = Vị trí sau khi xếp ngành theo PG (động lượng) giảm dần'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            name: { layer: 'L2', ref: 'NORM-HEATMAP', field: 'name' },
            pg: { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'pg' }
          },
          calculatedInputs: {
            rank: [
              { layer: 'L2', ref: 'NORM-HEATMAP', field: 'name' },
              { layer: 'L2', ref: 'NORM-MARKET-AGG', field: 'pg' }
            ]
          }
        }
      }
    },

    /* ===================== DÒNG TIỀN ===================== */
    {
      schemaVersion: 2,
      id: 'WGT-FLW-001',
      iconKey: 'arrows-exchange',
      title: 'Dòng tiền thông minh (tóm tắt)',
      description: 'Tỉ lệ mua/bán và net ròng theo chủ thể NN · Tổ chức · Tự doanh · Cá nhân.',
      templateRef: 'TMP-FLOW-SUMMARY',
      outputs: [
        {
          symbol: 'subject', name: 'Chủ thể', type: 'enum',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Khối ngoại | Tổ chức | Tự doanh | Cá nhân'
        },
        {
          symbol: 'buy_ratio', name: 'Tỉ lệ mua', type: '%',
          source: { kind: 'calculated' },
          demo: '54 | 48 | 51 | 47',
          formulaSpec: 'Tỉ lệ mua = Giá trị mua ÷ (Giá trị mua + Giá trị bán)'
        },
        {
          symbol: 'net', name: 'Giá trị ròng', type: 'tiền',
          source: { kind: 'calculated' },
          demo: '320 | -120 | 60 | -260',
          formulaSpec: 'Giá trị ròng = Giá trị mua − Giá trị bán'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            subject: { layer: 'L2', ref: 'NORM-FLOW-SUMMARY', field: 'subject' }
          },
          calculatedInputs: {
            buy_ratio: [
              { layer: 'L2', ref: 'NORM-FLOW-SUMMARY', field: 'buy_value' },
              { layer: 'L2', ref: 'NORM-FLOW-SUMMARY', field: 'sell_value' }
            ],
            net: [
              { layer: 'L2', ref: 'NORM-FLOW-SUMMARY', field: 'buy_value' },
              { layer: 'L2', ref: 'NORM-FLOW-SUMMARY', field: 'sell_value' }
            ]
          }
        }
      }
    },
    netSubjectV2('WGT-FLW-SUBJ-STOCK', 'cổ phiếu', 'stock'),
    netSubjectV2('WGT-FLW-SUBJ-SECTOR', 'ngành', 'sector'),
    netSubjectV2('WGT-FLW-SUBJ-HST', 'hệ sinh thái', 'family'),
    netSubjectV2('WGT-FLW-SUBJ-CHUDE', 'chủ đề', 'chu-de'),
    flowDuoV2('WGT-FLW-STAT_STOCK', 'Cổ phiếu', 'stock'),
    flowDuoV2('WGT-FLW-STAT_SECTOR', 'Ngành', 'sector'),
    flowDuoV2('WGT-FLW-STAT_HST', 'Hệ sinh thái', 'family'),
    flowDuoV2('WGT-FLW-STAT_STORY', 'Chủ đề', 'chu-de'),
    flowSignalV2('WGT-FLW-EX_TM_IN', 'Cổ phiếu', 'stock', 'in'),
    flowSignalV2('WGT-FLW-EX_TM_SECTOR_IN', 'Ngành', 'sector', 'in'),
    flowSignalV2('WGT-FLW-EX_TM_HST_IN', 'Hệ sinh thái', 'family', 'in'),
    flowSignalV2('WGT-FLW-EX_TM_STORY_IN', 'Chủ đề', 'chu-de', 'in'),
    flowSignalV2('WGT-FLW-EX_TM_OUT', 'Cổ phiếu', 'stock', 'out'),
    flowSignalV2('WGT-FLW-EX_TM_SECTOR_OUT', 'Ngành', 'sector', 'out'),
    flowSignalV2('WGT-FLW-EX_TM_HST_OUT', 'Hệ sinh thái', 'family', 'out'),
    flowSignalV2('WGT-FLW-EX_TM_STORY_OUT', 'Chủ đề', 'chu-de', 'out'),

    /* ===================== CỘNG ĐỒNG ===================== */
    {
      schemaVersion: 2,
      id: 'WGT-COM-001',
      iconKey: 'message-circle',
      title: 'Cổ phiếu được quan tâm hàng đầu',
      description: 'Diện tích = mức độ quan tâm của cộng đồng · màu = hiệu suất phiên.',
      templateRef: 'TMP-HEATMAP',
      outputs: [
        {
          symbol: 'ticker', name: 'Mã cổ phiếu', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'VIN | VIC | VHM | VCB | HPG | SSI'
        },
        {
          symbol: 'mentions', name: 'Lượt quan tâm (kích thước)', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '639 | 629 | 569 | 426 | 156 | 180'
        },
        {
          symbol: 'perf', name: 'Hiệu suất hôm nay', type: '%',
          source: { kind: 'system', layer: 'L2' },
          demo: '1.2 | -0.8 | 2.1 | 0.4 | 3.1 | -0.5'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            ticker: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'ticker' },
            mentions: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'mention_count' },
            perf: { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'stock_perf' }
          },
          calculatedInputs: {}
        }
      },
      algorithmSpec: 'Chỉ Top 10 mã theo mức độ quan tâm cộng đồng (giảm dần)'
    },
    /* Definition V2 — outputs map đúng 4 slot của TMP-COMMUNITY-LIST
       (Đối tượng · Chú thích phụ · Avatar · Dãy chỉ số). */
    {
      schemaVersion: 2,
      id: 'WGT-COM-002',
      iconKey: 'users',
      title: 'Thành viên tích cực',
      description: 'Xếp hạng Tích cực − Tiêu cực trên bình luận cổ phiếu.',
      templateRef: 'TMP-COMMUNITY-LIST',
      outputs: [
        {
          symbol: 'member', name: 'Thành viên', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Minh Trader | Anh Phố | Cô Ba CK | Long Vốn | Hà FA'
        },
        {
          symbol: 'member_note', name: 'Chú thích phụ (Tích cực · Tiêu cực)', type: 'text',
          source: { kind: 'calculated' },
          demo: 'Tích cực 150 · Tiêu cực 22 | Tích cực 118 · Tiêu cực 22 | Tích cực 92 · Tiêu cực 18 | Tích cực 74 · Tiêu cực 14 | Tích cực 52 · Tiêu cực 11',
          formulaSpec: 'Chú thích phụ = Ghép "Tích cực" + Số bình luận đánh giá Tích cực + "· Tiêu cực" + Số bình luận đánh giá Tiêu cực (trình bày lại 2 input V1 có sẵn, không thêm dữ liệu mới)'
        },
        {
          symbol: 'avatar_url', name: 'Avatar (URL ảnh — trống = chữ cái)', type: 'text',
          source: { kind: 'calculated' },
          demo: ' |  |  |  | ',
          formulaSpec: 'Avatar = trống — Template TMP-COMMUNITY-LIST tự hiển thị chữ cái đầu của Tên thành viên (spec: Avatar ảnh tròn nếu có URL, chữ cái đầu tên nếu trống)'
        },
        {
          symbol: 'score', name: 'Điểm Tích cực − Tiêu cực', type: 'số',
          source: { kind: 'calculated' },
          demo: '128 | 96 | 74 | 60 | 41',
          formulaSpec: 'Điểm Tích cực − Tiêu cực = Số bình luận Tích cực − Số bình luận Tiêu cực'
        },
        {
          symbol: 'rank', name: 'Xếp hạng', type: 'số',
          source: { kind: 'calculated' },
          demo: '1 | 2 | 3 | 4 | 5',
          formulaSpec: 'Xếp hạng = Vị trí sau khi xếp Điểm giảm dần'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            member: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'member_name' }
          },
          calculatedInputs: {
            member_note: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'positive_count' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'negative_count' }
            ],
            avatar_url: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'member_name' }
            ],
            score: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'positive_count' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'negative_count' }
            ],
            rank: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'positive_count' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'negative_count' }
            ]
          }
        }
      }
    },
    /* Definition V2 — outputs map đúng 4 slot của TMP-COMMUNITY-LIST
       (Đối tượng · Chú thích phụ · Avatar · Dãy chỉ số). */
    {
      schemaVersion: 2,
      id: 'WGT-COM-003',
      iconKey: 'user-star',
      title: 'Chuyên gia nổi bật',
      description: 'Top chuyên gia theo tổng lượt thích bài viết.',
      templateRef: 'TMP-COMMUNITY-LIST',
      outputs: [
        {
          symbol: 'expert', name: 'Chuyên gia', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Nguyễn Văn Minh | Trần Thị B | Lê C | Phạm D | Vũ E'
        },
        {
          symbol: 'expert_note', name: 'Chú thích phụ (số bài viết trong cửa sổ)', type: 'text',
          source: { kind: 'calculated' },
          demo: '24 bài viết | 18 bài viết | 15 bài viết | 12 bài viết | 9 bài viết',
          formulaSpec: 'Chú thích phụ = Số bài viết trong cửa sổ + "bài viết" (trình bày lại input V1 post_count có sẵn, không thêm dữ liệu mới)'
        },
        {
          symbol: 'avatar_url', name: 'Avatar (URL ảnh — trống = chữ cái)', type: 'text',
          source: { kind: 'calculated' },
          demo: ' |  |  |  | ',
          formulaSpec: 'Avatar = trống — Template TMP-COMMUNITY-LIST tự hiển thị chữ cái đầu của Tên chuyên gia (spec: Avatar ảnh tròn nếu có URL, chữ cái đầu tên nếu trống)'
        },
        {
          symbol: 'total_likes', name: 'Tổng lượt thích', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '1280 | 864 | 720 | 540 | 410'
        },
        {
          symbol: 'rank', name: 'Xếp hạng', type: 'số',
          source: { kind: 'calculated' },
          demo: '1 | 2 | 3 | 4 | 5',
          formulaSpec: 'Xếp hạng = Vị trí sau khi xếp Tổng lượt thích giảm dần'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            expert: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'expert_name' },
            total_likes: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'total_likes' }
          },
          calculatedInputs: {
            expert_note: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'post_count' }
            ],
            avatar_url: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'expert_name' }
            ],
            rank: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'total_likes' }
            ]
          }
        }
      }
    },
    {
      schemaVersion: 2,
      id: 'WGT-COM-CHUDE-TOP',
      iconKey: 'flame',
      title: 'Chủ đề tích cực hàng đầu',
      description: 'Top N Topic/Story theo điểm Interest trong cửa sổ Ngày|Tuần|Tháng.',
      templateRef: 'TMP-COMMUNITY-STORY-TOP',
      outputs: [
        {
          symbol: 'story', name: 'Chủ đề', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'EV xe điện | Căn hộ TP.HCM | Tăng vốn NH | AI Việt Nam | Xuất khẩu thép | Đầu tư công | NIM ngân hàng | Bán lẻ hồi phục | Dầu khí | Thép HRC'
        },
        {
          symbol: 'score', name: 'Điểm Interest', type: 'số',
          source: { kind: 'calculated' },
          demo: '9039 | 5790 | 5341 | 3901 | 3120 | 2880 | 2440 | 2100 | 1860 | 1540',
          formulaSpec: 'score = views×1 + searches×3 + likes×5 + favorites×8 + shares×8 + comments×10'
        },
        {
          symbol: 'views', name: 'Tổng lượt xem trong cửa sổ', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '3850 | 2450 | 2620 | 2206 | 1840 | 1600 | 1420 | 1280 | 1100 | 980'
        },
        {
          symbol: 'comments', name: 'Tổng bình luận trong cửa sổ', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '94 | 63 | 43 | 17 | 14 | 31 | 22 | 18 | 12 | 9'
        },
        {
          symbol: 'favorites', name: 'Tổng yêu thích trong cửa sổ', type: 'số',
          source: { kind: 'system', layer: 'L2' },
          demo: '146 | 74 | 64 | 44 | 31 | 60 | 40 | 32 | 24 | 18'
        },
        {
          symbol: 'period', name: 'Khung thời gian (tab)', type: 'enum',
          source: { kind: 'system', layer: 'L3' },
          demo: 'Ngày | Tuần | Tháng'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            story: { layer: 'L2', ref: 'NORM-CONTENT-TOPIC', field: 'story_name' },
            views: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'views' },
            comments: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'comments' },
            favorites: { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'favorites' },
            period: { layer: 'L3', ref: 'ALG-TOPIC-TREND', field: 'period' }
          },
          calculatedInputs: {
            score: [
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'views' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'searches' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'likes' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'favorites' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'shares' },
              { layer: 'L2', ref: 'NORM-COMMUNITY', field: 'comments' }
            ]
          }
        }
      },
      algorithmSpec:
        'views = Tổng lượt xem gắn Topic/Story trong cửa sổ period\n' +
        'searches = Tổng lượt tìm kiếm gắn Topic/Story trong cửa sổ period\n' +
        'likes = Tổng lượt thích gắn Topic/Story trong cửa sổ period\n' +
        'comments = Tổng bình luận gắn Topic/Story trong cửa sổ period\n' +
        'shares = Tổng chia sẻ gắn Topic/Story trong cửa sổ period\n' +
        'favorites = Tổng yêu thích gắn Topic/Story trong cửa sổ period\n' +
        'score = views×1 + searches×3 + likes×5 + favorites×8 + shares×8 + comments×10\n' +
        'rank = Vị trí sau khi xếp score giảm dần\n' +
        'Tab đang chọn / Top N không phải output: tab mặc định phần tử đầu, Top N = số phần tử dữ liệu'
    },
    /* Definition V2 — outputs map đúng 4 slot của TMP-COMMUNITY-LIST
       (Đối tượng · Chú thích phụ · Avatar · Dãy chỉ số). */
    {
      schemaVersion: 2,
      id: 'WGT-COM-004',
      iconKey: 'bookmarks',
      title: 'Top Watchlist mạnh nhất',
      description: 'Watchlist cộng đồng có hiệu suất trung bình mạnh nhất (Elite).',
      templateRef: 'TMP-COMMUNITY-LIST',
      outputs: [
        {
          symbol: 'watchlist', name: 'Watchlist', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Sóng ngành thép | Cổ tức đều | Ngân hàng dẫn dắt | Midcap tăng tốc | Bluechip'
        },
        {
          symbol: 'watchlist_note', name: 'Chú thích phụ (số mã trong watchlist)', type: 'text',
          source: { kind: 'calculated' },
          demo: '8 mã | 12 mã | 6 mã | 10 mã | 15 mã',
          formulaSpec: 'Số mã trong watchlist = Đếm số Mã thành viên trong watchlist (đếm input V1 member_ticker có sẵn, không thêm dữ liệu mới)'
        },
        {
          symbol: 'avatar_url', name: 'Avatar (URL ảnh — trống = chữ cái)', type: 'text',
          source: { kind: 'calculated' },
          demo: ' |  |  |  | ',
          formulaSpec: 'Avatar = trống — Template TMP-COMMUNITY-LIST tự hiển thị chữ cái đầu của Tên watchlist (spec: Avatar ảnh tròn nếu có URL, chữ cái đầu tên nếu trống)'
        },
        {
          symbol: 'avg_perf', name: 'Hiệu suất trung bình', type: '%',
          source: { kind: 'calculated' },
          demo: '5.2 | 4.1 | 3.6 | 3.0 | 2.4',
          formulaSpec: 'Hiệu suất trung bình = Trung bình % thay đổi giá của các mã trong watchlist'
        },
        {
          symbol: 'rank', name: 'Xếp hạng', type: 'số',
          source: { kind: 'calculated' },
          demo: '1 | 2 | 3 | 4 | 5',
          formulaSpec: 'Xếp hạng = Vị trí sau khi xếp Hiệu suất trung bình giảm dần'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            watchlist: { layer: 'L2', ref: 'NORM-WATCHLIST', field: 'watchlist_name' }
          },
          calculatedInputs: {
            watchlist_note: [
              { layer: 'L2', ref: 'NORM-WATCHLIST', field: 'member_ticker' }
            ],
            avatar_url: [
              { layer: 'L2', ref: 'NORM-WATCHLIST', field: 'watchlist_name' }
            ],
            avg_perf: [
              { layer: 'L2', ref: 'NORM-WATCHLIST', field: 'member_ticker' },
              { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'stock_perf' }
            ],
            rank: [
              { layer: 'L2', ref: 'NORM-WATCHLIST', field: 'member_ticker' },
              { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'stock_perf' }
            ]
          }
        }
      }
    },

    /* ===================== CÁ NHÂN ===================== */
    {
      schemaVersion: 2,
      id: 'WGT-WAT-001',
      iconKey: 'bookmarks',
      title: 'Watchlist',
      description: 'Danh sách mã do user chủ động theo dõi — không qua công thức hệ thống.',
      templateRef: 'TMP-COLLECTION',
      outputs: [
        {
          symbol: 'ticker', name: 'Mã cổ phiếu', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'VCB | HPG | SSI | MWG'
        },
        {
          symbol: 'company_name', name: 'Tên công ty', type: 'text',
          source: { kind: 'system', layer: 'L2' },
          demo: 'Vietcombank | Hòa Phát | Chứng khoán SSI | Thế Giới Di Động'
        },
        {
          symbol: 'last_price', name: 'Giá khớp gần nhất', type: 'tiền',
          source: { kind: 'system', layer: 'L1' },
          demo: '92.5 | 27.8 | 38.4 | 45.1'
        },
        {
          symbol: 'change_pct', name: '% thay đổi', type: '%',
          source: { kind: 'system', layer: 'L2' },
          demo: '1.2 | -0.8 | 2.1 | 0.4'
        }
      ],
      capabilities: {},
      metadata: {
        dataContract: {
          systemRefs: {
            ticker: { layer: 'L2', ref: 'NORM-WATCHLIST', field: 'ticker' },
            company_name: { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'company_name' },
            last_price: { layer: 'L1', ref: 'RAW-DNSE-TRADE-LATEST', field: 'last_price' },
            change_pct: { layer: 'L2', ref: 'NORM-STOCK-SNAP', field: 'change_pct' }
          },
          calculatedInputs: {}
        }
      },
      algorithmSpec: ''
    }
  ];

  /* Dữ liệu demo cho đầu ra các widget khai báo trực tiếp (khớp demo template để test map + render). */
  var DEMO_OUT = {
    'WGT-MKT-001': { index_name: 'VN-Index | HNX-Index | UPCOM', index_value: '1284.5 | 231.8 | 92.4', change_pct: '0.68 | -0.42 | 0.21', status: 'tăng | giảm | tăng', ig_pg: '1.24 | 0.86' },
    'WGT-MKT-002': { exchange: 'HOSE | HNX | UPCOM', up: '210 | 88 | 120', down: '145 | 60 | 95', ref: '80 | 40 | 60', ceiling: '12 | 5 | 8', floor: '6 | 3 | 4', breadth_state: 'Tích cực | Tích cực | Tích cực' },
    'WGT-MKT-RISK': { signal_label: 'Độ rộng yếu | Bán ròng mạnh', score: '2', severity: 'cao', signal_text: 'Dòng tiền rút khỏi nhóm vốn hóa lớn — thận trọng' },
    'WGT-MKT-003': { ticker: 'HPG | SSI | MWG | VCB | FPT', change_pct: '6.8 | 5.2 | 4.1 | 3.3 | 2.0' },
    'WGT-MKT-007': { slot: '9:15 | 10:00 | 11:00 | 13:30 | 14:30', cum_today: '120 | 340 | 560 | 720 | 910', avg_1: '110 | 320 | 540 | 700 | 880', avg_5: '100 | 300 | 520 | 680 | 860', avg_10: '95 | 290 | 500 | 660 | 840' },
    'WGT-MKT-008': { slot: '9:15 | 10:00 | 11:00 | 13:30 | 14:30', cum_today: '1.2 | 3.4 | 5.6 | 7.2 | 9.1', avg_1: '1.1 | 3.2 | 5.4 | 7.0 | 8.8', avg_5: '1.0 | 3.0 | 5.2 | 6.8 | 8.6', avg_10: '0.9 | 2.9 | 5.0 | 6.6 | 8.4' },
    'WGT-SEC-001': { name: 'Ngân hàng | Thép | Chứng khoán | Bất động sản | Bán lẻ', pg: '2.4 | 2.1 | 1.8 | 1.2 | 0.7', rank: '1 | 2 | 3 | 4 | 5' },
    'WGT-FLW-001': { subject: 'Khối ngoại | Tổ chức | Tự doanh | Cá nhân', buy_ratio: '54 | 48 | 51 | 47', net: '320 | -120 | 60 | -260' },
    'WGT-COM-001': { ticker: 'VIN | VIC | VHM | VCB | HPG | SSI', mentions: '639 | 629 | 569 | 426 | 156 | 180', perf: '1.2 | -0.8 | 2.1 | 0.4 | 3.1 | -0.5' },
    'WGT-COM-002': { member: 'Minh Trader | Anh Phố | Cô Ba CK | Long Vốn | Hà FA', score: '128 | 96 | 74 | 60 | 41', rank: '1 | 2 | 3 | 4 | 5' },
    'WGT-COM-003': { expert: 'Nguyễn Văn Minh | Trần Thị B | Lê C | Phạm D | Vũ E', total_likes: '1280 | 864 | 720 | 540 | 410', rank: '1 | 2 | 3 | 4 | 5' },
    'WGT-COM-CHUDE-TOP': {
      story: 'EV xe điện | Căn hộ TP.HCM | Tăng vốn NH | AI Việt Nam | Xuất khẩu thép | Đầu tư công | NIM ngân hàng | Bán lẻ hồi phục | Dầu khí | Thép HRC',
      score: '9039 | 5790 | 5341 | 3901 | 3120 | 2880 | 2440 | 2100 | 1860 | 1540',
      views: '3850 | 2450 | 2620 | 2206 | 1840 | 1600 | 1420 | 1280 | 1100 | 980',
      searches: '308 | 196 | 210 | 176 | 147 | 128 | 114 | 102 | 88 | 78',
      likes: '420 | 280 | 240 | 180 | 150 | 120 | 100 | 90 | 80 | 70',
      comments: '94 | 63 | 43 | 17 | 14 | 31 | 22 | 18 | 12 | 9',
      shares: '88 | 54 | 41 | 28 | 22 | 30 | 18 | 14 | 11 | 8',
      favorites: '146 | 74 | 64 | 44 | 31 | 60 | 40 | 32 | 24 | 18',
      rank: '1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10'
    },
    'WGT-COM-004': { watchlist: 'Sóng ngành thép | Cổ tức đều | Ngân hàng dẫn dắt | Midcap tăng tốc | Bluechip', avg_perf: '5.2 | 4.1 | 3.6 | 3.0 | 2.4', rank: '1 | 2 | 3 | 4 | 5' },
    'WGT-WAT-001': { ticker: 'VCB | HPG | SSI | MWG', company_name: 'Vietcombank | Hòa Phát | Chứng khoán SSI | Thế Giới Di Động', last_price: '92.5 | 27.8 | 38.4 | 45.1', change_pct: '1.2 | -0.8 | 2.1 | 0.4' }
  };
  WIDGETS.forEach(function (w) {
    var d = DEMO_OUT[w.id];
    if (!d) return;
    (w.outputs || []).forEach(function (out) { if (d[out.sym] != null) out.demo = d[out.sym]; });
  });

  /* Nguồn của từng đầu ra (widget khai báo trực tiếp): L1/L2/L3/L4/calc. calc = mô tả trong Đặc tả thuật toán. */
  var SRC_OUT = {
    'WGT-MKT-001': { index_name: 'L2', index_value: 'L2', change_pct: 'L2', status: 'L2', ig_pg: 'calc' },
    'WGT-MKT-002': { exchange: 'L2', up: 'L2', down: 'L2', ref: 'L2', ceiling: 'L2', floor: 'L2', breadth_state: 'calc' },
    'WGT-MKT-RISK': { signal_label: 'calc', score: 'calc', severity: 'calc', signal_text: 'calc' },
    'WGT-MKT-003': { ticker: 'L2', change_pct: 'L2' },
    'WGT-MKT-007': { slot: 'L2', cum_today: 'L2', avg_1: 'calc', avg_5: 'calc', avg_10: 'calc' },
    'WGT-MKT-008': { slot: 'L2', cum_today: 'L2', avg_1: 'calc', avg_5: 'calc', avg_10: 'calc' },
    'WGT-SEC-001': { name: 'L2', pg: 'L2', rank: 'calc' },
    'WGT-FLW-001': { subject: 'L2', buy_ratio: 'calc', net: 'calc' },
    'WGT-COM-001': { ticker: 'L2', mentions: 'L2', perf: 'L2' },
    'WGT-COM-002': { member: 'L2', score: 'calc', rank: 'calc' },
    'WGT-COM-003': { expert: 'L2', total_likes: 'L2', rank: 'calc' },
    'WGT-COM-CHUDE-TOP': {
      story: 'L2',
      score: 'calc', views: 'L2', searches: 'L2', likes: 'L2',
      comments: 'L2', shares: 'L2', favorites: 'L2', rank: 'calc'
    },
    'WGT-COM-004': { watchlist: 'L2', avg_perf: 'calc', rank: 'calc' },
    'WGT-WAT-001': { ticker: 'L2', company_name: 'L2', last_price: 'L1', change_pct: 'L2' }
  };
  WIDGETS.forEach(function (w) {
    var s = SRC_OUT[w.id];
    if (!s) return;
    (w.outputs || []).forEach(function (out) { if (s[out.sym] != null) out.src = s[out.sym]; });
  });

  /* =====================================================================
   * ENTITLEMENT / DEPLOY — SoT thay Thư viện Widget.
   * Tầng 4 khai báo: quyền tối thiểu (tier) · trang hiển thị + block (deploy) ·
   * nhóm phân loại (group). Phân quyền sử dụng, Nhà của tôi, runtime đọc từ đây.
   * ===================================================================== */

  /* Quyền tối thiểu để dùng widget. Không khai báo = 'free'. */
  var WGT_TIER = {
    'WGT-FLW-001': 'premium',
    'WGT-FLW-SUBJ-STOCK': 'premium',
    'WGT-FLW-SUBJ-SECTOR': 'premium',
    'WGT-FLW-SUBJ-HST': 'premium',
    'WGT-FLW-SUBJ-CHUDE': 'premium',
    'WGT-FLW-EX_TM_IN': 'elite',
    'WGT-FLW-EX_TM_SECTOR_IN': 'elite',
    'WGT-FLW-EX_TM_HST_IN': 'elite',
    'WGT-FLW-EX_TM_STORY_IN': 'elite',
    'WGT-FLW-EX_TM_OUT': 'elite',
    'WGT-FLW-EX_TM_SECTOR_OUT': 'elite',
    'WGT-FLW-EX_TM_HST_OUT': 'elite',
    'WGT-FLW-EX_TM_STORY_OUT': 'elite',
    'WGT-COM-004': 'elite'
  };

  /* Widget → trang User (pages) + block HTML trên trang (blocks, data-ifx-ent-block).
     Không khai báo = { pages: ['dashboard'], blocks: [] }. */
  var WGT_DEPLOY = {
    'WGT-MKT-001': { pages: ['market', 'community', 'dashboard'], blocks: ['BLK-MKT-OVERVIEW', 'BLK-COM-OVERVIEW'] },
    'WGT-MKT-002': { pages: ['market', 'community', 'dashboard'], blocks: ['BLK-MKT-BREADTH', 'BLK-COM-BREADTH'] },
    'WGT-MKT-RISK': { pages: ['flow', 'dashboard'], blocks: [] },
    'WGT-MKT-003': { pages: ['dashboard'], blocks: [] },
    'WGT-MKT-004': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-HEAT-SECTOR'] },
    'WGT-MKT-005': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-HEAT-FAMILY'] },
    'WGT-MKT-006': { pages: ['market', 'community', 'dashboard'], blocks: ['BLK-MKT-HEAT-CHUDE'] },
    'WGT-MKT-007': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-LIQ'] },
    'WGT-MKT-008': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-LIQ'] },
    'WGT-TOP-001': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-RANKINGS'] },
    'WGT-TOP-002': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-RANKINGS'] },
    'WGT-TOP-003': { pages: ['market', 'dashboard'], blocks: ['BLK-MKT-RANKINGS'] },
    'WGT-SEC-001': { pages: ['dashboard'], blocks: [] },
    'WGT-FLW-001': { pages: ['dashboard'], blocks: [] },
    'WGT-FLW-SUBJ-STOCK': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-NET-STOCK'] },
    'WGT-FLW-SUBJ-SECTOR': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-NET-SECTOR'] },
    'WGT-FLW-SUBJ-HST': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-NET-HST'] },
    'WGT-FLW-SUBJ-CHUDE': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-NET-CHUDE'] },
    'WGT-FLW-STAT_STOCK': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-BASIC'] },
    'WGT-FLW-STAT_SECTOR': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-ADV'] },
    'WGT-FLW-STAT_HST': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-ADV'] },
    'WGT-FLW-STAT_STORY': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-ADV'] },
    'WGT-FLW-EX_TM_IN': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_SECTOR_IN': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_HST_IN': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_STORY_IN': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_OUT': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_SECTOR_OUT': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_HST_OUT': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-FLW-EX_TM_STORY_OUT': { pages: ['flow', 'dashboard'], blocks: ['BLK-FLW-SCORE-EX'] },
    'WGT-COM-001': { pages: ['community', 'dashboard'], blocks: ['BLK-COM-TRENDING'] },
    'WGT-COM-002': { pages: ['community', 'dashboard'], blocks: ['BLK-COM-ACTIVE'] },
    'WGT-COM-003': { pages: ['community', 'dashboard'], blocks: ['BLK-COM-EXPERTS'] },
    'WGT-COM-CHUDE-TOP': { pages: ['community', 'dashboard'], blocks: ['BLK-COM-CHUDE-TOP'] },
    'WGT-COM-004': { pages: ['community', 'dashboard'], blocks: ['BLK-COM-TOPWL'] },
    'WGT-WAT-001': { pages: ['dashboard'], blocks: [] }
  };

  /* Nhóm phân loại widget (dùng cho gom nhóm ở Phân quyền sử dụng). */
  var WGT_GROUPS = [
    { id: 'GRP-MKT-SUMMARY', title: 'Dữ liệu tổng quan thị trường', domain: 'Thị trường', category: 'market_summary',
      ids: ['WGT-MKT-001', 'WGT-MKT-002', 'WGT-MKT-RISK'] },
    { id: 'GRP-MKT-HEATMAP', title: 'Biểu đồ Heatmap', domain: 'Thị trường', category: 'heatmap',
      ids: ['WGT-MKT-004', 'WGT-MKT-005', 'WGT-MKT-006'] },
    { id: 'GRP-MKT-LIQ-LINE', title: 'Thanh khoản lũy kế (Multi-series Area Line)', domain: 'Thị trường', category: 'liquidity_line',
      ids: ['WGT-MKT-007', 'WGT-MKT-008'] },
    { id: 'GRP-MKT-RANK-PERF', title: 'Bảng xếp hạng hiệu suất cơ bản', domain: 'Thị trường', category: 'rank_performance',
      ids: ['WGT-MKT-003', 'WGT-TOP-001', 'WGT-TOP-002', 'WGT-TOP-003', 'WGT-SEC-001'] },
    { id: 'GRP-FLW-SMART-SUMMARY', title: 'Dòng tiền thông minh (tóm tắt)', domain: 'Dòng tiền', category: 'unclassified',
      ids: ['WGT-FLW-001'] },
    { id: 'GRP-FLW-NET-SUBJECT', title: 'Thống kê mua/bán ròng theo entity', domain: 'Dòng tiền', category: 'net_subject',
      ids: ['WGT-FLW-SUBJ-STOCK', 'WGT-FLW-SUBJ-SECTOR', 'WGT-FLW-SUBJ-HST', 'WGT-FLW-SUBJ-CHUDE'] },
    { id: 'GRP-FLW-RANK-DUO', title: 'Bảng xếp hạng dòng tiền vào / ra (đối chiếu)', domain: 'Dòng tiền', category: 'rank_flow_duo',
      ids: ['WGT-FLW-STAT_STOCK', 'WGT-FLW-STAT_SECTOR', 'WGT-FLW-STAT_HST', 'WGT-FLW-STAT_STORY'] },
    { id: 'GRP-FLW-SMART-IN', title: 'Bảng xếp hạng dòng tiền thông minh vào (Tích cực)', domain: 'Dòng tiền', category: 'rank_smart_in',
      ids: ['WGT-FLW-EX_TM_IN', 'WGT-FLW-EX_TM_SECTOR_IN', 'WGT-FLW-EX_TM_HST_IN', 'WGT-FLW-EX_TM_STORY_IN'] },
    { id: 'GRP-FLW-SMART-OUT', title: 'Bảng xếp hạng dòng tiền thông minh ra (Tiêu cực)', domain: 'Dòng tiền', category: 'rank_smart_out',
      ids: ['WGT-FLW-EX_TM_OUT', 'WGT-FLW-EX_TM_SECTOR_OUT', 'WGT-FLW-EX_TM_HST_OUT', 'WGT-FLW-EX_TM_STORY_OUT'] },
    { id: 'GRP-COM-UNCLASSIFIED', title: 'Widget khác chưa phân loại', domain: 'Cộng đồng', category: 'unclassified',
      ids: ['WGT-COM-001', 'WGT-COM-002', 'WGT-COM-003', 'WGT-COM-CHUDE-TOP', 'WGT-COM-004'] },
    { id: 'GRP-SPECIAL-WATCHLIST', title: 'Cá nhân (user-defined)', domain: 'Cá nhân', category: 'special',
      ids: ['WGT-WAT-001'] }
  ];
  var WGT_GROUP_BY_ID = {};
  WGT_GROUPS.forEach(function (g) { g.ids.forEach(function (wid) { WGT_GROUP_BY_ID[wid] = g; }); });

  var CUSTOM_GROUP = {
    id: 'GRP-CUSTOM-UNCLASSIFIED',
    title: 'Widget chưa phân loại',
    domain: 'Tùy chỉnh',
    category: 'unclassified'
  };
  var CUSTOM_DEPLOY_PAGES = ['dashboard', 'market', 'community', 'flow'];

  function widgetTier(id) { return WGT_TIER[id] || 'free'; }
  function widgetDeploy(id) {
    var d = WGT_DEPLOY[id];
    if (d) return { pages: d.pages.slice(), blocks: (d.blocks || []).slice() };
    /* Widget tùy chỉnh / chưa map deploy → hiện ở Cài đặt Trang (shared) nhiều trang */
    if (isCustomWidget(id)) {
      return { pages: CUSTOM_DEPLOY_PAGES.slice(), blocks: [] };
    }
    return { pages: ['dashboard'], blocks: [] };
  }
  function widgetGroup(id) {
    var g = WGT_GROUP_BY_ID[id];
    if (g) return { id: g.id, title: g.title, domain: g.domain, category: g.category };
    if (isCustomWidget(id)) {
      return { id: CUSTOM_GROUP.id, title: CUSTOM_GROUP.title, domain: CUSTOM_GROUP.domain, category: CUSTOM_GROUP.category };
    }
    var base = baseById(id);
    return { id: 'GRP-OTHER', title: 'Widget chưa phân loại', domain: (base && base.domain) || 'Khác', category: 'unclassified' };
  }

  /* Meta entitlement đầy đủ của 1 widget (title tôn trọng override của admin). */
  function entitlementMeta(id) {
    var w = getWidget(id);
    if (!w) return null;
    var g = widgetGroup(id);
    var dep = widgetDeploy(id);
    return {
      id: id,
      title: w.title,
      description: w.description,
      domain: w.domain || g.domain,
      template: w.template,
      tier: widgetTier(id),
      pages: dep.pages,
      blocks: dep.blocks,
      groupId: g.id,
      groupTitle: g.title,
      category: g.category,
      active: true
    };
  }
  /* Danh sách entitlement toàn bộ widget Tầng 4 (SoT cho Phân quyền sử dụng). */
  function entitlementList() {
    return widgetIds().map(function (id) { return entitlementMeta(id); }).filter(Boolean);
  }
  function widgetIds() {
    var deleted = {};
    readStore().deleted.forEach(function (id) { deleted[id] = true; });
    var ids = [];
    WIDGETS.forEach(function (w) {
      if (!deleted[w.id]) ids.push(w.id);
    });
    Object.keys(readStore().custom).forEach(function (id) {
      if (ids.indexOf(id) < 0) ids.push(id);
    });
    return ids;
  }

  function customWidgetIds() {
    return Object.keys(readStore().custom);
  }

  /** Nhóm thư viện gồm built-in + nhóm Widget chưa phân loại (custom). */
  function libraryGroups() {
    var groups = WGT_GROUPS.map(function (g) {
      return {
        id: g.id,
        category: g.category,
        domain: g.domain,
        title: g.title,
        ids: g.ids.filter(function (id) { return !isDeleted(id); })
      };
    });
    var customs = customWidgetIds();
    if (customs.length) {
      groups.push({
        id: CUSTOM_GROUP.id,
        category: CUSTOM_GROUP.category,
        domain: CUSTOM_GROUP.domain,
        title: CUSTOM_GROUP.title,
        ids: customs.slice()
      });
    }
    return groups;
  }

  /* —— Compatibility surface (thay WidgetLibraryCatalog) —— */
  function resolveWidgetCopy(id) {
    var w = getWidget(id);
    if (!w) return { title: id, description: '' };
    return { title: w.title, description: w.description || w.title };
  }
  function widgetDefaults(id) {
    var m = entitlementMeta(id);
    if (!m) return { title: id, description: id, tier: 'free', planned: false, computeRequired: true, renderAs: null };
    return {
      title: m.title,
      description: m.description,
      tier: m.tier,
      planned: false,
      computeRequired: true,
      renderAs: null
    };
  }
  function widgetsForPage(pageKey) {
    return widgetIds().filter(function (id) {
      return widgetDeploy(id).pages.indexOf(pageKey) >= 0;
    });
  }
  function groupsForPage(pageKey) {
    var map = {};
    var order = [];
    widgetsForPage(pageKey).forEach(function (id) {
      var g = widgetGroup(id);
      if (!map[g.id]) {
        map[g.id] = { id: g.id, title: g.title, domain: g.domain, category: g.category, widgetIds: [] };
        order.push(g.id);
      }
      if (map[g.id].widgetIds.indexOf(id) < 0) map[g.id].widgetIds.push(id);
    });
    return order.map(function (gid) { return map[gid]; });
  }
  function deployLabel(id) {
    var d = widgetDeploy(id);
    var parts = d.pages.slice();
    if (d.blocks.length) parts.push(d.blocks.join(', '));
    return parts.join(' · ');
  }
  function canonicalWidgetId(id) { return id; }
  function buildLibrary() {
    return libraryGroups().map(function (g) {
      var widgets = g.ids.map(function (id) {
        var d = widgetDefaults(id);
        return {
          id: id,
          title: d.title,
          description: d.description,
          defaultTitle: d.title,
          defaultDescription: d.description,
          tier: d.tier,
          renderAs: null,
          planned: false,
          computeRequired: true
        };
      });
      return {
        id: g.id,
        category: g.category,
        categoryLabel: g.category,
        algorithmId: null,
        domain: g.domain,
        computeRequired: true,
        title: g.title,
        description: '',
        defaultTitle: g.title,
        defaultDescription: '',
        widgetCount: widgets.length,
        widgets: widgets
      };
    });
  }
  function groupForWidget(id) {
    var g = widgetGroup(id);
    return { id: g.id, title: g.title, domain: g.domain, category: g.category, widgetIds: [id] };
  }
  /** WIDGET_GROUPS dạng cũ (widgetIds) — cho code còn đọc .WIDGET_GROUPS */
  function asWidgetGroups() {
    return libraryGroups().map(function (g) {
      return {
        id: g.id,
        category: g.category,
        algorithmId: null,
        domain: g.domain,
        title: g.title,
        description: '',
        widgetIds: g.ids.slice()
      };
    });
  }
  function asWidgetSpecs() {
    var out = {};
    entitlementList().forEach(function (m) {
      out[m.id] = { title: m.title, description: m.description, tier: m.tier };
    });
    return out;
  }
  function asPageDeployMap() {
    var out = {};
    widgetIds().forEach(function (id) { out[id] = widgetDeploy(id); });
    return out;
  }
  /** Facade WidgetLibraryCatalog — mọi caller cũ tự động đọc Tầng 4. */
  function installLibraryFacade() {
    global.WidgetLibraryCatalog = {
      __fromLayer4: true,
      CATEGORY_LABELS: {},
      CATEGORY_ORDER: [],
      ENTITY_LABELS: { stock: 'Cổ phiếu', sector: 'Ngành', family: 'Hệ sinh thái', hst: 'Hệ sinh thái', ecosystem: 'Hệ sinh thái', story: 'Chủ đề' },
      WIDGET_GROUPS: asWidgetGroups(),
      WIDGET_SPECS: asWidgetSpecs(),
      WGT_PAGE_DEPLOY: asPageDeployMap(),
      buildLibrary: buildLibrary,
      stats: function (library) {
        library = library || buildLibrary();
        var widgetTotal = 0;
        library.forEach(function (g) { widgetTotal += (g.widgets || []).length; });
        return { groups: library.length, widgets: widgetTotal, engines: 0, planned: 0, compute: widgetTotal };
      },
      widgetDefaults: widgetDefaults,
      resolveWidgetCopy: resolveWidgetCopy,
      canonicalWidgetId: canonicalWidgetId,
      categoryOrder: function () { return []; },
      getPreviewSpec: function (widgetId) {
        return { widgetId: widgetId, planned: true, canRender: false };
      },
      findWidget: function (groupId, widgetId) {
        var lib = buildLibrary();
        for (var i = 0; i < lib.length; i++) {
          if (lib[i].id !== groupId) continue;
          for (var j = 0; j < lib[i].widgets.length; j++) {
            if (lib[i].widgets[j].id === widgetId) return { group: lib[i], widget: lib[i].widgets[j] };
          }
        }
        return null;
      },
      getPageDeploy: widgetDeploy,
      allWidgetIdsInLibrary: widgetIds,
      widgetsForPage: widgetsForPage,
      groupForWidget: groupForWidget,
      groupsForPage: groupsForPage,
      deployLabel: deployLabel
    };
    return global.WidgetLibraryCatalog;
  }

  var DOMAIN_ORDER = ['Thị trường', 'Dòng tiền', 'Cộng đồng', 'Cá nhân', 'Tùy chỉnh'];

  /* ---------------- Store (localStorage) ----------------
   * V1: legacy, không có schemaVersion.
   * V2: canonical authoring store. Migration chỉ chạy khi V2 chưa tồn tại.
   */
  var SCHEMA_VERSION = 2;
  var STORAGE_KEY_V1 = 'iflux_l4_widgets_v1';
  var STORAGE_KEY = 'iflux_l4_widgets_v2';
  var STORAGE_BACKUP_KEY = 'iflux_l4_widgets_v1_backup_phase0b';
  var migrationError = null;
  /* Báo cáo migrate từng item: item nào migrate fail sẽ được flag ở đây (không im lặng). */
  var migrationReport = [];

  function emptyStore() {
    return { schemaVersion: SCHEMA_VERSION, items: {}, custom: {}, deleted: [], updatedAt: null };
  }

  function parseStore(raw, version) {
    var p = raw ? JSON.parse(raw) : {};
    return {
      schemaVersion: p.schemaVersion != null ? p.schemaVersion : version,
      items: p.items || {},
      custom: p.custom || {},
      deleted: Array.isArray(p.deleted) ? p.deleted : [],
      updatedAt: p.updatedAt || null
    };
  }

  function sourceFromLegacy(src) {
    if (src === 'calc') return { kind: 'calculated' };
    if (src === 'L1' || src === 'L2' || src === 'L3') return { kind: 'system', layer: src };
    throw new Error('Nguồn V1 không thể tự migrate: ' + String(src || ''));
  }

  function sourceToLegacy(source) {
    if (source && source.kind === 'calculated') return 'calc';
    if (source && source.kind === 'system') return source.layer;
    return '';
  }

  function exactFormulaMap(outputs, algorithmSpec) {
    var lines = String(algorithmSpec || '').split('\n').map(function (line) {
      return line.trim();
    }).filter(Boolean);
    var byLeft = {};
    lines.forEach(function (line) {
      var idx = line.indexOf('=');
      if (idx <= 0) return;
      byLeft[line.slice(0, idx).trim()] = line;
    });
    var result = {};
    (outputs || []).forEach(function (out) {
      if (out.src !== 'calc') return;
      var line = byLeft[out.sym] || byLeft[out.name];
      if (line) result[out.sym] = line;
    });
    return result;
  }

  function formulaMapFromLegacy(outputs, algorithmSpec) {
    var result = exactFormulaMap(outputs, algorithmSpec);
    (outputs || []).forEach(function (out) {
      if (out.src === 'calc' && !result[out.sym]) {
        throw new Error('Không được suy đoán Công thức cho output: ' + out.sym);
      }
    });
    return result;
  }

  function migrateOutputs(outputs, algorithmSpec) {
    var formulas = formulaMapFromLegacy(outputs, algorithmSpec);
    return (outputs || []).map(function (out) {
      var migrated = {
        symbol: String(out.sym || ''),
        name: String(out.name || ''),
        type: String(out.type || 'text'),
        source: sourceFromLegacy(out.src || 'L2'),
        demo: out.demo != null ? out.demo : ''
      };
      if (migrated.source.kind === 'calculated') migrated.formulaSpec = formulas[out.sym];
      return migrated;
    });
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
  }

  function iconKeyExistsInCatalog(key) {
    var cat = global.IfluxDsIconsCatalog;
    if (!cat || !cat.PAGE || !Array.isArray(cat.PAGE.groups)) return true;
    for (var i = 0; i < cat.PAGE.groups.length; i++) {
      var items = cat.PAGE.groups[i].items || [];
      for (var j = 0; j < items.length; j++) {
        if (items[j].slug === key) return true;
      }
    }
    return false;
  }

  function validateIconKey(def) {
    /* Widget cũ chưa audit được phép thiếu field. Widget được save/create phải
       qua saveDefinition/createWidget và bắt buộc có field (slug hoặc null). */
    if (!hasOwn(def, 'iconKey')) return true;
    if (def.iconKey === null) return true;
    var key = String(def.iconKey || '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      throw new Error('iconKey phải là key ngữ nghĩa hợp lệ hoặc null');
    }
    if (!iconKeyExistsInCatalog(key)) throw new Error('iconKey không tồn tại trong Danh mục biểu tượng Design System');
    return true;
  }

  function validateDefinition(def) {
    if (!def || def.schemaVersion !== SCHEMA_VERSION) throw new Error('Widget Definition phải có schemaVersion = 2');
    if (!String(def.id || '').trim()) throw new Error('Thiếu mã Widget');
    validateIconKey(def);
    if (!String(def.title || '').trim()) throw new Error('Thiếu tiêu đề Widget');
    if (!String(def.templateRef || '').trim()) throw new Error('Thiếu Template');
    if (!Array.isArray(def.outputs) || !def.outputs.length) throw new Error('Widget phải có dữ liệu đầu ra');
    var symbols = {};
    def.outputs.forEach(function (out) {
      var symbol = String(out && out.symbol || '').trim();
      if (!symbol) throw new Error('Output thiếu symbol');
      if (symbols[symbol]) throw new Error('Trùng symbol: ' + symbol);
      symbols[symbol] = true;
      if (!String(out.name || '').trim()) throw new Error('Output ' + symbol + ' thiếu tên');
      if (!out.source || (out.source.kind !== 'system' && out.source.kind !== 'calculated')) {
        throw new Error('Output ' + symbol + ' có nguồn không hợp lệ');
      }
      if (out.source.kind === 'system') {
        if (['L1', 'L2', 'L3'].indexOf(out.source.layer) < 0) throw new Error('Output ' + symbol + ' có tầng nguồn không hợp lệ');
        if (out.formulaSpec != null && String(out.formulaSpec).trim() !== '') throw new Error('Output hệ thống không được có Công thức');
      } else if (!String(out.formulaSpec || '').trim()) {
        throw new Error('Output tính toán ' + symbol + ' thiếu Công thức');
      }
    });
    if (!def.capabilities || typeof def.capabilities !== 'object') throw new Error('Thiếu capabilities metadata');
    if (!def.metadata || typeof def.metadata !== 'object') throw new Error('Thiếu metadata');
    return true;
  }

  function migrateDefinition(def) {
    if (def && def.schemaVersion === SCHEMA_VERSION) {
      var current = clone(def);
      if (current.metadata) delete current.metadata.templateRoles;
      validateDefinition(current);
      return current;
    }
    var metadata = clone(def.metadata || {});
    delete metadata.templateRoles;
    var migrated = {
      schemaVersion: SCHEMA_VERSION,
      id: String(def.id || ''),
      title: String(def.title || ''),
      description: String(def.description || ''),
      templateRef: String(def.template || ''),
      outputs: migrateOutputs(def.outputs || [], def.algorithmSpec || ''),
      capabilities: clone(def.capabilities || {}),
      metadata: metadata
    };
    if (hasOwn(def, 'iconKey')) migrated.iconKey = def.iconKey === null ? null : String(def.iconKey);
    validateDefinition(migrated);
    return migrated;
  }

  function migratePatch(patch) {
    if (!patch || patch.schemaVersion === SCHEMA_VERSION) return clone(patch || {});
    var next = {};
    ['title', 'description'].forEach(function (key) {
      if (patch[key] != null) next[key] = patch[key];
    });
    if (hasOwn(patch, 'iconKey')) next.iconKey = patch.iconKey === null ? null : String(patch.iconKey);
    if (patch.template != null) next.templateRef = patch.template;
    if (patch.outputs) next.outputs = migrateOutputs(patch.outputs, patch.algorithmSpec || '');
    if (patch.capabilities) next.capabilities = clone(patch.capabilities);
    if (patch.metadata) next.metadata = clone(patch.metadata);
    return next;
  }

  function migrateStoreOnce() {
    var existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      var parsed = parseStore(existing, SCHEMA_VERSION);
      if (parsed.schemaVersion !== SCHEMA_VERSION) throw new Error('Store V2 sai schemaVersion');
      return parsed;
    }
    var rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1 != null && localStorage.getItem(STORAGE_BACKUP_KEY) == null) {
      localStorage.setItem(STORAGE_BACKUP_KEY, rawV1);
    }
    var legacy = parseStore(rawV1, 1);
    var next = emptyStore();
    var report = [];
    /* Triết lý migrate: THÀNH CÔNG → persist V2. THẤT BẠI → flag + reason, KHÔNG im lặng,
       KHÔNG dùng như bản hợp lệ. Item fail vẫn giữ payload V1 (để phục hồi/audit) nhưng
       được đánh dấu _migrationRequired nên schemaVersion vẫn = 1 → downstream không coi là V2,
       không đè lên Definition chuẩn ở source. Không chặn item khác migrate. */
    Object.keys(legacy.items).forEach(function (id) {
      try { next.items[id] = migratePatch(legacy.items[id]); }
      catch (e) {
        next.items[id] = flagMigrationFailure(legacy.items[id], e.message);
        report.push({ id: id, scope: 'items', reason: e.message });
      }
    });
    Object.keys(legacy.custom).forEach(function (id) {
      try { next.custom[id] = migrateDefinition(legacy.custom[id]); }
      catch (e2) {
        next.custom[id] = flagMigrationFailure(legacy.custom[id], e2.message);
        report.push({ id: id, scope: 'custom', reason: e2.message });
      }
    });
    next.deleted = legacy.deleted.slice();
    next.updatedAt = legacy.updatedAt;
    next.migrationReport = report;
    var rawV2 = JSON.stringify(next);
    try {
      localStorage.setItem(STORAGE_KEY, rawV2);
      if (localStorage.getItem(STORAGE_KEY) !== rawV2) throw new Error('Không xác minh được Store V2 sau persist');
      migrationReport = report;
      warnMigrationReport(report);
      return next;
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
      throw err;
    }
  }

  /* Đánh dấu item migrate fail: giữ nguyên payload V1 để phục hồi, gắn cờ + lý do rõ ràng. */
  function flagMigrationFailure(v1Item, reason) {
    var flagged = clone(v1Item || {});
    flagged.schemaVersion = 1;
    flagged._migrationRequired = true;
    flagged._migrationError = String(reason || 'Migration fail không rõ lý do');
    return flagged;
  }

  function warnMigrationReport(report) {
    if (!report || !report.length) return;
    try {
      var msg = 'Tầng 4 Widget — cần migrate thủ công ' + report.length + ' item (không tự dùng bản V1): ' +
        report.map(function (r) { return r.id + ' (' + r.reason + ')'; }).join(' | ');
      if (global.console && global.console.warn) global.console.warn('[iflux][L4-migration]', msg);
    } catch (e) { /* ignore */ }
  }

  /* Danh sách item còn cần migrate (đọc từ store V2 + báo cáo migrate gần nhất). */
  function migrationRequiredItems() {
    var out = [];
    var seen = {};
    (migrationReport || []).forEach(function (r) {
      if (!seen[r.id]) { seen[r.id] = true; out.push({ id: r.id, scope: r.scope, reason: r.reason }); }
    });
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        ['items', 'custom'].forEach(function (scope) {
          var bag = parsed[scope] || {};
          Object.keys(bag).forEach(function (id) {
            if (bag[id] && bag[id]._migrationRequired && !seen[id]) {
              seen[id] = true;
              out.push({ id: id, scope: scope, reason: bag[id]._migrationError || 'Migration Required' });
            }
          });
        });
      }
    } catch (e) { /* ignore */ }
    return out;
  }

  function readStore() {
    try {
      migrationError = null;
      return migrateStoreOnce();
    } catch (err) {
      migrationError = err;
      return parseStore(localStorage.getItem(STORAGE_KEY_V1), 1);
    }
  }

  function writeStore(data) {
    if (migrationError || data.schemaVersion !== SCHEMA_VERSION) {
      throw migrationError || new Error('Store chưa migrate lên schemaVersion = 2');
    }
    var before = localStorage.getItem(STORAGE_KEY);
    var next = clone(data);
    next.schemaVersion = SCHEMA_VERSION;
    next.updatedAt = new Date().toISOString();
    if (!next.items) next.items = {};
    if (!next.custom) next.custom = {};
    if (!Array.isArray(next.deleted)) next.deleted = [];
    Object.keys(next.custom).forEach(function (id) {
      if (next.custom[id] && next.custom[id].schemaVersion === SCHEMA_VERSION) validateDefinition(next.custom[id]);
    });
    Object.keys(next.items).forEach(function (id) {
      if (next.items[id] && next.items[id].schemaVersion === SCHEMA_VERSION) validateDefinition(next.items[id]);
    });
    var raw = JSON.stringify(next);
    try {
      localStorage.setItem(STORAGE_KEY, raw);
      if (localStorage.getItem(STORAGE_KEY) !== raw) throw new Error('Atomic Persist không thành công');
      return next;
    } catch (err) {
      if (before == null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, before);
      throw err;
    }
  }

  function notifyPropagate() {
    try { installLibraryFacade(); } catch (e) { /* ignore */ }
    try {
      if (global.EntitlementCatalog && typeof global.EntitlementCatalog.refreshBlocksCatalog === 'function') {
        global.EntitlementCatalog.refreshBlocksCatalog();
      }
    } catch (e2) { /* ignore */ }
  }

  function baseById(id) {
    for (var k = 0; k < WIDGETS.length; k++) if (WIDGETS[k].id === id) return WIDGETS[k];
    var store = readStore();
    if (store.custom[id]) return store.custom[id];
    return null;
  }

  function isCustomWidget(id) {
    return !!(readStore().custom[id]);
  }

  function isDeleted(id) {
    return readStore().deleted.indexOf(id) >= 0;
  }

  /** Sinh mã WGT-CUS-001, WGT-CUS-002, … */
  function nextCustomId() {
    var taken = {};
    widgetIds().forEach(function (id) { taken[id] = true; });
    var n = 1;
    var id;
    do {
      id = 'WGT-CUS-' + String(n).padStart(3, '0');
      n++;
    } while (taken[id]);
    return id;
  }

  /**
   * Scaffold output ban đầu khi Widget chọn Template — CHỈ dựng bộ khung trung tính
   * theo SỐ SLOT trình bày của Template (bind vị trí). KHÔNG gắn ngữ nghĩa nghiệp vụ
   * hay kiểu dữ liệu vào Definition: symbol = output_1..n; name = nhãn slot (trình bày);
   * type mặc định 'text' để Admin tự chỉnh ở Tầng 4. Template không sở hữu output —
   * đây chỉ là bộ khung khởi tạo, Widget mới là chủ output.
   */
  function outputsFromTemplate(templateId) {
    var cat = global.TemplatesCatalog;
    var t = cat && cat.byId ? cat.byId(templateId) : null;
    var inputs = (t && t.inputs) ? t.inputs.slice() : [];
    var demo = t && global.TemplatesStore ? global.TemplatesStore.getDemo(t) : inputs.map(function (inp) {
      return inp && inp.demo != null ? inp.demo : '';
    });
    var headCount = (cat && cat.HEAD_INPUT_COUNT != null) ? cat.HEAD_INPUT_COUNT : 2;
    var body = inputs.filter(function (inp) {
      return inp && inp.key !== 'title' && inp.key !== 'description';
    });
    return body.map(function (inp, idx) {
      return {
        symbol: 'output_' + (idx + 1),
        name: inp.label || ('Đầu ra ' + (idx + 1)),
        type: 'text',
        source: { kind: 'system', layer: 'L2' },
        demo: demo[idx + headCount] != null ? String(demo[idx + headCount]) : (inp.demo != null ? String(inp.demo) : '')
      };
    });
  }

  function templateMeta(templateId) {
    var cat = global.TemplatesCatalog;
    var t = cat && cat.byId ? cat.byId(templateId) : null;
    return {
      headTitle: (t && (t.headTitle || t.name)) || '',
      headDesc: t && t.headDesc != null ? t.headDesc : '',
      domainLabel: t && t.domain ? ((cat.DOMAIN_LABELS && cat.DOMAIN_LABELS[t.domain]) || t.domain) : 'Tùy chỉnh'
    };
  }

  function legacyDraft(def) {
    var formulas = exactFormulaMap(def.outputs || [], def.algorithmSpec || '');
    var metadata = clone(def.metadata || {});
    metadata.legacySchema = true;
    delete metadata.templateRoles;
    var outputs = (def.outputs || []).map(function (out) {
      var source;
      try { source = sourceFromLegacy(out.src || 'L2'); }
      catch (e) { source = { kind: 'legacy', layer: out.src || '' }; }
      var next = {
        symbol: out.sym || '',
        name: out.name || '',
        type: out.type || 'text',
        source: source,
        demo: out.demo != null ? out.demo : ''
      };
      if (source.kind === 'calculated' && formulas[out.sym]) next.formulaSpec = formulas[out.sym];
      return next;
    });
    var draft = {
      schemaVersion: 1,
      id: def.id,
      title: def.title || '',
      description: def.description || '',
      templateRef: def.template || '',
      outputs: outputs,
      capabilities: clone(def.capabilities || {}),
      metadata: metadata
    };
    if (hasOwn(def, 'iconKey')) draft.iconKey = def.iconKey;
    return draft;
  }

  function definitionToLegacy(def, base) {
    var legacy = {
      id: def.id,
      iconKey: hasOwn(def, 'iconKey') ? def.iconKey : null,
      title: def.title,
      description: def.description,
      template: def.templateRef,
      outputs: (def.outputs || []).map(function (out) {
        return {
          sym: out.symbol,
          name: out.name,
          type: out.type,
          role: '',
          demo: out.demo,
          src: sourceToLegacy(out.source)
        };
      }),
      algorithmSpec: (def.outputs || []).filter(function (out) {
        return out.source && out.source.kind === 'calculated' && out.formulaSpec;
      }).map(function (out) { return out.formulaSpec; }).join('\n')
    };
    if (base && base.domain != null) legacy.domain = base.domain;
    if (base && base.inputs) legacy.inputs = clone(base.inputs);
    legacy.custom = !!(base && base.custom);
    return legacy;
  }

  function mergedLegacyBase(id) {
    var base = baseById(id);
    if (!base) return null;
    if (base.schemaVersion === SCHEMA_VERSION) return definitionToLegacy(base, base);
    var ov = readStore().items[id];
    if (ov && ov.schemaVersion === SCHEMA_VERSION) return definitionToLegacy(ov, base);
    var merged = clone(base);
    if (!ov) return merged;
    if (ov.title != null) merged.title = ov.title;
    if (ov.description != null) merged.description = ov.description;
    var templateRef = ov.templateRef != null ? ov.templateRef : ov.template;
    if (templateRef != null && allTemplateIds().indexOf(templateRef) >= 0) merged.template = templateRef;
    if (ov.algorithmSpec != null) merged.algorithmSpec = ov.algorithmSpec;
    if (ov.outputs) {
      merged.outputs = ov.outputs[0] && ov.outputs[0].symbol
        ? definitionToLegacy({
            id: merged.id, title: merged.title, description: merged.description,
            templateRef: merged.template, outputs: ov.outputs,
            metadata: ov.metadata || {}, capabilities: ov.capabilities || {}
          }, base).outputs
        : clone(ov.outputs);
    }
    return merged;
  }

  /* Compatibility facade cho consumer cũ; Definition V2 dùng getDefinition(). */
  function getWidget(id) {
    if (isDeleted(id)) return null;
    return mergedLegacyBase(id);
  }

  function getDefinition(id) {
    if (isDeleted(id)) return null;
    var base = baseById(id);
    if (!base) return null;
    var ov = readStore().items[id];
    if (ov && ov.schemaVersion === SCHEMA_VERSION) {
      var resolved = clone(ov);
      /* Definition audited trong source có iconKey; override V2 cũ được kế thừa
         để lần save tiếp theo persist đầy đủ Identity. */
      if (!hasOwn(resolved, 'iconKey') && base.schemaVersion === SCHEMA_VERSION && hasOwn(base, 'iconKey')) {
        resolved.iconKey = base.iconKey;
      }
      return resolved;
    }
    if (base.schemaVersion === SCHEMA_VERSION) return clone(base);
    var legacy = mergedLegacyBase(id);
    try { return migrateDefinition(legacy); }
    catch (e) {
      var draft = legacyDraft(legacy);
      draft.metadata.migrationError = e.message;
      return draft;
    }
  }

  function getWidgets() {
    return widgetIds().map(function (id) { return getWidget(id); }).filter(Boolean);
  }
  function getDefinitions() {
    return widgetIds().map(function (id) { return getDefinition(id); }).filter(Boolean);
  }

  function saveWidget(id, patch) {
    if (patch && patch.schemaVersion === SCHEMA_VERSION) return saveDefinition(id, patch);
    var current = getDefinition(id);
    if (!current) throw new Error('Không tìm thấy Widget: ' + id);
    var next = clone(current);
    next.schemaVersion = SCHEMA_VERSION;
    if (hasOwn(patch, 'iconKey')) next.iconKey = patch.iconKey === null ? null : String(patch.iconKey);
    if (patch.title != null) next.title = String(patch.title);
    if (patch.description != null) next.description = String(patch.description);
    if (patch.template != null) next.templateRef = String(patch.template);
    if (patch.templateRef != null) next.templateRef = String(patch.templateRef);
    if (patch.outputs) next.outputs = patch.outputs[0] && patch.outputs[0].symbol
      ? clone(patch.outputs)
      : migrateOutputs(patch.outputs, patch.algorithmSpec || '');
    validateDefinition(next);
    return saveDefinition(id, next);
  }

  function saveDefinition(id, definition) {
    var nextDef = clone(definition);
    nextDef.id = id;
    nextDef.schemaVersion = SCHEMA_VERSION;
    if (!hasOwn(nextDef, 'iconKey')) throw new Error('Widget đã audit phải có iconKey (key hoặc null)');
    validateDefinition(nextDef);
    var data = readStore();
    if (data.custom[id]) {
      data.custom[id] = nextDef;
    } else {
      data.items[id] = nextDef;
    }
    writeStore(data);
    notifyPropagate();
    return clone(nextDef);
  }

  function createWidget(opts) {
    opts = opts || {};
    var template = opts.templateRef || opts.template || 'TMP-SUMMARY';
    var id = opts.id || nextCustomId();
    if (baseById(id) || isDeleted(id)) {
      throw new Error('Mã widget đã tồn tại: ' + id);
    }
    var outputs = opts.outputs && opts.outputs.length
      ? opts.outputs
      : outputsFromTemplate(template);
    var def = {
      schemaVersion: SCHEMA_VERSION,
      id: id,
      iconKey: hasOwn(opts, 'iconKey') ? opts.iconKey : undefined,
      title: String(opts.title || '').trim(),
      description: opts.description != null ? String(opts.description) : '',
      templateRef: template,
      outputs: clone(outputs),
      capabilities: clone(opts.capabilities || {}),
      metadata: clone(opts.metadata || {})
    };
    if (!hasOwn(opts, 'iconKey')) throw new Error('Widget mới phải có iconKey (key hoặc null)');
    if (def.iconKey === undefined) def.iconKey = null;
    def.metadata.custom = true;
    validateDefinition(def);
    var data = readStore();
    data.custom[id] = def;
    writeStore(data);
    notifyPropagate();
    return clone(def);
  }

  function deleteWidget(id) {
    var data = readStore();
    if (data.custom[id]) {
      delete data.custom[id];
      delete data.items[id];
      writeStore(data);
      notifyPropagate();
      return true;
    }
    var builtin = false;
    for (var i = 0; i < WIDGETS.length; i++) if (WIDGETS[i].id === id) { builtin = true; break; }
    if (!builtin) return false;
    if (data.deleted.indexOf(id) < 0) data.deleted.push(id);
    delete data.items[id];
    writeStore(data);
    notifyPropagate();
    return true;
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_V1);
    notifyPropagate();
    return readStore();
  }
  function updatedAt() { return readStore().updatedAt; }
  function storeStatus() {
    var store = readStore();
    var required = migrationRequiredItems();
    return {
      schemaVersion: store.schemaVersion,
      migrationError: migrationError ? migrationError.message : null,
      /* Migrate từng item: KHÔNG im lặng — item fail được flag + reason ở đây. */
      migrationReport: (store.migrationReport || migrationReport || []).slice(),
      migrationRequired: required,
      hasMigrationRequired: required.length > 0,
      storageKey: store.schemaVersion === SCHEMA_VERSION ? STORAGE_KEY : STORAGE_KEY_V1,
      storageKeys: { v1: STORAGE_KEY_V1, v2: STORAGE_KEY, v1Backup: STORAGE_BACKUP_KEY }
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /* ---------------- Template helpers ---------------- */
  function templateName(id) {
    var cat = global.TemplatesCatalog;
    if (cat && cat.byId) { var t = cat.byId(id); if (t) return t.name; }
    return (TEMPLATE_ROLES[id] && TEMPLATE_ROLES[id].name) || id;
  }
  function allTemplateIds() {
    var cat = global.TemplatesCatalog;
    if (cat && cat.all) return cat.all().map(function (t) { return t.id; });
    return Object.keys(TEMPLATE_ROLES);
  }
  /** Số slot trình bày của một Template (không tính 2 ô head title/description). */
  function templateSlotCount(id) {
    var cat = global.TemplatesCatalog;
    var t = cat && cat.byId ? cat.byId(id) : null;
    if (!t || !Array.isArray(t.inputs)) return 0;
    var head = (cat.HEAD_INPUT_COUNT != null) ? cat.HEAD_INPUT_COUNT : 2;
    return Math.max(0, t.inputs.length - head);
  }
  /**
   * Template nào BIỂU DIỄN được cấu trúc dữ liệu của Widget.
   * Ràng buộc DUY NHẤT là cấu trúc trình bày: Widget phải có đủ số output để lấp
   * số slot của Template (bind vị trí). Không lọc theo nghiệp vụ hay kiểu dữ liệu.
   */
  function compatibleTemplates(widget) {
    var have = (widget && widget.outputs || []).length;
    return allTemplateIds().filter(function (id) {
      return have >= templateSlotCount(id);
    });
  }
  /** Gắn lại demo/nguồn cho đầu ra sau khi admin sửa. Không suy diễn role nghiệp vụ. */
  function reattachRoles(id, outputs) {
    var base = baseById(id);
    var metaBySym = {};
    if (base) (base.outputs || []).forEach(function (out) { metaBySym[out.sym] = { demo: out.demo, src: out.src }; });
    return outputs.map(function (out) {
      var m = metaBySym[out.sym] || {};
      return { sym: out.sym, name: out.name, type: out.type, demo: out.demo != null ? out.demo : (m.demo || ''), src: out.src || m.src || 'L2' };
    });
  }

  function getBaseWidget(id) {
    var base = baseById(id);
    return base ? clone(base) : null;
  }
  function baseOutputSyms(id) {
    var base = baseById(id);
    if (!base) return [];
    var seen = {};
    return (base.outputs || []).map(function (o) { return o.symbol || o.sym; }).filter(function (s) {
      if (!s || seen[s]) return false;
      seen[s] = true;
      return true;
    });
  }

  global.PlatformLayersWidgets = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    WIDGETS: WIDGETS,
    DOMAIN_ORDER: DOMAIN_ORDER,
    TEMPLATE_ROLES: TEMPLATE_ROLES,
    SOURCE_LABELS: SOURCE_LABELS,
    SRC_OUT_LABELS: SRC_OUT_LABELS,
    SRC_OUT_KEYS: SRC_OUT_KEYS,
    OUTPUT_TYPES: OUTPUT_TYPES,
    getWidgets: getWidgets,
    getWidget: getWidget,
    getDefinitions: getDefinitions,
    getDefinition: getDefinition,
    getBaseWidget: getBaseWidget,
    baseOutputSyms: baseOutputSyms,
    saveWidget: saveWidget,
    saveDefinition: saveDefinition,
    createWidget: createWidget,
    deleteWidget: deleteWidget,
    nextCustomId: nextCustomId,
    outputsFromTemplate: outputsFromTemplate,
    isCustomWidget: isCustomWidget,
    resetAll: resetAll,
    updatedAt: updatedAt,
    storeStatus: storeStatus,
    migrationRequiredItems: migrationRequiredItems,
    templateName: templateName,
    allTemplateIds: allTemplateIds,
    compatibleTemplates: compatibleTemplates,
    reattachRoles: reattachRoles,
    /* Entitlement / deploy — SoT thay Thư viện Widget */
    widgetIds: widgetIds,
    widgetTier: widgetTier,
    widgetDeploy: widgetDeploy,
    widgetGroup: widgetGroup,
    entitlementMeta: entitlementMeta,
    entitlementList: entitlementList,
    resolveWidgetCopy: resolveWidgetCopy,
    widgetDefaults: widgetDefaults,
    widgetsForPage: widgetsForPage,
    groupsForPage: groupsForPage,
    buildLibrary: buildLibrary,
    deployLabel: deployLabel,
    installLibraryFacade: installLibraryFacade
  };

  /* Cài facade WidgetLibraryCatalog ngay — mọi script cũ đọc Tầng 4. */
  installLibraryFacade();
})(window);
