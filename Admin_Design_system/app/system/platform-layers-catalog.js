/**
 * ADM-SYS-007 — Kiến trúc 4 tầng dữ liệu iFlux
 * (4) Hiển thị ← (3) Giải thuật ← (2) Chuẩn hóa ← (1) Thô
 */
(function (global) {
  'use strict';

  var LAYERS = [
    { id: 'display', tab: 'tab-display', label: 'Tầng hiển thị', layer: 4, icon: 'ti-layout-dashboard', desc: 'Block/widget frontend — kết quả cuối user nhìn thấy.' },
    { id: 'algorithm', tab: 'tab-algorithm', label: 'Tầng giải thuật', layer: 3, icon: 'ti-math-function', desc: 'Bài toán Core — đầu ra = Tầng hiển thị; đầu vào = Chuẩn hóa + cấu hình Admin.' },
    { id: 'normalized', tab: 'tab-normalized', label: 'Tầng dữ liệu chuẩn hóa', layer: 2, icon: 'ti-database-cog', desc: 'Nguyên liệu đã chuẩn hóa từ tick thô — lô lớn/nhỏ, VWAP, breadth…' },
    { id: 'raw', tab: 'tab-raw', label: 'Tầng dữ liệu thô', layer: 1, icon: 'ti-plug-connected', desc: 'Kết nối market-data provider — tick, order book, reference.' }
  ];

  var RAW_SOURCES = [
    { id: 'RAW-DNSE-INSTRUMENTS', provider: 'DNSE', channel: 'Danh mục mã CK', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /instruments', fields: ['symbol', 'marketId', 'securityGroupId', 'listedDate', 'shortName', 'name', 'indexName[]'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-SEC-DEF', provider: 'DNSE', channel: 'Trần/sàn/tham chiếu', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/{symbol}/secdef', fields: ['symbol', 'basicPrice', 'ceilingPrice', 'floorPrice', 'securityStatus', 'time'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-TRADE-LATEST', provider: 'DNSE', channel: 'Khớp gần nhất', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/{symbol}/trades/latest', fields: ['symbol', 'matchPrice', 'matchQtty', 'side', 'totalVolumeTraded', 'grossTradeAmount', 'time'], coreRelevant: true, status: 'pending' },
    { id: 'RAW-DNSE-TRADE-HIST', provider: 'DNSE', channel: 'Lịch sử khớp lệnh', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/{symbol}/trades', fields: ['matchPrice', 'matchQtty', 'side', 'time', 'nextPageToken'], coreRelevant: true, status: 'pending' },
    { id: 'RAW-DNSE-QUOTE-HIST', provider: 'DNSE', channel: 'Lịch sử bid/ask', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/{symbol}/quotes', fields: ['bid[].price', 'bid[].quantity', 'offer[].price', 'offer[].quantity', 'time'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-CLOSE', provider: 'DNSE', channel: 'Giá đóng cửa', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/{symbol}/close', fields: ['symbol', 'closePrice', 'time'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-OHLC', provider: 'DNSE', channel: 'Lịch sử OHLC', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/ohlc', fields: ['t[]', 'o[]', 'h[]', 'l[]', 'c[]', 'v[]', 'nextTime'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-FOREIGN', provider: 'DNSE', channel: 'NĐT nước ngoài', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /price/{symbol}/foreign-trading', fields: ['buyVolume', 'sellVolume', 'totalBuyTradedAmount', 'totalSellTradedAmount', 'time'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-SESSION', provider: 'DNSE', channel: 'Phiên giao dịch', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /market/trading-session', fields: ['tradingSessionId', 'eventId', 'marketId', 'boardId', 'time'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-WORKING-DATES', provider: 'DNSE', channel: 'Ngày làm việc', protocol: 'REST', transport: 'HTTPS', endpoint: 'GET /market/working-dates', fields: ['workingDates[]'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-MQTT-TICK', provider: 'DNSE', channel: 'Tick realtime + phía chủ động', protocol: 'MQTT', transport: 'MQTT/WSS', endpoint: '.../mdds/tick/v1/roundlot/symbol/{symbol}', fields: ['symbol', 'matchPrice', 'matchQtty', 'side', 'totalVolumeTraded', 'grossTradeAmount', 'tradingSessionId', 'sendingTime'], coreRelevant: true, status: 'pending' },
    { id: 'RAW-DNSE-MQTT-TOPPRICE', provider: 'DNSE', channel: 'Sổ lệnh bid/ask realtime', protocol: 'MQTT', transport: 'MQTT/WSS', endpoint: '.../mdds/topprice/v1/roundlot/symbol/{symbol}', fields: ['bid[].price', 'bid[].qtty', 'offer[].price', 'offer[].qtty', 'sendingTime'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-MQTT-STOCKINFO', provider: 'DNSE', channel: 'Thông tin mã realtime (trần/sàn/tham chiếu)', protocol: 'MQTT', transport: 'MQTT/WSS', endpoint: '.../mdds/stockinfo/v1/roundlot/symbol/{symbol}', fields: ['symbol', 'referencePrice', 'highLimitPrice', 'lowLimitPrice', 'securityGroupId', 'tradingTime'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-MQTT-OHLC', provider: 'DNSE', channel: 'OHLC realtime (nhiều khung)', protocol: 'MQTT', transport: 'MQTT/WSS', endpoint: '.../mdds/v2/ohlc/stock/{resolution}/{symbol}', fields: ['symbol', 'open', 'high', 'low', 'close', 'volume', 'time', 'resolution'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-MQTT-MARKET-INDEX', provider: 'DNSE', channel: 'Chỉ số thị trường realtime', protocol: 'MQTT', transport: 'MQTT/WSS', endpoint: '.../mdds/index/v1/{indexName}', fields: ['indexName', 'indexValue', 'changePercent', 'totalTradedValue', 'totalVolumeTraded'], coreRelevant: false, status: 'pending' },
    { id: 'RAW-DNSE-MQTT-BOARDEVENT', provider: 'DNSE', channel: 'Sự kiện phiên / trạng thái bảng', protocol: 'MQTT', transport: 'MQTT/WSS', endpoint: '.../mdds/boardevent/v1/...', fields: ['tradingSessionId', 'eventId', 'marketId', 'boardId', 'sendingTime'], coreRelevant: false, status: 'pending' },
    /* Content Engine — song song DNSE (không phải market tick) */
    { id: 'RAW-CONTENT-VNSTOCK', provider: 'Vnstock News', channel: 'Crawl tin VN (RSS/Sitemap)', protocol: 'Connector', transport: 'Worker', endpoint: 'Crawler / BatchCrawler → POST /api/content/ingest', fields: ['url', 'title', 'short_description', 'content', 'publish_time', 'author', 'category', 'tags', 'image_url', 'source'], coreRelevant: true, status: 'active' },
    { id: 'RAW-CONTENT-INTERNAL', provider: 'iFlux', channel: 'Seed / CMS / AI ingest', protocol: 'REST', transport: 'HTTPS', endpoint: 'POST /api/content/ingest', fields: ['url', 'title', 'excerpt', 'topics[]', 'entities[]'], coreRelevant: true, status: 'active' }
  ];

  var NORMALIZED = [
    { id: 'NORM-TICK', label: 'Tick chuẩn hóa', group: 'Thị trường', inputs: ['RAW-DNSE-MQTT-TICK', 'RAW-DNSE-TRADE-LATEST'], fields: ['ticker', 'price', 'qty', 'matched_at', 'exchange', 'lot_class'], adminKeys: ['lot_threshold_big', 'lot_threshold_small'] },
    { id: 'NORM-STOCK-SNAP', label: 'Snapshot cổ phiếu', group: 'Thị trường', inputs: ['NORM-TICK', 'RAW-DNSE-INSTRUMENTS', 'RAW-DNSE-SEC-DEF'], fields: ['ticker', 'price', 'change_pct', 'volume', 'market_cap'], adminKeys: [] },
    { id: 'NORM-BREADTH', label: 'Độ rộng thị trường', group: 'Thị trường', inputs: ['NORM-STOCK-SNAP'], fields: ['exchange', 'up', 'down', 'ref', 'ceiling', 'floor'], adminKeys: [] },
    { id: 'NORM-INDEX-SNAPSHOT', label: 'Snapshot chỉ số sàn', group: 'Thị trường', inputs: ['RAW-DNSE-MQTT-MARKET-INDEX'], fields: ['index_name', 'index_value', 'change', 'change_pct', 'status'], adminKeys: [] },
    { id: 'NORM-MARKET-AGG', label: 'Tổng hợp chỉ số / IG·PG', group: 'Thị trường', inputs: ['NORM-STOCK-SNAP', 'NORM-BREADTH'], fields: ['index_name', 'ig', 'pg', 'breadth_up', 'breadth_down', 'status'], adminKeys: ['index_weight_method'] },
    { id: 'NORM-HEATMAP', label: 'Nhóm heatmap (ngành/họ/story)', group: 'Thị trường', inputs: ['NORM-STOCK-SNAP', 'RAW-DNSE-INSTRUMENTS'], fields: ['group_id', 'name', 'perf', 'weight', 'tickers[]'], adminKeys: ['heatmap_min_members'] },
    { id: 'NORM-LIQUIDITY', label: 'Thanh khoản lũy kế', group: 'Thị trường', inputs: ['NORM-TICK'], fields: ['exchange', 'metric', 'slots[]', 'cumulative[]'], adminKeys: ['liq_slot_minutes'] },
    { id: 'NORM-FLOW-NET', label: 'Dòng tiền ròng theo chủ thể', group: 'Dòng tiền', inputs: ['NORM-TICK'], fields: ['subject', 'scope', 'buyers[]', 'sellers[]'], adminKeys: ['flow_lot_big', 'smart_money_threshold'] },
    { id: 'NORM-FLOW-SUMMARY', label: 'Tóm tắt phiên dòng tiền', group: 'Dòng tiền', inputs: ['NORM-FLOW-NET'], fields: ['foreign', 'institutional', 'proprietary', 'retail'], adminKeys: [] },
    { id: 'NORM-CONTENT-ARTICLE', label: 'Bài tin chuẩn hóa (Content Engine)', group: 'Nội dung', inputs: ['RAW-CONTENT-VNSTOCK', 'RAW-CONTENT-INTERNAL'], fields: ['article_id', 'title', 'excerpt', 'url', 'published_at', 'source', 'topics[]', 'symbols[]'], adminKeys: [] },
    { id: 'NORM-CONTENT-TOPIC', label: 'Topic tiền-Story', group: 'Nội dung', inputs: ['NORM-CONTENT-ARTICLE'], fields: ['topic_id', 'slug', 'label', 'status', 'interest_score', 'article_count'], adminKeys: ['topic_promote_min_articles'] },
    { id: 'NORM-CONTENT-STORY', label: 'Story entity + mapping mã', group: 'Nội dung', inputs: ['NORM-CONTENT-TOPIC', 'NORM-CONTENT-ARTICLE'], fields: ['story_id', 'slug', 'lifecycle', 'mappings[]', 'flow_net_value', 'top_relevance'], adminKeys: ['topic_auto_promote', 'topic_auto_promote_min_interest', 'topic_auto_promote_min_stocks'] },
    { id: 'NORM-COMMUNITY', label: 'Feed & trending cộng đồng', group: 'Cộng đồng', inputs: ['NORM-STOCK-SNAP', 'NORM-CONTENT-ARTICLE'], fields: ['posts[]', 'trending_tickers[]', 'experts[]'], adminKeys: ['community_rank_window'] },
    { id: 'NORM-WATCHLIST', label: 'Watchlist user', group: 'Cá nhân', inputs: ['NORM-STOCK-SNAP'], fields: ['folders[]', 'memberships{}'], adminKeys: ['watchlist_max_items'] }
  ];

  var ADMIN_DEFAULTS = {
    lot_threshold_big: 500000000,
    lot_threshold_small: 100000000,
    smart_money_threshold: 1000000000,
    flow_lot_big: 500000000,
    liq_slot_minutes: 5,
    heatmap_min_members: 2,
    index_weight_method: 'float_cap',
    community_rank_window: 7,
    topic_promote_min_articles: 3,
    /* Interest Score v1 — trọng số tăng dần (View rẻ … Comment đắt) */
    interest_w_view: 1,
    interest_w_search: 3,
    interest_w_like: 5,
    interest_w_favorite: 8,
    interest_w_share: 8,
    interest_w_comment: 10,
    /* P2 Relevance + auto-promote */
    relevance_w_mention: 10,
    relevance_w_follow: 12,
    relevance_keep_min: 1,
    topic_auto_promote: false,
    topic_auto_promote_min_interest: 50,
    topic_auto_promote_min_stocks: 2
  };

  /** Resolver key — map block → cách lấy giá trị demo */
  var BLOCK_RESOLVER = {
    'WGT-MKT-001': 'market_overview',
    'WGT-MKT-002': 'breadth',
    'WGT-MKT-003': 'movers',
    'WGT-MKT-004': 'heatmap_sector',
    'WGT-MKT-005': 'heatmap_family',
    'WGT-MKT-006': 'heatmap_chu_de',
    'WGT-MKT-007': 'liquidity_volume',
    'WGT-MKT-008': 'liquidity_value',
    'WGT-TOP-001': 'top10_sector',
    'WGT-TOP-002': 'top10_family',
    'WGT-TOP-003': 'top10_chu_de',
    'WGT-SEC-001': 'sector_momentum',
    'WGT-FLW-001': 'flow_summary',
    'WGT-FLW-CTX': 'flow_zone',
    'WGT-FLW-SUBJ-STOCK': 'flow_net_top',
    'WGT-FLW-SUBJ-SECTOR': 'flow_net_top',
    'WGT-FLW-SUBJ-HST': 'flow_net_top',
    'WGT-FLW-SUBJ-STORY': 'flow_net_top',
    'WGT-FLW-SUBJ-CHUDE': 'flow_net_top',
    'WGT-FLW-STAT_STOCK_IN': 'flow_stat_stock_in',
    'WGT-FLW-STAT_STOCK_OUT': 'flow_stat_stock_out',
    'WGT-FLW-STAT_SECTOR_IN': 'flow_stat_sector_in',
    'WGT-FLW-STAT_SECTOR_OUT': 'flow_stat_sector_out',
    'WGT-FLW-STAT_HST_IN': 'flow_stat_hst_in',
    'WGT-FLW-STAT_HST_OUT': 'flow_stat_hst_out',
    'WGT-FLW-STAT_STORY_IN': 'flow_stat_chu_de_in',
    'WGT-FLW-STAT_STORY_OUT': 'flow_stat_chu_de_out',
    'WGT-FLW-STAT_CHUDE_IN': 'flow_stat_chu_de_in',
    'WGT-FLW-STAT_CHUDE_OUT': 'flow_stat_chu_de_out',
    'WGT-FLW-EX_TM_IN': 'flow_ex_tm_in',
    'WGT-FLW-EX_TM_OUT': 'flow_ex_tm_out',
    'WGT-COM-001': 'community_trending',
    'WGT-COM-002': 'community_active',
    'WGT-COM-003': 'community_experts',
    'WGT-COM-004': 'community_topwl',
    'WGT-WAT-001': 'watchlist',
    'BLK-MKT-OVERVIEW': 'market_overview',
    'BLK-MKT-BREADTH': 'breadth',
    'BLK-MKT-HEAT-SECTOR': 'heatmap_sector',
    'BLK-MKT-HEAT-FAMILY': 'heatmap_family',
    'BLK-MKT-HEAT-CHUDE': 'heatmap_chu_de',
    'BLK-MKT-HEAT-STORY': 'heatmap_chu_de',
    'BLK-MKT-LIQ': 'liquidity_volume',
    'BLK-MKT-RANKINGS': 'top10_sector',
    'BLK-FLW-MKT-SIDE': 'flow_zone',
    'BLK-FLW-NET-STOCK': 'flow_net_top',
    'BLK-FLW-NET-SECTOR': 'flow_net_top',
    'BLK-FLW-NET-HST': 'flow_net_top',
    'BLK-FLW-NET-CHUDE': 'flow_net_top',
    'BLK-FLW-SCORE-BASIC': 'flow_score_basic',
    'BLK-FLW-SCORE-ADV': 'flow_score_adv',
    'BLK-FLW-SCORE-EX': 'flow_score_ex',
    'BLK-COM-TRENDING': 'community_trending',
    'BLK-COM-CHUDE-TOP': 'community_story_top',
    'BLK-COM-NEWS': 'community_news',
    'BLK-COM-EXPERTS': 'community_experts',
    'BLK-COM-ACTIVE': 'community_active',
    'BLK-COM-OVERVIEW': 'market_overview',
    'BLK-COM-BREADTH': 'breadth',
    'BLK-COM-TOPWL': 'community_topwl',
    'BLK-LOY-INTRO': 'loyalty_intro',
    'BLK-LOY-AFFILIATE': 'loyalty_affiliate',
    'BLK-FAQ-LIST': 'faq_list',
    'BLK-FAQ-SUPPORT': 'faq_support'
  };

  var ALGORITHMS = [
    { id: 'ALG-MKT-OVERVIEW', label: 'Tổng quan thị trường (IG/PG/Breadth)', group: 'Thị trường', outputs: ['WGT-MKT-001', 'BLK-MKT-OVERVIEW', 'BLK-COM-OVERVIEW'], normalized: ['NORM-INDEX-SNAPSHOT', 'NORM-MARKET-AGG', 'NORM-BREADTH'], adminKeys: ['index_weight_method'] },
    { id: 'ALG-MKT-BREADTH', label: 'Độ rộng thị trường', group: 'Thị trường', outputs: ['WGT-MKT-002', 'BLK-MKT-BREADTH', 'BLK-COM-BREADTH'], normalized: ['NORM-BREADTH'], adminKeys: [] },
    { id: 'ALG-MKT-HEATMAP', label: 'Heatmap ngành / họ / story', group: 'Thị trường', outputs: ['WGT-MKT-004', 'WGT-MKT-005', 'WGT-MKT-006', 'BLK-MKT-HEAT-SECTOR', 'BLK-MKT-HEAT-FAMILY', 'BLK-MKT-HEAT-CHUDE'], normalized: ['NORM-HEATMAP'], adminKeys: ['heatmap_min_members'] },
    { id: 'ALG-MKT-LIQ', label: 'Thanh khoản lũy kế phiên', group: 'Thị trường', outputs: ['WGT-MKT-007', 'WGT-MKT-008', 'BLK-MKT-LIQ'], normalized: ['NORM-LIQUIDITY'], adminKeys: ['liq_slot_minutes'] },
    { id: 'ALG-MKT-TOP10', label: 'Top 10 hiệu suất', group: 'Thị trường', outputs: ['WGT-TOP-001', 'WGT-TOP-002', 'WGT-TOP-003', 'BLK-MKT-RANKINGS'], normalized: ['NORM-HEATMAP'], adminKeys: [] },
    { id: 'ALG-MKT-MOVERS', label: 'Top biến động CP', group: 'Thị trường', outputs: ['WGT-MKT-003'], normalized: ['NORM-STOCK-SNAP'], adminKeys: [] },
    { id: 'ALG-FLW-SUMMARY', label: 'Tóm tắt dòng tiền phiên', group: 'Dòng tiền', outputs: ['WGT-FLW-001'], normalized: ['NORM-FLOW-SUMMARY'], adminKeys: ['flow_lot_big', 'smart_money_threshold'] },
    { id: 'ALG-FLW-NET-TOP', label: 'Thống kê mua/bán ròng theo entity', group: 'Dòng tiền', outputs: ['WGT-FLW-SUBJ-STOCK', 'WGT-FLW-SUBJ-SECTOR', 'WGT-FLW-SUBJ-HST', 'WGT-FLW-SUBJ-STORY', 'BLK-FLW-NET-STOCK', 'BLK-FLW-NET-SECTOR', 'BLK-FLW-NET-HST', 'BLK-FLW-NET-CHUDE'], normalized: ['NORM-FLOW-NET'], adminKeys: ['flow_lot_big'] },
    { id: 'ALG-FLW-STATS', label: 'TOP 10 dòng tiền vào/ra', group: 'Dòng tiền', outputs: ['WGT-FLW-STAT_STOCK_IN', 'WGT-FLW-STAT_STOCK_OUT', 'WGT-FLW-STAT_SECTOR_IN', 'WGT-FLW-STAT_SECTOR_OUT', 'WGT-FLW-STAT_HST_IN', 'WGT-FLW-STAT_HST_OUT', 'WGT-FLW-STAT_STORY_IN', 'WGT-FLW-STAT_STORY_OUT'], normalized: ['NORM-FLOW-NET'], adminKeys: ['smart_money_threshold'] },
    { id: 'ALG-FLW-ZONE', label: 'Ngữ cảnh vùng Hỗ trợ/Kháng cự', group: 'Dòng tiền', outputs: ['WGT-FLW-CTX', 'BLK-FLW-MKT-SIDE'], normalized: ['NORM-MARKET-AGG'], adminKeys: [] },
    { id: 'ALG-FLW-SCORE', label: 'Score dòng tiền CP', group: 'Dòng tiền', outputs: ['BLK-FLW-SCORE-BASIC', 'BLK-FLW-SCORE-ADV', 'BLK-FLW-SCORE-EX'], normalized: ['NORM-FLOW-NET', 'NORM-STOCK-SNAP'], adminKeys: ['smart_money_threshold'] },
    { id: 'ALG-COM-FEED', label: 'Feed & trending cộng đồng', group: 'Cộng đồng', outputs: ['WGT-COM-001', 'BLK-COM-TRENDING', 'BLK-COM-NEWS'], normalized: ['NORM-COMMUNITY', 'NORM-CONTENT-ARTICLE'], adminKeys: ['community_rank_window'] },
    { id: 'ALG-TOPIC-TREND', label: 'Chủ đề tích cực hàng đầu (Interest Score)', group: 'Cộng đồng', outputs: ['WGT-COM-CHUDE-TOP', 'BLK-COM-CHUDE-TOP'], normalized: ['NORM-CONTENT-TOPIC', 'NORM-COMMUNITY', 'NORM-CONTENT-ARTICLE'], adminKeys: ['topic_promote_min_articles', 'interest_w_view', 'interest_w_search', 'interest_w_like', 'interest_w_favorite', 'interest_w_share', 'interest_w_comment'] },
    { id: 'ALG-STORY-RELEVANCE', label: 'Relevance Score Story ↔ Stock (cumulative)', group: 'Nội dung', outputs: ['WGT-FLW-SUBJ-STORY', 'WGT-MKT-006', 'WGT-TOP-003'], normalized: ['NORM-CONTENT-STORY', 'NORM-CONTENT-ARTICLE', 'NORM-FLOW-NET'], adminKeys: ['relevance_w_mention', 'relevance_w_follow', 'relevance_keep_min', 'topic_auto_promote', 'topic_auto_promote_min_interest', 'topic_auto_promote_min_stocks'] },
    { id: 'ALG-COM-MEMBERS', label: 'Thành viên & chuyên gia', group: 'Cộng đồng', outputs: ['WGT-COM-002', 'WGT-COM-003', 'BLK-COM-EXPERTS', 'BLK-COM-ACTIVE'], normalized: ['NORM-COMMUNITY'], adminKeys: [] },
    { id: 'ALG-WATCHLIST', label: 'Watchlist cá nhân', group: 'Cá nhân', outputs: ['WGT-WAT-001', 'BLK-COM-TOPWL', 'WGT-COM-004'], normalized: ['NORM-WATCHLIST'], adminKeys: ['watchlist_max_items'] }
  ];

  var STATIC_DISPLAY_BLOCKS = [
    { id: 'BLK-COM-NEWS', label: 'Tin tức', kind: 'page', group: 'Block trang · Cộng đồng', minTier: 'guest', page: 'community' },
    { id: 'BLK-LOY-INTRO', label: 'Giới thiệu', kind: 'page', group: 'Block trang · Membership', minTier: 'free', page: 'loyalty' },
    { id: 'BLK-LOY-AFFILIATE', label: 'Affiliate', kind: 'page', group: 'Block trang · Membership', minTier: 'free', page: 'loyalty' },
    { id: 'BLK-FAQ-LIST', label: 'Danh sách FAQ', kind: 'page', group: 'Block trang · FAQ', minTier: 'guest', page: 'faq' },
    { id: 'BLK-FAQ-SUPPORT', label: 'Khối liên hệ hỗ trợ', kind: 'page', group: 'Block trang · FAQ', minTier: 'guest', page: 'faq' }
  ];

  var PAGE_LABELS = {
    dashboard: 'Nhà', market: 'Thị trường', community: 'Tin tức', flow: 'Dòng tiền',
    loyalty: 'Membership', faq: 'FAQ', account: 'Tài khoản', messages: 'Tin nhắn'
  };

  function l4wlib() {
    return global.PlatformLayersWidgets;
  }

  function l4BlockLabel(id) {
    var P = l4wlib();
    if (P && P.resolveWidgetCopy) {
      var c = P.resolveWidgetCopy(id);
      if (c && c.title) return c.title;
    }
    return id;
  }

  function l4PageLabel(pageKey) {
    return PAGE_LABELS[pageKey] || pageKey;
  }

  function l4AdminGroup(block) {
    if (!block) return '';
    var kindLabel = block.kind === 'widget' ? 'Widget' : 'Block';
    return l4PageLabel(block.page) + ' · ' + kindLabel;
  }

  function buildL4BlockEntries() {
    var P = l4wlib();
    var list = [];
    if (P && typeof P.entitlementList === 'function') {
      P.entitlementList().forEach(function (m) {
        if (!m || !m.id) return;
        list.push({
          id: m.id,
          label: m.title || m.id,
          kind: 'widget',
          group: (m.domain || 'Widget') + ' · Widget',
          minTier: m.tier || 'free',
          page: (m.pages && m.pages[0]) || 'dashboard'
        });
      });
    }
    STATIC_DISPLAY_BLOCKS.forEach(function (b) { list.push(b); });
    return list;
  }

  function buildDisplayBlocks() {
    var blocks = buildL4BlockEntries();
    return blocks.map(function (b) {
      var alg = ALGORITHMS.find(function (a) { return a.outputs.indexOf(b.id) >= 0; });
      return {
        id: b.id,
        label: b.label || l4BlockLabel(b.id),
        group: b.group || l4AdminGroup(b),
        pageLabel: l4PageLabel(b.page),
        kind: b.kind,
        page: b.page,
        minTier: b.minTier,
        resolver: BLOCK_RESOLVER[b.id] || 'generic',
        algorithmId: alg ? alg.id : null
      };
    });
  }

  function getAdminConfig() {
    try {
      var raw = localStorage.getItem('iflux_platform_admin_config_v1');
      return Object.assign({}, ADMIN_DEFAULTS, raw ? JSON.parse(raw) : {});
    } catch (e) {
      return Object.assign({}, ADMIN_DEFAULTS);
    }
  }

  function saveAdminConfig(cfg) {
    localStorage.setItem('iflux_platform_admin_config_v1', JSON.stringify(cfg));
  }

  /* =====================================================================
   * MÔ HÌNH ĐỒNG NHẤT 4 TẦNG — mỗi entity đều có: Đầu vào · Xử lý · Đầu ra.
   * Đầu vào/đầu ra là TRƯỜNG DỮ LIỆU: ký hiệu (sym) · tên (name) · kiểu (type)
   *   · (với đầu vào) nguồn cấp (source: EXT/L1/L2/L3) · ref.
   *   EXT = ngoài hệ thống (hợp đồng provider DNSE) — Tầng 1 KHÔNG nhận gì ngoài DNSE.
   * ===================================================================== */
  function f(sym, name, type) { return { sym: sym, name: name, type: type }; }
  function fi(sym, name, type, source, ref) { return { sym: sym, name: name, type: type, source: source, ref: ref }; }

  /* --- Tầng 1: Đầu vào = request tới DNSE (chỉ những gì DNSE quy định); Đầu ra = field DNSE trả --- */
  var IO_RAW = {
    'RAW-DNSE-INSTRUMENTS': {
      inp: [],
      out: [f('symbol', 'Mã CK', 'text'), f('marketId', 'Mã sàn', 'text'), f('securityGroupId', 'Nhóm CK', 'text'), f('listedDate', 'Ngày niêm yết', 'datetime'), f('shortName', 'Tên ngắn', 'text'), f('name', 'Tên đầy đủ', 'text'), f('indexName[]', 'Rổ chỉ số', 'mảng')],
      spec: 'REST GET /instruments (HTTPS). Kéo toàn bộ danh mục mã; parse JSON, giữ nguyên field theo hợp đồng DNSE — không thêm dữ liệu ngoài DNSE.'
    },
    'RAW-DNSE-SEC-DEF': {
      inp: [fi('symbol', 'Mã CK cần tra', 'text', 'EXT', 'path param')],
      out: [f('symbol', 'Mã CK', 'text'), f('basicPrice', 'Giá tham chiếu', 'tiền'), f('ceilingPrice', 'Giá trần', 'tiền'), f('floorPrice', 'Giá sàn', 'tiền'), f('securityStatus', 'Trạng thái CK', 'enum'), f('time', 'Thời điểm', 'datetime')],
      spec: 'REST GET /price/{symbol}/secdef. Trần/sàn/tham chiếu — xác định biên độ & trạng thái mã.'
    },
    'RAW-DNSE-TRADE-LATEST': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'path param')],
      out: [f('symbol', 'Mã CK', 'text'), f('matchPrice', 'Giá khớp', 'tiền'), f('matchQtty', 'KL khớp', 'số'), f('side', 'Phía chủ động (B/S)', 'enum'), f('totalVolumeTraded', 'Tổng KL lũy kế', 'số'), f('grossTradeAmount', 'Tổng GT lũy kế', 'tiền'), f('time', 'Thời điểm', 'datetime')],
      spec: 'REST GET /price/{symbol}/trades/latest. Lệnh khớp gần nhất kèm phía chủ động — đầu vào cho tick chuẩn hóa.'
    },
    'RAW-DNSE-TRADE-HIST': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'path param'), fi('nextPageToken', 'Token trang', 'text', 'EXT', 'query param')],
      out: [f('matchPrice', 'Giá khớp', 'tiền'), f('matchQtty', 'KL khớp', 'số'), f('side', 'Phía chủ động', 'enum'), f('time', 'Thời điểm', 'datetime'), f('nextPageToken', 'Token trang kế', 'text')],
      spec: 'REST GET /price/{symbol}/trades. Lịch sử khớp phân trang — backfill dòng tick.'
    },
    'RAW-DNSE-QUOTE-HIST': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'path param')],
      out: [f('bid[].price', 'Giá đặt mua', 'tiền'), f('bid[].quantity', 'KL đặt mua', 'số'), f('offer[].price', 'Giá đặt bán', 'tiền'), f('offer[].quantity', 'KL đặt bán', 'số'), f('time', 'Thời điểm', 'datetime')],
      spec: 'REST GET /price/{symbol}/quotes. Lịch sử sổ lệnh bid/ask.'
    },
    'RAW-DNSE-CLOSE': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'path param')],
      out: [f('symbol', 'Mã CK', 'text'), f('closePrice', 'Giá đóng cửa', 'tiền'), f('time', 'Ngày', 'datetime')],
      spec: 'REST GET /price/{symbol}/close. Giá đóng cửa lịch sử.'
    },
    'RAW-DNSE-OHLC': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'query param'), fi('resolution', 'Khung thời gian', 'text', 'EXT', 'query param'), fi('from', 'Từ', 'datetime', 'EXT', 'query param'), fi('to', 'Đến', 'datetime', 'EXT', 'query param')],
      out: [f('t[]', 'Mốc thời gian', 'mảng'), f('o[]', 'Giá mở', 'mảng'), f('h[]', 'Giá cao', 'mảng'), f('l[]', 'Giá thấp', 'mảng'), f('c[]', 'Giá đóng', 'mảng'), f('v[]', 'Khối lượng', 'mảng'), f('nextTime', 'Mốc kế', 'datetime')],
      spec: 'REST GET /price/ohlc. Nến OHLCV lịch sử theo khung.'
    },
    'RAW-DNSE-FOREIGN': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'path param')],
      out: [f('buyVolume', 'KL nước ngoài mua', 'số'), f('sellVolume', 'KL nước ngoài bán', 'số'), f('totalBuyTradedAmount', 'GT mua', 'tiền'), f('totalSellTradedAmount', 'GT bán', 'tiền'), f('time', 'Thời điểm', 'datetime')],
      spec: 'REST GET /price/{symbol}/foreign-trading. Giao dịch khối ngoại.'
    },
    'RAW-DNSE-SESSION': {
      inp: [],
      out: [f('tradingSessionId', 'Mã phiên', 'text'), f('eventId', 'Sự kiện', 'text'), f('marketId', 'Sàn', 'text'), f('boardId', 'Bảng', 'text'), f('time', 'Thời điểm', 'datetime')],
      spec: 'REST GET /market/trading-session. Trạng thái phiên (ATO/LO/ATC/nghỉ).'
    },
    'RAW-DNSE-WORKING-DATES': {
      inp: [],
      out: [f('workingDates[]', 'Danh sách ngày làm việc', 'mảng')],
      spec: 'REST GET /market/working-dates. Lịch phiên — dùng tính TB n phiên.'
    },
    'RAW-DNSE-MQTT-TICK': {
      inp: [fi('symbol', 'Mã CK (subscribe topic)', 'text', 'EXT', 'MQTT topic')],
      out: [f('symbol', 'Mã CK', 'text'), f('matchPrice', 'Giá khớp', 'tiền'), f('matchQtty', 'KL khớp', 'số'), f('side', 'Phía chủ động (B/S)', 'enum'), f('totalVolumeTraded', 'Tổng KL lũy kế', 'số'), f('grossTradeAmount', 'Tổng GT lũy kế', 'tiền'), f('tradingSessionId', 'Mã phiên', 'text'), f('sendingTime', 'Thời điểm gửi', 'datetime')],
      spec: 'MQTT/WSS .../tick/... Subscribe tick realtime từng lệnh khớp kèm phía chủ động — nguồn chính cho dòng tiền.'
    },
    'RAW-DNSE-MQTT-TOPPRICE': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'MQTT topic')],
      out: [f('bid[].price', 'Giá đặt mua', 'tiền'), f('bid[].qtty', 'KL đặt mua', 'số'), f('offer[].price', 'Giá đặt bán', 'tiền'), f('offer[].qtty', 'KL đặt bán', 'số'), f('sendingTime', 'Thời điểm gửi', 'datetime')],
      spec: 'MQTT/WSS .../topprice/... Sổ lệnh bid/ask realtime.'
    },
    'RAW-DNSE-MQTT-STOCKINFO': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'MQTT topic')],
      out: [f('symbol', 'Mã CK', 'text'), f('referencePrice', 'Giá tham chiếu', 'tiền'), f('highLimitPrice', 'Giá trần', 'tiền'), f('lowLimitPrice', 'Giá sàn', 'tiền'), f('securityGroupId', 'Nhóm CK', 'text'), f('tradingTime', 'Thời điểm', 'datetime')],
      spec: 'MQTT/WSS .../stockinfo/... Trần/sàn/tham chiếu realtime.'
    },
    'RAW-DNSE-MQTT-OHLC': {
      inp: [fi('symbol', 'Mã CK', 'text', 'EXT', 'MQTT topic'), fi('resolution', 'Khung', 'text', 'EXT', 'MQTT topic')],
      out: [f('symbol', 'Mã CK', 'text'), f('open', 'Giá mở', 'tiền'), f('high', 'Giá cao', 'tiền'), f('low', 'Giá thấp', 'tiền'), f('close', 'Giá đóng', 'tiền'), f('volume', 'Khối lượng', 'số'), f('time', 'Mốc', 'datetime'), f('resolution', 'Khung', 'text')],
      spec: 'MQTT/WSS .../ohlc/... Nến realtime nhiều khung.'
    },
    'RAW-DNSE-MQTT-MARKET-INDEX': {
      inp: [fi('indexName', 'Tên chỉ số (subscribe)', 'text', 'EXT', 'MQTT topic')],
      out: [f('indexName', 'Tên chỉ số', 'text'), f('indexValue', 'Giá trị chỉ số', 'số'), f('changePercent', '% thay đổi', '%'), f('totalTradedValue', 'GTGD toàn sàn', 'tiền'), f('totalVolumeTraded', 'KLGD toàn sàn', 'số')],
      spec: 'MQTT/WSS .../index/{indexName}. Chỉ số sàn realtime — nguồn của NORM-INDEX-SNAPSHOT.'
    },
    'RAW-DNSE-MQTT-BOARDEVENT': {
      inp: [],
      out: [f('tradingSessionId', 'Mã phiên', 'text'), f('eventId', 'Sự kiện', 'text'), f('marketId', 'Sàn', 'text'), f('boardId', 'Bảng', 'text'), f('sendingTime', 'Thời điểm gửi', 'datetime')],
      spec: 'MQTT/WSS .../boardevent/... Sự kiện phiên / trạng thái bảng realtime.'
    },
    'RAW-CONTENT-VNSTOCK': {
      inp: [f('source', 'Nguồn báo (cafef|vietstock|…)', 'text'), f('limit', 'Số bài / lần kéo', 'số')],
      out: [f('url', 'Link bài', 'text'), f('title', 'Tiêu đề', 'text'), f('content', 'Nội dung', 'text'), f('publish_time', 'Thời gian', 'text'), f('category', 'Chuyên mục', 'text'), f('tags', 'Tags', 'text'), f('image_url', 'Ảnh', 'text'), f('source', 'Nguồn', 'text')],
      spec: 'Connector/worker gọi Vnstock News (không từ FE). Schema gốc Vnstock; map → NORM-CONTENT-ARTICLE.'
    },
    'RAW-CONTENT-INTERNAL': {
      inp: [f('seed_pack', 'Gói seed / Ops', 'text')],
      out: [f('url', 'Link / id nội bộ', 'text'), f('title', 'Tiêu đề', 'text'), f('content', 'Nội dung', 'text'), f('publish_time', 'Thời gian', 'text')],
      spec: 'Tin nội bộ / seed demo Content Engine — cùng schema bài chuẩn hóa.'
    }
  };

  /* --- Tầng 2: Đầu vào = field Tầng 1/Tầng 2; Đầu ra = field chuẩn hóa --- */
  var IO_NORM = {
    'NORM-TICK': {
      inp: [fi('matchPrice', 'Giá khớp', 'tiền', 'L1', 'RAW-DNSE-MQTT-TICK'), fi('matchQtty', 'KL khớp', 'số', 'L1', 'RAW-DNSE-MQTT-TICK'), fi('side', 'Phía chủ động', 'enum', 'L1', 'RAW-DNSE-MQTT-TICK'), fi('sendingTime', 'Thời điểm', 'datetime', 'L1', 'RAW-DNSE-MQTT-TICK')],
      out: [f('ticker', 'Mã CK', 'text'), f('price', 'Giá', 'tiền'), f('qty', 'Khối lượng', 'số'), f('matched_at', 'Thời điểm khớp', 'datetime'), f('exchange', 'Sàn', 'text'), f('lot_class', 'Phân loại lô (lớn/nhỏ)', 'enum')],
      spec: 'Chuẩn hóa mỗi lệnh khớp: price=matchPrice, qty=matchQtty, matched_at=sendingTime. lot_class = lô lớn nếu (qty×price) ≥ lot_threshold_big, lô nhỏ nếu ≤ lot_threshold_small.'
    },
    'NORM-STOCK-SNAP': {
      inp: [fi('price', 'Giá khớp gần nhất', 'tiền', 'L2', 'NORM-TICK'), fi('qty', 'KL lũy kế', 'số', 'L2', 'NORM-TICK'), fi('basicPrice', 'Giá tham chiếu', 'tiền', 'L1', 'RAW-DNSE-SEC-DEF'), fi('name', 'Tên công ty', 'text', 'L1', 'RAW-DNSE-INSTRUMENTS')],
      out: [f('ticker', 'Mã CK', 'text'), f('price', 'Giá hiện tại', 'tiền'), f('change_pct', '% thay đổi', '%'), f('volume', 'Khối lượng', 'số'), f('market_cap', 'Vốn hóa', 'tiền')],
      spec: 'change_pct = (price − basicPrice)/basicPrice × 100. volume = Σ qty trong phiên. market_cap = price × KL lưu hành (metadata mã).'
    },
    'NORM-INDEX-SNAPSHOT': {
      inp: [fi('indexName', 'Tên chỉ số', 'text', 'L1', 'RAW-DNSE-MQTT-MARKET-INDEX'), fi('indexValue', 'Giá trị chỉ số', 'số', 'L1', 'RAW-DNSE-MQTT-MARKET-INDEX'), fi('changePercent', '% thay đổi', '%', 'L1', 'RAW-DNSE-MQTT-MARKET-INDEX')],
      out: [f('index_name', 'Tên chỉ số / sàn', 'text'), f('index_value', 'Giá trị hiện tại', 'số'), f('change', 'Thay đổi điểm', 'số'), f('change_pct', '% thay đổi', '%'), f('status', 'Trạng thái (chuẩn hóa)', 'enum')],
      spec: 'index_value=indexValue; change_pct=changePercent; change=index_value×change_pct/100. status = tăng nếu change_pct>0, giảm nếu <0, tham chiếu nếu =0 — CHUẨN HÓA MỘT NƠI DUY NHẤT ở Tầng 2 để Tầng 4 chỉ hiển thị.'
    },
    'NORM-BREADTH': {
      inp: [fi('ticker', 'Mã CK', 'text', 'L2', 'NORM-STOCK-SNAP'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-STOCK-SNAP'), fi('price', 'Giá', 'tiền', 'L2', 'NORM-STOCK-SNAP'), fi('ceilingPrice', 'Giá trần', 'tiền', 'L1', 'RAW-DNSE-SEC-DEF'), fi('floorPrice', 'Giá sàn', 'tiền', 'L1', 'RAW-DNSE-SEC-DEF')],
      out: [f('exchange', 'Sàn', 'text'), f('up', 'Số mã tăng', 'số'), f('down', 'Số mã giảm', 'số'), f('ref', 'Số mã tham chiếu', 'số'), f('ceiling', 'Số mã trần', 'số'), f('floor', 'Số mã sàn', 'số')],
      spec: 'Đếm theo sàn: up=#(change_pct>0), down=#(<0), ref=#(=0); ceiling=#(price≥ceilingPrice), floor=#(price≤floorPrice).'
    },
    'NORM-MARKET-AGG': {
      inp: [fi('change_pct', '% thay đổi mã', '%', 'L2', 'NORM-STOCK-SNAP'), fi('market_cap', 'Vốn hóa mã', 'tiền', 'L2', 'NORM-STOCK-SNAP'), fi('up', 'Số mã tăng', 'số', 'L2', 'NORM-BREADTH'), fi('down', 'Số mã giảm', 'số', 'L2', 'NORM-BREADTH')],
      out: [f('index_name', 'Tên chỉ số', 'text'), f('ig', 'Index Growth', 'số'), f('pg', 'Price Growth', 'số'), f('breadth_up', 'Mã tăng', 'số'), f('breadth_down', 'Mã giảm', 'số'), f('status', 'Trạng thái', 'enum')],
      spec: 'pg = Σ(change_pct × market_cap)/Σ market_cap (bình quân gia quyền vốn hóa, index_weight_method). ig = tăng trưởng chỉ số. breadth_up/down lấy từ NORM-BREADTH.'
    },
    'NORM-HEATMAP': {
      inp: [fi('ticker', 'Mã thành viên', 'text', 'L2', 'NORM-STOCK-SNAP'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-STOCK-SNAP'), fi('market_cap', 'Vốn hóa', 'tiền', 'L2', 'NORM-STOCK-SNAP'), fi('indexName[]', 'Phân nhóm (ngành/họ/story)', 'mảng', 'L1', 'RAW-DNSE-INSTRUMENTS')],
      out: [f('group_id', 'Mã nhóm', 'text'), f('name', 'Tên nhóm', 'text'), f('perf', 'Hiệu suất nhóm', '%'), f('weight', 'Vốn hóa nhóm', 'tiền'), f('tickers[]', 'Mã thành viên', 'mảng')],
      spec: 'Gom mã theo nhóm. weight = Σ market_cap; perf = Σ(change_pct × market_cap)/weight. Loại nhóm có < heatmap_min_members mã.'
    },
    'NORM-LIQUIDITY': {
      inp: [fi('qty', 'KL khớp', 'số', 'L2', 'NORM-TICK'), fi('price', 'Giá khớp', 'tiền', 'L2', 'NORM-TICK'), fi('matched_at', 'Thời điểm', 'datetime', 'L2', 'NORM-TICK')],
      out: [f('exchange', 'Sàn', 'text'), f('metric', 'Loại (KL/GT)', 'enum'), f('slots[]', 'Mốc slot trong phiên', 'mảng'), f('cumulative[]', 'Lũy kế theo slot', 'mảng')],
      spec: 'Chia phiên thành slot liq_slot_minutes phút. cumulative[i] = Σ (KL hoặc GT=price×qty) đến slot i.'
    },
    'NORM-FLOW-NET': {
      inp: [fi('price', 'Giá khớp', 'tiền', 'L2', 'NORM-TICK'), fi('qty', 'KL khớp', 'số', 'L2', 'NORM-TICK'), fi('side', 'Phía chủ động', 'enum', 'L2', 'NORM-TICK'), fi('lot_class', 'Phân loại lô', 'enum', 'L2', 'NORM-TICK')],
      out: [f('subject', 'Chủ thể', 'enum'), f('scope', 'Phạm vi (mã/ngành/...)', 'enum'), f('buyers[]', 'Mua chủ động theo entity', 'mảng'), f('sellers[]', 'Bán chủ động theo entity', 'mảng')],
      spec: 'Với mỗi entity: buy = Σ(side=B × qty × price), sell = Σ(side=S × qty × price). Lọc lô lớn ≥ flow_lot_big; dòng tiền thông minh khi ≥ smart_money_threshold.'
    },
    'NORM-FLOW-SUMMARY': {
      inp: [fi('buyers[]', 'Mua theo chủ thể', 'mảng', 'L2', 'NORM-FLOW-NET'), fi('sellers[]', 'Bán theo chủ thể', 'mảng', 'L2', 'NORM-FLOW-NET')],
      out: [f('foreign', 'Khối ngoại (net)', 'tiền'), f('institutional', 'Tổ chức (net)', 'tiền'), f('proprietary', 'Tự doanh (net)', 'tiền'), f('retail', 'Cá nhân (net)', 'tiền')],
      spec: 'Tổng hợp net = mua − bán theo 4 chủ thể (Khối ngoại / Tổ chức / Tự doanh / Cá nhân) trong phiên gần nhất.'
    },
    'NORM-COMMUNITY': {
      inp: [fi('ticker', 'Mã CK được nhắc', 'text', 'L2', 'NORM-STOCK-SNAP'), fi('post_id', 'Bài viết cộng đồng', 'text', 'EXT', 'Community DB'), fi('reaction', 'Lượt tương tác', 'số', 'EXT', 'Community DB'), fi('id', 'Bài Content Engine', 'uuid', 'L2', 'NORM-CONTENT-ARTICLE')],
      out: [f('posts[]', 'Bài viết', 'mảng'), f('trending_tickers[]', 'Mã trending', 'mảng'), f('experts[]', 'Chuyên gia', 'mảng')],
      spec: 'Tổng hợp UGC + bài Content Engine (news-card); xếp trending trong cửa sổ community_rank_window ngày.'
    },
    'NORM-WATCHLIST': {
      inp: [fi('ticker', 'Mã user thêm', 'text', 'EXT', 'User DB'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-STOCK-SNAP')],
      out: [f('folders[]', 'Thư mục watchlist', 'mảng'), f('memberships{}', 'Ánh xạ mã → thư mục', 'object')],
      spec: 'Gom danh mục user tự thêm; giới hạn watchlist_max_items mã/thư mục.'
    },
    'NORM-CONTENT-ARTICLE': {
      inp: [fi('url', 'URL bài thô', 'text', 'L1', 'RAW-CONTENT-VNSTOCK'), fi('title', 'Tiêu đề', 'text', 'L1', 'RAW-CONTENT-VNSTOCK'), fi('content', 'Nội dung', 'text', 'L1', 'RAW-CONTENT-VNSTOCK')],
      out: [f('id', 'ID bài', 'uuid'), f('title', 'Tiêu đề', 'text'), f('summary', 'Tóm tắt', 'text'), f('body', 'Nội dung', 'text'), f('tickers[]', 'Mã CK trích', 'mảng'), f('published_at', 'Thời gian', 'datetime'), f('topic_ids[]', 'Topic gắn', 'mảng')],
      spec: 'Bài chuẩn hóa Content Engine; trích entity (ticker) + gắn Topic.'
    },
    'NORM-CONTENT-TOPIC': {
      inp: [fi('id', 'Bài đã chuẩn hóa', 'uuid', 'L2', 'NORM-CONTENT-ARTICLE')],
      out: [f('slug', 'Slug Topic', 'text'), f('title', 'Tiêu đề Topic', 'text'), f('status', 'building|candidate|…', 'enum'), f('article_count', 'Số bài', 'số'), f('entity_codes[]', 'Mã gắn', 'mảng')],
      spec: 'Topic = pre-Story; gom bài theo topic_key. Promote Story khi đủ tiêu chí (P1).'
    },
    'NORM-CONTENT-STORY': {
      inp: [fi('slug', 'Topic được promote', 'text', 'L2', 'NORM-CONTENT-TOPIC'), fi('tickers[]', 'Mã từ bài', 'mảng', 'L2', 'NORM-CONTENT-ARTICLE')],
      out: [f('story_id', 'ID Story', 'uuid'), f('lifecycle', 'Vòng đời', 'enum'), f('mappings[]', 'Relevance theo mã', 'mảng'), f('flow_net_value', 'DT ròng snapshot', 'tiền'), f('top_relevance', 'Relevance cao nhất', 'số')],
      spec: 'Story entity sau promote; mappings = Relevance Score cumulative Story↔Stock; flow_* = snapshot (stub đến khi Money Flow Engine gắn membership).'
    }
  };

  /* --- Tầng 3: Đầu vào = field Tầng 2 + Admin; Đầu ra = hợp đồng dữ liệu cấp cho Widget --- */
  var IO_ALG = {
    'ALG-MKT-OVERVIEW': {
      inp: [fi('index_name', 'Tên chỉ số', 'text', 'L2', 'NORM-INDEX-SNAPSHOT'), fi('index_value', 'Giá trị', 'số', 'L2', 'NORM-INDEX-SNAPSHOT'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-INDEX-SNAPSHOT'), fi('status', 'Trạng thái', 'enum', 'L2', 'NORM-INDEX-SNAPSHOT'), fi('ig', 'IG', 'số', 'L2', 'NORM-MARKET-AGG'), fi('pg', 'PG', 'số', 'L2', 'NORM-MARKET-AGG')],
      out: [f('index_name', 'Tên chỉ số / sàn', 'text'), f('index_value', 'Giá trị', 'số'), f('change_pct', '% thay đổi', '%'), f('status', 'Trạng thái', 'enum'), f('ig_pg', 'IG / PG', 'số')],
      spec: 'B1 lấy danh sách chỉ số NORM-INDEX-SNAPSHOT → map name/value/change_pct/status (status lấy thẳng, không tự suy). B2 lấy ig/pg từ NORM-MARKET-AGG. B3 ghép Output Contract.'
    },
    'ALG-MKT-BREADTH': {
      inp: [fi('exchange', 'Sàn', 'text', 'L2', 'NORM-BREADTH'), fi('up', 'Mã tăng', 'số', 'L2', 'NORM-BREADTH'), fi('down', 'Mã giảm', 'số', 'L2', 'NORM-BREADTH'), fi('ref', 'Mã tham chiếu', 'số', 'L2', 'NORM-BREADTH'), fi('ceiling', 'Mã trần', 'số', 'L2', 'NORM-BREADTH'), fi('floor', 'Mã sàn', 'số', 'L2', 'NORM-BREADTH')],
      out: [f('exchange', 'Sàn', 'text'), f('up', 'Số mã tăng', 'số'), f('down', 'Số mã giảm', 'số'), f('ref', 'Số mã tham chiếu', 'số'), f('ceiling', 'Số mã trần', 'số'), f('floor', 'Số mã sàn', 'số'), f('breadth_state', 'Trạng thái độ rộng', 'enum')],
      spec: 'Bày cụm up/down/ref/ceiling/floor theo sàn. breadth_state = Tích cực nếu up>down, Tiêu cực nếu up<down.'
    },
    'ALG-MKT-HEATMAP': {
      inp: [fi('name', 'Tên nhóm', 'text', 'L2', 'NORM-HEATMAP'), fi('weight', 'Vốn hóa nhóm', 'tiền', 'L2', 'NORM-HEATMAP'), fi('perf', 'Hiệu suất nhóm', '%', 'L2', 'NORM-HEATMAP')],
      out: [f('name', 'Tên phần tử', 'text'), f('weight', 'Kích thước ô (vốn hóa)', 'tiền'), f('perf', 'Màu ô (hiệu suất)', '%')],
      spec: 'Ánh xạ nhóm → ô treemap: diện tích ~ weight, màu ~ perf (dương xanh / âm đỏ).'
    },
    'ALG-MKT-LIQ': {
      inp: [fi('slots[]', 'Mốc slot', 'mảng', 'L2', 'NORM-LIQUIDITY'), fi('cumulative[]', 'Lũy kế theo slot', 'mảng', 'L2', 'NORM-LIQUIDITY')],
      out: [f('slot', 'Mốc thời gian', 'datetime'), f('cum_today', 'Lũy kế hôm nay', 'số'), f('avg_1', 'TB 1 phiên', 'số'), f('avg_5', 'TB 5 phiên', 'số'), f('avg_10', 'TB 10 phiên', 'số')],
      spec: 'cum_today theo slot phiên hôm nay. avg_k = TB cumulative cùng slot của k phiên gần nhất (k=1/5/10).'
    },
    'ALG-MKT-TOP10': {
      inp: [fi('name', 'Tên nhóm', 'text', 'L2', 'NORM-HEATMAP'), fi('perf', 'Hiệu suất nhóm', '%', 'L2', 'NORM-HEATMAP')],
      out: [f('name', 'Tên nhóm', 'text'), f('perf', 'Hiệu suất', '%'), f('rank', 'Xếp hạng', 'số')],
      spec: 'Sắp xếp nhóm theo perf giảm dần, lấy Top 10; rank = vị trí.'
    },
    'ALG-MKT-MOVERS': {
      inp: [fi('ticker', 'Mã CK', 'text', 'L2', 'NORM-STOCK-SNAP'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-STOCK-SNAP')],
      out: [f('ticker', 'Mã CK', 'text'), f('change_pct', '% thay đổi', '%'), f('rank', 'Xếp hạng', 'số')],
      spec: 'Sắp xếp theo change_pct; lấy Top N tăng & Top N giảm; rank theo thứ tự.'
    },
    'ALG-FLW-SUMMARY': {
      inp: [fi('foreign', 'Net khối ngoại', 'tiền', 'L2', 'NORM-FLOW-SUMMARY'), fi('institutional', 'Net tổ chức', 'tiền', 'L2', 'NORM-FLOW-SUMMARY'), fi('proprietary', 'Net tự doanh', 'tiền', 'L2', 'NORM-FLOW-SUMMARY'), fi('retail', 'Net cá nhân', 'tiền', 'L2', 'NORM-FLOW-SUMMARY')],
      out: [f('subject', 'Chủ thể', 'enum'), f('buy_ratio', 'Tỉ lệ mua', '%'), f('net', 'Giá trị ròng', 'tiền')],
      spec: 'Với mỗi chủ thể: buy_ratio = mua/(mua+bán); net = mua − bán.'
    },
    'ALG-FLW-NET-TOP': {
      inp: [fi('subject', 'Chủ thể', 'enum', 'L2', 'NORM-FLOW-NET'), fi('buyers[]', 'Mua theo entity', 'mảng', 'L2', 'NORM-FLOW-NET'), fi('sellers[]', 'Bán theo entity', 'mảng', 'L2', 'NORM-FLOW-NET')],
      out: [f('subject', 'Chủ thể (tab)', 'enum'), f('entity_code', 'Mã entity', 'text'), f('net', 'Net +/- theo phiên', 'tiền'), f('session', 'Phiên', 'datetime')],
      spec: 'net = mua − bán theo entity & phiên. Top mua ròng (net>0) cột trái, Top bán ròng (net<0) cột phải.'
    },
    'ALG-FLW-STATS': {
      inp: [fi('entity_code', 'Mã entity', 'text', 'L2', 'NORM-FLOW-NET'), fi('buyers[]', 'Mua chủ động', 'mảng', 'L2', 'NORM-FLOW-NET'), fi('sellers[]', 'Bán chủ động', 'mảng', 'L2', 'NORM-FLOW-NET'), fi('change_pct', '% biến động giá', '%', 'L2', 'NORM-STOCK-SNAP')],
      out: [f('entity', 'Entity', 'text'), f('score_in', 'Điểm vào 0–100', 'số'), f('score_out', 'Điểm ra 0–100', 'số'), f('score', 'Điểm dòng tiền TM', 'số'), f('sentiment', 'Tích cực/Tiêu cực', 'enum'), f('fomo_risk', 'Rủi ro FOMO 0–100', 'số'), f('signal', 'Cơ hội/Rủi ro', 'enum'), f('rank', 'Xếp hạng', 'số')],
      spec: 'Chuẩn hóa cường độ mua/bán chủ động về 0–100 (score_in/out). Lọc lô lớn ≥ smart_money_threshold → score dòng tiền TM. fomo_risk từ tương quan score với change_pct (đà tăng nóng). signal Cơ hội/Rủi ro suy từ score & giá.'
    },
    'ALG-FLW-ZONE': {
      inp: [fi('index_value', 'Giá trị chỉ số', 'số', 'L2', 'NORM-MARKET-AGG'), fi('pg', 'PG', 'số', 'L2', 'NORM-MARKET-AGG')],
      out: [f('zone', 'Vùng (Hỗ trợ/Kháng cự)', 'enum'), f('level', 'Mốc giá', 'tiền'), f('side', 'Trạng thái', 'enum')],
      spec: 'Xác định vùng Hỗ trợ/Kháng cự quanh giá hiện tại; side = đang thử/xuyên vùng.'
    },
    'ALG-FLW-SCORE': {
      inp: [fi('entity_code', 'Mã CK', 'text', 'L2', 'NORM-FLOW-NET'), fi('buyers[]', 'Mua chủ động', 'mảng', 'L2', 'NORM-FLOW-NET'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-STOCK-SNAP')],
      out: [f('ticker', 'Mã CK', 'text'), f('score', 'Điểm dòng tiền', 'số'), f('tier', 'Cấp (basic/adv/ex)', 'enum')],
      spec: 'score = tổng hợp cường độ dòng tiền chủ động + tương quan giá; phân tầng theo quyền hiển thị.'
    },
    'ALG-COM-FEED': {
      inp: [fi('trending_tickers[]', 'Mã trending', 'mảng', 'L2', 'NORM-COMMUNITY'), fi('id', 'Bài Content', 'uuid', 'L2', 'NORM-CONTENT-ARTICLE'), fi('change_pct', '% thay đổi mã', '%', 'L2', 'NORM-STOCK-SNAP')],
      out: [f('ticker', 'Mã CK', 'text'), f('mention_count', 'Lượt quan tâm', 'số'), f('stock_perf', 'Hiệu suất mã', '%'), f('news_cards[]', 'Thẻ tin Content', 'mảng')],
      spec: 'size = mention_count trong cửa sổ community_rank_window; color = stock_perf; news = Content Engine feed.'
    },
    'ALG-TOPIC-TREND': {
      inp: [
        fi('slug', 'Topic / Story', 'text', 'L2', 'NORM-CONTENT-TOPIC'),
        fi('views', 'Lượt xem', 'số', 'L2', 'NORM-COMMUNITY'),
        fi('searches', 'Lượt tìm kiếm', 'số', 'L2', 'NORM-COMMUNITY'),
        fi('likes', 'Lượt thích', 'số', 'L2', 'NORM-COMMUNITY'),
        fi('favorites', 'Yêu thích', 'số', 'L2', 'NORM-COMMUNITY'),
        fi('shares', 'Chia sẻ', 'số', 'L2', 'NORM-COMMUNITY'),
        fi('comments', 'Bình luận', 'số', 'L2', 'NORM-COMMUNITY'),
        fi('period', 'Cửa sổ Ngày|Tuần|Tháng', 'enum', 'L3', 'ALG-TOPIC-TREND'),
        fi('top_n', 'Top N', 'số', 'L4', 'WGT-COM-CHUDE-TOP')
      ],
      out: [
        f('story', 'Tên Story/Topic', 'text'),
        f('period', 'Ngày|Tuần|Tháng', 'enum'),
        f('period_days', 'Số ngày cửa sổ', 'số'),
        f('top_n', 'Số lượng Top N', 'số'),
        f('score', 'Điểm Interest', 'số'),
        f('views', 'Tổng xem', 'số'),
        f('searches', 'Tổng tìm kiếm', 'số'),
        f('likes', 'Tổng thích', 'số'),
        f('comments', 'Tổng bình luận', 'số'),
        f('shares', 'Tổng chia sẻ', 'số'),
        f('favorites', 'Tổng yêu thích', 'số'),
        f('rank', 'Xếp hạng', 'số')
      ],
      spec: 'views/searches/likes/comments/shares/favorites = tổng trong cửa sổ period.\n' +
        'period_days = Ngày→1 · Tuần→7 · Tháng→30.\n' +
        'top_n = số dòng tối đa (mặc định 10).\n' +
        'score = views×1 + searches×3 + likes×5 + favorites×8 + shares×8 + comments×10.\n' +
        'rank = vị trí sau xếp score giảm dần, lấy Top N. Cấp WGT-COM-CHUDE-TOP.'
    },
    'ALG-STORY-RELEVANCE': {
      inp: [
        fi('story_id', 'Story', 'uuid', 'L2', 'NORM-CONTENT-STORY'),
        fi('ticker', 'Mã CK', 'text', 'L2', 'NORM-CONTENT-ARTICLE'),
        fi('mention_count', 'Số bài nhắc mã', 'số', 'L2', 'NORM-CONTENT-ARTICLE'),
        fi('views', 'View cặp Story↔mã', 'số', 'EXT', 'content_relevance_events'),
        fi('likes', 'Like', 'số', 'EXT', 'content_relevance_events'),
        fi('favorites', 'Yêu thích', 'số', 'EXT', 'content_relevance_events'),
        fi('shares', 'Chia sẻ', 'số', 'EXT', 'content_relevance_events'),
        fi('comments', 'Bình luận', 'số', 'EXT', 'content_relevance_events'),
        fi('follow', 'Theo dõi', 'số', 'EXT', 'content_relevance_events')
      ],
      out: [
        f('ticker', 'Mã CK', 'text'),
        f('relevance_score', 'Điểm Relevance', 'số'),
        f('mention_count', 'Số lần nhắc', 'số'),
        f('rank', 'Xếp trong Story', 'số'),
        f('lifecycle', 'Vòng đời Story', 'enum'),
        f('flow_net_value', 'DT ròng snapshot', 'tiền')
      ],
      spec: 'relevance = mentions×relevance_w_mention×confidence + views×1 + likes×5 + favorites×8 + shares×8 + comments×10 + follow×12 (lũy kế).\n' +
        'mappings[] ghi content_story_mappings; Admin có thể duyệt/loại. Auto-promote khi topic_auto_promote + đủ Interest + ≥N mã.'
    },
    'ALG-COM-MEMBERS': {
      inp: [fi('experts[]', 'Chuyên gia', 'mảng', 'L2', 'NORM-COMMUNITY'), fi('posts[]', 'Bài viết & tương tác', 'mảng', 'L2', 'NORM-COMMUNITY')],
      out: [f('name', 'Thành viên / chuyên gia', 'text'), f('metric', 'Điểm / lượt thích', 'số'), f('rank', 'Xếp hạng', 'số')],
      spec: 'metric = điểm tích cực−tiêu cực (thành viên) hoặc Σ lượt thích (chuyên gia). Xếp giảm dần.'
    },
    'ALG-WATCHLIST': {
      inp: [fi('folders[]', 'Thư mục', 'mảng', 'L2', 'NORM-WATCHLIST'), fi('memberships{}', 'Mã → thư mục', 'object', 'L2', 'NORM-WATCHLIST'), fi('change_pct', '% thay đổi', '%', 'L2', 'NORM-STOCK-SNAP')],
      out: [f('ticker', 'Mã CK', 'text'), f('company_name', 'Tên công ty', 'text'), f('last_price', 'Giá gần nhất', 'tiền'), f('change_pct', '% thay đổi', '%')],
      spec: 'Danh sách mã user tự thêm; đính kèm giá & % thay đổi từ snapshot. Không xếp hạng hệ thống.'
    }
  };

  /* Gắn io vào từng entity (đầu vào·xử lý·đầu ra đồng nhất mọi tầng). */
  RAW_SOURCES.forEach(function (s) { s.io = IO_RAW[s.id] || { inp: [], out: [], spec: '' }; });
  NORMALIZED.forEach(function (e) { e.io = IO_NORM[e.id] || { inp: [], out: [], spec: '' }; });
  ALGORITHMS.forEach(function (a) { a.io = IO_ALG[a.id] || { inp: [], out: [], spec: '' }; });

  var LAYER_SRC_LABELS = { EXT: '⓪ Ngoài hệ thống', L1: '① Dữ liệu thô', L2: '② Chuẩn hóa', L3: '③ Giải thuật' };

  global.PlatformLayersCatalog = {
    LAYERS: LAYERS,
    RAW_SOURCES: RAW_SOURCES,
    NORMALIZED: NORMALIZED,
    ALGORITHMS: ALGORITHMS,
    ADMIN_DEFAULTS: ADMIN_DEFAULTS,
    BLOCK_RESOLVER: BLOCK_RESOLVER,
    LAYER_SRC_LABELS: LAYER_SRC_LABELS,
    buildDisplayBlocks: buildDisplayBlocks,
    getAdminConfig: getAdminConfig,
    saveAdminConfig: saveAdminConfig
  };
})(window);
