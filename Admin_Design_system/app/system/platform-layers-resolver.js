/**
 * ADM-SYS-007 — Resolve giá trị hiện tại cho từng block (demo sandbox)
 */
(function (global) {
  'use strict';

  function snap() {
    return global.IfluxMockMarket ? IfluxMockMarket.getSnapshot() : null;
  }

  function fmtVal(v) {
    if (v === undefined) return { display: '—', raw: null, type: 'null' };
    if (v === null) return { display: 'null', raw: null, type: 'null' };
    if (Array.isArray(v)) return { display: JSON.stringify(v), raw: v, type: 'array' };
    if (typeof v === 'object') return { display: JSON.stringify(v), raw: v, type: 'object' };
    if (typeof v === 'number') return { display: String(v), raw: v, type: 'number' };
    if (typeof v === 'boolean') return { display: v ? 'true' : 'false', raw: v, type: 'boolean' };
    return { display: String(v), raw: v, type: 'string' };
  }

  function field(key, label, value, inputs) {
    var f = fmtVal(value);
    return {
      key: key,
      label: label,
      type: f.type,
      value: f.raw,
      display: f.display,
      inputs: inputs || null
    };
  }

  function getAlgorithm(algorithmId) {
    var catalog = global.PlatformLayersCatalog;
    if (!catalog || !algorithmId) return null;
    return catalog.ALGORITHMS.find(function (a) { return a.id === algorithmId; });
  }

  function getBlockMeta(blockId) {
    var catalog = global.PlatformLayersCatalog;
    if (!catalog || !catalog.buildDisplayBlocks) return null;
    return catalog.buildDisplayBlocks().find(function (b) { return b.id === blockId; });
  }

  function formatInputLine(o) {
    return '③ ' + o.line + ' = ' + (o.display != null ? o.display : '—');
  }

  /** Kết quả tầng 3 (demo) = output của bài toán trên NORM + Admin */
  function buildLayer3Outputs(algorithmId) {
    var alg = getAlgorithm(algorithmId);
    if (!alg) return [];
    var catalog = global.PlatformLayersCatalog;
    var cfg = catalog ? catalog.getAdminConfig() : {};
    var outputs = [];

    (alg.normalized || []).forEach(function (normId) {
      var resolved = resolveNormalizedEntity(normId);
      (resolved.fields || []).forEach(function (f) {
        outputs.push({
          algId: algorithmId,
          sourceType: 'normalized',
          sourceId: normId,
          fieldKey: f.key,
          line: normId + ' · ' + f.key,
          display: f.display,
          raw: f.value
        });
      });
    });

    (alg.adminKeys || []).forEach(function (k) {
      var fv = fmtVal(cfg[k]);
      outputs.push({
        algId: algorithmId,
        sourceType: 'admin',
        sourceId: 'admin',
        fieldKey: k,
        line: 'admin.' + k,
        display: fv.display,
        raw: fv.raw
      });
    });

    return outputs;
  }

  function fieldKeysRelated(displayKey, normFieldKey) {
    var dk = String(displayKey || '').toLowerCase().replace(/\[\]/g, '').replace(/\{\}/g, '');
    var nk = String(normFieldKey || '').toLowerCase().replace(/\[\]/g, '').replace(/\{\}/g, '');
    if (!nk) return false;
    if (dk === nk) return true;
    if (dk.indexOf('admin.') === 0 && nk === dk.replace('admin.', '')) return true;
    var dLast = dk.split('.').pop();
    var nLast = nk.split('.').pop();
    if (dLast && (dLast === nLast || dLast === nk || nLast === dk)) return true;
    if (dk.indexOf('breadth') >= 0 && nk.indexOf('breadth') >= 0) return true;
    if (dk.indexOf('heatmap') >= 0 && (nk.indexOf('sector') >= 0 || nk.indexOf('family') >= 0 || nk.indexOf('story') >= 0)) return true;
    if (dk.indexOf('liquidity') >= 0 && nk.indexOf('liquidity') >= 0) return true;
    if ((dk.indexOf('flow') >= 0 || dk.indexOf('score') >= 0) && (nk.indexOf('flow') >= 0 || nk.indexOf('net') >= 0)) return true;
    if (dk.indexOf('top10') >= 0 && (nk.indexOf('sector') >= 0 || nk.indexOf('family') >= 0 || nk.indexOf('story') >= 0)) return true;
    if (dk.indexOf('movers') >= 0 && (nk.indexOf('stock') >= 0 || nk.indexOf('stocks') >= 0)) return true;
    if (dk.indexOf('sector') >= 0 && nk.indexOf('sector') >= 0) return true;
    if (dk.indexOf('market') >= 0 && (nk.indexOf('market') >= 0 || nk === 'exchanges')) return true;
    if (dk.indexOf('exchange') >= 0 && nk.indexOf('exchange') >= 0) return true;
    if (dk.indexOf('watchlist') >= 0 && nk.indexOf('watchlist') >= 0) return true;
    if (dk.indexOf('community') >= 0 && nk.indexOf('community') >= 0) return true;
    if (dk.indexOf('affiliate') >= 0) return true;
    if (dk.indexOf('faq') >= 0) return true;
    if (dk.indexOf('user') >= 0 || dk.indexOf('profile') >= 0) return true;
    if (dk.indexOf('meta') >= 0 && (nk.indexOf('market') >= 0 || nk.indexOf('connection') >= 0)) return true;
    return false;
  }

  function resolveInputsForDisplayField(displayField, layer3Outputs, algorithmId) {
    var key = displayField.key;
    var matched = [];
    var seen = {};

    (layer3Outputs || []).forEach(function (o) {
      if (key.indexOf('admin.') === 0 && o.line === key) {
        if (!seen[o.line]) { seen[o.line] = true; matched.push(formatInputLine(o)); }
        return;
      }
      if (fieldKeysRelated(key, o.fieldKey) || fieldKeysRelated(key, o.line)) {
        if (!seen[o.line]) { seen[o.line] = true; matched.push(formatInputLine(o)); }
      }
    });

    if (!matched.length && layer3Outputs && layer3Outputs.length && layer3Outputs.length <= 5) {
      layer3Outputs.forEach(function (o) {
        if (!seen[o.line]) { seen[o.line] = true; matched.push(formatInputLine(o)); }
      });
    }

    if (!matched.length && algorithmId) {
      matched.push('③ ' + algorithmId + ' · (computed — chưa map input chi tiết)');
    }

    return matched;
  }

  function attachLayer3Inputs(blockId, dataFields) {
    var meta = getBlockMeta(blockId);
    var algId = meta && meta.algorithmId;
    var l3 = buildLayer3Outputs(algId);
    return (dataFields || []).map(function (f) {
      if (f.inputs) return f;
      f.inputs = resolveInputsForDisplayField(f, l3, algId);
      return f;
    });
  }

  function fields(arr) {
    return arr.filter(function (f) { return f != null; });
  }

  function resolvers() {
    var s = snap();
    var MM = global.IfluxMockMarket;
    var cfg = global.PlatformLayersCatalog ? PlatformLayersCatalog.getAdminConfig() : {};

    return {
      market_overview: function () {
        if (!s) return fields([field('error', 'Lỗi', 'IfluxMockMarket chưa load')]);
        var m = s.entities.market;
        return fields([
          field('meta.data_as_of', 'Cập nhật lúc', s.meta && s.meta.data_as_of),
          field('meta.connection', 'Kết nối', s.meta && s.meta.connection),
          field('market.index_name', 'Chỉ số', m.index_name),
          field('market.ig', 'IG', m.ig),
          field('market.pg', 'PG (%)', m.pg),
          field('market.breadth_up', 'Mã tăng', m.breadth_up),
          field('market.breadth_down', 'Mã giảm', m.breadth_down),
          field('market.status', 'Trạng thái phiên', m.status),
          field('exchanges.vnindex', 'VN-Index', s.entities.exchanges && s.entities.exchanges.vnindex)
        ]);
      },

      breadth: function () {
        if (!s) return [];
        var b = s.entities.breadth || {};
        return fields([
          field('breadth.vnindex', 'VN-Index', b.vnindex),
          field('breadth.hose', 'HOSE', b.hose),
          field('breadth.hnx', 'HNX', b.hnx),
          field('breadth.upcom', 'UPCOM', b.upcom)
        ]);
      },

      movers: function () {
        if (!s) return [];
        return fields([
          field('movers.gainers[]', 'Top tăng (mã)', s.movers && s.movers.gainers),
          field('movers.losers[]', 'Top giảm (mã)', s.movers && s.movers.losers),
          field('stocks[gainers]', 'Snapshot CP tăng', (s.movers && s.movers.gainers || []).map(function (tk) {
            return s.entities.stocks[tk] ? { ticker: tk, change_pct: s.entities.stocks[tk].change_pct, price: s.entities.stocks[tk].price } : tk;
          }))
        ]);
      },

      heatmap_sector: function () {
        if (!MM || !MM.getHeatmapGroups) return [];
        var groups = MM.getHeatmapGroups('sector') || [];
        return fields([
          field('heatmap.sector[]', 'Nhóm ngành (perf, weight, tickers)', groups),
          field('admin.heatmap_min_members', 'Ngưỡng tối thiểu CP/nhóm', cfg.heatmap_min_members)
        ]);
      },

      heatmap_family: function () {
        if (!MM || !MM.getHeatmapGroups) return [];
        var groups = MM.getHeatmapGroups('family') || [];
        return fields([field('heatmap.family[]', 'Nhóm họ CP', groups)]);
      },

      heatmap_chu_de: function () {
        if (!MM || !MM.getHeatmapGroups) return [];
        var groups = MM.getHeatmapGroups('chu-de') || MM.getHeatmapGroups('story') || [];
        return fields([field('heatmap.chu_de[]', 'Nhóm chủ đề', groups)]);
      },
      heatmap_story: function () {
        if (!MM || !MM.getHeatmapGroups) return [];
        var groups = MM.getHeatmapGroups('chu-de') || MM.getHeatmapGroups('story') || [];
        return fields([field('heatmap.chu_de[]', 'Nhóm chủ đề', groups)]);
      },

      liquidity_volume: function () {
        if (!MM || !MM.getLiquiditySeries) return [];
        var series = MM.getLiquiditySeries('vnindex', 'volume', 1) || [];
        return fields([
          field('liquidity.volume[]', 'KLGD lũy kế VNINDEX (slot 5 phút)', series),
          field('admin.liq_slot_minutes', 'Khung slot (phút)', cfg.liq_slot_minutes)
        ]);
      },

      liquidity_value: function () {
        if (!MM || !MM.getLiquiditySeries) return [];
        var series = MM.getLiquiditySeries('vnindex', 'value', 1) || [];
        return fields([field('liquidity.value[]', 'GTGD lũy kế VNINDEX', series)]);
      },

      top10_sector: function () {
        if (!MM || !MM.getTop10Today) return [];
        return fields([field('top10.sector[]', 'Top 10 ngành hôm nay', MM.getTop10Today('sector'))]);
      },

      top10_family: function () {
        if (!MM || !MM.getTop10Today) return [];
        return fields([field('top10.family[]', 'Top 10 họ CP', MM.getTop10Today('family'))]);
      },

      top10_chu_de: function () {
        if (!MM || !MM.getTop10Today) return [];
        return fields([field('top10.chu_de[]', 'Top 10 chủ đề', MM.getTop10Today('chu-de') || MM.getTop10Today('story'))]);
      },
      top10_story: function () {
        if (!MM || !MM.getTop10Today) return [];
        return fields([field('top10.chu_de[]', 'Top 10 chủ đề', MM.getTop10Today('chu-de') || MM.getTop10Today('story'))]);
      },

      sector_momentum: function () {
        if (!s) return [];
        return fields([field('sectors{}', 'Động lượng ngành (IG/PG)', s.entities.sectors)]);
      },

      flow_summary: function () {
        if (!MM || !MM.getMarketFlowSummary) return [];
        var flow = MM.getMarketFlowSummary();
        return fields([
          field('flow.summary', 'Tóm tắt 4 chủ thể', flow),
          field('admin.flow_lot_big', 'Ngưỡng lô lớn (₫)', cfg.flow_lot_big),
          field('admin.smart_money_threshold', 'Ngưỡng Smart Money (₫)', cfg.smart_money_threshold)
        ]);
      },

      flow_zone: function () {
        if (!MM || !MM.getMarketZoneContext) return [];
        return fields([field('flow.zone_context', 'Ngữ cảnh Hỗ trợ/Kháng cự', MM.getMarketZoneContext())]);
      },

      flow_net_top: function () {
        if (!MM || !MM.getFlowTopNetList) return [];
        return fields([field('flow.net_top', 'Top KL ròng (CP)', MM.getFlowTopNetList({ subject: 'stock', scope: 'market', count: 10 }))]);
      },

      flow_stat_stock_in: function () { return flowStat('stock', 'in'); },
      flow_stat_stock_out: function () { return flowStat('stock', 'out'); },
      flow_stat_sector_in: function () { return flowStat('sector', 'in'); },
      flow_stat_sector_out: function () { return flowStat('sector', 'out'); },
      flow_stat_hst_in: function () { return flowStat('family', 'in'); },
      flow_stat_hst_out: function () { return flowStat('family', 'out'); },
      flow_stat_chu_de_in: function () { return flowStat('chu-de', 'in') || flowStat('story', 'in') || flowStat('chude', 'in'); },
      flow_stat_chu_de_out: function () { return flowStat('chu-de', 'out') || flowStat('story', 'out') || flowStat('chude', 'out'); },
      flow_stat_story_in: function () { return flowStat('chu-de', 'in') || flowStat('story', 'in'); },
      flow_stat_story_out: function () { return flowStat('chu-de', 'out') || flowStat('story', 'out'); },
      flow_ex_tm_in: function () { return flowStat('smart_money', 'in'); },
      flow_ex_tm_out: function () { return flowStat('smart_money', 'out'); },

      flow_score_basic: function () {
        return fields([
          field('flow.score.basic[]', 'Score cơ bản CP (demo)', demoFlowScores('basic')),
          field('admin.smart_money_threshold', 'Ngưỡng TM', cfg.smart_money_threshold)
        ]);
      },

      flow_score_adv: function () {
        return fields([field('flow.score.advanced[]', 'Score nâng cao (demo)', demoFlowScores('advanced'))]);
      },

      flow_score_ex: function () {
        return fields([field('flow.score.exclusive[]', 'Score Độc quyền Elite (demo)', demoFlowScores('exclusive'))]);
      },

      community_trending: function () {
        if (!global.IfluxNewsStore) return fields([field('community.trending[]', 'Trending (demo)', demoTrending())]);
        var list = IfluxNewsStore.listTrendingTickers ? IfluxNewsStore.listTrendingTickers(8) : demoTrending();
        return fields([field('community.trending[]', 'CP/story trending', list)]);
      },

      community_news: function () {
        if (!global.IfluxNewsStore || !IfluxNewsStore.listNewsHero) {
          return fields([field('community.news[]', 'Tin hero (demo)', [{ title: 'Demo news feed', source: 'sandbox' }])]);
        }
        return fields([field('community.news[]', 'Tin tức hero', IfluxNewsStore.listNewsHero(5))]);
      },

      community_experts: function () {
        return fields([field('news.experts[]', 'Chuyên gia nổi bật', demoExperts())]);
      },

      community_active: function () {
        return fields([field('community.active[]', 'Thành viên tích cực', demoActiveMembers())]);
      },

      community_topwl: function () {
        if (global.IfluxCommunityTopWatchlistStore && IfluxCommunityTopWatchlistStore.list) {
          return fields([field('community.top_watchlist[]', 'Top Watchlist', IfluxCommunityTopWatchlistStore.list())]);
        }
        return fields([field('community.top_watchlist[]', 'Top Watchlist (demo)', demoTopWatchlist())]);
      },

      watchlist: function () {
        if (global.IfluxWatchlistStore && IfluxWatchlistStore.read) {
          var st = IfluxWatchlistStore.read();
          return fields([
            field('watchlist.folders[]', 'Thư mục', st.folders),
            field('watchlist.memberships{}', 'Mã → folder', st.memberships)
          ]);
        }
        if (!s) return [];
        return fields([
          field('watchlist.tickers[]', 'Mã theo dõi', s.watchlist),
          field('watchlist.stocks[]', 'Snapshot', (s.watchlist || []).map(function (tk) { return s.entities.stocks[tk]; }))
        ]);
      },

      profile_sidebar: function () {
        var user = global.IfluxAuth && IfluxAuth.getUser ? IfluxAuth.getUser() : null;
        return fields([field('user.profile', 'User session', user ? { id: user.id, display_name: user.display_name, tier: user.tier } : null)]);
      },

      profile_plan: function () {
        var user = global.IfluxAuth && IfluxAuth.getUser ? IfluxAuth.getUser() : null;
        return fields([field('user.plan', 'Gói cước', user ? { tier: user.tier, tier_label: user.tier_label } : { tier: 'demo' })]);
      },

      loyalty_intro: function () {
        return fields([field('loyalty.intro', 'Nội dung tab Giới thiệu', { type: 'static_html', source: 'loyalty/index.html#intro' })]);
      },

      loyalty_affiliate: function () {
        if (global.IfluxLoyaltyAffiliateStore) {
          var user = global.IfluxAuth && IfluxAuth.getUser ? IfluxAuth.getUser() : { id: 'usr_demo_001' };
          return fields([
            field('affiliate.config', 'Cấu hình hoa hồng', IfluxLoyaltyAffiliateStore.getConfig()),
            field('affiliate.network[]', 'Thành viên mạng', IfluxLoyaltyAffiliateStore.listNetworkMembers(user.id)),
            field('affiliate.commissions[]', 'Hoa hồng', IfluxLoyaltyAffiliateStore.listForUser(user.id))
          ]);
        }
        return fields([field('affiliate', 'Affiliate (demo)', { status: 'store_not_loaded' })]);
      },

      faq_list: function () {
        if (global.IfluxFaqStore && IfluxFaqStore.list) {
          return fields([field('faq.items[]', 'Danh sách FAQ', IfluxFaqStore.list({ category: 'all' }))]);
        }
        return fields([field('faq.items[]', 'FAQ (demo)', [{ q: 'Demo?', a: 'Sandbox' }])]);
      },

      faq_support: function () {
        return fields([field('faq.support', 'Liên hệ hỗ trợ', { email: 'support@iflux.vn', links: ['pricing', 'loyalty'] })]);
      },

      generic: function (blockId) {
        return fields([field('block.id', 'Block ID', blockId), field('note', 'Ghi chú', 'Chưa map resolver chi tiết — dùng EntitlementCatalog.')]);
      }
    };
  }

  function flowStat(scope, dir) {
    var MM = global.IfluxMockMarket;
    if (!MM || !MM.getFlowTopNetList) return fields([field('flow.stat', scope + '/' + dir, [])]);
    var data = MM.getFlowTopNetList({ subject: scope === 'smart_money' ? 'smart_money' : scope, scope: 'market', count: 10, direction: dir });
    return fields([field('flow.stat.' + scope + '.' + dir, 'TOP 10 ' + scope + ' ' + dir, data)]);
  }

  function demoFlowScores(tier) {
    var s = snap();
    if (!s) return [];
    var tickers = ['HPG', 'VCB', 'FPT', 'MWG', 'SSI'].slice(0, tier === 'basic' ? 5 : tier === 'advanced' ? 8 : 10);
    return tickers.map(function (tk, i) {
      return { ticker: tk, score: Math.round(62 + i * 4 + (tier === 'exclusive' ? 12 : 0)), tier: tier };
    });
  }

  function demoTrending() {
    return [
      { ticker: 'HPG', label: 'Hòa Phát', heat: 92 },
      { ticker: 'VCB', label: 'Vietcombank', heat: 88 },
      { ticker: 'FPT', label: 'FPT', heat: 81 }
    ];
  }

  function demoExperts() {
    return [
      { name: 'Nguyễn Văn Minh', followers: 1280, tier: 'Elite' },
      { name: 'Trần Thị B', followers: 864, tier: 'Premium' }
    ];
  }

  function demoActiveMembers() {
    return [
      { name: 'User A', score: 42, comments: 18 },
      { name: 'User B', score: 35, comments: 12 }
    ];
  }

  function demoTopWatchlist() {
    return [{ ticker: 'HPG', watchers: 420 }, { ticker: 'FPT', watchers: 380 }];
  }

  function resolveDisplayBlock(blockId) {
    blockId = String(blockId || '');
    var catalog = global.PlatformLayersCatalog;
    var resolverKey = (catalog && catalog.BLOCK_RESOLVER && catalog.BLOCK_RESOLVER[blockId]) || 'generic';
    var map = resolvers();
    var fn = map[resolverKey] || map.generic;
    var dataFields = fn === map.generic ? fn(blockId) : fn();
    var meta = getBlockMeta(blockId);
    dataFields = attachLayer3Inputs(blockId, dataFields);
    return {
      blockId: blockId,
      resolver: resolverKey,
      algorithmId: meta && meta.algorithmId,
      fields: dataFields
    };
  }

  function resolveNormalizedEntity(entityId) {
    var catalog = global.PlatformLayersCatalog;
    var entity = (catalog && catalog.NORMALIZED || []).find(function (e) { return e.id === entityId; });
    if (!entity) return { fields: [] };
    var cfg = catalog.getAdminConfig();
    var s = snap();
    var fieldsOut = [];

    if (entityId === 'NORM-MARKET-AGG' && s) {
      fieldsOut = [
        field('market', 'Tổng hợp', s.entities.market),
        field('exchanges', 'Chỉ số sàn', s.entities.exchanges)
      ];
    } else if (entityId === 'NORM-BREADTH' && s) {
      fieldsOut = [field('breadth', 'Độ rộng', s.entities.breadth)];
    } else if (entityId === 'NORM-STOCK-SNAP' && s) {
      fieldsOut = [field('stocks{}', 'Catalog CP', Object.keys(s.entities.stocks).slice(0, 5).reduce(function (o, k) { o[k] = s.entities.stocks[k]; return o; }, {})),
        field('stocks._count', 'Tổng mã', Object.keys(s.entities.stocks).length)];
    } else if (entityId === 'NORM-HEATMAP' && global.IfluxMockMarket) {
      fieldsOut = [
        field('sector[]', 'Ngành', IfluxMockMarket.getHeatmapGroups('sector')),
        field('family[]', 'Họ', IfluxMockMarket.getHeatmapGroups('family'))
      ];
    } else if (entityId === 'NORM-LIQUIDITY' && global.IfluxMockMarket) {
      fieldsOut = [field('liquidity.volume[]', 'KLGD', IfluxMockMarket.getLiquiditySeries('vnindex', 'volume', 1))];
    } else if (entityId === 'NORM-FLOW-SUMMARY' && global.IfluxMockMarket) {
      fieldsOut = [field('flow', 'Dòng tiền', IfluxMockMarket.getMarketFlowSummary())];
    } else if (entityId === 'NORM-FLOW-NET' && global.IfluxMockMarket) {
      fieldsOut = [field('net_top', 'Top ròng', IfluxMockMarket.getFlowTopNetList({ subject: 'stock', scope: 'market', count: 5 }))];
    } else {
      fieldsOut = [field('entity', 'Entity', entity.label + ' — demo placeholder')];
    }

    (entity.adminKeys || []).forEach(function (k) {
      fieldsOut.push(field('admin.' + k, 'Admin: ' + k, cfg[k]));
    });

    return { entityId: entityId, entity: entity, fields: fieldsOut };
  }

  function resolveRawSource(sourceId) {
    var catalog = global.PlatformLayersCatalog;
    var src = (catalog && catalog.RAW_SOURCES || []).find(function (r) { return r.id === sourceId; });
    var live = global.PlatformLayersDnseLive || null;
    var probeSample = null;
    var connection = (live && live.connection) || 'pending';

    if (live && live.probes) {
      if (sourceId === 'RAW-DNSE-WORKING-DATES' && live.probes.workingDates) {
        probeSample = live.probes.workingDates.sample;
      } else if (sourceId === 'RAW-DNSE-SESSION' && live.probes.tradingSession) {
        probeSample = live.probes.tradingSession.sample;
      } else if (sourceId === 'RAW-DNSE-INSTRUMENTS' && live.probes.instruments) {
        probeSample = live.probes.instruments.sample;
      } else if ((sourceId === 'RAW-DNSE-TRADE-LATEST' || sourceId === 'RAW-DNSE-MQTT-TICK') && live.probes.latestTrade) {
        probeSample = live.probes.latestTrade.sample;
      }
    }

    var fields = [
      field('stream.id', 'Mã nguồn thô', sourceId),
      field('stream.endpoint', 'Endpoint DNSE', src ? (src.endpoint || src.channel) : '—'),
      field('stream.protocol', 'Giao thức', src ? src.protocol : '—'),
      field('connection.status', 'Trạng thái kết nối', connection),
      field('schema.fields[]', 'Field DNSE', src ? src.fields : []),
      field('probe.sample', 'Mẫu live (nếu có)', probeSample)
    ];

    if (src && src.coreRelevant) {
      fields.push(field('iflux.core', 'Dùng cho Tầng I Core', true));
    }

    return { sourceId: sourceId, source: src, fields: fields };
  }

  global.PlatformLayersResolver = {
    resolveDisplayBlock: resolveDisplayBlock,
    resolveNormalizedEntity: resolveNormalizedEntity,
    resolveRawSource: resolveRawSource,
    buildLayer3Outputs: buildLayer3Outputs,
    fmtVal: fmtVal
  };
})(window);
