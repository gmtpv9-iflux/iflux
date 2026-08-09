# 02A — Targeted SoT Readiness Verification

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Document** | Pre-SoT Governance Verification (Q1–Q31) |
| **Status** | `COMPLETED` |
| **Date** | 2026-08-08 |
| **Type** | Evidence / Verification Gate — **NOT** Solution · **NOT** Implementation |
| **Code/DB changes** | None |

> Trả lời theo Evidence First. Targeted audit chỉ khi Mandatory Audit chưa đủ.

---

# Group A — Stock Status Authority

## Q1

```text
QUESTION: Application thực tế đang dùng stocks.status hay stocks.is_active để quyết định Stock active/inactive?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Với entity STOCK (bảng stocks):
- Writer / API lifecycle: stocks.status
  · createStock / updateStock / importStocks / setStatus chỉ SET status
  · Routes: POST .../status-active|status-halted|status-delisted → setStatus(ticker, status)
- Admin Stocks UI: filter + stats + chip dựa trên s.status (không dùng is_active)
- listStocks SELECT cả status và is_active, nhưng FE Stocks không filter theo is_active
- createStock KHÔNG ghi is_active → cột is_active giữ DEFAULT true từ schema (có thể lệch status)

Với SECTOR / ECOSYSTEM (khác entity): active map từ is_active (boolean DB) → API status string.
Không được nhầm với stocks.

EVIDENCE:
- File: backend/src/modules/market/market-wave-f.service.js (create/update/import/setStatus)
- File: backend/src/modules/market/market-wave-f.routes.js (status-active|halted|delisted)
- File: Admin_Design_system/app/market/market-stocks-page.js (getFilteredStocks: s.status; renderStats: status==='active')
- Column: stocks.status (mutated), stocks.is_active (selected, not mutated by Wave-F)

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
(authoritative runtime cho Stock = status; is_active còn dual/legacy)
```

---

## Q2

```text
QUESTION: Có trường hợp status=active & is_active=false (hoặc ngược lại)?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Có. Production (2026-08-08):
- SSI: status='active', is_active=false
- Các ticker còn lại trong mẫu: status='active' và is_active=true (16/17)

Consumer hiện tại:
- Admin Stocks UI coi SSI là active (vì dùng status)
- Không có backend list filter WHERE is_active cho stocks
- Không có evidence Public FE đọc stocks.is_active từ PG (Public không đọc PG registry)

Authoritative trong Admin Stocks runtime hiện tại: status (không phải is_active).

EVIDENCE:
- Query Prod: SELECT ticker,status,is_active FROM stocks → CONFLICT chỉ SSI
- File: market-stocks-page.js filter/stats trên status

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
(chọn 1 field lifecycle; reconcile SSI; deprecate field còn lại)
```

---

## Q3

```text
QUESTION: DNSE hoặc external provider nào ghi stocks.status / stocks.is_active?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
Không. Không có evidence DNSE/VNDirect/SSI/FiinPro ghi hai cột này.
Writers có evidence: Admin Wave-F API (status); schema default (is_active); không có DNSE→DB writer.

EVIDENCE:
- File: backend/src/modules/dnse/* (client/routes/catalog — no INSERT/UPDATE stocks)
- Mandatory Audit §C / V3

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
(external providers hiện không có write authority trên status fields)
```

---

## Q4

```text
QUESTION: Migration / API / consumer phụ thuộc riêng status hoặc is_active?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
stocks.status:
- Migration 037 thêm cột + default 'active'
- Wave-F API + Admin Stocks UI phụ thuộc status (active|halted|delisted)
- Export CSV gồm status

stocks.is_active:
- Migration 001 tạo cột
- Wave-F list SELECT trả về nhưng không mutate
- Không thấy FE Stocks filter theo is_active
- Sectors/Ecosystems dùng is_active (entity khác)

Legacy market_admin_stocks.status: bảng legacy còn 5 rows; cutover 037 map sang stocks — không phải runtime writer hiện tại.

EVIDENCE:
- Migrations: 001_init.sql, 037_stock_registry_sot.sql
- market-wave-f.service.js / routes.js
- market-stocks-page.js

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
```

