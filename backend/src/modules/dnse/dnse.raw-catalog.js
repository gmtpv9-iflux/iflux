'use strict';

/** SoT catalog — dữ liệu thô DNSE (REST + WebSocket market data) */
const DNSE_RAW_SOURCES = [
  {
    id: 'RAW-DNSE-INSTRUMENTS',
    provider: 'DNSE',
    channel: 'Danh mục mã chứng khoán',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /instruments',
    poll: 'on-demand',
    fields: ['symbol', 'marketId', 'securityGroupId', 'symbolType', 'listedDate', 'shortName', 'name', 'indexName[]', 'total', 'page', 'pageSize'],
    ifluxMap: { symbol: 'ref.symbol', marketId: 'ref.exchange', name: 'ref.issuer_name' },
    coreRelevant: false,
    note: 'Master symbol — bổ sung Admin Stock Symbols'
  },
  {
    id: 'RAW-DNSE-SEC-DEF',
    provider: 'DNSE',
    channel: 'Thông tin giao dịch (trần/sàn/tham chiếu)',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/{symbol}/secdef',
    poll: 'on-demand / đầu phiên',
    fields: ['symbol', 'marketId', 'boardId', 'isin', 'productGrpId', 'securityGroupId', 'basicPrice', 'ceilingPrice', 'floorPrice', 'securityStatus', 'symbolAdminStatusCode', 'symbolTradingMethodStatusCode', 'symbolTradingSanctionStatusCode', 'listingDate', 'time'],
    ifluxMap: { basicPrice: 'ref.price', ceilingPrice: 'ref.ceiling', floorPrice: 'ref.floor' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-TRADE-LATEST',
    provider: 'DNSE',
    channel: 'Khớp gần nhất (tick snapshot)',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/{symbol}/trades/latest',
    poll: 'poll',
    fields: ['symbol', 'matchPrice', 'matchQtty', 'side', 'avgPrice', 'totalVolumeTraded', 'grossTradeAmount', 'highestPrice', 'lowestPrice', 'openPrice', 'marketId', 'boardId', 'isin', 'time'],
    ifluxMap: {
      matchPrice: 'tick.price',
      matchQtty: 'tick.qty',
      side: 'tick.side',
      time: 'tick.matched_at',
      totalVolumeTraded: 'tick.klgd_ts',
      grossTradeAmount: 'tick.gtgd_ts'
    },
    coreRelevant: true
  },
  {
    id: 'RAW-DNSE-TRADE-HIST',
    provider: 'DNSE',
    channel: 'Lịch sử khớp lệnh',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/{symbol}/trades',
    poll: 'backfill',
    fields: ['symbol', 'matchPrice', 'matchQtty', 'side', 'avgPrice', 'totalVolumeTraded', 'grossTradeAmount', 'highestPrice', 'lowestPrice', 'openPrice', 'marketId', 'boardId', 'isin', 'time', 'nextPageToken'],
    ifluxMap: { matchPrice: 'tick.price', matchQtty: 'tick.qty', side: 'tick.side', time: 'tick.matched_at' },
    coreRelevant: true
  },
  {
    id: 'RAW-DNSE-QUOTE-HIST',
    provider: 'DNSE',
    channel: 'Lịch sử bid/ask',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/{symbol}/quotes',
    poll: 'backfill',
    fields: ['symbol', 'bid[].price', 'bid[].quantity', 'offer[].price', 'offer[].quantity', 'totalBidQtty', 'totalOfferQtty', 'marketId', 'boardId', 'isin', 'time'],
    ifluxMap: { 'bid[].price': 'quote.bid', 'offer[].price': 'quote.ask' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-CLOSE',
    provider: 'DNSE',
    channel: 'Giá đóng cửa',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/{symbol}/close',
    poll: 'end-of-day',
    fields: ['symbol', 'closePrice', 'marketId', 'boardId', 'isin', 'time'],
    ifluxMap: { closePrice: 'ref.close' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-OHLC',
    provider: 'DNSE',
    channel: 'Lịch sử OHLC',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/ohlc',
    poll: 'backfill',
    fields: ['t[]', 'o[]', 'h[]', 'l[]', 'c[]', 'v[]', 'nextTime'],
    ifluxMap: { 'c[]': 'ohlc.close', 'v[]': 'ohlc.volume' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-FOREIGN',
    provider: 'DNSE',
    channel: 'NĐT nước ngoài',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /price/{symbol}/foreign-trading',
    poll: 'poll',
    fields: ['symbol', 'buyVolume', 'sellVolume', 'buyTradedAmount', 'sellTradedAmount', 'totalBuyVolume', 'totalSellVolume', 'totalBuyTradedAmount', 'totalSellTradedAmount', 'foreignerOrderLimitQuantity', 'foreignerBuyPossibleQuantity', 'tradingSessionId', 'time'],
    ifluxMap: { totalBuyTradedAmount: 'foreign.buy_value', totalSellTradedAmount: 'foreign.sell_value' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-SESSION',
    provider: 'DNSE',
    channel: 'Phiên giao dịch',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /market/trading-session',
    poll: 'poll',
    fields: ['marketId', 'boardId', 'tscProdGrpId', 'tradingSessionId', 'eventId', 'time'],
    ifluxMap: { tradingSessionId: 'session.id', eventId: 'session.event' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-WORKING-DATES',
    provider: 'DNSE',
    channel: 'Ngày làm việc',
    protocol: 'REST',
    transport: 'HTTPS',
    endpoint: 'GET /market/working-dates',
    poll: 'daily',
    fields: ['workingDates[]'],
    ifluxMap: { 'workingDates[]': 'calendar.working_dates' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-MQTT-TICK',
    provider: 'DNSE',
    channel: 'Tick realtime (khớp lệnh + phía chủ động)',
    protocol: 'MQTT',
    transport: 'MQTT/WSS',
    endpoint: 'plaintext/quotes/krx/mdds/tick/v1/roundlot/symbol/{symbol}',
    poll: 'stream',
    verified: true,
    fields: ['symbol', 'matchPrice', 'matchQtty', 'side', 'totalVolumeTraded', 'grossTradeAmount', 'tradingSessionId', 'marketId', 'boardId', 'isin', 'sendingTime'],
    ifluxMap: {
      matchPrice: 'tick.price',
      matchQtty: 'tick.qty',
      side: 'tick.side',
      sendingTime: 'tick.matched_at',
      totalVolumeTraded: 'tick.klgd_ts',
      grossTradeAmount: 'tick.gtgd_ts'
    },
    coreRelevant: true,
    note: 'NGUỒN CHÍNH Tầng I Core — side=SIDE_BUY/SIDE_SELL (mua/bán chủ động). Đã verify live.'
  },
  {
    id: 'RAW-DNSE-MQTT-TOPPRICE',
    provider: 'DNSE',
    channel: 'Sổ lệnh bid/ask realtime',
    protocol: 'MQTT',
    transport: 'MQTT/WSS',
    endpoint: 'plaintext/quotes/krx/mdds/topprice/v1/roundlot/symbol/{symbol}',
    poll: 'stream',
    verified: true,
    fields: ['symbol', 'bid[].price', 'bid[].qtty', 'offer[].price', 'offer[].qtty', 'marketId', 'boardId', 'isin', 'sendingTime'],
    ifluxMap: { 'bid[].price': 'quote.bid', 'offer[].price': 'quote.ask' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-MQTT-STOCKINFO',
    provider: 'DNSE',
    channel: 'Thông tin mã realtime (trần/sàn/tham chiếu)',
    protocol: 'MQTT',
    transport: 'MQTT/WSS',
    endpoint: 'plaintext/quotes/krx/mdds/stockinfo/v1/roundlot/symbol/{symbol}',
    poll: 'stream',
    verified: true,
    fields: ['symbol', 'referencePrice', 'highLimitPrice', 'lowLimitPrice', 'securityGroupId', 'productId', 'tradingTime', 'marketId', 'boardId', 'isin'],
    ifluxMap: { referencePrice: 'ref.price', highLimitPrice: 'ref.ceiling', lowLimitPrice: 'ref.floor' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-MQTT-OHLC',
    provider: 'DNSE',
    channel: 'OHLC realtime (nhiều khung)',
    protocol: 'MQTT',
    transport: 'MQTT/WSS',
    endpoint: 'plaintext/quotes/krx/mdds/v2/ohlc/stock/{resolution}/{symbol}',
    poll: 'stream',
    verified: true,
    fields: ['symbol', 'open', 'high', 'low', 'close', 'volume', 'time', 'resolution', 'type', 'lastUpdated'],
    ifluxMap: { close: 'ohlc.close', volume: 'ohlc.volume' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-MQTT-MARKET-INDEX',
    provider: 'DNSE',
    channel: 'Chỉ số thị trường realtime',
    protocol: 'MQTT',
    transport: 'MQTT/WSS',
    endpoint: 'plaintext/quotes/krx/mdds/index/v1/{indexName}',
    poll: 'stream',
    fields: ['indexName', 'indexValue', 'change', 'changePercent', 'totalVolumeTraded', 'totalTradedValue', 'sendingTime'],
    ifluxMap: { indexValue: 'index.value', totalTradedValue: 'index.gtgd' },
    coreRelevant: false
  },
  {
    id: 'RAW-DNSE-MQTT-BOARDEVENT',
    provider: 'DNSE',
    channel: 'Sự kiện phiên / trạng thái bảng',
    protocol: 'MQTT',
    transport: 'MQTT/WSS',
    endpoint: 'plaintext/quotes/krx/mdds/boardevent/v1/...',
    poll: 'stream',
    fields: ['marketId', 'boardId', 'tradingSessionId', 'eventId', 'sendingTime'],
    ifluxMap: { tradingSessionId: 'session.id', eventId: 'session.event' },
    coreRelevant: false
  }
];

const CORE_REQUIREMENTS = [
  {
    id: 'CORE-TICK-PRICE',
    label: 'Giá từng tick',
    sources: ['RAW-DNSE-MQTT-TICK', 'RAW-DNSE-TRADE-LATEST'],
    status: 'covered'
  },
  {
    id: 'CORE-TICK-QTY',
    label: 'Khối lượng giao dịch từng tick',
    sources: ['RAW-DNSE-MQTT-TICK', 'RAW-DNSE-TRADE-LATEST'],
    status: 'covered'
  },
  {
    id: 'CORE-TICK-SIDE',
    label: 'Lệnh mua / bán chủ động',
    sources: ['RAW-DNSE-MQTT-TICK'],
    status: 'covered',
    note: 'side = SIDE_BUY / SIDE_SELL (đã verify live)'
  },
  {
    id: 'CORE-TICK-VALUE',
    label: 'Giá trị giao dịch từng tick (price × qty)',
    sources: ['RAW-DNSE-MQTT-TICK'],
    status: 'covered',
    note: 'Tính từ matchPrice × matchQtty'
  },
  {
    id: 'CORE-KLGD-TS',
    label: 'KLGD hiện tại (ts) — đối chiếu',
    sources: ['RAW-DNSE-MQTT-TICK', 'RAW-DNSE-TRADE-LATEST'],
    status: 'covered',
    field: 'totalVolumeTraded'
  },
  {
    id: 'CORE-GTGD-TS',
    label: 'GTGD hiện tại (ts) — đối chiếu',
    sources: ['RAW-DNSE-MQTT-TICK', 'RAW-DNSE-TRADE-LATEST'],
    status: 'covered',
    field: 'grossTradeAmount'
  },
  {
    id: 'CORE-REALTIME-STREAM',
    label: 'Tick realtime liên tục (RAM lũy kế)',
    sources: ['RAW-DNSE-MQTT-TICK'],
    status: 'covered',
    note: 'MQTT KRX datafeed — đã verify nhận tick liên tục'
  }
];

const GAPS = [
  {
    id: 'GAP-SECTOR-FAMILY',
    label: 'Ngành / Hệ sinh thái / Story',
    severity: 'external',
    note: 'Không có từ DNSE — Admin metadata (Stock Symbols, sector, HST tag)'
  },
  {
    id: 'GAP-PREV-SESSION',
    label: 'KLGD/GTGD phiên trước (n-1)',
    severity: 'derived',
    note: 'DNSE cung cấp close + totalVolumeTraded cuối phiên; iFlux cần lưu snapshot 15:00'
  },
  {
    id: 'GAP-MQTT-NOT-WIRED',
    label: 'MQTT consumer chưa chạy backend',
    severity: 'todo',
    note: 'Login + datafeed đã verify — bước tiếp: consumer MQTT tick → RAM lũy kế'
  }
];

function getRawCatalog() {
  return {
    provider: 'DNSE',
    baseUrl: 'https://openapi.dnse.com.vn',
    authUrl: 'https://api.dnse.com.vn/auth-service/login',
    datafeed: 'wss://datafeed-lts-krx.dnse.com.vn/wss',
    sources: DNSE_RAW_SOURCES,
    coreRequirements: CORE_REQUIREMENTS,
    gaps: GAPS,
    summary: {
      totalSources: DNSE_RAW_SOURCES.length,
      restCount: DNSE_RAW_SOURCES.filter((s) => s.protocol === 'REST').length,
      mqttCount: DNSE_RAW_SOURCES.filter((s) => s.protocol === 'MQTT').length,
      coreRelevantCount: DNSE_RAW_SOURCES.filter((s) => s.coreRelevant).length
    }
  };
}

module.exports = { getRawCatalog, DNSE_RAW_SOURCES, CORE_REQUIREMENTS, GAPS };
