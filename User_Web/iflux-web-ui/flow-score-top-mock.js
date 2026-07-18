/* Mock data — Top 10 score blocks (view-only, thay bằng API sau) */
(function (global) {
  'use strict';

  var STOCKS = ['SHB', 'SSI', 'HPG', 'FPT', 'VCB', 'MWG', 'STB', 'VHM', 'VIC', 'LPB', 'MSN', 'GVR'];
  var SECTORS = ['Ngân hàng', 'Bất động sản', 'Thép', 'Chứng khoán', 'Công nghệ', 'Bán lẻ', 'Dầu khí', 'Điện', 'Vận tải', 'Dược phẩm', 'Xây dựng'];
  var HST = ['Vingroup', 'Techcombank', 'Hòa Phát', 'FPT Group', 'Vinamilk', 'VPBank', 'Masan', 'PV Gas', 'MWG', 'Gelex'];
  var STORIES = ['AI Việt Nam', 'Nghị quyết NN', 'Tăng vốn NH', 'Xuất khẩu thép', 'EV xe điện', 'Căn hộ TP.HCM', 'Lãi suất giảm'];

  function seeded(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function pickNames(pool, count, seedBase) {
    var used = {};
    var out = [];
    var i = 0;
    while (out.length < count && i < pool.length * 3) {
      var idx = Math.floor(seeded(seedBase + i * 7) * pool.length);
      var name = pool[idx];
      if (!used[name]) {
        used[name] = true;
        out.push(name);
      }
      i++;
    }
    return out;
  }

  function buildItems(names, polarity, seedBase, opts) {
    opts = opts || {};
    var scores = names.map(function (_, i) {
      var base = polarity === 'positive'
        ? 88 - i * 7 + Math.round(seeded(seedBase + i) * 8)
        : 86 - i * 6 + Math.round(seeded(seedBase + i + 50) * 7);
      return Math.max(12, Math.min(100, base));
    }).sort(function (a, b) { return b - a; });

    return names.map(function (name, i) {
      var item = {
        id: name.replace(/\s+/g, '-').toLowerCase(),
        label: name,
        score: scores[i] || scores[scores.length - 1]
      };
      if (opts.risk) {
        item.riskScore = Math.max(8, Math.min(95, Math.round(item.score * 0.35 + seeded(seedBase + i * 3) * 40)));
      }
      if (opts.recommendationKind === 'insight') {
        var ir = seeded(seedBase + i * 11);
        item.recommendation = ir > 0.55 ? 'Cơ hội' : 'Rủi ro';
      } else if (opts.recommendation) {
        var r = seeded(seedBase + i * 11);
        item.recommendation = r > 0.62 ? 'Mua' : (r > 0.28 ? 'Nắm giữ' : 'Bán');
      }
      return item;
    });
  }

  function block(id, title, polarity, entityType, count, seed, opts) {
    var pool = entityType === 'stock' ? STOCKS
      : entityType === 'sector' ? SECTORS
      : entityType === 'hst' ? HST
      : STORIES;
    var names = pickNames(pool, count, seed);
    return {
      id: id,
      title: title,
      polarity: polarity,
      entityType: entityType,
      showRisk: !!(opts && opts.risk),
      showRecommendation: !!(opts && (opts.recommendation || opts.recommendationKind)),
      recommendationKind: opts && opts.recommendationKind ? opts.recommendationKind : null,
      items: buildItems(names, polarity, seed, opts || {})
    };
  }

  var BLOCKS = [
    block('ex-tm-in', 'TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN THÔNG MINH VÀO MẠNH NHẤT', 'positive', 'stock', 10, 101, { risk: true, recommendationKind: 'insight' }),
    block('ex-tm-out', 'TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN THÔNG MINH RA MẠNH NHẤT', 'negative', 'stock', 10, 202),
    block('ex-tm-sector-in', 'TOP 10 NGÀNH CÓ DÒNG TIỀN THÔNG MINH VÀO MẠNH NHẤT', 'positive', 'sector', 10, 111, { risk: true, recommendationKind: 'insight' }),
    block('ex-tm-sector-out', 'TOP 10 NGÀNH CÓ DÒNG TIỀN THÔNG MINH RA MẠNH NHẤT', 'negative', 'sector', 10, 112),
    block('ex-tm-hst-in', 'TOP 10 HỆ SINH THÁI CÓ DÒNG TIỀN THÔNG MINH VÀO MẠNH NHẤT', 'positive', 'hst', 10, 121, { risk: true, recommendationKind: 'insight' }),
    block('ex-tm-hst-out', 'TOP 10 HỆ SINH THÁI CÓ DÒNG TIỀN THÔNG MINH RA MẠNH NHẤT', 'negative', 'hst', 10, 122),
    block('ex-tm-chude-in', 'TOP 10 CHỦ ĐỀ CÓ DÒNG TIỀN THÔNG MINH VÀO MẠNH NHẤT', 'positive', 'chude', 10, 131, { risk: true, recommendationKind: 'insight' }),
    block('ex-tm-chude-out', 'TOP 10 CHỦ ĐỀ CÓ DÒNG TIỀN THÔNG MINH RA MẠNH NHẤT', 'negative', 'chude', 10, 132),
    block('stat-stock-in', 'TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN VÀO MẠNH NHẤT', 'positive', 'stock', 10, 301),
    block('stat-stock-out', 'TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN RA MẠNH NHẤT', 'negative', 'stock', 10, 302),
    block('stat-sector-in', 'TOP 10 NGÀNH CÓ DÒNG TIỀN VÀO MẠNH NHẤT', 'positive', 'sector', 10, 401),
    block('stat-sector-out', 'TOP 10 NGÀNH CÓ DÒNG TIỀN RA MẠNH NHẤT', 'negative', 'sector', 10, 402),
    block('stat-hst-in', 'TOP 10 HỆ SINH THÁI CÓ DÒNG TIỀN VÀO MẠNH NHẤT', 'positive', 'hst', 10, 501),
    block('stat-hst-out', 'TOP 10 HỆ SINH THÁI CÓ DÒNG TIỀN RA MẠNH NHẤT', 'negative', 'hst', 10, 502),
    block('stat-chude-in', 'TOP 10 CHỦ ĐỀ CÓ DÒNG TIỀN VÀO MẠNH NHẤT', 'positive', 'chude', 7, 601),
    block('stat-chude-out', 'TOP 10 CHỦ ĐỀ CÓ DÒNG TIỀN RA MẠNH NHẤT', 'negative', 'chude', 10, 602)
  ];

  global.IfluxFlowScoreMock = {
    getBlocks: function () { return BLOCKS.slice(); },
    getBlock: function (id) {
      for (var i = 0; i < BLOCKS.length; i++) {
        if (BLOCKS[i].id === id) return BLOCKS[i];
      }
      return null;
    },
    getExclusive: function () { return BLOCKS.filter(function (b) { return b.id.indexOf('ex-') === 0; }); },
    getBasic: function () {
      return BLOCKS.filter(function (b) {
        return b.id === 'stat-stock-in' || b.id === 'stat-stock-out';
      });
    },
    getAdvanced: function () {
      return BLOCKS.filter(function (b) {
        return b.id.indexOf('stat-') === 0 && b.id !== 'stat-stock-in' && b.id !== 'stat-stock-out';
      });
    },
    getStats: function () { return BLOCKS.filter(function (b) { return b.id.indexOf('stat-') === 0; }); }
  };
})(window);