---

# Group B — Capitalization Model

## Q5

```text
QUESTION: stocks.lot_threshold đại diện business concept nào (không dựa tên)?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Hiện trạng usage trỏ tới ngưỡng giá trị giao dịch (VND) dùng cho phát hiện “lô lớn / large lot”, KHÔNG phải market-cap classification.

Evidence semantic:
- Registry formula seed: is_large_lot = trade_value >= COALESCE(stock.lotThreshold, lotTiers[capTier])
- Platform layers catalog: lot_class khi (qty×price) ≥ threshold
- Admin Stocks hiển thị cột lot_threshold dạng VND (fmtVnd)
- Prod values phổ biến = 1000000000 (= payload large trong market_lot_config)

Wave-F create/import default lot_threshold=100 (khác default SQL 1e9) — inconsistency số học, không đổi semantic “trade-value threshold”.

KHÔNG có evidence stocks.lot_threshold được dùng để gán Large/Mid/Small capitalization group.

EVIDENCE:
- Table/Column: stocks.lot_threshold
- File: iflux-market-registry-store.js (formula large_lot_detect; LOT_TIER_DEFAULTS)
- File: platform-layers-catalog.js (NORM-TICK lot_class)
- File: market-stocks-page.js (display)
- File: market-wave-f.service.js (CRUD field)

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
(đặt tên/ownership: Lot Trade-Value Threshold vs Cap Group — hiện đang lẫn UI “Ngưỡng lô”)
```

---

## Q6

```text
QUESTION: market_lot_config đang dùng để làm gì?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
- Table: market_lot_config (code UNIQUE, payload jsonb, updated_at)
- Prod row code='defaults', payload:
  { large: 1000000000, mid: 500000000, small: 200000000, overrides: {} }
- API: GET/PATCH /api/admin/market-config/lot-threshold (market-wave-b)
- Admin UI: lot-threshold.html — label “Ngưỡng lô” + “Ngưỡng mặc định theo nhóm vốn hóa”
- Client Store: IfluxMarketRegistryStore.lotTiers — nguồn chính UI; PATCH API best-effort
- Runtime usage có evidence: default lotThreshold theo capTier trong sandbox registry; formula large_lot_detect
- KHÔNG có evidence market_lot_config được dùng để derive Cap Group từ Market Cap
- KHÔNG có consumer Public FE đọc API lot-threshold

EVIDENCE:
- Migration 032 / table market_lot_config
- market-wave-b.service.js get/updateLotThreshold
- market-lot-threshold-page.js
- Prod SELECT payload

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
(semantic thực tế = lot thresholds by tier; BR muốn Cap Group thresholds — hai concept)
```

---

## Q7

```text
QUESTION: cap_tier lấy/tính từ đâu?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
KHÔNG phải Market Cap + Threshold → cap_tier trong runtime hiện tại.

Thực tế:
1) PostgreSQL stocks: KHÔNG có cột cap_tier
2) Admin Stocks API list: KHÔNG SELECT/trả cap_tier
3) Admin Stocks UI: đọc s.cap_tier (luôn thiếu → hiển thị “—” / edit default 'large'); saveEdit đọc capTier nhưng KHÔNG gửi trong PATCH payload
4) IfluxMarketRegistryStore: capTier hardcode trong seed stockMeta (large|mid|small per ticker)
5) Không có function deriveCapTier(marketCap, thresholds) trong backend

EVIDENCE:
- Prod schema stocks (no cap_tier)
- market-wave-f.service.js listStocks columns
- market-stocks-page.js saveEdit payload (omits capTier)
- iflux-market-registry-store.js stockMeta.capTier

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION + REQUIRES SOLUTION
(BR derived Cap Group chưa tồn tại; hiện hardcode/phantom UI)
```

---

## Q8

```text
QUESTION: Nguồn thực tế của Market Capitalization?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Không có Market Cap SoT trong PostgreSQL.

Paths có evidence:
A) Public/Mock: mock-market.js hardcode / pseudo-random market_cap trên snapshot — dùng entity list/detail, widgets
B) shares_outstanding trên stocks: tồn tại DB, hầu hết Prod = 0; không thấy service nhân price×shares để ra market_cap
C) VNDirect stock_prices: trả price/OHLC/volume — KHÔNG map market_cap trong iflux-market-quotes.js normalizeRow
D) DNSE catalog: không map market_cap vào stocks trong pipeline (pipeline chưa ghi DB)

EVIDENCE:
- mock-market.js market_cap fields
- iflux-market-quotes.js normalizeRow (price, OHLC, volume — no market_cap)
- stocks.shares_outstanding Prod sample
- No backend market_cap column/writer

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
(ownership Market Cap = Market Data Provider — nhưng provider/runtime path chưa SoT)
```

---

## Q9

```text
QUESTION: Capitalization Group hiện lưu/tính/API/hardcode/chưa tồn tại?

STATUS: ANSWERED FROM EXISTING EVIDENCE + TARGETED AUDIT

ANSWER:
- DB authoritative Cap Group: CHƯA TỒN TẠI
- API stocks: không trả Cap Group
- Runtime derived từ Market Cap: CHƯA CÓ
- Hardcode: có trong IfluxMarketRegistryStore.seed stockMeta.capTier
- Phantom UI: Admin Stocks filter/edit cap_tier không persist

EVIDENCE: xem Q7

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES SOLUTION (sau SoT lock model)
```

---

## Q10

```text
QUESTION: Đổi threshold Large/Mid/Small có tự đổi classification Stock không?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Không.

Flow hiện tại khi Admin đổi tiers trên trang Ngưỡng lô:
1) Store.setLotTiers({large,mid,small}) → localStorage
2) best-effort PATCH market_lot_config.payload
3) Không UPDATE stocks.*
4) Không đổi stockMeta.capTier
5) Chỉ ảnh hưởng default lotThreshold theo tier trong sandbox (large lot detection defaults)

EVIDENCE:
- market-lot-threshold-page.js saveTierDefaults
- market-wave-b.service.js UPDATE market_lot_config only
- No reclassify job/function

CONFIDENCE: HIGH

SOt IMPACT: NO IMPACT for current auto-reclassify (không có); REQUIRES SOLUTION nếu SoT chọn derived Cap Group
```

---

# Group C — Divisor

## Q11

```text
QUESTION: Runtime/application dependency thực sự của divisor?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Dependency có evidence:
- DB columns: sectors.divisor, ecosystems.divisor (NOT NULL, default 1)
- Admin API: create/update validate & persist divisor (sectors-admin / ecosystems-admin)
- Admin UI: sectors form + inline edit divisor; ecosystems gửi divisor = max(tickers.length,1)
- Registry sandbox formulas TEXT: PG_sector / Ig formulas mention divisor (metadata strings trong localStorage formulas — không phải engine tính)
- Contract / Product Vision docs: synthetic index Ig = Σ(...)/divisor

KHÔNG có evidence trong backend/src hoặc User_Web runtime JS:
- job tính index dùng divisor
- report/chart service đọc divisor từ PG
- Public FE đọc divisor

EVIDENCE:
- sectors-admin.service.js / ecosystems-admin.service.js
- market-sectors-page.js / market-ecosystems-page.js
- iflux-market-registry-store.js formulas[].formulaText (strings)
- Grep User_Web: no divisor matches in *.js
- Backend market modules: divisor chỉ admin CRUD

CONFIDENCE: HIGH (runtime calc absent); MEDIUM (docs intent still exists)

SOt IMPACT: REQUIRES GOVERNANCE DECISION
(BR muốn loại nếu không dependency — dependency hiện = Admin CRUD + schema + docs, chưa có calc engine)
```

---

## Q12

```text
QUESTION: Có logic thực sự dùng divisor để tính index/metric/chart/report?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Không tìm thấy implementation path runtime thực thi công thức dùng divisor.
Chỉ có: stored field + Admin edit + formula text metadata + specification documents.

EVIDENCE:
- No backend calculator referencing sectors.divisor / ecosystems.divisor outside admin CRUD
- User_Web: no divisor usage

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK as “no active runtime calc dependency”
(vẫn cần Owner quyết giữ/bỏ vì docs/Admin còn)
```

---

## Q13

```text
QUESTION: API contract / external consumer yêu cầu divisor?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
- Admin Zod routes: divisor required (sectors create) / optional (patch); ecosystems optional
- Admin UI gửi/hiển thị divisor
- Không có evidence public API contract bắt buộc divisor cho external third-party
- mapRow admin trả divisor cho Admin consumers

EVIDENCE:
- sectors-admin.routes.js / ecosystems-admin.routes.js
- No public /api/market/sectors list in market.routes.js

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION
```

---

## Q14

```text
QUESTION: Nếu loại divisor khỏi DB, flow nào break? (không DROP)

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
Sẽ break ngay (nếu DROP không migrate code):
- INSERT/UPDATE sectors & ecosystems hiện ghi cột divisor
- Admin Sector create validation đòi divisor ≥ 1
- Admin Sector inline PATCH {divisor}
- SELECT s.* / e.* → mapRow.divisor

Không break (vì không dùng):
- Public FE entity pages
- Index calculation jobs (không tồn tại)
- DNSE/VNDirect pipelines

EVIDENCE: Q11–Q13

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES SOLUTION nếu quyết định remove (migration + Admin UI/API)
```

---

# Group D — DNSE

## Q15

```text
QUESTION: Trace DNSE data flow chính xác

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
DNSE
→ dnse.client.js (login JWT in-memory cache; datafeed metadata)
→ GET /api/admin/dnse/status
→ GET /api/admin/dnse/raw-catalog (static catalog object)
✖ dừng — không parser→queue→DB→consumer cho market master

GAP-MQTT-NOT-WIRED: MQTT consumer chưa chạy backend.

TARGETED AUDIT PERFORMED: re-confirmed module files; no new writer found.

EVIDENCE:
- backend/src/modules/dnse/dnse.client.js
- dnse.routes.js
- dnse.raw-catalog.js
- app.js mount /api/admin/dnse

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK (pipeline status = catalog/auth only)
```

---

## Q16

```text
QUESTION: DNSE ghi stocks/sectors/ecosystems?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER: Không (trực tiếp hoặc gián tiếp). Không field, không job, không overwrite rule.

EVIDENCE: Q15; Mandatory Audit §C

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
```

---

## Q17

```text
QUESTION: DNSE cung cấp Stock Master fields nào? (không giả định)

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
Từ provider contract trong repo (DNSE docs + dnse.raw-catalog — KHÔNG có live response capture trong audit này):

GET /instruments fields (catalog/docs):
symbol, marketId, securityGroupId, symbolType, listedDate, shortName, name, indexName[], pagination…

Catalog ifluxMap intended:
symbol → ref.symbol; marketId → ref.exchange; name → ref.issuer_name

Secdef thêm: isin, basic/ceiling/floor prices, securityStatus*, listingDate — chủ yếu trading ref, không phải iFlux Sector/Ecosystem.

Explicit GAP-SECTOR-FAMILY: Sector / Ecosystem / Story không từ DNSE.

KHÔNG có evidence parser runtime populate stocks từ response thật trong codebase hiện tại.

EVIDENCE:
- DNSE/Chi tiết mã chứng khoán.md
- dnse.raw-catalog.js RAW-DNSE-INSTRUMENTS / SEC-DEF / GAPS

CONFIDENCE: MEDIUM
(contract documented; live payload sample không lấy trong verification này)

SOt IMPACT: CANDIDATE FOR LOCK cho “DNSE không cung cấp Sector/Ecosystem”;
REQUIRES TARGETED AUDIT nếu SoT cần khóa field-level map từ live instruments response
```

---

## Q18

```text
QUESTION: DNSE data qua Redis/Kafka/Queue/Worker/Cache trước DB/consumer?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Không có evidence DNSE → Redis/Kafka/Queue → DB.
- dnse.client JWT cache = in-process memory object, không Redis
- queue.js = in-memory shell; không registerQueue market/DNSE nào
- Redis module tồn tại cho health/bootstrap; không market writer/reader path

EVIDENCE:
- dnse.client.js cache object
- core/queue/queue.js (shell; no market registrations)
- grep registerQueue/enqueue: chỉ định nghĩa trong queue.js

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK (no DNSE→Redis→PG path)
```

---

# Group E — Other External Sources

## Q19

```text
QUESTION: VNDirect cung cấp dữ liệu gì? Master vs Runtime?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Provider endpoint: https://api-finfo.vndirect.com.vn/v4/stock_prices
Adapter: iflux-market-quotes.js

Runtime Market Data (có map):
- price (close), ref/basicPrice, open/high/low/close, change, pctChange, volume (nmVolume), ceiling/floor, date

Master Data:
- KHÔNG map company name / sector / ecosystem / description / status từ VNDirect trong adapter này
- Chỉ dùng ticker code để join giá lên UI

Consumers: Admin Stocks (price/OHLC cells), Public entity-list / stock-page enrichRealtime

EVIDENCE:
- iflux-market-quotes.js normalizeRow / getQuotes / getOHLC
- market-stocks-page.js; entity-list-page.js; stock-page.js

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
(VNDirect = ungoverned Runtime Market Data provider hiện tại; không phải Master SoT writer)
```

---

## Q20

```text
QUESTION: SSI và FiinPro dùng ở đâu?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Chỉ thấy trong data_sources registry (PG) + Admin CRUD metadata (sources-admin.service).
Prod: ssi_market_feed (WebSocket, status connected), fiinpro_eod (REST, success) — seed migration 030.
KHÔNG có connector/client/consumer/runtime/FE gọi SSI hoặc FiinPro API.
KHÔNG ghi stocks/sectors/ecosystems.

EVIDENCE:
- migrations/030_data_sources.sql
- sources-admin.service.js
- Prod SELECT data_sources
- Grep backend runtime: no ssi/fiinpro client beyond data_sources table

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
(registry stubs only — phải nằm trong External Source Governance per BR-11A, nhưng chưa có intake)
```

---

## Q21

```text
QUESTION: External provider khác cung cấp Stock Master Data chưa phát hiện?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Không phát hiện provider khác đang ghi Stock Master vào PG.
Public Master hiện từ Mock/RegistryStore/seeds (không phải external provider).
Quotes: VNDirect (runtime).
Legacy: market_admin_stocks (table, không runtime writer).

EVIDENCE: writers matrix Mandatory Audit; grep import/external stock writers

CONFIDENCE: HIGH (codebase); không claim exhaust mọi binary/third-party ngoài repo

SOt IMPACT: CANDIDATE FOR LOCK for “no other master writers in repo”
```

---

# Group F — Field-Level Authority (evidence table)

| Provider | Field | Current Source | Current Destination | Writer | Consumer | Runtime/Master |
|----------|-------|----------------|---------------------|--------|----------|----------------|
| DNSE | ticker/symbol | Catalog/docs only | nowhere in DB | none | Admin raw-catalog UI/API | Master (intended, not wired) |
| DNSE | company_name / name | Catalog/docs | nowhere | none | catalog | Master intended |
| DNSE | exchange / marketId | Catalog/docs | nowhere | none | catalog | Master intended |
| DNSE | sector | GAP — not provided | — | none | — | N/A |
| DNSE | ecosystem | GAP — not provided | — | none | — | N/A |
| DNSE | market_cap | no wired map | — | none | — | AUDIT REQUIRED if need live field confirm |
| DNSE | description | not in instruments catalog map | — | none | — | N/A |
| DNSE | status | secdef has securityStatus* (docs) — **not written** to stocks.status | nowhere | none | catalog | Runtime ref intended |
| VNDirect | price | api-finfo stock_prices | browser memory cache | none→PG | Admin Stocks, Public FE | **Runtime** |
| VNDirect | OHLC | same API | browser memory cache | none→PG | Admin Stocks, Public FE | **Runtime** |
| VNDirect | volume | nmVolume | browser cache | none→PG | FE/Admin quotes | **Runtime** |
| VNDirect | company metadata | not mapped | — | none | — | N/A in adapter |
| Admin | stock master fields | Admin form | stocks.* | Wave-F API | Admin list | **Master** |
| Mock/Registry | name/sector/eco/cap | hardcoded/seed | local FE state | browser | Public pages | **Pseudo-master (ungoverned)** |
| SSI/FiinPro | (any) | data_sources row only | metadata table | Admin sources CRUD | Admin Data Sources UI | Registry stub |

---

# Group G — Public Frontend Source Mapping

## Q22

```text
QUESTION: Master Data mỗi page lấy từ đâu?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
Page → JS → Data source (Master):
- /co-phieu → entity-list-page.js → IfluxMockMarket.getSnapshot() (+ optional RegistryStore/taxonomy)
- /co-phieu/{ticker} → stock-page.js → Mock getStockDetail / entity definition
- /nganh → entity-list → Mock + watchlist-taxonomy (SECTOR_FALLBACK / Registry)
- /nganh/{slug|id} → group-page.js → Mock getGroupDetail('sector')
- /he-sinh-thai → entity-list → Mock + ecosystem seeds / Registry
- /he-sinh-thai/{slug|id} → group-page → Mock getGroupDetail('family')

Không qua Internal API → PG Market SoT.

EVIDENCE: entity-list-page.js, stock-page.js, group-page.js, mock-market.js, watchlist-taxonomy.js

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK (current ≠ target SoT read path)
```

---

## Q23

```text
QUESTION: Page nào vẫn hardcode/mock/seed/Registry/external thay vì SoT?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER: Tất cả 6 page Market public ở trên — Master từ Mock/seed/Registry; Runtime giá có thể từ VNDirect.

EVIDENCE: Q22; Mandatory Audit §F

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK as gap list
```

---

## Q24

```text
QUESTION: Phân biệt Master vs Price/OHLC trên từng page

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER (pattern chung):
- Stock name / sector / ecosystem / membership / market_cap_label (detail) → Mock / taxonomy / seeds (Master pseudo)
- Price / change / OHLC spark → IfluxMarketQuotes → VNDirect (Runtime), khi adapter load
- Admin Stocks tương tự: master PG + quotes VNDirect

EVIDENCE:
- entity-list-page.js enrich via getQuotes
- stock-page.js enrichRealtime
- mock-market.js master fields

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK (boundary Master vs Runtime đã quan sát được)
```

---

# Group H — Admin Write Authority

## Q25

```text
QUESTION: 3 Admin pages ghi cuối cùng vào đâu?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
- Stocks → PostgreSQL stocks (Wave-F API)
- Sectors → PostgreSQL sectors
- Ecosystems → PostgreSQL ecosystems (+ stocks.ecosystem_id khi sync tickers)

EVIDENCE: market-*-page.js → admin APIs → services

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
```

---

## Q26

```text
QUESTION: Stocks→Sector và Sectors→Add Stock có converge stocks.sector_id?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
- Stocks → chọn Sector → PATCH stocks.sector_id: CÓ (nếu select non-empty)
- Sectors → thêm Stock: KHÔNG tồn tại trong Admin UI/API hiện tại (market-sectors-page không quản lý ticker list; không syncTickers cho sector)

Chỉ một chiều write membership Sector từ Stock edit (và create/import API).

EVIDENCE:
- market-stocks-page.js saveEdit sector_id
- market-sectors-page.js: no tickers/sector_id writes
- sectors-admin.service.js: no membership sync

CONFIDENCE: HIGH

SOt IMPACT: REQUIRES GOVERNANCE DECISION / SOLUTION
(BR Workflow B từ Sector chưa có; ownership FK đã rõ)
```

---

## Q27

```text
QUESTION: Stocks↔Ecosystem converge stocks.ecosystem_id?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
Có — cả hai entry point ghi cùng cột:
- Stocks edit → PATCH ecosystem_id
- Ecosystems create/update tickers → syncTickers() UPDATE stocks.ecosystem_id (clear-then-set)

EVIDENCE: market-wave-f.service.js; ecosystems-admin.service.js syncTickers

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK (single authoritative FK)
```

---

## Q28

```text
QUESTION: Bảng khác lưu authoritative membership?

STATUS: ANSWERED FROM EXISTING EVIDENCE

ANSWER:
Không có sector.stock_codes / ecosystem.stock_codes / junction tables trên Prod.
Tickers trên Ecosystem API = derived array_agg từ stocks.
RegistryStore localStorage có membership sandbox — không authoritative PG.

EVIDENCE: Prod schema; ecosystems SELECT_BASE array_agg

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
```

---

# Group I — Redis / Runtime Boundary

## Q29

```text
QUESTION: Redis dùng cho dữ liệu Market Domain nào?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER:
Không có evidence Redis lưu Market Master Data hoặc Market Runtime quotes.
Redis: infrastructure (init/health ping); Queue framework optionally requires Redis nhưng hiện in-memory shell, không market jobs.
DNSE token cache = process memory, không Redis.
VNDirect quotes cache = browser memory trong iflux-market-quotes.js.

Classification:
- Master Data in Redis: NO evidence
- Runtime Market in Redis: NO evidence
- Cache/Session/Other market-specific: NO evidence

EVIDENCE:
- core/cache/redis.js; health.controller.js
- queue.js shell
- dnse.client.js in-memory cache
- iflux-market-quotes.js quoteCache/ohlcCache

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK (Redis ≠ Market SoT layer hiện tại)
```

---

## Q30

```text
QUESTION: External → Redis → PostgreSQL Market Master?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER: Không có evidence.

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
```

---

## Q31

```text
QUESTION: PostgreSQL Market Master → Redis → Public Frontend?

STATUS: ANSWERED AFTER TARGETED AUDIT

ANSWER: Không có evidence. Public FE không đọc PG master; không qua Redis.

CONFIDENCE: HIGH

SOt IMPACT: CANDIDATE FOR LOCK
```

---

# 13. Final Decision Matrix

| Area | Evidence Available? | Audit Needed? | Can LOCK SoT? |
|------|--------------------:|--------------:|--------------:|
| Stock entity | Yes | No | **CANDIDATE** (PG `stocks` = Admin master store) |
| Sector entity | Yes | No | **CANDIDATE** |
| Ecosystem entity | Yes | No | **CANDIDATE** |
| Stock → Sector | Yes | No | **CANDIDATE** (`stocks.sector_id`; Sector→AddStock UI missing) |
| Stock → Ecosystem | Yes | No | **CANDIDATE** (`stocks.ecosystem_id`) |
| Status | Yes | No | **NO — Owner decision** (`status` vs `is_active`) |
| Capitalization | Yes (semantics) | Optional live mcap provider confirm | **NO — Owner decision** (lot threshold ≠ cap group; derived model absent) |
| Divisor | Yes | No | **NO — Owner decision** (no calc runtime; Admin/schema still depend) |
| DNSE pipeline | Yes | Optional live instruments sample | **CANDIDATE** (auth/catalog only; no DB write) |
| DNSE field authority | Partial | Yes if lock live field map | **Partial** — gaps known; live payload sample optional |
| VNDirect | Yes | No | **CANDIDATE** (runtime quotes/OHLC only) |
| SSI | Yes | No | **CANDIDATE** (registry stub only) |
| FiinPro | Yes | No | **CANDIDATE** (registry stub only) |
| Frontend Master Data | Yes | No | **CANDIDATE** (Mock/Registry — gap vs target) |
| Admin Write Authority | Yes | No | **CANDIDATE** |
| Redis boundary | Yes | No | **CANDIDATE** (not Market SoT) |

---

# 14. Final Lists

## A — READY TO LOCK (evidence đủ để ghi vào SoT Governance)

1. Market Master tables hiện tại: `stocks`, `sectors`, `ecosystems` (PG).
2. Relationship authoritative: `stocks.sector_id`, `stocks.ecosystem_id` (không dual stock_list tables).
3. Ecosystem ticker list API = derived từ `stocks`.
4. DNSE hiện **không** ghi PG master; pipeline dừng ở auth + raw-catalog (+ MQTT chưa wire).
5. VNDirect = Runtime price/OHLC provider (browser); không ghi master PG.
6. SSI / FiinPro = `data_sources` stubs only; no intake.
7. Public Frontend Master ≠ PG SoT (Mock/Registry/seeds).
8. Admin Stocks/Sectors/Ecosystems writers → PG như map Audit.
9. Redis **không** nằm trên path Market Master hiện tại.
10. `cap_tier` DB/API derived: **không tồn tại**; UI phantom / Registry hardcode.
11. `stocks.lot_threshold` + `market_lot_config` semantic hiện tại = **lot trade-value thresholds**, không phải Cap Group derivation.
12. Conflict `status`/`is_active` tồn tại (SSI); Admin Stocks runtime dùng `status`.

## B — REQUIRES TARGETED AUDIT (còn hẹp)

| Question | Why insufficient | Exact audit scope |
|----------|------------------|-------------------|
| Q17 live field map | Chỉ có docs/catalog, chưa capture live `GET /instruments` response | Gọi DNSE instruments (hoặc lưu sample response) → map field-by-field; **không** cần full-system audit |
| Market Cap provider truth (optional for SoT wording) | Không có SoT path; nếu Owner muốn khóa “Market Cap authoritative source” cần chọn provider + sample | Sample VNDirect/DNSE payloads for mcap/shares if any; else lock as “unset / mock only” |

Các câu Q1–Q16, Q18–Q31: **không** cần audit lại toàn hệ thống.

## C — REQUIRES GOVERNANCE / SOLUTION DECISION

1. **Stock lifecycle:** LOCK `status` vs deprecate/reconcile `is_active` (SSI conflict).
2. **Capitalization:** Tách SoT giữa (a) Cap Group derived từ Market Cap + thresholds vs (b) Lot trade-value thresholds (`lot_threshold` / `market_lot_config`) — hiện UI “Ngưỡng lô” đang trộn label.
3. **Market Cap ownership + source** khi chưa có PG field / provider path thật.
4. **Divisor:** giữ cho future index engine vs remove (Admin+schema còn; runtime calc không có).
5. **Sector Workflow B** (Sector → Add Stocks): BR yêu cầu; hiện chưa có UI/API — SoT có thể LOCK FK trước, capability UI sau.
6. **External Source Governance** phải cover DNSE + VNDirect + SSI + FiinPro (BR-11A) — trust/field authority matrix Owner lock trong `03`.
7. **Public read path:** LOCK target Internal API→PG; current Mock path = migration gap (không phải dual SoT được chấp nhận).

---

# 15. Completion

- [x] Q1–Q31 answered or marked AUDIT REQUIRED (narrow)
- [x] No assumption-only answers
- [x] Decision Matrix + Lists A/B/C
- [x] No code/DB/config changes
- [x] No Solution / Implementation

**STOP.** Không chuyển Solution / không sửa code.

---

## Addendum — Owner Decisions (2026-08-08)

Các mục từng ghi `REQUIRES GOVERNANCE DECISION` đã được Owner khóa tại:

[`02B-Owner-Decisions.md`](02B-Owner-Decisions.md)

| Topic | Owner lock |
|-------|------------|
| status vs is_active | `status` canonical; reconcile/deprecate `is_active` |
| Cap Group vs Ngưỡng lô | Tách hoàn toàn |
| Cap Group model | Intake từ Trusted source + Admin L/M/S; **không** engine |
| Market Cap / provider authority | Field-level governance; iFlux Master = SoT |
| divisor | Bỏ |
| Sector → Add Stocks | BR gap (không phải Owner Q mới) |
| Public read path | Internal API → PG (đã có trong BRD) |

BRD đã được clarify tương ứng trong `01-Business-Requirements.md`.
